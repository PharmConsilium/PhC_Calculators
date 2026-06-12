(function () {
  var root = document.querySelector('.fc-calc[data-calculator="abg-interpretation"]');
  if (!root) return;

  var PH_MIN = 6.8;
  var PH_MAX = 8.0;
  var PACO2_MIN = 10;
  var PACO2_MAX = 120;
  var BE_MIN = -30;
  var BE_MAX = 30;
  var PH_LOW = 7.36;
  var PH_HIGH = 7.44;
  var PACO2_LOW = 36;
  var PACO2_HIGH = 44;
  var BE_LOW = -2.4;
  var BE_HIGH = 2.2;

  var form = root.querySelector('#fc-calc-abg-interpretation-form');
  var btn = root.querySelector('#fc-calc-abg-interpretation-btn');
  var formError = root.querySelector('#fc-calc-abg-interpretation-form-error');
  var resultWrap = root.querySelector('#fc-calc-abg-interpretation-result');
  var resultBox = root.querySelector('#fc-calc-abg-interpretation-result-box');
  var resultNumber = root.querySelector('#fc-calc-abg-interpretation-result-number');
  var resultDesc = root.querySelector('#fc-calc-abg-interpretation-result-desc');

  function parseNumber(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function interpretAcidBase(ph, paco2, be) {
    var acidosis = ph < PH_LOW;
    var alkalosis = ph > PH_HIGH;
    var co2High = paco2 > PACO2_HIGH;
    var co2Low = paco2 < PACO2_LOW;
    var beLow = be < BE_LOW;
    var beHigh = be > BE_HIGH;

    if (!acidosis && !alkalosis) {
      return {
        label: 'Нормальное кислотно-щелочное состояние',
        detail: 'pH в пределах референсного диапазона.',
      };
    }

    if ((co2High && beHigh) || (co2Low && beLow)) {
      return {
        label: 'Смешанный (метаболический и респираторный) ацидоз или алкалоз',
        detail: 'PaCO₂ и BE изменены в противоположных направлениях.',
      };
    }

    if (acidosis) {
      if (co2High) {
        return { label: 'Респираторный ацидоз', detail: 'PaCO₂ повышено.' };
      }
      return {
        label: 'Метаболический ацидоз',
        detail: beLow ? 'BE снижен (дефицит оснований).' : 'PaCO₂ не повышено.',
      };
    }

    if (co2Low) {
      return { label: 'Респираторный алкалоз', detail: 'PaCO₂ снижено.' };
    }

    return {
      label: 'Метаболический алкалоз',
      detail: beHigh ? 'BE повышен (избыток оснований).' : 'PaCO₂ не снижено.',
    };
  }

  function validate() {
    var ph = parseNumber(form.querySelector('[name="ph"]').value);
    var paco2 = parseNumber(form.querySelector('[name="paco2"]').value);
    var be = parseNumber(form.querySelector('[name="be"]').value);

    if (ph == null || paco2 == null || be == null) {
      return { ok: false, message: 'Заполните все поля' };
    }
    if (ph < PH_MIN || ph > PH_MAX) {
      return { ok: false, message: 'pH вне допустимого диапазона ' + PH_MIN + '–' + PH_MAX };
    }
    if (paco2 < PACO2_MIN || paco2 > PACO2_MAX) {
      return { ok: false, message: 'PaCO₂ вне допустимого диапазона ' + PACO2_MIN + '–' + PACO2_MAX };
    }
    if (be < BE_MIN || be > BE_MAX) {
      return { ok: false, message: 'BE вне допустимого диапазона ' + BE_MIN + '–' + BE_MAX };
    }

    return { ok: true, ph: ph, paco2: paco2, be: be };
  }

  function isReady() {
    return validate().ok;
  }

  function hideResult() {
    if (resultWrap) resultWrap.classList.add('fc-calc__result-wrap--hidden');
    if (resultBox) resultBox.classList.add('fc-calc__result--empty');
  }

  function updateButton() {
    var ok = isReady();
    if (btn) {
      btn.disabled = !ok;
      btn.classList.toggle('fc-calc__btn--inactive', !ok);
    }
  }

  function onChange() {
    hideResult();
    if (formError) formError.textContent = '';
    updateButton();
  }

  if (form) {
    form.addEventListener('input', onChange);
    form.addEventListener('change', onChange);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideResult();
      var check = validate();
      if (!check.ok) {
        if (formError) formError.textContent = check.message;
        return;
      }

      var out = interpretAcidBase(check.ph, check.paco2, check.be);
      if (resultNumber) resultNumber.textContent = out.label;
      if (resultDesc) resultDesc.textContent = out.detail;
      if (resultBox) resultBox.classList.remove('fc-calc__result--empty');
      if (resultWrap) resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    });
  }

  updateButton();
})();
