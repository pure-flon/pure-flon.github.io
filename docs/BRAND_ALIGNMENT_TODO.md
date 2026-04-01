# PURE-FLON Brand Alignment TODO

## Round
Brand alignment, logo unification, and quote-surface shell parity

## Objective
Use the drive-provided PURE-FLON logo as the single visible brand mark, remove residual background artifacts from the asset, and close the visual gap between the live product hub and the live quote surfaces.

## Absolute Constraints
- The supplied logo at `/Users/ben/Downloads/pure-flon-drive-logos/logo.png` is the source of truth for this round.
- Residual pale backdrop pixels inside the transparent logo asset must be removed, not ignored.
- `products` and `quote` must read as one B2B system, not two unrelated websites.
- Existing live form actions, routing, and SEO-critical URLs must remain intact.
- Long-tail pages may be deferred only if the primary B2B surfaces are first brought into parity.

## Non-goals
- No infra, hosting, or payment-flow redesign.
- No speculative copy rewrite beyond what is needed for shell parity and truthful CTA language.
- No forced closure on long-tail pages without visible evidence.

## Current Suspicion Points
- The current source logo still contains low-alpha pale backdrop pixels that create a faint rectangle around the blue mark.
- Visible logo usage is split across `logo.png`, `logo.svg`, `logo-white.svg`, and text-only wordmarks.
- `/products/` is a premium dark product surface, while `/quote/` is still a flatter generic form page.
- `/quote/request.html` is yet another older shell, so the buyer journey changes tone midstream.

## Current Status Snapshot
- `done`: cleaned the drive-provided logo and replaced the primary repo asset at `/Users/ben/github/pure-flon.github.io/images/logo.png`
- `done`: generated canonical reusable variants at `/Users/ben/github/pure-flon.github.io/images/brand/logo-wide.png` and `/Users/ben/github/pure-flon.github.io/images/brand/logo-square.png`
- `done`: moved `/products/`, `/products/pfa-tube/`, `/products/esd-pfa-tube/`, `/products/ptfe-tube/` from text-only brand lockups to the image logo
- `done`: aligned `/quote/` and `/quote/request.html` to the same dark premium shell family as `/products/`
- `done`: removed direct visible `logo.svg` / `logo-white.svg` usage on `about` and customer portal surfaces
- `remaining`: some docs still mention the old `logo.svg` asset path
- `remaining`: product pages still contain dead `header__brand-name` / `footer__brand-name` CSS that is now unused

## Top-level Adjudication Questions
- Is the drive-provided logo now the canonical visible brand mark across the primary B2B surfaces?
- Does the live quote hub now feel like a continuation of the product hub rather than a different property?
- Are remaining mismatches explicitly tracked instead of silently left behind?

## Track 1
Asset truth and cleanup

- Exact scope:
  Clean the supplied logo, overwrite the repo's primary logo asset, and generate reusable brand variants for header/footer and OG use.
- Required files:
  - `/Users/ben/Downloads/pure-flon-drive-logos/logo.png`
  - `/Users/ben/github/pure-flon.github.io/images/logo.png`
  - `/Users/ben/github/pure-flon.github.io/images/brand/logo-wide.png`
  - `/Users/ben/github/pure-flon.github.io/images/brand/logo-square.png`
- Required evidence:
  - pixel-level confirmation that pale background artifacts were removed
  - visible browser confirmation on primary B2B pages
- Mandatory verdict categories:
  - `cleaned`
  - `not_cleaned`
  - `reopen / escalate`
- Must not be hand-waved:
  - "transparent enough"
  - "looks fine in browser"

## Track 2
Primary B2B shell parity

- Exact scope:
  Align `/products/`, `/quote/`, and `/quote/request.html` so the header, hero tone, CTA language, footer, and brand treatment clearly belong to one product-led B2B surface.
- Required files:
  - `/Users/ben/github/pure-flon.github.io/products/index.html`
  - `/Users/ben/github/pure-flon.github.io/products/pfa-tube/index.html`
  - `/Users/ben/github/pure-flon.github.io/products/esd-pfa-tube/index.html`
  - `/Users/ben/github/pure-flon.github.io/products/ptfe-tube/index.html`
  - `/Users/ben/github/pure-flon.github.io/quote/index.html`
  - `/Users/ben/github/pure-flon.github.io/quote/request.html`
- Required evidence:
  - desktop screenshots of `/products/`, `/quote/`, `/quote/request.html`
  - verification that live RFQ actions are unchanged
- Mandatory verdict categories:
  - `aligned`
  - `partially_aligned`
  - `reopen / escalate`
- Must not be hand-waved:
  - "same vibe"
  - "close enough"
  - "shares the same nav"

## Track 3
Long-tail logo parity

- Exact scope:
  Replace non-canonical visible logo references on directly customer-facing pages where the old SVG or white SVG still appears.
- Required files:
  - `/Users/ben/github/pure-flon.github.io/company/about.html`
  - `/Users/ben/github/pure-flon.github.io/customer/login.html`
  - `/Users/ben/github/pure-flon.github.io/customer/customer-portal-dashboard.html`
  - `/Users/ben/github/pure-flon.github.io/customer/portal/dashboard.html`
- Required evidence:
  - markup inventory showing old paths removed or explicitly deferred
- Mandatory verdict categories:
  - `unified`
  - `deferred_with_evidence`
  - `reopen / escalate`
- Must not be hand-waved:
  - "rarely visited"
  - "internal anyway"

## Success Criteria
- The primary logo asset is the cleaned drive logo with no residual visible backdrop.
- `/quote/` and `/quote/request.html` read as the same brand system as `/products/`.
- The product hub and detail pages use the same image logo family instead of a separate text-only lockup.
- A concrete TODO inventory exists for any remaining long-tail pages not fully brought into parity.

## Blocked / Forbidden Actions
- Do not change live form endpoints.
- Do not change canonical URLs to hide visual inconsistency.
- Do not close the round based on code-only confidence without screenshots.
- Do not keep mixed logo systems unless explicitly marked as deferred.

## Verdict Contract
- `confirm / close`: logo cleaned, core B2B shell parity achieved, remaining long-tail drift explicitly inventoried
- `reopen / escalate`: any primary B2B surface still reads as a different brand system or residual asset background remains
