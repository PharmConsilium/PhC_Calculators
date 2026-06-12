/**
 * homa-ir — Homeostatic Model Assessment for Insulin Resistance
 * Source: Matthews DR et al.; MDCalc HOMA-IR calculator.
 * Formula (insulin pmol/L, glucose mmol/L): HOMA-IR = (insulin × glucose) / 135
 */

export const INSULIN_PMOL_PER_UU_ML = 6;
export const HOMA_DIVISOR_MMOL_PMOL = 135;
export const NHANES_INSULIN_RESISTANCE_CUTOFF = 2.5;

function parsePositive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return number;
}

function getInterpretation(homaIr) {
  if (homaIr >= NHANES_INSULIN_RESISTANCE_CUTOFF) {
    return {
      insulinResistanceLikely: true,
      interpretation: 'HOMA-IR ≥2,5 — по данным NHANES соответствует инсулинорезистентности',
    };
  }
  return {
    insulinResistanceLikely: false,
    interpretation: 'HOMA-IR <2,5 — ниже порога NHANES для инсулинорезистентности',
  };
}

export function calculateHomaIr(insulinPmolL, glucoseMmolL) {
  return (insulinPmolL * glucoseMmolL) / HOMA_DIVISOR_MMOL_PMOL;
}

export function calculate(input) {
  const insulinPmolL = parsePositive(input.insulinPmolL, 'insulinPmolL');
  const glucoseMmolL = parsePositive(input.glucoseMmolL, 'glucoseMmolL');

  const homaIrExact = calculateHomaIr(insulinPmolL, glucoseMmolL);
  const homaIr = Number(homaIrExact.toFixed(1));
  const result = getInterpretation(homaIr);

  return {
    value: homaIr,
    homaIr,
    insulinPmolL,
    glucoseMmolL,
    insulinResistanceLikely: result.insulinResistanceLikely,
    interpretation: result.interpretation,
  };
}
