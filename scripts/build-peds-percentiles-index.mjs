#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'peds-percentiles';
const calcDir = join(root, 'calculators', slug);

const [css, extra, lmsJs, calcJs, whoLms, omniBaby, birthWeight, fetalWeight, uiJs] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(calcDir, 'extra.css'), 'utf8'),
  readFile(join(calcDir, 'lms.js'), 'utf8'),
  readFile(join(calcDir, 'calc.js'), 'utf8'),
  readFile(join(calcDir, 'data', 'who-lms.json'), 'utf8'),
  readFile(join(calcDir, 'data', 'omni-baby-percentiles.json'), 'utf8'),
  readFile(join(calcDir, 'data', 'birth-weight.json'), 'utf8'),
  readFile(join(calcDir, 'data', 'fetal-weight.json'), 'utf8'),
  readFile(join(calcDir, 'widget-ui.js'), 'utf8'),
]);

function stripModuleExports(src) {
  return src
    .replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export /gm, '');
}

const calcCore = stripModuleExports(calcJs)
  .replace(/\bwhoLms\b/g, 'WHO_LMS')
  .replace(/\bbirthWeightData\b/g, 'BIRTH_WEIGHT')
  .replace(/\bfetalWeightData\b/g, 'FETAL_WEIGHT');

const script = `(function () {
  var WHO_LMS = ${whoLms.trim()};
  var OMNI_BABY = ${omniBaby.trim()};
  var BIRTH_WEIGHT = ${birthWeight.trim()};
  var FETAL_WEIGHT = ${fetalWeight.trim()};
  ${stripModuleExports(lmsJs)}
  ${calcCore}
  ${uiJs}
})();`;

await writeFile(join(calcDir, 'widget.js'), script, 'utf8');

const modes = [
  ['growthUnder5', 'Масса, длина тела (рост), масса/длина (рост), ИМТ до 5 лет'],
  ['growthOver5', 'Масса, рост, масса/рост, ИМТ старше 5 лет'],
  ['head', 'Окружность головы до 5 лет'],
  ['fetal', 'Масса плода'],
  ['birthweight', 'Масса при рождении'],
  ['targetHeight', 'Потенциал роста ребёнка'],
];

const modeOptions = modes
  .map(([v, label], i) => `            <option value="${v}"${i === 0 ? ' selected' : ''}>${label}</option>`)
  .join('\n');

function modePanel(mode, active, content) {
  return `              <div class="fc-calc__mode-panel${active ? ' fc-calc__mode-panel--active' : ''}" data-mode="${mode}"${active ? '' : ' hidden'}>
${content}
              </div>`;
}

function sexSegment(name) {
  return `              <div class="fc-calc__segmented" data-sex-group="${name}">
                <button type="button" class="fc-calc__segment fc-calc__segment--active" data-sex="male">Мальчик</button>
                <button type="button" class="fc-calc__segment" data-sex="female">Девочка</button>
              </div>`;
}

function dateRow(birthId, examId) {
  return `                <div class="fc-calc__age-row">
                  <div class="fc-calc__field">
                    <label for="${birthId}">Дата рождения</label>
                    <input type="date" id="${birthId}" required />
                  </div>
                  <div class="fc-calc__field">
                    <label for="${examId}">Дата осмотра</label>
                    <input type="date" id="${examId}" required />
                  </div>
                </div>`;
}

function weightField(inputId, unitGroup, label = 'Масса') {
  return `                <div class="fc-calc__field">
                  <label for="${inputId}">${label}</label>
                  <div class="fc-calc__input-unit-row">
                    <input type="number" id="${inputId}" inputmode="decimal" min="0" step="any" placeholder="0" />
                    <div class="fc-calc__segmented fc-calc__unit-segmented" data-weight-unit="${unitGroup}">
                      <button type="button" class="fc-calc__segment fc-calc__segment--active" data-unit="kg">кг</button>
                      <button type="button" class="fc-calc__segment" data-unit="g">г</button>
                    </div>
                  </div>
                </div>`;
}

function heightMeasureField(group) {
  return `                <div class="fc-calc__field fc-calc__height-measure-field" id="fc-calc-peds-percentiles-${group}-measure-field" hidden>
                  <span class="fc-calc__hint">Способ измерения</span>
              <div class="fc-calc__segmented" data-height-measure="${group}">
                <button type="button" class="fc-calc__segment fc-calc__segment--active" data-measure="L">Длина тела</button>
                <button type="button" class="fc-calc__segment" data-measure="H">Рост</button>
              </div>
                </div>`;
}

function growthPanel(prefix, group, sexGroup, heightLabel = 'Длина тела, см', withMeasureToggle = false) {
  return `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол</span>
${sexSegment(sexGroup)}
                </div>
${dateRow(`fc-calc-peds-percentiles-${prefix}-birth`, `fc-calc-peds-percentiles-${prefix}-exam`)}
${weightField(`fc-calc-peds-percentiles-${prefix}-weight`, group)}
${withMeasureToggle ? heightMeasureField(group) + '\n' : ''}                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-${prefix}-height" id="fc-calc-peds-percentiles-${prefix}-height-label">${heightLabel}</label>
                  <div class="fc-calc__input-unit-row">
                    <input type="number" id="fc-calc-peds-percentiles-${prefix}-height" inputmode="decimal" min="0" step="any" placeholder="0" />
                    <span class="fc-calc__unit-fixed">см</span>
                  </div>
                </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Оценка физического развития детей
-->
<div class="fc-calc" data-calculator="peds-percentiles">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Оценка физического развития детей</h2>
        <p class="fc-calc__hint">Расчёт процентилей и z-score ведётся по стандартам ВОЗ для следующих антропометрических показателей: масса, длина тела / рост, масса к длине / росту, индекс массы тела (ИМТ), окружность головы, масса плода, масса при рождении, потенциал роста ребёнка.</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-peds-percentiles-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Введите данные</h3>
              <div class="fc-calc__field">
                <label for="fc-calc-peds-percentiles-mode">Показатель</label>
                <select class="fc-calc__mode-select" id="fc-calc-peds-percentiles-mode" name="mode" required>
${modeOptions}
                </select>
              </div>
              <p class="fc-calc__mode-hint" id="fc-calc-peds-percentiles-mode-hint">Возраст до 5 лет: дата рождения и дата осмотра. Заполните массу, длину тела / рост или оба показателя.</p>
              <div class="fc-calc__mode-fields">
${modePanel('growthUnder5', true, growthPanel('growth-u5', 'growth-u5', 'growth-u5', 'Длина тела, см', true))}
${modePanel('growthOver5', false, growthPanel('growth-o5', 'growth-o5', 'growth-o5', 'Рост, см'))}
${modePanel('head', false, `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол</span>
${sexSegment('head')}
                </div>
${dateRow('fc-calc-peds-percentiles-head-birth', 'fc-calc-peds-percentiles-head-exam')}
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-head-cm">Окружность головы, см</label>
                  <input type="number" id="fc-calc-peds-percentiles-head-cm" inputmode="decimal" min="0" step="any" placeholder="см" />
                </div>`)}
${modePanel('fetal', false, `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол плода</span>
${sexSegment('fetal')}
                </div>
                <div class="fc-calc__age-row">
                  <div class="fc-calc__field">
                    <label for="fc-calc-peds-percentiles-fetal-weeks">Срок, нед.</label>
                    <input type="number" id="fc-calc-peds-percentiles-fetal-weeks" inputmode="numeric" min="14" max="40" step="1" />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-peds-percentiles-fetal-days">Дни</label>
                    <input type="number" id="fc-calc-peds-percentiles-fetal-days" inputmode="numeric" min="0" max="6" step="1" />
                  </div>
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-fetal-ac">Окружность живота (AC), см</label>
                  <input type="number" id="fc-calc-peds-percentiles-fetal-ac" inputmode="decimal" min="0" step="any" />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-fetal-fl">Длина бедренной кости (FL), см</label>
                  <input type="number" id="fc-calc-peds-percentiles-fetal-fl" inputmode="decimal" min="0" step="any" />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-fetal-hc">Окружность головы (HC), см</label>
                  <input type="number" id="fc-calc-peds-percentiles-fetal-hc" inputmode="decimal" min="0" step="any" />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-fetal-bpd">Бипариетальный размер (BPD), см</label>
                  <input type="number" id="fc-calc-peds-percentiles-fetal-bpd" inputmode="decimal" min="0" step="any" />
                </div>`)}
${modePanel('birthweight', false, `                <div class="fc-calc__age-row">
                  <div class="fc-calc__field">
                    <label for="fc-calc-peds-percentiles-bw-weeks">Гестационный возраст, нед.</label>
                    <input type="number" id="fc-calc-peds-percentiles-bw-weeks" inputmode="numeric" min="20" max="41" step="1" placeholder="нед." />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-peds-percentiles-bw-days">Дни</label>
                    <input type="number" id="fc-calc-peds-percentiles-bw-days" inputmode="numeric" min="0" max="6" step="1" placeholder="0" />
                  </div>
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-bw-weight">Масса при рождении, г</label>
                  <input type="number" id="fc-calc-peds-percentiles-bw-weight" inputmode="numeric" min="0" step="1" placeholder="г" />
                </div>`)}
${modePanel('targetHeight', false, `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол ребёнка</span>
${sexSegment('target')}
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-mother-h">Рост матери, см</label>
                  <input type="number" id="fc-calc-peds-percentiles-mother-h" inputmode="decimal" min="0" step="any" placeholder="см" />
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-father-h">Рост отца, см</label>
                  <input type="number" id="fc-calc-peds-percentiles-father-h" inputmode="decimal" min="0" step="any" placeholder="см" />
                </div>`)}
              </div>
            </div>
          </div>

          <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-peds-percentiles-result" aria-live="polite">
            <div class="fc-calc__result" id="fc-calc-peds-percentiles-result-box">
              <p class="fc-calc__result-label">Результат</p>
              <div class="fc-calc__result-number" id="fc-calc-peds-percentiles-result-main">—</div>
              <p class="fc-calc__result-desc" id="fc-calc-peds-percentiles-result-desc"></p>
              <ul class="fc-calc__result-list" id="fc-calc-peds-percentiles-result-list"></ul>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-peds-percentiles-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-peds-percentiles-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-peds-percentiles-form" disabled>Рассчитать</button>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Калькулятор рассчитывает процентили и z-score по стандартам ВОЗ (метод LMS) для массы, длины тела / роста, массы к длине / росту, ИМТ, окружности головы, массы плода, массы при рождении и потенциала роста ребёнка.</p>
        <p>До 5 лет — стандарты ВОЗ для детей 0–5 лет; старше 5 лет — референсы ВОЗ 2007 для роста и массы к возрасту, ИМТ — до 19 лет.</p>
        <p>До 2 лет (младше 24 мес.) в режиме «до 5 лет» можно указать способ измерения — длина тела лёжа или рост стоя; при несовпадении с эталоном таблицы применяется поправка ±0,7 см. С 2 лет используется рост стоя.</p>
        <p><strong>Потенциал роста ребёнка</strong> — по среднему росту родителей: для мальчиков (рост отца + рост матери + 13) / 2, для девочек (рост отца + рост матери − 13) / 2; ожидаемый диапазон ±8,5 см.</p>
        <p><strong>Масса плода</strong> — формула Hadlock по параметрам УЗИ (AC, FL, HC, BPD); процентиль — по кривым ВОЗ.</p>
        <p>Процентиль показывает долю детей того же пола и возраста с меньшим значением показателя. Оценка проводится в динамике; резкий переход через 2+ коридора требует консультации педиатра.</p>
        <p><strong>Что такое z-score?</strong> Z-score показывает отклонение измеренного значения от среднего для контрольной популяции, делённое на стандартное отклонение. В калькуляторе z-score вычисляется по методу ВОЗ (LMS).</p>
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
${script.trim()}
  </script>
</div>
`;

await writeFile(join(calcDir, 'index.html'), html, 'utf8');
console.log('Built calculators/peds-percentiles/index.html and widget.js');
