(function () {
  /**
 * Объём распределения мочевины (ОРМ) ≈ объём общей воды организма (ОВО).
 * Формула Watson (1980):
 * M: 2,447 − 0,09516×возраст + 0,1074×рост(см) + 0,3362×масса(кг)
 * F: −2,097 + 0,1069×рост(см) + 0,2466×масса(кг)
 * Источник: Watson PE, Watson ID, Batt RD. Am J Clin Nutr. 1980;33(1):27-39.
 */

function defaultInputs() {
  return {
    age: '',
    height: '',
    weight: '',
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

/** ОРМ / TBW (л), мужчины — Watson. */
function calculateMaleLiters(ageYears, heightCm, weightKg) {
  return 2.447 - 0.09516 * ageYears + 0.1074 * heightCm + 0.3362 * weightKg;
}

/** ОРМ / TBW (л), женщины — Watson. */
function calculateFemaleLiters(heightCm, weightKg) {
  return -2.097 + 0.1069 * heightCm + 0.2466 * weightKg;
}

function isReady(input) {
  return (
    parsePositive(input?.age) != null &&
    parsePositive(input?.height) != null &&
    parsePositive(input?.weight) != null
  );
}

function calculate(input) {
  const ageYears = parsePositive(input?.age);
  const heightCm = parsePositive(input?.height);
  const weightKg = parsePositive(input?.weight);
  if (ageYears == null || heightCm == null || weightKg == null) {
    throw new Error('Укажите возраст, рост и массу тела');
  }

  const maleL = round2(calculateMaleLiters(ageYears, heightCm, weightKg));
  const femaleL = round2(calculateFemaleLiters(heightCm, weightKg));
  if (!Number.isFinite(maleL) || !Number.isFinite(femaleL)) {
    throw new Error('Некорректный расчёт');
  }

  return {
    ageYears,
    heightCm,
    weightKg,
    maleL,
    femaleL,
    maleLabel: formatRu(maleL),
    femaleLabel: formatRu(femaleL),
  };
}

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

})();