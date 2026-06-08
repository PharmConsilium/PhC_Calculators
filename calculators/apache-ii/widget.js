    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="apache-ii"]');
      if (!root) return;

      var MORTALITY = [
        { min: 0, max: 4, nonoperative: 4, postoperative: 1 },
        { min: 5, max: 9, nonoperative: 8, postoperative: 3 },
        { min: 10, max: 14, nonoperative: 15, postoperative: 7 },
        { min: 15, max: 19, nonoperative: 24, postoperative: 12 },
        { min: 20, max: 24, nonoperative: 40, postoperative: 30 },
        { min: 25, max: 29, nonoperative: 55, postoperative: 35 },
        { min: 30, max: 34, nonoperative: 73, postoperative: 73 },
        { min: 35, max: 100, nonoperative: 85, postoperative: 88 }
      ];

      var physioIds = [
        'temperature', 'map', 'heartRate', 'respiratoryRate', 'oxygenation', 'ph',
        'sodium', 'potassium', 'creatinine', 'hematocrit', 'wbc'
      ];

      var form = root.querySelector('#fc-calc-apache-ii-form');
      var calcBtn = root.querySelector('#fc-calc-apache-ii-btn');
      var resultWrap = root.querySelector('#fc-calc-apache-ii-result');
      var resultNumber = root.querySelector('#fc-calc-apache-ii-result-number');
      var mortalityEl = root.querySelector('#fc-calc-apache-ii-mortality');
      var arfCheckbox = root.querySelector('#fc-calc-apache-ii-arf');

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        mortalityEl.classList.add('fc-calc__apache-mortality--hidden');
      }

      function getMortality(total) {
        for (var i = 0; i < MORTALITY.length; i++) {
          var r = MORTALITY[i];
          if (total >= r.min && total <= r.max) return r;
        }
        return null;
      }

      function getSelectPoints(id) {
        var el = root.querySelector('#fc-calc-apache-ii-' + id);
        if (!el || !el.value) return null;
        var opt = el.options[el.selectedIndex];
        return opt ? Number(opt.getAttribute('data-points')) : null;
      }

      function isReady() {
        for (var i = 0; i < physioIds.length; i++) {
          if (getSelectPoints(physioIds[i]) == null) return false;
        }
        if (getSelectPoints('gcs') == null) return false;
        if (getSelectPoints('age') == null) return false;
        if (!form.querySelector('input[name="chronic"]:checked')) return false;
        return true;
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function calculate() {
        var total = 0;
        for (var i = 0; i < physioIds.length; i++) {
          var id = physioIds[i];
          var pts = getSelectPoints(id);
          if (pts == null) return null;
          if (id === 'creatinine' && arfCheckbox && arfCheckbox.checked) pts *= 2;
          total += pts;
        }
        total += getSelectPoints('gcs') || 0;
        total += getSelectPoints('age') || 0;
        var chronic = form.querySelector('input[name="chronic"]:checked');
        total += chronic ? Number(chronic.getAttribute('data-points')) : 0;
        return total;
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var total = calculate();
        if (total == null) return;

        var mort = getMortality(total);
        resultNumber.textContent = String(total);

        if (mort) {
          if (mort.nonoperative === mort.postoperative) {
            mortalityEl.innerHTML =
              '<p><strong>Приблизительная летальность:</strong> ' + mort.nonoperative + '%</p>';
          } else {
            mortalityEl.innerHTML =
              '<p><strong>Неоперабельный:</strong> ' + mort.nonoperative + '%</p>' +
              '<p><strong>Послеоперационный:</strong> ' + mort.postoperative + '%</p>';
          }
          mortalityEl.classList.remove('fc-calc__apache-mortality--hidden');
        }

        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();
