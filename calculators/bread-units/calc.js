/**
 * Калькулятор хлебных единиц (ХЕ).
 * Источник логики: Calculators_MobileApp / bread-units.
 */

export const HE_STANDARDS = [10, 12, 15];
export const LOOKUP_HE_STANDARD = 12;
export const DAILY_NORM_HE = 18;
export const ALL_PRODUCTS_CATEGORY = 'Все';
export const CUSTOM_PRODUCT_CATEGORY = 'Свои продукты';
export const REF_PAGE_SIZE = 8;

export const HE_STANDARD_OPTIONS = [
  { value: 12, label: '12 г/ХЕ (РФ/СНГ)' },
  { value: 10, label: '10 г/ХЕ (упрощённый)' },
  { value: 15, label: '15 г/ХЕ (США/ВОЗ)' },
];

export const MEAL_OPTIONS = [
  { id: 'breakfast', label: 'Завтрак' },
  { id: 'lunch', label: 'Обед' },
  { id: 'dinner', label: 'Ужин' },
  { id: 'snack', label: 'Перекус' },
];

export function emptyMealLog() {
  return { breakfast: [], lunch: [], dinner: [], snack: [] };
}

export function formatHe(value, digits = 1) {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(digits).replace('.', ',');
}

export function formatCarbs(value, digits = 1) {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(digits).replace('.', ',');
}

/** ХЕ = (углеводы на 100 г × порция г) / (100 × стандарт). */
export function calculateHeFromCarbs(carbsPer100, portionG, standard = 12) {
  if (
    !Number.isFinite(carbsPer100) ||
    !Number.isFinite(portionG) ||
    portionG <= 0 ||
    carbsPer100 < 0
  ) {
    throw new Error('Некорректные данные');
  }
  if (!HE_STANDARDS.includes(standard)) {
    throw new Error('Некорректный стандарт ХЕ');
  }
  const carbsInPortion = (carbsPer100 * portionG) / 100;
  return { carbsInPortion, he: carbsInPortion / standard };
}

export function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function calculate(input) {
  const mode = input.mode || 'manual';
  const standard = Number(input.standard ?? LOOKUP_HE_STANDARD);
  const portionG = parseNumber(input.portionG);

  if (mode === 'product') {
    const carbsPer100 = parseNumber(input.carbsPer100);
    if (carbsPer100 == null || portionG == null || portionG <= 0) {
      throw new Error('Выберите продукт и укажите порцию');
    }
    const out = calculateHeFromCarbs(carbsPer100, portionG, LOOKUP_HE_STANDARD);
    return {
      mode: 'product',
      standard: LOOKUP_HE_STANDARD,
      carbsPer100,
      portionG,
      carbsInPortion: out.carbsInPortion,
      he: out.he,
      heLabel: formatHe(out.he),
      carbsLabel: formatCarbs(out.carbsInPortion),
      productName: input.productName || '',
    };
  }

  const carbsPer100 = parseNumber(input.carbsPer100);
  if (carbsPer100 == null || carbsPer100 < 0) {
    throw new Error('Укажите углеводы на 100 г');
  }
  if (portionG == null || portionG <= 0) {
    throw new Error('Укажите вес порции');
  }
  if (!HE_STANDARDS.includes(standard)) {
    throw new Error('Некорректный стандарт ХЕ');
  }

  const out = calculateHeFromCarbs(carbsPer100, portionG, standard);
  return {
    mode: 'manual',
    standard,
    carbsPer100,
    portionG,
    carbsInPortion: out.carbsInPortion,
    he: out.he,
    heLabel: formatHe(out.he),
    carbsLabel: formatCarbs(out.carbsInPortion),
    productName: input.productName || '',
  };
}

export function normalizeProductSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[‑–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeProductQuery(query) {
  return normalizeProductSearchText(query)
    .split(/[\s,;.+/]+/)
    .map((token) => token.replace(/^-+|-+$/g, ''))
    .filter((token) => token.length > 0);
}

function productTokenWords(haystack) {
  return haystack.split(/[\s\-/(),]+/).filter(Boolean);
}

function productFieldScore(haystack, token) {
  if (!haystack || !token) return 0;
  if (haystack === token) return 100;
  if (haystack.startsWith(token)) return 80;
  const words = productTokenWords(haystack);
  if (words.some((word) => word === token)) return 95;
  if (words.some((word) => word.startsWith(token))) return 75;
  if (token.length < 3) return 0;
  if (haystack.includes(token)) return 50;
  return 0;
}

function scoreProductHit(index, tokens) {
  let total = 0;
  for (const token of tokens) {
    const nameScore = productFieldScore(index.name, token);
    const catScore = Math.round(productFieldScore(index.cat, token) * 0.55);
    const best = Math.max(nameScore, catScore);
    if (best <= 0) return 0;
    total += best;
  }
  const phrase = tokens.join(' ');
  if (index.name.startsWith(phrase)) total += 25;
  else if (index.name.includes(phrase)) total += 10;
  return total;
}

export function isCustomProduct(product) {
  return Boolean(product && String(product.id || '').startsWith('custom-'));
}

/**
 * Умный поиск по базе (+ опционально свои продукты).
 * @param {Array} products база
 * @param {string} query
 * @param {number} [limit=40]
 * @param {Array} [extraProducts=[]] свои продукты
 */
export function searchProducts(products, query, limit = 40, extraProducts = []) {
  const tokens = tokenizeProductQuery(query);
  if (tokens.length === 0) return [];

  const scored = [];
  const lists = [
    ...(Array.isArray(extraProducts) ? extraProducts : []),
    ...(Array.isArray(products) ? products : []),
  ];

  for (const product of lists) {
    const index = {
      product,
      name: normalizeProductSearchText(product.name),
      cat: normalizeProductSearchText(product.cat),
    };
    let score = scoreProductHit(index, tokens);
    if (score <= 0) continue;
    if (isCustomProduct(product)) score += 20;
    scored.push({ product, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const phrase = tokens.join(' ');
    const aName = normalizeProductSearchText(a.product.name);
    const bName = normalizeProductSearchText(b.product.name);
    const aStarts = aName.startsWith(phrase) ? 1 : 0;
    const bStarts = bName.startsWith(phrase) ? 1 : 0;
    if (bStarts !== aStarts) return bStarts - aStarts;
    return a.product.name.localeCompare(b.product.name, 'ru');
  });

  return scored.slice(0, limit).map((row) => row.product);
}

/** Граммы из типичной порции («1 кусок 25 г»). */
export function parsePortionGrams(portion) {
  const match = String(portion || '').match(/(\d+[.,]?\d*)\s*г/i);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function gram1heLabel(gram1he) {
  if (gram1he > 0) return `${gram1he} г`;
  return '≥600 г';
}

export function giLevel(gi) {
  if (!gi || gi <= 0) return 'none';
  if (gi < 55) return 'low';
  if (gi < 70) return 'mid';
  return 'high';
}

/** 1 ХЕ в граммах при стандарте 12 г углеводов. */
export function gram1heFromCarbs(carbs) {
  if (!Number.isFinite(carbs) || carbs <= 0) return 0;
  return Math.round(1200 / carbs);
}

export function listBaseCategories(products) {
  if (!Array.isArray(products)) return [];
  return [...new Set(products.map((p) => p.cat).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ru')
  );
}

export function listProductCategories(baseProducts, extraProducts = []) {
  const base = listBaseCategories(baseProducts).filter(
    (c) => c !== CUSTOM_PRODUCT_CATEGORY && c !== ALL_PRODUCTS_CATEGORY
  );
  const mid = extraProducts.length ? [CUSTOM_PRODUCT_CATEGORY, ...base] : base;
  return [ALL_PRODUCTS_CATEGORY, ...mid];
}

export function productsByCategory(baseProducts, cat, filter = '', extraProducts = []) {
  const tokens = tokenizeProductQuery(filter);
  let items;
  if (cat === CUSTOM_PRODUCT_CATEGORY) items = extraProducts.slice();
  else if (cat && cat !== ALL_PRODUCTS_CATEGORY) {
    items = (baseProducts || []).filter((p) => p.cat === cat);
  } else {
    items = [...(extraProducts || []), ...(baseProducts || [])];
  }

  if (tokens.length > 0) {
    items = items.filter((p) => {
      const name = normalizeProductSearchText(p.name);
      return tokens.every(
        (token) => name.includes(token) || productTokenWords(name).some((w) => w.startsWith(token))
      );
    });
  }
  return items;
}

export function createCustomProduct(input) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Укажите название');
  const carbs = Number(input.carbs);
  if (!Number.isFinite(carbs) || carbs < 0) {
    throw new Error('Укажите углеводы на 100 г');
  }
  const gi = Number.isFinite(input.gi) && input.gi > 0 ? Number(input.gi) : 0;
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    cat: CUSTOM_PRODUCT_CATEGORY,
    carbs,
    gram1he: gram1heFromCarbs(carbs),
    portion: String(input.portion || '').trim(),
    gi,
  };
}

export function parseStoredCustomProducts(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const name = String(item.name || '').trim();
    const carbs = Number(item.carbs);
    if (!name || !Number.isFinite(carbs) || carbs < 0) continue;
    const id = String(item.id || '').startsWith('custom-')
      ? String(item.id)
      : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    out.push({
      id,
      name,
      cat: CUSTOM_PRODUCT_CATEGORY,
      carbs,
      gram1he: Number(item.gram1he) > 0 ? Number(item.gram1he) : gram1heFromCarbs(carbs),
      portion: String(item.portion || ''),
      gi: Number(item.gi) > 0 ? Number(item.gi) : 0,
    });
  }
  return out;
}

export function parseStoredMealLog(raw) {
  const empty = emptyMealLog();
  if (!raw || typeof raw !== 'object') return empty;
  return {
    breakfast: Array.isArray(raw.breakfast) ? raw.breakfast : [],
    lunch: Array.isArray(raw.lunch) ? raw.lunch : [],
    dinner: Array.isArray(raw.dinner) ? raw.dinner : [],
    snack: Array.isArray(raw.snack) ? raw.snack : [],
  };
}

export function createMealItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function mealTotalHe(items) {
  return (items || []).reduce((s, i) => s + (Number(i.he) || 0), 0);
}

export function summarizeDay(log) {
  const all = Object.values(log || emptyMealLog()).flat();
  const totalHe = all.reduce((s, i) => s + (Number(i.he) || 0), 0);
  const totalCarbsG = totalHe * LOOKUP_HE_STANDARD;
  const normPct = Math.min((totalHe / DAILY_NORM_HE) * 100, 100);
  let level = 'good';
  if (totalHe > DAILY_NORM_HE) level = 'bad';
  else if (totalHe > DAILY_NORM_HE * 0.8) level = 'warn';
  return {
    totalHe,
    totalCarbsG,
    itemCount: all.length,
    normPct,
    level,
  };
}
