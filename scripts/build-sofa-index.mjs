#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARDIOVASCULAR_OPTIONS, SOFA_NOTES_TABLE, GCS_CRITERIA } from '../calculators/sofa/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'sofa', 'extra.css'), 'utf8'),
]);

const TABS = [
  {
    id: 'sofa',
    label: 'SOFA',
    subtitle: 'Sequential Organ Failure Assessment — оценка дисфункции 6 органных систем',
  },
  {
    id: 'qsofa',
    label: 'qSOFA',
    subtitle: 'Быстрый скрининг сепсиса вне ОРИТ (Sepsis-3)',
  },
];

function renderGcsBlock(prefix, heading = 'Шкала комы Глазго (GCS)') {
  const groups = GCS_CRITERIA.map((criterion) => {
    const name = `${prefix}-${criterion.id}`;
    const options = criterion.options
      .slice()
      .sort((a, b) => b.value - a.value)
      .map(
        (opt) => `                  <label class="fc-calc__gcs-option">
                    <input type="radio" name="${name}" value="${opt.value}" />
                    <span class="fc-calc__gcs-option-text">${opt.label}</span>
                  </label>`
      )
      .join('\n');

    return `              <fieldset class="fc-calc__gcs-group">
                <legend class="fc-calc__gcs-legend">${criterion.label}</legend>
                <div class="fc-calc__gcs-options" role="radiogroup" aria-label="${criterion.label}">
${options}
                </div>
              </fieldset>`;
  }).join('\n');

  return `                <div class="fc-calc__sofa-gcs-block">
                  <div class="fc-calc__sofa-gcs-head">
                    <span class="fc-calc__field-label">${heading}</span>
                    <p class="fc-calc__sofa-gcs-total" id="fc-calc-sofa-${prefix}-gcs-total" aria-live="polite">— баллов</p>
                  </div>
                  <div class="fc-calc__gcs-groups">
${groups}
                  </div>
                  <span class="fc-calc__error" id="fc-calc-sofa-${prefix}-gcs-error" role="alert"></span>
                </div>`;
}

function renderNumberField(id, label, unitHtml, attrs = '') {
  return `                <div class="fc-calc__field">
                  <label for="fc-calc-sofa-${id}">${label}</label>
                  <div class="fc-calc__field-row fc-calc__sofa-input-row">
                    <input type="number" id="fc-calc-sofa-${id}" name="${id}" inputmode="decimal" ${attrs} />
                    ${unitHtml}
                  </div>
                  <span class="fc-calc__error" id="fc-calc-sofa-${id}-error" role="alert"></span>
                </div>`;
}

function renderSofaFields() {
  const cardiovascular = CARDIOVASCULAR_OPTIONS.map(
    (opt) => `                <label class="fc-calc__sofa-radio-option">
                  <input type="radio" name="cardiovascular" value="${opt.id}"${opt.id === 0 ? ' checked' : ''} required />
                  <span class="fc-calc__sofa-radio-text">${opt.label} (${opt.points})</span>
                </label>`
  ).join('\n');

  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>
              <div class="fc-calc__sofa-fields">
${renderNumberField(
  'pao2',
  'PaO₂',
  `<select class="fc-calc__sofa-unit" name="pao2Unit" aria-label="Единицы PaO₂">
                    <option value="mmhg" selected>мм рт. ст.</option>
                    <option value="kpa">кПа</option>
                  </select>`,
  'min="20" max="700" step="any"'
)}
${renderNumberField(
  'fio2',
  'FiO₂',
  `<select class="fc-calc__sofa-unit" name="fio2Unit" aria-label="Единицы FiO₂">
                    <option value="percent" selected>% O₂</option>
                  </select>`,
  'min="21" max="100" step="any"'
)}
                <div class="fc-calc__field">
                  <span class="fc-calc__field-label">Вспомогательная ИВЛ</span>
                  <div class="fc-calc__sofa-segment" role="radiogroup" aria-label="Искусственная вентиляция легких">
                    <label class="fc-calc__sofa-segment-option">
                      <input type="radio" name="ventilation" value="1" />
                      <span>Да <span class="fc-calc__sofa-segment-points">1</span></span>
                    </label>
                    <label class="fc-calc__sofa-segment-option">
                      <input type="radio" name="ventilation" value="0" checked />
                      <span>Нет <span class="fc-calc__sofa-segment-points">0</span></span>
                    </label>
                  </div>
                </div>
${renderNumberField(
  'platelets',
  'Тромбоциты',
  `<span class="fc-calc__sofa-unit fc-calc__sofa-unit--fixed">×10³/мкл</span>`,
  'min="1" max="2000" step="any"'
)}
${renderNumberField(
  'bilirubin',
  'Общий билирубин',
  `<select class="fc-calc__sofa-unit" name="bilirubinUnit" aria-label="Единицы билирубина">
                    <option value="mgdl" selected>мг/дл</option>
                    <option value="umol">мкмоль/л</option>
                  </select>`,
  'min="0.1" max="100" step="any"'
)}
                <div class="fc-calc__field">
                  <span class="fc-calc__field-label">Артериальное давление / вазопрессоры</span>
                  <div class="fc-calc__sofa-radio-group" role="radiogroup" aria-label="Сердечно-сосудистая система">
${cardiovascular}
                  </div>
                </div>
${renderGcsBlock('sofa')}
${renderNumberField(
  'creatinine',
  'Креатинин',
  `<select class="fc-calc__sofa-unit" name="creatinineUnit" aria-label="Единицы креатинина">
                    <option value="mgdl" selected>мг/дл</option>
                    <option value="umol">мкмоль/л</option>
                  </select>`,
  'min="0.1" max="30" step="any"'
)}
${renderNumberField(
  'urine-output',
  'Суточный диурез',
  `<span class="fc-calc__sofa-unit fc-calc__sofa-unit--fixed">мл/сут</span>`,
  'min="0" max="10000" step="any"'
)}
                <span class="fc-calc__error" id="fc-calc-sofa-renal-error" role="alert"></span>
                <p class="fc-calc__hint" style="margin: 0; text-align: left; font-size: 13px">Укажите креатинин и/или суточный диурез — для почечного компонента берётся худшее значение.</p>
              </div>
            </div>
          </div>`;
}

function renderQsofaFields() {
  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>
              <div class="fc-calc__sofa-fields">
${renderGcsBlock('qsofa', 'Оценка по шкале комы Глазго')}
                <div class="fc-calc__field">
                  <label for="fc-calc-sofa-qsofa-sbp">Систолическое АД</label>
                  <div class="fc-calc__field-row fc-calc__sofa-input-row">
                    <input type="number" id="fc-calc-sofa-qsofa-sbp" name="sbp" min="40" max="300" step="any" inputmode="decimal" />
                    <select class="fc-calc__sofa-unit" name="sbpUnit" aria-label="Единицы АД">
                      <option value="mmhg" selected>мм рт. ст.</option>
                      <option value="kpa">кПа</option>
                    </select>
                  </div>
                  <span class="fc-calc__error" id="fc-calc-sofa-qsofa-sbp-error" role="alert"></span>
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-sofa-qsofa-rr">Частота дыхания</label>
                  <div class="fc-calc__field-row fc-calc__sofa-input-row">
                    <input type="number" id="fc-calc-sofa-qsofa-rr" name="rr" min="4" max="80" step="1" inputmode="numeric" />
                    <span class="fc-calc__sofa-unit fc-calc__sofa-unit--fixed">дых/мин</span>
                  </div>
                  <span class="fc-calc__error" id="fc-calc-sofa-qsofa-rr-error" role="alert"></span>
                </div>
              </div>
            </div>
          </div>`;
}

function renderSofaNotesTable() {
  return SOFA_NOTES_TABLE.map(
    (row) => `                <tr><td>${row.system}</td><td>${row.rows}</td></tr>`
  ).join('\n');
}

function renderTabPanel(mode) {
  const active = mode.id === 'sofa';
  const body = mode.id === 'sofa' ? renderSofaFields() : renderQsofaFields();
  const resultLabel = mode.id === 'sofa' ? 'SOFA' : 'qSOFA оценка';
  const qsofaRiskTable =
    mode.id === 'qsofa'
      ? `            <div class="fc-calc__sofa-risk-table" id="fc-calc-sofa-qsofa-risk-hint">
              <p><strong>2–3 балла:</strong> высокий риск</p>
              <p><strong>0–1 балл:</strong> невысокий риск</p>
            </div>`
      : '';

  return `        <div
          class="fc-calc__tab-panel${active ? ' fc-calc__tab-panel--active' : ''}"
          data-mode="${mode.id}"
          role="tabpanel"
          id="fc-calc-sofa-panel-${mode.id}"
          aria-labelledby="fc-calc-sofa-tab-${mode.id}"
          ${active ? '' : 'hidden'}
        >
          <form class="fc-calc__form" id="fc-calc-sofa-form-${mode.id}" novalidate>
${body}
          </form>
          <div class="fc-calc__actions">
            <button type="submit" id="fc-calc-sofa-btn-${mode.id}" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-sofa-form-${mode.id}" disabled>Рассчитать</button>
          </div>
          <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-sofa-result-${mode.id}" aria-live="polite">
            <p class="fc-calc__result-label">${resultLabel}</p>
            <p class="fc-calc__result-number" id="fc-calc-sofa-result-number-${mode.id}">—</p>
            <p class="fc-calc__result-desc" id="fc-calc-sofa-result-desc-${mode.id}"></p>
            <div class="fc-calc__sofa-result-secondary" id="fc-calc-sofa-result-secondary-${mode.id}" hidden></div>
${qsofaRiskTable}
          </div>
        </div>`;
}

function renderTabs() {
  const tabButtons = TABS.map((tab, index) => {
    const active = index === 0;
    return `        <button
          type="button"
          class="fc-calc__tab${active ? ' fc-calc__tab--active' : ''}"
          role="tab"
          id="fc-calc-sofa-tab-${tab.id}"
          data-mode="${tab.id}"
          aria-selected="${active ? 'true' : 'false'}"
          aria-controls="fc-calc-sofa-panel-${tab.id}"
          tabindex="${active ? '0' : '-1'}"
          title="${tab.label} (${tab.subtitle})"
        >${tab.label}</button>`;
  }).join('\n');

  const panels = TABS.map(renderTabPanel).join('\n');

  return `      <div class="fc-calc__tabs" role="tablist" aria-label="SOFA и qSOFA">
${tabButtons}
      </div>
${panels}`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Динамическая оценка органной недостаточности SOFA / qSOFA
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="sofa">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Динамическая оценка органной недостаточности</h2>
        <div class="fc-calc__hint fc-calc__sofa-hint">
${TABS.map((tab) => `          <p class="fc-calc__sofa-hint-line"><strong>${tab.label}</strong> — ${tab.subtitle}</p>`).join('\n')}
        </div>
      </header>

      <div class="fc-calc__body">
${renderTabs()}
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <div class="fc-calc__notes-section">
          <p><strong>SOFA</strong> — Sequential Organ Failure Assessment. Оценивает дисфункцию шести органных систем по худшему значению за 24 часа. PaO₂/FiO₂ = PaO₂ (мм рт. ст.) / FiO₂ (доля). Сумма 0–24 балла.</p>
          <p><strong>GCS</strong> рассчитывается по шкале комы Глазго: открытие глаз + двигательная реакция + вербальная реакция (3–15 баллов).</p>
          <div class="fc-calc__table-wrap">
            <table class="fc-calc__table">
              <thead>
                <tr><th>Система</th><th>Баллы</th></tr>
              </thead>
              <tbody>
${renderSofaNotesTable()}
              </tbody>
            </table>
          </div>
          <p><strong>Интерпретация SOFA:</strong> 0–1 — минимальная дисфункция; 2–5 — лёгкая; 6–9 — умеренная; ≥ 10 — тяжёлая. При подозрении на инфекцию прирост SOFA ≥ 2 от исходного уровня соответствует сепсис-ассоциированной органной дисфункции (Sepsis-3).</p>
        </div>
        <div class="fc-calc__notes-section">
          <p><strong>qSOFA</strong> — 1 балл за каждый признак: GCS &lt; 15, систолическое АД ≤ 100 мм рт. ст., ЧДД ≥ 22/мин. При сумме 2–3 — высокий риск; 0–1 — невысокий риск. Скрининг вне ОРИТ, не заменяет полный SOFA.</p>
        </div>
        <p><strong>Ссылки:</strong></p>
        <p class="fc-calc__source-item">Vincent JL, et al. The SOFA (Sepsis-related Organ Failure Assessment) score. <em>Intensive Care Med.</em> 1996.</p>
        <p class="fc-calc__source-item">Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). <em>JAMA.</em> 2016.</p>
        <p class="fc-calc__source-item">Merck Manual Professional Edition — Sequential Organ Failure Assessment (SOFA) Score.</p>
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
${(await readFile(join(root, 'calculators', 'sofa', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'sofa', 'index.html'), html, 'utf8');
console.log('Built calculators/sofa/index.html');
