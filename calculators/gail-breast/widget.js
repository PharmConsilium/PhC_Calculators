    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="gail-breast"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-gail-breast-form');
      var calcBtn = root.querySelector('#fc-calc-gail-breast-btn');
      var requiredSelects = [
        'fc-calc-gail-breast-biopsies',
        'fc-calc-gail-breast-first-birth',
        'fc-calc-gail-breast-age-race',
      ];
      var requiredRadios = ['menarche', 'atypicalHyperplasia'];

      function hideResult() {
        root.querySelector('#fc-calc-gail-breast-result').classList.add('fc-calc__result-wrap--hidden');
      }

      function formatNum(n, decimals) {
        return String(n).replace('.', ',');
      }

      function isReady() {
        for (var i = 0; i < requiredRadios.length; i++) {
          if (!form.querySelector('input[name="' + requiredRadios[i] + '"]:checked')) return false;
        }
        for (var j = 0; j < requiredSelects.length; j++) {
          var sel = root.querySelector('#' + requiredSelects[j]);
          if (!sel || !sel.value) return false;
        }
        return true;
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function getDecimals() {
        var sel = root.querySelector('#fc-calc-gail-breast-decimals');
        return sel ? Number(sel.value) : 2;
      }

      function roundHalfUp(value, decimals) {
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor + Number.EPSILON) / factor;
      }

      function getCoef(mapId) {
        var el = root.querySelector('#' + mapId);
        return el && el.value ? Number(el.options[el.selectedIndex].dataset.coef) : null;
      }

      function getRadioCoef(name) {
        var checked = form.querySelector('input[name="' + name + '"]:checked');
        return checked ? Number(checked.dataset.coef) : null;
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!isReady()) return;

        var menarche = getRadioCoef('menarche');
        var biopsies = getCoef('fc-calc-gail-breast-biopsies');
        var firstBirth = getCoef('fc-calc-gail-breast-first-birth');
        var atypical = getRadioCoef('atypicalHyperplasia');
        var baseline = getCoef('fc-calc-gail-breast-age-race');
        var decimals = getDecimals();

        var relativeRisk = roundHalfUp(menarche * biopsies * firstBirth * atypical, decimals);
        var fiveYearRisk = roundHalfUp(relativeRisk * baseline, decimals);

        root.querySelector('#fc-calc-gail-breast-result-rr').textContent = formatNum(relativeRisk, decimals);
        root.querySelector('#fc-calc-gail-breast-result-five').textContent =
          formatNum(fiveYearRisk, decimals) + '%';

        var desc = root.querySelector('#fc-calc-gail-breast-result-desc');
        desc.textContent =
          fiveYearRisk >= 1.67
            ? 'Повышенный 5-летний риск (≥1,67%)'
            : '5-летний риск ниже порога 1,67%';

        root.querySelector('#fc-calc-gail-breast-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
