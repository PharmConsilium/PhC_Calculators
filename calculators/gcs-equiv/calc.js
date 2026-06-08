/**
 * Эквивалентные дозы системных глюкокортикостероидов (ГКС).
 * Dtarget = Dsource × Eqtarget / Eqsource (экв. дозы в мг).
 */

export const SYSTEMIC = {
  cortisone: {
    id: 'cortisone',
    name: 'Кортизон',
    eq: 25.0,
    durationLabel: 'Короткое (8–12 ч)',
    mineral: '+++ (высокий)',
    classLabel: 'короткое',
  },
  hydrocortisone: {
    id: 'hydrocortisone',
    name: 'Гидрокортизон',
    eq: 20.0,
    durationLabel: 'Короткое (8–12 ч)',
    mineral: '+++ (высокий)',
    classLabel: 'короткое',
  },
  prednisone: {
    id: 'prednisone',
    name: 'Преднизон',
    eq: 5.0,
    durationLabel: 'Среднее (12–36 ч)',
    mineral: '++ (умеренный)',
    classLabel: 'среднее',
  },
  prednisolone: {
    id: 'prednisolone',
    name: 'Преднизолон',
    eq: 5.0,
    durationLabel: 'Среднее (12–36 ч)',
    mineral: '++ (умеренный)',
    classLabel: 'среднее',
  },
  methylprednisolone: {
    id: 'methylprednisolone',
    name: 'Метилпреднизолон',
    eq: 4.0,
    durationLabel: 'Среднее (12–36 ч)',
    mineral: '+ (низкий)',
    classLabel: 'среднее',
  },
  triamcinolone: {
    id: 'triamcinolone',
    name: 'Триамцинолон',
    eq: 4.0,
    durationLabel: 'Среднее (12–36 ч)',
    mineral: '+ (низкий)',
    classLabel: 'среднее',
  },
  dexamethasone: {
    id: 'dexamethasone',
    name: 'Дексаметазон',
    eq: 0.8,
    potency: 25,
    durationLabel: 'Длительное (36–72 ч)',
    mineral: '0 (отсутствует)',
    classLabel: 'длительное',
  },
  betamethasone: {
    id: 'betamethasone',
    name: 'Бетаметазон',
    eq: 0.8,
    potency: 25,
    durationLabel: 'Длительное (36–72 ч)',
    mineral: '0 (отсутствует)',
    classLabel: 'длительное',
  },
};

export function roundHalfUp(value, decimals) {
  if (!Number.isFinite(value)) return NaN;
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export function parseDoseInput(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || s === '0' || s === '0.0' || s === '0.00') return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return { error: 'BLOCKED_INVALID_NUMBER' };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return { error: 'BLOCKED_INVALID_NUMBER' };
  if (n === 0) return null;
  return { value: n };
}

export function convertSystemicPair(sourceId, targetId, doseSource) {
  const parsed = typeof doseSource === 'number' ? { value: doseSource } : parseDoseInput(doseSource);
  if (parsed && parsed.error) return { status: 'BLOCKED_INVALID_NUMBER' };
  if (!parsed || parsed.value == null) return { status: 'EMPTY' };

  const source = SYSTEMIC[sourceId];
  const target = SYSTEMIC[targetId];
  if (!source || !target) return { status: 'BLOCKED_INVALID_NUMBER' };

  const doseTarget = roundHalfUp((parsed.value * target.eq) / source.eq, 2);
  return {
    status: 'OK',
    doseTarget,
    sourceName: source.name,
    targetName: target.name,
    sourceEq: source.eq,
    targetEq: target.eq,
  };
}

export function calculate(input) {
  const out = convertSystemicPair(input.sourceId, input.targetId, input.doseSource);
  if (out.status !== 'OK') throw new Error(out.status);
  return {
    doseTarget: out.doseTarget,
    status: out.status,
  };
}
