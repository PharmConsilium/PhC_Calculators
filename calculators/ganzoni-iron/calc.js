/**
 * Формула Ганзони — расчёт дефицита / дозы в/в железа.
 * Источник: Ganzoni AM. Schweiz Med Wochenschr. 1970; calc4lab.com/calculators/ganzoni
 *
 * Дефицит (mg) = масса(kg) × ΔHb(g/dL) × 2.4 + запас
 * При Hb в g/L коэффициент 0.24 вместо 2.4.
 * ΔHb < 0 → 0.
 * Компонент на Hb округляется до ближайших 10 мг (как Calc4Lab).
 * Авто-запас: ≥35 кг → +500 mg; <35 кг → +15 mg/kg.
 * Сеансы: Ferinject — до 1000 мг; Monofer — до 20 мг/кг.
 */

export const HB_UNITS = {
  gdl: { label: 'г/дл', factor: 2.4, api: 'g/dL' },
  gl: { label: 'г/л', factor: 0.24, api: 'g/L' },
};

/** Пресеты цели в г/дл (конвертируются при выборе единиц). */
export const TARGET_PRESETS = {
  none: null,
  adult13: 13,
  classic15: 15,
  ckd115: 11.5,
};

export const STORE_MODES = {
  auto: 'auto',
  fixed500: 'fixed500',
  perKg15: 'perKg15',
  custom: 'custom',
  none: 'none',
};

export const DRUGS = {
  none: { label: 'Не выбран', kind: 'none' },
  fcm: {
    label: 'Железа карбоксимальтозат (Ferinject®)',
    kind: 'fcm',
  },
  isomaltoside: {
    label: 'Железа изомальтозид (Monofer®)',
    kind: 'isomaltoside',
  },
};

export function roundHalfUp(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

/** Округление дозы железа до ближайших 10 мг (поведение Calc4Lab). */
export function roundIronMg(value) {
  return Math.round(value / 10) * 10;
}

export function parsePositive(raw) {
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseNonNegative(raw) {
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function normalizeHbUnit(unit) {
  if (unit === 'gl' || unit === 'g/L' || unit === 'gL') return 'gl';
  return 'gdl';
}

/** Конвертация Hb между г/дл и г/л. */
export function convertHb(value, fromUnit, toUnit) {
  const from = normalizeHbUnit(fromUnit);
  const to = normalizeHbUnit(toUnit);
  if (from === to) return value;
  if (from === 'gdl' && to === 'gl') return value * 10;
  return value / 10;
}

/**
 * Приводим текущий и целевой Hb к одной системе единиц.
 * Если единицы разные — считаем в г/л (как Calc4Lab).
 */
export function normalizeHbPair(currentHb, currentUnit, targetHb, targetUnit) {
  const curU = normalizeHbUnit(currentUnit);
  const tgtU = normalizeHbUnit(targetUnit);
  if (curU === tgtU) {
    return {
      current: currentHb,
      target: targetHb,
      hbUnit: curU,
    };
  }
  return {
    current: convertHb(currentHb, curU, 'gl'),
    target: convertHb(targetHb, tgtU, 'gl'),
    hbUnit: 'gl',
  };
}

export function resolveIronStoreMg(weightKg, storeMode, customStoreMg) {
  switch (storeMode) {
    case STORE_MODES.none:
      return 0;
    case STORE_MODES.fixed500:
      return 500;
    case STORE_MODES.perKg15:
      return roundHalfUp(15 * weightKg, 0);
    case STORE_MODES.custom: {
      const n = Number(customStoreMg);
      if (!Number.isFinite(n) || n < 0) return null;
      return roundHalfUp(n, 0);
    }
    case STORE_MODES.auto:
    default:
      return weightKg >= 35 ? 500 : roundHalfUp(15 * weightKg, 0);
  }
}

/** Максимум за сеанс: FCM 1000 мг; Monofer 20 мг/кг. */
export function maxPerSessionMg(drugId, weightKg) {
  if (drugId === 'fcm') return 1000;
  if (drugId === 'isomaltoside') return roundHalfUp(20 * weightKg, 0);
  return null;
}

export function planSessions(totalIronMg, drugId, weightKg) {
  const drug = DRUGS[drugId] || DRUGS.none;
  const max = maxPerSessionMg(drugId, weightKg);
  if (!max || totalIronMg <= 0) {
    return {
      drugId: drugId || 'none',
      drugLabel: drug.label,
      maxPerSessionMg: max,
      sessions: null,
      perSessionMg: null,
    };
  }
  const sessions = Math.max(1, Math.ceil(totalIronMg / max));
  const perSessionMg = Math.floor(totalIronMg / sessions);
  return {
    drugId,
    drugLabel: drug.label,
    maxPerSessionMg: max,
    sessions,
    perSessionMg,
  };
}

/**
 * @param {{
 *   weightKg: number|string,
 *   currentHb: number|string,
 *   targetHb: number|string,
 *   hbUnit?: 'gdl'|'gl',
 *   currentHbUnit?: 'gdl'|'gl',
 *   targetHbUnit?: 'gdl'|'gl',
 *   storeMode?: string,
 *   customStoreMg?: number|string,
 *   drug?: string,
 * }} input
 */
export function calculate(input) {
  const weightKg = parsePositive(input.weightKg);
  const currentHbRaw = parseNonNegative(input.currentHb);
  const targetHbRaw = parsePositive(input.targetHb);
  const storeMode = input.storeMode || STORE_MODES.auto;
  const drug = input.drug && DRUGS[input.drug] ? input.drug : 'none';

  const currentUnit = normalizeHbUnit(
    input.currentHbUnit || input.hbUnit || 'gdl'
  );
  const targetUnit = normalizeHbUnit(
    input.targetHbUnit || input.hbUnit || 'gdl'
  );

  if (weightKg == null) throw new Error('Укажите массу тела');
  if (weightKg > 300) throw new Error('Проверьте массу тела');
  if (currentHbRaw == null) throw new Error('Укажите текущий Hb');
  if (targetHbRaw == null) throw new Error('Укажите целевой Hb');

  const pair = normalizeHbPair(currentHbRaw, currentUnit, targetHbRaw, targetUnit);
  const hbUnit = pair.hbUnit;
  const currentHb = pair.current;
  const targetHb = pair.target;
  const factor = HB_UNITS[hbUnit].factor;

  const deltaHbRaw = targetHb - currentHb;
  const deltaHb = Math.max(0, deltaHbRaw);
  const storeMg = resolveIronStoreMg(weightKg, storeMode, input.customStoreMg);
  if (storeMg == null) throw new Error('Укажите запас железа (мг)');

  const ironForHbRaw = weightKg * deltaHb * factor;
  const ironForHbMg = roundIronMg(ironForHbRaw);
  const totalIronMg = ironForHbMg + storeMg;
  const sessionPlan = planSessions(totalIronMg, drug, weightKg);

  const unitLabel = HB_UNITS[hbUnit].label;
  const deltaDecimals = hbUnit === 'gl' ? 1 : 2;
  const interpretation =
    deltaHbRaw < 0
      ? 'Текущий Hb выше целевого: ΔHb принята равной 0, результат равен запасу железа.'
      : deltaHbRaw === 0
        ? 'Hb на целевом уровне: результат равен выбранному запасу железа.'
        : 'Расчёт по формуле Ганзони с учётом выбранного запаса железа.';

  return {
    totalIronMg,
    ironForHbMg,
    storeMg,
    deltaHb: roundHalfUp(deltaHb, deltaDecimals),
    deltaHbRaw: roundHalfUp(deltaHbRaw, deltaDecimals),
    weightKg,
    currentHb,
    targetHb,
    hbUnit,
    unitLabel,
    factor,
    storeMode,
    sessions: sessionPlan.sessions,
    perSessionMg: sessionPlan.perSessionMg,
    maxPerSessionMg: sessionPlan.maxPerSessionMg,
    drugId: sessionPlan.drugId,
    drugLabel: sessionPlan.drugLabel,
    interpretation,
    formula: `Дефицит = round10(${weightKg} × ${deltaHb} × ${factor}) + ${storeMg} = ${totalIronMg} мг`,
  };
}
