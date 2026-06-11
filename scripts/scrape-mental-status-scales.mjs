#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function fetchHtml(url) {
  return (await fetch(url)).text();
}

async function parseCheckboxScale(url) {
  const t = await fetchHtml(url);
  const sections = [];
  const sectionRe = /<h5[^>]*>(\d+\.\s*[^<]+)<\/h5>([\s\S]*?)(?=<h5|<div class="fc-calc__actions"|В MAX!)/g;
  let sm;
  while ((sm = sectionRe.exec(t))) {
    const items = [];
    const itemRe = /<h6>([^<]+)<\/h6>[\s\S]*?value="(\d+)"[\s\S]*?<label[^>]*>([^<]+)/g;
    let im;
    const chunk = sm[2];
    while ((im = itemRe.exec(chunk))) {
      items.push({
        label: im[1].replace(/\s+/g, ' ').trim(),
        value: Number(im[2]),
        optionText: im[3].replace(/\u00a0.*/, '').trim(),
      });
    }
    if (items.length) sections.push({ title: sm[1].trim(), items });
  }
  return sections;
}

async function parseFab(url) {
  const t = await fetchHtml(url);
  const items = [];
  const blockRe = /<h6>(\d+\.\s*[^<]+)<\/h6>([\s\S]*?)(?=<h6>|В MAX!)/g;
  let m;
  while ((m = blockRe.exec(t))) {
    const chunk = m[2];
    const opts = [];
    const optRe = /value="(\d+)"[^>]*><label[^>]*>([^<]+)/g;
    let om;
    while ((om = optRe.exec(chunk))) {
      opts.push({ value: Number(om[1]), text: om[2].replace(/\u00a0.*/, '').replace(/\s+/g, ' ').trim() });
    }
    const numInput = /type="number"/.test(chunk);
    items.push({ label: m[1].trim(), options: opts, numInput });
  }
  return items;
}

const mmse = await parseCheckboxScale('https://medsoftpro.ru/kalkulyatory/mini-mental-state-examination');
const fab = await parseFab('https://medsoftpro.ru/kalkulyatory/frontal-assessment-battery');

await writeFile(join(root, 'scripts/mental-status-scraped.json'), JSON.stringify({ mmse, fab }, null, 2), 'utf8');
console.log('MMSE sections', mmse.length, 'items', mmse.reduce((s, x) => s + x.items.length, 0));
console.log('FAB items', fab.length);
console.log(JSON.stringify(fab, null, 2));
