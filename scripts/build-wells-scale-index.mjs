#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CRITERIA,
  THREE_LEVEL_ROWS,
  TWO_LEVEL_ROWS,
} from '../calculators/wells-scale/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function formatPoints(value) {
  return '+' + String(value).replace('.', ',');
}

function renderCheckboxes() {
  return CRITERIA.map(
    (c) => `                <label class="fc-calc__wells-row" for="fc-calc-wells-scale-${c.id}">
                  <input type="checkbox" id="fc-calc-wells-scale-${c.id}" name="${c.id}" value="1" />
                  <span class="fc-calc__wells-label">${c.label}</span>
                  <span class="fc-calc__wells-points">${formatPoints(c.points)}</span>
                </label>`
  ).join('\n');
}

function renderCriteriaRows() {
  return CRITERIA.map(
    (c) => `              <tr>
                <td>${c.label}</td>
                <td>${String(c.points).replace('.', ',')}</td>
              </tr>`
  ).join('\n');
}

function renderInterpRows(rows) {
  return rows
    .map((row) => `              <tr><td>${row.label}</td><td>${row.range}</td></tr>`)
    .join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'wells-scale', 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', 'wells-scale', 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала Веллса
-->
<div class="fc-calc" data-calculator="wells-scale">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала Веллса</h2>
        <p class="fc-calc__hint">Шкала Веллса — диагностическая шкала клинической вероятности тромбоэмболии лёгочной артерии (ТЭЛА). Включена в международные стандарты обследования и лечения ТЭЛА</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-wells-scale-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Шкала Веллса</h3>
              <div class="fc-calc__wells-options" role="group" aria-label="Критерии шкалы Веллса">
${renderCheckboxes()}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-wells-scale-btn" class="fc-calc__btn" form="fc-calc-wells-scale-form">Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-wells-scale-result" aria-live="polite">
        <p class="fc-calc__result-label">Результат:</p>
        <p class="fc-calc__result-number" id="fc-calc-wells-scale-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-wells-scale-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>В прогнозе вероятности развития ТЭЛА по шкале Веллса используются семь простых и легкодоступных для диагностики правил, каждому из которых соответствует определённое количество баллов. Интерпретация результатов по сумме баллов проводится либо по трёхуровневой (низкая, средняя, высокая вероятность ТЭЛА), либо по двухуровневой шкале (ТЭЛА маловероятна, ТЭЛА вероятна).</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Правила</th>
                <th>Баллы</th>
              </tr>
            </thead>
            <tbody>
${renderCriteriaRows()}
            </tbody>
          </table>
        </div>
        <p><strong>Интерпретация результатов</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Шкалы</th>
                <th>Набрано баллов</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="2"><strong>Трёхуровневая шкала:</strong></td></tr>
${renderInterpRows(THREE_LEVEL_ROWS)}
              <tr><td colspan="2"><strong>Двухуровневая шкала:</strong></td></tr>
${renderInterpRows(TWO_LEVEL_ROWS)}
            </tbody>
          </table>
        </div>
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

await writeFile(join(root, 'calculators', 'wells-scale', 'index.html'), html, 'utf8');
console.log('Built calculators/wells-scale/index.html');
