/**
 * Шкала комы Мэйо (FOUR) — сумма 4 компонентов (0–16 баллов).
 */

export const CRITERIA = [
  {
    id: 'eye',
    label: 'Глазные реакции (E)',
    options: [
      { value: 4, label: 'Глаза открыты, слежение и мигание по команде' },
      { value: 3, label: 'Глаза открыты, но нет слежения' },
      { value: 2, label: 'Глаза закрыты, открываются на громкий звук, но слежения нет' },
      { value: 1, label: 'Глаза закрыты, открываются на боль, но слежения нет' },
      { value: 0, label: 'Глаза остаются закрытыми в ответ на боль' },
    ],
  },
  {
    id: 'motor',
    label: 'Двигательные реакции (M)',
    options: [
      { value: 4, label: 'Выполняет команды (знак отлично, кулак, знак мира)' },
      { value: 3, label: 'Локализует боль' },
      { value: 2, label: 'Сгибательный ответ на боль' },
      { value: 1, label: 'Разгибательная поза на боль' },
      { value: 0, label: 'Нет ответа на боль или генерализованный миоклонический эпистатус' },
    ],
  },
  {
    id: 'brainstem',
    label: 'Стволовые рефлексы (B)',
    options: [
      { value: 4, label: 'Зрачковый и роговичный рефлексы сохранены' },
      { value: 3, label: 'Один зрачок расширен и не реагирует на свет' },
      { value: 2, label: 'Зрачковый или роговичный рефлекс отсутствует' },
      { value: 1, label: 'Зрачковый и роговичный рефлексы отсутствуют' },
      { value: 0, label: 'Отсутствуют зрачковый, роговичный и кашлевой рефлексы' },
    ],
  },
  {
    id: 'respiration',
    label: 'Дыхательный паттерн (R)',
    options: [
      { value: 4, label: 'Не интубирован, регулярное дыхание' },
      { value: 3, label: 'Не интубирован, дыхание Чейн–Стокса' },
      { value: 2, label: 'Не интубирован, нерегулярное дыхание' },
      { value: 1, label: 'Сопротивляется аппарату ИВЛ' },
      { value: 0, label: 'Полностью синхронен с аппаратом ИВЛ или апноэ' },
    ],
  },
];

export function interpretMayoComa(total) {
  if (total === 16) return { category: 'clear', interpretation: 'Сознание ясное' };
  if (total === 15) return { category: 'somnolence', interpretation: 'Сомноленция' };
  if (total === 14) return { category: 'stupor', interpretation: 'Оглушение' };
  if (total >= 9 && total <= 13) return { category: 'sopor', interpretation: 'Сопор' };
  if (total >= 4 && total <= 8) return { category: 'coma', interpretation: 'Кома' };
  return { category: 'brain-death', interpretation: 'Смерть мозга' };
}

function parseScore(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max || !Number.isInteger(n)) return { error: true };
  return { value: n };
}

export function mayoComaScore(input) {
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
  const { category, interpretation } = interpretMayoComa(total);

  return {
    status: 'OK',
    total,
    scores,
    category,
    interpretation,
  };
}

export function calculate(input) {
  const out = mayoComaScore(input);
  if (out.status !== 'OK') throw new Error('Выберите значение по каждому критерию');
  return out;
}
