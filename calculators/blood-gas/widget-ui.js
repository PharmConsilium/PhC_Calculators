  var root = document.querySelector('.fc-calc[data-calculator="blood-gas"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-blood-gas-form');
  var calcBtn = root.querySelector('#fc-calc-blood-gas-btn');
  var resetBtn = root.querySelector('#fc-calc-blood-gas-reset');
  var formError = root.querySelector('#fc-calc-blood-gas-form-error');
  var resultWrap = root.querySelector('#fc-calc-blood-gas-result');
  var diagnosisEl = root.querySelector('#fc-calc-blood-gas-diagnosis');
  var compensationEl = root.querySelector('#fc-calc-blood-gas-compensation');
  var linesEl = root.querySelector('#fc-calc-blood-gas-result-lines');
  var summaryEl = root.querySelector('#fc-calc-blood-gas-summary');

  var FIELD_NAMES = [
    'ph',
    'paco2',
    'hco3',
    'pao2',
    'be',
    'sato2',
    'na',
    'k',
    'cl',
    'ca',
    'mg',
    'lactate',
    'hb',
    'ht',
    'cohb',
    'methb',
  ];

  function raw(id) {
    var el = root.querySelector(id);
    return el ? String(el.value || '').trim() : '';
  }

  function num(id) {
    var s = raw(id).replace(',', '.');
    if (!s) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : { error: true };
  }

  function buildInput() {
    var required = ['ph', 'paco2', 'hco3'];
    var input = {};
    for (var i = 0; i < FIELD_NAMES.length; i++) {
      var key = FIELD_NAMES[i];
      var v = num('#fc-calc-blood-gas-' + key);
      if (v && v.error) throw new Error('invalid');
      if (v != null) input[key] = v;
      else if (required.indexOf(key) !== -1) throw new Error('required');
    }
    return input;
  }

  function canCalculate() {
    try {
      buildInput();
      return true;
    } catch (e) {
      return false;
    }
  }

  function updateBtn() {
    var ok = canCalculate();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function line(label, value) {
    if (value == null || value === '' || value === '—') return null;
    var p = document.createElement('p');
    p.className = 'fc-calc__bg-result-line';
    p.innerHTML = '<strong>' + label + ':</strong> ' + value;
    return p;
  }

  function renderResult(out) {
    diagnosisEl.textContent = out.diagnosis;
    compensationEl.textContent = out.compensation;
    summaryEl.textContent = out.summary;
    linesEl.innerHTML = '';
    [
      line('Статус pH', out.phStatus),
      line('PaCO₂ (респ.)', out.paco2Text),
      line('HCO₃⁻ (метаб.)', out.hco3Text),
      line('Анионная разница', out.anionGapText),
      line('Лактат', out.lactateText),
      line('Оксигенация', out.oxygenation),
      line('Гемоглобин', out.hbText),
    ].forEach(function (el) {
      if (el) linesEl.appendChild(el);
    });
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  form.querySelectorAll('input').forEach(function (el) {
    el.addEventListener('input', updateBtn);
    el.addEventListener('change', updateBtn);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.textContent = '';
    try {
      var out = calculate(buildInput());
      renderResult(out);
    } catch (err) {
      clearResult();
      formError.textContent =
        err.message === 'required' || err.message === 'invalid'
          ? 'Введите как минимум pH, PaCO₂ и HCO₃⁻'
          : err.message || 'Проверьте введённые данные';
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      form.reset();
      formError.textContent = '';
      clearResult();
      updateBtn();
    });
  }

  updateBtn();
