/**
 * Pure-Flon 고객 포털 시스템
 * 파일명: js/customer-portal.js
 * 업데이트: 2025-07-28
 * 버전: v2.0.0 (실시간 업데이트 및 무료 스택 최적화)
 */

class CustomerPortal {
    constructor() {
        this.user = null;
        this.quotes = [];
        this.orders = [];
        this.notifications = [];
        this.realTimeSubscription = null;
        
        // Supabase 클라이언트 (향후 연동용)
        this.supabase = null;
        
        this.init();
    }
    
    init() {
        this.loadUserData();
        this.bindEvents();
        this.initNotifications();
        this.initRealTimeUpdates();
        this.loadDashboardData();
        this.initCharts();
    }
    
    bindEvents() {
        // User menu toggle
        const userMenuToggle = document.querySelector('.user-menu__toggle');
        if (userMenuToggle) {
            userMenuToggle.addEventListener('click', () => this.toggleUserMenu());
        }
        
        // Notification bell
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.toggleNotifications());
        }
        
        // Mark all notifications as read
        const markAllRead = document.querySelector('.mark-all-read');
        if (markAllRead) {
            markAllRead.addEventListener('click', () => this.markAllNotificationsRead());
        }
        
        // Quick action buttons
        this.bindQuickActions();
        
        // Period selector
        const periodSelector = document.querySelector('.period-selector');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => this.updateStatsPeriod(e.target.value));
        }
        
        // Document download buttons
        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => this.downloadDocument(e));
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Auto-refresh every 5 minutes
        setInterval(() => this.refreshData(), 5 * 60 * 1000);
    }
    
    bindQuickActions() {
        // Quote actions
        document.querySelectorAll('.quote-item .btn-icon').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuoteAction(e));
        });
        
        // Order tracking
        document.querySelectorAll('.order-item').forEach(item => {
            item.addEventListener('click', () => this.showOrderDetails(item));
        });
    }
    
    toggleUserMenu() {
        const toggle = document.querySelector('.user-menu__toggle');
        const dropdown = document.querySelector('.user-menu__dropdown');
        
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !isOpen);
        dropdown.classList.toggle('user-menu__dropdown--open', !isOpen);
    }
    
    toggleNotifications() {
        const dropdown = document.querySelector('.notification-dropdown');
        dropdown.classList.toggle('notification-dropdown--open');
        
        // Mark as viewed (not necessarily read)
        this.markNotificationsAsViewed();
    }
    
    markAllNotificationsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        
        this.updateNotificationUI();
        this.saveNotificationsToStorage();
        
        // Update backend (실제 구현시)
        // this.updateNotificationsInBackend();
    }
    
    markNotificationsAsViewed() {
        const notificationBtn = document.querySelector('.notification-btn');
        const unreadCount = notificationBtn.dataset.count;
        
        if (unreadCount > 0) {
            notificationBtn.dataset.count = '0';
            notificationBtn.classList.remove('notification-btn--has-unread');
        }
    }
    
    updateNotificationUI() {
        const notificationList = document.querySelector('.notification-list');
        const notificationBtn = document.querySelector('.notification-btn');
        
        if (notificationList) {
            notificationList.innerHTML = this.notifications.map(notification => `
                <div class="notification-item ${notification.read ? '' : 'notification-item--unread'}">
                    <div class="notification-content">
                        <p class="notification-title">${notification.title}</p>
                        <p class="notification-time">${this.formatRelativeTime(notification.timestamp)}</p>
                    </div>
                    ${!notification.read ? '<div class="notification-dot"></div>' : ''}
                </div>
            `).join('');
        }
        
        // Update badge count
        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (notificationBtn) {
            notificationBtn.dataset.count = unreadCount;
            notificationBtn.classList.toggle('notification-btn--has-unread', unreadCount > 0);
        }
    }
    
    loadUserData() {
        // 실제 구현시 Supabase에서 로드
        // const user = await this.supabase.auth.getUser();
        
        // 현재는 로컬 스토리지 또는 하드코딩된 데이터 사용
        this.user = {
            id: 'user_001',
            name: '김담당',
            company: '삼성전자',
            email: 'kim@samsung.com',
            avatar: null
        };
        
        this.updateUserUI();
    }
    
    updateUserUI() {
        // Update user avatar
        const userAvatar = document.querySelector('.user-avatar span');
        if (userAvatar && this.user) {
            userAvatar.textContent = this.user.name.charAt(0);
        }
        
        // Update user info
        const userName = document.querySelector('.user-name');
        const userCompany = document.querySelector('.user-company');
        
        if (userName) userName.textContent = this.user.name;
        if (userCompany) userCompany.textContent = this.user.company;
        
        // Update welcome message
        const welcomeTitle = document.querySelector('.welcome-title .highlight');
        if (welcomeTitle) welcomeTitle.textContent = this.user.name;
        
        const welcomeDescription = document.querySelector('.welcome-description');
        if (welcomeDescription) {
            welcomeDescription.textContent = `${this.user.company} 고객 포털에 오신 것을 환영합니다. 최신 견적 현황과 주문 정보를 확인하세요.`;
        }
    }
    
    async loadDashboardData() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Load data from various sources
            await Promise.all([
                this.loadQuotes(),
                this.loadOrders(),
                this.loadDocuments(),
                this.loadStats(),
                this.loadNotifications()
            ]);
            
            // Update UI
            this.updateDashboardUI();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showErrorState('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.hideLoadingState();
        }
    }
    
    async loadQuotes() {
        // 실제 구현시 Supabase에서 로드
        // const { data, error } = await this.supabase
        //     .from('quote_requests')
        //     .select('*')
        //     .eq('customer_id', this.user.id)
        //     .order('created_at', { ascending: false })
        //     .limit(10);
        
        // 임시 데이터
        this.quotes = [
            {
                id: 'Q-2025-0128',
                product: '의료용 PTFE 튜브',
                specs: 'ID: 8mm, OD: 10mm, L: 500mm',
                date: '2025-01-28',
                status: 'approved',
                amount: '₩1,200,000'
            },
            {
                id: 'Q-2025-0125',
                product: '반도체용 PTFE 튜브',
                specs: 'ID: 12mm, OD: 16mm, L: 1000mm',
                date: '2025-01-25',
                status: 'pending',
                amount: '₩2,400,000'
            },
            {
                id: 'Q-2025-0122',
                product: '화학용 PTFE 튜브',
                specs: 'ID: 6mm, OD: 8mm, L: 2000mm',
                date: '2025-01-22',
                status: 'draft',
                amount: null
            }
        ];
    }
    
    async loadOrders() {
        // 임시 데이터
        this.orders = [
            {
                id: 'PO-2025-0015',
                product: '의료용 PTFE 튜브 x 500개',
                orderDate: '2025-01-20',
                deliveryDate: '2025-02-10',
                status: 'manufacturing',
                progress: 60
            },
            {
                id: 'PO-2025-0012',
                product: '반도체용 PTFE 튜브 x 200개',
                orderDate: '2025-01-15',
                deliveryDate: '2025-02-05',
                status: 'quality_check',
                progress: 90
            }
        ];
    }
    
    async loadDocuments() {
        // 임시 데이터
        this.documents = [
            {
                id: 'doc_001',
                name: '의료용 PTFE 데이터시트',
                type: 'PDF',
                size: '2.4MB',
                date: '2025-01-25',
                downloadCount: 15
            },
            {
                id: 'doc_002',
                name: '화학 호환성 차트',
                type: 'PDF',
                size: '1.8MB',
                date: '2025-01-20',
                downloadCount: 8
            }
        ];
    }
    
    async loadStats() {
        // 임시 데이터
        this.stats = {
            quotes: { current: 8, previous: 6, change: 25 },
            approved: { current: 6, previous: 5, change: 20 },
            orders: { current: 4, previous: 3, change: 33 },
            amount: { current: 2400000, previous: 2100000, change: 15 }
        };
    }
    
    async loadNotifications() {
        // 로컬 스토리지에서 알림 로드
        const saved = localStorage.getItem('customer_notifications');
        if (saved) {
            this.notifications = JSON.parse(saved);
        } else {
            // 기본 알림 데이터
            this.notifications = [
                {
                    id: 'notif_001',
                    title: '견적서 Q-2025-0128 승인됨',
                    type: 'quote_approved',
                    read: false,
                    timestamp: Date.now() - 2 * 60 * 60 * 1000 // 2시간 전
                },
                {
                    id: 'notif_002',
                    title: '신제품 카탈로그 업데이트',
                    type: 'catalog_update',
                    read: false,
                    timestamp: Date.now() - 24 * 60 * 60 * 1000 // 1일 전
                },
                {
                    id: 'notif_003',
                    title: '주문 PO-2025-0015 제조 시작',
                    type: 'order_update',
                    read: true,
                    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3일 전
                }
            ];
        }
        
        this.updateNotificationUI();
    }
    
    updateDashboardUI() {
        this.updateQuotesList();
        this.updateOrdersList();
        this.updateStatCards();
        this.updateDocumentsList();
    }
    
    updateQuotesList() {
        const quoteList = document.querySelector('.quote-list');
        if (!quoteList) return;
        
        quoteList.innerHTML = this.quotes.map(quote => `
            <div class="quote-item" data-quote-id="${quote.id}">
                <div class="quote-info">
                    <h3 class="quote-number">${quote.id}</h3>
                    <p class="quote-product">${quote.product}</p>
                    <p class="quote-specs">${quote.specs}</p>
                    <p class="quote-date">${quote.date}</p>
                </div>
                <div class="quote-status">
                    <span class="status-badge status-badge--${quote.status}">
                        ${this.getStatusText(quote.status)}
                    </span>
                    <div class="quote-actions">
                        ${this.getQuoteActionButtons(quote)}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Re-bind events
        this.bindQuickActions();
    }
    
    updateOrdersList() {
        const orderList = document.querySelector('.order-list');
        if (!orderList) return;
        
        orderList.innerHTML = this.orders.map(order => `
            <div class="order-item" data-order-id="${order.id}">
                <div class="order-info">
                    <h3 class="order-number">${order.id}</h3>
                    <p class="order-product">${order.product}</p>
                    <p class="order-date">주문일: ${order.orderDate}</p>
                    <p class="order-delivery">예상 납기: ${order.deliveryDate}</p>
                </div>
                <div class="order-status">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${order.progress}%"></div>
                    </div>
                    <span class="status-text">${this.getOrderStatusText(order.status)} (${order.progress}%)</span>
                </div>
            </div>
        `).join('');
    }
    
    updateStatCards() {
        const statCards = document.querySelectorAll('.stat-card');
        const stats = [
            { value: this.stats.quotes.current, change: this.stats.quotes.change },
            { value: this.stats.approved.current, change: this.stats.approved.change },
            { value: this.stats.orders.current, change: this.stats.orders.change },
            { value: this.formatCurrency(this.stats.amount.current), change: this.stats.amount.change }
        ];
        
        statCards.forEach((card, index) => {
            const stat = stats[index];
            if (stat) {
                const valueElement = card.querySelector('.stat-value');
                const changeElement = card.querySelector('.stat-change');
                
                if (valueElement) valueElement.textContent = stat.value;
                if (changeElement) {
                    changeElement.textContent = `+${stat.change}%`;
                    changeElement.className = `stat-change stat-change--${stat.change >= 0 ? 'up' : 'down'}`;
                }
            }
        });
    }
    
    updateDocumentsList() {
        const documentList = document.querySelector('.document-list');
        if (!documentList) return;
        
        documentList.innerHTML = this.documents.map(doc => `
            <div class="document-item" data-doc-id="${doc.id}">
                <div class="document-icon">📄</div>
                <div class="document-info">
                    <h3 class="document-name">${doc.name}</h3>
                    <p class="document-meta">${doc.type} • ${doc.size} • ${doc.date}</p>
                </div>
                <button class="btn-download" title="다운로드" data-doc-id="${doc.id}">⬇️</button>
            </div>
        `).join('');
        
        // Re-bind download events
        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => this.downloadDocument(e));
        });
    }
    
    getStatusText(status) {
        const statusMap = {
            'draft': '초안',
            'pending': '검토 중',
            'approved': '승인됨',
            'rejected': '거절됨',
            'expired': '만료됨'
        };
        return statusMap[status] || status;
    }
    
    getOrderStatusText(status) {
        const statusMap = {
            'ordered': '주문 접수',
            'manufacturing': '제조 중',
            'quality_check': '품질 검사 중',
            'packaging': '포장 중',
            'shipped': '출고 완료',
            'delivered': '배송 완료'
        };
        return statusMap[status] || status;
    }
    
    getQuoteActionButtons(quote) {
        switch (quote.status) {
            case 'approved':
                return `
                    <button class="btn-icon" title="견적서 다운로드" data-action="download" data-quote-id="${quote.id}">📄</button>
                    <button class="btn-icon" title="주문하기" data-action="order" data-quote-id="${quote.id}">🛒</button>
                `;
            case 'pending':
                return `
                    <button class="btn-icon" title="상세 보기" data-action="view" data-quote-id="${quote.id}">👁️</button>
                    <button class="btn-icon" title="수정하기" data-action="edit" data-quote-id="${quote.id}">✏️</button>
                `;
            case 'draft':
                return `
                    <button class="btn-icon" title="계속 작성" data-action="continue" data-quote-id="${quote.id}">✏️</button>
                    <button class="btn-icon" title="삭제" data-action="delete" data-quote-id="${quote.id}">🗑️</button>
                `;
            default:
                return `<button class="btn-icon" title="상세 보기" data-action="view" data-quote-id="${quote.id}">👁️</button>`;
        }
    }
    
    handleQuoteAction(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const action = e.target.dataset.action;
        const quoteId = e.target.dataset.quoteId;
        
        switch (action) {
            case 'download':
                this.downloadQuote(quoteId);
                break;
            case 'order':
                this.createOrder(quoteId);
                break;
            case 'view':
                this.viewQuote(quoteId);
                break;
            case 'edit':
                this.editQuote(quoteId);
                break;
            case 'continue':
                this.continueQuote(quoteId);
                break;
            case 'delete':
                this.deleteQuote(quoteId);
                break;
        }
    }
    
    downloadQuote(quoteId) {
        // 실제 구현시 PDF 생성 API 호출
        this.showNotification(`견적서 ${quoteId} 다운로드를 시작합니다.`, 'info');
        
        // 가상의 다운로드 처리
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = `#`; // 실제 구현시 PDF URL
            link.download = `quote-${quoteId}.pdf`;
            link.click();
        }, 1000);
    }
    
    createOrder(quoteId) {
        const quote = this.quotes.find(q => q.id === quoteId);
        if (quote) {
            if (confirm(`견적서 ${quoteId}를 기반으로 주문을 생성하시겠습니까?`)) {
                // 실제 구현시 주문 생성 API 호출
                this.showNotification(`주문이 성공적으로 생성되었습니다.`, 'success');
                
                // 주문 목록 업데이트
                this.addNewOrder(quote);
            }
        }
    }
    
    addNewOrder(quote) {
        const newOrder = {
            id: `PO-${Date.now()}`,
            product: quote.product,
            orderDate: new Date().toISOString().split('T')[0],
            deliveryDate: this.calculateDeliveryDate(),
            status: 'ordered',
            progress: 0
        };
        
        this.orders.unshift(newOrder);
        this.updateOrdersList();
        
        // 알림 추가
        this.addNotification({
            title: `주문 ${newOrder.id} 접수됨`,
            type: 'order_created',
            timestamp: Date.now()
        });
    }
    
    calculateDeliveryDate() {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 21); // 3주 후
        return deliveryDate.toISOString().split('T')[0];
    }
    
    viewQuote(quoteId) {
        // 견적 상세 모달 또는 페이지로 이동
        window.location.href = `quotes.html?id=${quoteId}`;
    }
    
    editQuote(quoteId) {
        // 견적 수정 페이지로 이동
        window.location.href = `../quote/request.html?edit=${quoteId}`;
    }
    
    continueQuote(quoteId) {
        // 견적 작성 계속하기
        window.location.href = `../quote/request.html?continue=${quoteId}`;
    }
    
    deleteQuote(quoteId) {
        if (confirm(`견적서 ${quoteId}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            // 실제 구현시 삭제 API 호출
            this.quotes = this.quotes.filter(q => q.id !== quoteId);
            this.updateQuotesList();
            this.showNotification(`견적서 ${quoteId}가 삭제되었습니다.`, 'info');
        }
    }
    
    showOrderDetails(orderItem) {
        const orderId = orderItem.dataset.orderId;
        const order = this.orders.find(o => o.id === orderId);
        
        if (order) {
            // 주문 상세 모달 표시
            this.showOrderModal(order);
        }
    }
    
    showOrderModal(order) {
        const modal = document.createElement('div');
        modal.className = 'modal modal--order-details';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>주문 상세 정보</h3>
                    <button class="modal-close" aria-label="닫기">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-details">
                        <div class="detail-row">
                            <span class="detail-label">주문 번호:</span>
                            <span class="detail-value">${order.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">제품:</span>
                            <span class="detail-value">${order.product}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">주문일:</span>
                            <span class="detail-value">${order.orderDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">예상 납기:</span>
                            <span class="detail-value">${order.deliveryDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">진행 상태:</span>
                            <span class="detail-value">${this.getOrderStatusText(order.status)} (${order.progress}%)</span>
                        </div>
                    </div>
                    
                    <div class="order-timeline">
                        <h4>제조 진행 상황</h4>
                        <div class="timeline-progress">
                            ${this.generateOrderTimeline(order)}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn--secondary modal-close">닫기</button>
                    <button class="btn btn--primary" onclick="window.print()">인쇄</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal events
        modal.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
            el.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // ESC key to close
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
    
    generateOrderTimeline(order) {
        const steps = [
            { id: 'ordered', label: '주문 접수', progress: 0 },
            { id: 'manufacturing', label: '제조 중', progress: 25 },
            { id: 'quality_check', label: '품질 검사', progress: 75 },
            { id: 'packaging', label: '포장', progress: 90 },
            { id: 'shipped', label: '출고', progress: 95 },
            { id: 'delivered', label: '배송 완료', progress: 100 }
        ];
        
        return steps.map(step => {
            const isCompleted = order.progress >= step.progress;
            const isCurrent = order.status === step.id;
            
            return `
                <div class="timeline-step ${isCompleted ? 'timeline-step--completed' : ''} ${isCurrent ? 'timeline-step--current' : ''}">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <span class="timeline-label">${step.label}</span>
                        ${isCurrent ? `<span class="timeline-progress">${order.progress}%</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    downloadDocument(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const docId = e.target.dataset.docId;
        const document = this.documents.find(d => d.id === docId);
        
        if (document) {
            this.showNotification(`${document.name} 다운로드를 시작합니다.`, 'info');
            
            // 실제 구현시 파일 다운로드 API 호출
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = `#`; // 실제 구현시 파일 URL
                link.download = document.name;
                link.click();
                
                // 다운로드 카운트 증가
                document.downloadCount++;
                this.updateDocumentsList();
            }, 500);
        }
    }
    
    updateStatsPeriod(period) {
        // 실제 구현시 선택된 기간에 따른 통계 데이터 로드
        this.showNotification(`${period} 통계를 불러오는 중...`, 'info');
        
        // 임시로 랜덤 데이터 생성
        setTimeout(() => {
            this.stats = {
                quotes: { current: Math.floor(Math.random() * 20) + 5, change: Math.floor(Math.random() * 50) },
                approved: { current: Math.floor(Math.random() * 15) + 3, change: Math.floor(Math.random() * 40) },
                orders: { current: Math.floor(Math.random() * 10) + 2, change: Math.floor(Math.random() * 60) },
                amount: { current: Math.floor(Math.random() * 5000000) + 1000000, change: Math.floor(Math.random() * 30) }
            };
            
            this.updateStatCards();
        }, 1000);
    }
    
    initRealTimeUpdates() {
        // 실제 구현시 Supabase 실시간 구독
        // this.realTimeSubscription = this.supabase
        //     .channel('dashboard_updates')
        //     .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_requests' }, 
        //         payload => this.handleQuoteUpdate(payload))
        //     .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
        //         payload => this.handleOrderUpdate(payload))
        //     .subscribe();
        
        // 현재는 임시로 5분마다 폴링
        setInterval(() => {
            this.checkForUpdates();
        }, 5 * 60 * 1000);
    }
    
    async checkForUpdates() {
        try {
            // 실제 구현시 서버에서 업데이트 확인
            const hasUpdates = Math.random() > 0.8; // 20% 확률로 업데이트
            
            if (hasUpdates) {
                this.addNotification({
                    title: '새로운 업데이트가 있습니다',
                    type: 'system_update',
                    timestamp: Date.now()
                });
                
                await this.refreshData();
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }
    
    async refreshData() {
        try {
            await this.loadDashboardData();
            this.showNotification('데이터가 업데이트되었습니다.', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }
    
    addNotification(notification) {
        const newNotification = {
            id: `notif_${Date.now()}`,
            read: false,
            ...notification
        };
        
        this.notifications.unshift(newNotification);
        this.updateNotificationUI();
        this.saveNotificationsToStorage();
        
        // 브라우저 알림 (권한이 있는 경우)
        this.showBrowserNotification(notification.title);
    }
    
    showBrowserNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pure-Flon 고객 포털', {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        }
    }
    
    saveNotificationsToStorage() {
        localStorage.setItem('customer_notifications', JSON.stringify(this.notifications));
    }
    
    initNotifications() {
        // 브라우저 알림 권한 요청
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    initCharts() {
        // 간단한 차트 초기화 (Chart.js 없이)
        this.drawSimpleChart();
    }
    
    drawSimpleChart() {
        // 실제 구현시 Chart.js 또는 D3.js 사용
        // 현재는 CSS만으로 간단한 차트 구현
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            // 월별 견적 요청 수 차트 (예시)
            const monthlyData = [5, 8, 6, 10, 7, 12, 9, 8];
            const maxValue = Math.max(...monthlyData);
            
            chartContainer.innerHTML = monthlyData.map((value, index) => {
                const height = (value / maxValue) * 100;
                return `
                    <div class="chart-bar" style="height: ${height}%;" title="${value}개">
                        <span class="chart-value">${value}</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    handleOutsideClick(e) {
        // Close user menu if clicking outside
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.querySelector('.user-menu__dropdown');
            if (dropdown && dropdown.classList.contains('user-menu__dropdown--open')) {
                this.toggleUserMenu();
            }
        }
        
        // Close notifications if clicking outside
        if (!e.target.closest('.notification-bell')) {
            const dropdown = document.querySelector('.notification-dropdown');
            if (dropdown && dropdown.classList.contains('notification-dropdown--open')) {
                dropdown.classList.remove('notification-dropdown--open');
            }
        }
    }
    
    showLoadingState() {
        const loadingElements = document.querySelectorAll('.dashboard-card');
        loadingElements.forEach(card => {
            card.classList.add('loading');
        });
    }
    
    hideLoadingState() {
        const loadingElements = document.querySelectorAll('.dashboard-card');
        loadingElements.forEach(card => {
            card.classList.remove('loading');
        });
    }
    
    showErrorState(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="닫기">&times;</button>
            </div>
        `;
        
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
    
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return new Date(timestamp).toLocaleDateString();
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0
        }).format(amount);
    }
    
    destroy() {
        // Clean up subscriptions and event listeners
        if (this.realTimeSubscription) {
            this.realTimeSubscription.unsubscribe();
        }
        
        // Clear intervals
        clearInterval(this.refreshInterval);
        clearInterval(this.updateCheckInterval);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on portal pages
    if (document.body.classList.contains('portal-page')) {
        window.customerPortal = new CustomerPortal();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerPortal;
}