  var root = document.querySelector('.fc-calc[data-calculator="cha2ds2-va"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-cha2ds2-va-form');
  var calcBtn = root.querySelector('#fc-calc-cha2ds2-va-btn');
  var formError = root.querySelector('#fc-calc-cha2ds2-va-form-error');
  var resultWrap = root.querySelector('#fc-calc-cha2ds2-va-result');
  var resultNumber = root.querySelector('#fc-calc-cha2ds2-va-result-number');
  var resultDesc = root.querySelector('#fc-calc-cha2ds2-va-result-desc');
  var resultExtra = root.querySelector('#fc-calc-cha2ds2-va-result-extra');

  function buildInput() {
    var input = {};
    CRITERIA.forEach(function (criterion) {
      var checked = form.querySelector(
        'input[name="fc-calc-cha2ds2-va-' + criterion.id + '"]:checked'
      );
      input[criterion.id] = checked ? checked.value : '';
    });
    return input;
  }

  function canCalculate() {
    try {
      return isReady(buildInput());
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

  function renderResult(out) {
    resultNumber.textContent = pluralBalls(out.total);
    resultDesc.textContent = out.recommendation;
    resultExtra.innerHTML =
      '<p class="fc-calc__cha-result-line"><strong>Частота ишемического инсульта:</strong> ' +
      out.strokeRate +
      ' случая на 100 пациенто-лет.</p>';
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  form.querySelectorAll('input[type="radio"]').forEach(function (el) {
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
      formError.textContent = err.message || 'Заполните все поля';
    }
  });

  updateBtn();
