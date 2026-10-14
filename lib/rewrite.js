// HTML-перезапись страницы-зеркала.
//
// В Cloudflare Pages это делал HTMLRewriter (streaming DOM API). На Vercel такого
// API нет, поэтому используем cheerio (parse5) — результат эквивалентен, но
// выполняется не стримингом, а на всём документе сразу.

import * as cheerio from "cheerio";
import { buildHeadHtml } from "./head.js";

/** Проверяет, что у элемента есть все перечисленные классы. */
function hasClasses($el, classes) {
  return classes.every((className) => $el.hasClass(className));
}

/** Приводит текст элемента к строке без лишних пробелов. */
function textOf($el) {
  return ($el.text() || "").trim();
}

/**
 * Перезаписывает HTML страницы-зеркала.
 * @param {string} html исходный HTML от Base44
 * @param {string} siteUrl публичный адрес зеркала, например https://regruha.vercel.app
 * @returns {string} перезаписанный HTML
 */
export function rewriteHtml(html, siteUrl) {
  const $ = cheerio.load(html);

  // Удаляем метаданные, которые затем подставим свои.
  $(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="canonical"], meta[name="description"]'
  ).remove();
  $("title").remove();

  // Удаляет: <div class="w-full border-t border-border"></div>
  $("div.w-full.border-t.border-border").remove();

  // Меняет placeholder у textarea.
  $("textarea").attr("placeholder", "Напишите ответ...");

  // "// ОТВЕТИТЬ (поддерживается Markdown)" -> "// ОТВЕТИТЬ)"
  $("span").each((_, el) => {
    const $el = $(el);
    if (
      hasClasses($el, [
        "font-mono",
        "text-[10px]",
        "tracking-widest",
        "text-gold",
      ]) &&
      ($el.text() || "").includes("// ОТВЕТИТЬ (поддерживается Markdown)")
    ) {
      $el.text("// ОТВЕТИТЬ)");
    }
  });

  // РЕЙТИНГ -> ОЦЕНКА METACRITIC (div.min-w-0 > div...)
  $("div").each((_, el) => {
    const $el = $(el);
    if (
      $el.parent().hasClass("min-w-0") &&
      hasClasses($el, [
        "font-mono",
        "text-[9px]",
        "tracking-widest",
        "text-zinc-data",
      ]) &&
      textOf($el) === "РЕЙТИНГ"
    ) {
      $el.text("ОЦЕНКА METACRITIC");
    }
  });

  // РЕЙТИНГ -> ОЦЕНКА METACRITIC (label...)
  $("label").each((_, el) => {
    const $el = $(el);
    if (
      hasClasses($el, [
        "font-mono",
        "text-[9px]",
        "tracking-widest",
        "text-zinc-data",
        "block",
        "mb-1",
      ]) &&
      textOf($el) === "РЕЙТИНГ"
    ) {
      $el.text("ОЦЕНКА METACRITIC");
    }
  });

  // СЭКОНОМЛЕНО ВРЕМЕНИ -> СЭКОНОМЛЕНО ВРЕМЕНИ В ИГРЕ
  $("div").each((_, el) => {
    const $el = $(el);
    if (
      $el.hasClass("text-[9px]") &&
      $el.hasClass("tracking-[0.2em]") &&
      $el.hasClass("text-zinc-data") &&
      textOf($el) === "СЭКОНОМЛЕНО ВРЕМЕНИ"
    ) {
      $el.text("СЭКОНОМЛЕНО ВРЕМЕНИ В ИГРЕ");
    }
  });

  // Меняет placeholder у поля рейтинга.
  $('input[placeholder="PEGI 18 / 18+"]').attr("placeholder", "7.2/10");

  // Подставляем SEO-разметку и клиентские правки в <head>.
  $("head").prepend(buildHeadHtml({ siteUrl }));

  return $.html();
}
