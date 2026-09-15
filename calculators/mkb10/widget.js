(function () {
  var root = document.querySelector('.fc-calc[data-calculator="mkb10"]');
  if (!root) return;

  /* __MKB_CALC__ */

  var DATA_B64 = '__MKB_DATA_B64__';
  var ICON_INFECTIOUS = '__MKB_ICON_INFECTIOUS__';
  var ICON_NEOPLASMS = '__MKB_ICON_NEOPLASMS__';
  var ICON_BLOOD = '__MKB_ICON_BLOOD__';
  var ICON_ENDOCRINE = '__MKB_ICON_ENDOCRINE__';
  var ICON_MENTAL = '__MKB_ICON_MENTAL__';
  var ICON_NERVOUS = '__MKB_ICON_NERVOUS__';
  var ICON_EYE = '__MKB_ICON_EYE__';
  var ICON_EAR = '__MKB_ICON_EAR__';
  var ICON_HEART = '__MKB_ICON_HEART__';
  var ICON_LUNGS = '__MKB_ICON_LUNGS__';
  var ICON_DIGESTIVE = '__MKB_ICON_DIGESTIVE__';
  var ICON_SKIN = '__MKB_ICON_SKIN__';
  var ICON_MUSCULO = '__MKB_ICON_MUSCULO__';
  var ICON_KIDNEY = '__MKB_ICON_KIDNEY__';
  var ICON_PREGNANCY = '__MKB_ICON_PREGNANCY__';
  var ICON_PERINATAL = '__MKB_ICON_PERINATAL__';
  var ICON_CONGENITAL = '__MKB_ICON_CONGENITAL__';
  var ICON_SYMPTOMS = '__MKB_ICON_SYMPTOMS__';
  var ICON_INJURY = '__MKB_ICON_INJURY__';
  var ICON_EXTERNAL = '__MKB_ICON_EXTERNAL__';
  var ICON_FACTORS = '__MKB_ICON_FACTORS__';
  var ICON_SPECIAL = '__MKB_ICON_SPECIAL__';
  var CLASS_ICONS = {
    'A00-B99': ICON_INFECTIOUS,
    'C00-D48': ICON_NEOPLASMS,
    'D50-D89': ICON_BLOOD,
    'E00-E90': ICON_ENDOCRINE,
    'F00-F99': ICON_MENTAL,
    'G00-G99': ICON_NERVOUS,
    'H00-H59': ICON_EYE,
    'H60-H95': ICON_EAR,
    'I00-I99': ICON_HEART,
    'J00-J99': ICON_LUNGS,
    'K00-K93': ICON_DIGESTIVE,
    'L00-L99': ICON_SKIN,
    'M00-M99': ICON_MUSCULO,
    'N00-N99': ICON_KIDNEY,
    'O00-O99': ICON_PREGNANCY,
    'P00-P96': ICON_PERINATAL,
    'Q00-Q99': ICON_CONGENITAL,
    'R00-R99': ICON_SYMPTOMS,
    'S00-T98': ICON_INJURY,
    'V01-Y98': ICON_EXTERNAL,
    'Z00-Z99': ICON_FACTORS,
    'U00-U85': ICON_SPECIAL
  };

  var searchInput = root.querySelector('#fc-calc-mkb10-search');
  var clearBtn = root.querySelector('#fc-calc-mkb10-clear');
  var listTitle = root.querySelector('#fc-calc-mkb10-list-title');
  var listCount = root.querySelector('#fc-calc-mkb10-list-count');
  var listCrumbs = root.querySelector('#fc-calc-mkb10-list-crumbs');
  var browseEl = root.querySelector('#fc-calc-mkb10-browse');
  var searchPanel = root.querySelector('#fc-calc-mkb10-search-results');
  var searchList = root.querySelector('#fc-calc-mkb10-search-list');
  var placeholderEl = root.querySelector('#fc-calc-mkb10-placeholder');
  var cardBody = root.querySelector('#fc-calc-mkb10-card-body');
  var cardLevel = root.querySelector('#fc-calc-mkb10-card-level');
  var cardCode = root.querySelector('#fc-calc-mkb10-card-code');
  var cardName = root.querySelector('#fc-calc-mkb10-card-name');
  var cardCrumbs = root.querySelector('#fc-calc-mkb10-crumbs');
  var cardInfo = root.querySelector('#fc-calc-mkb10-info');
  var cardInfoLabel = root.querySelector('#fc-calc-mkb10-info-label');
  var cardKidsWrap = root.querySelector('#fc-calc-mkb10-kids-wrap');
  var cardKids = root.querySelector('#fc-calc-mkb10-kids');
  var cardKidsTitle = root.querySelector('#fc-calc-mkb10-kids-title');
  var showInTreeBtn = root.querySelector('#fc-calc-mkb10-show-tree');

  var index = null;
  var selectedId = null;
  var expanded = Object.create(null);
  var searchTimer = null;
  var inSearchMode = false;

  function gunzipB64(b64) {
    var bin = Uint8Array.from(atob(b64), function (c) {
      return c.charCodeAt(0);
    });
    if (typeof DecompressionStream === 'undefined') {
      return Promise.reject(new Error('DecompressionStream is not supported'));
    }
    var ds = new DecompressionStream('gzip');
    var stream = new Blob([bin]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer().then(function (buf) {
      return JSON.parse(new TextDecoder().decode(buf));
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function levelLabel(item) {
    if (!item) return '';
    var code = item.code || '';
    if (!item.parentId) return 'Класс';
    if (/^[A-Z]\d{2}-[A-Z]\d{2}$/i.test(code)) return 'Блок';
    if (/^[A-Z]\d{2}$/i.test(code)) return 'Рубрика';
    if (/^[A-Z]\d{2}\./i.test(code)) return 'Подрубрика';
    return 'Раздел';
  }

  function setListMeta(title, countText) {
    if (listTitle) listTitle.textContent = title;
    if (listCount) listCount.textContent = countText || '';
  }

  function buildCrumbsHtml(path, opts) {
    opts = opts || {};
    var html = '';
    if (opts.withHome) {
      html +=
        '<li><button type="button" class="fc-calc__mkb-crumb" data-mkb-home title="Свернуть всё и вернуться к классам">Классы</button></li>';
    }
    path.forEach(function (p, i) {
      if (opts.withHome || i) html += '<li class="fc-calc__mkb-sep" aria-hidden="true">›</li>';
      var last = i === path.length - 1;
      html +=
        '<li><button type="button" class="fc-calc__mkb-crumb" data-select="' +
        p.id +
        '"' +
        (last ? ' disabled' : '') +
        '>' +
        esc(p.code || displayName(p)) +
        '</button></li>';
    });
    return html;
  }

  function updateListCrumbs(itemId) {
    if (!listCrumbs) return;
    if (inSearchMode || itemId == null || !index) {
      listCrumbs.hidden = true;
      listCrumbs.innerHTML = '';
      return;
    }
    var path = getPath(index, itemId);
    listCrumbs.innerHTML = buildCrumbsHtml(path, { withHome: true });
    listCrumbs.hidden = false;
  }

  function resetToRoot() {
    expanded = Object.create(null);
    selectedId = null;
    inSearchMode = false;
    if (searchInput) searchInput.value = '';
    updateClearBtn();
    if (placeholderEl) placeholderEl.hidden = false;
    if (cardBody) cardBody.hidden = true;
    if (cardCrumbs) cardCrumbs.innerHTML = '';
    if (showInTreeBtn) showInTreeBtn.hidden = true;
    if (searchPanel) searchPanel.hidden = true;
    if (browseEl) browseEl.hidden = false;
    renderTree();
    updateListCrumbs(null);
  }

  function updateClearBtn() {
    if (!clearBtn || !searchInput) return;
    clearBtn.hidden = !searchInput.value.trim();
  }

  function renderRow(item, depth) {
    var open = Boolean(expanded[item.id]);
    var kids = hasChildren(index, item.id);
    var active = selectedId === item.id;
    var classIcon = !item.parentId && CLASS_ICONS[item.code] ? CLASS_ICONS[item.code] : '';
    var toggleInner = classIcon
      ? '<img class="fc-calc__mkb-toggle-icon" src="' +
        classIcon +
        '" alt="" width="56" height="56" decoding="async" />'
      : open
        ? '▾'
        : '▸';
    var toggleClass =
      'fc-calc__mkb-toggle' + (classIcon ? ' fc-calc__mkb-toggle--icon' : '');
    var toggleHtml = kids
      ? '<button type="button" class="' +
        toggleClass +
        '" data-toggle="' +
        item.id +
        '" aria-expanded="' +
        (open ? 'true' : 'false') +
        '" aria-label="' +
        (open ? 'Свернуть' : 'Развернуть') +
        '">' +
        toggleInner +
        '</button>'
      : '<span class="fc-calc__mkb-toggle-spacer" aria-hidden="true"></span>';
    var html =
      '<li class="fc-calc__mkb-item" data-id="' +
      item.id +
      '">' +
      '<div class="fc-calc__mkb-row' +
      (active ? ' fc-calc__mkb-row--active' : '') +
      '"' +
      (depth ? ' style="padding-left:' + depth * 1.25 + 'rem"' : '') +
      '>' +
      toggleHtml +
      '<button type="button" class="fc-calc__mkb-select" data-select="' +
      item.id +
      '">' +
      '<span class="fc-calc__mkb-code">' +
      esc(item.code || '—') +
      '</span>' +
      '<span class="fc-calc__mkb-name">' +
      esc(displayName(item)) +
      '</span>' +
      '</button>' +
      '</div>';
    if (kids && open) {
      html += '<ul class="fc-calc__mkb-children">';
      getChildren(index, item.id).forEach(function (child) {
        html += renderRow(child, depth + 1);
      });
      html += '</ul>';
    }
    html += '</li>';
    return html;
  }

  function renderTree() {
    if (!browseEl || !index) return;
    var html = '<ul class="fc-calc__mkb-list" role="tree">';
    getChildren(index, null).forEach(function (item) {
      html += renderRow(item, 0);
    });
    html += '</ul>';
    browseEl.innerHTML = html;
    setListMeta('Классы МКБ-10', index.roots.length + ' классов');
    updateListCrumbs(selectedId);
  }

  function renderSearch(query) {
    if (!searchList || !index) return;
    var results = search(index, query, { limit: 80 });
    if (!results.length) {
      searchList.innerHTML =
        '<p class="fc-calc__mkb-empty">Ничего не найдено.<br />Попробуйте код (A00) или часть названия.</p>';
      setListMeta('Результаты поиска', '0');
      updateListCrumbs(null);
      return;
    }
    var html = '<ul class="fc-calc__mkb-list">';
    results.forEach(function (item) {
      var active = selectedId === item.id;
      html +=
        '<li class="fc-calc__mkb-item">' +
        '<button type="button" class="fc-calc__mkb-row fc-calc__mkb-row--search' +
        (active ? ' fc-calc__mkb-row--active' : '') +
        '" data-select="' +
        item.id +
        '">' +
        '<span class="fc-calc__mkb-toggle-spacer" aria-hidden="true"></span>' +
        '<span class="fc-calc__mkb-select">' +
        '<span class="fc-calc__mkb-code">' +
        esc(item.code || '—') +
        '</span>' +
        '<span class="fc-calc__mkb-name">' +
        esc(displayName(item)) +
        '</span>' +
        '</span>' +
        '</button>' +
        '</li>';
    });
    html += '</ul>';
    searchList.innerHTML = html;
    setListMeta('Результаты поиска', results.length + (results.length >= 80 ? '+' : ''));
    updateListCrumbs(null);
  }

  function getBrowseList() {
    return browseEl && browseEl.querySelector('.fc-calc__mkb-list');
  }

  function getRowAnchor(list, id) {
    if (!list || id == null) return null;
    var li = list.querySelector('li.fc-calc__mkb-item[data-id="' + id + '"]');
    if (!li) return null;
    return li.querySelector(':scope > .fc-calc__mkb-row') || li.firstElementChild;
  }

  /** Перерисовка дерева с сохранением позиции раскрытой строки в списке */
  function renderTreeKeepScroll(anchorId) {
    var list = getBrowseList();
    var scrollTop = list ? list.scrollTop : 0;
    var listTop = list ? list.getBoundingClientRect().top : 0;
    var anchor = getRowAnchor(list, anchorId);
    var anchorOffset = anchor ? anchor.getBoundingClientRect().top - listTop : null;

    renderTree();

    list = getBrowseList();
    if (!list) return;
    if (anchorOffset != null) {
      var next = getRowAnchor(list, anchorId);
      if (next) {
        list.scrollTop = 0;
        var nextOffset = next.getBoundingClientRect().top - list.getBoundingClientRect().top;
        list.scrollTop = Math.max(0, nextOffset - anchorOffset);
        return;
      }
    }
    list.scrollTop = scrollTop;
  }

  /** Оставляем открытой только ветку до id (остальные «вкладки» закрываются) */
  function ensureExpandedTo(id, alsoExpandSelf) {
    var path = getPath(index, id);
    var next = Object.create(null);
    for (var i = 0; i < path.length - 1; i++) {
      next[path[i].id] = true;
    }
    if (alsoExpandSelf && hasChildren(index, id)) {
      next[id] = true;
    }
    expanded = next;
  }

  function collapseSiblings(id) {
    var item = getItem(index, id);
    if (!item) return;
    var siblings = getChildren(index, item.parentId);
    siblings.forEach(function (sib) {
      if (sib.id === id) return;
      delete expanded[sib.id];
      // закрываем и всё внутри соседней ветки
      Object.keys(expanded).forEach(function (key) {
        var kid = getItem(index, Number(key));
        if (!kid) return;
        var p = getPath(index, kid.id);
        if (p.some(function (node) { return node.id === sib.id; })) {
          delete expanded[key];
        }
      });
    });
  }

  function showCard(id, opts) {
    opts = opts || {};
    var item = getItem(index, id);
    if (!item || !cardBody) return;
    selectedId = item.id;

    if (placeholderEl) placeholderEl.hidden = true;
    cardBody.hidden = false;

    if (cardLevel) cardLevel.textContent = levelLabel(item);
    cardCode.textContent = item.code || '—';
    cardName.textContent = displayName(item);

    var path = getPath(index, item.id);
    var crumbHtml = buildCrumbsHtml(path, { withHome: false });
    if (cardCrumbs) cardCrumbs.innerHTML = crumbHtml;
    updateListCrumbs(item.id);

    if (item.info) {
      if (cardInfoLabel) cardInfoLabel.hidden = false;
      cardInfo.hidden = false;
      cardInfo.textContent = item.info;
    } else {
      if (cardInfoLabel) cardInfoLabel.hidden = true;
      cardInfo.hidden = true;
      cardInfo.textContent = '';
    }

    var kids = getChildren(index, item.id);
    if (kids.length) {
      cardKidsWrap.hidden = false;
      if (cardKidsTitle) {
        cardKidsTitle.textContent =
          levelLabel(item) === 'Рубрика' || levelLabel(item) === 'Блок'
            ? 'Внутри (' + kids.length + ')'
            : 'Дочерние коды (' + kids.length + ')';
      }
      var html = '';
      kids.forEach(function (k) {
        html +=
          '<li><button type="button" data-select="' +
          k.id +
          '"><span class="fc-calc__mkb-code">' +
          esc(k.code || '—') +
          '</span><span class="fc-calc__mkb-name">' +
          esc(displayName(k)) +
          '</span></button></li>';
      });
      cardKids.innerHTML = html;
    } else {
      cardKidsWrap.hidden = true;
      cardKids.innerHTML = '';
    }

    if (showInTreeBtn) showInTreeBtn.hidden = !inSearchMode;

    if (inSearchMode) {
      renderSearch((searchInput && searchInput.value) || '');
    } else {
      ensureExpandedTo(item.id, kids.length > 0 && opts.expand !== false);
      renderTreeKeepScroll(item.id);
    }
  }

  function scrollActiveIntoView() {
    var list = getBrowseList();
    var active = list && list.querySelector('.fc-calc__mkb-row--active');
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  function setMode(query) {
    var q = String(query || '').trim();
    inSearchMode = Boolean(q);
    updateClearBtn();
    if (q) {
      browseEl.hidden = true;
      searchPanel.hidden = false;
      renderSearch(q);
    } else {
      searchPanel.hidden = true;
      browseEl.hidden = false;
      renderTree();
      updateListCrumbs(selectedId);
    }
    if (showInTreeBtn) showInTreeBtn.hidden = !(inSearchMode && selectedId);
  }

  function clearSearch() {
    if (!searchInput) return;
    searchInput.value = '';
    setMode('');
    searchInput.focus();
  }

  function showSelectedInTree() {
    if (!selectedId) return;
    if (searchInput) searchInput.value = '';
    inSearchMode = false;
    updateClearBtn();
    searchPanel.hidden = true;
    browseEl.hidden = false;
    showCard(selectedId, { expand: true });
  }

  function onRootClick(e) {
    var home = e.target.closest('[data-mkb-home]');
    if (home && root.contains(home)) {
      resetToRoot();
      return;
    }
    var toggle = e.target.closest('[data-toggle]');
    if (toggle && root.contains(toggle)) {
      var tid = Number(toggle.getAttribute('data-toggle'));
      // Пустые (без детей) не раскрываем
      if (!hasChildren(index, tid)) return;
      if (expanded[tid]) {
        delete expanded[tid];
        // закрываем потомков
        Object.keys(expanded).forEach(function (key) {
          var kid = getItem(index, Number(key));
          if (!kid) return;
          var p = getPath(index, kid.id);
          if (p.some(function (node) { return node.id === tid; })) {
            delete expanded[key];
          }
        });
      } else {
        collapseSiblings(tid);
        expanded[tid] = true;
      }
      renderTreeKeepScroll(tid);
      updateListCrumbs(selectedId);
      return;
    }
    var select = e.target.closest('[data-select]');
    if (select && root.contains(select)) {
      var sid = Number(select.getAttribute('data-select'));
      if (!Number.isFinite(sid)) return;
      // Повторный клик по той же строке в дереве — свернуть
      var inBrowse = browseEl && !browseEl.hidden && browseEl.contains(select);
      if (
        inBrowse &&
        !inSearchMode &&
        selectedId === sid &&
        hasChildren(index, sid) &&
        expanded[sid]
      ) {
        delete expanded[sid];
        Object.keys(expanded).forEach(function (key) {
          var kid = getItem(index, Number(key));
          if (!kid) return;
          var p = getPath(index, kid.id);
          if (p.some(function (node) {
            return node.id === sid;
          })) {
            delete expanded[key];
          }
        });
        renderTreeKeepScroll(sid);
        updateListCrumbs(selectedId);
        return;
      }
      showCard(sid);
    }
  }

  root.addEventListener('click', onRootClick);

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      clearSearch();
    });
  }

  if (showInTreeBtn) {
    showInTreeBtn.addEventListener('click', function () {
      showSelectedInTree();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        setMode(searchInput.value);
      }, 200);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        clearSearch();
      }
    });
  }

  if (searchInput) searchInput.disabled = true;
  if (placeholderEl) placeholderEl.hidden = false;
  if (cardBody) cardBody.hidden = true;

  gunzipB64(DATA_B64)
    .then(function (payload) {
      if (!payload || !Array.isArray(payload.items)) {
        throw new Error('Некорректные данные справочника');
      }
      index = createIndex(payload.items);
      if (searchInput) {
        searchInput.disabled = false;
        searchInput.focus();
      }
      setMode('');
    })
    .catch(function (err) {
      if (browseEl) {
        browseEl.innerHTML =
          '<p class="fc-calc__mkb-empty">Не удалось загрузить справочник. Откройте страницу в актуальном Chrome, Edge, Firefox или Safari.</p>';
      }
      console.error(err);
    });
})();
