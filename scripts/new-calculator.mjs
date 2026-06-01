#!/usr/bin/env node
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const slug = process.argv[2];

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: node scripts/new-calculator.mjs <slug>  (e.g. bmi, has-bled)');
  process.exit(1);
}

const dir = join(root, 'calculators', slug);
const templatePath = join(root, 'templates', 'calculator-template.html');

try {
  await access(dir);
  console.error(`Folder already exists: calculators/${slug}/`);
  process.exit(1);
} catch {
  /* ok */
}

await mkdir(dir, { recursive: true });

let html = await readFile(templatePath, 'utf8');
html = html.replaceAll('SLUG', slug);
await writeFile(join(dir, 'index.html'), html, 'utf8');

const cases = {
  slug,
  source: 'TODO: guideline or scale name',
  cases: [
    { name: 'example normal', input: { example: 1 }, expected: { value: 1 } },
  ],
};
await writeFile(join(dir, 'cases.json'), JSON.stringify(cases, null, 2) + '\n', 'utf8');

const calcJs = `/**
 * ${slug} — pure calculation (import in tests)
 * Source: TODO
 */

export function calculate(input) {
  const example = Number(input.example);
  if (!Number.isFinite(example) || example < 0) {
    throw new Error('Invalid example');
  }
  return { value: example, interpretation: 'TODO' };
}
`;
await writeFile(join(dir, 'calc.js'), calcJs, 'utf8');

const meta = {
  slug,
  title: 'TODO: название на русском',
  sitePath: `/calculator/${slug}`,
};
await writeFile(join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');

console.log(`Created calculators/${slug}/`);
console.log('  index.html  — embed in FarmConsilium html_code');
console.log('  calc.js     — formula for unit tests');
console.log('  cases.json  — golden test cases');
console.log('  meta.json   — slug and title');
