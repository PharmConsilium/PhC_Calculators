(function () {
  var root = document.querySelector('.fc-calc[data-calculator="pasi"]');
  if (!root) return;

  var REGIONS = [
    { id: 'head', label: 'Голова и шея', bsa: 0.1 },
    { id: 'upper', label: 'Верхние конечности', bsa: 0.2 },
    { id: 'trunk', label: 'Туловище', bsa: 0.3 },
    { id: 'lower', label: 'Нижние конечности', bsa: 0.4 }
  ];

  var SIGNS = ['erythema', 'induration', 'desquamation'];

  var form = root.querySelector('#fc-calc-pasi-form');
  var calcBtn = root.querySelector('#fc-calc-pasi-btn');
  var resultWrap = root.querySelector('#fc-calc-pasi-result');
  var resultNumber = root.querySelector('#fc-calc-pasi-result-number');
  var resultDesc = root.querySelector('#fc-calc-pasi-result-desc');

  function formatNum(n) {
    return String(n).replace('.', ',');
  }

  function parseScore(value, min, max) {
    if (value === null || value === undefined || value === '') return null;
    var n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max || Math.floor(n) !== n) return null;
    return n;
  }

  function roundPasi(value) {
    return Math.round(value * 10) / 10;
  }

  function regionPasi(erythema, induration, desquamation, areaPoints, bsa) {
    return (erythema + induration + desquamation) * areaPoints * bsa;
  }

  function interpretPasi(total) {
    if (total <= 0) return 'Нет признаков заболевания (PASI 0)';
    if (total < 10) return 'Лёгкая степень тяжести';
    if (total <= 20) return 'Средняя степень тяжести';
    return 'Тяжёлая степень';
  }

  function getInput() {
    var input = {};
    REGIONS.forEach(function (region) {
      SIGNS.forEach(function (sign) {
        var name = region.id + '_' + sign;
        var checked = form.querySelector('input[name="' + name + '"]:checked');
        input[name] = checked ? checked.value : null;
      });
      var areaName = region.id + '_area';
      var areaChecked = form.querySelector('input[name="' + areaName + '"]:checked');
      input[areaName] = areaChecked ? areaChecked.value : null;
    });
    return input;
  }

  function calculate(input) {
    var total = 0;
    var parts = [];

    for (var i = 0; i < REGIONS.length; i++) {
      var region = REGIONS[i];
      var erythema = parseScore(input[region.id + '_erythema'], 0, 4);
      var induration = parseScore(input[region.id + '_induration'], 0, 4);
      var desquamation = parseScore(input[region.id + '_desquamation'], 0, 4);
      var area = parseScore(input[region.id + '_area'], 0, 6);

      if (
        erythema === null ||
        induration === null ||
        desquamation === null ||
        area === null
      ) {
        return null;
      }

      var score = regionPasi(erythema, induration, desquamation, area, region.bsa);
      total += score;
      parts.push(region.label + ': ' + formatNum(roundPasi(score)));
    }

    var pasi = roundPasi(total);
    return {
      pasi: pasi,
      interpretation: interpretPasi(pasi),
      breakdown: parts.join('; ')
    };
  }

  function showResult() {
    var out = calculate(getInput());
    if (!out) return;
    resultNumber.textContent = formatNum(out.pasi);
    resultDesc.textContent = out.interpretation + '. ' + out.breakdown + '.';
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  function hideResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  form.addEventListener('change', hideResult);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showResult();
  });

  calcBtn.disabled = false;
  calcBtn.classList.remove('fc-calc__btn--inactive');
})();
