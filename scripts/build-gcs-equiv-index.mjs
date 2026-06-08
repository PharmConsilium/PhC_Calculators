#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'gcs-equiv', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Клинический конвертер «Эквивалентные дозы глюкокортикостероидов (ГКС) — системные»
-->
<div class="fc-calc" data-calculator="gcs-equiv">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Клинический конвертер «Эквивалентные дозы глюкокортикостероидов (ГКС) — системные»</h2>
        <p class="fc-calc__hint">Пересчёт эквивалентных доз системных глюкокортикостероидов по <a href="https://clincalc.com/corticosteroids/" target="_blank" rel="noopener noreferrer">ClinCalc</a>.</p>
      </header>

      <div class="fc-calc__body">
        <div class="fc-calc__converter">
          <form id="fc-calc-gcs-sys-form" novalidate>
            <p class="fc-calc__section" style="margin-top:0">Конвертировать из</p>
            <div class="fc-calc__field-row">
              <div class="fc-calc__field" style="flex:2">
                <label for="fc-calc-gcs-sys-source">Препарат</label>
                <select id="fc-calc-gcs-sys-source" name="sourceId" required></select>
              </div>
              <div class="fc-calc__field" style="flex:1">
                <label for="fc-calc-gcs-sys-dose">Доза, мг</label>
                <input type="number" id="fc-calc-gcs-sys-dose" name="doseSource" inputmode="decimal" min="0" step="any" placeholder="20" />
                <span class="fc-calc__error" id="fc-calc-gcs-sys-dose-error" role="alert"></span>
              </div>
            </div>
            <p class="fc-calc__section">Конвертировать в</p>
            <div class="fc-calc__field">
              <label for="fc-calc-gcs-sys-target">Препарат</label>
              <select id="fc-calc-gcs-sys-target" name="targetId" required></select>
              <span class="fc-calc__error" id="fc-calc-gcs-sys-target-error" role="alert"></span>
            </div>
            <div class="fc-calc__chips" id="fc-calc-gcs-sys-example">
              <button type="button" class="fc-calc__chip" data-example="hc-pred">Пример: гидрокортизон 20 мг → преднизон</button>
            </div>
            <div class="fc-calc__actions fc-calc__toolbar">
              <button type="submit" id="fc-calc-gcs-sys-btn" class="fc-calc__btn fc-calc__btn--inactive" disabled>Рассчитать</button>
            </div>
          </form>
          <div class="fc-calc__info-panel fc-calc__info-panel--hidden" id="fc-calc-gcs-sys-info" aria-live="polite"></div>
          <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-gcs-sys-result" aria-live="polite">
            <p class="fc-calc__result-label">Эквивалентная доза</p>
            <p class="fc-calc__result-number" id="fc-calc-gcs-sys-result-dose">—</p>
            <p class="fc-calc__result-desc" id="fc-calc-gcs-sys-result-desc"></p>
          </div>
          <p class="fc-calc__hint" style="margin-top:12px">При переходе между препаратами рекомендуется снизить расчётную эквивалентную дозу нового препарата на 10–25% с титрованием по клиническому эффекту.</p>
        </div>
      </div>

      <details class="fc-calc__notes">
        <summary class="fc-calc__notes-summary">
          <span class="fc-calc__notes-title">Справка и предупреждения</span>
          <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
        </summary>
        <div class="fc-calc__notes-body">
          <p><strong>Принцип эквивалентности:</strong> Расчёт основан на сопоставлении относительной противовоспалительной активности препаратов (<a href="https://emedicine.medscape.com/article/920186-overview" target="_blank" rel="noopener noreferrer">eMedicine/Medscape</a>).</p>
          <p><strong>Клиническое предупреждение — ПРАВИЛО БЕЗОПАСНОСТИ:</strong></p>
          <p><strong>ВАЖНО:</strong> Расчётные дозы являются ориентировочными. При переходе с одного ГКС на другой из соображений безопасности рекомендуется снизить расчётную эквивалентную дозу нового препарата на 10–25% с последующим титрованием по клиническому эффекту (для компенсации возможной неполной перекрёстной толерантности).</p>
          <table class="fc-calc__table">
            <thead>
              <tr><th>Препарат</th><th>Экв. доза, мг</th><th>T<sub>½</sub></th><th>МК эффект</th></tr>
            </thead>
            <tbody>
              <tr><td>Кортизон</td><td>25</td><td>короткий</td><td>+++</td></tr>
              <tr><td>Гидрокортизон</td><td>20</td><td>короткий</td><td>+++</td></tr>
              <tr><td>Преднизон</td><td>5</td><td>промежуточный</td><td>++</td></tr>
              <tr><td>Преднизолон</td><td>5</td><td>промежуточный</td><td>++</td></tr>
              <tr><td>Триамцинолон</td><td>4</td><td>промежуточный</td><td>+</td></tr>
              <tr><td>Метилпреднизолон</td><td>4</td><td>промежуточный</td><td>+</td></tr>
              <tr><td>Дексаметазон</td><td>0,8</td><td>длинный</td><td>0</td></tr>
              <tr><td>Бетаметазон</td><td>0,8</td><td>длинный</td><td>0</td></tr>
            </tbody>
          </table>
          <p class="fc-calc__hint">Калькулятор для медицинских специалистов. Не заменяет клиническое решение врача.</p>
        </div>
      </details>
    </div>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${(await readFile(join(root, 'calculators', 'gcs-equiv', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'gcs-equiv', 'index.html'), html, 'utf8');
console.log('Built calculators/gcs-equiv/index.html');
