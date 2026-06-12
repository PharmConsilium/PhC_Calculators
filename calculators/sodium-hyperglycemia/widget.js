(function () {
  var root = document.querySelector('.fc-calc[data-calculator="sodium-hyperglycemia"]');
  if (!root) return;

  var DISPLAY_DECIMALS = 1;
  var KATZ = 0.016;
  var HILLIER = 0.024;
  var GLUCOSE_NORMAL_MGDL = 100;
  var MMOL_TO_MGDL = 18;
  var LIMITS = {
    measuredNa: { min: 70, max: 250 },
    glucoseMmol: { min: 0.5, max: 200 },
  };

  var form = root.querySelector('#fc-calc-sodium-hyperglycemia-form');
  var btn = root.querySelector('#fc-calc-sodium-hyperglycemia-btn');
  var formError = root.querySelector('#fc-calc-sodium-hyperglycemia-form-error');
  var resultWrap = root.querySelector('#fc-calc-sodium-hyperglycemia-result');
  var resultBody = root.querySelector('#fc-calc-sodium-hyperglycemia-result-body');

  var FIELDS = [
    {
      name: 'measuredNa',
      error: root.querySelector('#fc-calc-sodium-hyperglycemia-na-error'),
      limits: LIMITS.measuredNa,
      emptyMsg: 'Укажите измеренный натрий',
      rangeMsg: 'Натрий вне допустимого диапазона',
    },
    {
      name: 'glucose',
      error: root.querySelector('#fc-calc-sodium-hyperglycemia-glucose-error'),
      limits: LIMITS.glucoseMmol,
      emptyMsg: 'Укажите уровень глюкозы',
      rangeMsg: 'Глюкоза вне допустимого диапазона',
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

  function rangeText(limits) {
    return limits.min + '–' + limits.max;
  }

  function getFieldInput(field) {
    return form.querySelector('[name="' + field.name + '"]');
  }

  function corrected(measuredNa, glucoseMmol, factor) {
    var glucoseMgDl = glucoseMmol * MMOL_TO_MGDL;
    return measuredNa + factor * (glucoseMgDl - GLUCOSE_NORMAL_MGDL);
  }

  function updateFieldError(field, showMessages) {
    var input = getFieldInput(field);
    if (!input || !field.error) return;
    if (!hasInput(input.value)) {
      field.error.textContent = showMessages ? field.emptyMsg : '';
      return;
    }
    var value = parsePositive(input.value);
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

  function isFieldValid(field) {
    var value = parsePositive(getFieldInput(field).value);
    if (value == null) return false;
    return value >= field.limits.min && value <= field.limits.max;
  }

  function hideResult() {
    if (resultWrap) resultWrap.classList.add('fc-calc__result-wrap--hidden');
    if (resultBody) resultBody.innerHTML = '';
  }

  function renderResult(out) {
    if (!resultBody) return;
    resultBody.innerHTML =
      '<p class="fc-calc__na-glu-result-line"><strong>Корригированный Na (по Katz):</strong> ' +
      formatNum(out.correctedNaKatz) +
      ' ммоль/л</p>' +
      '<p class="fc-calc__na-glu-result-line"><strong>Корригированный Na (по Hillier):</strong> ' +
      formatNum(out.correctedNaHillier) +
      ' ммоль/л</p>';
  }

  function refreshFields(showMessages) {
    FIELDS.forEach(function (field) {
      updateFieldError(field, showMessages);
    });
    if (formError) formError.textContent = '';
    updateButton();
  }

  function updateButton() {
    var ok = FIELDS.every(isFieldValid);
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
      if (!FIELDS.every(isFieldValid)) return;

      var measuredNa = parsePositive(getFieldInput(FIELDS[0]).value);
      var glucoseMmol = parsePositive(getFieldInput(FIELDS[1]).value);

      var katz = roundHalfUp(corrected(measuredNa, glucoseMmol, KATZ), DISPLAY_DECIMALS);
      var hillier = roundHalfUp(corrected(measuredNa, glucoseMmol, HILLIER), DISPLAY_DECIMALS);

      renderResult({ correctedNaKatz: katz, correctedNaHillier: hillier });
      if (resultWrap) resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    });
  }

  refreshFields(false);
})();
