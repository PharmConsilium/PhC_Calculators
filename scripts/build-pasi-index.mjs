#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PASI_REGIONS,
  PASI_LESION_SIGNS,
  PASI_LESION_LEVELS,
  AREA_LEVELS,
  EASI_REGIONS,
  EASI_SIGNS,
  EASI_SIGN_LEVELS,
  EASI_SCALE,
  PEST_QUESTIONS,
  PEST_JOINTS,
  pestJointDisplayLabel,
  SCORAD_AREA_REGIONS,
  SCORAD_AREA_STEPS,
  SCORAD_INTENSITY_SIGNS,
  SCORAD_INTENSITY_LEVELS,
} from '../calculators/pasi/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'pasi', 'extra.css'), 'utf8'),
]);

const TABS = [
  { id: 'pasi', label: 'PASI', subtitle: 'Индекс площади поражения и тяжести псориаза' },
  { id: 'pest', label: 'PEST', subtitle: 'Скрининг для выявления псориатического артрита' },
  { id: 'easi', label: 'EASI', subtitle: 'Индекс площади поражения и тяжести экземы атопического дерматита' },
  { id: 'scorad', label: 'SCORAD', subtitle: 'Система оценки атопического дерматита' },
];

function fieldId(mode, name, value) {
  return `fc-calc-pasi-${mode}-${name}-${value}`;
}

function renderLesionOptions(regionId, signId, levels, mode, rowClass, labelClass, pointsClass) {
  const name = `${regionId}_${signId}`;
  return levels
    .map((level) => {
      const id = fieldId(mode, name, level.value);
      const checked = level.value === 0 ? ' checked' : '';
      return `                <label class="${rowClass}" for="${id}">
                  <input type="radio" id="${id}" name="${name}" value="${level.value}"${checked} />
                  <span class="${labelClass}">${level.label}</span>
                  <span class="${pointsClass}">${level.value}</span>
                </label>`;
    })
    .join('\n');
}

function renderAreaOptions(regionId, mode, rowClass, labelClass, pointsClass) {
  const name = `${regionId}_area`;
  return AREA_LEVELS.map((level) => {
    const id = fieldId(mode, name, level.value);
    const checked = level.value === 0 ? ' checked' : '';
    return `                <label class="${rowClass}" for="${id}">
                  <input type="radio" id="${id}" name="${name}" value="${level.value}"${checked} />
                  <span class="${labelClass}">${level.label}</span>
                  <span class="${pointsClass}">${level.points}</span>
                </label>`;
  }).join('\n');
}

function renderPasiRegionPanel(region) {
  const signBlocks = PASI_LESION_SIGNS.map(
    (sign) => `              <fieldset class="fc-calc__pasi-group">
                <legend class="fc-calc__pasi-legend">${sign.label}</legend>
                <div class="fc-calc__pasi-options" role="radiogroup" aria-label="${sign.label} — ${region.label}">
${renderLesionOptions(region.id, sign.id, PASI_LESION_LEVELS, 'pasi', 'fc-calc__pasi-row', 'fc-calc__pasi-label', 'fc-calc__pasi-points')}
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
${renderAreaOptions(region.id, 'pasi', 'fc-calc__pasi-row', 'fc-calc__pasi-label', 'fc-calc__pasi-points')}
                </div>
              </fieldset>
              </div>
            </div>
          </div>`;
}

function renderEasiRegionPanel(region) {
  const signBlocks = EASI_SIGNS.map(
    (sign) => `              <fieldset class="fc-calc__easi-group">
                <legend class="fc-calc__easi-legend">${sign.label}</legend>
                <div class="fc-calc__easi-options" role="radiogroup" aria-label="${sign.label} — ${region.label}">
${renderLesionOptions(region.id, sign.id, EASI_SIGN_LEVELS, 'easi', 'fc-calc__easi-row', 'fc-calc__easi-label', 'fc-calc__easi-points')}
                </div>
              </fieldset>`
  ).join('\n');

  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">${region.label}</h3>
              <div class="fc-calc__easi-region">
              <fieldset class="fc-calc__easi-group">
                <legend class="fc-calc__easi-legend">Площадь поражения</legend>
                <div class="fc-calc__easi-options" role="radiogroup" aria-label="Площадь — ${region.label}">
${renderAreaOptions(region.id, 'easi', 'fc-calc__easi-row', 'fc-calc__easi-label', 'fc-calc__easi-points')}
                </div>
              </fieldset>
${signBlocks}
              </div>
            </div>
          </div>`;
}

function renderPestJoint(joint) {
  const id = `fc-calc-pasi-joint-${joint.id}`;
  const displayLabel = pestJointDisplayLabel(joint);
  return `                <label class="fc-calc__pest-joint" for="${id}" data-joint-label="${displayLabel}">
                  <input type="checkbox" id="${id}" name="joint_${joint.id}" value="1" />
                  <span>${joint.label}</span>
                </label>`;
}

function renderPestManikin() {
  const torsoCenter = PEST_JOINTS.filter((j) => j.side === 'center' && j.segment === 'torso')
    .map(renderPestJoint)
    .join('\n');
  const legsCenter = PEST_JOINTS.filter((j) => j.side === 'center' && j.segment === 'legs')
    .map(renderPestJoint)
    .join('\n');
  const torsoRight = PEST_JOINTS.filter((j) => j.side === 'right' && j.segment === 'torso')
    .map(renderPestJoint)
    .join('\n');
  const torsoLeft = PEST_JOINTS.filter((j) => j.side === 'left' && j.segment === 'torso')
    .map(renderPestJoint)
    .join('\n');
  const legsRight = PEST_JOINTS.filter((j) => j.side === 'right' && j.segment === 'legs')
    .map(renderPestJoint)
    .join('\n');
  const legsLeft = PEST_JOINTS.filter((j) => j.side === 'left' && j.segment === 'legs')
    .map(renderPestJoint)
    .join('\n');

  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Схема суставов</h3>
              <p class="fc-calc__pest-intro">Отметьте суставы, которые вызывали дискомфорт (скованность, отёк или боль):</p>
              <div class="fc-calc__pest-manikin">
                <div class="fc-calc__pest-torso">
                  <div class="fc-calc__pest-side fc-calc__pest-side--left">
                    <div class="fc-calc__pest-side-title">Левая рука</div>
${torsoLeft}
                  </div>
                  <div class="fc-calc__pest-spine">
${torsoCenter}
                  </div>
                  <div class="fc-calc__pest-side fc-calc__pest-side--right">
                    <div class="fc-calc__pest-side-title">Правая рука</div>
${torsoRight}
                  </div>
                </div>
                <div class="fc-calc__pest-legs-block">
                  <div class="fc-calc__pest-spine-lower">
${legsCenter}
                  </div>
                  <div class="fc-calc__pest-legs">
                    <div class="fc-calc__pest-leg fc-calc__pest-leg--left">
                      <div class="fc-calc__pest-side-title">Левая нога</div>
${legsLeft}
                    </div>
                    <div class="fc-calc__pest-leg fc-calc__pest-leg--right">
                      <div class="fc-calc__pest-side-title">Правая нога</div>
${legsRight}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
}

function renderPestQuestions() {
  const rows = PEST_QUESTIONS.map((q, index) => {
    const yesId = `fc-calc-pasi-${q.id}-yes`;
    const noId = `fc-calc-pasi-${q.id}-no`;
    return `            <fieldset class="fc-calc__pest-group">
              <legend class="fc-calc__pest-legend">${index + 1}. ${q.label}</legend>
              <div class="fc-calc__pest-options" role="radiogroup" aria-label="Вопрос ${index + 1}">
                <label class="fc-calc__pest-row" for="${yesId}">
                  <input type="radio" id="${yesId}" name="${q.id}" value="yes" />
                  <span class="fc-calc__pest-label">Да</span>
                </label>
                <label class="fc-calc__pest-row" for="${noId}">
                  <input type="radio" id="${noId}" name="${q.id}" value="no" checked />
                  <span class="fc-calc__pest-label">Нет</span>
                </label>
              </div>
            </fieldset>`;
  }).join('\n');

  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Опросник PEST</h3>
              <p class="fc-calc__pest-intro">Инструмент эпидемиологического скрининга псориатического артрита. За каждый ответ «Да» — 1 балл.</p>
${rows}
            </div>
          </div>`;
}

function renderScoradAreaPickers() {
  const blocks = SCORAD_AREA_REGIONS.map((region) => {
    const name = `area_${region.id}`;
    const options = SCORAD_AREA_STEPS.map((step) => {
      const id = `fc-calc-pasi-scorad-${region.id}-${step}`;
      const checked = step === 0 ? ' checked' : '';
      return `                <label class="fc-calc__scorad-area-opt" for="${id}">
                  <input type="radio" id="${id}" name="${name}" value="${step}"${checked} />
                  <span class="fc-calc__scorad-area-opt-label">${step}</span>
                </label>`;
    }).join('\n');
    return `              <fieldset class="fc-calc__scorad-area-group">
                <legend class="fc-calc__scorad-area-legend">${region.label} <span class="fc-calc__scorad-area-hint">${region.hint}</span></legend>
                <div class="fc-calc__scorad-area-options" role="radiogroup" aria-label="Площадь — ${region.label}">
${options}
                </div>
              </fieldset>`;
  }).join('\n');

  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Площадь поражения</h3>
              <div class="fc-calc__scorad-areas">
${blocks}
              </div>
            </div>
          </div>`;
}

function renderScoradIntensity() {
  const blocks = SCORAD_INTENSITY_SIGNS.map((sign) => {
    const options = SCORAD_INTENSITY_LEVELS.map((level) => {
      const id = `fc-calc-pasi-int-${sign.id}-${level.value}`;
      const checked = level.value === 0 ? ' checked' : '';
      return `                <label class="fc-calc__scorad-row" for="${id}">
                  <input type="radio" id="${id}" name="int_${sign.id}" value="${level.value}"${checked} />
                  <span class="fc-calc__scorad-label">${level.label}</span>
                </label>`;
    }).join('\n');
    return `              <fieldset class="fc-calc__scorad-group">
                <legend class="fc-calc__scorad-legend">${sign.label}</legend>
                <div class="fc-calc__scorad-options" role="radiogroup" aria-label="${sign.label}">
${options}
                </div>
              </fieldset>`;
  }).join('\n');

  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Интенсивность (0–3)</h3>
              <div class="fc-calc__scorad-intensity">
${blocks}
              </div>
            </div>
          </div>`;
}

function renderScoradSubjective() {
  return `          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Субъективные симптомы (0–10)</h3>
              <div class="fc-calc__scorad-subjective">
                <div class="fc-calc__field">
                  <label for="fc-calc-pasi-pruritus">Зуд</label>
                  <input type="number" id="fc-calc-pasi-pruritus" name="pruritus" min="0" max="10" step="1" value="0" inputmode="numeric" />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-pasi-sleep">Нарушение сна</label>
                  <input type="number" id="fc-calc-pasi-sleep" name="sleep" min="0" max="10" step="1" value="0" inputmode="numeric" />
                </div>
              </div>
            </div>
          </div>`;
}

function renderEasiResultScale() {
  const scoreCells = EASI_SCALE.map(
    (band) =>
      `              <div class="fc-calc__easi-scale-cell fc-calc__easi-scale-cell--${band.category}" data-easi-category="${band.category}">${band.rangeLabel}</div>`
  ).join('\n');
  const labelCells = EASI_SCALE.map(
    (band) =>
      `              <div class="fc-calc__easi-scale-cell fc-calc__easi-scale-cell--${band.category}" data-easi-category="${band.category}">${band.label}</div>`
  ).join('\n');
  return `            <div class="fc-calc__easi-scale" id="fc-calc-pasi-result-scale-easi" hidden>
              <p class="fc-calc__easi-scale-title">Шкала тяжести EASI</p>
              <div class="fc-calc__easi-scale-row">
                <span class="fc-calc__easi-scale-head">Баллы</span>
                <div class="fc-calc__easi-scale-grid">
${scoreCells}
                </div>
              </div>
              <div class="fc-calc__easi-scale-row">
                <span class="fc-calc__easi-scale-head">Степень</span>
                <div class="fc-calc__easi-scale-grid">
${labelCells}
                </div>
              </div>
            </div>`;
}

function renderTabPanel(mode) {
  const active = mode.id === 'pasi';
  let body = '';
  let resultLabel = mode.label;

  if (mode.id === 'pasi') {
    body = PASI_REGIONS.map(renderPasiRegionPanel).join('\n');
    resultLabel = 'PASI';
  } else if (mode.id === 'pest') {
    body = renderPestQuestions() + '\n' + renderPestManikin();
    resultLabel = 'PEST';
  } else if (mode.id === 'easi') {
    body = EASI_REGIONS.map(renderEasiRegionPanel).join('\n');
    resultLabel = 'EASI';
  } else if (mode.id === 'scorad') {
    body = renderScoradAreaPickers() + '\n' + renderScoradIntensity() + '\n' + renderScoradSubjective();
    resultLabel = 'SCORAD';
  }

  return `        <div
          class="fc-calc__tab-panel${active ? ' fc-calc__tab-panel--active' : ''}"
          data-mode="${mode.id}"
          role="tabpanel"
          id="fc-calc-pasi-panel-${mode.id}"
          aria-labelledby="fc-calc-pasi-tab-${mode.id}"
          ${active ? '' : 'hidden'}
        >
          <form class="fc-calc__form" id="fc-calc-pasi-form-${mode.id}" novalidate>
${body}
          </form>
          <div class="fc-calc__actions">
            <button type="submit" class="fc-calc__btn" form="fc-calc-pasi-form-${mode.id}">Рассчитать</button>
          </div>
          <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-pasi-result-${mode.id}" aria-live="polite">
            <p class="fc-calc__result-label">${resultLabel}</p>
            <p class="fc-calc__result-number" id="fc-calc-pasi-result-number-${mode.id}">—</p>
            <p class="fc-calc__result-desc" id="fc-calc-pasi-result-desc-${mode.id}"></p>
            ${mode.id === 'pest' ? '<p class="fc-calc__result-detail" id="fc-calc-pasi-result-joints-pest"></p>' : ''}
            ${mode.id === 'easi' ? renderEasiResultScale() : ''}
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
          id="fc-calc-pasi-tab-${tab.id}"
          data-mode="${tab.id}"
          aria-selected="${active ? 'true' : 'false'}"
          aria-controls="fc-calc-pasi-panel-${tab.id}"
          tabindex="${active ? '0' : '-1'}"
          title="${tab.label} (${tab.subtitle})"
        >${tab.label}</button>`;
  }).join('\n');

  const panels = TABS.map(renderTabPanel).join('\n');

  return `      <div class="fc-calc__tabs" role="tablist" aria-label="Индексы дерматологических заболеваний">
${tabButtons}
      </div>
${panels}`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчет индексов площади поражения и тяжести дерматологических заболеваний
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
        <h2 class="fc-calc__title">Дерматологические индексы</h2>
        <div class="fc-calc__hint fc-calc__pasi-hint">
${TABS.map((tab) => `          <p class="fc-calc__pasi-hint-line"><strong>${tab.label}</strong> (${tab.subtitle})</p>`).join('\n')}
        </div>
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
        <div class="fc-calc__notes-section">
          <p><strong>PASI</strong> — индекс площади поражения и тяжести псориаза.</p>
          <p><strong>PASI</strong> = сумма по областям: (эритема + индурация + десквамация) × площадь × коэффициент ППТ. Диапазон 0–72.</p>
          <div class="fc-calc__pasi-tables">
            <div class="fc-calc__table-wrap">
              <table class="fc-calc__table fc-calc__pasi-ref-table">
                <colgroup><col class="fc-calc__pasi-col-label" /><col class="fc-calc__pasi-col-value" /></colgroup>
                <thead><tr><th>Область</th><th>Коэффициент ППТ</th></tr></thead>
                <tbody>
                  <tr><td>Голова и шея</td><td>0,1</td></tr>
                  <tr><td>Верхние конечности</td><td>0,2</td></tr>
                  <tr><td>Туловище</td><td>0,3</td></tr>
                  <tr><td>Нижние конечности</td><td>0,4</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="fc-calc__notes-section">
          <p><strong>PEST</strong> — скрининг риска псориатического артрита у пациентов с псориазом. 1 балл за каждый ответ «Да». При сумме ≥ 3 рекомендуется направление к ревматологу.</p>
        </div>
        <div class="fc-calc__notes-section">
          <p><strong>EASI</strong> — индекс площади и тяжести атопического дерматита. Сумма по 4 областям: (эритема + инфильтрация + экскориация + лихенификация) × площадь × коэффициент ППТ.</p>
          <div class="fc-calc__table-wrap">
            <table class="fc-calc__table fc-calc__pasi-ref-table">
              <colgroup><col class="fc-calc__pasi-col-label" /><col class="fc-calc__pasi-col-value" /></colgroup>
              <thead><tr><th>EASI</th><th>Степень</th></tr></thead>
              <tbody>
                <tr><td>0,1–1,0</td><td>Лёгкая</td></tr>
                <tr><td>1,1–7,0</td><td>Умеренная</td></tr>
                <tr><td>7,1–21,0</td><td>Средняя</td></tr>
                <tr><td>21,1–50,0</td><td>Тяжёлая</td></tr>
                <tr><td>50,1–72,0</td><td>Очень тяжёлая</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="fc-calc__notes-section">
          <p><strong>SCORAD</strong> = A / 5 + 7 × I / 2 + S, где A — площадь поражения (%), I — сумма 6 признаков интенсивности (0–3), S — зуд + нарушение сна (0–10 каждый). Диапазон 0–103.</p>
          <div class="fc-calc__table-wrap">
            <table class="fc-calc__table fc-calc__pasi-ref-table">
              <colgroup><col class="fc-calc__pasi-col-label" /><col class="fc-calc__pasi-col-value" /></colgroup>
              <thead><tr><th>SCORAD</th><th>Течение</th></tr></thead>
              <tbody>
                <tr><td>&lt; 20</td><td>Лёгкое</td></tr>
                <tr><td>20–40</td><td>Средней тяжести</td></tr>
                <tr><td>&gt; 40</td><td>Тяжёлое</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <p><strong>Ссылки:</strong></p>
        <p class="fc-calc__source-item">Fredriksson T, Pettersson U. Severe psoriasis — oral therapy with a new retinoid. <em>Dermatologica.</em> 1978;157(4):238-44.</p>
        <p class="fc-calc__source-item">Ibrahim GH, et al. Evaluation of an existing screening tool for psoriatic arthritis. <em>Clin Exp Rheumatol.</em> 2009;27(3):469-474.</p>
        <p class="fc-calc__source-item">Hanifin JM, et al. The Eczema Area and Severity Index (EASI). <em>Exp Dermatol.</em> 2001.</p>
        <p class="fc-calc__source-item">European Task Force on Atopic Dermatitis. Severity scoring of atopic dermatitis: the SCORAD index. <em>Dermatology.</em> 1993;186(1):23-31.</p>
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
${(await readFile(join(root, 'calculators', 'pasi', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'pasi', 'index.html'), html, 'utf8');
console.log('Built calculators/pasi/index.html');
