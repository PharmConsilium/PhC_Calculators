    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="geneva-pe"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-geneva-pe-form');
      var calcBtn = root.querySelector('#fc-calc-geneva-pe-btn');
      var criteriaIds = ['age', 'history', 'surgery', 'malignancy', 'legPain', 'hemoptysis', 'edema', 'heartRate'];

      function hideResult() {
        root.querySelector('#fc-calc-geneva-pe-result').classList.add('fc-calc__result-wrap--hidden');
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
          scores[id] = Number(checked.getAttribute('data-points'));
        }
        return { scores: scores, complete: complete };
      }

      function interpret(total) {
        if (total >= 11) return 'Высокая клиническая вероятность';
        if (total >= 4 && total <= 10) return 'Промежуточная клиническая вероятность';
        return 'Низкая клиническая вероятность';
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

        root.querySelector('#fc-calc-geneva-pe-result-number').textContent = String(total);
        root.querySelector('#fc-calc-geneva-pe-result-desc').textContent = interpret(total);
        root.querySelector('#fc-calc-geneva-pe-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
