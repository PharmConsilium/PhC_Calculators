/**
 * Шкала PESI — 30-дневная летальность при ТЭЛА (ByMed / Aujesky et al.).
 */

export const RADIO_CRITERIA = [
  {
    id: 'sex',
    label: 'Пол',
    options: [
      { value: 0, label: 'Женский', points: 0 },
      { value: 1, label: 'Мужской', points: 10 },
    ],
  },
  {
    id: 'malignancy',
    label: 'Злокачественное новообразование',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 30 },
    ],
  },
  {
    id: 'chf',
    label: 'Хроническая сердечная недостаточность',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 10 },
    ],
  },
  {
    id: 'lungDisease',
    label: 'Хроническое заболевание лёгких',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 10 },
    ],
  },
  {
    id: 'heartRate',
    label: 'ЧСС',
    options: [
      { value: 0, label: '< 110 в минуту', points: 0 },
      { value: 1, label: '≥ 110 в минуту', points: 20 },
    ],
  },
  {
    id: 'systolicBp',
    label: 'Систолическое АД',
    options: [
      { value: 0, label: '< 100 мм рт. ст.', points: 30 },
      { value: 1, label: '≥ 100 мм рт. ст.', points: 0 },
    ],
  },
  {
    id: 'respiratoryRate',
    label: 'Частота дыхания',
    options: [
      { value: 0, label: '≤ 30 в минуту', points: 0 },
      { value: 1, label: '> 30 в минуту', points: 20 },
    ],
  },
  {
    id: 'temperature',
    label: 'Температура',
    options: [
      { value: 0, label: '< 36 °C', points: 20 },
      { value: 1, label: '≥ 36 °C', points: 0 },
    ],
  },
  {
    id: 'mentalStatus',
    label: 'Нарушение сознания',
    options: [
      { value: 0, label: 'Нет', points: 0 },
      { value: 1, label: 'Да', points: 60 },
    ],
  },
  {
    id: 'oxygenSat',
    label: 'Сатурация артериальной крови кислородом',
    options: [
      { value: 0, label: '< 90%', points: 20 },
      { value: 1, label: '≥ 90%', points: 0 },
    ],
  },
];

export function interpretPesi(total) {
  if (total <= 65) {
    return {
      riskClass: 'I',
      category: 'very-low',
      interpretation: 'Класс I. Очень низкий риск 30-дневной летальности (0–1,6%)',
    };
  }
  if (total <= 85) {
    return {
      riskClass: 'II',
      category: 'low',
      interpretation: 'Класс II. Низкий риск летальности (1,7–3,5%)',
    };
  }
  if (total <= 105) {
    return {
      riskClass: 'III',
      category: 'moderate',
      interpretation: 'Класс III. Умеренный риск летальности (3,2–7,1%)',
    };
  }
  if (total <= 125) {
    return {
      riskClass: 'IV',
      category: 'high',
      interpretation: 'Класс IV. Высокий риск летальности (4,0–11,4%)',
    };
  }
  return {
    riskClass: 'V',
    category: 'very-high',
    interpretation: 'Класс V. Очень высокий риск летальности (10,0–24,5%)',
  };
}

function parseAge(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 120 || !Number.isInteger(n)) return { error: true };
  return { value: n };
}

function parseSelection(criterion, raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const val = Number(raw);
  if (!Number.isFinite(val)) return { error: true };
  const option = criterion.options.find((o) => o.value === val);
  if (!option) return { error: true };
  return { value: val, points: option.points };
}

export function pesiScore(input) {
  const ageParsed = parseAge(input.age);
  if (!ageParsed) return { status: 'INVALID', missing: 'age' };
  if (ageParsed.error) return { status: 'INVALID' };

  const scores = { age: ageParsed.value };
  let total = ageParsed.value;

  for (const c of RADIO_CRITERIA) {
    const parsed = parseSelection(c, input[c.id]);
    if (!parsed) return { status: 'INVALID', missing: c.id };
    if (parsed.error) return { status: 'INVALID' };
    scores[c.id] = parsed.points;
    total += parsed.points;
  }

  const { riskClass, category, interpretation } = interpretPesi(total);

  return {
    status: 'OK',
    total,
    scores,
    riskClass,
    category,
    interpretation,
  };
}

export function calculate(input) {
  const out = pesiScore(input);
  if (out.status !== 'OK') throw new Error('Заполните все поля');
  return out;
}
