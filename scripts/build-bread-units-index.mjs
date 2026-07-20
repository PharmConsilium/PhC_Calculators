#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HE_STANDARD_OPTIONS } from '../calculators/bread-units/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'bread-units');

const [css, extra, calcJs, uiJs, productsJson] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(calcDir, 'extra.css'), 'utf8'),
  readFile(join(calcDir, 'calc.js'), 'utf8'),
  readFile(join(calcDir, 'widget-ui.js'), 'utf8'),
  readFile(join(calcDir, 'data', 'products.json'), 'utf8'),
]);

function stripModuleExports(src) {
  return src
    .replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export /gm, '');
}

const script = `(function () {
  var BREAD_PRODUCTS = ${productsJson.trim()};
  ${stripModuleExports(calcJs)}
  ${uiJs}
})();`;

await writeFile(join(calcDir, 'widget.js'), script, 'utf8');

const standardOptions = HE_STANDARD_OPTIONS.map(
  (opt, i) =>
    `                  <option value="${opt.value}"${i === 0 ? ' selected' : ''}>${opt.label}</option>`
).join('\n');

const TABS = [
  { id: 'main', label: 'Главная' },
  { id: 'ref', label: 'База продуктов' },
  { id: 'custom', label: 'Свои продукты' },
];

function renderTabs() {
  const tabButtons = TABS.map((tab, index) => {
    const active = index === 0;
    return `        <button
          type="button"
          class="fc-calc__tab${active ? ' fc-calc__tab--active' : ''}"
          role="tab"
          id="fc-calc-bread-units-tab-${tab.id}"
          data-mode="${tab.id}"
          aria-selected="${active ? 'true' : 'false'}"
          aria-controls="fc-calc-bread-units-panel-${tab.id}"
          tabindex="${active ? '0' : '-1'}"
        >${tab.label}</button>`;
  }).join('\n');

  return `      <div class="fc-calc__tabs" role="tablist" aria-label="Калькулятор хлебных единиц">
${tabButtons}
      </div>`;
}

const dayCard = `        <div class="fc-calc__bu-day" aria-live="polite">
          <div class="fc-calc__bu-stats">
            <div class="fc-calc__bu-stat">
              <span class="fc-calc__bu-stat-value fc-calc__bu-stat-value--good" id="fc-calc-bread-units-day-he">0,0</span>
              <span class="fc-calc__bu-stat-label">ХЕ</span>
            </div>
            <div class="fc-calc__bu-stat">
              <span class="fc-calc__bu-stat-value" id="fc-calc-bread-units-day-carbs">0</span>
              <span class="fc-calc__bu-stat-label">Углеводов г.</span>
            </div>
            <div class="fc-calc__bu-stat">
              <span class="fc-calc__bu-stat-value" id="fc-calc-bread-units-day-count">0</span>
              <span class="fc-calc__bu-stat-label">Продуктов</span>
            </div>
          </div>
          <p class="fc-calc__bu-norm-label" id="fc-calc-bread-units-norm-label">Норма: 0,0 / 18 ХЕ</p>
          <div class="fc-calc__bu-norm-track" aria-hidden="true">
            <div class="fc-calc__bu-norm-fill fc-calc__bu-norm-fill--good" id="fc-calc-bread-units-norm-fill" style="width:0%"></div>
          </div>
          <p class="fc-calc__bu-db-count" id="fc-calc-bread-units-db-count"></p>
        </div>`;

const mainPanel = `        <div
          class="fc-calc__tab-panel fc-calc__tab-panel--active"
          data-mode="main"
          role="tabpanel"
          id="fc-calc-bread-units-panel-main"
          aria-labelledby="fc-calc-bread-units-tab-main"
        >
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Дневник</h3>
              <div class="fc-calc__bu-meal-tabs" id="fc-calc-bread-units-meal-tabs"></div>
              <p class="fc-calc__bu-empty" id="fc-calc-bread-units-log-empty">Список пуст. Добавьте продукт ниже.</p>
              <ul class="fc-calc__bu-log" id="fc-calc-bread-units-log"></ul>
              <div class="fc-calc__bu-meal-total">
                <span>Итого приём</span>
                <strong id="fc-calc-bread-units-meal-total">0,0 ХЕ</strong>
              </div>
              <div class="fc-calc__bu-row-actions">
                <button type="button" class="fc-calc__bu-secondary" id="fc-calc-bread-units-clear-meal" disabled>Очистить приём</button>
                <button type="button" class="fc-calc__bu-secondary" id="fc-calc-bread-units-clear-day" disabled>Очистить день</button>
              </div>
            </div>
          </div>
          <form class="fc-calc__form" id="fc-calc-bread-units-form-main" novalidate>
            <div class="fc-calc__panel-section">
              <div class="fc-calc__panel">
                <h3 class="fc-calc__panel-heading">Расчёт</h3>
                <div class="fc-calc__bu-grid">
                  <div class="fc-calc__field fc-calc__bu-search-wrap">
                    <label for="fc-calc-bread-units-name">Название</label>
                    <input type="text" id="fc-calc-bread-units-name" name="productName" autocomplete="off" placeholder="Начните вводить — подсказки из базы" />
                    <ul class="fc-calc__bu-hits" id="fc-calc-bread-units-hits" hidden></ul>
                    <p class="fc-calc__bu-empty" id="fc-calc-bread-units-search-empty" hidden></p>
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-carbs">Углеводы на 100 г, г</label>
                    <input type="number" id="fc-calc-bread-units-carbs" name="carbsPer100" inputmode="decimal" min="0" step="any" placeholder="напр. 50" required />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-portion">Вес порции, г</label>
                    <input type="number" id="fc-calc-bread-units-portion" name="portionG" inputmode="decimal" min="0" step="any" placeholder="напр. 25" required />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-standard">Стандарт 1 ХЕ</label>
                    <select id="fc-calc-bread-units-standard" name="standard">
${standardOptions}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>`;

const refPanel = `        <div
          class="fc-calc__tab-panel"
          data-mode="ref"
          role="tabpanel"
          id="fc-calc-bread-units-panel-ref"
          aria-labelledby="fc-calc-bread-units-tab-ref"
          hidden
        >
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">База продуктов</h3>
              <div class="fc-calc__bu-cats" id="fc-calc-bread-units-ref-cats"></div>
              <div class="fc-calc__field">
                <label for="fc-calc-bread-units-ref-filter">Фильтр по названию</label>
                <input type="search" id="fc-calc-bread-units-ref-filter" autocomplete="off" placeholder="Напр. хлеб, банан…" />
              </div>
              <p class="fc-calc__bu-empty" id="fc-calc-bread-units-ref-empty" hidden></p>
              <ul class="fc-calc__bu-ref-list" id="fc-calc-bread-units-ref-list"></ul>
              <div class="fc-calc__bu-pager" id="fc-calc-bread-units-ref-pager" hidden>
                <button type="button" class="fc-calc__bu-secondary" id="fc-calc-bread-units-ref-prev">Назад</button>
                <span class="fc-calc__bu-pager-label" id="fc-calc-bread-units-ref-pager-label"></span>
                <button type="button" class="fc-calc__bu-secondary" id="fc-calc-bread-units-ref-next">Далее</button>
              </div>
            </div>
          </div>
        </div>`;

const customPanel = `        <div
          class="fc-calc__tab-panel"
          data-mode="custom"
          role="tabpanel"
          id="fc-calc-bread-units-panel-custom"
          aria-labelledby="fc-calc-bread-units-tab-custom"
          hidden
        >
          <form class="fc-calc__form" id="fc-calc-bread-units-form-custom" novalidate>
            <div class="fc-calc__panel-section">
              <div class="fc-calc__panel">
                <h3 class="fc-calc__panel-heading">Свои продукты</h3>
                <p class="fc-calc__hint">Сохраняются в браузере и участвуют в поиске на «Главной».</p>
                <div class="fc-calc__bu-grid">
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-custom-name">Название</label>
                    <input type="text" id="fc-calc-bread-units-custom-name" name="name" required placeholder="напр. Йогурт домашний" />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-custom-carbs">Углеводы на 100 г, г</label>
                    <input type="number" id="fc-calc-bread-units-custom-carbs" name="carbs" inputmode="decimal" min="0" step="any" required placeholder="напр. 12" />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-custom-portion">Порция (необязательно)</label>
                    <input type="text" id="fc-calc-bread-units-custom-portion" name="portion" placeholder="напр. 150 г" />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-custom-gi">ГИ (необязательно)</label>
                    <input type="number" id="fc-calc-bread-units-custom-gi" name="gi" inputmode="numeric" min="0" step="1" placeholder="напр. 40" />
                  </div>
                </div>
                <p class="fc-calc__bu-custom-error" id="fc-calc-bread-units-custom-error" role="alert"></p>
                <div class="fc-calc__actions" style="margin-top:12px">
                  <button type="submit" class="fc-calc__btn">Добавить</button>
                </div>
                <p class="fc-calc__bu-empty" id="fc-calc-bread-units-custom-empty" style="margin-top:16px">Список пуст.</p>
                <ul class="fc-calc__bu-log" id="fc-calc-bread-units-custom-list" style="margin-top:12px"></ul>
              </div>
            </div>
          </form>
        </div>`;

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Калькулятор хлебных единиц (ХЕ)
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="bread-units">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Калькулятор хлебных единиц (ХЕ)</h2>
        <p class="fc-calc__hint">Расчёт ХЕ, дневник приёмов, база продуктов и свои позиции. Стандарт РФ/СНГ: 1 ХЕ = 12 г углеводов. Ориентир нормы — 18 ХЕ/сут.</p>
      </header>

      <div class="fc-calc__body">
${dayCard}
${renderTabs()}
${mainPanel}
${refPanel}
${customPanel}
        <span class="fc-calc__error" id="fc-calc-bread-units-form-error" role="alert"></span>
        <div class="fc-calc__bu-actions" id="fc-calc-bread-units-actions">
          <div class="fc-calc__bu-actions-secondary">
            <button type="button" id="fc-calc-bread-units-add-diary" class="fc-calc__bu-secondary fc-calc__bu-secondary--wide" disabled>В дневник</button>
            <button type="button" id="fc-calc-bread-units-save-custom" class="fc-calc__bu-secondary fc-calc__bu-secondary--wide" disabled>В свои продукты</button>
          </div>
          <div class="fc-calc__actions">
            <button type="button" id="fc-calc-bread-units-btn" class="fc-calc__btn fc-calc__btn--inactive" disabled>Рассчитать</button>
          </div>
        </div>
        <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-bread-units-result" aria-live="polite">
          <p class="fc-calc__result-label">Результат</p>
          <p class="fc-calc__result-number" id="fc-calc-bread-units-result-number">—</p>
          <p class="fc-calc__result-desc" id="fc-calc-bread-units-result-desc"></p>
          <div class="fc-calc__bu-result-extra" id="fc-calc-bread-units-result-extra"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Формула:</strong> ХЕ = (углеводы на 100 г × вес порции, г) ÷ (100 × стандарт).</p>
        <p>Стандарт РФ/СНГ: 1 ХЕ = 12 г углеводов. Упрощённый: 10 г. США/ВОЗ: 15 г.</p>
        <p>База продуктов и поиск используют стандарт <strong>12 г/ХЕ</strong>.</p>
        <p><strong>Ориентиры суточной нормы:</strong> сидячий образ жизни 15–18 ХЕ; умеренная активность 18–25 ХЕ; физический труд до 30 ХЕ. На один приём — обычно не более 7–8 ХЕ; перекус — 1–2 ХЕ. Полоса «норма» ориентирована на 18 ХЕ/сут.</p>
        <p><strong>ХЕ и инсулин (ориентир):</strong> 1 ХЕ повышает глюкозу примерно на 1,5–2 ммоль/л; на 1 ХЕ может потребоваться около 1–4 ЕД инсулина (индивидуально). Дозу согласовывают с эндокринологом.</p>
        <p><strong>Гликемический индекс:</strong> ГИ &lt;55 — низкий; 55–69 — средний; ≥70 — высокий.</p>
        <p>Дневник и свои продукты хранятся локально в браузере (localStorage).</p>
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
console.log('Built calculators/bread-units/index.html and widget.js');
