#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCALES } from '../calculators/depression-scales/calc.js';
import { BECK_ITEMS, BECK_INTERPRETATION_ROWS } from '../calculators/depression-scales/beck-data.js';
import {
  HAMILTON_CORE,
  HAMILTON_SUPPLEMENTARY,
  HAMILTON_INTERPRETATION_ROWS,
} from '../calculators/depression-scales/hamilton-data.js';
import { PHQ_ITEMS, PHQ_INTERPRETATION_ROWS } from '../calculators/depression-scales/phq-data.js';
import { EPDS_ITEMS, EPDS_INTERPRETATION_ROWS, EPDS_NOTES_EXTRA } from '../calculators/depression-scales/epds-data.js';
import { GDS_ITEMS, GDS_INTERPRETATION_ROWS } from '../calculators/depression-scales/gds-data.js';
import {
  HADS_ANXIETY,
  HADS_DEPRESSION,
  HADS_ANXIETY_INTERPRETATION_ROWS,
  HADS_DEPRESSION_INTERPRETATION_ROWS,
} from '../calculators/depression-scales/hads-data.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'depression-scales';

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

      const legend =
        item.labelStyle === 'hint'
          ? `              <legend class="fc-calc__dep-legend fc-calc__dep-legend--sr-only">${item.label}</legend>
              <p class="fc-calc__dep-group-hint">${item.label}</p>
`
          : `              <legend class="fc-calc__dep-legend">${item.label}</legend>
`;

      const hint =
        item.labelStyle === 'hint' && item.hint
          ? `              <p class="fc-calc__dep-group-hint fc-calc__dep-group-hint--note">${item.hint}</p>\n`
          : item.hint
            ? `              <p class="fc-calc__dep-group-hint">${item.hint}</p>\n`
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
${config.notesExtra || ''}
              </div>
            </details>
          </div>`;
}

function renderBeckPanel(scale) {
  return renderSimpleScalePanel(scale, {
    formId: 'beck',
    hidden: false,
    items: BECK_ITEMS,
    notesTitle: 'Примечание. Шкала Бека',
    notesIntro: 'Шкала депрессии Бека (BDI) — опросник из 21 утверждения. За каждый ответ — от 0 до 3 баллов.',
    interpretationRows: BECK_INTERPRETATION_ROWS,
  });
}

function renderPhqPanel(scale) {
  return renderSimpleScalePanel(scale, {
    formId: 'phq',
    hidden: true,
    items: PHQ_ITEMS,
    notesTitle: 'Примечание. Шкала PHQ',
    notesIntro: 'Шкала PHQ (Patient Health Questionnaire) — опросник для диагностики наличия и тяжести депрессии. За каждый ответ — от 0 до 3 баллов.',
    interpretationRows: PHQ_INTERPRETATION_ROWS,
  });
}

function renderEpdsPanel(scale) {
  return renderSimpleScalePanel(scale, {
    formId: 'epds',
    hidden: true,
    items: EPDS_ITEMS,
    notesTitle: 'Примечание. Шкала EPDS',
    notesIntro: 'Шкала EPDS (Edinburgh Postnatal Depression Scale) — опросник из 10 вопросов для скрининга послеродовой депрессии за последние 7 дней. За каждый ответ — от 0 до 3 баллов.',
    interpretationRows: EPDS_INTERPRETATION_ROWS,
    notesExtra: EPDS_NOTES_EXTRA,
  });
}

function renderGdsPanel(scale) {
  return renderSimpleScalePanel(scale, {
    formId: 'gds',
    hidden: true,
    items: GDS_ITEMS,
    notesTitle: 'Примечание. Гериатрическая шкала депрессии',
    notesIntro: 'Гериатрическая шкала депрессии (GDS) — 15 вопросов с ответами «да» или «нет». Чувствительность 92%, специфичность 89%.',
    interpretationRows: GDS_INTERPRETATION_ROWS,
  });
}

function renderHadsPanel(scale) {
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
                <form class="fc-calc__form" id="fc-calc-${slug}-hads-form" novalidate>
                  <div class="fc-calc__dep-section">
                    <h4 class="fc-calc__dep-section-title">Часть I — оценка уровня тревоги</h4>
                    <p class="fc-calc__dep-section-note">Можно заполнить и рассчитать отдельно от части II.</p>
                    <div class="fc-calc__dep-questions">
${renderQuestionGroups(HADS_ANXIETY)}
                    </div>
                  </div>
                  <div class="fc-calc__dep-section">
                    <h4 class="fc-calc__dep-section-title">Часть II — оценка уровня депрессии</h4>
                    <p class="fc-calc__dep-section-note">Можно заполнить и рассчитать отдельно от части I.</p>
                    <div class="fc-calc__dep-questions">
${renderQuestionGroups(HADS_DEPRESSION)}
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="fc-calc__actions">
              <button type="submit" id="fc-calc-${slug}-hads-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-hads-form" disabled>Рассчитать</button>
            </div>
            <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-hads-result" aria-live="polite">
              <div class="fc-calc__dep-hads-block" id="fc-calc-${slug}-hads-anxiety-block" hidden>
                <p class="fc-calc__result-label">Часть I — уровень тревоги</p>
                <p class="fc-calc__result-number" id="fc-calc-${slug}-hads-anxiety-number">—</p>
                <p class="fc-calc__result-desc" id="fc-calc-${slug}-hads-anxiety-desc"></p>
              </div>
              <div class="fc-calc__dep-hads-block" id="fc-calc-${slug}-hads-depression-block" hidden>
                <p class="fc-calc__result-label">Часть II — уровень депрессии</p>
                <p class="fc-calc__result-number" id="fc-calc-${slug}-hads-depression-number">—</p>
                <p class="fc-calc__result-desc" id="fc-calc-${slug}-hads-depression-desc"></p>
              </div>
            </div>
            <details class="fc-calc__notes fc-calc__notes--inline">
              <summary class="fc-calc__notes-summary">
                <span class="fc-calc__notes-title">Примечание. Шкала HADS</span>
                <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
              </summary>
              <div class="fc-calc__notes-body">
                <p>Шкала HADS состоит из двух подшкал: часть I — тревога (7 вопросов), часть II — депрессия (7 вопросов). За каждый ответ — от 0 до 3 баллов.</p>
                <p><strong>Интерпретация части I (тревога)</strong></p>
${renderInterpretationTable(HADS_ANXIETY_INTERPRETATION_ROWS)}
                <p><strong>Интерпретация части II (депрессия)</strong></p>
${renderInterpretationTable(HADS_DEPRESSION_INTERPRETATION_ROWS)}
              </div>
            </details>
          </div>`;
}

function renderHamiltonPanel(scale) {
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
                <form class="fc-calc__form" id="fc-calc-${slug}-hamilton-form" novalidate>
                  <div class="fc-calc__dep-questions">
${renderQuestionGroups(HAMILTON_CORE)}
                  </div>
                  <div class="fc-calc__dep-section">
                    <h4 class="fc-calc__dep-section-title">Дополнительная шкала (пункты 18-21)</h4>
                    <p class="fc-calc__dep-section-note">Баллы по этим пунктам не входят в суммарный балл тяжести депрессии. Можно заполнить любой или все пункты.</p>
                    <div class="fc-calc__dep-questions">
${renderQuestionGroups(HAMILTON_SUPPLEMENTARY)}
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="fc-calc__actions">
              <button type="submit" id="fc-calc-${slug}-hamilton-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-hamilton-form" disabled>Рассчитать</button>
            </div>
            <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-hamilton-result" aria-live="polite">
              <p class="fc-calc__result-label">Результат основной шкалы (пункты 1-17)</p>
              <p class="fc-calc__result-number" id="fc-calc-${slug}-hamilton-result-number">—</p>
              <p class="fc-calc__result-desc" id="fc-calc-${slug}-hamilton-result-desc"></p>
              <p class="fc-calc__dep-supplementary" id="fc-calc-${slug}-hamilton-supplementary" hidden>
                Результат дополнительной шкалы (пункты 18-21):
                <span class="fc-calc__dep-supplementary-score" id="fc-calc-${slug}-hamilton-supplementary-score"></span>
              </p>
            </div>
            <details class="fc-calc__notes fc-calc__notes--inline">
              <summary class="fc-calc__notes-summary">
                <span class="fc-calc__notes-title">Примечание. Шкала Гамильтона</span>
                <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
              </summary>
              <div class="fc-calc__notes-body">
                <p>Шкала Гамильтона (HDRS): тяжесть депрессии определяется по сумме баллов за пункты 1–17.</p>
${renderInterpretationTable(HAMILTON_INTERPRETATION_ROWS)}
                <p>Четыре последних пункта шкалы Гамильтона (18-21) используются для оценки дополнительных симптомов депрессии и определения подтипов депрессивного расстройства. Баллы по данным 4 пунктам не используются при определении степени выраженности депрессии, и эти баллы не учитываются при подсчете суммарного балла, который определяет тяжесть депрессивного расстройства.</p>
              </div>
            </details>
          </div>`;
}

function renderPlaceholderPanel(scale, index) {
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
                <p class="fc-calc__dep-placeholder">Форма расчёта по этой шкале будет добавлена.</p>
              </div>
            </div>
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
    if (scale.id === 'beck') return renderBeckPanel(scale);
    if (scale.id === 'hamilton') return renderHamiltonPanel(scale);
    if (scale.id === 'phq') return renderPhqPanel(scale);
    if (scale.id === 'epds') return renderEpdsPanel(scale);
    if (scale.id === 'gds') return renderGdsPanel(scale);
    if (scale.id === 'hads') return renderHadsPanel(scale);
    return renderPlaceholderPanel(scale, i);
  }).join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкалы оценки депрессии
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкалы оценки депрессии</h2>
        <p class="fc-calc__hint">Выберите шкалу: Бек, Гамильтон, PHQ, EPDS, гериатрическая шкала, HADS</p>
      </header>

      <div class="fc-calc__tabs" role="tablist" aria-label="Шкалы оценки депрессии">
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
        <p>Калькулятор объединяет шесть распространённых шкал оценки депрессии и смежных состояний. Переключайте вкладки для выбора нужной шкалы.</p>
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
