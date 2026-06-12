#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PH_MIN,
  PH_MAX,
  PACO2_MIN,
  PACO2_MAX,
  BE_MIN,
  BE_MAX,
} from '../calculators/abg-interpretation/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'abg-interpretation', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Интерпретация газов артериальной крови
-->
<div class="fc-calc" data-calculator="abg-interpretation">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Интерпретация газов артериальной крови</h2>
        <p class="fc-calc__hint">Интерпретация кислотно-щелочного состояния по pH, PaCO₂ и BE-ecf</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-abg-interpretation-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Показатели газового состава крови</h3>

              <div class="fc-calc__abg-grid">
                <div class="fc-calc__field">
                  <label for="fc-calc-abg-interpretation-ph">pH</label>
                  <input type="number" id="fc-calc-abg-interpretation-ph" name="ph" inputmode="decimal" min="${PH_MIN}" max="${PH_MAX}" step="any" required />
                  <span class="fc-calc__error" id="fc-calc-abg-interpretation-ph-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-abg-interpretation-paco2">PaCO₂</label>
                  <div class="fc-calc__abg-input-row">
                    <input type="number" id="fc-calc-abg-interpretation-paco2" name="paco2" inputmode="decimal" min="${PACO2_MIN}" max="${PACO2_MAX}" step="any" required />
                    <span class="fc-calc__abg-unit--fixed">мм. рт. ст.</span>
                  </div>
                  <span class="fc-calc__error" id="fc-calc-abg-interpretation-paco2-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-abg-interpretation-be">BE ecf</label>
                  <div class="fc-calc__abg-input-row">
                    <input type="number" id="fc-calc-abg-interpretation-be" name="be" inputmode="decimal" min="${BE_MIN}" max="${BE_MAX}" step="any" required />
                    <span class="fc-calc__abg-unit--fixed">ммоль/л</span>
                  </div>
                  <span class="fc-calc__error" id="fc-calc-abg-interpretation-be-error" role="alert"></span>
                </div>
              </div>

              <span class="fc-calc__error" id="fc-calc-abg-interpretation-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-abg-interpretation-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-abg-interpretation-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-abg-interpretation-result" aria-live="polite">
        <div class="fc-calc__result fc-calc__result--empty" id="fc-calc-abg-interpretation-result-box">
          <p class="fc-calc__result-label">Результат</p>
          <p class="fc-calc__result-number" id="fc-calc-abg-interpretation-result-number">—</p>
          <p class="fc-calc__result-desc" id="fc-calc-abg-interpretation-result-desc"></p>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>pH</strong> — показатель, демонстрирующий соотношение кислот (могут отдавать ионы водорода) и щелочей (могут присоединять данные ионы) в крови.</p>
        <p><strong>PaCO₂</strong> — уровень парциального давления углекислого газа в крови.</p>
        <p><strong>BE-ecf</strong> (base excess — extracellular fluid) — рассчитанный дефицит либо избыток оснований для всей внеклеточной жидкости, включая кровь.</p>

        <p><strong>Нормальные значения газового состава крови</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th scope="col">Показатель</th>
                <th scope="col">Границы нормы</th>
                <th scope="col">Единицы</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">pH</th>
                <td>7,36 – 7,44</td>
                <td>—</td>
              </tr>
              <tr>
                <th scope="row">PaCO₂</th>
                <td>36 – 44</td>
                <td>мм. рт. ст.</td>
              </tr>
              <tr>
                <th scope="row">Избыток оснований (BE)</th>
                <td>−2,4 – +2,2</td>
                <td>ммоль/л</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p><strong>Интерпретация</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th scope="col">Состояние</th>
                <th scope="col">Вторичный показатель</th>
                <th scope="col">Описание и возможные причины</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">pH &lt; 7,36<br>Респираторный ацидоз</th>
                <td>PaCO₂ повышено</td>
                <td>Развивается при неадекватной вентиляции, когда продукция CO₂ превышает его элиминацию. Возможные причины: обструкция дыхательных путей, депрессия дыхания.</td>
              </tr>
              <tr>
                <th scope="row">pH &gt; 7,44<br>Респираторный алкалоз</th>
                <td>PaCO₂ снижено</td>
                <td>Возникает при гипервентиляции. Может быть следствием ответа на гипоксемию и включения гипоксического респираторного драйва. Причиной может быть ИВЛ с высоким минутным объёмом вентиляции.</td>
              </tr>
              <tr>
                <th scope="row">pH &lt; 7,36<br>Метаболический ацидоз</th>
                <td>BE снижен (дефицит оснований)</td>
                <td>Потери бикарбоната через ЖКТ или хроническое поражение почек; поступление неорганических кислот (диабетический кетоацидоз, лактат-ацидоз, отравления); снижение экскреции кислот при почечной недостаточности.</td>
              </tr>
              <tr>
                <th scope="row">pH &gt; 7,44<br>Метаболический алкалоз</th>
                <td>BE повышен (избыток оснований)</td>
                <td>Возникает при потерях желудочного содержимого (например, пилоростеноз) и терапии диуретиками. Часто сопровождается снижением хлоридов (Cl⁻) сыворотки.</td>
              </tr>
              <tr>
                <th scope="row">Смешанный ацидоз или алкалоз</th>
                <td>PaCO₂ и BE изменены в противоположных направлениях</td>
                <td>Могут развиваться при тяжёлых расстройствах: септический шок, полиорганная недостаточность, остановка кровообращения.</td>
              </tr>
            </tbody>
          </table>
        </div>
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
${(await readFile(join(root, 'calculators', 'abg-interpretation', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'abg-interpretation', 'index.html'), html, 'utf8');
console.log('Built calculators/abg-interpretation/index.html');
