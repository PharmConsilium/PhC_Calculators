/**
 * quicki — Quantitative Insulin Sensitivity Check Index (calc4lab)
 * Formula: QUICKI = 1 / [log10(insulin [μU/mL]) + log10(glucose [mg/dL])]
 * Glucose g/L → mg/dL: × 100
 */

export const GLUCOSE_GL_TO_MGDL = 100;
export const QUICKI_CUTOFF = 0.33;

function parsePositive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return number;
}

function resolveGlucoseMgDl(input) {
  const glucoseUnit = input.glucoseUnit === 'gl' ? 'gl' : 'mgdl';
  const glucose = parsePositive(input.glucose, 'glucose');
  const glucoseMgDl =
    glucoseUnit === 'gl' ? glucose * GLUCOSE_GL_TO_MGDL : glucose;
  return { glucoseUnit, glucose, glucoseMgDl };
}

export function calculateQuicki(insulinUuMl, glucoseMgDl) {
  return 1 / (Math.log10(insulinUuMl) + Math.log10(glucoseMgDl));
}

export function getInterpretation(quicki) {
  if (quicki < QUICKI_CUTOFF) {
    return {
      category: 'resistance',
      statusKey: 'resistance',
      title: 'Подозрение на инсулинорезистентность (< 0.33)',
      interpretation:
        'Низкое значение QUICKI сильно связано с инсулинорезистентностью и высоким риском метаболического синдрома.',
    };
  }
  return {
    category: 'normal',
    statusKey: 'normal',
    title: 'Нормальная чувствительность (≥ 0.33)',
    interpretation:
      'Значение в этом диапазоне обычно указывает на нормальную или достаточную чувствительность к инсулину.',
  };
}

export function calculate(input) {
  const insulin = parsePositive(input.insulin, 'insulin');
  const { glucose, glucoseUnit, glucoseMgDl } = resolveGlucoseMgDl(input);

  const quickiExact = calculateQuicki(insulin, glucoseMgDl);
  const quicki = Number(quickiExact.toFixed(3));
  const result = getInterpretation(quicki);

  return {
    value: quicki,
    quicki,
    insulin,
    glucose,
    glucoseUnit,
    glucoseMgDl,
    category: result.category,
    statusKey: result.statusKey,
    title: result.title,
    interpretation: result.interpretation,
  };
}
