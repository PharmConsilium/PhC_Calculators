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
    '#fc-calc-peds-percentiles-baby-exam',
    '#fc-calc-peds-percentiles-bmi-exam',
    '#fc-calc-peds-percentiles-height-exam',
    '#fc-calc-peds-percentiles-head-exam',
    '#fc-calc-peds-percentiles-weight-exam',
  ];

  var MODE_HINTS = {
    baby: 'Возраст до 2 лет: дата рождения и дата осмотра. Заполните хотя бы одно измерение.',
    birthweight: 'Гестационный возраст 20–41 нед., масса при рождении в граммах.',
    bmi: 'Возраст до 19 лет: дата рождения и дата осмотра. До 2 лет — длина тела, после — рост.',
    height: 'Возраст до 5 лет: дата рождения и дата осмотра. До 2 лет — длина тела, после — рост (см).',
    head: 'Возраст до 5 лет: дата рождения и дата осмотра. Окружность головы в сантиметрах.',
    weight: 'Возраст до 5 лет: дата рождения и дата осмотра. Масса в кг или г.',
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

  function readWeightValue(inputId, unitGroup) {
    var v = rawValue(inputId);
    if (!v) return null;
    var w = weightWithUnitToKg(v, getWeightUnit(unitGroup));
    return Number.isFinite(w) ? w : { error: true };
  }

  function readAgeFromDates(birthId, examId, maxMonths, errCode) {
    var birth = rawValue(birthId);
    var exam = rawValue(examId);
    if (!birth || !exam) throw new Error('dates');
    var ageMonths = ageMonthsFromDates(birth, exam);
    if (!Number.isFinite(ageMonths) || ageMonths < 0) throw new Error('dates');
    if (ageMonths > maxMonths) throw new Error(errCode || 'ageMax');
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

  function updateHeightFieldLabels() {
    [
      {
        birth: '#fc-calc-peds-percentiles-bmi-birth',
        exam: '#fc-calc-peds-percentiles-bmi-exam',
        label: '#fc-calc-peds-percentiles-bmi-height-label',
      },
      {
        birth: '#fc-calc-peds-percentiles-height-birth',
        exam: '#fc-calc-peds-percentiles-height-exam',
        label: '#fc-calc-peds-percentiles-height-cm-label',
      },
    ].forEach(function (pair) {
      var labelEl = root.querySelector(pair.label);
      if (!labelEl) return;
      var birth = rawValue(pair.birth);
      var exam = rawValue(pair.exam);
      var term = 'Длина тела';
      if (birth && exam) {
        var ageMonths = ageMonthsFromDates(birth, exam);
        if (Number.isFinite(ageMonths)) term = heightMeasureLabel(ageMonths);
      }
      labelEl.textContent = term + ', см';
    });
  }

  root.querySelectorAll('.fc-calc__segmented').forEach(function (seg) {
    seg.querySelectorAll('.fc-calc__segment').forEach(function (btn) {
      btn.addEventListener('click', function () {
        seg.querySelectorAll('.fc-calc__segment').forEach(function (b) {
          b.classList.remove('fc-calc__segment--active');
        });
        btn.classList.add('fc-calc__segment--active');
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

  function canCalculate() {
    var mode = modeSelect.value;
    try {
      buildInput(mode);
      return true;
    } catch (e) {
      return false;
    }
  }

  function buildInput(mode) {
    var input = { mode: mode };
    if (mode === 'baby') {
      input.sex = getSex('baby');
      var babyAge = readAgeFromDates(
        '#fc-calc-peds-percentiles-baby-birth',
        '#fc-calc-peds-percentiles-baby-exam',
        24,
        'age'
      );
      input.birthDate = babyAge.birthDate;
      input.examDate = babyAge.examDate;
      input.ageMonths = babyAge.ageMonths;
      input.ageLabel = babyAge.ageLabel;
      var w = readWeightValue('#fc-calc-peds-percentiles-baby-weight', 'baby');
      var h = num('#fc-calc-peds-percentiles-baby-height');
      var hc = num('#fc-calc-peds-percentiles-baby-head');
      if (w && !w.error) input.weightKg = w;
      else if (w && w.error) throw new Error('weight');
      if (h && !h.error) input.heightCm = h;
      if (hc && !hc.error) input.headCm = hc;
      if (!input.weightKg && !input.heightCm && !input.headCm) throw new Error('measure');
    } else if (mode === 'birthweight') {
      var bw = num('#fc-calc-peds-percentiles-bw-weeks');
      var bd = num('#fc-calc-peds-percentiles-bw-days') || 0;
      var bwg = num('#fc-calc-peds-percentiles-bw-weight');
      if (bw == null || bw.error || bwg == null || bwg.error) throw new Error('bw');
      input.gestWeeks = bw;
      input.gestDays = bd.error ? 0 : bd;
      input.weightG = bwg;
    } else if (mode === 'bmi') {
      input.sex = getSex('bmi');
      var bmiAge = readAgeFromDates(
        '#fc-calc-peds-percentiles-bmi-birth',
        '#fc-calc-peds-percentiles-bmi-exam',
        228,
        'ageBmi'
      );
      input.birthDate = bmiAge.birthDate;
      input.examDate = bmiAge.examDate;
      input.ageLabel = bmiAge.ageLabel;
      var bmw = readWeightValue('#fc-calc-peds-percentiles-bmi-weight', 'bmi');
      var bmh = num('#fc-calc-peds-percentiles-bmi-height');
      if (bmw && bmh && !bmw.error && !bmh.error) {
        input.weightKg = bmw;
        input.heightCm = bmh;
      } else throw new Error('bmi');
    } else if (mode === 'height') {
      input.sex = getSex('height');
      var heightAge = readAgeFromDates(
        '#fc-calc-peds-percentiles-height-birth',
        '#fc-calc-peds-percentiles-height-exam',
        60,
        'ageHeight'
      );
      input.birthDate = heightAge.birthDate;
      input.examDate = heightAge.examDate;
      input.ageMonths = heightAge.ageMonths;
      input.ageLabel = heightAge.ageLabel;
      var hc2 = num('#fc-calc-peds-percentiles-height-cm');
      if (hc2 == null || hc2.error) throw new Error('h');
      input.heightCm = hc2;
    } else if (mode === 'head') {
      input.sex = getSex('head');
      var headAge = readAgeFromDates(
        '#fc-calc-peds-percentiles-head-birth',
        '#fc-calc-peds-percentiles-head-exam',
        60,
        'ageHead'
      );
      input.birthDate = headAge.birthDate;
      input.examDate = headAge.examDate;
      input.ageMonths = headAge.ageMonths;
      input.ageLabel = headAge.ageLabel;
      var hd = num('#fc-calc-peds-percentiles-head-cm');
      if (hd == null || hd.error) throw new Error('hd');
      input.headCm = hd;
    } else if (mode === 'weight') {
      input.sex = getSex('weight');
      var weightAge = readAgeFromDates(
        '#fc-calc-peds-percentiles-weight-birth',
        '#fc-calc-peds-percentiles-weight-exam',
        60,
        'ageWeight'
      );
      input.birthDate = weightAge.birthDate;
      input.examDate = weightAge.examDate;
      input.ageMonths = weightAge.ageMonths;
      input.ageLabel = weightAge.ageLabel;
      var wk = readWeightValue('#fc-calc-peds-percentiles-weight-value', 'weight');
      if (wk == null || wk.error) throw new Error('wk');
      input.weightKg = wk;
    } else if (mode === 'fetal') {
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
    } else if (mode === 'targetHeight') {
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
    }
    return input;
  }

  function updateBtn() {
    updateHeightFieldLabels();
    var ok = canCalculate();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
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
    if (out.mode === 'baby') {
      resultMain.textContent = 'Физическое развитие ребенка';
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
      ];
      thRows.forEach(function (row) {
        var li = document.createElement('li');
        li.textContent = row[0] + ': ' + row[1];
        resultList.appendChild(li);
      });
    } else if (out.mode === 'fetal') {
      resultMain.textContent = 'Масса плода: ' + out.band;
      resultDesc.textContent = out.efwG + ' г. ' + (out.note || '');
    } else if (out.mode === 'bmi') {
      resultMain.textContent = 'ИМТ: ' + out.bmi + ' кг/м²';
      resultDesc.textContent =
        out.band +
        (out.zScore != null && typeof formatZScore === 'function'
          ? ' (z = ' + formatZScore(out.zScore) + ')'
          : '');
      prependAgeLine(out.ageLabel);
    } else if (out.mode === 'height') {
      resultMain.textContent = '—';
      resultDesc.textContent = '';
      prependAgeLine(out.ageLabel);
      measureLine(out.heightLabel || 'Рост', out.band, out.zScore);
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
        age: 'Возраст на дату осмотра превышает 2 года (24 мес.)',
        ageBmi: 'Возраст на дату осмотра превышает 19 лет',
        ageHeight: 'Возраст на дату осмотра превышает 5 лет (60 мес.)',
        ageHead: 'Возраст на дату осмотра превышает 5 лет (60 мес.)',
        ageWeight: 'Возраст на дату осмотра превышает 5 лет (60 мес.)',
        weight: 'Укажите массу в кг или г',
        measure: 'Укажите хотя бы одно: вес, длина тела или окружность головы',
      };
      formError.textContent =
        fieldErrors[err.message] ||
        (err.message && !/^(bw|bmi|h|hd|wk|fw|fetal|th)$/.test(err.message)
          ? err.message
          : 'Проверьте введённые данные');
    }
  });

  setDefaultExamDates();
  showMode(modeSelect.value);
