// Метаданные и HTML-блок, который подставляется в <head> проксируемой страницы.
// Портировано 1:1 из functions/[[path]].js (Cloudflare Pages / HTMLRewriter).

export const IMAGE =
  "https://github.com/Rusmer/regruha/blob/main/functions/favicon.png?raw=true";

export const TITLE = "Regruha — T-Regruha";
export const DESCRIPTION = "Regruha / T-Regruha — официальный сайт проекта.";

/**
 * Собирает разметку, которая вставляется в начало <head>.
 * @param {{ siteUrl: string, title?: string, description?: string, image?: string }} options
 * @returns {string}
 */
export function buildHeadHtml({
  siteUrl,
  title = TITLE,
  description = DESCRIPTION,
  image = IMAGE,
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Regruha",
    alternateName: "T-Regruha",
    url: `${siteUrl}/`,
    description,
  };

  return `
          <script>
            (function() {
              const hideElements = () => {
                // Удаляет разделитель даже если сайт добавляет его
                // динамически через React или другой JavaScript
                document
                  .querySelectorAll('div.w-full.border-t.border-border')
                  .forEach(el => el.remove());

                // Скрывает кнопку Continue with Google
                document.querySelectorAll('button').forEach(btn => {
                  if (
                    btn.textContent &&
                    btn.textContent.includes('Continue with Google')
                  ) {
                    btn.style.setProperty(
                      'display',
                      'none',
                      'important'
                    );
                  }
                });

                // Скрывает блок "or"
                document.querySelectorAll('div.uppercase span').forEach(span => {
                  if (
                    span.textContent &&
                    span.textContent.trim() === 'or'
                  ) {
                    const parentDiv = span.closest('div.relative');

                    if (parentDiv) {
                      parentDiv.style.setProperty(
                        'display',
                        'none',
                        'important'
                      );
                    }
                  }
                });

                // Меняет РЕЙТИНГ на ОЦЕНКА METACRITIC
                document
                  .querySelectorAll(
                    'div.min-w-0 > div.font-mono.text-\\\\[9px\\\\].tracking-widest.text-zinc-data'
                  )
                  .forEach(el => {
                    if (
                      el.textContent &&
                      el.textContent.trim() === 'РЕЙТИНГ'
                    ) {
                      el.textContent = 'ОЦЕНКА METACRITIC';
                    }
                  });

                document
                  .querySelectorAll(
                    'label.font-mono.text-\\\\[9px\\\\].tracking-widest.text-zinc-data.block.mb-1'
                  )
                  .forEach(el => {
                    if (
                      el.textContent &&
                      el.textContent.trim() === 'РЕЙТИНГ'
                    ) {
                      el.textContent = 'ОЦЕНКА METACRITIC';
                    }
                  });

                // Меняет ОЖИДАЕМЫЙ РЕЛИЗ на ИЗБРАННОЕ
                document
                  .querySelectorAll(
                    'div.absolute.top-0.right-0.bg-gold.text-\\\\[\\\\#050505\\\\].font-mono.text-\\\\[10px\\\\].font-bold.tracking-widest.px-3.py-1.z-20'
                  )
                  .forEach(el => {
                    if (
                      el.textContent &&
                      el.textContent.trim() === 'ОЖИДАЕМЫЙ РЕЛИЗ'
                    ) {
                      el.textContent = 'ИЗБРАННОЕ';
                    }
                  });

                // Меняет placeholder textarea
                document.querySelectorAll('textarea').forEach(el => {
                  el.setAttribute(
                    'placeholder',
                    'Напишите ответ...'
                  );
                });

                // Меняет placeholder рейтинга
                document
                  .querySelectorAll(
                    'input[placeholder="PEGI 18 / 18+"]'
                  )
                  .forEach(el => {
                    el.setAttribute('placeholder', '7.2/10');
                  });
              };

              hideElements();

              new MutationObserver(hideElements).observe(
                document.documentElement,
                {
                  childList: true,
                  subtree: true
                }
              );
            })();
          </script>

          <style>
            #base44-badge,
            #base44-edit-badge {
              display: none !important;
            }

            button:has(svg path[fill="#4285F4"]),
            div.uppercase:has(span) {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          </style>

          <meta charset="utf-8">
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          >

          <meta
            name="google-site-verification"
            content="google14337db78de6911c.html"
          >

          <title>${title}</title>

          <meta
            name="description"
            content="${description}"
          >

          <meta
            name="robots"
            content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
          >

          <meta
            name="googlebot"
            content="index, follow"
          >

          <link
            rel="canonical"
            href="${siteUrl}/"
          >

          <link
            rel="icon"
            type="image/png"
            href="${image}"
            sizes="32x32"
          >

          <link
            rel="shortcut icon"
            href="${image}"
          >

          <link
            rel="apple-touch-icon"
            href="${image}"
          >

          <meta
            property="og:site_name"
            content="Regruha"
          >

          <meta
            property="og:title"
            content="${title}"
          >

          <meta
            property="og:description"
            content="${description}"
          >

          <meta
            property="og:image"
            content="${image}"
          >

          <meta
            property="og:type"
            content="website"
          >

          <meta
            property="og:url"
            content="${siteUrl}/"
          >

          <meta
            name="twitter:card"
            content="summary_large_image"
          >

          <meta
            name="twitter:title"
            content="${title}"
          >

          <meta
            name="twitter:description"
            content="${description}"
          >

          <meta
            name="twitter:image"
            content="${image}"
          >

          <script type="application/ld+json">
            ${JSON.stringify(jsonLd)}
          </script>
        `;
}
