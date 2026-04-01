#!/usr/bin/env python3
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
import re


ROOT = Path("/Users/ben/github/pure-flon.github.io")
DOCS = ROOT / "docs"
BASE_URL = "https://pure-flon.com"
EXCLUDED_PARTS = {
    "node_modules",
    "output",
    "dist",
    ".git",
    ".playwright-mcp",
    ".agents",
    "customer",
}
EXCLUDED_FILES = {"404.html"}
LOCALES = ("en", "ko", "ja", "zh")
I18N_READY = {
    "/",
    "/company/about.html",
    "/blog/korean-honorifics-guide/",
    "/games/k-meme-quiz/",
    "/products/",
    "/products/esd-pfa-tube/",
    "/products/pfa-tube/",
    "/products/ptfe-tube/",
    "/products/medical.html",
    "/products/semiconductor.html",
    "/products/chemical.html",
    "/quote/",
    "/quote/request.html",
    "/quote/payment.html",
    "/quote/thank-you.html",
    "/saas/ai-ops-autopilot/",
}
PARTIAL_TRANSLATION_ROUTES = {
    "/company/about.html",
    "/games/k-meme-quiz/",
    "/products/medical.html",
    "/products/semiconductor.html",
    "/products/chemical.html",
    "/quote/request.html",
}
FULLY_LOCALIZED_ROUTES = I18N_READY - PARTIAL_TRANSLATION_ROUTES
SITEMAP_FILES = {
    "index": ROOT / "sitemap.xml",
    "pages": ROOT / "sitemap-pages.xml",
    "en": ROOT / "sitemap-en.xml",
    "ko": ROOT / "sitemap-ko.xml",
    "ja": ROOT / "sitemap-ja.xml",
    "zh": ROOT / "sitemap-zh.xml",
}
TODO_FILE = DOCS / "I18N_ROLLOUT_TODO.md"


def iso_date(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).date().isoformat()


def normalize_route(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def is_excluded(path: Path) -> bool:
    rel_parts = set(path.relative_to(ROOT).parts)
    return bool(rel_parts & EXCLUDED_PARTS) or path.relative_to(ROOT).as_posix() in EXCLUDED_FILES


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def get_lang(text: str) -> str | None:
    match = re.search(r'<html[^>]+lang=["\'](.*?)["\']', text, re.IGNORECASE)
    return match.group(1).strip() if match else None


def is_noindex(text: str) -> bool:
    match = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\'](.*?)["\']', text, re.IGNORECASE)
    return bool(match and "noindex" in match.group(1).lower())


def public_html_files() -> list[Path]:
    files = []
    for path in ROOT.rglob("*.html"):
        if is_excluded(path):
            continue
        files.append(path)
    return sorted(files)


def url_entry(loc: str, lastmod: str, alternates: Iterable[str] = ()) -> str:
    alt_links = "".join(
        f'\n    <xhtml:link rel="alternate" hreflang="{locale}" href="{href}" />'
        for locale, href in alternates
    )
    return (
        "  <url>\n"
        f"    <loc>{loc}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>{alt_links}\n"
        "  </url>"
    )


def write_sitemap_index() -> None:
    generated = iso_date(ROOT / "index.html")
    body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for key in ("pages", "en", "ko", "ja", "zh"):
        filename = SITEMAP_FILES[key].name
        body.extend(
            [
                "  <sitemap>",
                f"    <loc>{BASE_URL}/{filename}</loc>",
                f"    <lastmod>{generated}</lastmod>",
                "  </sitemap>",
            ]
        )
    body.append("</sitemapindex>")
    SITEMAP_FILES["index"].write_text("\n".join(body) + "\n", encoding="utf-8")


def write_urlset(path: Path, urls: list[str], locale: str | None = None) -> None:
    body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for route in urls:
        source_path = route_to_file(route)
        lastmod = iso_date(source_path)
        loc = f"{BASE_URL}{route}" if locale in (None, "en") else f"{BASE_URL}{route}?lang={locale}"
        alternates = []
        if route in I18N_READY:
            alternates = [
                ("en", f"{BASE_URL}{route}"),
                ("ko", f"{BASE_URL}{route}?lang=ko"),
                ("ja", f"{BASE_URL}{route}?lang=ja"),
                ("zh", f"{BASE_URL}{route}?lang=zh"),
                ("x-default", f"{BASE_URL}{route}"),
            ]
        body.append(url_entry(loc, lastmod, alternates))
    body.append("</urlset>")
    path.write_text("\n".join(body) + "\n", encoding="utf-8")


def route_to_file(route: str) -> Path:
    if route == "/":
        return ROOT / "index.html"
    if route.endswith("/"):
        return ROOT / route.lstrip("/") / "index.html"
    return ROOT / route.lstrip("/")


def build_inventory() -> list[dict]:
    inventory = []
    for path in public_html_files():
        text = read_text(path)
        route = normalize_route(path)
        inventory.append(
            {
                "path": path,
                "route": route,
                "lang": get_lang(text) or "unknown",
                "noindex": is_noindex(text),
                "i18n_ready": route in I18N_READY,
            }
        )
    return inventory


def write_todo(inventory: list[dict]) -> None:
    DOCS.mkdir(parents=True, exist_ok=True)
    buckets: dict[str, list[str]] = defaultdict(list)

    for item in inventory:
        route = item["route"]
        if item["noindex"]:
            status = "transactional_noindex"
        elif route in FULLY_LOCALIZED_ROUTES:
            status = "localized_toggle_live"
        elif route in PARTIAL_TRANSLATION_ROUTES:
            status = "partial_translation_live"
        elif item["lang"] == "en":
            status = "english_default_toggle_backlog"
        else:
            status = "needs_english_default_and_toggle"
        buckets[status].append(route)

    lines = [
        "# PURE-FLON I18N Rollout TODO",
        "",
        "## 라운드명",
        "",
        "PURE-FLON sitemap + multilingual rollout adjudication",
        "",
        "## 단일 목표",
        "",
        "영어 기본 사이트 구조를 유지하면서, `ko`, `ja`, `zh` 전환 경로와 사이트맵 lineage를 닫는다.",
        "",
        "## 절대 제약",
        "",
        "- noindex 트랜잭션 페이지를 public sitemap에 섞지 않는다.",
        "- 번역이 준비되지 않은 페이지를 `localized_ready`로 오판하지 않는다.",
        "- 게임/툴/블로그 bulk content를 hand-wave 하지 않는다.",
        "",
        "## Current Counts",
        "",
        f"- total_public_html: `{len(inventory)}`",
        f"- localized_toggle_live: `{len(buckets['localized_toggle_live'])}`",
        f"- partial_translation_live: `{len(buckets['partial_translation_live'])}`",
        f"- english_default_toggle_backlog: `{len(buckets['english_default_toggle_backlog'])}`",
        f"- needs_english_default_and_toggle: `{len(buckets['needs_english_default_and_toggle'])}`",
        f"- transactional_noindex: `{len(buckets['transactional_noindex'])}`",
        "",
    ]

    for status in (
        "localized_toggle_live",
        "partial_translation_live",
        "english_default_toggle_backlog",
        "needs_english_default_and_toggle",
        "transactional_noindex",
    ):
        lines.append(f"## {status}")
        lines.append("")
        if not buckets[status]:
            lines.append("- none")
        else:
            for route in buckets[status]:
                lines.append(f"- `{route}`")
        lines.append("")

    lines.extend(
        [
            "## 최종 계약",
            "",
            "- locale toggle, sitemap index, locale sitemap, TODO inventory가 닫히면 `confirm / close`",
            "- locale drift, sitemap drift, untranslated backlog 오판이 남으면 `reopen / escalate`",
            "",
        ]
    )

    TODO_FILE.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    inventory = build_inventory()
    public_indexable_routes = [item["route"] for item in inventory if not item["noindex"]]
    i18n_routes = [route for route in public_indexable_routes if route in I18N_READY]

    write_sitemap_index()
    write_urlset(SITEMAP_FILES["pages"], public_indexable_routes)
    write_urlset(SITEMAP_FILES["en"], public_indexable_routes, "en")
    write_urlset(SITEMAP_FILES["ko"], i18n_routes, "ko")
    write_urlset(SITEMAP_FILES["ja"], i18n_routes, "ja")
    write_urlset(SITEMAP_FILES["zh"], i18n_routes, "zh")
    write_todo(inventory)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
