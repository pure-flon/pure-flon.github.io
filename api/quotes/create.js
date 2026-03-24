/**
 * Pure-Flon 견적 생성 API 엔드포인트
 * 파일명: api/quotes/create.js
 * 업데이트: 2025-01-22
 * 버전: v2.0.0 (완전한 B2B 견적 API 시스템)
 */

import { createClient } from '@supabase/supabase-js';
import { validateQuoteData, sanitizeInput } from '../../js/utils/validators.js';
import { generateQuoteNumber } from '../../js/utils/generators.js';
import { sendQuoteConfirmationEmail } from '../../js/utils/email.js';
import { logQuoteRequest } from '../../js/utils/analytics.js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 허용된 도메인 (CORS)
const ALLOWED_ORIGINS = [
  'https://pure-flon.com',
  'https://www.pure-flon.com',
  'http://localhost:3000', // 개발용
  'https://pure-flon-website.vercel.app'
];

export default async function handler(req, res) {
  // CORS 헤더 설정
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'POST 요청만 허용됩니다'
    });
  }

  try {
    // 요청 본문 검증
    const quoteData = req.body;
    
    // 기본 데이터 검증
    const validation = validateQuoteData(quoteData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '입력 데이터가 올바르지 않습니다',
        details: validation.errors
      });
    }

    // Rate Limiting (IP 기반)
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const rateLimitCheck = await checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: '요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요',
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    // 입력 데이터 정리 및 보안 처리
    const sanitizedData = sanitizeQuoteData(quoteData);
    
    // 견적 번호 생성
    const quoteNumber = await generateQuoteNumber();
    
    // 고객 정보 처리 (신규/기존 고객 확인)
    const customerResult = await processCustomerInfo(sanitizedData.customer);
    
    // 견적 요청 데이터베이스 저장
    const quoteRecord = await createQuoteRecord({
      ...sanitizedData,
      quoteNumber,
      customerId: customerResult.customerId,
      companyId: customerResult.companyId,
      clientIP,
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers.referer || ''
    });

    // 견적 아이템들 저장
    await createQuoteItems(quoteRecord.id, sanitizedData.items);

    // 견적 히스토리 기록
    await createQuoteHistory(quoteRecord.id, 'created', 'system', '견적 요청 생성');

    // 이메일 알림 발송 (비동기)
    sendQuoteNotifications(quoteRecord, sanitizedData.customer)
      .catch(error => console.error('이메일 발송 실패:', error));

    // 분석 데이터 기록 (비동기)
    logQuoteRequest({
      quoteId: quoteRecord.id,
      quoteNumber,
      customerEmail: sanitizedData.customer.contactEmail,
      items: sanitizedData.items,
      totalAmount: sanitizedData.subtotal,
      clientIP,
      userAgent: req.headers['user-agent']
    }).catch(error => console.error('분석 기록 실패:', error));

    // 성공 응답
    res.status(201).json({
      success: true,
      data: {
        quoteId: quoteRecord.id,
        quoteNumber: quoteNumber,
        estimatedResponse: '24시간',
        status: 'pending',
        message: '견적 요청이 성공적으로 접수되었습니다'
      }
    });

  } catch (error) {
    console.error('견적 생성 API 에러:', error);
    
    // 에러 유형에 따른 응답
    if (error.message.includes('duplicate')) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_REQUEST',
        message: '동일한 견적 요청이 이미 처리 중입니다'
      });
    }
    
    if (error.message.includes('database')) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
      });
    }

    // 일반적인 서버 오류
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '견적 처리 중 오류가 발생했습니다'
    });
  }
}

// ================================
// 유틸리티 함수들
// ================================

/**
 * Rate Limiting 검사
 */
async function checkRateLimit(clientIP) {
  try {
    const now = new Date();
    const oneHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    // 지난 1시간 동안의 요청 수 확인
    const { count } = await supabase
      .from('quote_requests')
      .select('id', { count: 'exact' })
      .eq('client_ip', clientIP)
      .gte('created_at', oneHour.toISOString());
    
    const maxRequests = 10; // 시간당 최대 10개 요청
    
    return {
      allowed: count < maxRequests,
      remaining: Math.max(0, maxRequests - count),
      retryAfter: count >= maxRequests ? 3600 : 0 // 1시간 후 재시도
    };
  } catch (error) {
    console.error('Rate limit 검사 실패:', error);
    // 에러 시에는 허용
    return { allowed: true, remaining: 10, retryAfter: 0 };
  }
}

/**
 * 견적 데이터 정리 및 보안 처리
 */
function sanitizeQuoteData(data) {
  return {
    customer: {
      contactName: sanitizeInput(data.customer.contactName),
      contactEmail: sanitizeInput(data.customer.contactEmail?.toLowerCase()),
      contactPhone: sanitizeInput(data.customer.contactPhone),
      contactTitle: sanitizeInput(data.customer.contactTitle),
      companyName: sanitizeInput(data.customer.companyName),
      companyCountry: sanitizeInput(data.customer.companyCountry),
      companyAddress: sanitizeInput(data.customer.companyAddress),
      companyIndustry: sanitizeInput(data.customer.companyIndustry),
      companySize: sanitizeInput(data.customer.companySize),
      additionalNotes: sanitizeInput(data.customer.additionalNotes),
      newsletter: Boolean(data.customer.newsletter),
      termsAgree: Boolean(data.customer.termsAgree)
    },
    items: data.items.map(item => ({
      productId: sanitizeInput(item.id),
      productName: sanitizeInput(item.product.name),
      productCategory: sanitizeInput(item.product.category),
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      unitPrice: Math.max(0, parseFloat(item.unitPrice) || 0),
      specifications: sanitizeInput(JSON.stringify(item.product.specifications)),
      customRequirements: sanitizeInput(item.customRequirements || ''),
      applicationType: sanitizeInput(item.applicationType || ''),
      certifications: Array.isArray(item.certifications) ? item.certifications : []
    })),
    projectInfo: {
      projectName: sanitizeInput(data.projectInfo?.projectName || ''),
      projectDescription: sanitizeInput(data.projectInfo?.projectDescription || ''),
      deliveryDeadline: data.projectInfo?.deliveryDeadline || null
    },
    subtotal: Math.max(0, parseFloat(data.subtotal) || 0),
    currency: ['KRW', 'JPY', 'USD', 'CNY'].includes(data.currency) ? data.currency : 'KRW',
    source: 'website'
  };
}

/**
 * 고객 정보 처리 (신규/기존 고객 확인)
 */
async function processCustomerInfo(customerData) {
  try {
    // 이메일로 기존 고객 확인
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('email', customerData.contactEmail)
      .single();

    if (existingCustomer) {
      // 기존 고객인 경우 정보 업데이트
      await supabase
        .from('customers')
        .update({
          first_name: customerData.contactName.split(' ')[0],
          last_name: customerData.contactName.split(' ').slice(1).join(' '),
          phone: customerData.contactPhone,
          job_title: customerData.contactTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id);

      return {
        customerId: existingCustomer.id,
        companyId: existingCustomer.company_id
      };
    }

    // 신규 고객인 경우 회사 정보 먼저 생성
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert([{
        company_name: customerData.companyName,
        industry: customerData.companyIndustry,
        company_size: customerData.companySize,
        address_line1: customerData.companyAddress,
        country: customerData.companyCountry,
        status: 'pending_verification',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (companyError) throw companyError;

    // 고객 정보 생성
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([{
        company_id: company.id,
        first_name: customerData.contactName.split(' ')[0],
        last_name: customerData.contactName.split(' ').slice(1).join(' '),
        email: customerData.contactEmail,
        phone: customerData.contactPhone,
        job_title: customerData.contactTitle,
        role: 'buyer',
        active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (customerError) throw customerError;

    return {
      customerId: customer.id,
      companyId: company.id
    };

  } catch (error) {
    console.error('고객 정보 처리 실패:', error);
    throw new Error('고객 정보 처리 중 오류 발생');
  }
}

/**
 * 견적 요청 레코드 생성
 */
async function createQuoteRecord(data) {
  try {
    const { data: quote, error } = await supabase
      .from('quote_requests')
      .insert([{
        quote_number: data.quoteNumber,
        customer_id: data.customerId,
        company_id: data.companyId,
        project_name: data.projectInfo.projectName,
        project_description: data.projectInfo.projectDescription,
        delivery_deadline: data.projectInfo.deliveryDeadline,
        special_requirements: data.customer.additionalNotes,
        subtotal: data.subtotal,
        currency: data.currency,
        status: 'pending',
        priority: 'normal',
        source: data.source,
        client_ip: data.clientIP,
        user_agent: data.userAgent,
        referrer: data.referrer,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return quote;

  } catch (error) {
    console.error('견적 레코드 생성 실패:', error);
    throw new Error('견적 레코드 생성 중 오류 발생');
  }
}

/**
 * 견적 아이템들 생성
 */
async function createQuoteItems(quoteId, items) {
  try {
    const quoteItems = items.map(item => ({
      quote_request_id: quoteId,
      product_sku: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.quantity * item.unitPrice,
      custom_specifications: item.specifications,
      custom_requirements: item.customRequirements,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('quote_items')
      .insert(quoteItems);

    if (error) throw error;

  } catch (error) {
    console.error('견적 아이템 생성 실패:', error);
    throw new Error('견적 아이템 생성 중 오류 발생');
  }
}

/**
 * 견적 히스토리 생성
 */
async function createQuoteHistory(quoteId, action, actor, notes) {
  try {
    const { error } = await supabase
      .from('quote_history')
      .insert([{
        quote_request_id: quoteId,
        action,
        actor,
        notes,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

  } catch (error) {
    console.error('견적 히스토리 생성 실패:', error);
    // 히스토리 생성 실패는 전체 프로세스를 중단시키지 않음
  }
}

/**
 * 이메일 알림 발송
 */
async function sendQuoteNotifications(quoteRecord, customerData) {
  try {
    // 고객 확인 이메일
    await sendQuoteConfirmationEmail({
      to: customerData.contactEmail,
      customerName: customerData.contactName,
      companyName: customerData.companyName,
      quoteNumber: quoteRecord.quote_number,
      language: determineLanguage(customerData.companyCountry)
    });

    // 내부 알림 이메일 (영업팀)
    await sendInternalQuoteNotification({
      quoteNumber: quoteRecord.quote_number,
      customerName: customerData.contactName,
      companyName: customerData.companyName,
      country: customerData.companyCountry,
      industry: customerData.companyIndustry,
      subtotal: quoteRecord.subtotal,
      currency: quoteRecord.currency
    });

  } catch (error) {
    console.error('이메일 발송 실패:', error);
    // 이메일 실패는 전체 프로세스를 중단시키지 않음
  }
}

/**
 * 내부 견적 알림 발송
 */
async function sendInternalQuoteNotification(data) {
  const salesEmails = {
    'KR': 'sales-korea@pure-flon.com',
    'JP': 'sales-japan@pure-flon.com',
    'TW': 'sales-taiwan@pure-flon.com',
    'CN': 'sales-china@pure-flon.com',
    'SG': 'sales-sea@pure-flon.com',
    'TH': 'sales-sea@pure-flon.com',
    'VN': 'sales-sea@pure-flon.com',
    'MY': 'sales-sea@pure-flon.com',
    'ID': 'sales-sea@pure-flon.com'
  };

  const salesEmail = salesEmails[data.country] || 'sales@pure-flon.com';
  
  // 내부 이메일 발송 로직 (실제 구현 시 이메일 서비스 연동)
  console.log(`내부 알림 발송: ${salesEmail}`, data);
}

/**
 * 고객 국가에 따른 언어 결정
 */
function determineLanguage(country) {
  const languageMap = {
    'KR': 'ko',
    'JP': 'ja', 
    'TW': 'zh-tw',
    'CN': 'zh-cn',
    'SG': 'en',
    'TH': 'th',
    'VN': 'vi',
    'MY': 'ms',
    'ID': 'id'
  };
  
  return languageMap[country] || 'en';
}

/**
 * 에러 로깅
 */
function logError(error, context) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
    userAgent: context.userAgent,
    clientIP: context.clientIP
  };
  
  console.error('API Error:', errorLog);
  
  // 프로덕션에서는 외부 로깅 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket, 또는 다른 로깅 서비스로 전송
  }
}