import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('template and shared styles exist', async () => {
  const html = await readFile(join(root, 'templates', 'calculator-template.html'), 'utf8');
  const css = await readFile(join(root, 'shared', 'fc-calc.css'), 'utf8');
  assert.match(html, /class="fc-calc"/);
  assert.match(html, /STYLES/);
  assert.match(css, /#305ef9/i);
  assert.match(html, /fc-calc__head/);
  assert.match(html, /fc-calc__body/);
  assert.match(html, /fc-calc__actions/);
  assert.match(html, /fc-calc__result-wrap/);
  assert.match(html, /fc-calc__foot/);
});

test('run calculator tests from cases.json when present', async () => {
  const { readdir } = await import('node:fs/promises');
  const { pathToFileURL } = await import('node:url');
  const calcDir = join(root, 'calculators');
  let entries;
  try {
    entries = await readdir(calcDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries.filter((e) => e.isDirectory())) {
    const slug = ent.name;
    const casesPath = join(calcDir, slug, 'cases.json');
    const calcPath = join(calcDir, slug, 'calc.js');
    let cases;
    try {
      cases = JSON.parse(await readFile(casesPath, 'utf8'));
    } catch {
      continue;
    }
    const { calculate } = await import(pathToFileURL(calcPath).href);
    for (const c of cases.cases || []) {
      const out = calculate(c.input);
      for (const [key, val] of Object.entries(c.expected || {})) {
        assert.equal(out[key], val, `${slug}: ${c.name} — ${key}`);
      }
    }
  }
});
