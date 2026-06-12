#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URR_ADEQUATE_MIN, FIELD_LIMITS } from '../calculators/dialysis-urea-reduction/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'dialysis-urea-reduction', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Процент снижения мочевины при гемодиализе
-->
<div class="fc-calc" data-calculator="dialysis-urea-reduction">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Процент снижения мочевины при гемодиализе</h2>
        <p class="fc-calc__hint">Расчёт ПРМ (URR) — доли снижения мочевины за сеанс гемодиализа</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-dialysis-urea-reduction-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__field">
                <label for="fc-calc-dialysis-urea-reduction-pre">Мочевина до ГД</label>
                <div class="fc-calc__dur-input-row">
                  <input type="number" id="fc-calc-dialysis-urea-reduction-pre" name="ureaPre" inputmode="decimal" min="${FIELD_LIMITS.mmolL.min}" max="${FIELD_LIMITS.mmolL.max}" step="any" />
                  <select name="ureaPreUnit" aria-label="Единицы мочевины до ГД">
                    <option value="mmolL" selected>ммоль/л</option>
                    <option value="mgdl">мг/дл</option>
                  </select>
                </div>
                <span class="fc-calc__error" id="fc-calc-dialysis-urea-reduction-pre-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-dialysis-urea-reduction-post">Мочевина после ГД</label>
                <div class="fc-calc__dur-input-row">
                  <input type="number" id="fc-calc-dialysis-urea-reduction-post" name="ureaPost" inputmode="decimal" min="${FIELD_LIMITS.mmolL.min}" max="${FIELD_LIMITS.mmolL.max}" step="any" />
                  <select name="ureaPostUnit" aria-label="Единицы мочевины после ГД">
                    <option value="mmolL" selected>ммоль/л</option>
                    <option value="mgdl">мг/дл</option>
                  </select>
                </div>
                <span class="fc-calc__error" id="fc-calc-dialysis-urea-reduction-post-error" role="alert"></span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__result-wrap" aria-live="polite">
        <div class="fc-calc__panel-section">
          <div class="fc-calc__panel">
            <h3 class="fc-calc__panel-heading">Результат</h3>
            <div class="fc-calc__field">
              <label for="fc-calc-dialysis-urea-reduction-prm">ПРМ</label>
              <div class="fc-calc__dur-result-row">
                <div class="fc-calc__dur-result-value fc-calc__dur-result-value--empty" id="fc-calc-dialysis-urea-reduction-prm">—</div>
                <span class="fc-calc__dur-unit--fixed">%</span>
              </div>
              <p class="fc-calc__dur-result-note" id="fc-calc-dialysis-urea-reduction-note"></p>
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
        <div class="fc-calc__formula fc-calc__dur-formula-note">
          <p class="fc-calc__formula-eq"><strong>ПРМ</strong> = 100 × (мочевина до ГД − мочевина после ГД) / мочевина до ГД</p>
          <ul class="fc-calc__formula-legend">
            <li>ПРМ (URR) — процент (доля) снижения мочевины за сеанс гемодиализа</li>
            <li>обе концентрации должны быть в одинаковых единицах (ммоль/л или мг/дл)</li>
          </ul>
        </div>
        <p><strong>Интерпретация:</strong> ПРМ ≥ ${URR_ADEQUATE_MIN} % считается достаточным процентом снижения мочевины (адекватность сеанса гемодиализа по этому показателю).</p>
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
${(await readFile(join(root, 'calculators', 'dialysis-urea-reduction', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'dialysis-urea-reduction', 'index.html'), html, 'utf8');
console.log('Built calculators/dialysis-urea-reduction/index.html');
