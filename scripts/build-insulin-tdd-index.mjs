#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROFILE_OPTIONS,
  INSULIN_KIND_OPTIONS,
  ICR_RULE_OPTIONS,
} from '../calculators/insulin-tdd/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'insulin-tdd');

const [css, extra, calcJs, uiJs] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(calcDir, 'extra.css'), 'utf8'),
  readFile(join(calcDir, 'calc.js'), 'utf8'),
  readFile(join(calcDir, 'widget-ui.js'), 'utf8'),
]);

function stripModuleExports(src) {
  return src
    .replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export /gm, '');
}

const script = `(function () {
  ${stripModuleExports(calcJs)}
  ${uiJs}
})();`;

await writeFile(join(calcDir, 'widget.js'), script, 'utf8');

const TABS = [
  { id: 'tdd', label: 'Суточная доза' },
  { id: 'correction', label: 'Коррекция' },
  { id: 'carbs', label: 'Углеводы' },
  { id: 'summary', label: 'Итого' },
];

function renderTabs() {
  const buttons = TABS.map((tab, i) => {
    const active = i === 0;
    return `        <button
          type="button"
          class="fc-calc__tab${active ? ' fc-calc__tab--active' : ''}"
          role="tab"
          id="fc-calc-insulin-tdd-tab-${tab.id}"
          data-mode="${tab.id}"
          aria-selected="${active ? 'true' : 'false'}"
          aria-controls="fc-calc-insulin-tdd-panel-${tab.id}"
          tabindex="${active ? '0' : '-1'}"
        >${tab.label}</button>`;
  }).join('\n');
  return `      <div class="fc-calc__tabs" role="tablist" aria-label="Калькулятор инсулина">
${buttons}
      </div>`;
}

const profileRadios = PROFILE_OPTIONS.map((p, i) => {
  const id = `fc-calc-insulin-tdd-profile-${p.value}`;
  return `                  <label class="fc-calc__ins-option" for="${id}">
                    <input type="radio" id="${id}" name="fc-calc-insulin-tdd-profile" value="${p.value}"${i === 1 ? ' checked' : ''} />
                    <span class="fc-calc__ins-option-text">
                      <span class="fc-calc__ins-option-label">${p.label}</span>
                      <span class="fc-calc__ins-option-hint">${p.hint}</span>
                    </span>
                  </label>`;
}).join('\n');

const kindRadios = INSULIN_KIND_OPTIONS.map((o, i) => {
  const id = `fc-calc-insulin-tdd-kind-${o.value}`;
  return `                  <label class="fc-calc__ins-option" for="${id}">
                    <input type="radio" id="${id}" name="fc-calc-insulin-tdd-kind" value="${o.value}"${i === 0 ? ' checked' : ''} />
                    <span class="fc-calc__ins-option-text">
                      <span class="fc-calc__ins-option-label">${o.label}</span>
                      <span class="fc-calc__ins-option-hint">${o.ruleMmol} ÷ суточная доза инсулина (ммоль/л)</span>
                    </span>
                  </label>`;
}).join('\n');

const icrRadios = ICR_RULE_OPTIONS.map((o, i) => {
  const id = `fc-calc-insulin-tdd-icr-${o.value}`;
  return `                  <label class="fc-calc__ins-option" for="${id}">
                    <input type="radio" id="${id}" name="fc-calc-insulin-tdd-icr" value="${o.value}"${i === 0 ? ' checked' : ''} />
                    <span class="fc-calc__ins-option-text">
                      <span class="fc-calc__ins-option-label">${o.label}</span>
                    </span>
                  </label>`;
}).join('\n');

const tddPanel = `        <div
          class="fc-calc__tab-panel fc-calc__tab-panel--active"
          data-mode="tdd"
          role="tabpanel"
          id="fc-calc-insulin-tdd-panel-tdd"
          aria-labelledby="fc-calc-insulin-tdd-tab-tdd"
        >
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Суточная доза инсулина</h3>
              <div class="fc-calc__ins-grid">
                <div class="fc-calc__field">
                  <label for="fc-calc-insulin-tdd-weight">Масса тела, кг</label>
                  <input type="number" id="fc-calc-insulin-tdd-weight" inputmode="decimal" min="0" step="any" placeholder="напр. 70" />
                </div>
                <fieldset class="fc-calc__ins-fieldset">
                  <legend class="fc-calc__ins-fieldset-legend">Клинический профиль</legend>
                  <div class="fc-calc__ins-options">
${profileRadios}
                  </div>
                </fieldset>
                <div class="fc-calc__field">
                  <label for="fc-calc-insulin-tdd-units">Коэффициент, Ед/кг</label>
                  <input type="text" id="fc-calc-insulin-tdd-units" inputmode="decimal" value="0,5" placeholder="напр. 0,5" />
                  <p class="fc-calc__ins-hint" id="fc-calc-insulin-tdd-profile-hint">0,5 Ед/кг</p>
                </div>
                <div class="fc-calc__ins-slider">
                  <div class="fc-calc__ins-slider-labels">
                    <span id="fc-calc-insulin-tdd-basal-label">Базальный 50%</span>
                    <span id="fc-calc-insulin-tdd-bolus-label">Болюсный 50%</span>
                  </div>
                  <input type="range" id="fc-calc-insulin-tdd-basal" min="0" max="100" step="5" value="50" aria-label="Доля базального инсулина" />
                  <p class="fc-calc__ins-hint">Шаг 5%. По умолчанию 50 / 50.</p>
                </div>
                <div class="fc-calc__ins-result" id="fc-calc-insulin-tdd-result-tdd" hidden></div>
              </div>
            </div>
          </div>
        </div>`;

const correctionPanel = `        <div
          class="fc-calc__tab-panel"
          data-mode="correction"
          role="tabpanel"
          id="fc-calc-insulin-tdd-panel-correction"
          aria-labelledby="fc-calc-insulin-tdd-tab-correction"
          hidden
        >
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Коррекция гипергликемии (ISF)</h3>
              <p class="fc-calc__ins-hint" id="fc-calc-insulin-tdd-corr-need-tdd">Сначала укажите массу и коэффициент на вкладке «Суточная доза».</p>
              <div class="fc-calc__ins-grid" style="margin-top:12px">
                <fieldset class="fc-calc__ins-fieldset">
                  <legend class="fc-calc__ins-fieldset-legend">Тип инсулина для ISF</legend>
                  <div class="fc-calc__ins-options">
${kindRadios}
                  </div>
                </fieldset>
                <div class="fc-calc__field">
                  <label for="fc-calc-insulin-tdd-g-cur">Глюкоза текущая, ммоль/л</label>
                  <input type="number" id="fc-calc-insulin-tdd-g-cur" inputmode="decimal" min="0" step="any" placeholder="напр. 12" />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-insulin-tdd-g-tgt">Глюкоза целевая, ммоль/л</label>
                  <input type="number" id="fc-calc-insulin-tdd-g-tgt" inputmode="decimal" min="0" step="any" value="6" placeholder="напр. 6" />
                </div>
                <div class="fc-calc__ins-result" id="fc-calc-insulin-tdd-result-corr" hidden></div>
              </div>
            </div>
          </div>
        </div>`;

const carbsPanel = `        <div
          class="fc-calc__tab-panel"
          data-mode="carbs"
          role="tabpanel"
          id="fc-calc-insulin-tdd-panel-carbs"
          aria-labelledby="fc-calc-insulin-tdd-tab-carbs"
          hidden
        >
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Углеводный коэффициент (ICR) и прандиальный болюс</h3>
              <p class="fc-calc__ins-hint" id="fc-calc-insulin-tdd-carbs-need-tdd">Сначала укажите массу и коэффициент на вкладке «Суточная доза».</p>
              <div class="fc-calc__ins-grid" style="margin-top:12px">
                <fieldset class="fc-calc__ins-fieldset">
                  <legend class="fc-calc__ins-fieldset-legend">Правило ICR</legend>
                  <div class="fc-calc__ins-options">
${icrRadios}
                  </div>
                </fieldset>
                <div class="fc-calc__field">
                  <label for="fc-calc-insulin-tdd-carbs">Углеводы в порции, г</label>
                  <input type="number" id="fc-calc-insulin-tdd-carbs" inputmode="decimal" min="0" step="any" placeholder="напр. 45" />
                </div>
                <div class="fc-calc__ins-result" id="fc-calc-insulin-tdd-result-carbs" hidden></div>
              </div>
            </div>
          </div>
        </div>`;

const summaryPanel = `        <div
          class="fc-calc__tab-panel"
          data-mode="summary"
          role="tabpanel"
          id="fc-calc-insulin-tdd-panel-summary"
          aria-labelledby="fc-calc-insulin-tdd-tab-summary"
          hidden
        >
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Итоговый болюс</h3>
              <div id="fc-calc-insulin-tdd-summary"></div>
            </div>
          </div>
        </div>`;

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Калькулятор инсулина: суточная доза, коррекция и прандиальный болюс
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="insulin-tdd">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Ориентировочный расчёт стартовых доз по массе тела, ISF и ICR. Требует клинической титрации.</h2>
      </header>

      <div class="fc-calc__body">
${renderTabs()}
${tddPanel}
${correctionPanel}
${carbsPanel}
${summaryPanel}
        <span class="fc-calc__error" id="fc-calc-insulin-tdd-form-error" role="alert"></span>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Суточная доза инсулина</strong> = масса (кг) × коэффициент (Ед/кг). Типичные старты: чувствительные 0,3–0,4; стандарт СД2 0,5; резистентные 0,6–1,0; пубертат до 1,0–1,5 Ед/кг.</p>
        <p><strong>Базал / болюс:</strong> по умолчанию 50% / 50%; болюсная часть делится равномерно на 3 приёма пищи. Долю базального можно менять ползунком.</p>
        <p><strong>ISF (фактор чувствительности):</strong> быстрый инсулин — 100 ÷ суточная доза (ммоль/л на 1 Ед) или 1800 ÷ суточная доза (мг/дл); регулярный — 83 ÷ суточная доза / 1500 ÷ суточная доза. Коррекция = (Gтек − Gцель) / ISF.</p>
        <p><strong>ICR (углеводный коэффициент):</strong> правило «500» ÷ суточная доза (г углеводов на 1 Ед). Варианты: 450/400 при высокой инсулинорезистентности или помпе; 300 у детей с низкой суточной дозой. Прандиальный болюс = углеводы / ICR.</p>
        <p><strong>Итоговый болюс</strong> = углеводы/ICR + (Gтек − Gцель)/ISF.</p>
        <p>Стартовые расчёты требуют клинической титрации, учёта гипогликемий, остаточного инсулина («стек») и индивидуальных факторов. Не заменяют решение врача.</p>
      </div>
    </details>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${script.trim()}
  </script>
</div>
`;

await writeFile(join(calcDir, 'index.html'), html, 'utf8');
console.log('Built calculators/insulin-tdd/index.html and widget.js');
