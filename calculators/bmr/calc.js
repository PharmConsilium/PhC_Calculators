/**
 * bmr — Basal Metabolic Rate (calculator.net, Mifflin–St Jeor)
 * Men:   BMR = 10W + 6.25H − 5A + 5
 * Women: BMR = 10W + 6.25H − 5A − 161
 * W — kg, H — cm, A — age (years)
 */

export const LB_TO_KG = 0.45359237;
export const INCH_TO_CM = 2.54;
export const AGE_MIN = 15;
export const AGE_MAX = 80;

export const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    multiplier: 1.2,
    label: 'Малоподвижный: мало или нет упражнений',
  },
  {
    id: 'light',
    multiplier: 1.375,
    label: 'Упражнения 1–3 раза в неделю',
  },
  {
    id: 'moderate',
    multiplier: 1.465,
    label: 'Упражнения 4–5 раз в неделю',
  },
  {
    id: 'active',
    multiplier: 1.55,
    label: 'Ежедневные или интенсивные тренировки 3–4 раза в неделю',
  },
  {
    id: 'veryActive',
    multiplier: 1.725,
    label: 'Интенсивные тренировки 6–7 раз в неделю',
  },
  {
    id: 'extraActive',
    multiplier: 1.9,
    label: 'Очень интенсивные тренировки ежедневно или физическая работа',
  },
];

function parsePositive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return number;
}

function parseAge(value) {
  const age = parsePositive(value, 'age');
  if (age < AGE_MIN || age > AGE_MAX) {
    throw new Error(`Age must be between ${AGE_MIN} and ${AGE_MAX}`);
  }
  return age;
}

export function poundsToKg(pounds) {
  return pounds * LB_TO_KG;
}

export function feetInchesToCm(feet, inches) {
  return (feet * 12 + inches) * INCH_TO_CM;
}

export function calculateMifflinStJeor(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export function roundCalories(calories) {
  return Math.round(calories);
}

export function getDailyCalories(bmr, multiplier) {
  return roundCalories(bmr * multiplier);
}

export function getActivityCalories(bmr) {
  return ACTIVITY_LEVELS.map((level) => ({
    id: level.id,
    label: level.label,
    multiplier: level.multiplier,
    calories: getDailyCalories(bmr, level.multiplier),
  }));
}

export function resolveMetricInput(input) {
  return {
    weightKg: parsePositive(input.weightKg, 'weightKg'),
    heightCm: parsePositive(input.heightCm, 'heightCm'),
  };
}

export function resolveUsInput(input) {
  const feet = Number(input.heightFeet);
  const inches = Number(input.heightInches ?? 0);
  const pounds = parsePositive(input.weightLb, 'weightLb');

  if (!Number.isFinite(feet) || feet < 0) {
    throw new Error('Invalid heightFeet');
  }
  if (!Number.isFinite(inches) || inches < 0) {
    throw new Error('Invalid heightInches');
  }
  if (feet === 0 && inches === 0) {
    throw new Error('Invalid height');
  }

  return {
    weightKg: poundsToKg(pounds),
    heightCm: feetInchesToCm(feet, inches),
    weightLb: pounds,
    heightFeet: feet,
    heightInches: inches,
  };
}

export function calculate(input) {
  const unitSystem = input.unitSystem === 'us' ? 'us' : 'metric';
  const sex = input.sex === 'female' ? 'female' : 'male';
  const age = parseAge(input.age);

  const metric =
    unitSystem === 'us'
      ? resolveUsInput(input)
      : resolveMetricInput(input);

  const bmrExact = calculateMifflinStJeor(
    metric.weightKg,
    metric.heightCm,
    age,
    sex
  );
  const bmr = roundCalories(bmrExact);
  const activityCalories = getActivityCalories(bmrExact);

  return {
    value: bmr,
    bmr,
    bmrExact,
    age,
    sex,
    unitSystem,
    weightKg: metric.weightKg,
    heightCm: metric.heightCm,
    activityCalories,
    interpretation: `BMR = ${bmr} ккал/сут`,
  };
}
