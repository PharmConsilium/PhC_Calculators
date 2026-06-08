/**
 * Женевская шкала (индекс Geneva) — вероятность ТЭЛА (ByMed).
 */

export const CRITERIA = [
  {
    id: 'age',
    label: 'Возраст старше 65 лет',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 1 },
    ],
  },
  {
    id: 'history',
    label: 'Тромбоз глубоких вен или ТЭЛА в анамнезе',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 3 },
    ],
  },
  {
    id: 'surgery',
    label: 'Переломы или хирургические операции в течение месяца',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 2 },
    ],
  },
  {
    id: 'malignancy',
    label: 'Злокачественное новообразование',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 2 },
    ],
  },
  {
    id: 'legPain',
    label: 'Боль в ноге (односторонняя)',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 3 },
    ],
  },
  {
    id: 'hemoptysis',
    label: 'Кровохарканье',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 2 },
    ],
  },
  {
    id: 'edema',
    label: 'Асимметричный отёк нижних конечностей и болезненность при пальпации по ходу вен',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 4 },
    ],
  },
  {
    id: 'heartRate',
    label: 'ЧСС',
    options: [
      { value: 0, label: 'Менее 75 в мин', points: 0 },
      { value: 1, label: '75–94 в мин', points: 3 },
      { value: 2, label: 'Более 94 в мин', points: 5 },
    ],
  },
];

export function interpretGenevaPe(total) {
  if (total >= 11) {
    return { category: 'high', interpretation: 'Высокая клиническая вероятность' };
  }
  if (total >= 4 && total <= 10) {
    return { category: 'intermediate', interpretation: 'Промежуточная клиническая вероятность' };
  }
  return { category: 'low', interpretation: 'Низкая клиническая вероятность' };
}

function parseSelection(criterion, raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const val = Number(raw);
  if (!Number.isFinite(val)) return { error: true };
  const option = criterion.options.find((o) => o.value === val);
  if (!option) return { error: true };
  return { value: val, points: option.points };
}

export function genevaPeScore(input) {
  const scores = {};
  let total = 0;

  for (const c of CRITERIA) {
    const parsed = parseSelection(c, input[c.id]);
    if (!parsed) return { status: 'INVALID', missing: c.id };
    if (parsed.error) return { status: 'INVALID' };
    scores[c.id] = parsed.points;
    total += parsed.points;
  }

  const { category, interpretation } = interpretGenevaPe(total);

  return {
    status: 'OK',
    total,
    scores,
    category,
    interpretation,
  };
}

export function calculate(input) {
  const out = genevaPeScore(input);
  if (out.status !== 'OK') throw new Error('Выберите значение по каждому критерию');
  return out;
}
