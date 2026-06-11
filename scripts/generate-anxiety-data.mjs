#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scraped = JSON.parse(await readFile(join(root, 'scripts/anxiety-scales-scraped.json'), 'utf8'));
const outDir = join(root, 'calculators/anxiety-scales');

function cleanText(text) {
  return text.replace(/&nbsp;/g, '').replace(/\s+/g, ' ').trim();
}

function makeItems(scrapedItems, idPrefix) {
  return scrapedItems.map((item, index) => ({
    id: `${idPrefix}${index + 1}`,
    label: `${item.num}. ${cleanText(item.label)}`,
    options: item.options.map((opt) => ({
      value: opt.value,
      text: cleanText(opt.text),
    })),
  }));
}

function writeDataFile(name, exportName, items, interpretationRows, extra = '') {
  const body = `/**
 * @see https://medsoftpro.ru/kalkulyatory/
 */

export const ${exportName}_ITEMS = ${JSON.stringify(items, null, 2).replace(/"([^"]+)":/g, '$1:')};

export const ${exportName}_INTERPRETATION_ROWS = ${JSON.stringify(interpretationRows, null, 2).replace(/"([^"]+)":/g, '$1:')};
${extra}`;
  return writeFile(join(outDir, `${name}-data.js`), body, 'utf8');
}

const GAD7_OPTIONS = scraped.gad7[0].options.map((o) => ({
  value: o.value,
  text: cleanText(o.text),
}));

const gad7Items = scraped.gad7.map((item, i) => ({
  id: `g${i + 1}`,
  label: `${item.num}. ${cleanText(item.label)}`,
  options: GAD7_OPTIONS,
}));

const covyHints = [
  'Чувствует нервозность, дрожь, панику, внезапный беспричинный страх, испуг, возбуждение, трудно концентрироваться на какой-либо задаче',
  'Выглядит испуганным, дрожащим, беспокойным, вздрагивающим, паникующим',
  'Беспричинное потение, дрожь, учащенное сердцебиение, нехватка воздуха, повышенное мочеиспускание, беспокойный сон, дискомфорт в эпигастральной области, комок в горле',
];

const covyItems = scraped.covy.map((item, i) => ({
  id: `c${i + 1}`,
  label: `${item.num}. ${cleanText(item.label)}`,
  hint: covyHints[i],
  labelStyle: 'hint',
  options: item.options.map((o) => ({ value: o.value, text: cleanText(o.text) })),
}));

const spielbergReactive = makeItems(scraped.spielberg.slice(0, 20), 'sr');
const spielbergTrait = makeItems(scraped.spielberg.slice(20), 'st').map((item, i) => ({
  ...item,
  label: `${i + 21}. ${item.label.replace(/^\d+\.\s*/, '')}`,
}));

const sheehanItems = makeItems(scraped.sheehan, 'sh');

await Promise.all([
  writeDataFile('gad7', 'GAD7', gad7Items, scraped.interpretations.gad7),
  writeDataFile('covy', 'COVY', covyItems, [
    { label: 'Отсутствие тревожного состояния', range: '3 и менее' },
    { label: 'Имеются симптомы тревоги', range: 'от 4 до 6' },
    { label: 'Тревожное состояние', range: '6 и более' },
  ]),
  writeFile(
    join(outDir, 'spielberg-data.js'),
    `/**
 * Шкала Спилберга-Ханина (STAI).
 * @see https://medsoftpro.ru/kalkulyatory/spilberg-scale
 */

export const SPIELBERG_REACTIVE = ${JSON.stringify(spielbergReactive, null, 2).replace(/"([^"]+)":/g, '$1:')};

export const SPIELBERG_TRAIT = ${JSON.stringify(spielbergTrait, null, 2).replace(/"([^"]+)":/g, '$1:')};

export const SPIELBERG_INTERPRETATION_ROWS = ${JSON.stringify(scraped.interpretations.spielberg, null, 2).replace(/"([^"]+)":/g, '$1:')};
`,
    'utf8'
  ),
  writeDataFile('sheehan', 'SHEEHAN', sheehanItems, scraped.interpretations.sheehan),
]);

console.log('Generated anxiety scale data files');
