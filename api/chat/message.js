/**
 * Pure-Flon 챗봇 API — Vercel Serverless Function
 * 경로: /api/chat/message
 * 모델: GPT-4o mini + KB 인젝션
 */

const SYSTEM_PROMPT = `You are the PURE-FLON product assistant. PURE-FLON manufactures high-performance fluoropolymer tubing: ESD PFA, PFA, and PTFE tubes for semiconductor, chemical, pharmaceutical, and food industries.

ROLE: Guide B2B buyers from product questions to a quote request.

PRICING: Never state specific prices. Always guide to the quote form with: "For pricing and volume discounts, please submit a quote request at /quote/"

QUOTE CTA: After 2-3 product questions, naturally suggest: "Would you like to request a quote? I can guide you to our RFQ form."

TONE: Professional, technical, helpful. Match the user's language (Korean if user writes Korean, English otherwise). Keep answers concise — 2-4 sentences max.

FORBIDDEN:
- Do not make warranty claims beyond documented specs
- Do not reveal specific pricing
- Do not discuss competitors negatively
- Do not provide legal/regulatory advice

ESCALATION: For complex requirements: "Our technical team can provide detailed consultation. Please include your application details in the quote form at /quote/"

---
KNOWLEDGE BASE:

## Products

### ESD PFA Tubing
- Material: ESD PFA (Electrostatic Dissipative Perfluoroalkoxy alkane)
- Surface resistivity: 10^6 ~ 10^9 Ω (ESD safe)
- Temperature: -200°C to +260°C
- Chemical resistance: strong acids, alkalis, organic solvents
- Purity: ultra-high purity (semiconductor wet process grade)
- Qualification references: review requirements during RFQ
- Color: black (ESD standard)

### PFA Tubing
- Material: Perfluoroalkoxy alkane (PFA)
- Temperature: -200°C to +260°C
- Chemical resistance: all chemicals except fluorine compounds
- Transparency: high clarity (visible flow)
- Documentation: confirm application and regulatory needs during RFQ

### PTFE Tubing
- Material: Polytetrafluoroethylene (PTFE)
- Temperature: -200°C to +260°C continuous, +300°C intermittent
- Chemical resistance: highest grade
- Friction coefficient: 0.04 (lowest in industry)
- Documentation: provide material and process references on request

### Dimensions
- ID: 1/16" to 2" (custom available)
- OD: standard + custom
- Length: 1m, 5m, 10m standard / custom cut available
- Colors: natural (translucent) / black (ESD) / custom

## Industries
- Semiconductor fab: wet bench, HF/H2SO4/H2O2 lines, UPW, ESD-controlled cleanrooms
- Chemical/petrochemical: strong acid/alkali transfer, reactor connections
- Pharmaceutical/biotech: documentation-reviewed transfer, sterilization, and process-routing programs
- Food processing: food-contact review and beverage or dairy transfer lines

## Purchasing
- Quote: submit at /quote/ — receive response within 1 business day
- Volume discount: higher quantity = lower unit price (contact for tiers)
- Minimum order: small quantities and samples available (minimum 1 piece)
- Payment: Stripe invoice (wire transfer / card); small orders: Stripe card; large orders: wire + Stripe invoice
- Lead time: stock items 3-5 business days; custom: 2-4 weeks

## Shipping (Incoterms)
- EXW (Ex Works): factory dispatch, buyer handles shipping — default
- FOB: seller responsible to Korean port loading
- DDP: delivered with customs (large orders only, by arrangement)
- DHL Express: small orders/samples, automatic rate quote available

## Documentation and qualification
- Material and process references are reviewed per application
- Fab, food-contact, or medical documentation is coordinated during RFQ
- Do not claim certifications unless the customer asks for confirmed documents

## Technical Documents
- TDS (Technical Data Sheet): available at /docs/
- SDS (Safety Data Sheet): request via email
- Documentation requests: email contact@pure-flon.com`;

const RATE_LIMIT = new Map(); // IP → { count, resetAt }

function checkRateLimit(ip) {
  const now = Date.now();
  const limit = RATE_LIMIT.get(ip);
  if (!limit || now > limit.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 3600000 }); // 1 hour window
    return true;
  }
  if (limit.count >= 20) return false;
  limit.count++;
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://pure-flon.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { message, context, history } = req.body || {};

  if (!message || typeof message !== 'string' || message.length > 500) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set');
    return res.status(503).json({
      reply: 'Our assistant is temporarily unavailable. Please contact contact@pure-flon.com for help.',
      cta: null,
    });
  }

  const systemContent = context
    ? `${SYSTEM_PROMPT}\n\nCurrent page context: User is viewing ${context} product page.`
    : SYSTEM_PROMPT;

  const messages = [{ role: 'system', content: systemContent }];

  if (Array.isArray(history)) {
    for (const turn of history.slice(-6)) { // last 3 exchanges
      if (turn.role && turn.content && typeof turn.content === 'string') {
        messages.push({ role: turn.role, content: turn.content.slice(0, 300) });
      }
    }
  }

  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 350,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', response.status, err);
      return res.status(503).json({
        reply: 'Our assistant is temporarily unavailable. Please contact contact@pure-flon.com',
        cta: null,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    // Detect if reply mentions /quote/ to attach CTA
    const hasQuoteCta = /\/quote\/|quote form|request a quote|RFQ/i.test(reply);

    return res.status(200).json({
      reply,
      cta: hasQuoteCta
        ? { text: 'Request a Quote', url: '/quote/' }
        : null,
    });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(503).json({
      reply: 'Our assistant is temporarily unavailable. Please contact contact@pure-flon.com',
      cta: null,
    });
  }
}
