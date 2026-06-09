#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AGE_BANDS,
  LOADING_DILUTION_ML,
  LOADING_INFUSION_MIN,
  LOADING_DOSE_NO_PRIOR_MG_KG,
  LOADING_DOSE_PRIOR_MG_KG,
  MG_PER_ML,
} from '../calculators/aminophylline-peds/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'aminophylline-peds', 'extra.css'), 'utf8'),
]);

const loadingRate = LOADING_DILUTION_ML / (LOADING_INFUSION_MIN / 60);

function renderAgeOptions() {
  return AGE_BANDS.map(
    (band, i) => `                <label class="fc-calc__amph-age-option">
                  <input type="radio" name="age" value="${band.id}"${i === 1 ? ' checked' : ''} required />
                  <span>${band.label}</span>
                </label>`
  ).join('\n');
}

function renderYesNoToggle(name, defaultNo = true) {
  return `                <div class="fc-calc__amph-toggle" role="radiogroup">
                  <label class="fc-calc__amph-toggle-option">
                    <input type="radio" name="${name}" value="no"${defaultNo ? ' checked' : ''} required />
                    <span class="fc-calc__amph-toggle-label">Нет</span>
                  </label>
                  <label class="fc-calc__amph-toggle-option">
                    <input type="radio" name="${name}" value="yes"${defaultNo ? '' : ' checked'} required />
                    <span class="fc-calc__amph-toggle-label">Да</span>
                  </label>
                </div>`;
}

function renderMaintenanceTable() {
  const headerCells = AGE_BANDS.map((b) => `<th>${b.label}</th>`).join('\n                ');
  const rateCells = AGE_BANDS.map((b) => `<td>${String(b.rateMgKgH).replace('.', ',')}</td>`).join('\n                ');
  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th scope="col">Возраст</th>
                ${headerCells}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Дозировка, мг/кг/час</th>
                ${rateCells}
              </tr>
            </tbody>
          </table>
        </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчёт дозировки эуфиллина у детей до 16 лет
  Сборка: 2026-06-08-b
-->
<div class="fc-calc" data-calculator="aminophylline-peds">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Расчёт дозировки эуфиллина у детей до 16 лет</h2>
        <p class="fc-calc__hint">Нагрузочная и поддерживающая доза эуфиллина (2,4% раствор) с учётом возраста, веса и сопутствующих факторов</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-aminophylline-peds-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Параметры</h3>

              <div class="fc-calc__amph-age-field">
                <span class="fc-calc__amph-field-label">Возраст</span>
                <div class="fc-calc__amph-age-list" role="radiogroup" aria-label="Возраст">
${renderAgeOptions()}
                </div>
              </div>

              <div class="fc-calc__amph-field-row">
                <label class="fc-calc__amph-field-label" for="fc-calc-aminophylline-peds-weight">Вес, кг</label>
                <div class="fc-calc__amph-field-control">
                  <input type="number" id="fc-calc-aminophylline-peds-weight" name="weight" inputmode="decimal" min="0" step="any" placeholder="кг" required />
                </div>
              </div>

              <div class="fc-calc__amph-field-row">
                <label class="fc-calc__amph-field-label" for="fc-calc-aminophylline-peds-hours">Желаемое время введения, часов</label>
                <div class="fc-calc__amph-field-control">
                  <input type="number" id="fc-calc-aminophylline-peds-hours" name="infusionHours" inputmode="decimal" min="0" step="any" placeholder="ч" required />
                </div>
              </div>

              <div class="fc-calc__amph-field-row">
                <label class="fc-calc__amph-field-label" for="fc-calc-aminophylline-peds-volume">Объём раствора после разведения, мл</label>
                <div class="fc-calc__amph-field-control">
                  <input type="number" id="fc-calc-aminophylline-peds-volume" name="dilutionVolume" inputmode="decimal" min="0" step="any" placeholder="мл" required />
                </div>
              </div>

              <div class="fc-calc__amph-field-row">
                <p class="fc-calc__amph-field-label">Получал ли ребёнок теофиллин в предшествующие 12–24 часа?</p>
${renderYesNoToggle('priorTheophylline', true)}
              </div>

              <div class="fc-calc__amph-field-row">
                <p class="fc-calc__amph-field-label">Сердечная недостаточность или патология печени или приём эритромицина?</p>
${renderYesNoToggle('reduceMaintenance', true)}
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-aminophylline-peds-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__result-wrap fc-calc__amph-results fc-calc__result-wrap--hidden" id="fc-calc-aminophylline-peds-results" aria-live="polite">
        <div class="fc-calc__amph-result-card">
          <div class="fc-calc__amph-result-values">
            <p class="fc-calc__amph-result-value" id="fc-calc-aminophylline-peds-loading-mg">—</p>
            <p class="fc-calc__amph-result-value" id="fc-calc-aminophylline-peds-loading-ml">—</p>
          </div>
          <p class="fc-calc__amph-result-caption">Нагрузочная доза — скорость введения ${String(loadingRate).replace('.', ',')} мл/час при разбавлении до ${LOADING_DILUTION_ML} мл физ. раствора</p>
        </div>

        <div class="fc-calc__amph-result-card">
          <div class="fc-calc__amph-result-values">
            <p class="fc-calc__amph-result-value" id="fc-calc-aminophylline-peds-maintenance-mg">—</p>
            <p class="fc-calc__amph-result-value" id="fc-calc-aminophylline-peds-maintenance-ml">—</p>
          </div>
          <p class="fc-calc__amph-result-caption">Поддерживающая доза чистого, 2,4% раствора</p>
        </div>

        <div class="fc-calc__amph-result-card">
          <p class="fc-calc__amph-result-value" id="fc-calc-aminophylline-peds-infusion-rate">—</p>
          <p class="fc-calc__amph-result-caption">Скорость введения поддерживающей дозы</p>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Расчёты производятся, исходя из того, что 1 мл 2,4%-го раствора эуфиллина содержит ${MG_PER_ML} мг чистого вещества.</p>
        <p><strong>Доза насыщения</strong></p>
        <p>Если в предшествующие 12–24 часа ребёнок не получал препараты теофиллина, доза насыщения составляет ${String(LOADING_DOSE_NO_PRIOR_MG_KG).replace('.', ',')} мг/кг; если получал — ${String(LOADING_DOSE_PRIOR_MG_KG).replace('.', ',')} мг/кг.</p>
        <p>Доза разводится до ${LOADING_DILUTION_ML} мл физ. раствора и вводится внутривенно за ${LOADING_INFUSION_MIN} минут (скорость ${String(loadingRate).replace('.', ',')} мл/час).</p>
        <p><strong>Поддерживающая доза</strong> — внутривенно капельно постоянно:</p>
${renderMaintenanceTable()}
        <p>У детей с сердечной недостаточностью, патологией печени и получающих эритромицин поддерживающую дозу уменьшают в 2 раза.</p>
        <p><strong>Противопоказания:</strong> применение эуфиллина, особенно внутривенное введение, противопоказано при резко пониженном артериальном давлении, пароксизмальной тахикардии и экстрасистолии. Не следует также применять препарат при сердечной недостаточности, особенно связанной с инфарктом миокарда, когда имеется коронарная недостаточность и нарушение сердечного ритма.</p>
        <p class="fc-calc__hint">Источник: <a href="https://medvestnik.ru/calculators/Raschet-dozirovki-eufillina-u-detei-do-16-let.html" target="_blank" rel="noopener noreferrer">Медвестник</a></p>
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
${(await readFile(join(root, 'calculators', 'aminophylline-peds', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'aminophylline-peds', 'index.html'), html, 'utf8');
console.log('Built calculators/aminophylline-peds/index.html');
