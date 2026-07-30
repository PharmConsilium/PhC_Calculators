#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALBUMINURIA_OPTIONS } from '../calculators/renal-function/calc.js';
import { buildRenalNotesHtml } from './snippets/renal-function-notes.mjs';

const TITLE =
  'Калькулятор оценки функции почек: CKD-EPIcr 2021, CKD-EPIcr-cys 2021, eGFR(BSAadj), Cockcroft-Gault, KDIGO-матрица риска, BSA, BMI';

const HEADLINE =
  'Расчёт СКФ и клиренса креатинина с корректировкой на BSA, ИМТ и оценкой риска по матрице KDIGO.';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'renal-function');
const notesHtml = buildRenalNotesHtml()
  .split('\n')
  .map((line) => (line ? `        ${line}` : ''))
  .join('\n');

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

const albuminuriaOptions = [
  '                  <option value="">Не выбрано</option>',
  ...ALBUMINURIA_OPTIONS.map(
    (o) =>
      `                  <option value="${o.id}">${o.label}: ${o.detail}</option>`
  ),
].join('\n');

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: ${TITLE}
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="renal-function">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">${HEADLINE}</h2>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-renal-function-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>
              <div class="fc-calc__rf-grid">
                <fieldset class="fc-calc__rf-fieldset">
                  <legend class="fc-calc__rf-fieldset-legend">Пол</legend>
                  <div class="fc-calc__rf-options">
                    <label class="fc-calc__rf-option" for="fc-calc-renal-function-gender-male">
                      <input type="radio" id="fc-calc-renal-function-gender-male" name="gender" value="male" checked />
                      <span>Мужской</span>
                    </label>
                    <label class="fc-calc__rf-option" for="fc-calc-renal-function-gender-female">
                      <input type="radio" id="fc-calc-renal-function-gender-female" name="gender" value="female" />
                      <span>Женский</span>
                    </label>
                  </div>
                </fieldset>

                <div class="fc-calc__field">
                  <label for="fc-calc-renal-function-age">Возраст, лет</label>
                  <input type="number" id="fc-calc-renal-function-age" name="age" inputmode="decimal" min="0" step="any" placeholder="напр. 45" required />
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-renal-function-creatinine">Креатинин</label>
                  <div class="fc-calc__rf-input-row">
                    <input type="number" id="fc-calc-renal-function-creatinine" name="creatinine" inputmode="decimal" min="0" step="any" placeholder="62–106" />
                    <select id="fc-calc-renal-function-creatinine-unit" name="creatinineUnit" aria-label="Единицы креатинина">
                      <option value="umol" selected>мкмоль/л</option>
                      <option value="mgdl">мг/дл</option>
                    </select>
                  </div>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-renal-function-weight">Вес, кг</label>
                  <input type="number" id="fc-calc-renal-function-weight" name="weightKg" inputmode="decimal" min="0" step="any" placeholder="напр. 70" />
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-renal-function-height">Рост, см</label>
                  <input type="number" id="fc-calc-renal-function-height" name="heightCm" inputmode="decimal" min="0" step="any" placeholder="напр. 170" />
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-renal-function-cystatin">Цистатин C, мг/л</label>
                  <input type="number" id="fc-calc-renal-function-cystatin" name="cystatin" inputmode="decimal" min="0" step="any" placeholder="0,50–0,96" />
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-renal-function-albuminuria">Альбуминурия</label>
                  <select id="fc-calc-renal-function-albuminuria" name="albuminuria">
${albuminuriaOptions}
                  </select>
                </div>
              </div>
              <span class="fc-calc__error" id="fc-calc-renal-function-form-error" role="alert"></span>
            </div>
          </div>
        </form>

        <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-renal-function-result" aria-live="polite">
          <p class="fc-calc__result-label">Результат</p>
          <div id="fc-calc-renal-function-result-body"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
${notesHtml}
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
console.log('Built calculators/renal-function/index.html and widget.js');
