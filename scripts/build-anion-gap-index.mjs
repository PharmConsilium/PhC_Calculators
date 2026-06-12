#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NORMAL_AG,
  NORMAL_AG_RANGE,
  NORMAL_HCO3,
  NORMAL_ALBUMIN_G_DL,
  ALBUMIN_CORRECTION_FACTOR,
} from '../calculators/anion-gap/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'anion-gap', 'extra.css'), 'utf8'),
]);

const TABS = [
  { id: 'basic', label: 'Без альбумина' },
  { id: 'albumin', label: 'С альбумином' },
];

const HINT_TEXT =
  'Анионный разрыв — расчётный показатель, который отражает разницу между концентрациями основных измеряемых катионов (положительно заряженных ионов) и анионов (отрицательно заряженных ионов) в сыворотке крови.';

function renderIonField(mode, id, label, symbol) {
  return `                <div class="fc-calc__field">
                  <label for="fc-calc-anion-gap-${mode}-${id}">${label} (${symbol}), ммоль/л</label>
                  <div class="fc-calc__field-row fc-calc__ag-input-row">
                    <input type="number" id="fc-calc-anion-gap-${mode}-${id}" name="${id}" inputmode="decimal" step="any" required />
                    <span class="fc-calc__ag-unit--fixed">ммоль/л</span>
                  </div>
                </div>`;
}

function renderIonGrid(mode) {
  return `${renderIonField(mode, 'na', 'Натрий', 'Na')}
${renderIonField(mode, 'cl', 'Хлор', 'Cl')}
${renderIonField(mode, 'hco3', 'Бикарбонат', 'HCO₃')}`;
}

function renderAlbuminField(mode) {
  return `                <div class="fc-calc__field">
                  <label for="fc-calc-anion-gap-${mode}-albumin">Альбумин, г/л</label>
                  <div class="fc-calc__field-row fc-calc__ag-input-row">
                    <input type="number" id="fc-calc-anion-gap-${mode}-albumin" name="albumin" inputmode="decimal" step="any" required />
                    <select name="albuminUnit" aria-label="Единицы альбумина">
                      <option value="gL" selected>г/л</option>
                      <option value="gdl">г/дл</option>
                    </select>
                  </div>
                </div>`;
}

function renderTabPanel(mode) {
  const active = mode.id === 'basic';
  const albuminField = mode.id === 'albumin' ? renderAlbuminField(mode.id) : '';
  return `        <div
          class="fc-calc__tab-panel${active ? ' fc-calc__tab-panel--active' : ''}"
          data-mode="${mode.id}"
          role="tabpanel"
          id="fc-calc-anion-gap-panel-${mode.id}"
          aria-labelledby="fc-calc-anion-gap-tab-${mode.id}"
          ${active ? '' : 'hidden'}
        >
          <form class="fc-calc__form" id="fc-calc-anion-gap-form-${mode.id}" novalidate>
            <div class="fc-calc__panel-section">
              <div class="fc-calc__panel">
                <h3 class="fc-calc__panel-heading">Ввод данных</h3>
                <div class="fc-calc__ag-ion-grid">
${renderIonGrid(mode.id)}
${albuminField}
                </div>
              </div>
            </div>
            <span class="fc-calc__error" id="fc-calc-anion-gap-form-error-${mode.id}" role="alert"></span>
          </form>
          <div class="fc-calc__actions">
            <button type="submit" id="fc-calc-anion-gap-btn-${mode.id}" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-anion-gap-form-${mode.id}" disabled>Рассчитать</button>
          </div>
          <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-anion-gap-result-${mode.id}" aria-live="polite">
            <div id="fc-calc-anion-gap-result-body-${mode.id}"></div>
          </div>
        </div>`;
}

function renderTabs() {
  const tabButtons = TABS.map((tab, index) => {
    const active = index === 0;
    return `        <button
          type="button"
          class="fc-calc__tab${active ? ' fc-calc__tab--active' : ''}"
          role="tab"
          id="fc-calc-anion-gap-tab-${tab.id}"
          data-mode="${tab.id}"
          aria-selected="${active ? 'true' : 'false'}"
          aria-controls="fc-calc-anion-gap-panel-${tab.id}"
          tabindex="${active ? '0' : '-1'}"
        >${tab.label}</button>`;
  }).join('\n');

  return `      <div class="fc-calc__tabs" role="tablist" aria-label="Анионный разрыв">
${tabButtons}
      </div>
${TABS.map(renderTabPanel).join('\n')}`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Калькулятор анионного разрыва
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="anion-gap">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Калькулятор анионного разрыва</h2>
        <p class="fc-calc__hint fc-calc__ag-hint">${HINT_TEXT}</p>
      </header>

      <div class="fc-calc__body">
${renderTabs()}
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>АР</strong> = [Na⁺] − ([Cl⁻] + [HCO₃⁻])</p>
        <p><strong>Без альбумина:</strong></p>
        <ul>
          <li>Δ gap = АР пациента − нормальный АР (${NORMAL_AG_RANGE} ммоль/л; в расчёте ${NORMAL_AG})</li>
          <li>Δ ratio = Δ gap / (${NORMAL_HCO3} − HCO₃)</li>
        </ul>
        <p><strong>С коррекцией на альбумин:</strong></p>
        <ul>
          <li>АР с коррекцией = АР + 0,25 × (40 − альбумин, г/л)</li>
          <li>Δ gap (с коррекцией) = АР с коррекцией − ${NORMAL_AG}</li>
          <li>Δ ratio (с коррекцией) = Δ gap (с коррекцией) / (${NORMAL_HCO3} − HCO₃)</li>
        </ul>
        <p>При гипоальбуминемии или гиперальбуминемии коррекция на альбумин может быть точнее. Если альбумин в норме, коррекция не требуется.</p>
        <p><strong>Дельта-соотношение (Δ ratio):</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Δ ratio</th>
                <th>Предлагает</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>&lt; 0,4</td>
                <td>Чистый ацидоз с нормальным анионным разрывом</td>
              </tr>
              <tr>
                <td>0,4–0,8</td>
                <td>Смешанный ацидоз с высоким и нормальным анионным разрывом</td>
              </tr>
              <tr>
                <td>0,8–2,0</td>
                <td>Чистый ацидоз с увеличенным анионным разрывом</td>
              </tr>
              <tr>
                <td>&gt; 2</td>
                <td>Ацидоз с высоким анионным разрывом и предшествующим метаболическим алкалозом</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><strong>Источники</strong></p>
        <p class="fc-calc__ag-source-heading">Оригинал / первичная ссылка</p>
        <p class="fc-calc__ag-source-type">Научная работа</p>
        <p class="fc-calc__source-item">О, MS, Кэрролл Х.Дж. Анионный разрыв. <em>N Engl J Med.</em> 1977;297(15):814–7. <a href="https://doi.org/10.1056/NEJM197710132971507" target="_blank" rel="noopener noreferrer">doi:10.1056/NEJM197710132971507</a>. <a href="https://pubmed.ncbi.nlm.nih.gov/895822/" target="_blank" rel="noopener noreferrer">PMID 895822</a></p>
        <p class="fc-calc__ag-source-heading">Другие ссылки</p>
        <p class="fc-calc__ag-source-type">Научная работа</p>
        <p class="fc-calc__source-item">Кринер Г.Дж. Метаболические нарушения кислотно-щелочного баланса и электролитов. В: Руководство по изучению интенсивной терапии: текст и обзор. 2-е изд. Филадельфия, Пенсильвания: Springer; 2010:696.</p>
        <p class="fc-calc__ag-source-type">Научная работа</p>
        <p class="fc-calc__source-item">Беренд К., Де Врис А.П., Ганс Р.О. Физиологический подход к оценке нарушений кислотно-щелочного баланса. <em>N Engl J Med.</em> 2014;371(15):1434–45. <a href="https://pubmed.ncbi.nlm.nih.gov/25285602/" target="_blank" rel="noopener noreferrer">PMID 25285602</a></p>
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
${(await readFile(join(root, 'calculators', 'anion-gap', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'anion-gap', 'index.html'), html, 'utf8');
console.log('Built calculators/anion-gap/index.html');
