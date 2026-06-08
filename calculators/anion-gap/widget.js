    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="anion-gap"]');
      if (!root) return;

      var NORMAL_AG = 12;
      var NORMAL_HCO3 = 24;

      var form = root.querySelector('#fc-calc-anion-gap-form');
      var calcBtn = root.querySelector('#fc-calc-anion-gap-btn');
      var formError = root.querySelector('#fc-calc-anion-gap-form-error');
      var resultWrap = root.querySelector('#fc-calc-anion-gap-result');
      var resultNumber = root.querySelector('#fc-calc-anion-gap-result-number');
      var resultDesc = root.querySelector('#fc-calc-anion-gap-result-desc');
      var detailsEl = root.querySelector('#fc-calc-anion-gap-details');

      var inputs = {
        na: root.querySelector('#fc-calc-anion-gap-na'),
        cl: root.querySelector('#fc-calc-anion-gap-cl'),
        hco3: root.querySelector('#fc-calc-anion-gap-hco3')
      };
      var units = {
        na: root.querySelector('#fc-calc-anion-gap-na-unit'),
        cl: root.querySelector('#fc-calc-anion-gap-cl-unit'),
        hco3: root.querySelector('#fc-calc-anion-gap-hco3-unit')
      };
      var decimalsSelect = root.querySelector('#fc-calc-anion-gap-decimals');

      function roundHalfUp(value, decimals) {
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor + Number.EPSILON) / factor;
      }

      function parseIon(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
        var n = Number(s);
        return Number.isFinite(n) ? n : null;
      }

      function formatNum(n, decimals) {
        return String(roundHalfUp(n, decimals)).replace('.', ',');
      }

      function interpretDeltaDelta(deltaDelta) {
        if (deltaDelta > 6) return 'Вероятна сопутствующая метаболическая алкалозная компонента';
        if (deltaDelta < -6) return 'Вероятна сопутствующая метаболическая ацидозная компонента без увеличения АР';
        return 'Соответствует изолированному ацидозу с повышением АР';
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        detailsEl.classList.add('fc-calc__ag-details--hidden');
        formError.textContent = '';
      }

      function isReady() {
        return (
          parseIon(inputs.na.value) != null &&
          parseIon(inputs.cl.value) != null &&
          parseIon(inputs.hco3.value) != null
        );
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function calculate() {
        var na = parseIon(inputs.na.value);
        var cl = parseIon(inputs.cl.value);
        var hco3 = parseIon(inputs.hco3.value);
        var decimals = Number(decimalsSelect.value);
        if (!Number.isFinite(decimals) || decimals < 0 || decimals > 3) decimals = 1;

        if (na == null || cl == null || hco3 == null) {
          formError.textContent = 'Укажите Na, Cl и HCO₃';
          return null;
        }

        var ag = na - (cl + hco3);
        var deltaAg = ag - NORMAL_AG;
        var deltaHco3 = NORMAL_HCO3 - hco3;
        var deltaDelta = deltaAg - deltaHco3;
        var deltaRatio = deltaHco3 !== 0 ? deltaAg / deltaHco3 : null;

        return {
          ag: roundHalfUp(ag, decimals),
          deltaAg: roundHalfUp(deltaAg, decimals),
          deltaHco3: roundHalfUp(deltaHco3, decimals),
          deltaDelta: roundHalfUp(deltaDelta, decimals),
          deltaRatio: deltaRatio == null ? null : roundHalfUp(deltaRatio, decimals),
          decimals: decimals,
          interpretation: interpretDeltaDelta(deltaDelta)
        };
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('input', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var out = calculate();
        if (!out) return;

        resultNumber.textContent = formatNum(out.ag, out.decimals) + ' mEq/L';
        resultDesc.textContent = out.interpretation;
        detailsEl.innerHTML =
          '<p><strong>ΔАР</strong> = ' +
          formatNum(out.deltaAg, out.decimals) +
          ' mEq/L (норма АР ' +
          NORMAL_AG +
          ')</p>' +
          '<p><strong>ΔHCO₃</strong> = ' +
          formatNum(out.deltaHco3, out.decimals) +
          ' mEq/L (норма HCO₃ ' +
          NORMAL_HCO3 +
          ')</p>' +
          '<p><strong>ΔΔ</strong> = ' +
          formatNum(out.deltaDelta, out.decimals) +
          ' mEq/L</p>' +
          (out.deltaRatio != null
            ? '<p><strong>Соотношение ΔАР/ΔHCO₃</strong> = ' + formatNum(out.deltaRatio, out.decimals) + '</p>'
            : '');

        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        detailsEl.classList.remove('fc-calc__ag-details--hidden');
      });

      updateButton();
    })();
