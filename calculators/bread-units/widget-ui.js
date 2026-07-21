  var root = document.querySelector('.fc-calc[data-calculator="bread-units"]');
  if (!root) return;

  var MEALS_KEY = 'fc:bread-units:meals';
  var COEFF_KEY = 'fc:bread-units:meal-coefficients';

  var tabs = root.querySelectorAll('.fc-calc__tab[data-mode]');
  var panels = root.querySelectorAll('.fc-calc__tab-panel[data-mode]');
  var activeMode = 'main';
  var activeMeal = 'breakfast';
  var meals = emptyMealLog();
  var mealCoefficients = emptyMealCoefficients();
  var lastResult = null;
  var searchTimer = null;
  var refCat = ALL_PRODUCTS_CATEGORY;
  var refPage = 0;

  var addDiaryBtn = root.querySelector('#fc-calc-bread-units-add-diary');
  var formError = root.querySelector('#fc-calc-bread-units-form-error');
  var resultWrap = root.querySelector('#fc-calc-bread-units-result');
  var resultNumber = root.querySelector('#fc-calc-bread-units-result-number');
  var resultDesc = root.querySelector('#fc-calc-bread-units-result-desc');
  var resultExtra = root.querySelector('#fc-calc-bread-units-result-extra');

  var manualForm = root.querySelector('#fc-calc-bread-units-form-main');
  var nameInput = root.querySelector('#fc-calc-bread-units-name');
  var carbsInput = root.querySelector('#fc-calc-bread-units-carbs');
  var portionInput = root.querySelector('#fc-calc-bread-units-portion');
  var standardSelect = root.querySelector('#fc-calc-bread-units-standard');
  var hitsList = root.querySelector('#fc-calc-bread-units-hits');
  var searchEmpty = root.querySelector('#fc-calc-bread-units-search-empty');

  var mealTabs = root.querySelector('#fc-calc-bread-units-meal-tabs');
  var logList = root.querySelector('#fc-calc-bread-units-log');
  var logEmpty = root.querySelector('#fc-calc-bread-units-log-empty');
  var mealTotals = root.querySelector('#fc-calc-bread-units-meal-totals');
  var clearDayBtn = root.querySelector('#fc-calc-bread-units-clear-day');

  var dayHe = root.querySelector('#fc-calc-bread-units-day-he');
  var dayCarbs = root.querySelector('#fc-calc-bread-units-day-carbs');
  var dayCount = root.querySelector('#fc-calc-bread-units-day-count');
  var dayInsulinStat = root.querySelector('#fc-calc-bread-units-day-insulin-stat');

  var refCats = root.querySelector('#fc-calc-bread-units-ref-cats');
  var refFilter = root.querySelector('#fc-calc-bread-units-ref-filter');
  var refList = root.querySelector('#fc-calc-bread-units-ref-list');
  var refEmpty = root.querySelector('#fc-calc-bread-units-ref-empty');
  var refPager = root.querySelector('#fc-calc-bread-units-ref-pager');
  var refPagerLabel = root.querySelector('#fc-calc-bread-units-ref-pager-label');
  var refPrev = root.querySelector('#fc-calc-bread-units-ref-prev');
  var refNext = root.querySelector('#fc-calc-bread-units-ref-next');

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function switchMode(mode) {
    activeMode = mode;
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-mode') === mode;
      tab.classList.toggle('fc-calc__tab--active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(function (panel) {
      var active = panel.getAttribute('data-mode') === mode;
      panel.classList.toggle('fc-calc__tab-panel--active', active);
      panel.hidden = !active;
    });
    formError.textContent = '';
    if (mode !== 'main') clearResult();
    if (mode === 'ref') renderRef();
    updateMainActions();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchMode(tab.getAttribute('data-mode'));
    });
  });

  function loadStorage() {
    try {
      meals = parseStoredMealLog(JSON.parse(localStorage.getItem(MEALS_KEY) || 'null'));
    } catch (e) {
      meals = emptyMealLog();
    }
    try {
      mealCoefficients = parseStoredMealCoefficients(
        JSON.parse(localStorage.getItem(COEFF_KEY) || 'null')
      );
    } catch (e) {
      mealCoefficients = emptyMealCoefficients();
    }
  }

  function saveMeals() {
    try {
      localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
    } catch (e) {
      /* ignore quota */
    }
  }

  function saveCoefficients() {
    try {
      localStorage.setItem(COEFF_KEY, JSON.stringify(mealCoefficients));
    } catch (e) {
      /* ignore */
    }
  }

  function dayInsulinTotal() {
    return MEAL_OPTIONS.reduce(function (sum, meal) {
      return (
        sum +
        insulinUnitsFromHe(mealTotalHe(meals[meal.id]), mealCoefficients[meal.id])
      );
    }, 0);
  }

  function renderDay() {
    var day = summarizeDay(meals);
    dayHe.textContent = formatHe(day.totalHe);
    dayCarbs.textContent = String(Math.round(day.totalCarbsG));
    dayCount.textContent = String(day.itemCount);
    dayInsulinStat.textContent = formatHe(dayInsulinTotal());
    clearDayBtn.disabled = day.itemCount === 0;
  }

  function renderMealTabs() {
    mealTabs.innerHTML = '';
    MEAL_OPTIONS.forEach(function (meal) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'fc-calc__bu-meal-tab' +
        (meal.id === activeMeal ? ' fc-calc__bu-meal-tab--active' : '');
      btn.setAttribute('data-meal', meal.id);
      var count = meals[meal.id].length;
      btn.innerHTML =
        escapeHtml(meal.label) +
        (count
          ? ' <span class="fc-calc__bu-badge">' + count + '</span>'
          : '');
      btn.addEventListener('click', function () {
        activeMeal = meal.id;
        renderMealTabs();
        renderLog();
      });
      mealTabs.appendChild(btn);
    });
  }

  function renderLog() {
    var items = meals[activeMeal] || [];
    logList.innerHTML = '';
    logEmpty.hidden = items.length > 0;
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'fc-calc__bu-log-item';
      li.innerHTML =
        '<div><span class="fc-calc__bu-log-name">' +
        escapeHtml(item.name) +
        '</span><span class="fc-calc__bu-log-meta">' +
        escapeHtml(String(item.gram)) +
        ' г · ' +
        escapeHtml(item.note || '') +
        '</span></div><span class="fc-calc__bu-log-he">' +
        formatHe(item.he) +
        ' ХЕ</span>';
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'fc-calc__bu-remove';
      remove.setAttribute('aria-label', 'Удалить');
      remove.textContent = '✕';
      remove.addEventListener('click', function () {
        meals[activeMeal] = meals[activeMeal].filter(function (x) {
          return x.id !== item.id;
        });
        saveMeals();
        renderDay();
        renderMealTabs();
        renderLog();
      });
      li.appendChild(remove);
      logList.appendChild(li);
    });
    renderMealTotals();
  }

  function renderMealTotals() {
    var dayHe = 0;
    var dayInsulin = 0;
    var rows = MEAL_OPTIONS.map(function (meal) {
      var he = mealTotalHe(meals[meal.id]);
      var coeff = mealCoefficients[meal.id];
      var insulin = insulinUnitsFromHe(he, coeff);
      dayHe += he;
      dayInsulin += insulin;
      return (
        '<tr class="' +
        (meal.id === activeMeal ? 'fc-calc__bu-ins-row--active' : '') +
        '" data-meal="' +
        meal.id +
        '">' +
        '<td>' +
        escapeHtml(meal.label) +
        '</td>' +
        '<td>' +
        formatHe(he) +
        '</td>' +
        '<td><input class="fc-calc__bu-coeff-input" type="number" inputmode="decimal" min="0" step="any" data-meal-coeff="' +
        meal.id +
        '" value="' +
        String(coeff) +
        '" aria-label="Углеводный коэффициент: ' +
        escapeHtml(meal.label) +
        '" /></td>' +
        '<td data-insulin-for="' +
        meal.id +
        '">' +
        formatHe(insulin) +
        '</td>' +
        '</tr>'
      );
    }).join('');

    mealTotals.innerHTML =
      '<table class="fc-calc__bu-ins-table">' +
      '<thead><tr>' +
      '<th scope="col">Приём пищи</th>' +
      '<th scope="col">ХЕ</th>' +
      '<th scope="col">Углеводный коэффициент</th>' +
      '<th scope="col">Инсулин короткого/ультракороткого действия, ЕД</th>' +
      '</tr></thead><tbody>' +
      rows +
      '<tr class="fc-calc__bu-ins-row--day">' +
      '<td>Итого рацион дня</td>' +
      '<td id="fc-calc-bread-units-day-he-table">' +
      formatHe(dayHe) +
      '</td>' +
      '<td></td>' +
      '<td id="fc-calc-bread-units-day-insulin">' +
      formatHe(dayInsulin) +
      '</td>' +
      '</tr></tbody></table>';

    mealTotals.querySelectorAll('tr[data-meal]').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('input')) return;
        activeMeal = tr.getAttribute('data-meal');
        renderMealTabs();
        renderLog();
      });
    });

    mealTotals.querySelectorAll('input[data-meal-coeff]').forEach(function (input) {
      input.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      input.addEventListener('change', function () {
        var mealId = input.getAttribute('data-meal-coeff');
        var value = parseNumber(input.value);
        if (value == null || value < 0) {
          input.value = String(mealCoefficients[mealId]);
          return;
        }
        mealCoefficients[mealId] = value;
        saveCoefficients();
        renderDay();
        renderMealTotals();
      });
    });
  }

  function getActiveStandard() {
    var s = Number(standardSelect.value || LOOKUP_HE_STANDARD);
    return HE_STANDARDS.some(function (x) {
      return Number(x) === s;
    })
      ? s
      : LOOKUP_HE_STANDARD;
  }

  function buildManualInput() {
    return {
      mode: 'manual',
      carbsPer100: carbsInput.value,
      portionG: portionInput.value,
      standard: getActiveStandard(),
      productName: nameInput.value.trim(),
    };
  }

  function canCalculate() {
    var carbs = parseNumber(carbsInput.value);
    var portion = parseNumber(portionInput.value);
    return carbs != null && carbs >= 0 && portion != null && portion > 0;
  }

  function refreshDiaryForStandard() {
    meals = recalculateMealLogHe(meals, getActiveStandard());
    saveMeals();
    renderDay();
    renderMealTabs();
    renderLog();
  }

  function updateMainActions() {
    var ok = canCalculate();
    addDiaryBtn.disabled = !ok;
    formError.textContent = '';
    if (!ok) {
      clearResult();
      return;
    }
    try {
      renderResult(calculate(buildManualInput()));
    } catch (err) {
      clearResult();
      formError.textContent = err.message || 'Проверьте ввод';
    }
  }

  function clearResult() {
    lastResult = null;
    resultWrap.classList.add('fc-calc__result-wrap--hidden');
  }

  function renderResult(out) {
    lastResult = out;
    resultNumber.textContent = out.heLabel + ' ХЕ';
    resultDesc.textContent = out.productName
      ? out.productName
      : 'Стандарт ' + out.standard + ' г углеводов = 1 ХЕ';
    resultExtra.innerHTML =
      '<p><strong>Углеводы в порции:</strong> ' +
      out.carbsLabel +
      ' г</p>' +
      '<p><strong>Порция:</strong> ' +
      formatCarbs(out.portionG, out.portionG % 1 === 0 ? 0 : 1) +
      ' г · <strong>на 100 г:</strong> ' +
      formatCarbs(out.carbsPer100, out.carbsPer100 % 1 === 0 ? 0 : 1) +
      ' г</p>';
    resultWrap.classList.remove('fc-calc__result-wrap--hidden');
  }

  function applyProduct(product) {
    nameInput.value = product.name;
    carbsInput.value = String(product.carbs);
    var grams = parsePortionGrams(product.portion);
    if (grams == null && product.gram1he > 0) grams = product.gram1he;
    if (grams != null) portionInput.value = String(grams);
    else if (!portionInput.value.trim()) portionInput.value = '100';
    standardSelect.value = String(LOOKUP_HE_STANDARD);
    hitsList.hidden = true;
    searchEmpty.hidden = true;
    switchMode('main');
    updateMainActions();
  }

  function renderHits(products) {
    hitsList.innerHTML = '';
    if (!products.length) {
      hitsList.hidden = true;
      searchEmpty.hidden = false;
      searchEmpty.textContent = 'Ничего не найдено';
      return;
    }
    searchEmpty.hidden = true;
    products.forEach(function (product) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fc-calc__bu-hit';
      btn.innerHTML =
        '<span class="fc-calc__bu-hit-name">' +
        escapeHtml(product.name) +
        '</span>' +
        '<span class="fc-calc__bu-hit-meta">' +
        escapeHtml(product.cat) +
        ' · ' +
        product.carbs +
        ' г/100 г · 1 ХЕ ≈ ' +
        escapeHtml(gram1heLabel(product.gram1he)) +
        '</span>';
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        applyProduct(product);
      });
      li.appendChild(btn);
      hitsList.appendChild(li);
    });
    hitsList.hidden = false;
  }

  function runNameSearch() {
    var q = nameInput.value.trim();
    if (q.length < 1) {
      hitsList.hidden = true;
      hitsList.innerHTML = '';
      searchEmpty.hidden = true;
      return;
    }
    renderHits(searchProducts(BREAD_PRODUCTS, q, 30));
  }

  nameInput.addEventListener('input', function () {
    updateMainActions();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runNameSearch, 160);
  });

  nameInput.addEventListener('focus', function () {
    if (nameInput.value.trim().length >= 1) runNameSearch();
  });

  document.addEventListener('click', function (e) {
    if (!root.contains(e.target)) return;
    if (e.target === nameInput || hitsList.contains(e.target)) return;
    hitsList.hidden = true;
  });

  [carbsInput, portionInput].forEach(function (el) {
    el.addEventListener('input', updateMainActions);
    el.addEventListener('change', updateMainActions);
  });

  standardSelect.addEventListener('change', function () {
    refreshDiaryForStandard();
    updateMainActions();
  });

  function onAddDiary(e) {
    if (e) e.preventDefault();
    formError.textContent = '';
    try {
      var out = calculate(buildManualInput());
      renderResult(out);
      meals[activeMeal] = meals[activeMeal].concat([
        {
          id: createMealItemId(),
          name: (out.productName || nameInput.value.trim() || 'Продукт').slice(0, 120),
          he: out.he,
          carbsG: out.carbsInPortion,
          gram: out.portionG,
          note: out.carbsLabel + ' г углеводов',
          meal: activeMeal,
        },
      ]);
      saveMeals();
      renderDay();
      renderMealTabs();
      renderLog();
    } catch (err) {
      formError.textContent = err.message || 'Не удалось добавить';
    }
  }

  manualForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!addDiaryBtn.disabled) onAddDiary();
  });
  addDiaryBtn.addEventListener('click', onAddDiary);

  clearDayBtn.addEventListener('click', function () {
    meals = emptyMealLog();
    saveMeals();
    renderDay();
    renderMealTabs();
    renderLog();
  });

  function ensureRefCat() {
    var cats = listProductCategories(BREAD_PRODUCTS);
    if (!cats.includes(refCat)) {
      refCat = ALL_PRODUCTS_CATEGORY;
      refPage = 0;
    }
    return cats;
  }

  function giBadgeHtml(gi) {
    var level = giLevel(gi);
    if (level === 'none') {
      return '<span class="fc-calc__bu-gi-badge fc-calc__bu-gi-badge--none">—</span>';
    }
    return (
      '<span class="fc-calc__bu-gi-badge fc-calc__bu-gi-badge--' +
      level +
      '">' +
      gi +
      '</span>'
    );
  }

  function renderRef() {
    var cats = ensureRefCat();
    refCats.innerHTML = '';
    cats.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'fc-calc__bu-cat' + (cat === refCat ? ' fc-calc__bu-cat--active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', function () {
        refCat = cat;
        refPage = 0;
        renderRef();
      });
      refCats.appendChild(btn);
    });

    var all = productsByCategory(BREAD_PRODUCTS, refCat, refFilter.value);
    var pageCount = Math.max(1, Math.ceil(all.length / REF_PAGE_SIZE));
    if (refPage > pageCount - 1) refPage = pageCount - 1;
    var start = refPage * REF_PAGE_SIZE;
    var pageItems = all.slice(start, start + REF_PAGE_SIZE);

    refList.innerHTML = '';
    refEmpty.hidden = all.length > 0;
    if (all.length === 0) {
      refEmpty.textContent = 'Нет продуктов в этой категории.';
      refPager.hidden = true;
      return;
    }

    pageItems.forEach(function (p) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fc-calc__bu-ref-item';
      btn.innerHTML =
        '<div><span class="fc-calc__bu-hit-name">' +
        escapeHtml(p.name) +
        '</span><span class="fc-calc__bu-hit-meta">' +
        p.carbs +
        ' г/100 г · 1 ХЕ ≈ ' +
        escapeHtml(gram1heLabel(p.gram1he)) +
        ' · ' +
        escapeHtml(p.portion || '—') +
        '</span></div>' +
        giBadgeHtml(p.gi);
      btn.addEventListener('click', function () {
        applyProduct(p);
      });
      li.appendChild(btn);
      refList.appendChild(li);
    });

    refPager.hidden = false;
    refPagerLabel.textContent =
      start +
      1 +
      '–' +
      Math.min(start + REF_PAGE_SIZE, all.length) +
      ' из ' +
      all.length;
    refPrev.disabled = refPage <= 0;
    refNext.disabled = refPage >= pageCount - 1;
  }

  refFilter.addEventListener('input', function () {
    refPage = 0;
    renderRef();
  });
  refPrev.addEventListener('click', function () {
    refPage = Math.max(0, refPage - 1);
    renderRef();
  });
  refNext.addEventListener('click', function () {
    refPage += 1;
    renderRef();
  });

  loadStorage();
  meals = recalculateMealLogHe(meals, getActiveStandard());
  saveMeals();
  renderDay();
  renderMealTabs();
  renderLog();
  updateMainActions();
  ensureRefCat();
