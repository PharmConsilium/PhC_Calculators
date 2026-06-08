#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NORMAL_AG, NORMAL_HCO3 } from '../calculators/anion-gap/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'anion-gap', 'extra.css'), 'utf8'),
]);

function renderIonField(id, label, symbol) {
  return `              <div class="fc-calc__field">
                <label for="fc-calc-anion-gap-${id}">${label} (${symbol})</label>
                <div class="fc-calc__field-row">
                  <input type="number" id="fc-calc-anion-gap-${id}" name="${id}" inputmode="decimal" step="any" required />
                  <select id="fc-calc-anion-gap-${id}-unit" name="${id}Unit" aria-label="Единица ${symbol}">
                    <option value="mEq/L" selected>mEq/L</option>
                    <option value="mmol/L">mmol/L</option>
                  </select>
                </div>
              </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Анионная разница (дельта-дельта градиент)
-->
<div class="fc-calc" data-calculator="anion-gap">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Анионная разница</h2>
        <p class="fc-calc__hint">Расчёт анионной разницы и дельта-дельта градиента по натрию, хлору и бикарбонату</p>
        <p class="fc-calc__formula"><strong>АР</strong> = Na − (Cl + HCO₃)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-anion-gap-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>
              <div class="fc-calc__ag-ion-grid">
${renderIonField('na', 'Натрий', 'Na')}
${renderIonField('cl', 'Хлор', 'Cl')}
${renderIonField('hco3', 'Бикарбонат', 'HCO₃')}
              </div>
              <div class="fc-calc__field" style="margin-top: 14px">
                <label for="fc-calc-anion-gap-decimals">Десятичная точность</label>
                <select id="fc-calc-anion-gap-decimals" name="decimals">
                  <option value="0">0</option>
                  <option value="1" selected>1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          </div>
          <span class="fc-calc__error" id="fc-calc-anion-gap-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-anion-gap-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-anion-gap-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-anion-gap-result" aria-live="polite">
        <p class="fc-calc__result-label">АР</p>
        <p class="fc-calc__result-number" id="fc-calc-anion-gap-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-anion-gap-result-desc"></p>
        <div class="fc-calc__ag-details fc-calc__ag-details--hidden" id="fc-calc-anion-gap-details"></div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Формулы:</strong></p>
        <ul>
          <li>АР = Na − (Cl + HCO₃)</li>
          <li>ΔАР = АР − ${NORMAL_AG} mEq/L</li>
          <li>ΔHCO₃ = ${NORMAL_HCO3} − HCO₃ mEq/L</li>
          <li>ΔΔ (дельта-дельта) = ΔАР − ΔHCO₃</li>
        </ul>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>ΔΔ</th>
                <th>Интерпретация</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>≈ 0 (от −6 до +6)</td>
                <td>Изолированный ацидоз с повышением АР</td>
              </tr>
              <tr>
                <td>&gt; +6</td>
                <td>Сопутствующая метаболическая алкалозная компонента</td>
              </tr>
              <tr>
                <td>&lt; −6</td>
                <td>Сопутствующая метаболическая ацидозная компонента без увеличения АР</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Нормальная анионная разница принимается ${NORMAL_AG} mEq/L, нормальный бикарбонат — ${NORMAL_HCO3} mEq/L.</p>
        <p class="fc-calc__hint">Источник: <a href="https://www.msdmanuals.com/ru/professional/searchresults?query=%D0%90%D0%BD%D0%B8%D0%BE%D0%BD%D0%BD%D0%B0%D1%8F%20%D1%80%D0%B0%D0%B7%D0%BD%D0%B8%D1%86%D0%B0" target="_blank" rel="noopener noreferrer">MSD Manuals</a></p>
        <p class="fc-calc__hint">Калькулятор для медицинских специалистов. Не заменяет клиническое решение врача.</p>
      </div>
    </details>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${(await readFile(join(root, 'calculators', 'anion-gap', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'anion-gap', 'index.html'), html, 'utf8');
console.log('Built calculators/anion-gap/index.html');
