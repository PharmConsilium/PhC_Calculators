(function () {
  /**
 * Сухой вес тела / lean body weight (СМТ) по росту.
 * M: СМТ = 0,73 × рост(см) − 59,42
 * F: СМТ = 0,65 × рост(см) − 50,74
 * Источник: Burton ME et al. Clin Pharm. 1986;5(2):143-9.
 */

const SEX_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];

function defaultInputs() {
  return {
    sex: 'male',
    height: '',
  };
}

function parsePositive(raw) {
  const n = Number(String(raw ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function formatRu(n, digits = 2) {
  return n.toFixed(digits).replace('.', ',');
}

/** СМТ (кг) по росту (см) и полу. */
function calculateSmtKg(sex, heightCm) {
  if (sex === 'male') return 0.73 * heightCm - 59.42;
  return 0.65 * heightCm - 50.74;
}

function isReady(input) {
  return parsePositive(input?.height) != null;
}

function calculate(input) {
  const sex = input?.sex === 'female' ? 'female' : 'male';
  const heightCm = parsePositive(input?.height);
  if (heightCm == null) throw new Error('Укажите рост');

  const smtKg = round2(calculateSmtKg(sex, heightCm));
  if (!Number.isFinite(smtKg)) throw new Error('Некорректный расчёт');

  const formula =
    sex === 'male'
      ? `СМТ = 0,73 × ${formatRu(heightCm, heightCm % 1 === 0 ? 0 : 1)} − 59,42`
      : `СМТ = 0,65 × ${formatRu(heightCm, heightCm % 1 === 0 ? 0 : 1)} − 50,74`;

  return {
    smtKg,
    smtLabel: formatRu(smtKg),
    heightCm,
    sex,
    formula,
    note: formula,
  };
}

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

})();