  var root = document.querySelector('.fc-calc[data-calculator="ganzoni-iron"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-ganzoni-iron-form');
  var weightInput = root.querySelector('#fc-calc-ganzoni-iron-weight');
  var currentHbInput = root.querySelector('#fc-calc-ganzoni-iron-current-hb');
  var targetHbInput = root.querySelector('#fc-calc-ganzoni-iron-target-hb');
  var currentUnitSelect = root.querySelector('#fc-calc-ganzoni-iron-current-unit');
  var targetUnitSelect = root.querySelector('#fc-calc-ganzoni-iron-target-unit');
  var targetPreset = root.querySelector('#fc-calc-ganzoni-iron-target-preset');
  var storeModeSelect = root.querySelector('#fc-calc-ganzoni-iron-store-mode');
  var customStoreWrap = root.querySelector('#fc-calc-ganzoni-iron-custom-store-wrap');
  var customStoreInput = root.querySelector('#fc-calc-ganzoni-iron-custom-store');
  var drugSelect = root.querySelector('#fc-calc-ganzoni-iron-drug');
  var formError = root.querySelector('#fc-calc-ganzoni-iron-form-error');
  var resultWrap = root.querySelector('#fc-calc-ganzoni-iron-result');
  var resultNumber = root.querySelector('#fc-calc-ganzoni-iron-result-number');
  var resultDesc = root.querySelector('#fc-calc-ganzoni-iron-result-desc');
  var resultMeta = root.querySelector('#fc-calc-ganzoni-iron-result-meta');
  var resultSessions = root.querySelector('#fc-calc-ganzoni-iron-result-sessions');

  function unitValue(selectEl) {
    return selectEl.value === 'gl' ? 'gl' : 'gdl';
  }

  function buildInput() {
    return {
      weightKg: weightInput.value,
      currentHb: currentHbInput.value,
      targetHb: targetHbInput.value,
      currentHbUnit: unitValue(currentUnitSelect),
      targetHbUnit: unitValue(targetUnitSelect),
      storeMode: storeModeSelect.value,
      customStoreMg: customStoreInput.value,
      drug: drugSelect.value,
    };
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
    resultNumber.textContent = '—';
    resultDesc.textContent = '';
    resultMeta.textContent = '';
    resultSessions.innerHTML = '';
    resultSessions.hidden = true;
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function updatePresetLabels() {
    var unit = unitValue(targetUnitSelect);
    var unitLabel = unit === 'gl' ? 'г/л' : 'г/дл';
    Array.prototype.forEach.call(targetPreset.options, function (opt) {
      if (opt.value === 'none') {
        opt.textContent = 'Не выбрано';
        return;
      }
      var gdl = TARGET_PRESETS[opt.value];
      if (gdl == null) return;
      var value = convertHb(gdl, 'gdl', unit);
      var valueLabel = formatNum(value);
      if (opt.value === 'adult13') {
        opt.textContent = 'Взрослый ' + valueLabel + ' ' + unitLabel + ' (консервативно)';
      } else if (opt.value === 'classic15') {
        opt.textContent = 'Классический ' + valueLabel + ' ' + unitLabel + ' (исторически)';
      } else if (opt.value === 'ckd115') {
        opt.textContent = 'ХБП ≈ ' + valueLabel + ' ' + unitLabel;
      }
    });
  }

  function renderResult(out) {
    resultNumber.textContent = formatNum(out.totalIronMg) + ' мг';
    resultDesc.textContent = out.interpretation;
    resultMeta.innerHTML =
      '<div class="fc-calc__ganzoni-meta-item">' +
      '<span class="fc-calc__ganzoni-meta-label"><span>Использованная</span><span>ΔHb</span></span>' +
      '<span class="fc-calc__ganzoni-meta-value">' +
      formatNum(out.deltaHb) +
      ' ' +
      out.unitLabel +
      '</span></div>' +
      '<div class="fc-calc__ganzoni-meta-item">' +
      '<span class="fc-calc__ganzoni-meta-label"><span>Добавленный</span><span>запас</span></span>' +
      '<span class="fc-calc__ganzoni-meta-value">' +
      formatNum(out.storeMg) +
      ' мг</span></div>' +
      '<div class="fc-calc__ganzoni-meta-item">' +
      '<span class="fc-calc__ganzoni-meta-label"><span>Общее</span><span>железо</span></span>' +
      '<span class="fc-calc__ganzoni-meta-value">' +
      formatNum(out.totalIronMg) +
      ' мг</span></div>';

    if (out.sessions != null && out.maxPerSessionMg != null) {
      resultSessions.hidden = false;
      resultSessions.innerHTML =
        '<p class="fc-calc__ganzoni-sessions-title">Планирование сеансов (инф.)</p>' +
        '<p class="fc-calc__ganzoni-sessions-hint">Не превышайте максимум на сеанс для выбранного препарата.</p>' +
        '<p class="fc-calc__ganzoni-session-line">• Число сеансов: ' +
        formatNum(out.sessions) +
        '</p>' +
        '<p class="fc-calc__ganzoni-session-line">• Максимум за сеанс: ' +
        formatNum(out.maxPerSessionMg) +
        ' мг</p>';
    } else {
      resultSessions.hidden = true;
      resultSessions.innerHTML = '';
    }

    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  function updateCustomStoreVisibility() {
    var show = storeModeSelect.value === 'custom';
    customStoreWrap.hidden = !show;
    customStoreInput.required = show;
    if (!show) customStoreInput.value = '';
  }

  function applyTargetPreset() {
    var key = targetPreset.value;
    var gdl = TARGET_PRESETS[key];
    if (gdl == null) return;
    var unit = unitValue(targetUnitSelect);
    var value = convertHb(gdl, 'gdl', unit);
    targetHbInput.value = String(value);
  }

  function update() {
    formError.textContent = '';
    updateCustomStoreVisibility();
    try {
      renderResult(calculate(buildInput()));
    } catch (err) {
      clearResult();
      if (
        weightInput.value ||
        currentHbInput.value ||
        targetHbInput.value ||
        (storeModeSelect.value === 'custom' && customStoreInput.value)
      ) {
        formError.textContent = err.message || 'Проверьте ввод';
      }
    }
  }

  targetPreset.addEventListener('change', function () {
    applyTargetPreset();
    update();
  });

  storeModeSelect.addEventListener('change', update);
  drugSelect.addEventListener('change', update);
  currentUnitSelect.addEventListener('change', update);
  targetUnitSelect.addEventListener('change', function () {
    updatePresetLabels();
    if (targetPreset.value !== 'none') applyTargetPreset();
    update();
  });

  [weightInput, currentHbInput, targetHbInput, customStoreInput].forEach(function (el) {
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    update();
  });

  updatePresetLabels();
  updateCustomStoreVisibility();
  clearResult();
