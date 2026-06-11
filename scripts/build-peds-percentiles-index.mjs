#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  .replace(/\bomniBaby\b/g, 'OMNI_BABY')
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
  ['baby', 'Масса, длина тела, окружность головы до 2-х лет'],
  ['birthweight', 'Масса при рождении'],
  ['bmi', 'ИМТ'],
  ['height', 'Длина тела / рост до 5-ти лет'],
  ['head', 'Окружность головы до 5-ти лет'],
  ['weight', 'Масса до 5-ти лет'],
  ['fetal', 'Масса плода'],
  ['targetHeight', 'Потенциал роста ребенка на основании роста родителей'],
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

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Процентили в педиатрии
  Сборка: 2026-06-09o
-->
<div class="fc-calc" data-calculator="peds-percentiles" data-build="2026-06-09y">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Процентили в педиатрии</h2>
        <p class="fc-calc__hint">Расчёт процентилей по стандартам ВОЗ: масса, длина тела / рост, ИМТ, ОГ, масса при рождении, масса плода, целевой рост</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-peds-percentiles-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Введите данные</h3>
              <div class="fc-calc__field">
                <label for="fc-calc-peds-percentiles-mode">Калькулятор</label>
                <select class="fc-calc__mode-select" id="fc-calc-peds-percentiles-mode" name="mode" required>
${modeOptions}
                </select>
              </div>
              <p class="fc-calc__mode-hint" id="fc-calc-peds-percentiles-mode-hint">Возраст до 2 лет: дата рождения и дата осмотра. Заполните хотя бы одно измерение.</p>
              <div class="fc-calc__mode-fields">
${modePanel('baby', true, `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол</span>
${sexSegment('baby')}
                </div>
${dateRow('fc-calc-peds-percentiles-baby-birth', 'fc-calc-peds-percentiles-baby-exam')}
${weightField('fc-calc-peds-percentiles-baby-weight', 'baby')}
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-baby-height">Длина тела</label>
                  <div class="fc-calc__input-unit-row">
                    <input type="number" id="fc-calc-peds-percentiles-baby-height" inputmode="decimal" min="0" step="any" placeholder="0" />
                    <span class="fc-calc__unit-fixed">см</span>
                  </div>
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-baby-head">Окружность головы</label>
                  <div class="fc-calc__input-unit-row">
                    <input type="number" id="fc-calc-peds-percentiles-baby-head" inputmode="decimal" min="0" step="any" placeholder="0" />
                    <span class="fc-calc__unit-fixed">см</span>
                  </div>
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
${modePanel('bmi', false, `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол</span>
${sexSegment('bmi')}
                </div>
${dateRow('fc-calc-peds-percentiles-bmi-birth', 'fc-calc-peds-percentiles-bmi-exam')}
${weightField('fc-calc-peds-percentiles-bmi-weight', 'bmi', 'Масса')}
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-bmi-height" id="fc-calc-peds-percentiles-bmi-height-label">Длина тела, см</label>
                  <input type="number" id="fc-calc-peds-percentiles-bmi-height" inputmode="decimal" min="0" step="any" placeholder="см" />
                </div>`)}
${modePanel('height', false, `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол</span>
${sexSegment('height')}
                </div>
${dateRow('fc-calc-peds-percentiles-height-birth', 'fc-calc-peds-percentiles-height-exam')}
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-height-cm" id="fc-calc-peds-percentiles-height-cm-label">Длина тела, см</label>
                  <input type="number" id="fc-calc-peds-percentiles-height-cm" inputmode="decimal" min="0" step="any" placeholder="см" />
                </div>`)}
${modePanel('head', false, `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол</span>
${sexSegment('head')}
                </div>
${dateRow('fc-calc-peds-percentiles-head-birth', 'fc-calc-peds-percentiles-head-exam')}
                <div class="fc-calc__field">
                  <label for="fc-calc-peds-percentiles-head-cm">Окружность головы, см</label>
                  <input type="number" id="fc-calc-peds-percentiles-head-cm" inputmode="decimal" min="0" step="any" placeholder="см" />
                </div>`)}
${modePanel('weight', false, `                <div class="fc-calc__field">
                  <span class="fc-calc__hint">Пол</span>
${sexSegment('weight')}
                </div>
${dateRow('fc-calc-peds-percentiles-weight-birth', 'fc-calc-peds-percentiles-weight-exam')}
${weightField('fc-calc-peds-percentiles-weight-value', 'weight')}`)}
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
        <p>Калькулятор объединяет расчёт педиатрических процентилей по стандартам ВОЗ (метод LMS): масса, длина тела / рост, ИМТ, окружность головы, масса при рождении и масса плода. До 2 лет для ростового показателя используется термин «длина тела».</p>
        <p><strong>Потенциал роста ребенка на основании роста родителей</strong> рассчитывается по среднему росту родителей: для мальчиков (рост отца + рост матери + 13) / 2, для девочек (рост отца + рост матери − 13) / 2; диапазон ±8,5 см.</p>
        <p><strong>Масса плода</strong> — формула Hadlock по параметрам УЗИ (AC, FL, HC, BPD); процентиль — по кривым ВОЗ.</p>
        <p>Процентиль показывает долю детей того же пола и возраста с меньшим значением показателя. Интерпретация — по клиническим центильным коридорам: 3, 10, 25, 50, 75, 97. Оценка проводится в динамике; резкий переход через 2+ коридора требует консультации педиатра.</p>
        <p><strong>Что такое z-score?</strong> Z-score показывает отклонение измеренного значения от среднего для контрольной популяции, делённое на стандартное отклонение для этой популяции. Z-score напрямую связаны с перцентилями: возможно преобразование z-score в перцентили и обратно. В калькуляторе z-score вычисляется по методу ВОЗ (LMS, коэффициенты L, M, S).</p>
        <p>В большинстве клинических ситуаций значения z-score от −2 до +2 считаются нормальными. Однако зачастую куда большее клиническое значение имеет не столько значение z-score конкретного измерения, сколько динамика его изменения с течением времени.</p>
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
${script.trim()}
  </script>
</div>
`;

await writeFile(join(calcDir, 'index.html'), html, 'utf8');
console.log('Built calculators/peds-percentiles/index.html and widget.js');
