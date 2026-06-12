/**
 * Коррекция кальция при гипоальбуминемии (MSD / Figge et al.).
 * Ca = кальций сыворотки + k × (норм. альбумин − альбумин пациента)
 */

export const DISPLAY_DECIMALS = 2;

export const NORMAL_ALBUMIN_OPTIONS = [
  { id: '40', value: 40, label: '40 г/л' },
  { id: '44', value: 44, label: '44 г/л' },
];

export const DEFAULT_NORMAL_ALBUMIN = 40;

/** ммоль/л на каждый г/л разницы альбумина */
export const CORRECTION_MMOL_PER_GL = 0.02;

/** мг/дл на каждый г/л разницы альбумина */
export const CORRECTION_MGDL_PER_GL = 0.08;

export const MMOL_TO_MGDL = 4;

export const FIELD_LIMITS = {
  serumCaMmol: { min: 0.5, max: 6 },
  serumCaMgDl: { min: 2, max: 24 },
  albuminGL: { min: 5, max: 70 },
  albuminGdl: { min: 0.5, max: 7 },
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

export function albuminToGL(value, unit = 'gL') {
  if (unit === 'gdl') return value * 10;
  return value;
}

export function serumCaToMmol(value, unit = 'mmolL') {
  if (unit === 'mgdl') return value / MMOL_TO_MGDL;
  return value;
}

export function serumCaFromMmol(valueMmol, unit = 'mmolL') {
  if (unit === 'mgdl') return valueMmol * MMOL_TO_MGDL;
  return valueMmol;
}

export function correctedCalciumMmol(serumCaMmol, normalAlbuminGL, patientAlbuminGL) {
  return serumCaMmol + CORRECTION_MMOL_PER_GL * (normalAlbuminGL - patientAlbuminGL);
}

export function normalAlbuminById(id) {
  const item = NORMAL_ALBUMIN_OPTIONS.find((opt) => opt.id === String(id));
  return item ? item.value : null;
}

export function calculate(input) {
  const serumCaRaw = parsePositive(input.serumCa);
  const patientAlbuminRaw = parsePositive(input.patientAlbumin);
  const serumCaUnit = input.serumCaUnit === 'mgdl' ? 'mgdl' : 'mmolL';
  const albuminUnit = input.patientAlbuminUnit === 'gdl' ? 'gdl' : 'gL';
  const normalAlbumin =
    input.normalAlbumin != null ? Number(input.normalAlbumin) : DEFAULT_NORMAL_ALBUMIN;

  if (serumCaRaw == null || patientAlbuminRaw == null) {
    throw new Error('Заполните кальций сыворотки и альбумин пациента');
  }
  if (![40, 44].includes(normalAlbumin)) {
    throw new Error('Выберите нормальный уровень альбумина');
  }

  const patientAlbuminGL = albuminToGL(patientAlbuminRaw, albuminUnit);
  const serumCaMmol = serumCaToMmol(serumCaRaw, serumCaUnit);
  const correctedMmol = correctedCalciumMmol(serumCaMmol, normalAlbumin, patientAlbuminGL);
  const correctedDisplay = roundHalfUp(serumCaFromMmol(correctedMmol, serumCaUnit), DISPLAY_DECIMALS);
  const correctionDelta = roundHalfUp(
    serumCaFromMmol(correctedMmol - serumCaMmol, serumCaUnit),
    DISPLAY_DECIMALS
  );

  return {
    serumCa: serumCaRaw,
    serumCaUnit,
    patientAlbumin: patientAlbuminRaw,
    patientAlbuminUnit: albuminUnit,
    patientAlbuminGL: roundHalfUp(patientAlbuminGL, DISPLAY_DECIMALS),
    normalAlbumin,
    correctedCalcium: correctedDisplay,
    correctionDelta,
    correctedCalciumMmol: roundHalfUp(correctedMmol, DISPLAY_DECIMALS),
    unitLabel: serumCaUnit === 'mgdl' ? 'мг/дл' : 'ммоль/л',
  };
}
