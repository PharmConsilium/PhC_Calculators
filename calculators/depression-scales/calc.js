/**
 * Шкалы оценки депрессии — Бек, Гамильтон, PHQ, EPDS и др.
 */

import { BECK_ITEMS } from './beck-data.js';
import { HAMILTON_CORE, HAMILTON_SUPPLEMENTARY } from './hamilton-data.js';
import { PHQ_ITEMS } from './phq-data.js';
import { EPDS_ITEMS } from './epds-data.js';
import { GDS_ITEMS } from './gds-data.js';
import { HADS_ANXIETY, HADS_DEPRESSION } from './hads-data.js';

export { BECK_ITEMS } from './beck-data.js';
export { BECK_INTERPRETATION_ROWS } from './beck-data.js';
export { HAMILTON_CORE, HAMILTON_SUPPLEMENTARY } from './hamilton-data.js';
export { HAMILTON_INTERPRETATION_ROWS } from './hamilton-data.js';
export { PHQ_ITEMS } from './phq-data.js';
export { PHQ_INTERPRETATION_ROWS } from './phq-data.js';
export { EPDS_ITEMS } from './epds-data.js';
export { EPDS_INTERPRETATION_ROWS } from './epds-data.js';
export { EPDS_NOTES_EXTRA } from './epds-data.js';
export { GDS_ITEMS } from './gds-data.js';
export { GDS_INTERPRETATION_ROWS } from './gds-data.js';
export { HADS_ANXIETY, HADS_DEPRESSION } from './hads-data.js';
export { HADS_ANXIETY_INTERPRETATION_ROWS, HADS_DEPRESSION_INTERPRETATION_ROWS } from './hads-data.js';

export const SCALES = [
  {
    id: 'beck',
    label: 'Шкала Бека',
    hint: 'Опросник депрессии Бека (BDI) — самооценка тяжести депрессивных симптомов.',
  },
  {
    id: 'hamilton',
    label: 'Шкала Гамильтона',
    hint: 'Шкала Гамильтона (HDRS — Hamilton Rating Scale for Depression, HAM-D) — клиническая оценка тяжести депрессии.',
  },
  {
    id: 'phq',
    label: 'Шкала PHQ',
    hint: 'Шкала PHQ (Patient Health Questionnaire) — скрининг депрессии. Шкала была разработана доктором медицинских наук Робертом Л. Спитцером, и его коллегами из Pfizer Inc.',
  },
  {
    id: 'epds',
    label: 'Шкала EPDS',
    tabLabel: 'Послеродовая шкала<br>депрессии EPDS',
    hint: 'Шкала EPDS (Edinburgh Postnatal Depression Scale) — скрининг послеродовой депрессии.',
  },
  {
    id: 'gds',
    label: 'Гериатрическая шкала депрессии',
    hint: 'Гериатрическая шкала депрессии (GDS) — диагностический инструмент для оценки психоэмоционального состояния пожилого человека. Разработана в начале 1980-х учёными из Стэнфорда (США).',
  },
  {
    id: 'hads',
    label: 'Шкала тревоги и депрессии HADS',
    hint: 'Шкала HADS (Hospital Anxiety and Depression Scale) — скрининговая шкала для выявления признаков тревоги и депрессии. Разработана в 1983 году Zigmond A.S. и Snaith R.P.',
  },
];

export function getScale(id) {
  return SCALES.find((s) => s.id === id) ?? null;
}

export function interpretBeck(total) {
  if (total < 10) {
    return { category: 'none', interpretation: 'Отсутствие депрессивных симптомов' };
  }
  if (total <= 15) {
    return { category: 'mild', interpretation: 'Легкая депрессия (субдепрессия)' };
  }
  if (total <= 19) {
    return { category: 'moderate', interpretation: 'Умеренная депрессия' };
  }
  if (total <= 29) {
    return { category: 'marked', interpretation: 'Выраженная депрессия (средней тяжести)' };
  }
  return { category: 'severe', interpretation: 'Тяжелая депрессия' };
}

export function interpretHamilton(total) {
  if (total <= 7) {
    return { category: 'normal', interpretation: 'Норма' };
  }
  if (total <= 13) {
    return { category: 'mild', interpretation: 'Легкое депрессивное расстройство' };
  }
  if (total <= 18) {
    return { category: 'moderate', interpretation: 'Депрессивное расстройство средней степени тяжести' };
  }
  if (total <= 22) {
    return { category: 'severe', interpretation: 'Депрессивное расстройство тяжелой степени' };
  }
  return { category: 'extreme', interpretation: 'Депрессивное расстройство крайне тяжелой степени' };
}

export function interpretPhq(total) {
  if (total < 5) {
    return { category: 'minimal', interpretation: 'Минимальная депрессия' };
  }
  if (total <= 9) {
    return { category: 'mild', interpretation: 'Легкая депрессия' };
  }
  if (total <= 14) {
    return { category: 'moderate', interpretation: 'Умеренная депрессия' };
  }
  if (total <= 19) {
    return { category: 'severe', interpretation: 'Тяжелая депрессия' };
  }
  return { category: 'extreme', interpretation: 'Крайне тяжелая депрессия' };
}

export function interpretEpds(total) {
  if (total <= 9) {
    return { category: 'normal', interpretation: 'Нормальное состояние; риск послеродовой депрессии низкий' };
  }
  if (total <= 12) {
    return { category: 'moderate', interpretation: 'Умеренный риск послеродовой депрессии; рекомендуется наблюдение' };
  }
  return { category: 'high', interpretation: 'Высокий риск послеродовой депрессии; требуется консультация специалиста' };
}

export function interpretGds(total) {
  if (total < 6) {
    return { category: 'normal', interpretation: 'Нет признаков депрессии' };
  }
  return { category: 'depression', interpretation: 'Обнаруживаются признаки депрессии' };
}

export function interpretHadsSubscale(total) {
  if (total < 8) {
    return { category: 'normal', interpretation: 'Норма (отсутствие достоверно выраженных симптомов)' };
  }
  if (total <= 10) {
    return { category: 'subclinical', interpretation: 'Субклинически выраженные симптомы' };
  }
  return { category: 'clinical', interpretation: 'Клинически выраженные симптомы' };
}

export function interpretHadsAnxiety(total) {
  const base = interpretHadsSubscale(total);
  if (base.category === 'normal') {
    return { category: 'normal', interpretation: 'Норма (отсутствие достоверно выраженных симптомов тревоги)' };
  }
  if (base.category === 'subclinical') {
    return { category: 'subclinical', interpretation: 'Субклинически выраженная тревога' };
  }
  return { category: 'clinical', interpretation: 'Клинически выраженная тревога' };
}

export function interpretHadsDepression(total) {
  const base = interpretHadsSubscale(total);
  if (base.category === 'normal') {
    return { category: 'normal', interpretation: 'Норма (отсутствие достоверно выраженных симптомов депрессии)' };
  }
  if (base.category === 'subclinical') {
    return { category: 'subclinical', interpretation: 'Субклинически выраженная депрессия' };
  }
  return { category: 'clinical', interpretation: 'Клинически выраженная депрессия' };
}

function sumItemScores(items, input) {
  let total = 0;
  const missing = [];

  for (const item of items) {
    if (!(item.id in input)) {
      missing.push(item.id);
      continue;
    }
    total += Number(input[item.id]) || 0;
  }

  return { total, missing };
}

function calculateScale(items, input, interpret) {
  const { total, missing } = sumItemScores(items, input);

  if (missing.length) {
    return {
      status: 'INCOMPLETE',
      total: null,
      category: null,
      interpretation: null,
      missing,
    };
  }

  const { category, interpretation } = interpret(total);

  return {
    status: 'OK',
    total,
    category,
    interpretation,
    missing: [],
  };
}

export function calculateBeck(input = {}) {
  return calculateScale(BECK_ITEMS, input, interpretBeck);
}

export function calculateHamilton(input = {}) {
  const core = sumItemScores(HAMILTON_CORE, input.core ?? input);

  if (core.missing.length) {
    return {
      status: 'INCOMPLETE',
      total: null,
      supplementaryTotal: null,
      category: null,
      interpretation: null,
      missing: core.missing,
    };
  }

  const supplementaryInput = input.supplementary ?? {};
  let supplementaryTotal = 0;
  for (const item of HAMILTON_SUPPLEMENTARY) {
    if (item.id in supplementaryInput) {
      supplementaryTotal += Number(supplementaryInput[item.id]) || 0;
    }
  }

  const { category, interpretation } = interpretHamilton(core.total);

  return {
    status: 'OK',
    total: core.total,
    supplementaryTotal,
    category,
    interpretation,
    missing: [],
  };
}

export function calculatePhq(input = {}) {
  return calculateScale(PHQ_ITEMS, input, interpretPhq);
}

export function calculateEpds(input = {}) {
  return calculateScale(EPDS_ITEMS, input, interpretEpds);
}

export function calculateGds(input = {}) {
  return calculateScale(GDS_ITEMS, input, interpretGds);
}

export function calculateHads(input = {}) {
  const anxietyInput = input.anxiety ?? input;
  const depressionInput = input.depression ?? input;

  const anxiety = sumItemScores(HADS_ANXIETY, anxietyInput);
  const depression = sumItemScores(HADS_DEPRESSION, depressionInput);

  const anxietyComplete = anxiety.missing.length === 0;
  const depressionComplete = depression.missing.length === 0;

  if (!anxietyComplete && !depressionComplete) {
    return {
      status: 'INCOMPLETE',
      anxietyTotal: null,
      depressionTotal: null,
      anxietyCategory: null,
      depressionCategory: null,
      anxietyInterpretation: null,
      depressionInterpretation: null,
      missing: [...anxiety.missing, ...depression.missing],
    };
  }

  const result = {
    status: 'OK',
    anxietyTotal: null,
    depressionTotal: null,
    anxietyCategory: null,
    depressionCategory: null,
    anxietyInterpretation: null,
    depressionInterpretation: null,
    missing: [],
  };

  if (anxietyComplete) {
    const anxietyInfo = interpretHadsAnxiety(anxiety.total);
    result.anxietyTotal = anxiety.total;
    result.anxietyCategory = anxietyInfo.category;
    result.anxietyInterpretation = anxietyInfo.interpretation;
  }

  if (depressionComplete) {
    const depressionInfo = interpretHadsDepression(depression.total);
    result.depressionTotal = depression.total;
    result.depressionCategory = depressionInfo.category;
    result.depressionInterpretation = depressionInfo.interpretation;
  }

  return result;
}

export function calculate(input = {}) {
  const scale = input.scale || 'beck';
  if (scale === 'hamilton') return { scale, ...calculateHamilton(input) };
  if (scale === 'phq') return { scale, ...calculatePhq(input) };
  if (scale === 'epds') return { scale, ...calculateEpds(input) };
  if (scale === 'gds') return { scale, ...calculateGds(input) };
  if (scale === 'hads') return { scale, ...calculateHads(input) };
  return { scale: 'beck', ...calculateBeck(input) };
}
