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

На сайте ([калькуляторы](https://farmconsilium.com/calculator)) у всех виджетов **одинаковые зоны**: шапка → поля → кнопка → результат → дисклеймер. Каркас: `templates/LAYOUT.md`.

**Новые калькуляторы (эталон `hydro-balance`):**
- Шапка: `h2.fc-calc__title` + `p.fc-calc__hint`
- Поля в секциях: `fc-calc__panel-section` → `fc-calc__panel` → `h3.fc-calc__panel-heading`
- Стили панелей: `shared/fc-calc.css`; фрагмент: `templates/panel-section.html`

## Даник

- **`bmi/`** — индекс массы тела (ИМТ/BMI, классификация ВОЗ)
- **`date-diff/`** — расчёт дней между двумя датами
- **`gcs-equiv/`** — эквивалентные дозы системных глюкокортикостероидов (пересчёт по ClinCalc)
- **`fluid-req/`** — расчёт физиологической потребности в жидкости (правило 4-2-1)
- **`hydro-balance/`** — расчёт гидробаланса (формулы [medsoftpro.ru](https://medsoftpro.ru/kalkulyatory/hydrobalance-calc))
- **`apgar/`** — шкала Апгар (оценка состояния новорождённого)
- **`glasgow-coma/`** — шкала комы Глазго (GCS)
- **`mayo-coma/`** — шкала комы Мэйо (FOUR)
- **`gail-breast/`** — модель Гейла, 5-летний риск РМЖ (1999)
- **`sodium-deficit/`** — дефицит натрия при гипонатриемии (MSD)
- **`cardiac-output/`** — сердечный выброс по Фику ([medsoftpro](https://medsoftpro.ru/kalkulyatory/cardiac-output))
- **`wells-pe/`** — шкала Уэллса, вероятность ТЭЛА (MSD)
- **`geneva-pe/`** — Женевская шкала (индекс Geneva), вероятность ТЭЛА ([ByMed](https://bymed.top/calc/geneva-2180))
- **`pesi-pe/`** — шкала PESI, 30-дневная летальность при ТЭЛА ([ByMed](https://bymed.top/calc/pesi-2188))
- **`infusomat/`** — доза и скорость на инфузомате ([ByMed](https://bymed.top/calc/%D0%B8%D0%BD%D1%84%D1%83%D0%B7%D0%BE%D0%BC%D0%B0%D1%82-658))
- **`anion-gap/`** — анионная разница, дельта-дельта градиент (MSD)
- **`apache-ii/`** — шкала APACHE II и оценка смертности (Knaus / MSD)
- **`martin-ldl/`** — расчёт ХС ЛПНП (формулы Мартина-Хопкинса, Сэмпсона, Фридвальда)
- **`peds-percentiles/`** — процентили в педиатрии (ВОЗ: вес, рост, ИМТ, ОГ, масса при рождении, масса плода, целевой рост)

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
**На сайт:** весь `index.html` в админку — см. `PUBLISH.md`.
