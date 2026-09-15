#!/usr/bin/env node
/**
 * Packs mkb10-standalone JSON into gzip+base64 for the widget.
 *
 * Usage:
 *   node scripts/build-mkb10-data.mjs [path/to/mkb10s.json]
 *
 * Default source:
 *   D:/Download/mkb10-standalone/mkb10-standalone/data/mkb10s.json
 */
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'calculators', 'mkb10');
const defaultSrc = 'D:/Download/mkb10-standalone/mkb10-standalone/data/mkb10s.json';
const src = process.argv[2] || defaultSrc;

const raw = JSON.parse(await readFile(src, 'utf8'));
if (!Array.isArray(raw)) {
  console.error('Expected an array in', src);
  process.exit(1);
}

const items = raw
  .filter((x) => x.actual !== 0)
  .map((x) => {
    const row = [x.id, x.parent_id == null ? null : x.parent_id, x.code || '', x.name];
    const info = x.additional_info != null ? String(x.additional_info).trim() : '';
    if (info) row.push(info);
    return row;
  });

const payload = { v: 1, items };
const json = Buffer.from(JSON.stringify(payload), 'utf8');
const gz = gzipSync(json, { level: 9 });
const b64 = gz.toString('base64');

await writeFile(join(outDir, 'data.gz.b64'), b64, 'utf8');
await writeFile(
  join(outDir, 'data.meta.json'),
  JSON.stringify(
    {
      version: 1,
      count: items.length,
      withInfo: items.filter((r) => r.length > 4).length,
      gzipBytes: gz.length,
      source: src,
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  ) + '\n',
  'utf8'
);

console.log(`Packed ${items.length} items → calculators/mkb10/data.gz.b64 (${gz.length} gzip bytes)`);
