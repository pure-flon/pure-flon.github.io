# Pure-Flon Website - Environment Variables Template
# 이 파일을 복사해서 .env로 만들고 실제 값으로 수정하세요

# ===================================
# Supabase 설정
# ===================================
# Supabase 프로젝트 URL
# 위치: Supabase Dashboard → Settings → API → Project URL
SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key (공개 키)
# 위치: Supabase Dashboard → Settings → API → Project API keys → anon public
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key

# Supabase Service Role Key (서버용 - 필요시)
# 위치: Supabase Dashboard → Settings → API → Project API keys → service_role
# ⚠️ 주의: 이 키는 서버에서만 사용하고 클라이언트에 노출하면 안됩니다
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key

# ===================================
# Vercel 설정 (CI/CD용)
# ===================================
# Vercel 토큰 (GitHub Actions용)
# 위치: Vercel Dashboard → Settings → Tokens
VERCEL_TOKEN=your-vercel-token

# Vercel Organization ID
# 위치: Vercel Dashboard → Team Settings → General
VERCEL_ORG_ID=your-org-id

# Vercel Project ID  
# 위치: Vercel Project → Settings → General
VERCEL_PROJECT_ID=your-project-id

# ===================================
# 개발 환경 설정
# ===================================
# 환경 구분
NODE_ENV=development

# 로컬 개발 서버 포트
PORT=3000

# 로컬 개발 서버 호스트
HOST=localhost

# ===================================
# 이메일 설정 (향후 구현용)
# ===================================
# SMTP 서버 설정 (예: Gmail, SendGrid 등)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 발신자 정보
FROM_EMAIL=contact@pure-flon.com
FROM_NAME=Pure-Flon

# ===================================
# 외부 서비스 API 키들
# ===================================
# Google Analytics (선택사항)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Google Search Console (선택사항)  
GOOGLE_SEARCH_CONSOLE_ID=your-search-console-id

# Facebook Pixel (선택사항)
FACEBOOK_PIXEL_ID=your-pixel-id

# LinkedIn Insight Tag (선택사항)
LINKEDIN_PARTNER_ID=your-partner-id

# ===================================
# 보안 설정
# ===================================
# JWT 시크릿 (향후 인증 구현용)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# 암호화 키 (향후 데이터 암호화용)
ENCRYPTION_KEY=your-encryption-key-32-characters

# ===================================
# CDN 및 이미지 설정
# ===================================
# 이미지 CDN URL (선택사항)
IMAGE_CDN_URL=https://cdn.pure-flon.com

# 최대 이미지 업로드 크기 (MB)
MAX_IMAGE_SIZE=5

# ===================================
# 캐싱 설정
# ===================================
# Redis URL (향후 캐싱 구현용)
REDIS_URL=redis://localhost:6379

# 캐시 TTL (초)
CACHE_TTL=3600

# ===================================
# 로깅 설정
# ===================================
# 로그 레벨 (error, warn, info, debug)
LOG_LEVEL=info

# 로그 파일 경로
LOG_FILE=logs/app.log

# ===================================
# 다국어 설정
# ===================================
# 기본 언어
DEFAULT_LANGUAGE=ko

# 지원 언어 목록 (쉼표로 구분)
SUPPORTED_LANGUAGES=ko,ja,en,zh-tw,zh-cn,th,vi,id,ms

# ===================================
# 성능 모니터링
# ===================================
# Sentry DSN (에러 추적용)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# New Relic License Key (성능 모니터링용)
NEW_RELIC_LICENSE_KEY=your-new-relic-key

# ===================================
# 결제 시스템 (향후 구현용)
# ===================================
# Stripe 설정
STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# PayPal 설정 (선택사항)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# ===================================
# 소셜 미디어 연동 (선택사항)
# ===================================
# LinkedIn API
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Twitter API
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret

# ===================================
# 백업 설정 (향후 구현용)
# ===================================
# AWS S3 백업 설정
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=pure-flon-backups

# ===================================
# 개발자 도구
# ===================================
# Webpack Bundle Analyzer (개발용)
ANALYZE_BUNDLE=false

# Source Maps 생성 여부
GENERATE_SOURCEMAP=true

# 개발 모드에서 Hot Reload 사용 여부
HOT_RELOAD=true

# ===================================
# 테스트 환경
# ===================================
# 테스트 데이터베이스 URL
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/pure_flon_test

# 테스트 이메일 서비스
TEST_EMAIL_SERVICE=ethereal

# ===================================
# 설정 가이드
# ===================================
# 1. 이 파일을 .env로 복사: cp .env.example .env
# 2. 실제 값들로 수정
# 3. .env 파일은 Git에 커밋하지 마세요 (.gitignore에 포함됨)
# 4. 프로덕션에서는 Vercel 환경 변수로 설정
# 5. 민감한 정보는 절대 코드에 하드코딩하지 마세요

# ===================================
# 보안 주의사항
# ===================================
# ⚠️ 이 파일의 실제 버전(.env)은 절대 Git에 커밋하지 마세요
# ⚠️ 프로덕션 키들은 개발 환경에서 사용하지 마세요  
# ⚠️ API 키들은 정기적으로 갱신하세요
# ⚠️ 사용하지 않는 API 키들은 비활성화하세요