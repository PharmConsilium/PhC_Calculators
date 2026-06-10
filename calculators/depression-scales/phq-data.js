/**
 * Шкала PHQ (PHQ-9).
 * @see https://medsoftpro.ru/kalkulyatory/phq-scale
 */

const PHQ_OPTIONS = [
  { value: 0, text: 'не каждый день' },
  { value: 1, text: 'несколько дней' },
  { value: 2, text: 'более чем в половине дней' },
  { value: 3, text: 'почти каждый день' },
];

export const PHQ_ITEMS = [
  {
    id: 'pq1',
    label: '1. Отсутствие интереса к происходящим событиям?',
    options: PHQ_OPTIONS,
  },
  {
    id: 'pq2',
    label: '2. Безразличие, подавленность?',
    options: PHQ_OPTIONS,
  },
  {
    id: 'pq3',
    label: '3. Проблемы с засыпанием, бессонница, наоборот спали слишком много?',
    options: PHQ_OPTIONS,
  },
  {
    id: 'pq4',
    label: '4. Чувство усталости или упадок сил?',
    options: PHQ_OPTIONS,
  },
  {
    id: 'pq5',
    label: '5. Отсутствие аппетита или переедание?',
    options: PHQ_OPTIONS,
  },
  {
    id: 'pq6',
    label: '6. Трудно сосредоточиться на чтении или просмотре телевизора?',
    options: PHQ_OPTIONS,
  },
  {
    id: 'pq7',
    label: '7. Двигаетесь или говорите необыкновенно медленно (заторможенность), или наоборот, возбуждены, двигаетесь больше, чем обычно?',
    options: PHQ_OPTIONS,
  },
  {
    id: 'pq8',
    label: '8. Мысли о самоубийстве, или причинении себе вреда?',
    options: PHQ_OPTIONS,
  },
];

export const PHQ_INTERPRETATION_ROWS = [
  { label: 'Минимальная депрессия', range: 'менее 4' },
  { label: 'Легкая депрессия', range: 'от 5 до 9' },
  { label: 'Умеренная депрессия', range: 'от 10 до 14' },
  { label: 'Тяжелая депрессия', range: 'от 15 до 19' },
  { label: 'Крайне тяжелая депрессия', range: 'более 20' },
];
