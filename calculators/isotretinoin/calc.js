/**
 * Расчёт дозы изотретиноина для лечения акне (AgapovMD).
 * https://agapovmd.ru/calc/retin.htm
 */

export const CUMULATIVE_MG_KG = 120;
export const DAYS_PER_MONTH = 30;

export const DOSE_OPTIONS_MG_KG = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];

export const DRUG_PRESETS = [
  { id: 'roaccutane-10', label: 'Роаккутан 10 мг', capsuleMg: 10 },
  { id: 'roaccutane-20', label: 'Роаккутан 20 мг', capsuleMg: 20 },
  { id: 'aknecutan-8', label: 'Акнекутан 8 мг', capsuleMg: 8 },
  { id: 'aknecutan-16', label: 'Акнекутан 16 мг', capsuleMg: 16 },
];

export const DOSE_BY_WEIGHT_TABLE = [
  { weightKg: 40, doses: { 0.5: 20, 1: 40, 2: 80 } },
  { weightKg: 50, doses: { 0.5: 25, 1: 50, 2: 100 } },
  { weightKg: 60, doses: { 0.5: 30, 1: 60, 2: 120 } },
  { weightKg: 70, doses: { 0.5: 35, 1: 70, 2: 140 } },
  { weightKg: 80, doses: { 0.5: 40, 1: 80, 2: 160 } },
  { weightKg: 90, doses: { 0.5: 45, 1: 90, 2: 180 } },
  { weightKg: 100, doses: { 0.5: 50, 1: 100, 2: 200 } },
];

export const CUMULATIVE_BY_DOSE_TABLE = [
  { doseMgKg: 0.5, months: { 4: 60, 5: 75, 6: 90, 7: 105 } },
  { doseMgKg: 0.6, months: { 4: 72, 5: 90, 6: 108, 7: 126 } },
  { doseMgKg: 0.7, months: { 4: 84, 5: 105, 6: 126, 7: 147 } },
  { doseMgKg: 0.8, months: { 4: 96, 5: 120, 6: 144, 7: 168 } },
  { doseMgKg: 0.9, months: { 4: 108, 5: 135, 6: 162, 7: 189 } },
  { doseMgKg: 1.0, months: { 4: 120, 5: 150, 6: 180, 7: 210 } },
];

export function roundHalfUp(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

function parsePositive(value) {
  if (value === null || value === undefined || value === '') return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseDoseMgKg(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return DOSE_OPTIONS_MG_KG.includes(n) ? n : null;
}

function parseCapsuleMg(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return DRUG_PRESETS.some((p) => p.capsuleMg === n) ? n : null;
}

export function isotretinoinCalculate(input) {
  const weightKg = parsePositive(input.weightKg);
  const doseMgKg = parseDoseMgKg(input.doseMgKg);
  const capsuleMg = parseCapsuleMg(input.capsuleMg);

  if (weightKg === null || doseMgKg === null || capsuleMg === null) {
    return { status: 'INVALID' };
  }

  const dailyDoseMg = roundHalfUp(weightKg * doseMgKg, 0);
  const cumulativeMg = roundHalfUp(weightKg * CUMULATIVE_MG_KG, 0);
  const cumulativeG = roundHalfUp(cumulativeMg / 1000, 1);
  const capsulesPerDay = Math.round(dailyDoseMg / capsuleMg);
  const capsulesPerMonth = capsulesPerDay * DAYS_PER_MONTH;
  const capsulesPerCourse = Math.round(cumulativeMg / capsuleMg);
  const courseDays =
    capsulesPerDay > 0 ? Math.round(capsulesPerCourse / capsulesPerDay) : 0;

  const drug = DRUG_PRESETS.find((p) => p.capsuleMg === capsuleMg);

  return {
    status: 'OK',
    weightKg: roundHalfUp(weightKg, 1),
    doseMgKg,
    capsuleMg,
    drugId: drug?.id ?? null,
    drugLabel: drug?.label ?? null,
    dailyDoseMg,
    cumulativeMg,
    cumulativeG,
    capsulesPerDay,
    capsulesPerMonth,
    capsulesPerCourse,
    courseDays,
  };
}

export function calculate(input) {
  const out = isotretinoinCalculate(input);
  if (out.status !== 'OK') throw new Error('Заполните все поля');
  return out;
}
