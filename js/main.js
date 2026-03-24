/*
파일명: main.js
Pure-Flon PTFE 튜브 B2B 웹사이트 메인 JavaScript
업데이트: 2025-01-31 v4.1.0 - 강제 새로고침
개선사항: ES2025 모던 문법, 성능 최적화, 접근성 개선, 모바일 최적화
*/

// ===== MODERN JAVASCRIPT UTILITIES =====
class PureFlonApp {
  constructor() {
    this.isLoaded = false;
    this.observers = new Map();
    this.animations = new Map();
    this.mobileBreakpoint = 768;
    
    this.init();
  }

  // 초기화
  async init() {
    try {
      await this.waitForDOM();
      this.setupEventListeners();
      this.initializeComponents();
      this.setupIntersectionObserver();
      this.setupPerformanceMonitoring();
      this.initializeAOS();
      this.isLoaded = true;
      
      console.log('✅ Pure-Flon App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
    }
  }

  // DOM 로딩 대기
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 스크롤 기반 헤더 효과
    this.setupScrollHeader();
    
    // 모바일 메뉴
    this.setupMobileMenu();
    
    // 부드러운 스크롤
    this.setupSmoothScrolling();
    
    // 스크롤 투 톱 버튼
    this.setupScrollToTop();
    
    // 폼 유효성 검사
    this.setupFormValidation();
    
    // 이미지 지연 로딩
    this.setupLazyLoading();
    
    // 키보드 네비게이션
    this.setupKeyboardNavigation();
  }

  // 헤더 스크롤 효과
  setupScrollHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      const scrollY = window.scrollY;
      
      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      // 스크롤 방향에 따른 헤더 숨김/표시
      if (scrollY > lastScrollY && scrollY > 200) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      
      lastScrollY = scrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // 모바일 메뉴
  setupMobileMenu() {
    const menuToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (!menuToggle || !navbarMenu) return;

    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      navbarMenu.classList.toggle('active');
      
      // 햄버거 아이콘 애니메이션
      menuToggle.classList.toggle('active');
      
      // 바디 스크롤 방지
      document.body.style.overflow = isExpanded ? '' : 'hidden';
    });

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!menuToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
        menuToggle.setAttribute('aria-expanded', 'false');
        navbarMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // 부드러운 스크롤
  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          this.smoothScrollTo(targetElement);
        }
      });
    });
  }

  smoothScrollTo(target, duration = 800) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetElement) return;

    const targetPosition = targetElement.offsetTop - 80; // 헤더 높이 고려
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let start = null;

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
      
      window.scrollTo(0, run);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

  // 이징 함수
  easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  // 스크롤 투 톱 버튼
  setupScrollToTop() {
    const scrollBtn = document.getElementById('scroll-to-top');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollBtn.style.display = 'flex';
      } else {
        scrollBtn.style.display = 'none';
      }
    });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 폼 유효성 검사
  setupFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
      });
      
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      });
    });
  }

  validateField(field) {
    const value = field.value.trim();
    const fieldGroup = field.closest('.form-group');
    
    // 필수 필드 검사
    if (field.hasAttribute('required') && !value) {
      this.showFieldError(field, '이 필드는 필수입니다.');
      return false;
    }
    
    // 이메일 검사
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(field, '올바른 이메일 주소를 입력해주세요.');
        return false;
      }
    }
    
    // 전화번호 검사
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[0-9-+\s()]{10,}$/;
      if (!phoneRegex.test(value)) {
        this.showFieldError(field, '올바른 전화번호를 입력해주세요.');
        return false;
      }
    }
    
    this.clearFieldError(field);
    return true;
  }

  showFieldError(field, message) {
    const fieldGroup = field.closest('.form-group');
    if (!fieldGroup) return;
    
    fieldGroup.classList.add('error');
    fieldGroup.classList.remove('valid');
    
    let errorElement = fieldGroup.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      fieldGroup.appendChild(errorElement);
    }
    
    errorElement.innerHTML = `<span class="error-icon">⚠️</span> ${message}`;
  }

  clearFieldError(field) {
    const fieldGroup = field.closest('.form-group');
    if (!fieldGroup) return;
    
    fieldGroup.classList.remove('error');
    if (field.value.trim()) {
      fieldGroup.classList.add('valid');
    }
    
    const errorElement = fieldGroup.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
    }
  }

  validateForm(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  // 이미지 지연 로딩
  setupLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    }
  }

  // 키보드 네비게이션
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  // 컴포넌트 초기화
  initializeComponents() {
    this.initFloatingElements();
    this.initCounters();
    this.initTabs();
    this.initAccordions();
    this.initTooltips();
  }

  // 플로팅 요소들
  initFloatingElements() {
    // 플로팅 카카오톡 버튼
    const kakaoBtn = document.createElement('div');
    kakaoBtn.className = 'floating-kakao-btn';
    kakaoBtn.innerHTML = `
      <a href="https://open.kakao.com/o/sPure-Flon" 
         target="_blank" 
         rel="noopener"
         class="floating-kakao-link">
        💬
        <div class="floating-tooltip">25년 전문가 카톡상담</div>
      </a>
    `;
    
    document.body.appendChild(kakaoBtn);
    
    // 스크롤 시 표시
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 200) {
        kakaoBtn.classList.add('visible');
      } else {
        kakaoBtn.classList.remove('visible');
      }
    });
  }

  // 숫자 카운터 애니메이션
  initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    const animateCounter = (counter) => {
      const target = parseInt(counter.getAttribute('data-count'));
      const increment = target / 100;
      let current = 0;
      
      const updateCounter = () => {
        if (current < target) {
          current += increment;
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };
      
      updateCounter();
    };
    
    // Intersection Observer로 뷰포트 진입 시 애니메이션 실행
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    });
    
    counters.forEach(counter => counterObserver.observe(counter));
  }

  // 탭 기능
  initTabs() {
    const tabGroups = document.querySelectorAll('.tab-group');
    
    tabGroups.forEach(group => {
      const tabs = group.querySelectorAll('.tab-button');
      const panels = group.querySelectorAll('.tab-panel');
      
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
          // 모든 탭 비활성화
          tabs.forEach(t => t.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          
          // 선택된 탭 활성화
          tab.classList.add('active');
          panels[index].classList.add('active');
        });
      });
    });
  }

  // 아코디언 기능
  initAccordions() {
    const accordions = document.querySelectorAll('.accordion-item');
    
    accordions.forEach(item => {
      const trigger = item.querySelector('.accordion-trigger');
      const content = item.querySelector('.accordion-content');
      
      if (trigger && content) {
        trigger.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          
          // 다른 아코디언 닫기 (선택사항)
          accordions.forEach(otherItem => {
            if (otherItem !== item) {
              otherItem.classList.remove('open');
            }
          });
          
          // 현재 아코디언 토글
          item.classList.toggle('open', !isOpen);
          trigger.setAttribute('aria-expanded', !isOpen);
        });
      }
    });
  }

  // 툴팁 기능
  initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
      let tooltip = null;
      
      const showTooltip = (e) => {
        const text = trigger.getAttribute('data-tooltip');
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        const rect = trigger.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
      };
      
      const hideTooltip = () => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
      };
      
      trigger.addEventListener('mouseenter', showTooltip);
      trigger.addEventListener('mouseleave', hideTooltip);
      trigger.addEventListener('focus', showTooltip);
      trigger.addEventListener('blur', hideTooltip);
    });
  }

  // Intersection Observer 설정
  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    // 스크롤 애니메이션 관찰자
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // 애니메이션 대상 요소들
    const animatedElements = document.querySelectorAll(`
      .fade-in, .slide-up, .reveal-left, .reveal-right, .scale-in,
      .feature-card, .product-card, .application-card, .stagger-container
    `);

    animatedElements.forEach(el => {
      animationObserver.observe(el);
    });

    this.observers.set('animation', animationObserver);
  }

  // 성능 모니터링
  setupPerformanceMonitoring() {
    // Core Web Vitals 측정
    if ('web-vital' in window) {
      // 실제 성능 측정 라이브러리가 있을 때 사용
      console.log('📊 Performance monitoring enabled');
    }

    // 이미지 로딩 성능 측정
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('load', () => {
        console.log(`🖼️ Image loaded: ${img.src}`);
      });
    });

    // 페이지 로딩 시간 측정
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      console.log(`⚡ Page loaded in ${loadTime.toFixed(2)}ms`);
    });
  }

  // AOS 애니메이션 초기화
  initializeAOS() {
    // AOS 라이브러리가 로드되었는지 확인
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 1000,
        easing: 'ease-out-cubic',
        once: true,
        offset: 120,
        delay: 0,
        anchorPlacement: 'top-bottom',
        disable: function() {
          // 모바일에서는 AOS 비활성화
          return window.innerWidth < 768;
        }
      });
      
      console.log('🎬 AOS animations initialized');
    } else {
      console.warn('⚠️ AOS library not loaded');
    }
  }

  // 유틸리티 메서드들
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // 로컬 스토리지 헬퍼
  storage = {
    set: (key, value) => {
      try {
        localStorage.setItem(`pureflon_${key}`, JSON.stringify(value));
      } catch (e) {
        console.warn('LocalStorage not available:', e);
      }
    },
    
    get: (key) => {
      try {
        const item = localStorage.getItem(`pureflon_${key}`);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.warn('LocalStorage not available:', e);
        return null;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(`pureflon_${key}`);
      } catch (e) {
        console.warn('LocalStorage not available:', e);
      }
    }
  };

  // 모달 기능
  openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal(modal));
    }
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });
  }

  closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 툴팁 표시
  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    setTimeout(() => {
      tooltip.remove();
    }, 3000);
  }

  // 정리 메서드
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.animations.clear();
    console.log('🧹 Pure-Flon App destroyed');
  }
}

// ===== 애플리케이션 시작 =====
document.addEventListener('DOMContentLoaded', () => {
  window.pureFlonApp = new PureFlonApp();
});

// ===== 전역 유틸리티 함수 =====
window.PureFlon = {
  // 부드러운 스크롤
  scrollTo: (target, duration = 800) => {
    if (window.pureFlonApp) {
      window.pureFlonApp.smoothScrollTo(target, duration);
    }
  },

  // 툴팁 표시
  showTooltip: (element, text) => {
    if (window.pureFlonApp) {
      window.pureFlonApp.showTooltip(element, text);
    }
  },

  // 모달 열기
  openModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal && window.pureFlonApp) {
      window.pureFlonApp.openModal(modal);
    }
  },

  // 스토리지 헬퍼
  storage: {
    set: (key, value) => {
      if (window.pureFlonApp) {
        window.pureFlonApp.storage.set(key, value);
      }
    },
    get: (key) => {
      return window.pureFlonApp ? window.pureFlonApp.storage.get(key) : null;
    }
  }
};