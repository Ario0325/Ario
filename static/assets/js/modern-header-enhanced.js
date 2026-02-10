/**
 * ========================================================================
 * اسکریپت هدر مدرن و حرفه‌ای
 * طراحی شده برای آریو شاپ
 * نسخه: 2.0
 * ========================================================================
 */

(function() {
    'use strict';

    // ==================== نوار پیشرفت اسکرول ====================
    const initScrollProgress = () => {
        const progressBar = document.getElementById('scroll-progress-bar');
        if (!progressBar) return;

        const updateProgress = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.scrollY;
            const progress = (scrolled / documentHeight) * 100;
            
            progressBar.style.width = progress + '%';
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    };

    // ==================== هدر اسکرول افکت ====================
    const initHeaderScroll = () => {
        const header = document.querySelector('.modern-header');
        if (!header) return;

        let lastScroll = 0;
        const scrollThreshold = 100;

        const handleScroll = () => {
            const currentScroll = window.scrollY;

            // اضافه کردن کلاس scrolled
            if (currentScroll > scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    };

    // ==================== جستجوی مدرن ====================
    const initModernSearch = () => {
        const searchBtn = document.querySelector('.modern-search-btn');
        const searchForm = document.querySelector('.modern-search-form');
        const searchClose = document.querySelector('.search-close');
        const searchInput = document.querySelector('.modern-search-input');
        const modernSearch = document.querySelector('.modern-search');

        if (!searchBtn || !searchForm) return;

        // باز کردن جستجو
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modernSearch.classList.add('active');
            searchInput.focus();
        });

        // بستن جستجو
        if (searchClose) {
            searchClose.addEventListener('click', (e) => {
                e.preventDefault();
                modernSearch.classList.remove('active');
                searchInput.value = '';
            });
        }

        // بستن با ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modernSearch.classList.contains('active')) {
                modernSearch.classList.remove('active');
                searchInput.value = '';
            }
        });

        // بستن با کلیک خارج
        document.addEventListener('click', (e) => {
            if (!modernSearch.contains(e.target) && modernSearch.classList.contains('active')) {
                modernSearch.classList.remove('active');
            }
        });
    };

    // ==================== انیمیشن ساب منو ====================
    const initSubmenuAnimation = () => {
        const menuItems = document.querySelectorAll('.modern-menu-item.has-submenu');

        menuItems.forEach(item => {
            const submenu = item.querySelector('.modern-submenu');
            if (!submenu) return;

            let timeout;

            item.addEventListener('mouseenter', () => {
                clearTimeout(timeout);
                submenu.style.display = 'block';
                
                setTimeout(() => {
                    submenu.style.opacity = '1';
                    submenu.style.visibility = 'visible';
                    submenu.style.transform = 'translateY(0)';
                }, 10);
            });

            item.addEventListener('mouseleave', () => {
                submenu.style.opacity = '0';
                submenu.style.visibility = 'hidden';
                submenu.style.transform = 'translateY(-10px)';
                
                timeout = setTimeout(() => {
                    submenu.style.display = 'none';
                }, 300);
            });
        });
    };

    // ==================== انیمیشن بج سبد خرید ====================
    const initCartBadgeAnimation = () => {
        const observeCartChanges = () => {
            const cartBadge = document.querySelector('.cart-count.modern-badge');
            if (!cartBadge) return;

            // مشاهده تغییرات در بج
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        const count = parseInt(cartBadge.textContent);
                        if (count > 0) {
                            cartBadge.classList.add('has-items');
                        } else {
                            cartBadge.classList.remove('has-items');
                        }
                    }
                });
            });

            observer.observe(cartBadge, {
                childList: true,
                characterData: true,
                subtree: true
            });
        };

        observeCartChanges();
    };

    // ==================== افکت Ripple برای دکمه‌ها ====================
    const initRippleEffect = () => {
        const buttons = document.querySelectorAll('.modern-icon-btn, .modern-search-btn');

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = this.querySelector('.btn-ripple, .search-ripple');
                if (!ripple) return;

                // ریست انیمیشن
                ripple.style.animation = 'none';
                
                setTimeout(() => {
                    ripple.style.animation = '';
                }, 10);
            });
        });
    };

    // ==================== بهبود عملکرد Dropdown ====================
    const initDropdownOptimization = () => {
        const dropdowns = document.querySelectorAll('.modern-cart, .modern-account');

        dropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.modern-dropdown');
            if (!menu) return;

            let isOpen = false;
            let timeout;

            dropdown.addEventListener('mouseenter', () => {
                clearTimeout(timeout);
                if (!isOpen) {
                    menu.style.display = 'block';
                    setTimeout(() => {
                        menu.classList.add('show');
                        isOpen = true;
                    }, 10);
                }
            });

            dropdown.addEventListener('mouseleave', () => {
                timeout = setTimeout(() => {
                    menu.classList.remove('show');
                    setTimeout(() => {
                        menu.style.display = 'none';
                        isOpen = false;
                    }, 300);
                }, 200);
            });
        });
    };

    // ==================== تشخیص حالت تاچ ====================
    const initTouchDetection = () => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
            
            // بستن dropdown با تاچ خارج
            document.addEventListener('touchstart', (e) => {
                const dropdowns = document.querySelectorAll('.modern-dropdown.show');
                dropdowns.forEach(dropdown => {
                    if (!dropdown.closest('.modern-cart, .modern-account').contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                });
            });
        }
    };

    // ==================== اجرای همه توابع ====================
    const init = () => {
        // بررسی آماده بودن DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // اجرای توابع اصلی
        initScrollProgress();
        initHeaderScroll();
        initModernSearch();
        initSubmenuAnimation();
        initCartBadgeAnimation();
        initRippleEffect();
        initDropdownOptimization();
        initTouchDetection();

        // لاگ موفقیت
        console.log('✨ Modern Header Initialized Successfully!');
    };

    // شروع اجرا
    init();

})();
