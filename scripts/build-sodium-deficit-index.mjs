#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENDER_OPTIONS, AGE_BANDS, TBW_COEF_TABLE } from '../calculators/sodium-deficit/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'sodium-deficit', 'extra.css'), 'utf8'),
]);

function renderGenderRadios() {
  return GENDER_OPTIONS.map(
    (opt) => `                <label class="fc-calc__na-radio-option">
                  <input type="radio" name="gender" value="${opt.id}" required />
                  <span>${opt.label}</span>
                </label>`
  ).join('\n');
}

function renderAgeRadios() {
  return AGE_BANDS.map(
    (band, i) => `                <label class="fc-calc__na-radio-option">
                  <input type="radio" name="ageBand" value="${band.id}"${i === 1 ? ' checked' : ''} required />
                  <span>${band.label}</span>
                </label>`
  ).join('\n');
}

function renderCoefTable() {
  const header = `                <tr>
                  <th scope="col">Возраст</th>
                  <th scope="col">Мужчина</th>
                  <th scope="col">Женщина</th>
                </tr>`;
  const rows = AGE_BANDS.map((band) => {
    const male = String(TBW_COEF_TABLE.male[band.id]).replace('.', ',');
    const female = String(TBW_COEF_TABLE.female[band.id]).replace('.', ',');
    return `                <tr>
                  <th scope="row">${band.label}</th>
                  <td>${male}</td>
                  <td>${female}</td>
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
  Название: Дефицит натрия при гипонатриемии
-->
<div class="fc-calc" data-calculator="sodium-deficit">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Дефицит натрия при гипонатриемии</h2>
        <p class="fc-calc__hint">Расчёт дефицита натрия (DNa) и вариантов инфузионной коррекции гипонатриемии с учётом пола, возраста и общего количества воды в организме</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-sodium-deficit-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__field">
                <label>Пол</label>
                <div class="fc-calc__na-radio" role="radiogroup" aria-label="Пол">
${renderGenderRadios()}
                </div>
              </div>

              <div class="fc-calc__field">
                <label>Возраст</label>
                <div class="fc-calc__na-radio fc-calc__na-radio--age" role="radiogroup" aria-label="Возраст">
${renderAgeRadios()}
                </div>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-deficit-weight">W — вес тела, кг</label>
                <input type="number" id="fc-calc-sodium-deficit-weight" name="weight" inputmode="decimal" min="0" step="any" placeholder="кг" required />
                <span class="fc-calc__error" id="fc-calc-sodium-deficit-weight-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-deficit-serum">NaP — натрий сыворотки пациента</label>
                <div class="fc-calc__na-field-row">
                  <input type="number" id="fc-calc-sodium-deficit-serum" name="serumNa" inputmode="decimal" min="0" step="any" required />
                  <span class="fc-calc__na-unit">ммоль/л</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-sodium-deficit-serum-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-deficit-desired">NaT — целевой уровень натрия</label>
                <div class="fc-calc__na-field-row">
                  <input type="number" id="fc-calc-sodium-deficit-desired" name="desiredNa" inputmode="decimal" min="0" step="any" value="140" />
                  <span class="fc-calc__na-unit">ммоль/л</span>
                </div>
                <span class="fc-calc__error" id="fc-calc-sodium-deficit-desired-error" role="alert"></span>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-sodium-deficit-decimals">Десятичная точность</label>
                <select id="fc-calc-sodium-deficit-decimals" name="decimals">
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2" selected>2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-sodium-deficit-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-sodium-deficit-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-sodium-deficit-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-sodium-deficit-result" aria-live="polite">
        <div class="fc-calc__na-result">
          <p class="fc-calc__na-result-title">Результат</p>
          <div class="fc-calc__na-result-summary" id="fc-calc-sodium-deficit-result-summary"></div>
          <div class="fc-calc__na-result-solutions" id="fc-calc-sodium-deficit-result-solutions" hidden></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <div class="fc-calc__formula fc-calc__na-formula-note">
          <p class="fc-calc__formula-eq"><strong>DNa</strong> = K × W × (NaT − NaP)</p>
          <ul class="fc-calc__formula-legend">
            <li><strong>K</strong> — коэффициент расчёта общего объёма жидкости организма</li>
            <li><strong>W</strong> — вес тела, кг</li>
            <li><strong>NaT</strong> — целевой уровень натрия, ммоль/л</li>
            <li><strong>NaP</strong> — натрий сыворотки пациента, ммоль/л</li>
          </ul>
        </div>
        <p>Выражение <strong>K × W</strong> представляет нормальное общее количество воды в организме (ОКВО). Коэффициент K зависит от пола и возраста:</p>
${renderCoefTable()}
        <p>Скорость коррекции принята <strong>0,5 ммоль/л/ч</strong> (ммоль/ч = 0,5 × ОКВО). Объём раствора (мл) = DNa / [Na раствора] × 1000; скорость введения (мл/ч) = объём / время коррекции.</p>
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
${(await readFile(join(root, 'calculators', 'sodium-deficit', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'sodium-deficit', 'index.html'), html, 'utf8');
console.log('Built calculators/sodium-deficit/index.html');
