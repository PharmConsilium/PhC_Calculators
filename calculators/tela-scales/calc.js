/**
 * tela-scales — диспетчер: делегирует в calculate() отдельных шкал.
 * Отдельные калькуляторы в своих папках остаются источником истины.
 */
import { calculate as yearsPe } from '../years-pe/calc.js';
import { calculate as genevaPe } from '../geneva-pe/calc.js';
import { calculate as wellsScale } from '../wells-scale/calc.js';
import { calculate as pesiPe } from '../pesi-pe/calc.js';
import { calculate as capriniScale } from '../caprini-scale/calc.js';
import { calculate as improveScale } from '../improve-scale/calc.js';

const FNS = {
  'years-pe': yearsPe,
  'geneva-pe': genevaPe,
  'wells-scale': wellsScale,
  'pesi-pe': pesiPe,
  'caprini-scale': capriniScale,
  'improve-scale': improveScale,
};

export function calculate(input) {
  const mode = (input && input.mode) || 'years-pe';
  const fn = FNS[mode];
  if (!fn) throw new Error('Неизвестный режим');
  const { mode: _m, ...rest } = input || {};
  const out = fn(rest);
  return { ...out, mode };
}
