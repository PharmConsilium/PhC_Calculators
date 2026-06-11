    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="fena"]');
      if (!root) return;

      var THRESHOLDS = { prerenalMax: 1, renalMax: 4 };
      var LIMITS = {
        serumNa: { min: 50, max: 500 },
        serumCr: { min: 10, max: 2000 },
        urineNa: { min: 10, max: 999 },
        urineCr: { min: 10, max: 99999 },
      };
      var INTERPRETATIONS = {
        prerenal: {
          title: 'Преренальная олигурия.',
          examples:
            'Например: гиповолемия, заболевания сердца, стеноз почечной артерии, сепсис (любая из причин, вызывающая снижение перфузии почек).',
          note: 'Следует помнить, что контраст-индуцированное поражение почек часто выглядит как преренальная олигурия.',
        },
        renal: {
          title: 'Почечная олигурия.',
          examples:
            'Например: острый тубулярный некроз, острый интерстициальный нефрит, гломерулонефриты и т. д.',
          note: null,
        },
        postrenal: {
          title: 'Постренальная (обструктивная) олигурия.',
          examples:
            'Например: доброкачественная гиперплазия предстательной железы, мочекаменная болезнь, двусторонняя обструкция мочеточника и т. д.',
          note: null,
        },
      };

      var form = root.querySelector('#fc-calc-fena-form');
      var calcBtn = root.querySelector('#fc-calc-fena-btn');
      var serumNaInput = root.querySelector('#fc-calc-fena-serum-na');
      var serumCrInput = root.querySelector('#fc-calc-fena-serum-cr');
      var urineNaInput = root.querySelector('#fc-calc-fena-urine-na');
      var urineCrInput = root.querySelector('#fc-calc-fena-urine-cr');
      var FENA_DECIMALS = 2;
      var serumNaError = root.querySelector('#fc-calc-fena-serum-na-error');
      var serumCrError = root.querySelector('#fc-calc-fena-serum-cr-error');
      var urineNaError = root.querySelector('#fc-calc-fena-urine-na-error');
      var urineCrError = root.querySelector('#fc-calc-fena-urine-cr-error');
      var formError = root.querySelector('#fc-calc-fena-form-error');
      var resultWrap = root.querySelector('#fc-calc-fena-result');
      var resultBody = root.querySelector('#fc-calc-fena-result-body');

      var FIELDS = [
        { input: serumNaInput, error: serumNaError, limits: LIMITS.serumNa, emptyMsg: 'Укажите натрий сыворотки' },
        { input: serumCrInput, error: serumCrError, limits: LIMITS.serumCr, emptyMsg: 'Укажите креатинин сыворотки' },
        { input: urineNaInput, error: urineNaError, limits: LIMITS.urineNa, emptyMsg: 'Укажите натрий мочи' },
        { input: urineCrInput, error: urineCrError, limits: LIMITS.urineCr, emptyMsg: 'Укажите креатинин мочи' },
      ];

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

      function rangeError(limits) {
        return 'Число не в корректном интервале ' + limits.min + ' - ' + limits.max;
      }

      function isFieldValid(field) {
        var value = parsePositive(field.input.value);
        if (value == null) return false;
        return value >= field.limits.min && value <= field.limits.max;
      }

      function updateFieldError(field, showEmptyError) {
        if (!hasInput(field.input.value)) {
          field.error.textContent = showEmptyError ? field.emptyMsg : '';
          return;
        }
        var value = parsePositive(field.input.value);
        if (value == null) {
          field.error.textContent = showEmptyError ? field.emptyMsg : '';
          return;
        }
        if (value < field.limits.min || value > field.limits.max) {
          field.error.textContent = rangeError(field.limits);
          return;
        }
        field.error.textContent = '';
      }

      function formatNum(n) {
        return String(n).replace('.', ',');
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        if (resultBody) resultBody.innerHTML = '';
      }

      function isReady() {
        return FIELDS.every(isFieldValid);
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function classifyFena(fena) {
        if (fena < THRESHOLDS.prerenalMax) return 'prerenal';
        if (fena <= THRESHOLDS.renalMax) return 'renal';
        return 'postrenal';
      }

      function calculate() {
        var serumNa = parsePositive(serumNaInput.value);
        var serumCr = parsePositive(serumCrInput.value);
        var urineNa = parsePositive(urineNaInput.value);
        var urineCr = parsePositive(urineCrInput.value);
        if (serumNa == null || serumCr == null || urineNa == null || urineCr == null) {
          throw new Error('Заполните все поля');
        }

        var fena = roundHalfUp((100 * serumCr * urineNa) / (serumNa * urineCr), FENA_DECIMALS);
        var category = classifyFena(fena);
        var interp = INTERPRETATIONS[category];

        return { fena: fena, category: category, interp: interp };
      }

      function renderResult(out) {
        if (!resultBody) return;
        var html =
          '<p class="fc-calc__fena-result-value">FENa = ' + formatNum(out.fena) + ' %</p>' +
          '<p class="fc-calc__fena-result-line"><strong>' + out.interp.title + '</strong></p>' +
          '<p class="fc-calc__fena-result-line">' + out.interp.examples + '</p>';
        if (out.interp.note) {
          html += '<p class="fc-calc__fena-result-line">' + out.interp.note + '</p>';
        }
        resultBody.innerHTML = html;
      }

      function refreshFields(showEmptyError) {
        FIELDS.forEach(function (field) {
          updateFieldError(field, showEmptyError);
        });
        updateButton();
      }

      form.addEventListener('change', function () {
        hideResult();
        refreshFields(false);
      });

      form.addEventListener('input', function () {
        hideResult();
        refreshFields(false);
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        formError.textContent = '';
        hideResult();
        refreshFields(true);

        if (!isReady()) return;

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
