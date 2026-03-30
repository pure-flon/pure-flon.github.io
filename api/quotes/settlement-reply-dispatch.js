import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Stripe from 'stripe';

const ALLOWED_ORIGINS = [
  'https://pure-flon.com',
  'https://www.pure-flon.com',
  'http://localhost:3000',
  'https://pure-flon-website.vercel.app'
];

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

const REVIEW_ACTIONS = new Set([
  'settlement_review_triaged',
  'settlement_review_evidence_attached',
  'settlement_review_adjudicated'
]);

const DISPATCH_DRY_RUN_ACTION = 'settlement_reply_dispatch_dry_run';
const DISPATCH_LIVE_READY_ACTION = 'settlement_reply_dispatch_live_ready';
const DISPATCH_LIVE_BLOCKED_ACTION = 'settlement_reply_dispatch_live_blocked';
const DISPATCH_LIVE_SUBMITTED_ACTION = 'settlement_reply_dispatch_live_submitted';
const DISPATCH_LIVE_SUBMIT_FAILED_ACTION = 'settlement_reply_dispatch_live_submit_failed';
const DISPATCH_ACTIONS = new Set([
  DISPATCH_DRY_RUN_ACTION,
  DISPATCH_LIVE_READY_ACTION,
  DISPATCH_LIVE_BLOCKED_ACTION,
  DISPATCH_LIVE_SUBMITTED_ACTION,
  DISPATCH_LIVE_SUBMIT_FAILED_ACTION
]);

const STRIPE_NATIVE_PROTOCOLS = new Set([
  'refund_execution_request_v1',
  'issuer_dispute_response_v1',
  'duplicate_charge_resolution_v1'
]);

const EMAIL_NATIVE_PROTOCOLS = new Set([
  'bank_reconciliation_notice_v1',
  'refund_execution_request_v1',
  'issuer_dispute_response_v1',
  'duplicate_charge_resolution_v1'
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Settlement-Live-Token, X-Settlement-Live-Submit-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function normalizeText(value, maxLength = 240) {
  return String(value || '').trim().slice(0, maxLength);
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

function buildSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('missing_supabase_env');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

function hasStripeSecretKeyConfigured() {
  return Boolean(normalizeText(process.env.STRIPE_SECRET_KEY, 240));
}

function buildStripeClient() {
  const secretKey = normalizeText(process.env.STRIPE_SECRET_KEY, 240);
  if (!secretKey) {
    throw new Error('missing_stripe_secret_key');
  }
  return new Stripe(secretKey);
}

function hasResendApiKeyConfigured() {
  return Boolean(normalizeText(process.env.RESEND_API_KEY, 240));
}

function buildResendClient() {
  const apiKey = normalizeText(process.env.RESEND_API_KEY, 240);
  if (!apiKey) {
    throw new Error('missing_resend_api_key');
  }
  return new Resend(apiKey);
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
    throw new Error('missing_settlement_reply_dispatch_token');
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

function getDispatchModeConfig() {
  return normalizeText(process.env.SETTLEMENT_REPLY_DISPATCH_MODE || 'dry_run_only', 32).toLowerCase();
}

function getLiveDispatchToken() {
  return normalizeText(process.env.SETTLEMENT_REPLY_LIVE_TOKEN, 240);
}

function getLiveSubmitToken() {
  return normalizeText(process.env.SETTLEMENT_REPLY_LIVE_SUBMIT_TOKEN, 240);
}

function hasValidLiveDispatchToken(req) {
  const expected = getLiveDispatchToken();
  if (!expected) {
    return false;
  }
  const actual = normalizeText(req.headers['x-settlement-live-token'], 240);
  if (!actual) {
    return false;
  }
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function hasValidLiveSubmitToken(req) {
  const expected = getLiveSubmitToken();
  if (!expected) {
    return false;
  }
  const actual = normalizeText(req.headers['x-settlement-live-submit-token'], 240);
  if (!actual) {
    return false;
  }
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function parseAllowlist(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => normalizeText(item, 120).toLowerCase())
      .filter(Boolean)
  );
}

function parseEmailList(value) {
  return String(value || '')
    .split(',')
    .map((item) => normalizeText(item, 240))
    .filter(Boolean)
    .slice(0, 8);
}

function buildPackageHash(quoteNumber, reviewKind, channelHint, subjectLine, paymentReference, responseDraft, evidenceItems) {
  return createHash('sha256').update(JSON.stringify({
    quote_number: quoteNumber,
    review_kind: reviewKind,
    channel_hint: channelHint,
    subject_line: subjectLine,
    payment_reference: paymentReference,
    response_draft: responseDraft,
    evidence_items: evidenceItems,
  })).digest('hex');
}

function buildProviderEnvSuffix(reviewKind) {
  return String(reviewKind || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_');
}

function resolveProviderTarget(reviewKind, channelHint) {
  const normalizedKind = normalizeText(reviewKind, 64);
  const normalizedChannel = normalizeText(channelHint, 96);
  if (normalizedKind === 'payment_notice' || normalizedChannel === 'bank_reconciliation_review') {
    return 'bank_reconciliation_webhook';
  }
  if (normalizedKind === 'refund' || normalizedChannel === 'psp_or_finance_refund_review') {
    return 'refund_execution_webhook';
  }
  if (normalizedKind === 'dispute' || normalizedChannel === 'issuer_or_psp_dispute_reply') {
    return 'issuer_dispute_reply_webhook';
  }
  if (normalizedKind === 'duplicate_settlement' || normalizedChannel === 'psp_duplicate_charge_review') {
    return 'duplicate_charge_resolution_webhook';
  }
  return 'ops_manual_webhook';
}

function resolveProviderProtocol(reviewKind, providerTarget) {
  const normalizedTarget = normalizeText(providerTarget, 96);
  if (normalizedTarget === 'bank_reconciliation_webhook' || normalizeText(reviewKind, 64) === 'payment_notice') {
    return 'bank_reconciliation_notice_v1';
  }
  if (normalizedTarget === 'refund_execution_webhook' || normalizeText(reviewKind, 64) === 'refund') {
    return 'refund_execution_request_v1';
  }
  if (normalizedTarget === 'issuer_dispute_reply_webhook' || normalizeText(reviewKind, 64) === 'dispute') {
    return 'issuer_dispute_response_v1';
  }
  if (normalizedTarget === 'duplicate_charge_resolution_webhook' || normalizeText(reviewKind, 64) === 'duplicate_settlement') {
    return 'duplicate_charge_resolution_v1';
  }
  return 'ops_manual_webhook_v1';
}

function buildProviderPayload(payload, providerProtocol, occurredAt) {
  const baseEnvelope = {
    quoteNumber: payload.quoteNumber,
    reviewKind: payload.reviewKind,
    providerTarget: payload.providerTarget,
    providerProtocol,
    channelHint: payload.channelHint,
    subjectLine: payload.subjectLine,
    summary: payload.summary,
    paymentReference: payload.paymentReference,
    packageHash: payload.packageHash,
    confirmPhrase: payload.confirmPhrase,
    submitPhrase: payload.submitPhrase,
    occurredAt,
  };
  if (providerProtocol === 'bank_reconciliation_notice_v1') {
    return {
      ...baseEnvelope,
      settlementNotice: {
        paymentReference: payload.paymentReference,
        summary: payload.summary,
        evidenceItems: payload.evidenceItems,
        nextAction: payload.nextAction,
      },
    };
  }
  if (providerProtocol === 'refund_execution_request_v1') {
    return {
      ...baseEnvelope,
      refundExecution: {
        paymentReference: payload.paymentReference,
        responseDraft: payload.responseDraft,
        evidenceItems: payload.evidenceItems,
        nextAction: payload.nextAction,
        dueBy: payload.dueBy,
      },
    };
  }
  if (providerProtocol === 'issuer_dispute_response_v1') {
    return {
      ...baseEnvelope,
      disputeReply: {
        paymentReference: payload.paymentReference,
        responseDraft: payload.responseDraft,
        evidenceItems: payload.evidenceItems,
        dueBy: payload.dueBy,
      },
    };
  }
  if (providerProtocol === 'duplicate_charge_resolution_v1') {
    return {
      ...baseEnvelope,
      duplicateChargeResolution: {
        paymentReference: payload.paymentReference,
        responseDraft: payload.responseDraft,
        evidenceItems: payload.evidenceItems,
        nextAction: payload.nextAction,
      },
    };
  }
  return {
    ...baseEnvelope,
    manualReview: {
      responseDraft: payload.responseDraft,
      evidenceItems: payload.evidenceItems,
      nextAction: payload.nextAction,
      dueBy: payload.dueBy,
    },
  };
}

function resolveProviderSubmitMode(providerTarget, reviewKind) {
  const envSuffix = buildProviderEnvSuffix(reviewKind);
  const mode = normalizeText(
    process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_MODE`] ||
    process.env.SETTLEMENT_REPLY_PROVIDER_MODE ||
    'auto',
    32,
  ).toLowerCase();
  if (mode === 'auto' || mode === 'webhook' || mode === 'native') {
    return mode;
  }
  return 'invalid';
}

function getProviderWebhookConfig(providerTarget, reviewKind) {
  const target = normalizeText(providerTarget, 96);
  const envSuffix = buildProviderEnvSuffix(reviewKind);
  return {
    providerTarget: target,
    providerProtocol: resolveProviderProtocol(reviewKind, target),
    providerName: normalizeText(
      process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_NAME`] ||
      process.env.SETTLEMENT_REPLY_PROVIDER_NAME ||
      target,
      96,
    ),
    providerAuthToken: normalizeText(
      process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_AUTH_TOKEN`] ||
      process.env.SETTLEMENT_REPLY_PROVIDER_AUTH_TOKEN,
      240,
    ),
    providerUrl: normalizeText(
      process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_WEBHOOK_URL`] ||
      process.env.SETTLEMENT_REPLY_PROVIDER_WEBHOOK_URL,
      1000,
    ),
    providerSecret: normalizeText(
      process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_WEBHOOK_SECRET`] ||
      process.env.SETTLEMENT_REPLY_PROVIDER_WEBHOOK_SECRET,
      240,
    ),
    providerMode: resolveProviderSubmitMode(target, reviewKind),
  };
}

function getProviderEmailConfig(providerTarget, reviewKind) {
  const target = normalizeText(providerTarget, 96);
  const envSuffix = buildProviderEnvSuffix(reviewKind);
  return {
    providerTarget: target,
    providerProtocol: resolveProviderProtocol(reviewKind, target),
    providerName: normalizeText(
      process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_NAME`] ||
      process.env.SETTLEMENT_REPLY_PROVIDER_NAME ||
      `${target}_email`,
      96,
    ),
    providerEmailTo: parseEmailList(
      process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_EMAIL_TO`] ||
      process.env.SETTLEMENT_REPLY_PROVIDER_EMAIL_TO
    ),
    providerEmailFrom: normalizeText(
      process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_EMAIL_FROM`] ||
      process.env.SETTLEMENT_REPLY_PROVIDER_EMAIL_FROM ||
      process.env.FROM_EMAIL,
      240,
    ),
    providerEmailReplyTo: parseEmailList(
      process.env[`SETTLEMENT_REPLY_PROVIDER_${envSuffix}_EMAIL_REPLY_TO`] ||
      process.env.SETTLEMENT_REPLY_PROVIDER_EMAIL_REPLY_TO
    ),
  };
}

function hasProviderEmailConfigured(providerTarget, reviewKind) {
  const emailConfig = getProviderEmailConfig(providerTarget, reviewKind);
  return (
    hasResendApiKeyConfigured() &&
    Boolean(emailConfig.providerEmailFrom) &&
    emailConfig.providerEmailTo.length > 0
  );
}

function buildProviderEmailText(payload, providerProtocol, occurredAt, lifecycleContext) {
  const sections = [
    'settlement_reply_package',
    `quote_number: ${payload.quoteNumber}`,
    `review_kind: ${payload.reviewKind}`,
    `provider_target: ${payload.providerTarget}`,
    `provider_protocol: ${providerProtocol}`,
    `channel_hint: ${payload.channelHint}`,
    `subject_line: ${payload.subjectLine}`,
    `payment_reference: ${payload.paymentReference}`,
    `package_hash: ${payload.packageHash}`,
    `occurred_at: ${occurredAt}`,
    `gateway_provider: ${lifecycleContext.gatewayProvider || '-'}`,
    `gateway_event_id: ${lifecycleContext.gatewayEventId || '-'}`,
    `gateway_event_type: ${lifecycleContext.gatewayEventType || '-'}`,
    `gateway_object_id: ${lifecycleContext.gatewayObjectId || '-'}`,
    `charge_id: ${lifecycleContext.chargeId || '-'}`,
    `payment_intent_id: ${lifecycleContext.paymentIntentId || '-'}`,
    '',
    'summary:',
    payload.summary || '-',
    '',
    'response_draft:',
    payload.responseDraft || '-',
    '',
    'evidence_items:',
    ...(Array.isArray(payload.evidenceItems) && payload.evidenceItems.length
      ? payload.evidenceItems.map((item) => `- ${normalizeText(item, 240)}`)
      : ['- none']),
  ];
  if (payload.nextAction) {
    sections.push('', `next_action: ${payload.nextAction}`);
  }
  if (payload.dueBy) {
    sections.push(`due_by: ${payload.dueBy}`);
  }
  return normalizeText(sections.join('\n'), 14000);
}

async function submitToProviderWebhook(payload, occurredAt) {
  const { providerTarget, providerProtocol, providerName, providerAuthToken, providerUrl, providerSecret } = getProviderWebhookConfig(
    payload.providerTarget,
    payload.reviewKind,
  );
  if (!providerUrl || !providerSecret) {
    return {
      ok: false,
      blockedReason: 'provider_target_not_configured',
      providerTarget,
      providerProtocol,
      providerName,
      providerTransport: 'webhook',
      providerAuthMode: providerAuthToken ? 'bearer+hmac_sha256' : 'hmac_sha256',
      providerStatus: 0,
      providerBody: '',
      providerReceipt: null,
    };
  }

  const providerPayload = buildProviderPayload({
    ...payload,
    providerTarget,
  }, providerProtocol, occurredAt);
  const body = JSON.stringify(providerPayload);
  const signature = createHmac('sha256', providerSecret).update(body).digest('hex');
  const requestHeaders = {
    'Content-Type': 'application/json',
    'X-Settlement-Reply-Signature': signature,
    'X-Settlement-Reply-Provider': providerName,
    'X-Settlement-Reply-Provider-Target': providerTarget,
    'X-Settlement-Reply-Protocol': providerProtocol,
  };
  if (providerAuthToken) {
    requestHeaders.Authorization = `Bearer ${providerAuthToken}`;
  }

  let response;
  try {
    response = await fetch(providerUrl, {
      method: 'POST',
      headers: requestHeaders,
      body,
    });
  } catch (error) {
    return {
      ok: false,
      blockedReason: 'provider_webhook_network_error',
      providerTarget,
      providerProtocol,
      providerName,
      providerTransport: 'webhook',
      providerAuthMode: providerAuthToken ? 'bearer+hmac_sha256' : 'hmac_sha256',
      providerStatus: 0,
      providerBody: error instanceof Error ? error.message : 'network_error',
      providerReceipt: null,
    };
  }

  const responseBody = await response.text();
  let parsedBody = null;
  try {
    parsedBody = responseBody ? JSON.parse(responseBody) : null;
  } catch {
    parsedBody = null;
  }

  const providerReceipt = parsedBody && typeof parsedBody === 'object'
    ? normalizeText(parsedBody.receiptId || parsedBody.receipt_id || parsedBody.id || '', 240)
    : '';

  return {
    ok: response.ok,
    blockedReason: response.ok ? null : `provider_webhook_http_${response.status}`,
    providerTarget,
    providerProtocol,
    providerName,
    providerTransport: 'webhook',
    providerAuthMode: providerAuthToken ? 'bearer+hmac_sha256' : 'hmac_sha256',
    providerStatus: response.status,
    providerBody: normalizeText(responseBody, 800),
    providerReceipt: providerReceipt || null,
  };
}

async function submitToEmailNativeProvider(payload, occurredAt, lifecycleContext) {
  const {
    providerTarget,
    providerProtocol,
    providerName,
    providerEmailTo,
    providerEmailFrom,
    providerEmailReplyTo,
  } = getProviderEmailConfig(payload.providerTarget, payload.reviewKind);
  const baseResult = {
    providerTarget,
    providerProtocol,
    providerName,
    providerTransport: 'email_api',
    providerAuthMode: 'resend_api_key',
    providerStatus: 0,
    providerBody: '',
    providerReceipt: null,
  };

  if (!EMAIL_NATIVE_PROTOCOLS.has(providerProtocol)) {
    return {
      ok: false,
      blockedReason: 'provider_email_protocol_unsupported',
      ...baseResult,
    };
  }

  if (!hasResendApiKeyConfigured()) {
    return {
      ok: false,
      blockedReason: 'missing_resend_api_key',
      ...baseResult,
    };
  }

  if (!providerEmailFrom || providerEmailTo.length === 0) {
    return {
      ok: false,
      blockedReason: 'provider_email_not_configured',
      ...baseResult,
    };
  }

  let resend;
  try {
    resend = buildResendClient();
  } catch (error) {
    return {
      ok: false,
      blockedReason: error instanceof Error ? error.message : 'missing_resend_api_key',
      ...baseResult,
    };
  }

  try {
    const response = await resend.emails.send({
      from: providerEmailFrom,
      to: providerEmailTo,
      replyTo: providerEmailReplyTo.length > 0 ? providerEmailReplyTo : undefined,
      subject: payload.subjectLine,
      text: buildProviderEmailText(payload, providerProtocol, occurredAt, lifecycleContext),
      headers: {
        'X-Settlement-Reply-Provider-Target': providerTarget,
        'X-Settlement-Reply-Protocol': providerProtocol,
        'X-Settlement-Reply-Package-Hash': payload.packageHash,
      },
    });
    const providerReceipt = normalizeText(
      response?.data?.id || response?.id || '',
      240,
    );
    const providerBody = normalizeText(JSON.stringify({
      id: response?.data?.id || response?.id || null,
      to: providerEmailTo,
      subject: payload.subjectLine,
    }), 800);
    return {
      ok: true,
      ...baseResult,
      providerStatus: 200,
      providerReceipt: providerReceipt || null,
      providerBody,
    };
  } catch (error) {
    return {
      ok: false,
      blockedReason: 'provider_email_send_failed',
      ...baseResult,
      providerBody: error instanceof Error ? normalizeText(error.message, 800) : 'provider_email_send_failed',
    };
  }
}

function buildLifecycleProviderContext(latestLifecycle, latestLifecycleNote) {
  const note = latestLifecycleNote && typeof latestLifecycleNote === 'object'
    ? latestLifecycleNote
    : {};
  return {
    lifecycleAction: normalizeText(latestLifecycle?.action, 96),
    gatewayProvider: normalizeText(note.gateway_provider, 64).toLowerCase(),
    gatewayEventId: normalizeText(note.gateway_event_id, 120),
    gatewayEventType: normalizeText(note.gateway_event_type, 120),
    gatewayObjectId: normalizeText(note.gateway_object_id, 120),
    chargeId: normalizeText(note.charge_id, 120),
    paymentIntentId: normalizeText(note.payment_intent_id, 120),
    paymentReference: normalizeText(note.payment_reference, 120),
    disputeStatus: normalizeText(note.dispute_status, 120),
  };
}

function inferDispatchLifecyclePhase(reviewKind, lifecycleAction) {
  const normalizedKind = normalizeText(reviewKind, 64);
  const normalizedAction = normalizeText(lifecycleAction, 96);
  if (normalizedKind === 'refund') {
    if (normalizedAction === 'payment_gateway_refunded') {
      return 'post_reverse_refund_dispatch';
    }
    if (normalizedAction === 'payment_confirmed' || normalizedAction === 'payment_gateway_settled' || normalizedAction === 'payment_gateway_dispute_reinstated') {
      return 'pre_reverse_refund_dispatch';
    }
  }
  if (normalizedKind === 'dispute') {
    if (normalizedAction === 'payment_gateway_dispute_reinstated') {
      return 'recovered_dispute_dispatch';
    }
    return 'active_dispute_dispatch';
  }
  if (normalizedKind === 'payment_notice') {
    return 'settlement_notice_dispatch';
  }
  return 'duplicate_settlement_dispatch';
}

function buildNativeProviderMetadata(payload, lifecycleContext) {
  return {
    quote_number: payload.quoteNumber,
    review_kind: payload.reviewKind,
    payment_reference: payload.paymentReference,
    package_hash: payload.packageHash,
    provider_target: payload.providerTarget,
    provider_protocol: payload.providerProtocol,
    gateway_event_id: lifecycleContext.gatewayEventId || '',
    gateway_event_type: lifecycleContext.gatewayEventType || '',
    gateway_object_id: lifecycleContext.gatewayObjectId || '',
    charge_id: lifecycleContext.chargeId || '',
    payment_intent_id: lifecycleContext.paymentIntentId || '',
  };
}

function buildStripeDisputeEvidenceText(payload, lifecycleContext) {
  const lines = [
    `quote_number: ${payload.quoteNumber}`,
    `payment_reference: ${payload.paymentReference}`,
    `package_hash: ${payload.packageHash}`,
    `gateway_event_id: ${lifecycleContext.gatewayEventId || '-'}`,
    `gateway_event_type: ${lifecycleContext.gatewayEventType || '-'}`,
    `gateway_object_id: ${lifecycleContext.gatewayObjectId || '-'}`,
    `charge_id: ${lifecycleContext.chargeId || '-'}`,
    `payment_intent_id: ${lifecycleContext.paymentIntentId || '-'}`,
    '',
    'summary:',
    payload.summary || '-',
    '',
    'response_draft:',
    payload.responseDraft || '-',
    '',
    'evidence_items:',
    ...(Array.isArray(payload.evidenceItems) && payload.evidenceItems.length
      ? payload.evidenceItems.map((item) => `- ${normalizeText(item, 240)}`)
      : ['- none']),
  ];
  return normalizeText(lines.join('\n'), 14000);
}

async function submitToStripeNativeProvider(payload, lifecycleContext) {
  const providerTarget = normalizeText(payload.providerTarget, 96);
  const providerProtocol = normalizeText(payload.providerProtocol, 96);
  const baseResult = {
    providerTarget,
    providerProtocol,
    providerName: 'stripe_native_api',
    providerTransport: 'native_api',
    providerAuthMode: 'stripe_secret_key',
    providerStatus: 0,
    providerBody: '',
    providerReceipt: null,
  };

  if (!STRIPE_NATIVE_PROTOCOLS.has(providerProtocol)) {
    return {
      ok: false,
      blockedReason: 'provider_native_protocol_unsupported',
      ...baseResult,
    };
  }

  if (lifecycleContext.gatewayProvider !== 'stripe') {
    return {
      ok: false,
      blockedReason: 'provider_native_gateway_provider_mismatch',
      ...baseResult,
      providerBody: lifecycleContext.gatewayProvider || 'unknown_gateway_provider',
    };
  }

  let stripe;
  try {
    stripe = buildStripeClient();
  } catch (error) {
    return {
      ok: false,
      blockedReason: error instanceof Error ? error.message : 'provider_native_unavailable',
      ...baseResult,
    };
  }

  const metadata = buildNativeProviderMetadata(payload, lifecycleContext);

  try {
    if (providerProtocol === 'issuer_dispute_response_v1') {
      const disputeId = lifecycleContext.gatewayObjectId;
      if (!disputeId) {
        return {
          ok: false,
          blockedReason: 'stripe_dispute_id_missing',
          ...baseResult,
        };
      }
      if (lifecycleContext.lifecycleAction === 'payment_gateway_dispute_reinstated') {
        return {
          ok: false,
          blockedReason: 'dispute_already_reinstated',
          ...baseResult,
        };
      }

      const dispute = await stripe.disputes.update(disputeId, {
        submit: true,
        evidence: {
          uncategorized_text: buildStripeDisputeEvidenceText(payload, lifecycleContext),
        },
        metadata,
      });
      return {
        ok: true,
        ...baseResult,
        providerStatus: 200,
        providerReceipt: normalizeText(dispute.id, 240) || null,
        providerBody: normalizeText(JSON.stringify({
          id: dispute.id,
          status: dispute.status,
          object: dispute.object,
          submit: true,
        }), 800),
      };
    }

    if (providerProtocol === 'refund_execution_request_v1' && lifecycleContext.lifecycleAction === 'payment_gateway_refunded') {
      return {
        ok: false,
        blockedReason: 'refund_already_recorded',
        ...baseResult,
      };
    }

    const refundParams = {
      metadata,
      reason: providerProtocol === 'duplicate_charge_resolution_v1' ? 'duplicate' : 'requested_by_customer',
    };
    if (lifecycleContext.paymentIntentId) {
      refundParams.payment_intent = lifecycleContext.paymentIntentId;
    } else if (lifecycleContext.chargeId) {
      refundParams.charge = lifecycleContext.chargeId;
    } else {
      return {
        ok: false,
        blockedReason: 'stripe_refund_linkage_missing',
        ...baseResult,
      };
    }

    const refund = await stripe.refunds.create(refundParams);
    return {
      ok: true,
      ...baseResult,
      providerStatus: 200,
      providerReceipt: normalizeText(refund.id, 240) || null,
      providerBody: normalizeText(JSON.stringify({
        id: refund.id,
        status: refund.status,
        object: refund.object,
        reason: refund.reason || refundParams.reason,
      }), 800),
    };
  } catch (error) {
    return {
      ok: false,
      blockedReason: 'stripe_api_request_failed',
      ...baseResult,
      providerBody: error instanceof Error ? normalizeText(error.message, 800) : 'stripe_api_request_failed',
    };
  }
}

async function submitToProvider(payload, occurredAt, latestLifecycle, latestLifecycleNote) {
  const lifecycleContext = buildLifecycleProviderContext(latestLifecycle, latestLifecycleNote);
  const providerMode = resolveProviderSubmitMode(payload.providerTarget, payload.reviewKind);
  if (providerMode === 'invalid') {
    return {
      ok: false,
      blockedReason: 'provider_native_mode_invalid',
      providerTarget: normalizeText(payload.providerTarget, 96),
      providerProtocol: normalizeText(payload.providerProtocol, 96),
      providerName: '',
      providerTransport: 'invalid',
      providerAuthMode: null,
      providerStatus: 0,
      providerBody: '',
      providerReceipt: null,
    };
  }

  const nativeCapable = STRIPE_NATIVE_PROTOCOLS.has(normalizeText(payload.providerProtocol, 96));
  const emailCapable = EMAIL_NATIVE_PROTOCOLS.has(normalizeText(payload.providerProtocol, 96));
  const autoUseNative = (
    providerMode === 'auto' &&
    lifecycleContext.gatewayProvider === 'stripe' &&
    nativeCapable &&
    hasStripeSecretKeyConfigured()
  );
  const autoUseEmail = (
    providerMode === 'auto' &&
    emailCapable &&
    hasProviderEmailConfigured(payload.providerTarget, payload.reviewKind)
  );
  if (providerMode === 'native') {
    if (
      lifecycleContext.gatewayProvider === 'stripe' &&
      nativeCapable &&
      hasStripeSecretKeyConfigured()
    ) {
      return submitToStripeNativeProvider(payload, lifecycleContext);
    }
    if (
      emailCapable &&
      hasProviderEmailConfigured(payload.providerTarget, payload.reviewKind)
    ) {
      return submitToEmailNativeProvider(payload, occurredAt, lifecycleContext);
    }
    if (emailCapable && !hasResendApiKeyConfigured()) {
      return {
        ok: false,
        blockedReason: 'missing_resend_api_key',
        providerTarget: normalizeText(payload.providerTarget, 96),
        providerProtocol: normalizeText(payload.providerProtocol, 96),
        providerName: normalizeText(payload.providerTarget, 96),
        providerTransport: 'email_api',
        providerAuthMode: 'resend_api_key',
        providerStatus: 0,
        providerBody: '',
        providerReceipt: null,
      };
    }
    if (emailCapable) {
      return {
        ok: false,
        blockedReason: 'provider_email_not_configured',
        providerTarget: normalizeText(payload.providerTarget, 96),
        providerProtocol: normalizeText(payload.providerProtocol, 96),
        providerName: normalizeText(payload.providerTarget, 96),
        providerTransport: 'email_api',
        providerAuthMode: 'resend_api_key',
        providerStatus: 0,
        providerBody: '',
        providerReceipt: null,
      };
    }
    return {
      ok: false,
      blockedReason: 'provider_native_transport_unavailable',
      providerTarget: normalizeText(payload.providerTarget, 96),
      providerProtocol: normalizeText(payload.providerProtocol, 96),
      providerName: normalizeText(payload.providerTarget, 96),
      providerTransport: 'native_api',
      providerAuthMode: null,
      providerStatus: 0,
      providerBody: '',
      providerReceipt: null,
    };
  }
  if (autoUseNative) {
    return submitToStripeNativeProvider(payload, lifecycleContext);
  }
  if (autoUseEmail) {
    return submitToEmailNativeProvider(payload, occurredAt, lifecycleContext);
  }
  return submitToProviderWebhook(payload, occurredAt);
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
        message: '정산 reply dispatch 에는 운영자 Bearer 인증이 필요합니다.'
      });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'missing_settlement_reply_dispatch_token') {
      json(res, 503, {
        success: false,
        error: 'SETTLEMENT_REPLY_DISPATCH_UNAVAILABLE',
        message: '정산 reply dispatch 토큰이 설정되지 않아 fail-closed 상태입니다.'
      });
      return;
    }
    json(res, 500, {
      success: false,
      error: 'SETTLEMENT_REPLY_DISPATCH_FAILED',
      message: '정산 reply dispatch 인증 검증 중 오류가 발생했습니다.'
    });
    return;
  }

  const quoteNumber = normalizeText(req.body?.quoteNumber, 64);
  const reviewKind = normalizeText(req.body?.reviewKind, 64);
  const channelHint = normalizeText(req.body?.channelHint, 96);
  const subjectLine = normalizeText(req.body?.subjectLine, 240);
  const summary = normalizeText(req.body?.summary, 1000);
  const paymentReference = normalizeText(req.body?.paymentReference, 120);
  const responseDraft = normalizeText(req.body?.responseDraft, 4000);
  const nextAction = normalizeText(req.body?.nextAction, 240);
  const dueBy = normalizeText(req.body?.dueBy, 64);
  const actor = normalizeText(req.body?.actor || 'ops_settlement_reply_dispatch', 96);
  const occurredAt = normalizeText(req.body?.occurredAt || new Date().toISOString(), 64);
  const dryRun = req.body?.dryRun !== false;
  const executeLiveSubmit = req.body?.executeLiveSubmit === true;
  const providerTarget = normalizeText(req.body?.providerTarget, 96);
  const providerProtocol = normalizeText(req.body?.providerProtocol, 96);
  const packageHash = normalizeText(req.body?.packageHash, 128).toLowerCase();
  const confirmPhrase = normalizeText(req.body?.confirmPhrase, 160);
  const submitPhrase = normalizeText(req.body?.submitPhrase, 160);
  const evidenceItemsRaw = Array.isArray(req.body?.evidenceItems) ? req.body.evidenceItems : [];
  const evidenceItems = evidenceItemsRaw
    .map((item) => normalizeText(item, 240))
    .filter(Boolean)
    .slice(0, 12);

  if (!quoteNumber || !reviewKind || !channelHint || !subjectLine) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'quoteNumber, reviewKind, channelHint, subjectLine 은 필수입니다.'
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

  if (!paymentReference || !responseDraft || evidenceItems.length === 0) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'paymentReference, responseDraft, evidenceItems 는 필수입니다.'
    });
    return;
  }

  if (dryRun && executeLiveSubmit) {
    json(res, 400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'executeLiveSubmit 는 dryRun=false 와 함께만 사용할 수 있습니다.'
    });
    return;
  }

  try {
    const supabase = buildSupabaseClient();
    const dispatchModeConfig = getDispatchModeConfig();

    const { data: quote, error: quoteError } = await supabase
      .from('quote_requests')
      .select('id, quote_number, status')
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
      .in('action', [...LIFECYCLE_ACTIONS, ...REVIEW_ACTIONS, ...DISPATCH_ACTIONS])
      .order('created_at', { ascending: false })
      .limit(60);

    if (historyError) {
      throw historyError;
    }

    const rows = Array.isArray(historyRows) ? historyRows : [];
    const latestLifecycle = rows.find((row) => LIFECYCLE_ACTIONS.has(normalizeText(row.action)));
    if (!latestLifecycle) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_LINEAGE_MISSING',
        message: '정산 reply dispatch 전에 연결 가능한 lifecycle 이력이 먼저 필요합니다.'
      });
      return;
    }

    const allowedLifecycleActions = KIND_LIFECYCLE_ALLOWLIST[reviewKind];
    if (!allowedLifecycleActions || !allowedLifecycleActions.has(normalizeText(latestLifecycle.action))) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_KIND_MISMATCH',
        message: '최신 lifecycle 상태가 선택한 reviewKind 와 맞지 않습니다.'
      });
      return;
    }

    const latestLifecycleNote = parseJsonNote(latestLifecycle.notes) || {};
    const lineagePaymentReference = normalizeText(latestLifecycleNote.payment_reference, 120);
    if (lineagePaymentReference && lineagePaymentReference !== paymentReference) {
      json(res, 409, {
        success: false,
        error: 'PAYMENT_REFERENCE_MISMATCH',
        message: '입력된 paymentReference 가 최신 lifecycle 이력과 일치하지 않습니다.'
      });
      return;
    }

    const latestReview = rows.find((row) => REVIEW_ACTIONS.has(normalizeText(row.action)));
    if (!latestReview) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_REVIEW_REQUIRED',
        message: '정산 reply dispatch 전에 operator settlement review 이력이 먼저 필요합니다.'
      });
      return;
    }

    const latestReviewNote = parseJsonNote(latestReview.notes) || {};
    const reviewedKind = normalizeText(latestReviewNote.review_kind, 64);
    if (reviewedKind && reviewedKind !== reviewKind) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_REVIEW_KIND_MISMATCH',
        message: '최신 settlement review 이력이 선택한 reviewKind 와 맞지 않습니다.'
      });
      return;
    }

    const reviewedPaymentReference = normalizeText(latestReviewNote.payment_reference, 120);
    if (reviewedPaymentReference && reviewedPaymentReference !== paymentReference) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_PAYMENT_REFERENCE_MISMATCH',
        message: '입력된 paymentReference 가 최신 settlement review 이력과 일치하지 않습니다.'
      });
      return;
    }

    const reviewedResponseDraft = normalizeText(latestReviewNote.response_draft, 4000);
    const reviewedEvidenceItems = Array.isArray(latestReviewNote.evidence_items)
      ? latestReviewNote.evidence_items.map((item) => normalizeText(item, 240)).filter(Boolean)
      : [];
    if (!reviewedResponseDraft || reviewedEvidenceItems.length === 0) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_PACKAGE_NOT_READY',
        message: '최신 settlement review 이력에 response_draft 와 evidence_items 가 모두 있어야 합니다.'
      });
      return;
    }

    if (
      reviewedResponseDraft !== responseDraft ||
      JSON.stringify(reviewedEvidenceItems) !== JSON.stringify(evidenceItems)
    ) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_PACKAGE_OUT_OF_SYNC',
        message: 'reply package 가 최신 settlement review 이력과 동기화되어 있지 않습니다.'
      });
      return;
    }

    const expectedPackageHash = buildPackageHash(
      quote.quote_number,
      reviewKind,
      channelHint,
      subjectLine,
      paymentReference,
      responseDraft,
      evidenceItems
    );
    const expectedConfirmPhrase = `LIVE ${quote.quote_number} ${expectedPackageHash.slice(0, 10)}`;
    const expectedSubmitPhrase = `SUBMIT ${quote.quote_number} ${expectedPackageHash.slice(0, 10)}`;
    const expectedProviderTarget = resolveProviderTarget(reviewKind, channelHint);
    const expectedProviderProtocol = resolveProviderProtocol(reviewKind, expectedProviderTarget);
    if (!dryRun && packageHash !== expectedPackageHash) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_PACKAGE_HASH_MISMATCH',
        message: '입력된 packageHash 가 settlement review payload 와 일치하지 않습니다.'
      });
      return;
    }
    if (!dryRun && confirmPhrase !== expectedConfirmPhrase) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_CONFIRM_PHRASE_MISMATCH',
        message: 'confirmPhrase 가 기대한 live gate phrase 와 일치하지 않습니다.'
      });
      return;
    }
    if (providerTarget && providerTarget !== expectedProviderTarget) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_PROVIDER_TARGET_MISMATCH',
        message: 'providerTarget 이 reviewKind/channelHint 와 일치하지 않습니다.'
      });
      return;
    }
    if (providerProtocol && providerProtocol !== expectedProviderProtocol) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_PROVIDER_PROTOCOL_MISMATCH',
        message: 'providerProtocol 이 reviewKind/providerTarget 과 일치하지 않습니다.'
      });
      return;
    }
    if (executeLiveSubmit && submitPhrase !== expectedSubmitPhrase) {
      json(res, 409, {
        success: false,
        error: 'SETTLEMENT_REPLY_SUBMIT_PHRASE_MISMATCH',
        message: 'submitPhrase 가 기대한 live submit phrase 와 일치하지 않습니다.'
      });
      return;
    }

    const latestDispatch = rows.find((row) => DISPATCH_ACTIONS.has(normalizeText(row.action)));
    const latestDispatchNote = latestDispatch ? (parseJsonNote(latestDispatch.notes) || {}) : null;

    let dispatchAction = DISPATCH_DRY_RUN_ACTION;
    let blockedReason = null;
    let dispatchMode = 'dry_run';
    let providerName = '';
    let resolvedProviderTarget = expectedProviderTarget;
    let resolvedProviderProtocol = expectedProviderProtocol;
    let providerTransport = null;
    let providerAuthMode = null;
    let providerStatus = 0;
    let providerReceipt = null;
    let providerResponseBody = '';
    let actualProviderSubmit = false;
    if (!dryRun) {
      const allowedChannels = parseAllowlist(process.env.SETTLEMENT_REPLY_LIVE_ALLOWED_CHANNELS);
      const allowedQuotes = parseAllowlist(process.env.SETTLEMENT_REPLY_LIVE_ALLOWED_QUOTES);
      const channelAllowed = allowedChannels.size === 0 || allowedChannels.has(channelHint.toLowerCase());
      const quoteAllowed = allowedQuotes.size === 0 || allowedQuotes.has(quote.quote_number.toLowerCase());
      const liveModeEnabled = dispatchModeConfig === 'live_enabled' || dispatchModeConfig === 'live_submit_enabled';
      const latestDispatchAction = normalizeText(latestDispatch?.action, 96);
      const latestDispatchPackageHash = normalizeText(latestDispatchNote?.package_hash, 128).toLowerCase();

      if (!liveModeEnabled) {
        dispatchAction = DISPATCH_LIVE_BLOCKED_ACTION;
        dispatchMode = 'live_blocked';
        blockedReason = 'live_dispatch_not_enabled';
      } else if (!hasValidLiveDispatchToken(req)) {
        dispatchAction = DISPATCH_LIVE_BLOCKED_ACTION;
        dispatchMode = 'live_blocked';
        blockedReason = 'live_dispatch_live_token_invalid';
      } else if (!channelAllowed) {
        dispatchAction = DISPATCH_LIVE_BLOCKED_ACTION;
        dispatchMode = 'live_blocked';
        blockedReason = 'channel_not_allowlisted';
      } else if (!quoteAllowed) {
        dispatchAction = DISPATCH_LIVE_BLOCKED_ACTION;
        dispatchMode = 'live_blocked';
        blockedReason = 'quote_not_allowlisted';
      } else if (executeLiveSubmit && dispatchModeConfig !== 'live_submit_enabled') {
        dispatchAction = DISPATCH_LIVE_BLOCKED_ACTION;
        dispatchMode = 'live_blocked';
        blockedReason = 'live_submit_not_enabled';
      } else if (executeLiveSubmit && !hasValidLiveSubmitToken(req)) {
        dispatchAction = DISPATCH_LIVE_BLOCKED_ACTION;
        dispatchMode = 'live_blocked';
        blockedReason = 'live_submit_token_invalid';
      } else if (
        executeLiveSubmit &&
        (
          latestDispatchAction !== DISPATCH_LIVE_READY_ACTION ||
          latestDispatchPackageHash !== expectedPackageHash
        )
      ) {
        dispatchAction = DISPATCH_LIVE_BLOCKED_ACTION;
        dispatchMode = 'live_blocked';
        blockedReason = 'live_gate_required';
      } else if (executeLiveSubmit) {
        const providerResult = await submitToProvider({
          quoteNumber: quote.quote_number,
          reviewKind,
          providerTarget: expectedProviderTarget,
          providerProtocol: expectedProviderProtocol,
          channelHint,
          subjectLine,
          summary,
          paymentReference,
          responseDraft,
          evidenceItems,
          nextAction,
          dueBy,
          packageHash: expectedPackageHash,
          confirmPhrase,
          submitPhrase,
        }, occurredAt, latestLifecycle, latestLifecycleNote);
        resolvedProviderTarget = providerResult.providerTarget || expectedProviderTarget;
        resolvedProviderProtocol = providerResult.providerProtocol || expectedProviderProtocol;
        providerName = providerResult.providerName || '';
        providerTransport = providerResult.providerTransport || null;
        providerAuthMode = providerResult.providerAuthMode || null;
        providerStatus = Number(providerResult.providerStatus || 0);
        providerReceipt = providerResult.providerReceipt || null;
        providerResponseBody = providerResult.providerBody || '';
        if (!providerResult.ok) {
          dispatchAction = DISPATCH_LIVE_SUBMIT_FAILED_ACTION;
          dispatchMode = 'live_submit_failed';
          blockedReason = providerResult.blockedReason || 'provider_webhook_failed';
        } else {
          dispatchAction = DISPATCH_LIVE_SUBMITTED_ACTION;
          dispatchMode = 'live_submitted';
          actualProviderSubmit = true;
        }
      } else {
        dispatchAction = DISPATCH_LIVE_READY_ACTION;
        dispatchMode = 'live_ready';
      }
    }
    if (
      latestDispatch &&
      normalizeText(latestDispatch.action) === dispatchAction &&
      normalizeText(latestDispatchNote?.subject_line, 240) === subjectLine &&
      normalizeText(latestDispatchNote?.payment_reference, 120) === paymentReference &&
      normalizeText(latestDispatchNote?.response_draft, 4000) === responseDraft &&
      normalizeText(latestDispatchNote?.blocked_reason, 96) === normalizeText(blockedReason, 96) &&
      normalizeText(latestDispatchNote?.package_hash, 128) === expectedPackageHash &&
      normalizeText(latestDispatchNote?.provider_receipt, 240) === normalizeText(providerReceipt, 240) &&
      JSON.stringify(Array.isArray(latestDispatchNote?.evidence_items) ? latestDispatchNote.evidence_items : []) === JSON.stringify(evidenceItems)
    ) {
      json(res, 409, {
        success: false,
        error: 'DUPLICATE_SETTLEMENT_REPLY_DISPATCH',
        message: '같은 settlement reply dispatch 이력이 이미 가장 최신 이력으로 존재합니다.'
      });
      return;
    }

    const dispatchNote = JSON.stringify({
      review_kind: reviewKind,
      dispatch_mode: dispatchMode,
      blocked_reason: blockedReason,
      channel_hint: channelHint,
      subject_line: subjectLine,
      summary: summary || null,
      response_draft: responseDraft,
      evidence_items: evidenceItems,
      package_hash: expectedPackageHash,
      confirm_phrase_verified: dryRun ? false : true,
      submit_phrase_verified: executeLiveSubmit,
      next_action: nextAction || null,
      due_by: dueBy || null,
      payment_reference: paymentReference,
      quote_number: quote.quote_number,
      quote_status_at_dispatch: normalizeText(quote.status, 64) || null,
      review_source_action: normalizeText(latestReview.action, 96),
      review_source_event_id: latestReview.id,
      review_source_created_at: normalizeText(latestReview.created_at, 64),
      lifecycle_source_action: normalizeText(latestLifecycle.action, 96),
      dispatch_lifecycle_phase: inferDispatchLifecyclePhase(reviewKind, latestLifecycle.action),
      lifecycle_source_event_id: latestLifecycle.id,
      lifecycle_source_created_at: normalizeText(latestLifecycle.created_at, 64),
      dispatch_authorized_via: dryRun ? 'bearer' : (executeLiveSubmit ? 'bearer+live_token+submit_token' : 'bearer+live_token'),
      live_gate_expected_phrase: dryRun ? null : expectedConfirmPhrase,
      live_submit_expected_phrase: executeLiveSubmit ? expectedSubmitPhrase : null,
      provider_name: providerName || null,
      provider_target: resolvedProviderTarget || expectedProviderTarget,
      provider_protocol: resolvedProviderProtocol || expectedProviderProtocol,
      provider_transport: providerTransport,
      provider_auth_mode: providerAuthMode,
      provider_status: providerStatus || null,
      provider_receipt: providerReceipt,
      provider_response_excerpt: providerResponseBody || null,
      provider_linkage_source: providerTransport === 'native_api' ? 'latest_lifecycle_note' : 'provider_dispatch_payload',
      provider_gateway_provider: normalizeText(latestLifecycleNote.gateway_provider, 64) || null,
      actual_provider_submit: actualProviderSubmit
    });

    const { error: insertError } = await supabase
      .from('quote_history')
      .insert([{
        quote_request_id: quote.id,
        action: dispatchAction,
        actor,
        notes: dispatchNote,
        created_at: occurredAt
      }]);

    if (insertError) {
      throw insertError;
    }

    const responsePayload = {
      success: true,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        reviewKind,
        action: dispatchAction,
        dispatchMode,
        blockedReason: blockedReason || null,
        channelHint,
        subjectLine,
        packageHash: expectedPackageHash,
        paymentReference,
        providerTarget: resolvedProviderTarget || expectedProviderTarget,
        providerProtocol: resolvedProviderProtocol || expectedProviderProtocol,
        providerTransport,
        liveDispatchEnabled: dispatchModeConfig === 'live_enabled' || dispatchModeConfig === 'live_submit_enabled',
        actualProviderSubmit,
        providerName: providerName || null,
        providerAuthMode: providerAuthMode,
        providerStatus: providerStatus || null,
        providerReceipt,
        occurredAt
      }
    };
    if (dispatchAction === DISPATCH_LIVE_SUBMIT_FAILED_ACTION) {
      json(res, 502, {
        success: false,
        error: 'SETTLEMENT_REPLY_PROVIDER_SUBMIT_FAILED',
        message: blockedReason || 'provider submit failed',
        data: responsePayload.data,
      });
      return;
    }
    json(res, 200, responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status = message === 'missing_supabase_env' ? 503 : 500;
    json(res, status, {
      success: false,
      error: 'SETTLEMENT_REPLY_DISPATCH_FAILED',
      message: status === 503
        ? '정산 reply dispatch 에 필요한 서버 환경 변수가 설정되지 않았습니다.'
        : '정산 reply dispatch 처리 중 오류가 발생했습니다.'
    });
  }
}
