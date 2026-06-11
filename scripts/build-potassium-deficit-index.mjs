#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'potassium-deficit', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Дефицит калия
-->
<div class="fc-calc" data-calculator="potassium-deficit">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Дефицит калия</h2>
        <p class="fc-calc__hint">Расчёт дефицита калия в плазме крови и объёма растворов различной концентрации для его возмещения</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-potassium-deficit-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__field">
                <label for="fc-calc-potassium-deficit-serum">Калий сыворотки (K2)</label>
                <div class="fc-calc__k-field-row">
                  <input type="number" id="fc-calc-potassium-deficit-serum" name="serumK" inputmode="decimal" min="0" step="any" required />
                  <span class="fc-calc__k-unit">ммоль/л</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-potassium-deficit-serum-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-potassium-deficit-weight">Вес пациента (M)</label>
                <div class="fc-calc__k-field-row">
                  <input type="number" id="fc-calc-potassium-deficit-weight" name="weight" inputmode="decimal" min="0" step="any" placeholder="кг" required />
                  <span class="fc-calc__k-unit">кг</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-potassium-deficit-weight-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-potassium-deficit-decimals">Десятичная точность</label>
                <select id="fc-calc-potassium-deficit-decimals" name="decimals">
                  <option value="0">0</option>
                  <option value="1" selected>1</option>
                  <option value="2">2</option>
                </select>
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-potassium-deficit-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-potassium-deficit-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-potassium-deficit-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-potassium-deficit-result" aria-live="polite">
        <div class="fc-calc__k-result">
          <p class="fc-calc__k-result-title">Результат</p>
          <div class="fc-calc__k-result-summary" id="fc-calc-potassium-deficit-result-summary"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <div class="fc-calc__formula fc-calc__k-formula-note">
          <p class="fc-calc__formula-eq"><strong>Д</strong> = M × 0,2 × (K1 − K2)</p>
          <ul class="fc-calc__formula-legend">
            <li><strong>Д</strong> — дефицит электролита, ммоль</li>
            <li><strong>M</strong> — масса тела пациента, кг</li>
            <li><strong>K1</strong> — нормальное содержание ионов в плазме, ммоль/л (в калькуляторе 5)</li>
            <li><strong>K2</strong> — содержание иона в плазме больного, ммоль/л</li>
          </ul>
        </div>
        <p>Объём 7,5%-го KCl (мл) = <strong>Д</strong> (эквимолярный раствор, 1 мл ≈ 1 ммоль K).</p>
        <p>Масса калия (мг) = <strong>Д / 13,4 × 1000</strong>. Объём 4%-го KCl (мл) = <strong>мг / 40</strong> (как в калькуляторе Medsoftpro).</p>
        <p>Общая суточная доза калия не должна превышать <strong>3 ммоль/кг/сут</strong>, скорость инфузии — не более <strong>20 ммоль/ч</strong>.</p>
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
${(await readFile(join(root, 'calculators', 'potassium-deficit', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'potassium-deficit', 'index.html'), html, 'utf8');
console.log('Built calculators/potassium-deficit/index.html');
