# FarmConsilium — стили фронтенда

Справочник дизайн-токенов публичной части сайта (Telegram Mini App + desktop).  
Источник правды: `resources/frontend/css/app.css`, шаблоны `resources/views/frontend/**`, `resources/views/livewire/frontend/**`.

Используйте этот файл при вёрстке **медицинских калькуляторов**, чтобы виджеты совпадали с остальным интерфейсом.

---

## 1. Шрифты

| Назначение | Семейство | Файл | Tailwind-класс |
|------------|-----------|------|----------------|
| Обычный текст (по умолчанию) | **SF Pro** | `SF-Pro-Display-Regular.otf` | `font-sans` (дефолт) |
| Полужирный / акцент | **SF Pro Semibold** | `SF-Pro-Display-Semibold.otf` | `font-sf-pro-semibold` |
| Жирный (лейблы форм) | **SF Pro Bold** | `SF-Pro-Display-Bold.otf` | `font-sf-pro-bold` |
| Жирный в контенте | — | — | теги `<strong>`, `<b>` → `font-sf-pro-semibold` |

**CSS-переменные:**

```css
--font-sans: 'SF Pro', ui-sans-serif, system-ui, sans-serif, ...;
--font-sf-pro-semibold: 'SF Pro Semibold';
--font-sf-pro-bold: 'SF Pro Bold';
```

**Начертание в интерфейсе:**

| Класс | Когда |
|-------|--------|
| `font-normal` (400) | поля ввода, основной текст |
| `font-medium` (500) | кнопки |
| `font-light` | пункты списков калькуляторов |
| `font-sf-pro-semibold` | заголовки карточек, кнопки инструкций, title-block |
| `font-sf-pro-bold` | подписи полей форм (label) |
| `font-bold` | крупные desktop-заголовки (hero) |

---

## 2. Палитра цветов (бренд TMA)

Все кастомные цвета заданы в `@theme` в `app.css`.

### 2.1. Серые (фон и текст)

| Токен | HEX | Tailwind | Назначение |
|-------|-----|----------|------------|
| tma-grey | `#EEF0F2` | `bg-tma-grey`, `text-tma-grey` | **Основной фон** страницы (`html`, `body`, секции) |
| tma-grey-100 | `#F8F8F9` | `bg-tma-grey-100` | Светлый фон (редко) |
| tma-grey-200 | `#DEE5E7` | `bg-tma-grey-200`, `border-tma-grey-200` | Разделители, бордеры карточек, home-rating |
| tma-grey-300 | `#E3E3E3` | `border-tma-grey-300` | Границы таблиц |
| tma-grey-500 | `#B4B5C0` | `text-tma-grey-500`, `bg-tma-grey-500` | **Вторичный текст**, подзаголовки, disabled-кнопки, точки карусели |
| tma-grey-900 | `#263048` | `text-tma-grey-900` | **Основной цвет текста** (глобально на `html *`) |

### 2.2. Синие (акцент, ссылки, CTA)

| Токен | HEX | Tailwind | Назначение |
|-------|-----|----------|------------|
| tma-blue | `#305EF9` | `bg-tma-blue`, `text-tma-blue`, `border-tma-blue` | **Главная кнопка**, активные фильтры, футер active |
| tma-blue-500 | `#6D8AEF` | `bg-tma-blue-500`, `hover:bg-tma-blue-500`, `hover:text-tma-blue-500` | Hover для кнопок и ссылок |
| tma-blue-900 | `#005EEC` | `text-tma-blue-900` | Активные ссылки меню, крупные заголовки hero |
| tma-blue-50 | *(авто Tailwind ~10% от blue)* | `hover:bg-tma-blue-50` | Hover строки в выпадающем поиске калькуляторов |

### 2.3. Жёлтый

| Токен | HEX | Tailwind | Назначение |
|-------|-----|----------|------------|
| tma-yellow | `#FFB514` | `fill-tma-yellow` | Звёзды рейтинга (hover) |

### 2.4. Стандартные Tailwind (desktop / описания)

| Класс | HEX (прибл.) | Где |
|-------|--------------|-----|
| `text-gray-800` | ~#1f2937 | Заголовки H1/H2 на desktop (`mixed-text`) |
| `text-gray-700` | ~#374151 | Абзацы-описания |
| `text-gray-600` | ~#4b5563 | Пустые состояния («калькулятор будет добавлен») |
| `text-gray-900` | ~#111827 | Элементы выпадающего поиска |
| `text-white` | `#FFFFFF` | Текст на синих кнопках |

### 2.5. Служебные

| Цвет | Где |
|------|-----|
| `#263048` | SVG иконки в мобильном футере (`fill="#263048"`) |
| `#EEF0F2BF` | Полупрозрачный оверлей home-bg (75% opacity) |
| `#2F4E9B26` | Тень custom-top / custom-bottom (~15% синего) |
| `#305EF9` | Радио-кнопки в формах (stroke/fill) |
| `#B4B5C0` | Неактивное radio (stroke) |

---

## 3. Цвета текста — шпаргалка

| Роль | Класс / значение |
|------|------------------|
| Основной (дефолт) | наследуется: `#263048` (`tma-grey-900`) |
| Подзаголовок, caption | `text-tma-grey-500` |
| Ссылка / активный пункт меню | `text-tma-blue-900` |
| Ссылка hover | `hover:text-tma-blue-500` или `hover:text-tma-blue-900` |
| На кнопке CTA | `text-white` |
| Desktop заголовок страницы | `text-gray-800` + `mixed-text` |
| Desktop описание | `text-lg text-gray-700 leading-relaxed` |
| Ошибка формы | `text-sm text-red-600` |
| Плейсхолдер в input | в разметке `text-grey-500` — **класс не генерируется**; фактически текст тёмный из глобального стиля |

---

## 4. Цвета фона

| Роль | Класс |
|------|--------|
| Страница / приложение | `bg-tma-grey` (`#EEF0F2`) |
| Карточка, поле ввода, модалка | `bg-white` |
| Disabled кнопка | `bg-tma-grey-500` |
| Primary кнопка | `bg-tma-blue` → hover `bg-tma-blue-500` |
| Блок в футере desktop | `bg-tma-grey-200` |
| Секция калькулятора (desktop) | `section.bg-tma-grey` |
| Мобильный fixed-контейнер | `bg-tma-grey` + отступы под header/footer |

**Декоративные фоны (не для калькуляторов):**

- `.home-bg:before` — `#EEF0F2BF` + `/images/home-bg.png`
- `.home-rating` — `tma-grey-200` + `/images/ratings.png`

---

## 5. Типографика (размеры)

### Mobile (Telegram / узкий экран)

| Элемент | Классы | Пример |
|---------|--------|--------|
| Заголовок в шапке (title-block) | `text-xl font-sf-pro-semibold leading-none` | название калькулятора |
| Подзаголовок в шапке | `text-sm text-tma-grey-500 leading-none` | |
| Пункт списка калькуляторов | `text-sm leading-4 font-sf-pro-semibold` | |
| Заголовок шага (рейтинг) | `text-2xl font-sf-pro-semibold` | |
| Подзаголовок шага | `text-xl leading-tight` | |
| Label формы | `text-sm font-sf-pro-bold` | |
| Input / select | `text-sm font-normal` | |
| Кнопка CTA | `font-medium` + padding (см. кнопки) | |
| Подпись под кнопкой | `text-xs text-tma-grey-500` | |

### Desktop

| Элемент | Классы |
|---------|--------|
| H1 страницы | `text-4xl text-gray-800 leading-tight` (+ `mixed-text`) |
| Hero H1 | `text-5xl tracking-wider text-tma-blue-900` |
| Описание под H1 | `text-lg text-gray-700 leading-relaxed` |
| Пункт списка | `text-sm md:text-xl leading-4 md:leading-6` |
| Поиск (input) | `text-base sm:text-xl leading-4` |
| Footer disclaimer | `text-xs` |
| Footer ссылки | `text-base` |

### Шкала Tailwind (часто встречается)

| Класс | rem (≈) | px (≈) |
|-------|---------|--------|
| `text-xs` | 0.75 | 12 |
| `text-sm` | 0.875 | 14 |
| `text-base` | 1 | 16 |
| `text-lg` | 1.125 | 18 |
| `text-xl` | 1.25 | 20 |
| `text-2xl` | 1.5 | 24 |
| `text-4xl` | 2.25 | 36 |
| `text-5xl` | 3 | 48 |

**Межстрочный интервал:** `leading-none`, `leading-tight`, `leading-4`, `leading-relaxed`.

---

## 6. Скругления

| Токен | Значение | Tailwind |
|-------|----------|----------|
| Стандарт | **10px** | `rounded-tma` |
| Pill / мобильные кнопки | **50px** | `rounded-tma-50` |

**Паттерн responsive:** `rounded-tma-50 md:rounded-tma` — на мобиле «капсула», на desktop — 10px.

---

## 7. Тени

```css
--shadow-custom-top:    0px -5px 15px 0px #2F4E9B26;
--shadow-custom-bottom: 0px 5px 15px 0px #2F4E9B26;
```

| Класс | Где |
|-------|-----|
| `shadow-custom-top` | Мобильный нижний футер |
| `shadow-custom-bottom` | Поля поиска, списки с «приподнятием» |

> Класс `shadow-custom-buttons` используется в шаблонах, но **не объявлен** в `app.css` — визуально работает только `shadow-custom-bottom` на input.

---

## 8. Отступы и сетка

### Контейнеры (desktop)

```html
<div class="container mx-auto max-w-7xl">
```

Горизонтальные поля секций: `lg:px-4 xl:px-0`.

### Калькуляторы — отступы

| Контекст | Классы |
|----------|--------|
| Desktop секция | `py-8`, контент `px-3 sm:px-4` |
| Mobile контент | `px-2 sm:px-3 pb-6`, scroll-area `pt-4 mt-16 mb-16` |
| Карточка в списке | `px-2.5 md:px-5 py-3 md:py-5` |
| Home / menu card | `px-2.5 py-3` |
| Кнопка primary | `px-10 py-3.5` или `px-5 py-3.5` |
| Input поиска | `py-3 sm:py-4`, `pl-12 sm:pl-16` |
| Input формы | `py-3 px-2.5` |
| Gap между полями формы | `gap-2` / `gap-6` |

### Breakpoints (Tailwind по умолчанию)

| Префикс | min-width |
|---------|-----------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

---

## 9. Кнопки

### Primary (главное действие)

```
bg-tma-blue hover:bg-tma-blue-500
text-white font-medium
rounded-tma-50 md:rounded-tma
px-10 py-3.5 text-center
w-full
```

**Disabled:** `bg-tma-grey-500`, без hover.

### Пример из инструкций ЛС

```
text-white bg-tma-blue font-sf-pro-semibold rounded-tma px-5 py-3.5 text-center
```

### PDF / компактная

```
text-white bg-tma-blue font-sf-pro-semibold rounded-tma-50 md:rounded-tma px-5 py-1.5 shadow
```

---

## 10. Поля ввода и select

```
w-full text-sm font-normal bg-white
py-3 px-2.5
text-left
border-none focus:border-none focus:border-transparent
rounded-tma
focus:ring-0
```

**Поиск (калькуляторы, лекарства):**

```
text-base sm:text-xl leading-4 font-normal bg-white
pl-12 pe-3 sm:pl-16 py-3 sm:py-4
rounded-tma-50 md:rounded-tma
shadow-custom-bottom
focus:ring-0
```

**Select с кастомной стрелкой:** добавить класс `custom-select` (стрелки `arr-down.svg` / `arr-up.svg`).

**Focus (Flux-поля):** `ring-2 ring-accent ring-offset-2`.

---

## 11. Карточки и списки (калькуляторы)

### Пункт списка

```html
<li class="px-2.5 md:px-5 py-3 md:py-5 font-light bg-white rounded-tma border-b border-tma-grey-200 mb-2">
  <a class="w-full leading-none flex flex-row items-center justify-between">
    <span class="text-sm md:text-xl leading-4 md:leading-6 font-sf-pro-semibold">Название</span>
    <!-- иконка arr-right-grey -->
  </a>
</li>
```

### Карточка на главной (раздел «Калькуляторы»)

```html
<li class="px-2.5 py-3 bg-white rounded-tma mb-2">
  <span class="text-lg font-sf-pro-semibold">Калькуляторы</span>
  <span class="text-xs text-tma-grey-500">Медицинские калькуляторы и шкалы</span>
</li>
```

### Белая панель (виджет рейтинга)

```
p-4 bg-white rounded-tma text-center
```

---

## 12. Таблицы

Глобально (контент / wysiwyg):

```
table: border-collapse border border-tma-grey-500
th, td: border border-tma-grey-300
```

В статьях (wysiwyg): padding ячеек `0.7em`, заголовок таблицы `#f5f5f5`, граница `#e6e6e6`.

Скрипт в layout оборачивает `<table>` в `overflow-x-auto` и добавляет `text-sm text-left`.

---

## 13. Встраиваемый HTML калькулятора

Страницы `calculator-show` выводят `{!! $calculator->html_code !!}` без обёртки в дизайн-систему.

**Один файл на калькулятор:** `calculators/<slug>/index.html` — внутри `<div class="fc-calc">` блоки `<style>`, разметка и `<script>`. На сайт не подключаются отдельные `.css`/`.js` из папки.

**Единый каркас на [странице калькуляторов](https://farmconsilium.com/calculator):** у всех виджетов пять зон в одном порядке (`head` → `body` → `actions` → `result-wrap` → `foot`). Меняется только разметка в `fc-calc__body`. Подробно: `templates/LAYOUT.md`.

**Изоляция от сайта:** селекторы только вида `.fc-calc …` / `.fc-calc__*`; **не использовать** `:root`, `html`, `body`, теги без префикса (`button {}`, `input {}`). Скрипт — только IIFE, без `window.*` и правок `document.body`. Блок результата не скрывать через `hidden` на обёртке — использовать `fc-calc__result--empty`.

**Рекомендации для нового калькулятора:**

1. Фон страницы уже `bg-tma-grey` — виджет можно на **белой карточке**: `background:#fff; border-radius:10px; padding:16px`.
2. Шрифт: `'SF Pro', system-ui, sans-serif` (или не задавать — унаследует).
3. Цвет текста: `#263048`.
4. Кнопки: фон `#305EF9`, текст `#fff`, hover `#6D8AEF`, `border-radius:10px` (mobile pill: `50px`).
5. Поля: белый фон, `border-radius:10px`, без жёсткой рамки (как в сайте).
6. Вторичный текст: `#B4B5C0`.
7. Ограничить ширину: `max-width: 80rem` (как `max-w-7xl`) для desktop.

---

## 14. CSS-переменные (копипаст)

```css
:root {
  --font-sans: 'SF Pro', ui-sans-serif, system-ui, sans-serif;
  --font-sf-pro-semibold: 'SF Pro Semibold';
  --font-sf-pro-bold: 'SF Pro Bold';

  --color-tma-grey: #EEF0F2;
  --color-tma-grey-100: #F8F8F9;
  --color-tma-grey-200: #DEE5E7;
  --color-tma-grey-300: #E3E3E3;
  --color-tma-grey-500: #B4B5C0;
  --color-tma-grey-900: #263048;

  --color-tma-blue: #305EF9;
  --color-tma-blue-500: #6D8AEF;
  --color-tma-blue-900: #005EEC;
  --color-tma-yellow: #FFB514;

  --radius-tma: 10px;
  --radius-tma-50: 50px;

  --shadow-custom-top: 0px -5px 15px 0px #2F4E9B26;
  --shadow-custom-bottom: 0px 5px 15px 0px #2F4E9B26;
}
```

---

## 15. Папка калькулятора в репозитории

Каждый калькулятор — каталог `calculators/<slug>/` (см. `calculators/README.md`):

| Файл | Назначение |
|------|------------|
| `index.html` | Фрагмент для `html_code` |
| `calc.js` | Формулы (unit-тесты) |
| `cases.json` | Эталонные кейсы |
| `meta.json` | Slug и название |

Общие стили (не дублировать в папках): `shared/fc-calc.css` → встраиваются в `index.html` при создании и через `node scripts/sync-calculator-styles.mjs <slug>`.

Создание папки: `node scripts/new-calculator.mjs <slug>`.

При разработке в Cursor: работать только в `calculators/<slug>/`; единый вид — из `shared/` и `FRONTEND-STYLES.md`, не из соседних калькуляторов.

---

## 16. Быстрый чеклист для нового калькулятора

- [ ] Фон страницы: `#EEF0F2` / `bg-tma-grey`
- [ ] Заголовок: SF Pro Semibold, ~20px mobile / 36px desktop
- [ ] Основной текст: `#263048`
- [ ] Подписи: `#B4B5C0`, 12–14px
- [ ] Кнопка действия: `#305EF9`, белый текст, radius 10px (50px на узком TMA)
- [ ] Карточки/inputs: белый фон, radius 10px
- [ ] Разделители: `#DEE5E7`
- [ ] Не использовать admin-палитру (zinc, teal, Flux admin)

---

## 17. Замечания по кодовой базе

| Класс в шаблонах | Статус |
|------------------|--------|
| `font-sf-pro-semibold` | ✅ объявлен |
| `text-sf-pro-semibold` | ❌ не генерируется (в списке калькуляторов — опечатка, нужен `font-sf-pro-semibold`) |
| `text-grey-500` | ❌ не генерируется (текст всё равно `#263048` из `html *`) |
| `text-gray-tma-900` | ❌ не в theme (вероятно имелся в виду `text-tma-grey-900`) |
| `bg-img`, `mixed-text`, `container-fluid`, `shadow-custom-buttons` | ❌ нет в собранном CSS — возможно legacy; layout опирается на `container mx-auto max-w-7xl` |

---

## 18. Файлы для правок стилей

| Файл | Назначение |
|------|------------|
| `resources/frontend/css/app.css` | Токены, шрифты, wysiwyg, home/footer |
| `resources/frontend/fonts/*.otf` | SF Pro |
| `resources/views/frontend/**` | Blade-разметка |
| `vite-frontend.config.js` | Сборка `/build/frontend/` |

После изменения `app.css`: `npm run build:frontend` или `npm run dev:frontend`.

---

*Документ сгенерирован по состоянию проекта FarmConsilium (ветка разработки, frontend TMA + desktop).*
