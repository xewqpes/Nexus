# NEXUS — Киберспортивный веб-портал

Информационный веб-портал для отслеживания турниров, команд и матчей
**League of Legends**.

## Технологии

- HTML5 (семантическая разметка)
- SCSS (препроцессор → `styles/main.css`)
- Vanilla JavaScript (ES6+)
- XML (хранение данных)
- Inline SVG (графика)

## Структура проекта

```
nexus-project/
├── index.html           # Главная
├── tournaments.html     # Каталог турниров
├── teams.html           # Каталог команд
├── matches.html         # Расписание матчей
├── styles/
│   ├── main.scss        # Точка входа SCSS
│   ├── main.css         # Скомпилированный CSS
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _base.scss
│   ├── _responsive.scss
│   └── components/      # header, hero, cards, buttons, footer и др.
├── scripts/
│   └── main.js          # XML parser, рендер, фильтры, switcher
├── data/
│   └── data.xml         # Матчи, турниры, команды
└── assets/
    └── svg/             # Логотип, иконки игр
```

## Функционал

- **Главная** — hero, live-ticker, 3 feature-карточки, секция турниров
  (тёмная), рейтинг топ-команд.
- **Турниры** — фильтры по игре / региону / статусу.
- **Команды** — фильтры по игре / региону, составы 5 игроков, winrate-бар.
- **Матчи** — live / upcoming / finished, сортировка по статусу.
- **Game switcher** (Все / Dota 2 / LoL) — меняет акцентный цвет
  через CSS custom property `--accent-game` и пересобирает списки.
- **Smooth scroll** по якорным ссылкам.
- **Fade-in анимации** через Intersection Observer.
- **Адаптив** — 3 брейкпойнта (1100 / 900 / 640 px).

## Дизайн-система

- Палитра: `$gold #C8991A`, `$ink #0C0C0C`, `$bg #F7F5F0`.
- Типографика: Bebas Neue (заголовки), DM Sans (текст), Space Mono (метки).
- Миксины: `glass-effect` (backdrop-filter), `outline-text`, `hover-slide`.

## Браузерная поддержка

Chrome, Firefox, Safari, Edge — последние версии.

## Автор

Студент 1 курса БГТУ, ФИТ
Курсовой проект 2026.
