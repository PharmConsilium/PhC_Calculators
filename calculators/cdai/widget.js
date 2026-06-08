    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="cdai"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-cdai-form');
      var calcBtn = root.querySelector('#fc-calc-cdai-btn');
      var pgaInput = root.querySelector('#fc-calc-cdai-pga');
      var egaInput = root.querySelector('#fc-calc-cdai-ega');
      var resultWrap = root.querySelector('#fc-calc-cdai-result');
      var resultNumber = root.querySelector('#fc-calc-cdai-result-number');
      var resultDesc = root.querySelector('#fc-calc-cdai-result-desc');

      function roundHalfUp(value, decimals) {
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor + Number.EPSILON) / factor;
      }

      function parseScale(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
        var n = Number(s);
        if (!Number.isFinite(n) || n < 0 || n > 10) return null;
        return n;
      }

      function formatNum(n) {
        return String(n).replace('.', ',');
      }

      function interpret(cdai) {
        if (cdai <= 2.8) return 'Ремиссия';
        if (cdai <= 10) return 'Низкая активность заболевания';
        if (cdai <= 22) return 'Умеренная активность заболевания';
        return 'Высокая активность заболевания';
      }

      function countPanel(prefix) {
        var boxes = root.querySelectorAll('input[data-joint-prefix="' + prefix + '"]:checked');
        return boxes.length;
      }

      function updateCounts() {
        root.querySelector('#fc-calc-cdai-tjc-count').value = String(countPanel('tjc'));
        root.querySelector('#fc-calc-cdai-sjc-count').value = String(countPanel('sjc'));
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function isReady() {
        return parseScale(pgaInput.value) != null && parseScale(egaInput.value) != null;
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function setPanel(prefix, checked) {
        root.querySelectorAll('input[data-joint-prefix="' + prefix + '"]').forEach(function (el) {
          el.checked = checked;
        });
        updateCounts();
      }

      form.addEventListener('change', function () {
        hideResult();
        updateCounts();
        updateButton();
      });

      form.addEventListener('input', function () {
        hideResult();
        updateButton();
      });

      root.querySelectorAll('[data-cdai-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var prefix = btn.getAttribute('data-prefix');
          var action = btn.getAttribute('data-cdai-action');
          setPanel(prefix, action === 'all');
          hideResult();
          updateButton();
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var pga = parseScale(pgaInput.value);
        var ega = parseScale(egaInput.value);
        if (pga == null || ega == null) return;

        var tjc = countPanel('tjc');
        var sjc = countPanel('sjc');
        var cdai = roundHalfUp(tjc + sjc + pga + ega, 1);

        resultNumber.textContent = formatNum(cdai);
        resultDesc.textContent = interpret(cdai);
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      updateCounts();
      updateButton();
    })();
