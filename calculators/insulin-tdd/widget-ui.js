  var root = document.querySelector('.fc-calc[data-calculator="insulin-tdd"]');
  if (!root) return;

  var tabs = root.querySelectorAll('.fc-calc__tab[data-mode]');
  var panels = root.querySelectorAll('.fc-calc__tab-panel[data-mode]');
  var formError = root.querySelector('#fc-calc-insulin-tdd-form-error');
  var summaryBox = root.querySelector('#fc-calc-insulin-tdd-summary');
  var resultTdd = root.querySelector('#fc-calc-insulin-tdd-result-tdd');
  var resultCorr = root.querySelector('#fc-calc-insulin-tdd-result-corr');
  var resultCarbs = root.querySelector('#fc-calc-insulin-tdd-result-carbs');
  var corrNeedHint = root.querySelector('#fc-calc-insulin-tdd-corr-need-tdd');
  var carbsNeedHint = root.querySelector('#fc-calc-insulin-tdd-carbs-need-tdd');

  var weightInput = root.querySelector('#fc-calc-insulin-tdd-weight');
  var unitsInput = root.querySelector('#fc-calc-insulin-tdd-units');
  var profileHint = root.querySelector('#fc-calc-insulin-tdd-profile-hint');
  var basalRange = root.querySelector('#fc-calc-insulin-tdd-basal');
  var basalLabel = root.querySelector('#fc-calc-insulin-tdd-basal-label');
  var bolusLabel = root.querySelector('#fc-calc-insulin-tdd-bolus-label');
  var glucoseCurrent = root.querySelector('#fc-calc-insulin-tdd-g-cur');
  var glucoseTarget = root.querySelector('#fc-calc-insulin-tdd-g-tgt');
  var carbsInput = root.querySelector('#fc-calc-insulin-tdd-carbs');

  function switchMode(mode) {
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-mode') === mode;
      tab.classList.toggle('fc-calc__tab--active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(function (panel) {
      var active = panel.getAttribute('data-mode') === mode;
      panel.classList.toggle('fc-calc__tab-panel--active', active);
      panel.hidden = !active;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchMode(tab.getAttribute('data-mode'));
    });
  });

  function selectedValue(name) {
    var el = root.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function buildInput() {
    return {
      weightKg: weightInput.value,
      profile: selectedValue('fc-calc-insulin-tdd-profile') || 'standard',
      unitsPerKg: unitsInput.value,
      basalPct: Number(basalRange.value),
      insulinKind: selectedValue('fc-calc-insulin-tdd-kind') || 'rapid',
      icrRule: selectedValue('fc-calc-insulin-tdd-icr') || '500',
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
    var profile = selectedValue('fc-calc-insulin-tdd-profile') || 'standard';
    var opt = PROFILE_OPTIONS.find(function (p) {
      return p.value === profile;
    });
    profileHint.textContent = opt ? opt.hint : '';
  }

  function onProfileChange() {
    var profile = selectedValue('fc-calc-insulin-tdd-profile') || 'standard';
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

  function setResultBox(el, html, show) {
    if (!el) return;
    if (!show) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.innerHTML = '<ul class="fc-calc__ins-lines">' + html + '</ul>';
    el.hidden = false;
  }

  function clearTabResults() {
    setResultBox(resultTdd, '', false);
    setResultBox(resultCorr, '', false);
    setResultBox(resultCarbs, '', false);
    if (corrNeedHint) corrNeedHint.hidden = false;
    if (carbsNeedHint) carbsNeedHint.hidden = false;
    summaryBox.innerHTML =
      '<p class="fc-calc__ins-hint">Заполните массу тела на вкладке «Суточная доза».</p>';
  }

  function renderAll(out) {
    if (corrNeedHint) corrNeedHint.hidden = true;
    if (carbsNeedHint) carbsNeedHint.hidden = true;

    setResultBox(
      resultTdd,
      lineHtml('Суточная доза инсулина', formatRu(out.tdd) + ' Ед/сут') +
        lineHtml('Базальный', formatRu(out.basal) + ' Ед') +
        lineHtml('Болюсный (сумма)', formatRu(out.bolusTotal) + ' Ед') +
        lineHtml('На приём (завтрак / обед / ужин)', formatRu(out.mealBolus) + ' Ед'),
      true
    );

    var corrHtml =
      lineHtml(
        'ISF',
        formatRu(out.isf.isfMmolL, 2) +
          ' ммоль/л на 1 Ед (' +
          formatRu(out.isf.isfMgDl) +
          ' мг/дл)'
      );
    if (out.correction) {
      corrHtml += lineHtml(
        'Коррекционная доза',
        formatRu(out.correction.correctionUnits) + ' Ед'
      );
    } else {
      corrHtml +=
        '<li class="fc-calc__ins-hint" style="list-style:none">Укажите текущую глюкозу для расчёта коррекции.</li>';
    }
    setResultBox(resultCorr, corrHtml, true);

    var carbsHtml = lineHtml(
      'ICR',
      formatRu(out.icr.icr) + ' г углеводов на 1 Ед'
    );
    if (out.prandial) {
      carbsHtml += lineHtml(
        'Прандиальный болюс',
        formatRu(out.prandial.prandialUnits) + ' Ед'
      );
    } else {
      carbsHtml +=
        '<li class="fc-calc__ins-hint" style="list-style:none">Укажите углеводы в порции.</li>';
    }
    setResultBox(resultCarbs, carbsHtml, true);

    summaryBox.innerHTML =
      '<p class="fc-calc__ins-formula">Болюс = углеводы / ICR + (Gтек − Gцель) / ISF</p>' +
      '<div class="fc-calc__ins-result">' +
      '<ul class="fc-calc__ins-lines">' +
      lineHtml('Суточная доза инсулина', formatRu(out.tdd) + ' Ед') +
      lineHtml('Базальный', formatRu(out.basal) + ' Ед') +
      lineHtml(
        'Прандиальный',
        out.prandial ? formatRu(out.prandial.prandialUnits) + ' Ед' : '—'
      ) +
      lineHtml(
        'Коррекция',
        out.correction ? formatRu(out.correction.correctionUnits) + ' Ед' : '—'
      ) +
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
      clearTabResults();
      return;
    }
    try {
      renderAll(calculate(input));
    } catch (err) {
      clearTabResults();
      formError.textContent = err.message || 'Проверьте ввод';
    }
  }

  root.querySelectorAll('input[name="fc-calc-insulin-tdd-profile"]').forEach(function (el) {
    el.addEventListener('change', onProfileChange);
  });

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
  root.querySelectorAll('input[name="fc-calc-insulin-tdd-icr"]').forEach(function (el) {
    el.addEventListener('change', refresh);
  });

  updateBasalLabels();
  updateProfileHint();
  clearTabResults();
