(function () {
  var root = document.querySelector('.fc-calc[data-calculator="sofa"]');
  if (!root) return;

  var LIMITS = {
    pao2: { min: 20, max: 700 },
    fio2: { min: 21, max: 100 },
    platelets: { min: 1, max: 2000 },
    bilirubin: { min: 0.1, max: 100 },
    creatinine: { min: 0.1, max: 30 },
    urineOutput: { min: 0, max: 10000 },
    sbp: { min: 40, max: 300 },
    rr: { min: 4, max: 80 },
  };

  var GCS_PARTS = ['eye', 'motor', 'verbal'];

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
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var list = Array.prototype.slice.call(tabs);
      var index = list.indexOf(tab);
      if (index < 0) return;
      var next = e.key === 'ArrowRight' ? index + 1 : index - 1;
      if (next < 0) next = list.length - 1;
      if (next >= list.length) next = 0;
      list[next].focus();
      switchMode(list[next].getAttribute('data-mode'));
    });
  });

  function parseNumber(value) {
    var s = String(value || '').trim().replace(',', '.');
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function hasValue(value) {
    return String(value || '').trim() !== '';
  }

  function rangeError(limits) {
    return 'Число не в корректном интервале ' + limits.min + ' - ' + limits.max;
  }

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function hideResult(mode) {
    var wrap = root.querySelector('#fc-calc-sofa-result-' + mode);
    if (wrap) wrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function isFieldValid(input, limits, allowZero) {
    if (!input || !hasValue(input.value)) return false;
    var value = parseNumber(input.value);
    if (value == null || (!allowZero && value <= 0)) return false;
    return value >= limits.min && value <= limits.max;
  }

  function updateFieldError(input, errorEl, limits, emptyMsg, allowZero, showEmptyError) {
    if (!input || !errorEl) return;
    if (!hasValue(input.value)) {
      errorEl.textContent = showEmptyError ? emptyMsg : '';
      return;
    }
    var value = parseNumber(input.value);
    if (value == null || (!allowZero && value <= 0)) {
      errorEl.textContent = showEmptyError ? emptyMsg : '';
      return;
    }
    if (value < limits.min || value > limits.max) {
      errorEl.textContent = rangeError(limits);
      return;
    }
    errorEl.textContent = '';
  }

  function pao2ToMmHg(value, unit) {
    return unit === 'kpa' ? value * 7.50062 : value;
  }

  function fio2ToFraction(value, unit) {
    return unit === 'percent' ? value / 100 : value;
  }

  function bilirubinToMgDl(value, unit) {
    return unit === 'umol' ? value / 17.1 : value;
  }

  function creatinineToMgDl(value, unit) {
    return unit === 'umol' ? value / 88.4 : value;
  }

  function sbpToMmHg(value, unit) {
    return unit === 'kpa' ? value * 7.50062 : value;
  }

  function scoreRespiration(ratio, ventilator) {
    if (ratio > 400) return 0;
    if (ratio > 300) return 1;
    if (ratio > 200) return 2;
    if (!ventilator) return 2;
    if (ratio > 100) return 3;
    return 4;
  }

  function scoreCoagulation(platelets) {
    if (platelets >= 150) return 0;
    if (platelets >= 100) return 1;
    if (platelets >= 50) return 2;
    if (platelets >= 20) return 3;
    return 4;
  }

  function scoreLiver(bilirubinMgDl) {
    if (bilirubinMgDl < 1.2) return 0;
    if (bilirubinMgDl < 2.0) return 1;
    if (bilirubinMgDl < 6.0) return 2;
    if (bilirubinMgDl < 12.0) return 3;
    return 4;
  }

  function scoreCns(gcs) {
    if (gcs >= 15) return 0;
    if (gcs >= 13) return 1;
    if (gcs >= 10) return 2;
    if (gcs >= 6) return 3;
    return 4;
  }

  function scoreRenalFromCreatinine(cr) {
    if (cr < 1.2) return 0;
    if (cr < 2.0) return 1;
    if (cr < 3.5) return 2;
    if (cr < 5.0) return 3;
    return 4;
  }

  function scoreRenalFromUop(uop) {
    if (uop >= 500) return 0;
    if (uop >= 200) return 3;
    return 4;
  }

  function interpretSofa(total) {
    if (total >= 10) return 'Тяжёлая органная недостаточность';
    if (total >= 6) return 'Умеренная органная дисфункция';
    if (total >= 2) return 'Лёгкая органная дисфункция';
    return 'Минимальная органная дисфункция';
  }

  function interpretQsofa(total) {
    return total >= 2 ? 'Высокий риск' : 'Невысокий риск';
  }

  function getGcsFromForm(form, prefix) {
    var total = 0;
    for (var i = 0; i < GCS_PARTS.length; i++) {
      var part = GCS_PARTS[i];
      var selected = form.querySelector('input[name="' + prefix + '-' + part + '"]:checked');
      if (!selected) return null;
      total += Number(selected.value);
    }
    return total;
  }

  function isGcsReady(form, prefix) {
    return getGcsFromForm(form, prefix) != null;
  }

  function updateGcsTotal(form, prefix) {
    var totalEl = root.querySelector('#fc-calc-sofa-' + prefix + '-gcs-total');
    var errorEl = root.querySelector('#fc-calc-sofa-' + prefix + '-gcs-error');
    if (!totalEl) return;
    var total = getGcsFromForm(form, prefix);
    if (total == null) {
      totalEl.textContent = '— баллов';
      if (errorEl) errorEl.textContent = '';
      return;
    }
    totalEl.textContent = total + ' баллов';
    if (errorEl) errorEl.textContent = '';
  }

  function bindGcsForm(form, prefix, onChange) {
    GCS_PARTS.forEach(function (part) {
      var inputs = form.querySelectorAll('input[name="' + prefix + '-' + part + '"]');
      inputs.forEach(function (input) {
        input.addEventListener('change', function () {
          updateGcsTotal(form, prefix);
          if (onChange) onChange();
        });
      });
    });
    updateGcsTotal(form, prefix);
  }

  function showGcsError(prefix, message) {
    var errorEl = root.querySelector('#fc-calc-sofa-' + prefix + '-gcs-error');
    if (errorEl) errorEl.textContent = message || '';
  }

  function showResult(mode, numberText, interpretation, secondaryHtml) {
    var wrap = root.querySelector('#fc-calc-sofa-result-' + mode);
    var numberEl = root.querySelector('#fc-calc-sofa-result-number-' + mode);
    var descEl = root.querySelector('#fc-calc-sofa-result-desc-' + mode);
    var secondaryEl = root.querySelector('#fc-calc-sofa-result-secondary-' + mode);
    if (!wrap || !numberEl) return;
    numberEl.textContent = numberText;
    if (descEl) descEl.textContent = interpretation;
    if (secondaryEl) {
      secondaryEl.innerHTML = secondaryHtml || '';
      secondaryEl.hidden = !secondaryHtml;
    }
    wrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  function bindNumericField(form, field, onRefresh) {
    var input = root.querySelector('#fc-calc-sofa-' + field.id);
    var errorEl = root.querySelector('#fc-calc-sofa-' + field.id + '-error');
    if (!input || !errorEl) return;

    input.addEventListener('blur', function () {
      updateFieldError(input, errorEl, field.limits, field.msg, field.allowZero, false);
    });

    input.addEventListener('input', function () {
      errorEl.textContent = '';
      if (onRefresh) onRefresh();
    });
  }

  var sofaForm = root.querySelector('#fc-calc-sofa-form-sofa');
  if (sofaForm) {
    var sofaBtn = root.querySelector('#fc-calc-sofa-btn-sofa');
    var sofaFields = [
      { id: 'pao2', limits: LIMITS.pao2, msg: 'Укажите PaO₂', allowZero: false },
      { id: 'fio2', limits: LIMITS.fio2, msg: 'Укажите FiO₂', allowZero: false },
      { id: 'platelets', limits: LIMITS.platelets, msg: 'Укажите тромбоциты', allowZero: false },
      { id: 'bilirubin', limits: LIMITS.bilirubin, msg: 'Укажите билирубин', allowZero: false },
    ];
    var renalFields = [
      { id: 'creatinine', limits: LIMITS.creatinine, msg: 'Укажите креатинин', allowZero: false },
      {
        id: 'urine-output',
        limits: LIMITS.urineOutput,
        msg: 'Укажите суточный диурез',
        allowZero: true,
      },
    ];

    function getUnit(name) {
      var el = sofaForm.querySelector('[name="' + name + 'Unit"]');
      return el ? el.value : '';
    }

    function isSofaReady() {
      for (var i = 0; i < sofaFields.length; i++) {
        var f = sofaFields[i];
        if (!isFieldValid(root.querySelector('#fc-calc-sofa-' + f.id), f.limits, f.allowZero)) {
          return false;
        }
      }
      if (!isGcsReady(sofaForm, 'sofa')) return false;
      if (!sofaForm.querySelector('input[name="cardiovascular"]:checked')) return false;

      var cr = root.querySelector('#fc-calc-sofa-creatinine');
      var uop = root.querySelector('#fc-calc-sofa-urine-output');
      var hasCr = hasValue(cr.value);
      var hasUop = hasValue(uop.value);
      if (!hasCr && !hasUop) return false;
      if (hasCr && !isFieldValid(cr, LIMITS.creatinine, false)) return false;
      if (hasUop && !isFieldValid(uop, LIMITS.urineOutput, true)) return false;
      return true;
    }

    function refreshSofaFields(showEmptyError) {
      sofaFields.forEach(function (f) {
        updateFieldError(
          root.querySelector('#fc-calc-sofa-' + f.id),
          root.querySelector('#fc-calc-sofa-' + f.id + '-error'),
          f.limits,
          f.msg,
          f.allowZero,
          showEmptyError
        );
      });

      renalFields.forEach(function (f) {
        var input = root.querySelector('#fc-calc-sofa-' + f.id);
        if (!hasValue(input.value)) {
          root.querySelector('#fc-calc-sofa-' + f.id + '-error').textContent = '';
          return;
        }
        updateFieldError(
          input,
          root.querySelector('#fc-calc-sofa-' + f.id + '-error'),
          f.limits,
          f.msg,
          f.allowZero,
          showEmptyError
        );
      });

      var cr = root.querySelector('#fc-calc-sofa-creatinine');
      var uop = root.querySelector('#fc-calc-sofa-urine-output');
      var renalError = root.querySelector('#fc-calc-sofa-renal-error');
      if (renalError && showEmptyError && !hasValue(cr.value) && !hasValue(uop.value)) {
        renalError.textContent = 'Укажите креатинин и/или суточный диурез';
      } else if (renalError) {
        renalError.textContent = '';
      }

      if (sofaBtn) {
        var ok = isSofaReady();
        sofaBtn.disabled = !ok;
        sofaBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }
    }

    sofaFields.concat(renalFields).forEach(function (f) {
      bindNumericField(sofaForm, f, function () {
        hideResult('sofa');
        refreshSofaFields(false);
      });
    });

    bindGcsForm(sofaForm, 'sofa', function () {
      hideResult('sofa');
      refreshSofaFields(false);
    });

    sofaForm.addEventListener('change', function () {
      hideResult('sofa');
      refreshSofaFields(false);
    });

    sofaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideResult('sofa');
      refreshSofaFields(true);
      if (!isGcsReady(sofaForm, 'sofa')) {
        showGcsError('sofa', 'Выберите значение по каждому критерию GCS');
        return;
      }
      if (!isSofaReady()) return;

      var pao2 = parseNumber(root.querySelector('#fc-calc-sofa-pao2').value);
      var fio2 = parseNumber(root.querySelector('#fc-calc-sofa-fio2').value);
      var platelets = parseNumber(root.querySelector('#fc-calc-sofa-platelets').value);
      var bilirubin = parseNumber(root.querySelector('#fc-calc-sofa-bilirubin').value);
      var gcs = getGcsFromForm(sofaForm, 'sofa');
      var crInput = root.querySelector('#fc-calc-sofa-creatinine');
      var uopInput = root.querySelector('#fc-calc-sofa-urine-output');
      var hasCr = hasValue(crInput.value);
      var hasUop = hasValue(uopInput.value);
      var creatinine = hasCr ? parseNumber(crInput.value) : null;
      var urineOutput = hasUop ? parseNumber(uopInput.value) : null;
      var ventilator = sofaForm.querySelector('input[name="ventilation"]:checked');
      var vent = ventilator ? ventilator.value === '1' : false;
      var cv = sofaForm.querySelector('input[name="cardiovascular"]:checked');

      var pao2MmHg = pao2ToMmHg(pao2, getUnit('pao2'));
      var fio2Fraction = fio2ToFraction(fio2, getUnit('fio2'));
      var ratio = Math.round(pao2MmHg / fio2Fraction);
      var bilirubinMgDl = bilirubinToMgDl(bilirubin, getUnit('bilirubin'));
      var creatinineMgDl = hasCr ? creatinineToMgDl(creatinine, getUnit('creatinine')) : null;

      var renal = 0;
      if (hasCr && hasUop) {
        renal = Math.max(scoreRenalFromCreatinine(creatinineMgDl), scoreRenalFromUop(urineOutput));
      } else if (hasCr) {
        renal = scoreRenalFromCreatinine(creatinineMgDl);
      } else {
        renal = scoreRenalFromUop(urineOutput);
      }

      var total =
        scoreRespiration(ratio, vent) +
        scoreCoagulation(platelets) +
        scoreLiver(bilirubinMgDl) +
        Number(cv.value) +
        scoreCns(gcs) +
        renal;

      showResult(
        'sofa',
        String(total),
        interpretSofa(total),
        '<p><strong>PaO₂/FiO₂:</strong> ' + formatNum(ratio) + '</p>'
      );
    });

    refreshSofaFields(false);
  }

  var qsofaForm = root.querySelector('#fc-calc-sofa-form-qsofa');
  if (qsofaForm) {
    var qsofaBtn = root.querySelector('#fc-calc-sofa-btn-qsofa');
    var qFields = [
      { id: 'qsofa-sbp', limits: LIMITS.sbp, msg: 'Укажите систолическое АД', allowZero: false },
      { id: 'qsofa-rr', limits: LIMITS.rr, msg: 'Укажите частоту дыхания', allowZero: false },
    ];

    function getQsofaUnit() {
      var el = qsofaForm.querySelector('[name="sbpUnit"]');
      return el ? el.value : 'mmhg';
    }

    function isQsofaReady() {
      if (!isGcsReady(qsofaForm, 'qsofa')) return false;
      for (var i = 0; i < qFields.length; i++) {
        var f = qFields[i];
        if (!isFieldValid(root.querySelector('#fc-calc-sofa-' + f.id), f.limits, f.allowZero)) {
          return false;
        }
      }
      return true;
    }

    function refreshQsofaFields(showEmptyError) {
      qFields.forEach(function (f) {
        updateFieldError(
          root.querySelector('#fc-calc-sofa-' + f.id),
          root.querySelector('#fc-calc-sofa-' + f.id + '-error'),
          f.limits,
          f.msg,
          f.allowZero,
          showEmptyError
        );
      });
      if (qsofaBtn) {
        var ok = isQsofaReady();
        qsofaBtn.disabled = !ok;
        qsofaBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }
    }

    qFields.forEach(function (f) {
      bindNumericField(qsofaForm, f, function () {
        hideResult('qsofa');
        refreshQsofaFields(false);
      });
    });

    bindGcsForm(qsofaForm, 'qsofa', function () {
      hideResult('qsofa');
      refreshQsofaFields(false);
    });

    qsofaForm.addEventListener('change', function () {
      hideResult('qsofa');
      refreshQsofaFields(false);
    });

    qsofaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideResult('qsofa');
      refreshQsofaFields(true);
      if (!isGcsReady(qsofaForm, 'qsofa')) {
        showGcsError('qsofa', 'Выберите значение по каждому критерию GCS');
        return;
      }
      if (!isQsofaReady()) return;

      var gcs = getGcsFromForm(qsofaForm, 'qsofa');
      var sbp = parseNumber(root.querySelector('#fc-calc-sofa-qsofa-sbp').value);
      var rr = parseNumber(root.querySelector('#fc-calc-sofa-qsofa-rr').value);
      var sbpMmHg = sbpToMmHg(sbp, getQsofaUnit());
      var total = 0;
      if (gcs < 15) total += 1;
      if (sbpMmHg <= 100) total += 1;
      if (rr >= 22) total += 1;

      showResult('qsofa', String(total), interpretQsofa(total), '');
    });

    refreshQsofaFields(false);
  }
})();
