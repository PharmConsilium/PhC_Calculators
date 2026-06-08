# UI-паттерны (как на farmconsilium.com)

Эталон: калькулятор функции почек (вкладки, пол, поля, результат, примечание).

## Вкладки формул

```html
<div class="fc-calc__tabs" role="tablist">
  <button type="button" class="fc-calc__tab fc-calc__tab--active" role="tab">Cockcroft-Gault</button>
  <button type="button" class="fc-calc__tab" role="tab">CKD-EPI</button>
</div>
<div class="fc-calc__tab-panel fc-calc__tab-panel--active" id="panel-a">…форма…</div>
```

## Заголовок и подзаголовок (обязательно)

Эталон: `calculators/hydro-balance/`, `calculators/pregnancy-dating/`.

```html
<header class="fc-calc__head">
  <h2 class="fc-calc__title">Полное название из meta.json</h2>
  <p class="fc-calc__hint">Краткое описание: что считает калькулятор</p>
  <!-- опционально: -->
  <p class="fc-calc__formula"><strong>Результат</strong> = …</p>
</header>
```

- `fc-calc__title` — обычный вес, 1.25rem на мобильных → 36px на десктопе (стили в `shared/fc-calc.css`).
- `fc-calc__hint` в шапке — по центру, до 34rem ширины.

H1 страницы задаётся в админке — в виджете только `h2` + подпись.

## Секции формы (обязательно для новых калькуляторов)

Поля группируются в серые панели с заголовком `h3`. Стили — в `shared/fc-calc.css` (классы `fc-calc__panel-*`).

```html
<div class="fc-calc__panel-section">
  <div class="fc-calc__panel">
    <h3 class="fc-calc__panel-heading">Параметры пациента</h3>
    <div class="fc-calc__field">
      <label for="fc-calc-SLUG-weight">Масса тела, кг</label>
      <input type="number" id="fc-calc-SLUG-weight" name="weightKg" required />
      <span class="fc-calc__error" id="fc-calc-SLUG-weight-error" role="alert"></span>
    </div>
  </div>
</div>
```

Готовый фрагмент: `templates/panel-section.html`. Не использовать голые `p.fc-calc__hint` между полями как заголовки секций.

## Пол (сегмент)

```html
<div class="fc-calc__segmented">
  <button type="button" class="fc-calc__segment fc-calc__segment--active">Мужской</button>
  <button type="button" class="fc-calc__segment">Женский</button>
</div>
```

## Результат

```html
<div class="fc-calc__result-wrap">
  <div class="fc-calc__result" id="fc-calc-SLUG-result">
    <p class="fc-calc__result-label">Клиренс креатинина</p>
    <p class="fc-calc__result-number" id="fc-calc-SLUG-result-number">—</p>
    <p class="fc-calc__result-desc" id="fc-calc-SLUG-result-desc"></p>
  </div>
</div>
```

## Примечания

Внутри `.fc-calc__card`, блок из `templates/notes-block.html`.
