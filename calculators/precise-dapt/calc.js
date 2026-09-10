/**
 * Шкала PRECISE-DAPT — риск кровотечений при ДАТТ после ЧКВ.
 * Баллы по номограмме Costa et al., Lancet 2017 (линейная интерполяция).
 * Клиренс креатинина: прямой ввод или Cockcroft–Gault.
 * @see https://medsoftpro.ru/kalkulyatory/precise-dapt
 */

const UMOL_TO_MG_DL = 88.4;

export const FIELD_LIMITS = {
  hemoglobinGl: { min: 40, max: 200 },
  wbc: { min: 1, max: 50 },
  age: { min: 18, max: 110 },
  crCl: { min: 1, max: 200 },
  weightKg: { min: 20, max: 300 },
  creatinineUmol: { min: 10, max: 2000 },
  creatinineMgDl: { min: 0.1, max: 30 },
};

export function rangeErrorMessage(min, max) {
  return `Число не в корректном интервале ${min} - ${max}`;
}

export function isInRange(value, limits) {
  return value >= limits.min && value <= limits.max;
}

export function roundHalfUp(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

function parsePositive(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function creatinineMgDl(value, unit) {
  return unit === 'mgdl' ? value : value / UMOL_TO_MG_DL;
}

function isFemale(sex) {
  return sex === 'female' || sex === 'f' || sex === 'ж' || sex === true;
}

/** Линейная интерполяция с усечением за пределами якорей. */
export function interpolatePoints(value, x0, x1, p0, p1) {
  if (x1 === x0) return p0;
  const t = (value - x0) / (x1 - x0);
  const clamped = Math.min(1, Math.max(0, t));
  return p0 + clamped * (p1 - p0);
}

/** Hb г/л → г/дл для номограммы. */
export function hemoglobinToGdl(hemoglobinGl) {
  return hemoglobinGl / 10;
}

/**
 * Клиренс креатинина по Cockcroft–Gault, мл/мин.
 * CrCl = (140 − age) × weight / (72 × Cr_mg/dl) × (0.85 если женщина)
 */
export function calculateCockcroftGaultMlMin(input = {}) {
  const age = parsePositive(input.age);
  const weightKg = parsePositive(input.weightKg);
  const creatinineVal = parsePositive(input.creatinine);
  if (age == null || weightKg == null || creatinineVal == null) {
    return { status: 'INVALID', message: 'Заполните возраст, массу и креатинин' };
  }
  if (!isInRange(age, FIELD_LIMITS.age)) {
    return {
      status: 'INVALID',
      field: 'age',
      message: rangeErrorMessage(FIELD_LIMITS.age.min, FIELD_LIMITS.age.max),
    };
  }
  if (!isInRange(weightKg, FIELD_LIMITS.weightKg)) {
    return {
      status: 'INVALID',
      field: 'weightKg',
      message: rangeErrorMessage(FIELD_LIMITS.weightKg.min, FIELD_LIMITS.weightKg.max),
    };
  }

  const unit = input.creatinineUnit === 'mgdl' ? 'mgdl' : 'umol';
  const creatLimits =
    unit === 'mgdl' ? FIELD_LIMITS.creatinineMgDl : FIELD_LIMITS.creatinineUmol;
  if (!isInRange(creatinineVal, creatLimits)) {
    return {
      status: 'INVALID',
      field: 'creatinine',
      message: rangeErrorMessage(creatLimits.min, creatLimits.max),
    };
  }

  const crMgDl = creatinineMgDl(creatinineVal, unit);
  let value = ((140 - age) * weightKg) / (72 * crMgDl);
  if (isFemale(input.sex)) value *= 0.85;
  value = roundHalfUp(value, 2);

  return {
    status: 'OK',
    value,
    unit: 'мл/мин',
    formula: 'cockcroft-gault',
  };
}

/**
 * Баллы по номограмме PRECISE-DAPT:
 * Hb ≥12 г/дл → 0; ≤10 → 15
 * WBC ≤5 → 0; ≥20 → 15
 * возраст ≤50 → 0; ≥90 → 19
 * CrCl ≥100 → 0; ≤0 → 25 (на практике ≥1)
 * предшествующее кровотечение → 26
 */
export function pointsHemoglobinGdl(hbGdl) {
  return interpolatePoints(hbGdl, 12, 10, 0, 15);
}

export function pointsWbc(wbc) {
  return interpolatePoints(wbc, 5, 20, 0, 15);
}

export function pointsAge(age) {
  return interpolatePoints(age, 50, 90, 0, 19);
}

export function pointsCrCl(crCl) {
  return interpolatePoints(crCl, 100, 0, 0, 25);
}

export function pointsPriorBleeding(priorBleeding) {
  return priorBleeding ? 26 : 0;
}

export function classifyPreciseDapt(total) {
  if (total >= 25) {
    return {
      category: 'high',
      riskBand: 'Высокий риск кровотечений',
      interpretation:
        'PRECISE-DAPT ≥ 25 — рекомендована короткая ДАТТ (3–6 месяцев)',
    };
  }
  if (total >= 18) {
    return {
      category: 'moderate',
      riskBand: 'Умеренный риск кровотечений',
      interpretation:
        'PRECISE-DAPT 18–24 — стандартная / длительная ДАТТ (обычно 12 месяцев), при отсутствии высокого ишемического риска',
    };
  }
  if (total >= 11) {
    return {
      category: 'low',
      riskBand: 'Низкий риск кровотечений',
      interpretation:
        'PRECISE-DAPT 11–17 — стандартная / длительная ДАТТ (обычно 12 месяцев)',
    };
  }
  return {
    category: 'very-low',
    riskBand: 'Очень низкий риск кровотечений',
    interpretation:
      'PRECISE-DAPT ≤ 10 — стандартная / длительная ДАТТ (обычно 12 месяцев)',
  };
}

export function preciseDaptCalculation(input = {}) {
  const hemoglobinGl = parsePositive(input.hemoglobinGl);
  const wbc = parsePositive(input.wbc);
  const age = parsePositive(input.age);
  const priorRaw = input.priorBleeding;
  const priorBleeding =
    priorRaw === true ||
    priorRaw === 'true' ||
    priorRaw === 'yes' ||
    priorRaw === 1 ||
    priorRaw === '1';

  const crClMode = input.crClMode === 'calc' ? 'calc' : 'known';
  let crCl = parsePositive(input.crCl);
  let crClSource = 'known';

  if (crClMode === 'calc') {
    const cg = calculateCockcroftGaultMlMin({
      age,
      weightKg: input.weightKg,
      creatinine: input.creatinine,
      creatinineUnit: input.creatinineUnit,
      sex: input.sex,
    });
    if (cg.status !== 'OK') {
      return { status: 'INVALID', field: cg.field || 'crCl', message: cg.message };
    }
    crCl = cg.value;
    crClSource = 'cockcroft-gault';
  }

  if (hemoglobinGl == null || wbc == null || age == null || crCl == null) {
    return { status: 'INVALID' };
  }
  if (priorRaw === undefined || priorRaw === null || priorRaw === '') {
    return {
      status: 'INVALID',
      field: 'priorBleeding',
      message: 'Укажите наличие предшествующих кровотечений',
    };
  }

  const fields = [
    { key: 'hemoglobinGl', value: hemoglobinGl, limits: FIELD_LIMITS.hemoglobinGl },
    { key: 'wbc', value: wbc, limits: FIELD_LIMITS.wbc },
    { key: 'age', value: age, limits: FIELD_LIMITS.age },
    { key: 'crCl', value: crCl, limits: FIELD_LIMITS.crCl },
  ];
  for (const field of fields) {
    if (!isInRange(field.value, field.limits)) {
      return {
        status: 'INVALID',
        field: field.key,
        message: rangeErrorMessage(field.limits.min, field.limits.max),
      };
    }
  }

  const hbGdl = hemoglobinToGdl(hemoglobinGl);
  const parts = {
    hemoglobin: roundHalfUp(pointsHemoglobinGdl(hbGdl), 1),
    wbc: roundHalfUp(pointsWbc(wbc), 1),
    age: roundHalfUp(pointsAge(age), 1),
    crCl: roundHalfUp(pointsCrCl(crCl), 1),
    priorBleeding: pointsPriorBleeding(priorBleeding),
  };

  const totalRaw =
    parts.hemoglobin + parts.wbc + parts.age + parts.crCl + parts.priorBleeding;
  const total = Math.min(100, roundHalfUp(totalRaw, 0));
  const info = classifyPreciseDapt(total);

  return {
    status: 'OK',
    hemoglobinGl,
    hemoglobinGdl: roundHalfUp(hbGdl, 1),
    wbc,
    age,
    crCl,
    crClSource,
    priorBleeding,
    parts,
    total,
    category: info.category,
    riskBand: info.riskBand,
    interpretation: info.interpretation,
  };
}

export function calculate(input) {
  const out = preciseDaptCalculation(input);
  if (out.status !== 'OK') {
    throw new Error(out.message || 'Заполните все поля');
  }
  return out;
}
