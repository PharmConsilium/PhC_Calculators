#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'mkb10';
const calcDir = join(root, 'calculators', slug);

const iconFiles = {
  INFECTIOUS: 'infectious.png',
  NEOPLASMS: 'neoplasms.png',
  BLOOD: 'blood.png',
  ENDOCRINE: 'endocrine.png',
  MENTAL: 'mental.png',
  NERVOUS: 'nervous.png',
  EYE: 'eye.png',
  EAR: 'ear.png',
  HEART: 'heart.png',
  LUNGS: 'lungs.png',
  DIGESTIVE: 'digestive.png',
  SKIN: 'skin.png',
  MUSCULO: 'musculo.png',
  KIDNEY: 'kidney.png',
  PREGNANCY: 'pregnancy.png',
  PERINATAL: 'perinatal.png',
  CONGENITAL: 'congenital.png',
  SYMPTOMS: 'symptoms.png',
  INJURY: 'injury.png',
  EXTERNAL: 'external.png',
  FACTORS: 'factors.png',
  SPECIAL: 'special.png',
};

const [css, extra, widgetSrc, calcSrc, dataB64, ...iconBuffers] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(calcDir, 'extra.css'), 'utf8'),
  readFile(join(calcDir, 'widget.js'), 'utf8'),
  readFile(join(calcDir, 'calc.js'), 'utf8'),
  readFile(join(calcDir, 'data.gz.b64'), 'utf8'),
  ...Object.values(iconFiles).map((name) => readFile(join(calcDir, 'icons', name))),
]);

const calcBrowser = calcSrc
  .replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '')
  .replace(/^export\s+/gm, '')
  .replace(/^\/\*\* @typedef[\s\S]*?\*\/\s*$/gm, '')
  .trim();

let widget = widgetSrc
  .replace('/* __MKB_CALC__ */', calcBrowser)
  .replaceAll('__MKB_DATA_B64__', dataB64.trim());

Object.keys(iconFiles).forEach((key, i) => {
  const src = `data:image/png;base64,${iconBuffers[i].toString('base64')}`;
  widget = widget.replaceAll(`__MKB_ICON_${key}__`, src);
});

for (const ph of ['__MKB_DATA_B64__', ...Object.keys(iconFiles).map((k) => `__MKB_ICON_${k}__`)]) {
  if (widget.includes(ph)) {
    throw new Error(`Build failed: placeholder ${ph} was not replaced`);
  }
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: МКБ-10 — международная классификация болезней
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">МКБ-10</h2>
        <p class="fc-calc__hint">Поиск по коду и названию</p>
      </header>

      <div class="fc-calc__body">
        <div class="fc-calc__panel-section">
          <div class="fc-calc__panel">
            <h3 class="fc-calc__panel-heading">Поиск</h3>
            <div class="fc-calc__mkb-search-row">
              <div class="fc-calc__field">
                <label for="fc-calc-${slug}-search">Код или название болезни</label>
                <input
                  type="search"
                  id="fc-calc-${slug}-search"
                  name="search"
                  placeholder="A00 · холера · сахарный диабет"
                  autocomplete="off"
                  disabled
                />
              </div>
              <button type="button" class="fc-calc__mkb-clear" id="fc-calc-${slug}-clear" hidden>Сбросить</button>
            </div>
          </div>
        </div>

        <div class="fc-calc__mkb-layout">
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <div class="fc-calc__mkb-panel-head">
                <div class="fc-calc__mkb-panel-head-row">
                  <h3 class="fc-calc__panel-heading" id="fc-calc-${slug}-list-title">Классы МКБ-10</h3>
                  <span class="fc-calc__mkb-count" id="fc-calc-${slug}-list-count"></span>
                </div>
                <ul class="fc-calc__mkb-crumbs fc-calc__mkb-crumbs--list" id="fc-calc-${slug}-list-crumbs" hidden></ul>
              </div>
              <div id="fc-calc-${slug}-browse" class="fc-calc__mkb-browse"></div>
              <div id="fc-calc-${slug}-search-results" class="fc-calc__mkb-search-panel" hidden>
                <div id="fc-calc-${slug}-search-list"></div>
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel fc-calc__mkb-card-panel">
              <h3 class="fc-calc__panel-heading">Карточка</h3>
              <div id="fc-calc-${slug}-placeholder" class="fc-calc__mkb-placeholder">
                <strong>Выберите код</strong> в списке или найдите его через поиск — здесь появятся название, путь в классификации и пояснения.
              </div>
              <div id="fc-calc-${slug}-card-body" class="fc-calc__mkb-card-body" hidden>
                <span class="fc-calc__mkb-level" id="fc-calc-${slug}-card-level"></span>
                <p class="fc-calc__mkb-card-code" id="fc-calc-${slug}-card-code"></p>
                <p class="fc-calc__mkb-card-name" id="fc-calc-${slug}-card-name"></p>
                <p class="fc-calc__mkb-section-label">Путь в классификации</p>
                <ul class="fc-calc__mkb-crumbs" id="fc-calc-${slug}-crumbs"></ul>
                <div class="fc-calc__mkb-actions">
                  <button type="button" class="fc-calc__mkb-action" id="fc-calc-${slug}-show-tree" hidden>
                    Показать в дереве
                  </button>
                </div>
                <p class="fc-calc__mkb-section-label" id="fc-calc-${slug}-info-label" hidden>Пояснения</p>
                <pre class="fc-calc__mkb-info" id="fc-calc-${slug}-info" hidden></pre>
                <div id="fc-calc-${slug}-kids-wrap" hidden>
                  <p class="fc-calc__mkb-subheads" id="fc-calc-${slug}-kids-title">Дочерние коды</p>
                  <ul class="fc-calc__mkb-sublist" id="fc-calc-${slug}-kids"></ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes" id="fc-calc-${slug}-notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Справочник МКБ-10: поиск по коду или названию и просмотр иерархии (класс → блок → рубрика → подрубрика).</p>
        <p>Один и тот же код может встречаться несколько раз — ориентируйтесь на полный путь в карточке.</p>
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

await writeFile(join(calcDir, 'index.html'), html, 'utf8');
console.log(`Built calculators/${slug}/index.html (${Math.round(html.length / 1024)} KB)`);
