# Калькуляторы

Каждый калькулятор — **отдельная папка**. При работе в Cursor откройте файл **только из своей папки** — правила не дают смотреть соседние калькуляторы; стиль единый через `shared/fc-calc.css`.

```
calculators/
  has-bled/
    index.html    ← единственный файл для сайта: <style> + HTML + <script>
    calc.js       ← формулы для тестов (на сайт не идёт)
    cases.json    ← эталонные кейсы
    meta.json     ← slug, title, source
```

Стили и скрипты в `index.html` **не должны влиять** на остальную страницу: всё внутри `<div class="fc-calc">`, селекторы только с префиксом `.fc-calc`.

На сайте ([калькуляторы](https://farmconsilium.com/calculator)) у всех виджетов **одинаковые зоны**: шапка → поля → кнопка → результат → дисклеймер. Меняется только содержимое `fc-calc__body`. Каркас: `templates/LAYOUT.md`.

## Новый калькулятор

```bash
node scripts/new-calculator.mjs has-bled
```

## Обновить стили во всех / одном

Общий файл: `shared/fc-calc.css`. После изменения:

```bash
node scripts/sync-calculator-styles.mjs has-bled
```

## Проверка

```bash
node --test tests/example.test.mjs
```

Правила Cursor: `calculator-scope.mdc`, `calculator-style.mdc`.  
Дизайн-токены: `FRONTEND-STYLES.md` §13–16.
