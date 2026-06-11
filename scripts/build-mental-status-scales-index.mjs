#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCALES } from '../calculators/mental-status-scales/calc.js';
import {
  MMSE_SECTIONS,
  MMSE_SCREENING_ROWS,
  MMSE_EDUCATION_ROWS,
  MMSE_SEVERITY_ROWS,
  MMSE_ALZHEIMER_ROWS,
} from '../calculators/mental-status-scales/mmse-data.js';
import {
  FAB_RADIO_ITEMS,
  FAB_FLUENCY,
  FAB_INTERPRETATION_ROWS,
  FAB_FLUENCY_SCORING_ROWS,
} from '../calculators/mental-status-scales/fab-data.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'mental-status-scales';

function formatPoints(value) {
  return value === 0 ? '0' : `+${value}`;
}

function renderInterpretationTable(rows, col1 = 'Интерпретация', col2 = 'Балл') {
  const body = rows
    .map(
      (row) => `              <tr>
                <td>${row.label}</td>
                <td>${row.range}</td>
              </tr>`
    )
    .join('\n');

  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>${col1}</th>
                <th>${col2}</th>
              </tr>
            </thead>
            <tbody>
${body}
            </tbody>
          </table>
        </div>`;
}

function renderMmseResultBlock() {
  return `            <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-mmse-result" aria-live="polite">
              <p class="fc-calc__result-label">Результат</p>
              <p class="fc-calc__mss-score">Общий балл MMSE: <strong class="fc-calc__mss-score-value" id="fc-calc-${slug}-mmse-result-total">—</strong> из 30</p>
              <div class="fc-calc__mss-interp">
                <div class="fc-calc__mss-interp-item">
                  <p class="fc-calc__mss-interp-title">1. Простая оценка:</p>
                  <p class="fc-calc__mss-interp-text" id="fc-calc-${slug}-mmse-simple-text"></p>
                  <p class="fc-calc__mss-interp-details" id="fc-calc-${slug}-mmse-simple-details"></p>
                </div>
                <div class="fc-calc__mss-interp-item">
                  <p class="fc-calc__mss-interp-title">2. Ранговый метод:</p>
                  <p class="fc-calc__mss-interp-text" id="fc-calc-${slug}-mmse-rank-text"></p>
                  <p class="fc-calc__mss-interp-details" id="fc-calc-${slug}-mmse-rank-details"></p>
                </div>
                <div class="fc-calc__mss-interp-item">
                  <p class="fc-calc__mss-interp-title">3. С учётом образования:</p>
                  <ul class="fc-calc__mss-education-list">
                    <li><strong>9 классов и меньше:</strong> <span id="fc-calc-${slug}-mmse-edu-school"></span></li>
                    <li><strong>Среднее проф. образование:</strong> <span id="fc-calc-${slug}-mmse-edu-college"></span></li>
                    <li><strong>Высшее образование:</strong> <span id="fc-calc-${slug}-mmse-edu-university"></span></li>
                  </ul>
                </div>
                <div class="fc-calc__mss-interp-item">
                  <p class="fc-calc__mss-interp-title">4. Выраженность нарушений:</p>
                  <p class="fc-calc__mss-interp-text" id="fc-calc-${slug}-mmse-severity-text"></p>
                  <p class="fc-calc__mss-interp-details" id="fc-calc-${slug}-mmse-severity-details"></p>
                </div>
                <div class="fc-calc__mss-interp-item">
                  <p class="fc-calc__mss-interp-title">5. Стадии болезни Альцгеймера:</p>
                  <p class="fc-calc__mss-interp-text" id="fc-calc-${slug}-mmse-alzheimers-text"></p>
                  <p class="fc-calc__mss-interp-details" id="fc-calc-${slug}-mmse-alzheimers-details"></p>
                </div>
              </div>
            </div>`;
}

function renderMmseSections() {
  return MMSE_SECTIONS.map(
    (section) => `                  <div class="fc-calc__mss-section">
                    <h4 class="fc-calc__mss-section-title">${section.title}</h4>
                    <div class="fc-calc__mss-items" role="group" aria-label="${section.title}">
${section.items
  .map(
    (item) => `                      <label class="fc-calc__mss-row" for="fc-calc-${slug}-${item.id}">
                        <input type="checkbox" id="fc-calc-${slug}-${item.id}" name="${item.id}" value="1" />
                        <span class="fc-calc__mss-label-wrap">
                          <span class="fc-calc__mss-label">${item.label}</span>
                          <span class="fc-calc__mss-hint">${item.hint}</span>
                        </span>
                        <span class="fc-calc__mss-points">+1</span>
                      </label>`
  )
  .join('\n')}
                    </div>
                  </div>`
  ).join('\n');
}

function renderFabRadioGroups() {
  const groups = [];

  for (const item of FAB_RADIO_ITEMS) {
    if (item.id === 'fab3') {
      groups.push(renderFabFluencyBlock());
    }

    const options = item.options
      .map(
        (opt, index) => `                <label class="fc-calc__dep-option">
                  <input type="radio" name="${item.id}" value="${item.id}-${index}" data-score="${opt.value}" />
                  <span class="fc-calc__dep-option-text">${opt.text}</span>
                  <span class="fc-calc__dep-points">${formatPoints(opt.value)}</span>
                </label>`
      )
      .join('\n');

    groups.push(`            <fieldset class="fc-calc__dep-group" data-item-id="${item.id}">
              <legend class="fc-calc__dep-legend">${item.label}</legend>
              <p class="fc-calc__dep-group-hint">${item.hint}</p>
              <div class="fc-calc__dep-options">
${options}
              </div>
            </fieldset>`);
  }

  return groups.join('\n');
}

function renderFabFluencyBlock() {
  return `            <div class="fc-calc__fab-fluency">
              <span class="fc-calc__fab-fluency-label">${FAB_FLUENCY.label}</span>
              <p class="fc-calc__fab-fluency-hint">${FAB_FLUENCY.hint}</p>
              <div class="fc-calc__fab-fluency-field">
                <input type="number" id="fc-calc-${slug}-fab2-words" name="${FAB_FLUENCY.id}" min="0" step="1" inputmode="numeric" />
                <span class="fc-calc__fab-fluency-unit">слов</span>
              </div>
            </div>`;
}

function renderMmsePanel(scale) {
  return `          <div
            class="fc-calc__tab-panel fc-calc__tab-panel--active"
            role="tabpanel"
            id="fc-calc-${slug}-panel-${scale.id}"
            data-scale="${scale.id}"
            aria-labelledby="fc-calc-${slug}-tab-${scale.id}"
          >
            <div class="fc-calc__panel-section">
              <div class="fc-calc__panel">
                <h3 class="fc-calc__panel-heading">${scale.label}</h3>
                <p class="fc-calc__dep-scale-hint">${scale.hint}</p>
                <form class="fc-calc__form" id="fc-calc-${slug}-mmse-form" novalidate>
${renderMmseSections()}
                </form>
              </div>
            </div>
            <div class="fc-calc__actions">
              <button type="submit" id="fc-calc-${slug}-mmse-btn" class="fc-calc__btn" form="fc-calc-${slug}-mmse-form">Рассчитать</button>
            </div>
${renderMmseResultBlock()}
            <details class="fc-calc__notes fc-calc__notes--inline">
              <summary class="fc-calc__notes-summary">
                <span class="fc-calc__notes-title">Примечание. Шкала MMSE</span>
                <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
              </summary>
              <div class="fc-calc__notes-body">
                <p>MMSE — скрининговый тест из 11 заданий, максимум 30 баллов. Отметьте выполненные пункты; каждый правильный ответ — +1 балл.</p>
                <p class="fc-calc__notes-subtitle">Простая скрининговая оценка</p>
${renderInterpretationTable(MMSE_SCREENING_ROWS)}
                <p class="fc-calc__notes-subtitle">С учётом образования</p>
${renderInterpretationTable(MMSE_EDUCATION_ROWS)}
                <p class="fc-calc__notes-subtitle">Оценка выраженности нарушений</p>
${renderInterpretationTable(MMSE_SEVERITY_ROWS)}
                <p class="fc-calc__notes-subtitle">Стадии болезни Альцгеймера</p>
${renderInterpretationTable(MMSE_ALZHEIMER_ROWS)}
              </div>
            </details>
          </div>`;
}

function renderFabResultBlock() {
  return `            <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-fab-result" aria-live="polite">
              <p class="fc-calc__result-label">Результат</p>
              <p class="fc-calc__fab-result-heading">Шкала Frontal Assessment Battery (FAB):</p>
              <ul class="fc-calc__fab-breakdown">
                <li>
                  <span class="fc-calc__fab-breakdown-label">Концептуализация:</span>
                  <strong class="fc-calc__fab-breakdown-score" id="fc-calc-${slug}-fab-concept-score">—</strong> баллов
                  <span class="fc-calc__fab-breakdown-choice" id="fc-calc-${slug}-fab-concept-choice"></span>
                </li>
                <li>
                  <span class="fc-calc__fab-breakdown-label">Беглость речи:</span>
                  <strong class="fc-calc__fab-breakdown-score" id="fc-calc-${slug}-fab-fluency-score">—</strong> баллов
                  (слов набрано <span id="fc-calc-${slug}-fab-fluency-words">—</span>)
                </li>
                <li>
                  <span class="fc-calc__fab-breakdown-label">Динамический праксис:</span>
                  <strong class="fc-calc__fab-breakdown-score" id="fc-calc-${slug}-fab-praxis-score">—</strong> баллов
                  <span class="fc-calc__fab-breakdown-choice" id="fc-calc-${slug}-fab-praxis-choice"></span>
                </li>
                <li>
                  <span class="fc-calc__fab-breakdown-label">Простая реакция выбора:</span>
                  <strong class="fc-calc__fab-breakdown-score" id="fc-calc-${slug}-fab-simple-score">—</strong> баллов
                  <span class="fc-calc__fab-breakdown-choice" id="fc-calc-${slug}-fab-simple-choice"></span>
                </li>
                <li>
                  <span class="fc-calc__fab-breakdown-label">Усложнённая реакция выбора:</span>
                  <strong class="fc-calc__fab-breakdown-score" id="fc-calc-${slug}-fab-complex-score">—</strong> баллов
                  <span class="fc-calc__fab-breakdown-choice" id="fc-calc-${slug}-fab-complex-choice"></span>
                </li>
                <li>
                  <span class="fc-calc__fab-breakdown-label">Хватательные рефлексы:</span>
                  <strong class="fc-calc__fab-breakdown-score" id="fc-calc-${slug}-fab-reflex-score">—</strong> баллов
                  <span class="fc-calc__fab-breakdown-choice" id="fc-calc-${slug}-fab-reflex-choice"></span>
                </li>
              </ul>
              <hr class="fc-calc__fab-total-divider" />
              <p class="fc-calc__fab-total">Итого баллов: <strong class="fc-calc__fab-total-value" id="fc-calc-${slug}-fab-total">—</strong> из 18</p>
              <p class="fc-calc__fab-summary" id="fc-calc-${slug}-fab-summary-title"></p>
              <p class="fc-calc__fab-summary-details" id="fc-calc-${slug}-fab-summary-details"></p>
            </div>`;
}

function renderFabPanel(scale) {
  return `          <div
            class="fc-calc__tab-panel"
            role="tabpanel"
            id="fc-calc-${slug}-panel-${scale.id}"
            data-scale="${scale.id}"
            aria-labelledby="fc-calc-${slug}-tab-${scale.id}"
            hidden
          >
            <div class="fc-calc__panel-section">
              <div class="fc-calc__panel">
                <h3 class="fc-calc__panel-heading">${scale.label}</h3>
                <p class="fc-calc__dep-scale-hint">${scale.hint}</p>
                <form class="fc-calc__form" id="fc-calc-${slug}-fab-form" novalidate>
                  <div class="fc-calc__dep-questions">
${renderFabRadioGroups()}
                  </div>
                </form>
              </div>
            </div>
            <div class="fc-calc__actions">
              <button type="submit" id="fc-calc-${slug}-fab-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-fab-form" disabled>Рассчитать</button>
            </div>
${renderFabResultBlock()}
            <details class="fc-calc__notes fc-calc__notes--inline">
              <summary class="fc-calc__notes-summary">
                <span class="fc-calc__notes-title">Примечание. Шкала FAB</span>
                <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
              </summary>
              <div class="fc-calc__notes-body">
                <p>Батарея лобной дисфункции (FAB) — 6 субтестов, каждый от 0 до 3 баллов. Максимум 18 баллов.</p>
                <p class="fc-calc__notes-subtitle">Беглость речи (слова на «С»)</p>
${renderInterpretationTable(FAB_FLUENCY_SCORING_ROWS, 'Баллы', 'Количество слов')}
                <p class="fc-calc__notes-subtitle">Интерпретация суммарного балла</p>
${renderInterpretationTable(FAB_INTERPRETATION_ROWS)}
              </div>
            </details>
          </div>`;
}

function renderTabs() {
  return SCALES.map(
    (scale, i) => `          <button
            type="button"
            class="fc-calc__tab${i === 0 ? ' fc-calc__tab--active' : ''}"
            role="tab"
            id="fc-calc-${slug}-tab-${scale.id}"
            data-scale="${scale.id}"
            aria-selected="${i === 0 ? 'true' : 'false'}"
            aria-controls="fc-calc-${slug}-panel-${scale.id}"
            tabindex="${i === 0 ? '0' : '-1'}"
          >${scale.tabLabel || scale.label}</button>`
  ).join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкалы оценки психического статуса
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкалы оценки психического статуса</h2>
        <p class="fc-calc__hint">MMSE — общая оценка когнитивных функций<br />FAB — скрининг лобной дисфункции</p>
      </header>

      <div class="fc-calc__tabs" role="tablist" aria-label="Шкалы оценки психического статуса">
${renderTabs()}
      </div>

      <div class="fc-calc__body">
${renderMmsePanel(SCALES[0])}
${renderFabPanel(SCALES[1])}
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Общее примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Калькулятор объединяет две шкалы для оценки когнитивного статуса. MMSE — скрининг деменции и общих когнитивных нарушений; FAB дополняет MMSE при подозрении на лобную дисфункцию.</p>
        <ul>
${SCALES.map((s) => `          <li><strong>${s.label}</strong> — ${s.hint}</li>`).join('\n')}
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

await writeFile(join(root, 'calculators', slug, 'index.html'), html, 'utf8');
console.log(`Built calculators/${slug}/index.html`);
