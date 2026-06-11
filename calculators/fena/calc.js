/**
 * Фракционная экскреция натрия (FENa).
 * FENa, % = 100 × (SCr × UNa) / (SNa × UCr)
 * SCr и UCr — мкмоль/л; SNa и UNa — ммоль/л.
 */

export const FENA_DISPLAY_DECIMALS = 2;

export const FENA_THRESHOLDS = {
  prerenalMax: 1,
  renalMax: 4,
};

export const LAB_REFERENCES = {
  serumNa: { min: 138, max: 146, unit: 'ммоль/л' },
  serumCr: { min: 62, max: 115, unit: 'мкмоль/л' },
  urineNa: { min: 100, max: 260, unit: 'ммоль/л' },
  urineCr: { min: 1768, max: 32708, unit: 'мкмоль/л' },
};

/** Допустимые интервалы ввода (QxMD / Медвестник). */
export const FIELD_LIMITS = {
  serumNa: { min: 50, max: 500 },
  serumCr: { min: 10, max: 2000 },
  urineNa: { min: 10, max: 999 },
  urineCr: { min: 10, max: 99999 },
};

export function rangeErrorMessage(min, max) {
  return `Число не в корректном интервале ${min} - ${max}`;
}

export function isInRange(value, limits) {
  return value >= limits.min && value <= limits.max;
}

export const INTERPRETATIONS = {
  prerenal: {
    title: 'Преренальная олигурия.',
    examples:
      'Например: гиповолемия, заболевания сердца, стеноз почечной артерии, сепсис (любая из причин, вызывающая снижение перфузии почек).',
    note: 'Следует помнить, что контраст-индуцированное поражение почек часто выглядит как преренальная олигурия.',
  },
  renal: {
    title: 'Почечная олигурия.',
    examples:
      'Например: острый тубулярный некроз, острый интерстициальный нефрит, гломерулонефриты и т. д.',
    note: null,
  },
  postrenal: {
    title: 'Постренальная (обструктивная) олигурия.',
    examples:
      'Например: доброкачественная гиперплазия предстательной железы, мочекаменная болезнь, двусторонняя обструкция мочеточника и т. д.',
    note: null,
  },
};

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

function parsePositive(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function fenaPercent(serumNa, urineNa, serumCrUmol, urineCrUmol) {
  return (100 * serumCrUmol * urineNa) / (serumNa * urineCrUmol);
}

export function classifyFena(fena) {
  if (fena < FENA_THRESHOLDS.prerenalMax) return 'prerenal';
  if (fena <= FENA_THRESHOLDS.renalMax) return 'renal';
  return 'postrenal';
}

export function fenaCalculation(input) {
  const serumNa = parsePositive(input.serumNa);
  const urineNa = parsePositive(input.urineNa);
  const serumCr = parsePositive(input.serumCr);
  const urineCr = parsePositive(input.urineCr);

  if (serumNa == null || urineNa == null || serumCr == null || urineCr == null) {
    return { status: 'INVALID' };
  }

  const fields = [
    { key: 'serumNa', value: serumNa, limits: FIELD_LIMITS.serumNa },
    { key: 'urineNa', value: urineNa, limits: FIELD_LIMITS.urineNa },
    { key: 'serumCr', value: serumCr, limits: FIELD_LIMITS.serumCr },
    { key: 'urineCr', value: urineCr, limits: FIELD_LIMITS.urineCr },
  ];
  for (const field of fields) {
    if (!isInRange(field.value, field.limits)) {
      return {
        status: 'INVALID',
        field: field.key,
        message: rangeErrorMessage(field.limits.min, field.limits.max),
      };
    }
  }

  const decimals = FENA_DISPLAY_DECIMALS;
  const safeDecimals = decimals;

  const fenaRaw = fenaPercent(serumNa, urineNa, serumCr, urineCr);
  const fena = roundHalfUp(fenaRaw, safeDecimals);
  const category = classifyFena(fena);
  const interpretation = INTERPRETATIONS[category];

  return {
    status: 'OK',
    serumNaMmolL: roundHalfUp(serumNa, 2),
    urineNaMmolL: roundHalfUp(urineNa, 2),
    serumCrUmolL: roundHalfUp(serumCr, 2),
    urineCrUmolL: roundHalfUp(urineCr, 2),
    fenaPercent: fena,
    category,
    title: interpretation.title,
    examples: interpretation.examples,
    note: interpretation.note,
    decimals: safeDecimals,
  };
}

export function calculate(input) {
  const out = fenaCalculation(input);
  if (out.status !== 'OK') {
    throw new Error(out.message || 'Заполните все поля');
  }
  return out;
}
