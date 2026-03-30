import { timingSafeEqual } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://pure-flon.com',
  'https://www.pure-flon.com',
  'http://localhost:3000',
  'https://pure-flon-website.vercel.app'
];

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

function normalizeText(value) {
  return String(value || '').trim();
}

function buildSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('missing_supabase_env');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

function getExpectedBearerToken() {
  return normalizeText(
    process.env.PAYMENT_CONFIRM_BEARER_TOKEN || process.env.GOV_DASHBOARD_TOKEN
  );
}

function hasValidBearerAuth(req) {
  const expected = getExpectedBearerToken();
  const auth = normalizeText(req.headers.authorization);
  if (!expected) {
    throw new Error('missing_payment_confirm_token');
  }
  if (!auth.startsWith('Bearer ')) {
    return false;
  }

  const actualToken = auth.slice('Bearer '.length).trim();
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actualToken);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function parseJsonNote(rawValue) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return null;
  }
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
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

  try {
    if (!hasValidBearerAuth(req)) {
      json(res, 401, {
        success: false,
        error: 'UNAUTHORIZED',
        message: '결제 확정에는 운영자 Bearer 인증이 필요합니다.'
      });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'missing_payment_confirm_token') {
      json(res, 503, {
        success: false,
        error: 'PAYMENT_CONFIRM_UNAVAILABLE',
        message: '결제 확정 토큰이 설정되지 않아 fail-closed 상태입니다.'
      });
      return;
    }
    json(res, 500, {
      success: false,
      error: 'PAYMENT_CONFIRM_FAILED',
      message: '결제 확정 인증 검증 중 오류가 발생했습니다.'
    });
    return;
  }

  const quoteNumber = normalizeText(req.body?.quoteNumber);
  const paymentReference = normalizeText(req.body?.paymentReference);
  const paymentChannel = normalizeText(req.body?.paymentChannel || 'manual_bank_transfer');
  const actor = normalizeText(req.body?.actor || 'finance_api');
  const note = normalizeText(req.body?.note);
  const paidAt = normalizeText(req.body?.paidAt || new Date().toISOString());
  const amountRaw = req.body?.amount;
  const amount = amountRaw === undefined || amountRaw === null || amountRaw === '' ? null : Number(amountRaw);
  const currency = normalizeText(req.body?.currency || 'KRW').toUpperCase();

  if (!quoteNumber || !paymentReference) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'quoteNumber 과 paymentReference 는 필수입니다.'
    });
    return;
  }

  if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'amount 는 양수여야 합니다.'
    });
    return;
  }

  try {
    const supabase = buildSupabaseClient();

    const { data: quote, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id, quote_number, status, subtotal, currency')
      .eq('quote_number', quoteNumber)
      .single();

    if (quoteError || !quote) {
      json(res, 404, {
        success: false,
        error: 'QUOTE_NOT_FOUND',
        message: '해당 견적 번호를 찾을 수 없습니다.'
      });
      return;
    }

    const { data: existingEvents, error: existingError } = await supabase
      .from('quote_history')
      .select('id, created_at')
      .eq('quote_request_id', quote.id)
      .eq('action', 'payment_confirmed')
      .limit(1);

    if (existingError) {
      throw existingError;
    }

    if (Array.isArray(existingEvents) && existingEvents.length > 0) {
      json(res, 409, {
        success: false,
        error: 'ALREADY_CONFIRMED',
        message: '이미 payment_confirmed 이력이 존재합니다.'
      });
      return;
    }

    const { data: noticeEvents, error: noticeError } = await supabase
      .from('quote_history')
      .select('id, created_at, notes, actor')
      .eq('quote_request_id', quote.id)
      .eq('action', 'payment_notice_submitted')
      .order('created_at', { ascending: false })
      .limit(1);

    if (noticeError) {
      throw noticeError;
    }

    const latestNotice = Array.isArray(noticeEvents) && noticeEvents.length > 0
      ? noticeEvents[0]
      : null;

    if (!latestNotice) {
      json(res, 409, {
        success: false,
        error: 'PAYMENT_NOTICE_REQUIRED',
        message: 'payment_notice_submitted 이력이 먼저 필요합니다.'
      });
      return;
    }

    const noticePayload = parseJsonNote(latestNotice.notes);
    if (!noticePayload) {
      json(res, 409, {
        success: false,
        error: 'PAYMENT_NOTICE_INVALID',
        message: '최신 결제 통지 이력이 손상되어 결제 확정을 진행할 수 없습니다.'
      });
      return;
    }

    const noticedReference = normalizeText(noticePayload.payment_reference);
    if (noticedReference && noticedReference !== paymentReference) {
      json(res, 409, {
        success: false,
        error: 'PAYMENT_REFERENCE_MISMATCH',
        message: '최신 결제 통지와 paymentReference 가 일치하지 않습니다.'
      });
      return;
    }

    const paymentNote = JSON.stringify({
      payment_reference: paymentReference,
      payment_channel: paymentChannel,
      amount: amount ?? quote.subtotal ?? null,
      currency: currency || quote.currency || 'KRW',
      note: note || null,
      confirmed_at: paidAt,
      review_source_action: 'payment_notice_submitted',
      review_notice_event_id: latestNotice.id,
      review_notice_created_at: latestNotice.created_at,
      review_notice_actor: latestNotice.actor || null,
      review_authorized_via: 'bearer'
    });

    const { error: updateError } = await supabase
      .from('quote_requests')
      .update({
        status: 'paid'
      })
      .eq('id', quote.id);

    if (updateError) {
      throw updateError;
    }

    const { error: historyError } = await supabase
      .from('quote_history')
      .insert([{
        quote_request_id: quote.id,
        action: 'payment_confirmed',
        actor,
        notes: paymentNote,
        created_at: paidAt
      }]);

    if (historyError) {
      throw historyError;
    }

    json(res, 200, {
      success: true,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        status: 'paid',
        paymentReference,
        paymentChannel,
        paidAt,
        amount: amount ?? quote.subtotal ?? null,
        currency: currency || quote.currency || 'KRW'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = (
      message === 'missing_supabase_env' ||
      message === 'missing_payment_confirm_token'
    ) ? 503 : 500;
    json(res, status, {
      success: false,
      error: 'PAYMENT_CONFIRM_FAILED',
      message: status === 503
        ? '결제 확정에 필요한 서버 환경 변수가 설정되지 않았습니다.'
        : '결제 확정 처리 중 오류가 발생했습니다.'
    });
  }
}
