(function () {
  var root = document.querySelector('.fc-calc[data-calculator="isotretinoin"]');
  if (!root) return;

  var CUMULATIVE_MG_KG = 120;
  var DAYS_PER_MONTH = 30;
  var DOSE_OPTIONS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];
  var DEFAULT_CAPSULE = 16;

  var form = root.querySelector('#fc-calc-isotretinoin-form');
  var capsuleInput = root.querySelector('#fc-calc-isotretinoin-capsule');
  var formError = root.querySelector('#fc-calc-isotretinoin-form-error');

  var resultEls = {
    dailyDoseMg: root.querySelector('#fc-calc-isotretinoin-daily-dose'),
    cumulativeG: root.querySelector('#fc-calc-isotretinoin-cumulative-g'),
    capsulesPerDay: root.querySelector('#fc-calc-isotretinoin-capsules-day'),
    capsulesPerMonth: root.querySelector('#fc-calc-isotretinoin-capsules-month'),
    capsulesPerCourse: root.querySelector('#fc-calc-isotretinoin-capsules-course'),
    courseDays: root.querySelector('#fc-calc-isotretinoin-course-days'),
  };

  function roundHalfUp(value, decimals) {
    var factor = Math.pow(10, decimals);
    return Math.round(value * factor + Number.EPSILON) / factor;
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function parsePositive(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function parseDose(value) {
    var n = Number(String(value || '').replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    return DOSE_OPTIONS.indexOf(n) >= 0 ? n : null;
  }

  function clearOutputs() {
    Object.keys(resultEls).forEach(function (key) {
      if (resultEls[key]) resultEls[key].value = '—';
    });
  }

  function setCapsule(mg) {
    if (capsuleInput) capsuleInput.value = String(mg);
    root.querySelectorAll('.fc-calc__retin-drug-btn[data-capsule]').forEach(function (btn) {
      var active = Number(btn.getAttribute('data-capsule')) === mg;
      btn.classList.toggle('fc-calc__retin-drug-btn--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    recalculate();
  }

  function resetForm() {
    var weight = root.querySelector('#fc-calc-isotretinoin-weight');
    var dose = root.querySelector('#fc-calc-isotretinoin-dose');
    if (weight) weight.value = '';
    if (dose) dose.value = '0.6';
    if (formError) formError.textContent = '';
    setCapsule(DEFAULT_CAPSULE);
    clearOutputs();
  }

  function calcFromForm() {
    var weightKg = parsePositive(root.querySelector('#fc-calc-isotretinoin-weight')?.value);
    var doseMgKg = parseDose(root.querySelector('#fc-calc-isotretinoin-dose')?.value);
    var capsuleMg = Number(capsuleInput?.value);

    if (weightKg === null || doseMgKg === null || !Number.isFinite(capsuleMg) || capsuleMg <= 0) {
      return null;
    }

    var dailyDoseMg = roundHalfUp(weightKg * doseMgKg, 0);
    var cumulativeMg = roundHalfUp(weightKg * CUMULATIVE_MG_KG, 0);
    var cumulativeG = roundHalfUp(cumulativeMg / 1000, 1);
    var capsulesPerDay = Math.round(dailyDoseMg / capsuleMg);
    var capsulesPerMonth = capsulesPerDay * DAYS_PER_MONTH;
    var capsulesPerCourse = Math.round(cumulativeMg / capsuleMg);
    var courseDays = capsulesPerDay > 0 ? Math.round(capsulesPerCourse / capsulesPerDay) : 0;

    return {
      dailyDoseMg: dailyDoseMg,
      cumulativeG: cumulativeG,
      capsulesPerDay: capsulesPerDay,
      capsulesPerMonth: capsulesPerMonth,
      capsulesPerCourse: capsulesPerCourse,
      courseDays: courseDays,
    };
  }

  function showResult(out) {
    if (!out) {
      clearOutputs();
      return;
    }
    resultEls.dailyDoseMg.value = formatNum(out.dailyDoseMg);
    resultEls.cumulativeG.value = formatNum(out.cumulativeG);
    resultEls.capsulesPerDay.value = formatNum(out.capsulesPerDay);
    resultEls.capsulesPerMonth.value = formatNum(out.capsulesPerMonth);
    resultEls.capsulesPerCourse.value = formatNum(out.capsulesPerCourse);
    resultEls.courseDays.value = formatNum(out.courseDays);
  }

  function recalculate() {
    if (formError) formError.textContent = '';
    showResult(calcFromForm());
  }

  root.querySelectorAll('.fc-calc__retin-drug-btn[data-capsule]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setCapsule(Number(btn.getAttribute('data-capsule')));
    });
  });

  var resetBtn = root.querySelector('#fc-calc-isotretinoin-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetForm);
  }

  if (form) {
    form.addEventListener('input', recalculate);
    form.addEventListener('change', recalculate);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
    });
  }

  setCapsule(DEFAULT_CAPSULE);
  clearOutputs();
})();
