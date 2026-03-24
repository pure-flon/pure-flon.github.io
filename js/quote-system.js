/**
 * Pure-Flon 견적 시스템
 * 파일명: js/quote-system.js
 * 업데이트: 2025-07-28
 * 버전: v2.0.0 (무료 스택 최적화)
 */

class QuoteSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.errors = {};
        
        // Supabase 클라이언트 (향후 연동용)
        this.supabase = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadFromLocalStorage();
        this.updateUI();
        this.initValidation();
        this.initProductSelector();
        this.initSpecificationTabs();
    }
    
    bindEvents() {
        // Navigation buttons
        document.querySelector('.btn--prev')?.addEventListener('click', () => this.previousStep());
        document.querySelector('.btn--next')?.addEventListener('click', () => this.nextStep());
        document.querySelector('.btn--submit')?.addEventListener('click', (e) => this.submitForm(e));
        
        // Form inputs
        const form = document.getElementById('quote-form');
        if (form) {
            form.addEventListener('input', (e) => this.handleInputChange(e));
            form.addEventListener('change', (e) => this.handleInputChange(e));
        }
        
        // Product category selection
        document.querySelectorAll('input[name="productCategories"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateProductSelection());
        });
        
        // Specification tabs
        document.querySelectorAll('.spec-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchSpecTab(e));
        });
        
        // Auto-calculation for dimensions
        this.bindDimensionCalculation();
        
        // Auto-save every 30 seconds
        setInterval(() => this.saveToLocalStorage(), 30000);
        
        // Page unload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '작성 중인 견적 요청이 있습니다. 페이지를 떠나시겠습니까?';
            }
        });
    }
    
    bindDimensionCalculation() {
        const innerDiameter = document.getElementById('inner-diameter');
        const outerDiameter = document.getElementById('outer-diameter');
        const wallThickness = document.getElementById('wall-thickness');
        
        if (innerDiameter && outerDiameter && wallThickness) {
            // Auto-calculate wall thickness
            [innerDiameter, outerDiameter].forEach(input => {
                input.addEventListener('input', () => {
                    const id = parseFloat(innerDiameter.value) || 0;
                    const od = parseFloat(outerDiameter.value) || 0;
                    
                    if (id > 0 && od > id) {
                        const calculatedWallThickness = (od - id) / 2;
                        wallThickness.value = calculatedWallThickness.toFixed(1);
                        this.showCalculationHint('벽 두께가 자동으로 계산되었습니다.');
                    }
                });
            });
            
            // Auto-calculate outer diameter
            [innerDiameter, wallThickness].forEach(input => {
                input.addEventListener('input', () => {
                    const id = parseFloat(innerDiameter.value) || 0;
                    const wt = parseFloat(wallThickness.value) || 0;
                    
                    if (id > 0 && wt > 0) {
                        const calculatedOD = id + (wt * 2);
                        outerDiameter.value = calculatedOD.toFixed(1);
                        this.showCalculationHint('외경이 자동으로 계산되었습니다.');
                    }
                });
            });
        }
    }
    
    showCalculationHint(message) {
        // Create or update calculation hint
        let hint = document.querySelector('.calculation-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'calculation-hint';
            document.querySelector('.spec-content--active').appendChild(hint);
        }
        
        hint.textContent = message;
        hint.style.display = 'block';
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            hint.style.display = 'none';
        }, 3000);
    }
    
    initProductSelector() {
        // Add visual feedback for product selection
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        });
    }
    
    initSpecificationTabs() {
        // Initialize specification tabs
        this.updateSpecTabsVisibility();
    }
    
    updateSpecTabsVisibility() {
        const selectedCategories = this.getSelectedProductCategories();
        const specTabs = document.querySelectorAll('.spec-tab');
        
        // Show/hide tabs based on selected products
        if (selectedCategories.includes('medical')) {
            // Show medical-specific tabs
            this.showSpecTab('certifications');
        }
    }
    
    showSpecTab(tabName) {
        const tab = document.querySelector(`[data-tab="${tabName}"]`);
        if (tab) {
            tab.style.display = 'block';
        }
    }
    
    switchSpecTab(e) {
        e.preventDefault();
        const clickedTab = e.target;
        const tabName = clickedTab.dataset.tab;
        
        // Update tab navigation
        document.querySelectorAll('.spec-tab').forEach(tab => {
            tab.classList.remove('spec-tab--active');
        });
        clickedTab.classList.add('spec-tab--active');
        
        // Update tab content
        document.querySelectorAll('.spec-content').forEach(content => {
            content.classList.remove('spec-content--active');
        });
        document.querySelector(`[data-tab="${tabName}"].spec-content`).classList.add('spec-content--active');
    }
    
    handleInputChange(e) {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            if (!this.formData[name]) this.formData[name] = [];
            
            if (checked) {
                if (!this.formData[name].includes(value)) {
                    this.formData[name].push(value);
                }
            } else {
                this.formData[name] = this.formData[name].filter(item => item !== value);
            }
        } else {
            this.formData[name] = value;
        }
        
        // Clear previous error
        this.clearError(name);
        
        // Real-time validation
        this.validateField(name, value);
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Update summary if on last step
        if (this.currentStep === 4) {
            this.updateSummary();
        }
    }
    
    validateField(name, value) {
        const field = document.querySelector(`[name="${name}"]`);
        if (!field) return true;
        
        let isValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (field.hasAttribute('required') && !value.trim()) {
            isValid = false;
            errorMessage = '이 필드는 필수입니다.';
        }
        
        // Email validation
        if (name === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = '올바른 이메일 주소를 입력해주세요.';
            }
        }
        
        // Phone validation
        if (name === 'phone' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = '올바른 전화번호를 입력해주세요.';
            }
        }
        
        // Dimension validation
        if (['innerDiameter', 'outerDiameter', 'wallThickness'].includes(name) && value) {
            const numValue = parseFloat(value);
            if (numValue <= 0) {
                isValid = false;
                errorMessage = '0보다 큰 값을 입력해주세요.';
            }
        }
        
        // Cross-validation for dimensions
        if (name === 'outerDiameter' && value) {
            const innerDiameter = parseFloat(this.formData.innerDiameter) || 0;
            const outerDiameter = parseFloat(value) || 0;
            
            if (innerDiameter > 0 && outerDiameter <= innerDiameter) {
                isValid = false;
                errorMessage = '외경은 내경보다 커야 합니다.';
            }
        }
        
        if (isValid) {
            this.clearError(name);
        } else {
            this.showError(name, errorMessage);
        }
        
        return isValid;
    }
    
    showError(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        const errorElement = field?.parentNode.querySelector('.form-error');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            field.classList.add('form-input--error');
        }
        
        this.errors[fieldName] = message;
    }
    
    clearError(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        const errorElement = field?.parentNode.querySelector('.form-error');
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
            field?.classList.remove('form-input--error');
        }
        
        delete this.errors[fieldName];
    }
    
    updateProductSelection() {
        const selectedCategories = this.getSelectedProductCategories();
        
        // Update visual feedback
        document.querySelectorAll('.product-category').forEach(category => {
            const checkbox = category.querySelector('input[type="checkbox"]');
            if (checkbox.checked) {
                category.classList.add('product-category--selected');
            } else {
                category.classList.remove('product-category--selected');
            }
        });
        
        // Update specification tabs
        this.updateSpecTabsVisibility();
        
        // Show step 3 if products are selected
        if (selectedCategories.length > 0) {
            this.enableNextStep();
        }
    }
    
    getSelectedProductCategories() {
        return Array.from(document.querySelectorAll('input[name="productCategories"]:checked'))
                   .map(checkbox => checkbox.value);
    }
    
    nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateUI();
            this.saveToLocalStorage();
        }
    }
    
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateUI();
        }
    }
    
    validateCurrentStep() {
        const currentStepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            const value = field.type === 'checkbox' ? 
                         field.checked : 
                         field.value.trim();
            
            if (!this.validateField(field.name, value)) {
                isValid = false;
            }
        });
        
        // Special validation for step 2 (product selection)
        if (this.currentStep === 2) {
            const selectedProducts = this.getSelectedProductCategories();
            if (selectedProducts.length === 0) {
                this.showNotification('최소 하나의 제품을 선택해주세요.', 'warning');
                isValid = false;
            }
        }
        
        // Special validation for step 4 (agreements)
        if (this.currentStep === 4) {
            const privacyAgreement = document.querySelector('input[name="privacy-agreement"]');
            if (!privacyAgreement.checked) {
                this.showNotification('개인정보처리방침에 동의해주세요.', 'error');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    updateUI() {
        // Update progress indicator
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            step.classList.toggle('progress-step--active', index + 1 === this.currentStep);
            step.classList.toggle('progress-step--completed', index + 1 < this.currentStep);
        });
        
        // Update form steps
        document.querySelectorAll('.form-step').forEach((step, index) => {
            step.classList.toggle('form-step--active', index + 1 === this.currentStep);
        });
        
        // Update navigation buttons
        const prevBtn = document.querySelector('.btn--prev');
        const nextBtn = document.querySelector('.btn--next');
        const submitBtn = document.querySelector('.btn--submit');
        
        if (prevBtn) prevBtn.disabled = this.currentStep === 1;
        
        if (nextBtn && submitBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'inline-block';
                submitBtn.style.display = 'none';
            }
        }
        
        // Update summary on last step
        if (this.currentStep === 4) {
            this.updateSummary();
        }
        
        // Scroll to top
        document.querySelector('.quote-form-wrapper').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    updateSummary() {
        // Update basic info summary
        const basicSummary = document.getElementById('summary-basic');
        if (basicSummary) {
            basicSummary.innerHTML = `
                <div class="summary-row">
                    <span class="summary-label">회사명:</span>
                    <span class="summary-value">${this.formData.companyName || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">담당자:</span>
                    <span class="summary-value">${this.formData.contactPerson || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">이메일:</span>
                    <span class="summary-value">${this.formData.email || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">국가:</span>
                    <span class="summary-value">${this.getCountryName(this.formData.country) || '-'}</span>
                </div>
            `;
        }
        
        // Update products summary
        const productsSummary = document.getElementById('summary-products');
        if (productsSummary) {
            const selectedProducts = this.getSelectedProductCategories();
            const productNames = selectedProducts.map(category => {
                const productMap = {
                    'medical': '의료용 PTFE',
                    'semiconductor': '반도체용 PTFE',
                    'chemical': '화학용 PTFE'
                };
                return productMap[category] || category;
            });
            
            productsSummary.innerHTML = productNames.length > 0 ? 
                productNames.map(name => `<div class="summary-product">${name}</div>`).join('') :
                '<div class="summary-empty">선택된 제품이 없습니다.</div>';
        }
        
        // Update specifications summary
        const specsSummary = document.getElementById('summary-specs');
        if (specsSummary) {
            const specs = [];
            
            if (this.formData.innerDiameter) {
                specs.push(`내경: ${this.formData.innerDiameter}mm`);
            }
            if (this.formData.outerDiameter) {
                specs.push(`외경: ${this.formData.outerDiameter}mm`);
            }
            if (this.formData.length) {
                specs.push(`길이: ${this.formData.length}mm`);
            }
            if (this.formData.quantity) {
                specs.push(`수량: ${this.formData.quantity}개`);
            }
            
            specsSummary.innerHTML = specs.length > 0 ?
                specs.map(spec => `<div class="summary-spec">${spec}</div>`).join('') :
                '<div class="summary-empty">입력된 사양이 없습니다.</div>';
        }
    }
    
    getCountryName(countryCode) {
        const countryNames = {
            'KR': '대한민국',
            'JP': '일본',
            'TW': '대만',
            'CN': '중국',
            'TH': '태국',
            'VN': '베트남',
            'ID': '인도네시아',
            'MY': '말레이시아',
            'SG': '싱가포르',
            'PH': '필리핀'
        };
        return countryNames[countryCode] || countryCode;
    }
    
    async submitForm(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStep()) {
            return;
        }
        
        // Show loading state
        this.showLoading();
        
        try {
            // Generate quote number
            const quoteNumber = this.generateQuoteNumber();
            
            // Prepare form data
            const submitData = {
                ...this.formData,
                quoteNumber,
                selectedProducts: this.getSelectedProductCategories(),
                timestamp: new Date().toISOString(),
                source: 'website'
            };
            
            // Submit to backend (현재는 로컬 저장소에 저장)
            await this.saveQuoteRequest(submitData);
            
            // Send email notification (실제 구현시 백엔드 API 호출)
            await this.sendEmailNotification(submitData);
            
            // Show success
            this.showSuccess(quoteNumber);
            
            // Clear form data
            this.clearFormData();
            
        } catch (error) {
            console.error('Quote submission error:', error);
            this.showError('submit', '견적 요청 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            this.hideLoading();
        }
    }
    
    generateQuoteNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        
        return `Q-${year}${month}${day}-${time}`;
    }
    
    async saveQuoteRequest(data) {
        // 실제 구현시 Supabase에 저장
        // const { data: result, error } = await this.supabase
        //     .from('quote_requests')
        //     .insert([data]);
        
        // 현재는 로컬 저장소에 저장
        const savedQuotes = JSON.parse(localStorage.getItem('quote_requests') || '[]');
        savedQuotes.push(data);
        localStorage.setItem('quote_requests', JSON.stringify(savedQuotes));
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    async sendEmailNotification(data) {
        // 실제 구현시 이메일 API 호출
        // await fetch('/api/quotes/notify', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
        
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    showLoading() {
        document.querySelector('.quote-form').style.display = 'none';
        document.querySelector('.form-loading').style.display = 'block';
    }
    
    hideLoading() {
        document.querySelector('.form-loading').style.display = 'none';
    }
    
    showSuccess(quoteNumber) {
        document.querySelector('.form-loading').style.display = 'none';
        document.querySelector('.form-success').style.display = 'block';
        document.getElementById('quote-number').textContent = quoteNumber;
        
        // Track success event
        this.trackEvent('quote_submitted', {
            quote_number: quoteNumber,
            products: this.getSelectedProductCategories().join(',')
        });
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="닫기">&times;</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    saveToLocalStorage() {
        const saveData = {
            currentStep: this.currentStep,
            formData: this.formData,
            timestamp: Date.now()
        };
        localStorage.setItem('quote_form_draft', JSON.stringify(saveData));
    }
    
    loadFromLocalStorage() {
        const saved = localStorage.getItem('quote_form_draft');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Only load if saved within last 24 hours
                const twentyFourHours = 24 * 60 * 60 * 1000;
                if (Date.now() - data.timestamp < twentyFourHours) {
                    this.currentStep = data.currentStep || 1;
                    this.formData = data.formData || {};
                    this.populateForm();
                    
                    // Show restoration notification
                    this.showNotification('이전에 작성하던 견적 요청을 복원했습니다.', 'info');
                }
            } catch (error) {
                console.error('Error loading from localStorage:', error);
            }
        }
    }
    
    populateForm() {
        Object.keys(this.formData).forEach(name => {
            const field = document.querySelector(`[name="${name}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    const values = Array.isArray(this.formData[name]) ? this.formData[name] : [this.formData[name]];
                    field.checked = values.includes(field.value);
                } else {
                    field.value = this.formData[name];
                }
            }
        });
        
        // Update product selection UI
        this.updateProductSelection();
    }
    
    clearFormData() {
        this.formData = {};
        this.currentStep = 1;
        localStorage.removeItem('quote_form_draft');
    }
    
    hasUnsavedChanges() {
        return Object.keys(this.formData).length > 0;
    }
    
    trackEvent(eventName, eventData = {}) {
        // Google Analytics 4 tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        // Custom analytics tracking
        if (window.analytics) {
            window.analytics.track(eventName, eventData);
        }
    }
    
    initValidation() {
        // Add real-time validation styles
        const style = document.createElement('style');
        style.textContent = `
            .form-input--error {
                border-color: #dc3545;
                box-shadow: 0 0 0 0.1rem rgba(220, 53, 69, 0.25);
            }
            
            .form-error {
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: none;
            }
            
            .calculation-hint {
                background: #d4edda;
                color: #155724;
                padding: 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.875rem;
                margin-top: 0.5rem;
                display: none;
            }
            
            .notification {
                position: fixed;
                top: 1rem;
                right: 1rem;
                max-width: 400px;
                padding: 1rem;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification--info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            
            .notification--warning {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            
            .notification--error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0.7;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .product-category--selected .product-card {
                border-color: #007bff;
                background: #f8f9ff;
            }
        `;
        document.head.appendChild(style);
    }
    
    enableNextStep() {
        const nextBtn = document.querySelector('.btn--next');
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.classList.remove('btn--disabled');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on quote request page
    if (document.getElementById('quote-form')) {
        new QuoteSystem();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuoteSystem;
}