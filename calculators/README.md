# Калькуляторы

Каждый медицинский калькулятор — **отдельная папка** здесь:

```
calculators/
  has-bled/
    index.html    ← фрагмент для html_code на farmconsilium.com
    calc.js       ← формулы (тестируются отдельно от DOM)
    cases.json    ← эталонные примеры для node --test
    meta.json     ← название и slug для справки
```

## Новый калькулятор

```bash
node scripts/new-calculator.mjs has-bled
```

Появится папка `calculators/has-bled/` с файлами-заготовками. Дальше правите формулу в `calc.js`, вёрстку в `index.html`, кейсы в `cases.json`.

## Проверка

```bash
node --test tests/example.test.mjs
```

Стили и чеклист: `FRONTEND-STYLES.md`, правила Cursor: `.cursor/rules/medical-calculators.mdc`.
