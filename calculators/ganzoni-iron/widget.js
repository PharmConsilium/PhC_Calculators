(function () {
  /**
 * Формула Ганзони — расчёт дефицита / дозы в/в железа.
 * Источник: Ganzoni AM. Schweiz Med Wochenschr. 1970; calc4lab.com/calculators/ganzoni
 *
 * Дефицит (mg) = масса(kg) × ΔHb(g/dL) × 2.4 + запас
 * При Hb в g/L коэффициент 0.24 вместо 2.4.
 * ΔHb < 0 → 0.
 * Компонент на Hb округляется до ближайших 10 мг (как Calc4Lab).
 * Авто-запас: ≥35 кг → +500 mg; <35 кг → +15 mg/kg.
 * Сеансы: Ferinject — до 1000 мг; Monofer — до 20 мг/кг.
 */

const HB_UNITS = {
  gdl: { label: 'г/дл', factor: 2.4, api: 'g/dL' },
  gl: { label: 'г/л', factor: 0.24, api: 'g/L' },
};

/** Пресеты цели в г/дл (конвертируются при выборе единиц). */
const TARGET_PRESETS = {
  none: null,
  adult13: 13,
  classic15: 15,
  ckd115: 11.5,
};

const STORE_MODES = {
  auto: 'auto',
  fixed500: 'fixed500',
  perKg15: 'perKg15',
  custom: 'custom',
  none: 'none',
};

const DRUGS = {
  none: { label: 'Не выбран', kind: 'none' },
  fcm: {
    label: 'Железа карбоксимальтозат (Ferinject®)',
    kind: 'fcm',
  },
  isomaltoside: {
    label: 'Железа изомальтозид (Monofer®)',
    kind: 'isomaltoside',
  },
};

function roundHalfUp(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

/** Округление дозы железа до ближайших 10 мг (поведение Calc4Lab). */
function roundIronMg(value) {
  return Math.round(value / 10) * 10;
}

function parsePositive(raw) {
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseNonNegative(raw) {
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalizeHbUnit(unit) {
  if (unit === 'gl' || unit === 'g/L' || unit === 'gL') return 'gl';
  return 'gdl';
}

/** Конвертация Hb между г/дл и г/л. */
function convertHb(value, fromUnit, toUnit) {
  const from = normalizeHbUnit(fromUnit);
  const to = normalizeHbUnit(toUnit);
  if (from === to) return value;
  if (from === 'gdl' && to === 'gl') return value * 10;
  return value / 10;
}

/**
 * Приводим текущий и целевой Hb к одной системе единиц.
 * Если единицы разные — считаем в г/л (как Calc4Lab).
 */
function normalizeHbPair(currentHb, currentUnit, targetHb, targetUnit) {
  const curU = normalizeHbUnit(currentUnit);
  const tgtU = normalizeHbUnit(targetUnit);
  if (curU === tgtU) {
    return {
      current: currentHb,
      target: targetHb,
      hbUnit: curU,
    };
  }
  return {
    current: convertHb(currentHb, curU, 'gl'),
    target: convertHb(targetHb, tgtU, 'gl'),
    hbUnit: 'gl',
  };
}

function resolveIronStoreMg(weightKg, storeMode, customStoreMg) {
  switch (storeMode) {
    case STORE_MODES.none:
      return 0;
    case STORE_MODES.fixed500:
      return 500;
    case STORE_MODES.perKg15:
      return roundHalfUp(15 * weightKg, 0);
    case STORE_MODES.custom: {
      const n = Number(customStoreMg);
      if (!Number.isFinite(n) || n < 0) return null;
      return roundHalfUp(n, 0);
    }
    case STORE_MODES.auto:
    default:
      return weightKg >= 35 ? 500 : roundHalfUp(15 * weightKg, 0);
  }
}

/** Максимум за сеанс: FCM 1000 мг; Monofer 20 мг/кг. */
function maxPerSessionMg(drugId, weightKg) {
  if (drugId === 'fcm') return 1000;
  if (drugId === 'isomaltoside') return roundHalfUp(20 * weightKg, 0);
  return null;
}

function planSessions(totalIronMg, drugId, weightKg) {
  const drug = DRUGS[drugId] || DRUGS.none;
  const max = maxPerSessionMg(drugId, weightKg);
  if (!max || totalIronMg <= 0) {
    return {
      drugId: drugId || 'none',
      drugLabel: drug.label,
      maxPerSessionMg: max,
      sessions: null,
      perSessionMg: null,
    };
  }
  const sessions = Math.max(1, Math.ceil(totalIronMg / max));
  const perSessionMg = Math.floor(totalIronMg / sessions);
  return {
    drugId,
    drugLabel: drug.label,
    maxPerSessionMg: max,
    sessions,
    perSessionMg,
  };
}

/**
 * @param {{
 *   weightKg: number|string,
 *   currentHb: number|string,
 *   targetHb: number|string,
 *   hbUnit?: 'gdl'|'gl',
 *   currentHbUnit?: 'gdl'|'gl',
 *   targetHbUnit?: 'gdl'|'gl',
 *   storeMode?: string,
 *   customStoreMg?: number|string,
 *   drug?: string,
 * }} input
 */
function calculate(input) {
  const weightKg = parsePositive(input.weightKg);
  const currentHbRaw = parseNonNegative(input.currentHb);
  const targetHbRaw = parsePositive(input.targetHb);
  const storeMode = input.storeMode || STORE_MODES.auto;
  const drug = input.drug && DRUGS[input.drug] ? input.drug : 'none';

  const currentUnit = normalizeHbUnit(
    input.currentHbUnit || input.hbUnit || 'gdl'
  );
  const targetUnit = normalizeHbUnit(
    input.targetHbUnit || input.hbUnit || 'gdl'
  );

  if (weightKg == null) throw new Error('Укажите массу тела');
  if (weightKg > 300) throw new Error('Проверьте массу тела');
  if (currentHbRaw == null) throw new Error('Укажите текущий Hb');
  if (targetHbRaw == null) throw new Error('Укажите целевой Hb');

  const pair = normalizeHbPair(currentHbRaw, currentUnit, targetHbRaw, targetUnit);
  const hbUnit = pair.hbUnit;
  const currentHb = pair.current;
  const targetHb = pair.target;
  const factor = HB_UNITS[hbUnit].factor;

  const deltaHbRaw = targetHb - currentHb;
  const deltaHb = Math.max(0, deltaHbRaw);
  const storeMg = resolveIronStoreMg(weightKg, storeMode, input.customStoreMg);
  if (storeMg == null) throw new Error('Укажите запас железа (мг)');

  const ironForHbRaw = weightKg * deltaHb * factor;
  const ironForHbMg = roundIronMg(ironForHbRaw);
  const totalIronMg = ironForHbMg + storeMg;
  const sessionPlan = planSessions(totalIronMg, drug, weightKg);

  const unitLabel = HB_UNITS[hbUnit].label;
  const deltaDecimals = hbUnit === 'gl' ? 1 : 2;
  const interpretation =
    deltaHbRaw < 0
      ? 'Текущий Hb выше целевого: ΔHb принята равной 0, результат равен запасу железа.'
      : deltaHbRaw === 0
        ? 'Hb на целевом уровне: результат равен выбранному запасу железа.'
        : 'Расчёт по формуле Ганзони с учётом выбранного запаса железа.';

  return {
    totalIronMg,
    ironForHbMg,
    storeMg,
    deltaHb: roundHalfUp(deltaHb, deltaDecimals),
    deltaHbRaw: roundHalfUp(deltaHbRaw, deltaDecimals),
    weightKg,
    currentHb,
    targetHb,
    hbUnit,
    unitLabel,
    factor,
    storeMode,
    sessions: sessionPlan.sessions,
    perSessionMg: sessionPlan.perSessionMg,
    maxPerSessionMg: sessionPlan.maxPerSessionMg,
    drugId: sessionPlan.drugId,
    drugLabel: sessionPlan.drugLabel,
    interpretation,
    formula: `Дефицит = round10(${weightKg} × ${deltaHb} × ${factor}) + ${storeMg} = ${totalIronMg} мг`,
  };
}

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

})();