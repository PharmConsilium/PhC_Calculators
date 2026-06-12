/**
 * Процент снижения мочевины при гемодиализе (ПРМ / URR).
 * ПРМ = 100 × (мочевина до ГД − мочевина после ГД) / мочевина до ГД
 */

export const DISPLAY_DECIMALS = 1;

export const URR_ADEQUATE_MIN = 65;

export const UREA_UNIT_OPTIONS = [
  { id: 'mmolL', label: 'ммоль/л' },
  { id: 'mgdl', label: 'мг/дл' },
];

export const FIELD_LIMITS = {
  mmolL: { min: 0.1, max: 80 },
  mgdl: { min: 1, max: 480 },
};

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

/** ПРМ (URR), % — единицы мочевины должны совпадать. */
export function prmPercent(ureaPre, ureaPost) {
  return (100 * (ureaPre - ureaPost)) / ureaPre;
}

export function interpretPrm(value) {
  return value >= URR_ADEQUATE_MIN
    ? 'достаточный процент снижения мочевины'
    : 'недостаточный процент снижения мочевины';
}

export function calculate(input) {
  const ureaPre = parsePositive(input.ureaPre);
  const ureaPost = parsePositive(input.ureaPost);
  const unit = input.ureaUnit === 'mgdl' ? 'mgdl' : 'mmolL';
  const limits = FIELD_LIMITS[unit];

  if (ureaPre == null || ureaPost == null) {
    throw new Error('Заполните мочевину до и после гемодиализа');
  }
  if (ureaPre < limits.min || ureaPre > limits.max) {
    throw new Error(`Мочевина до ГД вне диапазона ${limits.min}–${limits.max}`);
  }
  if (ureaPost < limits.min || ureaPost > limits.max) {
    throw new Error(`Мочевина после ГД вне диапазона ${limits.min}–${limits.max}`);
  }

  const prmRaw = prmPercent(ureaPre, ureaPost);
  const prm = roundHalfUp(prmRaw, DISPLAY_DECIMALS);

  return {
    ureaPre,
    ureaPost,
    ureaUnit: unit,
    unitLabel: unit === 'mgdl' ? 'мг/дл' : 'ммоль/л',
    prm,
    interpretation: interpretPrm(prm),
    adequate: prm >= URR_ADEQUATE_MIN,
  };
}
