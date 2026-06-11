/**
 * stop-bang — pure calculation (import in tests)
 * Source: STOP-BANG questionnaire for obstructive sleep apnea screening.
 */

function asYes(value) {
  return value === true || value === 1 || value === 'yes';
}

function requirePositiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return number;
}

function calculateBmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getRisk(score) {
  if (score <= 2) {
    return {
      riskLevel: 'low',
      interpretation: 'Низкий риск обструктивного апноэ сна',
    };
  }
  if (score <= 4) {
    return {
      riskLevel: 'intermediate',
      interpretation: 'Промежуточный риск обструктивного апноэ сна',
    };
  }
  return {
    riskLevel: 'high',
    interpretation: 'Высокий риск обструктивного апноэ сна',
  };
}

export function calculate(input) {
  const weightKg = requirePositiveNumber(input.weightKg, 'weightKg');
  const heightCm = requirePositiveNumber(input.heightCm, 'heightCm');
  const bmi = calculateBmi(weightKg, heightCm);

  const components = {
    snoring: asYes(input.snoring) ? 1 : 0,
    tired: asYes(input.tired) ? 1 : 0,
    observedApnea: asYes(input.observedApnea) ? 1 : 0,
    hypertension: asYes(input.hypertension) ? 1 : 0,
    bmiOver35: bmi > 35 ? 1 : 0,
    ageOver50: asYes(input.ageOver50) ? 1 : 0,
    neckOver40: asYes(input.neckOver40) ? 1 : 0,
    male: asYes(input.male) ? 1 : 0,
  };

  const score = Object.values(components).reduce((sum, value) => sum + value, 0);
  const risk = getRisk(score);

  return {
    value: score,
    score,
    bmi: Number(bmi.toFixed(1)),
    riskLevel: risk.riskLevel,
    interpretation: risk.interpretation,
    components,
  };
}
