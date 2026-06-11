/**
 * Процентили в педиатрии — расчёт по стандартам ВОЗ (LMS, z-score).
 */
import whoLms from './data/who-lms.json' with { type: 'json' };
import birthWeightData from './data/birth-weight.json' with { type: 'json' };
import fetalWeightData from './data/fetal-weight.json' with { type: 'json' };
import {
  ageDaysFromDates,
  ageMonthsFromDates,
  formatAgeFromDates,
  adjustedHeightForLhfa,
  formatZScore,
  heightMeasureLabel,
  heightMeasureLabelGenitive,
  lhfaExpectedMeasure,
  lmsZScoreFromTable,
  lmsZScoreFromTableDiscrete,
  lmsZScoreFromTableKey,
  percentileFromOmniBirthWeight,
  whoAgeMonthsFromDays,
  whoCompletedMonths,
  whoGrowthAgeDays,
  WHO_MAX_GROWTH_DAYS,
  WHO_BMI_MAX_MONTHS,
  percentileFromTable,
  hadlockFetalWeightG,
  targetHeightCm,
} from './lms.js';

export const MODES = {
  baby: 'Масса, длина тела, окружность головы до 2-х лет',
  birthweight: 'Масса при рождении',
  bmi: 'ИМТ',
  height: 'Длина тела / рост до 5-ти лет',
  head: 'Окружность головы до 5-ти лет',
  weight: 'Масса до 5-ти лет',
  fetal: 'Масса плода',
  targetHeight: 'Потенциал роста ребенка на основании роста родителей',
};

const INFANT_MAX_MONTHS = 24;
const WFL_MIN_CM = 45;
const WFL_MAX_CM = 110;

function parseSex(sex) {
  if (sex === 'male' || sex === 'female') return sex;
  throw new Error('Укажите пол ребёнка');
}

function ageToMonths(input) {
  if (input.birthDate && input.examDate) {
    const m = ageMonthsFromDates(input.birthDate, input.examDate);
    if (!Number.isFinite(m) || m < 0) throw new Error('Некорректные даты');
    return m;
  }
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

function resolveAge(input) {
  const ageMonths = ageToMonths(input);
  const fromDates = Boolean(input.birthDate && input.examDate);
  let ageDays = NaN;
  if (fromDates) {
    ageDays = ageDaysFromDates(input.birthDate, input.examDate);
  } else if (Number.isFinite(ageMonths)) {
    ageDays = ageMonths * 30.4375;
  }
  return { ageMonths, ageDays, fromDates };
}

/**
 * Индекс возраста LMS до 5 лет.
 * По датам — доли месяца из дней жизни; при вводе возраста — полные месяцы (вниз).
 */
function growthAgeX(ageDays, ageMonths, fromDates) {
  const days = Number.isFinite(ageDays) ? ageDays : ageMonths * 30.4375;
  if (days > WHO_MAX_GROWTH_DAYS) {
    throw new Error('Возраст вне диапазона ВОЗ (до 1856 дн. жизни)');
  }
  if (fromDates) return whoAgeMonthsFromDays(days);
  return whoCompletedMonths(ageMonths);
}

/** ИМТ к возрасту: до 60 мес. — дневные таблицы igrowup; с 61 мес. — месячные. */
function bmiLmsResult(sex, ageDays, ageMonths, bmi) {
  if (ageMonths <= 60) {
    const day = whoGrowthAgeDays(ageDays, ageMonths);
    return lmsZScoreFromTableDiscrete(whoLms.dayBmiAge[sex], day, bmi);
  }
  return lmsZScoreFromTableDiscrete(
    whoLms.bmiAge[sex],
    whoCompletedMonths(ageMonths),
    bmi
  );
}

function weightForLengthKey(lengthCm, fineStep = true) {
  return fineStep ? Math.round(lengthCm * 10) / 10 : Math.round(lengthCm * 2) / 2;
}

function resolveAgeLabel(input) {
  if (input.ageLabel) return input.ageLabel;
  if (input.birthDate && input.examDate) return formatAgeFromDates(input.birthDate, input.examDate);
  return '';
}

function weightForLengthResult(sex, lengthCm, weightKg, ageMonths) {
  const useDay = ageMonths < 24;
  const table = useDay ? whoLms.dayWeightForLength[sex] : whoLms.dayWeightForHeight[sex];
  const key = weightForLengthKey(lengthCm, useDay);
  if (key < WFL_MIN_CM || key > WFL_MAX_CM) return null;
  return lmsZScoreFromTableKey(table, key, weightKg);
}

function metricResult(label, value, unit, lms) {
  return {
    label,
    value,
    unit,
    percentile: lms.percentile,
    percentileHi: lms.percentileHi,
    zScore: lms.zScore,
    band: lms.band,
    text: `${label}: ${lms.band} (z = ${formatZScore(lms.zScore)})`,
  };
}

function valueOnlyResult(text) {
  return { text };
}

function growthLms(sex, kind, ageDays, ageMonths, value, fromDates, measureUsed) {
  if (kind === 'head') {
    const ageX = growthAgeX(ageDays, ageMonths, fromDates);
    const table = whoLms.headAge[sex];
    if (!fromDates && Number.isInteger(ageX)) {
      return lmsZScoreFromTableDiscrete(table, ageX, value);
    }
    return lmsZScoreFromTable(table, ageX, value);
  }
  const day = whoGrowthAgeDays(ageDays, ageMonths);
  if (day > WHO_MAX_GROWTH_DAYS) {
    throw new Error('Возраст вне диапазона ВОЗ (до 1856 дн. жизни)');
  }
  const dayTable =
    kind === 'weight' ? whoLms.dayWeightAge : kind === 'height' ? whoLms.dayHeightAge : null;
  if (!dayTable) throw new Error('Нет данных для расчёта');
  if (kind === 'height') {
    const rows = dayTable[sex];
    const row = rows.find((r) => r.x === day);
    const expected = lhfaExpectedMeasure(row, ageMonths);
    const measure =
      measureUsed ?? (ageMonths <= INFANT_MAX_MONTHS ? 'L' : 'H');
    const adj = adjustedHeightForLhfa(value, expected, measure);
    return lmsZScoreFromTableDiscrete(rows, day, adj);
  }
  return lmsZScoreFromTableDiscrete(dayTable[sex], day, value);
}

function calcBaby(input) {
  const sex = parseSex(input.sex);
  const { ageMonths, ageDays, fromDates } = resolveAge(input);
  if (ageMonths > 24) throw new Error('Калькулятор младенца: возраст до 2 лет (24 мес.)');
  const results = [];

  const w =
    input.weightKg != null && input.weightKg !== '' ? Number(input.weightKg) : null;
  const h =
    input.heightCm != null && input.heightCm !== '' ? Number(input.heightCm) : null;
  const hc = input.headCm != null && input.headCm !== '' ? Number(input.headCm) : null;

  if (w != null) {
    results.push(
      metricResult('Масса к возрасту', w, 'кг', growthLms(sex, 'weight', ageDays, ageMonths, w, fromDates))
    );
  }
  if (h != null) {
    const haz = growthLms(sex, 'height', ageDays, ageMonths, h, fromDates, 'L');
    results.push(metricResult('Длина тела к возрасту', h, 'см', haz));
  }
  let bmiDisplay = null;
  if (w != null && h != null && h > 0) {
    const hm = h / 100;
    const bmi = w / (hm * hm);
    bmiDisplay = Math.round(bmi * 10) / 10;
    const bmiLms = bmiLmsResult(sex, ageDays, ageMonths, bmi);
    results.push(metricResult('ИМТ к возрасту', bmi, 'кг/м²', bmiLms));
  }
  if (hc != null) {
    results.push(
      metricResult(
        'Окружность головы',
        hc,
        'см',
        growthLms(sex, 'head', ageDays, ageMonths, hc, fromDates)
      )
    );
  }
  if (w != null && h != null) {
    const wfl = weightForLengthResult(sex, h, w, ageMonths);
    if (wfl) {
      results.push(metricResult('Масса к длине тела', w, 'кг', wfl));
    }
  }
  if (!results.length) throw new Error('Укажите хотя бы одно измерение');
  return {
    mode: 'baby',
    results,
    bmi: bmiDisplay,
    ageLabel: resolveAgeLabel(input),
    summary: results.map((r) => r.text).filter(Boolean).join('; '),
  };
}

function calcBmi(input) {
  const sex = parseSex(input.sex);
  const { ageMonths, ageDays, fromDates } = resolveAge(input);
  if (ageMonths > WHO_BMI_MAX_MONTHS) throw new Error('Возраст до 19 лет (228 мес.)');
  const w = Number(input.weightKg);
  const h = Number(input.heightCm) / 100;
  if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0) {
    throw new Error(`Укажите массу и ${heightMeasureLabelGenitive(ageMonths)}`);
  }
  const bmi = w / (h * h);
  const lms = bmiLmsResult(sex, ageDays, ageMonths, bmi);
  return {
    mode: 'bmi',
    bmi: Math.round(bmi * 100) / 100,
    percentile: lms.percentile,
    zScore: lms.zScore,
    band: lms.band,
    ageLabel: resolveAgeLabel(input),
    summary: `ИМТ ${Math.round(bmi * 100) / 100} кг/м²: ${lms.band} (z = ${formatZScore(lms.zScore)})`,
  };
}

const MAX_HEIGHT_AGE_MONTHS = 60;

function calcHeight(input) {
  const sex = parseSex(input.sex);
  const { ageMonths, ageDays, fromDates } = resolveAge(input);
  if (ageMonths > MAX_HEIGHT_AGE_MONTHS) {
    throw new Error('Возраст до 5 лет (60 мес.)');
  }
  const h = Number(input.heightCm);
  const heightLabel = heightMeasureLabel(ageMonths);
  const measure = ageMonths <= INFANT_MAX_MONTHS ? 'L' : 'H';
  const lms = growthLms(sex, 'height', ageDays, ageMonths, h, fromDates, measure);
  return {
    mode: 'height',
    heightCm: h,
    heightLabel,
    percentile: lms.percentile,
    zScore: lms.zScore,
    band: lms.band,
    ageLabel: resolveAgeLabel(input),
    summary: `${heightLabel}: ${lms.band} (z = ${formatZScore(lms.zScore)})`,
  };
}

const MAX_HEAD_AGE_MONTHS = 60;

function calcHead(input) {
  const sex = parseSex(input.sex);
  const { ageMonths, ageDays, fromDates } = resolveAge(input);
  if (ageMonths > MAX_HEAD_AGE_MONTHS) {
    throw new Error('Окружность головы: возраст до 5 лет (60 мес.)');
  }
  const hc = Number(input.headCm);
  const lms = growthLms(sex, 'head', ageDays, ageMonths, hc, fromDates);
  return {
    mode: 'head',
    headCm: hc,
    measureLabel: 'Окружность головы',
    percentile: lms.percentile,
    zScore: lms.zScore,
    band: lms.band,
    ageLabel: resolveAgeLabel(input),
    summary: `Окружность головы: ${lms.band} (z = ${formatZScore(lms.zScore)})`,
  };
}

const MAX_WEIGHT_AGE_MONTHS = 60;

function calcWeight(input) {
  const sex = parseSex(input.sex);
  const { ageMonths, ageDays, fromDates } = resolveAge(input);
  if (ageMonths > MAX_WEIGHT_AGE_MONTHS) {
    throw new Error('Масса: возраст до 5 лет (60 мес.)');
  }
  const w = Number(input.weightKg);
  const lms = growthLms(sex, 'weight', ageDays, ageMonths, w, fromDates);
  return {
    mode: 'weight',
    weightKg: w,
    measureLabel: 'Масса',
    percentile: lms.percentile,
    zScore: lms.zScore,
    band: lms.band,
    ageLabel: resolveAgeLabel(input),
    summary: `Масса: ${lms.band} (z = ${formatZScore(lms.zScore)})`,
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
