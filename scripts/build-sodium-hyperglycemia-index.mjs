#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KATZ_FACTOR,
  HILLIER_FACTOR,
  GLUCOSE_NORMAL_MGDL,
  FIELD_LIMITS,
  NA_UNIT_LABEL,
  GLUCOSE_UNIT_LABEL,
} from '../calculators/sodium-hyperglycemia/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'sodium-hyperglycemia', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Коррекция натрия при гипергликемии
-->
<div class="fc-calc" data-calculator="sodium-hyperglycemia">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Коррекция натрия при гипергликемии</h2>
        <p class="fc-calc__hint">Расчёт скорректированного натрия по формулам Katz и Hillier</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-sodium-hyperglycemia-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-hyperglycemia-measured-na">Измеренный уровень натрия</label>
                <div class="fc-calc__na-glu-input-row">
                  <input type="number" id="fc-calc-sodium-hyperglycemia-measured-na" name="measuredNa" inputmode="decimal" min="${FIELD_LIMITS.measuredNa.min}" max="${FIELD_LIMITS.measuredNa.max}" step="any" required />
                  <span class="fc-calc__na-glu-unit--fixed">${NA_UNIT_LABEL}</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-sodium-hyperglycemia-na-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-hyperglycemia-glucose">Уровень глюкозы сыворотки</label>
                <div class="fc-calc__na-glu-input-row">
                  <input type="number" id="fc-calc-sodium-hyperglycemia-glucose" name="glucose" inputmode="decimal" min="${FIELD_LIMITS.glucoseMmol.min}" max="${FIELD_LIMITS.glucoseMmol.max}" step="any" required />
                  <span class="fc-calc__na-glu-unit--fixed">${GLUCOSE_UNIT_LABEL}</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-sodium-hyperglycemia-glucose-error" role="alert"></span>
              </div>

              <span class="fc-calc__error" id="fc-calc-sodium-hyperglycemia-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-sodium-hyperglycemia-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-sodium-hyperglycemia-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden fc-calc__na-glu-result-panel" id="fc-calc-sodium-hyperglycemia-result" aria-live="polite">
        <div class="fc-calc__na-glu-result">
          <p class="fc-calc__na-glu-result-title">Результат</p>
          <div id="fc-calc-sodium-hyperglycemia-result-body"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <h4>Почему при гипергликемии снижается натрий?</h4>
        <p>При гипергликемии глюкоза действует как осмотически активное вещество, притягивая воду из клеток в кровеносное русло. Это приводит к:</p>
        <ul>
          <li><strong>гемодилюции</strong> — «разведению» крови и снижению концентрации Na⁺;</li>
          <li><strong>кажущейся гипонатриемии</strong>, хотя общее количество натрия в организме может быть нормальным или даже повышенным.</li>
        </ul>
        <p>Без коррекции можно ошибочно диагностировать гипонатриемию и начать неверное лечение.</p>

        <h4>Формулы коррекции натрия при гипергликемии</h4>
        <div class="fc-calc__formula fc-calc__na-glu-formula-note">
          <p class="fc-calc__formula-eq"><strong>Katz (1973):</strong> Na⁺ = измеренный Na⁺ + ${String(KATZ_FACTOR).replace('.', ',')} × (глюкоза − ${GLUCOSE_NORMAL_MGDL})</p>
          <p class="fc-calc__formula-eq"><strong>Hillier (1999):</strong> Na⁺ = измеренный Na⁺ + ${String(HILLIER_FACTOR).replace('.', ',')} × (глюкоза − ${GLUCOSE_NORMAL_MGDL})</p>
          <ul class="fc-calc__formula-legend">
            <li>Na⁺ — ммоль/л; глюкоза в формулах — <strong>мг/дл</strong></li>
            <li>при вводе глюкозы в ммоль/л: глюкоза<sub>мг/дл</sub> = глюкоза<sub>ммоль/л</sub> × 18</li>
          </ul>
        </div>

        <h4>Какой метод точнее?</h4>
        <p>Hillier et al. (1999) показали, что коррекционный коэффициент <strong>2,4 ммоль/л</strong> на каждые 100 мг/дл глюкозы выше нормы точнее, чем классический <strong>1,6 ммоль/л</strong> (Katz).</p>

        <h4>Когда применять коррекцию?</h4>
        <ul>
          <li>гипергликемия (глюкоза &gt; 100 мг/дл или 5,5 ммоль/л);</li>
          <li>сопутствующая гипонатриемия (Na⁺ &lt; 135 ммоль/л);</li>
          <li>дифференциальная диагностика истинной и ложной гипонатриемии.</li>
        </ul>
        <p><strong>Важно:</strong> коррекция Na⁺ не должна превышать 8–10 ммоль/л в сутки. При ДКА и гиперосмолярном состоянии коррекция Na⁺ обязательна.</p>
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
${(await readFile(join(root, 'calculators', 'sodium-hyperglycemia', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'sodium-hyperglycemia', 'index.html'), html, 'utf8');
console.log('Built calculators/sodium-hyperglycemia/index.html');
