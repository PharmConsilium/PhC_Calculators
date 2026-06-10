/**
 * Расчёт дозировки эуфиллина у детей до 16 лет (Medvestnik).
 * 1 мл 2,4% раствора = 24 мг чистого вещества.
 */

export const MG_PER_ML = 24;
export const LOADING_DILUTION_ML = 50;
export const LOADING_INFUSION_MIN = 30;
export const LOADING_DOSE_NO_PRIOR_MG_KG = 3;
export const LOADING_DOSE_PRIOR_MG_KG = 6;

export const AGE_BANDS = [
  { id: '0-3w', label: '0 – 3 недели', rateMgKgH: 0.1 },
  { id: '3-6w', label: '3 – 6 недель', rateMgKgH: 0.15 },
  { id: '6w-3m', label: '6 недель – 3 месяца', rateMgKgH: 0.5 },
  { id: '6m-9y', label: '6 месяцев – 9 лет', rateMgKgH: 1 },
  { id: '9-16y', label: '9 – 16 лет', rateMgKgH: 0.5 },
];

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

function parseBool(value) {
  if (value === true || value === 'true' || value === 'yes' || value === '1') return true;
  if (value === false || value === 'false' || value === 'no' || value === '0') return false;
  return null;
}

export function aminophyllinePeds(input) {
  const ageBand = AGE_BANDS.find((b) => b.id === input.age);
  const weight = parsePositive(input.weight);
  const infusionHours = parsePositive(input.infusionHours);
  const dilutionVolume = parsePositive(input.dilutionVolume);
  const priorTheophylline = parseBool(input.priorTheophylline);
  const reduceMaintenance = parseBool(input.reduceMaintenance);

  if (
    !ageBand ||
    weight == null ||
    infusionHours == null ||
    dilutionVolume == null ||
    priorTheophylline == null ||
    reduceMaintenance == null
  ) {
    return { status: 'INVALID' };
  }

  const loadingMgKg = priorTheophylline
    ? LOADING_DOSE_PRIOR_MG_KG
    : LOADING_DOSE_NO_PRIOR_MG_KG;
  const loadingMg = weight * loadingMgKg;
  const loadingMl = loadingMg / MG_PER_ML;
  const loadingRateMlH = LOADING_DILUTION_ML / (LOADING_INFUSION_MIN / 60);

  let maintenanceRateMgKgH = ageBand.rateMgKgH;
  if (reduceMaintenance) {
    maintenanceRateMgKgH /= 2;
  }

  const maintenanceMgPerH = weight * maintenanceRateMgKgH;
  const maintenanceMlPerH = maintenanceMgPerH / MG_PER_ML;
  const maintenanceMg = maintenanceMgPerH * infusionHours;
  const maintenanceMl = maintenanceMg / MG_PER_ML;
  const maintenanceInfusionRateMlH = dilutionVolume / infusionHours;

  return {
    status: 'OK',
    age: ageBand.id,
    weightKg: roundHalfUp(weight, 2),
    loadingMg: roundHalfUp(loadingMg, 1),
    loadingMl: roundHalfUp(loadingMl, 2),
    loadingRateMlH: roundHalfUp(loadingRateMlH, 0),
    maintenanceMg: roundHalfUp(maintenanceMg, 2),
    maintenanceMl: roundHalfUp(maintenanceMl, 2),
    maintenanceMgPerH: roundHalfUp(maintenanceMgPerH, 2),
    maintenanceMlPerH: roundHalfUp(maintenanceMlPerH, 2),
    maintenanceInfusionRateMlH: roundHalfUp(maintenanceInfusionRateMlH, 1),
    priorTheophylline,
    reduceMaintenance,
    maintenanceRateMgKgH: roundHalfUp(maintenanceRateMgKgH, 2),
  };
}

export function calculate(input) {
  const out = aminophyllinePeds(input);
  if (out.status !== 'OK') throw new Error('Заполните все поля');
  return out;
}
