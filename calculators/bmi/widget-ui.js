  var FIGURE_SRC = {
    male: '__BMI_FIGURE_MALE__',
    female: '__BMI_FIGURE_FEMALE__',
  };

  var root = document.querySelector('.fc-calc[data-calculator="bmi"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-bmi-form');
  var heightInput = root.querySelector('#fc-calc-bmi-height');
  var weightInput = root.querySelector('#fc-calc-bmi-weight');
  var waistInput = root.querySelector('#fc-calc-bmi-waist');
  var hipInput = root.querySelector('#fc-calc-bmi-hip');
  var formError = root.querySelector('#fc-calc-bmi-form-error');
  var anthroBlock = root.querySelector('#fc-calc-bmi-anthro');
  var resultWrap = root.querySelector('#fc-calc-bmi-result');
  var resultNumber = root.querySelector('#fc-calc-bmi-result-number');
  var resultDesc = root.querySelector('#fc-calc-bmi-result-desc');
  var bsaValue = root.querySelector('#fc-calc-bmi-bsa-value');
  var figureImg = root.querySelector('#fc-calc-bmi-figure-img');
  var tagWeight = root.querySelector('#fc-calc-bmi-tag-weight');
  var tagHeight = root.querySelector('#fc-calc-bmi-tag-height');
  var tagWaist = root.querySelector('#fc-calc-bmi-tag-waist');
  var tagHip = root.querySelector('#fc-calc-bmi-tag-hip');
  var recBlock = root.querySelector('#fc-calc-bmi-recommendations');
  var recList = root.querySelector('#fc-calc-bmi-recommendations-list');
  var anthroResult = root.querySelector('#fc-calc-bmi-anthro-result');
  var anthroSummary = root.querySelector('#fc-calc-bmi-anthro-summary');
  var critWaist = root.querySelector('#fc-calc-bmi-crit-waist');
  var critWhr = root.querySelector('#fc-calc-bmi-crit-whr');
  var critWhtr = root.querySelector('#fc-calc-bmi-crit-whtr');

  function buildInput() {
    var checked = form.querySelector('input[name="sex"]:checked');
    return {
      sex: checked ? checked.value : 'male',
      heightCm: heightInput.value,
      weightKg: weightInput.value,
      waistCm: waistInput ? waistInput.value : '',
      hipCm: hipInput ? hipInput.value : '',
    };
  }

  function formatCmTag(raw) {
    var n = parsePositive(raw);
    if (n == null) return '—';
    var digits = n % 1 === 0 ? 0 : 1;
    return formatRu(n, digits) + ' см';
  }

  function formatKgTag(raw) {
    var n = parsePositive(raw);
    if (n == null) return '—';
    var digits = n % 1 === 0 ? 0 : 1;
    return formatRu(n, digits) + ' кг';
  }

  function updateFigure(sex) {
    if (!figureImg) return;
    var key = sex === 'female' ? 'female' : 'male';
    figureImg.src = FIGURE_SRC[key];
    figureImg.alt =
      key === 'female'
        ? 'Схема измерения роста, окружности талии и бёдер (женщины)'
        : 'Схема измерения роста, окружности талии и бёдер (мужчины)';
    if (resultWrap) resultWrap.style.backgroundImage = '';
  }

  function updateFigureTags(input) {
    if (tagWeight) tagWeight.textContent = formatKgTag(input.weightKg);
    if (tagHeight) tagHeight.textContent = formatCmTag(input.heightCm);
    if (tagWaist) tagWaist.textContent = formatCmTag(input.waistCm);
    if (tagHip) tagHip.textContent = formatCmTag(input.hipCm);
  }

  function setCriterion(el, name, valueText, elevated, thresholdText) {
    if (!el) return;
    el.classList.toggle('fc-calc__bmi-criterion--yes', !!elevated);
    el.classList.toggle('fc-calc__bmi-criterion--no', !elevated);
    el.querySelector('.fc-calc__bmi-criterion-name').textContent = name;
    el.querySelector('.fc-calc__bmi-criterion-value').textContent = valueText;
    el.querySelector('.fc-calc__bmi-criterion-flag').textContent = elevated
      ? 'Критерий (+)'
      : 'Норма';
    el.title = thresholdText || '';
  }

  function clearAnthroResult() {
    if (anthroResult) anthroResult.hidden = true;
    if (anthroSummary) {
      anthroSummary.textContent = '';
      anthroSummary.classList.remove(
        'fc-calc__bmi-anthro-summary--yes',
        'fc-calc__bmi-anthro-summary--no'
      );
    }
  }

  function clearRecommendations() {
    if (recList) recList.innerHTML = '';
    if (recBlock) recBlock.hidden = true;
  }

  function renderRecommendations(rec) {
    if (!recBlock || !recList || !rec || !rec.items || !rec.items.length) {
      clearRecommendations();
      return;
    }
    recList.innerHTML = '';
    rec.items.forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      recList.appendChild(li);
    });
    recBlock.hidden = false;
  }

  function setResultTone(category) {
    var tones = ['underweight', 'normal', 'overweight', 'obese'];
    tones.forEach(function (tone) {
      resultNumber.classList.toggle('fc-calc__bmi-result-number--' + tone, category === tone);
      resultDesc.classList.toggle('fc-calc__bmi-result-desc--' + tone, category === tone);
    });
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
    resultNumber.textContent = '—';
    resultDesc.textContent = '—';
    if (bsaValue) bsaValue.textContent = '—';
    setResultTone('');
    clearRecommendations();
    if (anthroBlock) anthroBlock.hidden = true;
    clearAnthroResult();
  }

  function renderAnthro(a) {
    if (!a || !anthroResult) {
      clearAnthroResult();
      return;
    }

    var sexLabel = a.sex === 'female' ? 'жен.' : 'муж.';
    setCriterion(
      critWaist,
      'Окружность талии',
      formatRu(a.waistCm, a.waistCm % 1 === 0 ? 0 : 1) + ' см',
      a.waistElevated,
      'Порог (' + sexLabel + '): ≥ ' + a.waistLimit + ' см'
    );
    setCriterion(
      critWhr,
      'Соотношение окружности талии к окружности бёдер',
      formatRu(a.whr, 3),
      a.whrElevated,
      'Порог (' + sexLabel + '): > ' + formatRu(a.whrLimit, 2)
    );
    setCriterion(
      critWhtr,
      'Соотношение окружности талии к росту',
      formatRu(a.whtr, 3),
      a.whtrElevated,
      'Порог: > ' + formatRu(a.whtrLimit, 1)
    );

    anthroSummary.textContent = a.summary;
    anthroSummary.classList.toggle('fc-calc__bmi-anthro-summary--yes', a.confirmed);
    anthroSummary.classList.toggle('fc-calc__bmi-anthro-summary--no', !a.confirmed);
    anthroResult.hidden = false;
  }

  function renderResult(out) {
    var input = buildInput();
    resultNumber.textContent = out.valueLabel;
    resultDesc.textContent = out.interpretation;
    if (bsaValue) bsaValue.textContent = out.bsaLabel + ' м²';
    setResultTone(out.category);
    updateFigure(input.sex);
    updateFigureTags(input);
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    renderRecommendations(out.recommendations);

    if (anthroBlock) {
      anthroBlock.hidden = !out.needsAnthropometry;
    }

    if (out.needsAnthropometry && out.anthropometry) {
      renderAnthro(out.anthropometry);
    } else {
      clearAnthroResult();
    }
  }

  function update() {
    formError.textContent = '';
    if (!isReady(buildInput())) {
      clearResult();
      return;
    }
    try {
      renderResult(calculate(buildInput()));
    } catch (err) {
      clearResult();
      formError.textContent = err.message || 'Проверьте ввод';
    }
  }

  form.querySelectorAll('input[name="sex"]').forEach(function (el) {
    el.addEventListener('change', update);
  });
  [heightInput, weightInput, waistInput, hipInput].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    update();
  });

  updateFigure('male');
  update();
