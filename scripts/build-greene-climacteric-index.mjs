#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GREENE_ITEMS,
  GREENE_SECTIONS,
  GREENE_INTERPRETATION_ROWS,
  formatGreenePoints,
} from '../calculators/greene-climacteric/greene-data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'greene-climacteric';

function renderItem(item) {
  const options = item.options
    .map(
      (opt, index) => `                <label class="fc-calc__greene-option">
                  <input type="radio" name="${item.id}" value="${item.id}-${index}" data-score="${opt.points}" />
                  <span class="fc-calc__greene-option-text">${opt.text}</span>
                  <span class="fc-calc__greene-points">${formatGreenePoints(opt.points)}</span>
                </label>`
    )
    .join('\n');

  return `            <fieldset class="fc-calc__greene-group" data-item-id="${item.id}">
              <legend class="fc-calc__greene-legend">${item.number}. ${item.label}</legend>
              <div class="fc-calc__greene-options">
${options}
              </div>
            </fieldset>`;
}

function renderSections() {
  const byId = Object.fromEntries(GREENE_ITEMS.map((item) => [item.id, item]));
  return GREENE_SECTIONS.map((section) => {
    const items = section.itemIds.map((id) => renderItem(byId[id])).join('\n');
    return `            <section class="fc-calc__greene-section" data-section="${section.id}">
              <h4 class="fc-calc__greene-section-title">${section.title}</h4>
              <div class="fc-calc__greene-questions">
${items}
              </div>
            </section>`;
  }).join('\n');
}

function renderInterpretationTable() {
  const body = GREENE_INTERPRETATION_ROWS.map(
    (row) => `              <tr>
                <td>${row.label}</td>
                <td>${row.range}</td>
              </tr>`
  ).join('\n');

  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Степень тяжести</th>
                <th>Сумма баллов</th>
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
  Название: Климактерическая шкала Грина
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Климактерическая шкала Грина</h2>
        <p class="fc-calc__hint">Greene Climacteric Scale — оценка выраженности климактерического синдрома и симптомов менопаузы</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-${slug}-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Опросник (симптомы за последний месяц)</h3>
              <p class="fc-calc__hint">Выберите один вариант ответа для каждого из 21 пункта. Оценка: 0 — отсутствует, 1 — слабое, 2 — умеренное, 3 — тяжелое проявление.</p>
${renderSections()}
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-${slug}-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-result" aria-live="polite">
        <p class="fc-calc__result-label">Суммарный балл (0–63)</p>
        <p class="fc-calc__result-number" id="fc-calc-${slug}-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-${slug}-result-desc"></p>
        <div class="fc-calc__greene-results">
          <div class="fc-calc__greene-result-item">
            <p class="fc-calc__result-label">Психологические</p>
            <p class="fc-calc__result-number" id="fc-calc-${slug}-sub-psych">—</p>
          </div>
          <div class="fc-calc__greene-result-item">
            <p class="fc-calc__result-label">Соматические</p>
            <p class="fc-calc__result-number" id="fc-calc-${slug}-sub-somatic">—</p>
          </div>
          <div class="fc-calc__greene-result-item">
            <p class="fc-calc__result-label">Вазомоторные</p>
            <p class="fc-calc__result-number" id="fc-calc-${slug}-sub-vaso">—</p>
          </div>
          <div class="fc-calc__greene-result-item">
            <p class="fc-calc__result-label">Сексуальная функция</p>
            <p class="fc-calc__result-number" id="fc-calc-${slug}-sub-sexual">—</p>
          </div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Климактерическая шкала Грина (The Greene Climacteric Scale) — стандартизированный опросник для оценки степени выраженности климактерического синдрома. Пациентка оценивает симптомы за последний месяц.</p>
        <p><strong>Методика:</strong> 21 пункт, каждый от 0 до 3 баллов. Общий балл = сумма всех пунктов (0–63).</p>
        <p><strong>Подшкалы:</strong></p>
        <ul>
          <li>психологические — пункты 1–11;</li>
          <li>соматические — пункты 12–18;</li>
          <li>вазомоторные — пункты 19–20;</li>
          <li>сексуальная функция — пункт 21.</li>
        </ul>
        <p><strong>Интерпретация суммарного балла:</strong></p>
${renderInterpretationTable()}
        <p><strong>Источники:</strong></p>
        <p>1. Greene JG. Constructing a standard climacteric scale. <em>Maturitas.</em> 1998 May 20;29(1):25-31. doi: 10.1016/s0378-5122(98)00025-5. PMID: 9643514.</p>
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
