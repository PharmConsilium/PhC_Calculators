/**
 * Климактерическая шкала Грина (Greene Climacteric Scale).
 */

import {
  GREENE_ITEMS,
  GREENE_SECTIONS,
  allGreeneItemIds,
} from './greene-data.js';

export {
  GREENE_ITEMS,
  GREENE_OPTIONS,
  GREENE_SECTIONS,
  GREENE_INTERPRETATION_ROWS,
  allGreeneItemIds,
  formatGreenePoints,
} from './greene-data.js';

export function interpretGreene(total) {
  if (total <= 0) {
    return {
      category: 'none',
      interpretation: 'Симптомы климактерического синдрома отсутствуют',
    };
  }
  if (total <= 11) {
    return {
      category: 'mild',
      interpretation:
        'Слабая степень — симптомы выражены минимально, не требуют медикаментозной коррекции или достаточно немедикаментозных методов',
    };
  }
  if (total <= 19) {
    return {
      category: 'moderate',
      interpretation:
        'Средняя степень — симптомы умеренно выражены и влияют на качество жизни; может потребоваться менопаузальная гормональная терапия или другая терапия',
    };
  }
  return {
    category: 'severe',
    interpretation:
      'Тяжелая степень — симптомы значительно снижают качество жизни; показано назначение менопаузальной гормональной терапии (при отсутствии противопоказаний) или других методов коррекции',
  };
}

function getOption(item, raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return item.options.find((opt) => opt.points === value) ?? null;
}

export function calculateGreene(input = {}) {
  const missing = [];
  let total = 0;
  const scores = {};

  for (const item of GREENE_ITEMS) {
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
      subscales: null,
      scores: null,
      missing,
    };
  }

  const subscales = {};
  for (const section of GREENE_SECTIONS) {
    subscales[section.id] = section.itemIds.reduce((sum, id) => sum + scores[id], 0);
  }

  const { category, interpretation } = interpretGreene(total);

  return {
    status: 'OK',
    total,
    max: 63,
    category,
    interpretation,
    subscales,
    scores,
    missing: [],
  };
}

export function calculate(input = {}) {
  return calculateGreene(input);
}
