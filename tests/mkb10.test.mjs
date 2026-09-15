import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createIndex,
  search,
  getItem,
  getChildren,
  getPath,
  hasChildren,
  readableName,
  displayName,
} from '../calculators/mkb10/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'mkb10');

async function loadIndex() {
  const b64 = await readFile(join(calcDir, 'data.gz.b64'), 'utf8');
  const json = gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');
  const payload = JSON.parse(json);
  assert.equal(payload.v, 1);
  assert.ok(Array.isArray(payload.items));
  return createIndex(payload.items);
}

test('readableName keeps ICD codes uppercase', () => {
  assert.equal(
    readableName('НЕКОТОРЫЕ ИНФЕКЦИОННЫЕ И ПАРАЗИТАРНЫЕ БОЛЕЗНИ (A00-B99)'),
    'Некоторые инфекционные и паразитарные болезни (A00-B99)'
  );
  assert.equal(readableName('Холера'), 'Холера');
});

test('displayName fallback for blank title', () => {
  assert.equal(
    displayName({ id: 1, parentId: null, code: 'M46', name: ' ', info: '[код локализации см. выше]' }),
    'код локализации см. выше'
  );
});

test('mkb10 all paths are structurally valid', async () => {
  const index = await loadIndex();
  assert.equal(index.byId.size, 14907);

  for (const item of index.byId.values()) {
    if (item.parentId != null) {
      assert.ok(index.byId.has(item.parentId), `orphan ${item.id} ${item.code}`);
      const sibs = getChildren(index, item.parentId);
      assert.ok(
        sibs.some((s) => s.id === item.id),
        `not listed under parent ${item.id} ${item.code}`
      );
    } else {
      assert.ok(index.roots.includes(item.id), `root missing ${item.id}`);
    }

    const path = getPath(index, item.id);
    assert.ok(path.length >= 1, `empty path ${item.id}`);
    assert.equal(path[path.length - 1].id, item.id, `path end ${item.code}`);
    assert.equal(path[0].parentId, null, `path root ${item.code}`);
    for (let i = 1; i < path.length; i++) {
      assert.equal(
        path[i].parentId,
        path[i - 1].id,
        `broken chain ${item.code}: ${path[i].code} parent`
      );
    }
  }
});

test('mkb10 full dataset: structure, cholera, diabetes', async () => {
  const index = await loadIndex();
  assert.equal(index.roots.length, 22);
  assert.equal(index.byId.size, 14907);

  let orphans = 0;
  for (const item of index.byId.values()) {
    if (item.parentId != null && !index.byId.has(item.parentId)) orphans += 1;
  }
  assert.equal(orphans, 0);

  const hits = search(index, 'A00', { limit: 20 });
  const a00 = hits.find((h) => h.code === 'A00');
  assert.ok(a00);
  assert.equal(a00.name, 'Холера');
  assert.equal(hasChildren(index, a00.id), true);

  const kids = getChildren(index, a00.id);
  assert.deepEqual(
    kids.map((k) => k.code),
    ['A00.0', 'A00.1', 'A00.9']
  );

  const leaf = getItem(index, kids[0].id);
  assert.equal(leaf.code, 'A00.0');
  assert.match(leaf.info, /Классическая холера/i);
  assert.deepEqual(
    getPath(index, leaf.id).map((p) => p.code),
    ['A00-B99', 'A00-A09', 'A00', 'A00.0']
  );

  const nameHits = search(index, 'холёра', { limit: 30 });
  assert.ok(nameHits.some((h) => h.code === 'A00'));

  const e11 = search(index, 'E11', { limit: 5 }).find((h) => h.code === 'E11');
  assert.ok(e11);
  assert.match(e11.name, /сахарный диабет/i);
  assert.deepEqual(
    getPath(index, e11.id).map((p) => p.code),
    ['E00-E90', 'E10-E14', 'E11']
  );

  const diab = search(index, 'сахарный диабет', { limit: 40 });
  assert.ok(diab.some((h) => h.code === 'E11' || /E1[0-4]/.test(h.code)));

  const roots = getChildren(index, null);
  assert.equal(roots[0].code, 'A00-B99');
  assert.match(displayName(roots[0]), /\(A00-B99\)/);
  assert.doesNotMatch(displayName(roots[0]), /\(a00-b99\)/);
});
