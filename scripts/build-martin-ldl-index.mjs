#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'martin-ldl', 'extra.css'), 'utf8'),
]);

function renderLipidField(id, label) {
  return `              <div class="fc-calc__noa-field">
                <label class="fc-calc__noa-field-label" for="fc-calc-martin-ldl-${id}">${label}</label>
                <input type="number" class="fc-calc__noa-field-input" id="fc-calc-martin-ldl-${id}" name="${id}" inputmode="decimal" min="0" step="any" placeholder="ммоль/л" required />
                <span class="fc-calc__error" id="fc-calc-martin-ldl-${id}-error" role="alert"></span>
              </div>`;
}

function renderLdlResult(num, id, formula) {
  return `          <div class="fc-calc__noa-ldl">
            <p class="fc-calc__noa-ldl-title">ХС ЛПНП (${num})</p>
            <div class="fc-calc__noa-ldl-value-row">
              <span class="fc-calc__noa-ldl-value" id="fc-calc-martin-ldl-${id}">—</span>
              <span class="fc-calc__noa-ldl-unit">ммоль/л</span>
            </div>
            <p class="fc-calc__noa-ldl-formula">${formula}</p>
          </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчёт ХС ЛПНП
  Сборка: 2026-06-09m
-->
<div class="fc-calc" data-calculator="martin-ldl" data-build="2026-06-09m">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Расчёт ХС ЛПНП</h2>
        <p class="fc-calc__hint">Формулы Мартина-Хопкинса, Сэмпсона и Фридвальда (ммоль/л)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-martin-ldl-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel fc-calc__noa-panel">
              <h3 class="fc-calc__panel-heading">Введите данные:</h3>
${renderLipidField('total', 'Холестерин')}
${renderLipidField('hdl', 'ХС ЛПВП')}
${renderLipidField('tg', 'Триглицериды')}
            </div>
          </div>

          <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-martin-ldl-result" aria-live="polite">
            <div class="fc-calc__panel fc-calc__noa-panel">
              <h3 class="fc-calc__panel-heading">Результат:</h3>
${renderLdlResult('1', 'martin', 'Формула Мартина-Хопкинса')}
${renderLdlResult('2', 'sampson', 'Формула Сэмпсона')}
${renderLdlResult('3', 'friedewald', 'Формула Фридвальда')}
              <p class="fc-calc__result-desc" id="fc-calc-martin-ldl-warning"></p>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-martin-ldl-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-martin-ldl-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-martin-ldl-form" disabled>Рассчитать</button>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Все значения вводятся и рассчитываются в ммоль/л.</p>
        <p><strong>Формула Мартина-Хопкинса (NOA):</strong> ХС ЛПНП = неЛПВП − ТГ / (K × 0,43658), неЛПВП = ОХ − ЛПВП. K — из таблицы по триглицеридам (мг/дл).</p>
        <p>Формула Мартина-Хопкинса повышает точность определения уровня ХС ЛПНП при его низкой концентрации, но не может быть применима при концентрации триглицеридов ≥4,5 ммоль/л.</p>
        <p><strong>Формула Сэмпсона (NOA):</strong> ХС ЛПНП = ОХ / 0,948 − ЛПВП / 0,971 − (ТГ / 3,74 + ТГ × неЛПВП / 24,16 − ТГ² / 79,36) − 0,244 (ммоль/л).</p>
        <p>Формула Сэмпсона может быть использована для расчёта ХС ЛПНП как при нормальном, так и при повышенном уровне триглицеридов.</p>
        <p><strong>Формула Фридвальда:</strong> ХС ЛПНП = ОХС − ЛПВП − ТГ / 2,2.</p>
        <p>Формула Фридвальда позволяет получить значения ХС ЛПНП, сопоставимые с прямым измерением, при уровне триглицеридов до 4,5 ммоль/л.</p>
        <p>Результаты выводятся с точностью до 2 знаков после запятой (без округления в большую сторону).</p>
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
${(await readFile(join(root, 'calculators', 'martin-ldl', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'martin-ldl', 'index.html'), html, 'utf8');
console.log('Built calculators/martin-ldl/index.html');
