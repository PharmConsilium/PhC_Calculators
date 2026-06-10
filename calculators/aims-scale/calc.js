/**
 * Шкала AIMS — оценка аномальных непроизвольных движений.
 */

import {
  MOVEMENT_ITEMS,
  ADDITIONAL_ITEMS,
  ALL_ITEMS,
  allAimsItemIds,
  formatAimsAdditionalValue,
  formatAimsAdditionalDisplay,
} from './aims-data.js';

export {
  MOVEMENT_ITEMS,
  ADDITIONAL_ITEMS,
  ALL_ITEMS,
  MOVEMENT_INTERPRETATION_ROWS,
  allAimsItemIds,
} from './aims-data.js';

export function interpretMovementTotal(total) {
  if (total <= 6) {
    return {
      category: 'low',
      interpretation: 'Низкий балл: 0–6. Двигательные нарушения отсутствуют или минимальны',
    };
  }
  if (total <= 14) {
    return {
      category: 'moderate',
      interpretation: 'Умеренный балл: 7–14. Умеренные двигательные нарушения',
    };
  }
  return {
    category: 'high',
    interpretation: 'Высокий балл: ≥15. Выраженные двигательные нарушения',
  };
}

function getOption(item, raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return item.options.find((opt) => opt.value === value) ?? null;
}

export function calculateAims(input = {}) {
  const missing = [];
  let movementTotal = 0;
  const movementScores = {};
  const additional = {};

  for (const item of MOVEMENT_ITEMS) {
    const option = getOption(item, input[item.id]);
    if (!option) {
      missing.push(item.id);
      continue;
    }
    movementScores[item.id] = option.points;
    movementTotal += option.points;
  }

  for (const item of ADDITIONAL_ITEMS) {
    const option = getOption(item, input[item.id]);
    if (!option) {
      missing.push(item.id);
      continue;
    }
    additional[item.id] = {
      score: option.points,
      text: option.text,
      display: formatAimsAdditionalDisplay(item, option),
      label: `${item.number}. ${item.resultLabel}`,
    };
  }

  if (missing.length) {
    return {
      status: 'INCOMPLETE',
      movementTotal: null,
      movementCategory: null,
      interpretation: null,
      movementScores: null,
      additional: null,
      missing,
    };
  }

  const { category, interpretation } = interpretMovementTotal(movementTotal);

  return {
    status: 'OK',
    movementTotal,
    movementMax: 28,
    movementCategory: category,
    interpretation,
    movementScores,
    additional,
    missing: [],
  };
}

export function calculate(input = {}) {
  return calculateAims(input);
}
