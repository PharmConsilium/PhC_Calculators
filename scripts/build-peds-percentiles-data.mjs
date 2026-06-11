#!/usr/bin/env node
/**
 * Converts WHO LMS sources → compact JSON for peds-percentiles calculator.
 * 0–60 мес.: целые месяцы из WHO Child Growth Standards (who2006-hfa.csv),
 * как в Anthro mobile (reference_data.json).
 * 0–1826 дн.: day_*.json (WHO igrowup, как Anthro mobile). 61–228 мес. ИМТ: bmiagerev.csv.
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

async function loadLmsTable(filename, xKey = 'Agemos', maxX = Infinity) {
  const rows = parseCsv(await readFile(filename, 'utf8'));
  const bySex = { male: [], female: [] };
  for (const row of rows) {
    const x = Number(row[xKey]);
    if (!Number.isFinite(x) || x > maxX) continue;
    const sex = row.Sex === '1' ? 'male' : 'female';
    bySex[sex].push({
      x,
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

/** Строка по целым месяцам (Years×12 ≈ Month), не по неделям 0–13. */
function isWhoMonthlyRow(month, years) {
  return Math.abs(years * 12 - month) < 0.05;
}

/** WHO 2006: LMS по целым месяцам 0–60. */
async function loadWho2006MonthlyLms(boyCols, girlCols, maxMonth = 60) {
  const text = await readFile(join(dataDir, 'who2006-hfa.csv'), 'utf8');
  const lines = text.trim().split(/\r?\n/).slice(4);
  const byMonth = new Map();
  for (const line of lines) {
    const cols = line.split(',');
    const month = Number(cols[0]);
    const years = Number(cols[1]);
    if (!Number.isInteger(month) || month < 0 || month > maxMonth) continue;
    if (!isWhoMonthlyRow(month, years)) continue;
    // При дубликате месяца берём последнюю строку (как в Anthro reference_data).
    byMonth.set(month, who2006Row(boyCols, girlCols, cols, month));
  }
  const out = { male: [], female: [] };
  for (const month of [...byMonth.keys()].sort((a, b) => a - b)) {
    const row = byMonth.get(month);
    out.male.push(row.male);
    out.female.push(row.female);
  }
  return out;
}

function loadAnthroDayTable(raw, sexKey) {
  const tbl = raw[sexKey];
  return tbl.i.map((x, i) => {
    const row = {
      x,
      L: tbl.l[i],
      M: tbl.m[i],
      S: tbl.s[i],
    };
    if (tbl.loh?.[i] === 'L' || tbl.loh?.[i] === 'H') row.loh = tbl.loh[i];
    return row;
  });
}

async function loadAnthroDayTables(baseName) {
  const raw = JSON.parse(await readFile(join(dataDir, `${baseName}.json`), 'utf8'));
  return {
    male: loadAnthroDayTable(raw, 'M'),
    female: loadAnthroDayTable(raw, 'F'),
  };
}

async function main() {
  const weightAge = await loadWho2006MonthlyLms([8, 9, 10], [11, 12, 13]);
  const heightAge = await loadWho2006MonthlyLms([2, 3, 4], [5, 6, 7]);
  const headAge = await loadWho2006MonthlyLms([20, 21, 22], [23, 24, 25]);
  const bmiAge06 = await loadWho2006MonthlyLms([14, 15, 16], [17, 18, 19]);
  const bmiChild = await loadLmsTable(join(dataDir, 'bmiagerev.csv'));
  const wtLenRaw = JSON.parse(await readFile(join(dataDir, 'month-wfl.json'), 'utf8'));
  const weightForLength = { male: [], female: [] };
  for (const sex of ['male', 'female']) {
    const key = sex === 'male' ? 'M' : 'F';
    const tbl = wtLenRaw[key];
    weightForLength[sex] = tbl.i.map((x, i) => ({
      x,
      L: tbl.l[i],
      M: tbl.m[i],
      S: tbl.s[i],
    }));
  }

  const dayWeightAge = await loadAnthroDayTables('day_wfa');
  const dayHeightAge = await loadAnthroDayTables('day_lhfa');
  const dayBmiAge = await loadAnthroDayTables('day_bmi');
  const dayWeightForLength = await loadAnthroDayTables('day_wfl');
  const dayWeightForHeight = await loadAnthroDayTables('day_wfh');

  const bmiAge = { male: [], female: [] };
  for (const sex of ['male', 'female']) {
    const seen = new Set();
    for (const row of bmiAge06[sex]) {
      bmiAge[sex].push(row);
      seen.add(row.x);
    }
    for (const row of bmiChild[sex]) {
      if (row.x >= 61 && !seen.has(row.x)) {
        bmiAge[sex].push(row);
        seen.add(row.x);
      }
    }
    bmiAge[sex].sort((a, b) => a.x - b.x);
  }

  const output = {
    source:
      'WHO igrowup day tables 0–1826 d (Anthro mobile); monthly head 0–60 mo; BMI 61–228 mo (bmiagerev)',
    weightAge,
    heightAge,
    headAge,
    bmiAge,
    weightForLength,
    dayWeightAge,
    dayHeightAge,
    dayBmiAge,
    dayWeightForLength,
    dayWeightForHeight,
  };

  await writeFile(join(dataDir, 'who-lms.json'), JSON.stringify(output), 'utf8');
  console.log('Built calculators/peds-percentiles/data/who-lms.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
