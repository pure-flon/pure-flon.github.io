/**
 * Pure-Flon 챗봇 위젯
 * - 제품 페이지 우하단 플로팅 챗 버튼
 * - GPT-4o mini 기반 B2B 제품 어시스턴트
 */

(function () {
  'use strict';

  const API_ENDPOINT = '/api/chat/message';
  const INITIAL_MESSAGE =
    "Hi! I'm PURE-FLON's product assistant. I can help with technical specs, document reviews, and guide you to a quote request. How can I help?";

  let history = [];
  let isOpen = false;
  let isLoading = false;

  function getProductContext() {
    const el = document.querySelector('[data-product]');
    return el ? el.getAttribute('data-product') : null;
  }

  function buildToggleBtn() {
    const btn = document.createElement('button');
    btn.id = 'pf-chat-toggle';
    btn.setAttribute('aria-label', 'Open product assistant');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`;
    return btn;
  }

  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = 'pf-chat-panel';
    panel.classList.add('pf-hidden');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Product assistant');
    panel.innerHTML = `
      <div class="pf-chat-header">
        <div class="pf-chat-header-dot"></div>
        <div>
          <div class="pf-chat-header-title">PURE-FLON Assistant</div>
          <div class="pf-chat-header-sub">Product & Quote Support</div>
        </div>
        <button class="pf-chat-close" aria-label="Close chat">✕</button>
      </div>
      <div class="pf-chat-messages" id="pf-chat-messages"></div>
      <div class="pf-chat-input-row">
        <textarea
          class="pf-chat-input"
          id="pf-chat-input"
          placeholder="Ask about specs, document reviews, or quote…"
          rows="1"
          maxlength="500"
        ></textarea>
        <button class="pf-chat-send" id="pf-chat-send" aria-label="Send message" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div class="pf-chat-footer">Powered by PURE-FLON · <a href="/quote/" style="color:#3b82f6;text-decoration:none">Request Quote</a></div>`;
    return panel;
  }

  function appendMessage(role, text, cta) {
    const container = document.getElementById('pf-chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.classList.add('pf-msg', role === 'user' ? 'pf-msg-user' : 'pf-msg-bot');
    div.textContent = text;
    if (cta) {
      const a = document.createElement('a');
      a.href = cta.url;
      a.textContent = cta.text;
      a.classList.add('pf-msg-cta');
      div.appendChild(document.createElement('br'));
      div.appendChild(a);
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function showTyping() {
    const container = document.getElementById('pf-chat-messages');
    if (!container) return null;
    const div = document.createElement('div');
    div.classList.add('pf-typing');
    div.id = 'pf-typing-indicator';
    div.innerHTML = '<span>●</span><span>●</span><span>●</span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function removeTyping() {
    document.getElementById('pf-typing-indicator')?.remove();
  }

  async function sendMessage(message) {
    if (isLoading || !message.trim()) return;
    isLoading = true;

    const sendBtn = document.getElementById('pf-chat-send');
    if (sendBtn) sendBtn.disabled = true;

    appendMessage('user', message);
    history.push({ role: 'user', content: message });

    showTyping();

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: getProductContext(),
          history: history.slice(-6),
        }),
      });

      removeTyping();

      const data = await res.json();
      const reply = data.reply || 'Sorry, something went wrong. Please contact contact@pure-flon.com';
      appendMessage('bot', reply, data.cta || null);
      history.push({ role: 'assistant', content: reply });
    } catch {
      removeTyping();
      appendMessage('bot', 'Connection error. Please contact contact@pure-flon.com', {
        text: 'Request Quote',
        url: '/quote/',
      });
    } finally {
      isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
      const input = document.getElementById('pf-chat-input');
      if (input) {
        input.value = '';
        input.style.height = 'auto';
        input.focus();
      }
    }
  }

  function togglePanel() {
    isOpen = !isOpen;
    const panel = document.getElementById('pf-chat-panel');
    if (!panel) return;
    if (isOpen) {
      panel.classList.remove('pf-hidden');
      document.getElementById('pf-chat-input')?.focus();
      // GA4 event
      if (typeof gtag === 'function') gtag('event', 'chatbot_open', { page: location.pathname });
    } else {
      panel.classList.add('pf-hidden');
    }
  }

  function init() {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/chat-widget.css';
    document.head.appendChild(link);

    const toggleBtn = buildToggleBtn();
    const panel = buildPanel();
    document.body.appendChild(toggleBtn);
    document.body.appendChild(panel);

    // Show welcome message
    appendMessage('bot', INITIAL_MESSAGE);

    // Toggle button
    toggleBtn.addEventListener('click', togglePanel);

    // Close button
    panel.querySelector('.pf-chat-close')?.addEventListener('click', togglePanel);

    // Send button
    const sendBtn = document.getElementById('pf-chat-send');
    sendBtn?.addEventListener('click', () => {
      const input = document.getElementById('pf-chat-input');
      if (input) sendMessage(input.value.trim());
    });

    // Input events
    const input = document.getElementById('pf-chat-input');
    if (input) {
      input.addEventListener('input', () => {
        sendBtn.disabled = !input.value.trim();
        // Auto-resize
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 90) + 'px';
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const msg = input.value.trim();
          if (msg) sendMessage(msg);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
