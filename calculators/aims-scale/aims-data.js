/**
 * Шкала AIMS (Abnormal Involuntary Movement Scale).
 * @see https://medsoftpro.ru/kalkulyatory/aims
 */

export const AIMS_SEVERITY_OPTIONS = [
  { value: 0, text: 'отсутствуют', points: 0 },
  { value: 1, text: 'лёгкая степень', points: 1 },
  { value: 2, text: 'умеренная степень', points: 2 },
  { value: 3, text: 'выраженная степень', points: 3 },
  { value: 4, text: 'тяжёлая степень', points: 4 },
];

export const AIMS_GLOBAL_OPTIONS = [
  { value: 0, text: 'отсутствуют/в пределах нормы', points: 0 },
  { value: 1, text: 'лёгкая степень', points: 1 },
  { value: 2, text: 'умеренная степень', points: 2 },
  { value: 3, text: 'выраженная степень', points: 3 },
  { value: 4, text: 'тяжёлая степень', points: 4 },
];

export const AIMS_AWARENESS_OPTIONS = [
  { value: 0, text: 'отсутствует', points: 0 },
  { value: 1, text: 'лёгкая степень', points: 1 },
  { value: 2, text: 'умеренная степень', points: 2 },
  { value: 3, text: 'выраженная степень', points: 3 },
  { value: 4, text: 'осведомлён, страдает', points: 4 },
];

export const AIMS_YES_NO_OPTIONS = [
  { value: 0, text: 'нет', points: 0 },
  { value: 1, text: 'да', points: 1 },
];

export const MOVEMENT_ITEMS = [
  {
    id: 'facial',
    number: 1,
    label: 'Мимические мышцы',
    hint: 'Оценка движений лба, бровей, щёк, окружности глаз',
    options: AIMS_SEVERITY_OPTIONS,
  },
  {
    id: 'lips',
    number: 2,
    label: 'Губы и окружность рта',
    hint: 'Движения губ: сморщивание, надувание, чмокание',
    options: AIMS_SEVERITY_OPTIONS,
  },
  {
    id: 'jaw',
    number: 3,
    label: 'Челюсти',
    hint: 'Кусание, сжимание, жевание, открывание рта',
    options: AIMS_SEVERITY_OPTIONS,
  },
  {
    id: 'tongue',
    number: 4,
    label: 'Язык',
    hint: 'Движения языка внутри и вне рта',
    options: AIMS_SEVERITY_OPTIONS,
  },
  {
    id: 'upperLimbs',
    number: 5,
    label: 'Верхние конечности',
    hint: 'Хореоподобные и атетоидные движения предплечий, запястий, кистей и пальцев',
    options: AIMS_SEVERITY_OPTIONS,
  },
  {
    id: 'lowerLimbs',
    number: 6,
    label: 'Нижние конечности',
    hint: 'Движения ног, коленей, стоп и пальцев ног',
    options: AIMS_SEVERITY_OPTIONS,
  },
  {
    id: 'trunk',
    number: 7,
    label: 'Шея, плечи, бёдра',
    hint: 'Движения туловища: качание, вращение, изгибание',
    options: AIMS_SEVERITY_OPTIONS,
  },
];

export const ADDITIONAL_ITEMS = [
  {
    id: 'severity',
    number: 8,
    label: 'Степень тяжести аномальных движений',
    hint: 'Общая оценка тяжести двигательных нарушений',
    options: AIMS_GLOBAL_OPTIONS,
    resultLabel: 'Степень тяжести аномальных движений',
  },
  {
    id: 'disability',
    number: 9,
    label: 'Ограничения дееспособности',
    hint: 'Влияние двигательных нарушений на повседневную жизнь пациента',
    options: AIMS_GLOBAL_OPTIONS,
    resultLabel: 'Ограничения дееспособности',
  },
  {
    id: 'awareness',
    number: 10,
    label: 'Осознание пациентом аномальных движений',
    hint: 'Насколько пациент осведомлён о своих движениях и как они его беспокоят',
    options: AIMS_AWARENESS_OPTIONS,
    resultLabel: 'Осознание пациентом аномальных движений',
  },
  {
    id: 'dental',
    number: 11,
    label: 'Стоматологический статус',
    hint: 'Наличие текущих проблем с зубами или зубными протезами',
    options: AIMS_YES_NO_OPTIONS,
    resultLabel: 'Стоматологический статус',
    resultFormat: 'dental',
  },
  {
    id: 'dentures',
    number: 12,
    label: 'Ношение зубных протезов',
    hint: 'Носит ли пациент зубные протезы',
    options: AIMS_YES_NO_OPTIONS,
    resultLabel: 'Ношение зубных протезов',
    resultFormat: 'dentures',
  },
];

export const ALL_ITEMS = [...MOVEMENT_ITEMS, ...ADDITIONAL_ITEMS];

export const MOVEMENT_INTERPRETATION_ROWS = [
  { label: 'Низкий балл', range: '0–6', interpretation: 'Двигательные нарушения отсутствуют или минимальны' },
  { label: 'Умеренный балл', range: '7–14', interpretation: 'Умеренные двигательные нарушения' },
  { label: 'Высокий балл', range: '≥ 15', interpretation: 'Выраженные двигательные нарушения' },
];

export function allAimsItemIds() {
  return ALL_ITEMS.map((item) => item.id);
}

export function formatAimsOptionLabel(option) {
  return `${option.points} (${option.text})`;
}

export function formatAimsAdditionalDisplay(item, option) {
  if (item.resultFormat === 'dental') {
    const base = option.points === 1 ? 'Есть проблемы' : 'Нет проблем';
    return `${base} (${option.text})`;
  }
  if (item.resultFormat === 'dentures') {
    const base = option.points === 1 ? 'Да' : 'Нет';
    return `${base} (${option.text})`;
  }
  return `${option.points} (${option.text})`;
}

export function formatAimsAdditionalValue(item, score) {
  const option = item.options.find((opt) => opt.points === score);
  if (!option) return String(score);
  return formatAimsAdditionalDisplay(item, option);
}
