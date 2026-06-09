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

  var MODE_HINTS = {
    baby: 'Возраст до 2 лет (24 мес.): укажите годы и/или месяцы. Заполните хотя бы одно измерение.',
    birthweight: 'Гестационный возраст 20–41 нед., масса при рождении в граммах.',
    bmi: 'Возраст до 19 лет. Укажите массу и рост.',
    height: 'Возраст до 5 лет (60 мес.): укажите годы и/или месяцы. Рост в сантиметрах.',
    head: 'Возраст до 5 лет (60 мес.): укажите годы и/или месяцы. Окружность головы в сантиметрах.',
    weight: 'Возраст до 5 лет (60 мес.): укажите годы и/или месяцы. Масса: кг и/или г.',
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

  function readWeightKg(kgId, gId) {
    var kg = rawValue(kgId);
    var g = rawValue(gId);
    if (!kg && !g) return null;
    var w = weightKgAndGramsToKg(kg, g);
    return Number.isFinite(w) ? w : { error: true };
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
      var ageYears = rawValue('#fc-calc-peds-percentiles-baby-age-years');
      var ageMonthsPart = rawValue('#fc-calc-peds-percentiles-baby-age-months');
      var ageMonths = ageYearsAndMonthsToMonths(ageYears, ageMonthsPart);
      if (!Number.isFinite(ageMonths)) throw new Error('age');
      input.ageMonths = ageMonths;
      var w = readWeightKg(
        '#fc-calc-peds-percentiles-baby-weight-kg',
        '#fc-calc-peds-percentiles-baby-weight-g'
      );
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
      var by = num('#fc-calc-peds-percentiles-bmi-years') || 0;
      var bm = num('#fc-calc-peds-percentiles-bmi-months') || 0;
      if (by && by.error) throw new Error('age');
      if (bm && bm.error) throw new Error('age');
      input.ageYears = by || 0;
      input.ageMonthsPart = bm || 0;
      var bmw = num('#fc-calc-peds-percentiles-bmi-weight');
      var bmh = num('#fc-calc-peds-percentiles-bmi-height');
      if (bmw && bmh && !bmw.error && !bmh.error) {
        input.weightKg = bmw;
        input.heightCm = bmh;
      } else throw new Error('bmi');
    } else if (mode === 'height') {
      input.sex = getSex('height');
      var hy = rawValue('#fc-calc-peds-percentiles-height-years');
      var hm = rawValue('#fc-calc-peds-percentiles-height-months');
      var hAge = ageYearsAndMonthsToMonths(hy, hm, 60);
      if (!Number.isFinite(hAge)) throw new Error('ageHeight');
      input.ageMonths = hAge;
      var hc2 = num('#fc-calc-peds-percentiles-height-cm');
      if (hc2 == null || hc2.error) throw new Error('h');
      input.heightCm = hc2;
    } else if (mode === 'head') {
      input.sex = getSex('head');
      var headY = rawValue('#fc-calc-peds-percentiles-head-years');
      var headM = rawValue('#fc-calc-peds-percentiles-head-months');
      var headAge = ageYearsAndMonthsToMonths(headY, headM, 60);
      if (!Number.isFinite(headAge)) throw new Error('ageHead');
      input.ageMonths = headAge;
      var hd = num('#fc-calc-peds-percentiles-head-cm');
      if (hd == null || hd.error) throw new Error('hd');
      input.headCm = hd;
    } else if (mode === 'weight') {
      input.sex = getSex('weight');
      var wy = rawValue('#fc-calc-peds-percentiles-weight-years');
      var wm = rawValue('#fc-calc-peds-percentiles-weight-months');
      var wAge = ageYearsAndMonthsToMonths(wy, wm, 60);
      if (!Number.isFinite(wAge)) throw new Error('ageWeight');
      input.ageMonths = wAge;
      var wk = readWeightKg(
        '#fc-calc-peds-percentiles-weight-kg',
        '#fc-calc-peds-percentiles-weight-g'
      );
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
    var ok = canCalculate();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
  }

  form.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', updateBtn);
    el.addEventListener('change', updateBtn);
  });

  function pctLabel(p, pHi) {
    if (pHi != null && pHi !== p) {
      return Math.round(p) + '–' + Math.round(pHi) + '-й процентиль';
    }
    return Math.round(p) + '-й процентиль';
  }

  function renderResult(out) {
    resultList.innerHTML = '';
    if (out.mode === 'baby') {
      resultMain.textContent = 'Процентили младенца';
      resultDesc.textContent = '';
      out.results.forEach(function (r) {
        var li = document.createElement('li');
        li.textContent =
          r.label + ': ' + r.band + ' (' + pctLabel(r.percentile, r.percentileHi) + ')';
        resultList.appendChild(li);
      });
    } else if (out.mode === 'targetHeight') {
      resultMain.textContent = '—';
      resultDesc.textContent = '';
      var thRows = [
        ['Потенциал роста', out.potentialCm + ' см'],
        ['Z-показатель', String(out.zScore)],
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
      resultMain.textContent = out.efwG + ' г';
      resultDesc.textContent = out.band + '. ' + (out.note || '');
    } else if (out.mode === 'bmi') {
      resultMain.textContent = out.bmi + ' кг/м²';
      resultDesc.textContent = out.band + ' (~' + Math.round(out.percentile) + '-й процентиль)';
    } else if (out.mode === 'height' || out.mode === 'head' || out.mode === 'weight') {
      var exactPct =
        out.percentile % 1 === 0 ? String(out.percentile) : out.percentile.toFixed(1);
      resultMain.textContent = exactPct + '-й процентиль';
      resultDesc.textContent = out.band;
    } else {
      resultMain.textContent = pctLabel(out.percentile, out.percentileHi);
      resultDesc.textContent = out.band + (out.summary ? ' — ' + out.summary : '');
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
        age: 'Укажите возраст до 2 лет (годы и/или месяцы, не более 24 мес.)',
        ageHeight: 'Укажите возраст до 5 лет (годы и/или месяцы, не более 60 мес.)',
        ageHead: 'Укажите возраст до 5 лет (годы и/или месяцы, не более 60 мес.)',
        ageWeight: 'Укажите возраст до 5 лет (годы и/или месяцы, не более 60 мес.)',
        weight: 'Укажите массу: кг и/или г (граммы 0–999 при указании кг)',
        measure: 'Укажите хотя бы одно: вес, рост или окружность головы',
      };
      formError.textContent =
        fieldErrors[err.message] ||
        (err.message && !/^(bw|bmi|h|hd|wk|fw|fetal|th)$/.test(err.message)
          ? err.message
          : 'Проверьте введённые данные');
    }
  });

  showMode(modeSelect.value);
