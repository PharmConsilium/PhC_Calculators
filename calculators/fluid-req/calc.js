/**
 * Физиологическая потребность в жидкости — правило 4-2-1 (мл/кг/ч).
 * 0–10 кг: 4 мл/кг/ч; 10–20 кг: +2 мл/кг/ч; >20 кг: +1 мл/кг/ч.
 * Источник: Гордеев, Александрович. АВС инфузионной терапии (2006).
 */

export function roundHalfUp(value, decimals) {
  if (!Number.isFinite(value)) return NaN;
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export function parseWeightInput(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return { error: true };
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return { error: true };
  return { value: n };
}

/** @returns {{ rateMlPerHour: number, breakdown: string }} */
export function fluidRate421(weightKg) {
  let rate;
  let breakdown;

  if (weightKg <= 10) {
    rate = 4 * weightKg;
    breakdown = `4 × ${formatNum(weightKg)} = ${formatNum(rate)} мл/ч`;
  } else if (weightKg <= 20) {
    const extra = weightKg - 10;
    rate = 40 + 2 * extra;
    breakdown = `40 + 2 × ${formatNum(extra)} = ${formatNum(rate)} мл/ч`;
  } else {
    const extra = weightKg - 20;
    rate = 60 + extra;
    breakdown = `60 + 1 × ${formatNum(extra)} = ${formatNum(rate)} мл/ч`;
  }

  return {
    rateMlPerHour: roundHalfUp(rate, 1),
    breakdown,
  };
}

function formatNum(n) {
  if (!Number.isFinite(n)) return '';
  const rounded = roundHalfUp(n, 2);
  return String(rounded).replace('.', ',');
}

export function calculate(input) {
  const parsed =
    typeof input.weightKg === 'number' ? { value: input.weightKg } : parseWeightInput(input.weightKg);
  if (!parsed || parsed.error) {
    throw new Error('Укажите массу тела больше 0');
  }
  if (parsed.value > 500) {
    throw new Error('Укажите массу до 500 кг');
  }

  const { rateMlPerHour, breakdown } = fluidRate421(parsed.value);
  const weight = parsed.value;
  return {
    maintenanceMlPerHour: rateMlPerHour,
    dailyMl: roundHalfUp(rateMlPerHour * 24, 0),
    bolusMl: roundHalfUp(weight * 20, 0),
    breakdown,
    status: 'OK',
  };
}
