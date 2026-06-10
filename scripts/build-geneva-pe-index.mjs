#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA } from '../calculators/geneva-pe/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'geneva-pe', 'extra.css'), 'utf8'),
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

function renderRows() {
  return CRITERIA.map((criterion) => {
    const options = criterion.options
      .map(
        (opt) => `                  <label class="fc-calc__geneva-option">
                    <input type="radio" name="${criterion.id}" value="${opt.value}" data-points="${opt.points}" />
                    <span class="fc-calc__geneva-option-label">${opt.label}</span>
                    <span class="fc-calc__geneva-option-points">${pointsLabel(opt.points)}</span>
                  </label>`
      )
      .join('\n');

    return `              <div class="fc-calc__geneva-row" role="group" aria-label="${criterion.label}">
                <p class="fc-calc__geneva-label">${criterion.label}</p>
                <div class="fc-calc__geneva-options">
${options}
                </div>
              </div>`;
  }).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Женевская шкала (индекс Geneva) оценки вероятности развития ТЭЛА
-->
<div class="fc-calc" data-calculator="geneva-pe">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Женевская шкала (индекс Geneva)</h2>
        <p class="fc-calc__hint">Оценка клинической вероятности тромбоэмболии лёгочной артерии</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-geneva-pe-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Критерии</h3>
              <div class="fc-calc__geneva-rows">
${renderRows()}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-geneva-pe-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-geneva-pe-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-geneva-pe-result" aria-live="polite">
        <p class="fc-calc__result-label">Всего баллов</p>
        <p class="fc-calc__result-number" id="fc-calc-geneva-pe-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-geneva-pe-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Интерпретация результатов:</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Показатель</th>
                <th>Клиническая вероятность</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0–3 балла</td>
                <td>Низкая клиническая вероятность</td>
              </tr>
              <tr>
                <td>4–10 баллов</td>
                <td>Промежуточная клиническая вероятность</td>
              </tr>
              <tr>
                <td>≥ 11 баллов</td>
                <td>Высокая клиническая вероятность</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Для оценки риска ТЭЛА также используют <a href="https://farmconsilium.com/calculator/wells-pe" target="_blank" rel="noopener noreferrer">шкалу Уэллса</a> и шкалу PESI.</p>
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
${(await readFile(join(root, 'calculators', 'geneva-pe', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'geneva-pe', 'index.html'), html, 'utf8');
console.log('Built calculators/geneva-pe/index.html');
