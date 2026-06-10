#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENDER_OPTIONS } from '../calculators/sodium-deficit/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'sodium-deficit', 'extra.css'), 'utf8'),
]);

function renderGenderRadios() {
  return GENDER_OPTIONS.map(
    (opt) => `                <label class="fc-calc__na-radio-option">
                  <input type="radio" name="gender" value="${opt.id}" data-coef="${opt.coef}" required />
                  <span>${opt.label} (${String(opt.coef).replace('.', ',')})</span>
                </label>`
  ).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Дефицит натрия при гипонатриемии
-->
<div class="fc-calc" data-calculator="sodium-deficit">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Дефицит натрия при гипонатриемии</h2>
        <p class="fc-calc__hint">Расчёт дефицита натрия для коррекции гипонатриемии с учётом пола и общего количества воды в организме</p>
        <p class="fc-calc__formula"><strong>Дефицит натрия</strong> = Пол × Норм. вес × (Желаемый натрий − Натрий сыворотки)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-sodium-deficit-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__field">
                <label>Пол</label>
                <div class="fc-calc__na-radio" role="radiogroup" aria-label="Пол">
${renderGenderRadios()}
                </div>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-deficit-weight">Норм. вес, кг</label>
                <input type="number" id="fc-calc-sodium-deficit-weight" name="weight" inputmode="decimal" min="0" step="any" placeholder="кг" required />
                <span class="fc-calc__error" id="fc-calc-sodium-deficit-weight-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-deficit-serum">Натрий сыворотки</label>
                <div class="fc-calc__field-row">
                  <input type="number" id="fc-calc-sodium-deficit-serum" name="serumNa" inputmode="decimal" min="0" step="any" required />
                  <select id="fc-calc-sodium-deficit-serum-unit" name="serumUnit" aria-label="Единица натрия сыворотки">
                    <option value="mEq/L" selected>mEq/L</option>
                    <option value="mmol/L">mmol/L</option>
                  </select>
                </div>
                <span class="fc-calc__error" id="fc-calc-sodium-deficit-serum-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-deficit-desired">Желаемый натрий</label>
                <div class="fc-calc__field-row">
                  <input type="number" id="fc-calc-sodium-deficit-desired" name="desiredNa" inputmode="decimal" min="0" step="any" value="140" />
                  <select id="fc-calc-sodium-deficit-desired-unit" name="desiredUnit" aria-label="Единица желаемого натрия">
                    <option value="mEq/L" selected>mEq/L</option>
                    <option value="mmol/L">mmol/L</option>
                  </select>
                </div>
                <span class="fc-calc__error" id="fc-calc-sodium-deficit-desired-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-deficit-decimals">Десятичная точность</label>
                <select id="fc-calc-sodium-deficit-decimals" name="decimals">
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2" selected>2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-sodium-deficit-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-sodium-deficit-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-sodium-deficit-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-sodium-deficit-result" aria-live="polite">
        <div class="fc-calc__na-result">
          <p class="fc-calc__result-label">Дефицит натрия</p>
          <p class="fc-calc__result-number" id="fc-calc-sodium-deficit-result-value">—</p>
          <p class="fc-calc__result-desc" id="fc-calc-sodium-deficit-result-desc"></p>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Выражение <strong>Пол × Нормальный вес тела</strong> представляет нормальное общее количество воды в организме (ОКВО). Нормальное ОКВО специфично полу, о чём свидетельствуют факторы 0,6 и 0,5.</p>
        <p><strong>Используемое уравнение:</strong></p>
        <p>Дефицит натрия = Пол × Норм. вес × (Желаемый натрий − Натрий сыворотки)</p>
        <p>Цифры в скобках у вариантов пола — дискретные коэффициенты, используемые в расчёте.</p>
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
${(await readFile(join(root, 'calculators', 'sodium-deficit', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'sodium-deficit', 'index.html'), html, 'utf8');
console.log('Built calculators/sodium-deficit/index.html');
