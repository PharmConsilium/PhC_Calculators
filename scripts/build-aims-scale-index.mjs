#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVEMENT_ITEMS,
  ADDITIONAL_ITEMS,
  MOVEMENT_INTERPRETATION_ROWS,
  formatAimsOptionLabel,
} from '../calculators/aims-scale/aims-data.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'aims-scale';

function formatPoints(value) {
  return value === 0 ? '0' : `+${value}`;
}

function renderItemGroups(items) {
  return items
    .map((item) => {
      const options = item.options
        .map(
          (opt, index) => `                <label class="fc-calc__aims-option">
                  <input type="radio" name="${item.id}" value="${item.id}-${index}" data-score="${opt.points}" />
                  <span class="fc-calc__aims-option-text">${formatAimsOptionLabel(opt)}</span>
                  <span class="fc-calc__aims-points">${formatPoints(opt.points)}</span>
                </label>`
        )
        .join('\n');

      return `            <fieldset class="fc-calc__aims-group" data-item-id="${item.id}">
              <legend class="fc-calc__aims-legend">${item.number}. ${item.label}</legend>
              <p class="fc-calc__aims-hint">${item.hint}</p>
              <div class="fc-calc__aims-options">
${options}
              </div>
            </fieldset>`;
    })
    .join('\n');
}

function renderInterpretationTable() {
  const body = MOVEMENT_INTERPRETATION_ROWS.map(
    (row) => `              <tr>
                <td>${row.range}</td>
                <td>${row.interpretation}</td>
              </tr>`
  ).join('\n');

  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Общий балл (пункты 1–7)</th>
                <th>Интерпретация</th>
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
  Название: Шкала AIMS
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала AIMS</h2>
        <p class="fc-calc__hint">Abnormal Involuntary Movement Scale — оценка аномальных непроизвольных движений при поздней дискинезии</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-${slug}-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Оценка двигательных нарушений по шкале AIMS</h3>
              <div class="fc-calc__aims-section">
                <p class="fc-calc__aims-section-note">Пункты 1–7: оценка движений по группам мышц (0–4 балла за каждый пункт).</p>
                <div class="fc-calc__aims-questions">
${renderItemGroups(MOVEMENT_ITEMS)}
                </div>
              </div>
              <div class="fc-calc__aims-section">
                <p class="fc-calc__aims-section-note">Пункты 8–12: общие оценки и дополнительная информация.</p>
                <div class="fc-calc__aims-questions">
${renderItemGroups(ADDITIONAL_ITEMS)}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-${slug}-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-result" aria-live="polite">
        <p class="fc-calc__result-label">Результат</p>
        <p class="fc-calc__aims-movement-line">Общий балл (пункты 1–7): <strong class="fc-calc__aims-movement-value" id="fc-calc-${slug}-movement-total">—</strong></p>
        <p class="fc-calc__aims-movement-interp" id="fc-calc-${slug}-movement-interp"></p>
        <p class="fc-calc__aims-additional-title">Дополнительные оценки:</p>
        <ul class="fc-calc__aims-additional-list" id="fc-calc-${slug}-additional"></ul>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Шкала AIMS (Abnormal Involuntary Movement Scale) — стандартизированный инструмент для выявления и мониторинга поздней дискинезии у пациентов, длительно принимающих антипсихотические препараты. Состоит из 12 пунктов: 7 — оценка движений по группам мышц, 3 — общие оценки, 2 — стоматологический статус.</p>
        <p><strong>Интерпретация общего балла (пункты 1–7):</strong></p>
${renderInterpretationTable()}
        <p>Пункты 8–10 оцениваются отдельно. Пункты 11–12 учитываются при оценке движений губ, челюстей и языка.</p>
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
