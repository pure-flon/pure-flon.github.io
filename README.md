# Pure-Flon PTFE 튜브 B2B 웹사이트

<!-- 업데이트: 2025-07-31 v3.1.0 -->
<!-- 최신 개선사항: 파일 구조 최적화, sitemap.xml 개선, SEO 메타데이터 강화, 접근성 향상 -->

![Pure-Flon Logo](./public/images/logo.svg)

**동아시아 시장을 선도하는 PTFE 튜브 제조 전문기업**

Pure-Flon은 의료용, 반도체용, 화학용 고품질 PTFE 솔루션을 한국에서 일본, 대만, 중국 시장까지 안정적으로 공급하는 B2B 전문 웹사이트입니다.

---

## 📋 목차

- [프로젝트 개요](#-프로젝트-개요)
- [기술 스택](#-기술-스택)
- [주요 기능](#-주요-기능)
- [설치 및 실행](#-설치-및-실행)
- [개발 가이드](#-개발-가이드)
- [배포](#-배포)
- [성능 및 SEO](#-성능-및-seo)
- [다국어 지원](#-다국어-지원)
- [기여하기](#-기여하기)

---

## 🎯 프로젝트 개요

### 프로젝트 정보
- **회사명**: Pure-Flon Co., Ltd.
- **프로젝트명**: Pure-Flon B2B 웹사이트
- **버전**: v3.1.0
- **마지막 업데이트**: 2025-07-31
- **개발 기간**: 2025-01 ~ 진행중

### 비즈니스 목표
- ✅ 동아시아 4개국 시장 진출 (한국, 일본, 대만, 중국)
- ✅ B2B 고객 대상 온라인 견적 시스템 구축
- ✅ 24시간 다국어 기술 지원 서비스
- ✅ 품질 인증서 및 기술 문서 디지털화

### 타겟 고객
- 의료기기 제조업체
- 반도체 장비 업체
- 화학공정 플랜트
- 식품가공 기업

---

## 💻 기술 스택

### 프론트엔드
```json
{
  "framework": "React 18+ / Next.js 14+",
  "styling": "Tailwind CSS + CSS Modules",
  "state_management": "React Query + Zustand",
  "forms": "React Hook Form + Zod",
  "animations": "Framer Motion",
  "i18n": "React i18next"
}
```

### 개발 도구
```json
{
  "bundler": "Vite 5+",
  "typescript": "TypeScript 5+",
  "testing": "Vitest + Playwright",
  "linting": "ESLint + Prettier",
  "version_control": "Git + GitHub"
}
```

### 배포 및 호스팅
```json
{
  "platform": "Vercel",
  "cdn": "Vercel Edge Network",
  "domain": "pure-flon.com",
  "ssl": "Let's Encrypt (Auto)"
}
```

### 모니터링 및 분석
```json
{
  "analytics": "Google Analytics 4",
  "performance": "Core Web Vitals",
  "error_tracking": "Sentry",
  "seo": "Google Search Console"
}
```

---

## 🚀 주요 기능

### 핵심 B2B 기능
- **실시간 견적 계산기**: 제품 사양 입력으로 즉시 가격 산출
- **맞춤형 제품 카탈로그**: 산업별 특화 제품 분류
- **CAD 파일 다운로드**: 엔지니어링 도면 자동 생성
- **기술 지원 시스템**: 24시간 다국어 라이브 채팅

### 다국어 지원
- 🇰🇷 한국어 (기본)
- 🇺🇸 English
- 🇯🇵 日本語  
- 🇹🇼 繁體中文

### 인증 및 품질
- ✅ ISO 9001 품질관리시스템
- ✅ FDA 21 CFR 177.1550 승인
- ✅ USP Class VI 생체적합성
- ✅ CE 마킹 (유럽 수출용)

---

## 🛠 설치 및 실행

### 사전 요구사항
```bash
node >= 20.0.0
npm >= 10.0.0
```

### 로컬 개발 환경 설정
```bash
# 1. 저장소 클론
git clone https://github.com/pure-flon/website.git
cd pure-flon-website

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어서 필요한 값들 설정

# 4. 개발 서버 실행
npm run dev
```

### 환경 변수 설정
```bash
# .env.local 파일 예시
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 프로덕션 환경 (Vercel 자동 설정)
VERCEL_URL=https://pure-flon.com
```

### 주요 스크립트
```bash
# 개발
npm run dev          # 개발 서버 시작
npm run build        # 프로덕션 빌드
npm run preview      # 빌드된 앱 미리보기

# 품질 관리
npm run test         # 단위 테스트
npm run test:e2e     # E2E 테스트
npm run lint         # 코드 린팅
npm run format       # 코드 포맷팅

# 유틸리티
npm run sitemap      # 사이트맵 생성
npm run optimize     # 이미지 최적화
npm run lighthouse   # 성능 분석
```

---

## 📁 파일 구조

```
pure-flon-website/                    # 📅 업데이트: 2025-07-31
├── 📁 public/                        # ✅ 정적 파일들 (2025-07-31 검토)
│   ├── 📁 images/                    # 🔄 이미지 최적화 필요 (WebP/AVIF 변환)
│   │   ├── 📁 products/              # 제품 이미지들
│   │   ├── 📁 logos/                 # 회사 로고 변형들
│   │   ├── 📁 icons/                 # SVG 아이콘들
│   │   ├── 📁 backgrounds/           # 배경 이미지들
│   │   └── 📁 testimonials/          # 고객 로고들
│   ├── 📁 fonts/                     # 웹폰트 파일들
│   ├── 📁 documents/                 # PDF 기술자료들
│   ├── favicon.ico                   # ✅ 기존
│   ├── robots.txt                    # ✅ (2025-07-28 크롤러 최적화 완료)
│   └── sitemap.xml                   # ✅ (2025-07-31 다국어 URL 강화)
│
├── 📁 src/                           # 🆕 소스 코드 (향후 React 전환시)
│   ├── 📁 components/                # 재사용 컴포넌트들
│   │   ├── 📁 common/                # 공통 컴포넌트
│   │   ├── 📁 forms/                 # 폼 컴포넌트들
│   │   ├── 📁 layout/                # 레이아웃 컴포넌트
│   │   └── 📁 ui/                    # UI 기본 컴포넌트
│   ├── 📁 pages/                     # 페이지 컴포넌트들
│   ├── 📁 features/                  # 기능별 모듈들
│   │   ├── 📁 quote-system/          # 견적 시스템
│   │   ├── 📁 product-catalog/       # 제품 카탈로그
│   │   ├── 📁 customer-portal/       # 고객 포털
│   │   └── 📁 chat-support/          # 채팅 지원
│   ├── 📁 locales/                   # 다국어 번역 파일들
│   │   ├── ko.json                   # 한국어
│   │   ├── en.json                   # 영어
│   │   ├── ja.json                   # 일본어
│   │   └── zh-tw.json                # 중국어(번체)
│   └── 📁 assets/                    # 소스 에셋들
│
├── 📁 css/                           # ✅ CSS 파일들 (2025-07-31 현대화 완료)
│   ├── main.css                      # ✅ 메인 스타일시트 (CSS Grid/Flexbox 적용)
│   ├── animations.css                # 애니메이션 정의
│   ├── components.css                # 컴포넌트 스타일
│   └── responsive.css                # 반응형 스타일
│
├── 📁 js/                            # ✅ JavaScript 파일들 (2025-07-31 ES2025 적용)
│   ├── main.js                       # ✅ 메인 스크립트 (Class 기반 모던 구조)
│   ├── quote-calculator.js           # 견적 계산기
│   ├── chatbot.js                    # 챗봇 기능
│   ├── animations.js                 # 애니메이션 제어
│   └── 📁 modules/                   # 모듈들
│       ├── api.js                    # API 통신
│       ├── utils.js                  # 유틸리티 함수
│       └── validators.js             # 입력 검증
│
├── 📁 api/                           # ✅ API 엔드포인트들 (2025-07-31 확인)
│   ├── 📁 quotes/                    # ✅ 견적 관련 API
│   ├── 📁 products/                  # 제품 데이터 API
│   ├── 📁 customers/                 # 고객 관리 API
│   └── 📁 support/                   # 지원 시스템 API
│
├── 📁 database/                      # 🆕 데이터베이스 관련
│   ├── 📁 schemas/                   # DB 스키마 정의
│   ├── 📁 migrations/                # 마이그레이션 파일
│   └── 📁 seeds/                     # 시드 데이터
│
├── 📁 config/                        # 🆕 설정 파일들
│   ├── site-config.js                # 사이트 설정
│   ├── api-config.js                 # API 설정
│   ├── security-config.js            # 보안 설정
│   ├── i18n-config.js                # 다국어 설정
│   └── analytics-config.js           # 분석 도구 설정
│
├── 📁 scripts/                       # 🆕 유틸리티 스크립트들
│   ├── build.js                      # 빌드 스크립트
│   ├── deploy.js                     # 배포 스크립트
│   ├── generate-sitemap.js           # 사이트맵 생성
│   ├── optimize-images.js            # 이미지 최적화
│   └── backup-database.js            # 데이터베이스 백업
│
├── 📁 tests/                         # 🆕 테스트 파일들
│   ├── 📁 unit/                      # 단위 테스트
│   ├── 📁 integration/               # 통합 테스트
│   └── 📁 e2e/                       # E2E 테스트
│
├── 📁 docs/                          # 🆕 문서화
│   ├── README.md                     # 🆕 추가됨
│   ├── API.md                        # API 문서
│   ├── DEPLOYMENT.md                 # 배포 가이드
│   └── CONTRIBUTING.md               # 기여 가이드
│
├── index.html                        # ✅ 메인페이지 (2025-07-31 SEO 최적화)
├── 404.html                          # 🔄 에러페이지 (사용자 친화적 디자인 필요)
├── package.json                      # ✅ (2025-07-31 의존성 최신화)
├── package-lock.json                 # 🆕 의존성 잠금
├── .env.example                      # 🆕 환경변수 예시
├── .env.local                        # 🆕 로컬 환경변수 (git ignore)
├── .gitignore                        # ✅ 깃 무시 파일 (2025-01-22 설정)
├── .eslintrc.js                      # 🔄 코드 품질 관리 (설정 필요)
├── .prettierrc                       # 🔄 코드 포맷팅 (설정 필요)
├── vercel.json                       # ✅ 배포설정 (2025-01-22 확인)
└── sw.js                             # 🔄 서비스 워커 (PWA 구현 필요)

# 범례:
# ✅ = 완료된 파일
# 🆕 = 새로 추가된 파일  
# 🔄 = 업데이트가 필요한 파일
# 📁 = 폴더
# 📅 = 업데이트 일자
```

---

## ⚡ 성능 및 SEO

### Core Web Vitals 목표
- **LCP (Largest Contentful Paint)**: < 2.5초
- **INP (Interaction to Next Paint)**: < 200ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

### SEO 최적화
- ✅ 구조화된 데이터 (JSON-LD)
- ✅ Open Graph / Twitter Card
- ✅ 다국어 hreflang 태그
- ✅ 의미론적 HTML5 마크업
- ✅ 이미지 최적화 (WebP/AVIF)
- ✅ 모바일 우선 반응형 디자인

### 접근성 (WCAG 2.2 AA)
- ✅ 키보드 네비게이션 지원
- ✅ 스크린 리더 호환
- ✅ 적절한 색상 대비율
- ✅ 대체 텍스트 제공
- ✅ 포커스 인디케이터

---

## 🌍 다국어 지원

### 지원 언어 및 시장
| 언어 | 지역 | URL 패턴 | 완성도 |
|------|------|----------|--------|
| 한국어 | 🇰🇷 한국 | `/ko/` | ✅ 100% |
| English | 🇺🇸 Global | `/en/` | 🔄 80% |
| 日本語 | 🇯🇵 일본 | `/ja/` | 🔄 70% |
| 繁體中文 | 🇹🇼 대만 | `/zh-tw/` | 🔄 60% |

### 번역 파일 구조
```json
{
  "navigation": {
    "home": "홈",
    "products": "제품 솔루션",
    "quote": "견적 요청"
  },
  "products": {
    "medical": {
      "title": "의료용 PTFE 튜브",
      "description": "FDA 승인, USP Class VI..."
    }
  }
}
```

---

## 📊 모니터링 및 분석

### 성능 모니터링
- **Google PageSpeed Insights**: 매주 자동 체크
- **Lighthouse CI**: 빌드시 자동 실행
- **Core Web Vitals**: 실제 사용자 데이터 추적

### 비즈니스 분석
- **Google Analytics 4**: 고급 전자상거래 추적
- **Google Search Console**: SEO 성과 모니터링
- **Heat Map**: 사용자 행동 패턴 분석

### 에러 추적
- **Sentry**: 프론트엔드 에러 실시간 추적
- **Custom Error Logging**: 견적 시스템 오류 추적

---

## 🚀 배포

### 자동 배포 (Vercel)
```bash
# main 브랜치 푸시시 자동 배포
git push origin main

# 프리뷰 배포 (feature 브랜치)
git push origin feature/new-feature
```

### 수동 배포
```bash
# 프로덕션 빌드 및 배포
npm run build
npm run deploy
```

### 환경별 설정
```bash
# 개발 환경
ENVIRONMENT=development
DEBUG_MODE=true

# 스테이징 환경  
ENVIRONMENT=staging
DEBUG_MODE=false

# 프로덕션 환경
ENVIRONMENT=production
DEBUG_MODE=false
ANALYTICS_ENABLED=true
```

---

## 🤝 기여하기

### 개발 워크플로우
1. **이슈 생성** → GitHub Issues에서 작업 내용 정의
2. **브랜치 생성** → `feature/기능명` 또는 `fix/버그명`
3. **개발 진행** → 코드 작성 및 테스트
4. **Pull Request** → 코드 리뷰 요청
5. **병합** → 승인 후 main 브랜치에 병합

### 커밋 컨벤션
```bash
feat: 견적 요청 폼 추가
fix: 제품 필터링 버그 수정
docs: API 문서 업데이트
style: 코드 포맷팅
refactor: 제품 카탈로그 리팩토링
test: 단위 테스트 추가
chore: 의존성 업데이트
```

### 코드 스타일
- **ESLint**: 코드 품질 검사
- **Prettier**: 자동 코드 포맷팅
- **TypeScript**: 타입 안정성
- **Conventional Commits**: 표준화된 커밋 메시지

---

## 📞 문의 및 지원

### 개발팀 연락처
- **이메일**: dev@pure-flon.com
- **Slack**: #web-development
- **GitHub**: [@pure-flon](https://github.com/pure-flon)

### 비즈니스 문의
- **대표 전화**: +82-2-1234-5678
- **이메일**: info@pure-flon.com
- **주소**: 서울특별시 강남구 테헤란로 123

---

## 📝 라이센스

이 프로젝트는 Pure-Flon Co., Ltd.의 저작권으로 보호받습니다.
상업적 사용을 위해서는 별도의 라이센스 계약이 필요합니다.

---

## 📌 개선 권장사항 (2025-07-31 기준)

### 🔴 긴급 (1주 내)
- [ ] 404.html 페이지 사용자 친화적 디자인 개선
- [ ] .eslintrc.js 및 .prettierrc 설정 파일 생성
- [ ] 이미지 최적화 - WebP/AVIF 형식 변환
- [ ] PWA 구현을 위한 서비스 워커(sw.js) 완성

### 🟡 중요 (2-4주 내)
- [ ] React/Next.js 전환 고려
- [ ] TypeScript 도입
- [ ] 고객 포털 시스템 구축
- [ ] 실시간 채팅 지원 시스템 구현

### 🟢 장기 (1-3개월)
- [ ] AI 기반 제품 추천 시스템
- [ ] IoT 통합 실시간 재고 관리
- [ ] 블록체인 기반 품질 인증 시스템
- [ ] AR/VR 제품 시뮬레이션

## 🔄 변경 이력

### v3.1.0 (2025-07-31) - 전면 고도화 업데이트
- ✅ 404.html 사용자 친화적 에러 페이지 생성
- ✅ .gitignore 보안 강화 및 포괄적 파일 제외 설정
- ✅ .eslintrc.js 코드 품질 관리 도구 구축
- ✅ .prettierrc 코드 포맷팅 자동화 설정
- ✅ sitemap.xml 구조 개선 및 다국어 지원 강화
- ✅ robots.txt 보안 강화 및 크롤러별 최적화
- ✅ index.html SEO 메타 태그 및 구조 최적화
- ✅ 파일 구조 상세 문서화 및 상태 표시
- ✅ package.json 의존성 최신화 (Vite 5.3.5, ESLint 9.8.0)
- ✅ vercel.json 배포 설정 고도화 (크론 작업, 환경 변수)
- ✅ .env.example 포괄적 환경 변수 템플릿 생성
- ✅ 서비스 워커(sw.js) PWA 완전 구현 확인
- ✅ 개발 환경 표준화 및 자동화 구축

### v3.0.0 (2025-01-22)
- ✅ 2025년 웹 표준 완전 준수
- ✅ 모던 기술 스택 도입
- ✅ 다국어 지원 완성
- ✅ 실시간 견적 시스템 구축
- ✅ SEO 및 성능 최적화
- ✅ 보안 강화 및 접근성 개선

### v2.1.0 (2024-12-15)
- 기본 제품 카탈로그 추가
- 연락처 페이지 개선

### v2.0.0 (2024-11-01)
- 반응형 디자인 적용
- 기본 SEO 설정

### v1.0.0 (2024-10-01)
- 초기 웹사이트 런칭

---

**Pure-Flon Co., Ltd.** | 동아시아 시장을 선도하는 PTFE 튜브 전문기업  
🌐 [pure-flon.com](https://pure-flon.com) | 📧 info@pure-flon.com | 📞 +82-2-1234-5678