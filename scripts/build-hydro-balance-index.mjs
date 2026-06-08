#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'hydro-balance', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчет гидробаланса
-->
<div class="fc-calc" data-calculator="hydro-balance">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Расчет гидробаланса</h2>
        <p class="fc-calc__hint">Суточный водный баланс с учётом физиологической потребности по массе и возрасту.</p>
        <p class="fc-calc__formula"><strong>Гидробаланс</strong> = Поступление − Физиологические потери − Патологические потери</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-hydro-balance-form" novalidate>
          <div class="fc-calc__hydro-section">
            <p class="fc-calc__section" style="margin-top:0">Параметры пациента</p>
            <div class="fc-calc__hydro-grid fc-calc__hydro-grid--4">
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-weight">Масса тела, кг</label>
                <input type="number" id="fc-calc-hydro-balance-weight" name="weightKg" inputmode="decimal" min="0" step="any" placeholder="кг" required />
                <span class="fc-calc__error" id="fc-calc-hydro-balance-weight-error" role="alert"></span>
              </div>
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-age">Возраст, лет</label>
                <input type="number" id="fc-calc-hydro-balance-age" name="ageYears" inputmode="numeric" min="0" max="120" step="1" placeholder="лет" required />
                <span class="fc-calc__error" id="fc-calc-hydro-balance-age-error" role="alert"></span>
              </div>
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-temp">Температура, °C</label>
                <input type="number" id="fc-calc-hydro-balance-temp" name="tempC" inputmode="decimal" min="30" max="45" step="any" placeholder="37" />
                <span class="fc-calc__error" id="fc-calc-hydro-balance-temp-error" role="alert"></span>
              </div>
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-rr">ЧД, /мин</label>
                <input type="number" id="fc-calc-hydro-balance-rr" name="respiratoryRate" inputmode="numeric" min="0" max="80" step="1" placeholder="20" />
                <span class="fc-calc__error" id="fc-calc-hydro-balance-rr-error" role="alert"></span>
              </div>
            </div>
          </div>

          <div class="fc-calc__hydro-section">
            <p class="fc-calc__section" style="margin-top:0">Потери, мл/сут</p>
            <div class="fc-calc__hydro-grid fc-calc__hydro-grid--2">
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-diuresis">Диурез</label>
                <input type="number" id="fc-calc-hydro-balance-diuresis" name="diuresisMl" inputmode="decimal" min="0" step="any" placeholder="0" />
                <span class="fc-calc__error" aria-hidden="true"></span>
              </div>
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-vomiting">Рвота</label>
                <input type="number" id="fc-calc-hydro-balance-vomiting" name="vomitingMl" inputmode="decimal" min="0" step="any" placeholder="0" />
                <span class="fc-calc__error" aria-hidden="true"></span>
              </div>
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-drains">Дренажи, зонды</label>
                <input type="number" id="fc-calc-hydro-balance-drains" name="drainsMl" inputmode="decimal" min="0" step="any" placeholder="0" />
                <span class="fc-calc__error" aria-hidden="true"></span>
              </div>
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-other">Другие потери</label>
                <input type="number" id="fc-calc-hydro-balance-other" name="otherLossMl" inputmode="decimal" min="0" step="any" placeholder="0" />
                <span class="fc-calc__error" aria-hidden="true"></span>
              </div>
            </div>
          </div>

          <div class="fc-calc__hydro-section">
            <p class="fc-calc__section" style="margin-top:0">Патологические потери (авто)</p>
            <div class="fc-calc__hydro-grid fc-calc__hydro-grid--2">
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-breathing">Нефизиологическая ИВЛ</label>
                <select id="fc-calc-hydro-balance-breathing" name="breathingMode">
                  <option value="physiological">Нет или самостоятельное дыхание</option>
                  <option value="ivl_unhumidified">Да (без увлажнения, РО-6), +1000 мл/сут</option>
                </select>
                <span class="fc-calc__error" aria-hidden="true"></span>
              </div>
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-surgery">Интраоперационные потери</label>
                <select id="fc-calc-hydro-balance-surgery" name="surgeryTrauma">
                  <option value="none">Нет операции</option>
                  <option value="minimal">Минимальная травматизация (1–2 мл/кг/ч)</option>
                  <option value="medium">Средняя травматизация (2–4 мл/кг/ч)</option>
                  <option value="heavy">Тяжёлая травматизация (4–6 мл/кг/ч)</option>
                </select>
                <span class="fc-calc__error" aria-hidden="true"></span>
              </div>
            </div>
            <div class="fc-calc__field fc-calc__field--full" id="fc-calc-hydro-balance-surgery-hours-wrap" style="margin-top:12px">
              <label for="fc-calc-hydro-balance-surgery-hours">Длительность операции, ч</label>
              <input type="number" id="fc-calc-hydro-balance-surgery-hours" name="surgeryHours" inputmode="decimal" min="0" step="any" placeholder="ч" disabled />
              <span class="fc-calc__error" id="fc-calc-hydro-balance-surgery-hours-error" role="alert"></span>
            </div>
          </div>

          <div class="fc-calc__hydro-section">
            <p class="fc-calc__section" style="margin-top:0">Поступление, мл/сут</p>
            <div class="fc-calc__hydro-grid fc-calc__hydro-grid--2">
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-iv">Парентеральное введение</label>
                <input type="number" id="fc-calc-hydro-balance-iv" name="ivMl" inputmode="decimal" min="0" step="any" placeholder="0" />
                <span class="fc-calc__error" aria-hidden="true"></span>
              </div>
              <div class="fc-calc__field fc-calc__field--cell">
                <label for="fc-calc-hydro-balance-enteral">Энтеральное введение</label>
                <input type="number" id="fc-calc-hydro-balance-enteral" name="enteralMl" inputmode="decimal" min="0" step="any" placeholder="0" />
                <span class="fc-calc__error" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-hydro-balance-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-hydro-balance-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-hydro-balance-result" aria-live="polite">
        <div class="fc-calc__hydro-results">
          <div class="fc-calc__hydro-result-item fc-calc__hydro-result-item--main">
            <p class="fc-calc__result-label">Гидробаланс</p>
            <p class="fc-calc__result-number" id="fc-calc-hydro-balance-result-balance">—</p>
            <p class="fc-calc__result-desc" id="fc-calc-hydro-balance-result-desc"></p>
          </div>
          <div class="fc-calc__hydro-result-item">
            <p class="fc-calc__result-label">Физиологическая потребность</p>
            <p class="fc-calc__result-number" id="fc-calc-hydro-balance-result-fp">—</p>
          </div>
          <div class="fc-calc__hydro-result-item">
            <p class="fc-calc__result-label">Должный диурез</p>
            <p class="fc-calc__result-number" id="fc-calc-hydro-balance-result-diuresis">—</p>
            <p class="fc-calc__result-desc" id="fc-calc-hydro-balance-result-diuresis-note"></p>
          </div>
          <div class="fc-calc__hydro-result-item">
            <p class="fc-calc__result-label">Физиологические потери</p>
            <p class="fc-calc__result-number" id="fc-calc-hydro-balance-result-physio">—</p>
            <p class="fc-calc__result-desc" id="fc-calc-hydro-balance-result-physio-note"></p>
          </div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Справка и предупреждения</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Формула:</strong> Гидробаланс = Парентеральное + Энтеральное введение − Диурез − Патологические потери.</p>
        <p><strong>ФП:</strong> до 65 лет — 30; 65–75 — 25; старше 75 — 20 мл/кг/сут.</p>
        <p><strong>Автоматически учитываются в патологических потерях:</strong></p>
        <ul>
          <li>Внепочечные физиологические потери — 0,4×ФП</li>
          <li>Лихорадка — 3 / 6 / 9 / 12 / 15 мл/кг при t° 37,5–38,5 / 38,5–39,5 / … / ≥41,5 °C</li>
          <li>Одышка — 10 / 20 / 30 / 40 / 50 мл/кг при ЧД 25–35 / 35–45 / … / ≥65 /мин</li>
          <li>ИВЛ без увлажнения (РО-6) — 1000 мл/сут</li>
          <li>Операция — 2 / 4 / 6 мл/кг/ч (верхняя граница диапазона)</li>
        </ul>
        <p><strong>Справочно:</strong> должный диурез — 20 мл/кг/сут; внепочечные потери — 0,4×ФП.</p>
        <p>Рвота, дренажи и прочие потери вводятся вручную. Патологический диурез учитывается в поле «Диурез».</p>
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
${(await readFile(join(root, 'calculators', 'hydro-balance', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'hydro-balance', 'index.html'), html, 'utf8');
console.log('Built calculators/hydro-balance/index.html');
