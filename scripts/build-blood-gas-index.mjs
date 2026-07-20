#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFS } from '../calculators/blood-gas/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'blood-gas');

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

function field(name, label) {
  const ref = REFS[name];
  return `                <div class="fc-calc__field">
                  <label for="fc-calc-blood-gas-${name}">${label}</label>
                  <input type="number" id="fc-calc-blood-gas-${name}" name="${name}" inputmode="decimal" step="any" placeholder="${ref.label}" />
                </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Интерпретация кислотно-щелочного баланса и метаболических параметров по газам артериальной крови, электролитам и гемоглобину
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="blood-gas">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Интерпретация кислотно-щелочного баланса и метаболических параметров по газам артериальной крови, электролитам и гемоглобину</h2>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-blood-gas-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Артериальные газы</h3>
              <div class="fc-calc__bg-fields">
${field('ph', 'pH')}
${field('paco2', 'PaCO₂, мм рт.ст.')}
${field('hco3', 'HCO₃⁻, ммоль/л')}
${field('pao2', 'PaO₂, мм рт.ст.')}
${field('be', 'BE (избыток оснований)')}
${field('sato2', 'SatO₂, %')}
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Электролиты</h3>
              <div class="fc-calc__bg-fields">
${field('na', 'Натрий (Na⁺)')}
${field('k', 'Калий (K⁺)')}
${field('cl', 'Хлор (Cl⁻)')}
${field('ca', 'Кальций (Ca²⁺)')}
${field('mg', 'Магний (Mg²⁺)')}
${field('lactate', 'Лактат, ммоль/л')}
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Гемоглобин и фракции</h3>
              <div class="fc-calc__bg-fields">
${field('hb', 'Гемоглобин (Hb), г/л')}
${field('ht', 'Гематокрит (Ht), %')}
${field('cohb', 'Карбоксигемоглобин (COHb), %')}
${field('methb', 'Метгемоглобин (MetHb), %')}
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-blood-gas-form-error" role="alert"></span>
        </form>

        <div class="fc-calc__actions">
          <button type="submit" id="fc-calc-blood-gas-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-blood-gas-form" disabled>Рассчитать</button>
          <button type="button" id="fc-calc-blood-gas-reset" class="fc-calc__btn fc-calc__btn--secondary">Сброс</button>
        </div>

        <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-blood-gas-result" aria-live="polite">
          <div class="fc-calc__bg-result">
            <p class="fc-calc__result-label">Кислотно-щелочной диагноз</p>
            <p class="fc-calc__result-number" id="fc-calc-blood-gas-diagnosis">—</p>
            <p class="fc-calc__result-desc" id="fc-calc-blood-gas-compensation"></p>
            <div class="fc-calc__bg-result-lines" id="fc-calc-blood-gas-result-lines"></div>
            <p class="fc-calc__bg-result-line" id="fc-calc-blood-gas-summary"></p>
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
        <p>Для базовой интерпретации обязательны <strong>pH</strong>, <strong>PaCO₂</strong> и <strong>HCO₃⁻</strong>. Остальные показатели уточняют анионный разрыв, оксигенацию, лактат и гемоглобин.</p>
        <p><strong>Референсы КЩС:</strong> pH 7,35–7,45; PaCO₂ 35–45 мм рт.ст.; HCO₃⁻ 22–26 ммоль/л.</p>
        <ul>
          <li>pH &lt; 7,35 — ацидемия; pH &gt; 7,45 — алкалемия.</li>
          <li>Первичный респираторный процесс — изменение PaCO₂ в направлении, объясняющем сдвиг pH.</li>
          <li>Первичный метаболический процесс — изменение HCO₃⁻ в направлении, объясняющем сдвиг pH.</li>
          <li>Частичная компенсация — вторичное изменение «противоположного» компонента при ещё нарушенном pH.</li>
          <li>Анионный разрыв = Na⁺ − (Cl⁻ + HCO₃⁻); повышен при &gt; 12 ммоль/л.</li>
          <li>Оксигенация: нормоксемия (PaO₂ ≥ 80 / SatO₂ ≥ 95%); лёгкая гипоксемия (PaO₂ 60–79 / SatO₂ 90–94%); умеренная (PaO₂ 40–59 / SatO₂ 75–89%); тяжёлая (PaO₂ &lt; 40 / SatO₂ &lt; 75%). При обоих показателях берётся более тяжёлая степень.</li>
        </ul>
        <p><strong>Источники</strong></p>
        <ol>
          <li>Hinkle J.L., Cheever K.H. Brunner &amp; Suddarth's Textbook of Medical-Surgical Nursing. 15th ed. Wolters Kluwer; 2021.</li>
          <li>Kauffmann R., et al. Arterial Blood Gas Interpretation. StatPearls Publishing; 2023.</li>
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
console.log('Built calculators/blood-gas/index.html and widget.js');
