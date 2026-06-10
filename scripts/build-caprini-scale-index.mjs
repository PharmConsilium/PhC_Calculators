#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUPS, INTERPRETATION_ROWS } from '../calculators/caprini-scale/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'caprini-scale';

function formatPoints(points) {
  return '+' + points;
}

function renderGroup(group) {
  const inputType = group.type === 'radio' ? 'radio' : 'checkbox';
  const options = group.options
    .map((opt) => {
      const id = `fc-calc-${slug}-${opt.id}`;
      const name = group.type === 'radio' ? group.id : opt.id;
      return `                <label class="fc-calc__caprini-row" for="${id}">
                  <input type="${inputType}" id="${id}" name="${name}" value="${opt.id}" data-points="${opt.points}" />
                  <span class="fc-calc__caprini-label">${opt.label}</span>
                  <span class="fc-calc__caprini-points">${formatPoints(opt.points)}</span>
                </label>`;
    })
    .join('\n');

  return `            <fieldset class="fc-calc__caprini-group">
              <legend class="fc-calc__caprini-legend">${group.number}. ${group.label}</legend>
              <div class="fc-calc__caprini-options" role="${group.type === 'radio' ? 'radiogroup' : 'group'}" aria-label="${group.label}">
${options}
              </div>
            </fieldset>`;
}

function renderGroups() {
  return GROUPS.map(renderGroup).join('\n');
}

function renderCriteriaRows() {
  return GROUPS.flatMap((group) =>
    group.options.map(
      (opt) => `              <tr>
                <td>${group.label}</td>
                <td>${opt.label}</td>
                <td>${opt.points}</td>
              </tr>`
    )
  ).join('\n');
}

function renderInterpRows() {
  return INTERPRETATION_ROWS.map(
    (row) => `              <tr><td>${row.label}</td><td>${row.range}</td></tr>`
  ).join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала Caprini
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала Caprini</h2>
        <p class="fc-calc__hint">Шкала Caprini — инструмент для оценки риска развития венозных тромбоэмболических осложнений у пациентов хирургического профиля. Разработана Джозефом Каприни (Joseph Caprini), доктором медицинских наук, преподавателем-клиницистом Чикагского университета, США. Шкала входит в Клинические рекомендации «Варикозное расширение вен нижних конечностей»</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-${slug}-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Шкала Caprini</h3>
              <div class="fc-calc__caprini-groups">
${renderGroups()}
              </div>
            </div>
          </div>
          <p class="fc-calc__form-error" id="fc-calc-${slug}-form-error" role="alert"></p>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-${slug}-btn" class="fc-calc__btn" form="fc-calc-${slug}-form">Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-result" aria-live="polite">
        <p class="fc-calc__result-label">Результат:</p>
        <p class="fc-calc__result-number" id="fc-calc-${slug}-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-${slug}-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Шкала Caprini является одним из способов оценки опасности развития послеоперационных венозных тромбоэмболических осложнений, используя учёт выраженной в баллах суммы всех индивидуальных предрасполагающих к тромбозу состояний.</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Раздел</th>
                <th>Критерий</th>
                <th>Баллы</th>
              </tr>
            </thead>
            <tbody>
${renderCriteriaRows()}
            </tbody>
          </table>
        </div>
        <p>Интерпретация полученных результатов:</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Результат</th>
                <th>Набрано баллов</th>
              </tr>
            </thead>
            <tbody>
${renderInterpRows()}
            </tbody>
          </table>
        </div>
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
${widget.trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', slug, 'index.html'), html, 'utf8');
console.log(`Built calculators/${slug}/index.html`);
