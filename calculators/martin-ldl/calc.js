/**
 * Расчёт ХС-ЛПНП (ммоль/л) по формулам NOA / Martin-Hopkins, Sampson, Friedewald.
 * @see https://noatero.ru/ru/doctors/calculators/
 */

/** Пороги не-ЛПВП (мг/дл) — индекс столбца матрицы K */
const M_ROW = [0, 100, 130, 160, 190, 220];

/** Пороги триглицеридов (мг/дл) — индекс строки матрицы K */
const M_COL = [
  7, 50, 57, 62, 67, 72, 76, 80, 84, 88, 93, 97, 101, 106, 111, 116, 121, 127, 133, 139, 147,
  155, 164, 174, 186, 202, 221, 248, 293, 400,
];

/** Матрица K (как на noatero.ru) */
const MARTIN_MATRIX = [
  [3.5, 3.4, 3.3, 3.3, 3.2, 3.1],
  [4.0, 3.9, 3.7, 3.6, 3.6, 3.4],
  [4.3, 4.1, 4.0, 3.9, 3.8, 3.6],
  [4.5, 4.3, 4.1, 4.0, 3.9, 3.9],
  [4.7, 4.4, 4.3, 4.2, 4.1, 3.9],
  [4.8, 4.6, 4.4, 4.2, 4.2, 4.1],
  [4.9, 4.6, 4.5, 4.3, 4.3, 4.3],
  [5.0, 4.8, 4.6, 4.4, 4.3, 4.2],
  [5.1, 4.8, 4.6, 4.5, 4.4, 4.3],
  [5.2, 4.9, 4.7, 4.6, 4.4, 4.3],
  [5.3, 5.0, 4.8, 4.7, 4.5, 4.4],
  [5.4, 5.1, 4.8, 4.7, 4.5, 4.3],
  [5.5, 5.2, 5.0, 4.7, 4.6, 4.3],
  [5.6, 5.3, 5.0, 4.8, 4.6, 4.5],
  [5.7, 5.4, 5.1, 4.9, 4.7, 4.5],
  [5.8, 5.5, 5.2, 5.0, 4.8, 4.6],
  [6.0, 5.5, 5.3, 5.0, 4.8, 4.6],
  [6.1, 5.7, 5.3, 5.1, 4.9, 4.7],
  [6.2, 5.8, 5.4, 5.2, 5.0, 4.7],
  [6.3, 5.9, 5.6, 5.3, 5.0, 4.8],
  [6.5, 6.0, 5.7, 5.4, 5.1, 4.8],
  [6.7, 6.2, 5.8, 5.4, 5.2, 4.9],
  [6.8, 6.3, 5.9, 5.5, 5.3, 5.0],
  [7.0, 6.5, 6.0, 5.7, 5.4, 5.1],
  [7.3, 6.7, 6.2, 5.8, 5.5, 5.2],
  [7.6, 6.9, 6.4, 6.0, 5.6, 5.3],
  [8.0, 7.2, 6.6, 6.2, 5.9, 5.4],
  [8.5, 7.6, 7.0, 6.5, 6.1, 5.6],
  [9.5, 8.3, 7.5, 7.0, 6.5, 5.9],
  [11.9, 10.0, 8.8, 8.1, 7.5, 6.2],
];

const TG_MMOL_TO_MG_DL = 1 / 0.0113;
const K_MMOL_SCALE = 0.43658;

export const TG_MMOL_MAX_MARTIN = 4.5;
export const TG_MMOL_MAX_FRIEDEWALD = 4.5;
export const TG_MMOL_MAX_SAMPSON = 9;

export function truncTo2(value) {
  return Math.trunc(value * 100 + Number.EPSILON) / 100;
}

function parsePositive(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function lookupMartinIndices(tgMgDl) {
  let iRow = 0;
  let iCol = 0;
  for (let key = 0; key < M_ROW.length; key += 1) {
    if (tgMgDl >= M_ROW[key]) iRow = key;
  }
  for (let key = 0; key < M_COL.length; key += 1) {
    if (tgMgDl >= M_COL[key]) iCol = key;
  }
  return { iRow, iCol };
}

/**
 * Мартин-Хопкинс (NOA): ХС ЛПНП = неЛПВП − ТГ / (K × 0,43658), ммоль/л
 */
export function martinLdlMmol(tcMmol, hdlMmol, tgMmol) {
  const nonHdlMmol = tcMmol - hdlMmol;
  const tgMgDl = tgMmol * TG_MMOL_TO_MG_DL;
  const { iRow, iCol } = lookupMartinIndices(tgMgDl);
  const k = MARTIN_MATRIX[iCol][iRow];
  const divisor = k * K_MMOL_SCALE;
  return nonHdlMmol - tgMmol / divisor;
}

/** Сэмпсон (NOA, ммоль/л) */
export function sampsonLdlMmol(tcMmol, hdlMmol, tgMmol) {
  const nonHdlMmol = tcMmol - hdlMmol;
  return (
    tcMmol / 0.948 -
    hdlMmol / 0.971 -
    (tgMmol / 3.74 + (tgMmol * nonHdlMmol) / 24.16 - (tgMmol * tgMmol) / 79.36) -
    0.244
  );
}

/** Фридвальд: ХС ЛПНП = ОХ − ЛПВП − ТГ / 2,2 (ммоль/л) */
export function friedewaldLdlMmol(tcMmol, hdlMmol, tgMmol) {
  return tcMmol - hdlMmol - tgMmol / 2.2;
}

export function ldlFormulas(input) {
  const tcMmol = parsePositive(input.totalChol);
  const hdlMmol = parsePositive(input.hdl);
  const tgMmol = parsePositive(input.triglycerides);

  if (tcMmol == null || hdlMmol == null || tgMmol == null) {
    return { status: 'INVALID' };
  }

  const warnings = [];
  if (tgMmol >= TG_MMOL_MAX_MARTIN) {
    warnings.push('При триглицеридах ≥ 4,5 ммоль/л формула Мартина-Хопкинса не применима');
  }
  if (tgMmol >= TG_MMOL_MAX_FRIEDEWALD) {
    warnings.push('При триглицеридах ≥ 4,5 ммоль/л формула Фридвальда не применима');
  }
  if (tgMmol > TG_MMOL_MAX_SAMPSON) {
    warnings.push('При триглицеридах > 9 ммоль/л формула Сэмпсона не применима');
  }

  return {
    status: 'OK',
    martinLdl: truncTo2(martinLdlMmol(tcMmol, hdlMmol, tgMmol)),
    sampsonLdl: truncTo2(sampsonLdlMmol(tcMmol, hdlMmol, tgMmol)),
    friedewaldLdl: truncTo2(friedewaldLdlMmol(tcMmol, hdlMmol, tgMmol)),
    warnings,
  };
}

export function calculate(input) {
  const out = ldlFormulas(input);
  if (out.status !== 'OK') throw new Error('Заполните все поля');
  return out;
}
