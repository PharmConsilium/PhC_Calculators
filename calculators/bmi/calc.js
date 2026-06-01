/**
 * ИМТ (BMI) = масса (кг) / рост (м)²
 * Классификация: ВОЗ, взрослые ≥18 лет
 */

export function calculate(input) {
  const weightKg = Number(input.weightKg);
  const heightCm = Number(input.heightCm);

  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    throw new Error('Укажите массу от 1 до 500 кг');
  }
  if (!Number.isFinite(heightCm) || heightCm < 50 || heightCm > 250) {
    throw new Error('Укажите рост от 50 до 250 см');
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const value = Math.round(bmi * 100) / 100;

  return {
    value,
    interpretation: interpretBmi(bmi),
    category: categoryKey(bmi),
  };
}

function interpretBmi(bmi) {
  if (bmi <= 16) return 'Выраженный дефицит массы тела';
  if (bmi <= 18.5) return 'Недостаточная (дефицит) масса тела';
  if (bmi <= 25) return 'Норма';
  if (bmi <= 30) return 'Избыточная масса тела (предожирение)';
  if (bmi <= 35) return 'Ожирение первой степени';
  if (bmi <= 40) return 'Ожирение второй степени';
  return 'Ожирение третьей степени (морбидное)';
}

function categoryKey(bmi) {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}
