#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA } from '../calculators/glasgow-coma/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'glasgow-coma', 'extra.css'), 'utf8'),
]);

function renderGroups() {
  return CRITERIA.map((criterion) => {
    const options = criterion.options
      .slice()
      .sort((a, b) => b.value - a.value)
      .map(
        (opt) => `                <label class="fc-calc__gcs-option">
                  <input type="radio" name="${criterion.id}" value="${opt.value}" />
                  <span class="fc-calc__gcs-option-text">${opt.label}</span>
                </label>`
      )
      .join('\n');

    return `            <fieldset class="fc-calc__gcs-group">
              <legend class="fc-calc__gcs-legend">${criterion.label}</legend>
              <div class="fc-calc__gcs-options">
${options}
              </div>
            </fieldset>`;
  }).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала комы Глазго
-->
<div class="fc-calc" data-calculator="glasgow-coma">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала комы Глазго</h2>
        <p class="fc-calc__hint">Оценка уровня сознания по открытию глаз, вербальной и двигательной реакции</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-glasgow-coma-form" novalidate>
          <div class="fc-calc__gcs-groups">
${renderGroups()}
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-glasgow-coma-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-glasgow-coma-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-glasgow-coma-result" aria-live="polite">
        <p class="fc-calc__result-label">Общий результат</p>
        <p class="fc-calc__result-number" id="fc-calc-glasgow-coma-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-glasgow-coma-result-desc"></p>
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
                <th>Признак</th>
                <th>Ответная реакция</th>
                <th>Оценка</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fc-calc__table-criterion" rowspan="4">Открывание глаз</td>
                <td>Спонтанное</td>
                <td>4</td>
              </tr>
              <tr>
                <td>Открывание на голосовую команду</td>
                <td>3</td>
              </tr>
              <tr>
                <td>Открывание глаз в ответ на боль, приложенную к конечностям или грудине</td>
                <td>2</td>
              </tr>
              <tr>
                <td>Нет</td>
                <td>1</td>
              </tr>
              <tr>
                <td class="fc-calc__table-criterion" rowspan="5">Вербальные реакции</td>
                <td>Ориентирован</td>
                <td>5</td>
              </tr>
              <tr>
                <td>Дезориентирован, но отвечает на вопросы</td>
                <td>4</td>
              </tr>
              <tr>
                <td>Неправильные ответы на вопросы; слова разборчивы</td>
                <td>3</td>
              </tr>
              <tr>
                <td>Нечленораздельная речь</td>
                <td>2</td>
              </tr>
              <tr>
                <td>Нет</td>
                <td>1</td>
              </tr>
              <tr>
                <td class="fc-calc__table-criterion" rowspan="6">Моторика</td>
                <td>Выполняет команды</td>
                <td>6</td>
              </tr>
              <tr>
                <td>Защищает рукой область болевого раздражения</td>
                <td>5</td>
              </tr>
              <tr>
                <td>Отдергивает конечность в ответ на болевой стимул</td>
                <td>4</td>
              </tr>
              <tr>
                <td>Патологическое сгибание в ответ на болевой раздражитель (децеребрационная поза)</td>
                <td>3</td>
              </tr>
              <tr>
                <td>Патологическое (ригидное) разгибание (децеребрационная поза) в ответ на болевой раздражитель</td>
                <td>2</td>
              </tr>
              <tr>
                <td>Нет</td>
                <td>1</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>* Сумма баллов ≤ 8 обычно расценивается как кома.</p>
        <p class="fc-calc__hint">Adapted from Teasdale G, Jennett B: Assessment of coma and impaired consciousness. A practical scale. <em>Lancet</em> 2:81–84; 1974.</p>
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
${(await readFile(join(root, 'calculators', 'glasgow-coma', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'glasgow-coma', 'index.html'), html, 'utf8');
console.log('Built calculators/glasgow-coma/index.html');
