# PURE-FLON Address Automation TODO

## Round
PURE-FLON 주소, 경로, 링크, 약점 감시 자동화

## Objective
`pure-flon.com`의 주소 체계, 경로 무결성, 브랜드 일관성, B2B 전환 경로에서 새 약점이 생기면 시간당 탐지하고, 안전한 범위는 즉시 수정하며, 위험하거나 애매한 건 증거와 함께 남긴다.

## Absolute Constraints
- 제품 허브와 견적 허브의 live URL은 canonical truth로 본다.
- `contact@pure-flon.com`과 실제 RFQ 경로를 깨는 변경은 금지한다.
- 폼 액션, 결제 경로, 인프라, 배포 설정은 자동 수정 대상이 아니다.
- GOV/FACTORY 또는 AURORA 쪽 기존 cron 실행을 중복 호출하지 않는다.

## Non-goals
- 결제 시스템 재설계
- 인프라 마이그레이션
- 전면 카피 재작성

## Current Suspicion Points
- 새 디자인 패스 이후에도 route drift, canonical drift, hreflang drift, broken link가 다시 생길 수 있다.
- 로고/브랜드 자산 통일 후에도 long-tail 페이지가 예전 자산이나 예전 shell로 회귀할 수 있다.
- `products -> quote -> quote/request` 체인은 다시 분리되기 쉬운 경로다.
- sitemap, internal links, CTA truth는 수동 수정 후 다시 어긋나기 쉽다.

## Top-level Adjudication Questions
1. 주요 B2B 경로가 여전히 `200` 또는 기대한 `301`로 닫히는가?
2. canonical, hreflang, sitemap, internal-link truth가 어긋났는가?
3. `products`, `quote`, `quote/request`가 여전히 한 브랜드 시스템으로 읽히는가?
4. 새 hard gap이 backlog가 아니라 실제 운영 리스크인가?

## Track 1
Route / address integrity

- scope:
  - `/`
  - `/products/`
  - `/products/esd-pfa-tube/`
  - `/products/pfa-tube/`
  - `/products/ptfe-tube/`
  - `/quote/`
  - `/quote/request.html`
  - `/company/about.html`
- required evidence:
  - `200 / 301 / 404`
  - canonical
  - sitemap inclusion
  - broken internal link 여부
- mandatory verdict:
  - `route_ok`
  - `route_gap`
  - `reopen / escalate`

## Track 2
Brand / shell parity

- scope:
  - product hub
  - product detail 대표 3개
  - quote hub
  - quote request page
- required evidence:
  - header
  - logo asset
  - hero tone
  - CTA lane
  - footer tone
- mandatory verdict:
  - `shell_aligned`
  - `shell_drift`
  - `reopen / escalate`

## Track 3
SEO / i18n truth

- scope:
  - title
  - meta description
  - canonical
  - hreflang
  - sitemap files
- required evidence:
  - exact file path
  - exact route
  - exact mismatch
- mandatory verdict:
  - `seo_truth_ok`
  - `seo_truth_gap`
  - `reopen / escalate`

## Track 4
Safe auto-fix lane

- allowed:
  - HTML link correction
  - canonical / hreflang correction
  - logo asset reference correction
  - safe CSS / shell parity correction
  - TODO / report refresh
- forbidden:
  - form endpoint change
  - payment or checkout behavior change
  - deployment or infra change
  - destructive file cleanup

## Success Criteria
- 주요 B2B 경로에서 hard broken route가 없다.
- canonical / hreflang / sitemap drift가 보고서에 누락 없이 남는다.
- `products`, `quote`, `quote/request`는 한 브랜드 시스템으로 유지된다.
- 새 약점은 `latest report + todo`에 증거와 함께 남고, 안전한 범위는 즉시 수정된다.

## Verdict Contract
- `confirm / close`: hard gap 없이 route, shell, SEO truth가 유지됨
- `reopen / escalate`: broken route, shell drift, canonical drift, stale weak point가 남음
