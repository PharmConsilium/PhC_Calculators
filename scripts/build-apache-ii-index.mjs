#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PHYSIOLOGY,
  GCS_OPTIONS,
  AGE_OPTIONS,
  CHRONIC_OPTIONS,
  MORTALITY_RANGES,
} from '../calculators/apache-ii/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'apache-ii', 'extra.css'), 'utf8'),
]);

function pointsSuffix(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = 'баллов';
  if (mod10 === 1 && mod100 !== 11) word = 'балл';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = 'балла';
  return `(${n} ${word})`;
}

function renderOptions(options) {
  const groups = new Map();
  for (const opt of options) {
    const key = opt.group || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(opt);
  }

  return [...groups.entries()]
    .map(([group, opts]) => {
      const items = opts
        .map(
          (opt) =>
            `<option value="${opt.id}" data-points="${opt.points}">${opt.label} ${pointsSuffix(opt.points)}</option>`
        )
        .join('\n');
      return group ? `<optgroup label="${group}">\n${items}\n</optgroup>` : items;
    })
    .join('\n');
}

function renderPhysioFields() {
  return PHYSIOLOGY.map((c) => {
    const arf =
      c.id === 'creatinine'
        ? `                <label class="fc-calc__apache-arf">
                  <input type="checkbox" id="fc-calc-apache-ii-arf" name="arf" value="1" />
                  <span>ОПН — острая почечная недостаточность (удвоение баллов за креатинин)</span>
                </label>`
        : '';
    return `              <div class="fc-calc__field">
                <label for="fc-calc-apache-ii-${c.id}">${c.label}</label>
                <select id="fc-calc-apache-ii-${c.id}" name="${c.id}" required>
                  <option value="" disabled selected>Выберите…</option>
${renderOptions(c.options)}
                </select>
${arf}
              </div>`;
  }).join('\n');
}

function renderChronicRadios() {
  return CHRONIC_OPTIONS.map(
    (opt, idx) => `                <label class="fc-calc__apache-chronic-option">
                  <input type="radio" name="chronic" value="${opt.id}" data-points="${opt.points}"${idx === 0 ? ' checked' : ''} required />
                  <span class="fc-calc__apache-chronic-text">${opt.label} ${pointsSuffix(opt.points)}</span>
                </label>`
  ).join('\n');
}

function renderMortalityTable() {
  return MORTALITY_RANGES.map((r) => {
    const range =
      r.min === r.max ? String(r.min) : r.min === 30 && r.max === 34 ? '30–34' : `${r.min}–${r.max}`;
    const mort =
      r.nonoperative === r.postoperative
        ? `Приблизительно ${r.nonoperative}%`
        : `${r.nonoperative}% неоперабельный, ${r.postoperative}% послеоперационный`;
    return `              <tr>
                <td>${range}</td>
                <td>${mort}</td>
              </tr>`;
  }).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала оценки APACHE II и оценка смертности
-->
<div class="fc-calc" data-calculator="apache-ii">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала APACHE II</h2>
        <p class="fc-calc__hint">Оценка тяжести заболевания и приблизительная летальность (Knaus et al.)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-apache-ii-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Физиологические показатели</h3>
              <div class="fc-calc__apache-fields">
${renderPhysioFields()}
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Глазго, возраст и хронические нарушения</h3>
              <div class="fc-calc__apache-fields">
                <div class="fc-calc__field">
                  <label for="fc-calc-apache-ii-gcs">Глазго (GCS)</label>
                  <select id="fc-calc-apache-ii-gcs" name="gcs" required>
                    <option value="" disabled selected>Выберите…</option>
${GCS_OPTIONS.map((o) => `<option value="${o.id}" data-points="${o.points}">${o.label} ${pointsSuffix(o.points)}</option>`).join('\n')}
                  </select>
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-apache-ii-age">Возраст (лет)</label>
                  <select id="fc-calc-apache-ii-age" name="age" required>
                    <option value="" disabled selected>Выберите…</option>
${AGE_OPTIONS.map((o) => `<option value="${o.id}" data-points="${o.points}">${o.label} ${pointsSuffix(o.points)}</option>`).join('\n')}
                  </select>
                </div>
                <div class="fc-calc__field">
                  <span class="fc-calc__field-label">Хронические нарушения здоровья</span>
                  <p class="fc-calc__hint" style="margin: 0 0 8px; text-align: left; font-size: 13px">Цирроз (биопсия), NYHA IV, тяжёлое ХОБЛ, диализ, иммунодефицит</p>
                  <div class="fc-calc__apache-chronic" role="radiogroup" aria-label="Хронические нарушения">
${renderChronicRadios()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-apache-ii-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-apache-ii-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-apache-ii-result" aria-live="polite">
        <p class="fc-calc__result-label">Общий результат</p>
        <p class="fc-calc__result-number" id="fc-calc-apache-ii-result-number">—</p>
        <div class="fc-calc__apache-mortality fc-calc__apache-mortality--hidden" id="fc-calc-apache-ii-mortality"></div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Оценка по APACHE II / приблизительная летальность:</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Баллы</th>
                <th>Летальность</th>
              </tr>
            </thead>
            <tbody>
${renderMortalityTable()}
            </tbody>
          </table>
        </div>
        <p><strong>Ссылки:</strong></p>
        <p>Knaus WA, et al. APACHE II: a severity of disease classification system. <em>Crit Care Med.</em> 1985.</p>
        <p class="fc-calc__hint">Источник: <a href="https://www.msdmanuals.com/ru/professional/searchresults?query=apache%20ii" target="_blank" rel="noopener noreferrer">MSD Manuals</a></p>
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
${(await readFile(join(root, 'calculators', 'apache-ii', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'apache-ii', 'index.html'), html, 'utf8');
console.log('Built calculators/apache-ii/index.html');
