(function () {
  var root = document.querySelector('.fc-calc[data-calculator="score2"]');
  if (!root) return;

  var AGE_MIN = 40;
  var AGE_MAX = 89;
  var SBP_MIN = 90;
  var SBP_MAX = 200;

  var SCALES = {
    score2: {
      male: { scale1: 0.5836, scale2: 0.8294 },
      female: { scale1: 0.9412, scale2: 0.8329 }
    },
    score2Op: {
      male: { scale1: 0.05, scale2: 0.7 },
      female: { scale1: 0.38, scale2: 0.69 }
    }
  };

  var STRATEGY = {
    moz: {
      key: 'moz',
      label: 'МОЖ',
      detail: 'Модификация образа жизни',
      intensity: 0
    },
    mozConsiderLp: {
      key: 'mozConsiderLp',
      label: 'Модификация образа жизни, возможно лекарственный препарат при неэффективности',
      detail: '',
      intensity: 1
    },
    immediateLp: {
      key: 'immediateLp',
      label: 'Рекомендована терапия статином в дозах, необходимых для достижения целевого уровня ХС-ЛПНП',
      detail:
        'При недостижении цели на фоне максимально переносимых доз статинов — комбинированная терапия (эзетимиб и/или бемпедоевая кислота); при очень высоком риске и дальнейшем недостижении — добавить ингибиторы PCSK9 / инклисиран.',
      intensity: 2
    },
    none: {
      key: 'none',
      label: '—',
      detail: 'В таблице рекомендаций для данной комбинации отдельная ячейка не указана',
      intensity: -1
    }
  };

  var LIPID_TARGETS = {
    low: {
      ldl: '< 3,0',
      nonHdl: '< 3,8',
      tg: '< 1,7',
      lpa: '< 50 мг/дл (105 нмоль/л)',
      ldlNote: null
    },
    moderate: {
      ldl: '< 2,6',
      nonHdl: '< 3,4',
      tg: '< 1,7',
      lpa: '< 50 мг/дл (105 нмоль/л)',
      ldlNote: null
    },
    high: {
      ldl: '< 1,8',
      nonHdl: '< 2,6',
      tg: '< 1,7',
      lpa: '< 30 мг/дл (62 нмоль/л)',
      ldlNote: 'и снижение ХС ЛНП на 50% и более от исходного уровня'
    },
    veryHigh: {
      ldl: '< 1,4',
      nonHdl: '< 2,2',
      tg: '< 1,7',
      lpa: '< 30 мг/дл (62 нмоль/л)',
      ldlNote: 'и снижение ХС ЛНП на 50% и более от исходного уровня'
    }
  };

  var INTERVENTION_MATRIX = {
    low: { lt14: 'moz', b14_18: 'moz', b18_26: 'moz', b26_30: 'moz', b30_49: 'mozConsiderLp', ge49: 'none' },
    moderate: {
      lt14: 'moz',
      b14_18: 'moz',
      b18_26: 'moz',
      b26_30: 'mozConsiderLp',
      b30_49: 'mozConsiderLp',
      ge49: 'none'
    },
    high: {
      lt14: 'moz',
      b14_18: 'moz',
      b18_26: 'mozConsiderLp',
      b26_30: 'immediateLp',
      b30_49: 'immediateLp',
      ge49: 'immediateLp'
    },
    veryHighPrimary: {
      lt14: 'mozConsiderLp',
      b14_18: 'immediateLp',
      b18_26: 'immediateLp',
      b26_30: 'immediateLp',
      b30_49: 'immediateLp',
      ge49: 'immediateLp'
    }
  };

  var form = root.querySelector('#fc-calc-score2-form');
  var calcBtn = root.querySelector('#fc-calc-score2-btn');
  var formError = root.querySelector('#fc-calc-score2-form-error');
  var resultWrap = root.querySelector('#fc-calc-score2-result');
  var resultNumber = root.querySelector('#fc-calc-score2-result-number');
  var resultModel = root.querySelector('#fc-calc-score2-result-model');
  var resultCategory = root.querySelector('#fc-calc-score2-result-category');
  var resultTargets = root.querySelector('#fc-calc-score2-result-targets');
  var resultStrategy = root.querySelector('#fc-calc-score2-result-strategy');
  var resultStrategyOut = root.querySelector('#fc-calc-score2-result-strategy-out');
  var resultChart = root.querySelector('#fc-calc-score2-result-chart');
  var nonHdlPreview = root.querySelector('#fc-calc-score2-nonhdl-preview');
  var sexGroup = root.querySelector('[data-sex-group]');
  var smokeGroup = root.querySelector('[data-smoke-group]');
  var nonHdlModeGroup = root.querySelector('[data-nonhdl-mode-group]');
  var nonHdlCalcPanel = root.querySelector('[data-nonhdl-panel="calc"]');
  var nonHdlDirectPanel = root.querySelector('[data-nonhdl-panel="direct"]');

  var CHART_META = window.FC_SCORE2_CHART || null;
  var lastRiskCategory = null;
  var lastAge = null;

  var ageInput = root.querySelector('#fc-calc-score2-age');
  var sbpInput = root.querySelector('#fc-calc-score2-sbp');
  var tcInput = root.querySelector('#fc-calc-score2-tc');
  var hdlInput = root.querySelector('#fc-calc-score2-hdl');
  var nonHdlInput = root.querySelector('#fc-calc-score2-nonhdl');
  var ldlInput = root.querySelector('#fc-calc-score2-ldl');
  var ageError = root.querySelector('#fc-calc-score2-age-error');
  var sbpError = root.querySelector('#fc-calc-score2-sbp-error');
  var tcError = root.querySelector('#fc-calc-score2-tc-error');
  var hdlError = root.querySelector('#fc-calc-score2-hdl-error');
  var nonHdlError = root.querySelector('#fc-calc-score2-nonhdl-error');
  var ldlError = root.querySelector('#fc-calc-score2-ldl-error');

  function getNonHdlMode() {
    return getSegmentValue(nonHdlModeGroup, 'data-nonhdl-mode') || 'calc';
  }

  function parsePositive(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function parseNonNegativeInt(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.trunc(n);
  }

  function hasInput(value) {
    return String(value || '').trim() !== '';
  }

  function formatRu(n) {
    return String(n).replace('.', ',');
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function getSegmentValue(group, attr) {
    var active = group.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute(attr) : null;
  }

  function calibrate(uncalibrated, scale1, scale2) {
    var unc = Math.min(Math.max(uncalibrated, 1e-15), 1 - 1e-15);
    return 1 - Math.exp(-Math.exp(scale1 + scale2 * Math.log(-Math.log(1 - unc))));
  }

  function linearPredictorScore2(sex, age, smoker, sbp, diabetes, tc, hdl) {
    var cage = (age - 60) / 5;
    var csbp = (sbp - 120) / 20;
    var ctc = tc - 6;
    var chdl = (hdl - 1.3) / 0.5;
    if (sex === 'male') {
      return (
        0.3742 * cage +
        0.6012 * smoker +
        0.2777 * csbp +
        0.6457 * diabetes +
        0.1458 * ctc +
        -0.2698 * chdl +
        -0.0755 * cage * smoker +
        -0.0255 * cage * csbp +
        -0.0281 * cage * ctc +
        0.0426 * cage * chdl +
        -0.0983 * cage * diabetes
      );
    }
    return (
      0.4648 * cage +
      0.7744 * smoker +
      0.3131 * csbp +
      0.8096 * diabetes +
      0.1002 * ctc +
      -0.2606 * chdl +
      -0.1088 * cage * smoker +
      -0.0277 * cage * csbp +
      -0.0226 * cage * ctc +
      0.0613 * cage * chdl +
      -0.1272 * cage * diabetes
    );
  }

  function uncalibratedScore2(sex, lp) {
    var s0 = sex === 'male' ? 0.9605 : 0.9776;
    return 1 - Math.pow(s0, Math.exp(lp));
  }

  function linearPredictorScore2Op(sex, age, smoker, sbp, diabetes, tc, hdl) {
    var cage = age - 73;
    var csbp = sbp - 150;
    var ctc = tc - 6;
    var chdl = hdl - 1.4;
    if (sex === 'male') {
      return (
        0.0634 * cage +
        0.4245 * diabetes +
        0.3524 * smoker +
        0.0094 * csbp +
        0.085 * ctc +
        -0.3564 * chdl +
        -0.0174 * cage * diabetes +
        -0.0247 * cage * smoker +
        -0.0005 * cage * csbp +
        0.0073 * cage * ctc +
        0.0091 * cage * chdl
      );
    }
    return (
      0.0789 * cage +
      0.601 * diabetes +
      0.4921 * smoker +
      0.0102 * csbp +
      0.0605 * ctc +
      -0.304 * chdl +
      -0.0107 * cage * diabetes +
      -0.0255 * cage * smoker +
      -0.0004 * cage * csbp +
      -0.0009 * cage * ctc +
      0.0154 * cage * chdl
    );
  }

  function uncalibratedScore2Op(sex, lp) {
    if (sex === 'male') return 1 - Math.pow(0.7576, Math.exp(lp - 0.0929));
    return 1 - Math.pow(0.8082, Math.exp(lp - 0.229));
  }

  function classifyRisk(age, riskPercent) {
    var x = riskPercent;
    if (age < 50) {
      if (x < 2.5) return { key: 'lowModerate', label: 'низкий / умеренный риск' };
      if (x < 7.5) return { key: 'high', label: 'высокий риск' };
      return { key: 'veryHigh', label: 'очень высокий риск' };
    }
    if (age < 70) {
      if (x < 5) return { key: 'lowModerate', label: 'низкий / умеренный риск' };
      if (x < 10) return { key: 'high', label: 'высокий риск' };
      return { key: 'veryHigh', label: 'очень высокий риск' };
    }
    if (x < 7.5) return { key: 'lowModerate', label: 'низкий / умеренный риск' };
    if (x < 15) return { key: 'high', label: 'высокий риск' };
    return { key: 'veryHigh', label: 'очень высокий риск' };
  }

  function ldlBand(ldl) {
    if (ldl < 1.4) return 'lt14';
    if (ldl < 1.8) return 'b14_18';
    if (ldl < 2.6) return 'b18_26';
    if (ldl < 3.0) return 'b26_30';
    if (ldl < 4.9) return 'b30_49';
    return 'ge49';
  }

  function lipidTargetsForCategory(riskCategory, sex) {
    var hdlRange = sex === 'female' ? '1,2–2,2' : '1,0–2,0';
    if (riskCategory === 'lowModerate') {
      return {
        key: 'lowModerate',
        ldl: LIPID_TARGETS.low.ldl + ' (низкий) / ' + LIPID_TARGETS.moderate.ldl + ' (умеренный)',
        ldlNote: null,
        nonHdl: LIPID_TARGETS.low.nonHdl + ' (низкий) / ' + LIPID_TARGETS.moderate.nonHdl + ' (умеренный)',
        hdl: hdlRange,
        tg: LIPID_TARGETS.low.tg,
        lpa: LIPID_TARGETS.low.lpa
      };
    }
    var t = riskCategory === 'high' ? LIPID_TARGETS.high : LIPID_TARGETS.veryHigh;
    return {
      key: riskCategory,
      ldl: t.ldl,
      ldlNote: t.ldlNote,
      nonHdl: t.nonHdl,
      hdl: hdlRange,
      tg: t.tg,
      lpa: t.lpa
    };
  }

  function withElderlyDyslipidemiaNote(strategy, age) {
    if (!strategy || age == null || age < 70) return strategy;
    if (strategy.key !== 'immediateLp' && strategy.key !== 'mozConsiderLp') return strategy;
    var elder =
      'Возраст не является ограничением или противопоказанием к гиполипидемической терапии. Для первичной профилактики у пожилых при высоком / очень высоком риске рекомендована терапия статином; при риске лекарственных взаимодействий — начинать статин с низкой дозы с титрацией до целевого уровня ХС-ЛПНП.';
    return Object.assign({}, strategy, {
      detail: strategy.detail ? strategy.detail + ' ' + elder : elder
    });
  }

  function interventionStrategy(riskRow, ldl) {
    var band = ldlBand(ldl);
    if (riskRow === 'lowModerate') {
      var lowKey = INTERVENTION_MATRIX.low[band];
      var modKey = INTERVENTION_MATRIX.moderate[band];
      if (lowKey === modKey) return Object.assign({}, STRATEGY[lowKey], { split: false });
      return {
        key: 'split',
        label: 'низкий: ' + STRATEGY[lowKey].label + '; умеренный: ' + STRATEGY[modKey].label,
        detail:
          'В объединённой категории SCORE2 «низкий / умеренный» стратегии различаются — см. таблицу в примечании',
        split: true
      };
    }
    var key = INTERVENTION_MATRIX[riskRow] && INTERVENTION_MATRIX[riskRow][band];
    if (!key) return Object.assign({}, STRATEGY.none, { split: false });
    if (key === 'immediateLp') {
      if (riskRow === 'high') {
        return {
          key: 'immediateLp',
          label:
            'Рекомендована терапия статином в дозах, необходимых для достижения целевого уровня ХС-ЛПНП',
          detail:
            'При недостижении целевого уровня ХС-ЛПНП на фоне максимально переносимых доз статинов рекомендовано рассмотреть комбинированную терапию: статин с эзетимибом и/или бемпедоевой кислотой.',
          intensity: 2,
          split: false
        };
      }
      return {
        key: 'immediateLp',
        label:
          'Рекомендована терапия статином в дозах, необходимых для достижения целевого уровня ХС-ЛПНП',
        detail:
          'При недостижении цели на фоне максимально переносимых доз статинов — комбинация с эзетимибом и/или бемпедоевой кислотой; при сохраняющемся недостижении цели добавить ингибиторы PCSK9 / инклисиран.',
        intensity: 2,
        split: false
      };
    }
    return Object.assign({}, STRATEGY[key], { split: false });
  }

  function matrixRowForScore2(riskCategory) {
    if (riskCategory === 'high') return 'high';
    if (riskCategory === 'veryHigh') return 'veryHighPrimary';
    return 'lowModerate';
  }

  function chartCellTone(age, riskPercent) {
    if (age < 50) {
      if (riskPercent < 2.5) return 'green';
      if (riskPercent < 7.5) return 'orange';
      return 'red';
    }
    if (age < 70) {
      if (riskPercent < 5) return 'green';
      if (riskPercent < 10) return 'orange';
      return 'red';
    }
    if (riskPercent < 7.5) return 'green';
    if (riskPercent < 15) return 'orange';
    return 'red';
  }

  function resolveBandIndices(value, bands, ascending) {
    var containIdx = -1;
    var i;
    for (i = 0; i < bands.length; i++) {
      if (value >= bands[i].min && value <= bands[i].max) {
        containIdx = i;
        break;
      }
    }
    if (containIdx < 0) {
      var minAll = bands[0].min;
      var maxAll = bands[0].max;
      for (i = 1; i < bands.length; i++) {
        if (bands[i].min < minAll) minAll = bands[i].min;
        if (bands[i].max > maxAll) maxAll = bands[i].max;
      }
      var edge;
      if (value < minAll) edge = ascending ? 0 : bands.length - 1;
      else if (value > maxAll) edge = ascending ? bands.length - 1 : 0;
      else {
        var best = Infinity;
        edge = 0;
        for (i = 0; i < bands.length; i++) {
          var mid0 = (bands[i].min + bands[i].max) / 2;
          var d0 = Math.abs(value - mid0);
          if (d0 < best) {
            best = d0;
            edge = i;
          }
        }
      }
      return { indices: [edge], mode: 'nearest', primaryIdx: edge, clamped: true };
    }
    var b = bands[containIdx];
    var width = Math.max(b.max - b.min, 1e-9);
    var t = (value - b.min) / width;
    var indices = [containIdx];
    var mode = 'nearest';
    var towardLowerValue = ascending ? containIdx - 1 : containIdx + 1;
    var towardHigherValue = ascending ? containIdx + 1 : containIdx - 1;
    if (t < 0.25 && value > b.min && towardLowerValue >= 0 && towardLowerValue < bands.length) {
      indices.push(towardLowerValue);
      mode = 'between';
    } else if (t > 0.75 && value < b.max && towardHigherValue >= 0 && towardHigherValue < bands.length) {
      indices.push(towardHigherValue);
      mode = 'between';
    }
    indices.sort(function (a, b) {
      return a - b;
    });
    var primaryIdx = containIdx;
    var best = Infinity;
    for (i = 0; i < indices.length; i++) {
      var idx = indices[i];
      var mid = (bands[idx].min + bands[idx].max) / 2;
      var d = Math.abs(value - mid);
      if (d < best) {
        best = d;
        primaryIdx = idx;
      }
    }
    return { indices: indices, mode: mode, primaryIdx: primaryIdx, clamped: false };
  }

  function lookupChart(sex, age, sbp, nonHdl, smoking) {
    if (!CHART_META) return { status: 'OUT', message: 'Таблицы SCORE2 недоступны' };
    var ageBands = CHART_META.ageBands;
    var sbpBands = CHART_META.sbpBands;
    var cholBands = CHART_META.cholBands;
    var ageKey = null;
    var ageLabel = '';
    var model = 'score2';
    for (var k in ageBands) {
      if (!Object.prototype.hasOwnProperty.call(ageBands, k)) continue;
      var band = ageBands[k];
      if (age >= band.min && age <= band.max) {
        ageKey = k;
        ageLabel = band.label;
        model = band.model;
        break;
      }
    }
    if (!ageKey) return { status: 'OUT', message: 'Возраст вне диапазона таблиц (40–89)' };
    if (sbp < 90 || sbp > 200) {
      return { status: 'OUT', message: 'САД вне допустимого диапазона (90–200)' };
    }
    if (!(nonHdl > 0)) {
      return { status: 'OUT', message: 'ХС не-ЛПВП должен быть больше 0' };
    }

    var sbpSel = resolveBandIndices(sbp, sbpBands, false);
    var cholSel = resolveBandIndices(nonHdl, cholBands, true);
    var smokeKey = smoking ? 1 : 0;
    var matrix = CHART_META.chart[sex][ageKey][String(smokeKey)];
    if (!matrix) matrix = CHART_META.chart[sex][ageKey][smokeKey];

    var cells = [];
    var ri;
    var ci;
    for (ri = 0; ri < sbpSel.indices.length; ri++) {
      for (ci = 0; ci < cholSel.indices.length; ci++) {
        var rIdx = sbpSel.indices[ri];
        var cIdx = cholSel.indices[ci];
        var risk = matrix[rIdx][cIdx];
        cells.push({
          sbpIdx: rIdx,
          cholIdx: cIdx,
          sbpLabel: sbpBands[rIdx].label,
          cholLabel: cholBands[cIdx].label,
          riskPercent: risk,
          primary: rIdx === sbpSel.primaryIdx && cIdx === cholSel.primaryIdx,
          tone: chartCellTone(age, risk)
        });
      }
    }
    cells.sort(function (a, b) {
      return a.riskPercent - b.riskPercent;
    });
    var riskMin = cells[0].riskPercent;
    var riskMax = cells[cells.length - 1].riskPercent;
    var primary = null;
    for (var p = 0; p < cells.length; p++) {
      if (cells[p].primary) {
        primary = cells[p];
        break;
      }
    }
    if (!primary) primary = cells[0];
    var mode =
      sbpSel.mode === 'between' || cholSel.mode === 'between' || cells.length > 1
        ? 'between'
        : 'nearest';

    return {
      status: 'OK',
      mode: mode,
      riskPercent: primary.riskPercent,
      riskMin: riskMin,
      riskMax: riskMax,
      ageLabel: ageLabel,
      modelLabel: model === 'score2Op' ? 'SCORE2-OP' : 'SCORE2',
      smokeLabel: smokeKey ? 'курящие' : 'некурящие',
      sexLabel: sex === 'male' ? 'мужчины' : 'женщины',
      sbpIdx: primary.sbpIdx,
      cholIdx: primary.cholIdx,
      sbpLabel: primary.sbpLabel,
      cholLabel: primary.cholLabel,
      cells: cells,
      matrix: matrix,
      tone: chartCellTone(age, primary.riskPercent),
      clamped: !!(sbpSel.clamped || cholSel.clamped),
      clampNote:
        sbpSel.clamped || cholSel.clamped
          ? 'Значение вне напечатанных границ таблицы — использована ближайшая крайняя ячейка (риск не ниже указанного).'
          : null,
      sbpBands: sbpBands,
      cholBands: cholBands
    };
  }

  function calculate(input) {
    var sex = input.sex;
    var age = input.age;
    var sbp = input.sbp;
    var totalChol = input.totalChol;
    var hdl = input.hdl;
    var smoking = input.smoking;
    var ldl = input.ldl;
    var nonHdlVal =
      input.nonHdl != null ? round1(input.nonHdl) : round1(totalChol - hdl);
    var chart = lookupChart(sex, age, sbp, nonHdlVal, smoking);
    if (!chart || chart.status !== 'OK') {
      throw new Error((chart && chart.message) || 'Значения вне диапазона таблиц SCORE2');
    }
    var riskPercent = chart.mode === 'between' ? chart.riskMax : chart.riskPercent;
    var riskDisplay =
      chart.mode === 'between' && chart.riskMin !== chart.riskMax
        ? chart.riskMin + '–' + chart.riskMax
        : String(chart.riskPercent);
    var category = classifyRisk(age, riskPercent);
    return {
      modelLabel: chart.modelLabel,
      riskPercent: riskPercent,
      riskDisplay: riskDisplay,
      riskLabel: category.label,
      riskCategory: category.key,
      age: age,
      nonHdl: nonHdlVal,
      lipidTargets: lipidTargetsForCategory(category.key, sex),
      strategy: ldl != null ? interventionStrategy(matrixRowForScore2(category.key), ldl) : null,
      chart: chart
    };
  }

  function clearFieldError(el) {
    if (el) el.textContent = '';
  }

  function setFieldError(el, msg) {
    if (el) el.textContent = msg || '';
  }

  function syncNonHdlModeUi() {
    var mode = getNonHdlMode();
    var isCalc = mode === 'calc';
    if (nonHdlCalcPanel) nonHdlCalcPanel.hidden = !isCalc;
    if (nonHdlDirectPanel) nonHdlDirectPanel.hidden = isCalc;
    if (tcInput) tcInput.disabled = !isCalc;
    if (hdlInput) hdlInput.disabled = !isCalc;
    if (nonHdlInput) nonHdlInput.disabled = isCalc;
  }

  function updateNonHdlPreview() {
    if (!nonHdlPreview) return;
    if (getNonHdlMode() !== 'calc') {
      nonHdlPreview.textContent = '—';
      return;
    }
    var tc = parsePositive(tcInput.value);
    var hdl = parsePositive(hdlInput.value);
    if (tc != null && hdl != null && tc >= hdl) {
      nonHdlPreview.textContent = formatRu(round1(tc - hdl)) + ' ммоль/л';
    } else {
      nonHdlPreview.textContent = '—';
    }
  }

  function validateFields() {
    var ok = true;
    clearFieldError(ageError);
    clearFieldError(sbpError);
    clearFieldError(tcError);
    clearFieldError(hdlError);
    clearFieldError(nonHdlError);
    formError.textContent = '';

    var age = parseNonNegativeInt(ageInput.value);
    var sbp = parsePositive(sbpInput.value);
    var tc = parsePositive(tcInput.value);
    var hdl = parsePositive(hdlInput.value);
    var nonHdlDirect = parsePositive(nonHdlInput && nonHdlInput.value);
    var mode = getNonHdlMode();

    if (!hasInput(ageInput.value)) {
      setFieldError(ageError, 'Укажите возраст');
      ok = false;
    } else if (age == null || age < AGE_MIN || age > AGE_MAX) {
      setFieldError(ageError, 'Возраст ' + AGE_MIN + '–' + AGE_MAX + ' лет');
      ok = false;
    }

    if (!hasInput(sbpInput.value)) {
      setFieldError(sbpError, 'Укажите САД');
      ok = false;
    } else if (sbp == null || sbp < SBP_MIN || sbp > SBP_MAX) {
      setFieldError(sbpError, 'САД ' + SBP_MIN + '–' + SBP_MAX + ' мм рт.ст.');
      ok = false;
    }

    if (mode === 'direct') {
      if (!hasInput(nonHdlInput.value)) {
        setFieldError(nonHdlError, 'Укажите ХС не-ЛПВП');
        ok = false;
      } else if (nonHdlDirect == null) {
        setFieldError(nonHdlError, 'Некорректное значение');
        ok = false;
      }
    } else {
      if (!hasInput(tcInput.value)) {
        setFieldError(tcError, 'Укажите общий холестерин');
        ok = false;
      } else if (tc == null) {
        setFieldError(tcError, 'Некорректное значение');
        ok = false;
      }

      if (!hasInput(hdlInput.value)) {
        setFieldError(hdlError, 'Укажите ХС ЛПВП');
        ok = false;
      } else if (hdl == null) {
        setFieldError(hdlError, 'Некорректное значение');
        ok = false;
      } else if (tc != null && hdl > tc) {
        setFieldError(hdlError, 'ЛПВП не может быть больше общего холестерина');
        ok = false;
      }
    }

    if (!getSegmentValue(sexGroup, 'data-sex')) {
      formError.textContent = 'Укажите пол';
      ok = false;
    }
    if (getSegmentValue(smokeGroup, 'data-smoke') == null) {
      formError.textContent = 'Укажите курение';
      ok = false;
    }

    return ok;
  }

  function fieldsReady() {
    var base =
      hasInput(ageInput.value) &&
      hasInput(sbpInput.value) &&
      getSegmentValue(sexGroup, 'data-sex') &&
      getSegmentValue(smokeGroup, 'data-smoke') != null;
    if (!base) return false;
    if (getNonHdlMode() === 'direct') {
      return hasInput(nonHdlInput.value);
    }
    return hasInput(tcInput.value) && hasInput(hdlInput.value);
  }

  function updateButton() {
    if (fieldsReady()) {
      calcBtn.disabled = false;
      calcBtn.classList.remove('fc-calc__btn--inactive');
    } else {
      calcBtn.disabled = true;
      calcBtn.classList.add('fc-calc__btn--inactive');
    }
  }

  function setResultTone(tone) {
    var tones = ['green', 'orange', 'red'];
    for (var i = 0; i < tones.length; i++) {
      resultNumber.classList.remove('fc-calc__score2-tone--' + tones[i]);
      resultCategory.classList.remove('fc-calc__score2-tone--' + tones[i]);
    }
    if (tone) {
      resultNumber.classList.add('fc-calc__score2-tone--' + tone);
      resultCategory.classList.add('fc-calc__score2-tone--' + tone);
    }
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
    resultNumber.textContent = '—';
    resultModel.textContent = '';
    resultCategory.textContent = '';
    setResultTone(null);
    lastRiskCategory = null;
    lastAge = null;
    resultTargets.innerHTML = '';
    if (resultStrategyOut) resultStrategyOut.innerHTML = '';
    if (resultStrategy) resultStrategy.hidden = true;
    if (resultChart) {
      resultChart.innerHTML = '';
      resultChart.hidden = true;
    }
  }

  function renderTargets(targets) {
    var notes =
      '<p class="fc-calc__score2-target-note">Примечания:' +
      (targets.ldlNote
        ? ' <span aria-hidden="true">*</span> – ' + targets.ldlNote + '.'
        : '') +
      ' Лп(а) - липопротеин(а).</p>';
    function row(name, value, unit) {
      return (
        '<tr>' +
        '<th scope="row">' +
        name +
        '</th>' +
        '<td><strong>' +
        value +
        (unit ? ' ' + unit : '') +
        '</strong></td>' +
        '</tr>'
      );
    }
    resultTargets.innerHTML =
      '<div class="fc-calc__score2-targets">' +
      '<p class="fc-calc__score2-block-title">Целевые значения липидов</p>' +
      '<p class="fc-calc__score2-targets-source">Согласно методических рекомендаций МЗ&nbsp;РБ №&nbsp;1048 от 09.09.2026</p>' +
      '<div class="fc-calc__table-wrap">' +
      '<table class="fc-calc__table fc-calc__score2-target-table">' +
      '<thead><tr><th>Параметр</th><th>Целевое значение</th></tr></thead>' +
      '<tbody>' +
      row('ХС-ЛПНП', targets.ldl + (targets.ldlNote ? '<sup>*</sup>' : ''), 'ммоль/л') +
      row('ХС-неЛПВП', targets.nonHdl, 'ммоль/л') +
      row('ХС-ЛПВП', targets.hdl, 'ммоль/л') +
      row('ТГ', targets.tg, 'ммоль/л') +
      row('Лп(а)', targets.lpa, '') +
      '</tbody></table></div>' +
      notes +
      '</div>';
  }

  function renderStrategy() {
    if (!resultStrategy || !resultStrategyOut) return;
    resultStrategy.hidden = false;
    clearFieldError(ldlError);

    if (!hasInput(ldlInput.value)) {
      resultStrategyOut.innerHTML =
        '<p class="fc-calc__score2-strategy-hint">Укажите ХС ЛПНП (без лечения), чтобы получить рекомендацию по таблице вмешательств.</p>';
      return;
    }

    var ldl = parsePositive(ldlInput.value);
    if (ldl == null) {
      setFieldError(ldlError, 'Некорректный ХС ЛПНП');
      resultStrategyOut.innerHTML = '';
      return;
    }

    if (!lastRiskCategory) {
      resultStrategyOut.innerHTML =
        '<p class="fc-calc__score2-strategy-hint">Сначала рассчитайте 10-летний риск.</p>';
      return;
    }

    var strategy = withElderlyDyslipidemiaNote(
      interventionStrategy(matrixRowForScore2(lastRiskCategory), ldl),
      lastAge
    );
    resultStrategyOut.innerHTML =
      '<p class="fc-calc__score2-strategy-label">' +
      strategy.label +
      '</p>' +
      (strategy.detail
        ? '<p class="fc-calc__score2-strategy-detail">' + strategy.detail + '</p>'
        : '');
  }

  function renderChart(chart, age) {
    if (!resultChart) return;
    if (!chart || chart.status !== 'OK') {
      resultChart.innerHTML =
        '<p class="fc-calc__score2-block-title">Фрагмент таблицы SCORE2</p>' +
        '<p class="fc-calc__score2-strategy-hint">' +
        ((chart && chart.message) || 'Для выбранных значений ячейка таблицы недоступна.') +
        '</p>';
      resultChart.hidden = false;
      return;
    }

    var captionRisk;
    if (chart.mode === 'between' && chart.riskMin !== chart.riskMax) {
      captionRisk =
        'между <strong>' + chart.riskMin + '%</strong> и <strong>' + chart.riskMax + '%</strong>';
    } else {
      captionRisk = 'ближайшая ячейка: <strong>' + chart.riskPercent + '%</strong>';
    }

    var activeMap = {};
    if (chart.cells) {
      for (var a = 0; a < chart.cells.length; a++) {
        activeMap[chart.cells[a].sbpIdx + ':' + chart.cells[a].cholIdx] = chart.cells[a].primary
          ? 'primary'
          : 'neighbor';
      }
    } else {
      activeMap[chart.sbpIdx + ':' + chart.cholIdx] = 'primary';
    }

    var html =
      '<p class="fc-calc__score2-block-title">Фрагмент таблицы ' +
      chart.modelLabel +
      '</p>' +
      '<p class="fc-calc__score2-chart-caption">' +
      chart.sexLabel +
      ', ' +
      chart.smokeLabel +
      ', возраст ' +
      chart.ageLabel +
      ' · ' +
      captionRisk +
      '</p>' +
      '<div class="fc-calc__table-wrap"><table class="fc-calc__table fc-calc__score2-chart-snip">' +
      '<thead><tr><th>САД \\ не-ЛПВП</th>';
    for (var c = 0; c < chart.cholBands.length; c++) {
      html += '<th>' + chart.cholBands[c].label + '</th>';
    }
    html += '</tr></thead><tbody>';
    for (var r = 0; r < chart.matrix.length; r++) {
      html += '<tr><th scope="row">' + chart.sbpBands[r].label + '</th>';
      for (var col = 0; col < chart.matrix[r].length; col++) {
        var val = chart.matrix[r][col];
        var tone = chartCellTone(age, val);
        var mark = activeMap[r + ':' + col];
        var active =
          mark === 'primary'
            ? ' fc-calc__score2-chart-cell--active'
            : mark === 'neighbor'
              ? ' fc-calc__score2-chart-cell--neighbor'
              : '';
        html +=
          '<td class="fc-calc__score2-chart-cell fc-calc__score2-chart-cell--' +
          tone +
          active +
          '">' +
          val +
          '</td>';
      }
      html += '</tr>';
    }

    var hint;
    if (chart.mode === 'between' && chart.cells && chart.cells.length > 1) {
      var parts = [];
      for (var h = 0; h < chart.cells.length; h++) {
        parts.push(
          chart.cells[h].riskPercent +
            '% (САД ' +
            chart.cells[h].sbpLabel +
            ', не-ЛПВП ' +
            chart.cells[h].cholLabel +
            ')'
        );
      }
      hint =
        'Значение у границы диапазонов — показаны соседние ячейки: ' +
        parts.join('; ') +
        '. Полные таблицы — в примечании.';
    } else {
      hint =
        'Ближайшая ячейка: САД ' +
        chart.sbpLabel +
        ', не-ЛПВП ' +
        chart.cholLabel +
        ' ммоль/л. Полные таблицы — в примечании.';
    }

    html += '</tbody></table></div><p class="fc-calc__score2-strategy-hint">' + hint + '</p>';
    if (chart.clampNote) {
      html += '<p class="fc-calc__score2-strategy-hint">' + chart.clampNote + '</p>';
    }
    resultChart.innerHTML = html;
    resultChart.hidden = false;
  }

  function renderResult(out) {
    var display = out.riskDisplay != null ? String(out.riskDisplay).replace('.', ',') : formatRu(out.riskPercent);
    resultNumber.textContent = display + '%';
    resultModel.textContent = out.modelLabel + ', регион очень высокого риска';
    resultCategory.textContent = out.riskLabel;
    setResultTone(chartCellTone(out.age, out.riskPercent));
    lastRiskCategory = out.riskCategory;
    lastAge = out.age;
    renderTargets(out.lipidTargets);
    renderStrategy();
    renderChart(out.chart, out.age);
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validateFields()) {
      clearResult();
      return;
    }
    var sex = getSegmentValue(sexGroup, 'data-sex');
    var smoke = getSegmentValue(smokeGroup, 'data-smoke') === 'yes' ? 1 : 0;
    var mode = getNonHdlMode();
    try {
      var payload = {
        sex: sex,
        age: parseNonNegativeInt(ageInput.value),
        sbp: parsePositive(sbpInput.value),
        smoking: smoke
      };
      if (mode === 'direct') {
        payload.nonHdl = parsePositive(nonHdlInput.value);
      } else {
        payload.totalChol = parsePositive(tcInput.value);
        payload.hdl = parsePositive(hdlInput.value);
      }
      var out = calculate(payload);
      formError.textContent = '';
      renderResult(out);
    } catch (err) {
      clearResult();
      formError.textContent = (err && err.message) || 'Проверьте ввод';
    }
  }

  function bindSegment(group, onChange) {
    group.querySelectorAll('.fc-calc__segment').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('.fc-calc__segment').forEach(function (b) {
          b.classList.remove('fc-calc__segment--active');
        });
        btn.classList.add('fc-calc__segment--active');
        clearResult();
        if (typeof onChange === 'function') onChange();
        updateButton();
      });
    });
  }

  bindSegment(sexGroup);
  bindSegment(smokeGroup);
  bindSegment(nonHdlModeGroup, function () {
    syncNonHdlModeUi();
    updateNonHdlPreview();
  });

  [ageInput, sbpInput, tcInput, hdlInput, nonHdlInput].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', function () {
      clearResult();
      updateNonHdlPreview();
      updateButton();
    });
    el.addEventListener('change', function () {
      clearResult();
      updateNonHdlPreview();
      updateButton();
    });
  });

  if (ldlInput) {
    ldlInput.addEventListener('input', function () {
      if (lastRiskCategory) renderStrategy();
    });
    ldlInput.addEventListener('change', function () {
      if (lastRiskCategory) renderStrategy();
    });
  }

  form.addEventListener('submit', onSubmit);
  calcBtn.addEventListener('click', onSubmit);

  var chartOpen = root.querySelector('#fc-calc-score2-chart-open');
  var lightbox = root.querySelector('#fc-calc-score2-lightbox');
  var lightboxImg = root.querySelector('#fc-calc-score2-lightbox-img');

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.removeProperty('overflow');
  }

  function openLightbox() {
    if (!lightbox || !chartOpen || !lightboxImg) return;
    var img = chartOpen.querySelector('img');
    if (!img) return;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || 'Таблица SCORE2 / SCORE2-OP';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  if (chartOpen && lightbox) {
    chartOpen.addEventListener('click', openLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target.closest('[data-lightbox-close]')) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  syncNonHdlModeUi();
  updateNonHdlPreview();
  updateButton();
  clearResult();
})();
