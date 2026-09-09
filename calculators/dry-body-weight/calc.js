/**
 * Сухой вес тела / lean body weight (СМТ) по росту.
 * M: СМТ = 0,73 × рост(см) − 59,42
 * F: СМТ = 0,65 × рост(см) − 50,74
 * Источник: Burton ME et al. Clin Pharm. 1986;5(2):143-9.
 */

export const SEX_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];

export function defaultInputs() {
  return {
    sex: 'male',
    height: '',
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

/** СМТ (кг) по росту (см) и полу. */
export function calculateSmtKg(sex, heightCm) {
  if (sex === 'male') return 0.73 * heightCm - 59.42;
  return 0.65 * heightCm - 50.74;
}

export function isReady(input) {
  return parsePositive(input?.height) != null;
}

export function calculate(input) {
  const sex = input?.sex === 'female' ? 'female' : 'male';
  const heightCm = parsePositive(input?.height);
  if (heightCm == null) throw new Error('Укажите рост');

  const smtKg = round2(calculateSmtKg(sex, heightCm));
  if (!Number.isFinite(smtKg)) throw new Error('Некорректный расчёт');

  const formula =
    sex === 'male'
      ? `СМТ = 0,73 × ${formatRu(heightCm, heightCm % 1 === 0 ? 0 : 1)} − 59,42`
      : `СМТ = 0,65 × ${formatRu(heightCm, heightCm % 1 === 0 ? 0 : 1)} − 50,74`;

  return {
    smtKg,
    smtLabel: formatRu(smtKg),
    heightCm,
    sex,
    formula,
    note: formula,
  };
}
