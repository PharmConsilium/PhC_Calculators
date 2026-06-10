    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="depression-scales"]');
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

      function initScaleForm(config) {
        var form = root.querySelector(config.formId);
        var calcBtn = root.querySelector(config.btnId);
        var resultWrap = root.querySelector(config.resultId);
        var resultNumber = root.querySelector(config.numberId);
        var resultDesc = root.querySelector(config.descId);
        var supplementaryEl = config.supplementaryId
          ? root.querySelector(config.supplementaryId)
          : null;
        var supplementaryScoreEl = config.supplementaryScoreId
          ? root.querySelector(config.supplementaryScoreId)
          : null;

        if (!form || !calcBtn || !resultWrap) return;

        function hideResult() {
          resultWrap.classList.add('fc-calc__result-wrap--hidden');
        }

        function getScores(requiredIds, optionalIds) {
          var scores = {};
          var complete = true;

          requiredIds.forEach(function (id) {
            var checked = form.querySelector('input[name="' + id + '"]:checked');
            if (!checked) {
              complete = false;
              return;
            }
            scores[id] = Number(checked.getAttribute('data-score') ?? checked.value);
          });

          if (optionalIds) {
            optionalIds.forEach(function (id) {
              var checked = form.querySelector('input[name="' + id + '"]:checked');
              if (checked) {
                scores[id] = Number(checked.getAttribute('data-score') ?? checked.value);
              }
            });
          }

          return { scores: scores, complete: complete };
        }

        function updateButton() {
          var ok = getScores(config.requiredIds, config.optionalIds).complete;
          calcBtn.disabled = !ok;
          calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
        }

        form.addEventListener('change', function () {
          hideResult();
          updateButton();
        });

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var parsed = getScores(config.requiredIds, config.optionalIds);
          if (!parsed.complete) return;

          var out = config.compute(parsed.scores);
          resultNumber.textContent = String(out.total);
          resultNumber.className = 'fc-calc__result-number fc-calc__result-number--' + out.category;
          resultDesc.textContent = out.text;

          if (supplementaryEl) {
            var hasSupplementary = config.optionalIds.some(function (id) {
              return parsed.scores[id] != null;
            });
            if (hasSupplementary) {
              if (supplementaryScoreEl) {
                supplementaryScoreEl.textContent = formatScoreLabel(out.supplementaryTotal);
              }
              supplementaryEl.hidden = false;
            } else {
              supplementaryEl.hidden = true;
              if (supplementaryScoreEl) supplementaryScoreEl.textContent = '';
            }
          }

          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        });

        updateButton();
      }

      function formatScoreLabel(n) {
        var mod10 = n % 10;
        var mod100 = n % 100;
        var word = 'баллов';
        if (mod100 >= 11 && mod100 <= 14) word = 'баллов';
        else if (mod10 === 1) word = 'балл';
        else if (mod10 >= 2 && mod10 <= 4) word = 'балла';
        return String(n) + ' ' + word;
      }

      initScaleForm({
        formId: '#fc-calc-depression-scales-beck-form',
        btnId: '#fc-calc-depression-scales-beck-btn',
        resultId: '#fc-calc-depression-scales-beck-result',
        numberId: '#fc-calc-depression-scales-beck-result-number',
        descId: '#fc-calc-depression-scales-beck-result-desc',
        requiredIds: [
          'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10',
          'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20', 'q21'
        ],
        compute: function (scores) {
          var total = 0;
          for (var key in scores) {
            if (Object.prototype.hasOwnProperty.call(scores, key)) total += scores[key];
          }
          if (total < 10) return { total: total, category: 'none', text: 'Отсутствие депрессивных симптомов' };
          if (total <= 15) return { total: total, category: 'mild', text: 'Легкая депрессия (субдепрессия)' };
          if (total <= 19) return { total: total, category: 'moderate', text: 'Умеренная депрессия' };
          if (total <= 29) return { total: total, category: 'marked', text: 'Выраженная депрессия (средней тяжести)' };
          return { total: total, category: 'severe', text: 'Тяжелая депрессия' };
        }
      });

      initScaleForm({
        formId: '#fc-calc-depression-scales-hamilton-form',
        btnId: '#fc-calc-depression-scales-hamilton-btn',
        resultId: '#fc-calc-depression-scales-hamilton-result',
        numberId: '#fc-calc-depression-scales-hamilton-result-number',
        descId: '#fc-calc-depression-scales-hamilton-result-desc',
        supplementaryId: '#fc-calc-depression-scales-hamilton-supplementary',
        supplementaryScoreId: '#fc-calc-depression-scales-hamilton-supplementary-score',
        requiredIds: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10',
          'h11', 'h12', 'h13', 'h14', 'h15', 'h16', 'h17'
        ],
        optionalIds: ['hs1a', 'hs1b', 'hs2', 'hs3', 'hs4'],
        compute: function (scores) {
          var coreIds = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10',
            'h11', 'h12', 'h13', 'h14', 'h15', 'h16', 'h17'
          ];
          var suppIds = ['hs1a', 'hs1b', 'hs2', 'hs3', 'hs4'];
          var total = 0;
          var supplementaryTotal = 0;
          coreIds.forEach(function (id) { total += scores[id] || 0; });
          suppIds.forEach(function (id) {
            if (scores[id] != null) supplementaryTotal += scores[id];
          });
          if (total <= 7) return { total: total, supplementaryTotal: supplementaryTotal, category: 'normal', text: 'Норма' };
          if (total <= 13) return { total: total, supplementaryTotal: supplementaryTotal, category: 'mild', text: 'Легкое депрессивное расстройство' };
          if (total <= 18) return { total: total, supplementaryTotal: supplementaryTotal, category: 'moderate', text: 'Депрессивное расстройство средней степени тяжести' };
          if (total <= 22) return { total: total, supplementaryTotal: supplementaryTotal, category: 'severe', text: 'Депрессивное расстройство тяжелой степени' };
          return { total: total, supplementaryTotal: supplementaryTotal, category: 'extreme', text: 'Депрессивное расстройство крайне тяжелой степени' };
        }
      });

      initScaleForm({
        formId: '#fc-calc-depression-scales-phq-form',
        btnId: '#fc-calc-depression-scales-phq-btn',
        resultId: '#fc-calc-depression-scales-phq-result',
        numberId: '#fc-calc-depression-scales-phq-result-number',
        descId: '#fc-calc-depression-scales-phq-result-desc',
        requiredIds: ['pq1', 'pq2', 'pq3', 'pq4', 'pq5', 'pq6', 'pq7', 'pq8'],
        compute: function (scores) {
          var total = 0;
          for (var key in scores) {
            if (Object.prototype.hasOwnProperty.call(scores, key)) total += scores[key];
          }
          if (total < 5) return { total: total, category: 'minimal', text: 'Минимальная депрессия' };
          if (total <= 9) return { total: total, category: 'mild', text: 'Легкая депрессия' };
          if (total <= 14) return { total: total, category: 'moderate', text: 'Умеренная депрессия' };
          if (total <= 19) return { total: total, category: 'severe', text: 'Тяжелая депрессия' };
          return { total: total, category: 'extreme', text: 'Крайне тяжелая депрессия' };
        }
      });

      initScaleForm({
        formId: '#fc-calc-depression-scales-epds-form',
        btnId: '#fc-calc-depression-scales-epds-btn',
        resultId: '#fc-calc-depression-scales-epds-result',
        numberId: '#fc-calc-depression-scales-epds-result-number',
        descId: '#fc-calc-depression-scales-epds-result-desc',
        requiredIds: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'e10'],
        compute: function (scores) {
          var total = 0;
          for (var key in scores) {
            if (Object.prototype.hasOwnProperty.call(scores, key)) total += scores[key];
          }
          if (total <= 9) return { total: total, category: 'normal', text: 'Нормальное состояние; риск послеродовой депрессии низкий' };
          if (total <= 12) return { total: total, category: 'moderate', text: 'Умеренный риск послеродовой депрессии; рекомендуется наблюдение' };
          return { total: total, category: 'high', text: 'Высокий риск послеродовой депрессии; требуется консультация специалиста' };
        }
      });

      initScaleForm({
        formId: '#fc-calc-depression-scales-gds-form',
        btnId: '#fc-calc-depression-scales-gds-btn',
        resultId: '#fc-calc-depression-scales-gds-result',
        numberId: '#fc-calc-depression-scales-gds-result-number',
        descId: '#fc-calc-depression-scales-gds-result-desc',
        requiredIds: [
          'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10',
          'g11', 'g12', 'g13', 'g14', 'g15'
        ],
        compute: function (scores) {
          var total = 0;
          for (var key in scores) {
            if (Object.prototype.hasOwnProperty.call(scores, key)) total += scores[key];
          }
          if (total < 6) return { total: total, category: 'normal', text: 'Нет признаков депрессии' };
          return { total: total, category: 'depression', text: 'Обнаруживаются признаки депрессии' };
        }
      });

      (function initHadsForm() {
        var form = root.querySelector('#fc-calc-depression-scales-hads-form');
        var calcBtn = root.querySelector('#fc-calc-depression-scales-hads-btn');
        var resultWrap = root.querySelector('#fc-calc-depression-scales-hads-result');
        var anxietyBlock = root.querySelector('#fc-calc-depression-scales-hads-anxiety-block');
        var depressionBlock = root.querySelector('#fc-calc-depression-scales-hads-depression-block');
        var anxietyNumber = root.querySelector('#fc-calc-depression-scales-hads-anxiety-number');
        var anxietyDesc = root.querySelector('#fc-calc-depression-scales-hads-anxiety-desc');
        var depressionNumber = root.querySelector('#fc-calc-depression-scales-hads-depression-number');
        var depressionDesc = root.querySelector('#fc-calc-depression-scales-hads-depression-desc');

        if (!form || !calcBtn || !resultWrap) return;

        var anxietyIds = ['ha1', 'ha2', 'ha3', 'ha4', 'ha5', 'ha6', 'ha7'];
        var depressionIds = ['hd1', 'hd2', 'hd3', 'hd4', 'hd5', 'hd6', 'hd7'];

        function hideResult() {
          resultWrap.classList.add('fc-calc__result-wrap--hidden');
          if (anxietyBlock) anxietyBlock.hidden = true;
          if (depressionBlock) depressionBlock.hidden = true;
        }

        function isSectionComplete(ids) {
          return ids.every(function (id) {
            return form.querySelector('input[name="' + id + '"]:checked');
          });
        }

        function getSectionScores(ids) {
          var scores = {};
          if (!isSectionComplete(ids)) return scores;
          ids.forEach(function (id) {
            var checked = form.querySelector('input[name="' + id + '"]:checked');
            scores[id] = Number(checked.getAttribute('data-score') ?? checked.value);
          });
          return scores;
        }

        function sumIds(scores, ids) {
          var total = 0;
          ids.forEach(function (id) { total += scores[id] || 0; });
          return total;
        }

        function interpretAnxiety(total) {
          if (total < 8) return { category: 'normal', text: 'Норма (отсутствие достоверно выраженных симптомов тревоги)' };
          if (total <= 10) return { category: 'subclinical', text: 'Субклинически выраженная тревога' };
          return { category: 'clinical', text: 'Клинически выраженная тревога' };
        }

        function interpretDepression(total) {
          if (total < 8) return { category: 'normal', text: 'Норма (отсутствие достоверно выраженных симптомов депрессии)' };
          if (total <= 10) return { category: 'subclinical', text: 'Субклинически выраженная депрессия' };
          return { category: 'clinical', text: 'Клинически выраженная депрессия' };
        }

        function updateButton() {
          var ok = isSectionComplete(anxietyIds) || isSectionComplete(depressionIds);
          calcBtn.disabled = !ok;
          calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
        }

        form.addEventListener('change', function () {
          hideResult();
          updateButton();
        });

        form.addEventListener('submit', function (e) {
          e.preventDefault();

          var anxietyComplete = isSectionComplete(anxietyIds);
          var depressionComplete = isSectionComplete(depressionIds);
          if (!anxietyComplete && !depressionComplete) return;

          if (anxietyComplete && anxietyBlock && anxietyNumber && anxietyDesc) {
            var anxietyTotal = sumIds(getSectionScores(anxietyIds), anxietyIds);
            var anxietyInfo = interpretAnxiety(anxietyTotal);
            anxietyNumber.textContent = String(anxietyTotal);
            anxietyNumber.className = 'fc-calc__result-number fc-calc__result-number--' + anxietyInfo.category;
            anxietyDesc.textContent = anxietyInfo.text;
            anxietyBlock.hidden = false;
          } else if (anxietyBlock) {
            anxietyBlock.hidden = true;
          }

          if (depressionComplete && depressionBlock && depressionNumber && depressionDesc) {
            var depressionTotal = sumIds(getSectionScores(depressionIds), depressionIds);
            var depressionInfo = interpretDepression(depressionTotal);
            depressionNumber.textContent = String(depressionTotal);
            depressionNumber.className = 'fc-calc__result-number fc-calc__result-number--' + depressionInfo.category;
            depressionDesc.textContent = depressionInfo.text;
            depressionBlock.hidden = false;
          } else if (depressionBlock) {
            depressionBlock.hidden = true;
          }

          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        });

        updateButton();
      })();

      var hamiltonForm = root.querySelector('#fc-calc-depression-scales-hamilton-form');
      if (hamiltonForm) {
        function syncHamiltonDailyVariation(form) {
          var selectedA = form.querySelector('input[name="hs1a"]:checked');
          var optionsB = form.querySelectorAll('input[name="hs1b"]');
          var groupB = form.querySelector('[data-item-id="hs1b"]');

          if (!selectedA) {
            optionsB.forEach(function (input) {
              input.disabled = false;
              var option = input.closest('.fc-calc__dep-option');
              if (option) option.classList.remove('fc-calc__dep-option--disabled');
            });
            if (groupB) groupB.classList.remove('fc-calc__dep-group--locked');
            return;
          }

          var index = selectedA.value.split('-').pop();
          var scoreA = Number(selectedA.getAttribute('data-score') ?? index);
          var lockB = scoreA === 0;

          if (lockB) {
            var targetB = form.querySelector('input[name="hs1b"][value="hs1b-0"]');
            if (targetB) targetB.checked = true;
          } else {
            optionsB.forEach(function (input) {
              input.checked = false;
            });
          }

          optionsB.forEach(function (input) {
            var option = input.closest('.fc-calc__dep-option');
            var isZero = Number(input.getAttribute('data-score') ?? 0) === 0;
            var disabled = lockB && !isZero;
            input.disabled = disabled;
            if (option) option.classList.toggle('fc-calc__dep-option--disabled', disabled);
          });
          if (groupB) groupB.classList.toggle('fc-calc__dep-group--locked', lockB);
        }

        hamiltonForm.addEventListener('change', function (e) {
          if (!e.target || e.target.name !== 'hs1a') return;
          syncHamiltonDailyVariation(hamiltonForm);
        });
      }
    })();
