/**
 * pars — Pediatric Asthma Risk Score (PARS)
 * Source: Biagini Myers JM et al., J Allergy Clin Immunol 2019; PARS scoring sheet (Cincinnati Children's).
 */

function asYes(value) {
  return value === true || value === 1 || value === 'yes';
}

/** Риск развития астмы к 7 годам по баллам PARS (официальная таблица). */
export const ASTHMA_RISK_PERCENT = {
  0: 3,
  2: 6,
  3: 8,
  4: 11,
  5: 15,
  6: 19,
  7: 25,
  8: 32,
  9: 40,
  10: 49,
  11: 58,
  12: 66,
  14: 79,
};

export const CRITERIA = [
  { id: 'parentalAsthma', points: 2 },
  { id: 'eczemaBefore3', points: 2 },
  { id: 'wheezingApartFromColds', points: 3 },
  { id: 'earlyWheezing', points: 3 },
  { id: 'skinPrickTestPositive', points: 2 },
  { id: 'africanAmericanRace', points: 2 },
];

function getRiskCategory(score) {
  if (score <= 4) {
    return {
      riskLevel: 'low',
      interpretation: 'Низкий риск астмы',
      categoryNote:
        'У детей с такими баллами риск развития астмы к 7 годам составляет от 1 к 33 (при 0 баллах) до 1 к 9 (при 4 баллах).',
    };
  }
  if (score <= 8) {
    return {
      riskLevel: 'moderate',
      interpretation: 'Умеренный риск астмы',
      categoryNote:
        'У детей с такими баллами риск развития астмы к 7 годам составляет от 1 к 7 (при 5 баллах) до 1 к 3 (при 8 баллах).',
    };
  }
  return {
    riskLevel: 'high',
    interpretation: 'Высокий риск астмы',
    categoryNote:
      'У детей с такими баллами риск развития астмы к 7 годам составляет от 2 к 5 (при 9 баллах) до 4 к 5 (при 14 баллах).',
  };
}

export function getAsthmaRiskPercent(score) {
  const percent = ASTHMA_RISK_PERCENT[score];
  if (percent == null) {
    throw new Error(`Invalid PARS score: ${score}`);
  }
  return percent;
}

export function calculate(input) {
  const components = {};
  let score = 0;

  for (const criterion of CRITERIA) {
    const points = asYes(input[criterion.id]) ? criterion.points : 0;
    components[criterion.id] = points;
    score += points;
  }

  const asthmaRiskPercent = getAsthmaRiskPercent(score);
  const risk = getRiskCategory(score);

  return {
    value: score,
    score,
    asthmaRiskPercent,
    riskLevel: risk.riskLevel,
    interpretation: risk.interpretation,
    categoryNote: risk.categoryNote,
    components,
  };
}
