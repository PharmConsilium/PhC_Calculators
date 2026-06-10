    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="mayo-coma"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-mayo-coma-form');
      var calcBtn = root.querySelector('#fc-calc-mayo-coma-btn');
      var criteriaIds = ['eye', 'motor', 'brainstem', 'respiration'];

      function hideResult() {
        root.querySelector('#fc-calc-mayo-coma-result').classList.add('fc-calc__result-wrap--hidden');
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
        if (total === 16) return { category: 'clear', text: 'Ясное сознание' };
        if (total === 15) return { category: 'somnolence', text: 'Сомноленция' };
        if (total >= 13) return { category: 'stupor', text: 'Оглушение' };
        if (total >= 9) return { category: 'sopor', text: 'Сопор' };
        if (total >= 1) return { category: 'coma', text: 'Кома' };
        return { category: 'brain-death', text: 'Смерть мозга' };
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

        var total =
          parsed.scores.eye +
          parsed.scores.motor +
          parsed.scores.brainstem +
          parsed.scores.respiration;
        var info = interpret(total);
        var resultNumber = root.querySelector('#fc-calc-mayo-coma-result-number');
        resultNumber.textContent = String(total);
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + info.category;

        root.querySelector('#fc-calc-mayo-coma-result-desc').textContent = info.text;
        root.querySelector('#fc-calc-mayo-coma-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
