/**
 * Калькулятор анионного разрыва (MDCalc; AG, delta gap, delta ratio, коррекция на альбумин).
 * АР = Na − (Cl + HCO₃)
 */

export const MODES = {
  basic: 'basic',
  albumin: 'albumin',
};

export const NORMAL_AG = 12;
export const NORMAL_AG_RANGE = '10–12';
export const NORMAL_HCO3 = 24;
export const NORMAL_ALBUMIN_G_DL = 4;
export const ALBUMIN_CORRECTION_FACTOR = 2.5;
export const DISPLAY_DECIMALS = 1;

export const ION_UNIT = 'ммоль/л';

export const FIELD_LIMITS = {
  na: { min: 100, max: 180 },
  cl: { min: 70, max: 130 },
  hco3: { min: 5, max: 45 },
  albumin: { min: 1, max: 8 },
};

export function rangeErrorMessage(min, max) {
  return `Число не в корректном интервале ${min} - ${max}`;
}

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

export function albuminToGdl(value, unit = 'gL') {
  return unit === 'gL' ? value / 10 : value;
}

export function anionGapValue(na, cl, hco3) {
  return na - (cl + hco3);
}

export function deltaGap(ag, normalAg = NORMAL_AG) {
  return ag - normalAg;
}

export function deltaRatio(deltaGapValue, hco3, normalHco3 = NORMAL_HCO3) {
  const denominator = normalHco3 - hco3;
  if (denominator === 0) return null;
  return deltaGapValue / denominator;
}

export function interpretDeltaRatio(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return null;
  if (ratio < 0.4) return 'чистый ацидоз с нормальным анионным разрывом';
  if (ratio < 0.8) return 'смешанный ацидоз с высоким и нормальным анионным разрывом';
  if (ratio <= 2) return 'чистый ацидоз с увеличенным анионным разрывом';
  return 'ацидоз с высоким анионным разрывом при наличии предшествующего метаболического алкалоза';
}

export function albuminCorrectedAg(ag, albuminGdl, normalAlbumin = NORMAL_ALBUMIN_G_DL) {
  return ag + ALBUMIN_CORRECTION_FACTOR * (normalAlbumin - albuminGdl);
}

function resolveDecimals(input) {
  const decimals = input.decimals != null ? Number(input.decimals) : DISPLAY_DECIMALS;
  return Number.isFinite(decimals) && decimals >= 0 && decimals <= 3 ? decimals : DISPLAY_DECIMALS;
}

function parseIons(input) {
  const na = parseNumber(input.na);
  const cl = parseNumber(input.cl);
  const hco3 = parseNumber(input.hco3);
  if (na == null || cl == null || hco3 == null) return { status: 'INVALID' };

  return { status: 'OK', na, cl, hco3 };
}

export function anionGapBasic(input) {
  const ions = parseIons(input);
  if (ions.status !== 'OK') return { status: 'INVALID' };

  const decimals = resolveDecimals(input);
  const ag = anionGapValue(ions.na, ions.cl, ions.hco3);
  const dGap = deltaGap(ag);
  const dRatio = deltaRatio(dGap, ions.hco3);

  return {
    status: 'OK',
    mode: 'basic',
    ag: roundHalfUp(ag, decimals),
    deltaGap: roundHalfUp(dGap, decimals),
    deltaRatio: dRatio == null ? null : roundHalfUp(dRatio, decimals),
    decimals,
  };
}

export function anionGapAlbumin(input) {
  const ions = parseIons(input);
  if (ions.status !== 'OK') return { status: 'INVALID' };

  const albuminRaw = parseNumber(input.albumin);
  if (albuminRaw == null) return { status: 'INVALID', missing: 'albumin' };

  const albuminGdl = albuminToGdl(albuminRaw, input.albuminUnit || 'gL');
  const decimals = resolveDecimals(input);

  const ag = anionGapValue(ions.na, ions.cl, ions.hco3);
  const correctedAg = albuminCorrectedAg(ag, albuminGdl);
  const dGap = deltaGap(ag);
  const correctedDeltaGap = deltaGap(correctedAg);
  const dRatio = deltaRatio(dGap, ions.hco3);
  const correctedDeltaRatio = deltaRatio(correctedDeltaGap, ions.hco3);

  return {
    status: 'OK',
    mode: 'albumin',
    ag: roundHalfUp(ag, decimals),
    correctedAg: roundHalfUp(correctedAg, decimals),
    deltaGap: roundHalfUp(dGap, decimals),
    correctedDeltaGap: roundHalfUp(correctedDeltaGap, decimals),
    deltaRatio: dRatio == null ? null : roundHalfUp(dRatio, decimals),
    correctedDeltaRatio: correctedDeltaRatio == null ? null : roundHalfUp(correctedDeltaRatio, decimals),
    albuminGdl: roundHalfUp(albuminGdl, decimals),
    decimals,
  };
}

export function calculate(input) {
  const mode = input?.mode === 'albumin' ? 'albumin' : 'basic';
  const out = mode === 'albumin' ? anionGapAlbumin(input) : anionGapBasic(input);
  if (out.status !== 'OK') throw new Error('Заполните все параметры');
  return out;
}
