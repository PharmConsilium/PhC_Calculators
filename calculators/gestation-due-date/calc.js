/**
 * Определение срока беременности и даты родов (правило и модифицированное правило Негеле)
 * Source: https://akusher-lib.ru/wp-content/uploads/2018/10/Opredelenie-sroka-beremennosti.pdf
 */

export const LMP_TO_EDD_DAYS = 280;
export const CONCEPTION_TO_EDD_DAYS = 266;
export const LMP_OFFSET_DAYS = 14;
export const DEFAULT_CYCLE_DAYS = 28;
export const CYCLE_MIN = 21;
export const CYCLE_MAX = 35;

/** Доверительные интервалы ПДР (дни от точечной оценки) */
export const EDD_CI = {
  ci4: { low: -1, high: 1 },
  ci21: { low: -4, high: 3 },
  ci90: { low: -13, high: 6 },
};

/** Окна скринингов от ПДПМ (дни: нед*7 + доп. дни) */
export const SCREENING = {
  s1: { fromDays: 11 * 7, toDays: 13 * 7 + 6 },
  s2: { fromDays: 18 * 7, toDays: 21 * 7 + 6 },
  s3: { fromDays: 32 * 7, toDays: 35 * 7 + 6 },
};

export const MATERNITY_LEAVE_DAYS = 30 * 7;

const MODE_LABELS = {
  lmp: 'ПДПМ',
  conception: 'Зачатие',
  ovulation: 'Овуляция',
  insemination: 'Искусственное оплодотворение',
};

const ABO_LABEL = {
  O: 'O (I)',
  A: 'A (II)',
  B: 'B (III)',
  AB: 'AB (IV)',
};

/**
 * Таблица вероятностей как на kukuzya.ru/ia/gruppa_krovi
 * (II/III как A0/B0; для II×II и III×III — по 50%).
 */
const ABO_TABLE = {
  'O|O': { O: 1 },
  'O|A': { O: 0.5, A: 0.5 },
  'O|B': { O: 0.5, B: 0.5 },
  'O|AB': { A: 0.5, B: 0.5 },
  'A|A': { O: 0.5, A: 0.5 },
  'A|B': { O: 0.25, A: 0.25, B: 0.25, AB: 0.25 },
  'A|AB': { A: 0.5, B: 0.25, AB: 0.25 },
  'B|B': { O: 0.5, B: 0.5 },
  'B|AB': { A: 0.5, B: 0.25, AB: 0.25 },
  'AB|AB': { A: 0.25, B: 0.25, AB: 0.5 },
};

const ABO_ORDER = { O: 0, A: 1, B: 2, AB: 3 };

function parseIsoDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (!Number.isFinite(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== dateStr) return null;
  return d;
}

function formatIsoDateUTC(d) {
  return new Date(d.getTime()).toISOString().slice(0, 10);
}

function addDaysUTC(d, days) {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function diffDaysUTC(from, to) {
  return Math.trunc((to.getTime() - from.getTime()) / 86400000);
}

function dateInterval(edd, ci) {
  return {
    from: formatIsoDateUTC(addDaysUTC(edd, ci.low)),
    to: formatIsoDateUTC(addDaysUTC(edd, ci.high)),
  };
}

function lmpFromEvent(mode, eventDate) {
  if (mode === 'lmp') return eventDate;
  return addDaysUTC(eventDate, -LMP_OFFSET_DAYS);
}

function parseCycleDays(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_CYCLE_DAYS;
  const rounded = Math.round(n);
  if (rounded < CYCLE_MIN || rounded > CYCLE_MAX) {
    throw new Error(`Продолжительность цикла: от ${CYCLE_MIN} до ${CYCLE_MAX} дней`);
  }
  return rounded;
}

function eddFromEvent(mode, eventDate, cycleDays) {
  if (mode === 'lmp') {
    return addDaysUTC(eventDate, LMP_TO_EDD_DAYS + (cycleDays - DEFAULT_CYCLE_DAYS));
  }
  return addDaysUTC(eventDate, CONCEPTION_TO_EDD_DAYS);
}

/** Календарные дни от ПДПМ включительно (ПДПМ = день 1) */
function gestationDaysInclusive(lmp, currentDate) {
  const days = diffDaysUTC(lmp, currentDate);
  if (days < 0) return 0;
  return days + 1;
}

/** Смещение от ПДПМ в днях (ПДПМ = 0) → недели + дни акушерского срока */
export function gestationWeeksDays(gestationDaysInclusiveCount) {
  const offset = Math.max(0, gestationDaysInclusiveCount - 1);
  return {
    weeks: Math.floor(offset / 7),
    days: offset % 7,
    offsetDays: offset,
  };
}

/** Триместр: I — 1–13 нед., II — 14–27 нед., III — с 28 нед. */
export function trimesterFromOffset(offsetDays) {
  if (offsetDays <= 13 * 7 + 6) return 1;
  if (offsetDays <= 27 * 7 + 6) return 2;
  return 3;
}

function screeningWindow(lmp, key) {
  const w = SCREENING[key];
  return {
    from: formatIsoDateUTC(addDaysUTC(lmp, w.fromDays)),
    to: formatIsoDateUTC(addDaysUTC(lmp, w.toDays)),
  };
}

function parseBloodType(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object' && raw.abo && raw.rh) {
    const abo = String(raw.abo).toUpperCase();
    const rh = raw.rh === '-' || raw.rh === '−' ? '-' : '+';
    if (!(abo in ABO_ORDER)) return null;
    return { abo, rh };
  }
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, '');
  const m = s.match(/^(A|B|AB|O)(RH)?(\+|−|-)$/);
  if (!m) return null;
  return { abo: m[1], rh: m[3] === '+' ? '+' : '-' };
}

function aboProbabilities(motherAbo, fatherAbo) {
  const key =
    ABO_ORDER[motherAbo] <= ABO_ORDER[fatherAbo]
      ? `${motherAbo}|${fatherAbo}`
      : `${fatherAbo}|${motherAbo}`;
  const row = ABO_TABLE[key];
  return { O: 0, A: 0, B: 0, AB: 0, ...row };
}

/** Модель Rh как на kukuzya.ru: Rh+ = гетерозигота Dd */
function rhProbabilities(motherRh, fatherRh) {
  if (motherRh === '-' && fatherRh === '-') return { '+': 0, '-': 1 };
  if (motherRh === '+' && fatherRh === '+') return { '+': 0.75, '-': 0.25 };
  return { '+': 0.5, '-': 0.5 };
}

/**
 * Вероятности группы крови и резуса ребёнка (kukuzya.ru).
 * @returns {{ abo, rh, combined, rhConflict, lines } | null}
 */
export function babyBloodType(motherRaw, fatherRaw) {
  const mother = parseBloodType(motherRaw);
  const father = parseBloodType(fatherRaw);
  if (!mother || !father) return null;

  const abo = aboProbabilities(mother.abo, father.abo);
  const rh = rhProbabilities(mother.rh, father.rh);
  const rhConflict = mother.rh === '-' && father.rh === '+';

  const aboLines = Object.entries(abo)
    .filter(([, p]) => p > 0)
    .sort((a, b) => b[1] - a[1] || ABO_ORDER[a[0]] - ABO_ORDER[b[0]])
    .map(([k, p]) => ({
      abo: k,
      label: ABO_LABEL[k],
      probability: p,
      percent: Math.round(p * 1000) / 10,
    }));

  const rhLines = Object.entries(rh)
    .filter(([, p]) => p > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, p]) => ({
      rh: k,
      label: k === '+' ? 'Положительный (Rh+)' : 'Отрицательный (Rh−)',
      probability: p,
      percent: Math.round(p * 1000) / 10,
    }));

  const combined = [];
  for (const a of aboLines) {
    for (const r of rhLines) {
      const p = a.probability * r.probability;
      combined.push({
        abo: a.abo,
        rh: r.rh,
        label: `${a.abo} Rh${r.rh}`,
        probability: p,
        percent: Math.round(p * 1000) / 10,
      });
    }
  }
  combined.sort((a, b) => b.probability - a.probability || a.label.localeCompare(b.label));

  return {
    mother,
    father,
    abo,
    rh,
    aboLines,
    rhLines,
    combined,
    rhConflict,
  };
}

/** Рекомендуемая прибавка веса (IOM 2009 / HiPP), кг; одноплодная беременность */
export const WEIGHT_GAIN_BY_BMI = [
  {
    id: 'underweight',
    label: 'Недостаточная масса тела',
    bmiMax: 18.5,
    totalMin: 12.5,
    totalMax: 18,
    rateMin: 0.44,
    rateMax: 0.58,
  },
  {
    id: 'normal',
    label: 'Нормальная масса тела',
    bmiMin: 18.5,
    bmiMax: 25,
    totalMin: 11.5,
    totalMax: 16,
    rateMin: 0.35,
    rateMax: 0.5,
  },
  {
    id: 'overweight',
    label: 'Избыточная масса тела',
    bmiMin: 25,
    bmiMax: 30,
    totalMin: 7,
    totalMax: 11.5,
    rateMin: 0.23,
    rateMax: 0.33,
  },
  {
    id: 'obese',
    label: 'Ожирение',
    bmiMin: 30,
    totalMin: 5,
    totalMax: 9,
    rateMin: 0.17,
    rateMax: 0.27,
  },
];

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function prepregnancyBmi(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h < 100 || h > 250 || w < 30 || w > 300) {
    return null;
  }
  const m = h / 100;
  return round1(w / (m * m));
}

export function weightGainBand(bmi) {
  if (bmi == null || !Number.isFinite(bmi)) return null;
  for (const band of WEIGHT_GAIN_BY_BMI) {
    const minOk = band.bmiMin == null || bmi >= band.bmiMin;
    const maxOk = band.bmiMax == null || bmi < band.bmiMax;
    if (minOk && maxOk) return band;
  }
  return WEIGHT_GAIN_BY_BMI[WEIGHT_GAIN_BY_BMI.length - 1];
}

/**
 * Прибавка к текущему акушерскому сроку (недели от ПДПМ) и целевой вес к родам.
 * IOM: ~линейно в I триместре, затем rate × (неделя − 13) до 40 нед.
 */
export function pregnancyWeightGain(input) {
  const heightCm = Number(input?.heightCm);
  const weightKg = Number(input?.weightKg);
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return null;
  if (heightCm < 100 || heightCm > 250 || weightKg < 30 || weightKg > 300) {
    throw new Error('Укажите корректные рост (100–250 см) и вес до беременности (30–300 кг)');
  }

  const bmi = prepregnancyBmi(heightCm, weightKg);
  const band = weightGainBand(bmi);
  const weeks = Math.max(0, Number(input?.gestationWeeks) || 0);
  const capped = Math.min(weeks, 40);

  const firstMin = band.totalMin - band.rateMin * 27;
  const firstMax = band.totalMax - band.rateMax * 27;

  let gainMin;
  let gainMax;
  if (capped <= 13) {
    gainMin = firstMin * (capped / 13);
    gainMax = firstMax * (capped / 13);
  } else {
    gainMin = firstMin + band.rateMin * (capped - 13);
    gainMax = firstMax + band.rateMax * (capped - 13);
  }

  return {
    heightCm,
    weightKg,
    bmi,
    categoryId: band.id,
    categoryLabel: band.label,
    totalGainMin: band.totalMin,
    totalGainMax: band.totalMax,
    rateMin: band.rateMin,
    rateMax: band.rateMax,
    recommendedGainMin: round1(Math.max(0, gainMin)),
    recommendedGainMax: round1(Math.max(0, gainMax)),
    targetWeightMin: round1(weightKg + band.totalMin),
    targetWeightMax: round1(weightKg + band.totalMax),
    singletonOnly: true,
  };
}

/** Рекомендуемая прибавка (кг) на указанной акушерской неделе */
export function recommendedGainAtWeek(bandOrGain, week) {
  const band = {
    totalMin: bandOrGain.totalGainMin ?? bandOrGain.totalMin,
    totalMax: bandOrGain.totalGainMax ?? bandOrGain.totalMax,
    rateMin: bandOrGain.rateMin,
    rateMax: bandOrGain.rateMax,
  };
  const w = Math.max(0, Math.min(42, Number(week) || 0));
  const firstMin = band.totalMin - band.rateMin * 27;
  const firstMax = band.totalMax - band.rateMax * 27;
  let gainMin;
  let gainMax;
  if (w <= 13) {
    gainMin = firstMin * (w / 13);
    gainMax = firstMax * (w / 13);
  } else {
    gainMin = firstMin + band.rateMin * (w - 13);
    gainMax = firstMax + band.rateMax * (w - 13);
  }
  return {
    week: w,
    gainMin: round1(Math.max(0, gainMin)),
    gainMax: round1(Math.max(0, gainMax)),
  };
}

/**
 * Сравнение фактического веса на неделях с рекомендуемой прибавкой.
 * @param {{ weightKg: number, totalGainMin: number, totalGainMax: number, rateMin: number, rateMax: number }} base
 * @param {Array<{ week: number, weightKg: number }>} points
 */
export function compareWeeklyWeightGain(base, points) {
  const pre = Number(base?.weightKg);
  if (!Number.isFinite(pre)) return [];
  const list = Array.isArray(points) ? points : [];
  return list
    .map((p) => {
      const week = Math.round(Number(p.week));
      const weight = Number(p.weightKg);
      if (!Number.isFinite(week) || week < 1 || week > 42 || !Number.isFinite(weight)) return null;
      const range = recommendedGainAtWeek(base, week);
      const actualGain = round1(weight - pre);
      let status = 'ok';
      if (actualGain < range.gainMin) status = 'low';
      else if (actualGain > range.gainMax) status = 'high';
      return {
        week,
        weightKg: weight,
        actualGain,
        recommendedGainMin: range.gainMin,
        recommendedGainMax: range.gainMax,
        status,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.week - b.week);
}

export function calculate(input) {
  const mode = input?.mode ?? 'lmp';
  if (!MODE_LABELS[mode]) {
    throw new Error('Неизвестный режим расчёта');
  }

  const eventDate = parseIsoDate(input.eventDate);
  if (!eventDate) {
    throw new Error('Укажите корректную дату');
  }

  const currentDate = parseIsoDate(input.currentDate ?? input.today);
  if (!currentDate) {
    throw new Error('Укажите корректную текущую дату');
  }

  if (eventDate.getTime() > currentDate.getTime()) {
    throw new Error('Дата события не может быть позже текущей даты');
  }

  const cycleDays = mode === 'lmp' ? parseCycleDays(input.cycleDays ?? DEFAULT_CYCLE_DAYS) : DEFAULT_CYCLE_DAYS;
  const lmp = lmpFromEvent(mode, eventDate);
  const edd = eddFromEvent(mode, eventDate, cycleDays);
  const gestDays = gestationDaysInclusive(lmp, currentDate);
  const { weeks, days, offsetDays } = gestationWeeksDays(gestDays);
  const trimester = trimesterFromOffset(offsetDays);

  const result = {
    mode,
    modeLabel: MODE_LABELS[mode],
    eventDate: formatIsoDateUTC(eventDate),
    currentDate: formatIsoDateUTC(currentDate),
    cycleDays: mode === 'lmp' ? cycleDays : null,
    lmp: formatIsoDateUTC(lmp),
    edd: formatIsoDateUTC(edd),
    eddCi4: dateInterval(edd, EDD_CI.ci4),
    eddCi21: dateInterval(edd, EDD_CI.ci21),
    eddCi90: dateInterval(edd, EDD_CI.ci90),
    gestationDays: gestDays,
    gestationWeeks: weeks,
    gestationDaysRemainder: days,
    trimester,
    screening1: screeningWindow(lmp, 's1'),
    screening2: screeningWindow(lmp, 's2'),
    screening3: screeningWindow(lmp, 's3'),
    maternityLeave: formatIsoDateUTC(addDaysUTC(lmp, MATERNITY_LEAVE_DAYS)),
    babyBlood: null,
    weightGain: null,
  };

  if (mode === 'lmp') {
    result.babyBlood = babyBloodType(input.motherBlood, input.fatherBlood);
    const hasHeight = input.heightCm != null && String(input.heightCm).trim() !== '';
    const hasWeight = input.weightKg != null && String(input.weightKg).trim() !== '';
    if (hasHeight && hasWeight) {
      result.weightGain = pregnancyWeightGain({
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        gestationWeeks: weeks,
      });
    }
  }

  return result;
}
