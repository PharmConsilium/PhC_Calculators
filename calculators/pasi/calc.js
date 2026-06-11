/**
 * PASI — индекс площади поражения и тяжести псориаза (MDCalc / Fredriksson et al.).
 * PASI региона = (эритема + индурация + десквамация) × площадь × коэффициент ППТ.
 */

export const LESION_SIGNS = [
  { id: 'erythema', label: 'Эритема' },
  { id: 'induration', label: 'Индурация / утолщение' },
  { id: 'desquamation', label: 'Десквамация / шелушение' },
];

export const LESION_LEVELS = [
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

export const REGIONS = [
  { id: 'head', label: 'Голова и шея', bsa: 0.1 },
  { id: 'upper', label: 'Верхние конечности', bsa: 0.2 },
  { id: 'trunk', label: 'Туловище', bsa: 0.3 },
  { id: 'lower', label: 'Нижние конечности', bsa: 0.4 },
];

export const PASI_MAX = 72;

function parseScore(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max || !Number.isInteger(n)) return null;
  return n;
}

export function roundPasi(value) {
  return Math.round(value * 10) / 10;
}

export function regionPasi(erythema, induration, desquamation, areaPoints, bsa) {
  const severity = erythema + induration + desquamation;
  return severity * areaPoints * bsa;
}

export function interpretPasi(total) {
  if (total <= 0) {
    return { category: 'none', interpretation: 'Нет признаков заболевания (PASI 0)' };
  }
  if (total < 10) {
    return { category: 'mild', interpretation: 'Лёгкая степень тяжести' };
  }
  if (total <= 20) {
    return { category: 'moderate', interpretation: 'Средняя степень тяжести' };
  }
  return { category: 'severe', interpretation: 'Тяжёлая степень' };
}

export function pasiScore(input) {
  const regions = [];
  let total = 0;

  for (const region of REGIONS) {
    const erythema = parseScore(input[`${region.id}_erythema`], 0, 4);
    const induration = parseScore(input[`${region.id}_induration`], 0, 4);
    const desquamation = parseScore(input[`${region.id}_desquamation`], 0, 4);
    const area = parseScore(input[`${region.id}_area`], 0, 6);

    if (
      erythema === null ||
      induration === null ||
      desquamation === null ||
      area === null
    ) {
      return { status: 'INVALID', missing: region.id };
    }

    const score = regionPasi(erythema, induration, desquamation, area, region.bsa);
    const rounded = roundPasi(score);
    total += score;
    regions.push({
      id: region.id,
      label: region.label,
      erythema,
      induration,
      desquamation,
      area,
      severity: erythema + induration + desquamation,
      score: rounded,
    });
  }

  const pasi = roundPasi(total);
  const { category, interpretation } = interpretPasi(pasi);

  return {
    status: 'OK',
    pasi,
    category,
    interpretation,
    regions,
  };
}

export function calculate(input) {
  const out = pasiScore(input || {});
  if (out.status !== 'OK') {
    throw new Error('Заполните все параметры для каждой области тела');
  }
  return out;
}
