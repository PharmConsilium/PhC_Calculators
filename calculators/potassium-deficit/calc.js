/**
 * Дефицит калия при гипокалиемии (Medsoftpro).
 * D = M × 0,2 × (K1 − K2), ммоль
 */

export const NORMAL_SERUM_K_MMOL_L = 5;
export const EXTRACELLULAR_FRACTION = 0.2;
export const MAX_DAILY_MMOL_PER_KG = 3;
export const MAX_INFUSION_RATE_MMOL_H = 20;
/** мг калия: D / 13,4 × 1000 (как в JS Medsoftpro) */
export const MG_PER_MMOL_DIVISOR = 13.4;
/** мл 4%-го KCl: мг / 40 (как в JS Medsoftpro) */
export const KCL_4_PERCENT_ML_PER_MG = 40;

export const KCL_SOLUTIONS = [
  { id: 'kcl75', label: '7,5%-го раствора KCl', percent: '7,5%' },
  { id: 'kcl4', label: '4%-го раствора KCl', percent: '4%' },
];

export function rnd(value) {
  return Math.round(value * 100) / 100;
}

export function rnd1(value) {
  return Math.round(value * 10) / 10;
}

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

function parseNonNegative(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function potassiumMg(deficitMmol) {
  return Math.round((deficitMmol / MG_PER_MMOL_DIVISOR) * 1000);
}

export function solutionVolumes(deficitMmol) {
  if (!(deficitMmol > 0)) {
    return { volume75Ml: 0, volume4Ml: 0, deficitMg: 0 };
  }
  const deficitMg = potassiumMg(deficitMmol);
  const volume75Ml = rnd1(deficitMmol);
  const volume4Ml = rnd1(rnd(deficitMg / KCL_4_PERCENT_ML_PER_MG));
  return { volume75Ml, volume4Ml, deficitMg };
}

export function potassiumDeficit(input) {
  const weight = parsePositive(input.weight);
  const serumK = parseNonNegative(input.serumK);

  if (weight == null || serumK == null) {
    return { status: 'INVALID' };
  }

  const decimals = input.decimals != null ? Number(input.decimals) : 1;
  const safeDecimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 2 ? decimals : 1;

  const k1 = NORMAL_SERUM_K_MMOL_L;
  const k2 = serumK;
  const delta = k1 - k2;
  const deficitMmol = roundHalfUp(weight * EXTRACELLULAR_FRACTION * delta, safeDecimals);
  const { volume75Ml, volume4Ml, deficitMg } = solutionVolumes(deficitMmol);
  const maxDailyMmol = roundHalfUp(weight * MAX_DAILY_MMOL_PER_KG, 0);

  const solutions =
    deficitMmol > 0
      ? [
          { id: 'kcl75', label: KCL_SOLUTIONS[0].label, percent: KCL_SOLUTIONS[0].percent, volumeMl: volume75Ml },
          { id: 'kcl4', label: KCL_SOLUTIONS[1].label, percent: KCL_SOLUTIONS[1].percent, volumeMl: volume4Ml },
        ]
      : [];

  let statusMessage;
  if (delta <= 0) {
    statusMessage =
      k2 >= k1
        ? 'Калий сыворотки не ниже нормы (5 ммоль/л) — дефицит не рассчитывается.'
        : 'Дефицит калия не выявлен.';
  } else if (k2 < 3.5) {
    statusMessage = 'Гипокалиемия. Рассчитан ориентировочный дефицит калия.';
  } else {
    statusMessage = 'Снижение калия сыворотки. Рассчитан ориентировочный дефицит калия.';
  }

  return {
    status: 'OK',
    weightKg: roundHalfUp(weight, 2),
    serumKMmolL: roundHalfUp(k2, 2),
    normalKMmolL: k1,
    deltaKMmolL: roundHalfUp(delta, safeDecimals),
    deficitMmol,
    deficitMgKcl: deficitMg,
    maxDailyMmol,
    maxInfusionRateMmolH: MAX_INFUSION_RATE_MMOL_H,
    solutions,
    statusMessage,
    decimals: safeDecimals,
    interpretation:
      deficitMmol > 0
        ? `Дефицит ${String(deficitMmol).replace('.', ',')} ммоль`
        : statusMessage,
  };
}

export function calculate(input) {
  const out = potassiumDeficit(input);
  if (out.status !== 'OK') throw new Error('Заполните все поля');
  return out;
}
