/**
 * Модель Гейла — 5-летний риск рака молочной железы (1999).
 * Относит. риск = менархе × биопсии × РПР/родственники × атип. гиперплазия
 * Пятилетний риск = относит. риск × возраст/раса (базовый уровень)
 */

export const MENARCHE_OPTIONS = [
  { id: 'ge14', label: 'Возраст начала менструаций ≥14 лет', coef: 1.0 },
  { id: '12_13', label: '12–13 лет', coef: 1.1 },
  { id: 'lt12', label: '<12 лет', coef: 1.21 },
];

export const BIOPSY_OPTIONS = [
  { id: 'u50_0', group: 'Возраст на консультации <50 лет', label: 'Нет биопсий', coef: 1.0 },
  { id: 'u50_1', group: 'Возраст на консультации <50 лет', label: '1 биопсия', coef: 1.7 },
  { id: 'u50_2', group: 'Возраст на консультации <50 лет', label: '≥2 биопсий', coef: 2.88 },
  { id: 'ge50_0', group: 'Возраст на консультации ≥50 лет', label: 'Нет биопсий', coef: 1.0 },
  { id: 'ge50_1', group: 'Возраст на консультации ≥50 лет', label: '1 биопсия', coef: 1.27 },
  { id: 'ge50_2', group: 'Возраст на консультации ≥50 лет', label: '≥2 биопсий', coef: 1.62 },
];

export const FIRST_BIRTH_RELATIVES_OPTIONS = [
  { id: 'lt20_0', group: 'Возраст при рождении первого ребёнка <20 лет', label: 'Нет родственников 1-й степени с РМЖ', coef: 1.0 },
  { id: 'lt20_1', group: 'Возраст при рождении первого ребёнка <20 лет', label: '1 родственник 1-й степени с РМЖ', coef: 2.61 },
  { id: 'lt20_2', group: 'Возраст при рождении первого ребёнка <20 лет', label: '≥2 родственников 1-й степени с РМЖ', coef: 6.8 },
  { id: '20_24_0', group: 'Возраст при рождении первого ребёнка 20–24 года', label: 'Нет родственников 1-й степени с РМЖ', coef: 1.24 },
  { id: '20_24_1', group: 'Возраст при рождении первого ребёнка 20–24 года', label: '1 родственник 1-й степени с РМЖ', coef: 2.68 },
  { id: '20_24_2', group: 'Возраст при рождении первого ребёнка 20–24 года', label: '≥2 родственников 1-й степени с РМЖ', coef: 5.78 },
  { id: '25_29_0', group: 'Возраст при рождении первого ребёнка 25–29 лет или nullipara', label: 'Нет родственников 1-й степени с РМЖ', coef: 1.55 },
  { id: '25_29_1', group: 'Возраст при рождении первого ребёнка 25–29 лет или nullipara', label: '1 родственник 1-й степени с РМЖ', coef: 2.76 },
  { id: '25_29_2', group: 'Возраст при рождении первого ребёнка 25–29 лет или nullipara', label: '≥2 родственников 1-й степени с РМЖ', coef: 4.91 },
  { id: 'ge30_0', group: 'Возраст при рождении первого ребёнка ≥30 лет', label: 'Нет родственников 1-й степени с РМЖ', coef: 1.93 },
  { id: 'ge30_1', group: 'Возраст при рождении первого ребёнка ≥30 лет', label: '1 родственник 1-й степени с РМЖ', coef: 2.83 },
  { id: 'ge30_2', group: 'Возраст при рождении первого ребёнка ≥30 лет', label: '≥2 родственников 1-й степени с РМЖ', coef: 4.17 },
];

export const ATYPICAL_OPTIONS = [
  { id: 'none', label: 'Биопсии не выполнялись', coef: 1.0 },
  { id: 'no_atyp', label: 'Была выполнена, по крайней мере, одна биопсия, атипичная гиперплазия не выявлена', coef: 0.93 },
  { id: 'unknown', label: 'Атипичная гиперплазия не выявлена, статус гиперплазии неизвестен для ≥1 биоптата', coef: 1.0 },
  { id: 'atyp', label: 'Атипичная гиперплазия выявлена, по крайней мере, в одном биоптате', coef: 1.82 },
];

export const BASELINE_OPTIONS = [
  { id: 'b_20_24', group: 'Чернокожие женщины', label: '20–24 года', coef: 0.014 },
  { id: 'b_25_29', group: 'Чернокожие женщины', label: '25–29 лет', coef: 0.05 },
  { id: 'b_30_34', group: 'Чернокожие женщины', label: '30–34 года', coef: 0.12 },
  { id: 'b_35_39', group: 'Чернокожие женщины', label: '35–39 лет', coef: 0.224 },
  { id: 'b_40_44', group: 'Чернокожие женщины', label: '40–44 года', coef: 0.31 },
  { id: 'b_45_49', group: 'Чернокожие женщины', label: '45–49 лет', coef: 0.355 },
  { id: 'b_50_54', group: 'Чернокожие женщины', label: '50–54 года', coef: 0.416 },
  { id: 'b_55_59', group: 'Чернокожие женщины', label: '55–59 лет', coef: 0.511 },
  { id: 'b_60_64', group: 'Чернокожие женщины', label: '60–64 года', coef: 0.562 },
  { id: 'b_65_69', group: 'Чернокожие женщины', label: '65–69 лет', coef: 0.586 },
  { id: 'b_70_74', group: 'Чернокожие женщины', label: '70–74 года', coef: 0.646 },
  { id: 'b_75_79', group: 'Чернокожие женщины', label: '75–79 лет', coef: 0.713 },
  { id: 'b_80_84', group: 'Чернокожие женщины', label: '80–84 года', coef: 0.659 },
  { id: 'w_20_24', group: 'Белые женщины', label: '20–24 года', coef: 0.012 },
  { id: 'w_25_29', group: 'Белые женщины', label: '25–29 лет', coef: 0.049 },
  { id: 'w_30_34', group: 'Белые женщины', label: '30–34 года', coef: 0.134 },
  { id: 'w_35_39', group: 'Белые женщины', label: '35–39 лет', coef: 0.278 },
  { id: 'w_40_44', group: 'Белые женщины', label: '40–44 года', coef: 0.45 },
  { id: 'w_45_49', group: 'Белые женщины', label: '45–49 лет', coef: 0.584 },
  { id: 'w_50_54', group: 'Белые женщины', label: '50–54 года', coef: 0.703 },
  { id: 'w_55_59', group: 'Белые женщины', label: '55–59 лет', coef: 0.859 },
  { id: 'w_60_64', group: 'Белые женщины', label: '60–64 года', coef: 1.018 },
  { id: 'w_65_69', group: 'Белые женщины', label: '65–69 лет', coef: 1.116 },
  { id: 'w_70_74', group: 'Белые женщины', label: '70–74 года', coef: 1.157 },
  { id: 'w_75_79', group: 'Белые женщины', label: '75–79 лет', coef: 1.14 },
  { id: 'w_80_84', group: 'Белые женщины', label: '80–84 года', coef: 1.006 },
];

function findCoef(options, id) {
  const item = options.find((o) => o.id === id);
  return item ? item.coef : null;
}

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export function gailBreastRisk(input) {
  const menarche = findCoef(MENARCHE_OPTIONS, input.menarche);
  const biopsies = findCoef(BIOPSY_OPTIONS, input.biopsies);
  const firstBirth = findCoef(FIRST_BIRTH_RELATIVES_OPTIONS, input.firstBirthRelatives);
  const atypical = findCoef(ATYPICAL_OPTIONS, input.atypicalHyperplasia);
  const baseline = findCoef(BASELINE_OPTIONS, input.ageRace);

  if ([menarche, biopsies, firstBirth, atypical, baseline].some((v) => v == null)) {
    return { status: 'INVALID' };
  }

  const relativeRisk = menarche * biopsies * firstBirth * atypical;
  const fiveYearRisk = relativeRisk * baseline;
  const decimals = input.decimals != null ? Number(input.decimals) : 2;
  const safeDecimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 3 ? decimals : 2;

  return {
    status: 'OK',
    relativeRisk: roundHalfUp(relativeRisk, safeDecimals),
    fiveYearRisk: roundHalfUp(fiveYearRisk, safeDecimals),
    fiveYearRiskPercent: roundHalfUp(fiveYearRisk, safeDecimals),
    decimals: safeDecimals,
    highRisk: fiveYearRisk >= 1.67,
    interpretation:
      fiveYearRisk >= 1.67
        ? 'Повышенный 5-летний риск (≥1,67%)'
        : '5-летний риск ниже порога 1,67%',
  };
}

export function calculate(input) {
  const out = gailBreastRisk(input);
  if (out.status !== 'OK') throw new Error('Заполните все поля');
  return out;
}
