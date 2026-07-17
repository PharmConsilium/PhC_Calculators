/**
 * Интерпретация КЩС и газового состава крови
 * Логика по calculadorasdeenfermagem.com.br/ru/gasometria.html
 */

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function optionalNumber(value) {
  const n = parseNumber(value);
  return n;
}

/** Нормальные диапазоны (для подсказок в UI и валидации по смыслу). */
export const REFS = {
  ph: { low: 7.35, high: 7.45, label: '7.35 – 7.45' },
  paco2: { low: 35, high: 45, label: '35 – 45' },
  hco3: { low: 22, high: 26, label: '22 – 26' },
  pao2: { low: 80, high: 100, label: '80 – 100' },
  be: { low: -2, high: 2, label: '−2 / +2' },
  sato2: { low: 95, high: null, label: '> 95%' },
  na: { low: 135, high: 145, label: '135–145' },
  k: { low: 3.5, high: 5.0, label: '3.5–5.0' },
  cl: { low: 98, high: 107, label: '98–107' },
  ca: { low: 8.5, high: 10.5, label: '8.5–10.5' },
  mg: { low: 1.7, high: 2.2, label: '1.7–2.2' },
  lactate: { low: null, high: 2.0, label: '< 2.0' },
  hb: { low: 120, high: 160, label: '120–160' },
  ht: { low: 36, high: 48, label: '36–48%' },
  cohb: { low: null, high: 1.5, label: '< 1.5%' },
  methb: { low: null, high: 1.0, label: '< 1.0%' },
};

export const ANION_GAP_HIGH = 12;

/** Степень гипоксемии: 0 норма, 1 лёгкая, 2 умеренная, 3 тяжёлая. */
export function oxygenationGradeFromPao2(pao2) {
  if (pao2 < 40) return 3;
  if (pao2 < 60) return 2;
  if (pao2 < 80) return 1;
  return 0;
}

export function oxygenationGradeFromSato2(sato2) {
  if (sato2 < 75) return 3;
  if (sato2 < 90) return 2;
  if (sato2 < 95) return 1;
  return 0;
}

export const OXYGENATION_LABELS = [
  'Нормоксемия',
  'Легкая гипоксемия',
  'Умеренная гипоксемия',
  'Тяжелая гипоксемия',
];

export function interpretOxygenation(pao2, sato2) {
  let grade = null;
  if (pao2 != null) grade = oxygenationGradeFromPao2(pao2);
  if (sato2 != null) {
    const g = oxygenationGradeFromSato2(sato2);
    grade = grade == null ? g : Math.max(grade, g);
  }
  return grade == null ? null : OXYGENATION_LABELS[grade];
}

function formatPh(ph) {
  return ph.toFixed(2).replace('.', ',');
}

function formatOne(n) {
  return (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
}

/**
 * @param {object} input
 * @returns {object}
 */
export function calculate(input) {
  const ph = parseNumber(input.ph);
  const paco2 = parseNumber(input.paco2);
  const hco3 = parseNumber(input.hco3);

  if (ph == null || paco2 == null || hco3 == null) {
    throw new Error('Введите как минимум pH, PaCO₂ и HCO₃⁻');
  }

  const pao2 = optionalNumber(input.pao2);
  const na = optionalNumber(input.na);
  const cl = optionalNumber(input.cl);
  const lactate = optionalNumber(input.lactate);
  const hb = optionalNumber(input.hb);
  const cohb = optionalNumber(input.cohb);

  let diagnosis = '';
  let compensation = '';
  let phStatus = formatPh(ph);
  let respDesc = '';
  let metabDesc = '';

  // 1. Анализ КЩС
  if (ph < 7.35) {
    diagnosis = 'АЦИДОЗ';
    phStatus += ' (Ацидемия)';
  } else if (ph > 7.45) {
    diagnosis = 'АЛКАЛОЗ';
    phStatus += ' (Алкалемия)';
  } else {
    diagnosis = 'НОРМА / КОМПЕНСИРОВАН';
    phStatus += ' (Норма)';
  }

  if (diagnosis !== 'НОРМА / КОМПЕНСИРОВАН') {
    const isResp = (ph < 7.35 && paco2 > 45) || (ph > 7.45 && paco2 < 35);
    const isMetab = (ph < 7.35 && hco3 < 22) || (ph > 7.45 && hco3 > 26);

    if (isResp && !isMetab) {
      diagnosis += ' РЕСПИРАТОРНЫЙ';
      respDesc = `${paco2} мм рт.ст. (Первичный)`;
      if ((ph < 7.35 && hco3 > 26) || (ph > 7.45 && hco3 < 22)) {
        compensation = 'ЧАСТИЧНО КОМПЕНСИРОВАН';
      } else {
        compensation = 'НЕКОМПЕНСИРОВАН';
      }
    } else if (isMetab && !isResp) {
      diagnosis += ' МЕТАБОЛИЧЕСКИЙ';
      metabDesc = `${hco3} ммоль/л (Первичный)`;
      if ((ph < 7.35 && paco2 < 35) || (ph > 7.45 && paco2 > 45)) {
        compensation = 'ЧАСТИЧНО КОМПЕНСИРОВАН';
      } else {
        compensation = 'НЕКОМПЕНСИРОВАН';
      }
    } else if (isResp && isMetab) {
      diagnosis += ' СМЕШАННЫЙ';
      compensation = 'ТЯЖЕЛЫЙ';
    }
  } else if (paco2 !== 40 && hco3 !== 24) {
    if (ph < 7.4) diagnosis = 'КОМПЕНСИРОВАННЫЙ АЦИДОЗ';
    else diagnosis = 'КОМПЕНСИРОВАННЫЙ АЛКАЛОЗ';
    compensation = 'ПОЛНОСТЬЮ КОМПЕНСИРОВАН';
  }

  if (!compensation) compensation = 'СТАБИЛЬНЫЙ БАЛАНС';

  // 2. Анионный разрыв
  let anionGap = null;
  let anionGapText = null;
  if (na != null && cl != null) {
    anionGap = Math.round((na - (cl + hco3)) * 10) / 10;
    anionGapText =
      formatOne(anionGap) + (anionGap > ANION_GAP_HIGH ? ' (Высокая)' : ' (Норма)');
  }

  // 3. Оксигенация (клиническая шкала PaO₂ / SatO₂)
  const sato2 = optionalNumber(input.sato2);
  const oxygenation = interpretOxygenation(pao2, sato2);

  // 4. Гемоглобин
  let hbText = null;
  if (hb != null) {
    hbText = `${hb} г/л` + (hb < 120 ? ' (Анемия)' : '');
  }

  let summary = `Интерпретация: У пациента наблюдается ${diagnosis.toLowerCase()}.`;
  if (lactate != null && lactate > 2) {
    summary += ' Зафиксирована гиперлактатемия (возможная гипоперфузия).';
  }
  if (cohb != null && cohb > 2) {
    summary += ' Внимание: повышенный уровень COHb.';
  }

  return {
    diagnosis,
    compensation,
    phStatus,
    paco2Text: respDesc || `${paco2} мм рт.ст.`,
    hco3Text: metabDesc || `${hco3} ммоль/л`,
    anionGap,
    anionGapText,
    lactateText: lactate != null ? `${lactate} ммоль/л` : null,
    oxygenation,
    hbText,
    summary,
  };
}
