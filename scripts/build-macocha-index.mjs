#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITERIA } from '../calculators/macocha/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function renderToggles() {
  return CRITERIA.map(
    (c) => `                <label class="fc-calc__macocha-row" for="fc-calc-maco-cha-${c.id}">
                  <span class="fc-calc__macocha-label">${c.label}</span>
                  <span class="fc-calc__macocha-toggle">
                    <input type="checkbox" id="fc-calc-maco-cha-${c.id}" name="${c.id}" value="1" />
                    <span class="fc-calc__macocha-slider" aria-hidden="true"></span>
                  </span>
                </label>`
  ).join('\n');
}

const [css, extra, widget] = await Promise.all([
  readFile(join(root, 'shared', 'fc-calc.css'), 'utf8'),
  readFile(join(root, 'calculators', 'macocha', 'extra.css'), 'utf8'),
  readFile(join(root, 'calculators', 'macocha', 'widget.js'), 'utf8'),
]);

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Шкала MACOCHA
-->
<div class="fc-calc" data-calculator="macocha">
  <style>
${css.trim()}
${extra.trim()}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Шкала MACOCHA</h2>
        <p class="fc-calc__hint">Прогностическая шкала риска сложной интубации трахеи у тяжёлых больных в отделении реанимации</p>
      </header>

      <div class="fc-calc__body">
        <form class="fc-calc__form" id="fc-calc-maco-cha-form" novalidate>
          <div class="fc-calc__panel-section">
            <div class="fc-calc__panel">
              <h3 class="fc-calc__panel-heading">Критерии</h3>
              <div class="fc-calc__macocha-options" role="group" aria-label="Критерии шкалы MACOCHA">
${renderToggles()}
              </div>
              <div class="fc-calc__macocha-guide" aria-label="Интерпретация результатов">
                <p class="fc-calc__macocha-guide-title">интерпретация результатов:</p>
                <p><strong>0 баллов</strong> – легкая интубация</p>
                <p><strong>12 баллов</strong> – очень сложная интубация</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="fc-calc__actions">
        <button type="submit" id="fc-calc-maco-cha-btn" class="fc-calc__btn" form="fc-calc-maco-cha-form">Рассчитать</button>
      </div>

      <div class="fc-calc__result-wrap fc-calc__result-wrap--hidden" id="fc-calc-maco-cha-result" aria-live="polite">
        <p class="fc-calc__result-label">MACOCHA</p>
        <p class="fc-calc__result-number" id="fc-calc-maco-cha-result-number">—</p>
        <p class="fc-calc__result-desc" id="fc-calc-maco-cha-result-desc"></p>
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <p>Шкала MACOCHA (англ. MACOCHA score) — прогностическая шкала интубации трахеи у тяжёлых больных в отделении реанимации. Предложена в 2013 году Одри Де Йонг (Audrey De Jong, Франция) для снижения частоты опасных осложнений после сложной интубации. Система подсчёта баллов — от 0 до 12.</p>
        <p><strong>Аббревиатура MACOCHA:</strong></p>
        <ul>
          <li><strong>М</strong> — Mallampati III–IV (шкала Маллампати III–IV), 5 баллов</li>
          <li><strong>A</strong> — Apnoea syndrome (синдром апноэ), 2 балла</li>
          <li><strong>C</strong> — Cervical spine limitation (ограничение подвижности шейного отдела позвоночника), 1 балл</li>
          <li><strong>O</strong> — Opening mouth &lt; 3 см (открытие рта менее 3 см), 1 балл</li>
          <li><strong>C</strong> — Coma (кома), 1 балл</li>
          <li><strong>H</strong> — Hypoxia (гипоксия, SpO₂ &lt; 80%), 1 балл</li>
          <li><strong>A</strong> — Anaesthesiologist non trained (неподготовленный анестезиолог), 1 балл</li>
        </ul>
        <p>Обеспечение проходимости дыхательных путей — одна из важных манипуляций в отделении интенсивной терапии. По данным De Jong, частота трудной интубации трахеи составляет в среднем 10% (1–23%). Шкала MACOCHA позволяет идентифицировать пациентов с риском трудной интубации; оценка по Маллампати — наиболее значимый показатель.</p>
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

await writeFile(join(root, 'calculators', 'macocha', 'index.html'), html, 'utf8');
console.log('Built calculators/macocha/index.html');

