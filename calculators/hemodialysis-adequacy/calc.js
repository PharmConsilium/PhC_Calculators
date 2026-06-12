/**
 * Адекватность гемодиализа (MedSoftPro / Daugirdas).
 */

export const DISPLAY_DECIMALS = 2;

export const ACCESS_TYPES = [
  { id: 'venovenous', label: 'Веновенозный' },
  { id: 'arteriovenous', label: 'Артериовенозный' },
];

export const EKT_V_THRESHOLDS = {
  ideal: 2.3,
  optimal: 1.6,
  adequate: 1.2,
};

export const URR_ADEQUATE_MIN = 65;

export const FIELD_LIMITS = {
  dialysisHours: { min: 0.5, max: 12 },
  dialysisMinutes: { min: 30, max: 720 },
  urea: { min: 0.1, max: 80 },
  weightLoss: { min: 0, max: 20 },
  weight: { min: 20, max: 250 },
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

function parseNonNegative(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function dialysisTimeHours(value, unit = 'hours') {
  return unit === 'minutes' ? value / 60 : value;
}

/** spKt/V по формуле Daugirdas; t — часы. */
export function spKtV(co, ct, tHours, dBw, bw) {
  const ratio = ct / co;
  const logTerm = ratio - 0.008 * tHours;
  if (logTerm <= 0) {
    throw new Error('Некорректные данные для расчёта spKt/V');
  }
  return -Math.log(logTerm) + (4 - 3.5 * ratio) * (dBw / bw);
}

/** eKt/V с учётом типа доступа; t — часы. */
export function eKtV(spKtVValue, tHours, access) {
  if (access === 'arteriovenous') {
    return spKtVValue - (0.6 * spKtVValue) / tHours + 0.03;
  }
  return spKtVValue - (0.47 * spKtVValue) / tHours + 0.02;
}

export function urrPercent(co, ct) {
  return 100 * (1 - ct / co);
}

export function interpretEKtV(value) {
  if (value >= EKT_V_THRESHOLDS.ideal) return 'идеальный гемодиализ';
  if (value >= EKT_V_THRESHOLDS.optimal) return 'оптимальный гемодиализ';
  if (value >= EKT_V_THRESHOLDS.adequate) return 'адекватный гемодиализ';
  return 'недостаточный гемодиализ';
}

export function interpretUrr(value) {
  return value >= URR_ADEQUATE_MIN
    ? 'достаточный процент снижения мочевины'
    : 'недостаточный процент снижения мочевины';
}

export function calculate(input) {
  const access = input.access === 'arteriovenous' ? 'arteriovenous' : 'venovenous';
  const timeUnit = input.timeUnit === 'minutes' ? 'minutes' : 'hours';
  const timeRaw = parsePositive(input.dialysisTime);
  const ureaPre = parsePositive(input.ureaPre);
  const ureaPost = parsePositive(input.ureaPost);
  const weightLoss = parseNonNegative(input.weightLoss);
  const weightPost = parsePositive(input.weightPost);

  if (timeRaw == null || ureaPre == null || ureaPost == null || weightLoss == null || weightPost == null) {
    throw new Error('Заполните все поля');
  }

  const tHours = dialysisTimeHours(timeRaw, timeUnit);
  const limits = timeUnit === 'minutes' ? FIELD_LIMITS.dialysisMinutes : FIELD_LIMITS.dialysisHours;
  if (timeRaw < limits.min || timeRaw > limits.max) {
    throw new Error(`Время диализа вне допустимого диапазона ${limits.min}–${limits.max}`);
  }
  if (ureaPre < FIELD_LIMITS.urea.min || ureaPre > FIELD_LIMITS.urea.max) {
    throw new Error(`Мочевина до диализа вне диапазона ${FIELD_LIMITS.urea.min}–${FIELD_LIMITS.urea.max}`);
  }
  if (ureaPost < FIELD_LIMITS.urea.min || ureaPost > FIELD_LIMITS.urea.max) {
    throw new Error(`Мочевина после диализа вне диапазона ${FIELD_LIMITS.urea.min}–${FIELD_LIMITS.urea.max}`);
  }
  if (weightLoss > FIELD_LIMITS.weightLoss.max) {
    throw new Error(`Потеря веса вне диапазона 0–${FIELD_LIMITS.weightLoss.max}`);
  }
  if (weightPost < FIELD_LIMITS.weight.min || weightPost > FIELD_LIMITS.weight.max) {
    throw new Error(`Вес пациента вне диапазона ${FIELD_LIMITS.weight.min}–${FIELD_LIMITS.weight.max}`);
  }

  const spRaw = spKtV(ureaPre, ureaPost, tHours, weightLoss, weightPost);
  const eRaw = eKtV(spRaw, tHours, access);
  const urrRaw = urrPercent(ureaPre, ureaPost);

  return {
    access,
    dialysisTimeHours: roundHalfUp(tHours, DISPLAY_DECIMALS),
    ureaPre,
    ureaPost,
    weightLoss,
    weightPost,
    spKtV: roundHalfUp(spRaw, DISPLAY_DECIMALS),
    eKtV: roundHalfUp(eRaw, DISPLAY_DECIMALS),
    urr: roundHalfUp(urrRaw, DISPLAY_DECIMALS),
    eKtVInterpretation: interpretEKtV(eRaw),
    urrInterpretation: interpretUrr(urrRaw),
  };
}
