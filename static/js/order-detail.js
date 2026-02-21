/**
 * Order Detail Page - Interactive Features
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cancel order functionality
    initCancelOrder();
    
    // Initialize timeline animations
    initTimeline();
    
    // Initialize animations
    initAnimations();
});

/**
 * Initialize cancel order functionality with confirmation
 */
function initCancelOrder() {
    const cancelForm = document.querySelector('.cancel-form');
    
    if (cancelForm) {
        cancelForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show confirmation dialog
            if (confirm('آیا مطمئن هستید که می‌خواهید این سفارش را لغو کنید؟\n\nپس از لغو، امکان بازگرداندن سفارش وجود ندارد.')) {
                // Show loading state
                const btn = cancelForm.querySelector('button');
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="icon-spinner animate-spin"></i> در حال لغو...';
                }
                
                // Submit the form
                cancelForm.submit();
            }
        });
    }
}

/**
 * Initialize timeline animations
 */
function initTimeline() {
    const timeline = document.querySelector('.order-timeline');
    if (!timeline) return;
    
    const steps = timeline.querySelectorAll('.timeline-step');
    
    // Animate timeline steps on scroll
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateTimelineSteps();
            }
        });
    }, observerOptions);
    
    observer.observe(timeline);
}

/**
 * Animate timeline steps sequentially
 */
function animateTimelineSteps() {
    const timeline = document.querySelector('.order-timeline');
    if (!timeline) return;
    
    const steps = timeline.querySelectorAll('.timeline-step');
    
    steps.forEach((step, index) => {
        setTimeout(() => {
            step.style.opacity = '1';
            step.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

/**
 * Initialize general animations
 */
function initAnimations() {
    // Check if AOS is available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 600,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50
        });
    }
    
    // Add entrance animations to cards
    const cards = document.querySelectorAll('.order-items-card, .shipping-card, .order-summary-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });
}

/**
 * Format price with Persian/Arabic numerals
 */
function formatPrice(price) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const formatted = price.toString().replace(/\d/g, digit => persianDigits[digit]);
    return `${formatted} تومان`;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `site-toast site-toast-${type}`;
    toast.innerHTML = `
        <span class="site-toast-icon" aria-hidden="true"></span>
        <span class="site-toast-text">${message}</span>
        <div class="site-toast-progress" aria-hidden="true"></div>
    `;
    
    const container = document.getElementById('site-toast-container');
    if (container) {
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}
