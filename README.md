# Сапёр (браузерная версия)

## Yandex Games

- `index.html` connects the Yandex Games SDK with `/sdk.js`, which is the path expected when the game archive is uploaded to Yandex Games.
- A fullscreen ad is requested every time a new game starts or restarts.
- On every win, the game sends a JSON result to `window.SAPER_RESULTS_URL`. Set this value in `index.html` to your Yandex Cloud Function/API Gateway URL.
- The win payload includes `difficulty`, `recordKey`, board size/mines, time, flags, and Yandex player data/signature when the SDK provides it.
Классический «Сапёр», реализованный на чистых HTML/CSS/JS.

## Запуск локально

- Откройте `index.html` в браузере или запустите папку любым статическим сервером.

Пример (если установлен Node):

```bash
npx serve .
```

## Управление

- ЛКМ / тап: открыть клетку
- ПКМ: поставить/снять флажок
- Долгое нажатие (тач): флажок
- Клик по открытой цифре: «хорда» — открыть соседей, если число флажков совпало

## Сборка

Проект статический (без бэкенда): достаточно загрузить содержимое папки.
