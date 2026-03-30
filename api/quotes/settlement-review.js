import { timingSafeEqual } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://pure-flon.com',
  'https://www.pure-flon.com',
  'http://localhost:3000',
  'https://pure-flon-website.vercel.app'
];

const REVIEW_ACTIONS = new Set([
  'settlement_review_triaged',
  'settlement_review_evidence_attached',
  'settlement_review_adjudicated'
]);

const REVIEW_KINDS = new Set([
  'payment_notice',
  'refund',
  'dispute',
  'duplicate_settlement'
]);

const KIND_LIFECYCLE_ALLOWLIST = {
  payment_notice: new Set(['payment_notice_submitted']),
  refund: new Set([
    'payment_confirmed',
    'payment_gateway_settled',
    'payment_gateway_dispute_reinstated',
    'payment_gateway_refunded',
  ]),
  dispute: new Set(['payment_gateway_disputed', 'payment_gateway_dispute_reinstated']),
  duplicate_settlement: new Set([
    'payment_confirmed',
    'payment_gateway_settled',
    'payment_gateway_dispute_reinstated'
  ])
};

const LIFECYCLE_ACTIONS = new Set([
  'payment_notice_submitted',
  'payment_confirmed',
  'payment_gateway_settled',
  'payment_gateway_refunded',
  'payment_gateway_disputed',
  'payment_gateway_dispute_reinstated'
]);

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

function getExpectedBearerToken() {
  return normalizeText(
    process.env.PAYMENT_CONFIRM_BEARER_TOKEN || process.env.GOV_DASHBOARD_TOKEN
  );
}

function hasValidBearerAuth(req) {
  const expected = getExpectedBearerToken();
  const auth = normalizeText(req.headers.authorization);
  if (!expected) {
    throw new Error('missing_settlement_review_token');
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

function inferReviewLifecyclePhase(reviewKind, lifecycleAction) {
  const normalizedKind = normalizeText(reviewKind, 64);
  const normalizedAction = normalizeText(lifecycleAction, 96);
  if (normalizedKind === 'refund') {
    if (normalizedAction === 'payment_gateway_refunded') {
      return 'post_reverse_refund_review';
    }
    if (normalizedAction === 'payment_confirmed' || normalizedAction === 'payment_gateway_settled' || normalizedAction === 'payment_gateway_dispute_reinstated') {
      return 'pre_reverse_refund_review';
    }
  }
  if (normalizedKind === 'dispute') {
    if (normalizedAction === 'payment_gateway_dispute_reinstated') {
      return 'recovered_dispute_review';
    }
    return 'active_dispute_review';
  }
  if (normalizedKind === 'payment_notice') {
    return 'settlement_notice_review';
  }
  return 'duplicate_settlement_review';
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
        message: '정산 검토 기록에는 운영자 Bearer 인증이 필요합니다.'
      });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'missing_settlement_review_token') {
      json(res, 503, {
        success: false,
        error: 'SETTLEMENT_REVIEW_UNAVAILABLE',
        message: '정산 검토 토큰이 설정되지 않아 fail-closed 상태입니다.'
      });
      return;
    }
    json(res, 500, {
      success: false,
      error: 'SETTLEMENT_REVIEW_FAILED',
      message: '정산 검토 인증 검증 중 오류가 발생했습니다.'
    });
    return;
  }

  const quoteNumber = normalizeText(req.body?.quoteNumber, 64);
  const reviewKind = normalizeText(req.body?.reviewKind, 64);
  const action = normalizeText(req.body?.action, 96);
  const resolution = normalizeText(req.body?.resolution, 96);
  const evidenceRef = normalizeText(req.body?.evidenceRef, 500);
  const note = normalizeText(req.body?.note, 1000);
  const responseDraft = normalizeText(req.body?.responseDraft, 4000);
  const nextAction = normalizeText(req.body?.nextAction, 240);
  const dueBy = normalizeText(req.body?.dueBy, 64);
  const paymentReference = normalizeText(req.body?.paymentReference, 120);
  const actor = normalizeText(req.body?.actor || 'ops_settlement_review', 96);
  const occurredAt = normalizeText(req.body?.occurredAt || new Date().toISOString(), 64);
  const evidenceItemsRaw = Array.isArray(req.body?.evidenceItems) ? req.body.evidenceItems : [];
  const evidenceItems = evidenceItemsRaw
    .map((item) => normalizeText(item, 240))
    .filter(Boolean)
    .slice(0, 8);

  if (!quoteNumber || !reviewKind || !action) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'quoteNumber, reviewKind, action 은 필수입니다.'
    });
    return;
  }

  if (!REVIEW_KINDS.has(reviewKind)) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: '허용되지 않은 reviewKind 입니다.'
    });
    return;
  }

  if (!REVIEW_ACTIONS.has(action)) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: '허용되지 않은 action 입니다.'
    });
    return;
  }

  if (action === 'settlement_review_evidence_attached' && !evidenceRef && evidenceItems.length === 0) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'evidence attachment 에는 evidenceRef 또는 evidenceItems 가 필요합니다.'
    });
    return;
  }

  if (action === 'settlement_review_adjudicated' && !resolution) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'adjudication 에는 resolution 이 필요합니다.'
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

    const { data: historyRows, error: historyError } = await supabase
      .from('quote_history')
      .select('id, action, actor, notes, created_at')
      .eq('quote_request_id', quote.id)
      .in('action', [...LIFECYCLE_ACTIONS, ...REVIEW_ACTIONS])
      .order('created_at', { ascending: false })
      .limit(40);

    if (historyError) {
      throw historyError;
    }

    const rows = Array.isArray(historyRows) ? historyRows : [];
    const latestLifecycle = rows.find((row) => LIFECYCLE_ACTIONS.has(normalizeText(row.action)));
    if (!latestLifecycle) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REVIEW_LINEAGE_MISSING',
        message: '정산 검토 전에 연결 가능한 lifecycle 이력이 먼저 필요합니다.'
      });
      return;
    }

    const allowedLifecycleActions = KIND_LIFECYCLE_ALLOWLIST[reviewKind];
    if (!allowedLifecycleActions || !allowedLifecycleActions.has(normalizeText(latestLifecycle.action))) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REVIEW_KIND_MISMATCH',
        message: '최신 lifecycle 상태가 선택한 reviewKind 와 맞지 않습니다.'
      });
      return;
    }

    const latestLifecycleNote = parseJsonNote(latestLifecycle.notes) || {};
    const lineagePaymentReference = normalizeText(latestLifecycleNote.payment_reference, 120);
    if (paymentReference && lineagePaymentReference && paymentReference !== lineagePaymentReference) {
      json(res, 409, {
        success: false,
        error: 'PAYMENT_REFERENCE_MISMATCH',
        message: '입력된 paymentReference 가 최신 lifecycle 이력과 일치하지 않습니다.'
      });
      return;
    }

    const latestReview = rows.find((row) => REVIEW_ACTIONS.has(normalizeText(row.action)));
    const latestReviewNote = latestReview ? (parseJsonNote(latestReview.notes) || {}) : null;
    if (
      latestReview &&
      normalizeText(latestReview.action) === action &&
      normalizeText(latestReviewNote?.resolution, 96) === resolution &&
      normalizeText(latestReviewNote?.evidence_ref, 500) === evidenceRef &&
      normalizeText(latestReviewNote?.note, 1000) === note &&
      normalizeText(latestReviewNote?.response_draft, 4000) === responseDraft &&
      normalizeText(latestReviewNote?.next_action, 240) === nextAction &&
      normalizeText(latestReviewNote?.due_by, 64) === dueBy &&
      JSON.stringify(Array.isArray(latestReviewNote?.evidence_items) ? latestReviewNote.evidence_items : []) === JSON.stringify(evidenceItems)
    ) {
      json(res, 409, {
        success: false,
        error: 'DUPLICATE_SETTLEMENT_REVIEW',
        message: '같은 정산 검토 기록이 이미 가장 최신 이력으로 존재합니다.'
      });
      return;
    }

    const reviewNote = JSON.stringify({
      review_kind: reviewKind,
      review_lifecycle_phase: inferReviewLifecyclePhase(reviewKind, latestLifecycle.action),
      resolution: resolution || null,
      evidence_ref: evidenceRef || null,
      evidence_items: evidenceItems,
      note: note || null,
      response_draft: responseDraft || null,
      next_action: nextAction || null,
      due_by: dueBy || null,
      payment_reference: paymentReference || lineagePaymentReference || null,
      quote_number: quote.quote_number,
      quote_status_at_review: normalizeText(quote.status, 64) || null,
      lifecycle_source_action: normalizeText(latestLifecycle.action, 96),
      lifecycle_source_event_id: latestLifecycle.id,
      lifecycle_source_created_at: normalizeText(latestLifecycle.created_at, 64),
      previous_review_action: latestReview ? normalizeText(latestReview.action, 96) : null,
      previous_review_event_id: latestReview ? latestReview.id : null,
      review_authorized_via: 'bearer'
    });

    const { error: insertError } = await supabase
      .from('quote_history')
      .insert([{
        quote_request_id: quote.id,
        action,
        actor,
        notes: reviewNote,
        created_at: occurredAt
      }]);

    if (insertError) {
      throw insertError;
    }

    json(res, 200, {
      success: true,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        status: normalizeText(quote.status, 64) || null,
        reviewKind,
        action,
        resolution: resolution || null,
        evidenceRef: evidenceRef || null,
        evidenceItems,
        responseDraft: responseDraft || null,
        nextAction: nextAction || null,
        dueBy: dueBy || null,
        paymentReference: paymentReference || lineagePaymentReference || null,
        occurredAt
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'missing_supabase_env' ? 503 : 500;
    json(res, status, {
      success: false,
      error: 'SETTLEMENT_REVIEW_FAILED',
      message: status === 503
        ? '정산 검토 기록에 필요한 서버 환경 변수가 설정되지 않았습니다.'
        : '정산 검토 기록 처리 중 오류가 발생했습니다.'
    });
  }
}
