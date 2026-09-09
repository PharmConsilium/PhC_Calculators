(function () {
  var root = document.querySelector('.fc-calc[data-calculator="lok-index"]');
  if (!root) return;

  var LIMITS = {
    age: { min: 18, max: 100 },
    plt: { min: 1, max: 1000 },
    ast: { min: 1, max: 2000 },
    alt: { min: 1, max: 2000 },
    ulnAst: { min: 1, max: 200 }
  };
  var INR_UNIT_LIMITS = {
    ratio: { min: 0.01, max: 10 },
    percent: { min: 1, max: 1000 },
    fraction: { min: 0.01, max: 10 }
  };
  var INR_PLACEHOLDERS = {
    ratio: 'напр. 1,1',
    percent: 'напр. 110',
    fraction: 'напр. 1,1'
  };

  var form = root.querySelector('#fc-calc-lok-index-form');
  var calcBtn = root.querySelector('#fc-calc-lok-index-btn');
  var formError = root.querySelector('#fc-calc-lok-index-form-error');
  var resultWrap = root.querySelector('#fc-calc-lok-index-result');
  var inrInput = root.querySelector('#fc-calc-lok-index-inr');
  var inrUnitSelect = root.querySelector('#fc-calc-lok-index-inr-unit');
  var inrError = root.querySelector('#fc-calc-lok-index-inr-error');

  function getInrUnit() {
    var unit = inrUnitSelect && inrUnitSelect.value;
    if (unit === 'percent' || unit === 'fraction') return unit;
    return 'ratio';
  }

  function getInrLimits() {
    return INR_UNIT_LIMITS[getInrUnit()] || INR_UNIT_LIMITS.ratio;
  }

  function inrFromUnit(value, unit) {
    if (unit === 'percent') return value / 100;
    return value;
  }

  var FIELDS = [
    {
      input: root.querySelector('#fc-calc-lok-index-age'),
      error: root.querySelector('#fc-calc-lok-index-age-error'),
      getLimits: function () {
        return LIMITS.age;
      },
      emptyMsg: 'Укажите возраст'
    },
    {
      input: root.querySelector('#fc-calc-lok-index-plt'),
      error: root.querySelector('#fc-calc-lok-index-plt-error'),
      getLimits: function () {
        return LIMITS.plt;
      },
      emptyMsg: 'Укажите тромбоциты'
    },
    {
      input: root.querySelector('#fc-calc-lok-index-ast'),
      error: root.querySelector('#fc-calc-lok-index-ast-error'),
      getLimits: function () {
        return LIMITS.ast;
      },
      emptyMsg: 'Укажите АСТ'
    },
    {
      input: root.querySelector('#fc-calc-lok-index-alt'),
      error: root.querySelector('#fc-calc-lok-index-alt-error'),
      getLimits: function () {
        return LIMITS.alt;
      },
      emptyMsg: 'Укажите АЛТ'
    },
    {
      input: root.querySelector('#fc-calc-lok-index-uln'),
      error: root.querySelector('#fc-calc-lok-index-uln-error'),
      getLimits: function () {
        return LIMITS.ulnAst;
      },
      emptyMsg: 'Укажите ВГН АСТ'
    },
    {
      input: inrInput,
      error: inrError,
      getLimits: getInrLimits,
      emptyMsg: 'Укажите МНО'
    }
  ];

  function roundHalfUp(value, decimals) {
    var factor = Math.pow(10, decimals);
    return Math.round(value * factor + Number.EPSILON) / factor;
  }

  function parsePositive(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function hasInput(value) {
    return String(value || '').trim() !== '';
  }

  function rangeError(limits) {
    return 'Число не в корректном интервале ' + limits.min + ' - ' + limits.max;
  }

  function isFieldValid(field) {
    var value = parsePositive(field.input.value);
    if (value == null) return false;
    var limits = field.getLimits();
    return value >= limits.min && value <= limits.max;
  }

  function updateFieldError(field, showEmptyError) {
    var limits = field.getLimits();
    if (!hasInput(field.input.value)) {
      field.error.textContent = showEmptyError ? field.emptyMsg : '';
      return;
    }
    var value = parsePositive(field.input.value);
    if (value == null) {
      field.error.textContent = showEmptyError ? field.emptyMsg : '';
      return;
    }
    if (value < limits.min || value > limits.max) {
      field.error.textContent = rangeError(limits);
      return;
    }
    field.error.textContent = '';
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function hideResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function isReady() {
    return FIELDS.every(isFieldValid);
  }

  function updateButton() {
    var ok = isReady();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
  }

  function cdsPlateletPoints(plt) {
    if (plt > 340) return 0;
    if (plt >= 280) return 1;
    if (plt >= 220) return 2;
    if (plt >= 160) return 3;
    if (plt >= 100) return 4;
    if (plt >= 40) return 5;
    return 6;
  }

  function cdsAltAstPoints(altAst) {
    if (altAst > 1.7) return 0;
    if (altAst >= 1.2) return 1;
    if (altAst >= 0.6) return 2;
    return 3;
  }

  function cdsInrPoints(inr) {
    if (inr < 1.1) return 0;
    if (inr <= 1.4) return 1;
    return 2;
  }

  function classifyLok(index) {
    if (index < 0.2) {
      return { category: 'unlikely', text: 'Цирроз маловероятен (Lok < 0,2)' };
    }
    if (index < 0.5) {
      return { category: 'indeterminate', text: 'Неопределённый результат (Lok 0,2–0,5)' };
    }
    return { category: 'likely', text: 'Цирроз вероятен (Lok ≥ 0,5)' };
  }

  function classifyCds(score) {
    if (score >= 8) {
      return {
        category: 'likely',
        text: 'CDS ≥ 8 — высокая вероятность выраженного фиброза / цирроза'
      };
    }
    return {
      category: 'unlikely',
      text: 'CDS < 8 — цирроз менее вероятен (низкая чувствительность порога)'
    };
  }

  function classifyGuci(guci) {
    if (guci < 1) {
      return { category: 'unlikely', text: 'GUCI < 1 — цирроз маловероятен (высокий NPV)' };
    }
    return { category: 'likely', text: 'GUCI ≥ 1 — повышенная вероятность цирроза' };
  }

  function classifyApri(apri) {
    if (apri <= 0.5) {
      return {
        category: 'unlikely',
        text: 'Значительный фиброз или цирроз печени менее вероятен'
      };
    }
    if (apri <= 1) {
      return {
        category: 'unlikely',
        text: 'Значительный фиброз неточный, цирроз печени менее вероятен'
      };
    }
    if (apri <= 1.5) {
      return {
        category: 'indeterminate',
        text: 'Значительный фиброз более вероятен, цирроз неточный'
      };
    }
    if (apri <= 2) {
      return {
        category: 'indeterminate',
        text: 'Значительный фиброз более вероятен, но цирроз неточный'
      };
    }
    return {
      category: 'likely',
      text: 'Значительный фиброз и цирроз печени более вероятен'
    };
  }

  function classifyFib4(fib4) {
    if (fib4 < 1.45) {
      return {
        category: 'unlikely',
        text: 'Цирроз печени менее вероятен'
      };
    }
    if (fib4 <= 3.25) {
      return { category: 'indeterminate', text: 'Неточный' };
    }
    return {
      category: 'likely',
      text: 'Цирроз печени более вероятен'
    };
  }

  function calculate() {
    var age = parsePositive(FIELDS[0].input.value);
    var plt = parsePositive(FIELDS[1].input.value);
    var ast = parsePositive(FIELDS[2].input.value);
    var alt = parsePositive(FIELDS[3].input.value);
    var ulnAst = parsePositive(FIELDS[4].input.value);
    var inrRaw = parsePositive(FIELDS[5].input.value);
    var unit = getInrUnit();
    var inr = roundHalfUp(inrFromUnit(inrRaw, unit), 3);

    var cds =
      cdsPlateletPoints(plt) + cdsAltAstPoints(alt / ast) + cdsInrPoints(inr);
    var lokX = -5.56 - 0.0089 * plt + 1.26 * (ast / alt) + 5.27 * inr;
    var lokIndex = roundHalfUp(Math.exp(lokX) / (1 + Math.exp(lokX)), 3);
    var guci = roundHalfUp(((ast / ulnAst) * inr * 100) / plt, 2);
    var apri = roundHalfUp((ast / ulnAst / plt) * 100, 2);
    var fib4 = roundHalfUp((age * ast) / (plt * Math.sqrt(alt)), 2);

    return {
      cds: cds,
      cdsInterp: classifyCds(cds),
      lokIndex: lokIndex,
      lokInterp: classifyLok(lokIndex),
      guci: guci,
      guciInterp: classifyGuci(guci),
      apri: apri,
      apriInterp: classifyApri(apri),
      fib4: fib4,
      fib4Interp: classifyFib4(fib4)
    };
  }

  function setScore(id, value, category, text) {
    var valueEl = root.querySelector('#fc-calc-lok-index-' + id + '-value');
    var descEl = root.querySelector('#fc-calc-lok-index-' + id + '-desc');
    valueEl.textContent = formatNum(value);
    valueEl.className =
      'fc-calc__lok-score-value fc-calc__lok-score-value--' + category;
    descEl.textContent = text;
  }

  function renderResult(out) {
    setScore('cds', out.cds, out.cdsInterp.category, out.cdsInterp.text);
    setScore('lok', out.lokIndex, out.lokInterp.category, out.lokInterp.text);
    setScore('guci', out.guci, out.guciInterp.category, out.guciInterp.text);
    setScore('apri', out.apri, out.apriInterp.category, out.apriInterp.text);
    setScore('fib4', out.fib4, out.fib4Interp.category, out.fib4Interp.text);
  }

  function syncInrUnitUi() {
    var unit = getInrUnit();
    var limits = getInrLimits();
    inrInput.min = String(limits.min);
    inrInput.max = String(limits.max);
    inrInput.placeholder = INR_PLACEHOLDERS[unit] || INR_PLACEHOLDERS.ratio;
  }

  function refreshFields(showEmptyError) {
    syncInrUnitUi();
    FIELDS.forEach(function (field) {
      updateFieldError(field, showEmptyError);
    });
    updateButton();
  }

  form.addEventListener('change', function () {
    hideResult();
    refreshFields(false);
  });

  form.addEventListener('input', function () {
    hideResult();
    refreshFields(false);
  });

  if (inrUnitSelect) {
    inrUnitSelect.addEventListener('change', function () {
      hideResult();
      refreshFields(false);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.textContent = '';
    hideResult();
    refreshFields(true);
    if (!isReady()) return;
    try {
      renderResult(calculate());
      resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    } catch (err) {
      formError.textContent = err.message || 'Ошибка расчёта';
    }
  });

  syncInrUnitUi();
  updateButton();
})();
