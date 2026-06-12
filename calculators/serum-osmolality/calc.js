/**
 * Расчёт осмоляльности сыворотки (MedSoftPro).
 * Осмоляльность = 2 × Na + глюкоза / 18 + АМК / 2,8
 */

export const DISPLAY_DECIMALS = 1;

export const NORMAL_RANGE = { min: 285, max: 295 };

export const FIELD_LIMITS = {
  serumNa: { min: 70, max: 200 },
  glucose: { min: 0.1, max: 150 },
  bun: { min: 0.1, max: 200 },
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

function inRange(value, limits) {
  return value >= limits.min && value <= limits.max;
}

export function serumOsmolality(serumNa, glucose, bun) {
  return 2 * serumNa + glucose / 18 + bun / 2.8;
}

export function calculate(input) {
  const serumNa = parsePositive(input.serumNa);
  const glucose = parsePositive(input.glucose);
  const bun = parsePositive(input.bun);

  if (serumNa == null || glucose == null || bun == null) {
    throw new Error('Заполните все поля');
  }
  if (!inRange(serumNa, FIELD_LIMITS.serumNa)) {
    throw new Error(
      `Натрий вне допустимого диапазона ${FIELD_LIMITS.serumNa.min}–${FIELD_LIMITS.serumNa.max}`
    );
  }
  if (!inRange(glucose, FIELD_LIMITS.glucose)) {
    throw new Error(
      `Глюкоза вне допустимого диапазона ${FIELD_LIMITS.glucose.min}–${FIELD_LIMITS.glucose.max}`
    );
  }
  if (!inRange(bun, FIELD_LIMITS.bun)) {
    throw new Error(`АМК вне допустимого диапазона ${FIELD_LIMITS.bun.min}–${FIELD_LIMITS.bun.max}`);
  }

  const osmolalityRaw = serumOsmolality(serumNa, glucose, bun);
  const osmolality = roundHalfUp(osmolalityRaw, DISPLAY_DECIMALS);

  return {
    serumNa,
    glucose,
    bun,
    osmolality,
    osmolalityRaw,
    unit: 'мосм/кг',
    summary: `${String(osmolality).replace('.', ',')} мосм/кг — осмоляльность сыворотки`,
  };
}
