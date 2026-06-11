    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="mental-status-scales"]');
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

      function scoreFabFluency(wordCount) {
        var n = Number(wordCount);
        if (!isFinite(n) || n < 0) return null;
        if (n > 9) return 3;
        if (n >= 7) return 2;
        if (n >= 4) return 1;
        return 0;
      }

      function getMmseInterpretations(total) {
        return {
          simple: total < 24
            ? { text: 'Патология', details: 'Наличие когнитивных нарушений' }
            : { text: 'Норма', details: 'Когнитивные нарушения не выявлены' },
          rank: total < 21
            ? {
              text: 'Повышенные шансы деменции',
              details: 'Высокая вероятность деменции, требуется углубленное обследование'
            }
            : total > 25
              ? { text: 'Пониженные шансы деменции', details: 'Низкая вероятность деменции' }
              : {
                text: 'Пограничное состояние',
                details: 'Неопределённый результат, требуется наблюдение'
              },
          education: {
            school: total < 21 ? 'Патология (балл < 21)' : 'Норма (балл ≥ 21)',
            college: total < 23 ? 'Патология (балл < 23)' : 'Норма (балл ≥ 23)',
            university: total < 24 ? 'Патология (балл < 24)' : 'Норма (балл ≥ 24)'
          },
          severity: total <= 17
            ? {
              text: 'Выраженные когнитивные нарушения',
              details: 'Тяжёлые нарушения когнитивных функций'
            }
            : total >= 18 && total <= 23
              ? {
                text: 'Лёгкие когнитивные нарушения',
                details: 'Умеренные нарушения когнитивных функций'
              }
              : { text: 'Нет когнитивных нарушений', details: 'Когнитивные функции в норме' },
          alzheimers: total >= 25 && total <= 30
            ? {
              text: 'Продромальная стадия',
              details: 'Преддементная стадия, могут быть субъективные жалобы'
            }
            : total >= 21 && total <= 24
              ? { text: 'Лёгкая деменция', details: 'Ранняя стадия деменции' }
              : total >= 10 && total <= 20
                ? {
                  text: 'Умеренно-выраженная деменция',
                  details: 'Средняя стадия деменции'
                }
                : { text: 'Выраженная деменция', details: 'Поздняя стадия деменции' }
        };
      }

      function getMmseCategory(total) {
        if (total <= 17) return 'severe';
        if (total <= 23) return 'moderate';
        return 'normal';
      }

      function interpretFabResult(total) {
        if (total <= 12) {
          return {
            category: 'severe',
            title: '⚠️ Подозрение на лобную дисфункцию',
            details: 'Требуется углубленное нейропсихологическое обследование'
          };
        }
        if (total <= 15) {
          return {
            category: 'moderate',
            title: '⚠️ Сомнительные результаты / Пограничное состояние',
            details: ''
          };
        }
        return {
          category: 'normal',
          title: '✅ Норма когнитивных функций (лобных долей)',
          details: ''
        };
      }

      function getRadioScore(form, name) {
        var checked = form.querySelector('input[name="' + name + '"]:checked');
        return checked ? Number(checked.getAttribute('data-score') || 0) : null;
      }

      function getRadioLabel(form, name) {
        var checked = form.querySelector('input[name="' + name + '"]:checked');
        if (!checked) return '';
        var label = checked.closest('.fc-calc__dep-option');
        var textEl = label ? label.querySelector('.fc-calc__dep-option-text') : null;
        return textEl ? textEl.textContent.trim() : '';
      }

      function setFabChoice(el, text) {
        if (!el) return;
        el.textContent = text || '';
        el.hidden = !text;
      }

      (function initMmseForm() {
        var form = root.querySelector('#fc-calc-mental-status-scales-mmse-form');
        var calcBtn = root.querySelector('#fc-calc-mental-status-scales-mmse-btn');
        var resultWrap = root.querySelector('#fc-calc-mental-status-scales-mmse-result');
        var resultTotal = root.querySelector('#fc-calc-mental-status-scales-mmse-result-total');
        var simpleText = root.querySelector('#fc-calc-mental-status-scales-mmse-simple-text');
        var simpleDetails = root.querySelector('#fc-calc-mental-status-scales-mmse-simple-details');
        var rankText = root.querySelector('#fc-calc-mental-status-scales-mmse-rank-text');
        var rankDetails = root.querySelector('#fc-calc-mental-status-scales-mmse-rank-details');
        var eduSchool = root.querySelector('#fc-calc-mental-status-scales-mmse-edu-school');
        var eduCollege = root.querySelector('#fc-calc-mental-status-scales-mmse-edu-college');
        var eduUniversity = root.querySelector('#fc-calc-mental-status-scales-mmse-edu-university');
        var severityText = root.querySelector('#fc-calc-mental-status-scales-mmse-severity-text');
        var severityDetails = root.querySelector('#fc-calc-mental-status-scales-mmse-severity-details');
        var alzheimersText = root.querySelector('#fc-calc-mental-status-scales-mmse-alzheimers-text');
        var alzheimersDetails = root.querySelector('#fc-calc-mental-status-scales-mmse-alzheimers-details');

        if (!form || !calcBtn || !resultWrap) return;

        function hideResult() {
          resultWrap.classList.add('fc-calc__result-wrap--hidden');
        }

        function calculate() {
          var total = 0;
          form.querySelectorAll('input[type="checkbox"]').forEach(function (el) {
            if (el.checked) total += 1;
          });
          return { total: total, interp: getMmseInterpretations(total) };
        }

        function showResult(out) {
          var category = getMmseCategory(out.total);
          if (resultTotal) {
            resultTotal.textContent = String(out.total);
            resultTotal.className = 'fc-calc__mss-score-value fc-calc__mss-score-value--' + category;
          }
          if (simpleText) simpleText.textContent = out.interp.simple.text;
          if (simpleDetails) simpleDetails.textContent = out.interp.simple.details;
          if (rankText) rankText.textContent = out.interp.rank.text;
          if (rankDetails) rankDetails.textContent = out.interp.rank.details;
          if (eduSchool) eduSchool.textContent = out.interp.education.school;
          if (eduCollege) eduCollege.textContent = out.interp.education.college;
          if (eduUniversity) eduUniversity.textContent = out.interp.education.university;
          if (severityText) severityText.textContent = out.interp.severity.text;
          if (severityDetails) severityDetails.textContent = out.interp.severity.details;
          if (alzheimersText) alzheimersText.textContent = out.interp.alzheimers.text;
          if (alzheimersDetails) alzheimersDetails.textContent = out.interp.alzheimers.details;
          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        }

        form.addEventListener('change', hideResult);

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          showResult(calculate());
        });

        calcBtn.disabled = false;
        calcBtn.classList.remove('fc-calc__btn--inactive');
      })();

      (function initFabForm() {
        var form = root.querySelector('#fc-calc-mental-status-scales-fab-form');
        var calcBtn = root.querySelector('#fc-calc-mental-status-scales-fab-btn');
        var resultWrap = root.querySelector('#fc-calc-mental-status-scales-fab-result');
        var conceptScore = root.querySelector('#fc-calc-mental-status-scales-fab-concept-score');
        var conceptChoice = root.querySelector('#fc-calc-mental-status-scales-fab-concept-choice');
        var fluencyScore = root.querySelector('#fc-calc-mental-status-scales-fab-fluency-score');
        var fluencyWords = root.querySelector('#fc-calc-mental-status-scales-fab-fluency-words');
        var praxisScore = root.querySelector('#fc-calc-mental-status-scales-fab-praxis-score');
        var praxisChoice = root.querySelector('#fc-calc-mental-status-scales-fab-praxis-choice');
        var simpleScore = root.querySelector('#fc-calc-mental-status-scales-fab-simple-score');
        var simpleChoice = root.querySelector('#fc-calc-mental-status-scales-fab-simple-choice');
        var complexScore = root.querySelector('#fc-calc-mental-status-scales-fab-complex-score');
        var complexChoice = root.querySelector('#fc-calc-mental-status-scales-fab-complex-choice');
        var reflexScore = root.querySelector('#fc-calc-mental-status-scales-fab-reflex-score');
        var reflexChoice = root.querySelector('#fc-calc-mental-status-scales-fab-reflex-choice');
        var totalEl = root.querySelector('#fc-calc-mental-status-scales-fab-total');
        var summaryTitle = root.querySelector('#fc-calc-mental-status-scales-fab-summary-title');
        var summaryDetails = root.querySelector('#fc-calc-mental-status-scales-fab-summary-details');
        var fluencyInput = root.querySelector('#fc-calc-mental-status-scales-fab2-words');

        if (!form || !calcBtn || !resultWrap) return;

        var radioIds = ['fab1', 'fab3', 'fab4', 'fab5', 'fab6'];

        function hideResult() {
          resultWrap.classList.add('fc-calc__result-wrap--hidden');
        }

        function isComplete() {
          var ok = radioIds.every(function (id) {
            return form.querySelector('input[name="' + id + '"]:checked');
          });
          if (!fluencyInput || fluencyInput.value === '') return false;
          var n = Number(fluencyInput.value);
          return ok && isFinite(n) && n >= 0;
        }

        function updateButton() {
          var ok = isComplete();
          calcBtn.disabled = !ok;
          calcBtn.classList.toggle('fc-calc__btn--inactive', !ok);
        }

        function calculate() {
          var concept = getRadioScore(form, 'fab1');
          var praxis = getRadioScore(form, 'fab3');
          var simple = getRadioScore(form, 'fab4');
          var complex = getRadioScore(form, 'fab5');
          var reflex = getRadioScore(form, 'fab6');
          var words = Number(fluencyInput.value);
          var fluency = scoreFabFluency(words);
          var total = concept + fluency + praxis + simple + complex + reflex;

          return {
            total: total,
            breakdown: {
              concept: concept,
              conceptLabel: getRadioLabel(form, 'fab1'),
              fluency: fluency,
              fluencyWords: words,
              praxis: praxis,
              praxisLabel: getRadioLabel(form, 'fab3'),
              simple: simple,
              simpleLabel: getRadioLabel(form, 'fab4'),
              complex: complex,
              complexLabel: getRadioLabel(form, 'fab5'),
              reflex: reflex,
              reflexLabel: getRadioLabel(form, 'fab6')
            },
            summary: interpretFabResult(total)
          };
        }

        function showResult(out) {
          if (conceptScore) conceptScore.textContent = String(out.breakdown.concept);
          setFabChoice(conceptChoice, out.breakdown.conceptLabel);
          if (fluencyScore) fluencyScore.textContent = String(out.breakdown.fluency);
          if (fluencyWords) fluencyWords.textContent = String(out.breakdown.fluencyWords);
          if (praxisScore) praxisScore.textContent = String(out.breakdown.praxis);
          setFabChoice(praxisChoice, out.breakdown.praxisLabel);
          if (simpleScore) simpleScore.textContent = String(out.breakdown.simple);
          setFabChoice(simpleChoice, out.breakdown.simpleLabel);
          if (complexScore) complexScore.textContent = String(out.breakdown.complex);
          setFabChoice(complexChoice, out.breakdown.complexLabel);
          if (reflexScore) reflexScore.textContent = String(out.breakdown.reflex);
          setFabChoice(reflexChoice, out.breakdown.reflexLabel);
          if (totalEl) {
            totalEl.textContent = String(out.total);
            totalEl.className = 'fc-calc__fab-total-value fc-calc__fab-total-value--' + out.summary.category;
          }
          if (summaryTitle) {
            summaryTitle.textContent = out.summary.title;
            summaryTitle.className = 'fc-calc__fab-summary fc-calc__fab-summary--' + out.summary.category;
          }
          if (summaryDetails) {
            summaryDetails.textContent = out.summary.details;
            summaryDetails.hidden = !out.summary.details;
          }
          resultWrap.classList.remove('fc-calc__result-wrap--hidden');
        }

        form.addEventListener('change', function () {
          hideResult();
          updateButton();
        });

        if (fluencyInput) {
          fluencyInput.addEventListener('input', function () {
            hideResult();
            updateButton();
          });
        }

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!isComplete()) return;
          showResult(calculate());
        });

        updateButton();
      })();
    })();
