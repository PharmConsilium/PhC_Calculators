    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="blood-gas"]');
      if (!root) return;

      var o2Form = root.querySelector('#fc-calc-blood-gas-o2-form');
      var oi2Form = root.querySelector('#fc-calc-blood-gas-oi2-form');
      var o2Btn = root.querySelector('#fc-calc-blood-gas-o2-btn');
      var oi2Btn = root.querySelector('#fc-calc-blood-gas-oi2-btn');
      var o2Error = root.querySelector('#fc-calc-blood-gas-o2-error');
      var oi2Error = root.querySelector('#fc-calc-blood-gas-oi2-error');
      var o2ResultWrap = root.querySelector('#fc-calc-blood-gas-o2-result');
      var oi2ResultWrap = root.querySelector('#fc-calc-blood-gas-oi2-result');
      var o2ResultNumber = root.querySelector('#fc-calc-blood-gas-o2-result-number');
      var o2ResultDesc = root.querySelector('#fc-calc-blood-gas-o2-result-desc');
      var o2ResultDetail = root.querySelector('#fc-calc-blood-gas-o2-result-detail');
      var oi2ResultNumber = root.querySelector('#fc-calc-blood-gas-oi2-result-number');
      var oi2ResultDesc = root.querySelector('#fc-calc-blood-gas-oi2-result-desc');

      var o2Inputs = {
        pao2: root.querySelector('#fc-calc-blood-gas-pao2'),
        fio2: root.querySelector('#fc-calc-blood-gas-fio2')
      };
      var oi2Inputs = {
        fio2: root.querySelector('#fc-calc-blood-gas-oi2-fio2'),
        pmean: root.querySelector('#fc-calc-blood-gas-oi2-pmean'),
        pao2: root.querySelector('#fc-calc-blood-gas-oi2-pao2')
      };

      function parseNumber(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
        var n = Number(s);
        return Number.isFinite(n) ? n : null;
      }

      function interpretPfRatio(index) {
        if (index >= 300) return 'Вариант нормы';
        if (index >= 200) return 'легкая';
        if (index >= 100) return 'средняя';
        return 'тяжелая';
      }

      function interpretPfMortality(index) {
        if (index >= 300) return null;
        if (index >= 200) return '27%';
        if (index >= 100) return '32%';
        return '45%';
      }

      function interpretPfDetail(index) {
        if (index >= 300) return 'Индекс оксигенации в пределах нормы (≈500 на воздухе).';
        var mortality = interpretPfMortality(index);
        if (index >= 200) return 'Степень тяжести ОРДС: легкая. Летальность ' + mortality + '.';
        if (index >= 100) return 'Степень тяжести ОРДС: средняя. Летальность ' + mortality + '.';
        return 'Степень тяжести ОРДС: тяжелая. Летальность ' + mortality + '.';
      }

      function interpretOi(index) {
        if (index <= 25) return 'вариант нормы';
        if (index <= 40) return 'летальный исход более 40%';
        return 'экстракорпоральная мембранная оксигенация';
      }

      function hideO2Result() {
        o2ResultWrap.classList.add('fc-calc__result-wrap--hidden');
        o2Error.textContent = '';
      }

      function hideOi2Result() {
        oi2ResultWrap.classList.add('fc-calc__result-wrap--hidden');
        oi2Error.textContent = '';
      }

      function validateO2(paO2, fio2) {
        if (fio2 < 21 || fio2 > 100) return 'FiO₂ должен быть от 21 до 100 %';
        if (paO2 < 0 || paO2 > 250) return 'paO₂ должен быть от 0 до 250 мм рт. ст.';
        if (paO2 === 0) return 'paO₂ не может быть 0';
        return '';
      }

      function isO2InRange(paO2, fio2) {
        return fio2 >= 21 && fio2 <= 100 && paO2 >= 0 && paO2 <= 250;
      }

      function validateOi2(fio2, pmean, paO2) {
        if (fio2 < 21 || fio2 > 100) return 'FiO₂ должен быть от 21 до 100 %';
        if (pmean < 0 || pmean > 50) return 'Pmean должен быть от 0 до 50 мм вод. ст.';
        if (paO2 < 0 || paO2 > 250) return 'paO₂ должен быть от 0 до 250 мм рт. ст.';
        if (paO2 === 0) return 'paO₂ не может быть 0';
        return '';
      }

      function isOi2InRange(fio2, pmean, paO2) {
        return (
          fio2 >= 21 && fio2 <= 100 &&
          pmean >= 0 && pmean <= 50 &&
          paO2 >= 0 && paO2 <= 250
        );
      }

      function updateO2Button() {
        var paO2 = parseNumber(o2Inputs.pao2.value);
        var fio2 = parseNumber(o2Inputs.fio2.value);
        var ok = paO2 != null && fio2 != null && isO2InRange(paO2, fio2);
        o2Btn.disabled = !ok;
        o2Btn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function updateOi2Button() {
        var fio2 = parseNumber(oi2Inputs.fio2.value);
        var pmean = parseNumber(oi2Inputs.pmean.value);
        var paO2 = parseNumber(oi2Inputs.pao2.value);
        var ok = fio2 != null && pmean != null && paO2 != null && isOi2InRange(fio2, pmean, paO2);
        oi2Btn.disabled = !ok;
        oi2Btn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      o2Form.addEventListener('input', function () {
        hideO2Result();
        updateO2Button();
      });
      o2Form.addEventListener('change', function () {
        hideO2Result();
        updateO2Button();
      });

      oi2Form.addEventListener('input', function () {
        hideOi2Result();
        updateOi2Button();
      });
      oi2Form.addEventListener('change', function () {
        hideOi2Result();
        updateOi2Button();
      });

      o2Form.addEventListener('submit', function (e) {
        e.preventDefault();
        var paO2 = parseNumber(o2Inputs.pao2.value);
        var fio2 = parseNumber(o2Inputs.fio2.value);
        if (paO2 == null || fio2 == null) {
          o2Error.textContent = 'Заполните PaO₂ и FiO₂';
          return;
        }
        var err = validateO2(paO2, fio2);
        if (err) {
          o2Error.textContent = err;
          return;
        }
        var index = Math.round(paO2 / (fio2 / 100));
        o2ResultNumber.textContent = String(index);
        o2ResultDesc.textContent = interpretPfRatio(index);
        o2ResultDetail.textContent = interpretPfDetail(index);
        o2ResultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      oi2Form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fio2 = parseNumber(oi2Inputs.fio2.value);
        var pmean = parseNumber(oi2Inputs.pmean.value);
        var paO2 = parseNumber(oi2Inputs.pao2.value);
        if (fio2 == null || pmean == null || paO2 == null) {
          oi2Error.textContent = 'Заполните FiO₂, Pmean и PaO₂';
          return;
        }
        var err = validateOi2(fio2, pmean, paO2);
        if (err) {
          oi2Error.textContent = err;
          return;
        }
        var index = Math.round((fio2 * pmean) / paO2);
        oi2ResultNumber.textContent = String(index);
        oi2ResultDesc.textContent = interpretOi(index);
        oi2ResultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      updateO2Button();
      updateOi2Button();
    })();
