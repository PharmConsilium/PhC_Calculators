#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA, formatPoints } from '../calculators/cha2ds2-va/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'cha2ds2-va');

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

function criterionField(criterion) {
  const stack = criterion.id === 'stroke';
  const optionsClass = stack
    ? 'fc-calc__cha-options fc-calc__cha-options--stack'
    : 'fc-calc__cha-options';
  const options = criterion.options
    .map((opt) => {
      const id = `fc-calc-cha2ds2-va-${criterion.id}-${opt.value}`;
      return `                  <label class="fc-calc__cha-option" for="${id}">
                    <input type="radio" id="${id}" name="fc-calc-cha2ds2-va-${criterion.id}" value="${opt.value}" />
                    <span class="fc-calc__cha-option-label">${opt.label}</span>
                    <span class="fc-calc__cha-option-points">${formatPoints(opt.points)}</span>
                  </label>`;
    })
    .join('\n');

  return `              <fieldset class="fc-calc__cha-criterion">
                <legend class="fc-calc__cha-legend">${criterion.label}</legend>
                <div class="${optionsClass}">
${options}
                </div>
              </fieldset>`;
}

const criteriaHtml = CRITERIA.map(criterionField).join('\n');

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: CHA₂DS₂-VA — оценка риска инсульта при фибрилляции предсердий
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="cha2ds2-va">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала оценивает риск ишемического инсульта и системной тромбоэмболии у пациентов с фибрилляцией предсердий.</h2>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-cha2ds2-va-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Факторы риска</h3>
              <div class="fc-calc__cha-criteria">
${criteriaHtml}
              </div>
            </div>
          </div>
          <span class="fc-calc__error" id="fc-calc-cha2ds2-va-form-error" role="alert"></span>
        </form>

        <div class="fc-calc__actions">
          <button type="submit" id="fc-calc-cha2ds2-va-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-cha2ds2-va-form" disabled>Рассчитать</button>
        </div>

        <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-cha2ds2-va-result" aria-live="polite">
          <p class="fc-calc__result-label">Показатель CHA₂DS₂-VA</p>
          <p class="fc-calc__result-number" id="fc-calc-cha2ds2-va-result-number">—</p>
          <p class="fc-calc__result-desc" id="fc-calc-cha2ds2-va-result-desc"></p>
          <div id="fc-calc-cha2ds2-va-result-extra"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Показатель CHA₂DS₂-VA — сумма баллов по факторам риска. Компонент пола (Sex category) из CHA₂DS₂-VASc не учитывается.</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Баллы</th>
                <th>Инсульт (на 100 пациенто-лет)</th>
                <th>Рекомендация</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>0</td><td>0,5</td><td>Антикоагулянтная терапия не рекомендуется</td></tr>
              <tr><td>1</td><td>1,5</td><td>Рассмотреть назначение антикоагулянтов</td></tr>
              <tr><td>2</td><td>2,9</td><td>Рекомендуется антикоагулянтная терапия</td></tr>
              <tr><td>3</td><td>5,1</td><td>Рекомендуется антикоагулянтная терапия</td></tr>
              <tr><td>4</td><td>7,3</td><td>Рекомендуется антикоагулянтная терапия</td></tr>
              <tr><td>5</td><td>11,2</td><td>Рекомендуется антикоагулянтная терапия</td></tr>
              <tr><td>6</td><td>15,5</td><td>Рекомендуется антикоагулянтная терапия</td></tr>
              <tr><td>7</td><td>14,7</td><td>Рекомендуется антикоагулянтная терапия</td></tr>
              <tr><td>8</td><td>19,5</td><td>Рекомендуется антикоагулянтная терапия</td></tr>
            </tbody>
          </table>
        </div>
        <p>Оценивайте риск тромбоэмболий вместе со шкалой кровотечения (например, HAS-BLED) и клинической ситуацией пациента. Переоценивайте риск инсульта периодически.</p>
        <p><strong>Источник</strong></p>
        <p>Champse A., Mobley A.R., Subramanian A. et al. Gender and contemporary risk of adverse events in atrial fibrillation. <em>Eur Heart J.</em> 2024;45(36):3707-3717.</p>
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
console.log('Built calculators/cha2ds2-va/index.html and widget.js');
