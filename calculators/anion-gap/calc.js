/**
 * Анионная разница и дельта-дельта градиент (MSD / Multicalc).
 * АР = Na − (Cl + HCO₃)
 */

export const NORMAL_AG = 12;
export const NORMAL_HCO3 = 24;

const ION_TO_MEQ_L = { 'mEq/L': 1, 'mmol/L': 1 };

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

function parseIon(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return { error: true };
  const n = Number(s);
  if (!Number.isFinite(n)) return { error: true };
  return { value: n };
}

function toMeqPerL(value, unit) {
  const factor = ION_TO_MEQ_L[unit];
  if (!factor) return null;
  return value * factor;
}

export function interpretDeltaDelta(deltaDelta) {
  if (deltaDelta > 6) {
    return 'Вероятна сопутствующая метаболическая алкалозная компонента';
  }
  if (deltaDelta < -6) {
    return 'Вероятна сопутствующая метаболическая ацидозная компонента без увеличения АР';
  }
  return 'Соответствует изолированному ацидозу с повышением АР';
}

export function anionGapScore(input) {
  const naParsed = parseIon(input.na);
  const clParsed = parseIon(input.cl);
  const hco3Parsed = parseIon(input.hco3);

  if (!naParsed || naParsed.error) return { status: 'INVALID', missing: 'na' };
  if (!clParsed || clParsed.error) return { status: 'INVALID', missing: 'cl' };
  if (!hco3Parsed || hco3Parsed.error) return { status: 'INVALID', missing: 'hco3' };

  const na = toMeqPerL(naParsed.value, input.naUnit || 'mEq/L');
  const cl = toMeqPerL(clParsed.value, input.clUnit || 'mEq/L');
  const hco3 = toMeqPerL(hco3Parsed.value, input.hco3Unit || 'mEq/L');

  if (na == null || cl == null || hco3 == null) return { status: 'INVALID' };

  const decimals = input.decimals != null ? Number(input.decimals) : 1;
  const safeDecimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 3 ? decimals : 1;

  const ag = na - (cl + hco3);
  const deltaAg = ag - NORMAL_AG;
  const deltaHco3 = NORMAL_HCO3 - hco3;
  const deltaDelta = deltaAg - deltaHco3;
  const deltaRatio = deltaHco3 !== 0 ? deltaAg / deltaHco3 : null;

  return {
    status: 'OK',
    ag: roundHalfUp(ag, safeDecimals),
    deltaAg: roundHalfUp(deltaAg, safeDecimals),
    deltaHco3: roundHalfUp(deltaHco3, safeDecimals),
    deltaDelta: roundHalfUp(deltaDelta, safeDecimals),
    deltaRatio: deltaRatio == null ? null : roundHalfUp(deltaRatio, safeDecimals),
    decimals: safeDecimals,
    interpretation: interpretDeltaDelta(deltaDelta),
  };
}

export function calculate(input) {
  const out = anionGapScore(input);
  if (out.status !== 'OK') throw new Error('Заполните Na, Cl и HCO₃');
  return out;
}
