  var root = document.querySelector('.fc-calc[data-calculator="dry-body-weight"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-dry-body-weight-form');
  var heightInput = root.querySelector('#fc-calc-dry-body-weight-height');
  var formError = root.querySelector('#fc-calc-dry-body-weight-form-error');
  var resultWrap = root.querySelector('#fc-calc-dry-body-weight-result');
  var resultNumber = root.querySelector('#fc-calc-dry-body-weight-result-number');

  function buildInput() {
    var checked = form.querySelector('input[name="sex"]:checked');
    return {
      sex: checked ? checked.value : 'male',
      height: heightInput.value,
    };
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
    resultNumber.textContent = '—';
  }

  function renderResult(out) {
    resultNumber.textContent = out.smtLabel + ' кг';
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  function update() {
    formError.textContent = '';
    if (!isReady(buildInput())) {
      clearResult();
      return;
    }
    try {
      renderResult(calculate(buildInput()));
    } catch (err) {
      clearResult();
      formError.textContent = err.message || 'Проверьте ввод';
    }
  }

  form.querySelectorAll('input[name="sex"]').forEach(function (el) {
    el.addEventListener('change', update);
  });
  heightInput.addEventListener('input', update);
  heightInput.addEventListener('change', update);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    update();
  });

  update();
