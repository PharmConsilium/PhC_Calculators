/**
 * Объём распределения мочевины (ОРМ) ≈ объём общей воды организма (ОВО).
 * Формула Watson (1980):
 * M: 2,447 − 0,09516×возраст + 0,1074×рост(см) + 0,3362×масса(кг)
 * F: −2,097 + 0,1069×рост(см) + 0,2466×масса(кг)
 * Источник: Watson PE, Watson ID, Batt RD. Am J Clin Nutr. 1980;33(1):27-39.
 */

export function defaultInputs() {
  return {
    age: '',
    height: '',
    weight: '',
  };
}

export function parsePositive(raw) {
  const n = Number(String(raw ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function formatRu(n, digits = 2) {
  return n.toFixed(digits).replace('.', ',');
}

/** ОРМ / TBW (л), мужчины — Watson. */
export function calculateMaleLiters(ageYears, heightCm, weightKg) {
  return 2.447 - 0.09516 * ageYears + 0.1074 * heightCm + 0.3362 * weightKg;
}

/** ОРМ / TBW (л), женщины — Watson. */
export function calculateFemaleLiters(heightCm, weightKg) {
  return -2.097 + 0.1069 * heightCm + 0.2466 * weightKg;
}

export function isReady(input) {
  return (
    parsePositive(input?.age) != null &&
    parsePositive(input?.height) != null &&
    parsePositive(input?.weight) != null
  );
}

export function calculate(input) {
  const ageYears = parsePositive(input?.age);
  const heightCm = parsePositive(input?.height);
  const weightKg = parsePositive(input?.weight);
  if (ageYears == null || heightCm == null || weightKg == null) {
    throw new Error('Укажите возраст, рост и массу тела');
  }

  const maleL = round2(calculateMaleLiters(ageYears, heightCm, weightKg));
  const femaleL = round2(calculateFemaleLiters(heightCm, weightKg));
  if (!Number.isFinite(maleL) || !Number.isFinite(femaleL)) {
    throw new Error('Некорректный расчёт');
  }

  return {
    ageYears,
    heightCm,
    weightKg,
    maleL,
    femaleL,
    maleLabel: formatRu(maleL),
    femaleLabel: formatRu(femaleL),
  };
}
