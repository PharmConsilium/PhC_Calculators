/**
 * Шкала комы FOUR (Full Outline of UnResponsiveness) — сумма 4 компонентов (0–16 баллов).
 * @see https://medsoftpro.ru/kalkulyatory/four-scale
 */

export const CRITERIA = [
  {
    id: 'eye',
    number: 1,
    label: 'Глазные реакции (E)',
    options: [
      { value: 4, label: 'глаза открыты, слежение и мигание по команде' },
      { value: 3, label: 'глаза открыты, но нет слежения' },
      { value: 2, label: 'глаза закрыты, открываются на громкий звук, но слежения нет' },
      { value: 1, label: 'глаза закрыты, открываются на боль, но слежения нет' },
      { value: 0, label: 'глаза остаются закрытыми в ответ на боль' },
    ],
  },
  {
    id: 'motor',
    number: 2,
    label: 'Двигательные реакции (M)',
    options: [
      { value: 4, label: 'выполняет команды (знак отлично, кулак, знак мира)' },
      { value: 3, label: 'локализует боль' },
      { value: 2, label: 'сгибательный ответ на боль' },
      { value: 1, label: 'разгибательная поза на боль' },
      { value: 0, label: 'нет ответа на боль или генерализованный миоклонический эпистатус' },
    ],
  },
  {
    id: 'brainstem',
    number: 3,
    label: 'Стволовые рефлексы (B)',
    options: [
      { value: 4, label: 'зрачковый и корнеальный рефлексы сохранены' },
      { value: 3, label: 'один зрачок расширен и не реагирует на свет' },
      { value: 2, label: 'зрачковый или роговичный рефлексы отсутствуют' },
      { value: 1, label: 'зрачковый и роговичный рефлексы отсутствуют' },
      { value: 0, label: 'отсутствуют зрачковый, роговичный и кашлевой рефлексы' },
    ],
  },
  {
    id: 'respiration',
    number: 4,
    label: 'Дыхательный паттерн (R)',
    options: [
      { value: 4, label: 'не интубирован, регулярное дыхание' },
      { value: 3, label: 'не интубирован, дыхание Чейн–Стокса' },
      { value: 2, label: 'не интубирован, нерегулярное дыхание' },
      { value: 1, label: 'сопротивляется аппарату ИВЛ' },
      { value: 0, label: 'полностью синхронен с аппаратом ИВЛ или апноэ' },
    ],
  },
];

export const INTERPRETATION_ROWS = [
  { label: 'Ясное сознание', range: '16' },
  { label: 'Сомноленция', range: '15' },
  { label: 'Оглушение', range: '13–14' },
  { label: 'Сопор', range: '9–12' },
  { label: 'Кома', range: '4–8' },
  { label: 'Смерть мозга', range: '0' },
];

export function interpretFourComa(total) {
  if (total === 16) return { category: 'clear', interpretation: 'Ясное сознание' };
  if (total === 15) return { category: 'somnolence', interpretation: 'Сомноленция' };
  if (total >= 13) return { category: 'stupor', interpretation: 'Оглушение' };
  if (total >= 9) return { category: 'sopor', interpretation: 'Сопор' };
  if (total >= 4) return { category: 'coma', interpretation: 'Кома' };
  if (total >= 1) return { category: 'coma', interpretation: 'Кома' };
  return { category: 'brain-death', interpretation: 'Смерть мозга' };
}

/** @deprecated use interpretFourComa */
export const interpretMayoComa = interpretFourComa;

function parseScore(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max || !Number.isInteger(n)) return { error: true };
  return { value: n };
}

export function fourComaScore(input) {
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
  const { category, interpretation } = interpretFourComa(total);

  return {
    status: 'OK',
    total,
    scores,
    category,
    interpretation,
  };
}

/** @deprecated use fourComaScore */
export const mayoComaScore = fourComaScore;

export function calculate(input) {
  const out = fourComaScore(input);
  if (out.status !== 'OK') throw new Error('Выберите значение по каждому критерию');
  return out;
}
