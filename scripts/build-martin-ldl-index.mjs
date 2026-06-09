#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COEF_TABLE, NON_HDL_HEADERS } from '../calculators/martin-ldl/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'martin-ldl', 'extra.css'), 'utf8'),
]);

function formatTgRange(row) {
  if (row.tgMax >= 1000) return `${row.tgMin}–${row.tgMax}`;
  return `${row.tgMin}–${row.tgMax}`;
}

function formatCoef(value) {
  return String(value).replace('.', ',');
}

function renderCoefTable() {
  const headerCells = NON_HDL_HEADERS.map((h) => `<th>${h}</th>`).join('\n                ');
  const bodyRows = COEF_TABLE.map((row) => {
    const cells = row.coefs.map((c) => `<td>${formatCoef(c)}</td>`).join('\n                ');
    return `              <tr>
                <th scope="row">${formatTgRange(row)}</th>
                ${cells}
              </tr>`;
  }).join('\n');
  return `        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table fc-calc__table--compact">
            <caption>Новые коэффициенты на основе триглицеридов и холестерина не-ЛПВП</caption>
            <thead>
              <tr>
                <th scope="col">Триглицериды, мг/дл</th>
                <th scope="colgroup" colspan="6">Холестерин не-ЛПВП, мг/дл</th>
              </tr>
              <tr>
                <th scope="col"></th>
                ${headerCells}
              </tr>
            </thead>
            <tbody>
${bodyRows}
            </tbody>
          </table>
        </div>`;
}

function renderLipidField(id, label) {
  return `              <div class="fc-calc__field">
                <label for="fc-calc-martin-ldl-${id}">${label}</label>
                <div class="fc-calc__field-row">
                  <input type="number" id="fc-calc-martin-ldl-${id}" name="${id}" inputmode="decimal" min="0" step="any" required />
                  <select id="fc-calc-martin-ldl-${id}-unit" name="${id}Unit" aria-label="Единица ${label.toLowerCase()}">
                    <option value="mg/dL" selected>mg/dL</option>
                  </select>
                </div>
                <span class="fc-calc__error" id="fc-calc-martin-ldl-${id}-error" role="alert"></span>
              </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Уравнение Мартина для липопротеинов низкой плотности (ХС-ЛПНП)
  Сборка: 2026-06-08
-->
<div class="fc-calc" data-calculator="martin-ldl">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Уравнение Мартина для липопротеинов низкой плотности (ХС-ЛПНП)</h2>
        <p class="fc-calc__hint">Расчёт холестерина ЛПНП по уравнению Мартина с индивидуальным коэффициентом на основе триглицеридов и холестерина не-ЛПВП</p>
        <p class="fc-calc__formula"><strong>ХС ЛПНП</strong> = ХС не-ЛПВП − (Триглицериды / Новый коэффициент)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-martin-ldl-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>
${renderLipidField('total', 'Общий холестерин')}
${renderLipidField('hdl', 'Холестерин ЛПВП')}
${renderLipidField('tg', 'Триглицериды')}

              <div class="fc-calc__field">
                <label for="fc-calc-martin-ldl-decimals">Десятичная точность</label>
                <select id="fc-calc-martin-ldl-decimals" name="decimals">
                  <option value="0">0</option>
                  <option value="1" selected>1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-martin-ldl-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-martin-ldl-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-martin-ldl-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-martin-ldl-result" aria-live="polite">
        <div class="fc-calc__panel fc-calc__martin-result-panel">
          <h3 class="fc-calc__panel-heading">Результаты</h3>

          <div class="fc-calc__martin-result-row">
            <p class="fc-calc__martin-result-label">Холестерин не-ЛПВП</p>
            <p class="fc-calc__martin-result-value" id="fc-calc-martin-ldl-nonhdl">—</p>
            <p class="fc-calc__martin-result-unit">mg/dL</p>
          </div>

          <div class="fc-calc__martin-result-row">
            <p class="fc-calc__martin-result-label">Новый коэффициент</p>
            <p class="fc-calc__martin-result-value" id="fc-calc-martin-ldl-coef">—</p>
            <p class="fc-calc__martin-result-unit" aria-hidden="true"></p>
          </div>

          <div class="fc-calc__martin-result-row fc-calc__martin-result-row--primary">
            <p class="fc-calc__martin-result-label">Холестерин ЛПНП</p>
            <p class="fc-calc__martin-result-value" id="fc-calc-martin-ldl-ldl">—</p>
            <p class="fc-calc__martin-result-unit">mg/dL</p>
          </div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Новый коэффициент представляет собой соотношение между триглицеридами и холестерином ЛПОНП. Это соотношение меняется в зависимости от уровней триглицеридов и холестерина не-ЛПВП.</p>
        <p>Новый коэффициент повышает точность определения холестерина ЛПНП в широком диапазоне уровней триглицеридов. Значения коэффициента приведены в таблице ниже.</p>
        <p><strong>Используемые уравнения:</strong></p>
        <ul>
          <li>Холестерин не-ЛПВП = Общий холестерин − Холестерин ЛПВП</li>
          <li>Холестерин ЛПНП = Холестерин не-ЛПВП − (Триглицериды / Новый коэффициент)</li>
        </ul>
${renderCoefTable()}
        <p><strong>Ссылки:</strong> Martin SS, Blaha MJ, Elshazly MB, et al. Comparison of a novel method vs the Friedewald equation for estimating low-density lipoprotein cholesterol levels from the standard lipid profile. <em>JAMA</em>. 2013 Nov 20;310(19):2061-8. <a href="https://pubmed.ncbi.nlm.nih.gov/24240933/" target="_blank" rel="noopener noreferrer">PubMed ID: 24240933</a></p>
        <p class="fc-calc__hint">Источник: <a href="https://www.msdmanuals.com/ru/professional/searchresults?query=%D0%9C%D0%B0%D1%80%D1%82%D0%B8%D0%BD%D0%B0%20%D0%B4%D0%BB%D1%8F%20%D0%BB%D0%B8%D0%BF%D0%BE%D0%BF%D1%80%D0%BE%D1%82%D0%B5%D0%B8%D0%BD%D0%BE%D0%B2%20%D0%BD%D0%B8%D0%B7%D0%BA%D0%BE%D0%B9%20%D0%BF%D0%BB%D0%BE%D1%82%D0%BD%D0%BE%D1%81%D1%82%D0%B8%20(%D0%A5C-%D0%9B%D0%9F%D0%9D%D0%9F)" target="_blank" rel="noopener noreferrer">MSD Manuals</a></p>
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
