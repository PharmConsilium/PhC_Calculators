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
  { id: 'main', label: 'Ввод данных' },
  { id: 'ref', label: 'Список продуктов и блюд' },
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
              <span class="fc-calc__bu-stat-value" id="fc-calc-bread-units-day-count">0</span>
              <span class="fc-calc__bu-stat-label">Продуктов</span>
            </div>
            <div class="fc-calc__bu-stat">
              <span class="fc-calc__bu-stat-value" id="fc-calc-bread-units-day-carbs">0</span>
              <span class="fc-calc__bu-stat-label">Углеводов г.</span>
            </div>
            <div class="fc-calc__bu-stat">
              <span class="fc-calc__bu-stat-value" id="fc-calc-bread-units-day-he">0,0</span>
              <span class="fc-calc__bu-stat-label">ХЕ</span>
            </div>
            <div class="fc-calc__bu-stat">
              <span class="fc-calc__bu-stat-value" id="fc-calc-bread-units-day-insulin-stat">0,0</span>
              <span class="fc-calc__bu-stat-label">Инсулин короткого/ультракороткого действия, ЕД</span>
            </div>
          </div>
        </div>`;

const mainPanel = `        <div
          class="fc-calc__tab-panel fc-calc__tab-panel--active"
          data-mode="main"
          role="tabpanel"
          id="fc-calc-bread-units-panel-main"
          aria-labelledby="fc-calc-bread-units-tab-main"
        >
          <form class="fc-calc__form" id="fc-calc-bread-units-form-main" novalidate>
            <div class="fc-calc__panel-section">
              <div class="fc-calc__panel">
                <div class="fc-calc__bu-grid">
                  <div class="fc-calc__field fc-calc__bu-search-wrap">
                    <label for="fc-calc-bread-units-name">Название продукта или блюда</label>
                    <input type="text" id="fc-calc-bread-units-name" name="productName" autocomplete="off" placeholder="Начните вводить — подсказки из базы" />
                    <ul class="fc-calc__bu-hits" id="fc-calc-bread-units-hits" hidden></ul>
                    <p class="fc-calc__bu-empty" id="fc-calc-bread-units-search-empty" hidden></p>
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-carbs">Углеводы на 100 г. Введите данные с упаковки</label>
                    <input type="number" id="fc-calc-bread-units-carbs" name="carbsPer100" inputmode="decimal" min="0" step="any" placeholder="напр. 50" required />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-portion">Вес порции, г.</label>
                    <input type="number" id="fc-calc-bread-units-portion" name="portionG" inputmode="decimal" min="0" step="any" placeholder="напр. 25" required />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-bread-units-standard">Стандарт 1 ХЕ</label>
                    <select id="fc-calc-bread-units-standard" name="standard">
${standardOptions}
                    </select>
                  </div>
                </div>
                <span class="fc-calc__error" id="fc-calc-bread-units-form-error" role="alert"></span>
                <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-bread-units-result" aria-live="polite">
                  <p class="fc-calc__result-label">Результат</p>
                  <p class="fc-calc__result-number" id="fc-calc-bread-units-result-number">—</p>
                  <p class="fc-calc__result-desc" id="fc-calc-bread-units-result-desc"></p>
                  <div class="fc-calc__bu-result-extra" id="fc-calc-bread-units-result-extra"></div>
                </div>
                <div class="fc-calc__bu-actions" id="fc-calc-bread-units-actions">
                  <button type="button" id="fc-calc-bread-units-add-diary" class="fc-calc__bu-secondary fc-calc__bu-secondary--wide" disabled>Добавить в рацион дня</button>
                </div>
              </div>
            </div>
          </form>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel fc-calc__panel--diary">
              <h3 class="fc-calc__panel-heading">Рацион дня</h3>
              <div class="fc-calc__bu-meal-tabs" id="fc-calc-bread-units-meal-tabs"></div>
              <p class="fc-calc__bu-empty" id="fc-calc-bread-units-log-empty">Список пуст. Заполните данные выше и нажмите «Добавить в рацион дня».</p>
              <ul class="fc-calc__bu-log" id="fc-calc-bread-units-log"></ul>
              <div class="fc-calc__bu-meal-totals" id="fc-calc-bread-units-meal-totals"></div>
              <div class="fc-calc__bu-row-actions">
                <button type="button" class="fc-calc__bu-secondary" id="fc-calc-bread-units-clear-day" disabled>Удалить данные</button>
              </div>
${dayCard}
            </div>
          </div>
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
              <h3 class="fc-calc__panel-heading">Список продуктов и блюд (800+)</h3>
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

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Сколько хлебных единиц в рационе, калькулятор хлебных единиц (ХЕ)
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
        <p class="fc-calc__hint">Онлайн‑калькулятор для людей с сахарным диабетом 1 и 2 типа, который помогает быстро рассчитать количество хлебных единиц (ХЕ) и углеводов в продуктах и готовых блюдах, а также рассчитает ориентировочную дозу ультракороткого инсулина по вашему углеводному коэффициенту (по назначению врача)</p>
      </header>

      <div class="fc-calc__body">
${renderTabs()}
${mainPanel}
${refPanel}
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
        <p><strong>Ориентиры рациона дня:</strong></p>
        <ul>
          <li>сидячий образ жизни 15–18 ХЕ;</li>
          <li>умеренная активность 18–25 ХЕ;</li>
          <li>физический труд до 30 ХЕ;</li>
          <li>на один приём — обычно не более 7–8 ХЕ;</li>
          <li>перекус — 1–2 ХЕ.</li>
        </ul>
        <p><strong>Углеводный коэффициент</strong> — это количество единиц инсулина короткого или ультракороткого действия, которое необходимо ввести на усвоение одной хлебной единицы (ХЕ) или определённого количества углеводов (обычно 10–12 г). Универсальной нормы не существует. Для каждого человека это значение подбирается индивидуально и меняется в зависимости от времени суток, физической активности и чувствительности к гормону. В среднем для взрослых людей со средним весом этот показатель составляет 1–2 единицы инсулина на одну ХЕ.</p>
        <p>Потребность в инсулине колеблется из-за циркадных ритмов и концентрации контринсулярных гормонов (например, кортизола и гормона роста), уровень которых максимален в утренние часы. Стандартное распределение выглядит так:</p>
        <ul>
          <li><strong>Завтрак:</strong> коэффициент самый высокий. На 1 ХЕ может требоваться 2 единицы инсулина, так как организм утром более устойчив к его действию.</li>
          <li><strong>Обед:</strong> потребность обычно снижается. На 1 ХЕ уходит около 1,25 единицы инсулина.</li>
          <li><strong>Ужин:</strong> чувствительность к инсулину возрастает. На 1 ХЕ требуется меньше всего — порядка 0,75 единицы инсулина.</li>
        </ul>
        <p>В калькуляторе по умолчанию: завтрак 2; обед 1,25; ужин 0,75; перекус 1. Коэффициенты можно изменить вручную, данные расчётов должны контролироваться и согласовываться с лечащим врачом.</p>
        <p><strong>Гликемический индекс:</strong> ГИ &lt;55 — низкий; 55–69 — средний; ≥70 — высокий.</p>
        <p><strong>Источники:</strong></p>
        <ol>
          <li>DAFNE Study Group. Training in flexible, intensive insulin management to enable dietary freedom in people with type 1 diabetes: dose adjustment for normal eating (DAFNE) randomised controlled trial. BMJ. 2002 Oct 5;325(7367):746. PMID: <a href="https://pubmed.ncbi.nlm.nih.gov/12364303/" target="_blank" rel="noopener noreferrer">12364303</a>. DOI: <a href="https://doi.org/10.1136/bmj.325.7367.746" target="_blank" rel="noopener noreferrer">10.1136/bmj.325.7367.746</a>.</li>
          <li>American Diabetes Association Professional Practice Committee. 9. Pharmacologic Approaches to Glycemic Treatment: Standards of Care in Diabetes—2026. Diabetes Care. 2026 Jan;49(Suppl 1):S120–S142. PMID: <a href="https://pubmed.ncbi.nlm.nih.gov/41358900/" target="_blank" rel="noopener noreferrer">41358900</a>. DOI: <a href="https://doi.org/10.2337/dc26-S009" target="_blank" rel="noopener noreferrer">10.2337/dc26-S009</a>.</li>
          <li>Dedov II, Shestakova MV, Sukhareva OY, et al. Standards of specialized diabetes care. 12th ed. Diabetes Mellitus. 2025;28(1S):1–182. DOI: <a href="https://doi.org/10.14341/DM13419" target="_blank" rel="noopener noreferrer">10.14341/DM13419</a>.</li>
        </ol>
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
