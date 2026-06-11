    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="improve-scale"]');
      if (!root) return;

      var CRITERIA = [
        { id: 'vteHistory', points: 3 },
        { id: 'thrombophilia', points: 2 },
        { id: 'limbParesis', points: 2 },
        { id: 'malignancy', points: 2 },
        { id: 'icu', points: 1 },
        { id: 'immobilization', points: 1 },
        { id: 'age60', points: 1 }
      ];

      var form = root.querySelector('#fc-calc-improve-scale-form');
      var calcBtn = root.querySelector('#fc-calc-improve-scale-btn');
      var resultWrap = root.querySelector('#fc-calc-improve-scale-result');
      var resultNumber = root.querySelector('#fc-calc-improve-scale-result-number');
      var resultDesc = root.querySelector('#fc-calc-improve-scale-result-desc');

      function interpret(total) {
        if (total >= 4) return { category: 'high', text: 'Высокий риск развития ТГВ/ТЭЛА' };
        if (total >= 2) return { category: 'moderate', text: 'Умеренный риск развития ТГВ/ТЭЛА' };
        return { category: 'low', text: 'Низкий риск развития ТГВ/ТЭЛА' };
      }

      function calculate() {
        var total = 0;
        CRITERIA.forEach(function (c) {
          var el = root.querySelector('#fc-calc-improve-scale-' + c.id);
          if (el && el.checked) total += c.points;
        });
        return { total: total, info: interpret(total) };
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function showResult() {
        var out = calculate();
        resultNumber.textContent = String(out.total);
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + out.info.category;
        resultDesc.textContent = out.info.text;
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      }

      form.addEventListener('change', hideResult);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        showResult();
      });

      calcBtn.disabled = false;
      calcBtn.classList.remove('fc-calc__btn--inactive');
    })();
