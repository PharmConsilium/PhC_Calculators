    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="ciwa-ar"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-ciwa-ar-form');
      var calcBtn = root.querySelector('#fc-calc-ciwa-ar-btn');
      var resultWrap = root.querySelector('#fc-calc-ciwa-ar-result');
      var resultNumber = root.querySelector('#fc-calc-ciwa-ar-result-number');
      var resultDesc = root.querySelector('#fc-calc-ciwa-ar-result-desc');

      var itemIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function isComplete() {
        return itemIds.every(function (id) {
          return form.querySelector('input[name="' + id + '"]:checked');
        });
      }

      function updateButton() {
        var ok = isComplete();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function interpret(total) {
        if (total <= 9) {
          return { category: 'very-mild', text: 'Очень умеренный абстинентный синдром' };
        }
        if (total <= 15) {
          return { category: 'mild', text: 'Легкий абстинентный синдром' };
        }
        if (total <= 20) {
          return { category: 'moderate', text: 'Умеренный абстинентный синдром' };
        }
        return { category: 'severe', text: 'Тяжёлый абстинентный синдром' };
      }

      function calculate() {
        var total = 0;
        itemIds.forEach(function (id) {
          var checked = form.querySelector('input[name="' + id + '"]:checked');
          if (checked) total += Number(checked.getAttribute('data-score') || 0);
        });
        return { total: total, info: interpret(total) };
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!isComplete()) return;
        var out = calculate();
        resultNumber.textContent = String(out.total);
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + out.info.category;
        resultDesc.textContent = out.info.text;
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
