#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCESS_TYPES,
  FIELD_LIMITS,
  EKT_V_THRESHOLDS,
  URR_ADEQUATE_MIN,
} from '../calculators/hemodialysis-adequacy/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'hemodialysis-adequacy', 'extra.css'), 'utf8'),
]);

function renderAccessRadios() {
  return ACCESS_TYPES.map(
    (opt, i) => `                  <label class="fc-calc__hd-radio-option">
                    <input type="radio" name="access" value="${opt.id}"${i === 0 ? ' checked' : ''} required />
                    <span>${opt.label}</span>
                  </label>`
  ).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Определение адекватности гемодиализа
-->
<div class="fc-calc" data-calculator="hemodialysis-adequacy">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Определение адекватности гемодиализа</h2>
        <p class="fc-calc__hint">Расчёт spKt/V, eKt/V и URR по формулам Daugirdas (MedSoftPro)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-hemodialysis-adequacy-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__hd-grid">
                <div class="fc-calc__field">
                  <label>Доступ</label>
                  <div class="fc-calc__hd-radio" role="radiogroup" aria-label="Тип сосудистого доступа">
${renderAccessRadios()}
                  </div>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-hemodialysis-adequacy-time">Время диализа</label>
                  <div class="fc-calc__hd-input-row">
                    <input type="number" id="fc-calc-hemodialysis-adequacy-time" name="dialysisTime" inputmode="decimal" min="${FIELD_LIMITS.dialysisHours.min}" max="${FIELD_LIMITS.dialysisHours.max}" step="any" required />
                    <select id="fc-calc-hemodialysis-adequacy-time-unit" name="timeUnit" aria-label="Единица времени">
                      <option value="hours" selected>часы</option>
                      <option value="minutes">мин</option>
                    </select>
                  </div>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-hemodialysis-adequacy-urea-pre">Мочевина до диализа</label>
                  <div class="fc-calc__hd-input-row">
                    <input type="number" id="fc-calc-hemodialysis-adequacy-urea-pre" name="ureaPre" inputmode="decimal" min="${FIELD_LIMITS.urea.min}" max="${FIELD_LIMITS.urea.max}" step="any" required />
                    <span class="fc-calc__hd-unit--fixed">ммоль/л</span>
                  </div>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-hemodialysis-adequacy-urea-post">Мочевина после диализа</label>
                  <div class="fc-calc__hd-input-row">
                    <input type="number" id="fc-calc-hemodialysis-adequacy-urea-post" name="ureaPost" inputmode="decimal" min="${FIELD_LIMITS.urea.min}" max="${FIELD_LIMITS.urea.max}" step="any" required />
                    <span class="fc-calc__hd-unit--fixed">ммоль/л</span>
                  </div>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-hemodialysis-adequacy-weight-loss">Потеря веса в ходе диализа</label>
                  <div class="fc-calc__hd-input-row">
                    <input type="number" id="fc-calc-hemodialysis-adequacy-weight-loss" name="weightLoss" inputmode="decimal" min="0" max="${FIELD_LIMITS.weightLoss.max}" step="any" required />
                    <span class="fc-calc__hd-unit--fixed">кг</span>
                  </div>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-hemodialysis-adequacy-weight-post">Вес пациента после диализа</label>
                  <div class="fc-calc__hd-input-row">
                    <input type="number" id="fc-calc-hemodialysis-adequacy-weight-post" name="weightPost" inputmode="decimal" min="${FIELD_LIMITS.weight.min}" max="${FIELD_LIMITS.weight.max}" step="any" required />
                    <span class="fc-calc__hd-unit--fixed">кг</span>
                  </div>
                </div>
              </div>

              <span class="fc-calc__error" id="fc-calc-hemodialysis-adequacy-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-hemodialysis-adequacy-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-hemodialysis-adequacy-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-hemodialysis-adequacy-result" aria-live="polite">
        <div class="fc-calc__hd-result">
          <p class="fc-calc__hd-result-title">Результат</p>
          <div id="fc-calc-hemodialysis-adequacy-result-body"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Доза диализа выражается коэффициентом очищения <strong>Kt/V</strong> по мочевине, представленного в виде эквилибрированного показателя (<strong>eKt/V</strong>) и рассчитанного на основании двухпуловой кинетической модели с изменяемым объёмом.</p>
        <p>В обычной практике эквилибрированный показатель рассчитывается по величине <strong>spKt/V</strong> — показателя, рассчитанного по формуле, основанной на однопуловой модели с изменяемым объёмом, с учётом ожидаемого влияния перераспределения мочевины.</p>

        <h4>Формула eKt/V</h4>
        <div class="fc-calc__formula fc-calc__hd-formula-note">
          <p class="fc-calc__formula-eq"><strong>Артериовенозный доступ:</strong> eKt/V = spKt/V − (0,6 × spKt/V / t) + 0,03</p>
          <p class="fc-calc__formula-eq"><strong>Веновенозный доступ:</strong> eKt/V = spKt/V − (0,47 × spKt/V / t) + 0,02</p>
          <ul class="fc-calc__formula-legend">
            <li><strong>spKt/V</strong> — показатель по однопуловой модели с изменяемым объёмом</li>
            <li><strong>t</strong> — продолжительность диализа в часах</li>
          </ul>
        </div>

        <h4>Формула spKt/V</h4>
        <div class="fc-calc__formula fc-calc__hd-formula-note">
          <p class="fc-calc__formula-eq">spKt/V = − ln (Ct / Co − 0,008 × t) + (4 − 3,5 × Ct / Co) × dBW / BW</p>
          <ul class="fc-calc__formula-legend">
            <li><strong>t</strong> — продолжительность диализа в часах</li>
            <li><strong>Co</strong> — мочевина до диализа (ммоль/л)</li>
            <li><strong>Ct</strong> — мочевина после диализа (ммоль/л)</li>
            <li><strong>BW</strong> — вес пациента после диализа (кг)</li>
            <li><strong>dBW</strong> — потеря веса в ходе процедуры (кг), ≈ объём ультрафильтрации</li>
          </ul>
        </div>

        <h4>URR — доля снижения мочевины</h4>
        <div class="fc-calc__formula fc-calc__hd-formula-note">
          <p class="fc-calc__formula-eq">URR = 100 × (1 − Ct / Co)</p>
        </div>

        <h4>Интерпретация</h4>
        <ul>
          <li><strong>eKt/V ≥ ${String(EKT_V_THRESHOLDS.adequate).replace('.', ',')}</strong> — адекватный гемодиализ</li>
          <li><strong>eKt/V ≥ ${String(EKT_V_THRESHOLDS.optimal).replace('.', ',')}</strong> — оптимальный гемодиализ</li>
          <li><strong>eKt/V ≥ ${String(EKT_V_THRESHOLDS.ideal).replace('.', ',')}</strong> — идеальный гемодиализ</li>
          <li><strong>URR ≥ ${URR_ADEQUATE_MIN} %</strong> — достаточный процент снижения мочевины</li>
        </ul>
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
${(await readFile(join(root, 'calculators', 'hemodialysis-adequacy', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'hemodialysis-adequacy', 'index.html'), html, 'utf8');
console.log('Built calculators/hemodialysis-adequacy/index.html');
