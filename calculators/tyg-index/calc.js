/**
 * tyg-index — Triglyceride-Glucose Index (MDApp reference)
 * TyG = ln [Fasting triglyceride (mg/dL) × Fasting glucose (mg/dL)] / 2
 */

export const TYG_IR_CUTOFF = 4.49;
export const TYG_NAFLD_CUTOFF = 8.5;

function parsePositive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return number;
}

export function calculateTyg(triglyceridesMgDl, glucoseMgDl) {
  return Math.log(triglyceridesMgDl * glucoseMgDl) / 2;
}

export function roundTyg(tygExact) {
  return Number(tygExact.toFixed(2));
}

export function getInsulinResistanceInterpretation(tygRounded) {
  if (tygRounded >= TYG_IR_CUTOFF) {
    return {
      category: 'suggestive',
      text: 'Данное значение индекса TyG указывает на вероятную инсулинорезистентность.',
    };
  }
  return {
    category: 'unlikely',
    text: 'Данное значение индекса TyG не указывает на инсулинорезистентность.',
  };
}

export function getNafldInterpretation(tygRounded) {
  if (tygRounded >= TYG_NAFLD_CUTOFF) {
    return {
      category: 'likely',
      text: 'Данное значение индекса TyG свидетельствует о высокой вероятности НАЖБП.',
    };
  }
  return {
    category: 'unlikely',
    text: 'Данное значение индекса TyG не указывает на вероятный диагноз НАЖБП.',
  };
}

export function calculate(input) {
  const triglycerides = parsePositive(input.triglycerides, 'triglycerides');
  const glucose = parsePositive(input.glucose, 'glucose');

  const tygExact = calculateTyg(triglycerides, glucose);
  const tyg = roundTyg(tygExact);
  const insulinResistance = getInsulinResistanceInterpretation(tyg);
  const nafld = getNafldInterpretation(tyg);

  return {
    value: tyg,
    tyg,
    triglycerides,
    glucose,
    insulinResistanceCategory: insulinResistance.category,
    nafldCategory: nafld.category,
    insulinResistanceText: insulinResistance.text,
    nafldText: nafld.text,
    interpretation: `${insulinResistance.text} ${nafld.text}`,
  };
}
