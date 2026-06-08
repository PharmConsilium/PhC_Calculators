    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="cardiac-output"]');
      if (!root) return;

      var VO2_YOUNG = 125;
      var VO2_ELDERLY = 110;
      var VO2_AGE_THRESHOLD = 70;
      var HEMOGLOBIN_FACTOR = 13.4;

      var form = root.querySelector('#fc-calc-cardiac-output-form');
      var calcBtn = root.querySelector('#fc-calc-cardiac-output-btn');
      var formError = root.querySelector('#fc-calc-cardiac-output-form-error');
      var resultWrap = root.querySelector('#fc-calc-cardiac-output-result');

      var inputs = {
        sao2: root.querySelector('#fc-calc-cardiac-output-sao2'),
        svo2: root.querySelector('#fc-calc-cardiac-output-svo2'),
        hemoglobin: root.querySelector('#fc-calc-cardiac-output-hb'),
        hr: root.querySelector('#fc-calc-cardiac-output-hr'),
        age: root.querySelector('#fc-calc-cardiac-output-age'),
        height: root.querySelector('#fc-calc-cardiac-output-height'),
        weight: root.querySelector('#fc-calc-cardiac-output-weight')
      };

      function roundHalfUp(value, decimals) {
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor + Number.EPSILON) / factor;
      }

      function parseNumber(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
        var n = Number(s);
        return Number.isFinite(n) ? n : null;
      }

      function parsePositive(value) {
        var n = parseNumber(value);
        return n != null && n > 0 ? n : null;
      }

      function parsePercent(value) {
        var n = parseNumber(value);
        if (n == null || n < 0 || n > 100) return null;
        return n;
      }

      function parseAge(value) {
        var n = parseNumber(value);
        if (n == null || n < 0 || !Number.isInteger(n)) return null;
        return n;
      }

      function formatNum(n, decimals) {
        return String(n).replace('.', ',');
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function isReady() {
        return (
          parsePercent(inputs.sao2.value) != null &&
          parsePercent(inputs.svo2.value) != null &&
          parsePositive(inputs.hemoglobin.value) != null &&
          parsePositive(inputs.hr.value) != null &&
          parseAge(inputs.age.value) != null &&
          parsePositive(inputs.height.value) != null &&
          parsePositive(inputs.weight.value) != null
        );
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function calculate() {
        var sao2 = parsePercent(inputs.sao2.value);
        var svo2 = parsePercent(inputs.svo2.value);
        var hemoglobin = parsePositive(inputs.hemoglobin.value);
        var hr = parsePositive(inputs.hr.value);
        var age = parseAge(inputs.age.value);
        var height = parsePositive(inputs.height.value);
        var weight = parsePositive(inputs.weight.value);
        var decimals = 2;

        if ([sao2, svo2, hemoglobin, hr, age, height, weight].some(function (v) { return v == null; })) {
          throw new Error('Заполните все поля корректными значениями');
        }
        if (svo2 >= sao2) {
          throw new Error('SvO₂ должно быть ниже SaO₂');
        }

        var bsa = Math.sqrt((height * weight) / 3600);
        var vo2 = (age > VO2_AGE_THRESHOLD ? VO2_ELDERLY : VO2_YOUNG) * bsa;
        var denominator = ((sao2 - svo2) / 100) * (hemoglobin / 10) * HEMOGLOBIN_FACTOR;
        var co = vo2 / denominator;
        var ci = co / bsa;
        var sv = (co / hr) * 1000;

        return {
          vo2: roundHalfUp(vo2, decimals),
          co: roundHalfUp(co, decimals),
          bsa: roundHalfUp(bsa, decimals),
          ci: roundHalfUp(ci, decimals),
          sv: roundHalfUp(sv, decimals),
          decimals: decimals
        };
      }

      function showResults(out) {
        root.querySelector('#fc-calc-cardiac-output-result-co').textContent =
          formatNum(out.co, out.decimals) + ' л/мин';
        root.querySelector('#fc-calc-cardiac-output-result-bsa').textContent =
          formatNum(out.bsa, out.decimals) + ' м²';
        root.querySelector('#fc-calc-cardiac-output-result-ci').textContent =
          formatNum(out.ci, out.decimals) + ' л/мин/м²';
        root.querySelector('#fc-calc-cardiac-output-result-sv').textContent =
          formatNum(out.sv, out.decimals) + ' мл';
        root.querySelector('#fc-calc-cardiac-output-result-vo2').textContent =
          formatNum(out.vo2, out.decimals) + ' мл/мин';
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
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
        formError.textContent = '';
        hideResult();

        if (!isReady()) {
          formError.textContent = 'Заполните все поля';
          return;
        }

        try {
          showResults(calculate());
        } catch (err) {
          formError.textContent = err.message || 'Ошибка расчёта';
        }
      });

      updateButton();
    })();
