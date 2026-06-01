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

## Подзаголовок

```html
<h2 class="fc-calc__title">Оценка клиренса креатинина</h2>
<p class="fc-calc__hint">Расчёт по формуле Cockcroft-Gault</p>
```

(H1 страницы задаётся в админке — в виджете только подзаголовок.)

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
