(function () {
  var root = document.querySelector('.fc-calc[data-calculator="hyponatremia-infusion"]');
  if (!root) return;

  var DISPLAY_DECIMALS = 1;
  var WATER_FRACTIONS = {
    child: 0.6,
    adult_female: 0.5,
    elderly_female: 0.45,
    adult_male: 0.6,
    elderly_male: 0.5,
  };
  var IV_NA = {
    nacl5: 855,
    nacl3: 513,
    nacl09: 154,
    ringer: 134,
  };
  var LIMITS = {
    naChangePerHour: { min: 0.01, max: 2 },
    serumNa: { min: 80, max: 180 },
    weight: { min: 1, max: 300 },
    ivK: { min: 0, max: 200 },
  };

  var form = root.querySelector('#fc-calc-hyponatremia-infusion-form');
  var btn = root.querySelector('#fc-calc-hyponatremia-infusion-btn');
  var formError = root.querySelector('#fc-calc-hyponatremia-infusion-form-error');
  var resultWrap = root.querySelector('#fc-calc-hyponatremia-infusion-result');
  var resultBody = root.querySelector('#fc-calc-hyponatremia-infusion-result-body');

  var FIELDS = [
    {
      name: 'naChangePerHour',
      error: root.querySelector('#fc-calc-hyponatremia-infusion-na-change-error'),
      limits: LIMITS.naChangePerHour,
      emptyMsg: 'Укажите изменение Na в час',
      rangeMsg: 'Изменение Na вне диапазона',
      parse: parsePositive,
    },
    {
      name: 'serumNa',
      error: root.querySelector('#fc-calc-hyponatremia-infusion-serum-na-error'),
      limits: LIMITS.serumNa,
      emptyMsg: 'Укажите натрий сыворотки',
      rangeMsg: 'Натрий сыворотки вне диапазона',
      parse: parsePositive,
    },
    {
      name: 'weight',
      error: root.querySelector('#fc-calc-hyponatremia-infusion-weight-error'),
      limits: LIMITS.weight,
      emptyMsg: 'Укажите массу тела',
      rangeMsg: 'Масса тела вне диапазона',
      parse: parsePositive,
    },
    {
      name: 'ivK',
      error: root.querySelector('#fc-calc-hyponatremia-infusion-iv-k-error'),
      limits: LIMITS.ivK,
      emptyMsg: 'Укажите K⁺ инфузата',
      rangeMsg: 'K⁺ инфузата вне диапазона',
      parse: parseNonNegative,
    },
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

  function parseNonNegative(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function hasInput(value) {
    return String(value || '').trim() !== '';
  }

  function rangeText(limits) {
    return limits.min + '–' + limits.max;
  }

  function getRadio(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : null;
  }

  function getFieldInput(field) {
    return form.querySelector('[name="' + field.name + '"]');
  }

  function getParsedValues() {
    var values = {};
    FIELDS.forEach(function (field) {
      values[field.name] = field.parse(getFieldInput(field).value);
    });
    values.waterFractionId = getRadio('waterFraction');
    values.ivSolutionId = getRadio('ivSolution');
    values.waterFraction = values.waterFractionId ? WATER_FRACTIONS[values.waterFractionId] : null;
    values.ivNa = values.ivSolutionId ? IV_NA[values.ivSolutionId] : null;
    return values;
  }

  function updateFieldError(field, showMessages) {
    var input = getFieldInput(field);
    if (!input || !field.error) return;
    if (!hasInput(input.value)) {
      field.error.textContent = showMessages ? field.emptyMsg : '';
      return;
    }
    var value = field.parse(input.value);
    if (value == null) {
      field.error.textContent = showMessages ? field.emptyMsg : '';
      return;
    }
    if (value < field.limits.min || value > field.limits.max) {
      field.error.textContent = field.rangeMsg + ' ' + rangeText(field.limits);
      return;
    }
    field.error.textContent = '';
  }

  function updateInfusateError(values, showMessages) {
    if (!formError) return;
    if (
      values.serumNa != null &&
      values.ivNa != null &&
      values.ivK != null &&
      values.serumNa >= LIMITS.serumNa.min &&
      values.serumNa <= LIMITS.serumNa.max
    ) {
      var delta = values.ivNa + values.ivK - values.serumNa;
      if (delta <= 0) {
        formError.textContent =
          'Концентрация инфузата (Na + K) должна превышать натрий сыворотки';
        return;
      }
    }
    if (!showMessages) {
      formError.textContent = '';
    }
  }

  function isFieldValid(field) {
    var value = field.parse(getFieldInput(field).value);
    if (value == null) return false;
    return value >= field.limits.min && value <= field.limits.max;
  }

  function isReady() {
    if (!FIELDS.every(isFieldValid)) return false;
    var values = getParsedValues();
    if (values.waterFraction == null || values.ivNa == null) return false;
    return values.ivNa + values.ivK - values.serumNa > 0;
  }

  function calculate(input) {
    var deltaInfusate = input.ivNa + input.ivK - input.serumNa;
    if (deltaInfusate <= 0) {
      throw new Error('Концентрация инфузата (Na + K) должна превышать натрий сыворотки');
    }
    var tbw1 = input.waterFraction * input.weight + 1;
    return {
      changePerLiter: roundHalfUp(deltaInfusate / tbw1, DISPLAY_DECIMALS),
      infusionRateMlHr: roundHalfUp(
        (1000 * input.naChangePerHour * tbw1) / deltaInfusate,
        DISPLAY_DECIMALS
      ),
    };
  }

  function hideResult() {
    if (resultWrap) resultWrap.classList.add('fc-calc__result-wrap--hidden');
    if (resultBody) resultBody.innerHTML = '';
  }

  function renderResult(out) {
    if (!resultBody) return;
    resultBody.innerHTML =
      '<p class="fc-calc__hna-result-line"><strong>' +
      formatNum(out.infusionRateMlHr) +
      ' мл/ч</strong> — скорость инфузии</p>' +
      '<p class="fc-calc__hna-result-line"><strong>' +
      formatNum(out.changePerLiter) +
      ' ммоль/л</strong> — изменение сывороточного Na на литр</p>';
  }

  function refreshFields(showMessages) {
    FIELDS.forEach(function (field) {
      updateFieldError(field, showMessages);
    });
    var values = getParsedValues();
    updateInfusateError(values, showMessages);
    updateButton();
  }

  function updateButton() {
    var ok = isReady();
    if (btn) {
      btn.disabled = !ok;
      btn.classList.toggle('fc-calc__btn--inactive', !ok);
    }
  }

  if (form) {
    form.addEventListener('input', function () {
      hideResult();
      refreshFields(true);
    });

    form.addEventListener('change', function () {
      hideResult();
      refreshFields(true);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideResult();
      refreshFields(true);
      if (!isReady()) return;

      var values = getParsedValues();
      try {
        renderResult(
          calculate({
            naChangePerHour: values.naChangePerHour,
            serumNa: values.serumNa,
            weight: values.weight,
            ivK: values.ivK,
            waterFraction: values.waterFraction,
            ivNa: values.ivNa,
          })
        );
        if (resultWrap) resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      } catch (err) {
        if (formError) formError.textContent = err.message || 'Ошибка расчёта';
      }
    });
  }

  refreshFields(false);
})();
