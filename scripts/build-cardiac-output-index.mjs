#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'cardiac-output', 'extra.css'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Калькулятор сердечного выброса
-->
<div class="fc-calc" data-calculator="cardiac-output">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Сердечный выброс</h2>
        <p class="fc-calc__hint">Расчёт сердечного выброса, сердечного индекса и ударного объёма по методу Фика</p>
        <p class="fc-calc__formula"><strong>СВ</strong> = VO₂ / ((SaO₂ − SvO₂) × Hb × 13,4) &nbsp;|&nbsp; <strong>ППТ</strong> = √(Рост × Вес / 3600)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-cardiac-output-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Ввод данных</h3>

              <div class="fc-calc__co-grid">
                <div class="fc-calc__field fc-calc__co-field--half">
                  <label for="fc-calc-cardiac-output-sao2">SaO₂, %</label>
                  <input type="number" id="fc-calc-cardiac-output-sao2" name="sao2" inputmode="decimal" min="0" max="100" step="any" required />
                </div>
                <div class="fc-calc__field fc-calc__co-field--half">
                  <label for="fc-calc-cardiac-output-svo2">SvO₂, %</label>
                  <input type="number" id="fc-calc-cardiac-output-svo2" name="svo2" inputmode="decimal" min="0" max="100" step="any" required />
                </div>
                <div class="fc-calc__field fc-calc__co-field--half">
                  <label for="fc-calc-cardiac-output-hb">Гемоглобин, г/л</label>
                  <input type="number" id="fc-calc-cardiac-output-hb" name="hemoglobin" inputmode="decimal" min="0" step="any" required />
                </div>
                <div class="fc-calc__field fc-calc__co-field--half">
                  <label for="fc-calc-cardiac-output-hr">ЧСС, уд/мин</label>
                  <input type="number" id="fc-calc-cardiac-output-hr" name="hr" inputmode="numeric" min="0" step="1" required />
                </div>
                <div class="fc-calc__field fc-calc__co-field--third">
                  <label for="fc-calc-cardiac-output-age">Возраст, лет</label>
                  <input type="number" id="fc-calc-cardiac-output-age" name="age" inputmode="numeric" min="0" step="1" required />
                </div>
                <div class="fc-calc__field fc-calc__co-field--third">
                  <label for="fc-calc-cardiac-output-height">Рост, см</label>
                  <input type="number" id="fc-calc-cardiac-output-height" name="height" inputmode="decimal" min="0" step="any" required />
                </div>
                <div class="fc-calc__field fc-calc__co-field--third">
                  <label for="fc-calc-cardiac-output-weight">Вес, кг</label>
                  <input type="number" id="fc-calc-cardiac-output-weight" name="weight" inputmode="decimal" min="0" step="any" placeholder="кг" required />
                </div>
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-cardiac-output-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-cardiac-output-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-cardiac-output-form" disabled>Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-cardiac-output-result" aria-live="polite">
        <div class="fc-calc__co-results">
          <div class="fc-calc__co-result-item fc-calc__co-result-item--main">
            <p class="fc-calc__result-label">СВ (сердечный выброс)</p>
            <p class="fc-calc__result-number" id="fc-calc-cardiac-output-result-co">—</p>
          </div>
          <div class="fc-calc__co-result-item">
            <p class="fc-calc__result-label">ППТ (площадь поверхности тела)</p>
            <p class="fc-calc__result-number" id="fc-calc-cardiac-output-result-bsa">—</p>
          </div>
          <div class="fc-calc__co-result-item">
            <p class="fc-calc__result-label">СИ (сердечный индекс)</p>
            <p class="fc-calc__result-number" id="fc-calc-cardiac-output-result-ci">—</p>
          </div>
          <div class="fc-calc__co-result-item">
            <p class="fc-calc__result-label">УО (ударный объём)</p>
            <p class="fc-calc__result-number" id="fc-calc-cardiac-output-result-sv">—</p>
          </div>
          <div class="fc-calc__co-result-item">
            <p class="fc-calc__result-label">VO₂ (потребление O₂)</p>
            <p class="fc-calc__result-number" id="fc-calc-cardiac-output-result-vo2">—</p>
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
        <p><strong>Уравнения калькулятора:</strong></p>
        <ul>
          <li>СВ (л/мин) = VO₂ / ((SaO₂ − SvO₂) × Hb × 13,4)</li>
          <li>VO₂ = 125 мл O₂/мин × ППТ; при возрасте &gt; 70 лет — 110 мл O₂/мин × ППТ</li>
          <li>ППТ = √(Рост, см × Вес, кг / 3600)</li>
          <li>СИ = СВ / ППТ</li>
          <li>УО = СВ / ЧСС × 1000</li>
        </ul>
        <ul>
          <li>SaO₂ и SvO₂ вводятся в процентах; в формуле используются десятичные доли.</li>
          <li>Гемоглобин вводится в г/л; в формуле переводится в г/дл.</li>
        </ul>

        <p><strong>Методы измерения СВ, СИ и УО</strong></p>
        <p><strong>Инвазивные</strong></p>
        <ul>
          <li><strong>Термодилюция</strong> — введение холодного раствора и регистрация изменения температуры крови в лёгочной артерии; применяется в реанимации.</li>
          <li><strong>Катетеризация лёгочной артерии</strong> — прямое измерение СВ, СИ и ударного объёма с высокой точностью.</li>
        </ul>
        <p><strong>Неинвазивные</strong></p>
        <ul>
          <li><strong>Эхокардиография</strong> — оценка ударного объёма и СВ по данным ультразвукового исследования.</li>
          <li><strong>Биоимпеданс</strong> — расчёт по электрическому сопротивлению тканей.</li>
        </ul>

        <p><strong>Референсные значения</strong></p>
        <ul>
          <li>СВ: 4,0–8,0 л/мин</li>
          <li>СИ: 2,5–4,0 л/мин/м²</li>
          <li>УО: 60–100 мл/удар</li>
        </ul>

        <p><strong>Клиническое значение</strong></p>
        <ul>
          <li><strong>Сердечная недостаточность</strong> — снижение СВ и СИ отражает тяжесть состояния и ответ на терапию.</li>
          <li><strong>Шок</strong> (кардиогенный, гиповолемический, септический) — СВ и СИ помогают уточнить механизм и тактику лечения.</li>
          <li><strong>Интенсивная терапия</strong> — мониторинг гемодинамики при ОИМ, сепсисе, тяжёлой травме.</li>
        </ul>

        <p><strong>Факторы, влияющие на СВ, СИ и УО</strong></p>
        <ul>
          <li><strong>Преднагрузка</strong> — степень растяжения миокарда перед систолой; при гиперволемии УО и СВ обычно растут.</li>
          <li><strong>Постнагрузка</strong> — сопротивление выбросу; при артериальной гипертензии УО и СВ снижаются.</li>
          <li><strong>Сократимость миокарда</strong> — при её снижении (например, после инфаркта) уменьшаются УО и СВ.</li>
        </ul>

        <p>СВ, СИ и УО — базовые показатели гемодинамики для оценки работы сердечно-сосудистой системы.</p>

        <p class="fc-calc__hint">Источник: <a href="https://medsoftpro.ru/kalkulyatory/cardiac-output" target="_blank" rel="noopener noreferrer">medsoftpro.ru</a></p>
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
${(await readFile(join(root, 'calculators', 'cardiac-output', 'widget.js'), 'utf8')).trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'cardiac-output', 'index.html'), html, 'utf8');
console.log('Built calculators/cardiac-output/index.html');
