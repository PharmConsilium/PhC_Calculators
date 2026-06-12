(function () {
  var root = document.querySelector('.fc-calc[data-calculator="anion-gap"]');
  if (!root) return;

  var NORMAL_AG = 12;
  var NORMAL_HCO3 = 24;
  var NORMAL_ALBUMIN_G_DL = 4;
  var CORRECTION = 2.5;
  var DECIMALS = 1;
  var UNIT = 'ммоль/л';

  var tabs = root.querySelectorAll('.fc-calc__tab[data-mode]');
  var panels = root.querySelectorAll('.fc-calc__tab-panel[data-mode]');

  function switchMode(mode) {
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-mode') === mode;
      tab.classList.toggle('fc-calc__tab--active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(function (panel) {
      var active = panel.getAttribute('data-mode') === mode;
      panel.classList.toggle('fc-calc__tab-panel--active', active);
      panel.hidden = !active;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchMode(tab.getAttribute('data-mode'));
    });
  });

  function roundHalfUp(value, decimals) {
    var factor = Math.pow(10, decimals);
    return Math.round(value * factor + Number.EPSILON) / factor;
  }

  function parseNumber(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function formatNum(n, decimals) {
    return String(roundHalfUp(n, decimals)).replace('.', ',');
  }

  function formatWithUnitSpace(n, decimals) {
    return formatNum(n, decimals) + ' ' + UNIT;
  }

  function capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function interpretDeltaRatio(ratio) {
    if (ratio == null || !Number.isFinite(ratio)) return null;
    if (ratio < 0.4) return 'чистый ацидоз с нормальным анионным разрывом';
    if (ratio < 0.8) return 'смешанный ацидоз с высоким и нормальным анионным разрывом';
    if (ratio <= 2) return 'чистый ацидоз с увеличенным анионным разрывом';
    return 'ацидоз с высоким анионным разрывом при наличии предшествующего метаболического алкалоза';
  }

  function hideResult(mode) {
    var wrap = root.querySelector('#fc-calc-anion-gap-result-' + mode);
    if (wrap) wrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function readIons(form) {
    var na = parseNumber(form.querySelector('[name="na"]').value);
    var cl = parseNumber(form.querySelector('[name="cl"]').value);
    var hco3 = parseNumber(form.querySelector('[name="hco3"]').value);
    if (na == null || cl == null || hco3 == null) return null;
    return { na: na, cl: cl, hco3: hco3 };
  }

  function deltaGap(ag) {
    return ag - NORMAL_AG;
  }

  function deltaRatio(dGap, hco3) {
    var denom = NORMAL_HCO3 - hco3;
    if (denom === 0) return null;
    return dGap / denom;
  }

  function albuminGdl(value, unit) {
    return unit === 'gL' ? value / 10 : value;
  }

  function renderBasicResult(ag, dGap, dRatio, decimals) {
    var html = '<div class="fc-calc__ag-result">';
    html += '<p class="fc-calc__ag-result-value">' + formatWithUnitSpace(ag, decimals) + '</p>';
    html += '<p class="fc-calc__ag-result-title">Анионный разрыв</p>';
    html +=
      '<p class="fc-calc__ag-result-line"><strong>Дельта-разрыв:</strong> ' +
      formatWithUnitSpace(dGap, decimals) +
      '</p>';
    if (dRatio == null) {
      html +=
        '<p class="fc-calc__ag-result-line"><strong>Дельта-соотношение:</strong> не рассчитывается (24 − бикарбонат = 0)</p>';
    } else {
      html +=
        '<p class="fc-calc__ag-result-line"><strong>Дельта-соотношение:</strong> ' +
        formatNum(dRatio, decimals) +
        '; ' +
        capitalizeFirst(interpretDeltaRatio(dRatio)) +
        '</p>';
    }
    html += '</div>';
    return html;
  }

  function albuminCorrection(albuminGdl) {
    return CORRECTION * (NORMAL_ALBUMIN_G_DL - albuminGdl);
  }

  function renderAlbuminResult(ag, albuminGdl, hco3, decimals) {
    var correction = albuminCorrection(albuminGdl);
    var correctedAgValue = ag + correction;
    var correctedDeltaGap = deltaGap(ag) + correction;
    var correctedDeltaRatio = deltaRatio(correctedDeltaGap, hco3);
    var html = '<div class="fc-calc__ag-result">';
    html +=
      '<p class="fc-calc__ag-result-value">' + formatWithUnitSpace(correctedAgValue, decimals) + '</p>';
    html += '<p class="fc-calc__ag-result-title">Скорректированный анионный разрыв</p>';
    html +=
      '<p class="fc-calc__ag-result-line"><strong>Дельта-разрыв, скорректированный по альбумину:</strong> ' +
      formatWithUnitSpace(correctedDeltaGap, decimals) +
      '</p>';
    if (correctedDeltaRatio == null) {
      html +=
        '<p class="fc-calc__ag-result-line"><strong>Дельта-соотношение, скорректированное по альбумину:</strong> не рассчитывается (24 − бикарбонат = 0)</p>';
    } else {
      html +=
        '<p class="fc-calc__ag-result-line"><strong>Дельта-соотношение, скорректированное по альбумину:</strong> ' +
        formatNum(correctedDeltaRatio, decimals) +
        '</p>';
    }
    html += '</div>';
    return html;
  }

  function bindForm(mode) {
    var form = root.querySelector('#fc-calc-anion-gap-form-' + mode);
    var btn = root.querySelector('#fc-calc-anion-gap-btn-' + mode);
    var formError = root.querySelector('#fc-calc-anion-gap-form-error-' + mode);
    var resultWrap = root.querySelector('#fc-calc-anion-gap-result-' + mode);
    var resultBody = root.querySelector('#fc-calc-anion-gap-result-body-' + mode);
    if (!form || !btn) return;

    function isReady() {
      var ions = readIons(form);
      if (!ions) return false;
      if (mode === 'albumin') {
        return parseNumber(form.querySelector('[name="albumin"]').value) != null;
      }
      return true;
    }

    function updateButton() {
      var ok = isReady();
      btn.disabled = !ok;
      btn.classList.toggle('fc-calc__btn--inactive', !ok);
    }

    function onChange() {
      hideResult(mode);
      if (formError) formError.textContent = '';
      updateButton();
    }

    form.addEventListener('input', onChange);
    form.addEventListener('change', onChange);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideResult(mode);
      if (!isReady()) {
        if (formError) formError.textContent = 'Заполните все поля';
        return;
      }

      var ions = readIons(form);
      var decimals = DECIMALS;
      var ag = ions.na - (ions.cl + ions.hco3);
      var html = '';

      if (mode === 'basic') {
        html = renderBasicResult(ag, deltaGap(ag), deltaRatio(deltaGap(ag), ions.hco3), decimals);
      } else {
        var albuminInput = parseNumber(form.querySelector('[name="albumin"]').value);
        var albuminUnitEl = form.querySelector('[name="albuminUnit"]');
        var albuminUnit = albuminUnitEl ? albuminUnitEl.value : 'gL';
        var alb = albuminGdl(albuminInput, albuminUnit);
        html = renderAlbuminResult(ag, alb, ions.hco3, decimals);
      }

      if (resultBody) resultBody.innerHTML = html;
      resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    });

    updateButton();
  }

  bindForm('basic');
  bindForm('albumin');
})();
