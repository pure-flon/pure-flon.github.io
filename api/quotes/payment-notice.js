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
  const paymentReference = normalizeText(req.body?.paymentReference, 120);
  const paymentChannel = normalizeText(req.body?.paymentChannel || 'manual_bank_transfer', 80);
  const note = normalizeText(req.body?.note, 1000);
  const currency = normalizeText(req.body?.currency || 'KRW', 12).toUpperCase();
  const submittedAt = normalizeText(req.body?.submittedAt || new Date().toISOString(), 64);
  const amountRaw = req.body?.amount;
  const amount = amountRaw === undefined || amountRaw === null || amountRaw === '' ? null : Number(amountRaw);

  if (!quoteNumber || !email || !paymentReference) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'quoteNumber, email, paymentReference 는 필수입니다.'
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
      .select('id, quote_number, status, email, company_name')
      .eq('quote_number', quoteNumber)
      .single();

    if (quoteError || !quote || normalizeText(quote.email, 160).toLowerCase() !== email) {
      json(res, 404, {
        success: false,
        error: 'QUOTE_NOT_FOUND',
        message: '견적 번호와 이메일 조합을 확인할 수 없습니다.'
      });
      return;
    }

    const { data: confirmedEvents, error: confirmedError } = await supabase
      .from('quote_history')
      .select('id')
      .eq('quote_request_id', quote.id)
      .eq('action', 'payment_confirmed')
      .limit(1);

    if (confirmedError) {
      throw confirmedError;
    }

    if (Array.isArray(confirmedEvents) && confirmedEvents.length > 0) {
      json(res, 409, {
        success: false,
        error: 'ALREADY_CONFIRMED',
        message: '이미 결제 확정이 완료된 견적입니다.'
      });
      return;
    }

    const { data: noticeEvents, error: noticeError } = await supabase
      .from('quote_history')
      .select('id, created_at')
      .eq('quote_request_id', quote.id)
      .eq('action', 'payment_notice_submitted')
      .order('created_at', { ascending: false })
      .limit(1);

    if (noticeError) {
      throw noticeError;
    }

    if (Array.isArray(noticeEvents) && noticeEvents.length > 0) {
      json(res, 409, {
        success: false,
        error: 'ALREADY_UNDER_REVIEW',
        message: '이미 결제 통지가 접수되어 검토 중입니다.'
      });
      return;
    }

    const noticePayload = JSON.stringify({
      contact_email: email,
      payment_reference: paymentReference,
      payment_channel: paymentChannel,
      amount,
      currency,
      note: note || null,
      submitted_at: submittedAt,
      submitted_ip: normalizeText(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '', 160),
      user_agent: normalizeText(req.headers['user-agent'] || '', 240),
    });

    const { error: historyError } = await supabase
      .from('quote_history')
      .insert([{
        quote_request_id: quote.id,
        action: 'payment_notice_submitted',
        actor: 'customer_payment_notice',
        notes: noticePayload,
        created_at: submittedAt
      }]);

    if (historyError) {
      throw historyError;
    }

    json(res, 200, {
      success: true,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        status: quote.status || 'pending',
        reviewStatus: 'payment_notice_received',
        paymentChannel,
        submittedAt
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'missing_supabase_env' ? 503 : 500;
    json(res, status, {
      success: false,
      error: 'PAYMENT_NOTICE_FAILED',
      message: status === 503
        ? '결제 통지에 필요한 서버 환경 변수가 설정되지 않았습니다.'
        : '결제 통지 처리 중 오류가 발생했습니다.'
    });
  }
}
