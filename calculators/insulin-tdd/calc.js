/**
 * Калькулятор инсулина: суточная доза, базал/болюс, ISF, ICR, прандиальный болюс.
 * Источник: Calculators_MobileApp / insulin-tdd.
 */

export const PROFILE_OPTIONS = [
  { value: 'sensitive', label: 'Чувствительный (СД1)', unitsPerKg: 0.35, hint: '0,3–0,4 Ед/кг' },
  { value: 'standard', label: 'Стандарт СД2', unitsPerKg: 0.5, hint: '0,5 Ед/кг' },
  { value: 'resistant', label: 'Резистентный / ожирение', unitsPerKg: 0.7, hint: '0,6–1,0 Ед/кг' },
  { value: 'puberty', label: 'Дети / пубертат', unitsPerKg: 1.2, hint: '1,0–1,5 Ед/кг' },
  { value: 'custom', label: 'Свой коэффициент', unitsPerKg: 0.5, hint: 'укажите Ед/кг' },
];

export const INSULIN_KIND_OPTIONS = [
  {
    value: 'rapid',
    label: 'Быстрый (лизпро / аспарт / глулизин)',
    ruleMg: 1800,
    ruleMmol: 100,
  },
  {
    value: 'regular',
    label: 'Короткий (регулярный / Актрапид)',
    ruleMg: 1500,
    ruleMmol: 83,
  },
];

export const ICR_RULE_OPTIONS = [
  { value: '500', label: '500 (взрослые)', divisor: 500 },
  { value: '450', label: '450 (высокая инсулинорезистентность)', divisor: 450 },
  { value: '400', label: '400 (помпа / инсулинорезистентность)', divisor: 400 },
  { value: '300', label: '300 (дети, низкая суточная доза инсулина)', divisor: 300 },
];

export function defaultInputs() {
  return {
    weightKg: '',
    profile: 'standard',
    unitsPerKg: '0,5',
    basalPct: 50,
    insulinKind: 'rapid',
    icrRule: '500',
    glucoseCurrent: '',
    glucoseTarget: '6',
    carbsG: '',
  };
}

function parsePositive(raw) {
  const n = Number(String(raw ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseNonNeg(raw) {
  const n = Number(String(raw ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function resolveUnitsPerKg(input) {
  if (input.profile === 'custom') {
    return parsePositive(input.unitsPerKg);
  }
  const preset = PROFILE_OPTIONS.find((p) => p.value === input.profile);
  const fromField = parsePositive(input.unitsPerKg);
  if (fromField != null) return fromField;
  return preset?.unitsPerKg ?? null;
}

export function profileDefaultUnits(profile) {
  const preset = PROFILE_OPTIONS.find((p) => p.value === profile);
  return String(preset?.unitsPerKg ?? 0.5).replace('.', ',');
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function formatRu(n, digits = 1) {
  return n.toFixed(digits).replace('.', ',');
}

export function isTddReady(input) {
  return parsePositive(input.weightKg) != null && resolveUnitsPerKg(input) != null;
}

export function calculateTdd(input) {
  const weight = parsePositive(input.weightKg);
  const upk = resolveUnitsPerKg(input);
  if (weight == null || upk == null) throw new Error('Укажите массу и коэффициент');

  const basalPct = Math.min(100, Math.max(0, Math.round(Number(input.basalPct) || 0)));
  const bolusPct = 100 - basalPct;
  const tdd = weight * upk;
  const basal = (tdd * basalPct) / 100;
  const bolusTotal = (tdd * bolusPct) / 100;
  const mealBolus = bolusTotal / 3;

  return {
    weightKg: weight,
    unitsPerKg: upk,
    tdd: round1(tdd),
    basalPct,
    bolusPct,
    basal: round1(basal),
    bolusTotal: round1(bolusTotal),
    mealBolus: round1(mealBolus),
  };
}

export function calculateIsf(tdd, kind) {
  const opt = INSULIN_KIND_OPTIONS.find((o) => o.value === kind) ?? INSULIN_KIND_OPTIONS[0];
  return {
    kind,
    ruleMg: opt.ruleMg,
    ruleMmol: opt.ruleMmol,
    isfMgDl: round1(opt.ruleMg / tdd),
    isfMmolL: round2(opt.ruleMmol / tdd),
  };
}

export function calculateCorrection(glucoseCurrent, glucoseTarget, isfMmolL) {
  const delta = glucoseCurrent - glucoseTarget;
  const units = isfMmolL > 0 ? delta / isfMmolL : 0;
  return {
    deltaMmol: round2(delta),
    correctionUnits: round1(units),
  };
}

export function calculateIcr(tdd, rule) {
  const opt = ICR_RULE_OPTIONS.find((o) => o.value === rule) ?? ICR_RULE_OPTIONS[0];
  return {
    rule,
    divisor: opt.divisor,
    icr: round1(opt.divisor / tdd),
  };
}

export function calculatePrandial(carbsG, icr) {
  return { prandialUnits: round1(icr > 0 ? carbsG / icr : 0) };
}

export function calculate(input) {
  const tddBlock = calculateTdd(input);
  const isf = calculateIsf(tddBlock.tdd, input.insulinKind || 'rapid');
  const icr = calculateIcr(tddBlock.tdd, input.icrRule || '500');

  const gCur = parsePositive(input.glucoseCurrent);
  const gTgt = parseNonNeg(input.glucoseTarget);
  const carbs = parseNonNeg(input.carbsG);

  const correction =
    gCur != null && gTgt != null ? calculateCorrection(gCur, gTgt, isf.isfMmolL) : null;

  const prandial = carbs != null ? calculatePrandial(carbs, icr.icr) : null;

  const totalBolus = (prandial?.prandialUnits ?? 0) + (correction?.correctionUnits ?? 0);

  return {
    ...tddBlock,
    isf,
    icr,
    glucoseCurrent: gCur,
    glucoseTarget: gTgt,
    carbsG: carbs,
    correction,
    prandial,
    totalBolus: round1(totalBolus),
    value: tddBlock.tdd,
    lines: [
      `Суточная доза инсулина: ${formatRu(tddBlock.tdd)} Ед (${formatRu(tddBlock.unitsPerKg, 2)} Ед/кг × ${formatRu(tddBlock.weightKg, 1)} кг)`,
      `Базальный ${tddBlock.basalPct}%: ${formatRu(tddBlock.basal)} Ед; болюсный ${tddBlock.bolusPct}%: ${formatRu(tddBlock.bolusTotal)} Ед (по ${formatRu(tddBlock.mealBolus)} Ед на приём)`,
      `ISF: ${formatRu(isf.isfMmolL, 2)} ммоль/л на 1 Ед (правило ${isf.ruleMmol} ÷ суточная доза инсулина)`,
      `ICR: ${formatRu(icr.icr)} г углеводов на 1 Ед (правило ${icr.divisor} ÷ суточная доза инсулина)`,
      correction
        ? `Коррекция: ${formatRu(correction.correctionUnits)} Ед (${formatRu(correction.deltaMmol, 2)} ммоль/л / ISF)`
        : 'Коррекция: укажите текущую и целевую глюкозу',
      prandial
        ? `Прандиальный болюс: ${formatRu(prandial.prandialUnits)} Ед (${formatRu(carbs ?? 0, 0)} г / ICR)`
        : 'Прандиальный болюс: укажите углеводы в порции',
      `Итоговый болюс: ${formatRu(round1(totalBolus))} Ед = углеводы/ICR + (Gтек − Gцель)/ISF`,
    ],
  };
}
