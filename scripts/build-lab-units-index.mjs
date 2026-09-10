#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANALYTES } from '../calculators/lab-units/data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'lab-units');

const [css, extra, widgetSrc] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(calcDir, 'extra.css'), 'utf8'),
  readFile(join(calcDir, 'widget.js'), 'utf8'),
]);

const widget = widgetSrc.replace('__ANALYTES__', JSON.stringify(ANALYTES, null, 2));

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Пересчёт единиц лабораторных показателей
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="lab-units">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Пересчёт единиц лабораторных показателей</h2>
        <p class="fc-calc__hint">Пересчёт значений анализов между SI и альтернативными единицами измерения</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-lab-units-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel fc-calc__lu-panel">
              <h3 class="fc-calc__panel-heading">Введите данные</h3>

              <div class="fc-calc__lu-field">
                <label class="fc-calc__lu-label" for="fc-calc-lab-units-filter">Поиск исследования</label>
                <input type="search" class="fc-calc__lu-input fc-calc__lu-filter" id="fc-calc-lab-units-filter" name="filter" placeholder="Например: глюкоза, ТТГ, холестерин" autocomplete="off" />
              </div>

              <div class="fc-calc__lu-field">
                <label class="fc-calc__lu-label" for="fc-calc-lab-units-analyte">Исследование</label>
                <select class="fc-calc__lu-select" id="fc-calc-lab-units-analyte" name="analyteId" required>
                  <option value="">Выберите исследование</option>
                </select>
                <p class="fc-calc__lu-pair" id="fc-calc-lab-units-pair">Выберите исследование, чтобы увидеть пару единиц</p>
              </div>

              <div class="fc-calc__lu-field">
                <label class="fc-calc__lu-label" for="fc-calc-lab-units-value">Значение</label>
                <input type="number" class="fc-calc__lu-input" id="fc-calc-lab-units-value" name="value" inputmode="decimal" min="0" step="any" placeholder="0" required />
              </div>

              <div class="fc-calc__lu-field">
                <p class="fc-calc__lu-label" id="fc-calc-lab-units-from-legend">Единица ввода</p>
                <div class="fc-calc__lu-units" role="radiogroup" aria-labelledby="fc-calc-lab-units-from-legend">
                  <label class="fc-calc__lu-unit">
                    <input type="radio" name="from" id="fc-calc-lab-units-from-a" value="A" checked />
                    <span id="fc-calc-lab-units-unit-a-label">Единица A</span>
                  </label>
                  <label class="fc-calc__lu-unit">
                    <input type="radio" name="from" id="fc-calc-lab-units-from-b" value="B" />
                    <span id="fc-calc-lab-units-unit-b-label">Единица B</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-lab-units-result" aria-live="polite">
            <div class="fc-calc__panel fc-calc__lu-panel">
              <h3 class="fc-calc__panel-heading">Результат</h3>
              <div class="fc-calc__lu-result-value" id="fc-calc-lab-units-result-value">—</div>
              <p class="fc-calc__lu-result-unit" id="fc-calc-lab-units-result-unit"></p>
              <p class="fc-calc__result-desc" id="fc-calc-lab-units-result-desc"></p>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-lab-units-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-lab-units-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-lab-units-form" disabled>Рассчитать</button>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Калькулятор переводит значение лабораторного показателя между парой единиц: базовой (часто SI) и альтернативной (условной / conventional).</p>
        <p><strong>Принцип:</strong> value<sub>B</sub> = value<sub>A</sub> × коэффициент; обратный пересчёт — деление на тот же коэффициент.</p>
        <ul>
          <li>Для многих маркеров (мкг/л ↔ нг/мл, кЕд/л ↔ Ед/мл, МЕ/л ↔ мМЕ/мл) коэффициент равен 1.</li>
          <li>Для массовой концентрации г/л ↔ г/дл и мг/л ↔ мг/дл используется коэффициент 0,1.</li>
          <li>Молярные пересчёты (глюкоза, креатинин, липиды, гормоны и др.) основаны на стандартных клинических коэффициентах SI ↔ conventional.</li>
        </ul>
        <p>Коэффициенты ориентировочные; для отдельных иммунохимических методик (ФСГ, свободный β-ХГЧ и др.) лаборатории могут использовать собственные факторы. Не заменяет референсные интервалы конкретной лаборатории.</p>
        <p><strong>Источники коэффициентов:</strong> таблица <a href="https://www.mayocliniclabs.com/order-tests/si-unit-conversion.html" target="_blank" rel="noopener noreferrer">International System of Units (SI) Conversion — Mayo Clinic Laboratories</a>; также Labcorp и учебные справочники клинической химии.</p>
      </div>
    </details>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${widget.trim()}
  </script>
</div>
`;

await writeFile(join(calcDir, 'index.html'), html, 'utf8');
console.log(`Built calculators/lab-units/index.html (${ANALYTES.length} analytes)`);
