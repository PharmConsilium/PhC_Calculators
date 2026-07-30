(function () {
  /**
 * Калькулятор инсулина: суточная доза, базал/болюс, ISF, ICR, прандиальный болюс.
 * Источник: Calculators_MobileApp / insulin-tdd.
 */

const PROFILE_OPTIONS = [
  { value: 'sensitive', label: 'Чувствительный (СД1)', unitsPerKg: 0.35, hint: '0,3–0,4 Ед/кг' },
  { value: 'standard', label: 'Стандарт СД2', unitsPerKg: 0.5, hint: '0,5 Ед/кг' },
  { value: 'resistant', label: 'Резистентный / ожирение', unitsPerKg: 0.7, hint: '0,6–1,0 Ед/кг' },
  { value: 'puberty', label: 'Дети / пубертат', unitsPerKg: 1.2, hint: '1,0–1,5 Ед/кг' },
  { value: 'custom', label: 'Свой коэффициент', unitsPerKg: 0.5, hint: 'укажите Ед/кг' },
];

const INSULIN_KIND_OPTIONS = [
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

const ICR_RULE_OPTIONS = [
  { value: '500', label: '500 (взрослые)', divisor: 500 },
  { value: '450', label: '450 (высокая инсулинорезистентность)', divisor: 450 },
  { value: '400', label: '400 (помпа / инсулинорезистентность)', divisor: 400 },
  { value: '300', label: '300 (дети, низкая суточная доза инсулина)', divisor: 300 },
];

function defaultInputs() {
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

function resolveUnitsPerKg(input) {
  if (input.profile === 'custom') {
    return parsePositive(input.unitsPerKg);
  }
  const preset = PROFILE_OPTIONS.find((p) => p.value === input.profile);
  const fromField = parsePositive(input.unitsPerKg);
  if (fromField != null) return fromField;
  return preset?.unitsPerKg ?? null;
}

function profileDefaultUnits(profile) {
  const preset = PROFILE_OPTIONS.find((p) => p.value === profile);
  return String(preset?.unitsPerKg ?? 0.5).replace('.', ',');
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function formatRu(n, digits = 1) {
  return n.toFixed(digits).replace('.', ',');
}

function isTddReady(input) {
  return parsePositive(input.weightKg) != null && resolveUnitsPerKg(input) != null;
}

function calculateTdd(input) {
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

function calculateIsf(tdd, kind) {
  const opt = INSULIN_KIND_OPTIONS.find((o) => o.value === kind) ?? INSULIN_KIND_OPTIONS[0];
  return {
    kind,
    ruleMg: opt.ruleMg,
    ruleMmol: opt.ruleMmol,
    isfMgDl: round1(opt.ruleMg / tdd),
    isfMmolL: round2(opt.ruleMmol / tdd),
  };
}

function calculateCorrection(glucoseCurrent, glucoseTarget, isfMmolL) {
  const delta = glucoseCurrent - glucoseTarget;
  const units = isfMmolL > 0 ? delta / isfMmolL : 0;
  return {
    deltaMmol: round2(delta),
    correctionUnits: round1(units),
  };
}

function calculateIcr(tdd, rule) {
  const opt = ICR_RULE_OPTIONS.find((o) => o.value === rule) ?? ICR_RULE_OPTIONS[0];
  return {
    rule,
    divisor: opt.divisor,
    icr: round1(opt.divisor / tdd),
  };
}

function calculatePrandial(carbsG, icr) {
  return { prandialUnits: round1(icr > 0 ? carbsG / icr : 0) };
}

function calculate(input) {
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

    var root = document.querySelector('.fc-calc[data-calculator="insulin-tdd"]');
  if (!root) return;

  var formError = root.querySelector('#fc-calc-insulin-tdd-form-error');
  var summaryBox = root.querySelector('#fc-calc-insulin-tdd-summary');
  var corrNeedHint = root.querySelector('#fc-calc-insulin-tdd-corr-need-tdd');
  var carbsNeedHint = root.querySelector('#fc-calc-insulin-tdd-carbs-need-tdd');

  var weightInput = root.querySelector('#fc-calc-insulin-tdd-weight');
  var unitsInput = root.querySelector('#fc-calc-insulin-tdd-units');
  var profileSelect = root.querySelector('#fc-calc-insulin-tdd-profile');
  var profileHint = root.querySelector('#fc-calc-insulin-tdd-profile-hint');
  var icrSelect = root.querySelector('#fc-calc-insulin-tdd-icr');
  var basalRange = root.querySelector('#fc-calc-insulin-tdd-basal');
  var basalLabel = root.querySelector('#fc-calc-insulin-tdd-basal-label');
  var bolusLabel = root.querySelector('#fc-calc-insulin-tdd-bolus-label');
  var glucoseCurrent = root.querySelector('#fc-calc-insulin-tdd-g-cur');
  var glucoseTarget = root.querySelector('#fc-calc-insulin-tdd-g-tgt');
  var carbsInput = root.querySelector('#fc-calc-insulin-tdd-carbs');

  function selectedValue(name) {
    var el = root.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function currentProfile() {
    return (profileSelect && profileSelect.value) || 'standard';
  }

  function currentIcrRule() {
    return (icrSelect && icrSelect.value) || '500';
  }

  function buildInput() {
    return {
      weightKg: weightInput.value,
      profile: currentProfile(),
      unitsPerKg: unitsInput.value,
      basalPct: Number(basalRange.value),
      insulinKind: selectedValue('fc-calc-insulin-tdd-kind') || 'rapid',
      icrRule: currentIcrRule(),
      glucoseCurrent: glucoseCurrent.value,
      glucoseTarget: glucoseTarget.value,
      carbsG: carbsInput.value,
    };
  }

  function updateBasalLabels() {
    var v = Number(basalRange.value);
    basalLabel.textContent = 'Базальный ' + v + '%';
    bolusLabel.textContent = 'Болюсный ' + (100 - v) + '%';
  }

  function updateProfileHint() {
    var profile = currentProfile();
    var opt = PROFILE_OPTIONS.find(function (p) {
      return p.value === profile;
    });
    profileHint.textContent = opt ? opt.hint : '';
  }

  function onProfileChange() {
    var profile = currentProfile();
    unitsInput.value = profileDefaultUnits(profile);
    updateProfileHint();
    refresh();
  }

  function lineHtml(label, value) {
    return (
      '<li class="fc-calc__ins-line">' +
      '<span class="fc-calc__ins-line-label">' +
      label +
      '</span>' +
      '<span class="fc-calc__ins-line-value">' +
      value +
      '</span></li>'
    );
  }

  function clearSummary() {
    if (corrNeedHint) corrNeedHint.hidden = false;
    if (carbsNeedHint) carbsNeedHint.hidden = false;
    summaryBox.innerHTML =
      '<p class="fc-calc__ins-hint">Заполните массу тела в блоке «Суточная доза».</p>';
  }

  function renderAll(out) {
    if (corrNeedHint) corrNeedHint.hidden = true;
    if (carbsNeedHint) carbsNeedHint.hidden = true;

    var kindOpt = INSULIN_KIND_OPTIONS.find(function (o) {
      return o.value === out.isf.kind;
    });
    var isfLabel = kindOpt ? 'ISF ' + kindOpt.label : 'ISF';

    var icrOpt = ICR_RULE_OPTIONS.find(function (o) {
      return o.value === out.icr.rule;
    });
    var icrLabel = icrOpt ? 'ICR ' + icrOpt.label : 'ICR';

    var lines =
      lineHtml('Суточная доза инсулина', formatRu(out.tdd) + ' Ед/сут') +
      lineHtml('Базальный', formatRu(out.basal) + ' Ед') +
      lineHtml('Болюсный (сумма)', formatRu(out.bolusTotal) + ' Ед') +
      lineHtml(
        'На приём (завтрак / обед / ужин)',
        formatRu(out.mealBolus) + ' Ед'
      ) +
      lineHtml(
        isfLabel,
        formatRu(out.isf.isfMmolL, 2) +
          ' ммоль/л на 1 Ед (' +
          formatRu(out.isf.isfMgDl) +
          ' мг/дл)'
      ) +
      lineHtml(
        'Коррекционная доза',
        out.correction
          ? formatRu(out.correction.correctionUnits) + ' Ед'
          : '—'
      ) +
      lineHtml(icrLabel, formatRu(out.icr.icr) + ' г углеводов на 1 Ед') +
      lineHtml(
        'Прандиальный болюс',
        out.prandial ? formatRu(out.prandial.prandialUnits) + ' Ед' : '—'
      );

    summaryBox.innerHTML =
      '<p class="fc-calc__ins-formula">Болюс = углеводы / ICR + (Gтек − Gцель) / ISF</p>' +
      '<div class="fc-calc__ins-result">' +
      '<ul class="fc-calc__ins-lines">' +
      lines +
      '</ul>' +
      '<div class="fc-calc__ins-total">' +
      '<span class="fc-calc__ins-total-label">Итого к еде</span>' +
      '<span class="fc-calc__ins-total-value">' +
      formatRu(out.totalBolus) +
      ' Ед</span></div></div>';
  }

  function refresh() {
    formError.textContent = '';
    var input = buildInput();
    if (!isTddReady(input)) {
      clearSummary();
      return;
    }
    try {
      renderAll(calculate(input));
    } catch (err) {
      clearSummary();
      formError.textContent = err.message || 'Проверьте ввод';
    }
  }

  if (profileSelect) {
    profileSelect.addEventListener('change', onProfileChange);
  }

  [
    weightInput,
    unitsInput,
    basalRange,
    glucoseCurrent,
    glucoseTarget,
    carbsInput,
  ].forEach(function (el) {
    el.addEventListener('input', function () {
      if (el === basalRange) updateBasalLabels();
      refresh();
    });
    el.addEventListener('change', refresh);
  });

  root.querySelectorAll('input[name="fc-calc-insulin-tdd-kind"]').forEach(function (el) {
    el.addEventListener('change', refresh);
  });
  if (icrSelect) {
    icrSelect.addEventListener('change', refresh);
  }

  updateBasalLabels();
  updateProfileHint();
  clearSummary();

})();