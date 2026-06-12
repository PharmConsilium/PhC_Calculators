(function () {
  var root = document.querySelector('.fc-calc[data-calculator="hemodialysis-adequacy"]');
  if (!root) return;

  var DISPLAY_DECIMALS = 2;
  var LIMITS = {
    hours: { min: 0.5, max: 12 },
    minutes: { min: 30, max: 720 },
    urea: { min: 0.1, max: 80 },
    weightLoss: { min: 0, max: 20 },
    weight: { min: 20, max: 250 },
  };

  var form = root.querySelector('#fc-calc-hemodialysis-adequacy-form');
  var btn = root.querySelector('#fc-calc-hemodialysis-adequacy-btn');
  var formError = root.querySelector('#fc-calc-hemodialysis-adequacy-form-error');
  var resultWrap = root.querySelector('#fc-calc-hemodialysis-adequacy-result');
  var resultBody = root.querySelector('#fc-calc-hemodialysis-adequacy-result-body');

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

  function getAccess() {
    var checked = form.querySelector('input[name="access"]:checked');
    return checked ? checked.value : null;
  }

  function timeToHours(value, unit) {
    return unit === 'minutes' ? value / 60 : value;
  }

  function spKtV(co, ct, tHours, dBw, bw) {
    var ratio = ct / co;
    var logTerm = ratio - 0.008 * tHours;
    if (logTerm <= 0) {
      throw new Error('Некорректные данные для расчёта spKt/V');
    }
    return -Math.log(logTerm) + (4 - 3.5 * ratio) * (dBw / bw);
  }

  function eKtV(sp, tHours, access) {
    if (access === 'arteriovenous') {
      return sp - (0.6 * sp) / tHours + 0.03;
    }
    return sp - (0.47 * sp) / tHours + 0.02;
  }

  function urrPercent(co, ct) {
    return 100 * (1 - ct / co);
  }

  function interpretEKtV(value) {
    if (value >= 2.3) return 'идеальный гемодиализ';
    if (value >= 1.6) return 'оптимальный гемодиализ';
    if (value >= 1.2) return 'адекватный гемодиализ';
    return 'недостаточный гемодиализ';
  }

  function interpretUrr(value) {
    return value >= 65
      ? 'достаточный процент снижения мочевины'
      : 'недостаточный процент снижения мочевины';
  }

  function validate(showMessages) {
    var timeRaw = parsePositive(form.querySelector('[name="dialysisTime"]').value);
    var timeUnitEl = form.querySelector('[name="timeUnit"]');
    var timeUnit = timeUnitEl && timeUnitEl.value === 'minutes' ? 'minutes' : 'hours';
    var ureaPre = parsePositive(form.querySelector('[name="ureaPre"]').value);
    var ureaPost = parsePositive(form.querySelector('[name="ureaPost"]').value);
    var weightLoss = parseNonNegative(form.querySelector('[name="weightLoss"]').value);
    var weightPost = parsePositive(form.querySelector('[name="weightPost"]').value);
    var access = getAccess();
    var limits = timeUnit === 'minutes' ? LIMITS.minutes : LIMITS.hours;

    if (formError) formError.textContent = '';

    if (!access) {
      if (showMessages && formError) formError.textContent = 'Выберите тип доступа';
      return { ok: false };
    }
    if (timeRaw == null) {
      if (showMessages && formError) formError.textContent = 'Укажите время диализа';
      return { ok: false };
    }
    if (ureaPre == null || ureaPost == null) {
      if (showMessages && formError) formError.textContent = 'Укажите мочевину до и после диализа';
      return { ok: false };
    }
    if (weightLoss == null) {
      if (showMessages && formError) formError.textContent = 'Укажите потерю веса';
      return { ok: false };
    }
    if (weightPost == null) {
      if (showMessages && formError) formError.textContent = 'Укажите вес после диализа';
      return { ok: false };
    }
    if (timeRaw < limits.min || timeRaw > limits.max) {
      if (showMessages && formError) {
        formError.textContent = 'Время диализа вне допустимого диапазона';
      }
      return { ok: false };
    }

    return {
      ok: true,
      access: access,
      timeRaw: timeRaw,
      timeUnit: timeUnit,
      ureaPre: ureaPre,
      ureaPost: ureaPost,
      weightLoss: weightLoss,
      weightPost: weightPost,
    };
  }

  function isReady() {
    return validate(false).ok;
  }

  function hideResult() {
    if (resultWrap) resultWrap.classList.add('fc-calc__result-wrap--hidden');
    if (resultBody) resultBody.innerHTML = '';
  }

  function renderResult(out) {
    if (!resultBody) return;
    resultBody.innerHTML =
      '<div class="fc-calc__hd-result-block">' +
      '<p class="fc-calc__hd-result-block-title">Коэффициент очищения</p>' +
      '<p class="fc-calc__hd-result-line"><strong>spKt/V:</strong> ' +
      formatNum(out.spKtV) +
      '</p>' +
      '<p class="fc-calc__hd-result-line"><strong>eKt/V:</strong> ' +
      formatNum(out.eKtV) +
      '</p>' +
      '<p class="fc-calc__hd-result-note">— ' +
      out.eKtVInterpretation +
      '</p>' +
      '</div>' +
      '<div class="fc-calc__hd-result-block">' +
      '<p class="fc-calc__hd-result-block-title">Доля снижения мочевины</p>' +
      '<p class="fc-calc__hd-result-line"><strong>URR:</strong> ' +
      formatNum(out.urr) +
      ' %</p>' +
      '<p class="fc-calc__hd-result-note">— ' +
      out.urrInterpretation +
      '</p>' +
      '</div>';
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
      updateButton();
    });
    form.addEventListener('change', function () {
      hideResult();
      updateButton();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideResult();
      var check = validate(true);
      if (!check.ok) return;

      try {
        var tHours = timeToHours(check.timeRaw, check.timeUnit);
        var sp = roundHalfUp(
          spKtV(check.ureaPre, check.ureaPost, tHours, check.weightLoss, check.weightPost),
          DISPLAY_DECIMALS
        );
        var e = roundHalfUp(eKtV(sp, tHours, check.access), DISPLAY_DECIMALS);
        var urr = roundHalfUp(urrPercent(check.ureaPre, check.ureaPost), DISPLAY_DECIMALS);

        renderResult({
          spKtV: sp,
          eKtV: e,
          urr: urr,
          eKtVInterpretation: interpretEKtV(e),
          urrInterpretation: interpretUrr(urr),
        });
        if (resultWrap) resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      } catch (err) {
        if (formError) formError.textContent = err.message || 'Ошибка расчёта';
      }
    });
  }

  updateButton();
})();
