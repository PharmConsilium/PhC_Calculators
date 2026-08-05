/**
 * Оценка функции почек: CKD-EPI 2021, Cockcroft-Gault, CKiD/Schwartz, U25, BSA, KDIGO.
 * Порт из Calculators_MobileApp/packages/calc-core/src/renal-function.ts
 */

const UMOL_TO_MG_DL = 88.4;
const ML_MIN_TO_ML_S = 0.0167;

export const FORMULAS = [
  { id: 'ckd-epi', label: 'CKD-EPIcr 2021' },
  { id: 'ckd-epi-cys', label: 'CKD-EPIcr-cys' },
  { id: 'ckd-epi-cys-only', label: 'CKD-EPI eGFRcys 2021' },
  { id: 'cockcroft', label: 'Cockcroft-Gault' },
  { id: 'ckid-schwartz', label: 'CKiD (Schwartz)' },
  { id: 'ckid-u25', label: 'CKiD U25' },
];

export const CREATININE_UNITS = [
  { id: 'umol', label: 'мкмоль/л' },
  { id: 'mgdl', label: 'мг/дл' },
];

export const ALBUMINURIA_OPTIONS = [
  { id: 'a1', label: 'Лёгкая (A1)', detail: '<30 мг/г (<3 мг/ммоль)' },
  { id: 'a2', label: 'Умеренная (A2)', detail: '30–300 мг/г (3–30 мг/ммоль)' },
  { id: 'a3', label: 'Тяжёлая (A3)', detail: '>300 мг/г (>30 мг/ммоль)' },
];

export const KDIGO_RISK_LABELS = {
  low: 'Низкий риск',
  moderate: 'Умеренный риск',
  high: 'Высокий риск',
  'very-high': 'Очень высокий риск',
};

function parsePositive(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseNonNegative(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function round0(n) {
  return Math.round(n);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function formatRu(n, digits) {
  if (digits == null) return String(n).replace('.', ',');
  return n.toFixed(digits).replace('.', ',');
}

function isFemale(input) {
  return input.gender === 'female';
}

function creatinineMgDl(value, unit) {
  return unit === 'mgdl' ? value : value / UMOL_TO_MG_DL;
}

function creatinineUmol(value, unit) {
  return unit === 'mgdl' ? value * UMOL_TO_MG_DL : value;
}

export function calculateBsaM2(heightCm, weightKg) {
  return 0.007184 * weightKg ** 0.425 * heightCm ** 0.725;
}

export function absoluteGfr(egfrIndexed, bsaM2) {
  return (egfrIndexed * bsaM2) / 1.73;
}

export function toMlPerSecond(mlMin) {
  return round2(mlMin * ML_MIN_TO_ML_S);
}

export function interpretGfrCategory(egfr) {
  if (egfr >= 90) {
    return { code: 'G1', stage: '1', range: '≥90', description: 'повреждение почек при нормальной функции' };
  }
  if (egfr >= 60) {
    return { code: 'G2', stage: '2', range: '60–89', description: 'повреждение почек при лёгком снижении функции' };
  }
  if (egfr >= 45) {
    return { code: 'G3a', stage: '3a', range: '45–59', description: 'лёгкое или умеренное снижение функции' };
  }
  if (egfr >= 30) {
    return { code: 'G3b', stage: '3b', range: '30–44', description: 'умеренное или выраженное снижение функции' };
  }
  if (egfr >= 15) {
    return { code: 'G4', stage: '4', range: '15–29', description: 'выраженное снижение функции' };
  }
  return { code: 'G5', stage: '5', range: '<15', description: 'почечная недостаточность' };
}

export function formatGfrStageLabel(category) {
  return `Стадия ${category.stage} (СКФ ${category.range}): ${category.description}`;
}

const KDIGO_RISK = {
  G1: { a1: 'low', a2: 'moderate', a3: 'high' },
  G2: { a1: 'low', a2: 'moderate', a3: 'high' },
  G3a: { a1: 'moderate', a2: 'high', a3: 'very-high' },
  G3b: { a1: 'high', a2: 'very-high', a3: 'very-high' },
  G4: { a1: 'very-high', a2: 'very-high', a3: 'very-high' },
  G5: { a1: 'very-high', a2: 'very-high', a3: 'very-high' },
};

export function interpretKdigoRisk(gCode, albuminuria) {
  const risk = KDIGO_RISK[gCode]?.[albuminuria] ?? 'moderate';
  return { code: risk, label: KDIGO_RISK_LABELS[risk] };
}

export function parseAlbuminuria(value) {
  if (value === 'a1' || value === 'a2' || value === 'a3') return value;
  return null;
}

export function calculateCockcroftGault(input) {
  const age = parseNonNegative(input.age);
  const weight = parsePositive(input.weightKg);
  const creatinineVal = parsePositive(input.creatinine);
  if (age == null || weight == null || creatinineVal == null) {
    throw new Error('Заполните все поля');
  }

  const creatinine = creatinineMgDl(creatinineVal, input.creatinineUnit);
  let result = ((140 - age) * weight) / (72 * creatinine);
  if (isFemale(input)) result *= 0.85;

  return {
    formula: 'cockcroft',
    value: round2(result),
    unit: 'мл/мин',
    label: 'Клиренс креатинина (Cockcroft-Gault)',
    valueMlS: toMlPerSecond(result),
  };
}

function ckidU25K(age, female) {
  if (!female) {
    if (age < 12) return 39 * 1.008 ** (age - 12);
    if (age < 18) return 39 * 1.045 ** (age - 12);
    return 50.8;
  }
  if (age < 12) return 36.1 * 1.008 ** (age - 12);
  if (age < 18) return 36.1 * 1.023 ** (age - 12);
  return 41.4;
}

export function calculateCkidU25(input) {
  const age = parsePositive(input.age);
  if (age == null || age < 1 || age > 25) {
    throw new Error('Возраст должен быть от 1 до 25 лет');
  }

  const heightCm = parsePositive(input.heightCm);
  const creatinineVal = parsePositive(input.creatinine);
  if (heightCm == null || creatinineVal == null) {
    throw new Error('Заполните рост и креатинин');
  }

  const heightM = heightCm / 100;
  const scr = creatinineMgDl(creatinineVal, input.creatinineUnit);
  const k = ckidU25K(age, isFemale(input));
  const value = k * (heightM / scr);

  return {
    formula: 'ckid-u25',
    value: round1(value),
    unit: 'мл/мин/1,73м²',
    label: 'СКФ (CKiD U25)',
    category: interpretGfrCategory(value),
    valueMlS: toMlPerSecond(value),
  };
}

export function calculateCkdEpi2021(input) {
  const scrVal = parsePositive(input.creatinine);
  const age = parseNonNegative(input.age);
  if (scrVal == null || age == null) throw new Error('Заполните все поля');
  if (age < 18) throw new Error('CKD-EPI 2021 — для возраста ≥ 18 лет');

  const scr = creatinineMgDl(scrVal, input.creatinineUnit);
  const female = isFemale(input);
  const k = female ? 0.7 : 0.9;
  const a = female ? -0.241 : -0.302;
  const sexFactor = female ? 1.012 : 1;
  const egfr =
    142 *
    Math.pow(Math.min(scr / k, 1), a) *
    Math.pow(Math.max(scr / k, 1), -1.2) *
    Math.pow(0.9938, age) *
    sexFactor;

  const value = round0(egfr);
  return {
    formula: 'ckd-epi',
    value,
    unit: 'мл/мин/1,73м²',
    label: 'СКФ (CKD-EPIcr 2021)',
    category: interpretGfrCategory(value),
    valueMlS: toMlPerSecond(value),
  };
}

export function calculateCkdEpiCrCys2021(input) {
  const scrVal = parsePositive(input.creatinine);
  const cystatin = parsePositive(input.cystatin);
  const age = parseNonNegative(input.age);
  if (scrVal == null || cystatin == null || age == null) {
    throw new Error('Заполните креатинин, цистатин C и возраст');
  }
  if (age < 18) throw new Error('CKD-EPI cr-cys 2021 — для возраста ≥ 18 лет');

  const scr = creatinineMgDl(scrVal, input.creatinineUnit);
  const female = isFemale(input);
  const k = female ? 0.7 : 0.9;
  const a = female ? -0.219 : -0.144;
  const sexFactor = female ? 0.963 : 1;
  const egfr =
    135 *
    Math.pow(Math.min(scr / k, 1), a) *
    Math.pow(Math.max(scr / k, 1), -0.544) *
    Math.pow(Math.min(cystatin / 0.8, 1), -0.323) *
    Math.pow(Math.max(cystatin / 0.8, 1), -0.778) *
    Math.pow(0.9961, age) *
    sexFactor;

  const value = round0(egfr);
  return {
    formula: 'ckd-epi-cys',
    value,
    unit: 'мл/мин/1,73м²',
    label: 'СКФ (CKD-EPIcr-cys 2021)',
    category: interpretGfrCategory(value),
    valueMlS: toMlPerSecond(value),
  };
}

export function calculateCkdEpiCys2021(input) {
  const cystatin = parsePositive(input.cystatin);
  const age = parseNonNegative(input.age);
  if (cystatin == null || age == null) throw new Error('Заполните цистатин C и возраст');
  if (age < 18) throw new Error('CKD-EPI eGFRcys 2021 — для возраста ≥ 18 лет');

  const sexFactor = isFemale(input) ? 0.932 : 1;
  const egfr =
    133 *
    Math.pow(Math.min(cystatin / 0.8, 1), -0.499) *
    Math.pow(Math.max(cystatin / 0.8, 1), -1.328) *
    Math.pow(0.996, age) *
    sexFactor;

  const value = round0(egfr);
  return {
    formula: 'ckd-epi-cys-only',
    value,
    unit: 'мл/мин/1,73м²',
    label: 'СКФ (CKD-EPI eGFRcys 2021)\nцистатин C',
    category: interpretGfrCategory(value),
    valueMlS: toMlPerSecond(value),
  };
}

export function calculateCkidSchwartz(input) {
  const heightCm = parsePositive(input.heightCm);
  const scrVal = parsePositive(input.creatinine);
  const age = parseNonNegative(input.age);
  if (heightCm == null || scrVal == null || age == null) throw new Error('Заполните все поля');
  if (age < 2 || age > 15) throw new Error('CKiD (Schwartz) — для возраста 2–15 лет');

  const scrUmol = creatinineUmol(scrVal, input.creatinineUnit);
  const value = (36.5 * heightCm) / scrUmol;

  return {
    formula: 'ckid-schwartz',
    value: round2(value),
    unit: 'мл/мин/1,73м²',
    label: 'СКФ (CKiD / Schwartz)',
    category: interpretGfrCategory(value),
    valueMlS: toMlPerSecond(value),
  };
}

export function canRunFormula(formula, input) {
  const age = parseNonNegative(input.age);
  const weight = parsePositive(input.weightKg);
  const height = parsePositive(input.heightCm);
  const creatinine = parsePositive(input.creatinine);
  const cystatin = parsePositive(input.cystatin);

  if (formula === 'cockcroft') {
    if (creatinine == null) return 'Укажите креатинин';
    if (age == null) return 'Укажите возраст';
    if (weight == null) return 'Укажите вес';
    return null;
  }
  if (formula === 'ckd-epi') {
    if (creatinine == null) return 'Укажите креатинин';
    if (age == null) return 'Укажите возраст';
    if (age < 18) return 'для возраста ≥ 18 лет';
    return null;
  }
  if (formula === 'ckd-epi-cys') {
    if (creatinine == null) return 'Укажите креатинин';
    if (cystatin == null) return 'нет цистатина C';
    if (age == null) return 'Укажите возраст';
    if (age < 18) return 'для возраста ≥ 18 лет';
    return null;
  }
  if (formula === 'ckd-epi-cys-only') {
    if (cystatin == null) return 'нет цистатина C';
    if (age == null) return 'Укажите возраст';
    if (age < 18) return 'для возраста ≥ 18 лет';
    return null;
  }
  if (formula === 'ckid-schwartz') {
    if (creatinine == null) return 'Укажите креатинин';
    if (age == null) return 'Укажите возраст';
    if (height == null) return 'Укажите рост';
    if (age < 2 || age > 15) return 'возраст 2–15 лет';
    return null;
  }
  if (formula === 'ckid-u25') {
    if (creatinine == null) return 'Укажите креатинин';
    if (age == null) return 'Укажите возраст';
    if (age < 1 || age > 25) return 'возраст 1–25 лет';
    if (height == null) return 'Укажите рост';
    return null;
  }
  return 'Неизвестная формула';
}

function pickIndexedEgfr(results) {
  const order = ['ckd-epi-cys', 'ckd-epi', 'ckd-epi-cys-only', 'ckid-u25', 'ckid-schwartz'];
  for (const id of order) {
    const hit = results.find((r) => r.formula === id);
    if (hit) return hit;
  }
  return null;
}

export function calculateBmi(input) {
  const weightKg = parsePositive(input.weightKg);
  const heightCm = parsePositive(input.heightCm);
  if (weightKg == null || heightCm == null) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const value = round2(bmi);
  let interpretation;
  if (bmi <= 16) interpretation = 'Выраженный дефицит массы тела';
  else if (bmi <= 18.5) interpretation = 'Недостаточная (дефицит) масса тела';
  else if (bmi <= 25) interpretation = 'Норма';
  else if (bmi <= 30) interpretation = 'Избыточная масса тела (предожирение)';
  else if (bmi <= 35) interpretation = 'Ожирение первой степени';
  else if (bmi <= 40) interpretation = 'Ожирение второй степени';
  else interpretation = 'Ожирение третьей степени (морбидное)';
  return { value, interpretation };
}

export function calculateUreaVdLiters(input) {
  const heightCm = parsePositive(input.heightCm);
  const weightKg = parsePositive(input.weightKg);
  if (heightCm == null || weightKg == null) return null;
  if (input.gender === 'female') {
    return round2(-2.097 + 0.1069 * heightCm + 0.2466 * weightKg);
  }
  const age = parsePositive(input.age);
  if (age == null) return null;
  return round2(2.447 - 0.09516 * age + 0.1074 * heightCm + 0.3362 * weightKg);
}

export function calculateAll(input) {
  const results = [];
  const skipped = [];

  const runners = [
    { id: 'ckd-epi', label: 'CKD-EPIcr 2021', run: () => calculateCkdEpi2021(input) },
    { id: 'ckd-epi-cys', label: 'CKD-EPIcr-cys', run: () => calculateCkdEpiCrCys2021(input) },
    { id: 'ckd-epi-cys-only', label: 'CKD-EPI eGFRcys 2021', run: () => calculateCkdEpiCys2021(input) },
    { id: 'cockcroft', label: 'Cockcroft-Gault', run: () => calculateCockcroftGault(input) },
    { id: 'ckid-schwartz', label: 'CKiD (Schwartz)', run: () => calculateCkidSchwartz(input) },
    { id: 'ckid-u25', label: 'CKiD U25', run: () => calculateCkidU25(input) },
  ];

  for (const item of runners) {
    const reason = canRunFormula(item.id, input);
    if (reason) {
      skipped.push({ formula: item.id, label: item.label, reason });
      continue;
    }
    try {
      results.push(item.run());
    } catch (err) {
      skipped.push({
        formula: item.id,
        label: item.label,
        reason: err instanceof Error ? err.message : 'Недостаточно данных',
      });
    }
  }

  if (results.length === 0) {
    throw new Error(
      'Заполните креатинин или цистатин C и возраст (≥ 18) — либо рост для детских формул'
    );
  }

  const height = parsePositive(input.heightCm);
  const weight = parsePositive(input.weightKg);
  const bsaM2 = height != null && weight != null ? calculateBsaM2(height, weight) : null;

  const indexed = pickIndexedEgfr(results);
  const absolute =
    indexed && bsaM2 != null
      ? {
          value: round0(absoluteGfr(indexed.value, bsaM2)),
          unit: 'мл/мин',
          sourceLabel: indexed.label,
          valueMlS: toMlPerSecond(absoluteGfr(indexed.value, bsaM2)),
        }
      : null;

  const albuminuria = parseAlbuminuria(input.albuminuria);
  const aOption = albuminuria ? ALBUMINURIA_OPTIONS.find((o) => o.id === albuminuria) : null;
  const kdigo =
    indexed && indexed.category && aOption
      ? {
          gCategory: indexed.category,
          aCategory: aOption,
          risk: interpretKdigoRisk(indexed.category.code, albuminuria),
          sourceLabel: indexed.label,
        }
      : null;

  return {
    results,
    skipped,
    extras: {
      bsaM2: bsaM2 != null ? round2(bsaM2) : null,
      absoluteGfr: absolute,
      kdigo,
      bmi: calculateBmi(input),
      ureaVdL: calculateUreaVdLiters(input),
    },
  };
}

export function isReady(input) {
  try {
    calculateAll(input);
    return true;
  } catch {
    return false;
  }
}

export function calculate(input) {
  const formula = input.formula;
  if (formula === 'cockcroft') return calculateCockcroftGault(input);
  if (formula === 'ckid' || formula === 'ckid-u25') return calculateCkidU25(input);
  if (formula === 'ckd-epi') return calculateCkdEpi2021(input);
  if (formula === 'ckd-epi-cys') return calculateCkdEpiCrCys2021(input);
  if (formula === 'ckd-epi-cys-only') return calculateCkdEpiCys2021(input);
  if (formula === 'schwartz' || formula === 'ckid-schwartz') return calculateCkidSchwartz(input);
  const all = calculateAll(input);
  return all.results[0];
}
