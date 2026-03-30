/**
 * Pure-Flon 배송비 견적 API
 * DHL Express Rate API v2 연동
 *
 * POST /api/shipping/estimate
 * Body: { fromCountry, toCountry, weight, length, width, height, unit? }
 * Response: { rates: [{productName, totalPrice, currency, estimatedDeliveryDate}] }
 */

const DHL_API_BASE = 'https://api.dhl.com';
const DHL_SANDBOX_BASE = 'https://api-sandbox.dhl.com';
const ALLOWED_ORIGINS = [
  'https://pure-flon.com',
  'https://www.pure-flon.com',
  'http://localhost:3000',
  'https://pure-flon-website.vercel.app'
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
}

function json(res, status, payload) {
  res.status(status).json(payload);
}

function validateInput({ fromCountry, toCountry, weight }) {
  if (!fromCountry || fromCountry.length !== 2) {
    return 'fromCountry는 ISO 2자리 국가 코드가 필요합니다 (예: KR).';
  }
  if (!toCountry || toCountry.length !== 2) {
    return 'toCountry는 ISO 2자리 국가 코드가 필요합니다 (예: US).';
  }
  const w = Number(weight);
  if (!w || w <= 0 || w > 70) {
    return 'weight는 0~70kg 범위여야 합니다.';
  }
  return null;
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED', message: 'POST 요청만 허용됩니다.' });
    return;
  }

  const {
    fromCountry = 'KR',
    toCountry,
    weight,
    length = 30,
    width = 20,
    height = 10,
    unit = 'metric'
  } = req.body || {};

  const validationError = validateInput({ fromCountry, toCountry, weight });
  if (validationError) {
    json(res, 400, { success: false, error: 'VALIDATION_ERROR', message: validationError });
    return;
  }

  const apiKey = process.env.DHL_API_KEY;
  const accountNumber = process.env.DHL_ACCOUNT_NUMBER;

  // API 키 없는 경우 — 개발/테스트용 기본 견적 반환
  if (!apiKey || !accountNumber) {
    const fallbackRates = buildFallbackRates(toCountry, Number(weight));
    json(res, 200, {
      success: true,
      source: 'fallback',
      note: 'DHL API 키가 설정되지 않아 기본 견적을 반환합니다. Vercel에 DHL_API_KEY + DHL_ACCOUNT_NUMBER를 설정하세요.',
      rates: fallbackRates
    });
    return;
  }

  try {
    const isSandbox = process.env.DHL_SANDBOX === 'true';
    const baseUrl = isSandbox ? DHL_SANDBOX_BASE : DHL_API_BASE;
    const today = new Date().toISOString().split('T')[0];

    const rateParams = new URLSearchParams({
      accountNumber,
      originCountryCode: fromCountry.toUpperCase(),
      destinationCountryCode: toCountry.toUpperCase(),
      weight: String(Number(weight)),
      length: String(Number(length)),
      width: String(Number(width)),
      height: String(Number(height)),
      plannedShippingDate: today,
      isCustomsDeclarable: 'true',
      unitOfMeasurement: unit === 'imperial' ? 'imperial' : 'metric',
      nextBusinessDay: 'false'
    });

    const response = await fetch(`${baseUrl}/rates/v1/rates/all?${rateParams}`, {
      method: 'GET',
      headers: {
        'DHL-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('DHL API error:', response.status, errorBody);
      json(res, 502, {
        success: false,
        error: 'DHL_API_ERROR',
        message: 'DHL API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.'
      });
      return;
    }

    const data = await response.json();
    const rates = parseDhlRates(data);

    json(res, 200, {
      success: true,
      source: isSandbox ? 'dhl_sandbox' : 'dhl_live',
      fromCountry: fromCountry.toUpperCase(),
      toCountry: toCountry.toUpperCase(),
      weight: Number(weight),
      rates
    });

  } catch (err) {
    console.error('Shipping estimate error:', err);
    json(res, 500, {
      success: false,
      error: 'INTERNAL_ERROR',
      message: '배송비 조회 중 오류가 발생했습니다.'
    });
  }
}

function parseDhlRates(data) {
  const products = data?.products || [];
  return products
    .filter(p => p.totalPrice?.length > 0)
    .map(p => {
      const priceEntry = p.totalPrice?.[0] || {};
      return {
        productCode: p.productCode || '',
        productName: p.productName || '',
        currency: priceEntry.priceCurrency || 'USD',
        totalPrice: Number(priceEntry.price || 0),
        deliveryCapabilities: p.deliveryCapabilities || {}
      };
    })
    .sort((a, b) => a.totalPrice - b.totalPrice);
}

// DHL API 키 미설정 시 지역별 기본 견적 (참고용)
function buildFallbackRates(toCountry, weightKg) {
  const zones = {
    KR: { name: '국내', express: 15, standard: 8 },
    JP: { name: '일본', express: 35, standard: 18 },
    CN: { name: '중국', express: 40, standard: 20 },
    US: { name: '미국', express: 65, standard: 35 },
    DE: { name: '독일', express: 70, standard: 40 },
    GB: { name: '영국', express: 70, standard: 40 },
    AU: { name: '호주', express: 75, standard: 45 },
    SG: { name: '싱가포르', express: 45, standard: 25 },
    IN: { name: '인도', express: 55, standard: 30 }
  };
  const zone = zones[toCountry?.toUpperCase()] || { name: '기타', express: 80, standard: 50 };
  const multiplier = Math.max(1, Math.ceil(weightKg));
  return [
    {
      productCode: 'P',
      productName: 'DHL EXPRESS WORLDWIDE',
      currency: 'USD',
      totalPrice: +(zone.express * multiplier).toFixed(2),
      deliveryCapabilities: { estimatedDeliveryDateAndTime: '2-3 business days' }
    },
    {
      productCode: 'K',
      productName: 'DHL EXPRESS 9:00',
      currency: 'USD',
      totalPrice: +(zone.express * multiplier * 1.4).toFixed(2),
      deliveryCapabilities: { estimatedDeliveryDateAndTime: '1-2 business days (by 9:00)' }
    }
  ];
}
