#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';

async function parseScale(url) {
  const t = await (await fetch(url)).text();
  const items = [];
  const blockRe = /lbl_[^"]+"[^>]*><h6>(\d+)\.\s*<a[^>]*><\/a>([^<]+)<\/h6>[\s\S]*?<form id="([^"]+)"[\s\S]*?<\/form>/g;
  let m;
  while ((m = blockRe.exec(t))) {
    const opts = [];
    const optRe = /value="(\d+)"[^>]*><label[^>]*>([^<]+)/g;
    let om;
    while ((om = optRe.exec(m[0]))) {
      opts.push({
        value: Number(om[1]),
        text: om[2].replace(/\u00a0.*/, '').replace(/\s+/g, ' ').trim(),
      });
    }
    items.push({ num: Number(m[1]), label: m[2].trim(), formId: m[3], options: opts });
  }
  return items;
}

function parseInterpretation(url) {
  return fetch(url).then((r) => r.text()).then((t) => {
    const table = t.match(/Интерпретация полученных результатов[\s\S]*?<table[\s\S]*?<\/table>/);
    if (!table) return [];
    const rows = [];
    const rowRe = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>/g;
    let m;
    while ((m = rowRe.exec(table[0]))) rows.push({ label: m[1].trim(), range: m[2].trim() });
    return rows;
  });
}

const [gad7, covy, spielberg, sheehan] = await Promise.all([
  parseScale('https://medsoftpro.ru/kalkulyatory/gad-7'),
  parseScale('https://medsoftpro.ru/kalkulyatory/covy-scale'),
  parseScale('https://medsoftpro.ru/kalkulyatory/spilberg-scale'),
  parseScale('https://medsoftpro.ru/kalkulyatory/sheehan-scale'),
]);

const [gad7i, covyi, spielbergi, sheehani] = await Promise.all([
  parseInterpretation('https://medsoftpro.ru/kalkulyatory/gad-7'),
  parseInterpretation('https://medsoftpro.ru/kalkulyatory/covy-scale'),
  parseInterpretation('https://medsoftpro.ru/kalkulyatory/spilberg-scale'),
  parseInterpretation('https://medsoftpro.ru/kalkulyatory/sheehan-scale'),
]);

const out = { gad7, covy, spielberg, sheehan, interpretations: { gad7: gad7i, covy: covyi, spielberg: spielbergi, sheehan: sheehani } };
await writeFile('scripts/anxiety-scales-scraped.json', JSON.stringify(out, null, 2), 'utf8');
console.log('gad7', gad7.length, 'covy', covy.length, 'spielberg', spielberg.length, 'sheehan', sheehan.length);
console.log(JSON.stringify(out.interpretations, null, 2));
