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
