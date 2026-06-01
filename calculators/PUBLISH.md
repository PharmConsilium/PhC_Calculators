# Публикация на farmconsilium.com

## Админка

1. **Создать/изменить калькулятор**
2. **Название** — как в `meta.json` → `title` (URL создастся автоматически)
3. **Сортировка** — порядок в списке
4. **HTML-код** — вставить **весь файл** `calculators/<slug>/index.html` целиком (Ctrl+A → Ctrl+C)

Поле «HTML-код» заменяет старый uCalc: вставляется **только** фрагмент `<div class="fc-calc">…</div>`.

### Нельзя вставлять в админку

- `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>` — страница сайта уже есть
- Отдельный `<link href="fonts.googleapis.com…">` вне виджета — Montserrat уже в `@import` внутри `<style>` блока
- Стили/скрипты **Livewire** (`wire:loading`, `livewire.min.js`) — ломают страницу
- Корневой класс `.pharm-bmi-calc-wrapper` из старых примеров — используйте `.fc-calc`

Готовый файл: `calculators/<slug>/index.html` — копировать **целиком**, без обёртки.

## Что остаётся от сайта

Шапка, меню, подвал — из Laravel. Виджет самодостаточен: Montserrat и палитра HAS-BLED (`#10384f`, `#005eec`, `#eff0f2`) в `<style>` внутри `index.html`.

## После правок

```bash
node scripts/sync-calculator-styles.mjs <slug>   # если меняли shared/fc-calc.css
node --test tests/example.test.mjs
```

Снова скопировать обновлённый `index.html` в админку.
