# Runtime Truth (BuildOps)

Last updated: 2026-03-31

## Production Runtime Decision

`pure-flon.com` production runtime is currently **GitHub Pages (static hosting)**.

Evidence (2026-03-31 live probe):
- `https://pure-flon.com/` returns `Server: GitHub.com`
- `https://pure-flon.com/api/*` paths return `404`

## Operational Rules

1. Launch surfaces must be truthful for static runtime.
2. Required routes must resolve on static hosting:
   - `/`
   - `/products/`
   - `/quote/`
   - `/saas/ai-ops-autopilot/`
   - `/tools/`
   - `/games/`
3. `/api/*` automation claims are disallowed on launch surfaces while static runtime is active.
4. Lead capture must fall back to non-serverless submission paths.
5. Launch copy must not claim unverified live automation states (for example: `Operational`, `99.9%`, `24/7`, `<60s`, `98%`, `free trial live checkout`).
6. AI Ops launch CTAs must stay in waitlist/sales-intake mode until live checkout is proven.

## Pipeline Checks

Use:

```bash
npm run check:runtime:dry
npm run check:runtime
```

Optional live probe:

```bash
npm run check:runtime:live
```

The deploy pipeline (`.github/workflows/deploy-check.yml`) runs the runtime truth checks before other content gates.

Kill-switch enforcement is built into `scripts/check_live_runtime.py`:
- forbidden launch-surface claim markers fail CI
- required fallback markers (`Join Waitlist`, `cta_type=waitlist`, checkout-not-live helper copy) must be present
