#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_LIMITS, NORMAL_RANGE } from '../calculators/serum-osmolality/calc.js';
import { NOTES_DISCLAIMER_HTML } from './snippets/notes-disclaimer.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'serum-osmolality', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчёт осмоляльности сыворотки
-->
<div class="fc-calc" data-calculator="serum-osmolality">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Расчёт осмоляльности сыворотки</h2>
        <p class="fc-calc__hint">Расчётная осмоляльность плазмы по натрию, глюкозе и азоту мочевины крови</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-serum-osmolality-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Лабораторные показатели</h3>

              <div class="fc-calc__osm-grid">
                <div class="fc-calc__field">
                  <label for="fc-calc-serum-osmolality-na">Натрий сыворотки</label>
                  <div class="fc-calc__osm-input-row">
                    <input type="number" id="fc-calc-serum-osmolality-na" name="serumNa" inputmode="decimal" min="${FIELD_LIMITS.serumNa.min}" max="${FIELD_LIMITS.serumNa.max}" step="any" required />
                    <span class="fc-calc__osm-unit--fixed">ммоль/л</span>
                  </div>
                  <span class="fc-calc__error" id="fc-calc-serum-osmolality-na-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-serum-osmolality-glucose">Глюкоза крови</label>
                  <div class="fc-calc__osm-input-row">
                    <input type="number" id="fc-calc-serum-osmolality-glucose" name="glucose" inputmode="decimal" min="${FIELD_LIMITS.glucose.min}" max="${FIELD_LIMITS.glucose.max}" step="any" required />
                    <span class="fc-calc__osm-unit--fixed">ммоль/л</span>
                  </div>
                  <span class="fc-calc__error" id="fc-calc-serum-osmolality-glucose-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-serum-osmolality-bun">Азот мочевины крови (АМК)</label>
                  <div class="fc-calc__osm-input-row">
                    <input type="number" id="fc-calc-serum-osmolality-bun" name="bun" inputmode="decimal" min="${FIELD_LIMITS.bun.min}" max="${FIELD_LIMITS.bun.max}" step="any" required />
                    <span class="fc-calc__osm-unit--fixed">ммоль/л</span>
                  </div>
                  <span class="fc-calc__error" id="fc-calc-serum-osmolality-bun-error" role="alert"></span>
                </div>
              </div>

              <span class="fc-calc__error" id="fc-calc-serum-osmolality-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-serum-osmolality-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-serum-osmolality-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-serum-osmolality-result" aria-live="polite">
        <div class="fc-calc__result fc-calc__result--empty" id="fc-calc-serum-osmolality-result-box">
          <p class="fc-calc__result-label">Результат</p>
          <p class="fc-calc__result-number" id="fc-calc-serum-osmolality-result-number">—</p>
          <p class="fc-calc__result-desc" id="fc-calc-serum-osmolality-result-desc"></p>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Осмотическая концентрация плазмы — суммарная концентрация всех осмотически активных частиц в растворе. В норме осмоляльность плазмы составляет ${NORMAL_RANGE.min}–${NORMAL_RANGE.max} мосм/кг.</p>
        <p>Осмоляльность измеряется либо непосредственно методом лабораторной диагностики, либо рассчитывается по формуле. Расчётная осмоляльность обычно несколько ниже измеряемой непосредственно.</p>
        <div class="fc-calc__formula fc-calc__osm-formula-note">
          <p class="fc-calc__formula-eq"><strong>Осмоляльность плазмы</strong> = 2 × Na + глюкоза / 18 + АМК / 2,8</p>
          <ul class="fc-calc__formula-legend">
            <li><strong>Na</strong> — натрий сыворотки, ммоль/л</li>
            <li><strong>глюкоза</strong> — глюкоза крови, ммоль/л</li>
            <li><strong>АМК</strong> — азот мочевины крови, ммоль/л</li>
          </ul>
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
${(await readFile(join(root, 'calculators', 'serum-osmolality', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'serum-osmolality', 'index.html'), html, 'utf8');
console.log('Built calculators/serum-osmolality/index.html');
