    (function () {
      var root = document.querySelector('.fc-calc[data-calculator="aims-scale"]');
      if (!root) return;

      var form = root.querySelector('#fc-calc-aims-scale-form');
      var calcBtn = root.querySelector('#fc-calc-aims-scale-btn');
      var resultWrap = root.querySelector('#fc-calc-aims-scale-result');
      var movementTotalEl = root.querySelector('#fc-calc-aims-scale-movement-total');
      var movementInterpEl = root.querySelector('#fc-calc-aims-scale-movement-interp');
      var additionalWrap = root.querySelector('#fc-calc-aims-scale-additional');

      var itemIds = [
        'facial', 'lips', 'jaw', 'tongue', 'upperLimbs', 'lowerLimbs', 'trunk',
        'severity', 'disability', 'awareness', 'dental', 'dentures'
      ];

      var additionalMeta = {
        severity: { number: 8, label: 'Степень тяжести аномальных движений' },
        disability: { number: 9, label: 'Ограничения дееспособности' },
        awareness: { number: 10, label: 'Осознание пациентом аномальных движений' },
        dental: { number: 11, label: 'Стоматологический статус' },
        dentures: { number: 12, label: 'Ношение зубных протезов' }
      };

      function hideResult() {
        resultWrap.classList.add('fc-calc__result-wrap--hidden');
      }

      function getSelectedValue(id) {
        var checked = form.querySelector('input[name="' + id + '"]:checked');
        return checked ? Number(checked.getAttribute('data-score')) : null;
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

      function interpretMovement(total) {
        if (total <= 6) {
          return {
            category: 'low',
            text: 'Низкий балл: 0–6. Двигательные нарушения отсутствуют или минимальны'
          };
        }
        if (total <= 14) {
          return {
            category: 'moderate',
            text: 'Умеренный балл: 7–14. Умеренные двигательные нарушения'
          };
        }
        return {
          category: 'high',
          text: 'Высокий балл: ≥15. Выраженные двигательные нарушения'
        };
      }

      function getSelectedOptionText(id) {
        var checked = form.querySelector('input[name="' + id + '"]:checked');
        if (!checked) return '';
        var row = checked.closest('.fc-calc__aims-option');
        var textEl = row ? row.querySelector('.fc-calc__aims-option-text') : null;
        return textEl ? textEl.textContent.trim() : '';
      }

      function formatAdditional(id, score) {
        var optionText = getSelectedOptionText(id);
        if (id === 'dental') {
          var dentalBase = score === 1 ? 'Есть проблемы' : 'Нет проблем';
          return dentalBase + ' (' + (score === 1 ? 'да' : 'нет') + ')';
        }
        if (id === 'dentures') {
          return (score === 1 ? 'Да' : 'Нет') + ' (' + (score === 1 ? 'да' : 'нет') + ')';
        }
        if (optionText) return optionText;
        return String(score);
      }

      function calculate() {
        var movementIds = ['facial', 'lips', 'jaw', 'tongue', 'upperLimbs', 'lowerLimbs', 'trunk'];
        var movementTotal = 0;
        movementIds.forEach(function (id) {
          movementTotal += getSelectedValue(id) || 0;
        });

        var additional = {};
        Object.keys(additionalMeta).forEach(function (id) {
          additional[id] = getSelectedValue(id);
        });

        return {
          movementTotal: movementTotal,
          movementInfo: interpretMovement(movementTotal),
          additional: additional
        };
      }

      function showResult(out) {
        if (movementTotalEl) {
          movementTotalEl.textContent = String(out.movementTotal);
          movementTotalEl.className = 'fc-calc__aims-movement-value fc-calc__aims-movement-value--' + out.movementInfo.category;
        }
        if (movementInterpEl) {
          movementInterpEl.textContent = out.movementInfo.text;
          movementInterpEl.className = 'fc-calc__aims-movement-interp fc-calc__aims-movement-interp--' + out.movementInfo.category;
        }
        if (additionalWrap) {
          additionalWrap.innerHTML = Object.keys(additionalMeta).map(function (id) {
            var meta = additionalMeta[id];
            var value = formatAdditional(id, out.additional[id]);
            return '<li><span class="fc-calc__aims-additional-label">' + meta.number + '. ' + meta.label + ':</span> <strong>' + value + '</strong></li>';
          }).join('');
        }
        resultWrap.classList.remove('fc-calc__result-wrap--hidden');
      }

      form.addEventListener('change', function () {
        hideResult();
        updateButton();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!isComplete()) return;
        showResult(calculate());
      });

      updateButton();
    })();
