/**
 * آریو شاپ — سیستم اعلان سفارش‌های جدید
 * Order Notifications System v1.0
 */

(function() {
    'use strict';
    
    // تنظیمات
    const CONFIG = {
        apiUrl: '/cart/api/new-orders/',
        checkInterval: 15000, // 15 ثانیه
        maxNotifications: 5,
        notificationDuration: 8000, // 8 ثانیه
        soundEnabled: true
    };
    
    // متغیرهای وضعیت
    let lastCheckTime = null;
    let notificationQueue = [];
    let isPageVisible = true;
    let checkIntervalId = null;
    let notificationContainer = null;
    
    // صدای اعلان (Web Audio API)
    let audioContext = null;
    
    // تابع پخش صدای اعلان
    function playNotificationSound() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('صدا پشتیبانی نمی‌شود:', e);
        }
    }
    
    // تابع ایجاد کانتینر اعلان‌ها
    function createNotificationContainer() {
        if (document.getElementById('order-notification-container')) {
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'order-notification-container';
        container.className = 'order-notification-container';
        document.body.appendChild(container);
        notificationContainer = container;
        
        // اضافه کردن استایل‌ها
        addNotificationStyles();
    }
    
    // تابع اضافه کردن استایل‌ها
    function addNotificationStyles() {
        if (document.getElementById('order-notification-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'order-notification-styles';
        style.textContent = `
            /* کانتینر اعلان‌ها */
            .order-notification-container {
                position: fixed;
                top: 80px;
                left: 20px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 380px;
                pointer-events: none;
            }
            
            /* اعلان تکی */
            .order-notification {
                display: flex;
                align-items: flex-start;
                gap: 14px;
                padding: 16px 18px;
                background: linear-gradient(135deg, var(--ap-card, #1a1a24) 0%, var(--ap-surface, #18181f) 100%);
                border: 1px solid var(--ap-border, rgba(255,255,255,0.08));
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 30px var(--ap-primary-glow, rgba(34,197,94,0.15));
                pointer-events: auto;
                animation: notificationSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                backdrop-filter: blur(10px);
            }
            
            .order-notification.removing {
                animation: notificationSlideOut 0.4s ease forwards;
            }
            
            @keyframes notificationSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-100px) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
            }
            
            @keyframes notificationSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateX(-100px) scale(0.8);
                }
            }
            
            /* آیکون اعلان */
            .notification-icon {
                width: 48px;
                height: 48px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                animation: iconPulse 2s ease-in-out infinite;
            }
            
            .notification-icon.new-order {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
            }
            
            .notification-icon svg {
                width: 26px;
                height: 26px;
                color: white;
            }
            
            @keyframes iconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            /* محتوای اعلان */
            .notification-content {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-size: 14px;
                font-weight: 700;
                color: var(--ap-text, #f1f5f9);
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .notification-badge {
                display: inline-flex;
                align-items: center;
                padding: 3px 8px;
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border-radius: 20px;
                font-size: 10px;
                font-weight: 600;
                color: white;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                animation: badgePulse 1.5s ease-in-out infinite;
            }
            
            @keyframes badgePulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .notification-text {
                font-size: 13px;
                color: var(--ap-text-muted, #94a3b8);
                line-height: 1.5;
            }
            
            .notification-text strong {
                color: var(--ap-accent, #a78bfa);
                font-weight: 600;
            }
            
            .notification-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-top: 8px;
                font-size: 11px;
                color: var(--ap-text-dim, #64748b);
            }
            
            .notification-time {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .notification-amount {
                font-weight: 700;
                color: #22c55e !important;
                font-size: 14px;
            }
            
            /* دکمه بستن */
            .notification-close {
                position: absolute;
                top: 8px;
                left: 8px;
                width: 24px;
                height: 24px;
                border: none;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: all 0.2s ease;
                color: var(--ap-text-muted, #94a3b8);
            }
            
            .order-notification:hover .notification-close {
                opacity: 1;
            }
            
            .notification-close:hover {
                background: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }
            
            /* نشانگر تعداد سفارش */
            .order-counter-badge {
                position: fixed;
                top: 70px;
                left: 20px;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 14px;
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border-radius: 50px;
                color: white;
                font-size: 13px;
                font-weight: 600;
                box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
                z-index: 99998;
                cursor: pointer;
                transition: all 0.3s ease;
                animation: badgeBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            .order-counter-badge:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 25px rgba(34, 197, 94, 0.5);
            }
            
            .order-counter-badge svg {
                width: 18px;
                height: 18px;
            }
            
            .order-counter-badge .count {
                background: rgba(255,255,255,0.3);
                padding: 2px 8px;
                border-radius: 20px;
                min-width: 24px;
                text-align: center;
            }
            
            @keyframes badgeBounce {
                0% { transform: scale(0); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            /* استایل‌های روشن */
            .order-notification.light {
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                border-color: rgba(0,0,0,0.08);
                box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 0 30px rgba(34,197,94,0.1);
            }
            
            .order-notification.light .notification-title {
                color: #1e293b;
            }
            
            .order-notification.light .notification-text {
                color: #64748b;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .order-notification-container {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                }
                
                .order-counter-badge {
                    left: 10px;
                    right: 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // تابع نمایش اعلان
    function showNotification(order) {
        // بررسی تعداد اعلان‌ها
        const existingNotifications = document.querySelectorAll('.order-notification:not(.removing)');
        if (existingNotifications.length >= CONFIG.maxNotifications) {
            const oldest = existingNotifications[0];
            oldest.classList.add('removing');
            setTimeout(() => oldest.remove(), 400);
        }
        
        // ایجاد اعلان
        const notification = document.createElement('div');
        notification.className = 'order-notification';
        notification.dataset.orderId = order.id;
        
        // تشخیص تم روشن
        const isLight = document.body.classList.contains('theme-pearl-white') || 
                       getComputedStyle(document.documentElement).getPropertyValue('--theme-is-dark') === 'false';
        if (isLight) {
            notification.classList.add('light');
        }
        
        // استفاده از تاریخ شمسی از API یا محاسبه本地ی
        const persianDateTime = order.persian_datetime || {
            date: getTimeAgo(order.created_at),
            time: ''
        };
        
        notification.innerHTML = `
            <button class="notification-close" aria-label="بستن">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="notification-icon new-order">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
            </div>
            <div class="notification-content">
                <div class="notification-title">
                    سفارش جدید!
                    <span class="notification-badge">${order.status_display}</span>
                </div>
                <div class="notification-text">
                    سفارش <strong>${order.order_number}</strong> ثبت شد<br>
                    مشتری: <strong>${order.customer_name}</strong>
                </div>
                <div class="notification-meta">
                    <span class="notification-amount">${formatPrice(order.total)} تومان</span>
                    <span class="notification-time">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${persianDateTime.date || getTimeAgo(order.created_at)}
                    </span>
                </div>
            </div>
        `;
        
        // رویده دکمه بستن
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notification.classList.add('removing');
            setTimeout(() => notification.remove(), 400);
        });
        
        // اضافه به صفحه
        if (!notificationContainer) {
            createNotificationContainer();
        }
        notificationContainer.appendChild(notification);
        
        // پخش صدا
        if (CONFIG.soundEnabled && isPageVisible) {
            playNotificationSound();
        }
        
        // حذف خودکار بعد از مدتی
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('removing');
                setTimeout(() => notification.remove(), 400);
            }
        }, CONFIG.notificationDuration);
    }
    
    // تابع فرمت قیمت
    function formatPrice(price) {
        return new Intl.NumberFormat('fa-IR').format(price);
    }
    
    // تابع زمان نسبی - با پشتیبانی از timezone
    function getTimeAgo(datetimeStr) {
        //datetimeStr می‌تواند به فرمت‌های مختلف باشد
        let date;
        if (datetimeStr.includes('+')) {
            // فرمت ISO با timezone
            date = new Date(datetimeStr);
        } else {
            // فرمت معمولی - فرض می‌کنیم UTC است
            date = new Date(datetimeStr + 'Z');
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        
        if (diffSeconds < 5) return 'همین الان';
        if (diffSeconds < 60) return `${diffSeconds} ثانیه پیش`;
        
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} ساعت پیش`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} روز پیش`;
        
        // برگشت تاریخ شمسی
        return formatPersianDate(date);
    }
    
    // تابع فرمت تاریخ شمسی
    function formatPersianDate(date) {
        // محاسبه تاریخ شمسی
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // تبدیل به شمسی
        const persianDate = toPersianCalendar(year, month, day);
        
        const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        
        return `${persianDate.day} ${months[persianDate.month - 1]}`;
    }
    
    // تابع تبدیل میلادی به شمسی
    function toPersianCalendar(gy, gm, gd) {
        const daysOfMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        // Calculate the day of year
        let dayOfYear = gd;
        for (let i = 0; i < gm - 1; i++) {
            dayOfYear += daysOfMonth[i];
        }
        
        // Leap year in Gregorian calendar
        if ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) {
            if (gm > 2) dayOfYear++;
        }
        
        // Calculate Persian year
        const persianYear = gy - 621;
        
        // Find the starting point of Persian year
        let persianDayOfYear = dayOfYear;
        const vernalEquinoxDay = 20;
        
        // Days in each month
        const persianDaysOfMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
        
        let persianMonth, persianDay;
        
        if (dayOfYear >= vernalEquinoxDay) {
            persianDayOfYear = dayOfYear - vernalEquinoxDay + 1;
            for (persianMonth = 0; persianMonth < 12; persianMonth++) {
                if (persianDayOfYear <= persianDaysOfMonth[persianMonth]) {
                    persianDay = persianDayOfYear;
                    break;
                }
                persianDayOfYear -= persianDaysOfMonth[persianMonth];
            }
        } else {
            persianDayOfYear = dayOfYear + 286;
            persianMonth = 9;
            for (let i = 9; i < 12; i++) {
                if (persianDayOfYear <= persianDaysOfMonth[i]) {
                    persianDay = persianDayOfYear;
                    break;
                }
                persianDayOfYear -= persianDaysOfMonth[i];
            }
            if (persianMonth === 12 && persianDayOfYear > 29) {
                persianMonth = 10;
                persianDay = persianDayOfYear - 29;
            }
        }
        
        return {
            year: persianYear,
            month: persianMonth + 1,
            day: persianDay
        };
    }
    
    // تابع بررسی سفارش‌های جدید
    async function checkNewOrders() {
        if (!isPageVisible) return;
        
        try {
            const url = new URL(CONFIG.apiUrl, window.location.origin);
            if (lastCheckTime) {
                url.searchParams.set('since', lastCheckTime);
            }
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            if (data.success && data.orders && data.orders.length > 0) {
                // به‌روزرسانی زمان آخرین بررسی
                lastCheckTime = data.server_time;
                
                // نمایش اعلان برای هر سفارش جدید
                data.orders.forEach(order => {
                    // بررسی آیا این سفارش قبلاً نمایش داده شده
                    const existingNotification = document.querySelector(`[data-order-id=\"${order.id}\"]`);
                    if (!existingNotification) {
                        showNotification(order);
                    }
                });
                
                // به‌روزرسانشمارنده
                updateOrderCounter(data.total_count);
            } else if (data.success) {
                updateOrderCounter(data.total_count);
            }
            
        } catch (error) {
            console.error('خطا در بررسی سفارش‌ها:', error);
        }
    }
    
    // تابع به‌روزرسانی شمارنده
    function updateOrderCounter(count) {
        let badge = document.getElementById('order-counter-badge');
        
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('div');
                badge.id = 'order-counter-badge';
                badge.className = 'order-counter-badge';
                badge.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <span class="count">${count}</span>
                    سفارش جدید
                `;
                
                // کلیک برای رفتن به بخش سفارش‌ها
                badge.addEventListener('click', () => {
                    window.location.href = '/admin/Cart_Module/order/';
                });
                
                document.body.appendChild(badge);
            } else {
                const countSpan = badge.querySelector('.count');
                if (countSpan) {
                    countSpan.textContent = count;
                }
            }
            
            // انیمیشن pulse
            badge.style.animation = 'none';
            badge.offsetHeight; // Trigger reflow
            badge.style.animation = 'badgeBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        } else if (badge) {
            badge.remove();
        }
    }
    
    // تابع مدیریت visibility change
    function handleVisibilityChange() {
        isPageVisible = !document.hidden;
        
        if (isPageVisible) {
            // بررسی فوری وقتی صفحه فعال شد
            checkNewOrders();
            
            // شروع مجدد interval
            if (checkIntervalId) {
                clearInterval(checkIntervalId);
            }
            checkIntervalId = setInterval(checkNewOrders, CONFIG.checkInterval);
        }
    }
    
    // تابع مقداردهی اولیه
    function init() {
        // فقط در صفحه ادمین اجرا شود
        if (!window.location.pathname.startsWith('/admin')) {
            return;
        }
        
        // فقط برای staff members
        if (!document.body.classList.contains('grp-admin')) {
            // صبر برای لود شدن کامل صفحه
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
                return;
            }
        }
        
        // ایجاد کانتینر
        createNotificationContainer();
        
        // بررسی اولیه
        checkNewOrders();
        
        // شروع interval
        checkIntervalId = setInterval(checkNewOrders, CONFIG.checkInterval);
        
        // Event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Event listener برای آنلاین شدن
        window.addEventListener('online', () => {
            checkNewOrders();
        });
        
        console.log('سیستم اعلان سفارش‌ها فعال شد ✓');
    }
    
    // اجرای اولیه
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // خروجی عمومی
    window.OrderNotifications = {
        refresh: checkNewOrders,
        getConfig: () => CONFIG,
    };
    
})();
