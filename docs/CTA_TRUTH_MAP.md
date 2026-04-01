# CTA Truth Map

Last updated: 2026-03-31

Runtime mode: `github-pages-static`

## Launch Surface States

| Surface | CTA | State | Destination |
| --- | --- | --- | --- |
| `/` | status chips/cards | `fallback` | runtime-truth messaging only (no live SLA claims) |
| `/saas/ai-ops-autopilot/` hero + pricing CTA | `fallback` | `/quote/?source_surface=saas&source_page=ai-ops-autopilot&cta_type=waitlist&plan=*` |
| `/saas/ai-ops-autopilot/` starter/growth checkout | `disabled` | Stripe placeholder removed, waitlist intake used |
| `/saas/ai-ops-autopilot/` enterprise CTA | `fallback` | `/quote/` sales intake |
| `/products/*` primary CTA | `fallback` | `/quote/?source_surface=products&source_page=*` |
| `/quote/` | `live` | Formspree-based lead capture + thank-you routing |

## Guardrails

- CI gate: `npm run check:runtime` enforces forbidden claim markers and required fallback markers.
- If checkout links become live, update runtime policy first, then update this map and the kill-switch rules in `scripts/check_live_runtime.py`.
