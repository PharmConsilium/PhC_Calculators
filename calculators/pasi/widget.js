(function () {
  var root = document.querySelector('.fc-calc[data-calculator="pasi"]');
  if (!root) return;

  var tabs = root.querySelectorAll('.fc-calc__tab[data-mode]');
  var panels = root.querySelectorAll('.fc-calc__tab-panel[data-mode]');

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

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
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var list = Array.prototype.slice.call(tabs);
      var index = list.indexOf(tab);
      if (index < 0) return;
      var next = e.key === 'ArrowRight' ? index + 1 : index - 1;
      if (next < 0) next = list.length - 1;
      if (next >= list.length) next = 0;
      list[next].focus();
      switchMode(list[next].getAttribute('data-mode'));
    });
  });

  function hideResult(wrap) {
    if (wrap) wrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function showResult(wrap, numberEl, descEl, score, interpretation, extra) {
    if (!wrap || !numberEl) return;
    numberEl.textContent = formatNum(score);
    if (descEl) {
      descEl.textContent = interpretation + (extra ? '. ' + extra : '');
    }
    wrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  function parseIntField(value, min, max) {
    if (value === null || value === undefined || value === '') return null;
    var n = Number(value);
    if (!isFinite(n) || n < min || n > max || Math.floor(n) !== n) return null;
    return n;
  }

  function roundScore(value) {
    return Math.round(value * 10) / 10;
  }

  // ── PASI ──
  var PASI_REGIONS = [
    { id: 'head', bsa: 0.1, label: 'Голова и шея' },
    { id: 'upper', bsa: 0.2, label: 'Верхние конечности' },
    { id: 'trunk', bsa: 0.3, label: 'Туловище' },
    { id: 'lower', bsa: 0.4, label: 'Нижние конечности' }
  ];

  function calcPasi(form) {
    var total = 0;
    var parts = [];
    for (var i = 0; i < PASI_REGIONS.length; i++) {
      var r = PASI_REGIONS[i];
      var e = parseIntField(form.querySelector('[name="' + r.id + '_erythema"]:checked')?.value, 0, 4);
      var ind = parseIntField(form.querySelector('[name="' + r.id + '_induration"]:checked')?.value, 0, 4);
      var d = parseIntField(form.querySelector('[name="' + r.id + '_desquamation"]:checked')?.value, 0, 4);
      var a = parseIntField(form.querySelector('[name="' + r.id + '_area"]:checked')?.value, 0, 6);
      if (e === null || ind === null || d === null || a === null) return null;
      var score = (e + ind + d) * a * r.bsa;
      total += score;
      parts.push(r.label + ': ' + formatNum(roundScore(score)));
    }
    var pasi = roundScore(total);
    var interp = pasi <= 0 ? 'Нет признаков заболевания (PASI 0)' :
      pasi < 10 ? 'Лёгкая степень тяжести' :
      pasi <= 20 ? 'Средняя степень тяжести' : 'Тяжёлая степень';
    return { score: pasi, interpretation: interp, extra: parts.join('; ') };
  }

  // ── EASI ──
  var EASI_SCALE = [
    { category: 'mild', min: 0.1, max: 1.0, rangeLabel: '0,1–1,0', label: 'легкая' },
    { category: 'moderate', min: 1.1, max: 7.0, rangeLabel: '1,1–7,0', label: 'умеренная' },
    { category: 'medium', min: 7.1, max: 21.0, rangeLabel: '7,1–21,0', label: 'средняя' },
    { category: 'severe', min: 21.1, max: 50.0, rangeLabel: '21,1–50,0', label: 'тяжелая' },
    { category: 'very-severe', min: 50.1, max: 72.0, rangeLabel: '50,1–72,0', label: 'очень тяжелая' }
  ];
  var EASI_SIGNS = ['erythema', 'infiltration', 'excoriation', 'lichenification'];

  function interpretEasi(total) {
    if (total <= 0) {
      return { category: 'none', label: 'нет признаков', rangeLabel: '0', text: 'Нет признаков заболевания (EASI 0)' };
    }
    for (var i = 0; i < EASI_SCALE.length; i++) {
      var band = EASI_SCALE[i];
      if (total >= band.min && total <= band.max) {
        return {
          category: band.category,
          label: band.label,
          rangeLabel: band.rangeLabel,
          text: 'Степень: ' + band.label + ' (баллы ' + band.rangeLabel + ')'
        };
      }
    }
    var last = EASI_SCALE[EASI_SCALE.length - 1];
    return {
      category: last.category,
      label: last.label,
      rangeLabel: last.rangeLabel,
      text: 'Степень: ' + last.label + ' (баллы ' + last.rangeLabel + ')'
    };
  }

  function calcEasi(form) {
    var total = 0;
    var parts = [];
    for (var i = 0; i < PASI_REGIONS.length; i++) {
      var r = PASI_REGIONS[i];
      var a = parseIntField(form.querySelector('[name="' + r.id + '_area"]:checked')?.value, 0, 6);
      var sev = 0;
      for (var j = 0; j < EASI_SIGNS.length; j++) {
        var v = parseIntField(
          form.querySelector('[name="' + r.id + '_' + EASI_SIGNS[j] + '"]:checked')?.value,
          0,
          3
        );
        if (v === null) return null;
        sev += v;
      }
      if (a === null) return null;
      var score = sev * a * r.bsa;
      total += score;
      parts.push(r.label + ': ' + formatNum(roundScore(score)));
    }
    var easi = roundScore(total);
    var band = interpretEasi(easi);
    return {
      score: easi,
      interpretation: band.text,
      category: band.category,
      extra: parts.join('; ')
    };
  }

  // ── PEST ──
  function calcPest(form) {
    var total = 0;
    for (var i = 1; i <= 5; i++) {
      var yes = form.querySelector('[name="q' + i + '"][value="yes"]');
      if (yes && yes.checked) total += 1;
    }
    var jointLabels = [];
    form.querySelectorAll('.fc-calc__pest-joint input:checked').forEach(function (cb) {
      var row = cb.closest('.fc-calc__pest-joint');
      if (row) {
        var label = row.getAttribute('data-joint-label');
        if (label) jointLabels.push(label);
      }
    });
    var interpretation = total >= 3 ? 'Положительный скрининг' : 'Отрицательный скрининг';
    var recommendation =
      total >= 3
        ? 'PEST ≥ 3 указывает на возможный недиагностированный псориатический артрит. Рекомендуется направление к ревматологу.'
        : 'PEST ≤ 2 — по шкале направление к ревматологу не требуется. При появлении симптомов повторите оценку.';
    var jointsText = jointLabels.length
      ? 'Болезненные суставы: ' + jointLabels.sort(function (a, b) { return a.localeCompare(b, 'ru'); }).join('; ')
      : 'Болезненные суставы: не отмечены';
    return {
      score: total,
      interpretation: interpretation,
      recommendation: recommendation,
      jointsText: jointsText,
    };
  }

  // ── SCORAD ──
  var SCORAD_AREAS = [
    { id: 'head', w: 0.09 }, { id: 'genital', w: 0.01 },
    { id: 'armL', w: 0.09 }, { id: 'armR', w: 0.09 },
    { id: 'legL', w: 0.18 }, { id: 'legR', w: 0.18 },
    { id: 'trunkFront', w: 0.18 }, { id: 'back', w: 0.18 }
  ];
  var SCORAD_AREA_STEPS = [0, 25, 50, 75, 100];
  var SCORAD_INTS = ['erythema', 'edema', 'oozing', 'excoriation', 'lichenification', 'dryness'];

  function calcScorad(form) {
    var area = 0;
    for (var i = 0; i < SCORAD_AREAS.length; i++) {
      var pct = parseIntField(
        form.querySelector('[name="area_' + SCORAD_AREAS[i].id + '"]:checked')?.value,
        0,
        100
      );
      if (pct === null || SCORAD_AREA_STEPS.indexOf(pct) === -1) return null;
      area += pct * SCORAD_AREAS[i].w;
    }
    var intensity = 0;
    for (var j = 0; j < SCORAD_INTS.length; j++) {
      var v = parseIntField(
        form.querySelector('[name="int_' + SCORAD_INTS[j] + '"]:checked')?.value,
        0,
        3
      );
      if (v === null) return null;
      intensity += v;
    }
    var pruritus = Number(form.querySelector('[name="pruritus"]')?.value);
    var sleep = Number(form.querySelector('[name="sleep"]')?.value);
    if (!isFinite(pruritus) || pruritus < 0 || pruritus > 10) return null;
    if (!isFinite(sleep) || sleep < 0 || sleep > 10) return null;
    var scorad = roundScore(area / 5 + (7 * intensity) / 2 + pruritus + sleep);
    var interp = scorad < 20 ? 'Лёгкое течение атопического дерматита' :
      scorad <= 40 ? 'Средней тяжести течение атопического дерматита' :
      'Тяжёлое течение атопического дерматита';
    return {
      score: scorad,
      interpretation: interp
    };
  }

  function bindForm(config) {
    var form = root.querySelector(config.formId);
    var resultWrap = root.querySelector(config.resultId);
    var resultNumber = root.querySelector(config.numberId);
    var resultDesc = root.querySelector(config.descId);
    if (!form) return;

    function hideFormResult() {
      hideResult(resultWrap);
      if (config.onHide) config.onHide();
    }

    form.addEventListener('change', hideFormResult);

    form.addEventListener('input', hideFormResult);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = config.calc(form);
      if (!out) return;
      showResult(resultWrap, resultNumber, resultDesc, out.score, out.interpretation, out.extra);
      if (config.onShow) config.onShow(out, resultWrap);
    });
  }

  bindForm({
    formId: '#fc-calc-pasi-form-pasi',
    resultId: '#fc-calc-pasi-result-pasi',
    numberId: '#fc-calc-pasi-result-number-pasi',
    descId: '#fc-calc-pasi-result-desc-pasi',
    calc: calcPasi
  });

  (function bindPestForm() {
    var form = root.querySelector('#fc-calc-pasi-form-pest');
    var resultWrap = root.querySelector('#fc-calc-pasi-result-pest');
    var resultNumber = root.querySelector('#fc-calc-pasi-result-number-pest');
    var resultDesc = root.querySelector('#fc-calc-pasi-result-desc-pest');
    var resultJoints = root.querySelector('#fc-calc-pasi-result-joints-pest');
    if (!form) return;

    function hidePestResult() {
      hideResult(resultWrap);
      if (resultJoints) resultJoints.textContent = '';
    }

    form.addEventListener('change', hidePestResult);
    form.addEventListener('input', hidePestResult);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = calcPest(form);
      resultNumber.textContent = formatNum(out.score);
      resultDesc.textContent = out.interpretation + '. ' + out.recommendation + '.';
      if (resultJoints) resultJoints.textContent = out.jointsText;
      resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    });
  })();

  bindForm({
    formId: '#fc-calc-pasi-form-easi',
    resultId: '#fc-calc-pasi-result-easi',
    numberId: '#fc-calc-pasi-result-number-easi',
    descId: '#fc-calc-pasi-result-desc-easi',
    calc: calcEasi,
    onShow: function (out, resultWrap) {
      var scale = root.querySelector('#fc-calc-pasi-result-scale-easi');
      if (!scale) return;
      scale.querySelectorAll('.fc-calc__easi-scale-cell').forEach(function (cell) {
        cell.classList.remove('fc-calc__easi-scale-cell--active');
      });
      if (out.category && out.category !== 'none') {
        scale.hidden = false;
        scale.querySelectorAll('[data-easi-category="' + out.category + '"]').forEach(function (cell) {
          cell.classList.add('fc-calc__easi-scale-cell--active');
        });
      } else {
        scale.hidden = true;
      }
    },
    onHide: function () {
      var scale = root.querySelector('#fc-calc-pasi-result-scale-easi');
      if (scale) scale.hidden = true;
    }
  });

  bindForm({
    formId: '#fc-calc-pasi-form-scorad',
    resultId: '#fc-calc-pasi-result-scorad',
    numberId: '#fc-calc-pasi-result-number-scorad',
    descId: '#fc-calc-pasi-result-desc-scorad',
    calc: calcScorad
  });
})();
