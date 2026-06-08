    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="wells-pe"]');
      if (!root) return;

      var CRITERIA = [
        { id: 'dvt', points: 3 },
        { id: 'altDx', points: 3 },
        { id: 'tachycardia', points: 1.5 },
        { id: 'immobility', points: 1.5 },
        { id: 'history', points: 1.5 },
        { id: 'hemoptysis', points: 1 },
        { id: 'malignancy', points: 1 }
      ];

      var form = root.querySelector('#fc-calc-wells-pe-form');
      var calcBtn = root.querySelector('#fc-calc-wells-pe-btn');
      var resultWrap = root.querySelector('#fc-calc-wells-pe-result');
      var resultNumber = root.querySelector('#fc-calc-wells-pe-result-number');
      var resultDesc = root.querySelector('#fc-calc-wells-pe-result-desc');

      function formatNum(n) {
        return String(n).replace('.', ',');
      }

      function interpret(total) {
        if (total > 6) return 'Высокая вероятность';
        if (total >= 2 && total <= 6) return 'Умеренная вероятность';
        return 'Низкая вероятность';
      }

      function getInput() {
        var input = {};
        CRITERIA.forEach(function (c) {
          var el = root.querySelector('#fc-calc-wells-pe-' + c.id);
          input[c.id] = el ? el.checked : false;
        });
        return input;
      }

      function calculate() {
        var total = 0;
        CRITERIA.forEach(function (c) {
          var el = root.querySelector('#fc-calc-wells-pe-' + c.id);
          if (el && el.checked) total += c.points;
        });
        return { total: total, interpretation: interpret(total) };
      }

      function showResult() {
        var out = calculate();
        resultNumber.textContent = formatNum(out.total);
        resultDesc.textContent = out.interpretation;
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      form.addEventListener('change', hideResult);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        showResult();
      });

      calcBtn.disabled = false;
      calcBtn.classList.remove('fc-calc__btn--inactive');
    })();
