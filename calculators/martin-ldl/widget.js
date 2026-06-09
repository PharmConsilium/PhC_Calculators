    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="martin-ldl"]');
      if (!root) return;

      var TG_MMOL_MAX_MARTIN = 4.5;
      var TG_MMOL_MAX_FRIEDEWALD = 4.5;
      var TG_MMOL_MAX_SAMPSON = 9;
      var TG_MMOL_TO_MG_DL = 1 / 0.0113;
      var K_MMOL_SCALE = 0.43658;

      var M_ROW = [0, 100, 130, 160, 190, 220];
      var M_COL = [
        7, 50, 57, 62, 67, 72, 76, 80, 84, 88, 93, 97, 101, 106, 111, 116, 121, 127, 133, 139, 147,
        155, 164, 174, 186, 202, 221, 248, 293, 400,
      ];

      var MARTIN_MATRIX = [
        [3.5, 3.4, 3.3, 3.3, 3.2, 3.1],
        [4.0, 3.9, 3.7, 3.6, 3.6, 3.4],
        [4.3, 4.1, 4.0, 3.9, 3.8, 3.6],
        [4.5, 4.3, 4.1, 4.0, 3.9, 3.9],
        [4.7, 4.4, 4.3, 4.2, 4.1, 3.9],
        [4.8, 4.6, 4.4, 4.2, 4.2, 4.1],
        [4.9, 4.6, 4.5, 4.3, 4.3, 4.3],
        [5.0, 4.8, 4.6, 4.4, 4.3, 4.2],
        [5.1, 4.8, 4.6, 4.5, 4.4, 4.3],
        [5.2, 4.9, 4.7, 4.6, 4.4, 4.3],
        [5.3, 5.0, 4.8, 4.7, 4.5, 4.4],
        [5.4, 5.1, 4.8, 4.7, 4.5, 4.3],
        [5.5, 5.2, 5.0, 4.7, 4.6, 4.3],
        [5.6, 5.3, 5.0, 4.8, 4.6, 4.5],
        [5.7, 5.4, 5.1, 4.9, 4.7, 4.5],
        [5.8, 5.5, 5.2, 5.0, 4.8, 4.6],
        [6.0, 5.5, 5.3, 5.0, 4.8, 4.6],
        [6.1, 5.7, 5.3, 5.1, 4.9, 4.7],
        [6.2, 5.8, 5.4, 5.2, 5.0, 4.7],
        [6.3, 5.9, 5.6, 5.3, 5.0, 4.8],
        [6.5, 6.0, 5.7, 5.4, 5.1, 4.8],
        [6.7, 6.2, 5.8, 5.4, 5.2, 4.9],
        [6.8, 6.3, 5.9, 5.5, 5.3, 5.0],
        [7.0, 6.5, 6.0, 5.7, 5.4, 5.1],
        [7.3, 6.7, 6.2, 5.8, 5.5, 5.2],
        [7.6, 6.9, 6.4, 6.0, 5.6, 5.3],
        [8.0, 7.2, 6.6, 6.2, 5.9, 5.4],
        [8.5, 7.6, 7.0, 6.5, 6.1, 5.6],
        [9.5, 8.3, 7.5, 7.0, 6.5, 5.9],
        [11.9, 10.0, 8.8, 8.1, 7.5, 6.2],
      ];

      var form = root.querySelector('#fc-calc-martin-ldl-form');
      var calcBtn = root.querySelector('#fc-calc-martin-ldl-btn');
      var totalInput = root.querySelector('#fc-calc-martin-ldl-total');
      var hdlInput = root.querySelector('#fc-calc-martin-ldl-hdl');
      var tgInput = root.querySelector('#fc-calc-martin-ldl-tg');
      var totalError = root.querySelector('#fc-calc-martin-ldl-total-error');
      var hdlError = root.querySelector('#fc-calc-martin-ldl-hdl-error');
      var tgError = root.querySelector('#fc-calc-martin-ldl-tg-error');
      var formError = root.querySelector('#fc-calc-martin-ldl-form-error');
      var resultWrap = root.querySelector('#fc-calc-martin-ldl-result');
      var martinOut = root.querySelector('#fc-calc-martin-ldl-martin');
      var sampsonOut = root.querySelector('#fc-calc-martin-ldl-sampson');
      var friedewaldOut = root.querySelector('#fc-calc-martin-ldl-friedewald');
      var warningOut = root.querySelector('#fc-calc-martin-ldl-warning');

      function parsePositive(value) {
        var s = String(value || '').trim().replace(',', '.');
        if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
        var n = Number(s);
        return Number.isFinite(n) && n > 0 ? n : null;
      }

      function truncTo2(value) {
        return Math.trunc(value * 100 + Number.EPSILON) / 100;
      }

      function formatNum(n) {
        if (!Number.isFinite(n)) return '—';
        return truncTo2(n).toFixed(2).replace('.', ',');
      }

      function lookupMartinIndices(tgMgDl) {
        var iRow = 0;
        var iCol = 0;
        var key;
        for (key = 0; key < M_ROW.length; key++) {
          if (tgMgDl >= M_ROW[key]) iRow = key;
        }
        for (key = 0; key < M_COL.length; key++) {
          if (tgMgDl >= M_COL[key]) iCol = key;
        }
        return { iRow: iRow, iCol: iCol };
      }

      function martinLdlMmol(tcMmol, hdlMmol, tgMmol) {
        var nonHdlMmol = tcMmol - hdlMmol;
        var tgMgDl = tgMmol * TG_MMOL_TO_MG_DL;
        var idx = lookupMartinIndices(tgMgDl);
        var k = MARTIN_MATRIX[idx.iCol][idx.iRow];
        var divisor = k * K_MMOL_SCALE;
        return nonHdlMmol - tgMmol / divisor;
      }

      function sampsonLdlMmol(tcMmol, hdlMmol, tgMmol) {
        var nonHdlMmol = tcMmol - hdlMmol;
        return (
          tcMmol / 0.948 -
          hdlMmol / 0.971 -
          (tgMmol / 3.74 + (tgMmol * nonHdlMmol) / 24.16 - (tgMmol * tgMmol) / 79.36) -
          0.244
        );
      }

      function friedewaldLdlMmol(tcMmol, hdlMmol, tgMmol) {
        return tcMmol - hdlMmol - tgMmol / 2.2;
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function isReady() {
        return (
          parsePositive(totalInput.value) &&
          parsePositive(hdlInput.value) &&
          parsePositive(tgInput.value)
        );
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      function calculate() {
        var tcMmol = parsePositive(totalInput.value);
        var hdlMmol = parsePositive(hdlInput.value);
        var tgMmol = parsePositive(tgInput.value);

        if (tcMmol == null || hdlMmol == null || tgMmol == null) {
          throw new Error('Заполните все поля');
        }

        var warnings = [];
        if (tgMmol >= TG_MMOL_MAX_MARTIN) {
          warnings.push('При триглицеридах ≥ 4,5 ммоль/л формула Мартина-Хопкинса не применима');
        }
        if (tgMmol >= TG_MMOL_MAX_FRIEDEWALD) {
          warnings.push('При триглицеридах ≥ 4,5 ммоль/л формула Фридвальда не применима');
        }
        if (tgMmol > TG_MMOL_MAX_SAMPSON) {
          warnings.push('При триглицеридах > 9 ммоль/л формула Сэмпсона не применима');
        }

        return {
          martinLdl: truncTo2(martinLdlMmol(tcMmol, hdlMmol, tgMmol)),
          sampsonLdl: truncTo2(sampsonLdlMmol(tcMmol, hdlMmol, tgMmol)),
          friedewaldLdl: truncTo2(friedewaldLdlMmol(tcMmol, hdlMmol, tgMmol)),
          warnings: warnings,
        };
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
        totalError.textContent = '';
        hdlError.textContent = '';
        tgError.textContent = '';
        formError.textContent = '';
        hideResult();

        if (!isReady()) {
          if (!parsePositive(totalInput.value)) {
            totalError.textContent = 'Укажите холестерин';
          }
          if (!parsePositive(hdlInput.value)) {
            hdlError.textContent = 'Укажите ХС ЛПВП';
          }
          if (!parsePositive(tgInput.value)) {
            tgError.textContent = 'Укажите триглицериды';
          }
          return;
        }

        try {
          var out = calculate();
          martinOut.textContent = formatNum(out.martinLdl);
          sampsonOut.textContent = formatNum(out.sampsonLdl);
          friedewaldOut.textContent = formatNum(out.friedewaldLdl);
          if (warningOut) {
            warningOut.textContent = out.warnings.join(' ');
          }
          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        } catch (err) {
          formError.textContent = err.message || 'Ошибка расчёта';
        }
      });

      updateButton();
    })();
