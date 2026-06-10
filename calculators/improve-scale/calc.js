/**
 * Шкала IMPROVE (IMPROVE Risk Score) — риск ТГВ/ТЭЛА у нехирургических больных.
 * @see https://medsoftpro.ru/kalkulyatory/improve-scale
 */

export const CRITERIA = [
  {
    id: 'vteHistory',
    number: 1,
    label: 'Венозные тромбоэмболические осложнения в анамнезе',
    points: 3,
  },
  {
    id: 'thrombophilia',
    number: 2,
    label: 'Известная тромбофилия (дефицит протеина C или S, фактор V Лейден, волчаночный антикоагулянт)',
    points: 2,
  },
  {
    id: 'limbParesis',
    number: 3,
    label: 'Парез или паралич нижних конечностей',
    points: 2,
  },
  {
    id: 'malignancy',
    number: 4,
    label: 'Злокачественное новообразование (кроме меланомы кожи) в любое время последние 5 лет',
    points: 2,
  },
  {
    id: 'icu',
    number: 5,
    label: 'Пребывание в отделении (блоке) интенсивной терапии',
    points: 1,
  },
  {
    id: 'immobilization',
    number: 6,
    label: 'Полная иммобилизация 7 дней и более (нахождение в кровати или на стуле с выходом в туалет или без него)',
    points: 1,
  },
  {
    id: 'age60',
    number: 7,
    label: 'Возраст старше 60 лет',
    points: 1,
  },
];

export const MAX_SCORE = CRITERIA.reduce((sum, c) => sum + c.points, 0);

export function interpretImprove(total) {
  if (total >= 4) {
    return { category: 'high', interpretation: 'Высокий риск развития ТГВ/ТЭЛА' };
  }
  if (total >= 2) {
    return { category: 'moderate', interpretation: 'Умеренный риск развития ТГВ/ТЭЛА' };
  }
  return { category: 'low', interpretation: 'Низкий риск развития ТГВ/ТЭЛА' };
}

export function improveScore(input) {
  let total = 0;
  const selected = [];

  for (const c of CRITERIA) {
    if (input[c.id]) {
      total += c.points;
      selected.push(c.id);
    }
  }

  const { category, interpretation } = interpretImprove(total);

  return {
    status: 'OK',
    total,
    category,
    interpretation,
    selected,
  };
}

export function calculate(input) {
  return improveScore(input || {});
}
