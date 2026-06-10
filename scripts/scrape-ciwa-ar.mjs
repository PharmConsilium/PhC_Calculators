#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';

const t = await (await fetch('https://medsoftpro.ru/kalkulyatory/ciwa-ar')).text();
const items = [];
const blockRe = /lbl_ciwa-ar_question_(\d+)[\s\S]*?<h6>\d+\.\s*<a[^>]*><\/a>([^<]+)<\/h6>[\s\S]*?<small[^>]*>([^<]+)<\/small>[\s\S]*?<form id="ciwa-ar_question_\1"[\s\S]*?<\/form>/g;
let m;
while ((m = blockRe.exec(t))) {
  const chunk = m[0];
  const opts = [];
  const optRe = /value="(\d+)"[\s\S]*?<label[^>]*>([^<]+?)&nbsp;/g;
  let om;
  while ((om = optRe.exec(chunk))) {
    opts.push({
      points: Number(om[1]),
      text: om[2].replace(/\s+/g, ' ').trim(),
    });
  }
  items.push({ num: Number(m[1]), label: m[2].trim(), hint: m[3].trim(), options: opts });
}

await writeFile('scripts/ciwa-ar-scraped.json', JSON.stringify(items, null, 2), 'utf8');
console.log('items', items.length);
items.forEach((item) => console.log(item.num, item.label, item.options.map((o) => o.points).join(',')));
