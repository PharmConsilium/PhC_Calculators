#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA } from '../calculators/wells-pe/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'wells-pe', 'extra.css'), 'utf8'),
]);

function formatPoints(p) {
  return String(p).replace('.', ',');
}

function pointsLabel(p) {
  if (p === 1) return '1 балл';
  if (p === 1.5) return '1,5 балла';
  return `${formatPoints(p)} балла`;
}

function renderCheckboxes() {
  return CRITERIA.map(
    (c) => `                <label class="fc-calc__wells-option">
                  <input type="checkbox" id="fc-calc-wells-pe-${c.id}" name="${c.id}" value="1" data-points="${c.points}" />
                  <span class="fc-calc__wells-option-text">${c.label}</span>
                  <span class="fc-calc__wells-points">(${pointsLabel(c.points)})</span>
                </label>`
  ).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала Уэллса для оценки вероятности ТЭЛА
-->
<div class="fc-calc" data-calculator="wells-pe">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала Уэллса для оценки вероятности ТЭЛА</h2>
        <p class="fc-calc__hint">Клиническая оценка вероятности тромбоэмболии лёгочной артерии по критериям Уэллса</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-wells-pe-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Критерии</h3>
              <div class="fc-calc__wells-options" role="group" aria-label="Критерии шкалы Уэллса">
${renderCheckboxes()}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-wells-pe-btn" class="fc-calc__btn" form="fc-calc-wells-pe-form">Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-wells-pe-result" aria-live="polite">
        <p class="fc-calc__result-label">Общий результат</p>
        <p class="fc-calc__result-number" id="fc-calc-wells-pe-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-wells-pe-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Интерпретация шкалы риска ТЭЛА:</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Показатель</th>
                <th>Вероятность</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>&gt; 6</td>
                <td>Высокая вероятность</td>
              </tr>
              <tr>
                <td>≥ 2 и ≤ 6</td>
                <td>Умеренная вероятность</td>
              </tr>
              <tr>
                <td>&lt; 2</td>
                <td>Низкая вероятность</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>По данным исходной публикации, низкая вероятность ТЭЛА также соответствует ≤ 4 баллам при отрицательном анализе на D-димер. Подробности — в источнике ниже.</p>
        <p><strong>Ссылки:</strong></p>
        <p class="fc-calc__source-item">Wells PS, Anderson DR, Rodger M, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. <em>Thromb Haemost.</em> 2000 Mar;83(3):416-20. PubMed ID: 10744147</p>
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
${(await readFile(join(root, 'calculators', 'wells-pe', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'wells-pe', 'index.html'), html, 'utf8');
console.log('Built calculators/wells-pe/index.html');
