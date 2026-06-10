#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCALES } from '../calculators/anxiety-scales/calc.js';
import { GAD7_ITEMS, GAD7_INTERPRETATION_ROWS } from '../calculators/anxiety-scales/gad7-data.js';
import { COVY_ITEMS, COVY_INTERPRETATION_ROWS } from '../calculators/anxiety-scales/covy-data.js';
import {
  SPIELBERG_REACTIVE,
  SPIELBERG_TRAIT,
  SPIELBERG_INTERPRETATION_ROWS,
} from '../calculators/anxiety-scales/spielberg-data.js';
import { SHEEHAN_ITEMS, SHEEHAN_INTERPRETATION_ROWS } from '../calculators/anxiety-scales/sheehan-data.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'anxiety-scales';

function formatPoints(value) {
  return value === 0 ? '0' : `+${value}`;
}

function renderQuestionGroups(items) {
  return items
    .map((item) => {
      const options = item.options
        .map(
          (opt, index) => `                <label class="fc-calc__dep-option">
                  <input type="radio" name="${item.id}" value="${item.id}-${index}" data-score="${opt.value}" />
                  <span class="fc-calc__dep-option-text">${opt.text}</span>
                  <span class="fc-calc__dep-points">${formatPoints(opt.value)}</span>
                </label>`
        )
        .join('\n');

      const legend = `              <legend class="fc-calc__dep-legend">${item.label}</legend>
`;

      const hint =
        item.hint
          ? item.labelStyle === 'hint'
            ? `              <p class="fc-calc__dep-group-hint fc-calc__dep-group-hint--note">${item.hint}</p>\n`
            : `              <p class="fc-calc__dep-group-hint">${item.hint}</p>\n`
          : '';

      return `            <fieldset class="fc-calc__dep-group" data-item-id="${item.id}">
${legend}${hint}              <div class="fc-calc__dep-options">
${options}
              </div>
            </fieldset>`;
    })
    .join('\n');
}

function renderInterpretationTable(rows) {
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

function renderSimpleScalePanel(scale, config) {
  const hiddenAttr = config.hidden ? ' hidden' : '';
  const activeClass = config.hidden ? '' : ' fc-calc__tab-panel--active';

  return `          <div
            class="fc-calc__tab-panel${activeClass}"
            role="tabpanel"
            id="fc-calc-${slug}-panel-${scale.id}"
            data-scale="${scale.id}"
            aria-labelledby="fc-calc-${slug}-tab-${scale.id}"
            ${hiddenAttr}
          >
            <div class="fc-calc__panel-section">
              <div class="fc-calc__panel">
                <h3 class="fc-calc__panel-heading">${scale.label}</h3>
                <p class="fc-calc__dep-scale-hint">${scale.hint}</p>
                <form class="fc-calc__form" id="fc-calc-${slug}-${config.formId}-form" novalidate>
                  <div class="fc-calc__dep-questions">
${renderQuestionGroups(config.items)}
                  </div>
                </form>
              </div>
            </div>
            <div class="fc-calc__actions">
              <button type="submit" id="fc-calc-${slug}-${config.formId}-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-${config.formId}-form" disabled>Рассчитать</button>
            </div>
            <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-${config.formId}-result" aria-live="polite">
              <p class="fc-calc__result-label">${config.resultLabel || 'Суммарный балл'}</p>
              <p class="fc-calc__result-number" id="fc-calc-${slug}-${config.formId}-result-number">—</p>
              <p class="fc-calc__result-desc" id="fc-calc-${slug}-${config.formId}-result-desc"></p>
            </div>
            <details class="fc-calc__notes fc-calc__notes--inline">
              <summary class="fc-calc__notes-summary">
                <span class="fc-calc__notes-title">${config.notesTitle}</span>
                <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
              </summary>
              <div class="fc-calc__notes-body">
                <p>${config.notesIntro}</p>
${renderInterpretationTable(config.interpretationRows)}
              </div>
            </details>
          </div>`;
}

function renderSpielbergPanel(scale) {
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
                <form class="fc-calc__form" id="fc-calc-${slug}-spielberg-form" novalidate>
                  <div class="fc-calc__dep-section" style="margin-top:0;padding-top:0;border-top:none">
                    <h4 class="fc-calc__dep-section-title">Ситуативная тревожность (СТ)</h4>
                    <p class="fc-calc__dep-section-note">Пункты 1–20. Можно заполнить и рассчитать отдельно от личностной тревожности.</p>
                    <div class="fc-calc__dep-questions">
${renderQuestionGroups(SPIELBERG_REACTIVE)}
                    </div>
                  </div>
                  <div class="fc-calc__dep-section">
                    <h4 class="fc-calc__dep-section-title">Личностная тревожность (ЛТ)</h4>
                    <p class="fc-calc__dep-section-note">Пункты 21–40. Можно заполнить и рассчитать отдельно от ситуативной тревожности.</p>
                    <div class="fc-calc__dep-questions">
${renderQuestionGroups(SPIELBERG_TRAIT)}
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="fc-calc__actions">
              <button type="submit" id="fc-calc-${slug}-spielberg-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-spielberg-form" disabled>Рассчитать</button>
            </div>
            <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-spielberg-result" aria-live="polite">
              <div class="fc-calc__dep-hads-block" id="fc-calc-${slug}-spielberg-total-block" hidden>
                <p class="fc-calc__result-label">Суммарная тревожность</p>
                <p class="fc-calc__result-number fc-calc__result-number--total" id="fc-calc-${slug}-spielberg-total-number">—</p>
                <p class="fc-calc__result-desc" id="fc-calc-${slug}-spielberg-total-desc">Сумма баллов ситуативной (СТ) и личностной (ЛТ) тревожности</p>
              </div>
              <div class="fc-calc__dep-hads-block" id="fc-calc-${slug}-spielberg-reactive-block" hidden>
                <p class="fc-calc__result-label">Ситуативная тревожность (СТ)</p>
                <p class="fc-calc__result-number" id="fc-calc-${slug}-spielberg-reactive-number">—</p>
                <p class="fc-calc__result-desc" id="fc-calc-${slug}-spielberg-reactive-desc"></p>
              </div>
              <div class="fc-calc__dep-hads-block" id="fc-calc-${slug}-spielberg-trait-block" hidden>
                <p class="fc-calc__result-label">Личностная тревожность (ЛТ)</p>
                <p class="fc-calc__result-number" id="fc-calc-${slug}-spielberg-trait-number">—</p>
                <p class="fc-calc__result-desc" id="fc-calc-${slug}-spielberg-trait-desc"></p>
              </div>
            </div>
            <details class="fc-calc__notes fc-calc__notes--inline">
              <summary class="fc-calc__notes-summary">
                <span class="fc-calc__notes-title">Примечание. Шкала Спилберга-Ханина</span>
                <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
              </summary>
              <div class="fc-calc__notes-body">
                <p>Тест Спилбергера-Ханина: 40 вопросов — 20 для ситуативной (СТ) и 20 для личностной (ЛТ) тревожности. Интерпретация — для каждой подшкалы отдельно. При заполнении обеих частей показывается суммарная тревожность (СТ + ЛТ).</p>
${renderInterpretationTable(SPIELBERG_INTERPRETATION_ROWS)}
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

function renderPanels() {
  return SCALES.map((scale, i) => {
    if (scale.id === 'gad7') {
      return renderSimpleScalePanel(scale, {
        formId: 'gad7',
        hidden: false,
        items: GAD7_ITEMS,
        notesTitle: 'Примечание. Опросник GAD-7',
        notesIntro: 'Опросник ГТР-7 (GAD-7) — 7 пунктов, за каждый ответ от 0 до 3 баллов.',
        interpretationRows: GAD7_INTERPRETATION_ROWS,
      });
    }
    if (scale.id === 'covy') {
      return renderSimpleScalePanel(scale, {
        formId: 'covy',
        hidden: true,
        items: COVY_ITEMS,
        notesTitle: 'Примечание. Шкала тревоги Кови',
        notesIntro: 'Шкала тревоги Кови — 3 параметра (жалобы, поведение, соматика), за каждый от 0 до 4 баллов.',
        interpretationRows: COVY_INTERPRETATION_ROWS,
      });
    }
    if (scale.id === 'spielberg') return renderSpielbergPanel(scale);
    if (scale.id === 'sheehan') {
      return renderSimpleScalePanel(scale, {
        formId: 'sheehan',
        hidden: true,
        items: SHEEHAN_ITEMS,
        notesTitle: 'Примечание. Шкала тревоги Шихана',
        notesIntro: 'Шкала самооценки тревоги Шихана — 35 симптомов, за каждый от 0 до 4 баллов.',
        interpretationRows: SHEEHAN_INTERPRETATION_ROWS,
      });
    }
    return '';
  }).join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкалы тревоги
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкалы тревоги</h2>
        <p class="fc-calc__hint">Выберите шкалу: ГТР-7 (GAD-7), Кови, Спилберга-Ханина, Шихан</p>
      </header>

      <div class="fc-calc__tabs" role="tablist" aria-label="Шкалы тревоги">
${renderTabs()}
      </div>

      <div class="fc-calc__body">
${renderPanels()}
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Общее примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Калькулятор объединяет четыре распространённые шкалы оценки тревоги. Переключайте вкладки для выбора нужной шкалы.</p>
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
