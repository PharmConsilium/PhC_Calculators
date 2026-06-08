    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="gcs-equiv"]');
      if (!root) return;

      var SYSTEMIC = {
        cortisone: { name: 'Кортизон', eq: 25, durationLabel: 'Короткое (8–12 ч)', mineral: '+++ (высокий)' },
        hydrocortisone: { name: 'Гидрокортизон', eq: 20, durationLabel: 'Короткое (8–12 ч)', mineral: '+++ (высокий)' },
        prednisone: { name: 'Преднизон', eq: 5, durationLabel: 'Среднее (12–36 ч)', mineral: '++ (умеренный)' },
        prednisolone: { name: 'Преднизолон', eq: 5, durationLabel: 'Среднее (12–36 ч)', mineral: '++ (умеренный)' },
        methylprednisolone: { name: 'Метилпреднизолон', eq: 4, durationLabel: 'Среднее (12–36 ч)', mineral: '+ (низкий)' },
        triamcinolone: { name: 'Триамцинолон', eq: 4, durationLabel: 'Среднее (12–36 ч)', mineral: '+ (низкий)' },
        dexamethasone: { name: 'Дексаметазон', eq: 0.8, durationLabel: 'Длительное (36–72 ч)', mineral: '0 (отсутствует)' },
        betamethasone: { name: 'Бетаметазон', eq: 0.8, durationLabel: 'Длительное (36–72 ч)', mineral: '0 (отсутствует)' },
      };

      var SYSTEMIC_ORDER = [
        'cortisone',
        'hydrocortisone',
        'prednisone',
        'prednisolone',
        'methylprednisolone',
        'triamcinolone',
        'dexamethasone',
        'betamethasone',
      ];

      var sysForm = root.querySelector('#fc-calc-gcs-sys-form');
      var sysSource = root.querySelector('#fc-calc-gcs-sys-source');
      var sysTarget = root.querySelector('#fc-calc-gcs-sys-target');
      var sysDose = root.querySelector('#fc-calc-gcs-sys-dose');
      var sysBtn = root.querySelector('#fc-calc-gcs-sys-btn');
      var sysDoseError = root.querySelector('#fc-calc-gcs-sys-dose-error');
      var sysTargetError = root.querySelector('#fc-calc-gcs-sys-target-error');
      var sysInfo = root.querySelector('#fc-calc-gcs-sys-info');
      var sysResult = root.querySelector('#fc-calc-gcs-sys-result');
      var sysResultDose = root.querySelector('#fc-calc-gcs-sys-result-dose');
      var sysResultDesc = root.querySelector('#fc-calc-gcs-sys-result-desc');
      var sysExample = root.querySelector('#fc-calc-gcs-sys-example');

      function roundHalfUp(value, decimals) {
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor + Number.EPSILON) / factor;
      }

      function parseDose(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s) return null;
        if (!/^\d+(\.\d+)?$/.test(s)) return { error: true };
        var n = Number(s);
        if (!Number.isFinite(n) || n < 0) return { error: true };
        if (n === 0) return null;
        return n;
      }

      function formatNum(n) {
        if (!Number.isFinite(n)) return '';
        return String(roundHalfUp(n, 2)).replace('.', ',');
      }

      function showSysInfo(id) {
        var d = SYSTEMIC[id];
        if (!d || !sysInfo) return;
        sysInfo.innerHTML =
          '<p style="margin:0 0 6px"><strong>' +
          d.name +
          '</strong></p>' +
          '<p style="margin:0 0 4px">Экв. доза: ' +
          formatNum(d.eq) +
          ' мг</p>' +
          '<p style="margin:0 0 4px">Продолжительность: ' +
          d.durationLabel +
          '</p>' +
          '<p style="margin:0">Минералокортикоидный эффект: ' +
          d.mineral +
          '</p>';
        sysInfo.classList.remove('fc-calc__info-panel--hidden');
      }

      function fillSystemicSelects() {
        sysSource.innerHTML = '';
        sysTarget.innerHTML = '';
        for (var i = 0; i < SYSTEMIC_ORDER.length; i++) {
          var id = SYSTEMIC_ORDER[i];
          var drug = SYSTEMIC[id];
          var o1 = document.createElement('option');
          o1.value = id;
          o1.textContent = drug.name;
          sysSource.appendChild(o1);
          var o2 = document.createElement('option');
          o2.value = id;
          o2.textContent = drug.name;
          sysTarget.appendChild(o2);
        }
        sysSource.value = 'hydrocortisone';
        sysTarget.value = 'prednisone';
      }

      function hideSysResult() {
        if (sysResult) sysResult.classList.add('fc-calc__result-wrap--hidden');
      }

      function updateSysButton() {
        var dose = parseDose(sysDose.value);
        var ok = dose !== null && !dose.error && sysSource.value && sysTarget.value;
        sysBtn.disabled = !ok;
        sysBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function calcSystemic() {
        sysDoseError.textContent = '';
        sysTargetError.textContent = '';
        hideSysResult();

        var dose = parseDose(sysDose.value);
        if (!dose || dose.error) {
          sysDoseError.textContent = 'Укажите дозу больше 0';
          return;
        }

        var sourceId = sysSource.value;
        var targetId = sysTarget.value;
        if (sourceId === targetId) {
          sysTargetError.textContent = 'Выберите другой препарат для конвертации';
          return;
        }

        var source = SYSTEMIC[sourceId];
        var target = SYSTEMIC[targetId];
        if (!source || !target) return;

        var doseTarget = roundHalfUp((dose * target.eq) / source.eq, 2);

        sysResultDose.textContent = formatNum(doseTarget) + ' мг';
        sysResultDesc.innerHTML =
          '<strong>' +
          source.name +
          '</strong> ' +
          formatNum(dose) +
          ' мг → <strong>' +
          target.name +
          '</strong><br>' +
          'Экв. дозы: ' +
          formatNum(source.eq) +
          ' мг / ' +
          formatNum(target.eq) +
          ' мг';
        sysResult.classList.remove('fc-calc__result-wrap--hidden');
        showSysInfo(targetId);
      }

      function loadSysExample() {
        sysSource.value = 'hydrocortisone';
        sysTarget.value = 'prednisone';
        sysDose.value = '20';
        sysDoseError.textContent = '';
        sysTargetError.textContent = '';
        hideSysResult();
        showSysInfo('hydrocortisone');
        updateSysButton();
        calcSystemic();
      }

      sysForm.addEventListener('submit', function (e) {
        e.preventDefault();
        calcSystemic();
      });

      sysDose.addEventListener('input', function () {
        hideSysResult();
        updateSysButton();
      });
      sysSource.addEventListener('change', function () {
        hideSysResult();
        showSysInfo(sysSource.value);
        updateSysButton();
      });
      sysTarget.addEventListener('change', function () {
        hideSysResult();
        sysTargetError.textContent = '';
        updateSysButton();
      });
      sysDose.addEventListener(
        'wheel',
        function (e) {
          if (document.activeElement === sysDose) e.preventDefault();
        },
        { passive: false }
      );

      if (sysExample) {
        sysExample.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-example]');
          if (!btn) return;
          loadSysExample();
        });
      }

      fillSystemicSelects();
      updateSysButton();
    })();
