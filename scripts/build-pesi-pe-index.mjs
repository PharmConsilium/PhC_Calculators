#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RADIO_CRITERIA } from '../calculators/pesi-pe/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'pesi-pe', 'extra.css'), 'utf8'),
]);

function pointsLabel(points) {
  if (points === 0) return '0 баллов';
  const n = points;
  let word = 'баллов';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) word = 'балл';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = 'балла';
  return `+${n} ${word}`;
}

function renderAgeRow() {
  return `              <div class="fc-calc__pesi-row" role="group" aria-label="Возраст">
                <p class="fc-calc__pesi-label">Возраст</p>
                <div class="fc-calc__pesi-controls">
                  <div class="fc-calc__pesi-age-wrap">
                    <input
                      type="number"
                      id="fc-calc-pesi-pe-age"
                      name="age"
                      class="fc-calc__pesi-age-input"
                      min="0"
                      max="120"
                      step="1"
                      inputmode="numeric"
                      placeholder="Возраст в годах"
                      required
                    />
                    <span class="fc-calc__pesi-age-hint">1 балл за каждый год</span>
                  </div>
                </div>
              </div>`;
}

function renderRadioRows() {
  return RADIO_CRITERIA.map((criterion) => {
    const options = criterion.options
      .map(
        (opt) => `                  <label class="fc-calc__pesi-option">
                    <input type="radio" name="${criterion.id}" value="${opt.value}" data-points="${opt.points}" />
                    <span class="fc-calc__pesi-option-label">${opt.label}</span>
                    <span class="fc-calc__pesi-option-points">${pointsLabel(opt.points)}</span>
                  </label>`
      )
      .join('\n');

    return `              <div class="fc-calc__pesi-row" role="group" aria-label="${criterion.label}">
                <p class="fc-calc__pesi-label">${criterion.label}</p>
                <div class="fc-calc__pesi-controls">
${options}
                </div>
              </div>`;
  }).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала PESI оценки летальности пациентов с ТЭЛА
-->
<div class="fc-calc" data-calculator="pesi-pe">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала PESI</h2>
        <p class="fc-calc__hint">Оценка риска 30-дневной летальности у пациентов с ТЭЛА (Pulmonary Embolism Severity Index)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-pesi-pe-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Критерии</h3>
              <div class="fc-calc__pesi-rows">
${renderAgeRow()}
${renderRadioRows()}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-pesi-pe-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-pesi-pe-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-pesi-pe-result" aria-live="polite">
        <p class="fc-calc__result-label">Всего баллов</p>
        <p class="fc-calc__result-number" id="fc-calc-pesi-pe-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-pesi-pe-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Стратификация риска:</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Показатель</th>
                <th>Класс и риск 30-дневной летальности</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>≤ 65 баллов</td>
                <td>Класс I. Очень низкий риск (0–1,6%)</td>
              </tr>
              <tr>
                <td>66–85 баллов</td>
                <td>Класс II. Низкий риск (1,7–3,5%)</td>
              </tr>
              <tr>
                <td>86–105 баллов</td>
                <td>Класс III. Умеренный риск (3,2–7,1%)</td>
              </tr>
              <tr>
                <td>106–125 баллов</td>
                <td>Класс IV. Высокий риск (4,0–11,4%)</td>
              </tr>
              <tr>
                <td>&gt; 125 баллов</td>
                <td>Класс V. Очень высокий риск (10,0–24,5%)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Для оценки вероятности ТЭЛА также используют <a href="https://farmconsilium.com/calculator/geneva-pe" target="_blank" rel="noopener noreferrer">шкалу Geneva</a> и <a href="https://farmconsilium.com/calculator/wells-pe" target="_blank" rel="noopener noreferrer">шкалу Уэллса</a>.</p>
        <p class="fc-calc__hint">Калькулятор для медицинских специалистов. Не заменяет клиническое решение врача.</p>
      </div>
    </details>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${(await readFile(join(root, 'calculators', 'pesi-pe', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'pesi-pe', 'index.html'), html, 'utf8');
console.log('Built calculators/pesi-pe/index.html');
