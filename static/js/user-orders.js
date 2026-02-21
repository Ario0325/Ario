/**
 * User Orders Page - Interactive Features
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cancel order functionality
    initCancelOrder();
    
    // Add hover effects to order cards
    initOrderCards();
    
    // Initialize animations
    initAnimations();
});

/**
 * Initialize cancel order functionality with confirmation
 */
function initCancelOrder() {
    const cancelForms = document.querySelectorAll('.cancel-form');
    
    cancelForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show confirmation dialog
            if (confirm('آیا مطمئن هستید که می‌خواهید این سفارش را لغو کنید؟')) {
                // Show loading state
                const btn = form.querySelector('button');
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="icon-spinner animate-spin"></i> در حال لغو...';
                }
                
                // Submit the form
                form.submit();
            }
        });
    });
}

/**
 * Add hover effects to order cards
 */
function initOrderCards() {
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Initialize scroll animations
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
    
    // Add fade-in animation to order cards
    const orderCards = document.querySelectorAll('.order-card');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    orderCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
}

/**
 * Format number with Persian/Arabic numerals
 */
function formatNumber(num) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, digit => persianDigits[digit]);
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
