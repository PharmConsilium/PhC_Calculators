#!/usr/bin/env node
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OLD =
  /[ \t]*<p class="fc-calc__hint">Справочно\. Не заменяет осмотр врача\.<\/p>\n?/g;
const SOURCE =
  /[ \t]*<p class="fc-calc__hint">Источник:[\s\S]*?<\/p>\n?/g;

async function walk(dir, acc = []) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) await walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function fixContent(content) {
  let next = content.replace(SOURCE, '');
  next = next.replace(OLD, `${NOTES_DISCLAIMER_HTML}\n`);
  if (
    next.includes('fc-calc__notes-body') &&
    !next.includes('Калькулятор для медицинских специалистов')
  ) {
    next = next.replace(
      /(\s*<\/div>\s*\n\s*<\/details>\s*\n\s*<\/div>\s*\n\s*<footer class="fc-calc__foot">)/,
      `\n${NOTES_DISCLAIMER_HTML}\n$1`
    );
  }
  return next;
}

const targets = [
  ...(await walk(join(root, 'scripts'))).filter((p) => p.endsWith('.mjs')),
  ...(await walk(join(root, 'calculators'))).filter((p) => p.endsWith('index.html')),
];

let changed = 0;
for (const path of targets) {
  const content = await readFile(path, 'utf8');
  const next = fixContent(content);
  if (next !== content) {
    await writeFile(path, next, 'utf8');
    changed += 1;
    console.log('updated', path.replace(root + '\\', '').replace(root + '/', ''));
  }
}

console.log(`Done. ${changed} file(s) updated.`);
