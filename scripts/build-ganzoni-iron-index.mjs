#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calcDir = join(root, 'calculators', 'ganzoni-iron');

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

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчёт дозы внутривенного железа (формула Ганзони)
  Сборка: ${new Date().toISOString().slice(0, 10)}
-->
<div class="fc-calc" data-calculator="ganzoni-iron">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Расчёт дозы внутривенного железа (формула Ганзони)</h2>
        <p class="fc-calc__hint">Дефицит железа по массе тела, целевому и текущему Hb с добавкой запаса; опционально — планирование сеансов в/в препарата.</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-ganzoni-iron-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Данные пациента</h3>

              <div class="fc-calc__field">
                <label for="fc-calc-ganzoni-iron-weight">Масса тела, кг</label>
                <input
                  type="number"
                  id="fc-calc-ganzoni-iron-weight"
                  name="weightKg"
                  inputmode="decimal"
                  min="0"
                  step="any"
                  placeholder="напр. 70"
                  required
                />
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-ganzoni-iron-current-hb">Текущий Hb</label>
                <div class="fc-calc__field-row">
                  <input
                    type="number"
                    id="fc-calc-ganzoni-iron-current-hb"
                    name="currentHb"
                    inputmode="decimal"
                    min="0"
                    step="any"
                    placeholder="напр. 80"
                    required
                  />
                  <select id="fc-calc-ganzoni-iron-current-unit" name="hbUnitCurrent" aria-label="Единицы текущего Hb">
                    <option value="gdl">г/дл</option>
                    <option value="gl" selected>г/л</option>
                  </select>
                </div>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-ganzoni-iron-target-hb">Целевой Hb</label>
                <div class="fc-calc__field-row">
                  <input
                    type="number"
                    id="fc-calc-ganzoni-iron-target-hb"
                    name="targetHb"
                    inputmode="decimal"
                    min="0"
                    step="any"
                    placeholder="напр. 130"
                    required
                  />
                  <select id="fc-calc-ganzoni-iron-target-unit" name="hbUnitTarget" aria-label="Единицы целевого Hb">
                    <option value="gdl">г/дл</option>
                    <option value="gl" selected>г/л</option>
                  </select>
                </div>
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-ganzoni-iron-target-preset">Быстрый выбор целевого Hb</label>
                <select id="fc-calc-ganzoni-iron-target-preset" name="targetPreset">
                  <option value="none" selected>Не выбрано</option>
                  <option value="adult13" data-preset-gdl="13">Взрослый 130 г/л (консервативно)</option>
                  <option value="classic15" data-preset-gdl="15">Классический 150 г/л (исторически)</option>
                  <option value="ckd115" data-preset-gdl="11.5">ХБП ≈ 115 г/л</option>
                </select>
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Запас и препарат</h3>

              <div class="fc-calc__field">
                <label for="fc-calc-ganzoni-iron-store-mode">Запас железа (добавка)</label>
                <select id="fc-calc-ganzoni-iron-store-mode" name="storeMode">
                  <option value="auto" selected>Авто: ≥35 кг → +500 мг; &lt;35 кг → +15 мг/кг</option>
                  <option value="fixed500">+500 мг</option>
                  <option value="perKg15">+15 мг/кг</option>
                  <option value="custom">Пользовательский (мг)</option>
                  <option value="none">Нет</option>
                </select>
              </div>

              <div class="fc-calc__field" id="fc-calc-ganzoni-iron-custom-store-wrap" hidden>
                <label for="fc-calc-ganzoni-iron-custom-store">Пользовательский запас, мг</label>
                <input
                  type="number"
                  id="fc-calc-ganzoni-iron-custom-store"
                  name="customStoreMg"
                  inputmode="decimal"
                  min="0"
                  step="any"
                  placeholder="напр. 500"
                />
              </div>

              <div class="fc-calc__field">
                <label for="fc-calc-ganzoni-iron-drug">Препарат железа в/в (для планирования сеансов)</label>
                <select id="fc-calc-ganzoni-iron-drug" name="drug">
                  <option value="none" selected>Не выбран</option>
                  <option value="fcm">Железа карбоксимальтозат (Ferinject®)</option>
                  <option value="isomaltoside">Железа изомальтозид (Monofer®)</option>
                </select>
              </div>
            </div>
          </div>

          <p class="fc-calc__error" id="fc-calc-ganzoni-iron-form-error" role="alert"></p>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" class="fc-calc__btn" form="fc-calc-ganzoni-iron-form">Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-ganzoni-iron-result" aria-live="polite">
        <p class="fc-calc__result-label">Результат</p>
        <p class="fc-calc__result-number" id="fc-calc-ganzoni-iron-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-ganzoni-iron-result-desc"></p>
        <div class="fc-calc__ganzoni-meta" id="fc-calc-ganzoni-iron-result-meta"></div>
        <div class="fc-calc__ganzoni-sessions" id="fc-calc-ganzoni-iron-result-sessions" hidden></div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body" id="fc-calc-ganzoni-iron-notes">
        <p><strong>Формула Ганзони:</strong> дефицит железа (мг) = масса (кг) × [Hb цель − Hb текущ.] × коэффициент + запас железа.</p>
        <p>• Коэффициент 2,4 при Hb в г/дл; 0,24 при Hb в г/л. Компонент дозы на ΔHb округляется до 10 мг.</p>
        <p>• Если ΔHb &lt; 0, её принимают равной 0 (отрицательной дозы нет).</p>
        <p>• Авто-запас: ≥35 кг → +500 мг; &lt;35 кг → +15 мг/кг.</p>
        <p>• Планирование сеансов информативное: Ferinject® — до 1000 мг/сеанс; Monofer® — до 20 мг/кг за сеанс. Следуйте инструкции препарата и локальным протоколам.</p>
        <p><strong>Источники:</strong></p>
        <p>1. Ganzoni AM. [Intravenous iron-dextran: therapeutic and experimental possibilities]. <em>Schweiz Med Wochenschr.</em> 1970;100(7):301-3.</p>
        <p>2. Koch TA, Myers J, Goodnough LT. Intravenous Iron Therapy in Patients with Iron Deficiency Anemia: Dosing Considerations. <em>Anemia.</em> 2015;2015:763576.</p>
      </div>
    </details>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${script}
  </script>
</div>
`;

await writeFile(join(calcDir, 'index.html'), html, 'utf8');
console.log('Built calculators/ganzoni-iron/index.html and widget.js');
