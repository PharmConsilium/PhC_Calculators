    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="glasgow-coma"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-glasgow-coma-form');
      var calcBtn = root.querySelector('#fc-calc-glasgow-coma-btn');
      var criteriaIds = ['eye', 'motor', 'verbal'];

      function hideResult() {
        root.querySelector('#fc-calc-glasgow-coma-result').classList.add('fc-calc__result-wrap--hidden');
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
        if (total === 15) return { category: 'normal', text: 'Норма (15 баллов)' };
        if (total >= 13) return { category: 'mild', text: 'Лёгкое нарушение сознания (13–14 баллов)' };
        if (total >= 9) return { category: 'moderate', text: 'Умеренное нарушение сознания (9–12 баллов)' };
        return { category: 'severe', text: 'Тяжёлое нарушение сознания, кома (3–8 баллов)' };
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

        var total = parsed.scores.eye + parsed.scores.verbal + parsed.scores.motor;
        var info = interpret(total);
        var resultNumber = root.querySelector('#fc-calc-glasgow-coma-result-number');
        resultNumber.textContent = String(total);
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + info.category;

        root.querySelector('#fc-calc-glasgow-coma-result-desc').textContent = info.text;
        root.querySelector('#fc-calc-glasgow-coma-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
