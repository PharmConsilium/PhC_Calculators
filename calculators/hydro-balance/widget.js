    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="hydro-balance"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-hydro-balance-form');
      var calcBtn = root.querySelector('#fc-calc-hydro-balance-btn');
      var weightInput = root.querySelector('#fc-calc-hydro-balance-weight');
      var ageInput = root.querySelector('#fc-calc-hydro-balance-age');
      var weightError = root.querySelector('#fc-calc-hydro-balance-weight-error');
      var ageError = root.querySelector('#fc-calc-hydro-balance-age-error');
      var surgerySelect = root.querySelector('#fc-calc-hydro-balance-surgery');
      var surgeryHoursWrap = root.querySelector('#fc-calc-hydro-balance-surgery-hours-wrap');
      var surgeryHoursInput = root.querySelector('#fc-calc-hydro-balance-surgery-hours');

      var volumeFields = [
        'fc-calc-hydro-balance-temp',
        'fc-calc-hydro-balance-rr',
        'fc-calc-hydro-balance-iv',
        'fc-calc-hydro-balance-enteral',
        'fc-calc-hydro-balance-diuresis',
        'fc-calc-hydro-balance-vomiting',
        'fc-calc-hydro-balance-drains',
        'fc-calc-hydro-balance-other',
      ];

      function parseWeight(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s) return null;
        if (!/^\d+(\.\d+)?$/.test(s)) return { error: true };
        var n = Number(s);
        if (!Number.isFinite(n) || n <= 0) return { error: true };
        if (n > 500) return { error: true, message: 'Укажите массу до 500 кг' };
        return n;
      }

      function parseAge(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s) return null;
        if (!/^\d+(\.\d+)?$/.test(s)) return { error: true };
        var n = Number(s);
        if (!Number.isFinite(n) || n < 0 || n > 120) return { error: true, message: 'Укажите возраст 0–120 лет' };
        return n;
      }

      function parseOptionalVolume(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s) return 0;
        if (!/^\d+(\.\d+)?$/.test(s)) return { error: true };
        var n = Number(s);
        if (!Number.isFinite(n) || n < 0) return { error: true };
        return n;
      }

      function parseOptionalNumber(value, fallback) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s) return fallback;
        var n = Number(s);
        return Number.isFinite(n) ? n : fallback;
      }

      function fpDaily(weightKg, ageYears) {
        var mlPerKg = 30;
        var method = '30 мл/кг/сут';
        if (ageYears >= 75) {
          mlPerKg = 20;
          method = '20 мл/кг/сут';
        } else if (ageYears >= 65) {
          mlPerKg = 25;
          method = '25 мл/кг/сут';
        }
        return { fp: Math.round(weightKg * mlPerKg), method: method };
      }

      function hyperthermiaLoss(tempC, weightKg) {
        if (tempC < 37.5) return 0;
        if (tempC < 38.5) return Math.round(3 * weightKg);
        if (tempC < 39.5) return Math.round(6 * weightKg);
        if (tempC < 40.5) return Math.round(9 * weightKg);
        if (tempC < 41.5) return Math.round(12 * weightKg);
        return Math.round(15 * weightKg);
      }

      function tachypneaLoss(weightKg, rr) {
        if (rr < 25) return 0;
        if (rr < 35) return Math.round(10 * weightKg);
        if (rr < 45) return Math.round(20 * weightKg);
        if (rr < 55) return Math.round(30 * weightKg);
        if (rr < 65) return Math.round(40 * weightKg);
        return Math.round(50 * weightKg);
      }

      function breathingLoss(mode) {
        return mode === 'ivl_unhumidified' ? 1000 : 0;
      }

      function surgeryLoss(weightKg, trauma, hours) {
        var rates = { none: 0, minimal: 2, medium: 4, heavy: 6 };
        var rate = rates[trauma] || 0;
        if (!rate || !hours || hours <= 0) return 0;
        return Math.round(rate * weightKg * hours);
      }

      function formatMl(n) {
        return String(Math.round(n)).replace('.', ',') + ' мл';
      }

      function hideResult() {
        root.querySelector('#fc-calc-hydro-balance-result').classList.add('fc-calc__result-wrap--hidden');
      }

      function updateSurgeryHoursField() {
        var needsHours = surgerySelect.value !== 'none';
        surgeryHoursWrap.classList.toggle('fc-calc__field--disabled', !needsHours);
        surgeryHoursInput.disabled = !needsHours;
        if (!needsHours) surgeryHoursInput.value = '';
      }

      function isReady() {
        var w = parseWeight(weightInput.value);
        var a = parseAge(ageInput.value);
        if (!w || w.error || !a || a.error) return false;
        if (surgerySelect.value !== 'none') {
          var h = parseOptionalVolume(surgeryHoursInput.value);
          if (h && h.error || !h || h <= 0) return false;
        }
        return true;
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        weightError.textContent = '';
        ageError.textContent = '';
        hideResult();

        var weight = parseWeight(weightInput.value);
        var age = parseAge(ageInput.value);
        if (!weight || weight.error) {
          weightError.textContent = weight && weight.message ? weight.message : 'Укажите массу тела';
          return;
        }
        if (!age || age.error) {
          ageError.textContent = age && age.message ? age.message : 'Укажите возраст';
          return;
        }

        var temp = parseOptionalNumber(root.querySelector('#fc-calc-hydro-balance-temp').value, 37);
        var rr = parseOptionalNumber(root.querySelector('#fc-calc-hydro-balance-rr').value, 20);
        var breathingMode = root.querySelector('#fc-calc-hydro-balance-breathing').value;
        var surgeryTrauma = surgerySelect.value;
        var surgeryHoursParsed = parseOptionalVolume(surgeryHoursInput.value);
        var surgeryHours = surgeryTrauma === 'none' ? 0 : surgeryHoursParsed;

        if (surgeryTrauma !== 'none' && (surgeryHoursParsed === null || surgeryHoursParsed.error || surgeryHours <= 0)) {
          root.querySelector('#fc-calc-hydro-balance-surgery-hours-error').textContent =
            'Укажите длительность операции';
          return;
        }

        var fpInfo = fpDaily(weight, age);
        var extrarenal = Math.round(0.4 * fpInfo.fp);
        var expectedDiuresis = Math.round(20 * weight);

        var iv = parseOptionalVolume(root.querySelector('#fc-calc-hydro-balance-iv').value);
        var enteral = parseOptionalVolume(root.querySelector('#fc-calc-hydro-balance-enteral').value);
        var diuresis = parseOptionalVolume(root.querySelector('#fc-calc-hydro-balance-diuresis').value);
        var vomiting = parseOptionalVolume(root.querySelector('#fc-calc-hydro-balance-vomiting').value);
        var drains = parseOptionalVolume(root.querySelector('#fc-calc-hydro-balance-drains').value);
        var other = parseOptionalVolume(root.querySelector('#fc-calc-hydro-balance-other').value);

        if ([iv, enteral, diuresis, vomiting, drains, other].some(function (v) { return v && v.error; })) return;

        var pathoAuto =
          extrarenal +
          hyperthermiaLoss(temp, weight) +
          tachypneaLoss(weight, rr) +
          breathingLoss(breathingMode) +
          surgeryLoss(weight, surgeryTrauma, surgeryHours);
        var pathoManual = (vomiting || 0) + (drains || 0) + (other || 0);
        var pathoMl = pathoAuto + pathoManual;

        var intake = (iv || 0) + (enteral || 0);
        var balance = Math.round(intake - (diuresis || 0) - pathoMl);

        var sign = balance > 0 ? '+' : '';
        var resultBalance = root.querySelector('#fc-calc-hydro-balance-result-balance');
        resultBalance.textContent = sign + String(balance).replace('.', ',') + ' мл';
        resultBalance.className = 'fc-calc__result-number';
        if (balance > 0) resultBalance.classList.add('fc-calc__result-number--positive');
        else if (balance < 0) resultBalance.classList.add('fc-calc__result-number--negative');

        var resultDesc = root.querySelector('#fc-calc-hydro-balance-result-desc');
        if (balance > 0) resultDesc.textContent = 'Положительный гидробаланс (избыток жидкости)';
        else if (balance < 0) resultDesc.textContent = 'Отрицательный гидробаланс (дефицит жидкости)';
        else resultDesc.textContent = 'Нулевой гидробаланс';

        root.querySelector('#fc-calc-hydro-balance-result-fp').textContent =
          formatMl(fpInfo.fp) + ' (' + fpInfo.method + ')';
        root.querySelector('#fc-calc-hydro-balance-result-diuresis').textContent = formatMl(expectedDiuresis);
        root.querySelector('#fc-calc-hydro-balance-result-physio').textContent = formatMl(extrarenal);
        var diuresisNote = root.querySelector('#fc-calc-hydro-balance-result-diuresis-note');
        var physioNote = root.querySelector('#fc-calc-hydro-balance-result-physio-note');
        if (diuresisNote) diuresisNote.textContent = '20 мл/кг м.т.';
        if (physioNote) physioNote.textContent = '0,4×ФП (внепочечные потери)';

        root.querySelector('#fc-calc-hydro-balance-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      weightInput.addEventListener('input', function () {
        hideResult();
        updateButton();
      });
      ageInput.addEventListener('input', function () {
        hideResult();
        updateButton();
      });

      surgerySelect.addEventListener('change', function () {
        hideResult();
        updateSurgeryHoursField();
        updateButton();
      });
      surgeryHoursInput.addEventListener('input', function () {
        hideResult();
        updateButton();
      });

      root.querySelector('#fc-calc-hydro-balance-breathing').addEventListener('change', hideResult);

      for (var i = 0; i < volumeFields.length; i++) {
        (function (id) {
          var input = root.querySelector('#' + id);
          if (!input) return;
          input.addEventListener('input', hideResult);
          input.addEventListener(
            'wheel',
            function (e) {
              if (document.activeElement === input) e.preventDefault();
            },
            { passive: false }
          );
        })(volumeFields[i]);
      }

      updateSurgeryHoursField();
      updateButton();
    })();
