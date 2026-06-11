#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const calculatorsDir = join(root, 'calculators');
const readmePath = join(calculatorsDir, 'README.md');

const SECTION_START = '## Все Калькуляторы';
const SECTION_END = '## Новый калькулятор';

const entries = [];
for (const name of await readdir(calculatorsDir, { withFileTypes: true })) {
  if (!name.isDirectory()) continue;
  const slug = name.name;
  let title = slug;
  try {
    const meta = JSON.parse(await readFile(join(calculatorsDir, slug, 'meta.json'), 'utf8'));
    if (meta.title) title = meta.title;
  } catch {
    /* no meta.json — slug only */
  }
  entries.push({ slug, title });
}

entries.sort((a, b) => a.slug.localeCompare(b.slug, 'ru'));

const intro = [
  'Список генерируется из `meta.json` каждой папки. После создания или переименования калькулятора обновите `meta.json` → `title` и выполните:',
  '',
  '```bash',
  'node scripts/sync-calculator-readme.mjs',
  '```',
  '',
  'При `node scripts/new-calculator.mjs <slug>` список обновляется автоматически.',
].join('\n');

const lines = entries.map(({ slug, title }) => `- **\`${slug}/\`** — ${title}`);
const section = `${SECTION_START}\n\n${intro}\n\n${lines.join('\n')}\n`;

const readme = await readFile(readmePath, 'utf8');
const start = readme.indexOf(SECTION_START);
const end = readme.indexOf(SECTION_END);
if (start === -1 || end === -1 || end <= start) {
  console.error(`Could not find "${SECTION_START}" / "${SECTION_END}" in calculators/README.md`);
  process.exit(1);
}

const updated = readme.slice(0, start) + section + '\n' + readme.slice(end);
await writeFile(readmePath, updated, 'utf8');
console.log(`Updated calculators/README.md (${entries.length} calculators)`);
