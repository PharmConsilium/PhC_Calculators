/**
 * Корригированный ХС ЛНП с учётом липопротеида(а) — NOA.
 * ХС ЛНПкорр Лп(а) (ммоль/л) = ХС ЛНП − 0,3 × Лп(а)(мг/дл) / 38,7
 * @see https://noatero.ru/ru/doctors/calculators/#c3
 */

export const LPA_CORRECTION_FACTOR = 0.3;
export const LPA_DIVISOR = 38.7;

export function truncTo2(value) {
  return Math.trunc(value * 100) / 100;
}

export function correctedLdlCents(ldlMmol, lpaMgDl) {
  return Math.trunc(correctedLdlMmol(ldlMmol, lpaMgDl) * 100);
}

function parseNonNegative(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function correctedLdlMmol(ldlMmol, lpaMgDl) {
  return ldlMmol - (LPA_CORRECTION_FACTOR * lpaMgDl) / LPA_DIVISOR;
}

export function ldlLpaCorrScore(input) {
  const ldlMmol = parseNonNegative(input.ldl);
  const lpaMgDl = parseNonNegative(input.lpa);

  if (ldlMmol == null || lpaMgDl == null) {
    return { status: 'INVALID' };
  }

  const correctedCents = correctedLdlCents(ldlMmol, lpaMgDl);
  const correctionCents = Math.trunc(((LPA_CORRECTION_FACTOR * lpaMgDl) / LPA_DIVISOR) * 100);

  return {
    status: 'OK',
    correctedLdl: correctedCents / 100,
    correction: correctionCents / 100,
  };
}

export function calculate(input) {
  const out = ldlLpaCorrScore(input);
  if (out.status !== 'OK') throw new Error('Заполните ХС ЛНП и липопротеид(а)');
  return out;
}
