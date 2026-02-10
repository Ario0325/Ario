/**
 * Modern Header JavaScript Enhancements
 * افکت‌های تعاملی و بهبودهای UX برای هدر مدرن
 */

(function() {
    'use strict';

    // اضافه کردن کلاس fixed به هدر هنگام اسکرول
    const header = document.querySelector('.header-modern');
    if (header) {
        let lastScroll = 0;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.classList.add('fixed');
                header.classList.add('scrolled');
            } else {
                header.classList.remove('fixed');
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }

    // بستن dropdown ها با کلیک خارج از آن‌ها
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.dropdown.show');
        dropdowns.forEach(function(dropdown) {
            if (!dropdown.contains(e.target)) {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                const menu = dropdown.querySelector('.dropdown-menu');
                if (toggle && menu) {
                    dropdown.classList.remove('show');
                    menu.classList.remove('show');
                }
            }
        });
    });

    // بهبود افکت search toggle
    const searchToggle = document.querySelector('.search-toggle');
    const searchWrapper = document.querySelector('.modern-search-wrapper');
    
    if (searchToggle && searchWrapper) {
        searchToggle.addEventListener('click', function(e) {
            e.preventDefault();
            searchWrapper.classList.toggle('show');
            
            if (searchWrapper.classList.contains('show')) {
                const searchInput = searchWrapper.querySelector('.modern-search-input');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                }
            }
        });
    }

    // اضافه کردن افکت ripple به دکمه‌ها
    const rippleButtons = document.querySelectorAll('.modern-icon-btn, .modern-btn, .search-submit-btn');
    
    rippleButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            const ripple = this.querySelector('.icon-ripple');
            if (ripple) {
                ripple.style.opacity = '0';
                // Reset animation
                void ripple.offsetWidth;
                ripple.style.opacity = '1';
            }
        });
    });

    // Smooth scroll برای mobile menu
    const menuLinks = document.querySelectorAll('.menu-link-modern[href^="#"]');
    menuLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // تشخیص دستگاه تاچ و اضافه کردن کلاس
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
        
        // برای دستگاه‌های تاچ، اولین تاچ فقط hover می‌کند
        const menuItems = document.querySelectorAll('.menu-item-modern');
        menuItems.forEach(function(item) {
            item.addEventListener('touchstart', function(e) {
                if (!this.classList.contains('touch-active')) {
                    e.preventDefault();
                    // Remove active from others
                    menuItems.forEach(mi => mi.classList.remove('touch-active'));
                    this.classList.add('touch-active');
                }
            });
        });
    }

    // Lazy load برای تصاویر سبد خرید (اگر وجود دارند)
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });

        const lazyImages = document.querySelectorAll('.modern-cart-image img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // بهبود accessibility - کیبورد navigation
    const focusableElements = document.querySelectorAll(
        '.menu-link-modern, .modern-icon-btn, .modern-dropdown-item, .modern-btn'
    );
    
    focusableElements.forEach(function(element) {
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });

    console.log('🎨 Modern Header Initialized Successfully!');
})();
