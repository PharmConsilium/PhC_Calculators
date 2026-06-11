/**
 * Шкалы тревоги — GAD-7, Кови, Спилберг, Шихан.
 */

import { GAD7_ITEMS } from './gad7-data.js';
import { COVY_ITEMS } from './covy-data.js';
import { SPIELBERG_REACTIVE, SPIELBERG_TRAIT } from './spielberg-data.js';
import { SHEEHAN_ITEMS } from './sheehan-data.js';

export { GAD7_ITEMS } from './gad7-data.js';
export { GAD7_INTERPRETATION_ROWS } from './gad7-data.js';
export { COVY_ITEMS } from './covy-data.js';
export { COVY_INTERPRETATION_ROWS } from './covy-data.js';
export { SPIELBERG_REACTIVE, SPIELBERG_TRAIT } from './spielberg-data.js';
export { SPIELBERG_INTERPRETATION_ROWS } from './spielberg-data.js';
export { SHEEHAN_ITEMS } from './sheehan-data.js';
export { SHEEHAN_INTERPRETATION_ROWS } from './sheehan-data.js';

export const SCALES = [
  {
    id: 'gad7',
    label: 'Опросник ГТР-7 (GAD-7)',
    hint: 'Опросник ГТР-7 (General Anxiety Disorder-7, GAD-7) — краткий опросник для скрининга и измерения тяжести генерализованного тревожного расстройства (ГТР). Разработан Spitzer et al. в 2006 году.',
  },
  {
    id: 'covy',
    label: 'Шкала тревоги Кови',
    hint: 'Шкала тревоги Кови (Covi Anxiety Scale) — скрининговая шкала для предварительной оценки тревожных расстройств. Не является диагностическим инструментом.',
  },
  {
    id: 'spielberg',
    label: 'Шкала Спилберга-Ханина',
    hint: 'Шкала оценки уровня тревожности Спилберга-Ханина — единственная методика, позволяющая дифференцированно измерять тревожность как личное свойство и как состояние. Предложена Ч. Д. Спилбергером, адаптирована Ю. Л. Ханиным.',
  },
  {
    id: 'sheehan',
    label: 'Шкала тревоги Шихана',
    hint: 'Шкала самооценки тревоги Шихана — инструмент скрининговой диагностики расстройств тревожного спектра у взрослых. Создана в 1983 году на основании симптомов тревожных расстройств и панических атак.',
  },
];

export function getScale(id) {
  return SCALES.find((s) => s.id === id) ?? null;
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

export function interpretGad7(total) {
  if (total <= 4) {
    return { category: 'minimal', interpretation: 'Минимальный уровень тревожности' };
  }
  if (total <= 9) {
    return { category: 'mild', interpretation: 'Умеренный уровень тревожности' };
  }
  if (total <= 14) {
    return { category: 'moderate', interpretation: 'Средний уровень тревожности' };
  }
  return { category: 'severe', interpretation: 'Высокий уровень тревожности' };
}

export function interpretCovy(total) {
  if (total <= 3) {
    return { category: 'none', interpretation: 'Отсутствие тревожного состояния' };
  }
  if (total <= 5) {
    return { category: 'symptoms', interpretation: 'Имеются симптомы тревоги' };
  }
  return { category: 'state', interpretation: 'Тревожное состояние' };
}

export function interpretSpielbergSubscale(total) {
  if (total < 11) {
    return {
      category: 'very-low',
      interpretation: 'Очень низкая тревожность. Можно трактовать состояние как депрессивное, неактивное, с низким уровнем мотиваций',
    };
  }
  if (total <= 30) {
    return { category: 'low', interpretation: 'Низкая тревожность' };
  }
  if (total <= 44) {
    return { category: 'moderate', interpretation: 'Умеренная тревожность' };
  }
  if (total <= 46) {
    return { category: 'high', interpretation: 'Высокая тревожность' };
  }
  return {
    category: 'very-high',
    interpretation: 'Очень высокая тревожность. Может быть связана с наличием невротического конфликта, эмоциональными срывами и с психосоматическими заболеваниями',
  };
}

export function interpretSheehan(total) {
  if (total <= 29) {
    return { category: 'normal', interpretation: 'Отсутствие клинически выраженной тревоги' };
  }
  if (total <= 79) {
    return { category: 'clinical', interpretation: 'Клинически выраженная тревога' };
  }
  return {
    category: 'severe',
    interpretation: 'Тяжелое тревожное расстройство, паническое расстройство',
  };
}

export function calculateGad7(input = {}) {
  return calculateScale(GAD7_ITEMS, input, interpretGad7);
}

export function calculateCovy(input = {}) {
  return calculateScale(COVY_ITEMS, input, interpretCovy);
}

export function calculateSpielberg(input = {}) {
  const reactiveInput = input.reactive ?? input;
  const traitInput = input.trait ?? input;

  const reactive = sumItemScores(SPIELBERG_REACTIVE, reactiveInput);
  const trait = sumItemScores(SPIELBERG_TRAIT, traitInput);

  const reactiveComplete = reactive.missing.length === 0;
  const traitComplete = trait.missing.length === 0;

  if (!reactiveComplete && !traitComplete) {
    return {
      status: 'INCOMPLETE',
      reactiveTotal: null,
      traitTotal: null,
      totalSum: null,
      reactiveCategory: null,
      traitCategory: null,
      reactiveInterpretation: null,
      traitInterpretation: null,
      missing: [...reactive.missing, ...trait.missing],
    };
  }

  const result = {
    status: 'OK',
    reactiveTotal: null,
    traitTotal: null,
    totalSum: null,
    reactiveCategory: null,
    traitCategory: null,
    reactiveInterpretation: null,
    traitInterpretation: null,
    missing: [],
  };

  if (reactiveComplete) {
    const info = interpretSpielbergSubscale(reactive.total);
    result.reactiveTotal = reactive.total;
    result.reactiveCategory = info.category;
    result.reactiveInterpretation = info.interpretation;
  }

  if (traitComplete) {
    const info = interpretSpielbergSubscale(trait.total);
    result.traitTotal = trait.total;
    result.traitCategory = info.category;
    result.traitInterpretation = info.interpretation;
  }

  if (reactiveComplete && traitComplete) {
    result.totalSum = reactive.total + trait.total;
  }

  return result;
}

export function calculateSheehan(input = {}) {
  return calculateScale(SHEEHAN_ITEMS, input, interpretSheehan);
}

export function calculate(input = {}) {
  const scale = input.scale || 'gad7';
  if (scale === 'covy') return { scale, ...calculateCovy(input) };
  if (scale === 'spielberg') return { scale, ...calculateSpielberg(input) };
  if (scale === 'sheehan') return { scale, ...calculateSheehan(input) };
  return { scale: 'gad7', ...calculateGad7(input) };
}
