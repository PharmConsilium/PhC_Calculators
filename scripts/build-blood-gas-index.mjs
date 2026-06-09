#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'blood-gas', 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', 'blood-gas', 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Интерпретация КЩС и газового состава крови
-->
<div class="fc-calc" data-calculator="blood-gas">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Интерпретация КЩС и газового состава крови</h2>
        <p class="fc-calc__hint">Два калькулятора индекса оксигенации: PaO₂/FiO₂ и (FiO₂ × Pmean) / PaO₂</p>
        <p class="fc-calc__formula"><strong>PaO₂/FiO₂</strong> &nbsp;|&nbsp; <strong>OI</strong> = (FiO₂ × Pmean) / PaO₂</p>
      </header>

      <div class="fc-calc__body">
        <section class="fc-calc__bg-block">
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Калькулятор индекса оксигенации № 1</h3>
              <form class="fc-calc__form" id="fc-calc-blood-gas-o2-form" novalidate>
                <div class="fc-calc__bg-o2-grid">
                  <div class="fc-calc__field">
                    <label for="fc-calc-blood-gas-pao2">PaO₂, мм рт. ст.</label>
                    <input type="number" id="fc-calc-blood-gas-pao2" name="pao2" inputmode="decimal" min="0" max="250" step="any" placeholder="0–250" required />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-blood-gas-fio2">FiO₂, %</label>
                    <input type="number" id="fc-calc-blood-gas-fio2" name="fio2" inputmode="decimal" min="21" max="100" step="any" placeholder="21–100" required />
                  </div>
                </div>
                <p class="fc-calc__bg-field-hint">PaO₂ — парциальное напряжение кислорода; FiO₂ — концентрация кислорода на вдохе.</p>
                <span class="fc-calc__error" id="fc-calc-blood-gas-o2-error" role="alert"></span>
              </form>
              <div class="fc-calc__bg-block-actions">
                <button type="submit" id="fc-calc-blood-gas-o2-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-blood-gas-o2-form" disabled>Рассчитать</button>
              </div>
              <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden fc-calc__bg-o2-result" id="fc-calc-blood-gas-o2-result" aria-live="polite">
                <p class="fc-calc__result-label">Индекс оксигенации</p>
                <p class="fc-calc__result-number" id="fc-calc-blood-gas-o2-result-number">—</p>
                <p class="fc-calc__result-desc" id="fc-calc-blood-gas-o2-result-desc"></p>
                <p class="fc-calc__bg-o2-detail" id="fc-calc-blood-gas-o2-result-detail"></p>
              </div>
            </div>
          </div>
        </section>

        <section class="fc-calc__bg-block">
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Калькулятор индекса оксигенации № 2</h3>
              <form class="fc-calc__form" id="fc-calc-blood-gas-oi2-form" novalidate>
                <div class="fc-calc__bg-oi2-grid">
                  <div class="fc-calc__field">
                    <label for="fc-calc-blood-gas-oi2-fio2">FiO₂, %</label>
                    <input type="number" id="fc-calc-blood-gas-oi2-fio2" name="fio2" inputmode="decimal" min="21" max="100" step="any" placeholder="21–100" required />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-blood-gas-oi2-pmean">Pmean, мм вод. ст.</label>
                    <input type="number" id="fc-calc-blood-gas-oi2-pmean" name="pmean" inputmode="decimal" min="0" max="50" step="any" placeholder="0–50" required />
                  </div>
                  <div class="fc-calc__field">
                    <label for="fc-calc-blood-gas-oi2-pao2">PaO₂, мм рт. ст.</label>
                    <input type="number" id="fc-calc-blood-gas-oi2-pao2" name="pao2" inputmode="decimal" min="0" max="250" step="any" placeholder="0–250" required />
                  </div>
                </div>
                <p class="fc-calc__bg-field-hint"><strong>OI</strong> = (FiO₂ × Pmean) / PaO₂</p>
                <span class="fc-calc__error" id="fc-calc-blood-gas-oi2-error" role="alert"></span>
              </form>
              <div class="fc-calc__bg-block-actions">
                <button type="submit" id="fc-calc-blood-gas-oi2-btn" class="fc-calc__btn fc-calc__btn--inactive" form="fc-calc-blood-gas-oi2-form" disabled>Рассчитать</button>
              </div>
              <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden fc-calc__bg-oi2-result" id="fc-calc-blood-gas-oi2-result" aria-live="polite">
                <p class="fc-calc__result-label">Индекс оксигенации</p>
                <p class="fc-calc__result-number" id="fc-calc-blood-gas-oi2-result-number">—</p>
                <p class="fc-calc__result-desc" id="fc-calc-blood-gas-oi2-result-desc"></p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p><strong>Индекс оксигенации</strong> (респираторный индекс, PaO₂/FiO₂) — соотношение парциального напряжения кислорода в артериальной крови к фракции кислорода на вдохе. В норме на воздухе ≈ 500 (PaO₂ 100 мм рт. ст. / FiO₂ 21%).</p>
        <ul>
          <li>Индекс оксигенации &lt; 300 — острое повреждение легких (ОПЛ).</li>
          <li>Индекс оксигенации &lt; 200 — острый респираторный дистресс-синдром (ОРДС).</li>
        </ul>
        <div class="fc-calc__table-wrap">
          <table class="fc-calc__table">
            <thead>
              <tr>
                <th>Степень тяжести ОРДС</th>
                <th>Индекс оксигенации</th>
                <th>Летальность</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>легкая</td><td>200–300</td><td>27%</td></tr>
              <tr><td>средняя</td><td>100–200</td><td>32%</td></tr>
              <tr><td>тяжелая</td><td>&lt; 100</td><td>45%</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>Калькулятор № 2:</strong> OI = (FiO₂ × Pmean) / PaO₂, где FiO₂ — концентрация кислорода во вдыхаемой смеси (%), Pmean — среднее давление в дыхательных путях (мм вод. ст.), PaO₂ — парциальное давление кислорода в артериальной крови (мм рт. ст.).</p>
        <p><strong>Интерпретация результата:</strong></p>
        <ul>
          <li>индекс оксигенации 0–25 — вариант нормы;</li>
          <li>индекс оксигенации 25–40 — летальный исход более 40%;</li>
          <li>индекс оксигенации &gt; 40 — экстракорпоральная мембранная оксигенация.</li>
        </ul>
        <p><strong>Источники:</strong></p>
        <ol>
          <li>Marshall JC, Cook DJ, Christou NV, et al. Multiple organ dysfunction score: a reliable descriptor of a complex clinical outcome. <em>Crit Care Med.</em> 1995 Oct;23(10):1638-52. PMID: 7587228.</li>
          <li>Ortiz RM, Cilley RE, Bartlett RH. Extracorporeal membrane oxygenation in pediatric respiratory failure. <em>Pediatr Clin North Am.</em> 1987 Feb;34(1):39-46.</li>
          <li>Власенко А.В., Мороз В.В., Яковлев В.Н., Алексеев В.Г. Информативность индекса оксигенации при диагностике острого респираторного дистресс-синдрома. <em>Общая реаниматология</em>, 2009; 5(5): 54–62.</li>
          <li>Karbing DS, Kjaergaard S, Smith BW, Espersen K, Allerød C, Andreassen S, Rees SE. Variation in the PaO2/FiO2 ratio with FiO2: mathematical and experimental description, and clinical relevance. <em>Crit Care.</em> 2007;11(6):R118.</li>
          <li>Whiteley JP, Gavaghan DJ, Hahn CE. Variation of venous admixture, SF6 shunt, PaO2, and the PaO2/FIO2 ratio with FIO2. <em>Br J Anaesth.</em> 2002 Jun;88(6):771-8.</li>
          <li>Bilan N., Dastranji A., Ghalehgolab Behbahani A. Comparison of the spo2/fio2 ratio and the pao2/fio2 ratio in patients with acute lung injury or acute respiratory distress syndrome. <em>J Cardiovasc Thorac Res.</em> 2015;7(1):28-31.</li>
          <li>Hsu-Ching Kao, Ting-Yu Lai, Heui-Ling Hung. Sequential Oxygenation Index and Organ Dysfunction Assessment within the First 3 Days of Mechanical Ventilation Predict the Outcome of Adult Patients with Severe Acute Respiratory Failure. <em>ScientificWorldJournal</em>, 2013.</li>
        </ol>
        <p class="fc-calc__hint">Справочно. Не заменяет осмотр врача.</p>
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

await writeFile(join(root, 'calculators', 'blood-gas', 'index.html'), html, 'utf8');
console.log('Built calculators/blood-gas/index.html');
