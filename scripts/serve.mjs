#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const port = Number(process.argv[2]) || 8765;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer(async (req, res) => {
  const path = (req.url || '/').split('?')[0];
  const file = join(root, decodeURIComponent(path === '/' ? '/calculators/bmi/preview.html' : path));
  try {
    let data = await readFile(file, 'utf8');
    // Локальный просмотр: фрагмент index.html → полная страница (без iframe, для Inspect в Cursor)
    if (
      extname(file) === '.html' &&
      !/^\s*<!DOCTYPE/i.test(data) &&
      data.includes('class="fc-calc"')
    ) {
      data = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Калькулятор — локальный просмотр</title>
  <style>body{margin:0;padding:16px;background:#eff0f2;}</style>
</head>
<body>
${data}
</body>
</html>`;
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'text/html; charset=utf-8' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, () => {
  const url = `http://localhost:${port}/calculators/bmi/preview.html`;
  console.log(`Serving ${root}`);
  console.log(url);
});
