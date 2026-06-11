/**
 * Шкала MACOCHA — риск сложной интубации в ОРИТ (De Jong, 2013).
 * https://anest-rean.ru/international-scale/macocha/
 */

export const CRITERIA = [
  { id: 'mallampati', label: 'Маллампати III–IV', points: 5 },
  { id: 'apnea', label: 'Синдром апноэ', points: 2 },
  { id: 'cervical', label: 'Ограничение подвижности шеи', points: 1 },
  { id: 'mouth', label: 'Открытие рта < 3 см', points: 1 },
  { id: 'coma', label: 'Кома', points: 1 },
  { id: 'hypoxia', label: 'Гипоксия', points: 1 },
  { id: 'untrained', label: 'Неподготовленный анестезиолог', points: 1 },
];

export const MAX_SCORE = 12;

export function interpretMacocha(total) {
  if (total === 0) return 'легкая интубация';
  if (total === MAX_SCORE) return 'очень сложная интубация';
  if (total <= 3) return 'низкий риск сложной интубации';
  if (total <= 7) return 'умеренный риск сложной интубации';
  return 'высокий риск сложной интубации';
}

export function macochaScore(input) {
  let total = 0;
  const selected = [];

  for (const c of CRITERIA) {
    if (input[c.id]) {
      total += c.points;
      selected.push(c.id);
    }
  }

  return {
    status: 'OK',
    total,
    interpretation: interpretMacocha(total),
    selected,
  };
}

export function calculate(input) {
  return macochaScore(input || {});
}
