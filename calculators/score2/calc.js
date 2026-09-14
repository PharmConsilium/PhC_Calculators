/**
 * SCORE2 / SCORE2-OP — 10-летний риск фатальных и нефатальных СС-событий.
 * Регион: очень высокий риск (РБ / Восточная Европа).
 * Референс: ESC CVD Prevention Toolbox / HeartScore;
 * SCORE2 & SCORE2-OP working groups, Eur Heart J. 2021 (ehab309, ehab312).
 * Таблицы (chart): МЗ РБ № 1048 / ESC very high.
 *
 * diabetes в модели всегда 0 (UI без СД; SCORE2 не для пациентов с СД).
 */

import { lookupChart } from './chart-data.js';

export {
  CHART,
  AGE_BANDS,
  SBP_BANDS,
  NON_HDL_BANDS,
  lookupChart,
  chartCellTone,
  ageBandKey,
} from './chart-data.js';

export const AGE_MIN = 40;
export const AGE_MAX = 89;
export const SBP_MIN = 90;
export const SBP_MAX = 200;

const REGION = 'veryHigh';

/** scale1, scale2 для региона Very high */
const SCALES = {
  score2: {
    male: { scale1: 0.5836, scale2: 0.8294 },
    female: { scale1: 0.9412, scale2: 0.8329 },
  },
  score2Op: {
    male: { scale1: 0.05, scale2: 0.7 },
    female: { scale1: 0.38, scale2: 0.69 },
  },
};

function parsePositive(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseNonNegativeInt(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

function asSex(value) {
  const s = String(value || '').toLowerCase();
  if (s === 'male' || s === 'm' || s === 'мужской') return 'male';
  if (s === 'female' || s === 'f' || s === 'женский') return 'female';
  return null;
}

function asSmoke(value) {
  if (value === true || value === 1 || value === '1' || value === 'yes' || value === 'да') return 1;
  if (value === false || value === 0 || value === '0' || value === 'no' || value === 'нет') return 0;
  return null;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function calibrate(uncalibrated, scale1, scale2) {
  const unc = Math.min(Math.max(uncalibrated, 1e-15), 1 - 1e-15);
  return 1 - Math.exp(-Math.exp(scale1 + scale2 * Math.log(-Math.log(1 - unc))));
}

function linearPredictorScore2(sex, age, smoker, sbp, diabetes, tc, hdl) {
  const cage = (age - 60) / 5;
  const csbp = (sbp - 120) / 20;
  const ctc = tc - 6;
  const chdl = (hdl - 1.3) / 0.5;

  if (sex === 'male') {
    return (
      0.3742 * cage +
      0.6012 * smoker +
      0.2777 * csbp +
      0.6457 * diabetes +
      0.1458 * ctc +
      -0.2698 * chdl +
      -0.0755 * cage * smoker +
      -0.0255 * cage * csbp +
      -0.0281 * cage * ctc +
      0.0426 * cage * chdl +
      -0.0983 * cage * diabetes
    );
  }

  return (
    0.4648 * cage +
    0.7744 * smoker +
    0.3131 * csbp +
    0.8096 * diabetes +
    0.1002 * ctc +
    -0.2606 * chdl +
    -0.1088 * cage * smoker +
    -0.0277 * cage * csbp +
    -0.0226 * cage * ctc +
    0.0613 * cage * chdl +
    -0.1272 * cage * diabetes
  );
}

function uncalibratedScore2(sex, lp) {
  const s0 = sex === 'male' ? 0.9605 : 0.9776;
  return 1 - s0 ** Math.exp(lp);
}

function linearPredictorScore2Op(sex, age, smoker, sbp, diabetes, tc, hdl) {
  const cage = age - 73;
  const csbp = sbp - 150;
  const ctc = tc - 6;
  const chdl = hdl - 1.4;

  if (sex === 'male') {
    return (
      0.0634 * cage +
      0.4245 * diabetes +
      0.3524 * smoker +
      0.0094 * csbp +
      0.085 * ctc +
      -0.3564 * chdl +
      -0.0174 * cage * diabetes +
      -0.0247 * cage * smoker +
      -0.0005 * cage * csbp +
      0.0073 * cage * ctc +
      0.0091 * cage * chdl
    );
  }

  return (
    0.0789 * cage +
    0.601 * diabetes +
    0.4921 * smoker +
    0.0102 * csbp +
    0.0605 * ctc +
    -0.304 * chdl +
    -0.0107 * cage * diabetes +
    -0.0255 * cage * smoker +
    -0.0004 * cage * csbp +
    -0.0009 * cage * ctc +
    0.0154 * cage * chdl
  );
}

function uncalibratedScore2Op(sex, lp) {
  if (sex === 'male') {
    return 1 - 0.7576 ** Math.exp(lp - 0.0929);
  }
  return 1 - 0.8082 ** Math.exp(lp - 0.229);
}

/**
 * Категория риска по порогам ESC 2021.
 * @returns {{ key: string, label: string }}
 */
export function classifyRisk(age, riskPercent) {
  const x = riskPercent;
  if (age < 50) {
    if (x < 2.5) return { key: 'lowModerate', label: 'низкий / умеренный риск' };
    if (x < 7.5) return { key: 'high', label: 'высокий риск' };
    return { key: 'veryHigh', label: 'очень высокий риск' };
  }
  if (age < 70) {
    if (x < 5) return { key: 'lowModerate', label: 'низкий / умеренный риск' };
    if (x < 10) return { key: 'high', label: 'высокий риск' };
    return { key: 'veryHigh', label: 'очень высокий риск' };
  }
  if (x < 7.5) return { key: 'lowModerate', label: 'низкий / умеренный риск' };
  if (x < 15) return { key: 'high', label: 'высокий риск' };
  return { key: 'veryHigh', label: 'очень высокий риск' };
}

export function nonHdl(totalChol, hdl) {
  return round1(totalChol - hdl);
}

/** Ключи стратегий вмешательства */
export const STRATEGY = {
  moz: {
    key: 'moz',
    label: 'МОЖ',
    detail: 'Модификация образа жизни',
    intensity: 0,
  },
  mozConsiderLp: {
    key: 'mozConsiderLp',
    label: 'Модификация образа жизни, возможно лекарственный препарат при неэффективности',
    detail: '',
    intensity: 1,
  },
  immediateLp: {
    key: 'immediateLp',
    label: 'Рекомендована терапия статином в дозах, необходимых для достижения целевого уровня ХС-ЛПНП',
    detail:
      'При недостижении цели на фоне максимально переносимых доз статинов — комбинированная терапия (эзетимиб и/или бемпедоевая кислота); при очень высоком риске и дальнейшем недостижении — добавить ингибиторы PCSK9 / инклисиран.',
    intensity: 2,
  },
  none: {
    key: 'none',
    label: '—',
    detail: 'В таблице рекомендаций для данной комбинации отдельная ячейка не указана',
    intensity: -1,
  },
};

/**
 * Целевые липиды по категории ССР (национальная таблица / ESC).
 * SCORE2 даёт объединённую категорию lowModerate — цели показываем для низкого и умеренного.
 */
export const LIPID_TARGETS = {
  low: {
    key: 'low',
    label: 'низкий риск',
    ldl: '< 3,0',
    ldlNote: null,
    nonHdl: '< 3,8',
    hdlMale: '1,0–2,0',
    hdlFemale: '1,2–2,2',
    tg: '< 1,7',
    lpa: '< 50 мг/дл (105 нмоль/л)',
  },
  moderate: {
    key: 'moderate',
    label: 'умеренный риск',
    ldl: '< 2,6',
    ldlNote: null,
    nonHdl: '< 3,4',
    hdlMale: '1,0–2,0',
    hdlFemale: '1,2–2,2',
    tg: '< 1,7',
    lpa: '< 50 мг/дл (105 нмоль/л)',
  },
  high: {
    key: 'high',
    label: 'высокий риск',
    ldl: '< 1,8',
    ldlNote: 'и снижение ХС ЛНП на 50% и более от исходного уровня',
    nonHdl: '< 2,6',
    hdlMale: '1,0–2,0',
    hdlFemale: '1,2–2,2',
    tg: '< 1,7',
    lpa: '< 30 мг/дл (62 нмоль/л)',
  },
  veryHigh: {
    key: 'veryHigh',
    label: 'очень высокий риск',
    ldl: '< 1,4',
    ldlNote: 'и снижение ХС ЛНП на 50% и более от исходного уровня',
    nonHdl: '< 2,2',
    hdlMale: '1,0–2,0',
    hdlFemale: '1,2–2,2',
    tg: '< 1,7',
    lpa: '< 30 мг/дл (62 нмоль/л)',
  },
};

/** @returns {'lt14'|'b14_18'|'b18_26'|'b26_30'|'b30_49'|'ge49'} */
export function ldlBand(ldl) {
  if (ldl < 1.4) return 'lt14';
  if (ldl < 1.8) return 'b14_18';
  if (ldl < 2.6) return 'b18_26';
  if (ldl < 3.0) return 'b26_30';
  if (ldl < 4.9) return 'b30_49';
  return 'ge49';
}

/**
 * Матрица стратегий: риск × уровень ХС ЛПНП без лечения.
 * veryHighPrimary — первичная профилактика (SCORE2); veryHighSecondary — вторичная (установленные ССЗ).
 */
const INTERVENTION_MATRIX = {
  low: {
    lt14: 'moz',
    b14_18: 'moz',
    b18_26: 'moz',
    b26_30: 'moz',
    b30_49: 'mozConsiderLp',
    ge49: 'none',
  },
  moderate: {
    lt14: 'moz',
    b14_18: 'moz',
    b18_26: 'moz',
    b26_30: 'mozConsiderLp',
    b30_49: 'mozConsiderLp',
    ge49: 'none',
  },
  high: {
    lt14: 'moz',
    b14_18: 'moz',
    b18_26: 'mozConsiderLp',
    b26_30: 'immediateLp',
    b30_49: 'immediateLp',
    ge49: 'immediateLp',
  },
  veryHighPrimary: {
    lt14: 'mozConsiderLp',
    b14_18: 'immediateLp',
    b18_26: 'immediateLp',
    b26_30: 'immediateLp',
    b30_49: 'immediateLp',
    ge49: 'immediateLp',
  },
  veryHighSecondary: {
    lt14: 'immediateLp',
    b14_18: 'immediateLp',
    b18_26: 'immediateLp',
    b26_30: 'immediateLp',
    b30_49: 'immediateLp',
    ge49: 'immediateLp',
  },
};

export function lipidTargetsForCategory(riskCategory, sex) {
  const hdlRange =
    sex === 'female'
      ? LIPID_TARGETS.high.hdlFemale
      : LIPID_TARGETS.high.hdlMale;

  if (riskCategory === 'lowModerate') {
    return {
      key: 'lowModerate',
      label: 'низкий / умеренный риск',
      ldl: `${LIPID_TARGETS.low.ldl} (низкий) / ${LIPID_TARGETS.moderate.ldl} (умеренный)`,
      ldlNote: null,
      nonHdl: `${LIPID_TARGETS.low.nonHdl} (низкий) / ${LIPID_TARGETS.moderate.nonHdl} (умеренный)`,
      hdl: hdlRange,
      tg: LIPID_TARGETS.low.tg,
      lpa: LIPID_TARGETS.low.lpa,
      rows: [LIPID_TARGETS.low, LIPID_TARGETS.moderate],
    };
  }
  if (riskCategory === 'high') {
    const t = LIPID_TARGETS.high;
    return {
      key: 'high',
      label: t.label,
      ldl: t.ldl,
      ldlNote: t.ldlNote,
      nonHdl: t.nonHdl,
      hdl: hdlRange,
      tg: t.tg,
      lpa: t.lpa,
      rows: [t],
    };
  }
  const t = LIPID_TARGETS.veryHigh;
  return {
    key: 'veryHigh',
    label: t.label,
    ldl: t.ldl,
    ldlNote: t.ldlNote,
    nonHdl: t.nonHdl,
    hdl: hdlRange,
    tg: t.tg,
    lpa: t.lpa,
    rows: [t],
  };
}

/**
 * @param {'low'|'moderate'|'high'|'veryHighPrimary'|'veryHighSecondary'|'lowModerate'} riskRow
 * @param {number} ldl
 */
export function interventionStrategy(riskRow, ldl) {
  const band = ldlBand(ldl);
  if (riskRow === 'lowModerate') {
    const lowKey = INTERVENTION_MATRIX.low[band];
    const modKey = INTERVENTION_MATRIX.moderate[band];
    if (lowKey === modKey) {
      const s = STRATEGY[lowKey];
      return { ...s, riskRow: 'lowModerate', ldlBand: band, split: false };
    }
    return {
      key: 'split',
      label: `низкий: ${STRATEGY[lowKey].label}; умеренный: ${STRATEGY[modKey].label}`,
      detail:
        'В объединённой категории SCORE2 «низкий / умеренный» стратегии для низкого и умеренного риска различаются — см. таблицу в примечании',
      intensity: Math.max(STRATEGY[lowKey].intensity, STRATEGY[modKey].intensity),
      riskRow: 'lowModerate',
      ldlBand: band,
      split: true,
      low: STRATEGY[lowKey],
      moderate: STRATEGY[modKey],
    };
  }
  const matrix = INTERVENTION_MATRIX[riskRow];
  if (!matrix) return { ...STRATEGY.none, riskRow, ldlBand: band, split: false };
  const key = matrix[band];
  if (key === 'immediateLp') {
    if (riskRow === 'high') {
      return {
        key: 'immediateLp',
        label:
          'Рекомендована терапия статином в дозах, необходимых для достижения целевого уровня ХС-ЛПНП',
        detail:
          'При недостижении целевого уровня ХС-ЛПНП на фоне максимально переносимых доз статинов рекомендовано рассмотреть комбинированную терапию: статин с эзетимибом и/или бемпедоевой кислотой.',
        intensity: 2,
        riskRow,
        ldlBand: band,
        split: false,
      };
    }
    return {
      key: 'immediateLp',
      label:
        'Рекомендована терапия статином в дозах, необходимых для достижения целевого уровня ХС-ЛПНП',
      detail:
        'При недостижении цели на фоне максимально переносимых доз статинов — комбинация с эзетимибом и/или бемпедоевой кислотой; при сохраняющемся недостижении цели добавить ингибиторы PCSK9 / инклисиран.',
      intensity: 2,
      riskRow,
      ldlBand: band,
      split: false,
    };
  }
  const s = STRATEGY[key];
  return { ...s, riskRow, ldlBand: band, split: false };
}

function withElderlyDyslipidemiaNote(strategy, age) {
  if (!strategy || age == null || age < 70) return strategy;
  if (strategy.key !== 'immediateLp' && strategy.key !== 'mozConsiderLp') return strategy;
  const elder =
    'Возраст не является ограничением или противопоказанием к гиполипидемической терапии. Для первичной профилактики у пожилых при высоком / очень высоком риске рекомендована терапия статином; при риске лекарственных взаимодействий — начинать статин с низкой дозы с титрацией до целевого уровня ХС-ЛПНП.';
  return {
    ...strategy,
    detail: strategy.detail ? `${strategy.detail} ${elder}` : elder,
  };
}

function matrixRowForScore2(riskCategory) {
  if (riskCategory === 'high') return 'high';
  if (riskCategory === 'veryHigh') return 'veryHighPrimary';
  return 'lowModerate';
}

/**
 * @param {{ sex: string, age: number|string, sbp: number|string, totalChol?: number|string, hdl?: number|string, nonHdl?: number|string, smoking: number|string|boolean, ldl?: number|string }} input
 */
export function score2Risk(input = {}) {
  const sex = asSex(input.sex);
  const age = parseNonNegativeInt(input.age);
  const sbp = parsePositive(input.sbp);
  const totalChol = parsePositive(input.totalChol);
  const hdl = parsePositive(input.hdl);
  const nonHdlDirect = parsePositive(input.nonHdl);
  const smoking = asSmoke(input.smoking);
  const ldlRaw = input.ldl;
  const hasLdl = ldlRaw !== null && ldlRaw !== undefined && String(ldlRaw).trim() !== '';
  const ldl = hasLdl ? parsePositive(ldlRaw) : null;

  if (sex == null) return { status: 'INVALID', message: 'Укажите пол' };
  if (age == null) return { status: 'INVALID', message: 'Укажите возраст' };
  if (age < AGE_MIN || age > AGE_MAX) {
    return {
      status: 'INVALID',
      message: `Возраст ${AGE_MIN}–${AGE_MAX} лет (SCORE2: 40–69, SCORE2-OP: 70–89)`,
    };
  }
  if (sbp == null) return { status: 'INVALID', message: 'Укажите САД' };
  if (sbp < SBP_MIN || sbp > SBP_MAX) {
    return { status: 'INVALID', message: `САД ${SBP_MIN}–${SBP_MAX} мм рт.ст.` };
  }

  let nonHdlValue = null;
  if (nonHdlDirect != null) {
    nonHdlValue = round1(nonHdlDirect);
  } else {
    if (totalChol == null) return { status: 'INVALID', message: 'Укажите общий холестерин' };
    if (hdl == null) return { status: 'INVALID', message: 'Укажите ХС ЛПВП' };
    if (totalChol < hdl) {
      return { status: 'INVALID', message: 'Общий холестерин не может быть меньше ЛПВП' };
    }
    nonHdlValue = nonHdl(totalChol, hdl);
  }

  if (smoking == null) return { status: 'INVALID', message: 'Укажите курение' };
  if (hasLdl && ldl == null) {
    return { status: 'INVALID', message: 'Некорректный ХС ЛПНП' };
  }

  const chart = lookupChart({
    sex,
    age,
    sbp,
    nonHdl: nonHdlValue,
    smoking,
  });

  if (chart.status !== 'OK') {
    return { status: 'INVALID', message: chart.message || 'Значения вне диапазона таблиц SCORE2' };
  }

  const model = chart.model;
  const modelLabel = chart.modelLabel;
  const riskPercent = chart.mode === 'between' ? chart.riskMax : chart.riskPercent;
  const riskDisplay =
    chart.mode === 'between' && chart.riskMin !== chart.riskMax
      ? `${chart.riskMin}–${chart.riskMax}`
      : String(chart.riskPercent);
  const category = classifyRisk(age, riskPercent);
  const lipidTargets = lipidTargetsForCategory(category.key, sex);
  const strategy =
    ldl != null
      ? withElderlyDyslipidemiaNote(interventionStrategy(matrixRowForScore2(category.key), ldl), age)
      : null;

  return {
    status: 'OK',
    region: REGION,
    model,
    modelLabel,
    sex,
    age,
    sbp,
    totalChol: totalChol ?? null,
    hdl: hdl ?? null,
    ldl,
    nonHdl: nonHdlValue,
    smoking,
    riskPercent,
    riskDisplay,
    riskMin: chart.riskMin,
    riskMax: chart.riskMax,
    riskMode: chart.mode,
    riskCategory: category.key,
    riskLabel: category.label,
    lipidTargets,
    strategy,
    chart,
    interpretation: `10-летний риск по таблице ${modelLabel}: ${riskDisplay.replace('.', ',')}% (${category.label}, регион очень высокого риска).`,
  };
}

/** Для тестов: только ключ стратегии */
export function interventionStrategyKey(riskRow, ldl) {
  return interventionStrategy(riskRow, ldl).key;
}

export function calculate(input) {
  const out = score2Risk(input);
  if (out.status !== 'OK') throw new Error(out.message || 'Заполните все поля');
  return out;
}
