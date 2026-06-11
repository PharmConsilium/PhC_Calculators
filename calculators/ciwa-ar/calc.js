/**
 * Шкала CIWA-AR — тяжесть алкогольного абстинентного синдрома.
 */

import { CIWA_ITEMS, allCiwaItemIds } from './ciwa-data.js';

export { CIWA_ITEMS, CIWA_INTERPRETATION_ROWS, allCiwaItemIds, formatCiwaPoints } from './ciwa-data.js';

export function interpretCiwa(total) {
  if (total <= 9) {
    return {
      category: 'very-mild',
      interpretation: 'Очень умеренный абстинентный синдром',
    };
  }
  if (total <= 15) {
    return {
      category: 'mild',
      interpretation: 'Легкий абстинентный синдром',
    };
  }
  if (total <= 20) {
    return {
      category: 'moderate',
      interpretation: 'Умеренный абстинентный синдром',
    };
  }
  return {
    category: 'severe',
    interpretation: 'Тяжёлый абстинентный синдром',
  };
}

function getOption(item, raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return item.options.find((opt) => opt.points === value) ?? null;
}

export function calculateCiwa(input = {}) {
  const missing = [];
  let total = 0;
  const scores = {};

  for (const item of CIWA_ITEMS) {
    const option = getOption(item, input[item.id]);
    if (!option) {
      missing.push(item.id);
      continue;
    }
    scores[item.id] = option.points;
    total += option.points;
  }

  if (missing.length) {
    return {
      status: 'INCOMPLETE',
      total: null,
      category: null,
      interpretation: null,
      scores: null,
      missing,
    };
  }

  const { category, interpretation } = interpretCiwa(total);

  return {
    status: 'OK',
    total,
    category,
    interpretation,
    scores,
    missing: [],
  };
}

export function calculate(input = {}) {
  return calculateCiwa(input);
}
