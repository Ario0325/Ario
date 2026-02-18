/**
 * product-discount-box.js
 * انیمیشن‌ها و عملکرد ویجت کد تخفیف صفحه جزئیات محصول
 * Product Detail Page Discount Code Widget
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // Configuration
    // ═══════════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        inputId: 'product-discount-input',
        applyBtnId: 'product-discount-apply-btn',
        formId: 'product-discount-form',
        hiddenInputId: 'product-discount-code-input',
        messageClass: 'discount-box-message',
        activeClass: 'discount-box-active',
        loadingClass: 'discount-box-loading',
        animationDuration: 300,
        // رنگ‌های سایت
        successColor: '#28a745',
        errorColor: '#dc3545'
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DOM Elements
    // ═══════════════════════════════════════════════════════════════════════
    
    let elements = {};

    /**
     * Initialize DOM elements
     */
    function initElements() {
        elements.input = document.getElementById(CONFIG.inputId);
        elements.applyBtn = document.getElementById(CONFIG.applyBtnId);
        elements.form = document.getElementById(CONFIG.formId);
        elements.hiddenInput = document.getElementById(CONFIG.hiddenInputId);
        elements.discountBox = document.getElementById('product-discount-box');
        
        // Create message element if it doesn't exist
        if (!document.querySelector('.' + CONFIG.messageClass)) {
            const messageEl = document.createElement('div');
            messageEl.className = CONFIG.messageClass;
            messageEl.innerHTML = '<span class="discount-box-message-icon"></span><span class="discount-box-message-text"></span>';
            if (elements.form) {
                elements.form.parentNode.insertBefore(messageEl, elements.form);
            }
        }
        elements.message = document.querySelector('.' + CONFIG.messageClass);
        
        // Create active discount element if it doesn't exist
        if (!document.querySelector('.' + CONFIG.activeClass)) {
            const activeEl = document.createElement('div');
            activeEl.className = CONFIG.activeClass;
            activeEl.innerHTML = `
                <div class="discount-box-active-info">
                    <span class="discount-box-active-icon"><i class="icon-check"></i></span>
                    <span class="discount-box-active-label">کد تخفیف اعمال شده:</span>
                    <span class="discount-box-active-code"></span>
                </div>
                <div class="discount-box-active-amount"></div>
                <button type="button" class="discount-box-remove-btn" id="discount-remove-btn">
                    <i class="icon-times"></i>
                    <span>حذف</span>
                </button>
            `;
            if (elements.discountBox) {
                elements.discountBox.appendChild(activeEl);
            }
        }
        elements.activeDiscount = document.querySelector('.' + CONFIG.activeClass);
        
        // Create loading element
        if (!document.querySelector('.' + CONFIG.loadingClass)) {
            const loadingEl = document.createElement('div');
            loadingEl.className = CONFIG.loadingClass;
            loadingEl.innerHTML = '<span class="discount-box-spinner"></span><span>در حال بررسی...</span>';
            if (elements.discountBox) {
                elements.discountBox.appendChild(loadingEl);
            }
        }
        elements.loading = document.querySelector('.' + CONFIG.loadingClass);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Utility Functions
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Add CSS animation to element
     */
    function animate(element, animationClass) {
        element.classList.remove(animationClass);
        void element.offsetWidth; // Trigger reflow
        element.classList.add(animationClass);
    }

    /**
     * Show message
     */
    function showMessage(type, text) {
        if (!elements.message) return;
        
        elements.message.className = CONFIG.messageClass + ' ' + type;
        elements.message.querySelector('.discount-box-message-icon').innerHTML = 
            type === 'success' ? '<i class="icon-check"></i>' : '<i class="icon-times"></i>';
        elements.message.querySelector('.discount-box-message-text').textContent = text;
        
        animate(elements.message, 'show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }

    /**
     * Hide message
     */
    function hideMessage() {
        if (!elements.message) return;
        elements.message.classList.remove('show');
    }

    /**
     * Show loading
     */
    function showLoading() {
        if (elements.loading) {
            elements.loading.classList.add('show');
        }
        if (elements.applyBtn) {
            elements.applyBtn.disabled = true;
            elements.applyBtn.style.opacity = '0.7';
        }
    }

    /**
     * Hide loading
     */
    function hideLoading() {
        if (elements.loading) {
            elements.loading.classList.remove('show');
        }
        if (elements.applyBtn) {
            elements.applyBtn.disabled = false;
            elements.applyBtn.style.opacity = '1';
        }
    }

    /**
     * Show active discount
     */
    function showActiveDiscount(code, amount) {
        if (!elements.activeDiscount) return;
        
        const codeEl = elements.activeDiscount.querySelector('.discount-box-active-code');
        const amountEl = elements.activeDiscount.querySelector('.discount-box-active-amount');
        
        if (codeEl) codeEl.textContent = code;
        if (amountEl) amountEl.textContent = amount;
        
        animate(elements.activeDiscount, 'show');
        
        // Hide input form
        if (elements.form) {
            elements.form.style.display = 'none';
        }
    }

    /**
     * Hide active discount
     */
    function hideActiveDiscount() {
        if (!elements.activeDiscount) return;
        elements.activeDiscount.classList.remove('show');
        
        // Show input form
        if (elements.form) {
            elements.form.style.display = 'none';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Event Handlers
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Handle apply button click
     */
    async function handleApply() {
        if (!elements.input || !elements.form || !elements.hiddenInput) return;
        
        const code = elements.input.value.trim().toUpperCase();
        
        if (!code) {
            showMessage('error', 'لطفاً کد تخفیف را وارد کنید');
            shakeInput();
            return;
        }
        
        hideMessage();
        showLoading();
        
        // Set the code in the hidden input
        elements.hiddenInput.value = code;
        
        // Submit the form
        try {
            elements.form.submit();
        } catch (error) {
            hideLoading();
            showMessage('error', 'خطا در اعمال کد تخفیف. لطفاً دوباره تلاش کنید.');
            console.error('Discount apply error:', error);
        }
    }

    /**
     * Handle remove button click
     */
    async function handleRemove() {
        // Create a form to remove the discount
        const removeForm = document.createElement('form');
        removeForm.method = 'POST';
        removeForm.action = '{% url "cart:discount_remove" %}';
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfmiddlewaretoken';
            csrfInput.value = csrfToken.value;
            removeForm.appendChild(csrfInput);
        }
        
        document.body.appendChild(removeForm);
        
        try {
            hideActiveDiscount();
            showMessage('success', 'کد تخفیف با موفقیت حذف شد');
            
            // Reset input
            if (elements.input) {
                elements.input.value = '';
            }
            
            // Show form again
            if (elements.form) {
                elements.form.style.display = 'block';
            }
            
            removeForm.submit();
        } catch (error) {
            showMessage('error', 'خطا در حذف کد تخفیف');
            console.error('Discount remove error:', error);
        }
        
        document.body.removeChild(removeForm);
    }

    /**
     * Shake input animation for invalid input
     */
    function shakeInput() {
        if (!elements.input) return;
        
        elements.input.classList.add('pdb-shake');
        setTimeout(() => {
            elements.input.classList.remove('pdb-shake');
        }, 500);
    }

    /**
     * Handle Enter key press
     */
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleApply();
        }
    }

    /**
     * Handle input change
     */
    function handleInputChange() {
        hideMessage();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Initialize
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Initialize shake animation
     */
    function initShakeAnimation() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pdbShake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            .pdb-shake {
                animation: pdbShake 0.5s ease-in-out;
                border-color: var(--pdb-error) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add entrance animation
     */
    function initEntranceAnimation() {
        if (!elements.discountBox) return;
        
        elements.discountBox.style.opacity = '0';
        elements.discountBox.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            elements.discountBox.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            elements.discountBox.style.opacity = '1';
            elements.discountBox.style.transform = 'translateY(0)';
        }, 100);
    }

    /**
     * Main initialization
     */
    function init() {
        initElements();
        initShakeAnimation();
        
        // Add event listeners
        if (elements.applyBtn) {
            elements.applyBtn.addEventListener('click', handleApply);
        }
        
        if (elements.input) {
            elements.input.addEventListener('keypress', handleKeyPress);
            elements.input.addEventListener('input', handleInputChange);
        }
        
        // Remove button (delegate event)
        document.addEventListener('click', function(e) {
            const removeBtn = e.target.closest('#discount-remove-btn');
            if (removeBtn) {
                handleRemove();
            }
        });
        
        // Initialize entrance animation
        initEntranceAnimation();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Ready
    // ═══════════════════════════════════════════════════════════════════════
    
    if (document.readyState !== 'loading') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

})();
