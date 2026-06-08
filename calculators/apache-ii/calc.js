/**
 * Шкала APACHE II (Knaus et al., Crit Care Med 1985; MSD).
 */

export const PHYSIOLOGY = [
  {
    id: 'temperature',
    label: 'Температура (°C)',
    options: [
      { id: 't0', label: '36–38,4', points: 0 },
      { id: 't1', label: '38,5–38,9', points: 1 },
      { id: 't2', label: '34–35,9', points: 1 },
      { id: 't3', label: '39–40,9', points: 3 },
      { id: 't4', label: '32–33,9', points: 2 },
      { id: 't5', label: '30–31,9', points: 3 },
      { id: 't6', label: '≥ 41', points: 4 },
      { id: 't7', label: '≤ 29,9', points: 4 },
    ],
  },
  {
    id: 'map',
    label: 'Среднее артериальное давление (мм рт. ст.)',
    options: [
      { id: 'm0', label: '70–109', points: 0 },
      { id: 'm1', label: '110–129', points: 2 },
      { id: 'm2', label: '55–69', points: 2 },
      { id: 'm3', label: '130–159', points: 3 },
      { id: 'm4', label: '40–54', points: 3 },
      { id: 'm5', label: '≥ 160', points: 4 },
      { id: 'm6', label: '≤ 39', points: 4 },
    ],
  },
  {
    id: 'heartRate',
    label: 'Частота сердечных сокращений',
    options: [
      { id: 'h0', label: '70–109', points: 0 },
      { id: 'h1', label: '110–139', points: 2 },
      { id: 'h2', label: '55–69', points: 2 },
      { id: 'h3', label: '140–179', points: 3 },
      { id: 'h4', label: '40–54', points: 3 },
      { id: 'h5', label: '≥ 180', points: 4 },
      { id: 'h6', label: '≤ 39', points: 4 },
    ],
  },
  {
    id: 'respiratoryRate',
    label: 'Частота дыхания',
    options: [
      { id: 'r0', label: '12–24', points: 0 },
      { id: 'r1', label: '25–34', points: 1 },
      { id: 'r2', label: '10–11', points: 1 },
      { id: 'r3', label: '35–49', points: 3 },
      { id: 'r4', label: '6–9', points: 2 },
      { id: 'r5', label: '≥ 50', points: 4 },
      { id: 'r6', label: '≤ 5', points: 4 },
    ],
  },
  {
    id: 'oxygenation',
    label: 'Оксигенация (A-aDO₂ при FiO₂ ≥ 50% или PaO₂ при FiO₂ < 50%)',
    options: [
      { id: 'o0', label: 'A-aDO₂ < 200', points: 0, group: 'FiO₂ ≥ 50%' },
      { id: 'o1', label: 'A-aDO₂ 200–349', points: 2, group: 'FiO₂ ≥ 50%' },
      { id: 'o2', label: 'A-aDO₂ 350–499', points: 3, group: 'FiO₂ ≥ 50%' },
      { id: 'o3', label: 'A-aDO₂ ≥ 500', points: 4, group: 'FiO₂ ≥ 50%' },
      { id: 'o4', label: 'PaO₂ > 70', points: 0, group: 'FiO₂ < 50%' },
      { id: 'o5', label: 'PaO₂ 61–70', points: 1, group: 'FiO₂ < 50%' },
      { id: 'o6', label: 'PaO₂ 55–60', points: 3, group: 'FiO₂ < 50%' },
      { id: 'o7', label: 'PaO₂ < 55', points: 4, group: 'FiO₂ < 50%' },
    ],
  },
  {
    id: 'ph',
    label: 'pH артериальной крови или HCO₃',
    options: [
      { id: 'p0', label: 'pH 7,33–7,49', points: 0, group: 'pH' },
      { id: 'p1', label: 'pH 7,5–7,59', points: 1, group: 'pH' },
      { id: 'p2', label: 'pH 7,25–7,32', points: 2, group: 'pH' },
      { id: 'p3', label: 'pH 7,6–7,69', points: 3, group: 'pH' },
      { id: 'p4', label: 'pH 7,15–7,24', points: 3, group: 'pH' },
      { id: 'p5', label: 'pH ≥ 7,7', points: 4, group: 'pH' },
      { id: 'p6', label: 'pH < 7,15', points: 4, group: 'pH' },
      { id: 'p7', label: 'HCO₃ 22–31,9', points: 0, group: 'HCO₃' },
      { id: 'p8', label: 'HCO₃ 32–40,9', points: 1, group: 'HCO₃' },
      { id: 'p9', label: 'HCO₃ 18–21,9', points: 2, group: 'HCO₃' },
      { id: 'p10', label: 'HCO₃ 41–51,9', points: 3, group: 'HCO₃' },
      { id: 'p11', label: 'HCO₃ 15–17,9', points: 3, group: 'HCO₃' },
      { id: 'p12', label: 'HCO₃ ≥ 52', points: 4, group: 'HCO₃' },
      { id: 'p13', label: 'HCO₃ < 15', points: 4, group: 'HCO₃' },
    ],
  },
  {
    id: 'sodium',
    label: 'Натрий сыворотки Na⁺ (mEq/L)',
    options: [
      { id: 'na0', label: '130–149', points: 0 },
      { id: 'na1', label: '150–154', points: 1 },
      { id: 'na2', label: '120–129', points: 2 },
      { id: 'na3', label: '155–159', points: 2 },
      { id: 'na4', label: '111–119', points: 3 },
      { id: 'na5', label: '160–179', points: 3 },
      { id: 'na6', label: '≤ 110', points: 4 },
      { id: 'na7', label: '≥ 180', points: 4 },
    ],
  },
  {
    id: 'potassium',
    label: 'Калий сыворотки K⁺ (mEq/L)',
    options: [
      { id: 'k0', label: '3,5–5,4', points: 0 },
      { id: 'k1', label: '3–3,4', points: 1 },
      { id: 'k2', label: '5,5–5,9', points: 1 },
      { id: 'k3', label: '2,5–2,9', points: 2 },
      { id: 'k4', label: '6–6,9', points: 3 },
      { id: 'k5', label: '≥ 7', points: 4 },
      { id: 'k6', label: '< 2,5', points: 4 },
    ],
  },
  {
    id: 'creatinine',
    label: 'Креатинин сыворотки (мг/дл)',
    options: [
      { id: 'cr0', label: '0,6–1,4', points: 0 },
      { id: 'cr1', label: '< 0,6', points: 2 },
      { id: 'cr2', label: '1,5–1,9', points: 2 },
      { id: 'cr3', label: '2–3,4', points: 3 },
      { id: 'cr4', label: '≥ 3,5', points: 4 },
    ],
  },
  {
    id: 'hematocrit',
    label: 'Гематокрит (%)',
    options: [
      { id: 'ht0', label: '30–45,9', points: 0 },
      { id: 'ht1', label: '46–49,9', points: 1 },
      { id: 'ht2', label: '20–29,9', points: 2 },
      { id: 'ht3', label: '50–59,9', points: 2 },
      { id: 'ht4', label: '< 20', points: 4 },
      { id: 'ht5', label: '≥ 60', points: 4 },
    ],
  },
  {
    id: 'wbc',
    label: 'Лейкоциты WBC (×10⁹/л)',
    options: [
      { id: 'w0', label: '3–14,9', points: 0 },
      { id: 'w1', label: '15–19,9', points: 1 },
      { id: 'w2', label: '1–2,9', points: 2 },
      { id: 'w3', label: '20–39,9', points: 2 },
      { id: 'w4', label: '< 1', points: 4 },
      { id: 'w5', label: '≥ 40', points: 4 },
    ],
  },
];

export const GCS_OPTIONS = Array.from({ length: 13 }, (_, i) => {
  const gcs = 15 - i;
  const points = 15 - gcs;
  return { id: String(gcs), label: String(gcs), points, gcs };
});

export const AGE_OPTIONS = [
  { id: 'a0', label: '≤ 44', points: 0 },
  { id: 'a1', label: '45–54', points: 2 },
  { id: 'a2', label: '55–64', points: 3 },
  { id: 'a3', label: '65–74', points: 5 },
  { id: 'a4', label: '≥ 75', points: 6 },
];

export const CHRONIC_OPTIONS = [
  { id: 'none', label: 'Отсутствуют', points: 0 },
  { id: 'medical', label: 'Консервативное лечение', points: 5 },
  { id: 'emergency', label: 'Экстренное оперативное вмешательство', points: 5 },
  { id: 'elective', label: 'Плановое оперативное вмешательство', points: 2 },
];

export const MORTALITY_RANGES = [
  { min: 0, max: 4, nonoperative: 4, postoperative: 1 },
  { min: 5, max: 9, nonoperative: 8, postoperative: 3 },
  { min: 10, max: 14, nonoperative: 15, postoperative: 7 },
  { min: 15, max: 19, nonoperative: 24, postoperative: 12 },
  { min: 20, max: 24, nonoperative: 40, postoperative: 30 },
  { min: 25, max: 29, nonoperative: 55, postoperative: 35 },
  { min: 30, max: 34, nonoperative: 73, postoperative: 73 },
  { min: 35, max: 100, nonoperative: 85, postoperative: 88 },
];

function findOption(options, id) {
  return options.find((o) => o.id === id) || null;
}

export function interpretMortality(total) {
  const range = MORTALITY_RANGES.find((r) => total >= r.min && total <= r.max);
  if (!range) return { nonoperative: null, postoperative: null };
  return {
    nonoperative: range.nonoperative,
    postoperative: range.postoperative,
    same: range.nonoperative === range.postoperative,
  };
}

export function apacheIIScore(input) {
  const scores = {};
  let total = 0;

  for (const criterion of PHYSIOLOGY) {
    const opt = findOption(criterion.options, input[criterion.id]);
    if (!opt) return { status: 'INVALID', missing: criterion.id };
    let pts = opt.points;
    if (criterion.id === 'creatinine' && input.arf) pts *= 2;
    scores[criterion.id] = pts;
    total += pts;
  }

  const gcsOpt = findOption(GCS_OPTIONS, input.gcs);
  const ageOpt = findOption(AGE_OPTIONS, input.age);
  const chronicOpt = findOption(CHRONIC_OPTIONS, input.chronic);

  if (!gcsOpt || !ageOpt || !chronicOpt) return { status: 'INVALID' };

  scores.gcs = gcsOpt.points;
  scores.age = ageOpt.points;
  scores.chronic = chronicOpt.points;
  total += gcsOpt.points + ageOpt.points + chronicOpt.points;

  const mortality = interpretMortality(total);

  return {
    status: 'OK',
    total,
    scores,
    gcs: gcsOpt.gcs,
    mortality,
  };
}

export function calculate(input) {
  const out = apacheIIScore(input);
  if (out.status !== 'OK') throw new Error('Выберите значение по каждому параметру');
  return out;
}
