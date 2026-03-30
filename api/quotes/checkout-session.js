import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://pure-flon.com',
  'https://www.pure-flon.com',
  'http://localhost:3000',
  'https://pure-flon-website.vercel.app'
];

const ZERO_DECIMAL_CURRENCIES = new Set(['KRW', 'JPY']);
const CHECKOUT_BLOCKED_STATUSES = new Set(['paid', 'payment_review']);

function json(res, status, payload) {
  res.status(status).json(payload);
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function normalizeText(value, maxLength = 240) {
  return String(value || '').trim().slice(0, maxLength);
}

function buildSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('missing_supabase_env');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

function buildStripeClient() {
  const secretKey = normalizeText(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) {
    throw new Error('missing_stripe_secret_key');
  }
  return new Stripe(secretKey);
}

function buildSiteUrl(req) {
  const configured = normalizeText(process.env.SITE_URL, 240);
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  const origin = normalizeText(req.headers.origin, 240);
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin.replace(/\/+$/, '');
  }
  const host = normalizeText(req.headers.host, 240);
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`.replace(/\/+$/, '');
  }
  return 'https://pure-flon.com';
}

function toMinorAmount(amount, currency) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return ZERO_DECIMAL_CURRENCIES.has(currency)
    ? Math.round(numeric)
    : Math.round(numeric * 100);
}

function buildCheckoutMetadata(quoteNumber, email) {
  const issuedAt = Date.now();
  return {
    quote_number: quoteNumber,
    customer_email: email,
    payment_reference: `checkout_${quoteNumber}_${issuedAt}`,
    checkout_origin: 'quote_payment_page'
  };
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'POST 요청만 허용됩니다.'
    });
    return;
  }

  const quoteNumber = normalizeText(req.body?.quoteNumber, 64);
  const email = normalizeText(req.body?.email, 160).toLowerCase();

  if (!quoteNumber || !email) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'quoteNumber 과 email 은 필수입니다.'
    });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: '올바른 이메일 형식이 아닙니다.'
    });
    return;
  }

  try {
    const supabase = buildSupabaseClient();
    const stripe = buildStripeClient();

    const { data: quote, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id, quote_number, status, email, company_name, subtotal, currency')
      .eq('quote_number', quoteNumber)
      .single();

    if (quoteError || !quote || normalizeText(quote.email, 160).toLowerCase() != email) {
      json(res, 404, {
        success: false,
        error: 'QUOTE_NOT_FOUND',
        message: '견적 번호와 이메일 조합을 확인할 수 없습니다.'
      });
      return;
    }

    if (CHECKOUT_BLOCKED_STATUSES.has(normalizeText(quote.status, 32).toLowerCase())) {
      json(res, 409, {
        success: false,
        error: 'ALREADY_PAID',
        message: '이미 결제 완료되었거나 결제 분쟁 검토 중인 견적입니다.'
      });
      return;
    }

    const currency = normalizeText(quote.currency || 'KRW', 12).toUpperCase();
    const subtotal = Number(quote.subtotal);
    const unitAmount = toMinorAmount(subtotal, currency);
    if (!unitAmount) {
      json(res, 409, {
        success: false,
        error: 'QUOTE_NOT_READY_FOR_CHECKOUT',
        message: '아직 결제 가능한 견적 금액이 확정되지 않았습니다. 운영팀에 문의해 주세요.'
      });
      return;
    }

    const metadata = buildCheckoutMetadata(quote.quote_number, email);
    const siteUrl = buildSiteUrl(req);
    const successUrl = new URL('/quote/payment.html', `${siteUrl}/`);
    successUrl.searchParams.set('quoteNumber', quote.quote_number);
    successUrl.searchParams.set('email', email);
    successUrl.searchParams.set('checkout', 'success');
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');

    const cancelUrl = new URL('/quote/payment.html', `${siteUrl}/`);
    cancelUrl.searchParams.set('quoteNumber', quote.quote_number);
    cancelUrl.searchParams.set('email', email);
    cancelUrl.searchParams.set('checkout', 'cancel');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      client_reference_id: quote.quote_number,
      customer_email: email,
      payment_method_types: ['card'],
      metadata,
      payment_intent_data: {
        metadata
      },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: {
            name: `Pure-Flon 견적 ${quote.quote_number}`,
            description: normalizeText(quote.company_name || 'PTFE quote settlement', 200),
            metadata
          }
        }
      }]
    });

    const historyNote = JSON.stringify({
      checkout_provider: 'stripe',
      checkout_session_id: normalizeText(session.id),
      checkout_url: normalizeText(session.url, 400),
      quote_number: quote.quote_number,
      customer_email: email,
      amount_minor: unitAmount,
      currency,
      metadata
    });

    const { error: historyError } = await supabase
      .from('quote_history')
      .insert([{
        quote_request_id: quote.id,
        action: 'checkout_session_created',
        actor: 'customer_checkout_session',
        notes: historyNote,
        created_at: new Date().toISOString()
      }]);

    if (historyError) {
      throw historyError;
    }

    json(res, 200, {
      success: true,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        sessionId: session.id,
        url: session.url,
        currency,
        amountMinor: unitAmount
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = (
      message === 'missing_supabase_env' ||
      message === 'missing_stripe_secret_key'
    ) ? 503 : 500;
    json(res, status, {
      success: false,
      error: 'CHECKOUT_SESSION_CREATE_FAILED',
      message: status === 503
        ? 'Stripe checkout session 생성에 필요한 서버 환경 변수가 설정되지 않았습니다.'
        : '결제 세션 생성 중 오류가 발생했습니다.'
    });
  }
}
