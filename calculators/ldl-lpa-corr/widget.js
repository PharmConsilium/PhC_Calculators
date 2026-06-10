    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="ldl-lpa-corr"]');
      if (!root) return;

      var LPA_CORRECTION_FACTOR = 0.3;
      var LPA_DIVISOR = 38.7;

      var form = root.querySelector('#fc-calc-ldl-lpa-corr-form');
      var calcBtn = root.querySelector('#fc-calc-ldl-lpa-corr-btn');
      var ldlInput = root.querySelector('#fc-calc-ldl-lpa-corr-ldl');
      var lpaInput = root.querySelector('#fc-calc-ldl-lpa-corr-lpa');
      var formError = root.querySelector('#fc-calc-ldl-lpa-corr-form-error');
      var resultWrap = root.querySelector('#fc-calc-ldl-lpa-corr-result');
      var resultOut = root.querySelector('#fc-calc-ldl-lpa-corr-value');

      function parseNonNegative(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
        var n = Number(s);
        return Number.isFinite(n) && n >= 0 ? n : null;
      }

      function correctedCents(ldlMmol, lpaMgDl) {
        return Math.trunc((ldlMmol - (LPA_CORRECTION_FACTOR * lpaMgDl) / LPA_DIVISOR) * 100);
      }

      function formatCents(centsTotal) {
        var whole = Math.trunc(centsTotal / 100);
        var frac = Math.abs(centsTotal % 100);
        return whole + ',' + String(frac).padStart(2, '0');
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        formError.textContent = '';
      }

      function isReady() {
        return parseNonNegative(ldlInput.value) != null && parseNonNegative(lpaInput.value) != null;
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

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

        var ldlMmol = parseNonNegative(ldlInput.value);
        var lpaMgDl = parseNonNegative(lpaInput.value);

        if (ldlMmol == null || lpaMgDl == null) {
          formError.textContent = 'Заполните ХС ЛНП и липопротеид(а)';
          return;
        }

        resultOut.textContent = formatCents(correctedCents(ldlMmol, lpaMgDl));
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
