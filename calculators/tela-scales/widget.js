(function () {
      var root = document.querySelector('[data-mode-panel="years-pe"]') || document.querySelector('.fc-calc[data-calculator="years-pe"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-years-pe-form');
      var resultBox = root.querySelector('#fc-calc-years-pe-result');
      var resultNumber = root.querySelector('#fc-calc-years-pe-result-number');
      var resultDesc = root.querySelector('#fc-calc-years-pe-result-desc');
      var dDimerLegend = root.querySelector('#fc-calc-years-pe-d-dimer-legend');
      var pregnantError = root.querySelector('#fc-calc-years-pe-pregnant-error');
      var dvtError = root.querySelector('#fc-calc-years-pe-dvt-error');
      var ultrasoundWrap = root.querySelector('#fc-calc-years-pe-ultrasound-wrap');
      var ultrasoundError = root.querySelector('#fc-calc-years-pe-ultrasound-error');
      var hemoptysisWrap = root.querySelector('#fc-calc-years-pe-hemoptysis-wrap');
      var mostLikelyWrap = root.querySelector('#fc-calc-years-pe-most-likely-wrap');
      var dDimerWrap = root.querySelector('#fc-calc-years-pe-d-dimer-wrap');

      function asYes(value) {
        return value === 'yes';
      }

      function getYearsItems() {
        return [
          asYes(form.elements.clinicalSignsDvt.value),
          asYes(form.elements.hemoptysis.value),
          asYes(form.elements.peMostLikely.value),
        ].filter(Boolean).length;
      }

      function getThreshold(yearsItems) {
        return yearsItems === 0 ? 1000 : 500;
      }

      function hasAnswer(fieldName) {
        var value = form.elements[fieldName].value;
        return value === 'no' || value === 'yes';
      }

      function hasInitialAnswers() {
        return hasAnswer('pregnant') && hasAnswer('clinicalSignsDvt');
      }

      function shouldAskUltrasound() {
        return hasInitialAnswers() && asYes(form.elements.pregnant.value) && asYes(form.elements.clinicalSignsDvt.value);
      }

      function isDvtFoundBranch() {
        return shouldAskUltrasound() && asYes(form.elements.dvtFound.value);
      }

      function hasUltrasoundResult() {
        var value = form.elements.dvtFound.value;
        return value === 'no' || value === 'yes';
      }

      function setError(el, message) {
        el.textContent = message || '';
      }

      function updateConditionalFields() {
        var readyForNextStep = hasInitialAnswers();
        var askUltrasound = shouldAskUltrasound();
        ultrasoundWrap.classList.toggle('fc-calc__years-hidden', !askUltrasound);
        if (!askUltrasound) {
          root.querySelector('#fc-calc-years-pe-dvt-found-no').checked = false;
          root.querySelector('#fc-calc-years-pe-dvt-found-yes').checked = false;
          setError(ultrasoundError, '');
        }

        var waitForUltrasound = askUltrasound && !hasUltrasoundResult();
        var hideAfterUltrasound = !readyForNextStep || waitForUltrasound || isDvtFoundBranch();
        dDimerWrap.classList.toggle('fc-calc__years-hidden', hideAfterUltrasound);
        hemoptysisWrap.classList.toggle('fc-calc__years-hidden', hideAfterUltrasound);
        mostLikelyWrap.classList.toggle('fc-calc__years-hidden', hideAfterUltrasound);
        var threshold = getThreshold(getYearsItems());
        dDimerLegend.textContent = 'D-димер ≥' + threshold + ' нг/мл FEU';
      }

      function showResult(out) {
        resultNumber.textContent = out.value;
        resultDesc.textContent = out.interpretation + (out.pregnancyNote ? ' ' + out.pregnancyNote : '');
        resultBox.classList.remove('fc-calc__result--empty');
      }

      function clearResult() {
        resultNumber.textContent = '—';
        resultDesc.textContent = '';
        resultBox.classList.add('fc-calc__result--empty');
      }

      function calculate(input) {
        var yearsItems = [
          asYes(input.clinicalSignsDvt),
          asYes(input.hemoptysis),
          asYes(input.peMostLikely),
        ].filter(Boolean).length;

        if (asYes(input.pregnant) && asYes(input.clinicalSignsDvt) && asYes(input.dvtFound)) {
          return {
            value: 'ТГВ выявлен',
            route: 'dvt-found',
            peExcluded: false,
            yearsItems: yearsItems,
            threshold: null,
            dDimerAtOrAboveThreshold: null,
            dvtFound: true,
            interpretation: 'Компрессионное УЗИ симптомной конечности выявило тромбоз глубоких вен. Диагноз ВТЭО считается установленным; дальнейшая визуализация для исключения ТЭЛА не требуется.',
            pregnancyNote: 'Начните антикоагулянтную терапию после оценки риска кровотечения.',
          };
        }

        var threshold = getThreshold(yearsItems);
        var dDimerAtOrAboveThreshold = asYes(input.dDimerAtOrAboveThreshold);
        var peExcluded = !dDimerAtOrAboveThreshold;
        var value = peExcluded ? 'ТЭЛА исключена' : 'ТЭЛА не исключена';
        var route = peExcluded ? 'years-excluded' : 'years-not-excluded';
        var interpretation = peExcluded
          ? 'Алгоритм YEARS исключает ТЭЛА (0,43% симптомных ВТЭО за 3 месяца наблюдения)'
          : 'Алгоритм YEARS не исключает ТЭЛА; показана КТ-ангиопульмонография или вентиляционно-перфузионное сканирование при наличии показаний';
        var pregnancyNote = asYes(input.pregnant) && asYes(input.clinicalSignsDvt)
          ? 'У беременной пациентки с клиническими признаками ТГВ сначала выполните компрессионное УЗИ симптомной конечности.'
          : '';

        return {
          value: value,
          route: route,
          peExcluded: peExcluded,
          yearsItems: yearsItems,
          threshold: threshold,
          dvtFound: false,
          interpretation: interpretation,
          pregnancyNote: pregnancyNote,
        };
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearResult();
        updateConditionalFields();
        setError(pregnantError, '');
        setError(dvtError, '');
        setError(ultrasoundError, '');

        var hasError = false;
        if (!hasAnswer('pregnant')) {
          setError(pregnantError, 'Выберите ответ');
          hasError = true;
        }
        if (!hasAnswer('clinicalSignsDvt')) {
          setError(dvtError, 'Выберите ответ');
          hasError = true;
        }
        if (hasError) return;

        if (shouldAskUltrasound() && !hasUltrasoundResult()) {
          setError(ultrasoundError, 'Укажите результат компрессионного УЗИ');
          return;
        }

        var out = calculate({
          pregnant: form.elements.pregnant.value,
          clinicalSignsDvt: form.elements.clinicalSignsDvt.value,
          dvtFound: form.elements.dvtFound.value,
          hemoptysis: form.elements.hemoptysis.value,
          peMostLikely: form.elements.peMostLikely.value,
          dDimerAtOrAboveThreshold: form.elements.dDimerAtOrAboveThreshold.value,
        });
        showResult(out);
      });

      form.addEventListener('change', function () {
        updateConditionalFields();
      });

      updateConditionalFields();
    })();

(function () {
      var root = document.querySelector('[data-mode-panel="geneva-pe"]') || document.querySelector('.fc-calc[data-calculator="geneva-pe"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-geneva-pe-form');
      var calcBtn = root.querySelector('#fc-calc-geneva-pe-btn');
      var criteriaIds = ['age', 'history', 'surgery', 'malignancy', 'legPain', 'hemoptysis', 'edema', 'heartRate'];

      function hideResult() {
        root.querySelector('#fc-calc-geneva-pe-result').classList.add('fc-calc__result-wrap--hidden');
      }

      function getSelectedScores() {
        var scores = {};
        var complete = true;
        for (var i = 0; i < criteriaIds.length; i++) {
          var id = criteriaIds[i];
          var checked = form.querySelector('input[name="' + id + '"]:checked');
          if (!checked) {
            complete = false;
            continue;
          }
          scores[id] = Number(checked.getAttribute('data-points'));
        }
        return { scores: scores, complete: complete };
      }

      function interpret(total) {
        if (total >= 11) return 'Высокая клиническая вероятность';
        if (total >= 4 && total <= 10) return 'Промежуточная клиническая вероятность';
        return 'Низкая клиническая вероятность';
      }

      function updateButton() {
        var ok = getSelectedScores().complete;
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var parsed = getSelectedScores();
        if (!parsed.complete) return;

        var total = 0;
        for (var i = 0; i < criteriaIds.length; i++) {
          total += parsed.scores[criteriaIds[i]];
        }

        root.querySelector('#fc-calc-geneva-pe-result-number').textContent = String(total);
        root.querySelector('#fc-calc-geneva-pe-result-desc').textContent = interpret(total);
        root.querySelector('#fc-calc-geneva-pe-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();

(function () {
      var root = document.querySelector('[data-mode-panel="wells-scale"]') || document.querySelector('.fc-calc[data-calculator="wells-scale"]');
      if (!root) return;

      var CRITERIA = [
        { id: 'history', points: 1.5 },
        { id: 'tachycardia', points: 1.5 },
        { id: 'immobility', points: 1.5 },
        { id: 'hemoptysis', points: 1 },
        { id: 'malignancy', points: 1 },
        { id: 'dvtSigns', points: 3 },
        { id: 'altDx', points: 3 }
      ];

      var form = root.querySelector('#fc-calc-wells-scale-form');
      var calcBtn = root.querySelector('#fc-calc-wells-scale-btn');
      var resultWrap = root.querySelector('#fc-calc-wells-scale-result');
      var resultNumber = root.querySelector('#fc-calc-wells-scale-result-number');
      var resultDesc = root.querySelector('#fc-calc-wells-scale-result-desc');

      function formatPoints(value) {
        return '+' + String(value).replace('.', ',');
      }

      function formatScore(total) {
        return String(total).replace('.', ',');
      }

      function pluralBalls(total) {
        var whole = Math.abs(Math.trunc(total));
        var mod10 = whole % 10;
        var mod100 = whole % 100;
        if (mod10 === 1 && mod100 !== 11) return 'балл';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'балла';
        return 'баллов';
      }

      function interpretThreeLevel(total) {
        var label;
        if (total <= 1) label = 'низкая';
        if (total > 2 && total < 7) label = 'средняя';
        if (total >= 5) label = 'высокая';
        if (label === 'высокая') return { category: 'high', label: label };
        if (label === 'средняя') return { category: 'moderate', label: label };
        if (label === 'низкая') return { category: 'low', label: label };
        return { category: 'moderate', label: 'средняя' };
      }

      function interpretTwoLevel(total) {
        if (total >= 5) return { label: 'ТЭЛА вероятна' };
        return { label: 'ТЭЛА маловероятна' };
      }

      function calculate() {
        var total = 0;
        CRITERIA.forEach(function (c) {
          var el = root.querySelector('#fc-calc-wells-scale-' + c.id);
          if (el && el.checked) total += c.points;
        });
        var three = interpretThreeLevel(total);
        var two = interpretTwoLevel(total);
        return {
          total: total,
          category: three.category,
          numberText: formatScore(total) + ' ' + pluralBalls(total),
          desc:
            'Клиническая вероятность ТЭЛА по трехуровневой шкале: ' +
            three.label +
            ', по двухуровневой шкале: ' +
            two.label
        };
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function showResult() {
        var out = calculate();
        resultNumber.textContent = out.numberText;
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + out.category;
        resultDesc.textContent = out.desc;
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      }

      form.addEventListener('change', hideResult);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        showResult();
      });

      calcBtn.disabled = false;
      calcBtn.classList.remove('fc-calc__btn--inactive');
    })();

(function () {
      var root = document.querySelector('[data-mode-panel="pesi-pe"]') || document.querySelector('.fc-calc[data-calculator="pesi-pe"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-pesi-pe-form');
      var calcBtn = root.querySelector('#fc-calc-pesi-pe-btn');
      var ageInput = root.querySelector('#fc-calc-pesi-pe-age');
      var criteriaIds = [
        'sex', 'malignancy', 'chf', 'lungDisease', 'heartRate', 'systolicBp',
        'respiratoryRate', 'temperature', 'mentalStatus', 'oxygenSat'
      ];

      function hideResult() {
        root.querySelector('#fc-calc-pesi-pe-result').classList.add('fc-calc__result-wrap--hidden');
      }

      function parseAge() {
        var s = String(ageInput.value || '').trim().replace(',', '.');
        if (!s || !/^\d+$/.test(s)) return null;
        var n = Number(s);
        if (!Number.isFinite(n) || n < 0 || n > 120) return null;
        return n;
      }

      function getSelectedScores() {
        var scores = {};
        var complete = parseAge() !== null;

        for (var i = 0; i < criteriaIds.length; i++) {
          var id = criteriaIds[i];
          var checked = form.querySelector('input[name="' + id + '"]:checked');
          if (!checked) {
            complete = false;
            continue;
          }
          scores[id] = Number(checked.getAttribute('data-points'));
        }

        return { scores: scores, complete: complete, age: parseAge() };
      }

      function interpret(total) {
        if (total <= 65) return 'Класс I. Очень низкий риск 30-дневной летальности (0–1,6%)';
        if (total <= 85) return 'Класс II. Низкий риск летальности (1,7–3,5%)';
        if (total <= 105) return 'Класс III. Умеренный риск летальности (3,2–7,1%)';
        if (total <= 125) return 'Класс IV. Высокий риск летальности (4,0–11,4%)';
        return 'Класс V. Очень высокий риск летальности (10,0–24,5%)';
      }

      function updateButton() {
        var ok = getSelectedScores().complete;
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('input', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var parsed = getSelectedScores();
        if (!parsed.complete || parsed.age === null) return;

        var total = parsed.age;
        for (var i = 0; i < criteriaIds.length; i++) {
          total += parsed.scores[criteriaIds[i]];
        }

        root.querySelector('#fc-calc-pesi-pe-result-number').textContent = String(total);
        root.querySelector('#fc-calc-pesi-pe-result-desc').textContent = interpret(total);
        root.querySelector('#fc-calc-pesi-pe-result').classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();

(function () {
      var root = document.querySelector('[data-mode-panel="caprini-scale"]') || document.querySelector('.fc-calc[data-calculator="caprini-scale"]');
      if (!root) return;

      var RADIO_GROUPS = ['age', 'surgery'];

      var form = root.querySelector('#fc-calc-caprini-scale-form');
      var calcBtn = root.querySelector('#fc-calc-caprini-scale-btn');
      var formError = root.querySelector('#fc-calc-caprini-scale-form-error');
      var resultWrap = root.querySelector('#fc-calc-caprini-scale-result');
      var resultNumber = root.querySelector('#fc-calc-caprini-scale-result-number');
      var resultDesc = root.querySelector('#fc-calc-caprini-scale-result-desc');

      function pluralBalls(total) {
        var mod10 = total % 10;
        var mod100 = total % 100;
        if (mod10 === 1 && mod100 !== 11) return 'балл';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'балла';
        return 'баллов';
      }

      function interpret(total) {
        if (total >= 5) return { category: 'very-high', text: 'Очень высокий риск' };
        if (total >= 3) return { category: 'high', text: 'Высокий риск' };
        if (total === 2) return { category: 'moderate', text: 'Умеренный риск' };
        return { category: 'low', text: 'Низкий риск' };
      }

      function collectInput() {
        var input = {};
        var i;
        for (i = 0; i < RADIO_GROUPS.length; i++) {
          var name = RADIO_GROUPS[i];
          var checked = form.querySelector('input[name="' + name + '"]:checked');
          if (checked) input[name] = checked.value;
        }
        var boxes = form.querySelectorAll('input[type="checkbox"][name]');
        for (i = 0; i < boxes.length; i++) {
          if (boxes[i].checked) input[boxes[i].name] = true;
        }
        return input;
      }

      function isReady() {
        for (var i = 0; i < RADIO_GROUPS.length; i++) {
          if (!form.querySelector('input[name="' + RADIO_GROUPS[i] + '"]:checked')) return false;
        }
        return true;
      }

      function calculateTotal(input) {
        var total = 0;
        var checked = form.querySelectorAll('input:checked');
        for (var i = 0; i < checked.length; i++) {
          total += Number(checked[i].dataset.points || 0);
        }
        return total;
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
        formError.textContent = '';
      }

      function updateButton() {
        var ok = isReady();
        calcBtn.disabled = !ok;
        calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        hideResult();
        if (!isReady()) {
          formError.textContent = 'Выберите возраст и плановое хирургическое вмешательство';
          return;
        }
        var total = calculateTotal();
        var info = interpret(total);
        resultNumber.textContent = String(total) + ' ' + pluralBalls(total);
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + info.category;
        resultDesc.textContent = info.text;
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      });

      updateButton();
    })();

(function () {
      var root = document.querySelector('[data-mode-panel="improve-scale"]') || document.querySelector('.fc-calc[data-calculator="improve-scale"]');
      if (!root) return;

      var CRITERIA = [
        { id: 'vteHistory', points: 3 },
        { id: 'thrombophilia', points: 2 },
        { id: 'limbParesis', points: 2 },
        { id: 'malignancy', points: 2 },
        { id: 'icu', points: 1 },
        { id: 'immobilization', points: 1 },
        { id: 'age60', points: 1 }
      ];

      var form = root.querySelector('#fc-calc-improve-scale-form');
      var calcBtn = root.querySelector('#fc-calc-improve-scale-btn');
      var resultWrap = root.querySelector('#fc-calc-improve-scale-result');
      var resultNumber = root.querySelector('#fc-calc-improve-scale-result-number');
      var resultDesc = root.querySelector('#fc-calc-improve-scale-result-desc');

      function interpret(total) {
        if (total >= 4) return { category: 'high', text: 'Высокий риск развития ТГВ/ТЭЛА' };
        if (total >= 2) return { category: 'moderate', text: 'Умеренный риск развития ТГВ/ТЭЛА' };
        return { category: 'low', text: 'Низкий риск развития ТГВ/ТЭЛА' };
      }

      function calculate() {
        var total = 0;
        CRITERIA.forEach(function (c) {
          var el = root.querySelector('#fc-calc-improve-scale-' + c.id);
          if (el && el.checked) total += c.points;
        });
        return { total: total, info: interpret(total) };
      }

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function showResult() {
        var out = calculate();
        resultNumber.textContent = String(out.total);
        resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + out.info.category;
        resultDesc.textContent = out.info.text;
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      }

      form.addEventListener('change', hideResult);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        showResult();
      });

      calcBtn.disabled = false;
      calcBtn.classList.remove('fc-calc__btn--inactive');
    })();
(function () {
  var root = document.querySelector('.fc-calc[data-calculator="tela-scales"]');
  if (!root) return;
  var tabs = root.querySelectorAll('[data-mode-tab]');
  var panels = root.querySelectorAll('[data-mode-panel]');
  var notesPanels = root.querySelectorAll('[data-mode-notes]');
  var modeHint = root.querySelector('#fc-calc-tela-scales-mode-hint');
  var HINTS = {
  "years-pe": "Алгоритм YEARS при подозрении на ТЭЛА",
  "geneva-pe": "Женевская шкала — клиническая вероятность ТЭЛА",
  "wells-scale": "Шкала Веллса — клиническая вероятность ТЭЛА",
  "pesi-pe": "Шкала PESI — летальность при подтверждённой ТЭЛА",
  "caprini-scale": "Шкала Caprini — риска развития венозных тромбоэмболических осложнений у пациентов хирургического профиля",
  "improve-scale": "Шкала IMPROVE — риск ТГВ/ТЭЛА у терапевтических пациентов"
};

  function setMode(mode) {
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-mode-tab') === mode;
      tab.classList.toggle('fc-calc__tab--active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute('data-mode-panel') === mode;
      panel.classList.toggle('fc-calc__tab-panel--active', on);
      panel.hidden = !on;
    });
    notesPanels.forEach(function (panel) {
      var on = panel.getAttribute('data-mode-notes') === mode;
      panel.classList.toggle('fc-calc__tela-notes-mode--active', on);
      panel.hidden = !on;
    });
    if (modeHint && HINTS[mode]) modeHint.textContent = HINTS[mode];
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.getAttribute('data-mode-tab'));
    });
  });

  setMode('years-pe');
})();
