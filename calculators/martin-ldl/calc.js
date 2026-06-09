/**
 * Уравнение Мартина для ХС-ЛПНП (Martin SS et al., JAMA 2013).
 * ХС не-ЛПВП = Общий холестерин − ХС ЛПВП
 * ХС ЛПНП = ХС не-ЛПВП − (Триглицериды / Новый коэффициент)
 */

export const NON_HDL_HEADERS = ['<100', '100–129', '130–159', '160–189', '190–219', '≥220'];

export const COEF_TABLE = [
  { tgMin: 7, tgMax: 49, coefs: [3.5, 3.4, 3.3, 3.3, 3.2, 3.1] },
  { tgMin: 50, tgMax: 56, coefs: [4.0, 3.9, 3.7, 3.6, 3.6, 3.4] },
  { tgMin: 57, tgMax: 61, coefs: [4.3, 4.1, 4.0, 3.9, 3.8, 3.6] },
  { tgMin: 62, tgMax: 66, coefs: [4.5, 4.3, 4.1, 4.0, 3.9, 3.9] },
  { tgMin: 67, tgMax: 71, coefs: [4.7, 4.4, 4.3, 4.2, 4.1, 3.9] },
  { tgMin: 72, tgMax: 75, coefs: [4.8, 4.6, 4.4, 4.2, 4.2, 4.1] },
  { tgMin: 76, tgMax: 79, coefs: [4.9, 4.6, 4.5, 4.3, 4.3, 4.2] },
  { tgMin: 80, tgMax: 83, coefs: [5.0, 4.8, 4.6, 4.4, 4.3, 4.2] },
  { tgMin: 84, tgMax: 87, coefs: [5.1, 4.8, 4.6, 4.5, 4.4, 4.3] },
  { tgMin: 88, tgMax: 92, coefs: [5.2, 4.9, 4.7, 4.6, 4.4, 4.3] },
  { tgMin: 93, tgMax: 96, coefs: [5.3, 5.0, 4.8, 4.7, 4.5, 4.4] },
  { tgMin: 97, tgMax: 100, coefs: [5.4, 5.1, 4.8, 4.7, 4.5, 4.3] },
  { tgMin: 101, tgMax: 105, coefs: [5.5, 5.2, 5.0, 4.7, 4.6, 4.5] },
  { tgMin: 106, tgMax: 110, coefs: [5.6, 5.3, 5.0, 4.8, 4.6, 4.5] },
  { tgMin: 111, tgMax: 115, coefs: [5.7, 5.4, 5.1, 4.9, 4.7, 4.5] },
  { tgMin: 116, tgMax: 120, coefs: [5.8, 5.5, 5.2, 5.0, 4.8, 4.6] },
  { tgMin: 121, tgMax: 126, coefs: [6.0, 5.5, 5.3, 5.0, 4.8, 4.6] },
  { tgMin: 127, tgMax: 132, coefs: [6.1, 5.7, 5.3, 5.1, 4.9, 4.7] },
  { tgMin: 133, tgMax: 138, coefs: [6.2, 5.8, 5.4, 5.2, 5.0, 4.7] },
  { tgMin: 139, tgMax: 146, coefs: [6.3, 5.9, 5.6, 5.3, 5.0, 4.8] },
  { tgMin: 147, tgMax: 154, coefs: [6.5, 6.0, 5.7, 5.4, 5.1, 4.8] },
  { tgMin: 155, tgMax: 163, coefs: [6.7, 6.2, 5.8, 5.4, 5.2, 4.9] },
  { tgMin: 164, tgMax: 173, coefs: [6.8, 6.3, 5.9, 5.5, 5.3, 5.0] },
  { tgMin: 174, tgMax: 185, coefs: [7.0, 6.5, 6.0, 5.7, 5.4, 5.1] },
  { tgMin: 186, tgMax: 201, coefs: [7.3, 6.7, 6.2, 5.8, 5.5, 5.2] },
  { tgMin: 202, tgMax: 220, coefs: [7.6, 6.9, 6.4, 6.0, 5.6, 5.3] },
  { tgMin: 221, tgMax: 247, coefs: [8.0, 7.2, 6.6, 6.2, 5.9, 5.4] },
  { tgMin: 248, tgMax: 292, coefs: [8.5, 7.6, 7.0, 6.5, 6.1, 5.6] },
  { tgMin: 293, tgMax: 399, coefs: [9.5, 8.3, 7.5, 7.0, 6.5, 5.9] },
  { tgMin: 400, tgMax: 13975, coefs: [11.9, 10.0, 8.8, 8.1, 7.5, 6.7] },
];

export const TG_MIN = 7;
export const TG_MAX = 13975;

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

export function getNonHdlColumn(nonHdl) {
  if (nonHdl < 100) return 0;
  if (nonHdl < 130) return 1;
  if (nonHdl < 160) return 2;
  if (nonHdl < 190) return 3;
  if (nonHdl < 220) return 4;
  return 5;
}

export function lookupCoefficient(tg, nonHdl) {
  if (tg < TG_MIN || tg > TG_MAX) return null;
  const col = getNonHdlColumn(nonHdl);
  for (const row of COEF_TABLE) {
    if (tg >= row.tgMin && tg <= row.tgMax) {
      return row.coefs[col];
    }
  }
  return null;
}

export function martinLdl(input) {
  const totalChol = parsePositive(input.totalChol);
  const hdl = parsePositive(input.hdl);
  const tg = parsePositive(input.triglycerides);

  if (totalChol == null || hdl == null || tg == null) {
    return { status: 'INVALID' };
  }

  const decimals = input.decimals != null ? Number(input.decimals) : 1;
  const safeDecimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 3 ? decimals : 1;

  const nonHdl = totalChol - hdl;
  const coefficient = lookupCoefficient(tg, nonHdl);

  if (coefficient == null) {
    return {
      status: 'INVALID',
      reason: tg < TG_MIN ? 'TG_BELOW_RANGE' : 'TG_ABOVE_RANGE',
    };
  }

  const ldl = nonHdl - tg / coefficient;

  return {
    status: 'OK',
    totalChol: roundHalfUp(totalChol, safeDecimals),
    hdl: roundHalfUp(hdl, safeDecimals),
    triglycerides: roundHalfUp(tg, safeDecimals),
    nonHdl: roundHalfUp(nonHdl, safeDecimals),
    coefficient: roundHalfUp(coefficient, 1),
    ldl: roundHalfUp(ldl, safeDecimals),
    decimals: safeDecimals,
  };
}

export function calculate(input) {
  const out = martinLdl(input);
  if (out.status !== 'OK') {
    if (out.reason === 'TG_BELOW_RANGE') {
      throw new Error(`Триглицериды вне диапазона таблицы (< ${TG_MIN} мг/дл)`);
    }
    if (out.reason === 'TG_ABOVE_RANGE') {
      throw new Error(`Триглицериды вне диапазона таблицы (> ${TG_MAX} мг/дл)`);
    }
    throw new Error('Заполните все поля');
  }
  return out;
}
