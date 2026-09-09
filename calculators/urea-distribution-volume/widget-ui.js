  var root = document.querySelector('.fc-calc[data-calculator="urea-distribution-volume"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-urea-distribution-volume-form');
  var ageInput = root.querySelector('#fc-calc-urea-distribution-volume-age');
  var heightInput = root.querySelector('#fc-calc-urea-distribution-volume-height');
  var weightInput = root.querySelector('#fc-calc-urea-distribution-volume-weight');
  var formError = root.querySelector('#fc-calc-urea-distribution-volume-form-error');
  var resultWrap = root.querySelector('#fc-calc-urea-distribution-volume-result');
  var femaleValue = root.querySelector('#fc-calc-urea-distribution-volume-female');
  var maleValue = root.querySelector('#fc-calc-urea-distribution-volume-male');

  function buildInput() {
    return {
      age: ageInput.value,
      height: heightInput.value,
      weight: weightInput.value,
    };
  }

  function clearResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
    femaleValue.textContent = '—';
    maleValue.textContent = '—';
  }

  function renderResult(out) {
    femaleValue.textContent = out.femaleLabel + ' л';
    maleValue.textContent = out.maleLabel + ' л';
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

  [ageInput, heightInput, weightInput].forEach(function (el) {
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    update();
  });

  update();
