/**
 * Интерпретация КЩС по pH, PaCO₂ и BE-ecf (MedSoftPro / TreeCalc).
 */

export const PH_MIN = 6.8;
export const PH_MAX = 8.0;
export const PACO2_MIN = 10;
export const PACO2_MAX = 120;
export const BE_MIN = -30;
export const BE_MAX = 30;

export const PH_LOW = 7.36;
export const PH_HIGH = 7.44;
export const PACO2_LOW = 36;
export const PACO2_HIGH = 44;
export const BE_LOW = -2.4;
export const BE_HIGH = 2.2;

const LABELS = {
  normal: 'Нормальное кислотно-щелочное состояние',
  respiratoryAcidosis: 'Респираторный ацидоз',
  respiratoryAlkalosis: 'Респираторный алкалоз',
  metabolicAcidosis: 'Метаболический ацидоз',
  metabolicAlkalosis: 'Метаболический алкалоз',
  mixed: 'Смешанный (метаболический и респираторный) ацидоз или алкалоз',
};

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function inRange(value, min, max) {
  return value >= min && value <= max;
}

export function interpretAcidBase(ph, paco2, be) {
  const acidosis = ph < PH_LOW;
  const alkalosis = ph > PH_HIGH;
  const co2High = paco2 > PACO2_HIGH;
  const co2Low = paco2 < PACO2_LOW;
  const beLow = be < BE_LOW;
  const beHigh = be > BE_HIGH;

  if (!acidosis && !alkalosis) {
    return {
      label: LABELS.normal,
      detail: 'pH в пределах референсного диапазона.',
      code: 'normal',
    };
  }

  if ((co2High && beHigh) || (co2Low && beLow)) {
    return {
      label: LABELS.mixed,
      detail: 'PaCO₂ и BE изменены в противоположных направлениях.',
      code: 'mixed',
    };
  }

  if (acidosis) {
    if (co2High) {
      return {
        label: LABELS.respiratoryAcidosis,
        detail: 'PaCO₂ повышено.',
        code: 'respiratoryAcidosis',
      };
    }
    return {
      label: LABELS.metabolicAcidosis,
      detail: beLow ? 'BE снижен (дефицит оснований).' : 'PaCO₂ не повышено.',
      code: 'metabolicAcidosis',
    };
  }

  if (co2Low) {
    return {
      label: LABELS.respiratoryAlkalosis,
      detail: 'PaCO₂ снижено.',
      code: 'respiratoryAlkalosis',
    };
  }

  return {
    label: LABELS.metabolicAlkalosis,
    detail: beHigh ? 'BE повышен (избыток оснований).' : 'PaCO₂ не снижено.',
    code: 'metabolicAlkalosis',
  };
}

export function calculate(input) {
  const ph = parseNumber(input.ph);
  const paco2 = parseNumber(input.paco2);
  const be = parseNumber(input.be);

  if (ph == null || paco2 == null || be == null) {
    throw new Error('Заполните все поля');
  }
  if (!inRange(ph, PH_MIN, PH_MAX)) {
    throw new Error(`pH вне допустимого диапазона ${PH_MIN}–${PH_MAX}`);
  }
  if (!inRange(paco2, PACO2_MIN, PACO2_MAX)) {
    throw new Error(`PaCO₂ вне допустимого диапазона ${PACO2_MIN}–${PACO2_MAX}`);
  }
  if (!inRange(be, BE_MIN, BE_MAX)) {
    throw new Error(`BE вне допустимого диапазона ${BE_MIN}–${BE_MAX}`);
  }

  const result = interpretAcidBase(ph, paco2, be);

  return {
    ph,
    paco2,
    be,
    label: result.label,
    interpretation: result.label,
    detail: result.detail,
    code: result.code,
  };
}
