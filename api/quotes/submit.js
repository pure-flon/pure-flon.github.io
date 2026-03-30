/**
 * Pure-Flon 견적 요청 API
 * 파일 위치: api/quotes/submit.js
 * Vercel Serverless Function
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Resend 클라이언트 초기화
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    // 요청 데이터 검증
    const {
      companyName,
      contactPerson,
      email,
      phone,
      country,
      businessType,
      productCategories,
      specifications,
      operatingConditions,
      quantity,
      annualVolume,
      budgetRange,
      deliveryDate,
      specialRequirements,
      certifications,
      quoteNumber
    } = req.body;

    // 필수 필드 검증
    if (!companyName || !contactPerson || !email || !productCategories) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: '회사명, 담당자, 이메일, 제품 선택은 필수입니다.'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: '올바른 이메일 주소를 입력해주세요.'
      });
    }

    // 견적 번호 생성 (없는 경우)
    const finalQuoteNumber = quoteNumber || generateQuoteNumber();

    // 데이터베이스에 견적 요청 저장
    const { data: quoteData, error: dbError } = await supabase
      .from('quote_requests')
      .insert([
        {
          quote_number: finalQuoteNumber,
          company_name: companyName,
          contact_person: contactPerson,
          email,
          phone,
          country,
          business_type: businessType,
          product_categories: productCategories,
          specifications: specifications || {},
          operating_conditions: operatingConditions || {},
          quantity: quantity ? parseInt(quantity) : null,
          annual_volume: annualVolume ? parseInt(annualVolume) : null,
          budget_range: budgetRange,
          delivery_date: deliveryDate,
          special_requirements: specialRequirements,
          certifications: certifications || [],
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: 'Database error',
        message: '데이터베이스 저장 중 오류가 발생했습니다.'
      });
    }

    // 고객 확인 이메일 발송
    await sendCustomerConfirmationEmail({
      email,
      contactPerson,
      companyName,
      quoteNumber: finalQuoteNumber,
      productCategories
    });

    // 관리자 알림 이메일 발송
    await sendAdminNotificationEmail({
      quoteData: quoteData,
      customerEmail: email
    });

    // 성공 응답
    res.status(200).json({
      success: true,
      message: '견적 요청이 성공적으로 접수되었습니다.',
      quoteNumber: finalQuoteNumber,
      id: quoteData.id
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
}

// 견적 번호 생성 함수
function generateQuoteNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `Q-${year}${month}${day}-${hours}${minutes}`;
}

// 고객 확인 이메일 발송
async function sendCustomerConfirmationEmail({ email, contactPerson, companyName, quoteNumber, productCategories }) {
  try {
    const productNames = productCategories.map(category => {
      const productMap = {
        'medical': '의료용 PTFE',
        'semiconductor': '반도체용 PTFE', 
        'chemical': '화학용 PTFE'
      };
      return productMap[category] || category;
    }).join(', ');

    await resend.emails.send({
      from: `Pure-Flon <${process.env.FROM_EMAIL || 'noreply@pure-flon.com'}>`,
      to: [email],
      subject: `견적 요청 확인 - ${quoteNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>견적 요청 확인</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">견적 요청 접수 완료</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Pure-Flon에서 견적 요청을 접수했습니다</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #495057; margin-top: 0;">견적 요청 정보</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold; width: 30%;">견적 번호:</td>
                <td style="padding: 8px 0; color: #007bff; font-weight: bold;">${quoteNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">회사명:</td>
                <td style="padding: 8px 0;">${companyName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">담당자:</td>
                <td style="padding: 8px 0;">${contactPerson}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">요청 제품:</td>
                <td style="padding: 8px 0;">${productNames}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">접수 일시:</td>
                <td style="padding: 8px 0;">${new Date().toLocaleString('ko-KR')}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #155724;">📞 다음 단계</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>전문 엔지니어가 귀하의 요구사항을 검토합니다</li>
              <li><strong>24시간 내</strong>에 상세한 견적서를 이메일로 발송해드립니다</li>
              <li>추가 문의사항이 있으시면 언제든 연락해주세요</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #495057; margin-top: 0;">문의하기</h3>
            <p style="margin: 5px 0;"><strong>전화:</strong> 02-1234-5678</p>
            <p style="margin: 5px 0;"><strong>이메일:</strong> quotes@pure-flon.com</p>
            <p style="margin: 5px 0;"><strong>업무시간:</strong> 평일 09:00 - 18:00</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>본 이메일은 견적 요청 확인을 위해 자동 발송되었습니다.</p>
            <p>&copy; 2025 Pure-Flon Co., Ltd. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Customer email error:', error);
  }
}

// 관리자 알림 이메일 발송
async function sendAdminNotificationEmail({ quoteData, customerEmail }) {
  try {
    const productNames = quoteData.product_categories.map(category => {
      const productMap = {
        'medical': '의료용 PTFE',
        'semiconductor': '반도체용 PTFE',
        'chemical': '화학용 PTFE'
      };
      return productMap[category] || category;
    }).join(', ');

    await resend.emails.send({
      from: `Pure-Flon System <${process.env.FROM_EMAIL || 'system@pure-flon.com'}>`,
      to: [process.env.TO_EMAIL || 'contact@pure-flon.com'],
      subject: `🔔 새로운 견적 요청 - ${quoteData.company_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>새로운 견적 요청</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc3545; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 22px;">🔔 새로운 견적 요청</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">즉시 처리가 필요합니다</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #495057; margin-top: 0;">고객 정보</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold; width: 25%;">견적 번호:</td>
                <td style="padding: 8px 0; color: #dc3545; font-weight: bold;">${quoteData.quote_number}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">회사명:</td>
                <td style="padding: 8px 0;">${quoteData.company_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">담당자:</td>
                <td style="padding: 8px 0;">${quoteData.contact_person}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">이메일:</td>
                <td style="padding: 8px 0;"><a href="mailto:${customerEmail}" style="color: #007bff;">${customerEmail}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">전화번호:</td>
                <td style="padding: 8px 0;">${quoteData.phone || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">국가:</td>
                <td style="padding: 8px 0;">${quoteData.country || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">업종:</td>
                <td style="padding: 8px 0;">${quoteData.business_type || '-'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #856404;">📋 요청 제품 정보</h3>
            <p><strong>제품 카테고리:</strong> ${productNames}</p>
            ${quoteData.quantity ? `<p><strong>수량:</strong> ${quoteData.quantity.toLocaleString()}개</p>` : ''}
            ${quoteData.annual_volume ? `<p><strong>연간 예상 수량:</strong> ${quoteData.annual_volume.toLocaleString()}개</p>` : ''}
            ${quoteData.budget_range ? `<p><strong>예산 범위:</strong> ${quoteData.budget_range}</p>` : ''}
            ${quoteData.delivery_date ? `<p><strong>희망 납기:</strong> ${quoteData.delivery_date}</p>` : ''}
          </div>
          
          ${quoteData.specifications && Object.keys(quoteData.specifications).length > 0 ? `
          <div style="background: #e7f3ff; border: 1px solid #b8daff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #004085;">⚙️ 제품 사양</h3>
            <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 14px;">${JSON.stringify(quoteData.specifications, null, 2)}</pre>
          </div>
          ` : ''}
          
          ${quoteData.special_requirements ? `
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #721c24;">📝 특수 요구사항</h3>
            <p style="margin: 0;">${quoteData.special_requirements}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 8px;">
            <h3 style="color: #0c5460; margin-top: 0;">⏰ 처리 기한</h3>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #0c5460;">24시간 내 견적서 발송 필요</p>
          </div>
          
          <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>접수 시간: ${new Date().toLocaleString('ko-KR')}</p>
            <p>&copy; 2025 Pure-Flon Co., Ltd. - 자동 알림 시스템</p>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Admin email error:', error);
  }
}