    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="fluid-req"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-fluid-req-form');
      var calcBtn = root.querySelector('#fc-calc-fluid-req-btn');
      var weightInput = root.querySelector('#fc-calc-fluid-req-weight');
      var weightError = root.querySelector('#fc-calc-fluid-req-weight-error');
      var resultWrap = root.querySelector('#fc-calc-fluid-req-result');
      var resultMaintenance = root.querySelector('#fc-calc-fluid-req-result-maintenance');
      var resultDaily = root.querySelector('#fc-calc-fluid-req-result-daily');
      var resultBolus = root.querySelector('#fc-calc-fluid-req-result-bolus');
      var resultDesc = root.querySelector('#fc-calc-fluid-req-result-desc');

      function roundHalfUp(value, decimals) {
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor + Number.EPSILON) / factor;
      }

      function parseWeight(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s) return null;
        if (!/^\d+(\.\d+)?$/.test(s)) return { error: true };
        var n = Number(s);
        if (!Number.isFinite(n) || n <= 0) return { error: true };
        if (n > 500) return { error: true, message: 'Укажите массу до 500 кг' };
        return n;
      }

      function formatNum(n, decimals) {
        if (!Number.isFinite(n)) return '';
        return String(roundHalfUp(n, decimals == null ? 1 : decimals)).replace('.', ',');
      }

      function fluidRate421(weightKg) {
        var rate;
        var breakdown;
        if (weightKg <= 10) {
          rate = 4 * weightKg;
          breakdown = '4 × ' + formatNum(weightKg, 2) + ' = ' + formatNum(rate) + ' мл/ч';
        } else if (weightKg <= 20) {
          var extra10 = weightKg - 10;
          rate = 40 + 2 * extra10;
          breakdown = '40 + 2 × ' + formatNum(extra10, 2) + ' = ' + formatNum(rate) + ' мл/ч';
        } else {
          var extra20 = weightKg - 20;
          rate = 60 + extra20;
          breakdown = '60 + 1 × ' + formatNum(extra20, 2) + ' = ' + formatNum(rate) + ' мл/ч';
        }
        return {
          maintenanceMlPerHour: roundHalfUp(rate, 1),
          dailyMl: roundHalfUp(rate * 24, 0),
          bolusMl: roundHalfUp(weightKg * 20, 0),
          breakdown: breakdown,
        };
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function updateButton() {
        var w = parseWeight(weightInput.value);
        var ok = w !== null && !w.error;
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        weightError.textContent = '';
        hideResult();

        var weight = parseWeight(weightInput.value);
        if (weight === null || weight.error) {
          weightError.textContent =
            weight && weight.message ? weight.message : 'Укажите массу тела больше 0';
          return;
        }

        var out = fluidRate421(weight);
        resultMaintenance.textContent = formatNum(out.maintenanceMlPerHour) + ' мл/ч';
        resultDaily.textContent = String(out.dailyMl).replace('.', ',') + ' мл';
        resultBolus.textContent = String(out.bolusMl).replace('.', ',') + ' мл';
        resultDesc.textContent = 'Правило 4-2-1: ' + out.breakdown + '; болюс: 20 × ' + formatNum(weight, 2) + ' = ' + String(out.bolusMl).replace('.', ',') + ' мл';
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      weightInput.addEventListener('input', function () {
        hideResult();
        updateButton();
      });
      weightInput.addEventListener(
        'wheel',
        function (e) {
          if (document.activeElement === weightInput) e.preventDefault();
        },
        { passive: false }
      );

      updateButton();
    })();
