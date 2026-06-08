#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA } from '../calculators/apgar/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'apgar', 'extra.css'), 'utf8'),
]);

function renderGroups() {
  return CRITERIA.map((criterion) => {
    const options = criterion.options
      .slice()
      .sort((a, b) => a.value - b.value)
      .map(
        (opt) => `                <label class="fc-calc__apgar-option">
                  <input type="radio" name="${criterion.id}" value="${opt.value}" />
                  <span class="fc-calc__apgar-option-text">${opt.label}</span>
                </label>`
      )
      .join('\n');

    return `            <fieldset class="fc-calc__apgar-group">
              <legend class="fc-calc__apgar-legend">${criterion.label}</legend>
              <div class="fc-calc__apgar-options">
${options}
              </div>
            </fieldset>`;
  }).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала Апгар
-->
<div class="fc-calc" data-calculator="apgar">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала Апгар</h2>
        <p class="fc-calc__hint">Оценка состояния новорождённого по 5 критериям (0–2 балла каждый)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-apgar-form" novalidate>
          <div class="fc-calc__apgar-groups">
${renderGroups()}
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-apgar-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-apgar-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-apgar-result" aria-live="polite">
        <p class="fc-calc__result-label">Общий результат</p>
        <p class="fc-calc__result-number" id="fc-calc-apgar-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-apgar-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Критерии</th>
                <th>Мнемонический</th>
                <th>0</th>
                <th>1</th>
                <th>2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Окраска кожи</td>
                <td>Внешний вид</td>
                <td>Генерализованная бледность или генерализованный цианоз</td>
                <td>Розовая окраска тела и синюшная окраска конечностей (акроцианоз)</td>
                <td>Розовая окраска всего тела и конечностей</td>
              </tr>
              <tr>
                <td>Частота сердечных сокращений</td>
                <td>Пульс</td>
                <td>Отсутствует</td>
                <td>Менее 100 ударов в минуту</td>
                <td>100 и более ударов в минуту</td>
              </tr>
              <tr>
                <td>Рефлекторная возбудимость</td>
                <td>Гримаса</td>
                <td>Не реагирует</td>
                <td>Реакция слабо выражена (гримаса, движение)</td>
                <td>Реакция в виде движения, кашля, чихания, громкого крика</td>
              </tr>
              <tr>
                <td>Мышечный тонус</td>
                <td>Активность</td>
                <td>Отсутствует, конечности свисают</td>
                <td>Снижен, некоторое сгибание конечностей</td>
                <td>Выражены активные движения</td>
              </tr>
              <tr>
                <td>Дыхание</td>
                <td>Дыхание</td>
                <td>Отсутствует</td>
                <td>Нерегулярное, крик слабый (гиповентиляция)</td>
                <td>Нормальное, крик громкий</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Общая оценка <strong>7–10</strong> баллов считается нормальной, <strong>4–6</strong> — промежуточной, <strong>0–3</strong> — низкой.</p>
        <p><strong>Источники:</strong></p>
        <ol>
          <li>Apgar V. A proposal of a New Method of Evaluation of the Newborn Infant. <em>Current Researches in Anesthesia and Analgesia.</em> 1953, 32: 261-267. PubMed ID: 13083014</li>
          <li>Apgar V, Holaday DA, James LS, et al. Evaluation of the newborn infant. <em>JAMA.</em> 1958, 168: 1985-1988. PubMed ID: 13598635</li>
          <li>Casey BM, McIntire DD, Leveno KJ. The continuing value of the Apgar score for the assessment of newborn infants. <em>N Engl J Med.</em> 2001 Feb 15;344(7):467-71. PubMed ID: 11172187</li>
        </ol>
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
${(await readFile(join(root, 'calculators', 'apgar', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'apgar', 'index.html'), html, 'utf8');
console.log('Built calculators/apgar/index.html');
