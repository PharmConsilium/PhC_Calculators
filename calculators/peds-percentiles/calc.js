/**
 * Процентили в педиатрии — расчёт по стандартам ВОЗ (LMS).
 * Референсы: Omni Calculator percentile tools, MSD (целевой рост).
 */
import whoLms from './data/who-lms.json' with { type: 'json' };
import omniBaby from './data/omni-baby-percentiles.json' with { type: 'json' };
import birthWeightData from './data/birth-weight.json' with { type: 'json' };
import fetalWeightData from './data/fetal-weight.json' with { type: 'json' };
import {
  ageYearsAndMonthsToMonths,
  interpolateLms,
  percentileFromLms,
  percentileBand,
  percentileFromOmniTable,
  omniPercentileBand,
  percentileFromOmniBirthWeight,
  percentileFromLmsCanal,
  percentileFromTable,
  hadlockFetalWeightG,
  targetHeightCm,
} from './lms.js';

export const MODES = {
  baby: 'Вес, рост, окружность головы до 2-х лет',
  birthweight: 'Вес при рождении',
  bmi: 'ИМТ',
  height: 'Рост до 5-ти лет',
  head: 'Окружность головы до 5-ти лет',
  weight: 'Вес до 5-ти лет',
  fetal: 'Вес плода',
  targetHeight: 'Потенциал роста ребенка на основании роста родителей',
};

function parseSex(sex) {
  if (sex === 'male' || sex === 'female') return sex;
  throw new Error('Укажите пол ребёнка');
}

function ageToMonths(input) {
  if (input.ageMonths != null && input.ageMonths !== '') {
    const m = Number(input.ageMonths);
    if (!Number.isFinite(m) || m < 0) throw new Error('Некорректный возраст');
    return m;
  }
  const years = Number(input.ageYears || 0);
  const months = Number(input.ageMonthsPart || 0);
  const days = Number(input.ageDays || 0);
  if (days > 0 && years === 0 && months === 0) return days / 30.4375;
  return years * 12 + months;
}

function lmsPercentile(table, sex, ageMonths, value) {
  const rows = table[sex];
  if (!rows?.length) throw new Error('Нет данных для расчёта');
  const lms = interpolateLms(rows, ageMonths);
  const p = percentileFromLms(value, lms.L, lms.M, lms.S);
  if (!Number.isFinite(p)) throw new Error('Некорректное значение измерения');
  return {
    percentile: Math.round(p * 10) / 10,
    band: percentileBand(p),
  };
}

function omniBabyTable(sex, kind) {
  const prefix = sex === 'male' ? 'boys' : 'girls';
  return omniBaby.tables[`${prefix}${kind}`];
}

function omniBabyPercentile(sex, kind, ageMonths, value) {
  const { percentileLo, percentileHi } = percentileFromOmniTable(
    ageMonths,
    value,
    omniBabyTable(sex, kind)
  );
  return {
    percentile: percentileLo,
    percentileHi,
    band: omniPercentileBand(percentileLo, percentileHi),
  };
}

function formatPercentileLabel(p, pHi) {
  if (pHi != null && pHi !== p) {
    return `${Math.round(p)}–${Math.round(pHi)}-й процентиль`;
  }
  return `${Math.round(p)}-й процентиль`;
}

function metricResult(label, value, unit, p, band, pHi) {
  const hi = pHi ?? p;
  return {
    label,
    value,
    unit,
    percentile: p,
    percentileHi: hi,
    band,
    text: `${label}: ${band} (${formatPercentileLabel(p, hi)})`,
  };
}

function calcBaby(input) {
  const sex = parseSex(input.sex);
  const ageMonths = ageToMonths(input);
  if (ageMonths > 24) throw new Error('Калькулятор младенца: возраст до 2 лет (24 мес.)');
  const results = [];
  if (input.weightKg != null && input.weightKg !== '') {
    const w = Number(input.weightKg);
    const { percentile, percentileHi, band } = omniBabyPercentile(sex, 'WeightPercentile', ageMonths, w);
    results.push(metricResult('Вес', w, 'кг', percentile, band, percentileHi));
  }
  if (input.heightCm != null && input.heightCm !== '') {
    const h = Number(input.heightCm);
    const { percentile, percentileHi, band } = omniBabyPercentile(sex, 'HeightPercentile', ageMonths, h);
    results.push(metricResult('Рост', h, 'см', percentile, band, percentileHi));
  }
  if (input.headCm != null && input.headCm !== '') {
    const hc = Number(input.headCm);
    const { percentile, percentileHi, band } = omniBabyPercentile(sex, 'CircumferencePercentile', ageMonths, hc);
    results.push(metricResult('Окружность головы', hc, 'см', percentile, band, percentileHi));
  }
  if (!results.length) throw new Error('Укажите хотя бы одно измерение');
  return { mode: 'baby', results, summary: results.map((r) => r.text).join('; ') };
}

function calcBmi(input) {
  const sex = parseSex(input.sex);
  const ageMonths = ageToMonths(input);
  if (ageMonths > 228) throw new Error('Возраст до 19 лет');
  const w = Number(input.weightKg);
  const h = Number(input.heightCm) / 100;
  if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0) {
    throw new Error('Укажите массу и рост');
  }
  const bmi = w / (h * h);
  const { percentile, band } = lmsPercentile(whoLms.bmiChild, sex, ageMonths, bmi);
  return {
    mode: 'bmi',
    bmi: Math.round(bmi * 100) / 100,
    percentile,
    band,
    summary: `ИМТ ${Math.round(bmi * 100) / 100} кг/м²: ${band}`,
  };
}

const MAX_HEIGHT_AGE_MONTHS = 60;

function calcHeight(input) {
  const sex = parseSex(input.sex);
  const ageMonths = ageToMonths(input);
  if (ageMonths > MAX_HEIGHT_AGE_MONTHS) {
    throw new Error('Процентиль роста: возраст до 5 лет (60 мес.)');
  }
  const h = Number(input.heightCm);
  const rows = whoLms.heightChild[sex];
  const { percentile, percentileLo, percentileHi, band } = percentileFromLmsCanal(rows, ageMonths, h);
  return {
    mode: 'height',
    heightCm: h,
    percentile,
    percentileLo,
    percentileHi,
    band,
    summary: `Рост ${h} см: ${band}`,
  };
}

const MAX_HEAD_AGE_MONTHS = 60;

function calcHead(input) {
  const sex = parseSex(input.sex);
  const ageMonths = ageToMonths(input);
  if (ageMonths > MAX_HEAD_AGE_MONTHS) {
    throw new Error('Окружность головы: возраст до 5 лет (60 мес.)');
  }
  const hc = Number(input.headCm);
  const rows = whoLms.headChild[sex];
  const { percentile, percentileLo, percentileHi, band } = percentileFromLmsCanal(rows, ageMonths, hc);
  return {
    mode: 'head',
    headCm: hc,
    percentile,
    percentileLo,
    percentileHi,
    band,
    summary: `ОГ ${hc} см: ${band}`,
  };
}

const MAX_WEIGHT_AGE_MONTHS = 60;

function calcWeight(input) {
  const sex = parseSex(input.sex);
  const ageMonths = ageToMonths(input);
  if (ageMonths > MAX_WEIGHT_AGE_MONTHS) {
    throw new Error('Вес: возраст до 5 лет (60 мес.)');
  }
  const w = Number(input.weightKg);
  const rows = whoLms.weightChild[sex];
  const { percentile, percentileLo, percentileHi, band } = percentileFromLmsCanal(rows, ageMonths, w);
  return {
    mode: 'weight',
    weightKg: w,
    percentile,
    percentileLo,
    percentileHi,
    band,
    summary: `Вес ${w} кг: ${band}`,
  };
}

function calcBirthWeight(input) {
  const week = Number(input.gestWeeks);
  const day = Number(input.gestDays || 0);
  const gestDays = week * 7 + day;
  const weightG = Number(input.weightG);
  if (!Number.isFinite(week) || week < 20 || week > 41) {
    throw new Error('Гестационный возраст 20–41 нед');
  }
  if (gestDays < 140 || gestDays > 300) {
    throw new Error('Гестационный возраст вне диапазона таблицы FMF (20–41 нед)');
  }
  const { percentile, percentileHi, band } = percentileFromOmniBirthWeight(
    weightG,
    gestDays,
    birthWeightData
  );
  return {
    mode: 'birthweight',
    weightG,
    gestWeeks: Math.round((gestDays / 7) * 10) / 10,
    percentile: Math.round(percentile * 10) / 10,
    percentileHi,
    band,
    summary: `Масса при рождении ${weightG} г (${week} нед. ${day} дн.): ${band}`,
  };
}

function calcFetal(input) {
  const sex = parseSex(input.sex);
  const week = Number(input.gestWeeks);
  const day = Number(input.gestDays || 0);
  const gestWeeks = week + day / 7;
  if (gestWeeks < 14 || gestWeeks > 40) throw new Error('Срок беременности 14–40 нед');

  const ac = Number(input.acCm);
  const fl = Number(input.flCm);
  const hc = Number(input.hcCm);
  const bpd = Number(input.bpdCm);
  const efwG = Math.round(hadlockFetalWeightG({ ac, fl, hc, bpd }));
  const { percentile, band } = percentileFromTable(efwG, gestWeeks, fetalWeightData);

  let note = 'Масса плода в пределах нормы';
  if (percentile < 10) note = 'Малый для гестационного возраста (МГВ, <10-го процентиля)';
  if (percentile > 90) note = 'Крупный для гестационного возраста (КГВ, >90-го процентиля)';

  return {
    mode: 'fetal',
    sex,
    gestWeeks: Math.round(gestWeeks * 10) / 10,
    efwG,
    percentile: Math.round(percentile * 10) / 10,
    band,
    note,
    summary: `Расчётная масса плода ${efwG} г: ${band}. ${note}`,
  };
}

function calcTargetHeight(input) {
  const sex = parseSex(input.sex);
  const mother = Number(input.motherHeightCm);
  const father = Number(input.fatherHeightCm);
  const { potentialCm, targetCm, rangeLowCm, rangeHighCm, zScore, percentile } = targetHeightCm(
    sex,
    mother,
    father
  );
  return {
    mode: 'targetHeight',
    potentialCm,
    targetCm,
    rangeLowCm,
    rangeHighCm,
    zScore,
    percentile,
    summary: `Потенциал роста ${potentialCm} см (${percentile}-й процентиль)`,
  };
}

export function calculate(input) {
  const mode = input.mode;
  switch (mode) {
    case 'baby':
      return calcBaby(input);
    case 'bmi':
      return calcBmi(input);
    case 'height':
      return calcHeight(input);
    case 'head':
      return calcHead(input);
    case 'weight':
      return calcWeight(input);
    case 'birthweight':
      return calcBirthWeight(input);
    case 'fetal':
      return calcFetal(input);
    case 'targetHeight':
      return calcTargetHeight(input);
    default:
      throw new Error('Неизвестный режим расчёта');
  }
}
