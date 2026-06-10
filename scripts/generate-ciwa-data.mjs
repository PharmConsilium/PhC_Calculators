#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scraped = JSON.parse(await readFile(join(root, 'scripts', 'ciwa-ar-scraped.json'), 'utf8'));

const items = scraped.map((item) => ({
  id: `q${item.num}`,
  number: item.num,
  label: item.label,
  hint: item.hint,
  options: item.options.map((opt) => ({
    value: opt.points,
    text: opt.text,
    points: opt.points,
  })),
}));

const out = `/**
 * Шкала CIWA-AR — тяжесть алкогольного абстинентного синдрома.
 * @see https://medsoftpro.ru/kalkulyatory/ciwa-ar
 */

export const CIWA_ITEMS = ${JSON.stringify(items, null, 2).replace(/"([^"]+)":/g, '$1:')};

export const CIWA_INTERPRETATION_ROWS = [
  { label: 'Очень умеренный абстинентный синдром', range: '9 и менее' },
  { label: 'Легкий абстинентный синдром', range: '10–15' },
  { label: 'Умеренный абстинентный синдром', range: '16–20' },
  { label: 'Тяжёлый абстинентный синдром', range: '21 и более' },
];

export function allCiwaItemIds() {
  return CIWA_ITEMS.map((item) => item.id);
}

export function formatCiwaPoints(value) {
  return value === 0 ? '0' : \`+\${value}\`;
}
`;

await writeFile(join(root, 'calculators', 'ciwa-ar', 'ciwa-data.js'), out, 'utf8');
console.log('Wrote calculators/ciwa-ar/ciwa-data.js');
