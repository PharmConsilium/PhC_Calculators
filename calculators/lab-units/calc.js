/**
 * Пересчёт единиц лабораторных показателей.
 * valueB = valueA × factor; valueA = valueB / factor.
 */

import { ANALYTES, getAnalyte, listAnalytes } from './data.js';

export { ANALYTES, getAnalyte, listAnalytes };

export function roundResult(value) {
  if (!Number.isFinite(value)) return value;
  const abs = Math.abs(value);
  if (abs === 0) return 0;
  if (abs >= 100) return Math.round(value * 100) / 100;
  if (abs >= 1) return Math.round(value * 1000) / 1000;
  return Math.round(value * 10000) / 10000;
}

function parseNonNegative(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * @param {{ analyteId: string, value: number|string, from: 'A'|'B' }} input
 */
export function convert(input) {
  const analyte = getAnalyte(input.analyteId);
  if (!analyte) {
    return { status: 'INVALID', error: 'Выберите исследование' };
  }

  const value = parseNonNegative(input.value);
  if (value == null) {
    return { status: 'INVALID', error: 'Укажите значение' };
  }

  const from = input.from === 'B' ? 'B' : 'A';
  const resultRaw = from === 'A' ? value * analyte.factor : value / analyte.factor;
  const result = roundResult(resultRaw);
  const fromUnit = from === 'A' ? analyte.unitA : analyte.unitB;
  const toUnit = from === 'A' ? analyte.unitB : analyte.unitA;

  return {
    status: 'OK',
    analyteId: analyte.id,
    name: analyte.name,
    from,
    value,
    fromUnit,
    result,
    toUnit,
    factor: analyte.factor,
    unitA: analyte.unitA,
    unitB: analyte.unitB,
  };
}

export function calculate(input) {
  const out = convert(input);
  if (out.status !== 'OK') {
    throw new Error(out.error || 'Ошибка пересчёта');
  }
  return out;
}
