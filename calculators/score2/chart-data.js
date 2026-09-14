/**
 * SCORE2 / SCORE2-OP chart tables — регион very high (эталон: ESC SCORE2 / SCORE2-OP charts).
 * Ячейки: [САД 160–179, 140–159, 120–139, 100–119] × [не-ЛПВП 3.0–3.9 … 6.0–6.9]
 */

export const NON_HDL_BANDS = [
  { key: 'n30', label: '3,0–3,9', min: 3.0, max: 3.999 },
  { key: 'n40', label: '4,0–4,9', min: 4.0, max: 4.999 },
  { key: 'n50', label: '5,0–5,9', min: 5.0, max: 5.999 },
  { key: 'n60', label: '6,0–6,9', min: 6.0, max: 6.999 },
];

export const SBP_BANDS = [
  { key: 's160', label: '160–179', min: 160, max: 179 },
  { key: 's140', label: '140–159', min: 140, max: 159 },
  { key: 's120', label: '120–139', min: 120, max: 139 },
  { key: 's100', label: '100–119', min: 100, max: 119 },
];

/** @type {Record<string, { label: string, min: number, max: number, model: 'score2'|'score2Op' }>} */
export const AGE_BANDS = {
  '40-44': { label: '40–44', min: 40, max: 44, model: 'score2' },
  '45-49': { label: '45–49', min: 45, max: 49, model: 'score2' },
  '50-54': { label: '50–54', min: 50, max: 54, model: 'score2' },
  '55-59': { label: '55–59', min: 55, max: 59, model: 'score2' },
  '60-64': { label: '60–64', min: 60, max: 64, model: 'score2' },
  '65-69': { label: '65–69', min: 65, max: 69, model: 'score2' },
  '70-74': { label: '70–74', min: 70, max: 74, model: 'score2Op' },
  '75-79': { label: '75–79', min: 75, max: 79, model: 'score2Op' },
  '80-84': { label: '80–84', min: 80, max: 84, model: 'score2Op' },
  '85-89': { label: '85–89', min: 85, max: 89, model: 'score2Op' },
};

/**
 * CHART[sex][ageBand][smokeKey] = 4×4 matrix (sbp rows × nonHdl cols)
 * smokeKey: '0' | '1'
 */
export const CHART = {
  male: {
    '40-44': {
      0: [
        [7, 9, 11, 13],
        [5, 6, 8, 10],
        [4, 5, 6, 7],
        [3, 4, 4, 5],
      ],
      1: [
        [14, 17, 20, 24],
        [11, 13, 16, 19],
        [8, 10, 12, 14],
        [6, 7, 9, 11],
      ],
    },
    '45-49': {
      0: [
        [9, 11, 13, 16],
        [7, 8, 10, 12],
        [5, 6, 8, 9],
        [4, 5, 6, 7],
      ],
      1: [
        [17, 20, 24, 28],
        [13, 16, 18, 22],
        [10, 12, 14, 17],
        [8, 9, 11, 13],
      ],
    },
    '50-54': {
      0: [
        [12, 14, 16, 19],
        [10, 11, 13, 15],
        [7, 9, 10, 12],
        [6, 7, 8, 9],
      ],
      1: [
        [21, 24, 28, 31],
        [17, 19, 22, 25],
        [13, 15, 17, 20],
        [10, 12, 14, 16],
      ],
    },
    '55-59': {
      0: [
        [16, 18, 20, 23],
        [13, 14, 16, 18],
        [10, 11, 13, 15],
        [8, 9, 10, 12],
      ],
      1: [
        [25, 28, 32, 35],
        [21, 23, 26, 29],
        [17, 19, 21, 24],
        [13, 15, 17, 19],
      ],
    },
    '60-64': {
      0: [
        [20, 23, 25, 27],
        [17, 19, 20, 22],
        [14, 15, 17, 18],
        [11, 12, 14, 15],
      ],
      1: [
        [31, 33, 36, 40],
        [25, 28, 31, 33],
        [21, 23, 25, 28],
        [17, 19, 21, 23],
      ],
    },
    '65-69': {
      0: [
        [26, 28, 30, 32],
        [22, 24, 26, 27],
        [18, 20, 21, 23],
        [15, 17, 18, 19],
      ],
      1: [
        [36, 39, 42, 44],
        [31, 33, 36, 38],
        [26, 28, 30, 33],
        [22, 24, 26, 28],
      ],
    },
    '70-74': {
      0: [
        [35, 37, 39, 40],
        [32, 33, 35, 36],
        [28, 30, 31, 33],
        [25, 26, 28, 29],
      ],
      1: [
        [43, 45, 47, 49],
        [39, 41, 42, 44],
        [35, 36, 38, 40],
        [31, 33, 34, 36],
      ],
    },
    '75-79': {
      0: [
        [40, 42, 45, 48],
        [37, 39, 42, 44],
        [34, 36, 39, 41],
        [31, 33, 36, 38],
      ],
      1: [
        [45, 48, 51, 54],
        [42, 44, 47, 50],
        [39, 41, 44, 47],
        [36, 38, 41, 43],
      ],
    },
    '80-84': {
      0: [
        [44, 48, 52, 56],
        [42, 46, 49, 53],
        [40, 43, 47, 51],
        [38, 41, 45, 48],
      ],
      1: [
        [47, 51, 55, 59],
        [45, 49, 52, 56],
        [43, 46, 50, 54],
        [40, 44, 48, 51],
      ],
    },
    '85-89': {
      0: [
        [49, 54, 59, 64],
        [48, 53, 58, 63],
        [47, 52, 56, 61],
        [46, 50, 55, 60],
      ],
      1: [
        [49, 54, 59, 64],
        [48, 53, 58, 63],
        [47, 52, 56, 61],
        [46, 50, 55, 60],
      ],
    },
  },
  female: {
    '40-44': {
      0: [
        [5, 6, 7, 8],
        [4, 4, 5, 6],
        [3, 3, 3, 4],
        [2, 2, 2, 3],
      ],
      1: [
        [13, 15, 17, 19],
        [9, 11, 12, 14],
        [7, 8, 9, 10],
        [5, 6, 6, 7],
      ],
    },
    '45-49': {
      0: [
        [7, 8, 9, 10],
        [5, 6, 7, 8],
        [4, 4, 5, 6],
        [3, 3, 4, 4],
      ],
      1: [
        [16, 18, 21, 23],
        [12, 14, 15, 17],
        [9, 10, 12, 13],
        [7, 8, 9, 10],
      ],
    },
    '50-54': {
      0: [
        [10, 11, 12, 14],
        [8, 9, 9, 11],
        [6, 6, 7, 8],
        [4, 5, 5, 6],
      ],
      1: [
        [21, 23, 25, 28],
        [16, 18, 19, 22],
        [12, 13, 15, 17],
        [9, 10, 11, 13],
      ],
    },
    '55-59': {
      0: [
        [14, 15, 17, 18],
        [11, 12, 13, 14],
        [8, 9, 10, 11],
        [7, 7, 8, 9],
      ],
      1: [
        [26, 28, 31, 33],
        [21, 23, 24, 26],
        [16, 18, 19, 21],
        [13, 14, 15, 16],
      ],
    },
    '60-64': {
      0: [
        [20, 21, 22, 24],
        [16, 17, 18, 19],
        [12, 13, 14, 15],
        [10, 11, 11, 12],
      ],
      1: [
        [33, 35, 37, 39],
        [27, 29, 30, 32],
        [22, 23, 25, 26],
        [17, 18, 20, 21],
      ],
    },
    '65-69': {
      0: [
        [27, 28, 30, 31],
        [22, 23, 24, 26],
        [18, 19, 20, 21],
        [15, 16, 16, 17],
      ],
      1: [
        [41, 42, 44, 46],
        [34, 36, 37, 39],
        [28, 30, 31, 33],
        [23, 24, 26, 27],
      ],
    },
    '70-74': {
      0: [
        [37, 38, 39, 41],
        [33, 34, 35, 36],
        [29, 30, 31, 32],
        [26, 27, 28, 29],
      ],
      1: [
        [48, 49, 51, 52],
        [43, 44, 46, 47],
        [39, 40, 41, 43],
        [34, 36, 37, 38],
      ],
    },
    '75-79': {
      0: [
        [44, 46, 47, 48],
        [41, 42, 43, 45],
        [37, 39, 40, 41],
        [34, 35, 36, 37],
      ],
      1: [
        [53, 55, 56, 58],
        [49, 51, 52, 53],
        [46, 47, 48, 49],
        [42, 43, 44, 46],
      ],
    },
    '80-84': {
      0: [
        [53, 54, 55, 57],
        [50, 51, 52, 54],
        [47, 48, 49, 51],
        [44, 45, 47, 48],
      ],
      1: [
        [59, 60, 62, 63],
        [56, 57, 59, 60],
        [53, 54, 56, 57],
        [50, 51, 53, 54],
      ],
    },
    '85-89': {
      0: [
        [62, 63, 64, 65],
        [60, 61, 62, 63],
        [58, 59, 60, 61],
        [56, 57, 58, 60],
      ],
      1: [
        [65, 66, 67, 68],
        [63, 64, 65, 66],
        [61, 62, 63, 65],
        [59, 60, 61, 63],
      ],
    },
  },
};

export function ageBandKey(age) {
  for (const [key, band] of Object.entries(AGE_BANDS)) {
    if (age >= band.min && age <= band.max) return key;
  }
  return null;
}

export function sbpBandIndex(sbp) {
  return SBP_BANDS.findIndex((b) => sbp >= b.min && sbp <= b.max);
}

export function nonHdlBandIndex(nonHdl) {
  return NON_HDL_BANDS.findIndex((b) => nonHdl >= b.min && nonHdl <= b.max);
}

/**
 * Цвет ячейки по порогам ESC / МЗ РБ (как на chart).
 * @returns {'green'|'orange'|'red'}
 */
export function chartCellTone(age, riskPercent) {
  if (age < 50) {
    if (riskPercent < 2.5) return 'green';
    if (riskPercent < 7.5) return 'orange';
    return 'red';
  }
  if (age < 70) {
    if (riskPercent < 5) return 'green';
    if (riskPercent < 10) return 'orange';
    return 'red';
  }
  if (riskPercent < 7.5) return 'green';
  if (riskPercent < 15) return 'orange';
  return 'red';
}

/**
 * Выбор индекса полосы: содержащая + соседняя у границы.
 * У края полосы (нижние/верхние ~25%) возвращаем оба диапазона («между»).
 * Вне таблицы — ближайшая крайняя полоса (clamp), без «между».
 * @param {boolean} ascending — true, если полосы идут по возрастанию min (не-ЛПВП); false для САД (160→100).
 */
export function resolveBandIndices(value, bands, ascending = true) {
  let containIdx = bands.findIndex((b) => value >= b.min && value <= b.max);
  if (containIdx < 0) {
    // Clamp к крайней полосе таблицы (например не-ЛПВП ≥ 7 → колонка 6,0–6,9)
    if (value < bands.reduce((m, b) => Math.min(m, b.min), Infinity)) {
      const edge = ascending ? 0 : bands.length - 1;
      return { indices: [edge], mode: 'nearest', primaryIdx: edge, clamped: true };
    }
    if (value > bands.reduce((m, b) => Math.max(m, b.max), -Infinity)) {
      const edge = ascending ? bands.length - 1 : 0;
      return { indices: [edge], mode: 'nearest', primaryIdx: edge, clamped: true };
    }
    let best = Infinity;
    let nearest = 0;
    for (let i = 0; i < bands.length; i++) {
      const mid = (bands[i].min + bands[i].max) / 2;
      const d = Math.abs(value - mid);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    return { indices: [nearest], mode: 'nearest', primaryIdx: nearest, clamped: true };
  }

  const b = bands[containIdx];
  const width = Math.max(b.max - b.min, 1e-9);
  const t = (value - b.min) / width;
  const indices = [containIdx];
  let mode = 'nearest';

  const towardLowerValue = ascending ? containIdx - 1 : containIdx + 1;
  const towardHigherValue = ascending ? containIdx + 1 : containIdx - 1;

  if (t < 0.25 && value > b.min && towardLowerValue >= 0 && towardLowerValue < bands.length) {
    indices.push(towardLowerValue);
    mode = 'between';
  } else if (t > 0.75 && value < b.max && towardHigherValue >= 0 && towardHigherValue < bands.length) {
    indices.push(towardHigherValue);
    mode = 'between';
  }

  indices.sort((a, b) => a - b);

  let primaryIdx = containIdx;
  let best = Infinity;
  for (const i of indices) {
    const mid = (bands[i].min + bands[i].max) / 2;
    const d = Math.abs(value - mid);
    if (d < best) {
      best = d;
      primaryIdx = i;
    }
  }

  return { indices, mode, primaryIdx, clamped: false };
}

/**
 * @param {{ sex: 'male'|'female', age: number, sbp: number, nonHdl: number, smoking: 0|1 }} input
 */
export function lookupChart(input) {
  const { sex, age, sbp, nonHdl, smoking } = input;
  const ageKey = ageBandKey(age);
  if (!ageKey) {
    return { status: 'OUT', message: 'Возраст вне диапазона таблиц SCORE2 / SCORE2-OP (40–89)' };
  }
  if (sbp < 90 || sbp > 200) {
    return { status: 'OUT', message: 'САД вне допустимого диапазона (90–200 мм рт.ст.)' };
  }
  if (!(nonHdl > 0)) {
    return { status: 'OUT', message: 'ХС не-ЛПВП должен быть больше 0' };
  }

  const sbpSel = resolveBandIndices(sbp, SBP_BANDS, false);
  const cholSel = resolveBandIndices(nonHdl, NON_HDL_BANDS, true);
  const smokeKey = smoking ? 1 : 0;
  const matrix = CHART[sex][ageKey][smokeKey];
  const band = AGE_BANDS[ageKey];

  const cells = [];
  for (const ri of sbpSel.indices) {
    for (const ci of cholSel.indices) {
      const risk = matrix[ri][ci];
      cells.push({
        sbpIdx: ri,
        cholIdx: ci,
        sbpLabel: SBP_BANDS[ri].label,
        cholLabel: NON_HDL_BANDS[ci].label,
        riskPercent: risk,
        primary: ri === sbpSel.primaryIdx && ci === cholSel.primaryIdx,
        tone: chartCellTone(age, risk),
      });
    }
  }

  cells.sort((a, b) => a.riskPercent - b.riskPercent);
  const risks = cells.map((c) => c.riskPercent);
  const riskMin = risks[0];
  const riskMax = risks[risks.length - 1];
  const primary = cells.find((c) => c.primary) || cells[0];
  const mode =
    sbpSel.mode === 'between' || cholSel.mode === 'between' || cells.length > 1
      ? 'between'
      : 'nearest';

  return {
    status: 'OK',
    mode,
    riskPercent: primary.riskPercent,
    riskMin,
    riskMax,
    ageBand: ageKey,
    ageLabel: band.label,
    model: band.model,
    modelLabel: band.model === 'score2Op' ? 'SCORE2-OP' : 'SCORE2',
    sex,
    smoking: smokeKey,
    smokeLabel: smokeKey ? 'курящие' : 'некурящие',
    sexLabel: sex === 'male' ? 'мужчины' : 'женщины',
    sbpIdx: primary.sbpIdx,
    cholIdx: primary.cholIdx,
    sbpLabel: primary.sbpLabel,
    cholLabel: primary.cholLabel,
    sbpIndices: sbpSel.indices,
    cholIndices: cholSel.indices,
    clamped: Boolean(sbpSel.clamped || cholSel.clamped),
    clampNote:
      sbpSel.clamped || cholSel.clamped
        ? 'Значение вне напечатанных границ таблицы — использована ближайшая крайняя ячейка (риск не ниже указанного).'
        : null,
    cells,
    matrix,
    tone: chartCellTone(age, primary.riskPercent),
  };
}
