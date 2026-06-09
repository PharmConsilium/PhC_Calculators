    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="aminophylline-peds"]');
      if (!root) return;

      var MG_PER_ML = 24;
      var LOADING_DILUTION_ML = 50;
      var LOADING_INFUSION_MIN = 30;
      var LOADING_DOSE_NO_PRIOR = 3;
      var LOADING_DOSE_PRIOR = 6;

      var AGE_RATES = {
        '0-3w': 0.1,
        '3-6w': 0.15,
        '6w-3m': 0.5,
        '6m-9y': 1,
        '9-16y': 0.5,
      };

      var form = root.querySelector('#fc-calc-aminophylline-peds-form');
      var weightInput = root.querySelector('#fc-calc-aminophylline-peds-weight');
      var hoursInput = root.querySelector('#fc-calc-aminophylline-peds-hours');
      var volumeInput = root.querySelector('#fc-calc-aminophylline-peds-volume');
      var formError = root.querySelector('#fc-calc-aminophylline-peds-form-error');
      var resultsWrap = root.querySelector('#fc-calc-aminophylline-peds-results');

      var loadingMgEl = root.querySelector('#fc-calc-aminophylline-peds-loading-mg');
      var loadingMlEl = root.querySelector('#fc-calc-aminophylline-peds-loading-ml');
      var maintenanceMgEl = root.querySelector('#fc-calc-aminophylline-peds-maintenance-mg');
      var maintenanceMlEl = root.querySelector('#fc-calc-aminophylline-peds-maintenance-ml');
      var infusionRateEl = root.querySelector('#fc-calc-aminophylline-peds-infusion-rate');

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

      function formatNum(n, decimals) {
        return String(n).replace('.', ',');
      }

      function getAge() {
        var checked = form.querySelector('input[name="age"]:checked');
        return checked ? checked.value : null;
      }

      function getBool(name) {
        var checked = form.querySelector('input[name="' + name + '"]:checked');
        if (!checked) return null;
        return checked.value === 'yes';
      }

      function hideResults() {
        resultsWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function showResults() {
        resultsWrap.classList.remove('fc-calc__result-wrap--hidden');
      }

      function calculate() {
        var age = getAge();
        var rate = age ? AGE_RATES[age] : null;
        var weight = parsePositive(weightInput.value);
        var hours = parsePositive(hoursInput.value);
        var volume = parsePositive(volumeInput.value);
        var priorTheophylline = getBool('priorTheophylline');
        var reduceMaintenance = getBool('reduceMaintenance');

        if (
          !rate ||
          weight == null ||
          hours == null ||
          volume == null ||
          priorTheophylline == null ||
          reduceMaintenance == null
        ) {
          return null;
        }

        var loadingMgKg = priorTheophylline ? LOADING_DOSE_PRIOR : LOADING_DOSE_NO_PRIOR;
        var loadingMg = roundHalfUp(weight * loadingMgKg, 1);
        var loadingMl = roundHalfUp((weight * loadingMgKg) / MG_PER_ML, 2);
        var loadingRate = roundHalfUp(LOADING_DILUTION_ML / (LOADING_INFUSION_MIN / 60), 0);

        var maintenanceRate = rate;
        if (reduceMaintenance) maintenanceRate /= 2;

        var maintenanceMg = roundHalfUp(weight * maintenanceRate, 2);
        var maintenanceMl = roundHalfUp((weight * maintenanceRate) / MG_PER_ML, 2);
        var infusionRate = roundHalfUp(volume / hours, 1);

        return {
          loadingMg: loadingMg,
          loadingMl: loadingMl,
          loadingRate: loadingRate,
          maintenanceMg: maintenanceMg,
          maintenanceMl: maintenanceMl,
          infusionRate: infusionRate,
        };
      }

      function updateResults() {
        formError.textContent = '';
        var out = calculate();
        if (!out) {
          hideResults();
          return;
        }

        showResults();
        loadingMgEl.textContent = formatNum(out.loadingMg, 1) + ' мг';
        loadingMlEl.textContent = formatNum(out.loadingMl, 2) + ' мл';
        maintenanceMgEl.textContent = formatNum(out.maintenanceMg, 2) + ' мг';
        maintenanceMlEl.textContent = formatNum(out.maintenanceMl, 2) + ' мл';
        infusionRateEl.textContent = formatNum(out.infusionRate, 1) + ' мл/час';
      }

      form.addEventListener('change', updateResults);
      form.addEventListener('input', updateResults);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        updateResults();
      });

      hideResults();
    })();
