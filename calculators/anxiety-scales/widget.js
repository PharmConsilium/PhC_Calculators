    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="anxiety-scales"]');
      if (!root) return;

      var tabs = root.querySelectorAll('.fc-calc__tab[data-scale]');
      var panels = root.querySelectorAll('.fc-calc__tab-panel[data-scale]');

      function switchScale(scaleId) {
        tabs.forEach(function (tab) {
          var active = tab.getAttribute('data-scale') === scaleId;
          tab.classList.toggle('fc-calc__tab--active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.tabIndex = active ? 0 : -1;
        });

        panels.forEach(function (panel) {
          var active = panel.getAttribute('data-scale') === scaleId;
          panel.classList.toggle('fc-calc__tab-panel--active', active);
          panel.hidden = !active;
        });
      }

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          switchScale(tab.getAttribute('data-scale'));
        });

        tab.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          var list = Array.prototype.slice.call(tabs);
          var index = list.indexOf(tab);
          if (index < 0) return;
          var next = e.key === 'ArrowRight' ? index + 1 : index - 1;
          if (next < 0) next = list.length - 1;
          if (next >= list.length) next = 0;
          list[next].focus();
          switchScale(list[next].getAttribute('data-scale'));
        });
      });

      function ids(prefix, count) {
        var list = [];
        for (var i = 1; i <= count; i++) list.push(prefix + i);
        return list;
      }

      function initScaleForm(config) {
        var form = root.querySelector(config.formId);
        var calcBtn = root.querySelector(config.btnId);
        var resultWrap = root.querySelector(config.resultId);
        var resultNumber = root.querySelector(config.numberId);
        var resultDesc = root.querySelector(config.descId);

        if (!form || !calcBtn || !resultWrap) return;

        function hideResult() {
          resultWrap.classList.add('fc-calc__result-wrap--hidden');
        }

        function getScores() {
          var scores = {};
          var complete = true;

          config.requiredIds.forEach(function (id) {
            var checked = form.querySelector('input[name="' + id + '"]:checked');
            if (!checked) {
              complete = false;
              return;
            }
            scores[id] = Number(checked.getAttribute('data-score') ?? checked.value);
          });

          return { scores: scores, complete: complete };
        }

        function updateButton() {
          var ok = getScores().complete;
          calcBtn.disabled = !ok;
          calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
        }

        form.addEventListener('change', function () {
          hideResult();
          updateButton();
        });

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var parsed = getScores();
          if (!parsed.complete) return;

          var out = config.compute(parsed.scores);
          resultNumber.textContent = String(out.total);
          resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + out.category;
          resultDesc.textContent = out.text;
          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        });

        updateButton();
      }

      function sumScores(scores, idList) {
        var total = 0;
        idList.forEach(function (id) { total += scores[id] || 0; });
        return total;
      }

      initScaleForm({
        formId: '#fc-calc-anxiety-scales-gad7-form',
        btnId: '#fc-calc-anxiety-scales-gad7-btn',
        resultId: '#fc-calc-anxiety-scales-gad7-result',
        numberId: '#fc-calc-anxiety-scales-gad7-result-number',
        descId: '#fc-calc-anxiety-scales-gad7-result-desc',
        requiredIds: ids('g', 7),
        compute: function (scores) {
          var total = sumScores(scores, ids('g', 7));
          if (total <= 4) return { total: total, category: 'minimal', text: 'Минимальный уровень тревожности' };
          if (total <= 9) return { total: total, category: 'mild', text: 'Умеренный уровень тревожности' };
          if (total <= 14) return { total: total, category: 'moderate', text: 'Средний уровень тревожности' };
          return { total: total, category: 'severe', text: 'Высокий уровень тревожности' };
        }
      });

      initScaleForm({
        formId: '#fc-calc-anxiety-scales-covy-form',
        btnId: '#fc-calc-anxiety-scales-covy-btn',
        resultId: '#fc-calc-anxiety-scales-covy-result',
        numberId: '#fc-calc-anxiety-scales-covy-result-number',
        descId: '#fc-calc-anxiety-scales-covy-result-desc',
        requiredIds: ids('c', 3),
        compute: function (scores) {
          var total = sumScores(scores, ids('c', 3));
          if (total <= 3) return { total: total, category: 'none', text: 'Отсутствие тревожного состояния' };
          if (total <= 5) return { total: total, category: 'symptoms', text: 'Имеются симптомы тревоги' };
          return { total: total, category: 'state', text: 'Тревожное состояние' };
        }
      });

      initScaleForm({
        formId: '#fc-calc-anxiety-scales-sheehan-form',
        btnId: '#fc-calc-anxiety-scales-sheehan-btn',
        resultId: '#fc-calc-anxiety-scales-sheehan-result',
        numberId: '#fc-calc-anxiety-scales-sheehan-result-number',
        descId: '#fc-calc-anxiety-scales-sheehan-result-desc',
        requiredIds: ids('sh', 35),
        compute: function (scores) {
          var total = sumScores(scores, ids('sh', 35));
          if (total <= 29) return { total: total, category: 'normal', text: 'Отсутствие клинически выраженной тревоги' };
          if (total <= 79) return { total: total, category: 'clinical', text: 'Клинически выраженная тревога' };
          return { total: total, category: 'severe', text: 'Тяжелое тревожное расстройство, паническое расстройство' };
        }
      });

      (function initSpielbergForm() {
        var form = root.querySelector('#fc-calc-anxiety-scales-spielberg-form');
        var calcBtn = root.querySelector('#fc-calc-anxiety-scales-spielberg-btn');
        var resultWrap = root.querySelector('#fc-calc-anxiety-scales-spielberg-result');
        var reactiveBlock = root.querySelector('#fc-calc-anxiety-scales-spielberg-reactive-block');
        var traitBlock = root.querySelector('#fc-calc-anxiety-scales-spielberg-trait-block');
        var reactiveNumber = root.querySelector('#fc-calc-anxiety-scales-spielberg-reactive-number');
        var reactiveDesc = root.querySelector('#fc-calc-anxiety-scales-spielberg-reactive-desc');
        var traitNumber = root.querySelector('#fc-calc-anxiety-scales-spielberg-trait-number');
        var traitDesc = root.querySelector('#fc-calc-anxiety-scales-spielberg-trait-desc');
        var totalBlock = root.querySelector('#fc-calc-anxiety-scales-spielberg-total-block');
        var totalNumber = root.querySelector('#fc-calc-anxiety-scales-spielberg-total-number');

        if (!form || !calcBtn || !resultWrap) return;

        var reactiveIds = ids('sr', 20);
        var traitIds = ids('st', 20);

        function hideResult() {
          resultWrap.classList.add('fc-calc__result-wrap--hidden');
          if (reactiveBlock) reactiveBlock.hidden = true;
          if (traitBlock) traitBlock.hidden = true;
          if (totalBlock) totalBlock.hidden = true;
        }

        function isSectionComplete(idList) {
          return idList.every(function (id) {
            return form.querySelector('input[name="' + id + '"]:checked');
          });
        }

        function getSectionScores(idList) {
          var scores = {};
          if (!isSectionComplete(idList)) return scores;
          idList.forEach(function (id) {
            var checked = form.querySelector('input[name="' + id + '"]:checked');
            scores[id] = Number(checked.getAttribute('data-score') ?? checked.value);
          });
          return scores;
        }

        function interpretSpielberg(total) {
          if (total < 11) {
            return {
              category: 'very-low',
              text: 'Очень низкая тревожность. Можно трактовать состояние как депрессивное, неактивное, с низким уровнем мотиваций'
            };
          }
          if (total <= 30) return { category: 'low', text: 'Низкая тревожность' };
          if (total <= 44) return { category: 'moderate', text: 'Умеренная тревожность' };
          if (total <= 46) return { category: 'high', text: 'Высокая тревожность' };
          return {
            category: 'very-high',
            text: 'Очень высокая тревожность. Может быть связана с наличием невротического конфликта, эмоциональными срывами и с психосоматическими заболеваниями'
          };
        }

        function updateButton() {
          var ok = isSectionComplete(reactiveIds) || isSectionComplete(traitIds);
          calcBtn.disabled = !ok;
          calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
        }

        form.addEventListener('change', function () {
          hideResult();
          updateButton();
        });

        form.addEventListener('submit', function (e) {
          e.preventDefault();

          var reactiveComplete = isSectionComplete(reactiveIds);
          var traitComplete = isSectionComplete(traitIds);
          if (!reactiveComplete && !traitComplete) return;

          if (reactiveComplete && reactiveBlock && reactiveNumber && reactiveDesc) {
            var reactiveTotal = sumScores(getSectionScores(reactiveIds), reactiveIds);
            var reactiveInfo = interpretSpielberg(reactiveTotal);
            reactiveNumber.textContent = String(reactiveTotal);
            reactiveNumber.className = 'fc-calc__result-number fc-calc__result-number--' + reactiveInfo.category;
            reactiveDesc.textContent = reactiveInfo.text;
            reactiveBlock.hidden = false;
          } else if (reactiveBlock) {
            reactiveBlock.hidden = true;
          }

          if (traitComplete && traitBlock && traitNumber && traitDesc) {
            var traitTotal = sumScores(getSectionScores(traitIds), traitIds);
            var traitInfo = interpretSpielberg(traitTotal);
            traitNumber.textContent = String(traitTotal);
            traitNumber.className = 'fc-calc__result-number fc-calc__result-number--' + traitInfo.category;
            traitDesc.textContent = traitInfo.text;
            traitBlock.hidden = false;
          } else if (traitBlock) {
            traitBlock.hidden = true;
          }

          if (reactiveComplete && traitComplete && totalBlock && totalNumber) {
            var reactiveTotalForSum = sumScores(getSectionScores(reactiveIds), reactiveIds);
            var traitTotalForSum = sumScores(getSectionScores(traitIds), traitIds);
            totalNumber.textContent = String(reactiveTotalForSum + traitTotalForSum);
            totalBlock.hidden = false;
          } else if (totalBlock) {
            totalBlock.hidden = true;
          }

          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        });

        updateButton();
      })();
    })();
