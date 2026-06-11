/**
 * Индекс оксигенации — anest-rean.ru/index-oxygenation
 * Калькулятор №1: PaO2/FiO2; калькулятор №2: (FiO2 × Pmean) / PaO2
 */

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return { error: true };
  const n = Number(s);
  if (!Number.isFinite(n)) return { error: true };
  return { value: n };
}

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

/** Калькулятор №1 — степень тяжести ОРДС (PaO2/FiO2). */
export function interpretPfRatio(index) {
  if (index >= 300) return 'Вариант нормы';
  if (index >= 200) return 'легкая';
  if (index >= 100) return 'средняя';
  return 'тяжелая';
}

export function interpretPfMortality(index) {
  if (index >= 300) return null;
  if (index >= 200) return '27%';
  if (index >= 100) return '32%';
  return '45%';
}

export function interpretPfDetail(index) {
  if (index >= 300) return 'Индекс оксигенации в пределах нормы (≈500 на воздухе).';
  const mortality = interpretPfMortality(index);
  if (index >= 200) return 'Степень тяжести ОРДС: легкая. Летальность ' + mortality + '.';
  if (index >= 100) return 'Степень тяжести ОРДС: средняя. Летальность ' + mortality + '.';
  return 'Степень тяжести ОРДС: тяжелая. Летальность ' + mortality + '.';
}

/** Калькулятор №2 — OI = (FiO2 × Pmean) / PaO2. */
export function interpretOi(index) {
  if (index <= 25) return 'вариант нормы';
  if (index <= 40) return 'летальный исход более 40%';
  return 'экстракорпоральная мембранная оксигенация';
}

export function pfRatioScore(input) {
  const pao2Parsed = parseNumber(input.pao2);
  const fio2Parsed = parseNumber(input.fio2);
  if (!pao2Parsed || pao2Parsed.error) return { status: 'INVALID', missing: 'pao2' };
  if (!fio2Parsed || fio2Parsed.error) return { status: 'INVALID', missing: 'fio2' };

  const paO2 = pao2Parsed.value;
  const fio2 = fio2Parsed.value;
  if (paO2 < 0 || paO2 > 250) return { status: 'INVALID', field: 'pao2' };
  if (paO2 === 0) return { status: 'INVALID', field: 'pao2_zero' };
  if (fio2 < 21 || fio2 > 100) return { status: 'INVALID', field: 'fio2' };

  const index = Math.round(paO2 / (fio2 / 100));
  return {
    status: 'OK',
    index,
    interpretation: interpretPfRatio(index),
    detail: interpretPfDetail(index),
  };
}

export function oiScore(input) {
  const fio2Parsed = parseNumber(input.fio2);
  const pmeanParsed = parseNumber(input.pmean);
  const pao2Parsed = parseNumber(input.pao2);
  if (!fio2Parsed || fio2Parsed.error) return { status: 'INVALID', missing: 'fio2' };
  if (!pmeanParsed || pmeanParsed.error) return { status: 'INVALID', missing: 'pmean' };
  if (!pao2Parsed || pao2Parsed.error) return { status: 'INVALID', missing: 'pao2' };

  const fio2 = fio2Parsed.value;
  const pmean = pmeanParsed.value;
  const paO2 = pao2Parsed.value;
  if (fio2 < 21 || fio2 > 100) return { status: 'INVALID', field: 'fio2' };
  if (pmean < 0 || pmean > 50) return { status: 'INVALID', field: 'pmean' };
  if (paO2 < 0 || paO2 > 250) return { status: 'INVALID', field: 'pao2' };
  if (paO2 === 0) return { status: 'INVALID', field: 'pao2_zero' };

  const index = Math.round((fio2 * pmean) / paO2);
  return {
    status: 'OK',
    index,
    interpretation: interpretOi(index),
  };
}

export function calculate(input) {
  if (input.mode === 'pfRatio' || input.mode === 'oxygenation') {
    const out = pfRatioScore(input);
    if (out.status !== 'OK') throw new Error('Заполните PaO₂ и FiO₂');
    return out;
  }
  if (input.mode === 'oi') {
    const out = oiScore(input);
    if (out.status !== 'OK') throw new Error('Заполните FiO₂, Pmean и PaO₂');
    return out;
  }
  throw new Error('Unknown mode');
}
