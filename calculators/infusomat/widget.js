    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="infusomat"]');
      if (!root) return;

      var DRUG_CATALOG = [
        { id: 'none', label: 'Без препарата', forms: [] },
        {
          id: 'norepinephrine',
          label: 'Норадреналин',
          forms: [
            { label: '0,2% — 4 мл', percent: 0.2, volumeMl: 4 },
            { label: '0,2% — 8 мл', percent: 0.2, volumeMl: 8 }
          ]
        },
        {
          id: 'epinephrine',
          label: 'Адреналин (эпинефрин)',
          forms: [{ label: '0,1% — 1 мл', percent: 0.1, volumeMl: 1 }]
        },
        {
          id: 'dopamine',
          label: 'Допамин',
          forms: [
            { label: '0,5% — 5 мл', percent: 0.5, volumeMl: 5 },
            { label: '1% — 5 мл', percent: 1, volumeMl: 5 },
            { label: '2% — 5 мл', percent: 2, volumeMl: 5 },
            { label: '4% — 5 мл', percent: 4, volumeMl: 5 }
          ]
        },
        {
          id: 'dobutamine',
          label: 'Добутамин',
          forms: [
            { label: '125 mg ad 20 мл — 0,625%', percent: 0.625, volumeMl: 20 },
            { label: '250 mg ad 20 мл — 1,25%', percent: 1.25, volumeMl: 20 },
            { label: '500 mg ad 20 мл — 2,5%', percent: 2.5, volumeMl: 20 }
          ]
        },
        {
          id: 'phenylephrine',
          label: 'Мезатон (фенилэфрин)',
          forms: [{ label: '1% — 1 мл', percent: 1, volumeMl: 1 }]
        },
        {
          id: 'propofol',
          label: 'Пропофол',
          forms: [
            { label: '1% — 10 мл', percent: 1, volumeMl: 10 },
            { label: '1% — 20 мл', percent: 1, volumeMl: 20 },
            { label: '1% — 50 мл', percent: 1, volumeMl: 50 }
          ]
        },
        {
          id: 'midazolam',
          label: 'Мидазолам (дормикум)',
          forms: [
            { label: '0,1% — 2 мл', percent: 0.1, volumeMl: 2 },
            { label: '0,1% — 5 мл', percent: 0.1, volumeMl: 5 },
            { label: '0,5% — 2 мл', percent: 0.5, volumeMl: 2 },
            { label: '0,5% — 3 мл', percent: 0.5, volumeMl: 3 }
          ]
        },
        {
          id: 'diazepam',
          label: 'Диазепам (реланиум)',
          forms: [
            { label: '0,5% — 2 мл', percent: 0.5, volumeMl: 2 },
            { label: '0,5% — 10 мл', percent: 0.5, volumeMl: 10 }
          ]
        },
        {
          id: 'thiopental',
          label: 'Тиопентал',
          forms: [
            { label: '125 mg ad 20 мл — 0,625%', percent: 0.625, volumeMl: 20 },
            { label: '250 mg ad 20 мл — 1,25%', percent: 1.25, volumeMl: 20 },
            { label: '500 mg ad 20 мл — 2,5%', percent: 2.5, volumeMl: 20 },
            { label: '1000 mg ad 20 мл — 5%', percent: 5, volumeMl: 20 }
          ]
        }
      ];

      var drugSelect = root.querySelector('#fc-calc-infusomat-drug');
      var percentInput = root.querySelector('#fc-calc-infusomat-percent');
      var mgMlInput = root.querySelector('#fc-calc-infusomat-mgml');
      var volumeInput = root.querySelector('#fc-calc-infusomat-volume');
      var solventInput = root.querySelector('#fc-calc-infusomat-solvent');
      var doseMcgInput = root.querySelector('#fc-calc-infusomat-dose-mcg');
      var doseMgInput = root.querySelector('#fc-calc-infusomat-dose-mg');
      var weightInput = root.querySelector('#fc-calc-infusomat-weight');
      var mlHourOutput = root.querySelector('#fc-calc-infusomat-ml-hour');
      var mlMinOutput = root.querySelector('#fc-calc-infusomat-ml-min');
      var summaryEl = root.querySelector('#fc-calc-infusomat-summary');
      var presetsTitle = root.querySelector('#fc-calc-infusomat-form-presets-title');
      var presetsList = root.querySelector('#fc-calc-infusomat-form-presets');
      var chips = root.querySelectorAll('.fc-calc__inf-chip');

      var syncing = { percent: false, mgMl: false, doseMcg: false, doseMg: false };
      var activeFormIndex = -1;

      function roundHalfUp(value, decimals) {
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor + Number.EPSILON) / factor;
      }

      function isEmpty(value) {
        return !String(value || '').trim();
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

      function formatNum(n, decimals) {
        if (!Number.isFinite(n)) return '';
        var rounded = roundHalfUp(n, decimals);
        return String(rounded).replace('.', ',');
      }

      function normalizeInput(input) {
        if (isEmpty(input.value)) return;
        var n = parseNumber(input.value);
        if (n != null) input.value = formatNum(n, 4);
      }

      function getDrug() {
        var id = drugSelect.value;
        for (var i = 0; i < DRUG_CATALOG.length; i++) {
          if (DRUG_CATALOG[i].id === id) return DRUG_CATALOG[i];
        }
        return DRUG_CATALOG[0];
      }

      function applyForm(form, index) {
        if (!form) {
          syncing.percent = true;
          syncing.mgMl = true;
          percentInput.value = '';
          mgMlInput.value = '';
          volumeInput.value = '';
          syncing.percent = false;
          syncing.mgMl = false;
          activeFormIndex = -1;
          return;
        }
        syncing.percent = true;
        syncing.mgMl = true;
        percentInput.value = formatNum(form.percent, 4);
        mgMlInput.value = formatNum(form.percent * 10, 4);
        volumeInput.value = formatNum(form.volumeMl, 4);
        syncing.percent = false;
        syncing.mgMl = false;
        activeFormIndex = index;
        renderFormPresets();
      }

      function renderFormPresets() {
        var drug = getDrug();
        if (!presetsTitle || !presetsList) return;

        if (!drug.forms.length) {
          presetsTitle.textContent = '';
          presetsList.innerHTML = '';
          presetsList.classList.add('fc-calc__inf-form-presets-list--hidden');
          return;
        }

        presetsTitle.textContent = 'Формы препарата ' + drug.label + ':';
        presetsList.classList.remove('fc-calc__inf-form-presets-list--hidden');
        presetsList.innerHTML = drug.forms
          .map(function (form, index) {
            var active = index === activeFormIndex ? ' fc-calc__inf-form-preset--active' : '';
            return (
              '<li><button type="button" class="fc-calc__inf-form-preset' +
              active +
              '" data-form-index="' +
              index +
              '">' +
              form.label +
              '</button></li>'
            );
          })
          .join('');

        presetsList.querySelectorAll('.fc-calc__inf-form-preset').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var idx = Number(btn.getAttribute('data-form-index'));
            var form = drug.forms[idx];
            if (!form) return;
            applyForm(form, idx);
            recalculate();
          });
        });
      }

      function resetEnteredData() {
        applyForm(null, -1);
        solventInput.value = '0';
        setChipActive(0);
        syncing.doseMcg = true;
        syncing.doseMg = true;
        doseMcgInput.value = '1';
        doseMgInput.value = '0,06';
        syncing.doseMcg = false;
        syncing.doseMg = false;
        weightInput.value = '70';
        renderFormPresets();
        recalculate();
      }

      function onDrugChange() {
        resetEnteredData();
      }

      function syncPercentFromMgMl() {
        if (syncing.percent) return;
        if (isEmpty(mgMlInput.value)) {
          syncing.mgMl = true;
          percentInput.value = '';
          syncing.mgMl = false;
          activeFormIndex = -1;
          renderFormPresets();
          return;
        }
        var mgMl = parseNumber(mgMlInput.value);
        if (mgMl == null) return;
        syncing.mgMl = true;
        percentInput.value = formatNum(mgMl / 10, 4);
        syncing.mgMl = false;
        activeFormIndex = -1;
        renderFormPresets();
      }

      function syncMgMlFromPercent() {
        if (syncing.mgMl) return;
        if (isEmpty(percentInput.value)) {
          syncing.percent = true;
          mgMlInput.value = '';
          syncing.percent = false;
          activeFormIndex = -1;
          renderFormPresets();
          return;
        }
        var percent = parseNumber(percentInput.value);
        if (percent == null) return;
        syncing.percent = true;
        mgMlInput.value = formatNum(percent * 10, 4);
        syncing.percent = false;
        activeFormIndex = -1;
        renderFormPresets();
      }

      function syncDoseMgFromMcg() {
        if (syncing.doseMcg) return;
        syncing.doseMg = true;
        var mcg = parseNumber(doseMcgInput.value);
        doseMgInput.value = mcg != null ? formatNum(mcg * 0.06, 4) : '';
        syncing.doseMg = false;
      }

      function syncDoseMcgFromMg() {
        if (syncing.doseMg) return;
        syncing.doseMcg = true;
        var mg = parseNumber(doseMgInput.value);
        doseMcgInput.value = mg != null ? formatNum(mg / 0.06, 4) : '';
        syncing.doseMcg = false;
      }

      function finalConcentration(stockMgMl, drugVolumeMl, solventMl) {
        var drugVol = drugVolumeMl || 0;
        var solvent = solventMl || 0;
        var stock = stockMgMl || 0;
        var totalVolume = drugVol + solvent;
        if (totalVolume <= 0 || stock <= 0 || drugVol <= 0) {
          return { mgMl: 0, percent: 0, totalVolumeMl: totalVolume };
        }
        var totalMg = stock * drugVol;
        var mgMl = totalMg / totalVolume;
        return {
          mgMl: roundHalfUp(mgMl, 4),
          percent: roundHalfUp(mgMl / 10, 4),
          totalVolumeMl: roundHalfUp(totalVolume, 2)
        };
      }

      function infusionRateMlPerHour(doseMcgKgMin, weightKg, finalMgMl) {
        if (!(doseMcgKgMin > 0) || !(weightKg > 0) || !(finalMgMl > 0)) return 0;
        return roundHalfUp((doseMcgKgMin * weightKg * 60) / (finalMgMl * 1000), 4);
      }

      function setChipActive(totalMl) {
        chips.forEach(function (chip) {
          var target = Number(chip.getAttribute('data-total') || '0');
          chip.classList.toggle('fc-calc__inf-chip--active', target === totalMl);
        });
      }

      function recalculate() {
        var stockMgMl = parseNumber(mgMlInput.value) || 0;
        var drugVolumeMl = parseNumber(volumeInput.value) || 0;
        var solventMl = parseNumber(solventInput.value) || 0;
        var doseMcgKgMin = parseNumber(doseMcgInput.value) || 0;
        var weightKg = parsePositive(weightInput.value);

        var final = finalConcentration(stockMgMl, drugVolumeMl, solventMl);
        var mlPerHour = weightKg ? infusionRateMlPerHour(doseMcgKgMin, weightKg, final.mgMl) : 0;
        var mlPerMin = mlPerHour > 0 ? roundHalfUp(mlPerHour / 60, 4) : 0;

        mlHourOutput.value = formatNum(mlPerHour, 2);
        mlMinOutput.value = formatNum(mlPerMin, 3);
        summaryEl.textContent =
          'Для получившегося ' +
          formatNum(final.percent, 2) +
          '% (' +
          formatNum(final.mgMl, 2) +
          ' мг/мл) раствора объёмом ' +
          formatNum(final.totalVolumeMl, 0) +
          ' мл';
      }

      drugSelect.addEventListener('change', onDrugChange);

      percentInput.addEventListener('input', function () {
        syncMgMlFromPercent();
        recalculate();
      });

      percentInput.addEventListener('blur', function () {
        normalizeInput(percentInput);
        syncMgMlFromPercent();
        recalculate();
      });

      mgMlInput.addEventListener('input', function () {
        syncPercentFromMgMl();
        recalculate();
      });

      mgMlInput.addEventListener('blur', function () {
        normalizeInput(mgMlInput);
        syncPercentFromMgMl();
        recalculate();
      });

      volumeInput.addEventListener('input', function () {
        activeFormIndex = -1;
        renderFormPresets();
        setChipActive(-1);
        recalculate();
      });

      solventInput.addEventListener('input', function () {
        setChipActive(-1);
        recalculate();
      });

      doseMcgInput.addEventListener('input', function () {
        syncDoseMgFromMcg();
        recalculate();
      });

      doseMgInput.addEventListener('input', function () {
        syncDoseMcgFromMg();
        recalculate();
      });

      weightInput.addEventListener('input', recalculate);

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var totalMl = Number(chip.getAttribute('data-total') || '0');
          var drugVol = parseNumber(volumeInput.value) || 0;
          var solvent = totalMl > 0 ? Math.max(0, roundHalfUp(totalMl - drugVol, 2)) : 0;
          solventInput.value = formatNum(solvent, 2);
          setChipActive(totalMl);
          recalculate();
        });
      });

      resetEnteredData();
    })();
