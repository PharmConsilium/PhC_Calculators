  var root = document.querySelector('.fc-calc[data-calculator="renal-function"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-renal-function-form');
  var formError = root.querySelector('#fc-calc-renal-function-form-error');
  var resultWrap = root.querySelector('#fc-calc-renal-function-result');
  var resultBody = root.querySelector('#fc-calc-renal-function-result-body');

  var ageInput = root.querySelector('#fc-calc-renal-function-age');
  var creatInput = root.querySelector('#fc-calc-renal-function-creatinine');
  var creatUnit = root.querySelector('#fc-calc-renal-function-creatinine-unit');
  var weightInput = root.querySelector('#fc-calc-renal-function-weight');
  var heightInput = root.querySelector('#fc-calc-renal-function-height');
  var cystatinInput = root.querySelector('#fc-calc-renal-function-cystatin');
  var albuminuriaSelect = root.querySelector('#fc-calc-renal-function-albuminuria');

  function selectedGender() {
    var el = form.querySelector('input[name="gender"]:checked');
    return el ? el.value : 'male';
  }

  function buildInput() {
    return {
      gender: selectedGender(),
      age: ageInput.value,
      creatinine: creatInput.value,
      creatinineUnit: creatUnit.value === 'mgdl' ? 'mgdl' : 'umol',
      weightKg: weightInput.value,
      heightCm: heightInput.value,
      cystatin: cystatinInput.value,
      albuminuria: albuminuriaSelect.value || '',
    };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rowHtml(label, value, afterValue) {
    return (
      '<div class="fc-calc__rf-row">' +
      '<span class="fc-calc__rf-row-label">' +
      escapeHtml(label).replace(/\n/g, '<br>') +
      '</span>' +
      '<span class="fc-calc__rf-row-value">' +
      escapeHtml(value) +
      '</span>' +
      (afterValue
        ? '<p class="fc-calc__rf-row-after">' + escapeHtml(afterValue) + '</p>'
        : '') +
      '</div>'
    );
  }

  function blockHtml(rowsHtml, details) {
    var detailsHtml = (details || [])
      .filter(Boolean)
      .map(function (t) {
        return (
          '<li class="fc-calc__rf-bullet-item">' +
          '<span class="fc-calc__rf-bullet" aria-hidden="true">•</span>' +
          '<span class="fc-calc__rf-bullet-text">' +
          escapeHtml(t) +
          '</span></li>'
        );
      })
      .join('');
    return (
      '<div class="fc-calc__rf-metric">' +
      rowsHtml +
      (detailsHtml
        ? '<ul class="fc-calc__rf-metric-details">' + detailsHtml + '</ul>'
        : '') +
      '</div>'
    );
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
    resultBody.innerHTML = '';
  }

  function renderResult(all) {
    var html = '';
    var extras = all.extras;
    var bmiLine =
      extras.bmi != null
        ? 'Индекс массы тела (ИМТ): ' +
          formatRu(extras.bmi.value) +
          ' кг/м² — ' +
          extras.bmi.interpretation
        : null;
    var ureaLine =
      extras.ureaVdL != null
        ? 'Объём распределения мочевины: ' + formatRu(extras.ureaVdL) + ' л'
        : null;

    all.results.forEach(function (out) {
      var stage =
        out.category != null ? formatGfrStageLabel(out.category) : null;
      var rows = rowHtml(
        out.label,
        formatRu(out.value) + ' ' + out.unit,
        stage
      );
      var details = [];

      if (extras.bsaM2 != null && out.category) {
        var abs = Math.round(absoluteGfr(out.value, extras.bsaM2));
        rows += rowHtml(
          'СКФ с корректировкой на площадь поверхности тела пациента (eGFR(BSAadj))',
          formatRu(abs) + ' мл/мин/' + formatRu(extras.bsaM2) + 'м²'
        );
        details.push(
          'Площадь поверхности тела ППТ (BSA): ' + formatRu(extras.bsaM2) + ' м²'
        );
        if (bmiLine) details.push(bmiLine);
        if (ureaLine) details.push(ureaLine);
        details.push('Стадия ХБП — по индексированной СКФ (мл/мин/1,73 м²).');
      }

      html += blockHtml(rows, details);
    });

    if (extras.kdigo) {
      html +=
        '<p class="fc-calc__rf-section-title">KDIGO-матрица риска</p>' +
        blockHtml(rowHtml('Прогнозный риск', extras.kdigo.risk.label), [
          formatGfrStageLabel(extras.kdigo.gCategory),
          'Альбуминурия: ' +
            extras.kdigo.aCategory.label +
            ' — ' +
            extras.kdigo.aCategory.detail,
          'СКФ по формуле: ' + extras.kdigo.sourceLabel,
        ]);
    }

    if (all.skipped.length) {
      html += '<p class="fc-calc__rf-section-title">Не рассчитано</p>';
      all.skipped.forEach(function (s) {
        html += blockHtml(rowHtml(s.label, s.reason), []);
      });
    }

    resultBody.innerHTML = html;
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  function update() {
    formError.textContent = '';
    var input = buildInput();
    if (!isReady(input)) {
      clearResult();
      return;
    }
    try {
      renderResult(calculateAll(input));
    } catch (err) {
      clearResult();
      formError.textContent = err.message || 'Проверьте ввод';
    }
  }

  form.querySelectorAll('input[name="gender"]').forEach(function (el) {
    el.addEventListener('change', update);
  });

  [
    ageInput,
    creatInput,
    creatUnit,
    weightInput,
    heightInput,
    cystatinInput,
    albuminuriaSelect,
  ].forEach(function (el) {
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    update();
  });

  update();
