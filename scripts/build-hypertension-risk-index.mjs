#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FIELD_LIMITS,
  RISK_FACTORS,
  TARGET_ORGAN_DAMAGES,
  ASSOCIATED_CONDITIONS,
  DIABETES_CRITERIA,
} from '../calculators/hypertension-risk/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'hypertension-risk';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function checkboxGroup(name, items) {
  return items
    .map((item) => {
      const hint = item.hint
        ? `\n                  <span class="fc-calc__htn-row-hint">${escapeHtml(item.hint)}</span>`
        : '';
      return `              <label class="fc-calc__htn-row" for="fc-calc-${slug}-${name}-${item.id}">
                <input type="checkbox" id="fc-calc-${slug}-${name}-${item.id}" name="${name}" value="${item.id}" />
                <span class="fc-calc__htn-row-body">
                  <span class="fc-calc__htn-row-label">${escapeHtml(item.label)}</span>${hint}
                </span>
              </label>`;
    })
    .join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Степень и стадия артериальной гипертензии КП МЗ РБ № 38
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Степень и стадия артериальной гипертензии КП МЗ РБ № 38</h2>
        <p class="fc-calc__hint">Стратификация общего сердечно-сосудистого риска по клиническому протоколу МЗ РБ (приложения 1, 3, 4)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-${slug}-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Артериальное давление</h3>
              <div class="fc-calc__htn-bp-grid">
                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-sbp">САД, мм рт.ст.</label>
                  <input type="number" id="fc-calc-${slug}-sbp" name="sbp" inputmode="numeric" min="${FIELD_LIMITS.sbp.min}" max="${FIELD_LIMITS.sbp.max}" step="1" placeholder="напр. 150" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-sbp-error" role="alert"></span>
                </div>
                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-dbp">ДАД, мм рт.ст.</label>
                  <input type="number" id="fc-calc-${slug}-dbp" name="dbp" inputmode="numeric" min="${FIELD_LIMITS.dbp.min}" max="${FIELD_LIMITS.dbp.max}" step="1" placeholder="напр. 95" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-dbp-error" role="alert"></span>
                </div>
              </div>
              <p class="fc-calc__htn-degree-preview" id="fc-calc-${slug}-degree-preview" hidden></p>

              <details class="fc-calc__htn-section" data-htn-clinical hidden>
                <summary class="fc-calc__htn-section-summary">
                  <span class="fc-calc__htn-section-title">1. Факторы риска (ФР)</span>
                  <span class="fc-calc__htn-section-count" data-htn-count="riskFactors" hidden></span>
                  <span class="fc-calc__htn-section-chevron" aria-hidden="true"></span>
                </summary>
                <div class="fc-calc__htn-section-body">
                  <p class="fc-calc__htn-section-hint">Отметьте критерии приложения 3</p>
                  <div class="fc-calc__htn-options">
${checkboxGroup('riskFactors', RISK_FACTORS)}
                  </div>
                </div>
              </details>

              <details class="fc-calc__htn-section" data-htn-clinical hidden>
                <summary class="fc-calc__htn-section-summary">
                  <span class="fc-calc__htn-section-title">2. Бессимптомное поражение органов-мишеней (ПОМ)</span>
                  <span class="fc-calc__htn-section-count" data-htn-count="pom" hidden></span>
                  <span class="fc-calc__htn-section-chevron" aria-hidden="true"></span>
                </summary>
                <div class="fc-calc__htn-section-body">
                  <div class="fc-calc__htn-options">
${checkboxGroup('pom', TARGET_ORGAN_DAMAGES)}
                  </div>
                </div>
              </details>

              <details class="fc-calc__htn-section" data-htn-clinical hidden>
                <summary class="fc-calc__htn-section-summary">
                  <span class="fc-calc__htn-section-title">3. Ассоциированные клинические состояния (АКС)</span>
                  <span class="fc-calc__htn-section-count" data-htn-count="aks" hidden></span>
                  <span class="fc-calc__htn-section-chevron" aria-hidden="true"></span>
                </summary>
                <div class="fc-calc__htn-section-body">
                  <div class="fc-calc__htn-options">
${checkboxGroup('aks', ASSOCIATED_CONDITIONS)}
                  </div>
                </div>
              </details>

              <details class="fc-calc__htn-section" data-htn-clinical hidden>
                <summary class="fc-calc__htn-section-summary">
                  <span class="fc-calc__htn-section-title">4. Сахарный диабет (СД)</span>
                  <span class="fc-calc__htn-section-count" data-htn-count="diabetes" hidden></span>
                  <span class="fc-calc__htn-section-chevron" aria-hidden="true"></span>
                </summary>
                <div class="fc-calc__htn-section-body">
                  <div class="fc-calc__htn-options">
${checkboxGroup('diabetes', DIABETES_CRITERIA)}
                  </div>
                </div>
              </details>

              <span class="fc-calc__error" id="fc-calc-${slug}-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-${slug}-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-result" aria-live="polite">
        <p class="fc-calc__result-label">Заключение</p>
        <p class="fc-calc__htn-conclusion-head" id="fc-calc-${slug}-result-headline"></p>
        <p class="fc-calc__htn-result-value fc-calc__htn-conclusion" id="fc-calc-${slug}-result-conclusion"></p>

        <div class="fc-calc__htn-result-block">
          <p class="fc-calc__htn-result-label">Степень АГ (Прил. 1)</p>
          <p class="fc-calc__htn-result-value" id="fc-calc-${slug}-result-degree"></p>
        </div>

        <div class="fc-calc__htn-result-block">
          <p class="fc-calc__htn-result-label">Общий ССР (Прил. 4)</p>
          <p class="fc-calc__htn-result-value" id="fc-calc-${slug}-result-risk"></p>
        </div>

        <div class="fc-calc__htn-result-block" id="fc-calc-${slug}-result-basis-wrap" hidden>
          <p class="fc-calc__htn-result-label">Основание</p>
          <p class="fc-calc__htn-result-value" id="fc-calc-${slug}-result-basis"></p>
        </div>

        <div class="fc-calc__htn-result-block">
          <p class="fc-calc__htn-result-label">Рекомендации</p>
          <p class="fc-calc__result-desc" id="fc-calc-${slug}-result-rec"></p>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Расчёт выполнен по клиническому протоколу МЗ РБ «Диагностика и лечение пациентов (взрослое население) с артериальной гипертензией»: категории офисного АД (приложение 1), критерии стратификации (приложение 3), матрица общего ССР (приложение 4).</p>
        <p><strong>Категории АД:</strong> оптимальное (&lt;120/&lt;80), нормальное (120–129 и/или 80–84), высокое нормальное (130–139 и/или 85–89), АГ I–III степени; ИСАГ (САД ≥140 и ДАД &lt;90) и ИДАГ (САД &lt;140 и ДАД ≥90) с градуировкой по САД или ДАД.</p>
        <p><strong>Стадия ГБ</strong> (при АГ I–III / ИСАГ / ИДАГ): 1 — без ПОМ, СД и АКС; 2 — бессимптомное ПОМ и/или СД; 3 — АКС (включая ХБП ≥4 ст.).</p>
        <p><strong>Матрица риска (приложение 4):</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>ФР / ПОМ / заболевания</th>
                <th>Выс. норм.</th>
                <th>I ст.</th>
                <th>II ст.</th>
                <th>III ст.</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Нет других ФР</td><td>Нет риска</td><td>Низкий</td><td>Средний</td><td>Высокий</td></tr>
              <tr><td>1–2 ФР</td><td>Низкий</td><td>Средний</td><td>Высокий</td><td>Высокий</td></tr>
              <tr><td>≥ 3 ФР</td><td>Средний</td><td>Высокий</td><td>Высокий</td><td>Очень высокий</td></tr>
              <tr><td>Бессимптомное ПОМ, ХБП 3 ст.</td><td>Высокий</td><td>Высокий</td><td>Высокий</td><td>Очень высокий</td></tr>
              <tr><td>АКС, ХБП ≥4 ст., СД</td><td colspan="4">Очень высокий</td></tr>
            </tbody>
          </table>
        </div>
        <p>Оформление заключения по протоколу РБ: (1) степень АГ по Приложению 1; (2) категория общего ССР по матрице Приложения 4 с указанием основания (число ФР и/или бессимптомное ПОМ / ХБП 3 ст. / АКС / ХБП ≥4 / СД). ФР считаются по количеству (0; 1–2; ≥3); ПОМ и АКС/СД — отдельные строки матрицы, а не «ещё один ФР».</p>
        <p><strong>Источники:</strong></p>
        <p>1. Клинический протокол МЗ РБ «Диагностика и лечение пациентов (взрослое население) с артериальной гипертензией», приложения 1, 3, 4 (Национальный правовой Интернет-портал Республики Беларусь, 11.08.2026, 11-3/45133).</p>
      </div>
    </details>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${widget.trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', slug, 'index.html'), html, 'utf8');
console.log(`Built calculators/${slug}/index.html`);
