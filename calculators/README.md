# Калькуляторы

Каждый калькулятор — **отдельная папка**. При работе в Cursor откройте файл **только из своей папки** — правила не дают смотреть соседние калькуляторы; стиль единый через `shared/fc-calc.css`.

```
calculators/
  has-bled/
    index.html    ← фрагмент для html_code (стили из shared внутри <style>)
    calc.js       ← формулы для node --test
    cases.json    ← эталонные кейсы
    meta.json     ← slug, title, source
```

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
