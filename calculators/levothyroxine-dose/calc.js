/**
 * levothyroxine-dose — weight-based levothyroxine dose for primary hypothyroidism
 * Source: Hennessey JV; ATA/AACE guidelines; MDCalc calculator.
 * Formula: oral dose (mcg/day) = 1.6 × weight (kg)
 */

export const MCG_PER_KG = 1.6;
export const MCG_PER_LB = 0.7257;
export const IV_DOSE_FACTOR = 0.7;

export const TABLET_STRENGTHS_MCG = [25, 50, 75, 88, 100, 112, 125, 137, 150, 175, 200, 300];

function parsePositiveWeight(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return number;
}

export function roundToNearestTabletStrength(doseMcg) {
  let nearest = TABLET_STRENGTHS_MCG[0];
  let smallestDiff = Math.abs(doseMcg - nearest);

  for (const strength of TABLET_STRENGTHS_MCG) {
    const diff = Math.abs(doseMcg - strength);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearest = strength;
    }
  }

  return nearest;
}

export function calculate(input) {
  const weightKg = parsePositiveWeight(input.weightKg, 'weightKg');
  const doseMcgExact = weightKg * MCG_PER_KG;
  const doseMcg = Math.round(doseMcgExact);
  const nearestTabletMcg = roundToNearestTabletStrength(doseMcgExact);
  const ivDoseMcg = Math.round(doseMcgExact * IV_DOSE_FACTOR);

  return {
    value: doseMcg,
    weightKg,
    doseMcg,
    doseMcgExact: Number(doseMcgExact.toFixed(1)),
    nearestTabletMcg,
    ivDoseMcg,
    interpretation: `Рекомендуемая per os доза левотироксина: ${doseMcg} мкг/сут`,
  };
}
