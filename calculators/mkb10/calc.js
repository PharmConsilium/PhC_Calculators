/**
 * МКБ-10 — справочник: индекс, поиск, дерево.
 * Компактный ряд: [id, parentId|null, code, name, info?]
 */

/** @typedef {[number, number|null, string, string, string?]} MkbRow */
/** @typedef {{ id: number, parentId: number|null, code: string, name: string, info: string }} MkbItem */
/** @typedef {{ byId: Map<number, MkbItem>, children: Map<number|null, number[]>, roots: number[] }} MkbIndex */

/**
 * @param {string} s
 * @returns {string}
 */
export function normalizeQuery(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

/**
 * @param {MkbRow} row
 * @returns {MkbItem}
 */
export function rowToItem(row) {
  return {
    id: row[0],
    parentId: row[1],
    code: row[2] || '',
    name: row[3] || '',
    info: row[4] || '',
  };
}

/**
 * @param {MkbRow[]} items
 * @returns {MkbIndex}
 */
export function createIndex(items) {
  /** @type {Map<number, MkbItem>} */
  const byId = new Map();
  /** @type {Map<number|null, number[]>} */
  const children = new Map();

  for (const row of items) {
    const item = rowToItem(row);
    byId.set(item.id, item);
    const pid = item.parentId;
    if (!children.has(pid)) children.set(pid, []);
    children.get(pid).push(item.id);
  }

  const roots = children.get(null) || [];
  return { byId, children, roots };
}

/**
 * @param {MkbIndex} index
 * @param {number} id
 * @returns {MkbItem|null}
 */
export function getItem(index, id) {
  return index.byId.get(Number(id)) || null;
}

/**
 * @param {MkbIndex} index
 * @param {number|null} parentId
 * @returns {MkbItem[]}
 */
export function getChildren(index, parentId) {
  const key = parentId == null ? null : Number(parentId);
  const ids = index.children.get(key) || [];
  return ids.map((id) => index.byId.get(id)).filter(Boolean);
}

/**
 * @param {MkbIndex} index
 * @param {number} id
 * @returns {boolean}
 */
export function hasChildren(index, id) {
  const kids = index.children.get(Number(id));
  return Boolean(kids && kids.length);
}

/**
 * Breadcrumb from root to item (inclusive).
 * @param {MkbIndex} index
 * @param {number} id
 * @returns {MkbItem[]}
 */
export function getPath(index, id) {
  /** @type {MkbItem[]} */
  const path = [];
  let cur = getItem(index, id);
  const guard = new Set();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    path.push(cur);
    if (cur.parentId == null) break;
    cur = getItem(index, cur.parentId);
  }
  path.reverse();
  return path;
}

/**
 * @param {MkbItem} item
 * @returns {string}
 */
export function formatLabel(item) {
  if (!item) return '';
  if (item.code) return `${item.code} ${item.name}`.trim();
  return item.name;
}

/**
 * Смягчает ALL CAPS заголовки классов, сохраняя коды МКБ в тексте.
 * @param {string} name
 * @returns {string}
 */
export function readableName(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  if (raw.length <= 12 || raw !== raw.toUpperCase()) return raw;

  let out = raw.charAt(0) + raw.slice(1).toLowerCase();
  // Вернуть коды вида A00, A00.0, A00-B99, V01-Y98
  out = out.replace(
    /\b([a-z]\d{2}(?:\.[a-z0-9]+)?(?:-[a-z]\d{2}(?:\.[a-z0-9]+)?)?)\b/gi,
    (m) => m.toUpperCase()
  );
  return out;
}

/**
 * Имя для UI: читаемое название или запасной текст.
 * @param {MkbItem} item
 * @returns {string}
 */
export function displayName(item) {
  if (!item) return '';
  const name = readableName(item.name);
  if (name) return name;
  const info = String(item.info || '')
    .replace(/^\[|\]$/g, '')
    .trim();
  if (info) return info;
  return item.code || 'Без названия';
}

/**
 * @param {MkbIndex} index
 * @param {string} query
 * @param {{ limit?: number }} [opts]
 * @returns {MkbItem[]}
 */
export function search(index, query, opts = {}) {
  const limit = opts.limit ?? 50;
  const q = normalizeQuery(query);
  if (!q || limit <= 0) return [];

  const qCode = q.replace(/\s/g, '');
  /** @type {MkbItem[]} */
  const exact = [];
  /** @type {MkbItem[]} */
  const prefix = [];
  /** @type {MkbItem[]} */
  const nameHits = [];

  for (const item of index.byId.values()) {
    const codeNorm = normalizeQuery(item.code).replace(/\s/g, '');
    const nameNorm = normalizeQuery(item.name);

    if (codeNorm && codeNorm === qCode) {
      exact.push(item);
      continue;
    }
    if (codeNorm && codeNorm.startsWith(qCode)) {
      prefix.push(item);
      continue;
    }
    if (nameNorm.includes(q)) {
      nameHits.push(item);
    }
  }

  const out = [];
  const seen = new Set();
  for (const list of [exact, prefix, nameHits]) {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Case-runner helpers (fixture-friendly).
 * @param {{ items: MkbRow[], query: string, limit?: number }} input
 */
export function searchWithItems(input) {
  const index = createIndex(input.items || []);
  const results = search(index, input.query, { limit: input.limit ?? 50 });
  return {
    status: 'OK',
    count: results.length,
    ids: results.map((r) => r.id),
    codes: results.map((r) => r.code),
  };
}

/**
 * @param {{ items: MkbRow[], id: number }} input
 */
export function pathWithItems(input) {
  const index = createIndex(input.items || []);
  const path = getPath(index, input.id);
  return {
    status: 'OK',
    ids: path.map((p) => p.id),
    codes: path.map((p) => p.code),
  };
}

/**
 * @param {{ items: MkbRow[], parentId: number|null }} input
 */
export function childrenWithItems(input) {
  const index = createIndex(input.items || []);
  const kids = getChildren(index, input.parentId);
  return {
    status: 'OK',
    count: kids.length,
    ids: kids.map((k) => k.id),
    codes: kids.map((k) => k.code),
  };
}

/**
 * Default entry for generic cases runner — search.
 * @param {{ items: MkbRow[], query: string, limit?: number }} input
 */
export function calculate(input) {
  return searchWithItems(input);
}
