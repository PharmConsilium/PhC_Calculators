/**
 * Дефицит натрия при гипонатриемии (MSD).
 * Дефицит натрия = Пол × Норм. вес × (Желаемый натрий − Натрий сыворотки)
 */

export const GENDER_OPTIONS = [
  { id: 'female', label: 'Жен.', coef: 0.5 },
  { id: 'male', label: 'Муж.', coef: 0.6 },
];

export const DEFAULT_DESIRED_NA = 140;

const NA_CONC_TO_MEQ_L = { 'mEq/L': 1, 'mmol/L': 1 };

export function roundHalfUp(value, decimals) {
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

function toMeqPerL(value, unit) {
  const factor = NA_CONC_TO_MEQ_L[unit];
  if (!factor) return null;
  return value * factor;
}

export function sodiumDeficit(input) {
  const genderOpt = GENDER_OPTIONS.find((o) => o.id === input.gender);
  if (!genderOpt) return { status: 'INVALID' };

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
  const serumMeqL = toMeqPerL(serum, input.serumUnit || 'mEq/L');
  const desiredMeqL = toMeqPerL(desired, input.desiredUnit || 'mEq/L');

  if (weightKg == null || serumMeqL == null || desiredMeqL == null) {
    return { status: 'INVALID' };
  }

  const decimals = input.decimals != null ? Number(input.decimals) : 2;
  const safeDecimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 3 ? decimals : 2;

  const tbw = genderOpt.coef * weightKg;
  const delta = desiredMeqL - serumMeqL;
  const deficitMeq = tbw * delta;

  return {
    status: 'OK',
    gender: genderOpt.id,
    genderCoef: genderOpt.coef,
    weightKg: roundHalfUp(weightKg, 2),
    serumMeqL: roundHalfUp(serumMeqL, 2),
    desiredMeqL: roundHalfUp(desiredMeqL, 2),
    totalBodyWater: roundHalfUp(tbw, safeDecimals),
    sodiumDeficit: roundHalfUp(deficitMeq, safeDecimals),
    decimals: safeDecimals,
    interpretation:
      delta <= 0
        ? 'Желаемый натрий не выше натрия сыворотки — дефицит не рассчитывается'
        : `ОКВО ≈ ${String(roundHalfUp(tbw, safeDecimals)).replace('.', ',')} л`,
  };
}

export function calculate(input) {
  const out = sodiumDeficit(input);
  if (out.status !== 'OK') throw new Error('Заполните все поля');
  return out;
}
