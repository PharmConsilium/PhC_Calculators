#!/usr/bin/env node
/**
 * Converts CDC/WHO LMS CSV files → compact JSON for peds-percentiles calculator.
 * Source: WHO Child Growth Standards (via CDC z-score data files).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'calculators', 'peds-percentiles', 'data');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const row = {};
    header.forEach((key, i) => {
      row[key] = cols[i];
    });
    return row;
  });
}

async function loadLmsTable(filename, xKey = 'Agemos') {
  const rows = parseCsv(await readFile(filename, 'utf8'));
  const bySex = { male: [], female: [] };
  for (const row of rows) {
    const sex = row.Sex === '1' ? 'male' : 'female';
    bySex[sex].push({
      x: Number(row[xKey]),
      L: Number(row.L),
      M: Number(row.M),
      S: Number(row.S),
    });
  }
  for (const sex of ['male', 'female']) {
    bySex[sex].sort((a, b) => a.x - b.x);
  }
  return bySex;
}

function who2006Row(boyCols, girlCols, cols, month) {
  return {
    male: {
      x: month,
      L: Number(cols[boyCols[0]]),
      M: Number(cols[boyCols[1]]),
      S: Number(cols[boyCols[2]]),
    },
    female: {
      x: month,
      L: Number(cols[girlCols[0]]),
      M: Number(cols[girlCols[1]]),
      S: Number(cols[girlCols[2]]),
    },
  };
}

/** Строка по месяцам (Years×12 ≈ Week/Month), не по неделям 0–13. */
function isWhoMonthlyRow(month, years) {
  return Math.abs(years * 12 - month) < 0.05;
}

/** WHO Child Growth Standards из who2006-hfa.csv, 0–60 мес. (официальные LMS). */
async function loadWho2006Lms(boyCols, girlCols, { monthlyOnly = false } = {}) {
  const text = await readFile(join(dataDir, 'who2006-hfa.csv'), 'utf8');
  const lines = text.trim().split(/\r?\n/).slice(4);
  const byMonth = new Map();
  for (const line of lines) {
    const cols = line.split(',');
    const month = Number(cols[0]);
    const years = Number(cols[1]);
    if (!Number.isInteger(month) || month < 0 || month > 60) continue;
    if (monthlyOnly && !isWhoMonthlyRow(month, years)) continue;
    if (!byMonth.has(month)) {
      byMonth.set(month, who2006Row(boyCols, girlCols, cols, month));
    }
  }
  const out = { male: [], female: [] };
  for (const month of [...byMonth.keys()].sort((a, b) => a - b)) {
    const row = byMonth.get(month);
    out.male.push(row.male);
    out.female.push(row.female);
  }
  return out;
}

async function main() {
  const wtInf = await loadLmsTable(join(dataDir, 'wtageinf.csv'));
  const lenInf = await loadLmsTable(join(dataDir, 'lenageinf.csv'));
  const hcInf = await loadLmsTable(join(dataDir, 'hcageinf.csv'));
  const heightChild = await loadWho2006Lms([2, 3, 4], [5, 6, 7]);
  const headChild = await loadWho2006Lms([20, 21, 22], [23, 24, 25]);
  const weightChild = await loadWho2006Lms([8, 9, 10], [11, 12, 13], { monthlyOnly: true });
  const bmiChild = await loadLmsTable(join(dataDir, 'bmiagerev.csv'));
  const wtLen = await loadLmsTable(join(dataDir, 'wtleninf.csv'), 'Length');

  // Synthesize BMI-for-age 0–24 mo from weight & length medians (WHO infant BMI proxy).
  const bmiInf = { male: [], female: [] };
  for (const sex of ['male', 'female']) {
    const lenMap = new Map(lenInf[sex].map((r) => [r.x, r]));
    for (const w of wtInf[sex]) {
      const h = lenMap.get(w.x);
      if (!h) continue;
      const hm = h.M / 100;
      bmiInf[sex].push({
        x: w.x,
        L: -2.0,
        M: w.M / (hm * hm),
        S: 0.09,
      });
    }
  }

  const mergeByAge = (a, b) => {
    const out = { male: [...a.male], female: [...a.female] };
    for (const sex of ['male', 'female']) {
      const seen = new Set(out[sex].map((r) => r.x));
      for (const row of b[sex]) {
        if (!seen.has(row.x)) out[sex].push(row);
      }
      out[sex].sort((x, y) => x.x - y.x);
    }
    return out;
  };

  const output = {
    source:
      'WHO Child Growth Standards (height/head/weight: official 0–60 mo; other: CDC z-score tables)',
    weightInf: wtInf,
    lengthInf: lenInf,
    headInf: hcInf,
    headChild,
    weightChild,
    heightChild,
    bmiChild: mergeByAge(bmiInf, bmiChild),
    weightForLength: wtLen,
  };

  await writeFile(
    join(dataDir, 'who-lms.json'),
    JSON.stringify(output),
    'utf8'
  );
  console.log('Built calculators/peds-percentiles/data/who-lms.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
