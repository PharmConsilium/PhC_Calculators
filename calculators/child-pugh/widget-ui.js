  var root = document.querySelector('.fc-calc[data-calculator="child-pugh"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-child-pugh-form');
  var calcBtn = root.querySelector('#fc-calc-child-pugh-btn');
  var formError = root.querySelector('#fc-calc-child-pugh-form-error');
  var resultWrap = root.querySelector('#fc-calc-child-pugh-result');
  var resultLabel = root.querySelector('#fc-calc-child-pugh-result-label');
  var resultNumber = root.querySelector('#fc-calc-child-pugh-result-number');
  var resultDesc = root.querySelector('#fc-calc-child-pugh-result-desc');
  var resultExtra = root.querySelector('#fc-calc-child-pugh-result-extra');
  var modeHint = root.querySelector('#fc-calc-child-pugh-mode-hint');
  var tabs = root.querySelectorAll('[data-mode-tab]');
  var panels = root.querySelectorAll('[data-mode-panel]');

  var MODE_HINTS = {
    childPugh:
      'Классификация тяжести цирроза по пяти клинико-лабораторным критериям (Child-Pugh).',
    meld: 'MELD до 2016 года: билирубин, МНО и креатинин (без натрия).',
    meldNa: 'MELD-Na: исходный MELD с коррекцией по натрию (стандарт UNOS/OPTN до MELD 3.0).',
    meld30:
      'MELD 3.0 (рекомендуется OPTN): возраст (<18 / ≥18), лаборатории; пол — только с 18 лет.',
  };

  var RESULT_LABELS = {
    childPugh: 'Результат Child-Pugh',
    meld: 'MELD (до 2016)',
    meldNa: 'MELD-Na',
    meld30: 'MELD 3.0',
  };

  var currentMode = 'childPugh';

  function getAgeGroup(group) {
    var seg = root.querySelector('[data-age-group="' + group + '"]');
    if (!seg) return 'ge18';
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-age') : 'ge18';
  }

  function getSex(group) {
    var seg = root.querySelector('[data-sex-group="' + group + '"]');
    if (!seg) return 'female';
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-sex') : 'female';
  }

  function getUnit(group) {
    var seg = root.querySelector('[data-unit-group="' + group + '"]');
    if (!seg) return null;
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-unit') : null;
  }

  function getDialysis(group) {
    var seg = root.querySelector('[data-dialysis-group="' + group + '"]');
    if (!seg) return false;
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-dialysis') === 'yes' : false;
  }

  function num(id) {
    var el = root.querySelector(id);
    if (!el) return null;
    var s = String(el.value || '').trim().replace(',', '.');
    if (!s) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : { error: true };
  }

  function buildChildPughInput() {
    var input = { mode: 'childPugh' };
    CRITERIA.forEach(function (criterion) {
      var checked = form.querySelector(
        'input[name="fc-calc-child-pugh-' + criterion.id + '"]:checked'
      );
      input[criterion.id] = checked ? checked.value : '';
    });
    return input;
  }

  function buildMeldInput(mode, prefix) {
    var bili = num('#fc-calc-child-pugh-' + prefix + '-bili');
    var creat = num('#fc-calc-child-pugh-' + prefix + '-creat');
    var inr = num('#fc-calc-child-pugh-' + prefix + '-inr');
    if (bili == null || bili.error || creat == null || creat.error || inr == null || inr.error) {
      return { mode: mode };
    }
    var input = {
      mode: mode,
      bilirubin: bili,
      bilirubinUnit: getUnit(prefix + '-bili') || 'umol',
      creatinine: creat,
      creatinineUnit: getUnit(prefix + '-creat') || 'umol',
      inr: inr,
      dialysis: getDialysis(prefix),
    };
    if (mode === 'meldNa' || mode === 'meld30') {
      var na = num('#fc-calc-child-pugh-' + prefix + '-na');
      if (na == null || na.error) return { mode: mode };
      input.sodium = na;
    }
    if (mode === 'meld30') {
      input.ageGroup = getAgeGroup(prefix);
      var alb = num('#fc-calc-child-pugh-' + prefix + '-alb');
      if (alb == null || alb.error) return { mode: mode };
      input.albumin = alb;
      input.albuminUnit = getUnit(prefix + '-alb') || 'gl';
      if (isMeld30Adult(input)) {
        input.sex = getSex(prefix);
      }
    }
    return input;
  }

  function updateMeld30SexVisibility() {
    var sexField = root.querySelector('#fc-calc-child-pugh-meld30-sex-field');
    if (!sexField) return;
    var show = isMeld30Adult({ ageGroup: getAgeGroup('meld30') });
    if (show) sexField.removeAttribute('hidden');
    else sexField.setAttribute('hidden', '');
  }

  function buildInput() {
    if (currentMode === 'childPugh') return buildChildPughInput();
    if (currentMode === 'meld') return buildMeldInput('meld', 'meld');
    if (currentMode === 'meldNa') return buildMeldInput('meldNa', 'meldna');
    if (currentMode === 'meld30') return buildMeldInput('meld30', 'meld30');
    return { mode: currentMode };
  }

  function canCalculate() {
    try {
      return isReady(buildInput());
    } catch (e) {
      return false;
    }
  }

  function updateBtn() {
    updateMeld30SexVisibility();
    var ok = canCalculate();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function setMode(mode) {
    currentMode = mode;
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-mode-tab') === mode;
      tab.classList.toggle('fc-calc__tab--active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(function (panel) {
      var active = panel.getAttribute('data-mode-panel') === mode;
      panel.classList.toggle('fc-calc__tab-panel--active', active);
      panel.hidden = !active;
    });
    if (modeHint && MODE_HINTS[mode]) modeHint.textContent = MODE_HINTS[mode];
    formError.textContent = '';
    clearResult();
    updateBtn();
  }

  function renderChildPugh(out) {
    resultLabel.textContent = RESULT_LABELS.childPugh;
    resultNumber.textContent = 'Класс ' + out.childClass;
    resultNumber.className =
      'fc-calc__result-number fc-calc__result-number--' + out.childClass;
    resultDesc.textContent = pluralBalls(out.total);
    var lines = [];
    if (out.lifeExpectancy) {
      lines.push(
        '<p class="fc-calc__cp-result-line"><strong>Продолжительность жизни:</strong> ' +
          out.lifeExpectancy +
          '</p>'
      );
    } else if (out.childClass === 'B') {
      lines.push(
        '<p class="fc-calc__cp-result-line">Значительное функциональное ухудшение.</p>'
      );
    }
    if (out.periopMortality) {
      lines.push(
        '<p class="fc-calc__cp-result-line"><strong>Периоперационная летальность при абдоминальных операциях:</strong> ' +
          out.periopMortality +
          '</p>'
      );
    }
    resultExtra.innerHTML = lines.length
      ? '<div class="fc-calc__cp-result-meta">' + lines.join('') + '</div>'
      : '';
  }

  function mortalityBadgeHtml(mort) {
    if (!mort) return '';
    return (
      '<div class="fc-calc__cp-mortality">' +
      '<p class="fc-calc__cp-mortality-value">' +
      '<span class="fc-calc__cp-mortality-num">' +
      mort.display +
      '</span><span class="fc-calc__cp-mortality-pct">%</span>' +
      '</p>' +
      '<p class="fc-calc__cp-mortality-label">Предполагаемая смертность за 3 месяца</p>' +
      '</div>'
    );
  }

  function survivalBadgeHtml(surv) {
    if (!surv) return '';
    return (
      '<div class="fc-calc__cp-mortality">' +
      '<p class="fc-calc__cp-mortality-value">' +
      '<span class="fc-calc__cp-mortality-num">' +
      surv.survivalDisplay +
      '</span><span class="fc-calc__cp-mortality-pct">%</span>' +
      '</p>' +
      '<p class="fc-calc__cp-mortality-label">Предполагаемая выживаемость за 90 дней</p>' +
      '</div>'
    );
  }

  function renderMeld(out) {
    resultLabel.textContent = RESULT_LABELS[out.mode] || 'MELD';
    resultNumber.textContent = String(out.score);
    resultNumber.className = 'fc-calc__result-number';
    resultDesc.textContent = pluralBalls(out.score);
    var lines = [];
    if (out.mode === 'meldNa' && out.meldBase != null) {
      lines.push(
        '<p class="fc-calc__cp-result-line"><strong>Исходный MELD:</strong> ' +
          out.meldBase +
          (out.sodiumApplied
            ? ' (применена коррекция по Na)'
            : ' (коррекция по Na не применяется при MELD ≤ 11)') +
          '</p>'
      );
    }
    if (out.mode === 'meld30') {
      lines.push(
        '<p class="fc-calc__cp-result-line"><strong>Ветка:</strong> ' +
          (out.adult
            ? 'взрослая (≥18 лет' +
              (out.female ? ', женский пол +1,33' : ', мужской пол') +
              ')'
            : 'до 18 лет (пол не учитывается)') +
          '</p>'
      );
    }
    if (out.dialysis) {
      lines.push(
        '<p class="fc-calc__cp-result-line">Учтён диализ: креатинин принят равным максимуму для формулы.</p>'
      );
    }
    lines.push(
      '<p class="fc-calc__cp-result-line">Балл ограничен диапазоном 6–40 (OPTN).</p>'
    );
    var badge =
      out.mode === 'meld30'
        ? survivalBadgeHtml(out.ninetyDaySurvival)
        : mortalityBadgeHtml(out.threeMonthMortality);
    resultExtra.innerHTML =
      badge + '<div class="fc-calc__cp-result-meta">' + lines.join('') + '</div>';
  }

  function renderResult(out) {
    if (out.mode === 'childPugh') renderChildPugh(out);
    else renderMeld(out);
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.getAttribute('data-mode-tab'));
    });
  });

  root.querySelectorAll('.fc-calc__segmented').forEach(function (seg) {
    seg.querySelectorAll('.fc-calc__segment').forEach(function (btn) {
      btn.addEventListener('click', function () {
        seg.querySelectorAll('.fc-calc__segment').forEach(function (b) {
          b.classList.remove('fc-calc__segment--active');
        });
        btn.classList.add('fc-calc__segment--active');
        clearResult();
        updateBtn();
      });
    });
  });

  form.querySelectorAll('input').forEach(function (el) {
    el.addEventListener('input', function () {
      clearResult();
      updateBtn();
    });
    el.addEventListener('change', function () {
      clearResult();
      updateBtn();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.textContent = '';
    try {
      var out = calculate(buildInput());
      renderResult(out);
    } catch (err) {
      clearResult();
      formError.textContent = err.message || 'Проверьте введённые данные';
    }
  });

  setMode('childPugh');
