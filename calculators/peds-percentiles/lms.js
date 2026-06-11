/** LMS z-score and percentile utilities (WHO). */

export const MAX_AGE_MONTHS = 24;

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

export function lmsZ(value, L, M, S) {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(M) || M <= 0) return NaN;
  if (Math.abs(L) < 1e-7) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
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

/** WHO LMS: точный процентиль + канал P3/P15/P50/P85/P97 (как Omni child-height-percentile). */
export function percentileFromLmsCanal(table, ageMonths, value) {
  const lms = interpolateLms(table, ageMonths);
  if (!lms) throw new Error('Нет данных для расчёта');
  const exact = percentileFromLms(value, lms.L, lms.M, lms.S);
  if (!Number.isFinite(exact)) throw new Error('Некорректное значение измерения');

  const thresholds = OMNI_PCT_LABELS.map((p) => lmsValueAtPercentile(table, ageMonths, p));
  let percentileLo;
  let percentileHi;
  if (value < thresholds[0]) {
    percentileLo = 3;
    percentileHi = 3;
  } else if (value >= thresholds[4]) {
    percentileLo = 97;
    percentileHi = 97;
  } else {
    let found = false;
    for (let i = 0; i < thresholds.length - 1; i += 1) {
      if (value >= thresholds[i] && value < thresholds[i + 1]) {
        percentileLo = OMNI_PCT_LABELS[i];
        percentileHi = OMNI_PCT_LABELS[i + 1];
        found = true;
        break;
      }
    }
    if (!found) {
      percentileLo = 97;
      percentileHi = 97;
    }
  }

  return {
    percentile: Math.round(exact * 10) / 10,
    percentileLo,
    percentileHi,
    band: omniPercentileBand(percentileLo, percentileHi),
  };
}

const BAND_EDGES = [3, 5, 10, 15, 25, 50, 75, 85, 90, 95, 97];

const OMNI_PCT_LABELS = [3, 15, 50, 85, 97];

/** Omni baby-percentile: пороги P3/P15/P50/P85/P97 по целым месяцам (Math.round). */
export function percentileFromOmniTable(ageMonths, value, table) {
  if (!Number.isFinite(ageMonths) || ageMonths < 0 || ageMonths > 24) {
    throw new Error('Возраст вне диапазона таблицы');
  }
  const roundedAge = Math.round(ageMonths);
  const thresholds = table[String(roundedAge)] || table[roundedAge];
  if (!thresholds?.length) throw new Error('Нет данных для расчёта');
  if (value < thresholds[0]) {
    return { percentileLo: 3, percentileHi: 3 };
  }
  if (value > thresholds[4]) {
    return { percentileLo: 97, percentileHi: 97 };
  }
  for (let i = 0; i < thresholds.length - 1; i += 1) {
    if (value >= thresholds[i] && value < thresholds[i + 1]) {
      return {
        percentileLo: OMNI_PCT_LABELS[i],
        percentileHi: OMNI_PCT_LABELS[i + 1],
      };
    }
  }
  return { percentileLo: 97, percentileHi: 97 };
}

export function omniPercentileBand(lo, hi) {
  if (lo === hi) {
    if (lo <= 3) return 'ниже 3-го процентиля';
    if (lo >= 97) return 'выше 97-го процентиля';
    return `около ${lo}-го процентиля`;
  }
  return `между ${lo}-м и ${hi}-м процентилем`;
}

export function percentileBand(p) {
  if (!Number.isFinite(p)) return '—';
  const rounded = Math.round(p);
  for (let i = 0; i < BAND_EDGES.length - 1; i += 1) {
    const lo = BAND_EDGES[i];
    const hi = BAND_EDGES[i + 1];
    if (p >= lo && p < hi) {
      return `между ${lo}-м и ${hi}-м процентилем`;
    }
  }
  if (p < BAND_EDGES[0]) return `ниже ${BAND_EDGES[0]}-го процентиля`;
  return `выше ${BAND_EDGES[BAND_EDGES.length - 1]}-го процентиля`;
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
    return { percentile: 3, percentileHi: 3, band: 'ниже 5-го процентиля' };
  }
  if (weightG >= p97) {
    return { percentile: 97, percentileHi: 97, band: 'выше 95-го процентиля' };
  }
  if (weightG >= thresholds[5]) {
    const frac = (weightG - thresholds[5]) / (p97 - thresholds[5]);
    const p = 95 + frac * 2;
    return {
      percentile: Math.round(p * 10) / 10,
      percentileHi: 97,
      band: 'между 95-м и 97-м процентилем',
    };
  }
  for (let i = 0; i < thresholds.length - 1; i += 1) {
    if (weightG >= thresholds[i] && weightG < thresholds[i + 1]) {
      const frac = (weightG - thresholds[i]) / (thresholds[i + 1] - thresholds[i]);
      const p = OMNI_BIRTH_PCT_LABELS[i] + frac * (OMNI_BIRTH_PCT_LABELS[i + 1] - OMNI_BIRTH_PCT_LABELS[i]);
      return {
        percentile: Math.round(p * 10) / 10,
        percentileHi: OMNI_BIRTH_PCT_LABELS[i + 1],
        band: `между ${OMNI_BIRTH_PCT_LABELS[i]}-м и ${OMNI_BIRTH_PCT_LABELS[i + 1]}-м процентилем`,
      };
    }
  }
  return { percentile: 97, percentileHi: 97, band: 'выше 95-го процентиля' };
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
    return { percentile: pctLabels[0] * 0.5, band: `ниже ${pctLabels[0]}-го процентиля` };
  }
  const last = thresholds.length - 1;
  if (weightG >= thresholds[last]) {
    return {
      percentile: pctLabels[last] + (100 - pctLabels[last]) * 0.5,
      band: `выше ${pctLabels[last]}-го процентиля`,
    };
  }
  for (let i = 0; i < thresholds.length - 1; i += 1) {
    if (weightG >= thresholds[i] && weightG < thresholds[i + 1]) {
      const frac = (weightG - thresholds[i]) / (thresholds[i + 1] - thresholds[i]);
      const p = pctLabels[i] + frac * (pctLabels[i + 1] - pctLabels[i]);
      return {
        percentile: p,
        band: `между ${pctLabels[i]}-м и ${pctLabels[i + 1]}-м процентилем`,
      };
    }
  }
  return { percentile: 50, band: percentileBand(50) };
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
    zScore: Math.round(zScore * 100) / 100,
    percentile: Math.round(percentile * 10) / 10,
  };
}
