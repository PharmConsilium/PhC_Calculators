/**
 * ldl-calc — диспетчер: формулы ХС ЛНП и коррекция по Лп(а).
 * Отдельные калькуляторы martin-ldl и ldl-lpa-corr остаются источником истины.
 */
import { calculate as martinLdl } from '../martin-ldl/calc.js';
import { calculate as ldlLpaCorr } from '../ldl-lpa-corr/calc.js';

const FNS = {
  'martin-ldl': martinLdl,
  'ldl-lpa-corr': ldlLpaCorr,
};

export function calculate(input) {
  const mode = (input && input.mode) || 'martin-ldl';
  const fn = FNS[mode];
  if (!fn) throw new Error('Неизвестный режим');
  const { mode: _m, ...rest } = input || {};
  const out = fn(rest);
  return { ...out, mode };
}
