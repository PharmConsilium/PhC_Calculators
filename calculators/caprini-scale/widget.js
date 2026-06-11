    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="caprini-scale"]');
      if (!root) return;

      var RADIO_GROUPS = ['age', 'surgery'];

      var form = root.querySelector('#fc-calc-caprini-scale-form');
      var calcBtn = root.querySelector('#fc-calc-caprini-scale-btn');
      var formError = root.querySelector('#fc-calc-caprini-scale-form-error');
      var resultWrap = root.querySelector('#fc-calc-caprini-scale-result');
      var resultNumber = root.querySelector('#fc-calc-caprini-scale-result-number');
      var resultDesc = root.querySelector('#fc-calc-caprini-scale-result-desc');

      function pluralBalls(total) {
        var mod10 = total % 10;
        var mod100 = total % 100;
        if (mod10 === 1 && mod100 !== 11) return 'балл';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'балла';
        return 'баллов';
      }

      function interpret(total) {
        if (total >= 5) return { category: 'very-high', text: 'Очень высокий риск' };
        if (total >= 3) return { category: 'high', text: 'Высокий риск' };
        if (total === 2) return { category: 'moderate', text: 'Умеренный риск' };
        return { category: 'low', text: 'Низкий риск' };
      }

      function collectInput() {
        var input = {};
        var i;
        for (i = 0; i < RADIO_GROUPS.length; i++) {
          var name = RADIO_GROUPS[i];
          var checked = form.querySelector('input[name="' + name + '"]:checked');
          if (checked) input[name] = checked.value;
        }
        var boxes = form.querySelectorAll('input[type="checkbox"][name]');
        for (i = 0; i < boxes.length; i++) {
          if (boxes[i].checked) input[boxes[i].name] = true;
        }
        return input;
      }

      function isReady() {
        for (var i = 0; i < RADIO_GROUPS.length; i++) {
          if (!form.querySelector('input[name="' + RADIO_GROUPS[i] + '"]:checked')) return false;
        }
        return true;
      }

      function calculateTotal(input) {
        var total = 0;
        var checked = form.querySelectorAll('input:checked');
        for (var i = 0; i < checked.length; i++) {
          total += Number(checked[i].dataset.points || 0);
        }
        return total;
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        formError.textContent = '';
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        hideResult();
        if (!isReady()) {
          formError.textContent = 'Выберите возраст и плановое хирургическое вмешательство';
          return;
        }
        var total = calculateTotal();
        var info = interpret(total);
        resultNumber.textContent = String(total) + ' ' + pluralBalls(total);
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + info.category;
        resultDesc.textContent = info.text;
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
