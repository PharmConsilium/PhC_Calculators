/**
 * Коррекция натрия при гипергликемии (MedSoftPro / Katz, Hillier).
 * Ввод: Na и глюкоза в ммоль/л; в формулах глюкоза пересчитывается в мг/дл.
 */

export const DISPLAY_DECIMALS = 1;

export const KATZ_FACTOR = 0.016;
export const HILLIER_FACTOR = 0.024;
export const GLUCOSE_NORMAL_MGDL = 100;
export const MMOL_TO_MGDL = 18;

export const NA_UNIT_LABEL = 'ммоль/л';
export const GLUCOSE_UNIT_LABEL = 'ммоль/л';

export const FIELD_LIMITS = {
  measuredNa: { min: 70, max: 250 },
  glucoseMmol: { min: 0.5, max: 200 },
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

export function glucoseMmolToMgDl(glucoseMmol) {
  return glucoseMmol * MMOL_TO_MGDL;
}

export function correctedSodiumKatz(measuredNa, glucoseMmol) {
  const glucoseMgDl = glucoseMmolToMgDl(glucoseMmol);
  return measuredNa + KATZ_FACTOR * (glucoseMgDl - GLUCOSE_NORMAL_MGDL);
}

export function correctedSodiumHillier(measuredNa, glucoseMmol) {
  const glucoseMgDl = glucoseMmolToMgDl(glucoseMmol);
  return measuredNa + HILLIER_FACTOR * (glucoseMgDl - GLUCOSE_NORMAL_MGDL);
}

export function calculate(input) {
  const measuredNa = parsePositive(input.measuredNa);
  const glucoseMmol = parsePositive(input.glucose);

  if (measuredNa == null || glucoseMmol == null) {
    throw new Error('Заполните измеренный натрий и глюкозу');
  }
  if (measuredNa < FIELD_LIMITS.measuredNa.min || measuredNa > FIELD_LIMITS.measuredNa.max) {
    throw new Error(
      `Натрий вне допустимого диапазона ${FIELD_LIMITS.measuredNa.min}–${FIELD_LIMITS.measuredNa.max}`
    );
  }
  if (glucoseMmol < FIELD_LIMITS.glucoseMmol.min || glucoseMmol > FIELD_LIMITS.glucoseMmol.max) {
    throw new Error(
      `Глюкоза вне допустимого диапазона ${FIELD_LIMITS.glucoseMmol.min}–${FIELD_LIMITS.glucoseMmol.max}`
    );
  }

  const katzRaw = correctedSodiumKatz(measuredNa, glucoseMmol);
  const hillierRaw = correctedSodiumHillier(measuredNa, glucoseMmol);

  return {
    measuredNa,
    glucoseMmol,
    glucoseMgDl: roundHalfUp(glucoseMmolToMgDl(glucoseMmol), DISPLAY_DECIMALS),
    correctedNaKatz: roundHalfUp(katzRaw, DISPLAY_DECIMALS),
    correctedNaHillier: roundHalfUp(hillierRaw, DISPLAY_DECIMALS),
    katzDelta: roundHalfUp(katzRaw - measuredNa, DISPLAY_DECIMALS),
    hillierDelta: roundHalfUp(hillierRaw - measuredNa, DISPLAY_DECIMALS),
    unitLabel: NA_UNIT_LABEL,
  };
}
