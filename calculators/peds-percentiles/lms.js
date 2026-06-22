/** LMS z-score and percentile utilities (WHO). */

export const MAX_AGE_MONTHS = 24;
export const BODY_LENGTH_MAX_MONTHS = 24;

/** До 2 лет — «длина тела», после — «рост». */
export function heightMeasureLabel(ageMonths) {
  const m = Number(ageMonths);
  if (!Number.isFinite(m)) return 'Длина тела';
  return m <= BODY_LENGTH_MAX_MONTHS ? 'Длина тела' : 'Рост';
}

export function heightMeasureLabelGenitive(ageMonths) {
  return heightMeasureLabel(ageMonths) === 'Длина тела' ? 'длину тела' : 'рост';
}
const MS_PER_DAY = 86400000;
const DAYS_PER_MONTH = 30.4375;

export function parseIsoDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== dateStr) return null;
  return d;
}

/** Максимальный возраст по дням жизни для LMS-оценки роста/веса/ОГ (ВОЗ, до 5 лет). */
export const WHO_MAX_GROWTH_DAYS = 1856;
export const WHO_BMI_MIN_MONTHS = 61;
export const WHO_BMI_MAX_MONTHS = 228;
export const WHO_WEIGHT_MAX_MONTHS = 120;

/** Возраст в днях по дате рождения и дате осмотра. */
export function ageDaysFromDates(birthIso, examIso) {
  const birth = parseIsoDate(birthIso);
  const exam = parseIsoDate(examIso);
  if (!birth || !exam || exam < birth) return NaN;
  return (exam.getTime() - birth.getTime()) / MS_PER_DAY;
}

/** Возраст в месяцах по дате рождения и дате осмотра (средняя длина месяца 30,4375 дн.). */
export function ageMonthsFromDates(birthIso, examIso) {
  const days = ageDaysFromDates(birthIso, examIso);
  return Number.isFinite(days) ? days / DAYS_PER_MONTH : NaN;
}

/** Индекс возраста для LMS до 5 лет: дни жизни → доли месяца. */
export function whoAgeMonthsFromDays(ageDays) {
  return ageDays / DAYS_PER_MONTH;
}

/** Полные месяцы жизни (без округления вверх). */
export function whoCompletedMonths(ageMonths) {
  return Math.floor(ageMonths);
}

/** Поправка recumbent ↔ standing (ВОЗ / Anthro mobile). */
export const MEASURE_CORRECTION = 0.7;

/** Ожидаемый тип измерения в строке LHFA (L — длина тела, H — рост). */
export function lhfaExpectedMeasure(dayRow, ageMonths) {
  if (dayRow?.loh === 'H' || dayRow?.loh === 'L') return dayRow.loh;
  return Math.round(ageMonths) < 24 ? 'L' : 'H';
}

/** Коррекция ±0,7 см, если введённый тип не совпадает с таблицей. */
export function adjustedHeightForLhfa(heightCm, expectedMeasure, measureUsed) {
  if (!Number.isFinite(heightCm) || heightCm <= 0) return heightCm;
  const expected = expectedMeasure === 'H' ? 'H' : 'L';
  const used = measureUsed === 'H' ? 'H' : 'L';
  if (expected === 'L' && used === 'H') return heightCm + MEASURE_CORRECTION;
  if (expected === 'H' && used === 'L') return heightCm - MEASURE_CORRECTION;
  return heightCm;
}

/** Округление z-score до знаков (как Anthro mobile, r2). */
export function roundZScore(z, decimals = 2) {
  if (!Number.isFinite(z)) return NaN;
  const f = 10 ** decimals;
  return Math.round(z * f) / f;
}

export function formatZScore(z) {
  if (!Number.isFinite(z)) return '—';
  const t = roundZScore(z, 2);
  const s = t.toFixed(2).replace('.', ',');
  return t > 0 ? `+${s}` : s;
}

/** Человекочитаемый возраст: годы, месяцы, дни. */
export function formatAgeFromDates(birthIso, examIso) {
  const birth = parseIsoDate(birthIso);
  const exam = parseIsoDate(examIso);
  if (!birth || !exam || exam < birth) return '';

  let years = exam.getUTCFullYear() - birth.getUTCFullYear();
  let months = exam.getUTCMonth() - birth.getUTCMonth();
  let days = exam.getUTCDate() - birth.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(exam.getUTCFullYear(), exam.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) {
    const mod10 = years % 10;
    const mod100 = years % 100;
    let word = 'лет';
    if (mod10 === 1 && mod100 !== 11) word = 'год';
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'года';
    parts.push(`${years} ${word}`);
  }
  if (months > 0) parts.push(`${months} мес.`);
  if (years === 0 && months === 0) parts.push(`${days} дн.`);
  return parts.join(' ') || '0 дн.';
}

/** Верхняя граница массы для режимов роста (кг). */
export const MAX_GROWTH_WEIGHT_KG = 250;

/** Масса в одном поле: кг (по умолчанию) или г. */
export function weightWithUnitToKg(value, unit, maxKg = MAX_GROWTH_WEIGHT_KG) {
  const s = value === null || value === undefined ? '' : String(value).trim();
  if (!s) return NaN;
  const n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return NaN;
  const maxG = maxKg * 1000;
  if (unit === 'g') {
    if (n > maxG) return NaN;
    return n / 1000;
  }
  if (n > maxKg) return NaN;
  return n;
}

/** Возраст: отдельно годы и/или месяцы (хотя бы одно поле). */
export function ageYearsAndMonthsToMonths(yearsValue, monthsValue, maxMonths = MAX_AGE_MONTHS) {
  const yearsStr =
    yearsValue === null || yearsValue === undefined ? '' : String(yearsValue).trim();
  const monthsStr =
    monthsValue === null || monthsValue === undefined ? '' : String(monthsValue).trim();
  if (!yearsStr && !monthsStr) return NaN;

  const years = yearsStr ? parseInt(yearsStr.replace(',', '.'), 10) : 0;
  const months = monthsStr ? parseInt(monthsStr.replace(',', '.'), 10) : 0;
  if (!Number.isFinite(years) || years < 0) return NaN;
  if (!Number.isFinite(months) || months < 0) return NaN;
  if (years > 0 && months > 11) return NaN;
  if (years === 0 && months > maxMonths) return NaN;

  const total = years * 12 + months;
  return total > maxMonths ? NaN : total;
}

/** Масса: отдельно кг и/или г (хотя бы одно поле). */
export function weightKgAndGramsToKg(kgValue, gramsValue) {
  const kgStr = kgValue === null || kgValue === undefined ? '' : String(kgValue).trim();
  const gStr = gramsValue === null || gramsValue === undefined ? '' : String(gramsValue).trim();
  if (!kgStr && !gStr) return NaN;

  if (!gStr) {
    const kgOnly = Number(kgStr.replace(',', '.'));
    if (!Number.isFinite(kgOnly) || kgOnly <= 0 || kgOnly > 30) return NaN;
    return kgOnly;
  }

  const kg = kgStr ? parseInt(kgStr.replace(',', '.'), 10) : 0;
  const grams = parseInt(gStr.replace(',', '.'), 10);
  if (!Number.isFinite(kg) || kg < 0) return NaN;
  if (!Number.isFinite(grams) || grams < 0) return NaN;
  if (kg > 0 && grams > 999) return NaN;
  if (kg === 0 && grams > 25000) return NaN;

  const total = kg + grams / 1000;
  return total > 0 && total <= 30 ? total : NaN;
}

/** LMS z-score с коррекцией SD23 за пределами ±3 SD (ВОЗ 2006, §5.2). */
export function lmsZ(value, L, M, S) {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(M) || M <= 0) return NaN;
  let z =
    Math.abs(L) < 1e-7 ? Math.log(value / M) / S : (Math.pow(value / M, L) - 1) / (L * S);
  if (!Number.isFinite(z)) return NaN;
  if (z > 3) {
    const s3 = M * (1 + L * S * 3) ** (1 / L);
    const s2 = M * (1 + L * S * 2) ** (1 / L);
    if (Number.isFinite(s3) && Number.isFinite(s2) && s3 !== s2) {
      z = 3 + (value - s3) / (s3 - s2);
    }
  } else if (z < -3) {
    const t3 = 1 + L * S * -3;
    const t2 = 1 + L * S * -2;
    const s3 = M * (t3 > 1e-9 ? t3 : 1e-9) ** (1 / L);
    const s2 = M * (t2 > 1e-9 ? t2 : 1e-9) ** (1 / L);
    if (Number.isFinite(s3) && Number.isFinite(s2) && s2 !== s3) {
      z = -3 + (value - s3) / (s2 - s3);
    }
  }
  return z;
}

/** Возраст в днях для таблиц igrowup (округление, как Anthro mobile). */
export function whoGrowthAgeDays(ageDays, ageMonths) {
  const days = Number.isFinite(ageDays) ? ageDays : ageMonths * DAYS_PER_MONTH;
  return Math.round(days);
}

export function zToPercentile(z) {
  if (!Number.isFinite(z)) return NaN;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p * 100;
}

export function percentileFromLms(value, L, M, S) {
  return zToPercentile(lmsZ(value, L, M, S));
}

export function interpolateLms(table, x) {
  const rows = table.filter((r) => r.x != null && Number.isFinite(r.x));
  if (!rows.length) return null;
  if (x <= rows[0].x) return rows[0];
  if (x >= rows[rows.length - 1].x) return rows[rows.length - 1];
  for (let i = 0; i < rows.length - 1; i += 1) {
    const a = rows[i];
    const b = rows[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return {
        x,
        L: a.L + t * (b.L - a.L),
        M: a.M + t * (b.M - a.M),
        S: a.S + t * (b.S - a.S),
      };
    }
  }
  return rows[rows.length - 1];
}

/** Значение измерения на заданном процентиле (LMS, бинарный поиск). */
export function lmsValueAtPercentile(table, ageMonths, percentile) {
  const lms = interpolateLms(table, ageMonths);
  if (!lms?.M) return NaN;
  let lo = lms.M * 0.5;
  let hi = lms.M * 1.5;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    const p = percentileFromLms(mid, lms.L, lms.M, lms.S);
    if (p < percentile) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Клинические центильные коридоры (ВОЗ): 3, 10, 25, 50, 75, 97. */
export const CLINICAL_CORRIDOR_EDGES = [3, 10, 25, 50, 75, 97];

export function clinicalPercentileCorridor(p) {
  if (!Number.isFinite(p)) return '—';
  if (p < CLINICAL_CORRIDOR_EDGES[0]) return 'ниже 3-го процентиля';
  if (p >= CLINICAL_CORRIDOR_EDGES[CLINICAL_CORRIDOR_EDGES.length - 1]) return 'выше 97-го процентиля';
  for (let i = 0; i < CLINICAL_CORRIDOR_EDGES.length - 1; i += 1) {
    const lo = CLINICAL_CORRIDOR_EDGES[i];
    const hi = CLINICAL_CORRIDOR_EDGES[i + 1];
    if (p >= lo && p < hi) return `${lo}–${hi}-й процентиль`;
  }
  return 'выше 97-го процентиля';
}

function lmsResultFromRow(lms, value) {
  const z = lmsZ(value, lms.L, lms.M, lms.S);
  if (!Number.isFinite(z)) throw new Error('Некорректное значение измерения');
  const percentile = Math.round(zToPercentile(z) * 10) / 10;
  return {
    zScore: z,
    percentile,
    percentileLo: percentile,
    percentileHi: percentile,
    band: clinicalPercentileCorridor(percentile),
  };
}

/** Z-score и процентиль по LMS (L, M, S); процентиль — из z-score. */
export function lmsZScoreFromTable(table, ageX, value) {
  const lms = interpolateLms(table, ageX);
  if (!lms) throw new Error('Нет данных для расчёта');
  return lmsResultFromRow(lms, value);
}

/** LMS по дискретному ключу (целый месяц или см), как Anthro mobile. */
export function lmsZScoreFromTableDiscrete(table, keyX, value) {
  const rows = table.filter((r) => r.x != null && Number.isFinite(r.x));
  if (!rows.length) throw new Error('Нет данных для расчёта');
  const xKey = Math.floor(keyX);
  const exact = rows.find((r) => r.x === xKey);
  if (exact) return lmsResultFromRow(exact, value);
  return lmsZScoreFromTable(table, keyX, value);
}

/** LMS по точному ключу x (дни, 0,1 см), без floor — как lookup в Anthro mobile. */
export function lmsZScoreFromTableKey(table, keyX, value) {
  const rows = table.filter((r) => r.x != null && Number.isFinite(r.x));
  if (!rows.length) throw new Error('Нет данных для расчёта');
  const exact = rows.find((r) => r.x === keyX);
  if (exact) return lmsResultFromRow(exact, value);
  return lmsZScoreFromTable(table, keyX, value);
}

/** WHO LMS: z-score, процентиль и клинический коридор. */
export function percentileFromLmsCanal(table, ageMonths, value) {
  return lmsZScoreFromTable(table, ageMonths, value);
}

/** Пороги Omni baby-percentile (P3/P15/P50/P85/P97) — только для интерполяции точного P. */
const OMNI_BABY_TABLE_PCT = [3, 15, 50, 85, 97];

export function exactPercentileFromOmniTable(ageMonths, value, table) {
  if (!Number.isFinite(ageMonths) || ageMonths < 0 || ageMonths > 24) {
    throw new Error('Возраст вне диапазона таблицы');
  }
  const roundedAge = Math.round(ageMonths);
  const thresholds = table[String(roundedAge)] || table[roundedAge];
  if (!thresholds?.length) throw new Error('Нет данных для расчёта');
  if (value < thresholds[0]) {
    const frac = thresholds[0] > 0 ? value / thresholds[0] : 0;
    return Math.max(0.1, 3 * frac);
  }
  if (value >= thresholds[4]) {
    return 97;
  }
  for (let i = 0; i < thresholds.length - 1; i += 1) {
    if (value >= thresholds[i] && value < thresholds[i + 1]) {
      const pLo = OMNI_BABY_TABLE_PCT[i];
      const pHi = OMNI_BABY_TABLE_PCT[i + 1];
      const frac = (value - thresholds[i]) / (thresholds[i + 1] - thresholds[i]);
      return pLo + frac * (pHi - pLo);
    }
  }
  return 97;
}

/** Omni baby-percentile: точный P по таблице + клинический коридор. */
export function percentileFromOmniTable(ageMonths, value, table) {
  const exact = exactPercentileFromOmniTable(ageMonths, value, table);
  const percentile = Math.round(exact * 10) / 10;
  return {
    percentile,
    percentileLo: percentile,
    percentileHi: percentile,
    band: clinicalPercentileCorridor(exact),
  };
}

export function omniPercentileBand(lo, hi) {
  const p = lo === hi ? lo : (lo + hi) / 2;
  return clinicalPercentileCorridor(p);
}

export function percentileBand(p) {
  return clinicalPercentileCorridor(p);
}

const OMNI_BIRTH_PCT_LABELS = [5, 10, 25, 50, 75, 95];

function pickBirthWeightRowByDays(gestDays, points) {
  if (gestDays < points[0].days || gestDays > points[points.length - 1].days) {
    throw new Error('Гестационный возраст вне диапазона таблицы');
  }
  if (gestDays <= points[0].days) return points[0];
  for (let m = 1; m < points.length; m += 1) {
    if (gestDays <= points[m].days && gestDays > points[m - 1].days) return points[m];
  }
  return points[points.length - 1];
}

/** Вес при рождении — как Omni birthweight-percentile (Nicolaides FMF, по дням). */
export function percentileFromOmniBirthWeight(weightG, gestDays, tableData) {
  const row = pickBirthWeightRowByDays(gestDays, tableData.points);
  // bw: 0=P3, 1=P5, 2=P10, 3=P25, 4=P50, 5=P75, 6=P90, 7=P95, 8=P97
  const thresholds = [1, 2, 3, 4, 5, 7].map((i) => row.bw[i]);
  const p97 = row.bw[8];
  if (weightG < thresholds[0]) {
    return { percentile: 3, percentileHi: 3, band: clinicalPercentileCorridor(3) };
  }
  if (weightG >= p97) {
    return { percentile: 97, percentileHi: 97, band: clinicalPercentileCorridor(97) };
  }
  if (weightG >= thresholds[5]) {
    const frac = (weightG - thresholds[5]) / (p97 - thresholds[5]);
    const p = 95 + frac * 2;
    return {
      percentile: Math.round(p * 10) / 10,
      percentileHi: 97,
      band: clinicalPercentileCorridor(p),
    };
  }
  for (let i = 0; i < thresholds.length - 1; i += 1) {
    if (weightG >= thresholds[i] && weightG < thresholds[i + 1]) {
      const frac = (weightG - thresholds[i]) / (thresholds[i + 1] - thresholds[i]);
      const p = OMNI_BIRTH_PCT_LABELS[i] + frac * (OMNI_BIRTH_PCT_LABELS[i + 1] - OMNI_BIRTH_PCT_LABELS[i]);
      return {
        percentile: Math.round(p * 10) / 10,
        percentileHi: OMNI_BIRTH_PCT_LABELS[i + 1],
        band: clinicalPercentileCorridor(p),
      };
    }
  }
  return { percentile: 97, percentileHi: 97, band: clinicalPercentileCorridor(97) };
}

export function percentileFromTable(weightG, xValue, tableData) {
  const pctLabels = tableData.percentiles;
  const useDays = Array.isArray(tableData.points);
  const rows = useDays ? tableData.points : null;

  if (useDays) {
    const days = xValue;
    if (days < rows[0].days || days > rows[rows.length - 1].days) {
      throw new Error('Гестационный возраст вне диапазона таблицы');
    }
    let i0 = 0;
    for (let i = 0; i < rows.length - 1; i += 1) {
      if (days >= rows[i].days && days <= rows[i + 1].days) {
        i0 = i;
        break;
      }
    }
    const a = rows[i0];
    const b = rows[i0 + 1];
    const t = b.days === a.days ? 0 : (days - a.days) / (b.days - a.days);
    const thresholds = a.bw.map((v, i) => Math.round(v + t * (b.bw[i] - v)));
    return percentileFromThresholds(weightG, thresholds, pctLabels);
  }

  const weeks = tableData.weeks;
  const weekKeys = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);
  if (xValue < weekKeys[0] || xValue > weekKeys[weekKeys.length - 1]) {
    throw new Error('Гестационный возраст вне диапазона таблицы');
  }
  let w0 = weekKeys[0];
  let w1 = weekKeys[weekKeys.length - 1];
  for (let i = 0; i < weekKeys.length - 1; i += 1) {
    if (xValue >= weekKeys[i] && xValue <= weekKeys[i + 1]) {
      w0 = weekKeys[i];
      w1 = weekKeys[i + 1];
      break;
    }
  }
  const t = w0 === w1 ? 0 : (xValue - w0) / (w1 - w0);
  const row0 = weeks[String(w0)];
  const row1 = weeks[String(w1)];
  const thresholds = row0.map((v, i) => v + t * (row1[i] - v));
  return percentileFromThresholds(weightG, thresholds, pctLabels);
}

function percentileFromThresholds(weightG, thresholds, pctLabels) {
  if (weightG <= thresholds[0]) {
    const p = pctLabels[0] * 0.5;
    return { percentile: p, band: clinicalPercentileCorridor(p) };
  }
  const last = thresholds.length - 1;
  if (weightG >= thresholds[last]) {
    const p = pctLabels[last] + (100 - pctLabels[last]) * 0.5;
    return { percentile: p, band: clinicalPercentileCorridor(p) };
  }
  for (let i = 0; i < thresholds.length - 1; i += 1) {
    if (weightG >= thresholds[i] && weightG < thresholds[i + 1]) {
      const frac = (weightG - thresholds[i]) / (thresholds[i + 1] - thresholds[i]);
      const p = pctLabels[i] + frac * (pctLabels[i + 1] - pctLabels[i]);
      return {
        percentile: Math.round(p * 10) / 10,
        band: clinicalPercentileCorridor(p),
      };
    }
  }
  return { percentile: 50, band: clinicalPercentileCorridor(50) };
}

export function hadlockFetalWeightG({ ac, fl, hc, bpd }) {
  const log10 =
    1.3596 -
    0.00386 * ac * fl +
    0.0064 * hc +
    0.00061 * bpd * ac +
    0.0424 * ac +
    0.174 * fl;
  return Math.pow(10, log10);
}

/** WHO stature-for-age, 20 лет (240 мес.) — сравнение потенциала с популяцией. */
const ADULT_HEIGHT_LMS = {
  male: { L: 1.167279219, M: 176.8492322, S: 0.040369574 },
  female: { L: 1.108046193, M: 163.338251, S: 0.039636316 },
};

export function targetHeightCm(sex, motherCm, fatherCm) {
  const potential =
    sex === 'male'
      ? (motherCm + 13 + fatherCm) / 2
      : (fatherCm - 13 + motherCm) / 2;
  const potentialCm = Math.round(potential * 10) / 10;
  const lms = ADULT_HEIGHT_LMS[sex];
  const zScore = lmsZ(potentialCm, lms.L, lms.M, lms.S);
  const percentile = zToPercentile(zScore);
  return {
    potentialCm,
    targetCm: potentialCm,
    rangeLowCm: Math.round((potential - 8.5) * 10) / 10,
    rangeHighCm: Math.round((potential + 8.5) * 10) / 10,
    zScore,
    percentile: Math.round(percentile * 10) / 10,
  };
}
