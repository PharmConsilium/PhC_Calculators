/**
 * dsi — Diastolic Shock Index (DSI)
 * Source: Ospina-Tascón GA et al.; MDCalc DSI calculator.
 * Formula: DSI = heart rate / diastolic blood pressure
 */

export const DSI_THRESHOLD = 2.0;

function parsePositive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return number;
}

function getInterpretation(dsi) {
  if (dsi >= DSI_THRESHOLD) {
    return {
      elevated: true,
      interpretation:
        'DSI ≥2,0 — часто указываемый клинически значимый порог; настораживает в отношении прогрессии в септический шок',
    };
  }
  return {
    elevated: false,
    interpretation: 'DSI <2,0 — клинически значимый порог не достигнут',
  };
}

export function calculate(input) {
  const heartRate = parsePositive(input.heartRate, 'heartRate');
  const diastolicBp = parsePositive(input.diastolicBp, 'diastolicBp');

  const dsi = heartRate / diastolicBp;
  const value = Number(dsi.toFixed(2));
  const result = getInterpretation(dsi);

  return {
    value,
    dsi: value,
    heartRate,
    diastolicBp,
    elevated: result.elevated,
    interpretation: result.interpretation,
  };
}
