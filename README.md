# pure-flon.github.io

`pure-flon.github.io` is the live website repository for [pure-flon.com](https://pure-flon.com).

Last updated: 2026-03-30

## Current Site Scope (2026)

This repo is no longer a single PTFE brochure site. It now serves multiple surfaces from one static-first codebase:

- PTFE/PFA product pages and quote/payment flow
- SEO blog content
- Web games
- Utility tools
- SaaS landing page(s)
- Operations handoff documentation (D7)

## Live Surfaces

| Surface | URL | Source Path |
|---|---|---|
| Home | https://pure-flon.com/ | `index.html` |
| Product pages | https://pure-flon.com/products/esd-pfa-tube/ | `products/` |
| Quote flow | https://pure-flon.com/quote/request.html | `quote/` |
| Blog | https://pure-flon.com/blog/ | `blog/` |
| Games | https://pure-flon.com/games/ | `games/` |
| Tools | https://pure-flon.com/tools/ | `tools/` |
| SaaS landing | https://pure-flon.com/saas/ai-ops-autopilot/ | `saas/` |
| Ops handoff doc | (repo doc) | `docs/D7_OPS_HANDOFF.md` |

## Architecture

- Static-first pages built from folder-based HTML entries (`*/index.html`)
- Shared assets in `css/`, `js/`, `images/`
- API handlers in `api/` (quotes, payments, chat, shipping)
- SEO/discovery artifacts at root: `sitemap.xml`, `feed.xml`, `robots.txt`

## Repository Map

```text
.
├── index.html
├── 404.html
├── products/
├── quote/
├── blog/
├── games/
├── tools/
├── saas/
├── company/
├── customer/
├── api/
├── docs/
│   └── D7_OPS_HANDOFF.md
├── css/
├── js/
├── images/
├── sitemap.xml
├── feed.xml
├── robots.txt
└── vercel.json
```

## Local Development

```bash
cd /Users/ben/github/pure-flon.github.io
npm install

# Static preview (recommended)
npm run serve
# http://localhost:8000

# Optional Vite workflow
npm run dev
```

## Deployment

This repository is the production source for `pure-flon.com`.

```bash
git add <changed-files>
git commit -m "content: <what changed>"
git push origin main
```

`main` push triggers the live deployment workflow.

## Content/SEO Guardrails

When adding or editing pages, keep these minimum requirements:

- Unique `<title>`
- Meta description (<=160 chars)
- Open Graph tags
- Canonical URL
- H1 aligned to the target keyword/topic
- Internal links to related pages
- Alt text on all images

## Notes

- Keep docs and content aligned with actual shipped structure.
- Do not treat the old React/Next.js architecture notes as current state.
