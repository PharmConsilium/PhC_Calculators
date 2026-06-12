#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NORMAL_ALBUMIN_OPTIONS,
  DEFAULT_NORMAL_ALBUMIN,
  CORRECTION_MMOL_PER_GL,
  CORRECTION_MGDL_PER_GL,
} from '../calculators/calcium-albumin/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'calcium-albumin', 'extra.css'), 'utf8'),
]);

function renderNormalAlbuminRadios() {
  return NORMAL_ALBUMIN_OPTIONS.map(
    (opt) => `                <label class="fc-calc__ca-radio-option">
                  <input type="radio" name="normalAlbumin" value="${opt.value}"${opt.value === DEFAULT_NORMAL_ALBUMIN ? ' checked' : ''} required />
                  <span>${opt.label}</span>
                </label>`
  ).join('\n');
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Коррекция уровня кальция при гипоальбуминемии
-->
<div class="fc-calc" data-calculator="calcium-albumin">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Коррекция уровня кальция при гипоальбуминемии</h2>
        <p class="fc-calc__hint">Расчёт скорректированного кальция сыворотки с учётом уровня альбумина</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-calcium-albumin-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__field">
                <label for="fc-calc-calcium-albumin-serum-ca">Кальций сыворотки</label>
                <div class="fc-calc__ca-input-row">
                  <input type="number" id="fc-calc-calcium-albumin-serum-ca" name="serumCa" inputmode="decimal" step="any" required />
                  <select name="serumCaUnit" aria-label="Единицы кальция">
                    <option value="mmolL" selected>ммоль/л</option>
                    <option value="mgdl">мг/дл</option>
                  </select>
                </div>
              </div>

              <div class="fc-calc__field">
                <label>Норм. альбумин</label>
                <div class="fc-calc__ca-radio" role="radiogroup" aria-label="Нормальный альбумин">
${renderNormalAlbuminRadios()}
                </div>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-calcium-albumin-patient-albumin">Альбумин пациента</label>
                <div class="fc-calc__ca-input-row">
                  <input type="number" id="fc-calc-calcium-albumin-patient-albumin" name="patientAlbumin" inputmode="decimal" step="any" required />
                  <select name="patientAlbuminUnit" aria-label="Единицы альбумина">
                    <option value="gL" selected>г/л</option>
                    <option value="gdl">г/дл</option>
                  </select>
                </div>
              </div>

              <span class="fc-calc__error" id="fc-calc-calcium-albumin-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__result-wrap fc-calc__ca-result-panel" aria-live="polite">
        <div class="fc-calc__result fc-calc__result--empty" id="fc-calc-calcium-albumin-result">
          <p class="fc-calc__result-label">Ca (кальций)</p>
          <p class="fc-calc__result-number" id="fc-calc-calcium-albumin-result-number">—</p>
          <p class="fc-calc__result-desc" id="fc-calc-calcium-albumin-result-desc"></p>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Нормальный уровень альбумина составляет <strong>40 г/л</strong>. Ряд врачей использует показатель <strong>44 г/л</strong> — измените значение «Норм. альбумин» вверху, пересчёт выполнится автоматически.</p>
        <div class="fc-calc__formula fc-calc__ca-formula-note">
          <p class="fc-calc__formula-eq"><strong>Ca</strong> = кальций сыворотки + k × (норм. альбумин − альбумин пациента)</p>
          <ul class="fc-calc__formula-legend">
            <li><strong>k = ${String(CORRECTION_MMOL_PER_GL).replace('.', ',')}</strong> при кальции в ммоль/л и альбумине в г/л</li>
            <li><strong>k = ${String(CORRECTION_MGDL_PER_GL).replace('.', ',')}</strong> при кальции в мг/дл и альбумине в г/л</li>
            <li>альбумин в г/дл умножается на 10 для перевода в г/л</li>
          </ul>
        </div>
        <p><strong>Источник</strong></p>
        <p class="fc-calc__source-item">Figge J, Jabor A, Kazda A, Fencl V. Anion gap and hypoalbuminemia. <em>Crit Care Med.</em> 1998;26(11):1807-10. <a href="https://pubmed.ncbi.nlm.nih.gov/9824071/" target="_blank" rel="noopener noreferrer">PubMed ID: 9824071</a></p>
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
${(await readFile(join(root, 'calculators', 'calcium-albumin', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'calcium-albumin', 'index.html'), html, 'utf8');
console.log('Built calculators/calcium-albumin/index.html');
