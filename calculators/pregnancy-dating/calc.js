/**
 * Срок беременности и ПДР по ПМ и УЗИ-биометрии
 * Source: MSD Manuals / Robinson CRL, Hadlock BPD, Altman HC
 */

const PREGNANCY_DAYS = 280;

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

/** Формат срока как в MSD: 5.4 нед, 12 нед */
function formatMsdWeeks(weeks) {
  const rounded = Math.round(weeks * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return `${Math.round(rounded)} нед`;
  }
  return `${rounded.toFixed(1).replace('.', ',')} нед`;
}

function buildResult(gestationDaysRounded, weeksForDisplay, eddDate) {
  const days = Math.max(0, gestationDaysRounded);
  return {
    gestationDays: days,
    gestationWeeks: Math.floor(days / 7),
    gestationRemainderDays: days % 7,
    gestationWeeksDecimal: Math.round(weeksForDisplay * 10) / 10,
    gestationText: formatMsdWeeks(weeksForDisplay),
    edd: formatIsoDateUTC(eddDate),
  };
}

function gestationWeeksFromCrl(crlMm) {
  return 5.2876 + 0.1584 * crlMm - 0.0007 * crlMm * crlMm;
}

function gestationDaysFromBpd(bpdMm) {
  return 2 * bpdMm + 44.2;
}

function gestationWeeksFromHc(hcMm) {
  return Math.exp(
    1.854 +
      0.010451 * hcMm -
      0.000029919 * hcMm * hcMm +
      0.000000043156 * hcMm * hcMm * hcMm
  );
}

/** Срок на момент УЗИ (как MSD), ПДР = дата УЗИ + (280 − срок в днях) */
function usMethodFromWeeks(usDate, weeksAtUs) {
  const gestationDaysAtUs = Math.round(weeksAtUs * 7);
  const edd = addDaysUTC(usDate, PREGNANCY_DAYS - gestationDaysAtUs);
  return buildResult(gestationDaysAtUs, weeksAtUs, edd);
}

function usMethodFromDays(usDate, daysAtUs) {
  const gestationDaysAtUs = Math.round(daysAtUs);
  const edd = addDaysUTC(usDate, PREGNANCY_DAYS - gestationDaysAtUs);
  return buildResult(gestationDaysAtUs, daysAtUs / 7, edd);
}

function parseOptionalPositive(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function calculate(input) {
  const currentDate = parseIsoDate(input.currentDate);
  if (!currentDate) {
    throw new Error('Укажите корректную текущую дату');
  }

  const result = { lmp: null, crl: null, bpd: null, hc: null };

  const lmp = input.lmp ? parseIsoDate(input.lmp) : null;
  if (input.lmp && !lmp) {
    throw new Error('Некорректная дата последней менструации');
  }
  if (lmp) {
    if (lmp.getTime() > currentDate.getTime()) {
      throw new Error('Дата менструации не может быть позже текущей даты');
    }
    const gestationDays = diffDaysUTC(lmp, currentDate);
    const edd = addDaysUTC(lmp, PREGNANCY_DAYS);
    result.lmp = buildResult(gestationDays, gestationDays / 7, edd);
  }

  const usDate = input.usDate ? parseIsoDate(input.usDate) : null;
  if (input.usDate && !usDate) {
    throw new Error('Некорректная дата УЗИ');
  }
  if (usDate && usDate.getTime() > currentDate.getTime()) {
    throw new Error('Дата УЗИ не может быть позже текущей даты');
  }

  const crlMm = parseOptionalPositive(input.crlMm);
  const bpdMm = parseOptionalPositive(input.bpdMm);
  const hcMm = parseOptionalPositive(input.hcMm);

  if ((crlMm != null || bpdMm != null || hcMm != null) && !usDate) {
    throw new Error('Укажите дату УЗИ для расчёта по биометрии');
  }

  if (usDate && crlMm != null) {
    result.crl = usMethodFromWeeks(usDate, gestationWeeksFromCrl(crlMm));
  }

  if (usDate && bpdMm != null) {
    result.bpd = usMethodFromDays(usDate, gestationDaysFromBpd(bpdMm));
  }

  if (usDate && hcMm != null) {
    result.hc = usMethodFromWeeks(usDate, gestationWeeksFromHc(hcMm));
  }

  const hasAny =
    result.lmp != null || result.crl != null || result.bpd != null || result.hc != null;
  if (!hasAny) {
    throw new Error('Введите дату менструации и/или параметры УЗИ');
  }

  return result;
}
