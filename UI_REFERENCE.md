# UI Reference (класи/ID/атрибути)

Цей файл — шпаргалка по тому, що вже є в проєкті: CSS‑класи, `id`, `data-*` атрибути та “стани”, які додає JS.

## Класи (весь список)

> Це об’єднаний список класів з HTML + CSS + тих, що використовуються/додаються JS.

```
about
about__card
about__image
brand
brand__dot
btn
btn-ghost
btn-primary
card
container
error
feature
footer__bottom
footer__grid
form
form-row
gallery-grid
gallery-item
grid
grid-2
grid-3
hero
hero__actions
hero__content
input
is-active
is-open
is-scrolled
is-visible
js-lightbox
kicker
lightbox
lightbox__caption
lightbox__close
lightbox__img
lightbox__inner
list-inline
map-block
map-embed
message
nav
nav__cta
nav__link
nav__links
nav-bar
nav-toggle
pill
preview-grid
room-card
room-card__media
room-meta
section
section-head
site-footer
site-header
social
summary
u-flex
u-gap-4
u-items-center
u-justify-between
u-mb-0
u-mb-4
u-mt-0
u-mt-4
u-muted
u-rounded
u-shadow-sm
u-sr-only
u-text-center
```

## ID (весь список)

```
bookingForm
bookingMessage
bookingSummary
features
location
navLinks
```

## `data-*` атрибути (весь список)

```
data-caption
data-nav
data-page
data-sr
data-src
data-sr-delay
```

## “Стани” від JS (classList)

- `is-active` — активний пункт меню (підсвічування)
- `is-scrolled` — хедер після скролу
- `is-open` — мобільне меню та лайтбокс відкриті
- `is-visible` — елемент з `data-sr` вже “проявився”
- `error` — показ помилки в повідомленні бронювання (`.message.error`)

## Елементи, які створює JS (Lightbox)

JS динамічно додає в DOM такі класи:

```
lightbox
lightbox__inner
lightbox__close
lightbox__img
lightbox__caption
```

## Як швидко згенерувати список знову

PowerShell (з кореня проєкту):

```powershell
$files = Get-ChildItem -Recurse -Include *.html -File
$classes = New-Object System.Collections.Generic.HashSet[string]
foreach ($f in $files) {
  $t = Get-Content -Raw $f.FullName
  foreach ($m in [regex]::Matches($t,'class\\s*=\\s*\"([^\"]+)\"')) {
    $m.Groups[1].Value -split '\\s+' | % { if($_){ $null=$classes.Add($_) } }
  }
}
$classes | Sort-Object
```

