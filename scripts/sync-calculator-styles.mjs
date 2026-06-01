#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const slug = process.argv[2];

if (!slug) {
  console.error('Usage: node scripts/sync-calculator-styles.mjs <slug>');
  process.exit(1);
}

const indexPath = join(root, 'calculators', slug, 'index.html');
const cssPath = join(root, 'shared', 'fc-calc.css');

const [html, css] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(cssPath, 'utf8'),
]);

const rootStart = html.indexOf('<div class="fc-calc"');
const start = rootStart === -1 ? html.indexOf('<style>') : html.indexOf('<style>', rootStart);
const end = start === -1 ? -1 : html.indexOf('</style>', start);
if (start === -1 || end === -1) {
  console.error('No <style> block in index.html');
  process.exit(1);
}

const updated =
  html.slice(0, start + '<style>'.length) +
  '\n' +
  css.trim() +
  '\n  ' +
  html.slice(end);

await writeFile(indexPath, updated, 'utf8');
console.log(`Synced shared/fc-calc.css → calculators/${slug}/index.html`);
