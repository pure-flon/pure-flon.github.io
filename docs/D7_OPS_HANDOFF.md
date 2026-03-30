# D7 운영 핸드오프 — PURE-FLON ESD PFA 판매체계

> ORDER-050 최종 단계 | 작성일: 2026-03-30 | PM: OpenClaw

---

## 1. Vercel 환경변수 설정 (Ben 필수 — 5~15분)

Vercel 대시보드 → Settings → Environment Variables 에서 아래 변수를 추가하세요.

| 변수명 | 용도 | 우선순위 | 어디서 발급 |
|--------|------|----------|------------|
| `OPENAI_API_KEY` | 챗봇 (GPT-4o mini RAG) | **P0 (챗봇 없이 작동 안 함)** | platform.openai.com → API Keys |
| `STRIPE_SECRET_KEY` | Stripe 결제 API | P0 (결제 기능) | dashboard.stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe 웹훅 서명 검증 | P0 (결제 기능) | Stripe → Webhooks → 웹훅 생성 후 발급 |
| `RESEND_API_KEY` | 이메일 알림 발송 | P0 (알림 기능) | resend.com → API Keys |
| `FROM_EMAIL` | 발신 이메일 | P0 | `noreply@pure-flon.com` 입력 |
| `TO_EMAIL` | 수신 이메일 | P0 | `contact@pure-flon.com` 입력 |
| `DHL_API_KEY` | DHL Express 운임 조회 | P1 (배송 견적) | developer.dhl.com → API Key 발급 |
| `DHL_ACCOUNT_NUMBER` | DHL 계정 번호 | P1 | DHL 계약 후 발급 |
| `DHL_SANDBOX` | DHL 샌드박스 모드 | P1 | `false` 입력 (운영환경) |
| `SUPABASE_URL` | DB URL | P1 (견적 저장) | supabase.com → Project Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 서비스키 | P1 | supabase.com → Project Settings |

### Stripe Webhook 엔드포인트 등록

Stripe 대시보드 → Developers → Webhooks → Add endpoint:
- URL: `https://pure-flon.com/api/quotes/payment-webhook`
- 이벤트: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

---

## 2. 네이버 스마트스토어 등록 (Ben 직접 — 30~60분)

상세 패키지: `docs/SMARTSTORE_UPLOAD_PACKAGE.md`

**7단계 체크리스트:**
1. [ ] 스마트스토어 판매자 센터 로그인 → 상품 등록
2. [ ] 상품 1: ESD PFA 튜브 (문서 참조)
3. [ ] 상품 2: PFA 튜브 (문서 참조)
4. [ ] 상품 3: PTFE 튜브 (문서 참조)
5. [ ] 속성 매핑: 소재/색상/사이즈/용도 항목 입력
6. [ ] 배송정책: 구매자 배송(EXW) 설정
7. [ ] 상품 게시 → URL 확인

---

## 3. QA 결과 (2026-03-30)

### PASS ✅
| 항목 | 결과 |
|------|------|
| 핵심 정적 파일 (index, 404, robots, sitemap, favicon) | ✅ 전체 존재 |
| 상품 페이지 3종 (/products/esd-pfa-tube, pfa-tube, ptfe-tube) | ✅ 전체 존재 |
| 견적 폼 (/quote/request.html) | ✅ GA4 + generate_lead 이벤트 포함 |
| 결제 플로우 (/quote/payment.html) | ✅ GA4 포함 |
| API 엔드포인트 10개 (quotes, chat, shipping) | ✅ vercel.json 등록 완료 |
| GA4 상품 페이지 3종 | ✅ view_item + generate_lead CTA 클릭 이벤트 |
| chatbot widget (chat-widget.js) | ✅ 216 lines |
| CNAME (pure-flon.com) | ✅ |
| CSP 헤더 (구글 애널리틱스 허용) | ✅ |
| Vercel regions (icn1, nrt1, hnd1, sin1) | ✅ 아시아/글로벌 커버리지 |

### 차단 해제 대기 ⚠️
| 항목 | 상태 | 담당 |
|------|------|------|
| Vercel 환경변수 추가 | ❌ 미설정 | Ben (5~15분) |
| 챗봇 동작 (OPENAI_API_KEY 없음) | ⚠️ 오류 반환 | Ben 환경변수 설정 후 해결 |
| 이메일 알림 (RESEND_API_KEY 없음) | ⚠️ 오류 반환 | Ben 환경변수 설정 후 해결 |
| 스마트스토어 등록 | ❌ 미등록 | Ben (30~60분) |

---

## 4. GA4 전환 추적 구조

### 추적 이벤트 맵

```
사용자 여정                    GA4 이벤트
─────────────────────────────────────────────────
상품 페이지 접속           →  page_view (자동)
                           →  view_item (esd-pfa-tube / pfa-tube / ptfe-tube)
"Request a Quote" 클릭    →  generate_lead (product_id 포함)
견적 폼 제출              →  quote_submitted + generate_lead (product_type 포함)
결제 페이지 도달          →  page_view (자동)
결제 완료                 →  purchase (향후 Stripe webhook → gtag 연동 확장 가능)
```

### GA4 대시보드에서 확인

- Reports → Engagement → Events → `view_item`, `generate_lead`, `quote_submitted`
- Reports → Acquisition → Traffic acquisition (어떤 채널에서 리드가 오는지)
- GA4 Property ID: `G-WE091T20M0`

---

## 5. 운영 주간 체크리스트

매주 월요일:
- [ ] GA4 지난 7일 `generate_lead` 수 확인
- [ ] contact@pure-flon.com 견적 이메일 확인 + 응답 (24h SLA)
- [ ] Stripe 대시보드 결제 내역 확인
- [ ] 챗봇 로그 이상 없는지 확인 (Vercel Functions Logs)

---

## 6. 주요 URL 정리

| 페이지 | URL |
|--------|-----|
| 홈 | https://pure-flon.com |
| ESD PFA 상품 | https://pure-flon.com/products/esd-pfa-tube/ |
| PFA 상품 | https://pure-flon.com/products/pfa-tube/ |
| PTFE 상품 | https://pure-flon.com/products/ptfe-tube/ |
| 견적 요청 | https://pure-flon.com/quote/request.html |
| 결제 안내 | https://pure-flon.com/quote/payment.html |

---

## 7. 에스컬레이션

장애 발생 시:
1. Vercel 대시보드 → Functions → Logs 확인
2. GA4 Realtime 확인
3. contact@pure-flon.com 이메일 알림 수신 여부 확인
4. OpenClaw PM에 보고

---

_D7 완료 — ORDER-050 전체 파이프라인 완성 (2026-03-30)_
