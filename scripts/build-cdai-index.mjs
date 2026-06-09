#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LARGE_JOINTS,
  HAND_ROW1,
  HAND_ROW2,
  FINGER_LABELS,
  KNEE_JOINT,
  SIDES,
} from '../calculators/cdai/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'cdai', 'extra.css'), 'utf8'),
]);

function checkboxId(prefix, sideId, jointId) {
  return `fc-calc-cdai-${prefix}-${sideId}-${jointId}`;
}

function renderLargeJoint(prefix, sideId, joint) {
  const id = checkboxId(prefix, sideId, joint.id);
  if (sideId === 'left') {
    return `                <label class="fc-calc__cdai-joint fc-calc__cdai-joint--bar fc-calc__cdai-joint--left">
                  <span>${joint.label}</span>
                  <input type="checkbox" id="${id}" name="${id}" data-joint-prefix="${prefix}" data-side="${sideId}" data-joint="${joint.id}" />
                </label>`;
  }
  return `                <label class="fc-calc__cdai-joint fc-calc__cdai-joint--bar fc-calc__cdai-joint--right">
                  <input type="checkbox" id="${id}" name="${id}" data-joint-prefix="${prefix}" data-side="${sideId}" data-joint="${joint.id}" />
                  <span>${joint.label}</span>
                </label>`;
}

function jointShortLabel(joint) {
  if (joint.id.startsWith('mcp')) return 'MCP';
  if (joint.id.startsWith('ip')) return 'IP';
  return 'PIP';
}

function renderHandCell(prefix, sideId, joint) {
  const id = checkboxId(prefix, sideId, joint.id);
  const short = jointShortLabel(joint);
  return `                  <label class="fc-calc__cdai-hand-cell" aria-label="${joint.label}" title="${joint.label}">
                    <span class="fc-calc__cdai-hand-cell-label">${short}</span>
                    <input type="checkbox" id="${id}" name="${id}" data-joint-prefix="${prefix}" data-side="${sideId}" data-joint="${joint.id}" aria-label="${joint.label}" />
                  </label>`;
}

function renderHandFinger(prefix, sideId, mcpJoint, distalJoint, finger) {
  const mcp = renderHandCell(prefix, sideId, mcpJoint);
  const distal = renderHandCell(prefix, sideId, distalJoint);
  return `                  <div class="fc-calc__cdai-hand-finger fc-calc__cdai-hand-finger--${finger.num}" title="${finger.fullName}">
${mcp}
${distal}
                    <div class="fc-calc__cdai-hand-finger-stem" aria-hidden="true"></div>
                    <span class="fc-calc__cdai-hand-finger-label">
                      <span class="fc-calc__cdai-hand-finger-num">${finger.num}</span>
                      <span class="fc-calc__cdai-hand-finger-name">${finger.name}</span>
                    </span>
                  </div>`;
}

function renderHandGrid(prefix, sideId, handLabel) {
  const fingers = HAND_ROW1.map((mcp, index) =>
    renderHandFinger(prefix, sideId, mcp, HAND_ROW2[index], FINGER_LABELS[index]),
  ).join('\n');
  return `              <div class="fc-calc__cdai-hand">
                <div class="fc-calc__cdai-hand-title-bar">${handLabel}</div>
                <div class="fc-calc__cdai-hand-grid">
${fingers}
                </div>
              </div>`;
}

function renderSideJoints(prefix, side, joints) {
  const items = joints.map((j) => renderLargeJoint(prefix, side.id, j)).join('\n');
  return `              <div class="fc-calc__cdai-side fc-calc__cdai-side--${side.id}">
${items}
              </div>`;
}

function renderPanel(prefix, title, shortLabel) {
  const rightUpper = renderSideJoints(prefix, SIDES[0], LARGE_JOINTS);
  const rightHand = renderHandGrid(prefix, 'right', SIDES[0].label);
  const leftUpper = renderSideJoints(prefix, SIDES[1], LARGE_JOINTS);
  const leftHand = renderHandGrid(prefix, 'left', SIDES[1].label);
  const rightKnee = renderSideJoints(prefix, SIDES[0], [KNEE_JOINT]);
  const leftKnee = renderSideJoints(prefix, SIDES[1], [KNEE_JOINT]);

  return `          <div class="fc-calc__panel fc-calc__cdai-panel" data-panel="${prefix}">
            <h3 class="fc-calc__panel-heading">${title}</h3>
            <div class="fc-calc__cdai-panel-body">
${rightUpper}
${rightHand}
${leftUpper}
${leftHand}
              <div class="fc-calc__cdai-joints-row">
${rightKnee}
${leftKnee}
              </div>
            </div>
            <div class="fc-calc__cdai-panel-foot">
              <div class="fc-calc__cdai-count">
                <span>${shortLabel}</span>
                <input type="text" id="fc-calc-cdai-${prefix}-count" class="fc-calc__cdai-count-output" readonly value="0" aria-live="polite" />
              </div>
              <div class="fc-calc__cdai-panel-actions">
                <button type="button" class="fc-calc__cdai-action" data-prefix="${prefix}" data-cdai-action="all">Выбрать все</button>
                <button type="button" class="fc-calc__cdai-action" data-prefix="${prefix}" data-cdai-action="none">Очистить все</button>
              </div>
            </div>
          </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Индекс клинической активности заболевания ревматоидным артритом (CDAI)
-->
<div class="fc-calc" data-calculator="cdai">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Индекс CDAI</h2>
        <p class="fc-calc__hint">Клиническая активность ревматоидного артрита: CDAI = SJC + TJC + PGA + EGA</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-cdai-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>
              <div class="fc-calc__cdai-assess-row">
                <div class="fc-calc__field">
                  <label for="fc-calc-cdai-pga">PGA — оценка пациентом (0–10)</label>
                  <input type="number" id="fc-calc-cdai-pga" name="pga" min="0" max="10" step="any" inputmode="decimal" placeholder="0–10" required />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-cdai-ega">EGA — оценка специалистом (0–10)</label>
                  <input type="number" id="fc-calc-cdai-ega" name="ega" min="0" max="10" step="any" inputmode="decimal" placeholder="0–10" required />
                </div>
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
${renderPanel('tjc', 'Количество болезненных суставов', 'TJC')}
          </div>

          <div class="fc-calc__panel-section">
${renderPanel('sjc', 'Количество припухших суставов', 'SJC')}
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-cdai-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-cdai-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-cdai-result" aria-live="polite">
        <p class="fc-calc__result-label">CDAI</p>
        <p class="fc-calc__result-number" id="fc-calc-cdai-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-cdai-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Интерпретация CDAI:</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>CDAI</th>
                <th>Активность</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>≤ 2,8</td><td>Ремиссия</td></tr>
              <tr><td>&gt; 2,8 и ≤ 10</td><td>Низкая активность заболевания</td></tr>
              <tr><td>&gt; 10 и ≤ 22</td><td>Умеренная активность заболевания</td></tr>
              <tr><td>&gt; 22</td><td>Высокая активность заболевания</td></tr>
            </tbody>
          </table>
        </div>
        <p>Суставы кистей: с 1-го по 5-й пястно-фаланговые, межфаланговый большого пальца и со 2-го по 5-й проксимальные межфаланговые.</p>
        <p>PGA и EGA — шкала 0–10 (10 = максимальная активность). Снижение CDAI на 6,5 — умеренное улучшение.</p>
        <p><strong>Ссылки:</strong></p>
        <p class="fc-calc__source-item">Aletaha D, Nell VP, Stamm T, et al. Acute phase reactants add little to composite disease activity indices for rheumatoid arthritis: validation of a clinical activity score. <em>Arthritis Res Ther.</em> 2005;7(4):R796-806. <a href="https://pubmed.ncbi.nlm.nih.gov/15987481/" target="_blank" rel="noopener noreferrer">PubMed 15987481</a></p>
        <p class="fc-calc__source-item">Aletaha D, Smolen J. The Simplified Disease Activity Index (SDAI) and the Clinical Disease Activity Index (CDAI): a review of their usefulness and validity in rheumatoid arthritis. <em>Clin Exp Rheumatol.</em> 2005 Sep-Oct;23(5 Suppl 39):S100-8. <a href="https://pubmed.ncbi.nlm.nih.gov/16273793/" target="_blank" rel="noopener noreferrer">PubMed 16273793</a></p>
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
${(await readFile(join(root, 'calculators', 'cdai', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'cdai', 'index.html'), html, 'utf8');
console.log('Built calculators/cdai/index.html');
