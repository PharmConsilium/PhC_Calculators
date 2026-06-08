/**
 * Расчёт гидробаланса (мл/сут) по формулам medsoftpro.ru/kalkulyatory/hydrobalance-calc
 * Гидробаланс = Внутривенная инфузия + Энтеральное введение − Диурез − Патологические потери
 * Патологические потери = 0,4×ФП + лихорадка + одышка + операция + ИВЛ без увлажнения + ручной ввод
 */

import { parseWeightInput, roundHalfUp } from '../fluid-req/calc.js';

export { roundHalfUp, parseWeightInput };

/** мл/кг/ч — верхняя граница диапазона (medsoftpro: 1→2, 2→4, 3→6) */
export const SURGERY_RATES = {
  none: 0,
  minimal: 2,
  medium: 4,
  heavy: 6,
};

export function parseAgeInput(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(',', '.');
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return { error: true };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 120) return { error: true };
  return { value: n };
}

export function parseOptionalVolume(value) {
  if (value === null || value === undefined || value === '') return { value: 0 };
  const s = String(value).trim().replace(',', '.');
  if (!s) return { value: 0 };
  if (!/^\d+(\.\d+)?$/.test(s)) return { error: true };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return { error: true };
  return { value: n };
}

export function parseOptionalNumber(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const s = String(value).trim().replace(',', '.');
  if (!s) return fallback;
  const n = Number(s);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

/** ФП: до 65 лет — 30; 65–75 — 25; старше 75 — 20 мл/кг/сут */
export function physiologicalNeedDaily(weightKg, ageYears) {
  let mlPerKg = 30;
  let fpMethod = '30 мл/кг/сут';
  if (ageYears >= 75) {
    mlPerKg = 20;
    fpMethod = '20 мл/кг/сут';
  } else if (ageYears >= 65) {
    mlPerKg = 25;
    fpMethod = '25 мл/кг/сут';
  }
  return {
    fpDaily: roundHalfUp(weightKg * mlPerKg, 0),
    fpMethod,
  };
}

/** Должный диурез для справки: 20 мл/кг м.т. */
export function expectedDiuresisMl(weightKg) {
  return roundHalfUp(20 * weightKg, 0);
}

/** Внепочечные физиол. потери (авто): 0,4×ФП */
export function autoExtrarenalLossMl(fpDaily) {
  return roundHalfUp(0.4 * fpDaily, 0);
}

/** Лихорадка: ступени по 3 мл/кг на °C выше 37,5 (medsoftpro) */
export function hyperthermiaLossMl(tempC, weightKg) {
  if (tempC < 37.5) return 0;
  if (tempC < 38.5) return roundHalfUp(3 * weightKg, 0);
  if (tempC < 39.5) return roundHalfUp(6 * weightKg, 0);
  if (tempC < 40.5) return roundHalfUp(9 * weightKg, 0);
  if (tempC < 41.5) return roundHalfUp(12 * weightKg, 0);
  return roundHalfUp(15 * weightKg, 0);
}

/** Одышка: ступени по 10 мл/кг на каждые 10 дых/мин выше 25 (medsoftpro) */
export function tachypneaLossMl(weightKg, respiratoryRate) {
  if (respiratoryRate < 25) return 0;
  if (respiratoryRate < 35) return roundHalfUp(10 * weightKg, 0);
  if (respiratoryRate < 45) return roundHalfUp(20 * weightKg, 0);
  if (respiratoryRate < 55) return roundHalfUp(30 * weightKg, 0);
  if (respiratoryRate < 65) return roundHalfUp(40 * weightKg, 0);
  return roundHalfUp(50 * weightKg, 0);
}

export function breathingLossMl(breathingMode) {
  if (breathingMode === 'ivl_unhumidified') return 1000;
  return 0;
}

export function surgeryLossMl(weightKg, traumaLevel, hours) {
  const rate = SURGERY_RATES[traumaLevel] || 0;
  if (!rate || !hours || hours <= 0) return 0;
  return roundHalfUp(rate * weightKg * hours, 0);
}

export function hydroBalance(input) {
  const weightParsed = parseWeightInput(input.weightKg);
  const ageParsed = parseAgeInput(input.ageYears);
  if (!weightParsed || weightParsed.error || !ageParsed || ageParsed.error) return { status: 'INVALID' };
  if (weightParsed.value > 500) return { status: 'INVALID' };

  const weightKg = weightParsed.value;
  const { fpDaily, fpMethod } = physiologicalNeedDaily(weightKg, ageParsed.value);

  const iv = parseOptionalVolume(input.ivMl);
  const enteral = parseOptionalVolume(input.enteralMl);
  const diuresis = parseOptionalVolume(input.diuresisMl);
  const vomiting = parseOptionalVolume(input.vomitingMl);
  const drains = parseOptionalVolume(input.drainsMl);
  const other = parseOptionalVolume(input.otherLossMl);
  const surgeryHoursParsed = parseOptionalVolume(input.surgeryHours);

  for (const p of [iv, enteral, diuresis, vomiting, drains, other, surgeryHoursParsed]) {
    if (p && p.error) return { status: 'INVALID' };
  }

  const tempC = parseOptionalNumber(input.tempC, 37);
  const respiratoryRate = parseOptionalNumber(input.respiratoryRate, 20);
  const breathingMode = String(input.breathingMode || 'physiological');
  const surgeryTrauma = String(input.surgeryTrauma || 'none');
  const surgeryHours = surgeryHoursParsed.value;

  if (tempC < 30 || tempC > 45) return { status: 'INVALID' };
  if (respiratoryRate < 0 || respiratoryRate > 80) return { status: 'INVALID' };
  if (surgeryTrauma !== 'none' && surgeryHours <= 0) return { status: 'INVALID' };

  const extrarenalMl = autoExtrarenalLossMl(fpDaily);
  const expectedDiuresis = expectedDiuresisMl(weightKg);

  const pathologicAutoMl =
    extrarenalMl +
    hyperthermiaLossMl(tempC, weightKg) +
    tachypneaLossMl(weightKg, respiratoryRate) +
    breathingLossMl(breathingMode) +
    surgeryLossMl(weightKg, surgeryTrauma, surgeryHours);

  const pathologicManualMl = vomiting.value + drains.value + other.value;
  const pathologicMl = roundHalfUp(pathologicAutoMl + pathologicManualMl, 0);

  const intakeMl = roundHalfUp(iv.value + enteral.value, 0);
  const outputMl = roundHalfUp(diuresis.value + pathologicMl, 0);
  const balanceMl = roundHalfUp(intakeMl - outputMl, 0);

  let interpretation;
  if (balanceMl > 0) interpretation = 'Положительный гидробаланс (избыток жидкости)';
  else if (balanceMl < 0) interpretation = 'Отрицательный гидробаланс (дефицит жидкости)';
  else interpretation = 'Нулевой гидробаланс';

  return {
    status: 'OK',
    balanceMl,
    intakeMl,
    outputMl,
    fpDaily,
    fpMethod,
    expectedDiuresisMl: expectedDiuresis,
    expectedPhysiologicLossMl: extrarenalMl,
    diuresisMl: diuresis.value,
    extrarenalMl,
    pathologicMl,
    pathologicAutoMl: roundHalfUp(pathologicAutoMl, 0),
    pathologicManualMl,
    interpretation,
  };
}

export function calculate(input) {
  const out = hydroBalance(input);
  if (out.status !== 'OK') throw new Error('Проверьте введённые данные');
  return out;
}
