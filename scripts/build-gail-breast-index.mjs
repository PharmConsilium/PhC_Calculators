#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MENARCHE_OPTIONS,
  BIOPSY_OPTIONS,
  FIRST_BIRTH_RELATIVES_OPTIONS,
  ATYPICAL_OPTIONS,
  BASELINE_OPTIONS,
} from '../calculators/gail-breast/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'gail-breast', 'extra.css'), 'utf8'),
]);

function renderRadioGroup(name, options) {
  const items = options
    .map(
      (opt) => `                <label class="fc-calc__gail-option">
                  <input type="radio" name="${name}" value="${opt.id}" data-coef="${opt.coef}" />
                  <span class="fc-calc__gail-option-text">${opt.label}</span>
                </label>`
    )
    .join('\n');
  return `              <div class="fc-calc__gail-options">\n${items}\n              </div>`;
}

function renderSelect(id, options, placeholder) {
  const groups = new Map();
  for (const opt of options) {
    const group = opt.group || '';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(opt);
  }

  let html = `              <select id="${id}" name="${id}" required>\n                <option value="">${placeholder}</option>`;
  for (const [group, items] of groups) {
    if (group) html += `\n                <optgroup label="${group}">`;
    for (const opt of items) {
      html += `\n                  <option value="${opt.id}" data-coef="${opt.coef}">${opt.label}</option>`;
    }
    if (group) html += `\n                </optgroup>`;
  }
  html += `\n              </select>`;
  return html;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Модель Гейла для риска развития рака молочной железы на протяжении 5 лет
-->
<div class="fc-calc" data-calculator="gail-breast">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Модель Гейла для риска развития рака молочной железы на протяжении 5 лет</h2>
        <p class="fc-calc__hint">Модель Гейла для стратификации риска развития рака молочной железы в ближайшие 5 лет (публикация 1999 г.)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-gail-breast-form" novalidate>
          <div class="fc-calc__gail-groups">
            <div class="fc-calc__gail-field">
              <label>Возраст менархе</label>
${renderRadioGroup('menarche', MENARCHE_OPTIONS)}
            </div>

            <div class="fc-calc__gail-field">
              <label for="fc-calc-gail-breast-biopsies">Кол-во биопсий</label>
${renderSelect('fc-calc-gail-breast-biopsies', BIOPSY_OPTIONS, 'Выберите вариант')}
              <span class="fc-calc__hint fc-calc__field-hint">Связан с возрастом на консультации</span>
            </div>

            <div class="fc-calc__gail-field">
              <label for="fc-calc-gail-breast-first-birth">Возраст РПР, кол-во родственников</label>
${renderSelect('fc-calc-gail-breast-first-birth', FIRST_BIRTH_RELATIVES_OPTIONS, 'Выберите вариант')}
              <span class="fc-calc__hint fc-calc__field-hint">Возраст при рождении первого ребёнка и родственники 1-й степени с РМЖ</span>
            </div>

            <div class="fc-calc__gail-field">
              <label>Атипичная гиперплазия</label>
${renderRadioGroup('atypicalHyperplasia', ATYPICAL_OPTIONS)}
            </div>

            <div class="fc-calc__gail-field">
              <label for="fc-calc-gail-breast-age-race">Возраст, раса на исходном уровне</label>
${renderSelect('fc-calc-gail-breast-age-race', BASELINE_OPTIONS, 'Выберите вариант')}
              <span class="fc-calc__hint fc-calc__field-hint">Текущий возраст и раса пациентки</span>
            </div>

            <div class="fc-calc__gail-field">
              <label for="fc-calc-gail-breast-decimals">Десятичная точность</label>
              <select id="fc-calc-gail-breast-decimals" name="decimals">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2" selected>2</option>
                <option value="3">3</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-gail-breast-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-gail-breast-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-gail-breast-result" aria-live="polite">
        <div class="fc-calc__gail-results">
          <div class="fc-calc__gail-result-item">
            <p class="fc-calc__result-label">Относит. риск</p>
            <p class="fc-calc__result-number" id="fc-calc-gail-breast-result-rr">—</p>
          </div>
          <div class="fc-calc__gail-result-item">
            <p class="fc-calc__result-label">Пятилетний риск</p>
            <p class="fc-calc__result-number" id="fc-calc-gail-breast-result-five">—</p>
          </div>
        </div>
        <p class="fc-calc__result-desc" id="fc-calc-gail-breast-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Убедитесь, что просмотрены все выпадающие варианты — могут быть выбраны несколько факторов риска, если они взаимосвязаны.</p>
        <ul>
          <li><strong>Кол-во биопсий</strong> — число ранее выполненных биопсий молочной железы. Связан с возрастом на консультации.</li>
          <li><strong>Возраст РПР, кол-во родственников</strong> — возраст при рождении первого ребёнка. Связан с числом родственников 1-й степени с раком молочной железы.</li>
          <li><strong>Возраст, раса</strong> — текущий возраст пациентки. Связан с расой.</li>
        </ul>
        <p><strong>Используемые уравнения:</strong></p>
        <p>Относит. риск = Возраст менархе × Кол-во биопсий × Возраст РПР × Кол-во родст. × Атипичн. гиперплазия</p>
        <p>Пятилетний риск = Относит. риск × Возраст/раса на исходном уровне</p>
        <p>Цифры в скобках в исходной модели — дискретные коэффициенты, используемые в расчёте.</p>
        <p><strong>Ссылки:</strong></p>
        <div class="fc-calc__sources">
          <p class="fc-calc__source-item">Gail MH, Constantino JP, Bryant J, et al. Weighing the Risks and Benefits of Tamoxifen Treatment for Preventing Breast Cancer. <em>J Natl Cancer Inst.</em> 1999;91(21):1829-1846. PubMed ID: 10547390</p>
          <p class="fc-calc__source-item">Costantino JP, Gail MH, Pee D, et al. Validation studies for models projecting the risk of invasive and total breast cancer incidence. <em>J Natl Cancer Inst.</em> 1999 Sep 15;91(18):1541-8. PubMed ID: 10491430</p>
        </div>
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
${(await readFile(join(root, 'calculators', 'gail-breast', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'gail-breast', 'index.html'), html, 'utf8');
console.log('Built calculators/gail-breast/index.html');
