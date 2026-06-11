/**
 * Шкала Веллса (Wells' Criteria) — клиническая вероятность ТЭЛА.
 * @see https://medsoftpro.ru/kalkulyatory/wells-scale
 */

export const CRITERIA = [
  {
    id: 'history',
    label: 'Предшествующие ТЭЛА или ТГВ',
    points: 1.5,
  },
  {
    id: 'tachycardia',
    label: 'ЧСС ≥ 100 в минуту',
    points: 1.5,
  },
  {
    id: 'immobility',
    label: 'Хирургические операции или иммобилизация в предшествующие 4 нед.',
    points: 1.5,
  },
  {
    id: 'hemoptysis',
    label: 'Кровохарканье',
    points: 1,
  },
  {
    id: 'malignancy',
    label: 'Активное злокачественное новообразование',
    points: 1,
  },
  {
    id: 'dvtSigns',
    label: 'Клинические признаки ТГВ',
    points: 3,
  },
  {
    id: 'altDx',
    label: 'Альтернативный диагноз менее вероятен, чем ТЭЛА',
    points: 3,
  },
];

export const THREE_LEVEL_ROWS = [
  { label: 'низкая', range: 'от 0 до 1' },
  { label: 'средняя', range: 'от 2 до 6' },
  { label: 'высокая', range: 'более 7' },
];

export const TWO_LEVEL_ROWS = [
  { label: 'ТЭЛА маловероятна', range: 'от 0 до 4' },
  { label: 'ТЭЛА вероятна', range: 'более 5' },
];

/** Логика medsoftpro.ru: handler_scale_wells() */
export function interpretThreeLevel(total) {
  let label;
  if (total <= 1) label = 'низкая';
  if (total > 2 && total < 7) label = 'средняя';
  if (total >= 5) label = 'высокая';

  if (label === 'высокая') return { category: 'high', label };
  if (label === 'средняя') return { category: 'moderate', label };
  if (label === 'низкая') return { category: 'low', label };
  return { category: 'moderate', label: 'средняя' };
}

export function interpretTwoLevel(total) {
  if (total >= 5) return { category: 'likely', label: 'ТЭЛА вероятна' };
  return { category: 'unlikely', label: 'ТЭЛА маловероятна' };
}

export function wellsScaleScore(input) {
  let total = 0;
  const selected = [];

  for (const c of CRITERIA) {
    if (input[c.id]) {
      total += c.points;
      selected.push(c.id);
    }
  }

  const threeLevel = interpretThreeLevel(total);
  const twoLevel = interpretTwoLevel(total);

  return {
    status: 'OK',
    total,
    threeLevel,
    twoLevel,
    interpretation: `Клиническая вероятность ТЭЛА по трехуровневой шкале: ${threeLevel.label}, по двухуровневой шкале: ${twoLevel.label}`,
    selected,
  };
}

export function calculate(input) {
  return wellsScaleScore(input || {});
}
