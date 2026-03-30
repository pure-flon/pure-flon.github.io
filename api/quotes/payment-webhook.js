import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false
  }
};

const STRIPE_SETTLEMENT_EVENT_TYPES = new Set([
  'payment_intent.succeeded',
  'checkout.session.completed',
  'invoice.paid'
]);

const STRIPE_REVERSE_EVENT_TYPES = new Set([
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
  'charge.dispute.funds_reinstated'
]);

const PAID_LIFECYCLE_ACTIONS = new Set([
  'payment_confirmed',
  'payment_gateway_settled',
  'payment_gateway_dispute_reinstated'
]);

const REVERSED_LIFECYCLE_ACTIONS = new Set([
  'payment_gateway_refunded',
  'payment_gateway_disputed'
]);

function json(res, status, payload) {
  res.status(status).json(payload);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function firstText(...values) {
  for (const value of values) {
    const text = normalizeText(value);
    if (text) {
      return text;
    }
  }
  return '';
}

function normalizeMetadata(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function mergeMetadata(...sources) {
  return Object.assign({}, ...sources.map(normalizeMetadata));
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

function getStripeWebhookSecret() {
  const webhookSecret = normalizeText(process.env.STRIPE_WEBHOOK_SECRET);
  if (!webhookSecret) {
    throw new Error('missing_stripe_webhook_secret');
  }
  return webhookSecret;
}

async function readRawBody(req) {
  if (typeof req.rawBody === 'string') {
    return req.rawBody;
  }
  if (Buffer.isBuffer(req.rawBody)) {
    return req.rawBody.toString('utf8');
  }
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  if (req.body && typeof req.body === 'object') {
    throw new Error('raw_body_unavailable');
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function constructStripeEvent(req) {
  const signature = normalizeText(req.headers['stripe-signature']);
  if (!signature) {
    throw new Error('missing_stripe_signature');
  }
  const rawBody = await readRawBody(req);
  if (!rawBody) {
    throw new Error('empty_raw_body');
  }

  const stripe = buildStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
}

function toIsoFromUnix(timestamp) {
  const numeric = Number(timestamp);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return new Date().toISOString();
  }
  return new Date(numeric * 1000).toISOString();
}

function parseAmountMinor(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function isPaidLifecycleAction(action) {
  return PAID_LIFECYCLE_ACTIONS.has(normalizeText(action));
}

function isReversedLifecycleAction(action) {
  return REVERSED_LIFECYCLE_ACTIONS.has(normalizeText(action));
}

async function retrieveChargeContext(stripe, chargeId) {
  const resolvedChargeId = normalizeText(chargeId);
  if (!resolvedChargeId) {
    return null;
  }
  return stripe.charges.retrieve(resolvedChargeId, {
    expand: ['payment_intent']
  });
}

async function retrievePaymentIntentContext(stripe, paymentIntentId) {
  const resolvedPaymentIntentId = normalizeText(paymentIntentId);
  if (!resolvedPaymentIntentId) {
    return null;
  }
  return stripe.paymentIntents.retrieve(resolvedPaymentIntentId);
}

async function resolveGatewayLinkage(stripe, eventType, obj) {
  let chargeId = '';
  if (eventType.startsWith('charge.') && normalizeText(obj?.id).startsWith('ch_')) {
    chargeId = normalizeText(obj.id);
  }
  chargeId = firstText(chargeId, obj?.charge);

  let charge = null;
  if (chargeId) {
    charge = await retrieveChargeContext(stripe, chargeId);
  }

  let paymentIntent = null;
  let paymentIntentId = firstText(
    obj?.payment_intent,
    charge && typeof charge.payment_intent === 'string' ? charge.payment_intent : '',
    charge && charge.payment_intent && typeof charge.payment_intent === 'object' ? charge.payment_intent.id : ''
  );
  if (charge && charge.payment_intent && typeof charge.payment_intent === 'object') {
    paymentIntent = charge.payment_intent;
  } else if (paymentIntentId) {
    paymentIntent = await retrievePaymentIntentContext(stripe, paymentIntentId);
  }

  const metadata = mergeMetadata(
    paymentIntent?.metadata,
    charge?.metadata,
    obj?.metadata
  );

  return {
    metadata,
    charge,
    chargeId: firstText(charge?.id, chargeId),
    paymentIntent,
    paymentIntentId: firstText(
      paymentIntent?.id,
      paymentIntentId
    ),
    quoteNumber: firstText(
      metadata.quote_number,
      metadata.quoteNumber,
      obj?.client_reference_id
    ),
    paymentReference: firstText(
      metadata.payment_reference,
      metadata.paymentReference,
      obj?.payment_reference,
      obj?.payment_intent,
      paymentIntent?.id,
      charge?.id,
      obj?.id
    ),
    customerEmail: firstText(
      obj?.customer_email,
      obj?.customer_details?.email,
      charge?.billing_details?.email,
      paymentIntent?.receipt_email,
      metadata.customer_email
    ).toLowerCase(),
  };
}

async function extractLifecycleContext(event, stripe) {
  const eventType = normalizeText(event?.type);
  const isSettlement = STRIPE_SETTLEMENT_EVENT_TYPES.has(eventType);
  const isReverse = STRIPE_REVERSE_EVENT_TYPES.has(eventType);
  if (!isSettlement && !isReverse) {
    return { ignored: true, reason: 'unsupported_event_type', eventType };
  }

  const obj = event?.data?.object || {};
  if (eventType === 'checkout.session.completed' && normalizeText(obj.payment_status).toLowerCase() !== 'paid') {
    return { ignored: true, reason: 'checkout_session_not_paid', eventType };
  }

  const linkage = await resolveGatewayLinkage(stripe, eventType, obj);
  const quoteNumber = linkage.quoteNumber;
  if (!quoteNumber) {
    return { ignored: true, reason: 'missing_quote_number', eventType };
  }

  const disputeStatus = normalizeText(obj?.status).toLowerCase();
  const lifecycleAction = (() => {
    if (isSettlement) {
      return 'payment_gateway_settled';
    }
    if (
      eventType === 'charge.dispute.funds_reinstated' ||
      (eventType === 'charge.dispute.closed' && disputeStatus === 'won')
    ) {
      return 'payment_gateway_dispute_reinstated';
    }
    if (eventType === 'charge.refunded') {
      return 'payment_gateway_refunded';
    }
    return 'payment_gateway_disputed';
  })();

  const amountMinor = (() => {
    if (lifecycleAction === 'payment_gateway_refunded') {
      return parseAmountMinor(obj.amount_refunded ?? obj.amount ?? linkage.charge?.amount);
    }
    if (lifecycleAction === 'payment_gateway_disputed') {
      return parseAmountMinor(obj.amount ?? linkage.charge?.amount);
    }
    return parseAmountMinor(obj.amount_received ?? obj.amount_total ?? obj.amount_paid ?? linkage.charge?.amount);
  })();

  return {
    ignored: false,
    eventType,
    lifecycleAction,
    lifecycleDirection: isPaidLifecycleAction(lifecycleAction) ? 'paid' : 'reversed',
    quoteStatus: lifecycleAction === 'payment_gateway_refunded'
      ? 'refunded'
      : lifecycleAction === 'payment_gateway_disputed'
        ? 'payment_review'
        : 'paid',
    quoteNumber,
    paymentReference: firstText(linkage.paymentReference, event?.id),
    gatewayObjectId: firstText(obj?.id, linkage.chargeId, linkage.paymentIntentId),
    chargeId: linkage.chargeId,
    paymentIntentId: linkage.paymentIntentId,
    amountMinor,
    currency: normalizeText(obj.currency || linkage.charge?.currency || linkage.paymentIntent?.currency || 'KRW').toUpperCase(),
    occurredAt: toIsoFromUnix(event?.created || obj.created || linkage.charge?.created || linkage.paymentIntent?.created),
    customerEmail: linkage.customerEmail,
    disputeStatus: disputeStatus || null,
    livemode: Boolean(event?.livemode),
    metadata: linkage.metadata,
  };
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
  if (req.method !== 'POST') {
    json(res, 405, {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'POST 요청만 허용됩니다.'
    });
    return;
  }

  let event;
  try {
    event = await constructStripeEvent(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const unavailable = new Set([
      'missing_supabase_env',
      'missing_stripe_secret_key',
      'missing_stripe_webhook_secret',
      'raw_body_unavailable'
    ]);
    const status = unavailable.has(message) ? 503 : 400;
    json(res, status, {
      success: false,
      error: status == 503 ? 'WEBHOOK_UNAVAILABLE' : 'WEBHOOK_SIGNATURE_INVALID',
      message: status == 503
        ? 'Webhook 검증에 필요한 서버 환경 또는 raw body 계약이 준비되지 않았습니다.'
        : 'Stripe webhook 서명 검증에 실패했습니다.'
    });
    return;
  }

  let lifecycle;
  try {
    lifecycle = await extractLifecycleContext(event, buildStripeClient());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    json(res, 500, {
      success: false,
      error: 'PAYMENT_GATEWAY_WEBHOOK_FAILED',
      message: message === 'missing_stripe_secret_key'
        ? 'gateway lifecycle 처리에 필요한 Stripe 환경 변수가 설정되지 않았습니다.'
        : 'gateway lifecycle context 해석 중 오류가 발생했습니다.'
    });
    return;
  }

  if (lifecycle.ignored) {
    json(res, 200, {
      success: true,
      received: true,
      ignored: true,
      reason: lifecycle.reason,
      eventType: lifecycle.eventType || normalizeText(event?.type),
      eventId: normalizeText(event?.id),
    });
    return;
  }

  try {
    const supabase = buildSupabaseClient();
    const { data: quote, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id, quote_number, status, subtotal, currency')
      .eq('quote_number', lifecycle.quoteNumber)
      .single();

    if (quoteError || !quote) {
      json(res, 200, {
        success: true,
        received: true,
        ignored: true,
        reason: 'quote_not_found',
        eventType: lifecycle.eventType,
        eventId: normalizeText(event?.id),
        quoteNumber: lifecycle.quoteNumber,
      });
      return;
    }

    const lifecycleActions = [
      ...PAID_LIFECYCLE_ACTIONS,
      ...REVERSED_LIFECYCLE_ACTIONS
    ];
    const { data: existingLifecycleEvents, error: gatewayEventError } = await supabase
      .from('quote_history')
      .select('id, action, notes, created_at')
      .eq('quote_request_id', quote.id)
      .in('action', lifecycleActions)
      .order('created_at', { ascending: false })
      .limit(50);

    if (gatewayEventError) {
      throw gatewayEventError;
    }

    const duplicateEvent = Array.isArray(existingLifecycleEvents) && existingLifecycleEvents.some((row) => {
      const payload = parseJsonNote(row.notes);
      return payload && normalizeText(payload.gateway_event_id) === normalizeText(event.id);
    });

    if (duplicateEvent) {
      json(res, 200, {
        success: true,
        received: true,
        duplicate: true,
        eventType: lifecycle.eventType,
        eventId: normalizeText(event.id),
        quoteNumber: quote.quote_number,
      });
      return;
    }

    const latestLifecycle = Array.isArray(existingLifecycleEvents) ? existingLifecycleEvents[0] : null;
    if (
      latestLifecycle &&
      lifecycle.lifecycleDirection === 'paid' &&
      isPaidLifecycleAction(latestLifecycle.action)
    ) {
      json(res, 200, {
        success: true,
        received: true,
        duplicate: true,
        reason: 'active_paid_lifecycle_exists',
        eventType: lifecycle.eventType,
        eventId: normalizeText(event.id),
        quoteNumber: quote.quote_number,
      });
      return;
    }

    if (
      latestLifecycle &&
      lifecycle.lifecycleDirection === 'reversed' &&
      isReversedLifecycleAction(latestLifecycle.action)
    ) {
      json(res, 200, {
        success: true,
        received: true,
        duplicate: true,
        reason: 'active_reverse_lifecycle_exists',
        eventType: lifecycle.eventType,
        eventId: normalizeText(event.id),
        quoteNumber: quote.quote_number,
      });
      return;
    }

    if (normalizeText(quote.status).toLowerCase() !== normalizeText(lifecycle.quoteStatus).toLowerCase()) {
      const { error: updateError } = await supabase
        .from('quote_requests')
        .update({ status: lifecycle.quoteStatus })
        .eq('id', quote.id);
      if (updateError) {
        throw updateError;
      }
    }

    const gatewayNote = JSON.stringify({
      gateway_provider: 'stripe',
      gateway_event_id: normalizeText(event.id),
      gateway_event_type: lifecycle.eventType,
      gateway_object_id: lifecycle.gatewayObjectId,
      charge_id: lifecycle.chargeId || null,
      payment_intent_id: lifecycle.paymentIntentId || null,
      lifecycle_action: lifecycle.lifecycleAction,
      lifecycle_direction: lifecycle.lifecycleDirection,
      payment_reference: lifecycle.paymentReference,
      payment_channel: 'stripe_webhook',
      amount_minor: lifecycle.amountMinor,
      currency: lifecycle.currency || quote.currency || 'KRW',
      customer_email: lifecycle.customerEmail || null,
      quote_number: quote.quote_number,
      occurred_at: lifecycle.occurredAt,
      dispute_status: lifecycle.disputeStatus,
      livemode: lifecycle.livemode,
      metadata: lifecycle.metadata,
    });

    const { error: historyError } = await supabase
      .from('quote_history')
      .insert([{
        quote_request_id: quote.id,
        action: lifecycle.lifecycleAction,
        actor: 'stripe_webhook',
        notes: gatewayNote,
        created_at: lifecycle.occurredAt
      }]);

    if (historyError) {
      throw historyError;
    }

    json(res, 200, {
      success: true,
      received: true,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        status: lifecycle.quoteStatus,
        action: lifecycle.lifecycleAction,
        paymentReference: lifecycle.paymentReference,
        eventId: normalizeText(event.id),
        eventType: lifecycle.eventType,
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'missing_supabase_env' ? 503 : 500;
    json(res, status, {
      success: false,
      error: 'PAYMENT_GATEWAY_WEBHOOK_FAILED',
      message: status === 503
        ? 'gateway lifecycle 기록에 필요한 서버 환경 변수가 설정되지 않았습니다.'
        : 'gateway lifecycle 처리 중 오류가 발생했습니다.'
    });
  }
}
