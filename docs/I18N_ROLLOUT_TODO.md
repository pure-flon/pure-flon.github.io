# PURE-FLON I18N Rollout TODO

## 라운드명

PURE-FLON sitemap + multilingual rollout adjudication

## 단일 목표

영어 기본 사이트 구조를 유지하면서, `ko`, `ja`, `zh` 전환 경로와 사이트맵 lineage를 닫는다.

## 절대 제약

- noindex 트랜잭션 페이지를 public sitemap에 섞지 않는다.
- 번역이 준비되지 않은 페이지를 `localized_ready`로 오판하지 않는다.
- 게임/툴/블로그 bulk content를 hand-wave 하지 않는다.

## Latest Verification

- verified_at_utc: `2026-04-03T15:20:40.523322+00:00`
- i18n_report_path: `/tmp/pure_flon_i18n_marketing_run_latest.md`
- i18n_hard_gaps: `none`
- i18n_verdict: `confirm / close`
- b2b_hard_gaps_tracked_separately:
  - `quote_hub_products_hub_link_missing`
  - `quote_request_products_hub_link_missing`

## Current Counts

- total_public_html: `76`
- localized_toggle_live: `8`
- partial_translation_live: `6`
- english_default_toggle_backlog: `60`
- needs_english_default_and_toggle: `0`
- transactional_noindex: `2`

## localized_toggle_live

- `/blog/korean-honorifics-guide/`
- `/`
- `/products/esd-pfa-tube/`
- `/products/`
- `/products/pfa-tube/`
- `/products/ptfe-tube/`
- `/quote/`
- `/saas/ai-ops-autopilot/`

## partial_translation_live

- `/company/about.html`
- `/games/k-meme-quiz/`
- `/products/chemical.html`
- `/products/medical.html`
- `/products/semiconductor.html`
- `/quote/request.html`

## english_default_toggle_backlog

- `/blog/ai-crypto-trading-tools-2026/`
- `/blog/best-crypto-tax-software-2026/`
- `/blog/best-free-dev-tools-2026/`
- `/blog/best-pomodoro-timer-2026/`
- `/blog/bitcoin-dca-strategy/`
- `/blog/bitcoin-halving-history/`
- `/blog/free-crypto-apis-developers-2026/`
- `/blog/free-crypto-portfolio-trackers-2026/`
- `/blog/how-ai-guesses-in-4-questions/`
- `/blog/how-to-build-ai-trading-system/`
- `/blog/`
- `/blog/india-tech-culture/`
- `/blog/ptfe-vs-peek-vs-pfa/`
- `/blog/ptfe-vs-teflon/`
- `/blog/python-crypto-trading-libraries-2026/`
- `/blog/top-10-korean-foods-foreigners-love/`
- `/games/ai-or-human/`
- `/games/capital-city-quiz/`
- `/games/`
- `/games/india-tech-culture/`
- `/games/twenty-questions/`
- `/games/world-flag-quiz/africa/`
- `/games/world-flag-quiz/americas/`
- `/games/world-flag-quiz/asia/`
- `/games/world-flag-quiz/europe/`
- `/games/world-flag-quiz/hardest-flags/`
- `/games/world-flag-quiz/`
- `/games/world-flag-quiz/oceania/`
- `/saas/`
- `/tools/base64/decode/`
- `/tools/base64/`
- `/tools/color-palette/`
- `/tools/color-palette/tailwind/`
- `/tools/color-palette/vs-coolors/`
- `/tools/compound-interest-calculator/annually/`
- `/tools/compound-interest-calculator/daily/`
- `/tools/compound-interest-calculator/`
- `/tools/compound-interest-calculator/monthly/`
- `/tools/crypto-profit-calculator/bitcoin/`
- `/tools/crypto-profit-calculator/ethereum/`
- `/tools/crypto-profit-calculator/`
- `/tools/dca-calculator/bitcoin/`
- `/tools/dca-calculator/ethereum/`
- `/tools/dca-calculator/`
- `/tools/`
- `/tools/json-formatter/api-response/`
- `/tools/json-formatter/`
- `/tools/json-formatter/vs-jsonlint/`
- `/tools/password-generator/`
- `/tools/password-generator/strong-password/`
- `/tools/pomodoro/`
- `/tools/pomodoro/technique/`
- `/tools/pomodoro/vs-forest/`
- `/tools/position-size-calculator/crypto/`
- `/tools/position-size-calculator/forex/`
- `/tools/position-size-calculator/`
- `/tools/position-size-calculator/stocks/`
- `/tools/qr-generator/`
- `/tools/qr-generator/vs-qrcode-monkey/`
- `/tools/qr-generator/wifi/`

## needs_english_default_and_toggle

- none

## transactional_noindex

- `/quote/payment.html`
- `/quote/thank-you.html`

## 최종 계약

- locale toggle, sitemap index, locale sitemap, TODO inventory가 닫히면 `confirm / close`
- locale drift, sitemap drift, untranslated backlog 오판이 남으면 `reopen / escalate`
