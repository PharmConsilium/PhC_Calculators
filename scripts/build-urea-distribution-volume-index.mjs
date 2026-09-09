#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'urea-distribution-volume');

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

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчёт объёма распределения мочевины
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="urea-distribution-volume">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">ОРМ по формуле Watson — оценка объёма общей воды организма (ОВО) для мужчин и женщин.</h2>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-urea-distribution-volume-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>
              <div class="fc-calc__udv-grid">
                <div class="fc-calc__field">
                  <label for="fc-calc-urea-distribution-volume-age">Возраст, лет</label>
                  <input
                    type="number"
                    id="fc-calc-urea-distribution-volume-age"
                    name="age"
                    inputmode="decimal"
                    min="0"
                    step="any"
                    placeholder="напр. 35"
                    required
                  />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-urea-distribution-volume-height">Рост, см</label>
                  <input
                    type="number"
                    id="fc-calc-urea-distribution-volume-height"
                    name="height"
                    inputmode="decimal"
                    min="0"
                    step="any"
                    placeholder="напр. 180"
                    required
                  />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-urea-distribution-volume-weight">Масса тела, кг</label>
                  <input
                    type="number"
                    id="fc-calc-urea-distribution-volume-weight"
                    name="weight"
                    inputmode="decimal"
                    min="0"
                    step="any"
                    placeholder="напр. 70"
                    required
                  />
                </div>
              </div>
              <span class="fc-calc__error" id="fc-calc-urea-distribution-volume-form-error" role="alert"></span>
            </div>
          </div>
        </form>

        <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-urea-distribution-volume-result" aria-live="polite">
          <p class="fc-calc__result-label">Результат</p>
          <div class="fc-calc__udv-metrics">
            <div class="fc-calc__udv-metric">
              <span class="fc-calc__udv-metric-label">ОРМ женщины</span>
              <span class="fc-calc__udv-metric-value" id="fc-calc-urea-distribution-volume-female">—</span>
            </div>
            <div class="fc-calc__udv-metric">
              <span class="fc-calc__udv-metric-label">ОРМ мужчины</span>
              <span class="fc-calc__udv-metric-value" id="fc-calc-urea-distribution-volume-male">—</span>
            </div>
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
        <p><strong>ОРМ (объём распределения мочевины)</strong> ≈ объём общей воды организма (ОВО / TBW). Используется при оценке дозы диализа (Kt/V) и в ряде клинических расчётов.</p>
        <p><strong>Мужчины:</strong> ОРМ (л) = 2,447 − 0,09516 × возраст (лет) + 0,1074 × рост (см) + 0,3362 × масса (кг).</p>
        <p><strong>Женщины:</strong> ОРМ (л) = −2,097 + 0,1069 × рост (см) + 0,2466 × масса (кг).</p>
        <p>Формулы получены у здоровых взрослых; при отёках, асците, ожирении, кахексии, беременности и острых сдвигах водного баланса точность снижается.</p>
        <p><strong>Источники:</strong></p>
        <ol>
          <li>Watson PE, Watson ID, Batt RD. Total body water volumes for adult males and females estimated from simple anthropometric measurements. Am J Clin Nutr. 1980;33(1):27-39.</li>
        </ol>
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
${script.trim()}
  </script>
</div>
`;

await writeFile(join(calcDir, 'index.html'), html, 'utf8');
console.log('Built calculators/urea-distribution-volume/index.html and widget.js');
