(function () {
  var root = document.querySelector('.fc-calc[data-calculator="dialysis-urea-reduction"]');
  if (!root) return;

  var DISPLAY_DECIMALS = 1;
  var URR_ADEQUATE_MIN = 65;
  var LIMITS = {
    mmolL: { min: 0.1, max: 80 },
    mgdl: { min: 1, max: 480 },
  };

  var form = root.querySelector('#fc-calc-dialysis-urea-reduction-form');
  var resultValue = root.querySelector('#fc-calc-dialysis-urea-reduction-prm');
  var resultNote = root.querySelector('#fc-calc-dialysis-urea-reduction-note');
  var preError = root.querySelector('#fc-calc-dialysis-urea-reduction-pre-error');
  var postError = root.querySelector('#fc-calc-dialysis-urea-reduction-post-error');

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

  function getUnit() {
    var preUnit = form.querySelector('[name="ureaPreUnit"]');
    return preUnit && preUnit.value === 'mgdl' ? 'mgdl' : 'mmolL';
  }

  function syncUnits(source) {
    var preUnit = form.querySelector('[name="ureaPreUnit"]');
    var postUnit = form.querySelector('[name="ureaPostUnit"]');
    if (!preUnit || !postUnit) return;
    if (source === preUnit) {
      postUnit.value = preUnit.value;
    } else {
      preUnit.value = postUnit.value;
    }
  }

  function prmPercent(ureaPre, ureaPost) {
    return (100 * (ureaPre - ureaPost)) / ureaPre;
  }

  function interpretPrm(value) {
    return value >= URR_ADEQUATE_MIN
      ? 'достаточный процент снижения мочевины'
      : 'недостаточный процент снижения мочевины';
  }

  function clearResult() {
    if (resultValue) {
      resultValue.textContent = '—';
      resultValue.classList.add('fc-calc__dur-result-value--empty');
    }
    if (resultNote) resultNote.textContent = '';
  }

  function showResult(prm) {
    if (resultValue) {
      resultValue.textContent = formatNum(prm);
      resultValue.classList.remove('fc-calc__dur-result-value--empty');
    }
    if (resultNote) {
      resultNote.textContent = '— ' + interpretPrm(prm);
    }
  }

  function validateField(input, errorEl, label, limits, showEmpty) {
    if (!input || !errorEl) return null;
    if (!hasInput(input.value)) {
      errorEl.textContent = showEmpty ? 'Укажите ' + label : '';
      return null;
    }
    var value = parsePositive(input.value);
    if (value == null) {
      errorEl.textContent = showEmpty ? 'Некорректное значение' : '';
      return null;
    }
    if (value < limits.min || value > limits.max) {
      errorEl.textContent = 'Допустимо ' + limits.min + '–' + limits.max;
      return null;
    }
    errorEl.textContent = '';
    return value;
  }

  function recalculate() {
    var unit = getUnit();
    var limits = LIMITS[unit];
    var preInput = form.querySelector('[name="ureaPre"]');
    var postInput = form.querySelector('[name="ureaPost"]');
    var ureaPre = validateField(preInput, preError, 'мочевину до ГД', limits, false);
    var ureaPost = validateField(postInput, postError, 'мочевину после ГД', limits, false);

    if (ureaPre == null || ureaPost == null) {
      clearResult();
      return;
    }

    var prm = roundHalfUp(prmPercent(ureaPre, ureaPost), DISPLAY_DECIMALS);
    showResult(prm);
  }

  if (form) {
    form.addEventListener('input', recalculate);
    form.addEventListener('change', function (e) {
      if (e.target && (e.target.name === 'ureaPreUnit' || e.target.name === 'ureaPostUnit')) {
        syncUnits(e.target);
      }
      recalculate();
    });
  }

  clearResult();
})();
