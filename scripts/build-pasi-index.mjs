#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REGIONS,
  LESION_SIGNS,
  LESION_LEVELS,
  AREA_LEVELS,
} from '../calculators/pasi/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'pasi', 'extra.css'), 'utf8'),
]);

function renderLesionOptions(regionId, signId) {
  const name = `${regionId}_${signId}`;
  return LESION_LEVELS.map((level) => {
    const id = `fc-calc-pasi-${name}-${level.value}`;
    const checked = level.value === 0 ? ' checked' : '';
    return `                <label class="fc-calc__pasi-row" for="${id}">
                  <input type="radio" id="${id}" name="${name}" value="${level.value}"${checked} />
                  <span class="fc-calc__pasi-label">${level.label}</span>
                  <span class="fc-calc__pasi-points">${level.value}</span>
                </label>`;
  }).join('\n');
}

function renderAreaOptions(regionId) {
  const name = `${regionId}_area`;
  return AREA_LEVELS.map((level) => {
    const id = `fc-calc-pasi-${name}-${level.value}`;
    const checked = level.value === 0 ? ' checked' : '';
    return `                <label class="fc-calc__pasi-row" for="${id}">
                  <input type="radio" id="${id}" name="${name}" value="${level.value}"${checked} />
                  <span class="fc-calc__pasi-label">${level.label}</span>
                  <span class="fc-calc__pasi-points">${level.points}</span>
                </label>`;
  }).join('\n');
}

function renderRegionPanel(region) {
  const signBlocks = LESION_SIGNS.map(
    (sign) => `              <fieldset class="fc-calc__pasi-group">
                <legend class="fc-calc__pasi-legend">${sign.label}</legend>
                <div class="fc-calc__pasi-options" role="radiogroup" aria-label="${sign.label} — ${region.label}">
${renderLesionOptions(region.id, sign.id)}
                </div>
              </fieldset>`
  ).join('\n');

  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">${region.label}</h3>
              <div class="fc-calc__pasi-region">
${signBlocks}
              <fieldset class="fc-calc__pasi-group">
                <legend class="fc-calc__pasi-legend">Доля поражённой площади</legend>
                <div class="fc-calc__pasi-options" role="radiogroup" aria-label="Доля поражённой площади — ${region.label}">
${renderAreaOptions(region.id)}
                </div>
              </fieldset>
              </div>
            </div>
          </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Индекс площади поражения и тяжести псориаза (PASI)
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="pasi">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Индекс площади поражения и тяжести псориаза (PASI)</h2>
        <p class="fc-calc__hint">Оценка площади поражения и тяжести псориаза по четырём областям тела</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-pasi-form" novalidate>
${REGIONS.map(renderRegionPanel).join('\n')}
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-pasi-btn" class="fc-calc__btn" form="fc-calc-pasi-form">Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-pasi-result" aria-live="polite">
        <p class="fc-calc__result-label">PASI</p>
        <p class="fc-calc__result-number" id="fc-calc-pasi-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-pasi-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>PASI</strong> = сумма по областям: (эритема + индурация + десквамация) × площадь × коэффициент ППТ</p>
        <p>Общий PASI — сумма по каждой области (голова и шея, верхние конечности, туловище, нижние конечности). PASI области = тяжесть поражения × балл площади × коэффициент ППТ. Тяжесть поражения = эритема + индурация / утолщение + десквамация / шелушение (каждый признак 0–4).</p>
        <div class="fc-calc__pasi-tables">
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table fc-calc__pasi-ref-table">
            <colgroup>
              <col class="fc-calc__pasi-col-label" />
              <col class="fc-calc__pasi-col-value" />
            </colgroup>
            <thead>
              <tr>
                <th>Признак поражения</th>
                <th>Баллы</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Нет</td><td>0</td></tr>
              <tr><td>Слабая</td><td>1</td></tr>
              <tr><td>Умеренная</td><td>2</td></tr>
              <tr><td>Выраженная</td><td>3</td></tr>
              <tr><td>Очень выраженная</td><td>4</td></tr>
            </tbody>
          </table>
        </div>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table fc-calc__pasi-ref-table">
            <colgroup>
              <col class="fc-calc__pasi-col-label" />
              <col class="fc-calc__pasi-col-value" />
            </colgroup>
            <thead>
              <tr>
                <th>Доля поражённой площади</th>
                <th>Баллы</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>0%</td><td>0</td></tr>
              <tr><td>1–9%</td><td>1</td></tr>
              <tr><td>10–29%</td><td>2</td></tr>
              <tr><td>30–49%</td><td>3</td></tr>
              <tr><td>50–69%</td><td>4</td></tr>
              <tr><td>70–89%</td><td>5</td></tr>
              <tr><td>90–100%</td><td>6</td></tr>
            </tbody>
          </table>
        </div>
        <p class="fc-calc__pasi-table-note">Оценка площади валидирована методом «ладони» (ладонь пациента без пальцев ≈ 1% ППТ).</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table fc-calc__pasi-ref-table">
            <colgroup>
              <col class="fc-calc__pasi-col-label" />
              <col class="fc-calc__pasi-col-value" />
            </colgroup>
            <thead>
              <tr>
                <th>Область</th>
                <th>Коэффициент ППТ</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Голова и шея</td><td>0,1</td></tr>
              <tr><td>Верхние конечности</td><td>0,2</td></tr>
              <tr><td>Туловище</td><td>0,3</td></tr>
              <tr><td>Нижние конечности</td><td>0,4</td></tr>
            </tbody>
          </table>
        </div>
        </div>
        <p><strong>Интерпретация:</strong> чем выше PASI, тем тяжелее псориаз. Диапазон 0 (нет заболевания) — 72 (максимальная тяжесть). При динамическом наблюдении PASI 75 означает снижение на 75% (хороший ответ на терапию); PASI 50–74 — частичный ответ; PASI &lt;50 — неудача лечения.</p>
        <p><strong>Ссылки:</strong></p>
        <p class="fc-calc__source-item">Fredriksson T, Pettersson U. Severe psoriasis — oral therapy with a new retinoid. <em>Dermatologica.</em> 1978;157(4):238-44. <a href="https://pubmed.ncbi.nlm.nih.gov/357213/" target="_blank" rel="noopener noreferrer">PubMed 357213</a></p>
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
${(await readFile(join(root, 'calculators', 'pasi', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'pasi', 'index.html'), html, 'utf8');
console.log('Built calculators/pasi/index.html');
