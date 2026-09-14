#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AGE_MIN, AGE_MAX, SBP_MIN, SBP_MAX } from '../calculators/score2/calc.js';
import {
  CHART,
  AGE_BANDS,
  SBP_BANDS,
  NON_HDL_BANDS,
} from '../calculators/score2/chart-data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'score2';
const chartsDir = join(root, 'calculators', slug, 'charts');

const [css, extra, widget, chartFull] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', slug, 'widget.js'), 'utf8'),
  readFile(join(chartsDir, 'score2-full-ru.png')),
]);

const chartPayload = JSON.stringify({
  chart: CHART,
  ageBands: AGE_BANDS,
  sbpBands: SBP_BANDS,
  cholBands: NON_HDL_BANDS,
});

function imgSrc(buf) {
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: SCORE2 / SCORE2-OP
-->
<div class="fc-calc" data-calculator="${slug}">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">SCORE2 / SCORE2-OP</h2>
        <p class="fc-calc__hint">10-летний риск по таблицам SCORE2 / SCORE2-OP (регион очень высокого риска)</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-${slug}-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Основные показатели</h3>
              <div class="fc-calc__score2-grid">
                <div class="fc-calc__field fc-calc__score2-full">
                  <label>Пол</label>
                  <div class="fc-calc__segmented" data-sex-group role="group" aria-label="Пол">
                    <button type="button" class="fc-calc__segment fc-calc__segment--active" data-sex="male">Мужской</button>
                    <button type="button" class="fc-calc__segment" data-sex="female">Женский</button>
                  </div>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-age">Возраст, лет</label>
                  <input type="number" id="fc-calc-${slug}-age" name="age" inputmode="numeric" min="${AGE_MIN}" max="${AGE_MAX}" step="1" placeholder="напр. 55" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-age-error" role="alert"></span>
                </div>

                <div class="fc-calc__field">
                  <label for="fc-calc-${slug}-sbp">САД, мм рт.ст.</label>
                  <input type="number" id="fc-calc-${slug}-sbp" name="sbp" inputmode="numeric" min="${SBP_MIN}" max="${SBP_MAX}" step="1" placeholder="напр. 130" required />
                  <span class="fc-calc__error" id="fc-calc-${slug}-sbp-error" role="alert"></span>
                </div>

                <div class="fc-calc__field fc-calc__score2-full">
                  <label>ХС не-ЛПВП</label>
                  <div class="fc-calc__segmented" data-nonhdl-mode-group role="group" aria-label="Способ указания ХС не-ЛПВП">
                    <button type="button" class="fc-calc__segment fc-calc__segment--active" data-nonhdl-mode="calc">Рассчитать</button>
                    <button type="button" class="fc-calc__segment" data-nonhdl-mode="direct">Известен</button>
                  </div>
                </div>

                <div class="fc-calc__score2-nonhdl-calc" data-nonhdl-panel="calc">
                  <div class="fc-calc__field">
                    <label for="fc-calc-${slug}-tc">Общий холестерин, ммоль/л</label>
                    <input type="number" id="fc-calc-${slug}-tc" name="totalChol" inputmode="decimal" min="0" step="any" placeholder="напр. 5,0" />
                    <span class="fc-calc__error" id="fc-calc-${slug}-tc-error" role="alert"></span>
                  </div>

                  <div class="fc-calc__field">
                    <label for="fc-calc-${slug}-hdl">ХС ЛПВП, ммоль/л</label>
                    <input type="number" id="fc-calc-${slug}-hdl" name="hdl" inputmode="decimal" min="0" step="any" placeholder="напр. 1,3" />
                    <span class="fc-calc__error" id="fc-calc-${slug}-hdl-error" role="alert"></span>
                  </div>

                  <div class="fc-calc__field fc-calc__score2-full">
                    <label>ХС не-ЛПВП (ОХС − ЛПВП)</label>
                    <p class="fc-calc__score2-preview" id="fc-calc-${slug}-nonhdl-preview" aria-live="polite">—</p>
                  </div>
                </div>

                <div class="fc-calc__field fc-calc__score2-full fc-calc__score2-nonhdl-direct" data-nonhdl-panel="direct" hidden>
                  <label for="fc-calc-${slug}-nonhdl">ХС не-ЛПВП, ммоль/л</label>
                  <input type="number" id="fc-calc-${slug}-nonhdl" name="nonHdl" inputmode="decimal" min="0" step="any" placeholder="напр. 4,0" />
                  <span class="fc-calc__error" id="fc-calc-${slug}-nonhdl-error" role="alert"></span>
                </div>
              </div>
            </div>
          </div>

          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Факторы риска</h3>
              <div class="fc-calc__field">
                <label>Курение</label>
                <div class="fc-calc__segmented" data-smoke-group role="group" aria-label="Курение">
                  <button type="button" class="fc-calc__segment fc-calc__segment--active" data-smoke="no">Нет</button>
                  <button type="button" class="fc-calc__segment" data-smoke="yes">Да</button>
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
        <p class="fc-calc__result-label">10-летний риск</p>
        <p class="fc-calc__result-number" id="fc-calc-${slug}-result-number">—</p>
        <p class="fc-calc__score2-result-meta" id="fc-calc-${slug}-result-model"></p>
        <p class="fc-calc__score2-result-category" id="fc-calc-${slug}-result-category"></p>
        <div class="fc-calc__score2-block" id="fc-calc-${slug}-result-chart" hidden></div>
        <div class="fc-calc__score2-block" id="fc-calc-${slug}-result-targets"></div>
        <div class="fc-calc__score2-block" id="fc-calc-${slug}-result-strategy" hidden>
          <p class="fc-calc__score2-block-title">Стратегия вмешательства</p>
          <div class="fc-calc__field fc-calc__score2-strategy-ldl">
            <label for="fc-calc-${slug}-ldl">ХС ЛПНП, ммоль/л <span class="fc-calc__score2-field-hint">(без лечения)</span></label>
            <input type="number" id="fc-calc-${slug}-ldl" name="ldl" inputmode="decimal" min="0" step="any" placeholder="напр. 3,2" form="fc-calc-${slug}-form" />
            <span class="fc-calc__error" id="fc-calc-${slug}-ldl-error" role="alert"></span>
          </div>
          <div id="fc-calc-${slug}-result-strategy-out"></div>
        </div>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p class="fc-calc__score2-notes-table-title">Таблицы SCORE2 / SCORE2-OP (популяция очень высокого риска)</p>
        <figure class="fc-calc__score2-chart-figure">
          <figcaption>SCORE2 (40–69) и SCORE2-OP (70–89), женщины и мужчины</figcaption>
          <button type="button" class="fc-calc__score2-chart-open" id="fc-calc-${slug}-chart-open" aria-label="Открыть таблицу SCORE2 / SCORE2-OP">
            <img src="${imgSrc(chartFull)}" alt="Полная таблица SCORE2 и SCORE2-OP на русском, регион очень высокого риска" loading="lazy" />
          </button>
        </figure>

        <p>Риск рассчитывается <strong>по цветовым таблицам SCORE2 / SCORE2-OP</strong> для популяции очень высокого риска (Беларусь), как в методических рекомендациях МЗ РБ. При значениях у границы диапазонов показываются соседние ячейки («между X% и Y%»); для категории риска берётся большее значение.</p>
        <p>SCORE2 — таблица для 40–69 лет; SCORE2-OP — для 70–89 лет (ESC, регион very high). Если САД или не-ЛПВП выходят за напечатанные границы таблицы, берётся ближайшая крайняя ячейка.</p>
        <p>Не применяется у пациентов с уже установленными сердечно-сосудистыми заболеваниями, сахарным диабетом 1 типа или терминальной стадией ХБП — они относятся к группе очень высокого риска без расчёта по SCORE2.</p>

        <p>Всем пациентам с дислипидемией и наличием высокого и очень высокого сердечно-сосудистого риска рекомендована терапия статином в дозах, необходимых для достижения целевого уровня ХС-ЛПНП.</p>
        <p>Пациентам, не достигшим целевого уровня ХС-ЛПНП на фоне максимально переносимых доз статинов, рекомендовано рассмотреть возможность комбинированной терапии, например, статин с эзетимибом или статин с бемпедоевой кислотой или статин с эзетимибом и бемпедоевой кислотой. У пациентов с очень высоким риском и недостижением целевого уровня ХС-ЛПНП на фоне максимально переносимых доз статина в комбинации с эзетимибом и/или бемпедоевой кислотой рекомендовано добавить ингибиторы PCSK9 / инклисиран. У пациентов с очень высоким и экстремальным риском, получающих терапию статином в максимально переносимой дозе с недостижением целевого уровня ХС-ЛПНП, рекомендована комбинированная терапия с тем или иным нестатиновым препаратом (эзетимибом, бемпедоевой кислотой и/или ингибитором PCSK9 или инклисиран).</p>
        <p><strong>МОЖ</strong> — модификация образа жизни; <strong>ЛП</strong> — липидснижающая терапия.</p>

        <p class="fc-calc__score2-notes-table-title">Рекомендации по целевым значениям липидных параметров в зависимости от категории ССР</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Параметр</th>
                <th>Низкий риск</th>
                <th>Умеренный риск</th>
                <th>Высокий риск</th>
                <th>Очень высокий риск</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ХС-ЛПНП, ммоль/л</td>
                <td>&lt; 3,0</td>
                <td>&lt; 2,6</td>
                <td>&lt; 1,8*</td>
                <td>&lt; 1,4*</td>
              </tr>
              <tr>
                <td>ХС-неЛВП, ммоль/л</td>
                <td>&lt; 3,8</td>
                <td>&lt; 3,4</td>
                <td>&lt; 2,6</td>
                <td>&lt; 2,2</td>
              </tr>
              <tr>
                <td>ХС-ЛПВП, ммоль/л</td>
                <td colspan="4">мужчины: 1,0–2,0; женщины: 1,2–2,2</td>
              </tr>
              <tr>
                <td>ТГ, ммоль/л</td>
                <td colspan="4">&lt; 1,7</td>
              </tr>
              <tr>
                <td>Лп(а), мг/дл (нмоль/л)</td>
                <td colspan="2">&lt; 50 (105)</td>
                <td colspan="2">&lt; 30 (62)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="fc-calc__score2-legend">* и снижение ХС ЛНП на 50% и более от исходного уровня. Лп(а) — липопротеин(а).</p>

        <p class="fc-calc__score2-notes-table-title">Стратегии вмешательства в зависимости от общего ССР и уровня ХС ЛПНП без лечения</p>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Общий ССР \\ ХС ЛПНП</th>
                <th>&lt; 1,4</th>
                <th>1,4 – &lt; 1,8</th>
                <th>1,8 – &lt; 2,6</th>
                <th>2,6 – &lt; 3,0</th>
                <th>3,0 – &lt; 4,9</th>
                <th>≥ 4,9</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Низкий</td>
                <td>МОЖ</td>
                <td>МОЖ</td>
                <td>МОЖ</td>
                <td>МОЖ</td>
                <td>МОЖ, возможно ЛП</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Умеренный</td>
                <td>МОЖ</td>
                <td>МОЖ</td>
                <td>МОЖ</td>
                <td>МОЖ, возможно ЛП</td>
                <td>МОЖ, возможно ЛП</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Высокий</td>
                <td>МОЖ</td>
                <td>МОЖ</td>
                <td>МОЖ, возможно ЛП</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Очень высокий, первичная профилактика</td>
                <td>МОЖ, возможно ЛП</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Очень высокий, вторичная профилактика</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="fc-calc__score2-legend">Для высокого и очень высокого риска ячейки с «—» означают немедленное начало липидснижающей терапии вместе с МОЖ. В столбце ≥ 4,9 для низкого и умеренного риска отдельная рекомендация в исходной таблице не указана. SCORE2 относится к первичной профилактике.</p>

        <p><strong>Расшифровка сокращений:</strong></p>
        <ul class="fc-calc__score2-abbr-list">
          <li><strong>МОЖ</strong> — модификация образа жизни</li>
          <li><strong>ЛП</strong> — липидснижающая терапия</li>
          <li><strong>ССР</strong> — сердечно-сосудистый риск</li>
          <li><strong>ХС ЛПНП</strong> — холестерин липопротеинов низкой плотности</li>
        </ul>

        <p>Результат носит справочный характер и требует оценки врачом в контексте полной клинической картины.</p>
        <p><strong>Источники:</strong></p>
        <ul>
          <li>Методические рекомендации профилактического консультирования по коррекции факторов риска хронических неинфекционных заболеваний для врачей-специалистов МЗ РБ № 1048 от 09.09.2026</li>
          <li>ESC CVD Prevention Toolbox — SCORE2 and SCORE2-OP: <a href="https://www.escardio.org/guidelines/practice-tools/cvd-prevention-toolbox/score-risk-charts/" target="_blank" rel="noopener noreferrer">escardio.org/…/score-risk-charts</a></li>
        </ul>
      </div>
    </details>

  </div>

  <div class="fc-calc__score2-lightbox" id="fc-calc-${slug}-lightbox" hidden>
    <div class="fc-calc__score2-lightbox-backdrop" data-lightbox-close></div>
    <div class="fc-calc__score2-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Таблица SCORE2 / SCORE2-OP">
      <button type="button" class="fc-calc__score2-lightbox-close" data-lightbox-close aria-label="Закрыть">×</button>
      <img class="fc-calc__score2-lightbox-img" id="fc-calc-${slug}-lightbox-img" alt="Полная таблица SCORE2 и SCORE2-OP" />
    </div>
  </div>

  <script>
window.FC_SCORE2_CHART = ${chartPayload};
${widget.trim()}
  </script>
</div>
`;

await writeFile(join(root, 'calculators', slug, 'index.html'), html, 'utf8');
console.log(`Wrote calculators/${slug}/index.html`);
