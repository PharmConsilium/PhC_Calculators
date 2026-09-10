    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="lab-units"]');
      if (!root) return;

      var ANALYTES = __ANALYTES__;

      var form = root.querySelector('#fc-calc-lab-units-form');
      var filterInput = root.querySelector('#fc-calc-lab-units-filter');
      var select = root.querySelector('#fc-calc-lab-units-analyte');
      var pairHint = root.querySelector('#fc-calc-lab-units-pair');
      var valueInput = root.querySelector('#fc-calc-lab-units-value');
      var fromA = root.querySelector('#fc-calc-lab-units-from-a');
      var fromB = root.querySelector('#fc-calc-lab-units-from-b');
      var unitALabel = root.querySelector('#fc-calc-lab-units-unit-a-label');
      var unitBLabel = root.querySelector('#fc-calc-lab-units-unit-b-label');
      var calcBtn = root.querySelector('#fc-calc-lab-units-btn');
      var formError = root.querySelector('#fc-calc-lab-units-form-error');
      var resultWrap = root.querySelector('#fc-calc-lab-units-result');
      var resultValue = root.querySelector('#fc-calc-lab-units-result-value');
      var resultUnit = root.querySelector('#fc-calc-lab-units-result-unit');
      var resultDesc = root.querySelector('#fc-calc-lab-units-result-desc');

      var byId = {};
      for (var i = 0; i < ANALYTES.length; i++) {
        byId[ANALYTES[i].id] = ANALYTES[i];
      }

      function roundResult(value) {
        if (!Number.isFinite(value)) return value;
        var abs = Math.abs(value);
        if (abs === 0) return 0;
        if (abs >= 100) return Math.round(value * 100) / 100;
        if (abs >= 1) return Math.round(value * 1000) / 1000;
        return Math.round(value * 10000) / 10000;
      }

      function parseNonNegative(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
        var n = Number(s);
        return Number.isFinite(n) && n >= 0 ? n : null;
      }

      function formatNum(n) {
        if (!Number.isFinite(n)) return '—';
        var rounded = roundResult(n);
        var s = String(rounded);
        if (s.indexOf('e') >= 0 || s.indexOf('E') >= 0) {
          s = rounded.toFixed(4);
        }
        return s.replace('.', ',');
      }

      function currentAnalyte() {
        return byId[select.value] || null;
      }

      function fillSelect(filterText) {
        var q = String(filterText || '')
          .trim()
          .toLowerCase()
          .replace(/ё/g, 'е');
        var prev = select.value;
        select.innerHTML = '';
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Выберите исследование';
        select.appendChild(placeholder);

        var firstMatch = null;
        for (var i = 0; i < ANALYTES.length; i++) {
          var a = ANALYTES[i];
          var name = a.name.toLowerCase().replace(/ё/g, 'е');
          if (q && name.indexOf(q) < 0) continue;
          var opt = document.createElement('option');
          opt.value = a.id;
          opt.textContent = a.name;
          select.appendChild(opt);
          if (!firstMatch) firstMatch = a.id;
        }

        if (prev && byId[prev] && (!q || byId[prev].name.toLowerCase().replace(/ё/g, 'е').indexOf(q) >= 0)) {
          select.value = prev;
        } else if (q && firstMatch) {
          select.value = firstMatch;
        } else {
          select.value = '';
        }
        updateUnitsUi();
      }

      function updateUnitsUi() {
        var a = currentAnalyte();
        if (!a) {
          pairHint.textContent = 'Выберите исследование, чтобы увидеть пару единиц';
          unitALabel.textContent = 'Система SI';
          unitBLabel.textContent = 'Альтернативная система';
          return;
        }
        pairHint.textContent = a.unitA + ' ↔ ' + a.unitB;
        unitALabel.textContent = a.unitA;
        unitBLabel.textContent = a.unitB;
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        formError.textContent = '';
      }

      function isReady() {
        return !!currentAnalyte() && parseNonNegative(valueInput.value) != null;
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function convert() {
        var a = currentAnalyte();
        var value = parseNonNegative(valueInput.value);
        if (!a || value == null) throw new Error('Заполните поля');
        var from = fromB.checked ? 'B' : 'A';
        var resultRaw = from === 'A' ? value * a.factor : value / a.factor;
        var result = roundResult(resultRaw);
        var fromUnit = from === 'A' ? a.unitA : a.unitB;
        var toUnit = from === 'A' ? a.unitB : a.unitA;
        return {
          name: a.name,
          value: value,
          fromUnit: fromUnit,
          result: result,
          toUnit: toUnit,
        };
      }

      filterInput.addEventListener('input', function () {
        fillSelect(filterInput.value);
        hideResult();
        updateButton();
      });

      select.addEventListener('change', function () {
        updateUnitsUi();
        hideResult();
        updateButton();
      });

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
        hideResult();
        if (!isReady()) {
          formError.textContent = 'Выберите исследование и укажите значение';
          return;
        }
        try {
          var out = convert();
          resultValue.textContent = formatNum(out.result);
          resultUnit.textContent = out.toUnit;
          resultDesc.textContent =
            out.name + ': ' + formatNum(out.value) + ' ' + out.fromUnit + ' → ' + formatNum(out.result) + ' ' + out.toUnit;
          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        } catch (err) {
          formError.textContent = err.message || 'Ошибка пересчёта';
        }
      });

      fillSelect('');
      updateButton();
    })();
