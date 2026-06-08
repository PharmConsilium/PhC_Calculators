#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DRUG_CATALOG, SOLVENT_PRESETS, CARDIOTONIC_EQUIVALENTS } from '../calculators/infusomat/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'infusomat', 'extra.css'), 'utf8'),
]);

function renderDrugOptions() {
  return DRUG_CATALOG.map((d) => `<option value="${d.id}">${d.label}</option>`).join('\n                  ');
}

function renderSolventChips() {
  return SOLVENT_PRESETS.map(
    (p) =>
      `<button type="button" class="fc-calc__inf-chip${p.id === 'none' ? ' fc-calc__inf-chip--active' : ''}" data-total="${p.totalMl}">${p.label}</button>`
  ).join('\n                ');
}

function renderCardiotonicTable() {
  return CARDIOTONIC_EQUIVALENTS.map(
    (row) => `              <tr>
                <td>${row.drug}</td>
                <td>${row.dose}</td>
                <td>${row.equivalent}</td>
              </tr>`
  ).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчёт дозы и скорости введения препаратов на инфузомате (линеомате)
-->
<div class="fc-calc" data-calculator="infusomat">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Расчёт на инфузомате</h2>
        <p class="fc-calc__hint">Расчёт скорости титрования препаратов: кардиотоники, гипнотики, бензодиазепины и др.</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-infusomat-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Препарат и лекарственная форма</h3>
              <div class="fc-calc__field">
                <label for="fc-calc-infusomat-drug">Выберите препарат</label>
                <select id="fc-calc-infusomat-drug" name="drug">
                  ${renderDrugOptions()}
                </select>
              </div>
              <div class="fc-calc__field">
                <span class="fc-calc__field-label">Укажите лекарственную форму</span>
                <div class="fc-calc__inf-form-layout">
                  <div class="fc-calc__inf-form-inputs">
                    <div class="fc-calc__inf-conc-row">
                      <div>
                        <label for="fc-calc-infusomat-percent">Концентрация, %</label>
                        <input type="text" id="fc-calc-infusomat-percent" name="percent" inputmode="decimal" placeholder="0" autocomplete="off" />
                        <span class="fc-calc__inf-unit">%</span>
                      </div>
                      <span class="fc-calc__inf-conc-sep" aria-hidden="true">=</span>
                      <div>
                        <label for="fc-calc-infusomat-mgml">Концентрация, мг/мл</label>
                        <input type="text" id="fc-calc-infusomat-mgml" name="mgMl" inputmode="decimal" placeholder="0" autocomplete="off" />
                        <span class="fc-calc__inf-unit">мг/мл</span>
                      </div>
                    </div>
                    <div class="fc-calc__field" style="margin-top: 12px; margin-bottom: 0">
                      <label for="fc-calc-infusomat-volume">Объём препарата</label>
                      <input type="text" id="fc-calc-infusomat-volume" name="drugVolumeMl" inputmode="decimal" placeholder="0" autocomplete="off" />
                      <span class="fc-calc__inf-unit">мл</span>
                    </div>
                  </div>
                  <div class="fc-calc__inf-form-presets">
                    <p class="fc-calc__inf-form-presets-title" id="fc-calc-infusomat-form-presets-title"></p>
                    <ul class="fc-calc__inf-form-presets-list fc-calc__inf-form-presets-list--hidden" id="fc-calc-infusomat-form-presets"></ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Растворитель</h3>
              <div class="fc-calc__field">
                <label for="fc-calc-infusomat-solvent">Объём растворителя (если используется)</label>
                <input type="text" id="fc-calc-infusomat-solvent" name="solventMl" inputmode="decimal" value="0" autocomplete="off" />
                <span class="fc-calc__inf-unit">мл</span>
              </div>
              <div class="fc-calc__inf-chips" role="group" aria-label="Быстрый выбор объёма разведения">
                ${renderSolventChips()}
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Дозировка и масса пациента</h3>
              <p class="fc-calc__inf-hint-inline">После ввода дозы и массы расчёт скорости выполняется автоматически</p>
              <div class="fc-calc__inf-row-2">
                <div class="fc-calc__field">
                  <span class="fc-calc__field-label">Укажите дозировку препарата</span>
                  <div class="fc-calc__inf-dose-row">
                    <div>
                      <label for="fc-calc-infusomat-dose-mcg">Доза</label>
                      <input type="text" id="fc-calc-infusomat-dose-mcg" name="doseMcgKgMin" inputmode="decimal" value="1" autocomplete="off" />
                      <span class="fc-calc__inf-unit">мкг/кг/мин</span>
                    </div>
                    <span class="fc-calc__inf-or">или</span>
                    <div>
                      <label for="fc-calc-infusomat-dose-mg">Доза</label>
                      <input type="text" id="fc-calc-infusomat-dose-mg" name="doseMgKgH" inputmode="decimal" value="0,06" autocomplete="off" />
                      <span class="fc-calc__inf-unit">мг/кг/ч</span>
                    </div>
                  </div>
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-infusomat-weight">Масса пациента</label>
                  <input type="text" id="fc-calc-infusomat-weight" name="weightKg" inputmode="decimal" value="70" autocomplete="off" />
                  <span class="fc-calc__inf-unit">кг</span>
                </div>
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel fc-calc__inf-result-panel">
              <h3 class="fc-calc__panel-heading">Итоговая скорость введения</h3>
              <div class="fc-calc__inf-result-grid">
                <div>
                  <label for="fc-calc-infusomat-ml-hour">Скорость</label>
                  <input type="text" id="fc-calc-infusomat-ml-hour" class="fc-calc__inf-output" readonly value="0" aria-live="polite" />
                  <span class="fc-calc__inf-unit">мл/ч</span>
                </div>
                <span class="fc-calc__inf-result-or">или</span>
                <div>
                  <label for="fc-calc-infusomat-ml-min">Скорость</label>
                  <input type="text" id="fc-calc-infusomat-ml-min" class="fc-calc__inf-output" readonly value="0" aria-live="polite" />
                  <span class="fc-calc__inf-unit">мл/мин</span>
                </div>
              </div>
              <p class="fc-calc__inf-summary" id="fc-calc-infusomat-summary">Для получившегося 0% (0 мг/мл) раствора</p>
            </div>
          </div>
        </form>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Формула:</strong> скорость (мл/ч) = (доза мкг/кг/мин × масса кг × 60) / (концентрация раствора мг/мл × 1000).</p>
        <p>Концентрация готового раствора = (концентрация исходного препарата × объём препарата) / (объём препарата + объём растворителя).</p>
        <p><strong>Эквиваленты кардиотонических средств:</strong></p>
        <p class="fc-calc__hint">Вазопрессоры и «норадреналиновый эквивалент»</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Препарат</th>
                <th>Доза</th>
                <th>«Норадреналиновый эквивалент»</th>
              </tr>
            </thead>
            <tbody>
${renderCardiotonicTable()}
            </tbody>
          </table>
        </div>
        <p class="fc-calc__hint">Источник: <a href="https://bymed.top/calc/%D0%B8%D0%BD%D1%84%D1%83%D0%B7%D0%BE%D0%BC%D0%B0%D1%82-658" target="_blank" rel="noopener noreferrer">ByMed — инфузомат</a></p>
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
${(await readFile(join(root, 'calculators', 'infusomat', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'infusomat', 'index.html'), html, 'utf8');
console.log('Built calculators/infusomat/index.html');
