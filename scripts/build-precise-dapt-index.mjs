#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIELD_LIMITS } from '../calculators/precise-dapt/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'precise-dapt';

const [css, extra, widget, nomogramBuf] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'nomogram.png')),
]);

const nomogramSrc = `data:image/png;base64,${nomogramBuf.toString('base64')}`;

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала PRECISE-DAPT
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала PRECISE-DAPT</h2>
        <p class="fc-calc__hint">Риск геморрагических осложнений и выбор длительности двойной антитромбоцитарной терапии (ДАТТ) после ЧКВ (Costa et al., 2017)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-${slug}-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Клинические показатели</h3>

              <div class="fc-calc__pd-grid">
                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-hb">Гемоглобин, г/л</label>
                  <input type="number" id="fc-calc-${slug}-hb" name="hemoglobinGl" inputmode="decimal" min="${FIELD_LIMITS.hemoglobinGl.min}" max="${FIELD_LIMITS.hemoglobinGl.max}" step="any" placeholder="напр. 120" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-hb-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-wbc">Лейкоциты, ×10⁹/л</label>
                  <input type="number" id="fc-calc-${slug}-wbc" name="wbc" inputmode="decimal" min="${FIELD_LIMITS.wbc.min}" max="${FIELD_LIMITS.wbc.max}" step="any" placeholder="напр. 8" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-wbc-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-age">Возраст, лет</label>
                  <input type="number" id="fc-calc-${slug}-age" name="age" inputmode="numeric" min="${FIELD_LIMITS.age.min}" max="${FIELD_LIMITS.age.max}" step="1" placeholder="напр. 65" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-age-error" role="alert"></span>
                </div>

                <div class="fc-calc__field fc-calc__pd-crcl-block">
                  <label>Клиренс креатинина</label>
                  <div class="fc-calc__segmented" data-crcl-mode-group role="group" aria-label="Способ ввода клиренса креатинина">
                    <button type="button" class="fc-calc__segment fc-calc__segment--active" data-crcl-mode="known">Известен</button>
                    <button type="button" class="fc-calc__segment" data-crcl-mode="calc">Рассчитать</button>
                  </div>

                  <div class="fc-calc__pd-crcl-panel" data-crcl-panel="known">
                    <label class="fc-calc__pd-sublabel" for="fc-calc-${slug}-crcl">мл/мин</label>
                    <input type="number" id="fc-calc-${slug}-crcl" name="crCl" inputmode="decimal" min="${FIELD_LIMITS.crCl.min}" max="${FIELD_LIMITS.crCl.max}" step="any" placeholder="напр. 80" />
                    <span class="fc-calc__error" id="fc-calc-${slug}-crcl-error" role="alert"></span>
                  </div>

                  <div class="fc-calc__pd-crcl-panel" data-crcl-panel="calc" hidden>
                    <p class="fc-calc__pd-crcl-hint">По формуле Cockcroft–Gault (используется возраст выше)</p>

                    <div class="fc-calc__field fc-calc__pd-nested">
                      <label>Пол</label>
                      <div class="fc-calc__segmented" data-sex-group role="group" aria-label="Пол">
                        <button type="button" class="fc-calc__segment fc-calc__segment--active" data-sex="male">Мужской</button>
                        <button type="button" class="fc-calc__segment" data-sex="female">Женский</button>
                      </div>
                    </div>

                    <div class="fc-calc__pd-cg-grid">
                      <div class="fc-calc__field fc-calc__pd-nested">
                        <label for="fc-calc-${slug}-weight">Масса тела, кг</label>
                        <input type="number" id="fc-calc-${slug}-weight" name="weightKg" inputmode="decimal" min="${FIELD_LIMITS.weightKg.min}" max="${FIELD_LIMITS.weightKg.max}" step="any" placeholder="напр. 70" />
                        <span class="fc-calc__error" id="fc-calc-${slug}-weight-error" role="alert"></span>
                      </div>

                      <div class="fc-calc__field fc-calc__pd-nested">
                        <label for="fc-calc-${slug}-creat">Креатинин</label>
                        <div class="fc-calc__pd-input-row">
                          <input type="number" id="fc-calc-${slug}-creat" name="creatinine" inputmode="decimal" min="0" step="any" placeholder="напр. 90" />
                          <select id="fc-calc-${slug}-creat-unit" name="creatinineUnit" aria-label="Единицы креатинина">
                            <option value="umol" selected>мкмоль/л</option>
                            <option value="mgdl">мг/дл</option>
                          </select>
                        </div>
                        <span class="fc-calc__error" id="fc-calc-${slug}-creat-error" role="alert"></span>
                      </div>
                    </div>

                    <p class="fc-calc__pd-crcl-preview" id="fc-calc-${slug}-crcl-preview" hidden>
                      Рассчитанный клиренс: <strong id="fc-calc-${slug}-crcl-preview-value">—</strong> мл/мин
                    </p>
                    <span class="fc-calc__error" id="fc-calc-${slug}-cg-error" role="alert"></span>
                  </div>
                </div>

                <div class="fc-calc__field fc-calc__pd-bleed">
                  <label>Предшествующие кровотечения</label>
                  <div class="fc-calc__segmented" data-bleed-group role="group" aria-label="Предшествующие кровотечения">
                    <button type="button" class="fc-calc__segment" data-bleed="no">Нет</button>
                    <button type="button" class="fc-calc__segment" data-bleed="yes">Да</button>
                  </div>
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
        <p class="fc-calc__result-label">Суммарный балл PRECISE-DAPT (0–100)</p>
        <p class="fc-calc__result-number" id="fc-calc-${slug}-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-${slug}-result-band"></p>
        <p class="fc-calc__result-desc" id="fc-calc-${slug}-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Шкала PRECISE-DAPT предложена в рекомендациях ESC по двойной антитромбоцитарной терапии (ДАТТ). Позволяет оценить риск внегоспитальных кровотечений в течение 12 месяцев после ЧКВ и выбрать длительность ДАТТ.</p>
        <p>Без калькулятора оценка выполняется по номограмме: для каждого из пяти показателей проводится вертикаль до оси баллов, затем баллы суммируются.</p>
        <figure class="fc-calc__pd-nomogram">
          <button type="button" class="fc-calc__pd-nomogram-open" id="fc-calc-${slug}-nomogram-open" aria-label="Открыть номограмму PRECISE-DAPT">
            <img src="${nomogramSrc}" alt="Номограмма шкалы PRECISE-DAPT (приложение 5 к клиническому протоколу)" loading="lazy" />
          </button>
        </figure>
        <p><strong>Якоря номограммы (линейная интерполяция):</strong></p>
        <ul>
          <li>гемоглобин ≥12 г/дл (120 г/л) → 0 баллов; ≤10 г/дл (100 г/л) → 15;</li>
          <li>лейкоциты ≤5×10⁹/л → 0; ≥20×10⁹/л → 15;</li>
          <li>возраст ≤50 лет → 0; ≥90 лет → 19;</li>
          <li>клиренс креатинина ≥100 мл/мин → 0; 0 мл/мин → 25;</li>
          <li>предшествующее спонтанное кровотечение → 26 баллов.</li>
        </ul>
        <p><strong>Интерпретация:</strong></p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Сумма баллов</th>
                <th>Риск / ДАТТ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>≤ 10</td>
                <td>Очень низкий риск — стандартная / длительная ДАТТ</td>
              </tr>
              <tr>
                <td>11–17</td>
                <td>Низкий риск — стандартная / длительная ДАТТ</td>
              </tr>
              <tr>
                <td>18–24</td>
                <td>Умеренный риск — стандартная / длительная ДАТТ</td>
              </tr>
              <tr>
                <td>≥ 25</td>
                <td>Высокий риск — короткая ДАТТ 3–6 месяцев</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Клиренс креатинина можно ввести напрямую или рассчитать по Cockcroft–Gault: (140 − возраст) × масса (кг) × (0,85 для женщин) / (72 × креатинин, мг/дл). При креатинине в мкмоль/л значение делится на 88,4. Решение о длительности ДАТТ принимается с учётом ишемического риска.</p>
        <p><strong>Источники:</strong></p>
        <p>1. Costa F, van Klaveren D, James S, et al. Derivation and validation of the PRECISE-DAPT score. <em>Lancet.</em> 2017;389(10073):1025-1034. PMID: 28290994.</p>
        <p>2. Рекомендации ESC по двойной антитромбоцитарной терапии, 2017.</p>
        <p>3. Клинический протокол МЗ РБ «Диагностика и лечение пациентов (взрослое население) со стабильной стенокардией», 28.04.2026 № 47.</p>
        <p>4. Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. <em>Nephron.</em> 1976;16(1):31-41. doi: 10.1159/000180580. PMID: 1244564.</p>
      </div>
    </details>
  </div>

  <div class="fc-calc__pd-lightbox" id="fc-calc-${slug}-lightbox" hidden>
    <div class="fc-calc__pd-lightbox-backdrop" data-lightbox-close></div>
    <div class="fc-calc__pd-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Номограмма PRECISE-DAPT">
      <button type="button" class="fc-calc__pd-lightbox-close" data-lightbox-close aria-label="Закрыть">×</button>
      <img class="fc-calc__pd-lightbox-img" id="fc-calc-${slug}-lightbox-img" alt="Номограмма шкалы PRECISE-DAPT" />
    </div>
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
