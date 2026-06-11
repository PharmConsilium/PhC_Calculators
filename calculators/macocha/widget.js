    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="macocha"]');
      if (!root) return;

      var MAX_SCORE = 12;
      var CRITERIA = [
        { id: 'mallampati', points: 5 },
        { id: 'apnea', points: 2 },
        { id: 'cervical', points: 1 },
        { id: 'mouth', points: 1 },
        { id: 'coma', points: 1 },
        { id: 'hypoxia', points: 1 },
        { id: 'untrained', points: 1 }
      ];

      var form = root.querySelector('#fc-calc-maco-cha-form');
      var calcBtn = root.querySelector('#fc-calc-maco-cha-btn');
      var resultWrap = root.querySelector('#fc-calc-maco-cha-result');
      var resultNumber = root.querySelector('#fc-calc-maco-cha-result-number');
      var resultDesc = root.querySelector('#fc-calc-maco-cha-result-desc');

      function interpretMacocha(total) {
        if (total === 0) return 'легкая интубация';
        if (total === MAX_SCORE) return 'очень сложная интубация';
        if (total <= 3) return 'низкий риск сложной интубации';
        if (total <= 7) return 'умеренный риск сложной интубации';
        return 'высокий риск сложной интубации';
      }

      function calculate() {
        var total = 0;
        CRITERIA.forEach(function (c) {
          var el = root.querySelector('#fc-calc-maco-cha-' + c.id);
          if (el && el.checked) total += c.points;
        });
        return { total: total, interpretation: interpretMacocha(total) };
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function showResult() {
        var out = calculate();
        resultNumber.textContent = String(out.total);
        resultDesc.textContent = out.interpretation;
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
