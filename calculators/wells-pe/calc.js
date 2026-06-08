/**
 * Шкала Уэллса для оценки вероятности ТЭЛА (MSD).
 */

export const CRITERIA = [
  {
    id: 'dvt',
    label: 'Симптомы тромбоза глубоких вен (ТГВ)',
    points: 3,
  },
  {
    id: 'altDx',
    label: 'Ни один альтернативный диагноз лучше не объясняет симптомы заболевания',
    points: 3,
  },
  {
    id: 'tachycardia',
    label: 'Тахикардия с пульсом > 100',
    points: 1.5,
  },
  {
    id: 'immobility',
    label: 'Иммобилизация (≥ 3 дня) или хирургическое вмешательство на протяжении последних четырех недель',
    points: 1.5,
  },
  {
    id: 'history',
    label: 'Тромбоз глубоких вен или тромбоэмболия легочной артерии в анамнезе',
    points: 1.5,
  },
  {
    id: 'hemoptysis',
    label: 'Наличие кровохарканья',
    points: 1,
  },
  {
    id: 'malignancy',
    label: 'Наличие злокачественных новообразований',
    points: 1,
  },
];

export function interpretWellsPe(total) {
  if (total > 6) {
    return { category: 'high', interpretation: 'Высокая вероятность' };
  }
  if (total >= 2 && total <= 6) {
    return { category: 'moderate', interpretation: 'Умеренная вероятность' };
  }
  return { category: 'low', interpretation: 'Низкая вероятность' };
}

export function wellsPeScore(input) {
  let total = 0;
  const selected = [];

  for (const c of CRITERIA) {
    if (input[c.id]) {
      total += c.points;
      selected.push(c.id);
    }
  }

  const { category, interpretation } = interpretWellsPe(total);

  return {
    status: 'OK',
    total,
    category,
    interpretation,
    selected,
  };
}

export function calculate(input) {
  return wellsPeScore(input || {});
}
