    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="wells-scale"]');
      if (!root) return;

      var CRITERIA = [
        { id: 'history', points: 1.5 },
        { id: 'tachycardia', points: 1.5 },
        { id: 'immobility', points: 1.5 },
        { id: 'hemoptysis', points: 1 },
        { id: 'malignancy', points: 1 },
        { id: 'dvtSigns', points: 3 },
        { id: 'altDx', points: 3 }
      ];

      var form = root.querySelector('#fc-calc-wells-scale-form');
      var calcBtn = root.querySelector('#fc-calc-wells-scale-btn');
      var resultWrap = root.querySelector('#fc-calc-wells-scale-result');
      var resultNumber = root.querySelector('#fc-calc-wells-scale-result-number');
      var resultDesc = root.querySelector('#fc-calc-wells-scale-result-desc');

      function formatPoints(value) {
        return '+' + String(value).replace('.', ',');
      }

      function formatScore(total) {
        return String(total).replace('.', ',');
      }

      function pluralBalls(total) {
        var whole = Math.abs(Math.trunc(total));
        var mod10 = whole % 10;
        var mod100 = whole % 100;
        if (mod10 === 1 && mod100 !== 11) return 'балл';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'балла';
        return 'баллов';
      }

      function interpretThreeLevel(total) {
        var label;
        if (total <= 1) label = 'низкая';
        if (total > 2 && total < 7) label = 'средняя';
        if (total >= 5) label = 'высокая';
        if (label === 'высокая') return { category: 'high', label: label };
        if (label === 'средняя') return { category: 'moderate', label: label };
        if (label === 'низкая') return { category: 'low', label: label };
        return { category: 'moderate', label: 'средняя' };
      }

      function interpretTwoLevel(total) {
        if (total >= 5) return { label: 'ТЭЛА вероятна' };
        return { label: 'ТЭЛА маловероятна' };
      }

      function calculate() {
        var total = 0;
        CRITERIA.forEach(function (c) {
          var el = root.querySelector('#fc-calc-wells-scale-' + c.id);
          if (el && el.checked) total += c.points;
        });
        var three = interpretThreeLevel(total);
        var two = interpretTwoLevel(total);
        return {
          total: total,
          category: three.category,
          numberText: formatScore(total) + ' ' + pluralBalls(total),
          desc:
            'Клиническая вероятность ТЭЛА по трехуровневой шкале: ' +
            three.label +
            ', по двухуровневой шкале: ' +
            two.label
        };
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function showResult() {
        var out = calculate();
        resultNumber.textContent = out.numberText;
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + out.category;
        resultDesc.textContent = out.desc;
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
