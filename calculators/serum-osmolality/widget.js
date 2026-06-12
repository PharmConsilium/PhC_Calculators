(function () {
  var root = document.querySelector('.fc-calc[data-calculator="serum-osmolality"]');
  if (!root) return;

  var DISPLAY_DECIMALS = 1;
  var LIMITS = {
    serumNa: { min: 70, max: 200 },
    glucose: { min: 0.1, max: 150 },
    bun: { min: 0.1, max: 200 },
  };

  var form = root.querySelector('#fc-calc-serum-osmolality-form');
  var btn = root.querySelector('#fc-calc-serum-osmolality-btn');
  var formError = root.querySelector('#fc-calc-serum-osmolality-form-error');
  var resultWrap = root.querySelector('#fc-calc-serum-osmolality-result');
  var resultBox = root.querySelector('#fc-calc-serum-osmolality-result-box');
  var resultNumber = root.querySelector('#fc-calc-serum-osmolality-result-number');
  var resultDesc = root.querySelector('#fc-calc-serum-osmolality-result-desc');

  var FIELDS = [
    {
      name: 'serumNa',
      error: root.querySelector('#fc-calc-serum-osmolality-na-error'),
      limits: LIMITS.serumNa,
      emptyMsg: 'Укажите натрий сыворотки',
      rangeMsg: 'Натрий вне допустимого диапазона',
    },
    {
      name: 'glucose',
      error: root.querySelector('#fc-calc-serum-osmolality-glucose-error'),
      limits: LIMITS.glucose,
      emptyMsg: 'Укажите глюкозу крови',
      rangeMsg: 'Глюкоза вне допустимого диапазона',
    },
    {
      name: 'bun',
      error: root.querySelector('#fc-calc-serum-osmolality-bun-error'),
      limits: LIMITS.bun,
      emptyMsg: 'Укажите АМК',
      rangeMsg: 'АМК вне допустимого диапазона',
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

  function hasInput(value) {
    return String(value || '').trim() !== '';
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function rangeError(limits) {
    return limits.min + '–' + limits.max;
  }

  function serumOsmolality(serumNa, glucose, bun) {
    return 2 * serumNa + glucose / 18 + bun / 2.8;
  }

  function getFieldInput(field) {
    return form.querySelector('[name="' + field.name + '"]');
  }

  function updateFieldError(field, showEmptyError) {
    var input = getFieldInput(field);
    if (!input || !field.error) return;
    if (!hasInput(input.value)) {
      field.error.textContent = showEmptyError ? field.emptyMsg : '';
      return;
    }
    var value = parsePositive(input.value);
    if (value == null) {
      field.error.textContent = showEmptyError ? field.emptyMsg : '';
      return;
    }
    if (value < field.limits.min || value > field.limits.max) {
      field.error.textContent = field.rangeMsg + ' ' + rangeError(field.limits);
      return;
    }
    field.error.textContent = '';
  }

  function isFieldValid(field) {
    var value = parsePositive(getFieldInput(field).value);
    if (value == null) return false;
    return value >= field.limits.min && value <= field.limits.max;
  }

  function validate(showEmptyError) {
    FIELDS.forEach(function (field) {
      updateFieldError(field, showEmptyError);
    });
    if (!FIELDS.every(isFieldValid)) {
      return { ok: false };
    }
    return {
      ok: true,
      serumNa: parsePositive(getFieldInput(FIELDS[0]).value),
      glucose: parsePositive(getFieldInput(FIELDS[1]).value),
      bun: parsePositive(getFieldInput(FIELDS[2]).value),
    };
  }

  function hideResult() {
    if (resultWrap) resultWrap.classList.add('fc-calc__result-wrap--hidden');
    if (resultBox) resultBox.classList.add('fc-calc__result--empty');
  }

  function updateButton() {
    var ok = FIELDS.every(isFieldValid);
    if (btn) {
      btn.disabled = !ok;
      btn.classList.toggle('fc-calc__btn--inactive', !ok);
    }
  }

  function refreshFields(showEmptyError) {
    FIELDS.forEach(function (field) {
      updateFieldError(field, showEmptyError);
    });
    updateButton();
  }

  if (form) {
    form.addEventListener('input', function () {
      hideResult();
      if (formError) formError.textContent = '';
      refreshFields(false);
    });

    form.addEventListener('change', function () {
      hideResult();
      if (formError) formError.textContent = '';
      refreshFields(false);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideResult();
      if (formError) formError.textContent = '';
      var check = validate(true);
      if (!check.ok) return;

      var osmolality = roundHalfUp(
        serumOsmolality(check.serumNa, check.glucose, check.bun),
        DISPLAY_DECIMALS
      );
      if (resultNumber) {
        resultNumber.textContent = formatNum(osmolality) + ' мосм/кг';
      }
      if (resultDesc) {
        resultDesc.textContent = 'осмоляльность сыворотки';
      }
      if (resultBox) resultBox.classList.remove('fc-calc__result--empty');
      if (resultWrap) resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    });
  }

  updateButton();
})();
