    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="sodium-deficit"]');
      if (!root) return;

      var TBW_COEF = {
        male: { '0-17': 0.6, '18-59': 0.6, '60+': 0.5 },
        female: { '0-17': 0.6, '18-59': 0.5, '60+': 0.45 },
      };
      var DEFAULT_DESIRED = 140;
      var SERUM_NA_NORMAL_MIN = 135;
      var SERUM_NA_NORMAL_MAX = 145;
      var CORRECTION_RATE = 0.5;
      var SOLUTIONS = [
        { label: 'Рингер лактат', naMmolL: 129.3 },
        { label: 'NaCl 0.45%', naMmolL: 76.95 },
        { label: 'NaCl 0.9%', naMmolL: 153.9 },
        { label: 'NaCl 3%', naMmolL: 513 },
      ];

      var form = root.querySelector('#fc-calc-sodium-deficit-form');
      var calcBtn = root.querySelector('#fc-calc-sodium-deficit-btn');
      var weightInput = root.querySelector('#fc-calc-sodium-deficit-weight');
      var serumInput = root.querySelector('#fc-calc-sodium-deficit-serum');
      var desiredInput = root.querySelector('#fc-calc-sodium-deficit-desired');
      var decimalsSelect = root.querySelector('#fc-calc-sodium-deficit-decimals');
      var weightError = root.querySelector('#fc-calc-sodium-deficit-weight-error');
      var serumError = root.querySelector('#fc-calc-sodium-deficit-serum-error');
      var desiredError = root.querySelector('#fc-calc-sodium-deficit-desired-error');
      var formError = root.querySelector('#fc-calc-sodium-deficit-form-error');
      var resultWrap = root.querySelector('#fc-calc-sodium-deficit-result');
      var resultSummary = root.querySelector('#fc-calc-sodium-deficit-result-summary');
      var resultSolutions = root.querySelector('#fc-calc-sodium-deficit-result-solutions');

      if (desiredInput && !desiredInput.value) {
        desiredInput.value = String(DEFAULT_DESIRED);
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

      function formatNum(n) {
        return String(n).replace('.', ',');
      }

      function getGender() {
        var checked = form.querySelector('input[name="gender"]:checked');
        return checked ? checked.value : null;
      }

      function getAgeBand() {
        var checked = form.querySelector('input[name="ageBand"]:checked');
        return checked ? checked.value : null;
      }

      function getTbwCoef(gender, ageBand) {
        if (!gender || !ageBand || !TBW_COEF[gender]) return null;
        var coef = TBW_COEF[gender][ageBand];
        return coef == null ? null : coef;
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        if (resultSummary) resultSummary.innerHTML = '';
        if (resultSolutions) {
          resultSolutions.innerHTML = '';
          resultSolutions.hidden = true;
        }
      }

      function isReady() {
        return getGender() && getAgeBand() && parsePositive(weightInput.value) && parsePositive(serumInput.value);
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function buildSolutions(deficit, hours) {
        return SOLUTIONS.map(function (solution) {
          var volumeMl = Math.round((deficit / solution.naMmolL) * 1000);
          var rateMlH = hours > 0 ? Math.round(volumeMl / hours) : 0;
          return {
            label: solution.label,
            naMmolL: solution.naMmolL,
            volumeMl: volumeMl,
            rateMlH: rateMlH,
          };
        });
      }

      function calculate() {
        var gender = getGender();
        var ageBand = getAgeBand();
        var coef = getTbwCoef(gender, ageBand);
        var weight = parsePositive(weightInput.value);
        var naP = parsePositive(serumInput.value);
        var desiredRaw = desiredInput.value;
        var naT =
          String(desiredRaw || '').trim() === '' ? DEFAULT_DESIRED : parsePositive(desiredRaw);

        if (coef == null || weight == null || naP == null || naT == null) {
          throw new Error('Заполните все поля');
        }

        var decimals = decimalsSelect ? Number(decimalsSelect.value) : 2;
        if (!Number.isFinite(decimals) || decimals < 0 || decimals > 3) decimals = 2;

        var tbw = coef * weight;
        var delta = naT - naP;
        var deficit = roundHalfUp(tbw * delta, decimals);
        var rateMmolH = Math.round(CORRECTION_RATE * tbw);
        var hours = delta > 0 && rateMmolH > 0 ? Math.round(deficit / rateMmolH) : 0;
        var isHyponatremia = naP < SERUM_NA_NORMAL_MIN;
        var statusMessage;

        if (delta <= 0) {
          statusMessage = 'NaT не выше NaP — коррекция дефицита натрия не требуется.';
        } else if (isHyponatremia) {
          statusMessage =
            'Гипонатриемия (норма ' + SERUM_NA_NORMAL_MIN + '–' + SERUM_NA_NORMAL_MAX +
            ' ммоль/л). Требуется коррекция дефицита натрия.';
        } else {
          statusMessage =
            'Натрий сыворотки в пределах нормы (' + SERUM_NA_NORMAL_MIN + '–' + SERUM_NA_NORMAL_MAX +
            ' ммоль/л). Требуется коррекция до целевого уровня.';
        }

        return {
          naP: naP,
          naT: naT,
          delta: roundHalfUp(delta, decimals),
          deficit: deficit,
          tbw: roundHalfUp(tbw, decimals),
          coef: coef,
          rateMmolH: rateMmolH,
          hours: hours,
          statusMessage: statusMessage,
          solutions: delta > 0 && hours > 0 ? buildSolutions(deficit, hours) : [],
        };
      }

      function renderResult(out) {
        if (!resultSummary) return;

        if (out.delta <= 0) {
          resultSummary.innerHTML = '<p class="fc-calc__na-result-line">' + out.statusMessage + '</p>';
          if (resultSolutions) resultSolutions.hidden = true;
          return;
        }

        resultSummary.innerHTML =
          '<p class="fc-calc__na-result-line">' + out.statusMessage + '</p>' +
          '<p class="fc-calc__na-result-line">Для повышения натрия с ' + formatNum(out.naP) + ' до ' +
          formatNum(out.naT) + ' ммоль/л (Δ <strong>' + formatNum(out.delta) +
          '</strong>) требуется <strong>' + formatNum(out.deficit) + ' ммоль</strong> натрия</p>' +
          '<p class="fc-calc__na-result-line">Время коррекции со скоростью ' + formatNum(CORRECTION_RATE) +
          ' ммоль/л/ч (' + formatNum(out.rateMmolH) + ' ммоль/ч) <strong>' + formatNum(out.hours) + ' ч</strong></p>';

        if (!resultSolutions) return;
        if (!out.solutions.length) {
          resultSolutions.hidden = true;
          return;
        }

        resultSolutions.hidden = false;
        resultSolutions.innerHTML = out.solutions.map(function (solution) {
          return '<p class="fc-calc__na-result-solution">' +
            solution.label + ' (Na ' + formatNum(solution.naMmolL) + ' ммоль/л), объём <strong>' +
            formatNum(solution.volumeMl) + ' мл</strong>; скорость введения: <strong>' +
            formatNum(solution.rateMlH) + ' мл/ч</strong></p>';
        }).join('');
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
        weightError.textContent = '';
        serumError.textContent = '';
        desiredError.textContent = '';
        formError.textContent = '';
        hideResult();

        if (!isReady()) {
          if (!getGender()) formError.textContent = 'Выберите пол';
          if (!getAgeBand()) formError.textContent = 'Выберите возраст';
          if (!parsePositive(weightInput.value)) weightError.textContent = 'Укажите нормальный вес';
          if (!parsePositive(serumInput.value)) serumError.textContent = 'Укажите NaP, ммоль/л';
          return;
        }

        if (desiredInput.value && !parsePositive(desiredInput.value)) {
          desiredError.textContent = 'Укажите корректный NaT, ммоль/л';
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
