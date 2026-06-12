/**
 * SOFA и qSOFA — динамическая оценка органной недостаточности (Vincent et al.; Sepsis-3; MSD).
 */

import { CRITERIA as GCS_CRITERIA, glasgowComaScore } from '../glasgow-coma/calc.js';

export { GCS_CRITERIA };

export const MODES = {
  sofa: 'SOFA',
  qsofa: 'qSOFA',
};

export const SOFA_MAX = 24;

export const CARDIOVASCULAR_OPTIONS = [
  { id: 0, label: 'Гипотензия отсутствует', points: 0 },
  { id: 1, label: 'Среднее артериальное давление < 70 мм рт. ст.', points: 1 },
  {
    id: 2,
    label: 'Дофамин ≤ 5 мкг/кг/мин или любая доза добутамина',
    points: 2,
  },
  {
    id: 3,
    label:
      'Дофамин > 5 мкг/кг/мин, адреналин ≤ 0,1 мкг/кг/мин или норадреналин ≤ 0,1 мкг/кг/мин',
    points: 3,
  },
  {
    id: 4,
    label:
      'Дофамин > 15 мкг/кг/мин или адреналин > 0,1 мкг/кг/мин или норадреналин > 0,1 мкг/кг/мин',
    points: 4,
  },
];

export const SOFA_NOTES_TABLE = [
  {
    system: 'Дыхание (PaO₂/FiO₂)',
    rows: '> 400: 0; ≤ 400: 1; ≤ 300: 2; ≤ 200 при ИВЛ: 3; ≤ 100 при ИВЛ: 4',
  },
  {
    system: 'Тромбоциты (×10³/мкл)',
    rows: '≥ 150: 0; < 150: 1; < 100: 2; < 50: 3; < 20: 4',
  },
  {
    system: 'Билирубин (мг/дл)',
    rows: '< 1,2: 0; 1,2–1,9: 1; 2,0–5,9: 2; 6,0–11,9: 3; ≥ 12: 4',
  },
  {
    system: 'Сердечно-сосудистая система',
    rows: 'См. варианты ввода (0–4 балла)',
  },
  {
    system: 'GCS',
    rows: '15: 0; 13–14: 1; 10–12: 2; 6–9: 3; < 6: 4',
  },
  {
    system: 'Почки (креатинин или диурез)',
    rows: 'Креатинин < 1,2: 0; 1,2–1,9: 1; 2,0–3,4: 2; 3,5–4,9: 3; ≥ 5: 4; диурез < 500 мл/сут: 3; < 200 мл/сут: 4',
  },
];

export const FIELD_LIMITS = {
  pao2: { min: 20, max: 700 },
  fio2: { min: 21, max: 100 },
  platelets: { min: 1, max: 2000 },
  bilirubin: { min: 0.1, max: 100 },
  gcs: { min: 3, max: 15 },
  creatinine: { min: 0.1, max: 30 },
  urineOutput: { min: 0, max: 10000 },
  sbp: { min: 40, max: 300 },
  rr: { min: 4, max: 80 },
};

export function rangeErrorMessage(min, max) {
  return `Число не в корректном интервале ${min} - ${max}`;
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function hasValue(value) {
  return String(value ?? '').trim() !== '';
}

export function pao2ToMmHg(value, unit = 'mmhg') {
  return unit === 'kpa' ? value * 7.50062 : value;
}

export function fio2ToFraction(value, unit = 'percent') {
  return unit === 'percent' ? value / 100 : value;
}

export function bilirubinToMgDl(value, unit = 'mgdl') {
  return unit === 'umol' ? value / 17.1 : value;
}

export function creatinineToMgDl(value, unit = 'mgdl') {
  return unit === 'umol' ? value / 88.4 : value;
}

export function sbpToMmHg(value, unit = 'mmhg') {
  return unit === 'kpa' ? value * 7.50062 : value;
}

export function pao2Fio2Ratio(pao2MmHg, fio2Fraction) {
  if (!fio2Fraction) return null;
  return pao2MmHg / fio2Fraction;
}

export function scoreRespiration(ratio, ventilator) {
  if (ratio > 400) return 0;
  if (ratio > 300) return 1;
  if (ratio > 200) return 2;
  if (!ventilator) return 2;
  if (ratio > 100) return 3;
  return 4;
}

export function scoreCoagulation(platelets) {
  if (platelets >= 150) return 0;
  if (platelets >= 100) return 1;
  if (platelets >= 50) return 2;
  if (platelets >= 20) return 3;
  return 4;
}

export function scoreLiver(bilirubinMgDl) {
  if (bilirubinMgDl < 1.2) return 0;
  if (bilirubinMgDl < 2.0) return 1;
  if (bilirubinMgDl < 6.0) return 2;
  if (bilirubinMgDl < 12.0) return 3;
  return 4;
}

export function scoreCns(gcs) {
  if (gcs >= 15) return 0;
  if (gcs >= 13) return 1;
  if (gcs >= 10) return 2;
  if (gcs >= 6) return 3;
  return 4;
}

export function scoreRenalFromCreatinine(creatinineMgDl) {
  if (creatinineMgDl < 1.2) return 0;
  if (creatinineMgDl < 2.0) return 1;
  if (creatinineMgDl < 3.5) return 2;
  if (creatinineMgDl < 5.0) return 3;
  return 4;
}

export function scoreRenalFromUop(mlPerDay) {
  if (mlPerDay >= 500) return 0;
  if (mlPerDay >= 200) return 3;
  return 4;
}

export function scoreRenal(creatinineMgDl, uopMlDay, hasCreatinine, hasUop) {
  if (!hasCreatinine && !hasUop) return null;
  const crScore = hasCreatinine ? scoreRenalFromCreatinine(creatinineMgDl) : 0;
  const uopScore = hasUop ? scoreRenalFromUop(uopMlDay) : 0;
  if (!hasCreatinine) return uopScore;
  if (!hasUop) return crScore;
  return Math.max(crScore, uopScore);
}

export function interpretSofa(total) {
  if (total >= 10) {
    return { category: 'severe', interpretation: 'Тяжёлая органная недостаточность' };
  }
  if (total >= 6) {
    return { category: 'moderate', interpretation: 'Умеренная органная дисфункция' };
  }
  if (total >= 2) {
    return { category: 'mild', interpretation: 'Лёгкая органная дисфункция' };
  }
  return { category: 'minimal', interpretation: 'Минимальная органная дисфункция' };
}

export function interpretQsofa(total) {
  if (total >= 2) {
    return { category: 'high', interpretation: 'Высокий риск' };
  }
  return { category: 'low', interpretation: 'Невысокий риск' };
}

export function resolveGcs(input) {
  const hasComponents =
    input.eye != null && input.eye !== '' &&
    input.motor != null && input.motor !== '' &&
    input.verbal != null && input.verbal !== '';

  if (hasComponents) {
    const out = glasgowComaScore({
      eye: input.eye,
      motor: input.motor,
      verbal: input.verbal,
    });
    if (out.status !== 'OK') return { status: 'INVALID', missing: 'gcs' };
    return { status: 'OK', total: out.total, scores: out.scores };
  }

  const gcs = parseNumber(input.gcs);
  if (gcs == null) return { status: 'INVALID', missing: 'gcs' };
  if (gcs < 3 || gcs > 15) return { status: 'INVALID', missing: 'gcs' };
  return { status: 'OK', total: gcs, scores: null };
}

export function sofaScore(input) {
  const pao2 = parseNumber(input.pao2);
  const fio2 = parseNumber(input.fio2);
  const platelets = parseNumber(input.platelets);
  const bilirubin = parseNumber(input.bilirubin);
  const gcsResolved = resolveGcs(input);
  const creatinine = hasValue(input.creatinine) ? parseNumber(input.creatinine) : null;
  const urineOutput = hasValue(input.urineOutput) ? parseNumber(input.urineOutput) : null;

  if (
    pao2 == null ||
    fio2 == null ||
    platelets == null ||
    bilirubin == null ||
    gcsResolved.status !== 'OK' ||
    input.cardiovascular == null ||
    input.cardiovascular === ''
  ) {
    return { status: 'INVALID' };
  }

  const gcs = gcsResolved.total;

  if (creatinine == null && urineOutput == null) {
    return { status: 'INVALID', missing: 'renal' };
  }

  const pao2MmHg = pao2ToMmHg(pao2, input.pao2Unit || 'mmhg');
  const fio2Fraction = fio2ToFraction(fio2, input.fio2Unit || 'percent');
  const ratio = pao2Fio2Ratio(pao2MmHg, fio2Fraction);
  const ventilator = Boolean(input.ventilation);

  const cardiovascular = Number(input.cardiovascular);
  if (!Number.isInteger(cardiovascular) || cardiovascular < 0 || cardiovascular > 4) {
    return { status: 'INVALID', missing: 'cardiovascular' };
  }

  const bilirubinMgDl = bilirubinToMgDl(bilirubin, input.bilirubinUnit || 'mgdl');
  const creatinineMgDl =
    creatinine != null ? creatinineToMgDl(creatinine, input.creatinineUnit || 'mgdl') : null;

  const scores = {
    respiration: scoreRespiration(ratio, ventilator),
    coagulation: scoreCoagulation(platelets),
    liver: scoreLiver(bilirubinMgDl),
    cardiovascular,
    cns: scoreCns(gcs),
    renal: scoreRenal(
      creatinineMgDl,
      urineOutput,
      creatinine != null,
      urineOutput != null
    ),
  };

  if (scores.renal == null) return { status: 'INVALID', missing: 'renal' };

  const total = Object.values(scores).reduce((sum, pts) => sum + pts, 0);
  const { category, interpretation } = interpretSofa(total);

  return {
    status: 'OK',
    mode: 'sofa',
    total,
    gcs,
    pao2Fio2: Math.round(ratio),
    scores,
    category,
    interpretation,
  };
}

export function qsofaScore(input) {
  const gcsResolved = resolveGcs(input);
  const sbp = parseNumber(input.sbp);
  const rr = parseNumber(input.rr);

  if (gcsResolved.status !== 'OK' || sbp == null || rr == null) {
    return { status: 'INVALID' };
  }

  const gcs = gcsResolved.total;

  const sbpMmHg = sbpToMmHg(sbp, input.sbpUnit || 'mmhg');
  let total = 0;
  const criteria = {};

  if (gcs < 15) {
    total += 1;
    criteria.gcs = true;
  }
  if (sbpMmHg <= 100) {
    total += 1;
    criteria.sbp = true;
  }
  if (rr >= 22) {
    total += 1;
    criteria.rr = true;
  }

  const { category, interpretation } = interpretQsofa(total);

  return {
    status: 'OK',
    mode: 'qsofa',
    total,
    gcs,
    category,
    interpretation,
    criteria,
  };
}

export function calculate(input) {
  const mode = input?.mode === 'qsofa' ? 'qsofa' : 'sofa';
  const out = mode === 'qsofa' ? qsofaScore(input) : sofaScore(input);
  if (out.status !== 'OK') throw new Error('Заполните все параметры');
  return out;
}
