  var root = document.querySelector('.fc-calc[data-calculator="bread-units"]');
  if (!root) return;

  var MEALS_KEY = 'fc:bread-units:meals';
  var CUSTOM_KEY = 'fc:bread-units:custom-products';

  var tabs = root.querySelectorAll('.fc-calc__tab[data-mode]');
  var panels = root.querySelectorAll('.fc-calc__tab-panel[data-mode]');
  var activeMode = 'main';
  var activeMeal = 'breakfast';
  var meals = emptyMealLog();
  var customProducts = [];
  var lastResult = null;
  var searchTimer = null;
  var refCat = ALL_PRODUCTS_CATEGORY;
  var refPage = 0;

  var calcBtn = root.querySelector('#fc-calc-bread-units-btn');
  var addDiaryBtn = root.querySelector('#fc-calc-bread-units-add-diary');
  var saveCustomBtn = root.querySelector('#fc-calc-bread-units-save-custom');
  var formError = root.querySelector('#fc-calc-bread-units-form-error');
  var actionsRow = root.querySelector('#fc-calc-bread-units-actions');
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
  var mealTotal = root.querySelector('#fc-calc-bread-units-meal-total');
  var clearMealBtn = root.querySelector('#fc-calc-bread-units-clear-meal');
  var clearDayBtn = root.querySelector('#fc-calc-bread-units-clear-day');

  var dayHe = root.querySelector('#fc-calc-bread-units-day-he');
  var dayCarbs = root.querySelector('#fc-calc-bread-units-day-carbs');
  var dayCount = root.querySelector('#fc-calc-bread-units-day-count');
  var normLabel = root.querySelector('#fc-calc-bread-units-norm-label');
  var normFill = root.querySelector('#fc-calc-bread-units-norm-fill');
  var dbCount = root.querySelector('#fc-calc-bread-units-db-count');

  var refCats = root.querySelector('#fc-calc-bread-units-ref-cats');
  var refFilter = root.querySelector('#fc-calc-bread-units-ref-filter');
  var refList = root.querySelector('#fc-calc-bread-units-ref-list');
  var refEmpty = root.querySelector('#fc-calc-bread-units-ref-empty');
  var refPager = root.querySelector('#fc-calc-bread-units-ref-pager');
  var refPagerLabel = root.querySelector('#fc-calc-bread-units-ref-pager-label');
  var refPrev = root.querySelector('#fc-calc-bread-units-ref-prev');
  var refNext = root.querySelector('#fc-calc-bread-units-ref-next');

  var customForm = root.querySelector('#fc-calc-bread-units-form-custom');
  var customError = root.querySelector('#fc-calc-bread-units-custom-error');
  var customList = root.querySelector('#fc-calc-bread-units-custom-list');
  var customEmpty = root.querySelector('#fc-calc-bread-units-custom-empty');

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
    var onMain = mode === 'main';
    if (actionsRow) actionsRow.hidden = !onMain;
    if (!onMain) clearResult();
    if (mode === 'ref') renderRef();
    if (mode === 'custom') renderCustomList();
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
      customProducts = parseStoredCustomProducts(
        JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]')
      );
    } catch (e) {
      customProducts = [];
    }
  }

  function saveMeals() {
    try {
      localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
    } catch (e) {
      /* ignore quota */
    }
  }

  function saveCustom() {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customProducts));
    } catch (e) {
      /* ignore */
    }
  }

  function renderDay() {
    var day = summarizeDay(meals);
    dayHe.textContent = formatHe(day.totalHe);
    dayHe.className =
      'fc-calc__bu-stat-value fc-calc__bu-stat-value--' + day.level;
    dayCarbs.textContent = String(Math.round(day.totalCarbsG));
    dayCount.textContent = String(day.itemCount);
    normLabel.textContent =
      'Норма: ' + formatHe(day.totalHe) + ' / ' + DAILY_NORM_HE + ' ХЕ';
    normFill.style.width = day.normPct + '%';
    normFill.className = 'fc-calc__bu-norm-fill fc-calc__bu-norm-fill--' + day.level;
    dbCount.textContent =
      BREAD_PRODUCTS.length +
      ' в базе' +
      (customProducts.length ? ' · ' + customProducts.length + ' своих' : '');
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
    mealTotal.textContent = formatHe(mealTotalHe(items)) + ' ХЕ';
    clearMealBtn.disabled = items.length === 0;
  }

  function buildManualInput() {
    return {
      mode: 'manual',
      carbsPer100: carbsInput.value,
      portionG: portionInput.value,
      standard: Number(standardSelect.value || LOOKUP_HE_STANDARD),
      productName: nameInput.value.trim(),
    };
  }

  function canCalculate() {
    var carbs = parseNumber(carbsInput.value);
    var portion = parseNumber(portionInput.value);
    return carbs != null && carbs >= 0 && portion != null && portion > 0;
  }

  function updateMainActions() {
    var ok = canCalculate();
    calcBtn.disabled = !ok;
    calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
    addDiaryBtn.disabled = !ok;
    var name = nameInput.value.trim();
    var carbs = parseNumber(carbsInput.value);
    saveCustomBtn.disabled = !(name && carbs != null && carbs >= 0);
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
    clearResult();
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
    renderHits(searchProducts(BREAD_PRODUCTS, q, 30, customProducts));
  }

  nameInput.addEventListener('input', function () {
    clearResult();
    formError.textContent = '';
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

  [carbsInput, portionInput, standardSelect].forEach(function (el) {
    el.addEventListener('input', function () {
      clearResult();
      formError.textContent = '';
      updateMainActions();
    });
    el.addEventListener('change', updateMainActions);
  });

  function onCalculate(e) {
    if (e) e.preventDefault();
    formError.textContent = '';
    try {
      renderResult(calculate(buildManualInput()));
    } catch (err) {
      clearResult();
      formError.textContent = err.message || 'Проверьте ввод';
    }
  }

  function onAddDiary(e) {
    if (e) e.preventDefault();
    formError.textContent = '';
    try {
      var out = lastResult && canCalculate() ? lastResult : calculate(buildManualInput());
      if (!lastResult) renderResult(out);
      meals[activeMeal] = meals[activeMeal].concat([
        {
          id: createMealItemId(),
          name: (out.productName || nameInput.value.trim() || 'Продукт').slice(0, 120),
          he: out.he,
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

  function onSaveCustomFromMain(e) {
    if (e) e.preventDefault();
    formError.textContent = '';
    try {
      var carbs = parseNumber(carbsInput.value);
      var portion = parseNumber(portionInput.value);
      var product = createCustomProduct({
        name: nameInput.value,
        carbs: carbs,
        portion:
          portion != null && portion > 0
            ? String(portionInput.value).trim() +
              (/\s*г\s*$/i.test(portionInput.value) ? '' : ' г')
            : '',
      });
      var dup = customProducts.some(function (p) {
        return p.name.toLowerCase() === product.name.toLowerCase();
      });
      if (dup) {
        formError.textContent = 'Продукт с таким названием уже есть';
        return;
      }
      customProducts = [product].concat(customProducts);
      saveCustom();
      renderDay();
      switchMode('custom');
    } catch (err) {
      formError.textContent = err.message || 'Не удалось сохранить';
    }
  }

  manualForm.addEventListener('submit', onCalculate);
  calcBtn.addEventListener('click', onCalculate);
  addDiaryBtn.addEventListener('click', onAddDiary);
  saveCustomBtn.addEventListener('click', onSaveCustomFromMain);

  clearMealBtn.addEventListener('click', function () {
    meals[activeMeal] = [];
    saveMeals();
    renderDay();
    renderMealTabs();
    renderLog();
  });

  clearDayBtn.addEventListener('click', function () {
    meals = emptyMealLog();
    saveMeals();
    renderDay();
    renderMealTabs();
    renderLog();
  });

  function ensureRefCat() {
    var cats = listProductCategories(BREAD_PRODUCTS, customProducts);
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

    var all = productsByCategory(
      BREAD_PRODUCTS,
      refCat,
      refFilter.value,
      customProducts
    );
    var pageCount = Math.max(1, Math.ceil(all.length / REF_PAGE_SIZE));
    if (refPage > pageCount - 1) refPage = pageCount - 1;
    var start = refPage * REF_PAGE_SIZE;
    var pageItems = all.slice(start, start + REF_PAGE_SIZE);

    refList.innerHTML = '';
    refEmpty.hidden = all.length > 0;
    if (all.length === 0) {
      refEmpty.textContent =
        refCat === CUSTOM_PRODUCT_CATEGORY
          ? 'Своих продуктов пока нет — добавьте на вкладке «Свои продукты».'
          : 'Нет продуктов в этой категории.';
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

  function renderCustomList() {
    customList.innerHTML = '';
    customEmpty.hidden = customProducts.length > 0;
    customProducts.forEach(function (p) {
      var li = document.createElement('li');
      li.className = 'fc-calc__bu-log-item';
      var info = document.createElement('button');
      info.type = 'button';
      info.className = 'fc-calc__bu-hit';
      info.style.padding = '0';
      info.style.border = '0';
      info.innerHTML =
        '<span class="fc-calc__bu-log-name">' +
        escapeHtml(p.name) +
        '</span><span class="fc-calc__bu-log-meta">' +
        p.carbs +
        ' г/100 г · 1 ХЕ ≈ ' +
        escapeHtml(gram1heLabel(p.gram1he)) +
        (p.portion ? ' · ' + escapeHtml(p.portion) : '') +
        '</span>';
      info.addEventListener('click', function () {
        applyProduct(p);
      });
      var he = document.createElement('span');
      he.className = 'fc-calc__bu-log-he';
      he.textContent = p.carbs + ' г';
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'fc-calc__bu-remove';
      remove.setAttribute('aria-label', 'Удалить');
      remove.textContent = '✕';
      remove.addEventListener('click', function () {
        customProducts = customProducts.filter(function (x) {
          return x.id !== p.id;
        });
        saveCustom();
        renderDay();
        renderCustomList();
      });
      li.appendChild(info);
      li.appendChild(he);
      li.appendChild(remove);
      customList.appendChild(li);
    });
  }

  customForm.addEventListener('submit', function (e) {
    e.preventDefault();
    customError.textContent = '';
    var fd = new FormData(customForm);
    try {
      var product = createCustomProduct({
        name: fd.get('name'),
        carbs: parseNumber(fd.get('carbs')),
        portion: String(fd.get('portion') || ''),
      });
      var dup = customProducts.some(function (p) {
        return p.name.toLowerCase() === product.name.toLowerCase();
      });
      if (dup) {
        customError.textContent = 'Продукт с таким названием уже есть';
        return;
      }
      customProducts = [product].concat(customProducts);
      saveCustom();
      customForm.reset();
      renderDay();
      renderCustomList();
    } catch (err) {
      customError.textContent = err.message || 'Не удалось добавить';
    }
  });

  loadStorage();
  renderDay();
  renderMealTabs();
  renderLog();
  updateMainActions();
  ensureRefCat();
