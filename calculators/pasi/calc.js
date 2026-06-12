/**
 * Расчет индексов площади поражения и тяжести дерматологических заболеваний (PASI, PEST, EASI, SCORAD).
 */

export const MODES = {
  pasi: 'PASI',
  pest: 'PEST',
  easi: 'EASI',
  scorad: 'SCORAD',
};

// ── PASI ────────────────────────────────────────────────────────────────────

export const PASI_LESION_SIGNS = [
  { id: 'erythema', label: 'Эритема' },
  { id: 'induration', label: 'Индурация / утолщение' },
  { id: 'desquamation', label: 'Десквамация / шелушение' },
];

export const PASI_LESION_LEVELS = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Слабая' },
  { value: 2, label: 'Умеренная' },
  { value: 3, label: 'Выраженная' },
  { value: 4, label: 'Очень выраженная' },
];

export const AREA_LEVELS = [
  { value: 0, label: '0%', points: 0 },
  { value: 1, label: '1–9%', points: 1 },
  { value: 2, label: '10–29%', points: 2 },
  { value: 3, label: '30–49%', points: 3 },
  { value: 4, label: '50–69%', points: 4 },
  { value: 5, label: '70–89%', points: 5 },
  { value: 6, label: '90–100%', points: 6 },
];

export const PASI_REGIONS = [
  { id: 'head', label: 'Голова и шея', bsa: 0.1 },
  { id: 'upper', label: 'Верхние конечности', bsa: 0.2 },
  { id: 'trunk', label: 'Туловище', bsa: 0.3 },
  { id: 'lower', label: 'Нижние конечности', bsa: 0.4 },
];

export const PASI_MAX = 72;

// ── EASI ────────────────────────────────────────────────────────────────────

export const EASI_SIGNS = [
  { id: 'erythema', label: 'Эритема' },
  { id: 'infiltration', label: 'Инфильтрация' },
  { id: 'excoriation', label: 'Экскориация' },
  { id: 'lichenification', label: 'Лихенификация' },
];

export const EASI_SIGN_LEVELS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
];

export const EASI_REGIONS = PASI_REGIONS;
export const EASI_MAX = 72;

export const EASI_SCALE = [
  { category: 'mild', min: 0.1, max: 1.0, rangeLabel: '0,1–1,0', label: 'легкая' },
  { category: 'moderate', min: 1.1, max: 7.0, rangeLabel: '1,1–7,0', label: 'умеренная' },
  { category: 'medium', min: 7.1, max: 21.0, rangeLabel: '7,1–21,0', label: 'средняя' },
  { category: 'severe', min: 21.1, max: 50.0, rangeLabel: '21,1–50,0', label: 'тяжелая' },
  { category: 'very-severe', min: 50.1, max: 72.0, rangeLabel: '50,1–72,0', label: 'очень тяжелая' },
];

// ── PEST ────────────────────────────────────────────────────────────────────

export const PEST_QUESTIONS = [
  {
    id: 'q1',
    label: 'Был ли у вас когда-либо отёк сустава (суставов)?',
  },
  {
    id: 'q2',
    label: 'Говорил ли вам врач, что у вас артрит?',
  },
  {
    id: 'q3',
    label: 'Есть ли на ногтях пальцев рук или ног ямочки или углубления?',
  },
  {
    id: 'q4',
    label: 'Была ли у вас боль в пятке?',
  },
  {
    id: 'q5',
    label:
      'Был ли у вас палец на руке или ноге, который полностью опух и болел без видимой причины?',
  },
];

export const PEST_JOINTS = [
  { id: 'neck', label: 'Шея', side: 'center', segment: 'torso' },
  { id: 'upperBack', label: 'Верхняя часть спины', side: 'center', segment: 'torso' },
  { id: 'lowerBack', label: 'Нижняя часть спины', side: 'center', segment: 'legs' },
  { id: 'shoulderR', label: 'Плечо', side: 'right', segment: 'torso' },
  { id: 'elbowR', label: 'Локоть', side: 'right', segment: 'torso' },
  { id: 'wristR', label: 'Запястье', side: 'right', segment: 'torso' },
  { id: 'handR', label: 'Кисть / пальцы', side: 'right', segment: 'torso' },
  { id: 'thumbR', label: 'Большой палец', side: 'right', segment: 'torso' },
  { id: 'hipR', label: 'Бедро', side: 'right', segment: 'legs' },
  { id: 'kneeR', label: 'Колено', side: 'right', segment: 'legs' },
  { id: 'ankleR', label: 'Лодыжка', side: 'right', segment: 'legs' },
  { id: 'footR', label: 'Стопа / пальцы', side: 'right', segment: 'legs' },
  { id: 'shoulderL', label: 'Плечо', side: 'left', segment: 'torso' },
  { id: 'elbowL', label: 'Локоть', side: 'left', segment: 'torso' },
  { id: 'wristL', label: 'Запястье', side: 'left', segment: 'torso' },
  { id: 'handL', label: 'Кисть / пальцы', side: 'left', segment: 'torso' },
  { id: 'thumbL', label: 'Большой палец', side: 'left', segment: 'torso' },
  { id: 'hipL', label: 'Бедро', side: 'left', segment: 'legs' },
  { id: 'kneeL', label: 'Колено', side: 'left', segment: 'legs' },
  { id: 'ankleL', label: 'Лодыжка', side: 'left', segment: 'legs' },
  { id: 'footL', label: 'Стопа / пальцы', side: 'left', segment: 'legs' },
];

export const PEST_MAX = 5;

// ── SCORAD ──────────────────────────────────────────────────────────────────

export const SCORAD_AREA_REGIONS = [
  { id: 'head', label: 'Голова и шея', weight: 0.09, hint: '9% ППТ' },
  { id: 'genital', label: 'Гениталии', weight: 0.01, hint: '1% ППТ' },
  { id: 'armL', label: 'Левая рука', weight: 0.09, hint: '9% ППТ' },
  { id: 'armR', label: 'Правая рука', weight: 0.09, hint: '9% ППТ' },
  { id: 'legL', label: 'Левая нога', weight: 0.18, hint: '18% ППТ' },
  { id: 'legR', label: 'Правая нога', weight: 0.18, hint: '18% ППТ' },
  { id: 'trunkFront', label: 'Грудь, живот', weight: 0.18, hint: '18% ППТ' },
  { id: 'back', label: 'Спина', weight: 0.18, hint: '18% ППТ' },
];

export const SCORAD_INTENSITY_SIGNS = [
  { id: 'erythema', label: 'Эритема' },
  { id: 'edema', label: 'Отёк / папула' },
  { id: 'oozing', label: 'Корки / мокнутие' },
  { id: 'excoriation', label: 'Экскориации' },
  { id: 'lichenification', label: 'Лихенификация' },
  { id: 'dryness', label: 'Сухость кожи' },
];

export const SCORAD_INTENSITY_LEVELS = [
  { value: 0, label: '0 — нет' },
  { value: 1, label: '1 — лёгкая' },
  { value: 2, label: '2 — средняя' },
  { value: 3, label: '3 — тяжёлая' },
];

export const SCORAD_MAX = 103;

export const SCORAD_AREA_STEPS = [0, 25, 50, 75, 100];

export function snapScoradArea(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (SCORAD_AREA_STEPS.includes(n)) return n;
  if (n < 0 || n > 100) return null;
  return SCORAD_AREA_STEPS.reduce((best, step) =>
    Math.abs(step - n) < Math.abs(best - n) ? step : best
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────

function parseIntScore(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max || !Number.isInteger(n)) return null;
  return n;
}

function parsePercent(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

function parseSubjective(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 10) return null;
  return n;
}

export function roundScore(value, decimals = 1) {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

function parseBool(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

// ── PASI ────────────────────────────────────────────────────────────────────

export function regionPasi(erythema, induration, desquamation, areaPoints, bsa) {
  return (erythema + induration + desquamation) * areaPoints * bsa;
}

export function interpretPasi(total) {
  if (total <= 0) {
    return { category: 'none', interpretation: 'Нет признаков заболевания (PASI 0)' };
  }
  if (total < 10) return { category: 'mild', interpretation: 'Лёгкая степень тяжести' };
  if (total <= 20) return { category: 'moderate', interpretation: 'Средняя степень тяжести' };
  return { category: 'severe', interpretation: 'Тяжёлая степень' };
}

export function pasiScore(input) {
  const regions = [];
  let total = 0;

  for (const region of PASI_REGIONS) {
    const erythema = parseIntScore(input[`${region.id}_erythema`], 0, 4);
    const induration = parseIntScore(input[`${region.id}_induration`], 0, 4);
    const desquamation = parseIntScore(input[`${region.id}_desquamation`], 0, 4);
    const area = parseIntScore(input[`${region.id}_area`], 0, 6);
    if (erythema === null || induration === null || desquamation === null || area === null) {
      return { status: 'INVALID', missing: region.id };
    }
    const score = regionPasi(erythema, induration, desquamation, area, region.bsa);
    total += score;
    regions.push({ id: region.id, label: region.label, score: roundScore(score) });
  }

  const pasi = roundScore(total);
  const { category, interpretation } = interpretPasi(pasi);
  return { status: 'OK', mode: 'pasi', score: pasi, pasi, category, interpretation, regions };
}

// ── EASI ────────────────────────────────────────────────────────────────────

export function regionEasi(signs, areaPoints, bsa) {
  const severity = signs.reduce((s, v) => s + v, 0);
  return severity * areaPoints * bsa;
}

export function interpretEasi(total) {
  if (total <= 0) {
    return {
      category: 'none',
      label: 'нет признаков',
      rangeLabel: '0',
      interpretation: 'Нет признаков заболевания (EASI 0)',
    };
  }
  for (const band of EASI_SCALE) {
    if (total >= band.min && total <= band.max) {
      return {
        category: band.category,
        label: band.label,
        rangeLabel: band.rangeLabel,
        interpretation: `${band.label} (${band.rangeLabel})`,
      };
    }
  }
  const last = EASI_SCALE[EASI_SCALE.length - 1];
  return {
    category: last.category,
    label: last.label,
    rangeLabel: last.rangeLabel,
    interpretation: `${last.label} (${last.rangeLabel})`,
  };
}

export function easiScore(input) {
  const regions = [];
  let total = 0;

  for (const region of EASI_REGIONS) {
    const area = parseIntScore(input[`${region.id}_area`], 0, 6);
    const signs = EASI_SIGNS.map((sign) =>
      parseIntScore(input[`${region.id}_${sign.id}`], 0, 3)
    );
    if (area === null || signs.some((v) => v === null)) {
      return { status: 'INVALID', missing: region.id };
    }
    const score = regionEasi(signs, area, region.bsa);
    total += score;
    regions.push({ id: region.id, label: region.label, score: roundScore(score) });
  }

  const easi = roundScore(total);
  const { category, interpretation, label, rangeLabel } = interpretEasi(easi);
  return {
    status: 'OK',
    mode: 'easi',
    score: easi,
    easi,
    category,
    label,
    rangeLabel,
    interpretation,
    regions,
  };
}

// ── PEST ────────────────────────────────────────────────────────────────────

export function pestJointDisplayLabel(joint) {
  if (joint.side === 'center') return joint.label;
  const side =
    joint.side === 'left'
      ? joint.segment === 'legs'
        ? 'Левая нога'
        : 'Левая рука'
      : joint.segment === 'legs'
        ? 'Правая нога'
        : 'Правая рука';
  return `${side} — ${joint.label.toLowerCase()}`;
}

export function interpretPest(total) {
  if (total >= 3) {
    return {
      category: 'positive',
      interpretation: 'Положительный скрининг',
      recommendation:
        'PEST ≥ 3 указывает на возможный недиагностированный псориатический артрит. Рекомендуется направление к ревматологу.',
    };
  }
  return {
    category: 'negative',
    interpretation: 'Отрицательный скрининг',
    recommendation:
      'PEST ≤ 2 — по шкале направление к ревматологу не требуется. При появлении симптомов повторите оценку.',
  };
}

export function pestScore(input) {
  let total = 0;
  const answers = [];

  for (const q of PEST_QUESTIONS) {
    const yes = parseBool(input[q.id]);
    if (yes) total += 1;
    answers.push({ id: q.id, yes });
  }

  const selectedJoints = PEST_JOINTS.filter((j) => parseBool(input[`joint_${j.id}`])).map(
    (j) => j.id
  );
  const jointLabels = PEST_JOINTS.filter((j) => parseBool(input[`joint_${j.id}`]))
    .map(pestJointDisplayLabel)
    .sort((a, b) => a.localeCompare(b, 'ru'));

  const { category, interpretation, recommendation } = interpretPest(total);
  return {
    status: 'OK',
    mode: 'pest',
    score: total,
    pest: total,
    max: PEST_MAX,
    category,
    interpretation,
    recommendation,
    answers,
    selectedJoints,
    jointLabels,
  };
}

// ── SCORAD ──────────────────────────────────────────────────────────────────

export function scoradArea(input) {
  let area = 0;
  for (const region of SCORAD_AREA_REGIONS) {
    const pct = snapScoradArea(input[`area_${region.id}`]);
    if (pct === null) return null;
    area += pct * region.weight;
  }
  return area;
}

export function interpretScorad(total) {
  if (total < 20) return { category: 'mild', interpretation: 'Лёгкое течение атопического дерматита' };
  if (total <= 40) {
    return { category: 'moderate', interpretation: 'Средней тяжести течение атопического дерматита' };
  }
  return { category: 'severe', interpretation: 'Тяжёлое течение атопического дерматита' };
}

export function scoradScore(input) {
  const area = scoradArea(input);
  if (area === null) return { status: 'INVALID', missing: 'area' };

  let intensity = 0;
  for (const sign of SCORAD_INTENSITY_SIGNS) {
    const v = parseIntScore(input[`int_${sign.id}`], 0, 3);
    if (v === null) return { status: 'INVALID', missing: sign.id };
    intensity += v;
  }

  const pruritus = parseSubjective(input.pruritus);
  const sleep = parseSubjective(input.sleep);
  if (pruritus === null || sleep === null) return { status: 'INVALID', missing: 'subjective' };

  const subjective = pruritus + sleep;
  const scorad = roundScore(area / 5 + (7 * intensity) / 2 + subjective);
  const { category, interpretation } = interpretScorad(scorad);

  return {
    status: 'OK',
    mode: 'scorad',
    score: scorad,
    scorad,
    area: roundScore(area),
    intensity,
    subjective,
    pruritus,
    sleep,
    category,
    interpretation,
  };
}

// ── router ────────────────────────────────────────────────────────────────────

export function calculate(input) {
  const mode = input?.mode || 'pasi';
  let out;
  switch (mode) {
    case 'pasi':
      out = pasiScore(input);
      break;
    case 'pest':
      out = pestScore(input);
      break;
    case 'easi':
      out = easiScore(input);
      break;
    case 'scorad':
      out = scoradScore(input);
      break;
    default:
      throw new Error('Неизвестный режим расчёта');
  }
  if (out.status !== 'OK') throw new Error('Заполните все параметры расчёта');
  return out;
}
