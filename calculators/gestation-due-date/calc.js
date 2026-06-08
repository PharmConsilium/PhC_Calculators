/**
 * Определение срока беременности и даты родов (правило и модифицированное правило Негеле)
 * Source: https://akusher-lib.ru/wp-content/uploads/2018/10/Opredelenie-sroka-beremennosti.pdf
 */

export const LMP_TO_EDD_DAYS = 280;
export const CONCEPTION_TO_EDD_DAYS = 266;
export const LMP_OFFSET_DAYS = 14;
export const OBSTETRIC_MONTH_DAYS = 28;

/** Доверительные интервалы ПДР (дни от точечной оценки) */
export const EDD_CI = {
  ci4: { low: -1, high: 1 },
  ci21: { low: -4, high: 3 },
  ci90: { low: -13, high: 6 },
};

const MODE_LABELS = {
  lmp: 'ПДПМ',
  conception: 'Зачатие',
  ovulation: 'Овуляция',
  insemination: 'Искусственное осеменение',
};

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

function eddFromEvent(mode, eventDate) {
  if (mode === 'lmp') return addDaysUTC(eventDate, LMP_TO_EDD_DAYS);
  return addDaysUTC(eventDate, CONCEPTION_TO_EDD_DAYS);
}

function gestationDaysInclusive(lmp, currentDate) {
  const days = diffDaysUTC(lmp, currentDate);
  if (days < 0) return 0;
  return days + 1;
}

function roundObstetricMonths(days) {
  return Math.round((days / OBSTETRIC_MONTH_DAYS) * 100) / 100;
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

  const lmp = lmpFromEvent(mode, eventDate);
  const edd = eddFromEvent(mode, eventDate);
  const gestDays = gestationDaysInclusive(lmp, currentDate);
  const gestMonths = roundObstetricMonths(gestDays);

  const trimester13 = addDaysUTC(lmp, 13 * 7);
  const usFrom = addDaysUTC(lmp, 18 * 7);
  const usTo = addDaysUTC(lmp, 20 * 7);
  const plannedUs = addDaysUTC(lmp, 28 * 7);

  return {
    mode,
    modeLabel: MODE_LABELS[mode],
    eventDate: formatIsoDateUTC(eventDate),
    currentDate: formatIsoDateUTC(currentDate),
    lmp: formatIsoDateUTC(lmp),
    edd: formatIsoDateUTC(edd),
    eddCi4: dateInterval(edd, EDD_CI.ci4),
    eddCi21: dateInterval(edd, EDD_CI.ci21),
    eddCi90: dateInterval(edd, EDD_CI.ci90),
    gestationDays: gestDays,
    gestationObstetricMonths: gestMonths,
    gestationMilestone13: formatIsoDateUTC(trimester13),
    firstTrimesterWindowFrom: formatIsoDateUTC(usFrom),
    firstTrimesterWindowTo: formatIsoDateUTC(usTo),
    plannedUltrasound: formatIsoDateUTC(plannedUs),
  };
}
