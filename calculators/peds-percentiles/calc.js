/**
 * Оценка физического развития детей — расчёт по стандартам ВОЗ (LMS, z-score).
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
  growthUnder5: 'Масса, длина тела (рост), масса/длина (рост), ИМТ до 5 лет',
  growthOver5: 'Масса, рост, масса/рост, ИМТ старше 5 лет',
  head: 'Окружность головы до 5 лет',
  fetal: 'Масса плода',
  birthweight: 'Масса при рождении',
  targetHeight: 'Потенциал роста ребёнка',
};

const INFANT_MAX_MONTHS = 24;
const MAX_GROWTH_UNDER5_MONTHS = 60;
const MIN_GROWTH_OVER5_MONTHS = 61;
const MAX_HEIGHT_OVER5_MONTHS = 228;
const MAX_WEIGHT_OVER5_MONTHS = 120;
const WFL_MIN_CM = 45;
const WFL_MAX_CM = 110;

function parseSex(sex) {
  if (sex === 'male' || sex === 'female') return sex;
  throw new Error('Укажите пол ребёнка');
}

function parseHeightMeasure(value, ageMonths) {
  if (value === 'L' || value === 'H') return value;
  return ageMonths < INFANT_MAX_MONTHS ? 'L' : 'H';
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

function resolveAgeLabel(input) {
  if (input.ageLabel) return input.ageLabel;
  if (input.birthDate && input.examDate) return formatAgeFromDates(input.birthDate, input.examDate);
  return '';
}

function weightForLengthKey(lengthCm, fineStep = true) {
  return fineStep ? Math.round(lengthCm * 10) / 10 : Math.round(lengthCm * 2) / 2;
}

function weightForLengthLabel(ageMonths, measure) {
  if (ageMonths >= MIN_GROWTH_OVER5_MONTHS) return 'Масса к росту';
  return measure === 'H' ? 'Масса к росту' : 'Масса к длине тела';
}

function heightAgeLabel(ageMonths, measure) {
  if (ageMonths >= MIN_GROWTH_OVER5_MONTHS) return 'Рост к возрасту';
  return measure === 'H' ? 'Рост к возрасту' : 'Длина тела к возрасту';
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

function growthLmsUnder5(sex, kind, ageDays, ageMonths, value, fromDates, measureUsed) {
  if (kind === 'head') {
    const ageX = fromDates ? whoAgeMonthsFromDays(ageDays) : whoCompletedMonths(ageMonths);
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
    const measure = measureUsed ?? (ageMonths < INFANT_MAX_MONTHS ? 'L' : 'H');
    const adj = adjustedHeightForLhfa(value, expected, measure);
    return lmsZScoreFromTableDiscrete(rows, day, adj);
  }
  return lmsZScoreFromTableDiscrete(dayTable[sex], day, value);
}

function growthLmsOver5(sex, kind, ageMonths, value) {
  const ageX = whoCompletedMonths(ageMonths);
  const table =
    kind === 'weight' ? whoLms.weightAgeOver5[sex] : whoLms.heightAgeOver5[sex];
  if (!table?.length) throw new Error('Нет данных для расчёта');
  return lmsZScoreFromTable(table, ageX, value);
}

function weightForLengthResult(sex, lengthCm, weightKg, ageMonths, measureUsed) {
  const useLengthTable = ageMonths < INFANT_MAX_MONTHS;
  const table = useLengthTable ? whoLms.dayWeightForLength[sex] : whoLms.dayWeightForHeight[sex];
  const expectedMeasure = useLengthTable ? 'L' : 'H';
  const measure = measureUsed ?? expectedMeasure;
  const adj = adjustedHeightForLhfa(lengthCm, expectedMeasure, measure);
  const key = weightForLengthKey(adj, useLengthTable);
  if (key < WFL_MIN_CM || key > WFL_MAX_CM) return null;
  return lmsZScoreFromTableKey(table, key, weightKg);
}

function calcGrowthBundle(input, options) {
  const sex = parseSex(input.sex);
  const { ageMonths, ageDays, fromDates } = resolveAge(input);
  const { minMonths, maxMonths, useDayTables } = options;

  if (ageMonths < minMonths) {
    throw new Error(
      minMonths >= MIN_GROWTH_OVER5_MONTHS
        ? 'Возраст должен быть старше 5 лет (61 мес.)'
        : 'Возраст вне диапазона'
    );
  }
  if (ageMonths > maxMonths) {
    throw new Error(
      maxMonths === MAX_GROWTH_UNDER5_MONTHS
        ? 'Возраст на дату осмотра превышает 5 лет (60 мес.)'
        : 'Возраст вне допустимого диапазона'
    );
  }

  const measure = parseHeightMeasure(input.heightMeasure, ageMonths);
  const results = [];
  const w =
    input.weightKg != null && input.weightKg !== '' ? Number(input.weightKg) : null;
  const h =
    input.heightCm != null && input.heightCm !== '' ? Number(input.heightCm) : null;

  if (w != null) {
    const wLms = useDayTables
      ? growthLmsUnder5(sex, 'weight', ageDays, ageMonths, w, fromDates)
      : growthLmsOver5(sex, 'weight', ageMonths, w);
    results.push(metricResult('Масса к возрасту', w, 'кг', wLms));
  }

  if (h != null) {
    const hLms = useDayTables
      ? growthLmsUnder5(sex, 'height', ageDays, ageMonths, h, fromDates, measure)
      : growthLmsOver5(sex, 'height', ageMonths, h);
    results.push(metricResult(heightAgeLabel(ageMonths, measure), h, 'см', hLms));
  }

  let bmiDisplay = null;
  if (w != null && h != null && h > 0) {
    const hm = h / 100;
    const bmi = w / (hm * hm);
    bmiDisplay = Math.round(bmi * 10) / 10;
    if (ageMonths > WHO_BMI_MAX_MONTHS) {
      throw new Error('Возраст вне диапазона ИМТ (до 19 лет)');
    }
    results.push(metricResult('ИМТ к возрасту', bmi, 'кг/м²', bmiLmsResult(sex, ageDays, ageMonths, bmi)));
  }

  if (w != null && h != null) {
    const wfl = weightForLengthResult(sex, h, w, ageMonths, measure);
    if (wfl) {
      results.push(metricResult(weightForLengthLabel(ageMonths, measure), w, 'кг', wfl));
    }
  }

  if (!results.length) throw new Error('Укажите хотя бы одно измерение');

  return {
    mode: options.mode,
    results,
    bmi: bmiDisplay,
    ageLabel: resolveAgeLabel(input),
    summary: results.map((r) => r.text).filter(Boolean).join('; '),
  };
}

function calcGrowthUnder5(input) {
  return calcGrowthBundle(input, {
    mode: 'growthUnder5',
    minMonths: 0,
    maxMonths: MAX_GROWTH_UNDER5_MONTHS,
    useDayTables: true,
  });
}

function calcGrowthOver5(input) {
  const { ageMonths } = resolveAge(input);
  if (ageMonths < MIN_GROWTH_OVER5_MONTHS) {
    throw new Error('Возраст должен быть старше 5 лет (61 мес.)');
  }
  if (ageMonths > MAX_HEIGHT_OVER5_MONTHS) {
    throw new Error('Возраст вне диапазона (до 19 лет для роста и ИМТ)');
  }
  const w =
    input.weightKg != null && input.weightKg !== '' ? Number(input.weightKg) : null;
  const h =
    input.heightCm != null && input.heightCm !== '' ? Number(input.heightCm) : null;
  if (w != null && h == null && ageMonths > MAX_WEIGHT_OVER5_MONTHS) {
    throw new Error('Масса к возрасту: возраст до 10 лет (120 мес.)');
  }
  return calcGrowthBundle(input, {
    mode: 'growthOver5',
    minMonths: MIN_GROWTH_OVER5_MONTHS,
    maxMonths: MAX_HEIGHT_OVER5_MONTHS,
    useDayTables: false,
  });
}

function calcHead(input) {
  const sex = parseSex(input.sex);
  const { ageMonths, ageDays, fromDates } = resolveAge(input);
  if (ageMonths > MAX_GROWTH_UNDER5_MONTHS) {
    throw new Error('Окружность головы: возраст до 5 лет (60 мес.)');
  }
  const hc = Number(input.headCm);
  const lms = growthLmsUnder5(sex, 'head', ageDays, ageMonths, hc, fromDates);
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
  if (!Number.isFinite(mother) || !Number.isFinite(father) || mother <= 0 || father <= 0) {
    throw new Error('Укажите рост матери и отца');
  }
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
    case 'growthUnder5':
    case 'baby':
      return calcGrowthUnder5(input);
    case 'growthOver5':
      return calcGrowthOver5(input);
    case 'head':
      return calcHead(input);
    case 'birthweight':
      return calcBirthWeight(input);
    case 'fetal':
      return calcFetal(input);
    case 'targetHeight':
      return calcTargetHeight(input);
    case 'bmi':
    case 'height':
    case 'weight':
      return calcGrowthUnder5({ ...input, mode: 'growthUnder5' });
    default:
      throw new Error('Неизвестный режим расчёта');
  }
}
