#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_LIMITS } from '../calculators/fena/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'fena', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Фракционная экскреция натрия
-->
<div class="fc-calc" data-calculator="fena">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Фракционная экскреция натрия</h2>
        <p class="fc-calc__hint">Расчёт FENa для дифференциальной диагностики типа олигурии при остром повреждении почек</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-fena-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Лабораторные показатели</h3>

              <div class="fc-calc__fena-grid">
                <div class="fc-calc__field">
                  <label for="fc-calc-fena-serum-na">Натрий сыворотки (SNa), ммоль/л</label>
                  <input type="number" id="fc-calc-fena-serum-na" name="serumNa" inputmode="decimal" min="${FIELD_LIMITS.serumNa.min}" max="${FIELD_LIMITS.serumNa.max}" step="any" required />
                  <span class="fc-calc__error" id="fc-calc-fena-serum-na-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-fena-serum-cr">Креатинин сыворотки (SCr), мкмоль/л</label>
                  <input type="number" id="fc-calc-fena-serum-cr" name="serumCr" inputmode="decimal" min="${FIELD_LIMITS.serumCr.min}" max="${FIELD_LIMITS.serumCr.max}" step="any" required />
                  <span class="fc-calc__error" id="fc-calc-fena-serum-cr-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-fena-urine-na">Натрий мочи (UNa), ммоль/л</label>
                  <input type="number" id="fc-calc-fena-urine-na" name="urineNa" inputmode="decimal" min="${FIELD_LIMITS.urineNa.min}" max="${FIELD_LIMITS.urineNa.max}" step="any" required />
                  <span class="fc-calc__error" id="fc-calc-fena-urine-na-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-fena-urine-cr">Креатинин мочи (UCr), мкмоль/л</label>
                  <input type="number" id="fc-calc-fena-urine-cr" name="urineCr" inputmode="decimal" min="${FIELD_LIMITS.urineCr.min}" max="${FIELD_LIMITS.urineCr.max}" step="any" required />
                  <span class="fc-calc__error" id="fc-calc-fena-urine-cr-error" role="alert"></span>
                </div>
              </div>

              <span class="fc-calc__error" id="fc-calc-fena-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-fena-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-fena-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-fena-result" aria-live="polite">
        <div class="fc-calc__fena-result">
          <p class="fc-calc__fena-result-title">Результат</p>
          <div id="fc-calc-fena-result-body"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <div class="fc-calc__formula fc-calc__fena-formula-note">
          <p class="fc-calc__formula-eq"><strong>FENa</strong>, % = 100 × (SCr × UNa) / (SNa × UCr)</p>
          <ul class="fc-calc__formula-legend">
            <li><strong>SCr</strong> — креатинин сыворотки, мкмоль/л</li>
            <li><strong>UNa</strong> — натрий мочи, ммоль/л</li>
            <li><strong>SNa</strong> — натрий сыворотки, ммоль/л</li>
            <li><strong>UCr</strong> — креатинин мочи, мкмоль/л</li>
          </ul>
        </div>
        <div class="fc-calc__fena-table-wrap">
          <div class="fc-calc__table-wrap">
            <table class="fc-calc__table">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">Преренальная</th>
                  <th scope="col">Почечная</th>
                  <th scope="col">Постренальная</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">FENa, %</th>
                  <td>&lt; 1</td>
                  <td>1–4</td>
                  <td>&gt; 4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p>FENa клинически достоверен для пациентов с олигурией и острым повреждением почек, <strong>не включая</strong>: применение диуретиков, хронические заболевания почек, обструкцию мочевыводящих путей, острые гломерулярные заболевания.</p>
        <p>Использование только концентрации натрия в моче менее точно, так как не учитываются объём мочи и регуляция гидробаланса антидиуретическим гормоном.</p>
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
${(await readFile(join(root, 'calculators', 'fena', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'fena', 'index.html'), html, 'utf8');
console.log('Built calculators/fena/index.html');
