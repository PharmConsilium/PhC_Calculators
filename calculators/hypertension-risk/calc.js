/**
 * Степень и стадия АГ, стратификация риска ССО.
 * Клинический протокол МЗ РБ «Диагностика и лечение пациентов (взрослое население)
 * с артериальной гипертензией» — приложения 1, 3, 4.
 */

export const FIELD_LIMITS = {
  sbp: { min: 40, max: 310 },
  dbp: { min: 40, max: 310 },
};

/** 1. Факторы риска (приложение 3) */
export const RISK_FACTORS = [
  { id: 'maleSex', label: 'Мужской пол' },
  {
    id: 'age',
    label: 'Возраст',
    hint: 'Мужчины ≥ 55 лет; женщины ≥ 65 лет',
  },
  {
    id: 'smoking',
    label: 'Курение',
    hint: 'В настоящем или в прошлом',
  },
  {
    id: 'dyslipidemia',
    label: 'Дислипидемия',
    hint: 'Общий холестерин > 4,9 ммоль/л\nи (или)\nХС ЛПНП > 3,0 ммоль/л\nи (или)\nХС ЛПВП < 1,0 у мужчин / < 1,2 у женщин\nи (или)\nТГ > 1,7 ммоль/л',
  },
  {
    id: 'fastingGlucose',
    label: 'Глюкоза крови натощак',
    hint: '5,6–6,9 ммоль/л\nили\n5,6–6,0 ммоль/л капиллярной крови',
  },
  {
    id: 'postprandialGlucose',
    label: 'Постпрандиальная глюкоза (после еды или после нагрузки)',
    hint: '≥ 7,8\nи\n< 11,1 ммоль/л',
  },
  {
    id: 'obesity',
    label: 'Ожирение',
    hint: 'ИМТ ≥ 30 кг/м²',
  },
  {
    id: 'abdominalObesity',
    label: 'Абдоминальное ожирение',
    hint: 'ОТ > 102 см у мужчин;\n> 88 см у женщин',
  },
  {
    id: 'uricAcid',
    label: 'Мочевая кислота',
    hint: '≥ 360 мкмоль/л',
  },
  {
    id: 'familyHistory',
    label: 'Семейный анамнез ранних ССЗ',
    hint: 'У мужчин < 55 лет;\nу женщин < 65 лет',
  },
  {
    id: 'earlyMenopause',
    label: 'Ранняя менопауза',
    hint: 'До 45 лет',
  },
  {
    id: 'tachycardia',
    label: 'ЧСС в покое > 80 уд/мин',
  },
];

/** 2. Бессимптомное поражение органов-мишеней */
export const TARGET_ORGAN_DAMAGES = [
  {
    id: 'arterialStiffness',
    label: 'Артериальная жесткость',
    hint: 'Пульсовое давление ≥ 60 мм рт.ст.\nи (или)\nскорость распространения пульсовой волны (каротидно-феморальная) > 10 м/с',
  },
  {
    id: 'ecgLvh',
    label: 'ГЛЖ по ЭКГ критериям',
    hint: 'Соколов–Лайон > 35 мм;\nRaVL > 11 мм;\nКорнеллское произведение > 2440 мм×мс;\nКорнелл > 28 мм у мужчин / > 20 мм у женщин',
  },
  {
    id: 'echoLvh',
    label: 'ГЛЖ по ЭхоКГ критериям',
    hint: 'Индекс массы миокарда левого желудочка (далее ИММЛЖ⁵) > 50 г/м²·⁷ у мужчин, > 47 у женщин\nили\nИММЛЖ⁶ у мужчин > 115 г/м², у женщин > 95 г/м²',
  },
  {
    id: 'atherosclerosisMild',
    label: 'Наличие атеросклеротических бляшек при визуализации',
    hint: '< 50 %',
  },
  {
    id: 'ckd3',
    label: 'ХБП 3 стадии',
    hint: 'СКФ⁷ 30–59 мл/мин/1,73 м²',
  },
  {
    id: 'albuminuria',
    label: 'Альбуминурия',
    hint: '30–300 мг/сут\nили\nотношение альбумин/креатинин 30–300 мг/г предпочтительно разовой утренней порции мочи или при невозможности оценки альбуминурии качественная оценка протеинурии',
  },
  {
    id: 'retinopathy',
    label: 'Тяжелая ретинопатия',
    hint: 'Кровоизлияния или экссудаты сетчатки, отёк диска зрительного нерва',
  },
];

/** 3. Ассоциированные клинические состояния */
export const ASSOCIATED_CONDITIONS = [
  {
    id: 'cerebrovascular',
    label: 'Цереброваскулярная болезнь (ЦВБ)',
    hint: 'транзиторная ишемическая атака, ишемический инсульт, церебральное кровоизлияние',
  },
  {
    id: 'chd',
    label: 'Ишемическая болезнь сердца (ИБС)',
    hint: 'Инфаркт миокарда, стенокардия, состояние после реваскуляризации миокарда (чрескожное коронарное вмешательство, аортокоронарное шунтирование)',
  },
  {
    id: 'af',
    label: 'Фибрилляция предсердий',
  },
  {
    id: 'hf',
    label: 'Хроническая сердечная недостаточность',
    hint: 'IIА и выше, в том числе с сохранённой фракцией выброса левого желудочка',
  },
  {
    id: 'atherosclerosisSevere',
    label: 'Наличие атеросклеротических бляшек при визуализации',
    hint: '≥ 50 %',
  },
  {
    id: 'ckd45',
    label: 'ХБП, стадии 4–5',
    hint: 'СКФ < 30 мл/мин/1,73 м²',
  },
];

/** 4. Сахарный диабет — любой из пунктов = СД для стратификации */
export const DIABETES_CRITERIA = [
  {
    id: 'dmFasting',
    label: 'Глюкоза крови натощак ≥ 7,0 ммоль/л (≥ 6,1 ммоль/л в капиллярной крови) при двух повторных измерениях',
  },
  {
    id: 'dmHba1c',
    label: 'Гликированный гемоглобин HbA1c ≥ 6,5 %',
  },
  {
    id: 'dmRandom',
    label: 'Глюкоза в любое время суток (случайная гликемия) ≥ 11,1 ммоль/л при двух повторных измерениях',
  },
];

const CATEGORY_RANK = {
  optimal: 0,
  normal: 1,
  highNormal: 2,
  1: 3,
  2: 4,
  3: 5,
};

const DEGREE_LABELS = {
  optimal: 'Оптимальное АД',
  normal: 'Нормальное АД',
  highNormal: 'Высокое нормальное АД',
  1: 'Артериальная гипертензия I степени',
  2: 'Артериальная гипертензия II степени',
  3: 'Артериальная гипертензия III степени',
};

const ISOLATE_LABELS = {
  isolate: 'Изолированная систолическая АГ (ИСАГ)',
  dadIsolate: 'Изолированная диастолическая АГ (ИДАГ)',
};

const RISK_META = {
  none: {
    label: 'нет риска',
    recommendation: 'Изменение образа жизни.',
  },
  low: {
    label: 'низкий риск',
    recommendation:
      'Изменение образа жизни в течение нескольких месяцев. При сохранении артериальной гипертензии — медикаментозная терапия (монотерапия).',
  },
  middle: {
    label: 'средний риск',
    recommendation:
      'Изменение образа жизни в течение нескольких недель. При сохранении артериальной гипертензии — медикаментозная терапия (монотерапия).',
  },
  high: {
    label: 'высокий риск',
    recommendation:
      'Изменение образа жизни и медикаментозная терапия (комбинированная терапия).',
  },
  veryHigh: {
    label: 'очень высокий риск',
    recommendation:
      'Изменение образа жизни и медикаментозная терапия (комбинированная терапия).',
  },
};

/** Матрица приложения 4: строки × [выс. норм., I, II, III] */
const RISK_MATRIX = {
  noFr: ['none', 'low', 'middle', 'high'],
  fr12: ['low', 'middle', 'high', 'high'],
  fr3: ['middle', 'high', 'high', 'veryHigh'],
  pom: ['high', 'high', 'high', 'veryHigh'],
  aks: ['veryHigh', 'veryHigh', 'veryHigh', 'veryHigh'],
};

export function rangeErrorMessage(min, max) {
  return `Число не в корректном интервале ${min} - ${max}`;
}

export function isInRange(value, limits) {
  return value >= limits.min && value <= limits.max;
}

function parsePressure(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function categoryBySbp(sbp) {
  if (sbp < 120) return 'optimal';
  if (sbp <= 129) return 'normal';
  if (sbp <= 139) return 'highNormal';
  if (sbp <= 159) return 1;
  if (sbp <= 179) return 2;
  return 3;
}

function categoryByDbp(dbp) {
  if (dbp < 80) return 'optimal';
  if (dbp <= 84) return 'normal';
  if (dbp <= 89) return 'highNormal';
  if (dbp <= 99) return 1;
  if (dbp <= 109) return 2;
  return 3;
}

function maxCategory(a, b) {
  return CATEGORY_RANK[a] >= CATEGORY_RANK[b] ? a : b;
}

function gradeFromSbp(sbp) {
  if (sbp >= 180) return 3;
  if (sbp >= 160) return 2;
  if (sbp >= 140) return 1;
  return null;
}

function gradeFromDbp(dbp) {
  if (dbp >= 110) return 3;
  if (dbp >= 100) return 2;
  if (dbp >= 90) return 1;
  return null;
}

/**
 * Приложение 1: категории офисного АД и степени АГ.
 */
export function classifyBloodPressure(sbp, dbp) {
  // ИСАГ: САД ≥ 140 и ДАД < 90 → степень по САД
  if (sbp >= 140 && dbp < 90) {
    const g = gradeFromSbp(sbp);
    return {
      key: `isolate.${g}`,
      isolate: 'isolate',
      bpColumn: g,
      ahPresent: true,
      riskApplicable: true,
    };
  }
  // ИДАГ: САД < 140 и ДАД ≥ 90 → степень по ДАД
  if (sbp < 140 && dbp >= 90) {
    const g = gradeFromDbp(dbp);
    return {
      key: `dadIsolate.${g}`,
      isolate: 'dadIsolate',
      bpColumn: g,
      ahPresent: true,
      riskApplicable: true,
    };
  }

  const cat = maxCategory(categoryBySbp(sbp), categoryByDbp(dbp));
  const ahPresent = cat === 1 || cat === 2 || cat === 3;
  const riskApplicable = cat === 'highNormal' || ahPresent;
  let bpColumn = null;
  if (cat === 'highNormal') bpColumn = 0;
  else if (cat === 1 || cat === 2 || cat === 3) bpColumn = cat;

  return {
    key: cat,
    isolate: null,
    bpColumn,
    ahPresent,
    riskApplicable,
  };
}

export function degreeLabel(degreeKey) {
  if (typeof degreeKey === 'string' && degreeKey.includes('.')) {
    const [kind, n] = degreeKey.split('.');
    const base = ISOLATE_LABELS[kind] || kind;
    const roman = { 1: 'I', 2: 'II', 3: 'III' }[n] || n;
    return `${base} ${roman} степени`;
  }
  if (degreeKey === 1 || degreeKey === 2 || degreeKey === 3) {
    return DEGREE_LABELS[degreeKey];
  }
  return DEGREE_LABELS[degreeKey] || String(degreeKey);
}

function asIdSet(list, catalog) {
  const allowed = new Set(catalog.map((x) => x.id));
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(String).filter((id) => allowed.has(id)))];
}

function resolveRiskRow(frCount, hasPom, hasAksOrDm) {
  if (hasAksOrDm) return 'aks';
  if (hasPom) return 'pom';
  if (frCount >= 3) return 'fr3';
  if (frCount >= 1) return 'fr12';
  return 'noFr';
}

function resolveRiskKey(bpColumn, frCount, hasPom, hasAksOrDm) {
  if (bpColumn == null) return null;
  const row = resolveRiskRow(frCount, hasPom, hasAksOrDm);
  return RISK_MATRIX[row][bpColumn];
}

function romanDegree(n) {
  return { 1: 'I', 2: 'II', 3: 'III' }[n] || String(n);
}

function degreeShort(degreeKey) {
  if (typeof degreeKey === 'string' && degreeKey.includes('.')) {
    const [kind, n] = degreeKey.split('.');
    const prefix =
      kind === 'isolate'
        ? 'Изолированная систолическая АГ'
        : 'Изолированная диастолическая АГ';
    return `${prefix} ${romanDegree(Number(n))} степени`;
  }
  if (degreeKey === 'highNormal') return 'высокое нормальное АД';
  if (degreeKey === 1 || degreeKey === 2 || degreeKey === 3) {
    return `АГ ${romanDegree(degreeKey)} степени`;
  }
  return degreeLabel(degreeKey);
}

function labelsForIds(ids, catalog) {
  const map = Object.fromEntries(catalog.map((x) => [x.id, x.label]));
  return ids.map((id) => map[id] || id);
}

function buildRiskBasis({
  riskRow,
  frCount,
  bpColumn,
  pom,
  aks,
  diabetes,
  hasPom,
  hasAks,
  hasDm,
}) {
  if (riskRow === 'aks') {
    const parts = [];
    if (hasDm) parts.push('СД');
    if (hasAks) {
      const aksLabels = labelsForIds(aks, ASSOCIATED_CONDITIONS);
      parts.push(
        aksLabels.length
          ? `ассоциированные клинические состояния (${aksLabels.join(', ')})`
          : 'ассоциированные клинические состояния'
      );
    }
    return parts.join('; ') || 'АКС / ХБП ≥ 4 ст. / СД';
  }
  if (riskRow === 'pom') {
    const pomLabels = labelsForIds(pom, TARGET_ORGAN_DAMAGES);
    return pomLabels.length
      ? `бессимптомное ПОМ / ХБП 3 ст. (${pomLabels.join(', ')})`
      : 'бессимптомное ПОМ / ХБП 3 ст.';
  }
  const col =
    bpColumn === 0
      ? 'высокое нормальное АД'
      : bpColumn
        ? `степень ${romanDegree(bpColumn)}`
        : '';
  if (riskRow === 'fr3') {
    return `≥ 3 ФР${col ? ` + ${col}` : ''} (n=${frCount})`;
  }
  if (riskRow === 'fr12') {
    return `1–2 ФР${col ? ` + ${col}` : ''} (n=${frCount})`;
  }
  return col ? `нет других ФР + ${col}` : 'нет других ФР';
}

function buildConclusion({
  degreeKey,
  sbp,
  dbp,
  riskApplicable,
  riskLabel,
  riskBasis,
  riskFactors,
}) {
  const bp = `${sbp}/${dbp} мм рт.ст.`;
  if (!riskApplicable) {
    const headline = degreeLabel(degreeKey);
    const detail = `${bp} Стратификация общего ССР по Прил. 4 не применяется.`;
    return {
      conclusionHeadline: headline,
      conclusion: detail,
      conclusionFull: `${headline}. ${detail}`,
    };
  }
  const short = degreeShort(degreeKey);
  const headline = `${short}, ${riskLabel}`;
  let detail = `${bp} Общий ССР: (по Прил. 4: ${riskBasis}).`;
  if (riskFactors.length) {
    detail += ` ФР: ${labelsForIds(riskFactors, RISK_FACTORS).join('; ')}.`;
  }
  return {
    conclusionHeadline: headline,
    conclusion: detail,
    conclusionFull: `${headline}. ${detail}`,
  };
}


export function hypertensionRiskCalculation(input = {}) {
  const sbp = parsePressure(input.sbp);
  const dbp = parsePressure(input.dbp);

  if (sbp == null || dbp == null) {
    return { status: 'INVALID', message: 'Укажите САД и ДАД' };
  }
  if (!isInRange(sbp, FIELD_LIMITS.sbp)) {
    return {
      status: 'INVALID',
      field: 'sbp',
      message: rangeErrorMessage(FIELD_LIMITS.sbp.min, FIELD_LIMITS.sbp.max),
    };
  }
  if (!isInRange(dbp, FIELD_LIMITS.dbp)) {
    return {
      status: 'INVALID',
      field: 'dbp',
      message: rangeErrorMessage(FIELD_LIMITS.dbp.min, FIELD_LIMITS.dbp.max),
    };
  }

  const classified = classifyBloodPressure(sbp, dbp);
  const degreeKey = classified.key;
  const collectClinical = classified.riskApplicable;

  const riskFactors = collectClinical
    ? asIdSet(input.riskFactors, RISK_FACTORS)
    : [];
  const pom = collectClinical ? asIdSet(input.pom, TARGET_ORGAN_DAMAGES) : [];
  const aks = collectClinical
    ? asIdSet(input.aks, ASSOCIATED_CONDITIONS)
    : [];
  const diabetes = collectClinical
    ? asIdSet(input.diabetes, DIABETES_CRITERIA)
    : [];

  const frCount = riskFactors.length;
  const hasPom = pom.length > 0;
  const hasAks = aks.length > 0;
  const hasDm = diabetes.length > 0;
  const hasAksOrDm = hasAks || hasDm;
  const riskRow = resolveRiskRow(frCount, hasPom, hasAksOrDm);

  let stage = null;
  let stageLabel = null;
  if (classified.ahPresent) {
    if (hasAks) {
      stage = 3;
      stageLabel = '3 стадия гипертонической болезни';
    } else if (hasPom || hasDm) {
      stage = 2;
      stageLabel = '2 стадия гипертонической болезни';
    } else {
      stage = 1;
      stageLabel = '1 стадия гипертонической болезни';
    }
  }

  let riskKey = null;
  let riskLabel = null;
  let recommendation = null;
  let riskBasis = null;
  let conclusion = null;

  if (classified.riskApplicable) {
    riskKey = resolveRiskKey(
      classified.bpColumn,
      frCount,
      hasPom,
      hasAksOrDm
    );
    const risk = RISK_META[riskKey] || RISK_META.none;
    riskLabel = risk.label;
    recommendation = risk.recommendation;
    riskBasis = buildRiskBasis({
      riskRow,
      frCount,
      bpColumn: classified.bpColumn,
      pom,
      aks,
      diabetes,
      hasPom,
      hasAks,
      hasDm,
    });
    conclusion = buildConclusion({
      degreeKey,
      sbp,
      dbp,
      riskApplicable: true,
      riskLabel,
      riskBasis,
      riskFactors,
    });
  } else {
    riskKey = 'none';
    riskLabel =
      degreeKey === 'optimal' || degreeKey === 'normal'
        ? 'артериальная гипертензия исключена'
        : RISK_META.none.label;
    recommendation = 'Изменение образа жизни при наличии факторов риска.';
    riskBasis = null;
    conclusion = buildConclusion({
      degreeKey,
      sbp,
      dbp,
      riskApplicable: false,
      riskLabel,
      riskBasis: null,
      riskFactors: [],
    });
  }

  return {
    status: 'OK',
    sbp,
    dbp,
    degreeKey,
    degreeLabel: degreeLabel(degreeKey),
    degreeShort: degreeShort(degreeKey),
    isolate: classified.isolate,
    ahPresent: classified.ahPresent,
    riskApplicable: classified.riskApplicable,
    hypertensionExists: classified.ahPresent,
    stage,
    stageLabel,
    riskKey,
    riskLabel,
    riskRow,
    riskBasis,
    conclusionHeadline: conclusion.conclusionHeadline,
    conclusion: conclusion.conclusion,
    conclusionFull: conclusion.conclusionFull,
    recommendation,
    riskFactors,
    pom,
    aks,
    diabetes,
    frCount,
  };
}

export function calculate(input) {
  const out = hypertensionRiskCalculation(input);
  if (out.status !== 'OK') {
    throw new Error(out.message || 'Заполните все поля');
  }
  return out;
}
