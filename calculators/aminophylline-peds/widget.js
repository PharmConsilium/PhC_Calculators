    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="aminophylline-peds"]');
      if (!root) return;

      var MG_PER_ML = 24;
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
      var calcBtn = root.querySelector('#fc-calc-aminophylline-peds-btn');
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

      function formatNum(n) {
        return String(n).replace('.', ',');
      }

      function getAge() {
        var checked = root.querySelector('input[name="age"]:checked');
        return checked ? checked.value : null;
      }

      function getBool(field) {
        var hidden = root.querySelector('#fc-calc-aminophylline-peds-' + field);
        if (!hidden) return null;
        if (hidden.value === 'yes') return true;
        if (hidden.value === 'no') return false;
        return null;
      }

      function setToggleValue(field, value) {
        var hidden = root.querySelector('#fc-calc-aminophylline-peds-' + field);
        var group = root.querySelector('.fc-calc__amph-toggle[data-amph-field="' + field + '"]');
        if (!hidden || !group) return;
        hidden.value = value;
        group.querySelectorAll('.fc-calc__amph-toggle-btn').forEach(function (btn) {
          var active = btn.getAttribute('data-value') === value;
          btn.classList.toggle('fc-calc__amph-toggle-btn--active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }

      function initToggles() {
        root.querySelectorAll('.fc-calc__amph-toggle[data-amph-field]').forEach(function (group) {
          var field = group.getAttribute('data-amph-field');
          group.querySelectorAll('.fc-calc__amph-toggle-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
              setToggleValue(field, btn.getAttribute('data-value'));
              onInputChange();
            });
          });
        });
      }

      function hideResults() {
        resultsWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function isReady() {
        return (
          !!getAge() &&
          parsePositive(weightInput.value) != null &&
          parsePositive(hoursInput.value) != null &&
          parsePositive(volumeInput.value) != null &&
          getBool('priorTheophylline') != null &&
          getBool('reduceMaintenance') != null
        );
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
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

        var maintenanceRate = rate;
        if (reduceMaintenance) maintenanceRate /= 2;

        var maintenanceMg = roundHalfUp(weight * maintenanceRate * hours, 2);
        var maintenanceMl = roundHalfUp((weight * maintenanceRate * hours) / MG_PER_ML, 2);
        var infusionRate = roundHalfUp(volume / hours, 1);

        return {
          loadingMg: loadingMg,
          loadingMl: loadingMl,
          maintenanceMg: maintenanceMg,
          maintenanceMl: maintenanceMl,
          infusionRate: infusionRate,
        };
      }

      function onInputChange() {
        formError.textContent = '';
        hideResults();
        updateButton();
      }

      initToggles();
      form.addEventListener('change', onInputChange);
      form.addEventListener('input', onInputChange);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        formError.textContent = '';
        var out = calculate();
        if (!out) {
          formError.textContent = 'Заполните все поля';
          hideResults();
          return;
        }

        loadingMgEl.textContent = formatNum(out.loadingMg) + ' мг';
        loadingMlEl.textContent = formatNum(out.loadingMl) + ' мл';
        maintenanceMgEl.textContent = formatNum(out.maintenanceMg) + ' мг';
        maintenanceMlEl.textContent = formatNum(out.maintenanceMl) + ' мл';
        infusionRateEl.textContent = formatNum(out.infusionRate) + ' мл/час';
        resultsWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      hideResults();
      updateButton();
    })();
