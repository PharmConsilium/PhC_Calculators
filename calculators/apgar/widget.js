    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="apgar"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-apgar-form');
      var calcBtn = root.querySelector('#fc-calc-apgar-btn');
      var criteriaIds = ['appearance', 'pulse', 'grimace', 'activity', 'respiration'];

      function hideResult() {
        root.querySelector('#fc-calc-apgar-result').classList.add('fc-calc__result-wrap--hidden');
      }

      function getSelectedScores() {
        var scores = {};
        var complete = true;
        for (var i = 0; i < criteriaIds.length; i++) {
          var id = criteriaIds[i];
          var checked = form.querySelector('input[name="' + id + '"]:checked');
          if (!checked) {
            complete = false;
            continue;
          }
          scores[id] = Number(checked.value);
        }
        return { scores: scores, complete: complete };
      }

      function interpret(total) {
        if (total >= 7) return { category: 'normal', text: 'Нормальная оценка (7–10 баллов)' };
        if (total >= 4) return { category: 'intermediate', text: 'Промежуточная оценка (4–6 баллов)' };
        return { category: 'low', text: 'Низкая оценка (0–3 балла)' };
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

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var parsed = getSelectedScores();
        if (!parsed.complete) return;

        var total = 0;
        for (var i = 0; i < criteriaIds.length; i++) {
          total += parsed.scores[criteriaIds[i]];
        }

        var info = interpret(total);
        var resultNumber = root.querySelector('#fc-calc-apgar-result-number');
        resultNumber.textContent = String(total);
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + info.category;

        root.querySelector('#fc-calc-apgar-result-desc').textContent = info.text;
        root.querySelector('#fc-calc-apgar-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
