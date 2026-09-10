(function () {
  var root = document.querySelector('.fc-calc[data-calculator="hypertension-risk"]');
  if (!root) return;

  var LIMITS = { sbp: { min: 40, max: 310 }, dbp: { min: 40, max: 310 } };
  var CATEGORY_RANK = {
    optimal: 0,
    normal: 1,
    highNormal: 2,
    1: 3,
    2: 4,
    3: 5
  };
  var RISK_MATRIX = {
    noFr: ['none', 'low', 'middle', 'high'],
    fr12: ['low', 'middle', 'high', 'high'],
    fr3: ['middle', 'high', 'high', 'veryHigh'],
    pom: ['high', 'high', 'high', 'veryHigh'],
    aks: ['veryHigh', 'veryHigh', 'veryHigh', 'veryHigh']
  };
  var RISK_META = {
    none: {
      label: 'нет риска',
      recommendation: 'Изменение образа жизни.'
    },
    low: {
      label: 'низкий риск',
      recommendation:
        'Изменение образа жизни в течение нескольких месяцев. При сохранении артериальной гипертензии — медикаментозная терапия (монотерапия).'
    },
    middle: {
      label: 'средний риск',
      recommendation:
        'Изменение образа жизни в течение нескольких недель. При сохранении артериальной гипертензии — медикаментозная терапия (монотерапия).'
    },
    high: {
      label: 'высокий риск',
      recommendation:
        'Изменение образа жизни и медикаментозная терапия (комбинированная терапия).'
    },
    veryHigh: {
      label: 'очень высокий риск',
      recommendation:
        'Изменение образа жизни и медикаментозная терапия (комбинированная терапия).'
    }
  };
  var DEGREE_LABELS = {
    optimal: 'Оптимальное АД',
    normal: 'Нормальное АД',
    highNormal: 'Высокое нормальное АД',
    1: 'Артериальная гипертензия I степени',
    2: 'Артериальная гипертензия II степени',
    3: 'Артериальная гипертензия III степени'
  };

  var form = root.querySelector('#fc-calc-hypertension-risk-form');
  var calcBtn = root.querySelector('#fc-calc-hypertension-risk-btn');
  var formError = root.querySelector('#fc-calc-hypertension-risk-form-error');
  var resultWrap = root.querySelector('#fc-calc-hypertension-risk-result');
  var resultConclusion = root.querySelector('#fc-calc-hypertension-risk-result-conclusion');
  var resultHeadline = root.querySelector('#fc-calc-hypertension-risk-result-headline');
  var resultDegree = root.querySelector('#fc-calc-hypertension-risk-result-degree');
  var resultRisk = root.querySelector('#fc-calc-hypertension-risk-result-risk');
  var resultBasis = root.querySelector('#fc-calc-hypertension-risk-result-basis');
  var resultBasisWrap = root.querySelector('#fc-calc-hypertension-risk-result-basis-wrap');
  var resultRec = root.querySelector('#fc-calc-hypertension-risk-result-rec');
  var degreePreview = root.querySelector('#fc-calc-hypertension-risk-degree-preview');
  var clinicalSections = root.querySelectorAll('[data-htn-clinical]');
  var sbpInput = root.querySelector('#fc-calc-hypertension-risk-sbp');
  var dbpInput = root.querySelector('#fc-calc-hypertension-risk-dbp');
  var sbpError = root.querySelector('#fc-calc-hypertension-risk-sbp-error');
  var dbpError = root.querySelector('#fc-calc-hypertension-risk-dbp-error');

  function parsePressure(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function hasInput(value) {
    return String(value || '').trim() !== '';
  }

  function rangeError(limits) {
    return 'Число не в корректном интервале ' + limits.min + ' - ' + limits.max;
  }

  function categoryBySbp(sbp) {
    if (sbp < 120) return 'optimal';
    if (sbp <= 129) return 'normal';
    if (sbp <= 139) return 'highNormal';
    if (sbp <= 159) return 1;
    if (sbp <= 179) return 2;
    return 3;
  }

  function categoryByDbp(dbp) {
    if (dbp < 80) return 'optimal';
    if (dbp <= 84) return 'normal';
    if (dbp <= 89) return 'highNormal';
    if (dbp <= 99) return 1;
    if (dbp <= 109) return 2;
    return 3;
  }

  function maxCategory(a, b) {
    return CATEGORY_RANK[a] >= CATEGORY_RANK[b] ? a : b;
  }

  function gradeFromSbp(sbp) {
    if (sbp >= 180) return 3;
    if (sbp >= 160) return 2;
    if (sbp >= 140) return 1;
    return null;
  }

  function gradeFromDbp(dbp) {
    if (dbp >= 110) return 3;
    if (dbp >= 100) return 2;
    if (dbp >= 90) return 1;
    return null;
  }

  function classifyBloodPressure(sbp, dbp) {
    if (sbp >= 140 && dbp < 90) {
      var g1 = gradeFromSbp(sbp);
      return {
        key: 'isolate.' + g1,
        bpColumn: g1,
        ahPresent: true,
        riskApplicable: true
      };
    }
    if (sbp < 140 && dbp >= 90) {
      var g2 = gradeFromDbp(dbp);
      return {
        key: 'dadIsolate.' + g2,
        bpColumn: g2,
        ahPresent: true,
        riskApplicable: true
      };
    }
    var cat = maxCategory(categoryBySbp(sbp), categoryByDbp(dbp));
    var ahPresent = cat === 1 || cat === 2 || cat === 3;
    var riskApplicable = cat === 'highNormal' || ahPresent;
    var bpColumn = null;
    if (cat === 'highNormal') bpColumn = 0;
    else if (cat === 1 || cat === 2 || cat === 3) bpColumn = cat;
    return {
      key: cat,
      bpColumn: bpColumn,
      ahPresent: ahPresent,
      riskApplicable: riskApplicable
    };
  }

  function degreeLabel(degreeKey) {
    if (typeof degreeKey === 'string' && degreeKey.indexOf('.') !== -1) {
      var parts = degreeKey.split('.');
      var kind = parts[0];
      var n = parts[1];
      var base =
        kind === 'isolate'
          ? 'Изолированная систолическая АГ (ИСАГ)'
          : 'Изолированная диастолическая АГ (ИДАГ)';
      var roman = { 1: 'I', 2: 'II', 3: 'III' }[n] || n;
      return base + ' ' + roman + ' степени';
    }
    return DEGREE_LABELS[degreeKey] || String(degreeKey);
  }

  function resolveRiskRow(frCount, hasPom, hasAksOrDm) {
    if (hasAksOrDm) return 'aks';
    if (hasPom) return 'pom';
    if (frCount >= 3) return 'fr3';
    if (frCount >= 1) return 'fr12';
    return 'noFr';
  }

  function resolveRiskKey(bpColumn, frCount, hasPom, hasAksOrDm) {
    if (bpColumn == null) return null;
    return RISK_MATRIX[resolveRiskRow(frCount, hasPom, hasAksOrDm)][bpColumn];
  }

  function romanDegree(n) {
    return { 1: 'I', 2: 'II', 3: 'III' }[n] || String(n);
  }

  function degreeShort(degreeKey) {
    if (typeof degreeKey === 'string' && degreeKey.indexOf('.') !== -1) {
      var parts = degreeKey.split('.');
      var prefix =
        parts[0] === 'isolate'
          ? 'Изолированная систолическая АГ'
          : 'Изолированная диастолическая АГ';
      return prefix + ' ' + romanDegree(Number(parts[1])) + ' степени';
    }
    if (degreeKey === 'highNormal') return 'высокое нормальное АД';
    if (degreeKey === 1 || degreeKey === 2 || degreeKey === 3) {
      return 'АГ ' + romanDegree(degreeKey) + ' степени';
    }
    return degreeLabel(degreeKey);
  }

  function checkedLabels(name) {
    var nodes = form.querySelectorAll('input[type="checkbox"][name="' + name + '"]:checked');
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var label = nodes[i].closest('label');
      var title = label ? label.querySelector('.fc-calc__htn-row-label') : null;
      out.push(title ? title.textContent.trim() : nodes[i].value);
    }
    return out;
  }

  function buildRiskBasis(riskRow, frCount, bpColumn, pomLabels, aksLabels, hasDm) {
    if (riskRow === 'aks') {
      var parts = [];
      if (hasDm) parts.push('СД');
      if (aksLabels.length) {
        parts.push('ассоциированные клинические состояния (' + aksLabels.join(', ') + ')');
      } else if (!hasDm) {
        parts.push('ассоциированные клинические состояния / ХБП ≥ 4 ст. / СД');
      }
      return parts.join('; ');
    }
    if (riskRow === 'pom') {
      return pomLabels.length
        ? 'бессимптомное ПОМ / ХБП 3 ст. (' + pomLabels.join(', ') + ')'
        : 'бессимптомное ПОМ / ХБП 3 ст.';
    }
    var col =
      bpColumn === 0
        ? 'высокое нормальное АД'
        : bpColumn
          ? 'степень ' + romanDegree(bpColumn)
          : '';
    if (riskRow === 'fr3') return '≥ 3 ФР' + (col ? ' + ' + col : '') + ' (n=' + frCount + ')';
    if (riskRow === 'fr12') return '1–2 ФР' + (col ? ' + ' + col : '') + ' (n=' + frCount + ')';
    return col ? 'нет других ФР + ' + col : 'нет других ФР';
  }

  function collectChecked(name) {
    var nodes = form.querySelectorAll('input[type="checkbox"][name="' + name + '"]:checked');
    var out = [];
    for (var i = 0; i < nodes.length; i++) out.push(nodes[i].value);
    return out;
  }

  function updateFieldError(input, errorEl, limits, emptyMsg, showEmpty) {
    if (!hasInput(input.value)) {
      errorEl.textContent = showEmpty ? emptyMsg : '';
      return false;
    }
    var value = parsePressure(input.value);
    if (value == null) {
      errorEl.textContent = showEmpty ? emptyMsg : '';
      return false;
    }
    if (value < limits.min || value > limits.max) {
      errorEl.textContent = rangeError(limits);
      return false;
    }
    errorEl.textContent = '';
    return true;
  }

  function isBpReady() {
    var sbp = parsePressure(sbpInput.value);
    var dbp = parsePressure(dbpInput.value);
    return (
      sbp != null &&
      dbp != null &&
      sbp >= LIMITS.sbp.min &&
      sbp <= LIMITS.sbp.max &&
      dbp >= LIMITS.dbp.min &&
      dbp <= LIMITS.dbp.max
    );
  }

  function updateSectionCounts() {
    var groups = ['riskFactors', 'pom', 'aks', 'diabetes'];
    for (var i = 0; i < groups.length; i++) {
      var name = groups[i];
      var badge = root.querySelector('[data-htn-count="' + name + '"]');
      if (!badge) continue;
      var n = form.querySelectorAll('input[type="checkbox"][name="' + name + '"]:checked').length;
      if (n > 0) {
        badge.textContent = String(n);
        badge.hidden = false;
      } else {
        badge.textContent = '';
        badge.hidden = true;
      }
    }
  }

  function updateClinicalVisibility() {
    var show = false;
    if (isBpReady()) {
      var c = classifyBloodPressure(parsePressure(sbpInput.value), parsePressure(dbpInput.value));
      show = c.riskApplicable;
      degreePreview.textContent = degreeLabel(c.key);
      degreePreview.hidden = false;
    } else {
      degreePreview.hidden = true;
    }
    for (var i = 0; i < clinicalSections.length; i++) {
      clinicalSections[i].hidden = !show;
      if (!show) clinicalSections[i].open = false;
    }
    updateSectionCounts();
  }

  function hideResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function updateButton() {
    var ok = isBpReady();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
  }

  function refresh(showEmpty) {
    updateFieldError(sbpInput, sbpError, LIMITS.sbp, 'Укажите САД', showEmpty);
    updateFieldError(dbpInput, dbpError, LIMITS.dbp, 'Укажите ДАД', showEmpty);
    updateClinicalVisibility();
    updateButton();
  }

  function calculate() {
    var sbp = parsePressure(sbpInput.value);
    var dbp = parsePressure(dbpInput.value);
    var classified = classifyBloodPressure(sbp, dbp);
    var degreeKey = classified.key;
    var riskFactors = classified.riskApplicable ? collectChecked('riskFactors') : [];
    var pom = classified.riskApplicable ? collectChecked('pom') : [];
    var aks = classified.riskApplicable ? collectChecked('aks') : [];
    var diabetes = classified.riskApplicable ? collectChecked('diabetes') : [];
    var frCount = riskFactors.length;
    var hasPom = pom.length > 0;
    var hasAks = aks.length > 0;
    var hasDm = diabetes.length > 0;
    var riskRow = resolveRiskRow(frCount, hasPom, hasAks || hasDm);
    var frLabels = classified.riskApplicable ? checkedLabels('riskFactors') : [];
    var pomLabels = classified.riskApplicable ? checkedLabels('pom') : [];
    var aksLabels = classified.riskApplicable ? checkedLabels('aks') : [];

    var stageLabel = null;
    if (classified.ahPresent) {
      if (hasAks) stageLabel = '3 стадия гипертонической болезни';
      else if (hasPom || hasDm) stageLabel = '2 стадия гипертонической болезни';
      else stageLabel = '1 стадия гипертонической болезни';
    }

    var riskKey;
    var riskLabel;
    var recommendation;
    var riskBasis = null;
    var conclusion;
    var conclusionHeadline;

    if (classified.riskApplicable) {
      riskKey = resolveRiskKey(classified.bpColumn, frCount, hasPom, hasAks || hasDm);
      var risk = RISK_META[riskKey] || RISK_META.none;
      riskLabel = risk.label;
      recommendation = risk.recommendation;
      riskBasis = buildRiskBasis(
        riskRow,
        frCount,
        classified.bpColumn,
        pomLabels,
        aksLabels,
        hasDm
      );
      var short = degreeShort(degreeKey);
      var bp = sbp + '/' + dbp + ' мм рт.ст.';
      var headline = short + ', ' + riskLabel;
      var detail = bp + ' Общий ССР: (по Прил. 4: ' + riskBasis + ').';
      if (frLabels.length) detail += ' ФР: ' + frLabels.join('; ') + '.';
      conclusionHeadline = headline;
      conclusion = detail;
    } else {
      riskKey = 'none';
      riskLabel =
        degreeKey === 'optimal' || degreeKey === 'normal'
          ? 'артериальная гипертензия исключена'
          : RISK_META.none.label;
      recommendation = 'Изменение образа жизни при наличии факторов риска.';
      conclusionHeadline = degreeLabel(degreeKey);
      conclusion =
        sbp +
        '/' +
        dbp +
        ' мм рт.ст. Стратификация общего ССР по Прил. 4 не применяется.';
    }

    return {
      degreeLabel: degreeLabel(degreeKey),
      stageLabel: stageLabel,
      riskKey: riskKey,
      riskLabel: riskLabel,
      riskBasis: riskBasis,
      conclusionHeadline: conclusionHeadline,
      conclusion: conclusion,
      recommendation: recommendation,
      sbp: sbp,
      dbp: dbp
    };
  }

  form.addEventListener('input', function () {
    hideResult();
    formError.textContent = '';
    refresh(false);
  });
  form.addEventListener('change', function () {
    hideResult();
    formError.textContent = '';
    refresh(false);
    updateSectionCounts();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.textContent = '';
    hideResult();
    refresh(true);
    if (!isBpReady()) return;
    try {
      var out = calculate();
      resultHeadline.textContent = out.conclusionHeadline || '';
      resultConclusion.textContent = out.conclusion;
      resultDegree.textContent = out.degreeLabel;
      resultRisk.textContent = out.riskLabel;
      if (out.riskBasis) {
        resultBasis.textContent = out.riskBasis;
        resultBasisWrap.hidden = false;
      } else {
        resultBasis.textContent = '';
        resultBasisWrap.hidden = true;
      }
      resultRec.textContent = out.recommendation;
      resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    } catch (err) {
      formError.textContent = err.message || 'Ошибка расчёта';
    }
  });

  refresh(false);
})();
