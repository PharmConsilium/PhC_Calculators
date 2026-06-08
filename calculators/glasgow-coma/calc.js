/**
 * Шкала комы Глазго (GCS) — сумма 3 компонентов (3–15 баллов).
 */

export const CRITERIA = [
  {
    id: 'eye',
    label: 'Открытие глаз',
    options: [
      { value: 4, label: 'Спонтанное' },
      { value: 3, label: 'По устной команде' },
      { value: 2, label: 'От боли' },
      { value: 1, label: 'Нет' },
    ],
  },
  {
    id: 'motor',
    label: 'Лучшая двигательная реакция',
    options: [
      { value: 6, label: 'Выполняет устные команды' },
      { value: 5, label: 'Локализует болезненные раздражители' },
      { value: 4, label: 'Отмена сгибания от болезненных раздражителей' },
      { value: 3, label: 'Декортикационная реакция на болезненные раздражители' },
      { value: 2, label: 'Децеребрационная реакция на болезненные раздражители' },
      { value: 1, label: 'Нет' },
    ],
  },
  {
    id: 'verbal',
    label: 'Лучшая вербальная реакция',
    options: [
      { value: 5, label: 'Ориентированный разговор' },
      { value: 4, label: 'Дезориентированный разговор' },
      { value: 3, label: 'Неуместные слова' },
      { value: 2, label: 'Непонятные звуки' },
      { value: 1, label: 'Нет' },
    ],
  },
];

export function interpretGcs(total) {
  if (total === 15) return { category: 'normal', interpretation: 'Норма (15 баллов)' };
  if (total >= 13) return { category: 'mild', interpretation: 'Лёгкое нарушение сознания (13–14 баллов)' };
  if (total >= 9) return { category: 'moderate', interpretation: 'Умеренное нарушение сознания (9–12 баллов)' };
  return { category: 'severe', interpretation: 'Тяжёлое нарушение сознания, кома (3–8 баллов)' };
}

function parseScore(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max || !Number.isInteger(n)) return { error: true };
  return { value: n };
}

export function glasgowComaScore(input) {
  const scores = {};
  for (const c of CRITERIA) {
    const min = Math.min(...c.options.map((o) => o.value));
    const max = Math.max(...c.options.map((o) => o.value));
    const parsed = parseScore(input[c.id], min, max);
    if (!parsed) return { status: 'INVALID', missing: c.id };
    if (parsed.error) return { status: 'INVALID' };
    scores[c.id] = parsed.value;
  }

  const total = CRITERIA.reduce((sum, c) => sum + scores[c.id], 0);
  const { category, interpretation } = interpretGcs(total);

  return {
    status: 'OK',
    total,
    scores,
    category,
    interpretation,
  };
}

export function calculate(input) {
  const out = glasgowComaScore(input);
  if (out.status !== 'OK') throw new Error('Выберите значение по каждому критерию');
  return out;
}
