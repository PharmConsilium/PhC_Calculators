    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="potassium-deficit"]');
      if (!root) return;

      var NORMAL_K = 5;
      var EXTRACELLULAR = 0.2;
      var MG_DIVISOR = 13.4;
      var V4_DIVISOR = 40;
      var MAX_DAILY_PER_KG = 3;

      var form = root.querySelector('#fc-calc-potassium-deficit-form');
      var calcBtn = root.querySelector('#fc-calc-potassium-deficit-btn');
      var serumInput = root.querySelector('#fc-calc-potassium-deficit-serum');
      var weightInput = root.querySelector('#fc-calc-potassium-deficit-weight');
      var decimalsSelect = root.querySelector('#fc-calc-potassium-deficit-decimals');
      var serumError = root.querySelector('#fc-calc-potassium-deficit-serum-error');
      var weightError = root.querySelector('#fc-calc-potassium-deficit-weight-error');
      var formError = root.querySelector('#fc-calc-potassium-deficit-form-error');
      var resultWrap = root.querySelector('#fc-calc-potassium-deficit-result');
      var resultSummary = root.querySelector('#fc-calc-potassium-deficit-result-summary');

      function rnd(value) {
        return Math.round(value * 100) / 100;
      }

      function rnd1(value) {
        return Math.round(value * 10) / 10;
      }

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

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        if (resultSummary) resultSummary.innerHTML = '';
      }

      function isReady() {
        return parseNonNegative(serumInput.value) != null && parsePositive(weightInput.value) != null;
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function calculate() {
        var weight = parsePositive(weightInput.value);
        var serumK = parseNonNegative(serumInput.value);
        if (weight == null || serumK == null) {
          throw new Error('Заполните все поля');
        }

        var decimals = decimalsSelect ? Number(decimalsSelect.value) : 1;
        if (!Number.isFinite(decimals) || decimals < 0 || decimals > 2) decimals = 1;

        var delta = NORMAL_K - serumK;
        var deficit = roundHalfUp(weight * EXTRACELLULAR * delta, decimals);
        var deficitMg = Math.round((deficit / MG_DIVISOR) * 1000);
        var volume75 = rnd1(deficit);
        var volume4 = rnd1(rnd(deficitMg / V4_DIVISOR));
        var maxDaily = Math.round(weight * MAX_DAILY_PER_KG);

        var statusMessage;
        if (delta <= 0) {
          statusMessage =
            serumK >= NORMAL_K
              ? 'Калий сыворотки не ниже нормы (5 ммоль/л) — дефицит не рассчитывается.'
              : 'Дефицит калия не выявлен.';
        } else if (serumK < 3.5) {
          statusMessage = 'Гипокалиемия. Рассчитан ориентировочный дефицит калия.';
        } else {
          statusMessage = 'Снижение калия сыворотки. Рассчитан ориентировочный дефицит калия.';
        }

        return {
          deficit: deficit,
          deficitMg: deficitMg,
          volume75: volume75,
          volume4: volume4,
          maxDaily: maxDaily,
          statusMessage: statusMessage,
          hasDeficit: deficit > 0,
        };
      }

      function renderResult(out) {
        if (!resultSummary) return;

        if (!out.hasDeficit) {
          resultSummary.innerHTML =
            '<p class="fc-calc__k-result-line">' + out.statusMessage + '</p>' +
            '<p class="fc-calc__k-result-line">Максимальная суточная доза калия: <strong>' +
            formatNum(out.maxDaily) + ' ммоль</strong> (3 ммоль/кг/сут).</p>';
          return;
        }

        resultSummary.innerHTML =
          '<p class="fc-calc__k-result-line"><strong>' + formatNum(out.deficit) + ' ммоль</strong> (' +
          formatNum(out.deficitMg) + ' мг) — дефицит калия</p>' +
          '<p class="fc-calc__k-result-line">Для возмещения необходимо: 7,5%-го раствора KCl: <strong>' +
          formatNum(out.volume75) + ' мл</strong> или 4%-го раствора KCl: <strong>' +
          formatNum(out.volume4) + ' мл</strong></p>' +
          '<p class="fc-calc__k-result-line">Максимальная дозировка в сутки составляет: <strong>' +
          formatNum(out.maxDaily) + ' ммоль</strong></p>';
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
        serumError.textContent = '';
        weightError.textContent = '';
        formError.textContent = '';
        hideResult();

        if (!isReady()) {
          if (parseNonNegative(serumInput.value) == null) {
            serumError.textContent = 'Укажите калий сыворотки, ммоль/л';
          }
          if (parsePositive(weightInput.value) == null) {
            weightError.textContent = 'Укажите вес пациента, кг';
          }
          return;
        }

        try {
          var out = calculate();
          renderResult(out);
          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        } catch (err) {
          formError.textContent = err.message || 'Ошибка расчёта';
        }
      });

      updateButton();
    })();
