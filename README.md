# Regruha / T-Regruha — зеркало на Vercel

Порт сайта-зеркала с **Cloudflare Pages Functions** на **Vercel Functions**.

Сайт проксирует источник `regruha.base44.app`, переписывает HTML (SEO-метатеги,
favicon, скрытие элементов Base44) и проксирует служебные маршруты `/api/*` и
`/ws-user-apps/*`.

## Почему не 1:1 копия файлов

Cloudflare Pages раскладывает запросы по файлам в `functions/`, а Vercel для проекта
без фреймворка так не умеет (нет вложенных динамических роутов вида `[[path]]`).
Кроме того, Cloudflare-API **`HTMLRewriter` в Vercel недоступен** (ни в edge, ни в
Node.js). Поэтому:

- весь роутинг собран в одном обработчике `api/proxy.js`;
- HTML переписывается через `cheerio` вместо `HTMLRewriter`;
- исходный путь передаётся функции трансформом `request.path`, а на случай если
  трансформ не сработает — дублируется заголовком `x-regruha-original-path`
  (см. `vercel.json` и `api/proxy.js`).

Старая папка `functions/` оставлена как исходник для сверки, Vercel её не использует.

## Структура

```
api/proxy.js        — единый обработчик всех запросов (роутинг + прокси + правки)
lib/head.js         — SEO-разметка для <head> (порт из functions/[[path]].js)
lib/rewrite.js      — HTML-перезапись через cheerio (аналог HTMLRewriter)
vercel.json         — маршрутизация: всё -> /api/proxy, оригинальный путь в request.path
test/local.test.mjs — локальные тесты с mock-сервером источника
functions/          — исходные Cloudflare Pages Functions (для справки, не деплоится)
```

## Маршруты

| Путь | Что делает |
| --- | --- |
| `/` и любые прочие пути | проксирует `regruha.base44.app` и переписывает HTML |
| `/api/*` | проксирует `regruha.base44.app` (`redirect: manual`) |
| `/api/apps/auth/login?app_id=…` | 302-редирект на OAuth Base44 с `from_url` зеркала |
| `/ws-user-apps/*` | проксирует `regruha-terminal-core.base44.app`, прячет бейдж Base44 |
| `/robots.txt`, `/sitemap.xml` | генерируются на лету |
| `/google14337db78de6911c.html` | файл для Google Search Console |
| `/favicon.png`, `/favicon.ico` | редирект на картинку проекта |

## Деплой

### Вариант 1. Через GitHub

1. Запушьте проект в репозиторий.
2. В Vercel: **Add New → Project → Import** репозитория.
3. Framework Preset: **Other**. Build/Output/Install команды можно оставить по
   умолчанию (сборки нет, `npm install` поставит `cheerio`).
4. Deploy.

### Вариант 2. Через CLI

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

Код приложения менять для домена не нужно: он определяется из запроса.

## Переменные окружения (необязательные)

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `UPSTREAM_MAIN` | `https://regruha.base44.app` | источник основной страницы |
| `UPSTREAM_API` | `https://regruha.base44.app` | источник `/api/*` |
| `UPSTREAM_TERMINAL` | `https://regruha-terminal-core.base44.app` | источник `/ws-user-apps/*` |
| `SITE_URL` | определяется из запроса | адрес зеркала для `from_url` после OAuth |

Публичный домен (для `canonical`, OG‑тегов, `robots.txt`, `sitemap.xml`) берётся из
запроса — сначала из `x-forwarded-host`, который Vercel прокидывает для custom domain,
затем из `Host`. Адрес зеркала при необходимости можно зафиксировать через `SITE_URL`.

В старом коде были зашиты конкретные адреса (`regruha.pages.dev`). Теперь адрес
зеркала вычисляется из входящего запроса, а при необходимости его можно
зафиксировать через `SITE_URL`.

## Локальная разработка

```bash
npm install
npm test              # тесты обработчика с mock-источником
npx vercel dev        # локальный запуск с настоящей конфигурацией vercel.json
```

## Что заменило HTMLRewriter

Перезапись HTML делается в `lib/rewrite.js` на `cheerio` и повторяет поведение
исходных правил: удаляются старые `<title>`, `meta[description]`, `link[rel=canonical]`
и иконки; убирается разделитель `.w-full.border-t.border-border`; правятся тексты
(«РЕЙТИНГ» → «ОЦЕНКА METACRITIC» и т.д.) и плейсхолдеры; в `<head>` вставляется блок
с SEO-метатегами, JSON-LD и клиентским скриптом.

Дополнительно (в отличие от оригинала) правки применяются **только к
`text/html`** — бинарные и JSON-ответы отдаются как есть, а из проксированных
ответов удаляются `content-encoding`/`content-length`, которые Node `fetch`
оставляет после автоматической распаковки gzip.
