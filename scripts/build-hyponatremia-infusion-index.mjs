#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_NA_CHANGE_PER_HOUR,
  DEFAULT_IV_K,
  FIELD_LIMITS,
  WATER_FRACTIONS,
  IV_NA_SOLUTIONS,
} from '../calculators/hyponatremia-infusion/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'hyponatremia-infusion', 'extra.css'), 'utf8'),
]);

function renderWaterFractionRadios() {
  return WATER_FRACTIONS.map(
    (item, i) => `                <label class="fc-calc__hna-radio-option">
                  <input type="radio" name="waterFraction" value="${item.id}"${i === 1 ? ' checked' : ''} required />
                  <span>${item.label} (${String(item.value).replace('.', ',')})</span>
                </label>`
  ).join('\n');
}

function renderIvNaRadios() {
  return IV_NA_SOLUTIONS.map(
    (item, i) => `                <label class="fc-calc__hna-radio-option">
                  <input type="radio" name="ivSolution" value="${item.id}"${i === 2 ? ' checked' : ''} required />
                  <span>${item.label} (${item.naMeqL})</span>
                </label>`
  ).join('\n');
}

function renderWaterFractionTable() {
  const rows = WATER_FRACTIONS.map(
    (item) => `              <tr>
                <th scope="row">${item.label}</th>
                <td>${String(item.value).replace('.', ',')}</td>
              </tr>`
  ).join('\n');
  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th scope="col">Категория</th>
                <th scope="col">Водная фракция</th>
              </tr>
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>`;
}

function renderIvNaTable() {
  const rows = IV_NA_SOLUTIONS.map(
    (item) => `              <tr>
                <th scope="row">${item.label}</th>
                <td>${item.naMeqL} ммоль/л</td>
              </tr>`
  ).join('\n');
  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th scope="col">Раствор</th>
                <th scope="col">Na⁺</th>
              </tr>
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Коррекция нормы инфузии при гипонатриемии
-->
<div class="fc-calc" data-calculator="hyponatremia-infusion">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Коррекция нормы инфузии при гипонатриемии</h2>
        <p class="fc-calc__hint">Расчёт скорости инфузии и изменения натрия сыворотки на литр инфузата по формулам Adrogue–Madias</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-hyponatremia-infusion-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__field">
                <label for="fc-calc-hyponatremia-infusion-na-change">Изменение сывороточного Na в час</label>
                <div class="fc-calc__hna-input-row">
                  <input type="number" id="fc-calc-hyponatremia-infusion-na-change" name="naChangePerHour" inputmode="decimal" min="${FIELD_LIMITS.naChangePerHour.min}" max="${FIELD_LIMITS.naChangePerHour.max}" step="any" value="${DEFAULT_NA_CHANGE_PER_HOUR}" required />
                  <span class="fc-calc__hna-unit--fixed">ммоль/л/ч</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-hyponatremia-infusion-na-change-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-hyponatremia-infusion-serum-na">Сывороточный Na</label>
                <div class="fc-calc__hna-input-row">
                  <input type="number" id="fc-calc-hyponatremia-infusion-serum-na" name="serumNa" inputmode="decimal" min="${FIELD_LIMITS.serumNa.min}" max="${FIELD_LIMITS.serumNa.max}" step="any" required />
                  <span class="fc-calc__hna-unit--fixed">ммоль/л</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-hyponatremia-infusion-serum-na-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label>Водная фракция</label>
                <div class="fc-calc__hna-radio fc-calc__hna-radio--water" role="radiogroup" aria-label="Водная фракция">
${renderWaterFractionRadios()}
                </div>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-hyponatremia-infusion-weight">Масса тела</label>
                <div class="fc-calc__hna-input-row">
                  <input type="number" id="fc-calc-hyponatremia-infusion-weight" name="weight" inputmode="decimal" min="${FIELD_LIMITS.weight.min}" max="${FIELD_LIMITS.weight.max}" step="any" required />
                  <span class="fc-calc__hna-unit--fixed">кг</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-hyponatremia-infusion-weight-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label>В/в Na</label>
                <div class="fc-calc__hna-radio" role="radiogroup" aria-label="Внутривенный натрий">
${renderIvNaRadios()}
                </div>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-hyponatremia-infusion-iv-k">В/в K</label>
                <div class="fc-calc__hna-input-row">
                  <input type="number" id="fc-calc-hyponatremia-infusion-iv-k" name="ivK" inputmode="decimal" min="${FIELD_LIMITS.ivK.min}" max="${FIELD_LIMITS.ivK.max}" step="any" value="${DEFAULT_IV_K}" required />
                  <span class="fc-calc__hna-unit--fixed">ммоль/л</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-hyponatremia-infusion-iv-k-error" role="alert"></span>
              </div>

              <span class="fc-calc__error" id="fc-calc-hyponatremia-infusion-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-hyponatremia-infusion-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-hyponatremia-infusion-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-hyponatremia-infusion-result" aria-live="polite">
        <div class="fc-calc__hna-result">
          <p class="fc-calc__hna-result-title">Результаты</p>
          <div id="fc-calc-hyponatremia-infusion-result-body"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <div class="fc-calc__formula fc-calc__hna-formula-note">
          <p class="fc-calc__formula-eq"><strong>Скорость инфузии</strong> = (1000 × ΔNa/ч × (TBW + 1)) / (Na<sub>инф</sub> + K<sub>инф</sub> − Na<sub>сер</sub>)</p>
          <p class="fc-calc__formula-eq"><strong>ΔNa на литр</strong> = (Na<sub>инф</sub> + K<sub>инф</sub> − Na<sub>сер</sub>) / (TBW + 1)</p>
          <ul class="fc-calc__formula-legend">
            <li><strong>TBW</strong> = водная фракция × масса тела, л</li>
            <li><strong>ΔNa/ч</strong> — целевое изменение натрия сыворотки в час, ммоль/л/ч</li>
          </ul>
        </div>
        <p><strong>Водная фракция (TBW / масса тела):</strong></p>
${renderWaterFractionTable()}
        <p><strong>Концентрация Na⁺ в растворах:</strong></p>
${renderIvNaTable()}
        <p>Рекомендуемая скорость коррекции гипонатриемии — не более 4–8 ммоль/л за 24 часа (0,17–0,33 ммоль/л/ч). Частый контроль натрия сыворотки обязателен; формула не учитывает мочевую и другую потерю жидкости.</p>
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
${(await readFile(join(root, 'calculators', 'hyponatremia-infusion', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'hyponatremia-infusion', 'index.html'), html, 'utf8');
console.log('Built calculators/hyponatremia-infusion/index.html');
