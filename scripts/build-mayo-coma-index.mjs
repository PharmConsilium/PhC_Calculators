#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA, INTERPRETATION_ROWS } from '../calculators/mayo-coma/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function formatPoints(value) {
  return value > 0 ? '+' + value : String(value);
}

function renderCriteria() {
  return CRITERIA.map(
    (group) => `            <fieldset class="fc-calc__four-group">
              <legend class="fc-calc__four-legend">${group.number}. ${group.label}</legend>
              <div class="fc-calc__four-options">
${group.options
  .map(
    (opt) => `                <label class="fc-calc__four-option">
                  <input type="radio" name="${group.id}" value="${opt.value}" />
                  <span class="fc-calc__four-option-text">
                    <span class="fc-calc__four-option-label">${opt.label}</span>
                    <span class="fc-calc__four-points">${formatPoints(opt.value)}</span>
                  </span>
                </label>`
  )
  .join('\n')}
              </div>
            </fieldset>`
  ).join('\n');
}

function renderInterpretationTable() {
  return INTERPRETATION_ROWS.map(
    (row) => `                <tr><td>${row.label}</td><td>${row.range}</td></tr>`
  ).join('\n');
}

function renderCriteriaTableRows() {
  return CRITERIA.map((group) =>
    group.options
      .map(
        (opt, idx) => `              <tr>
                ${idx === 0 ? `<td class="fc-calc__table-criterion" rowspan="${group.options.length}">${group.label}</td>` : ''}
                <td>${opt.label}</td>
                <td>${opt.value}</td>
              </tr>`
      )
      .join('\n')
  ).join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'mayo-coma', 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', 'mayo-coma', 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала комы FOUR
-->
<div class="fc-calc" data-calculator="mayo-coma">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала комы FOUR</h2>
        <p class="fc-calc__hint">Шкала комы FOUR служит для градации глубины комы у интубированных больных, так как оценить рефлексы ствола головного мозга или речевую реакцию в данных случаях при помощи шкалы комы Глазго не представляется возможным</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-mayo-coma-form" novalidate>
          <div class="fc-calc__four-groups">
${renderCriteria()}
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-mayo-coma-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-mayo-coma-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-mayo-coma-result" aria-live="polite">
        <p class="fc-calc__result-label">Результат:</p>
        <p class="fc-calc__result-number" id="fc-calc-mayo-coma-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-mayo-coma-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Шкала комы FOUR</strong> (Full Outline of UnResponsiveness) имеет преимущества перед шкалой комы Глазго: точнее детализирует неврологический статус, распознаёт синдром запертого человека, даёт оценку рефлексам ствола мозга и дыхательному паттерну, выявляет различные стадии дислокации (вклинения) мозга.</p>
        <p>Шкала включает 4 параметра с максимальной оценкой «4» по каждому: глазные реакции (открывание глаз и слежение), двигательные реакции (ответ на боль и выполнение простых команд), стволовые рефлексы (зрачковый, роговичный и кашлевой) и дыхательные паттерны (ритм дыхания и дыхательные попытки у пациентов на аппарате ИВЛ). Разработана в Mayo Clinic (Э. Ф. Виджикс и соавт., 2005).</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Критерий</th>
                <th>Ответная реакция</th>
                <th>Баллы</th>
              </tr>
            </thead>
            <tbody>
${renderCriteriaTableRows()}
            </tbody>
          </table>
        </div>
        <div class="fc-calc__four-guide" aria-label="Интерпретация результатов">
          <p class="fc-calc__four-guide-title">Интерпретация полученных результатов</p>
          <table class="fc-calc__four-guide-table">
            <thead>
              <tr>
                <th>Результат</th>
                <th>Набрано баллов</th>
              </tr>
            </thead>
            <tbody>
${renderInterpretationTable()}
            </tbody>
          </table>
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
${widget.trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'mayo-coma', 'index.html'), html, 'utf8');
console.log('Built calculators/mayo-coma/index.html');
