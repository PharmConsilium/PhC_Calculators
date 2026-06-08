#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'fluid-req', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчет физиологической потребности в жидкости
-->
<div class="fc-calc" data-calculator="fluid-req">
  <style>
${css.trim()}
${extra.trim() ? '\n' + extra.trim() : ''}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Расчет физиологической потребности в жидкости</h2>
        <p class="fc-calc__hint">Объём внутривенной инфузионной терапии для обеспечения физиологической потребности в жидкости по правилу 4-2-1.</p>
        <p class="fc-calc__formula"><strong>0–10 кг:</strong> 4 мл/кг/ч &nbsp;|&nbsp; <strong>10–20 кг:</strong> +2 мл/кг/ч &nbsp;|&nbsp; <strong>&gt;20 кг:</strong> +1 мл/кг/ч</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-fluid-req-form" novalidate>
          <div class="fc-calc__field">
            <label for="fc-calc-fluid-req-weight">Масса тела (кг)</label>
            <input type="number" id="fc-calc-fluid-req-weight" name="weightKg" inputmode="decimal" min="0" step="any" placeholder="кг" />
            <span class="fc-calc__error" id="fc-calc-fluid-req-weight-error" role="alert"></span>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-fluid-req-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-fluid-req-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-fluid-req-result" aria-live="polite">
        <div class="fc-calc__fluid-results">
          <div class="fc-calc__fluid-result-item">
            <p class="fc-calc__result-label">Объем поддержания</p>
            <p class="fc-calc__result-number" id="fc-calc-fluid-req-result-maintenance">—</p>
          </div>
          <div class="fc-calc__fluid-result-item">
            <p class="fc-calc__result-label">Суточный объем</p>
            <p class="fc-calc__result-number" id="fc-calc-fluid-req-result-daily">—</p>
          </div>
          <div class="fc-calc__fluid-result-item">
            <p class="fc-calc__result-label">Болюс</p>
            <p class="fc-calc__result-number" id="fc-calc-fluid-req-result-bolus">—</p>
          </div>
        </div>
        <p class="fc-calc__result-desc" id="fc-calc-fluid-req-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Калькулятор может быть использован для расчёта потребностей в жидкости у пациентов, не получающих воду перорально (послеоперационный период, дегидратация, рвота и др.).</p>
        <p><strong>Формула (правило 4-2-1):</strong></p>
        <ul>
          <li>0–10 кг: 4 мл/кг/ч</li>
          <li>10–20 кг: +2 мл/кг/ч (к первым 40 мл/ч)</li>
          <li>&gt;20 кг: +1 мл/кг/ч (к первым 60 мл/ч)</li>
        </ul>
        <p><strong>Примеры поддержания:</strong> 5 кг → 20 мл/ч; 15 кг → 50 мл/ч; 70 кг → 110 мл/ч.</p>
        <p><strong>Болюс (методика АВС):</strong> 20 мл/кг — ориентировочный объём болюсной инфузии при острой дегидратации (до 3 болюсов по клиническому состоянию).</p>
        <p class="fc-calc__hint">Источник: В.И. Гордеев, Ю.С. Александрович. АВС инфузионной терапии и парентерального питания в педиатрии. СПб, 2006.</p>
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
${(await readFile(join(root, 'calculators', 'fluid-req', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'fluid-req', 'index.html'), html, 'utf8');
console.log('Built calculators/fluid-req/index.html');
