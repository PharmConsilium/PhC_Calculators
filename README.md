# CalculatorPharmConsilium

Медицинские калькуляторы и шкалы для [ФармКонсилиум](https://farmconsilium.com/calculator) в едином стиле TMA/desktop.

## Структура

Каждый калькулятор — папка `calculators/<slug>/`:

| Файл | Назначение |
|------|------------|
| `index.html` | Фрагмент для `html_code` в CMS |
| `calc.js` | Формулы (unit-тесты) |
| `cases.json` | Эталонные кейсы |
| `meta.json` | Slug и название |

Подробнее: [calculators/README.md](calculators/README.md).

## Быстрый старт

```bash
node scripts/new-calculator.mjs has-bled
node --test tests/example.test.mjs
```

Стили: [FRONTEND-STYLES.md](FRONTEND-STYLES.md).

## Организация

[PharmConsilium](https://github.com/PharmConsilium) · Сайт агентства: [pharmconsilium.com](https://pharmconsilium.com/)
