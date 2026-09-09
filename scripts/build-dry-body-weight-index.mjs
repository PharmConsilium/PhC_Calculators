#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'dry-body-weight');

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
  Название: Калькулятор сухой вес тела
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="dry-body-weight">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Оценка сухого веса тела (СМТ) по росту для мужчин и женщин (формула Burton).</h2>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-dry-body-weight-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <fieldset class="fc-calc__dbw-fieldset">
                <legend class="fc-calc__dbw-fieldset-legend">Пол</legend>
                <div class="fc-calc__dbw-options">
                  <label class="fc-calc__dbw-option" for="fc-calc-dry-body-weight-sex-male">
                    <input type="radio" id="fc-calc-dry-body-weight-sex-male" name="sex" value="male" checked />
                    <span class="fc-calc__dbw-option-label">Мужской</span>
                  </label>
                  <label class="fc-calc__dbw-option" for="fc-calc-dry-body-weight-sex-female">
                    <input type="radio" id="fc-calc-dry-body-weight-sex-female" name="sex" value="female" />
                    <span class="fc-calc__dbw-option-label">Женский</span>
                  </label>
                </div>
              </fieldset>

              <div class="fc-calc__field">
                <label for="fc-calc-dry-body-weight-height">Рост, см</label>
                <input
                  type="number"
                  id="fc-calc-dry-body-weight-height"
                  name="height"
                  inputmode="decimal"
                  min="0"
                  step="any"
                  placeholder="напр. 180"
                  required
                />
              </div>

              <span class="fc-calc__error" id="fc-calc-dry-body-weight-form-error" role="alert"></span>
            </div>
          </div>
        </form>

        <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-dry-body-weight-result" aria-live="polite">
          <p class="fc-calc__result-label">СМТ (сухой вес тела)</p>
          <p class="fc-calc__result-number" id="fc-calc-dry-body-weight-result-number">—</p>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>СМТ (сухой вес тела / lean body weight)</strong> — ориентировочная оценка безжировой массы по росту; используется в ряде фармакокинетических расчётов (в т.ч. дозирование).</p>
        <p><strong>Мужчины:</strong> СМТ (кг) = 0,73 × рост (см) − 59,42.</p>
        <p><strong>Женщины:</strong> СМТ (кг) = 0,65 × рост (см) − 50,74.</p>
        <p>Формула опирается только на рост и пол; не заменяет клиническую оценку «сухого веса» у пациентов на гемодиализе.</p>
        <p><strong>Источники:</strong></p>
        <ol>
          <li>Burton ME, Chow MS, Platt DR, et al. Accuracy of Bayesian and Sawchuk-Zaske dosing methods for gentamicin. Clin Pharm. 1986 Feb;5(2):143-9.</li>
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
console.log('Built calculators/dry-body-weight/index.html and widget.js');
