/**
 * Климактерическая шкала Грина (Greene Climacteric Scale).
 * @see https://medsoftpro.ru/kalkulyatory/greene-climacteric-scale
 */

export const GREENE_OPTIONS = [
  { value: 0, text: 'Отсутствует', points: 0 },
  { value: 1, text: 'Слабое проявление', points: 1 },
  { value: 2, text: 'Умеренное проявление', points: 2 },
  { value: 3, text: 'Тяжелое проявление', points: 3 },
];

/** @type {{ id: string, title: string, itemIds: string[] }[]} */
export const GREENE_SECTIONS = [
  {
    id: 'psychological',
    title: 'Психологические симптомы',
    itemIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11'],
  },
  {
    id: 'somatic',
    title: 'Соматические симптомы',
    itemIds: ['q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18'],
  },
  {
    id: 'vasomotor',
    title: 'Вазомоторные симптомы',
    itemIds: ['q19', 'q20'],
  },
  {
    id: 'sexual',
    title: 'Сексуальная функция',
    itemIds: ['q21'],
  },
];

export const GREENE_ITEMS = [
  { id: 'q1', number: 1, label: 'Быстрое или сильное сердцебиение', section: 'psychological' },
  { id: 'q2', number: 2, label: 'Чувство напряженности, нервозности', section: 'psychological' },
  { id: 'q3', number: 3, label: 'Нарушения сна', section: 'psychological' },
  { id: 'q4', number: 4, label: 'Возбудимость', section: 'psychological' },
  { id: 'q5', number: 5, label: 'Приступы тревоги, паники', section: 'psychological' },
  { id: 'q6', number: 6, label: 'Трудности в концентрации внимания', section: 'psychological' },
  { id: 'q7', number: 7, label: 'Чувство усталости или недостатка энергии', section: 'psychological' },
  { id: 'q8', number: 8, label: 'Потеря интереса ко многим вещам', section: 'psychological' },
  { id: 'q9', number: 9, label: 'Чувство недовольства или депрессия', section: 'psychological' },
  { id: 'q10', number: 10, label: 'Плаксивость', section: 'psychological' },
  { id: 'q11', number: 11, label: 'Раздражительность', section: 'psychological' },
  { id: 'q12', number: 12, label: 'Чувство головокружения или обморок', section: 'somatic' },
  { id: 'q13', number: 13, label: 'Давление или напряжение в голове, теле', section: 'somatic' },
  { id: 'q14', number: 14, label: 'Чувство онемения и дрожь в различных частях тела', section: 'somatic' },
  { id: 'q15', number: 15, label: 'Головные боли', section: 'somatic' },
  { id: 'q16', number: 16, label: 'Мышечные и суставные боли', section: 'somatic' },
  { id: 'q17', number: 17, label: 'Слабость в руках или ногах', section: 'somatic' },
  { id: 'q18', number: 18, label: 'Затрудненное дыхание', section: 'somatic' },
  { id: 'q19', number: 19, label: 'Приливы', section: 'vasomotor' },
  { id: 'q20', number: 20, label: 'Ночная потливость', section: 'vasomotor' },
  { id: 'q21', number: 21, label: 'Потеря интереса к сексу', section: 'sexual' },
].map((item) => ({ ...item, options: GREENE_OPTIONS }));

export const GREENE_INTERPRETATION_ROWS = [
  { label: 'Симптомы отсутствуют', range: '0' },
  { label: 'Слабая степень', range: '1–11' },
  { label: 'Средняя степень', range: '12–19' },
  { label: 'Тяжелая степень', range: '20 и более' },
];

export function allGreeneItemIds() {
  return GREENE_ITEMS.map((item) => item.id);
}

export function formatGreenePoints(value) {
  return value === 0 ? '0' : `+${value}`;
}
