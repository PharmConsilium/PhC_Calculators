#!/usr/bin/env node
/**
 * Мульти-калькулятор ХС ЛНП: вкладки поверх martin-ldl и ldl-lpa-corr.
 * Отдельные папки не меняются.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'calculators', 'ldl-calc');
const SLUG = 'ldl-calc';

const MODES = [
  {
    id: 'martin-ldl',
    tab: 'Формулы расчёта ХС ЛНП: Мартина-Хопкинса, Сэмпсона, Фридвальда',
    hint: 'Формулы Мартина-Хопкинса, Сэмпсона, Фридвальда и атерогенный индекс плазмы (AIP)',
  },
  {
    id: 'ldl-lpa-corr',
    tab: 'Расчёт корригированного ХС ЛНП, с учётом холестерина в составе липопротеида(а)',
    hint: 'Корригированный ХС ЛНП с учётом холестерина в составе липопротеида(а)',
  },
];

function extractNotesBody(html) {
  const startRe = /<div class="fc-calc__notes-body"[^>]*>/i;
  const start = html.search(startRe);
  if (start < 0) return '';
  const openEnd = html.indexOf('>', start) + 1;
  let depth = 1;
  for (let i = openEnd; i < html.length; i++) {
    if (html.startsWith('<div', i)) {
      depth++;
      i += 3;
    } else if (html.startsWith('</div>', i)) {
      depth--;
      if (depth === 0) return html.slice(openEnd, i).trim();
      i += 5;
    }
  }
  return '';
}

function extractFormBlock(html, slug) {
  const formRe = new RegExp(
    `<form[^>]*id="fc-calc-${slug}-form"[^>]*>[\\s\\S]*?<\\/form>`,
    'i'
  );
  const form = html.match(formRe)?.[0] || '';

  const btnRe = new RegExp(
    `<div class="fc-calc__actions">[\\s\\S]*?form="fc-calc-${slug}-form"[\\s\\S]*?<\\/div>`,
    'i'
  );
  const actions = html.match(btnRe)?.[0] || '';

  let result = '';
  const idToken = `id="fc-calc-${slug}-result"`;
  if (!form.includes(idToken)) {
    const idPos = html.indexOf(idToken);
    if (idPos >= 0) {
      let wrapStart = html.lastIndexOf('<div', idPos);
      const wrapCandidate = html.lastIndexOf('fc-calc__result-wrap', idPos);
      if (wrapCandidate >= 0 && idPos - wrapCandidate < 200) {
        wrapStart = html.lastIndexOf('<div', wrapCandidate);
      }
      let depth = 0;
      for (let i = wrapStart; i < html.length; i++) {
        if (html.startsWith('<div', i)) {
          depth++;
          i += 3;
        } else if (html.startsWith('</div>', i)) {
          depth--;
          i += 5;
          if (depth === 0) {
            result = html.slice(wrapStart, i + 1);
            break;
          }
        }
      }
    }
  }

  return { form, actions, result };
}

function extractScript(html) {
  const m =
    html.match(/<script>([\s\S]*?)<\/script>\s*<\/div>\s*$/i) ||
    html.match(/<script>([\s\S]*?)<\/script>/i);
  return m ? m[1].trim() : '';
}

function patchWidgetRoot(script, slug) {
  return script.replace(
    new RegExp(
      `document\\.querySelector\\(['"]\\.fc-calc\\[data-calculator="${slug}"\\]['"]\\)`,
      'g'
    ),
    `document.querySelector('[data-mode-panel="${slug}"]') || document.querySelector('.fc-calc[data-calculator="${slug}"]')`
  );
}

function rewriteExtraCss(css, slug) {
  return css.replaceAll(
    `[data-calculator="${slug}"]`,
    `[data-calculator="${SLUG}"] [data-mode-panel="${slug}"]`
  );
}

const sharedCss = await readFile(join(root, 'shared', 'fc-calc.css'), 'utf8');

const panels = [];
const notesPanels = [];
const extras = [];
const scripts = [];

for (const mode of MODES) {
  const dir = join(root, 'calculators', mode.id);
  const indexHtml = await readFile(join(dir, 'index.html'), 'utf8');
  let extraCss = '';
  try {
    extraCss = await readFile(join(dir, 'extra.css'), 'utf8');
  } catch {
    const styleMatch = indexHtml.match(/<style>([\s\S]*?)<\/style>/i);
    if (styleMatch) {
      const all = styleMatch[1];
      const needle = `.fc-calc[data-calculator="${mode.id}"]`;
      const idx = all.indexOf(needle);
      extraCss = idx >= 0 ? all.slice(idx) : '';
    }
  }

  const { form, actions, result } = extractFormBlock(indexHtml, mode.id);
  if (!form) {
    console.error(`Failed to extract form for ${mode.id}`);
    process.exit(1);
  }

  const notesBody = extractNotesBody(indexHtml);
  if (!notesBody) {
    console.error(`Failed to extract notes for ${mode.id}`);
    process.exit(1);
  }

  let widgetScript = '';
  try {
    widgetScript = await readFile(join(dir, 'widget.js'), 'utf8');
  } catch {
    widgetScript = extractScript(indexHtml);
  }
  widgetScript = patchWidgetRoot(widgetScript.trim(), mode.id);

  extras.push(rewriteExtraCss(extraCss.trim(), mode.id));

  panels.push(`          <div class="fc-calc__tab-panel${mode.id === MODES[0].id ? ' fc-calc__tab-panel--active' : ''}" data-mode-panel="${mode.id}"${mode.id === MODES[0].id ? '' : ' hidden'}>
${form}
${actions}
${result}
          </div>`);

  const notesActive = mode.id === MODES[0].id;
  notesPanels.push(`        <div class="fc-calc__ldl-notes-mode${notesActive ? ' fc-calc__ldl-notes-mode--active' : ''}" data-mode-notes="${mode.id}"${notesActive ? '' : ' hidden'}>
          <p class="fc-calc__ldl-notes-mode-title"><strong>${mode.tab}</strong> — ${mode.hint}</p>
${notesBody}
        </div>`);

  scripts.push(widgetScript);
}

const shellCss = `
.fc-calc[data-calculator="${SLUG}"] {
  min-width: 0;
  max-width: 100%;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__tabs {
  margin-top: 12px;
  justify-content: stretch;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__tab {
  flex: 1 1 100%;
  font-size: 13px;
  line-height: 1.3;
  padding: 10px 10px;
  text-align: left;
  white-space: normal;
}
@media (min-width: 640px) {
  .fc-calc[data-calculator="${SLUG}"] .fc-calc__tab {
    flex: 1 1 calc(50% - 4px);
    font-size: 14px;
  }
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__ldl-mode-hint {
  margin-top: 12px;
  margin-bottom: 0;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__tab-panel .fc-calc__actions {
  margin-top: 16px;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__notes-body p,
.fc-calc[data-calculator="${SLUG}"] .fc-calc__notes-body ul,
.fc-calc[data-calculator="${SLUG}"] .fc-calc__notes-body ol {
  text-align: left;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__notes-body ul {
  margin: 0 0 12px;
  padding-left: 1.4em;
  list-style: disc !important;
  list-style-position: outside !important;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__notes-body li {
  display: list-item !important;
  list-style: disc !important;
  margin: 0 0 6px;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__ldl-notes-common {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__ldl-links {
  margin: 8px 0 0;
  padding-left: 1.4em;
  text-align: left;
  list-style: disc !important;
  list-style-position: outside !important;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__ldl-links li {
  display: list-item !important;
  list-style: disc !important;
  margin-bottom: 6px;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__ldl-notes-mode-title {
  margin: 0 0 10px;
}
.fc-calc[data-calculator="${SLUG}"] .fc-calc__ldl-notes-mode[hidden] {
  display: none !important;
}
`;

const tabsHtml = MODES.map(
  (m, i) =>
    `          <button type="button" class="fc-calc__tab${i === 0 ? ' fc-calc__tab--active' : ''}" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" data-mode-tab="${m.id}">${m.tab}</button>`
).join('\n');

const hintsJson = JSON.stringify(
  Object.fromEntries(MODES.map((m) => [m.id, m.hint])),
  null,
  2
);

const routerScript = `
(function () {
  var root = document.querySelector('.fc-calc[data-calculator="${SLUG}"]');
  if (!root) return;
  var tabs = root.querySelectorAll('[data-mode-tab]');
  var panels = root.querySelectorAll('[data-mode-panel]');
  var notesPanels = root.querySelectorAll('[data-mode-notes]');
  var modeHint = root.querySelector('#fc-calc-${SLUG}-mode-hint');
  var HINTS = ${hintsJson};

  function setMode(mode) {
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-mode-tab') === mode;
      tab.classList.toggle('fc-calc__tab--active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(function (panel) {
      var on = panel.getAttribute('data-mode-panel') === mode;
      panel.classList.toggle('fc-calc__tab-panel--active', on);
      panel.hidden = !on;
    });
    notesPanels.forEach(function (panel) {
      var on = panel.getAttribute('data-mode-notes') === mode;
      panel.classList.toggle('fc-calc__ldl-notes-mode--active', on);
      panel.hidden = !on;
    });
    if (modeHint && HINTS[mode]) modeHint.textContent = HINTS[mode];
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.getAttribute('data-mode-tab'));
    });
  });

  setMode('${MODES[0].id}');
})();
`;

const links = MODES.map(
  (m) => `          <li><strong>${m.tab}</strong> — ${m.hint}.</li>`
).join('\n');

const html = `<!--
  Публикация: скопировать ВЕСЬ файл в админку FarmConsilium → «HTML-код (виджет, калькулятор)».
  Название: Расчёт ХС ЛНП
  Сборка: ${new Date().toISOString().slice(0, 10)}
  Отдельные калькуляторы сохранены: ${MODES.map((m) => m.id).join(', ')}
-->
<div class="fc-calc" data-calculator="${SLUG}">
  <style>
${sharedCss.trim()}
${shellCss.trim()}
${extras.filter(Boolean).join('\n\n')}
  </style>

  <div class="fc-calc__card">
    <div class="fc-calc__layout">
      <header class="fc-calc__head">
        <h2 class="fc-calc__title">Расчёт ХС ЛНП</h2>
        <p class="fc-calc__hint">Формулы Мартина-Хопкинса, Сэмпсона, Фридвальда и коррекция по липопротеиду(а) — в одном калькуляторе. Отдельные виджеты сохранены.</p>
        <div class="fc-calc__tabs" role="tablist" aria-label="Режим расчёта ХС ЛНП">
${tabsHtml}
        </div>
        <p class="fc-calc__hint fc-calc__ldl-mode-hint" id="fc-calc-${SLUG}-mode-hint">${MODES[0].hint}</p>
      </header>

      <div class="fc-calc__body">
${panels.join('\n')}
      </div>
    </div>

    <details class="fc-calc__notes">
      <summary class="fc-calc__notes-summary">
        <span class="fc-calc__notes-title">Примечание</span>
        <span class="fc-calc__notes-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fc-calc__notes-body">
        <div class="fc-calc__ldl-notes-common">
          <p><strong>Общее</strong></p>
          <p>Мульти-калькулятор объединяет расчёт ХС ЛНП по формулам и коррекцию с учётом липопротеида(а). Выберите вкладку и заполните поля. Ниже — примечание к активному режиму.</p>
          <ul class="fc-calc__ldl-links">
${links}
          </ul>
        </div>
${notesPanels.join('\n')}
      </div>
    </details>
  </div>

  <footer class="fc-calc__foot">
    <p class="fc-calc__disclaimer">
      Справочно-информационный характер. Не заменяет консультацию врача и не служит основанием для самостоятельного назначения лечения.
    </p>
  </footer>

  <script>
${scripts.join('\n\n')}
${routerScript.trim()}
  </script>
</div>
`;

const widgetJs = `${scripts.join('\n\n')}\n${routerScript.trim()}\n`;

await writeFile(join(outDir, 'widget.js'), widgetJs, 'utf8');
await writeFile(join(outDir, 'extra.css'), shellCss.trim() + '\n', 'utf8');
await writeFile(join(outDir, 'index.html'), html, 'utf8');

console.log(`Built calculators/${SLUG}/index.html and widget.js`);
console.log('Modes:', MODES.map((m) => m.id).join(', '));
