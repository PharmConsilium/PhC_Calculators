  var root = document.querySelector('.fc-calc[data-calculator="peds-percentiles"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-peds-percentiles-form');
  var modeSelect = root.querySelector('#fc-calc-peds-percentiles-mode');
  var calcBtn = root.querySelector('#fc-calc-peds-percentiles-btn');
  var resultWrap = root.querySelector('#fc-calc-peds-percentiles-result');
  var resultMain = root.querySelector('#fc-calc-peds-percentiles-result-main');
  var resultDesc = root.querySelector('#fc-calc-peds-percentiles-result-desc');
  var resultList = root.querySelector('#fc-calc-peds-percentiles-result-list');
  var formError = root.querySelector('#fc-calc-peds-percentiles-form-error');
  var modeHint = root.querySelector('#fc-calc-peds-percentiles-mode-hint');

  var EXAM_DATE_IDS = [
    '#fc-calc-peds-percentiles-growth-u5-birth',
    '#fc-calc-peds-percentiles-growth-u5-exam',
    '#fc-calc-peds-percentiles-growth-o5-birth',
    '#fc-calc-peds-percentiles-growth-o5-exam',
    '#fc-calc-peds-percentiles-head-birth',
    '#fc-calc-peds-percentiles-head-exam',
  ];

  var MODE_HINTS = {
    growthUnder5:
      'Возраст до 5 лет: дата рождения и дата осмотра. До 2 лет выберите способ измерения (длина тела лёжа или рост стоя). Заполните массу, длину тела / рост или оба показателя.',
    growthOver5:
      'Возраст старше 5 лет (до 19 лет для ИМТ и роста, до 10 лет для массы к возрасту): дата рождения и дата осмотра.',
    head: 'Возраст до 5 лет: дата рождения и дата осмотра. Окружность головы в сантиметрах.',
    birthweight: 'Гестационный возраст 20–41 нед., масса при рождении в граммах.',
    fetal: 'Срок 14–40 нед. Параметры УЗИ: AC, FL, HC, BPD (см).',
    targetHeight: 'Рост матери и отца в сантиметрах, пол ребёнка.',
  };

  function num(id) {
    var el = root.querySelector(id);
    if (!el) return null;
    var s = String(el.value || '').trim().replace(',', '.');
    if (!s) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : { error: true };
  }

  function rawValue(id) {
    var el = root.querySelector(id);
    if (!el) return '';
    return String(el.value || '').trim();
  }

  function getSex(group) {
    var seg = root.querySelector('[data-sex-group="' + group + '"]');
    if (!seg) return 'male';
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-sex') : 'male';
  }

  function getWeightUnit(group) {
    var seg = root.querySelector('[data-weight-unit="' + group + '"]');
    if (!seg) return 'kg';
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-unit') : 'kg';
  }

  function getHeightMeasure(group) {
    var seg = root.querySelector('[data-height-measure="' + group + '"]');
    if (!seg) return null;
    var active = seg.querySelector('.fc-calc__segment--active');
    return active ? active.getAttribute('data-measure') : null;
  }

  function needsHeightMeasureChoice(ageMonths) {
    return Number.isFinite(ageMonths) && ageMonths < BODY_LENGTH_MAX_MONTHS;
  }

  function readWeightValue(inputId, unitGroup) {
    var v = rawValue(inputId);
    if (!v) return null;
    var w = weightWithUnitToKg(v, getWeightUnit(unitGroup));
    return Number.isFinite(w) ? w : { error: true };
  }

  function readAgeFromDates(birthId, examId, minMonths, maxMonths, errCode) {
    var birth = rawValue(birthId);
    var exam = rawValue(examId);
    if (!birth || !exam) throw new Error('dates');
    var ageMonths = ageMonthsFromDates(birth, exam);
    if (!Number.isFinite(ageMonths) || ageMonths < 0) throw new Error('dates');
    if (minMonths != null && ageMonths < minMonths) throw new Error(errCode || 'ageMin');
    if (maxMonths != null && ageMonths > maxMonths) throw new Error(errCode || 'ageMax');
    return {
      birthDate: birth,
      examDate: exam,
      ageMonths: ageMonths,
      ageLabel: formatAgeFromDates(birth, exam),
    };
  }

  function setDefaultExamDates() {
    var today = new Date().toISOString().slice(0, 10);
    EXAM_DATE_IDS.forEach(function (id) {
      var el = root.querySelector(id);
      if (el && !el.value) el.value = today;
    });
  }

  function suggestHeightMeasure(ageMonths) {
    if (!Number.isFinite(ageMonths)) return 'L';
    return ageMonths < BODY_LENGTH_MAX_MONTHS ? 'L' : 'H';
  }

  function resolveHeightMeasure(group, ageMonths) {
    if (group === 'growth-o5') return 'H';
    if (needsHeightMeasureChoice(ageMonths)) {
      return getHeightMeasure(group) || 'L';
    }
    return suggestHeightMeasure(ageMonths);
  }

  function updateHeightMeasureUi(birthId, examId, labelId, measureGroup, measureFieldId, fixedMeasure) {
    var measure = fixedMeasure;
    var showChoice = false;
    if (!measure) {
      var birth = rawValue(birthId);
      var exam = rawValue(examId);
      var ageMonths = NaN;
      if (birth && exam) {
        ageMonths = ageMonthsFromDates(birth, exam);
      }
      showChoice = needsHeightMeasureChoice(ageMonths);
      measure = resolveHeightMeasure(measureGroup, ageMonths);
    }
    var field = measureFieldId ? root.querySelector(measureFieldId) : null;
    if (field) field.hidden = !showChoice;
    var labelEl = root.querySelector(labelId);
    if (labelEl) {
      labelEl.textContent =
        (measure === 'H' ? 'Рост' : 'Длина тела') + ', см';
    }
  }

  root.querySelectorAll('.fc-calc__segmented').forEach(function (seg) {
    seg.querySelectorAll('.fc-calc__segment').forEach(function (btn) {
      btn.addEventListener('click', function () {
        seg.querySelectorAll('.fc-calc__segment').forEach(function (b) {
          b.classList.remove('fc-calc__segment--active');
        });
        btn.classList.add('fc-calc__segment--active');
        if (seg.hasAttribute('data-height-measure')) {
          var hmGroup = seg.getAttribute('data-height-measure');
          if (hmGroup === 'growth-u5') {
            updateHeightMeasureUi(
              '#fc-calc-peds-percentiles-growth-u5-birth',
              '#fc-calc-peds-percentiles-growth-u5-exam',
              '#fc-calc-peds-percentiles-growth-u5-height-label',
              'growth-u5',
              '#fc-calc-peds-percentiles-growth-u5-measure-field'
            );
          }
        }
        updateBtn();
      });
    });
  });

  function showMode(mode) {
    root.querySelectorAll('.fc-calc__mode-panel').forEach(function (panel) {
      var active = panel.getAttribute('data-mode') === mode;
      panel.classList.toggle('fc-calc__mode-panel--active', active);
      panel.hidden = !active;
    });
    if (modeHint && MODE_HINTS[mode]) modeHint.textContent = MODE_HINTS[mode];
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
    formError.textContent = '';
    setDefaultExamDates();
    updateBtn();
  }

  modeSelect.addEventListener('change', function () {
    showMode(modeSelect.value);
  });

  function readGrowthInput(prefix, group, minMonths, maxMonths, errCode) {
    var input = { mode: group === 'growth-u5' ? 'growthUnder5' : 'growthOver5' };
    input.sex = getSex(group);
    var age = readAgeFromDates(
      '#fc-calc-peds-percentiles-' + prefix + '-birth',
      '#fc-calc-peds-percentiles-' + prefix + '-exam',
      minMonths,
      maxMonths,
      errCode
    );
    input.birthDate = age.birthDate;
    input.examDate = age.examDate;
    input.ageMonths = age.ageMonths;
    input.ageLabel = age.ageLabel;
    input.heightMeasure = resolveHeightMeasure(group, age.ageMonths);
    var w = readWeightValue('#fc-calc-peds-percentiles-' + prefix + '-weight', group);
    var h = num('#fc-calc-peds-percentiles-' + prefix + '-height');
    if (w && !w.error) input.weightKg = w;
    else if (w && w.error) throw new Error('weight');
    if (h && !h.error) input.heightCm = h;
    else if (h && h.error) throw new Error('height');
    if (!input.weightKg && !input.heightCm) throw new Error('measure');
    return input;
  }

  function canCalculate() {
    try {
      buildInput(modeSelect.value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function buildInput(mode) {
    var input = { mode: mode };
    if (mode === 'growthUnder5') {
      return readGrowthInput('growth-u5', 'growth-u5', 0, MAX_GROWTH_UNDER5_MONTHS, 'ageUnder5');
    }
    if (mode === 'growthOver5') {
      return readGrowthInput(
        'growth-o5',
        'growth-o5',
        MIN_GROWTH_OVER5_MONTHS,
        MAX_HEIGHT_OVER5_MONTHS,
        'ageOver5'
      );
    }
    if (mode === 'birthweight') {
      var bw = num('#fc-calc-peds-percentiles-bw-weeks');
      var bd = num('#fc-calc-peds-percentiles-bw-days') || 0;
      var bwg = num('#fc-calc-peds-percentiles-bw-weight');
      if (bw == null || bw.error || bwg == null || bwg.error) throw new Error('bw');
      input.gestWeeks = bw;
      input.gestDays = bd.error ? 0 : bd;
      input.weightG = bwg;
      return input;
    }
    if (mode === 'head') {
      input.sex = getSex('head');
      var headAge = readAgeFromDates(
        '#fc-calc-peds-percentiles-head-birth',
        '#fc-calc-peds-percentiles-head-exam',
        0,
        MAX_GROWTH_UNDER5_MONTHS,
        'ageHead'
      );
      input.birthDate = headAge.birthDate;
      input.examDate = headAge.examDate;
      input.ageMonths = headAge.ageMonths;
      input.ageLabel = headAge.ageLabel;
      var hd = num('#fc-calc-peds-percentiles-head-cm');
      if (hd == null || hd.error) throw new Error('hd');
      input.headCm = hd;
      return input;
    }
    if (mode === 'fetal') {
      input.sex = getSex('fetal');
      var fw = num('#fc-calc-peds-percentiles-fetal-weeks');
      var fd = num('#fc-calc-peds-percentiles-fetal-days') || 0;
      input.gestWeeks = fw;
      input.gestDays = fd.error ? 0 : fd;
      input.acCm = num('#fc-calc-peds-percentiles-fetal-ac');
      input.flCm = num('#fc-calc-peds-percentiles-fetal-fl');
      input.hcCm = num('#fc-calc-peds-percentiles-fetal-hc');
      input.bpdCm = num('#fc-calc-peds-percentiles-fetal-bpd');
      if (fw == null || fw.error) throw new Error('fw');
      ['acCm', 'flCm', 'hcCm', 'bpdCm'].forEach(function (k) {
        if (input[k] == null || input[k].error) throw new Error('fetal');
      });
      return input;
    }
    if (mode === 'targetHeight') {
      input.sex = getSex('target');
      input.motherHeightCm = num('#fc-calc-peds-percentiles-mother-h');
      input.fatherHeightCm = num('#fc-calc-peds-percentiles-father-h');
      if (
        input.motherHeightCm == null ||
        input.motherHeightCm.error ||
        input.fatherHeightCm == null ||
        input.fatherHeightCm.error
      ) {
        throw new Error('th');
      }
      return input;
    }
    throw new Error('mode');
  }

  function clearResult() {
    resultList.innerHTML = '';
    resultMain.textContent = '';
    resultDesc.textContent = '';
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function updateBtn() {
    updateHeightMeasureUi(
      '#fc-calc-peds-percentiles-growth-u5-birth',
      '#fc-calc-peds-percentiles-growth-u5-exam',
      '#fc-calc-peds-percentiles-growth-u5-height-label',
      'growth-u5',
      '#fc-calc-peds-percentiles-growth-u5-measure-field'
    );
    updateHeightMeasureUi(
      '#fc-calc-peds-percentiles-growth-o5-birth',
      '#fc-calc-peds-percentiles-growth-o5-exam',
      '#fc-calc-peds-percentiles-growth-o5-height-label',
      'growth-o5',
      null,
      'H'
    );
    var ok = canCalculate();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
    if (!ok) clearResult();
  }

  form.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', updateBtn);
    el.addEventListener('change', updateBtn);
  });

  function prependAgeLine(ageLabel) {
    if (!ageLabel) return;
    var li = document.createElement('li');
    li.textContent = 'Возраст: ' + ageLabel;
    resultList.insertBefore(li, resultList.firstChild);
  }

  function prependAgeAndBmiLines(ageLabel, bmi) {
    var lines = [];
    if (ageLabel) lines.push('Возраст: ' + ageLabel);
    if (bmi != null) lines.push('ИМТ: ' + bmi + ' кг/м²');
    for (var i = lines.length - 1; i >= 0; i--) {
      var li = document.createElement('li');
      li.textContent = lines[i];
      resultList.insertBefore(li, resultList.firstChild);
    }
  }

  function measureLine(label, band, zScore) {
    var li = document.createElement('li');
    var zPart =
      zScore != null && typeof formatZScore === 'function'
        ? ' (z = ' + formatZScore(zScore) + ')'
        : '';
    li.textContent = label + ': ' + band + zPart;
    resultList.appendChild(li);
  }

  function renderResult(out) {
    resultList.innerHTML = '';
    if (out.mode === 'growthUnder5' || out.mode === 'growthOver5' || out.mode === 'baby') {
      resultMain.textContent = 'Физическое развитие ребёнка';
      resultDesc.textContent = '';
      prependAgeAndBmiLines(out.ageLabel, out.bmi);
      out.results.forEach(function (r) {
        if (r.band == null && r.text) {
          var li = document.createElement('li');
          li.textContent = r.text;
          resultList.appendChild(li);
        } else {
          measureLine(r.label, r.band, r.zScore);
        }
      });
    } else if (out.mode === 'targetHeight') {
      resultMain.textContent = '—';
      resultDesc.textContent = '';
      var thRows = [
        ['Потенциал роста', out.potentialCm + ' см'],
        [
          'Z-показатель',
          out.zScore != null && typeof formatZScore === 'function'
            ? formatZScore(out.zScore)
            : String(out.zScore),
        ],
        [
          'Процентиль роста',
          out.percentile % 1 === 0 ? String(out.percentile) : out.percentile.toFixed(1),
        ],
        ['Диапазон', out.rangeLowCm + '–' + out.rangeHighCm + ' см'],
      ];
      thRows.forEach(function (row) {
        var li = document.createElement('li');
        li.textContent = row[0] + ': ' + row[1];
        resultList.appendChild(li);
      });
    } else if (out.mode === 'fetal') {
      resultMain.textContent = 'Масса плода: ' + out.band;
      resultDesc.textContent = out.efwG + ' г. ' + (out.note || '');
    } else if (out.mode === 'head' || out.mode === 'weight') {
      resultMain.textContent = '—';
      resultDesc.textContent = '';
      prependAgeLine(out.ageLabel);
      measureLine(
        out.measureLabel || (out.mode === 'head' ? 'Окружность головы' : 'Масса'),
        out.band,
        out.zScore
      );
    } else if (out.mode === 'birthweight') {
      resultMain.textContent = 'Масса при рождении: ' + out.band;
      resultDesc.textContent = out.weightG + ' г';
    } else {
      resultMain.textContent = out.band;
      resultDesc.textContent = out.summary || '';
    }
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.textContent = '';
    try {
      var input = buildInput(modeSelect.value);
      var out = calculate(input);
      renderResult(out);
    } catch (err) {
      var fieldErrors = {
        dates: 'Укажите дату рождения и дату осмотра (осмотр не раньше рождения)',
        ageUnder5: 'Возраст на дату осмотра превышает 5 лет (60 мес.)',
        ageOver5: 'Возраст на дату осмотра меньше 5 лет (61 мес.)',
        ageHead: 'Возраст на дату осмотра превышает 5 лет (60 мес.)',
        weight: 'Укажите массу в кг или г',
        height: 'Укажите длину тела / рост в см',
        measure: 'Укажите хотя бы массу или длину тела / рост',
      };
      formError.textContent =
        fieldErrors[err.message] ||
        (err.message && !/^(bw|hd|fw|fetal|th|mode)$/.test(err.message)
          ? err.message
          : 'Проверьте введённые данные');
    }
  });

  setDefaultExamDates();
  showMode(modeSelect.value);
