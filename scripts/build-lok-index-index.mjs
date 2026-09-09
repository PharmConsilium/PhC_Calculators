#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_LIMITS } from '../calculators/lok-index/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'lok-index';

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Вероятность цирроза при гепатите C
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Вероятность цирроза при гепатите C</h2>
        <p class="fc-calc__hint">Мультикалькулятор: CDS (Bonacini), индекс Лока, GUCI, APRI и FIB-4</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-${slug}-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Исходные данные</h3>

              <div class="fc-calc__lok-grid">
                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-age">Возраст, лет</label>
                  <input type="number" id="fc-calc-${slug}-age" name="age" inputmode="numeric" min="${FIELD_LIMITS.age.min}" max="${FIELD_LIMITS.age.max}" step="1" placeholder="напр. 50" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-age-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-plt">Тромбоциты (PLT), ×10⁹/л</label>
                  <input type="number" id="fc-calc-${slug}-plt" name="plt" inputmode="decimal" min="${FIELD_LIMITS.plt.min}" max="${FIELD_LIMITS.plt.max}" step="any" placeholder="напр. 180" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-plt-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-ast">АСТ, Ед/л</label>
                  <input type="number" id="fc-calc-${slug}-ast" name="ast" inputmode="decimal" min="${FIELD_LIMITS.ast.min}" max="${FIELD_LIMITS.ast.max}" step="any" placeholder="напр. 60" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-ast-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-alt">АЛТ, Ед/л</label>
                  <input type="number" id="fc-calc-${slug}-alt" name="alt" inputmode="decimal" min="${FIELD_LIMITS.alt.min}" max="${FIELD_LIMITS.alt.max}" step="any" placeholder="напр. 50" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-alt-error" role="alert"></span>
                </div>

                <div class="fc-calc__field fc-calc__lok-field--full">
                  <label for="fc-calc-${slug}-uln">Верхняя граница нормы АСТ (ВГН), Ед/л</label>
                  <input type="number" id="fc-calc-${slug}-uln" name="ulnAst" inputmode="decimal" min="${FIELD_LIMITS.ulnAst.min}" max="${FIELD_LIMITS.ulnAst.max}" step="any" placeholder="напр. 40" value="40" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-uln-error" role="alert"></span>
                </div>

                <div class="fc-calc__field fc-calc__lok-field--inr">
                  <label for="fc-calc-${slug}-inr">МНО</label>
                  <div class="fc-calc__field-row fc-calc__lok-inr-row">
                    <input type="number" id="fc-calc-${slug}-inr" name="inr" inputmode="decimal" min="${FIELD_LIMITS.inr.min}" max="${FIELD_LIMITS.inr.max}" step="any" placeholder="напр. 1,1" required />
                    <select id="fc-calc-${slug}-inr-unit" name="inrUnit" aria-label="Единицы МНО">
                      <option value="percent">%</option>
                      <option value="fraction">fraction</option>
                      <option value="ratio" selected>ratio</option>
                    </select>
                  </div>
                  <span class="fc-calc__error" id="fc-calc-${slug}-inr-error" role="alert"></span>
                </div>
              </div>

              <span class="fc-calc__error" id="fc-calc-${slug}-form-error" role="alert"></span>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-${slug}-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-${slug}-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-${slug}-result" aria-live="polite">
        <p class="fc-calc__result-label">Результаты индексов</p>
        <div class="fc-calc__lok-scores">
          <div class="fc-calc__lok-score">
            <p class="fc-calc__lok-score-name">CDS (Bonacini)</p>
            <p class="fc-calc__lok-score-value" id="fc-calc-${slug}-cds-value">—</p>
            <p class="fc-calc__lok-score-desc" id="fc-calc-${slug}-cds-desc"></p>
          </div>
          <div class="fc-calc__lok-score">
            <p class="fc-calc__lok-score-name">Индекс Лока</p>
            <p class="fc-calc__lok-score-value" id="fc-calc-${slug}-lok-value">—</p>
            <p class="fc-calc__lok-score-desc" id="fc-calc-${slug}-lok-desc"></p>
          </div>
          <div class="fc-calc__lok-score">
            <p class="fc-calc__lok-score-name">GUCI</p>
            <p class="fc-calc__lok-score-value" id="fc-calc-${slug}-guci-value">—</p>
            <p class="fc-calc__lok-score-desc" id="fc-calc-${slug}-guci-desc"></p>
          </div>
          <div class="fc-calc__lok-score">
            <p class="fc-calc__lok-score-name">APRI</p>
            <p class="fc-calc__lok-score-value" id="fc-calc-${slug}-apri-value">—</p>
            <p class="fc-calc__lok-score-desc" id="fc-calc-${slug}-apri-desc"></p>
          </div>
          <div class="fc-calc__lok-score">
            <p class="fc-calc__lok-score-name">FIB-4</p>
            <p class="fc-calc__lok-score-value" id="fc-calc-${slug}-fib4-value">—</p>
            <p class="fc-calc__lok-score-desc" id="fc-calc-${slug}-fib4-desc"></p>
          </div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Калькулятор по типу MSD / EBMcalc MultiCalc оценивает вероятность цирроза при хроническом гепатите C сразу несколькими неинвазивными индексами по одним и тем же лабораторным данным.</p>
        <p><strong>Формулы:</strong></p>
        <ul>
          <li><strong>CDS (Bonacini)</strong> — сумма баллов за тромбоциты, отношение ALT/AST и МНО (0–11);</li>
          <li><strong>Индекс Лока</strong>: x = −5,56 − 0,0089×PLT + 1,26×(AST/ALT) + 5,27×INR; Lok = eˣ/(1+eˣ);</li>
          <li><strong>GUCI</strong> = (AST/ВГН АСТ) × INR × 100 / PLT;</li>
          <li><strong>APRI</strong> = (AST/ВГН АСТ) / PLT × 100;</li>
          <li><strong>FIB-4</strong> = (возраст × AST) / (PLT × √ALT).</li>
        </ul>
        <p><strong>МНО:</strong> единицы как в MSD — <em>ratio</em> и <em>fraction</em> (значение МНО как есть), <em>%</em> (МНО × 100, например 110% = 1,10).</p>
        <p><strong>Ориентиры интерпретации:</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Индекс</th>
                <th>Пороги</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lok</td>
                <td>&lt;0,2 / 0,2–0,5 / ≥0,5</td>
              </tr>
              <tr>
                <td>CDS</td>
                <td>≥8 — высокая вероятность выраженного фиброза / цирроза</td>
              </tr>
              <tr>
                <td>GUCI</td>
                <td>&lt;1 / ≥1</td>
              </tr>
              <tr>
                <td>APRI</td>
                <td>≤0,5 / 0,5–1 / 1–1,5 / 1,5–2 / &gt;2</td>
              </tr>
              <tr>
                <td>FIB-4</td>
                <td>&lt;1,45 / 1,45–3,25 / &gt;3,25</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><strong>Источники:</strong></p>
        <p>1. Udell JA, Wang CS, Tinmouth J, et al. Does this patient with liver disease have cirrhosis? <em>JAMA.</em> 2012;307(8):832-842. PMID: 22357834.</p>
        <p>2. Bonacini M, et al. Utility of a discriminant score for diagnosing advanced fibrosis or cirrhosis in patients with chronic hepatitis C virus infection. <em>Am J Gastroenterol.</em> 1997;92(8):1302-1304.</p>
        <p>3. Lok AS, et al. Predicting cirrhosis in patients with hepatitis C based on standard laboratory tests: results of the HALT-C cohort. <em>Hepatology.</em> 2005;42(2):282-292. PMID: 15986415.</p>
        <p>4. Islam S, et al. Cirrhosis in hepatitis C virus-infected patients can be excluded using an index of standard biochemical serum markers (GUCI). <em>Scand J Gastroenterol.</em> 2005;40(7):867-872.</p>
        <p>5. Wai CT, et al. A simple noninvasive index can predict both significant fibrosis and cirrhosis in patients with chronic hepatitis C (APRI). <em>Hepatology.</em> 2003;38(2):518-526.</p>
        <p>6. Vallet-Pichard A, et al. FIB-4: an inexpensive and accurate marker of fibrosis in HCV infection. <em>Hepatology.</em> 2007;46(1):32-36.</p>
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
