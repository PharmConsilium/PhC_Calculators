#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LPA_CORRECTION_FACTOR, LPA_DIVISOR } from '../calculators/ldl-lpa-corr/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'ldl-lpa-corr', 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', 'ldl-lpa-corr', 'widget.js'), 'utf8'),
]);

function renderField(id, label, placeholder) {
  return `              <div class="fc-calc__noa-field">
                <label class="fc-calc__noa-field-label" for="fc-calc-ldl-lpa-corr-${id}">${label}</label>
                <input type="number" class="fc-calc__noa-field-input" id="fc-calc-ldl-lpa-corr-${id}" name="${id}" inputmode="decimal" min="0" step="any" placeholder="${placeholder}" required />
              </div>`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчёт корригированного ХС ЛНП с учётом липопротеида(а)
-->
<div class="fc-calc" data-calculator="ldl-lpa-corr">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Корригированный ХС ЛНП с учётом липопротеида(а)</h2>
        <p class="fc-calc__hint">Расчёт ХС ЛНП<sub>корр</sub> Лп(а) по модифицированной формуле Фридвальда (NOA)</p>
        <p class="fc-calc__formula"><strong>ХС ЛНП<sub>корр</sub> Лп(а)</strong> = ХС ЛНП − ${String(LPA_CORRECTION_FACTOR).replace('.', ',')} × Лп(а) / ${String(LPA_DIVISOR).replace('.', ',')}</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-ldl-lpa-corr-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel fc-calc__noa-panel">
              <h3 class="fc-calc__panel-heading">Введите данные:</h3>
${renderField('ldl', 'ХС ЛНП', 'ммоль/л')}
${renderField('lpa', 'Липопротеид(а)', 'мг/дл')}
            </div>
          </div>

          <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-ldl-lpa-corr-result" aria-live="polite">
            <div class="fc-calc__panel fc-calc__noa-panel">
              <h3 class="fc-calc__panel-heading">Результат:</h3>
              <div class="fc-calc__noa-ldl">
                <p class="fc-calc__noa-ldl-title">ХС ЛНП<sub>корр</sub></p>
                <div class="fc-calc__noa-ldl-value-row">
                  <span class="fc-calc__noa-ldl-value" id="fc-calc-ldl-lpa-corr-value">—</span>
                  <span class="fc-calc__noa-ldl-unit">ммоль/л</span>
                </div>
              </div>
            </div>
          </div>

          <span class="fc-calc__error" id="fc-calc-ldl-lpa-corr-form-error" role="alert"></span>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-ldl-lpa-corr-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-ldl-lpa-corr-form" disabled>Рассчитать</button>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Концентрация корригированного ХС ЛНП по уровню липопротеида(а) [ХС ЛНП<sub>корр</sub> Лп(а)] учитывает холестерин, входящий в состав липопротеида(а).</p>
        <p>Рассчитывается ХС ЛНП<sub>корр</sub> Лп(а) по модифицированной формуле Фридвальда:</p>
        <p><strong>ХС ЛНП<sub>корр</sub> Лп(а)</strong> (ммоль/л) = ХС ЛНП − ${String(LPA_CORRECTION_FACTOR).replace('.', ',')} × Лп(а) (мг/дл) / ${String(LPA_DIVISOR).replace('.', ',')}</p>
        <p>ХС ЛНП вводится в ммоль/л, липопротеид(а) — в мг/дл. Результат — в ммоль/л (точность до 2 знаков после запятой, без округления в большую сторону).</p>
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
${widget.trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', 'ldl-lpa-corr', 'index.html'), html, 'utf8');
console.log('Built calculators/ldl-lpa-corr/index.html');
