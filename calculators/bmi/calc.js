/**
 * ИМТ (BMI) = масса (кг) / рост (м)²
 * Классификация: ВОЗ, взрослые ≥18 лет.
 * При ИМТ ≥ 25 — антропометрические критерии (окружность талии, ОТ/ОБ, ОТ/рост).
 */

export const SEX_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];

/** Пороги для лиц европеоидной расы */
export const ANTHRO_THRESHOLDS = {
  waistCm: { male: 102, female: 88 },
  whr: { male: 0.9, female: 0.85 },
  whtr: 0.5,
};

export function defaultInputs() {
  return {
    weightKg: '',
    heightCm: '',
    sex: 'male',
    waistCm: '',
    hipCm: '',
  };
}

export function parsePositive(raw) {
  const n = Number(String(raw ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function round3(n) {
  return Math.round(n * 1000) / 1000;
}

export function formatRu(n, digits = 2) {
  return n.toFixed(digits).replace('.', ',');
}

/** Как на farmconsilium: границы через <= (18,5 и 25 попадают в «нижнюю» категорию таблицы). */
export function interpretBmi(bmi) {
  if (bmi <= 16) return 'Выраженный дефицит массы тела';
  if (bmi <= 18.5) return 'Недостаточная (дефицит) масса тела';
  if (bmi <= 25) return 'Норма';
  if (bmi <= 30) return 'Избыточная масса тела (предожирение)';
  if (bmi <= 35) return 'Ожирение первой степени';
  if (bmi <= 40) return 'Ожирение второй степени';
  return 'Ожирение третьей степени (морбидное)';
}

export function categoryKey(bmi) {
  if (bmi <= 18.5) return 'underweight';
  if (bmi <= 25) return 'normal';
  if (bmi <= 30) return 'overweight';
  return 'obese';
}

export function needsAnthropometry(bmi) {
  return Number.isFinite(bmi);
}

/** Рекомендации при избыточной массе / ожирении (ИМТ > 25). */
export function buildRecommendations(weightKg, bmi) {
  if (!Number.isFinite(bmi) || bmi <= 25) return null;
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;

  const loss5 = round2(weightKg * 0.05);
  const loss10 = round2(weightKg * 0.1);
  const targetHigh = round2(weightKg - loss5);
  const targetLow = round2(weightKg - loss10);

  return {
    items: [
      `Цель: снизить массу на 5–10% за 3–6 месяцев терапии и удержать результат в течение года (ориентир: −${formatRu(loss5, loss5 % 1 === 0 ? 0 : 1)}…−${formatRu(loss10, loss10 % 1 === 0 ? 0 : 1)} кг → ${formatRu(targetLow, targetLow % 1 === 0 ? 0 : 1)}–${formatRu(targetHigh, targetHigh % 1 === 0 ? 0 : 1)} кг).`,
      'Обязательные обследования: ОАК, ОАМ, биохимический анализ крови (глюкоза плазмы, липидограмма, функция почек и печени), ЭКГ, ТТГ.',
      'Немедикаментозное лечение: модификация образа жизни — индивидуализация целей, поэтапное снижение веса, контроль факторов риска и сопутствующих заболеваний; мотивационное консультирование и обучение пациента.',
      'Наблюдение: в среднем 1 раз в месяц первые 3 месяца, затем 1 раз в 3 месяца в течение первого года, далее не реже 1 раза в 6 месяцев (план лечения, мотивация, антропометрия, клиника).',
    ],
    loss5Kg: loss5,
    loss10Kg: loss10,
    targetWeightLowKg: targetLow,
    targetWeightHighKg: targetHigh,
  };
}

/**
 * Оценка антропометрических критериев избыточного накопления жировой ткани.
 * Положительный критерий — значение на пороге или выше (для ОТ) / строго выше (для отношений).
 */
export function evaluateAnthropometry({ sex, waistCm, hipCm, heightCm }) {
  const s = sex === 'female' ? 'female' : 'male';
  const waist = Number(waistCm);
  const hip = Number(hipCm);
  const height = Number(heightCm);

  if (!Number.isFinite(waist) || waist <= 0) {
    throw new Error('Укажите окружность талии');
  }
  if (!Number.isFinite(hip) || hip <= 0) {
    throw new Error('Укажите окружность бёдер');
  }
  if (!Number.isFinite(height) || height <= 0) {
    throw new Error('Укажите рост');
  }

  const waistLimit = ANTHRO_THRESHOLDS.waistCm[s];
  const whrLimit = ANTHRO_THRESHOLDS.whr[s];
  const whtrLimit = ANTHRO_THRESHOLDS.whtr;

  const whr = round3(waist / hip);
  const whtr = round3(waist / height);

  const waistElevated = waist >= waistLimit;
  const whrElevated = whr > whrLimit;
  const whtrElevated = whtr > whtrLimit;
  const confirmed = waistElevated || whrElevated || whtrElevated;

  return {
    sex: s,
    waistCm: round2(waist),
    hipCm: round2(hip),
    heightCm: round2(height),
    waistLimit,
    whr,
    whrLimit,
    whtr,
    whtrLimit,
    waistElevated,
    whrElevated,
    whtrElevated,
    confirmed,
    summary: confirmed
      ? 'Избыточное накопление жировой ткани подтверждено (≥1 критерий)'
      : 'Критерии избыточного накопления жировой ткани не выполнены',
  };
}

export function calculateBsaDubois(weightKg, heightCm) {
  const bsa = (Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725)) / 139.2;
  const value = Math.round(bsa * 100) / 100;
  return {
    bsaM2: value,
    bsaLabel: formatRu(value),
  };
}

export function isReady(input) {
  const w = parsePositive(input?.weightKg);
  const h = parsePositive(input?.heightCm);
  return w != null && h != null;
}

export function isAnthroReady(input) {
  return (
    parsePositive(input?.waistCm) != null && parsePositive(input?.hipCm) != null
  );
}

export function calculate(input) {
  const weightKg = parsePositive(input?.weightKg) ?? Number(input?.weightKg);
  const heightCm = parsePositive(input?.heightCm) ?? Number(input?.heightCm);

  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    throw new Error('Укажите массу от 1 до 500 кг');
  }
  if (!Number.isFinite(heightCm) || heightCm < 50 || heightCm > 250) {
    throw new Error('Укажите рост от 50 до 250 см');
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  // как на farmconsilium: toFixed(2), без Math.round — одинаковое отображение
  const valueLabel = bmi.toFixed(2);
  const value = Number(valueLabel);
  const needsAnthro = needsAnthropometry(bmi);
  const { bsaM2, bsaLabel } = calculateBsaDubois(weightKg, heightCm);

  const result = {
    value,
    valueLabel,
    interpretation: interpretBmi(bmi),
    category: categoryKey(bmi),
    needsAnthropometry: needsAnthro,
    heightCm: round2(heightCm),
    weightKg: round2(weightKg),
    bsaM2,
    bsaLabel,
    recommendations: buildRecommendations(weightKg, bmi),
    anthropometry: null,
  };

  if (needsAnthro && isAnthroReady(input)) {
    result.anthropometry = evaluateAnthropometry({
      sex: input?.sex,
      waistCm: parsePositive(input.waistCm),
      hipCm: parsePositive(input.hipCm),
      heightCm,
    });
  }

  return result;
}
