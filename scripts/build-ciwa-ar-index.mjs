#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CIWA_ITEMS, CIWA_INTERPRETATION_ROWS, formatCiwaPoints } from '../calculators/ciwa-ar/ciwa-data.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'ciwa-ar';

function renderItems() {
  return CIWA_ITEMS.map((item) => {
    const options = item.options
      .map(
        (opt, index) => `                <label class="fc-calc__ciwa-option">
                  <input type="radio" name="${item.id}" value="${item.id}-${index}" data-score="${opt.points}" />
                  <span class="fc-calc__ciwa-option-text">${opt.text}</span>
                  <span class="fc-calc__ciwa-points">${formatCiwaPoints(opt.points)}</span>
                </label>`
      )
      .join('\n');

    return `            <fieldset class="fc-calc__ciwa-group" data-item-id="${item.id}">
              <legend class="fc-calc__ciwa-legend">${item.number}. ${item.label}</legend>
              <p class="fc-calc__ciwa-hint">${item.hint}</p>
              <div class="fc-calc__ciwa-options">
${options}
              </div>
            </fieldset>`;
  }).join('\n');
}

function renderInterpretationTable() {
  const body = CIWA_INTERPRETATION_ROWS.map(
    (row) => `              <tr>
                <td>${row.label}</td>
                <td>${row.range}</td>
              </tr>`
  ).join('\n');

  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Результат</th>
                <th>Набрано баллов</th>
              </tr>
            </thead>
            <tbody>
${body}
            </tbody>
          </table>
        </div>`;
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала CIWA-AR
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала CIWA-AR</h2>
        <p class="fc-calc__hint">Clinical Institute Withdrawal Assessment for Alcohol scale, Revised — оценка тяжести алкогольного абстинентного синдрома</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-${slug}-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Шкала тяжести алкогольного абстинентного синдрома</h3>
              <div class="fc-calc__ciwa-questions">
${renderItems()}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-${slug}-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-result" aria-live="polite">
        <p class="fc-calc__result-label">Суммарный балл CIWA-AR</p>
        <p class="fc-calc__result-number" id="fc-calc-${slug}-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-${slug}-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Шкала CIWA-AR содержит 10 вопросов, за каждый ответ даётся от 0 до 7 баллов (пункт 10 — до 4 баллов). По сумме набранных баллов проводится интерпретация результатов.</p>
        <p><strong>Интерпретация полученных результатов:</strong></p>
${renderInterpretationTable()}
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

await writeFile(join(root, 'calculators', slug, 'index.html'), html, 'utf8');
console.log(`Built calculators/${slug}/index.html`);
