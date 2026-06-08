/**
 * Расчёт дозы и скорости введения на инфузомате (ByMed).
 * ml/ч = (доза мкг/кг/мин × масса кг × 60) / (концентрация мг/мл × 1000)
 */

/** @typedef {{ label: string, percent: number, volumeMl: number }} DrugForm */

export const DRUG_CATALOG = [
  { id: 'none', label: 'Без препарата', forms: [] },
  {
    id: 'norepinephrine',
    label: 'Норадреналин',
    forms: [
      { label: '0,2% — 4 мл', percent: 0.2, volumeMl: 4 },
      { label: '0,2% — 8 мл', percent: 0.2, volumeMl: 8 },
    ],
  },
  {
    id: 'epinephrine',
    label: 'Адреналин (эпинефрин)',
    forms: [{ label: '0,1% — 1 мл', percent: 0.1, volumeMl: 1 }],
  },
  {
    id: 'dopamine',
    label: 'Допамин',
    forms: [
      { label: '0,5% — 5 мл', percent: 0.5, volumeMl: 5 },
      { label: '1% — 5 мл', percent: 1, volumeMl: 5 },
      { label: '2% — 5 мл', percent: 2, volumeMl: 5 },
      { label: '4% — 5 мл', percent: 4, volumeMl: 5 },
    ],
  },
  {
    id: 'dobutamine',
    label: 'Добутамин',
    forms: [
      { label: '125 mg ad 20 мл — 0,625%', percent: 0.625, volumeMl: 20 },
      { label: '250 mg ad 20 мл — 1,25%', percent: 1.25, volumeMl: 20 },
      { label: '500 mg ad 20 мл — 2,5%', percent: 2.5, volumeMl: 20 },
    ],
  },
  {
    id: 'phenylephrine',
    label: 'Мезатон (фенилэфрин)',
    forms: [{ label: '1% — 1 мл', percent: 1, volumeMl: 1 }],
  },
  {
    id: 'propofol',
    label: 'Пропофол',
    forms: [
      { label: '1% — 10 мл', percent: 1, volumeMl: 10 },
      { label: '1% — 20 мл', percent: 1, volumeMl: 20 },
      { label: '1% — 50 мл', percent: 1, volumeMl: 50 },
    ],
  },
  {
    id: 'midazolam',
    label: 'Мидазолам (дормикум)',
    forms: [
      { label: '0,1% — 2 мл', percent: 0.1, volumeMl: 2 },
      { label: '0,1% — 5 мл', percent: 0.1, volumeMl: 5 },
      { label: '0,5% — 2 мл', percent: 0.5, volumeMl: 2 },
      { label: '0,5% — 3 мл', percent: 0.5, volumeMl: 3 },
    ],
  },
  {
    id: 'diazepam',
    label: 'Диазепам (реланиум)',
    forms: [
      { label: '0,5% — 2 мл', percent: 0.5, volumeMl: 2 },
      { label: '0,5% — 10 мл', percent: 0.5, volumeMl: 10 },
    ],
  },
  {
    id: 'thiopental',
    label: 'Тиопентал',
    forms: [
      { label: '125 mg ad 20 мл — 0,625%', percent: 0.625, volumeMl: 20 },
      { label: '250 mg ad 20 мл — 1,25%', percent: 1.25, volumeMl: 20 },
      { label: '500 mg ad 20 мл — 2,5%', percent: 2.5, volumeMl: 20 },
      { label: '1000 mg ad 20 мл — 5%', percent: 5, volumeMl: 20 },
    ],
  },
];

/** @deprecated используйте DRUG_CATALOG */
export const DRUG_PRESETS = DRUG_CATALOG.map((drug) => {
  const first = drug.forms[0];
  return {
    id: drug.id,
    label: drug.label,
    percent: first ? first.percent : 0,
    mgMl: first ? percentToMgMl(first.percent) : 0,
    volumeMl: first ? first.volumeMl : 0,
  };
});

export const SOLVENT_PRESETS = [
  { id: 'none', label: 'Без разведения', totalMl: 0 },
  { id: 'to10', label: 'до 10 мл', totalMl: 10 },
  { id: 'to20', label: 'до 20 мл', totalMl: 20 },
  { id: 'to50', label: 'до 50 мл', totalMl: 50 },
  { id: 'to100', label: 'до 100 мл', totalMl: 100 },
];

export const CARDIOTONIC_EQUIVALENTS = [
  { drug: 'Адреналин', dose: '0,1 мкг/кг/мин', equivalent: '0,1 мкг/кг/мин' },
  { drug: 'Допамин', dose: '15 мкг/кг/мин', equivalent: '0,1 мкг/кг/мин' },
  { drug: 'Норадреналин', dose: '0,1 мкг/кг/мин', equivalent: '0,1 мкг/кг/мин' },
  { drug: 'Фенилэфрин (мезатон)', dose: '1 мкг/кг/мин', equivalent: '0,1 мкг/кг/мин' },
  { drug: 'Вазопрессин*', dose: '0,04 Ед/мин', equivalent: '0,1 мкг/кг/мин' },
];

export function roundHalfUp(value, decimals) {
  if (!Number.isFinite(value)) return NaN;
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

export function percentToMgMl(percent) {
  return roundHalfUp(percent * 10, 4);
}

export function mgMlToPercent(mgMl) {
  return roundHalfUp(mgMl / 10, 4);
}

export function solventForTotal(drugVolumeMl, totalMl) {
  if (totalMl <= 0) return 0;
  return Math.max(0, roundHalfUp(totalMl - drugVolumeMl, 2));
}

export function finalConcentration(stockMgMl, drugVolumeMl, solventMl) {
  const drugVol = Number(drugVolumeMl) || 0;
  const solvent = Number(solventMl) || 0;
  const stock = Number(stockMgMl) || 0;
  const totalVolume = drugVol + solvent;
  if (totalVolume <= 0 || stock <= 0 || drugVol <= 0) {
    return { mgMl: 0, percent: 0, totalVolumeMl: totalVolume };
  }
  const totalMg = stock * drugVol;
  const mgMl = totalMg / totalVolume;
  return {
    mgMl: roundHalfUp(mgMl, 4),
    percent: roundHalfUp(mgMl / 10, 4),
    totalVolumeMl: roundHalfUp(totalVolume, 2),
  };
}

export function mcgKgMinToMgKgH(mcgKgMin) {
  return roundHalfUp(mcgKgMin * 0.06, 4);
}

export function mgKgHToMcgKgMin(mgKgH) {
  return roundHalfUp(mgKgH / 0.06, 4);
}

export function infusionRateMlPerHour(doseMcgKgMin, weightKg, finalMgMl) {
  if (!(doseMcgKgMin > 0) || !(weightKg > 0) || !(finalMgMl > 0)) return 0;
  return roundHalfUp((doseMcgKgMin * weightKg * 60) / (finalMgMl * 1000), 4);
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const s = String(value).trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return { error: true };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return { error: true };
  return { value: n };
}

function parsePositive(value) {
  const parsed = parseNumber(value);
  if (!parsed || parsed.error || parsed.value <= 0) return parsed?.error ? { error: true } : null;
  return { value: parsed.value };
}

export function infusomatCalculate(input) {
  const stockParsed = parseNumber(input.stockMgMl);
  const drugVolParsed = parseNumber(input.drugVolumeMl);
  const solventParsed = parseNumber(input.solventMl);
  const doseParsed = parseNumber(input.doseMcgKgMin);
  const weightParsed = parsePositive(input.weightKg);

  if (!stockParsed || stockParsed.error) return { status: 'INVALID' };
  if (!drugVolParsed || drugVolParsed.error) return { status: 'INVALID' };
  if (!solventParsed || solventParsed.error) return { status: 'INVALID' };
  if (!doseParsed || doseParsed.error) return { status: 'INVALID' };
  if (!weightParsed) return { status: 'INVALID', missing: 'weightKg' };

  const final = finalConcentration(stockParsed.value, drugVolParsed.value, solventParsed.value);
  const mlPerHour = infusionRateMlPerHour(doseParsed.value, weightParsed.value, final.mgMl);
  const mlPerMin = final.mgMl > 0 && mlPerHour > 0 ? roundHalfUp(mlPerHour / 60, 4) : 0;

  return {
    status: 'OK',
    finalMgMl: final.mgMl,
    finalPercent: final.percent,
    totalVolumeMl: final.totalVolumeMl,
    mlPerHour,
    mlPerMin,
    doseMgKgH: mcgKgMinToMgKgH(doseParsed.value),
  };
}

export function calculate(input) {
  const out = infusomatCalculate(input);
  if (out.status !== 'OK') throw new Error('Проверьте введённые данные');
  return out;
}
