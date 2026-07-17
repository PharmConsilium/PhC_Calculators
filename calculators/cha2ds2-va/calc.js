/**
 * CHA₂DS₂-VA — оценка риска инсульта при фибрилляции предсердий.
 * Актуализированная версия CHA₂DS₂-VASc без учёта пола.
 * Источник: Champse et al., Eur Heart J. 2024; мобильное приложение Calculators_MobileApp.
 */

export const CRITERIA = [
  {
    id: 'age',
    label: 'Возраст',
    options: [
      { value: 'lt65', label: '<65', points: 0 },
      { value: '65_74', label: '65–74', points: 1 },
      { value: 'ge75', label: '≥75', points: 2 },
    ],
  },
  {
    id: 'heartFailure',
    label: 'Хроническая сердечная недостаточность',
    options: [
      { value: 'no', label: 'Нет', points: 0 },
      { value: 'yes', label: 'Да', points: 1 },
    ],
  },
  {
    id: 'hypertension',
    label: 'Гипертония',
    options: [
      { value: 'no', label: 'Нет', points: 0 },
      { value: 'yes', label: 'Да', points: 1 },
    ],
  },
  {
    id: 'stroke',
    label:
      'Перенесённый ранее инсульт, транзиторная ишемическая атака или артериальная тромбоэмболия',
    options: [
      { value: 'no', label: 'Нет', points: 0 },
      { value: 'yes', label: 'Да', points: 2 },
    ],
  },
  {
    id: 'vascular',
    label: 'Сосудистые заболевания',
    options: [
      { value: 'no', label: 'Нет', points: 0 },
      { value: 'yes', label: 'Да', points: 1 },
    ],
  },
  {
    id: 'diabetes',
    label: 'Сахарный диабет',
    options: [
      { value: 'no', label: 'Нет', points: 0 },
      { value: 'yes', label: 'Да', points: 1 },
    ],
  },
];

const STROKE_RATES = {
  0: '0,5',
  1: '1,5',
  2: '2,9',
  3: '5,1',
  4: '7,3',
  5: '11,2',
  6: '15,5',
  7: '14,7',
  8: '19,5',
};

export function formatPoints(points) {
  if (points === 0) return '0';
  return `+${points}`;
}

export function scoreWord(total) {
  const abs = Math.abs(total);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'баллов';
  if (mod10 === 1) return 'балл';
  if (mod10 >= 2 && mod10 <= 4) return 'балла';
  return 'баллов';
}

export function pluralBalls(total) {
  return `${total} ${scoreWord(total)}`;
}

export function strokeRateLabel(total) {
  const rate = STROKE_RATES[Math.min(total, 8)] ?? STROKE_RATES[8];
  return `Частота ишемического инсульта: ${rate} случая на 100 пациенто-лет.`;
}

export function interpretCha2ds2Va(total) {
  const strokeRate = STROKE_RATES[Math.min(total, 8)] ?? STROKE_RATES[8];

  if (total === 0) {
    return {
      category: 'none',
      recommendation: 'Антикоагулянтная терапия не рекомендуется.',
      strokeRate,
    };
  }

  if (total === 1) {
    return {
      category: 'consider',
      recommendation: 'Следует рассмотреть возможность назначения антикоагулянтов.',
      strokeRate,
    };
  }

  return {
    category: 'recommended',
    recommendation: 'Рекомендуется антикоагулянтная терапия.',
    strokeRate,
  };
}

export function isReady(input) {
  return CRITERIA.every((c) => {
    const v = input[c.id];
    return v != null && String(v).trim() !== '';
  });
}

export function calculate(input) {
  if (!isReady(input || {})) {
    throw new Error('Заполните все поля');
  }

  let total = 0;
  for (const criterion of CRITERIA) {
    const selected = criterion.options.find((o) => o.value === input[criterion.id]);
    if (!selected) throw new Error('Заполните все поля');
    total += selected.points;
  }

  const { category, recommendation, strokeRate } = interpretCha2ds2Va(total);

  return {
    total,
    score: total,
    value: total,
    category,
    recommendation,
    strokeRate,
    strokeRateText: strokeRateLabel(total),
    interpretation: recommendation,
  };
}
