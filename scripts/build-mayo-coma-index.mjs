#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA } from '../calculators/mayo-coma/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'mayo-coma', 'extra.css'), 'utf8'),
]);

function renderGroups() {
  return CRITERIA.map((criterion) => {
    const options = criterion.options
      .slice()
      .sort((a, b) => b.value - a.value)
      .map(
        (opt) => `                <label class="fc-calc__four-option">
                  <input type="radio" name="${criterion.id}" value="${opt.value}" />
                  <span class="fc-calc__four-option-text">${opt.label}</span>
                </label>`
      )
      .join('\n');

    return `            <fieldset class="fc-calc__four-group">
              <legend class="fc-calc__four-legend">${criterion.label}</legend>
              <div class="fc-calc__four-options">
${options}
              </div>
            </fieldset>`;
  }).join('\n');
}

function renderCriteriaTable() {
  return CRITERIA.map((criterion) => {
    const rows = criterion.options
      .slice()
      .sort((a, b) => b.value - a.value)
      .map(
        (opt, idx) => `              <tr>
                ${idx === 0 ? `<td class="fc-calc__table-criterion" rowspan="${criterion.options.length}">${criterion.label.replace(/ \(.\)$/, '')}</td>` : ''}
                <td>${opt.label}</td>
                <td>${opt.value}</td>
              </tr>`
      )
      .join('\n');
    return rows;
  }).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала комы Мэйо
-->
<div class="fc-calc" data-calculator="mayo-coma">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала комы Мэйо</h2>
        <p class="fc-calc__hint">FOUR (Full Outline of UnResponsiveness) — оценка уровня сознания у в том числе интубированных пациентов</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-mayo-coma-form" novalidate>
          <div class="fc-calc__four-groups">
${renderGroups()}
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-mayo-coma-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-mayo-coma-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-mayo-coma-result" aria-live="polite">
        <p class="fc-calc__result-label">Общий результат</p>
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
        <p>Шкала разработана в 2005 году в клинике Mayo. В англоязычной литературе упоминается как шкала Full Outline of UnResponsiveness (FOUR).</p>
        <p><strong>Оценка по баллам:</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Баллы</th>
                <th>Интерпретация</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>16</td><td>сознание ясное</td></tr>
              <tr><td>15</td><td>сомноленция</td></tr>
              <tr><td>14</td><td>оглушение</td></tr>
              <tr><td>9–12</td><td>сопор</td></tr>
              <tr><td>4–8</td><td>кома</td></tr>
              <tr><td>0–3</td><td>смерть мозга</td></tr>
            </tbody>
          </table>
        </div>
        <p>Преимущество по сравнению со шкалой комы Глазго: не надо добиваться речевого контакта у интубированного или трахеостомированного пациента.</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Критерий</th>
                <th>Ответная реакция</th>
                <th>Оценка</th>
              </tr>
            </thead>
            <tbody>
${renderCriteriaTable()}
            </tbody>
          </table>
        </div>
        <div class="fc-calc__coma-block">
          <p class="fc-calc__coma-block-title">Кома I (умеренная)</p>
          <ul>
            <li>Пациент неразбудим</li>
            <li>На болевые раздражения отмечаются некоординированные защитные движения (по типу отдергивания конечностей)</li>
            <li>Иногда спонтанное двигательное беспокойство</li>
            <li>Зрачковые и роговичные рефлексы обычно сохранены</li>
            <li>Гемодинамика и дыхание относительно стабильны</li>
            <li>ЭЭГ: диффузные изменения в виде нерегулярного альфа-ритма, медленной биоэлектрической активности</li>
          </ul>
        </div>
        <div class="fc-calc__coma-block">
          <p class="fc-calc__coma-block-title">Кома II (глубокая)</p>
          <ul>
            <li>Отсутствуют защитные реакции на боль</li>
            <li>Патологические сгибательные или разгибательные движения</li>
            <li>Мышечный тонус от гипер- до гипотонии, возможна диссоциация по оси тела</li>
            <li>Отмечается снижение стволовых рефлексов</li>
            <li>ЭЭГ: альфа-ритм отсутствует, преобладает медленноволновая активность</li>
          </ul>
        </div>
        <div class="fc-calc__coma-block">
          <p class="fc-calc__coma-block-title">Кома III (терминальная)</p>
          <ul>
            <li>Мышечная атония</li>
            <li>Арефлексия (сухожильные рефлексы могут вызываться со спинального уровня)</li>
            <li>Угнетение всех стволовых рефлексов (отсутствуют зрачковые, роговичные рефлексы, нет окулоцефалического рефлекса)</li>
            <li>Выраженное нарушение гемодинамики (тенденция к гипотензии), диспноэ</li>
            <li>ЭЭГ: редкие медленные волны</li>
          </ul>
        </div>
        <p><strong>Источники:</strong></p>
        <div class="fc-calc__sources">
          <p class="fc-calc__source-item">1. Wijdicks EF, Bamlet WR, Maramattom BV, Manno EM, McClelland RL. (2005) Validation of a new coma scale: The FOUR score. <em>Ann Neurol</em>; 58(4):585-93.</p>
          <p class="fc-calc__source-item">2. Iyer VN, Mandrekar JN, Danielson RD, Zubkov AY, Elmer JL, Wijdicks EF. (2009) Validity of the FOUR score coma scale in the medical intensive care unit. <em>Mayo Clin Proc</em>; 84(8):694-701.</p>
          <p class="fc-calc__source-item">3. Bruno MA, Ledoux D et al. (2011) Comparison of the Full Outline of UnResponsiveness and Glasgow Liege Scale/Glasgow Coma Scale in an intensive care unit population. <em>Neurocrit Care</em>; 15(3):447-53.</p>
          <p class="fc-calc__source-item">4. Fischer M, Rüegg S, Czaplinski A et al. (2010) Inter-rater reliability of the Full Outline of UnResponsiveness score and the Glasgow Coma Scale in critically ill patients: a prospective observational study. <em>Crit Care</em>; 14(2):R64.</p>
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
${(await readFile(join(root, 'calculators', 'mayo-coma', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'mayo-coma', 'index.html'), html, 'utf8');
console.log('Built calculators/mayo-coma/index.html');
