    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="pesi-pe"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-pesi-pe-form');
      var calcBtn = root.querySelector('#fc-calc-pesi-pe-btn');
      var ageInput = root.querySelector('#fc-calc-pesi-pe-age');
      var criteriaIds = [
        'sex', 'malignancy', 'chf', 'lungDisease', 'heartRate', 'systolicBp',
        'respiratoryRate', 'temperature', 'mentalStatus', 'oxygenSat'
      ];

      function hideResult() {
        root.querySelector('#fc-calc-pesi-pe-result').classList.add('fc-calc__result-wrap--hidden');
      }

      function parseAge() {
        var s = String(ageInput.value || '').trim().replace(',', '.');
        if (!s || !/^\d+$/.test(s)) return null;
        var n = Number(s);
        if (!Number.isFinite(n) || n < 0 || n > 120) return null;
        return n;
      }

      function getSelectedScores() {
        var scores = {};
        var complete = parseAge() !== null;

        for (var i = 0; i < criteriaIds.length; i++) {
          var id = criteriaIds[i];
          var checked = form.querySelector('input[name="' + id + '"]:checked');
          if (!checked) {
            complete = false;
            continue;
          }
          scores[id] = Number(checked.getAttribute('data-points'));
        }

        return { scores: scores, complete: complete, age: parseAge() };
      }

      function interpret(total) {
        if (total <= 65) return 'Класс I. Очень низкий риск 30-дневной летальности (0–1,6%)';
        if (total <= 85) return 'Класс II. Низкий риск летальности (1,7–3,5%)';
        if (total <= 105) return 'Класс III. Умеренный риск летальности (3,2–7,1%)';
        if (total <= 125) return 'Класс IV. Высокий риск летальности (4,0–11,4%)';
        return 'Класс V. Очень высокий риск летальности (10,0–24,5%)';
      }

      function updateButton() {
        var ok = getSelectedScores().complete;
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('input', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var parsed = getSelectedScores();
        if (!parsed.complete || parsed.age === null) return;

        var total = parsed.age;
        for (var i = 0; i < criteriaIds.length; i++) {
          total += parsed.scores[criteriaIds[i]];
        }

        root.querySelector('#fc-calc-pesi-pe-result-number').textContent = String(total);
        root.querySelector('#fc-calc-pesi-pe-result-desc').textContent = interpret(total);
        root.querySelector('#fc-calc-pesi-pe-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
