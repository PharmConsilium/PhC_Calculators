#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA, formatPoints } from '../calculators/child-pugh/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'child-pugh');

const [css, extra, calcJs, uiJs] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(calcDir, 'extra.css'), 'utf8'),
  readFile(join(calcDir, 'calc.js'), 'utf8'),
  readFile(join(calcDir, 'widget-ui.js'), 'utf8'),
]);

function stripModuleExports(src) {
  return src
    .replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export /gm, '');
}

const script = `(function () {
  ${stripModuleExports(calcJs)}
  ${uiJs}
})();`;

await writeFile(join(calcDir, 'widget.js'), script, 'utf8');

function criterionField(criterion) {
  const stack = criterion.id === 'ascites' || criterion.id === 'encephalopathy';
  const optionsClass = stack
    ? 'fc-calc__cp-options fc-calc__cp-options--stack'
    : 'fc-calc__cp-options';
  const options = criterion.options
    .map((opt) => {
      const id = `fc-calc-child-pugh-${criterion.id}-${opt.value}`;
      const pointsLabel =
        opt.points === 1 ? '1 балл' : opt.points === 2 ? '2 балла' : '3 балла';
      return `                  <label class="fc-calc__cp-option" for="${id}">
                    <input type="radio" id="${id}" name="fc-calc-child-pugh-${criterion.id}" value="${opt.value}" />
                    <span class="fc-calc__cp-option-face">
                      <span class="fc-calc__cp-option-label">${opt.label}</span>
                      <span class="fc-calc__cp-option-points">${stack ? pointsLabel : formatPoints(opt.points)}</span>
                    </span>
                  </label>`;
    })
    .join('\n');

  return `            <fieldset class="fc-calc__cp-criterion">
              <legend class="fc-calc__cp-legend">${criterion.label}</legend>
              <div class="${optionsClass}">
${options}
              </div>
            </fieldset>`;
}

function unitField(prefix, key, label, units, inputAttrs = '') {
  const unitBtns = units
    .map(
      (u, i) =>
        `                <button type="button" class="fc-calc__segment${i === 0 ? ' fc-calc__segment--active' : ''}" data-unit="${u.value}">${u.label}</button>`
    )
    .join('\n');
  return `            <div class="fc-calc__field">
              <div class="fc-calc__cp-field-head">
                <label for="fc-calc-child-pugh-${prefix}-${key}">${label}</label>
                <div class="fc-calc__segmented fc-calc__cp-units" data-unit-group="${prefix}-${key}" role="group">
${unitBtns}
                </div>
              </div>
              <input type="number" id="fc-calc-child-pugh-${prefix}-${key}" inputmode="decimal" step="any" min="0" ${inputAttrs} />
            </div>`;
}

function dialysisField(prefix) {
  return `            <div class="fc-calc__field">
              <label>Диализ ≥ 2 раз за последнюю неделю</label>
              <div class="fc-calc__segmented" data-dialysis-group="${prefix}" role="group">
                <button type="button" class="fc-calc__segment fc-calc__segment--active" data-dialysis="no">Нет</button>
                <button type="button" class="fc-calc__segment" data-dialysis="yes">Да</button>
              </div>
            </div>`;
}

function sexField(prefix) {
  return `            <div class="fc-calc__field" id="fc-calc-child-pugh-${prefix}-sex-field">
              <label>Пол</label>
              <div class="fc-calc__segmented" data-sex-group="${prefix}" role="group">
                <button type="button" class="fc-calc__segment fc-calc__segment--active" data-sex="female">Женский</button>
                <button type="button" class="fc-calc__segment" data-sex="male">Мужской</button>
              </div>
            </div>`;
}

function ageField(prefix) {
  return `            <div class="fc-calc__field">
              <label>Возраст</label>
              <div class="fc-calc__segmented" data-age-group="${prefix}" role="group" aria-label="Возраст">
                <button type="button" class="fc-calc__segment" data-age="lt18">&lt;18</button>
                <button type="button" class="fc-calc__segment fc-calc__segment--active" data-age="ge18">≥18</button>
              </div>
            </div>`;
}

function meldPanel(mode, prefix, extras) {
  const bili = unitField(prefix, 'bili', 'Билирубин общий', [
    { value: 'umol', label: 'мкмоль/л' },
    { value: 'mgdl', label: 'мг/дл' },
  ]);
  const creat = unitField(prefix, 'creat', 'Креатинин', [
    { value: 'umol', label: 'мкмоль/л' },
    { value: 'mgdl', label: 'мг/дл' },
  ]);
  const inr = `            <div class="fc-calc__field">
              <label for="fc-calc-child-pugh-${prefix}-inr">МНО</label>
              <input type="number" id="fc-calc-child-pugh-${prefix}-inr" inputmode="decimal" step="any" min="0" />
            </div>`;
  return `          <div class="fc-calc__tab-panel" data-mode-panel="${mode}" hidden>
            <div class="fc-calc__panel-section">
              <div class="fc-calc__panel">
                <h3 class="fc-calc__panel-heading">Лабораторные данные</h3>
${bili}
${creat}
${inr}
${extras}
${dialysisField(prefix)}
              </div>
            </div>
          </div>`;
}

const naField = (prefix) => `            <div class="fc-calc__field">
              <label for="fc-calc-child-pugh-${prefix}-na">Натрий сыворотки, ммоль/л</label>
              <input type="number" id="fc-calc-child-pugh-${prefix}-na" inputmode="decimal" step="any" />
            </div>`;

const albField = unitField('meld30', 'alb', 'Альбумин', [
  { value: 'gl', label: 'г/л' },
  { value: 'gdl', label: 'г/дл' },
]);

const criteriaHtml = CRITERIA.map(criterionField).join('\n');

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Чайлд-Пью и MELD
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="child-pugh">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Чайлд-Пью и MELD</h2>
        <p class="fc-calc__hint">Классификация тяжести цирроза печени: Child-Pugh, MELD (до 2016), MELD-Na и MELD 3.0.</p>
        <div class="fc-calc__tabs" role="tablist" aria-label="Шкала">
          <button type="button" class="fc-calc__tab fc-calc__tab--active" role="tab" aria-selected="true" data-mode-tab="childPugh">Чайлд-Пью</button>
          <button type="button" class="fc-calc__tab" role="tab" aria-selected="false" data-mode-tab="meld">MELD</button>
          <button type="button" class="fc-calc__tab" role="tab" aria-selected="false" data-mode-tab="meldNa">MELD-Na</button>
          <button type="button" class="fc-calc__tab" role="tab" aria-selected="false" data-mode-tab="meld30">MELD 3.0</button>
        </div>
        <p class="fc-calc__hint fc-calc__cp-mode-hint" id="fc-calc-child-pugh-mode-hint">Классификация тяжести цирроза по пяти клинико-лабораторным критериям (Child-Pugh).</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-child-pugh-form" novalidate>
          <div class="fc-calc__tab-panel fc-calc__tab-panel--active" data-mode-panel="childPugh">
            <div class="fc-calc__cp-criteria">
${criteriaHtml}
            </div>
          </div>
${meldPanel('meld', 'meld', '')}
${meldPanel('meldNa', 'meldna', naField('meldna'))}
${meldPanel('meld30', 'meld30', ageField('meld30') + '\n' + sexField('meld30') + '\n' + naField('meld30') + '\n' + albField)}
          <span class="fc-calc__error" id="fc-calc-child-pugh-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-child-pugh-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-child-pugh-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-child-pugh-result" aria-live="polite">
        <p class="fc-calc__result-label" id="fc-calc-child-pugh-result-label">Результат</p>
        <p class="fc-calc__result-number" id="fc-calc-child-pugh-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-child-pugh-result-desc"></p>
        <div id="fc-calc-child-pugh-result-extra"></div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Чайлд-Пью (Child-Pugh)</strong> — сумма баллов по пяти критериям.</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Критерий</th>
                <th>1 балл</th>
                <th>2 балла</th>
                <th>3 балла</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Общий билирубин, мкмоль/л</td>
                <td>&lt;34,2</td>
                <td>34,2–51,3</td>
                <td>&gt;51,3</td>
              </tr>
              <tr>
                <td>Альбумин сыворотки, г/л</td>
                <td>&gt;35</td>
                <td>28–35</td>
                <td>&lt;28</td>
              </tr>
              <tr>
                <td>МНО</td>
                <td>&lt;1,7</td>
                <td>1,7–2,2</td>
                <td>&gt;2,2</td>
              </tr>
              <tr>
                <td>Асцит</td>
                <td>Нет</td>
                <td>Лёгкий</td>
                <td>Средний или тяжёлый</td>
              </tr>
              <tr>
                <td>Степень энцефалопатии</td>
                <td>0</td>
                <td>1–2</td>
                <td>3–4</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>&lt;7 — класс A; 7–9 — класс B; ≥10 — класс C.</p>

        <p><strong>MELD (до 2016)</strong></p>
        <p>MELD = 3,78×ln(билирубин) + 11,2×ln(МНО) + 9,57×ln(креатинин) + 6,43. Билирубин, МНО и креатинин в мг/дл; значения &lt;1 принимаются за 1; креатинин ограничен сверху 4 мг/дл (при диализе = 4). Результат округляется, диапазон 6–40.</p>
        <p><strong>Предполагаемая смертность за 3 месяца</strong> (Wiesner et al., 2003): ≤9 → 1,9%; 10–19 → 6%; 20–29 → 19,6%; 30–39 → 52,6%; ≥40 → 71,3%.</p>

        <p><strong>MELD-Na</strong></p>
        <p>При исходном MELD &gt; 11: MELD-Na = MELD + 1,32×(137−Na) − 0,033×MELD×(137−Na). Натрий ограничивается диапазоном 125–137 ммоль/л.</p>

        <p><strong>MELD 3.0</strong> (Kim et al., 2021; текущий стандарт OPTN)</p>
        <p>Учитывает билирубин, МНО, креатинин (потолок 3 мг/дл), натрий и альбумин (1,5–3,5 г/дл), включая взаимодействия Na–билирубин и альбумин–креатинин. С 18 лет добавляется пол (+1,33 для женщин, константа 6); до 18 лет пол не используется (константа 7,33). Результат 6–40.</p>
        <p>Предполагаемая выживаемость за 90 дней: 0,946<sup>exp(0,17698×MELD − 3,56)</sup>×100 (Kim et al., 2021).</p>
        <p>Для прогноза и приоритета трансплантации предпочтительнее актуальный MELD 3.0; Child-Pugh остаётся полезным клиническим дополнением.</p>
        <p><strong>Источники:</strong></p>
        <div class="fc-calc__cp-sources">
          <p>1. Child CG, Turcotte JG. Surgery and portal hypertension. In: The liver and portal hypertension. Edited by CG Child. Philadelphia: Saunders 1964:50-64.</p>
          <p>2. Pugh RN, Murray-Lyon IM, Dawson JL, Pietroni MC, Williams R (1973). Transection of the oesophagus for bleeding oesophageal varices. <em>The British journal of surgery</em> 60 (8).</p>
          <p>3. Kamath PS, Wiesner RH, Malinchoc M, Kremers W, Therneau TM, Kosberg CL, D'Amico G, Dickson ER, Kim WR. A model to predict survival in patients with end-stage liver disease. <em>Hepatology.</em> 2001 Feb;33(2):464-70.</p>
          <p>4. Kim WR, Mannalithara A, Heimbach JK, et al. MELD 3.0: the model for end-stage liver disease updated for the modern era. <em>Gastroenterology.</em> 2021;161(6):1887-1895.e4.</p>
          <p>5. Wiesner R, United Network for Organ Sharing Liver Disease Severity Score Committee, et al. Model for end-stage liver disease (MELD) and allocation of donor livers. <em>Gastroenterology.</em> 2003 Jan;124(1):91-6.</p>
          <p>6. Kremers WK, van IJperen M, Kim WR, Freeman RB, Harper AM, Kamath PS, Wiesner RH. MELD score as a predictor of pretransplant and posttransplant survival in OPTN/UNOS status 1 patients. <em>Hepatology.</em> 2004 Mar;39(3):764-9.</p>
          <p>7. Kamath PS, Kim WR; Advanced Liver Disease Study Group. The model for end-stage liver disease (MELD). <em>Hepatology.</em> 2007 Mar;45(3):797-805.</p>
          <p>8. OPTN 2016 MELD Policy Changes.</p>
          <p>9. Freeman RB Jr, Gish RG, Harper A, Davis GL, Vierling J, Lieblein L, Klintmalm G, Blazek J, Hunter R, Punch J. Model for end-stage liver disease (MELD) exception guidelines: results and recommendations from the MELD Exception Study Group and Conference (MESSAGE) for the approval of patients who need liver transplantation with diseases not considered by the standard MELD formula. <em>Liver Transpl.</em> 2006;12(12 Suppl 3):S128.</p>
          <p>10. Trivedi HD. The evolution of the MELD score and its implications in liver transplant allocation: a beginner’s guide for trainees. <em>ACG Case Rep J.</em> 2022;9(5):e00763.</p>
        </div>
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
console.log('Built calculators/child-pugh/index.html and widget.js');
