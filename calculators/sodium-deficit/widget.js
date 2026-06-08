    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="sodium-deficit"]');
      if (!root) return;

      var GENDER_COEF = { female: 0.5, male: 0.6 };
      var DEFAULT_DESIRED = 140;

      var form = root.querySelector('#fc-calc-sodium-deficit-form');
      var calcBtn = root.querySelector('#fc-calc-sodium-deficit-btn');
      var weightInput = root.querySelector('#fc-calc-sodium-deficit-weight');
      var serumInput = root.querySelector('#fc-calc-sodium-deficit-serum');
      var desiredInput = root.querySelector('#fc-calc-sodium-deficit-desired');
      var serumUnit = root.querySelector('#fc-calc-sodium-deficit-serum-unit');
      var desiredUnit = root.querySelector('#fc-calc-sodium-deficit-desired-unit');
      var decimalsSelect = root.querySelector('#fc-calc-sodium-deficit-decimals');
      var weightError = root.querySelector('#fc-calc-sodium-deficit-weight-error');
      var serumError = root.querySelector('#fc-calc-sodium-deficit-serum-error');
      var desiredError = root.querySelector('#fc-calc-sodium-deficit-desired-error');
      var formError = root.querySelector('#fc-calc-sodium-deficit-form-error');
      var resultWrap = root.querySelector('#fc-calc-sodium-deficit-result');
      var resultNumber = root.querySelector('#fc-calc-sodium-deficit-result-value');
      var resultDesc = root.querySelector('#fc-calc-sodium-deficit-result-desc');

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

      function formatNum(n, decimals) {
        return String(n).replace('.', ',');
      }

      function getGender() {
        var checked = form.querySelector('input[name="gender"]:checked');
        return checked ? checked.value : null;
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function isReady() {
        return getGender() && parsePositive(weightInput.value) && parsePositive(serumInput.value);
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function calculate() {
        var gender = getGender();
        var genderCoef = GENDER_COEF[gender];
        var weight = parsePositive(weightInput.value);
        var serum = parsePositive(serumInput.value);
        var desiredRaw = desiredInput.value;
        var desired =
          String(desiredRaw || '').trim() === '' ? DEFAULT_DESIRED : parsePositive(desiredRaw);

        if (!genderCoef || weight == null || serum == null || desired == null) {
          throw new Error('Заполните все поля');
        }

        var sUnit = serumUnit ? serumUnit.value : 'mEq/L';
        var dUnit = desiredUnit ? desiredUnit.value : 'mEq/L';
        var weightKg = weight;
        var serumMeqL = serum;
        var desiredMeqL = desired;
        var decimals = decimalsSelect ? Number(decimalsSelect.value) : 2;
        if (!Number.isFinite(decimals) || decimals < 0 || decimals > 3) decimals = 2;

        var tbw = genderCoef * weightKg;
        var delta = desiredMeqL - serumMeqL;
        var deficit = roundHalfUp(tbw * delta, decimals);

        return {
          deficit: deficit,
          decimals: decimals,
          delta: delta,
          tbw: roundHalfUp(tbw, decimals),
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
        weightError.textContent = '';
        serumError.textContent = '';
        desiredError.textContent = '';
        formError.textContent = '';
        hideResult();

        if (!isReady()) {
          if (!getGender()) formError.textContent = 'Выберите пол';
          if (!parsePositive(weightInput.value)) weightError.textContent = 'Укажите нормальный вес';
          if (!parsePositive(serumInput.value)) serumError.textContent = 'Укажите натрий сыворотки';
          return;
        }

        if (desiredInput.value && !parsePositive(desiredInput.value)) {
          desiredError.textContent = 'Укажите корректный желаемый натрий';
          return;
        }

        try {
          var out = calculate();
          resultNumber.textContent = formatNum(out.deficit, out.decimals) + ' mEq';
          resultDesc.textContent =
            out.delta <= 0
              ? 'Желаемый натрий не выше натрия сыворотки — дефицит не рассчитывается'
              : 'ОКВО ≈ ' + formatNum(out.tbw, out.decimals) + ' л';
          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        } catch (err) {
          formError.textContent = err.message || 'Ошибка расчёта';
        }
      });

      updateButton();
    })();
