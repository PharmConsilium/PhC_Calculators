(function () {
  var root = document.querySelector('.fc-calc[data-calculator="greene-climacteric"]');
  if (!root) return;

  var form = root.querySelector('#fc-calc-greene-climacteric-form');
  var calcBtn = root.querySelector('#fc-calc-greene-climacteric-btn');
  var resultWrap = root.querySelector('#fc-calc-greene-climacteric-result');
  var resultNumber = root.querySelector('#fc-calc-greene-climacteric-result-number');
  var resultDesc = root.querySelector('#fc-calc-greene-climacteric-result-desc');
  var subPsych = root.querySelector('#fc-calc-greene-climacteric-sub-psych');
  var subSomatic = root.querySelector('#fc-calc-greene-climacteric-sub-somatic');
  var subVaso = root.querySelector('#fc-calc-greene-climacteric-sub-vaso');
  var subSexual = root.querySelector('#fc-calc-greene-climacteric-sub-sexual');

  var itemIds = [
    'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11',
    'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20', 'q21'
  ];
  var sections = {
    psychological: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11'],
    somatic: ['q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18'],
    vasomotor: ['q19', 'q20'],
    sexual: ['q21']
  };

  function hideResult() {
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function scoreOf(id) {
    var checked = form.querySelector('input[name="' + id + '"]:checked');
    return checked ? Number(checked.getAttribute('data-score') || 0) : null;
  }

  function isComplete() {
    return itemIds.every(function (id) {
      return form.querySelector('input[name="' + id + '"]:checked');
    });
  }

  function updateButton() {
    var ok = isComplete();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
  }

  function interpret(total) {
    if (total <= 0) {
      return {
        category: 'none',
        text: 'Симптомы климактерического синдрома отсутствуют'
      };
    }
    if (total <= 11) {
      return {
        category: 'mild',
        text: 'Слабая степень — симптомы выражены минимально, не требуют медикаментозной коррекции или достаточно немедикаментозных методов'
      };
    }
    if (total <= 19) {
      return {
        category: 'moderate',
        text: 'Средняя степень — симптомы умеренно выражены и влияют на качество жизни; может потребоваться менопаузальная гормональная терапия или другая терапия'
      };
    }
    return {
      category: 'severe',
      text: 'Тяжелая степень — симптомы значительно снижают качество жизни; показано назначение менопаузальной гормональной терапии (при отсутствии противопоказаний) или других методов коррекции'
    };
  }

  function sumIds(ids) {
    return ids.reduce(function (sum, id) {
      return sum + (scoreOf(id) || 0);
    }, 0);
  }

  function calculate() {
    var total = sumIds(itemIds);
    return {
      total: total,
      info: interpret(total),
      subscales: {
        psychological: sumIds(sections.psychological),
        somatic: sumIds(sections.somatic),
        vasomotor: sumIds(sections.vasomotor),
        sexual: sumIds(sections.sexual)
      }
    };
  }

  form.addEventListener('change', function () {
    hideResult();
    updateButton();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!isComplete()) return;
    var out = calculate();
    resultNumber.textContent = String(out.total);
    resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + out.info.category;
    resultDesc.textContent = out.info.text;
    subPsych.textContent = String(out.subscales.psychological);
    subSomatic.textContent = String(out.subscales.somatic);
    subVaso.textContent = String(out.subscales.vasomotor);
    subSexual.textContent = String(out.subscales.sexual);
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  });

  updateButton();
})();
