#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOSE_OPTIONS_MG_KG,
  DRUG_PRESETS,
  DOSE_BY_WEIGHT_TABLE,
  CUMULATIVE_BY_DOSE_TABLE,
  CUMULATIVE_MG_KG,
  DAYS_PER_MONTH,
} from '../calculators/isotretinoin/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'isotretinoin', 'extra.css'), 'utf8'),
]);

function renderDoseOptions() {
  return DOSE_OPTIONS_MG_KG.map((dose) => {
    const selected = dose === 0.6 ? ' selected' : '';
    const label = String(dose).replace('.', ',');
    return `                    <option value="${dose}"${selected}>${label}</option>`;
  }).join('\n');
}

function renderDrugButtons() {
  const presetButtons = DRUG_PRESETS.map((drug) => {
    const active = drug.id === 'aknecutan-16' ? ' fc-calc__retin-drug-btn--active' : '';
    const pressed = drug.id === 'aknecutan-16' ? 'true' : 'false';
    return `                <button type="button" class="fc-calc__retin-drug-btn${active}" data-capsule="${drug.capsuleMg}" aria-pressed="${pressed}">${drug.label}</button>`;
  }).join('\n');
  return `${presetButtons}
                <button type="button" class="fc-calc__retin-drug-btn fc-calc__retin-drug-btn--reset" id="fc-calc-isotretinoin-reset">Сброс</button>`;
}

function renderOutputRow(label, id, unit) {
  return `                <div class="fc-calc__retin-row fc-calc__retin-row--out">
                  <span class="fc-calc__retin-row-label">${label}</span>
                  <div class="fc-calc__retin-row-value">
                    <input type="text" class="fc-calc__retin-cell fc-calc__retin-cell--out" id="${id}" value="—" readonly tabindex="-1" aria-readonly="true" />
                  </div>
                  <span class="fc-calc__retin-row-unit">${unit}</span>
                </div>`;
}

function renderDoseByWeightTable() {
  const header = `                <tr>
                  <th scope="col">Вес тела, кг</th>
                  <th scope="col">0,5 мг/кг</th>
                  <th scope="col">1 мг/кг</th>
                  <th scope="col">2 мг/кг</th>
                </tr>`;
  const rows = DOSE_BY_WEIGHT_TABLE.map(
    (row) => `                <tr>
                  <th scope="row">${row.weightKg}</th>
                  <td>${row.doses[0.5]}</td>
                  <td>${row.doses[1]}</td>
                  <td>${row.doses[2]}</td>
                </tr>`
  ).join('\n');
  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
${header}
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>`;
}

function renderCumulativeTable() {
  const header = `                <tr>
                  <th scope="col">Суточная доза, мг/кг</th>
                  <th scope="col">4 мес. (120 дней)</th>
                  <th scope="col">5 мес. (150 дней)</th>
                  <th scope="col">6 мес. (180 дней)</th>
                  <th scope="col">7 мес. (210 дней)</th>
                </tr>`;
  const rows = CUMULATIVE_BY_DOSE_TABLE.map((row) => {
    const label = String(row.doseMgKg).replace('.', ',');
    return `                <tr>
                  <th scope="row">${label}</th>
                  <td>${row.months[4]}</td>
                  <td>${row.months[5]}</td>
                  <td>${row.months[6]}</td>
                  <td>${row.months[7]}</td>
                </tr>`;
  }).join('\n');
  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
${header}
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Калькулятор расчёта дозы изотретиноина для лечения акне
-->
<div class="fc-calc" data-calculator="isotretinoin">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Калькулятор расчёта дозы изотретиноина для лечения акне</h2>
        <p class="fc-calc__hint">Расчёт суточной и кумулятивной дозы изотретиноина (Роаккутан, Акнекутан, Сотрет) и количества капсул на сутки, месяц и курс</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-isotretinoin-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel fc-calc__retin-panel">
              <div class="fc-calc__retin-sheet">
                <div class="fc-calc__retin-row">
                  <label class="fc-calc__retin-row-label" for="fc-calc-isotretinoin-weight">Вес</label>
                  <div class="fc-calc__retin-row-value">
                    <input type="number" class="fc-calc__retin-cell" id="fc-calc-isotretinoin-weight" name="weightKg" inputmode="decimal" min="0" step="any" placeholder="0" required />
                  </div>
                  <span class="fc-calc__retin-row-unit">кг</span>
                </div>

                <div class="fc-calc__retin-row">
                  <label class="fc-calc__retin-row-label" for="fc-calc-isotretinoin-dose">Дозировка в зависимости от тяжести заболевания</label>
                  <div class="fc-calc__retin-row-value">
                    <select class="fc-calc__retin-cell" id="fc-calc-isotretinoin-dose" name="doseMgKg" required>
                      <option value="" disabled>Выбрать…</option>
${renderDoseOptions()}
                    </select>
                  </div>
                  <span class="fc-calc__retin-row-unit">мг/кг</span>
                </div>

                <div class="fc-calc__result-wrap fc-calc__retin-result-wrap" id="fc-calc-isotretinoin-result" aria-live="polite">
${renderOutputRow('Суточная доза', 'fc-calc-isotretinoin-daily-dose', 'мг')}
${renderOutputRow('Стандартная кумулятивная курсовая доза', 'fc-calc-isotretinoin-cumulative-g', 'гр')}
${renderOutputRow('Количество капсул препарата в сутки', 'fc-calc-isotretinoin-capsules-day', 'шт')}
${renderOutputRow('Количество капсул препарата в месяц', 'fc-calc-isotretinoin-capsules-month', 'шт')}
${renderOutputRow('Количество капсул препарата на курс', 'fc-calc-isotretinoin-capsules-course', 'шт')}
${renderOutputRow('Длительность курса лечения', 'fc-calc-isotretinoin-course-days', 'дней')}
                </div>
              </div>

              <div class="fc-calc__retin-footer">
                <input type="hidden" id="fc-calc-isotretinoin-capsule" name="capsuleMg" value="16" />
                <div class="fc-calc__retin-drugs" role="group" aria-label="Препарат">
${renderDrugButtons()}
                </div>
                <p class="fc-calc__hint fc-calc__retin-note">* Дозировка капсул Роаккутана и Сотрета одинакова</p>
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-isotretinoin-form-error" role="alert"></span>
        </form>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Калькулятор для расчёта суточной и кумулятивной дозы лечения угревой сыпи изотретиноином. Стандартная кумулятивная курсовая доза рассчитывается как ${CUMULATIVE_MG_KG} мг/кг массы тела. Количество капсул в месяц — исходя из ${DAYS_PER_MONTH} дней.</p>
        <p><strong>Дозировка изотретиноина по весу тела</strong></p>
${renderDoseByWeightTable()}
        <p><strong>Суточная и кумулятивная доза изотретиноина, мг/кг</strong></p>
${renderCumulativeTable()}
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
${(await readFile(join(root, 'calculators', 'isotretinoin', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'isotretinoin', 'index.html'), html, 'utf8');
console.log('Built calculators/isotretinoin/index.html');
