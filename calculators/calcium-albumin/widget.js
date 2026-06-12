(function () {
  var root = document.querySelector('.fc-calc[data-calculator="calcium-albumin"]');
  if (!root) return;

  var DISPLAY_DECIMALS = 2;
  var CORRECTION_MMOL = 0.02;
  var MMOL_TO_MGDL = 4;

  var form = root.querySelector('#fc-calc-calcium-albumin-form');
  var resultBox = root.querySelector('#fc-calc-calcium-albumin-result');
  var resultNumber = root.querySelector('#fc-calc-calcium-albumin-result-number');
  var resultDesc = root.querySelector('#fc-calc-calcium-albumin-result-desc');
  var formError = root.querySelector('#fc-calc-calcium-albumin-form-error');

  function roundHalfUp(value, decimals) {
    var factor = Math.pow(10, decimals);
    return Math.round(value * factor + Number.EPSILON) / factor;
  }

  function parsePositive(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function albuminToGL(value, unit) {
    return unit === 'gdl' ? value * 10 : value;
  }

  function serumCaToMmol(value, unit) {
    return unit === 'mgdl' ? value / MMOL_TO_MGDL : value;
  }

  function serumCaFromMmol(valueMmol, unit) {
    return unit === 'mgdl' ? valueMmol * MMOL_TO_MGDL : valueMmol;
  }

  function getNormalAlbumin() {
    var checked = form.querySelector('input[name="normalAlbumin"]:checked');
    return checked ? Number(checked.value) : null;
  }

  function clearResult() {
    if (resultNumber) resultNumber.textContent = '—';
    if (resultDesc) resultDesc.textContent = '';
    if (resultBox) resultBox.classList.add('fc-calc__result--empty');
  }

  function showResult(out) {
    if (resultNumber) {
      resultNumber.textContent = formatNum(out.correctedCalcium) + ' ' + out.unitLabel;
    }
    if (resultDesc) {
      var sign = out.correctionDelta > 0 ? '+' : '';
      resultDesc.textContent =
        'коррекция ' + sign + formatNum(out.correctionDelta) + ' ' + out.unitLabel;
    }
    if (resultBox) resultBox.classList.remove('fc-calc__result--empty');
  }

  function recalculate() {
    if (formError) formError.textContent = '';
    var serumCaRaw = parsePositive(form.querySelector('[name="serumCa"]').value);
    var patientAlbuminRaw = parsePositive(form.querySelector('[name="patientAlbumin"]').value);
    var serumCaUnitEl = form.querySelector('[name="serumCaUnit"]');
    var albuminUnitEl = form.querySelector('[name="patientAlbuminUnit"]');
    var serumCaUnit = serumCaUnitEl && serumCaUnitEl.value === 'mgdl' ? 'mgdl' : 'mmolL';
    var albuminUnit = albuminUnitEl && albuminUnitEl.value === 'gdl' ? 'gdl' : 'gL';
    var normalAlbumin = getNormalAlbumin();

    if (serumCaRaw == null || patientAlbuminRaw == null || normalAlbumin == null) {
      clearResult();
      return;
    }

    var patientAlbuminGL = albuminToGL(patientAlbuminRaw, albuminUnit);
    var serumCaMmol = serumCaToMmol(serumCaRaw, serumCaUnit);
    var correctedMmol =
      serumCaMmol + CORRECTION_MMOL * (normalAlbumin - patientAlbuminGL);
    var correctedDisplay = roundHalfUp(
      serumCaFromMmol(correctedMmol, serumCaUnit),
      DISPLAY_DECIMALS
    );
    var correctionDelta = roundHalfUp(
      serumCaFromMmol(correctedMmol - serumCaMmol, serumCaUnit),
      DISPLAY_DECIMALS
    );

    showResult({
      correctedCalcium: correctedDisplay,
      correctionDelta: correctionDelta,
      unitLabel: serumCaUnit === 'mgdl' ? 'мг/дл' : 'ммоль/л',
    });
  }

  if (form) {
    form.addEventListener('input', recalculate);
    form.addEventListener('change', recalculate);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
    });
  }

  recalculate();
})();
