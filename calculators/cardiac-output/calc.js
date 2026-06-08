/**
 * Сердечный выброс по методу Фика (medsoftpro.ru).
 * СВ = VO₂ / ((SaO₂ − SvO₂) × Hb × 13,4)
 * VO₂ = 125 × ППТ (110 при возрасте > 70)
 * ППТ = √(Рост × Вес / 3600)
 */

export const VO2_YOUNG = 125;
export const VO2_ELDERLY = 110;
export const VO2_AGE_THRESHOLD = 70;
export const HEMOGLOBIN_FACTOR = 13.4;

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parsePositive(value) {
  const n = parseNumber(value);
  return n != null && n > 0 ? n : null;
}

function parsePercent(value) {
  const n = parseNumber(value);
  if (n == null || n < 0 || n > 100) return null;
  return n;
}

function parseAge(value) {
  const n = parseNumber(value);
  if (n == null || n < 0 || !Number.isInteger(n)) return null;
  return n;
}

export function bodySurfaceArea(heightCm, weightKg) {
  return Math.sqrt((heightCm * weightKg) / 3600);
}

export function vo2MlPerMin(ageYears, bsa) {
  const factor = ageYears > VO2_AGE_THRESHOLD ? VO2_ELDERLY : VO2_YOUNG;
  return factor * bsa;
}

export function cardiacOutputCalc(input) {
  const sao2 = parsePercent(input.sao2);
  const svo2 = parsePercent(input.svo2);
  const hemoglobinGl = parsePositive(input.hemoglobin);
  const hr = parsePositive(input.hr);
  const age = parseAge(input.age);
  const height = parsePositive(input.height);
  const weight = parsePositive(input.weight);

  if ([sao2, svo2, hemoglobinGl, hr, age, height, weight].some((v) => v == null)) {
    return { status: 'INVALID' };
  }

  if (svo2 >= sao2) {
    return { status: 'INVALID', reason: 'SVO2_GE_SAO2' };
  }

  const saDecimal = sao2 / 100;
  const svDecimal = svo2 / 100;
  const hbGdl = hemoglobinGl / 10;
  const o2Diff = saDecimal - svDecimal;
  const denominator = o2Diff * hbGdl * HEMOGLOBIN_FACTOR;

  if (denominator <= 0) {
    return { status: 'INVALID' };
  }

  const decimals = input.decimals != null ? Number(input.decimals) : 2;
  const safeDecimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 3 ? decimals : 2;

  const bsa = bodySurfaceArea(height, weight);
  const vo2 = vo2MlPerMin(age, bsa);
  const co = vo2 / denominator;
  const ci = co / bsa;
  const sv = (co / hr) * 1000;

  return {
    status: 'OK',
    vo2: roundHalfUp(vo2, safeDecimals),
    cardiacOutput: roundHalfUp(co, safeDecimals),
    bsa: roundHalfUp(bsa, safeDecimals),
    cardiacIndex: roundHalfUp(ci, safeDecimals),
    strokeVolume: roundHalfUp(sv, safeDecimals),
    decimals: safeDecimals,
  };
}

export function calculate(input) {
  const out = cardiacOutputCalc(input);
  if (out.status === 'INVALID') {
    if (out.reason === 'SVO2_GE_SAO2') {
      throw new Error('SvO₂ должно быть ниже SaO₂');
    }
    throw new Error('Заполните все поля корректными значениями');
  }
  return out;
}
