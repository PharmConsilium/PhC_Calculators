/**
 * Шкалы оценки психического статуса — MMSE и FAB.
 */

import {
  MMSE_SECTIONS,
  MMSE_MAX,
  allMmseItemIds,
  getMmseInterpretations,
  getMmseCategory,
} from './mmse-data.js';
import {
  FAB_RADIO_ITEMS,
  FAB_FLUENCY,
  scoreFabFluency,
  allFabRequiredIds,
  interpretFabResult,
  buildFabBreakdown,
} from './fab-data.js';

export {
  MMSE_SECTIONS,
  MMSE_MAX,
  MMSE_SCREENING_ROWS,
  MMSE_EDUCATION_ROWS,
  MMSE_SEVERITY_ROWS,
  MMSE_ALZHEIMER_ROWS,
  getMmseInterpretations,
  getMmseCategory,
} from './mmse-data.js';
export {
  FAB_RADIO_ITEMS,
  FAB_FLUENCY,
  FAB_INTERPRETATION_ROWS,
  FAB_FLUENCY_SCORING_ROWS,
  scoreFabFluency,
  interpretFabResult,
  buildFabBreakdown,
} from './fab-data.js';

export const SCALES = [
  {
    id: 'mmse',
    label: 'Шкала MMSE',
    tabLabel: 'MMSE',
    hint: 'Краткая шкала оценки психического статуса (Mini-Mental State Examination, MMSE) — скрининговый тест для объективной оценки когнитивных функций. Максимум 30 баллов.',
  },
  {
    id: 'fab',
    label: 'Шкала FAB',
    tabLabel: 'FAB',
    hint: 'Батарея лобной дисфункции (Frontal Assessment Battery, FAB) — методика для скрининга деменций с преимущественным поражением лобных долей. Максимум 18 баллов.',
  },
];

export function getScale(id) {
  return SCALES.find((s) => s.id === id) ?? null;
}

export function interpretMmse(total) {
  const interpretations = getMmseInterpretations(total);
  return {
    category: getMmseCategory(total),
    interpretation: interpretations.simple.text,
    interpretations,
  };
}

export function interpretFab(total) {
  return interpretFabResult(total);
}

export function calculateMmse(input = {}) {
  let total = 0;

  for (const section of MMSE_SECTIONS) {
    for (const item of section.items) {
      if (input[item.id]) total += 1;
    }
  }

  const { category, interpretation, interpretations } = interpretMmse(total);

  return {
    status: 'OK',
    total,
    max: MMSE_MAX,
    category,
    interpretation,
    interpretations,
  };
}

export function calculateFab(input = {}) {
  const missing = [];
  let total = 0;

  for (const item of FAB_RADIO_ITEMS) {
    if (!(item.id in input)) {
      missing.push(item.id);
      continue;
    }
    total += Number(input[item.id]) || 0;
  }

  const fluencyRaw = input[FAB_FLUENCY.id];
  if (fluencyRaw === undefined || fluencyRaw === null || fluencyRaw === '') {
    missing.push(FAB_FLUENCY.id);
  } else {
    const fluencyScore = scoreFabFluency(fluencyRaw);
    if (fluencyScore === null) {
      missing.push(FAB_FLUENCY.id);
    } else {
      total += fluencyScore;
    }
  }

  if (missing.length) {
    return {
      status: 'INCOMPLETE',
      total: null,
      max: 18,
      category: null,
      interpretation: null,
      breakdown: null,
      summary: null,
      missing,
    };
  }

  const breakdown = buildFabBreakdown(input);
  const summary = interpretFabResult(total);

  return {
    status: 'OK',
    total,
    max: 18,
    category: summary.category,
    interpretation: summary.interpretation,
    breakdown,
    summary,
    missing: [],
  };
}

export function calculate(input = {}) {
  const scale = input.scale || 'mmse';
  if (scale === 'fab') return { scale: 'fab', ...calculateFab(input) };
  return { scale: 'mmse', ...calculateMmse(input) };
}

export { allMmseItemIds, allFabRequiredIds };
