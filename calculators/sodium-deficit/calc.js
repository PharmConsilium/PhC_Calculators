/**
 * Дефицит натрия при гипонатриемии (MSD).
 * DNa = K × W × (NaT − NaP), ммоль/л
 */

export const GENDER_OPTIONS = [
  { id: 'male', label: 'Муж.' },
  { id: 'female', label: 'Жен.' },
];

export const AGE_BANDS = [
  { id: '0-17', label: '0–17 лет' },
  { id: '18-59', label: '18–59 лет' },
  { id: '60+', label: '≥ 60 лет' },
];

export const TBW_COEF_TABLE = {
  male: { '0-17': 0.6, '18-59': 0.6, '60+': 0.5 },
  female: { '0-17': 0.6, '18-59': 0.5, '60+': 0.45 },
};

export const DEFAULT_DESIRED_NA = 140;
export const SERUM_NA_NORMAL_MIN = 135;
export const SERUM_NA_NORMAL_MAX = 145;
export const CORRECTION_RATE_MMOL_PER_L_PER_H = 0.5;

export const INFUSION_SOLUTIONS = [
  { id: 'ringer', label: 'Рингер лактат', naMmolL: 129.3 },
  { id: 'nacl045', label: 'NaCl 0.45%', naMmolL: 76.95 },
  { id: 'nacl09', label: 'NaCl 0.9%', naMmolL: 153.9 },
  { id: 'nacl3', label: 'NaCl 3%', naMmolL: 513 },
];

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export function tbwCoef(gender, ageBand) {
  const row = TBW_COEF_TABLE[gender];
  if (!row) return null;
  const coef = row[ageBand];
  return coef == null ? null : coef;
}

function parsePositive(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function infusionPlan(deficitMmol, tbwLiters, correctionHours) {
  if (!(deficitMmol > 0) || !(tbwLiters > 0) || !(correctionHours > 0)) return [];
  return INFUSION_SOLUTIONS.map((solution) => {
    const volumeMl = Math.round((deficitMmol / solution.naMmolL) * 1000);
    const rateMlH = Math.round(volumeMl / correctionHours);
    return {
      id: solution.id,
      label: solution.label,
      naMmolL: solution.naMmolL,
      volumeMl,
      rateMlH,
    };
  });
}

export function sodiumDeficit(input) {
  const gender = input.gender;
  const ageBand = input.ageBand;
  const coef = tbwCoef(gender, ageBand);
  if (!coef) return { status: 'INVALID' };

  const weight = parsePositive(input.weight);
  const serum = parsePositive(input.serumNa);
  const desiredRaw = input.desiredNa;
  const desired =
    desiredRaw === null || desiredRaw === undefined || String(desiredRaw).trim() === ''
      ? DEFAULT_DESIRED_NA
      : parsePositive(desiredRaw);

  if (weight == null || serum == null || desired == null) {
    return { status: 'INVALID' };
  }

  const weightKg = weight;
  const naP = serum;
  const naT = desired;

  const decimals = input.decimals != null ? Number(input.decimals) : 2;
  const safeDecimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 3 ? decimals : 2;

  const tbw = coef * weightKg;
  const delta = naT - naP;
  const deficitMmol = tbw * delta;
  const correctionRateMmolH = roundHalfUp(CORRECTION_RATE_MMOL_PER_L_PER_H * tbw, 0);
  const correctionHours =
    delta > 0 && correctionRateMmolH > 0
      ? Math.round(roundHalfUp(deficitMmol, safeDecimals) / correctionRateMmolH)
      : 0;
  const isHyponatremia = naP < SERUM_NA_NORMAL_MIN;
  const solutions =
    delta > 0 && correctionHours > 0
      ? infusionPlan(roundHalfUp(deficitMmol, safeDecimals), tbw, correctionHours)
      : [];

  let statusMessage;
  if (delta <= 0) {
    statusMessage = 'NaT не выше NaP — коррекция дефицита натрия не требуется.';
  } else if (isHyponatremia) {
    statusMessage = `Гипонатриемия (норма ${SERUM_NA_NORMAL_MIN}–${SERUM_NA_NORMAL_MAX} ммоль/л). Требуется коррекция дефицита натрия.`;
  } else {
    statusMessage = `Натрий сыворотки в пределах нормы (${SERUM_NA_NORMAL_MIN}–${SERUM_NA_NORMAL_MAX} ммоль/л). Требуется коррекция до целевого уровня.`;
  }

  return {
    status: 'OK',
    gender,
    ageBand,
    tbwCoef: coef,
    weightKg: roundHalfUp(weightKg, 2),
    serumMmolL: roundHalfUp(naP, 2),
    desiredMmolL: roundHalfUp(naT, 2),
    deltaNa: roundHalfUp(delta, safeDecimals),
    totalBodyWater: roundHalfUp(tbw, safeDecimals),
    sodiumDeficit: roundHalfUp(deficitMmol, safeDecimals),
    correctionRateMmolH,
    correctionHours,
    isHyponatremia,
    statusMessage,
    solutions,
    decimals: safeDecimals,
    interpretation:
      delta <= 0
        ? statusMessage
        : `ОКВО ≈ ${String(roundHalfUp(tbw, safeDecimals)).replace('.', ',')} л (K = ${String(coef).replace('.', ',')})`,
  };
}

export function calculate(input) {
  const out = sodiumDeficit(input);
  if (out.status !== 'OK') throw new Error('Заполните все поля');
  return out;
}
