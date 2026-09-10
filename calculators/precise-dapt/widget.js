(function () {
  var root = document.querySelector('.fc-calc[data-calculator="precise-dapt"]');
  if (!root) return;

  var UMOL_TO_MG_DL = 88.4;
  var LIMITS = {
    hemoglobinGl: { min: 40, max: 200 },
    wbc: { min: 1, max: 50 },
    age: { min: 18, max: 110 },
    crCl: { min: 1, max: 200 },
    weightKg: { min: 20, max: 300 },
    creatinineUmol: { min: 10, max: 2000 },
    creatinineMgDl: { min: 0.1, max: 30 }
  };

  var form = root.querySelector('#fc-calc-precise-dapt-form');
  var calcBtn = root.querySelector('#fc-calc-precise-dapt-btn');
  var formError = root.querySelector('#fc-calc-precise-dapt-form-error');
  var resultWrap = root.querySelector('#fc-calc-precise-dapt-result');
  var resultNumber = root.querySelector('#fc-calc-precise-dapt-result-number');
  var resultBand = root.querySelector('#fc-calc-precise-dapt-result-band');
  var resultDesc = root.querySelector('#fc-calc-precise-dapt-result-desc');
  var bleedGroup = root.querySelector('[data-bleed-group]');
  var crClModeGroup = root.querySelector('[data-crcl-mode-group]');
  var sexGroup = root.querySelector('[data-sex-group]');
  var panelKnown = root.querySelector('[data-crcl-panel="known"]');
  var panelCalc = root.querySelector('[data-crcl-panel="calc"]');
  var weightInput = root.querySelector('#fc-calc-precise-dapt-weight');
  var weightError = root.querySelector('#fc-calc-precise-dapt-weight-error');
  var creatInput = root.querySelector('#fc-calc-precise-dapt-creat');
  var creatUnit = root.querySelector('#fc-calc-precise-dapt-creat-unit');
  var creatError = root.querySelector('#fc-calc-precise-dapt-creat-error');
  var cgError = root.querySelector('#fc-calc-precise-dapt-cg-error');
  var crClPreview = root.querySelector('#fc-calc-precise-dapt-crcl-preview');
  var crClPreviewValue = root.querySelector('#fc-calc-precise-dapt-crcl-preview-value');

  var FIELDS = [
    {
      input: root.querySelector('#fc-calc-precise-dapt-hb'),
      error: root.querySelector('#fc-calc-precise-dapt-hb-error'),
      limits: LIMITS.hemoglobinGl,
      emptyMsg: 'Укажите гемоглобин'
    },
    {
      input: root.querySelector('#fc-calc-precise-dapt-wbc'),
      error: root.querySelector('#fc-calc-precise-dapt-wbc-error'),
      limits: LIMITS.wbc,
      emptyMsg: 'Укажите лейкоциты'
    },
    {
      input: root.querySelector('#fc-calc-precise-dapt-age'),
      error: root.querySelector('#fc-calc-precise-dapt-age-error'),
      limits: LIMITS.age,
      emptyMsg: 'Укажите возраст'
    },
    {
      input: root.querySelector('#fc-calc-precise-dapt-crcl'),
      error: root.querySelector('#fc-calc-precise-dapt-crcl-error'),
      limits: LIMITS.crCl,
      emptyMsg: 'Укажите клиренс креатинина'
    }
  ];

  var crClMode = 'known';

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

  function hasInput(value) {
    return String(value || '').trim() !== '';
  }

  function rangeError(limits) {
    return 'Число не в корректном интервале ' + limits.min + ' - ' + limits.max;
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function interpolatePoints(value, x0, x1, p0, p1) {
    if (x1 === x0) return p0;
    var t = (value - x0) / (x1 - x0);
    var clamped = Math.min(1, Math.max(0, t));
    return p0 + clamped * (p1 - p0);
  }

  function getBleed() {
    var active = bleedGroup.querySelector('.fc-calc__segment--active');
    if (!active) return null;
    return active.getAttribute('data-bleed') === 'yes';
  }

  function getSex() {
    var active = sexGroup.querySelector('.fc-calc__segment--active');
    return active && active.getAttribute('data-sex') === 'female' ? 'female' : 'male';
  }

  function creatLimits() {
    return creatUnit.value === 'mgdl' ? LIMITS.creatinineMgDl : LIMITS.creatinineUmol;
  }

  function calculateCockcroftGault(age, weightKg, creatinine, unit, sex) {
    if (age == null || weightKg == null || creatinine == null) return null;
    var crMgDl = unit === 'mgdl' ? creatinine : creatinine / UMOL_TO_MG_DL;
    var value = ((140 - age) * weightKg) / (72 * crMgDl);
    if (sex === 'female') value *= 0.85;
    return roundHalfUp(value, 2);
  }

  function resolveCrCl() {
    if (crClMode === 'known') {
      return parsePositive(FIELDS[3].input.value);
    }
    var age = parsePositive(FIELDS[2].input.value);
    var weight = parsePositive(weightInput.value);
    var creat = parsePositive(creatInput.value);
    return calculateCockcroftGault(age, weight, creat, creatUnit.value, getSex());
  }

  function isFieldValid(field) {
    var value = parsePositive(field.input.value);
    if (value == null) return false;
    return value >= field.limits.min && value <= field.limits.max;
  }

  function updateFieldError(field, showEmptyError) {
    if (!hasInput(field.input.value)) {
      field.error.textContent = showEmptyError ? field.emptyMsg : '';
      return;
    }
    var value = parsePositive(field.input.value);
    if (value == null) {
      field.error.textContent = showEmptyError ? field.emptyMsg : '';
      return;
    }
    if (value < field.limits.min || value > field.limits.max) {
      field.error.textContent = rangeError(field.limits);
      return;
    }
    field.error.textContent = '';
  }

  function updateCgErrors(showEmptyError) {
    weightError.textContent = '';
    creatError.textContent = '';
    cgError.textContent = '';

    if (!hasInput(weightInput.value)) {
      if (showEmptyError) weightError.textContent = 'Укажите массу тела';
    } else {
      var weight = parsePositive(weightInput.value);
      if (weight == null) {
        if (showEmptyError) weightError.textContent = 'Укажите массу тела';
      } else if (weight < LIMITS.weightKg.min || weight > LIMITS.weightKg.max) {
        weightError.textContent = rangeError(LIMITS.weightKg);
      }
    }

    var limits = creatLimits();
    if (!hasInput(creatInput.value)) {
      if (showEmptyError) creatError.textContent = 'Укажите креатинин';
    } else {
      var creat = parsePositive(creatInput.value);
      if (creat == null) {
        if (showEmptyError) creatError.textContent = 'Укажите креатинин';
      } else if (creat < limits.min || creat > limits.max) {
        creatError.textContent = rangeError(limits);
      }
    }

    var crCl = resolveCrCl();
    if (crCl != null && (crCl < LIMITS.crCl.min || crCl > LIMITS.crCl.max)) {
      cgError.textContent = 'Рассчитанный клиренс вне интервала ' + LIMITS.crCl.min + ' - ' + LIMITS.crCl.max;
    }
  }

  function updateCrClPreview() {
    if (crClMode !== 'calc') {
      crClPreview.hidden = true;
      return;
    }
    var ageOk = isFieldValid(FIELDS[2]);
    var weight = parsePositive(weightInput.value);
    var creat = parsePositive(creatInput.value);
    var limits = creatLimits();
    var weightOk =
      weight != null && weight >= LIMITS.weightKg.min && weight <= LIMITS.weightKg.max;
    var creatOk = creat != null && creat >= limits.min && creat <= limits.max;
    if (!ageOk || !weightOk || !creatOk) {
      crClPreview.hidden = true;
      return;
    }
    var crCl = calculateCockcroftGault(
      parsePositive(FIELDS[2].input.value),
      weight,
      creat,
      creatUnit.value,
      getSex()
    );
    if (crCl == null) {
      crClPreview.hidden = true;
      return;
    }
    crClPreviewValue.textContent = formatNum(crCl);
    crClPreview.hidden = false;
  }

  function setCrClMode(mode) {
    crClMode = mode === 'calc' ? 'calc' : 'known';
    crClModeGroup.querySelectorAll('[data-crcl-mode]').forEach(function (el) {
      el.classList.toggle(
        'fc-calc__segment--active',
        el.getAttribute('data-crcl-mode') === crClMode
      );
    });
    panelKnown.hidden = crClMode !== 'known';
    panelCalc.hidden = crClMode !== 'calc';
    if (crClMode === 'known') {
      weightError.textContent = '';
      creatError.textContent = '';
      cgError.textContent = '';
      crClPreview.hidden = true;
    } else {
      FIELDS[3].error.textContent = '';
    }
  }

  function hideResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function isCgReady() {
    if (!isFieldValid(FIELDS[2])) return false;
    var weight = parsePositive(weightInput.value);
    if (weight == null || weight < LIMITS.weightKg.min || weight > LIMITS.weightKg.max) {
      return false;
    }
    var creat = parsePositive(creatInput.value);
    var limits = creatLimits();
    if (creat == null || creat < limits.min || creat > limits.max) return false;
    var crCl = resolveCrCl();
    return crCl != null && crCl >= LIMITS.crCl.min && crCl <= LIMITS.crCl.max;
  }

  function isReady() {
    var baseOk = FIELDS.slice(0, 3).every(isFieldValid) && getBleed() !== null;
    if (!baseOk) return false;
    if (crClMode === 'known') return isFieldValid(FIELDS[3]);
    return isCgReady();
  }

  function updateButton() {
    var ok = isReady();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
  }

  function classify(total) {
    if (total >= 25) {
      return {
        category: 'high',
        band: 'Высокий риск кровотечений',
        text: 'PRECISE-DAPT ≥ 25 — рекомендована короткая ДАТТ (3–6 месяцев)'
      };
    }
    if (total >= 18) {
      return {
        category: 'moderate',
        band: 'Умеренный риск кровотечений',
        text: 'PRECISE-DAPT 18–24 — стандартная / длительная ДАТТ (обычно 12 месяцев), при отсутствии высокого ишемического риска'
      };
    }
    if (total >= 11) {
      return {
        category: 'low',
        band: 'Низкий риск кровотечений',
        text: 'PRECISE-DAPT 11–17 — стандартная / длительная ДАТТ (обычно 12 месяцев)'
      };
    }
    return {
      category: 'very-low',
      band: 'Очень низкий риск кровотечений',
      text: 'PRECISE-DAPT ≤ 10 — стандартная / длительная ДАТТ (обычно 12 месяцев)'
    };
  }

  function calculate() {
    var hbGl = parsePositive(FIELDS[0].input.value);
    var wbc = parsePositive(FIELDS[1].input.value);
    var age = parsePositive(FIELDS[2].input.value);
    var crCl = resolveCrCl();
    var prior = getBleed();
    var hbGdl = hbGl / 10;

    var parts = {
      hemoglobin: roundHalfUp(interpolatePoints(hbGdl, 12, 10, 0, 15), 1),
      wbc: roundHalfUp(interpolatePoints(wbc, 5, 20, 0, 15), 1),
      age: roundHalfUp(interpolatePoints(age, 50, 90, 0, 19), 1),
      crCl: roundHalfUp(interpolatePoints(crCl, 100, 0, 0, 25), 1),
      priorBleeding: prior ? 26 : 0
    };

    var total = Math.min(
      100,
      roundHalfUp(
        parts.hemoglobin + parts.wbc + parts.age + parts.crCl + parts.priorBleeding,
        0
      )
    );

    return { total: total, crCl: crCl, parts: parts, info: classify(total) };
  }

  function refreshFields(showEmptyError) {
    FIELDS.slice(0, 3).forEach(function (field) {
      updateFieldError(field, showEmptyError);
    });
    if (crClMode === 'known') {
      updateFieldError(FIELDS[3], showEmptyError);
    } else {
      updateCgErrors(showEmptyError);
      updateCrClPreview();
    }
    updateButton();
  }

  if (crClModeGroup) {
    crClModeGroup.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-crcl-mode]');
      if (!btn) return;
      setCrClMode(btn.getAttribute('data-crcl-mode'));
      hideResult();
      refreshFields(false);
    });
  }

  if (sexGroup) {
    sexGroup.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-sex]');
      if (!btn) return;
      sexGroup.querySelectorAll('[data-sex]').forEach(function (el) {
        el.classList.toggle('fc-calc__segment--active', el === btn);
      });
      hideResult();
      refreshFields(false);
    });
  }

  if (bleedGroup) {
    bleedGroup.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-bleed]');
      if (!btn) return;
      bleedGroup.querySelectorAll('[data-bleed]').forEach(function (el) {
        el.classList.toggle('fc-calc__segment--active', el === btn);
      });
      hideResult();
      updateButton();
    });
  }

  form.addEventListener('change', function () {
    hideResult();
    refreshFields(false);
  });

  form.addEventListener('input', function () {
    hideResult();
    refreshFields(false);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.textContent = '';
    hideResult();
    refreshFields(true);
    if (!isReady()) {
      if (getBleed() === null) {
        formError.textContent = 'Укажите наличие предшествующих кровотечений';
      }
      return;
    }
    try {
      var out = calculate();
      resultNumber.textContent = String(out.total);
      resultNumber.className =
        'fc-calc__result-number fc-calc__result-number--' + out.info.category;
      resultBand.textContent = out.info.band;
      resultDesc.textContent = out.info.text;
      resultWrap.classList.remove('fc-calc__result-wrap--hidden');
    } catch (err) {
      formError.textContent = err.message || 'Ошибка расчёта';
    }
  });

  setCrClMode('known');
  updateButton();

  var nomogramOpen = root.querySelector('#fc-calc-precise-dapt-nomogram-open');
  var lightbox = root.querySelector('#fc-calc-precise-dapt-lightbox');
  var lightboxImg = root.querySelector('#fc-calc-precise-dapt-lightbox-img');

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.removeProperty('overflow');
  }

  function openLightbox() {
    if (!lightbox || !nomogramOpen || !lightboxImg) return;
    var img = nomogramOpen.querySelector('img');
    if (!img) return;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || 'Номограмма PRECISE-DAPT';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  if (nomogramOpen && lightbox) {
    nomogramOpen.addEventListener('click', openLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target.closest('[data-lightbox-close]')) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }
})();
