#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA } from '../calculators/improve-scale/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function formatPoints(points) {
  return '+' + points;
}

function renderCheckboxes() {
  return CRITERIA.map(
    (c) => `                <label class="fc-calc__improve-row" for="fc-calc-improve-scale-${c.id}">
                  <input type="checkbox" id="fc-calc-improve-scale-${c.id}" name="${c.id}" value="1" />
                  <span class="fc-calc__improve-label">${c.label}</span>
                  <span class="fc-calc__improve-points">${formatPoints(c.points)}</span>
                </label>`
  ).join('\n');
}

function renderCriteriaTableRows() {
  return CRITERIA.map(
    (c) => `              <tr>
                <td>${c.number}</td>
                <td>${c.label}</td>
                <td>${c.points}</td>
              </tr>`
  ).join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'improve-scale', 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', 'improve-scale', 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала IMPROVE
-->
<div class="fc-calc" data-calculator="improve-scale">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала IMPROVE</h2>
        <p class="fc-calc__hint">Шкала IMPROVE (International Medical Prevention Registry on Venous Thromboembolism/Международный реестр медицинской профилактики венозной тромбоэмболии, IMPROVE Risk Score) используется для оценки риска тромбоэмболии глубоких вен (ТГВ) и/или тромбоэмболии легочной артерии (ТЭЛА) у нехирургических больных</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-improve-scale-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Шкала IMPROVE</h3>
              <div class="fc-calc__improve-options" role="group" aria-label="Критерии шкалы IMPROVE">
${renderCheckboxes()}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-improve-scale-btn" class="fc-calc__btn" form="fc-calc-improve-scale-form">Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-improve-scale-result" aria-live="polite">
        <p class="fc-calc__result-label">Результат:</p>
        <p class="fc-calc__result-number" id="fc-calc-improve-scale-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-improve-scale-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Шкала состоит из семи показателей, каждому показателю соответствует определённое количество баллов.</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>№</th>
                <th>Показатель</th>
                <th>Баллы</th>
              </tr>
            </thead>
            <tbody>
${renderCriteriaTableRows()}
            </tbody>
          </table>
        </div>
        <p>По сумме набранных баллов производится интерпретация результата:</p>
        <ul>
          <li>умеренный риск развития ТГВ/ТЭЛА при сумме баллов от 2 до 3;</li>
          <li>высокий риск развития ТГВ/ТЭЛА при сумме баллов 4 и более.</li>
        </ul>
${NOTES_DISCLAIMER_HTML}
      </div>
    </details>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${widget.trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'improve-scale', 'index.html'), html, 'utf8');
console.log('Built calculators/improve-scale/index.html');
