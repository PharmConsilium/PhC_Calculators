/**
 * Коррекция скорости инфузии при гипонатриемии (Adrogue–Madias / Medscape).
 */

export const DEFAULT_NA_CHANGE_PER_HOUR = 0.25;
export const DEFAULT_IV_K = 0;
export const DISPLAY_DECIMALS = 1;

export const WATER_FRACTIONS = [
  { id: 'child', label: 'Ребёнок', value: 0.6 },
  { id: 'adult_female', label: 'Взрослая женщина', value: 0.5 },
  { id: 'elderly_female', label: 'Пожилая женщина', value: 0.45 },
  { id: 'adult_male', label: 'Взрослый мужчина', value: 0.6 },
  { id: 'elderly_male', label: 'Пожилой мужчина', value: 0.5 },
];

export const IV_NA_SOLUTIONS = [
  { id: 'nacl5', label: '5% NaCl', naMeqL: 855 },
  { id: 'nacl3', label: '3% NaCl', naMeqL: 513 },
  { id: 'nacl09', label: '0,9% NaCl (физиологический раствор)', naMeqL: 154 },
  {
    id: 'ringer',
    label: 'Раствор Рингера с лактатом (содержит 4 мэкв/л K⁺)',
    naMeqL: 134,
  },
];

export const FIELD_LIMITS = {
  naChangePerHour: { min: 0.01, max: 2 },
  serumNa: { min: 80, max: 180 },
  weight: { min: 1, max: 300 },
  ivK: { min: 0, max: 200 },
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

function inRange(value, limits) {
  return value >= limits.min && value <= limits.max;
}

export function waterFractionById(id) {
  const item = WATER_FRACTIONS.find((w) => w.id === id);
  return item ? item.value : null;
}

export function ivNaById(id) {
  const item = IV_NA_SOLUTIONS.find((s) => s.id === id);
  return item ? item.naMeqL : null;
}

export function tbwPlusOne(waterFraction, weightKg) {
  return waterFraction * weightKg + 1;
}

/** Изменение сывороточного Na на литр инфузата, ммоль/л. */
export function changeSerumNaPerLiter(serumNa, ivNa, ivK, waterFraction, weightKg) {
  const deltaInfusate = ivNa + ivK - serumNa;
  if (deltaInfusate <= 0) {
    throw new Error('Концентрация инфузата (Na + K) должна превышать натрий сыворотки');
  }
  return deltaInfusate / tbwPlusOne(waterFraction, weightKg);
}

/** Скорость инфузии, мл/ч. */
export function infusionRateMlPerHr(naChangePerHour, serumNa, ivNa, ivK, waterFraction, weightKg) {
  const deltaInfusate = ivNa + ivK - serumNa;
  if (deltaInfusate <= 0) {
    throw new Error('Концентрация инфузата (Na + K) должна превышать натрий сыворотки');
  }
  return (1000 * naChangePerHour * tbwPlusOne(waterFraction, weightKg)) / deltaInfusate;
}

export function calculate(input) {
  const naChangePerHour = parsePositive(input.naChangePerHour);
  const serumNa = parsePositive(input.serumNa);
  const weight = parsePositive(input.weight);
  const ivK = parseNonNegative(input.ivK);
  const waterFraction = waterFractionById(input.waterFraction);
  const ivNa = ivNaById(input.ivSolution);

  if (naChangePerHour == null || serumNa == null || weight == null || ivK == null) {
    throw new Error('Заполните все поля');
  }
  if (waterFraction == null || ivNa == null) {
    throw new Error('Выберите водную фракцию и раствор');
  }
  if (!inRange(naChangePerHour, FIELD_LIMITS.naChangePerHour)) {
    throw new Error(
      `Скорость коррекции вне диапазона ${FIELD_LIMITS.naChangePerHour.min}–${FIELD_LIMITS.naChangePerHour.max}`
    );
  }
  if (!inRange(serumNa, FIELD_LIMITS.serumNa)) {
    throw new Error(
      `Натрий сыворотки вне диапазона ${FIELD_LIMITS.serumNa.min}–${FIELD_LIMITS.serumNa.max}`
    );
  }
  if (!inRange(weight, FIELD_LIMITS.weight)) {
    throw new Error(`Масса тела вне диапазона ${FIELD_LIMITS.weight.min}–${FIELD_LIMITS.weight.max}`);
  }
  if (!inRange(ivK, FIELD_LIMITS.ivK)) {
    throw new Error(`K⁺ инфузата вне диапазона ${FIELD_LIMITS.ivK.min}–${FIELD_LIMITS.ivK.max}`);
  }

  const changePerLiterRaw = changeSerumNaPerLiter(serumNa, ivNa, ivK, waterFraction, weight);
  const infusionRateRaw = infusionRateMlPerHr(
    naChangePerHour,
    serumNa,
    ivNa,
    ivK,
    waterFraction,
    weight
  );

  return {
    naChangePerHour,
    serumNa,
    weight,
    ivK,
    waterFraction,
    ivNa,
    changePerLiter: roundHalfUp(changePerLiterRaw, DISPLAY_DECIMALS),
    changePerLiterRaw,
    infusionRateMlHr: roundHalfUp(infusionRateRaw, DISPLAY_DECIMALS),
    infusionRateRaw,
  };
}
