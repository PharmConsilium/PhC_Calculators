/**
 * Шкала Апгар — сумма 5 критериев (0–2 балла каждый).
 */

export const CRITERIA = [
  {
    id: 'appearance',
    label: 'Окраска кожи',
    options: [
      { value: 0, label: 'Генерализованная бледность или генерализованный цианоз' },
      { value: 1, label: 'Розовая окраска тела и синюшная окраска конечностей (акроцианоз)' },
      { value: 2, label: 'Розовая окраска всего тела и конечностей' },
    ],
  },
  {
    id: 'pulse',
    label: 'Частота сердечных сокращений',
    options: [
      { value: 0, label: 'Отсутствует' },
      { value: 1, label: 'Менее 100 ударов в минуту' },
      { value: 2, label: '100 и более ударов в минуту' },
    ],
  },
  {
    id: 'grimace',
    label: 'Рефлекторная возбудимость',
    options: [
      { value: 0, label: 'Не реагирует' },
      { value: 1, label: 'Реакция слабо выражена (гримаса, движение)' },
      { value: 2, label: 'Реакция в виде движения, кашля, чихания, громкого крика' },
    ],
  },
  {
    id: 'activity',
    label: 'Мышечный тонус',
    options: [
      { value: 0, label: 'Отсутствует, конечности свисают' },
      { value: 1, label: 'Снижен, некоторое сгибание конечностей' },
      { value: 2, label: 'Выражены активные движения' },
    ],
  },
  {
    id: 'respiration',
    label: 'Дыхание',
    options: [
      { value: 0, label: 'Отсутствует' },
      { value: 1, label: 'Нерегулярное, крик слабый (гиповентиляция)' },
      { value: 2, label: 'Нормальное, крик громкий' },
    ],
  },
];

export function interpretApgar(total) {
  if (total >= 7) return { category: 'normal', interpretation: 'Нормальная оценка (7–10 баллов)' };
  if (total >= 4) return { category: 'intermediate', interpretation: 'Промежуточная оценка (4–6 баллов)' };
  return { category: 'low', interpretation: 'Низкая оценка (0–3 балла)' };
}

function parseScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 2 || !Number.isInteger(n)) return { error: true };
  return { value: n };
}

export function apgarScore(input) {
  const scores = {};
  for (const c of CRITERIA) {
    const parsed = parseScore(input[c.id]);
    if (!parsed) return { status: 'INVALID', missing: c.id };
    if (parsed.error) return { status: 'INVALID' };
    scores[c.id] = parsed.value;
  }

  const total = CRITERIA.reduce((sum, c) => sum + scores[c.id], 0);
  const { category, interpretation } = interpretApgar(total);

  return {
    status: 'OK',
    total,
    scores,
    category,
    interpretation,
  };
}

export function calculate(input) {
  const out = apgarScore(input);
  if (out.status !== 'OK') throw new Error('Выберите значение по каждому критерию');
  return out;
}
