/**
 * Modern Ultra Premium Navbar JavaScript
 * Ario Shop - Advanced Interactive Features
 * Version: 1.0.0
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        scrollThreshold: 100,
        announcementCloseDelay: 300,
        mobileBreakpoint: 992,
        debounceDelay: 100
    };

    // State Management
    const state = {
        isScrolled: false,
        isMobileMenuOpen: false,
        isSearchOpen: false,
        lastScrollY: 0
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        navbar: document.getElementById('mainNav'),
        announcementBar: document.querySelector('.top-announcement-bar'),
        announcementClose: document.querySelector('.announcement-close'),
        mobileMenuToggle: document.getElementById('mobileMenuToggle'),
        mobileMenuOverlay: document.getElementById('mobileMenuOverlay'),
        mobileMenuClose: document.getElementById('mobileMenuClose'),
        searchTriggers: document.querySelectorAll('.search-trigger'),
        searchOverlay: document.getElementById('searchOverlay'),
        searchInput: document.querySelector('.search-input'),
        submenuToggles: document.querySelectorAll('.submenu-toggle')
    };

    // ========================================
    // Utility Functions
    // ========================================

    /**
     * Debounce function to limit function calls
     */
    function debounce(func, wait) {
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

    /**
     * Add class with animation support
     */
    function addClass(element, className) {
        if (element && !element.classList.contains(className)) {
            element.classList.add(className);
        }
    }

    /**
     * Remove class with animation support
     */
    function removeClass(element, className) {
        if (element && element.classList.contains(className)) {
            element.classList.remove(className);
        }
    }

    /**
     * Toggle class
     */
    function toggleClass(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    }

    // ========================================
    // Scroll Handler
    // ========================================

    /**
     * Handle navbar scroll effects
     */
    function handleScroll() {
        const currentScrollY = window.scrollY;

        // Add scrolled class when scrolling down
        if (currentScrollY > CONFIG.scrollThreshold) {
            if (!state.isScrolled) {
                addClass(elements.navbar, 'scrolled');
                state.isScrolled = true;
            }
        } else {
            if (state.isScrolled) {
                removeClass(elements.navbar, 'scrolled');
                state.isScrolled = false;
            }
        }

        state.lastScrollY = currentScrollY;
    }

    // Debounced scroll handler
    const debouncedHandleScroll = debounce(handleScroll, CONFIG.debounceDelay);

    // ========================================
    // Announcement Bar
    // ========================================

    /**
     * Close announcement bar with animation
     */
    function closeAnnouncementBar() {
        if (elements.announcementBar) {
            addClass(elements.announcementBar, 'hidden');
            
            setTimeout(() => {
                elements.announcementBar.style.display = 'none';
                localStorage.setItem('announcementClosed', 'true');
            }, CONFIG.announcementCloseDelay);
        }
    }

    /**
     * Initialize announcement bar
     */
    function initAnnouncementBar() {
        // Check if user has closed the announcement before
        const isClosed = localStorage.getItem('announcementClosed');
        
        if (isClosed === 'true') {
            if (elements.announcementBar) {
                elements.announcementBar.style.display = 'none';
            }
        }

        // Add close button event listener
        if (elements.announcementClose) {
            elements.announcementClose.addEventListener('click', closeAnnouncementBar);
        }
    }

    // ========================================
    // Mobile Menu
    // ========================================

    /**
     * Open mobile menu
     */
    function openMobileMenu() {
        addClass(elements.mobileMenuOverlay, 'active');
        addClass(elements.mobileMenuToggle, 'active');
        state.isMobileMenuOpen = true;
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close mobile menu
     */
    function closeMobileMenu() {
        removeClass(elements.mobileMenuOverlay, 'active');
        removeClass(elements.mobileMenuToggle, 'active');
        state.isMobileMenuOpen = false;
        document.body.style.overflow = '';
    }

    /**
     * Toggle mobile menu
     */
    function toggleMobileMenu() {
        if (state.isMobileMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    /**
     * Initialize mobile menu
     */
    function initMobileMenu() {
        // Toggle button
        if (elements.mobileMenuToggle) {
            elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        }

        // Close button
        if (elements.mobileMenuClose) {
            elements.mobileMenuClose.addEventListener('click', closeMobileMenu);
        }

        // Close when clicking overlay (outside menu)
        if (elements.mobileMenuOverlay) {
            elements.mobileMenuOverlay.addEventListener('click', function(e) {
                if (e.target === elements.mobileMenuOverlay) {
                    closeMobileMenu();
                }
            });
        }

        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && state.isMobileMenuOpen) {
                closeMobileMenu();
            }
        });
    }

    // ========================================
    // Mobile Submenu Toggle
    // ========================================

    /**
     * Initialize mobile submenu toggles
     */
    function initMobileSubmenu() {
        elements.submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const menuItem = this.closest('.mobile-menu-item');
                const wasActive = menuItem.classList.contains('active');
                
                // Close all other submenus
                document.querySelectorAll('.mobile-menu-item.active').forEach(item => {
                    if (item !== menuItem) {
                        removeClass(item, 'active');
                    }
                });
                
                // Toggle current submenu
                toggleClass(menuItem, 'active');
            });
        });
    }

    // ========================================
    // Search Functionality
    // ========================================

    /**
     * Toggle search panel
     */
    function toggleSearch(trigger) {
        const isActive = trigger.classList.contains('active');
        
        // Close all search panels first
        elements.searchTriggers.forEach(t => removeClass(t, 'active'));
        removeClass(elements.searchOverlay, 'active');
        
        if (!isActive) {
            addClass(trigger, 'active');
            addClass(elements.searchOverlay, 'active');
            
            // Focus search input
            setTimeout(() => {
                if (elements.searchInput) {
                    elements.searchInput.focus();
                }
            }, 100);
        }
        
        state.isSearchOpen = !isActive;
    }

    /**
     * Close search panel
     */
    function closeSearch() {
        elements.searchTriggers.forEach(t => removeClass(t, 'active'));
        removeClass(elements.searchOverlay, 'active');
        state.isSearchOpen = false;
    }

    /**
     * Initialize search functionality
     */
    function initSearch() {
        // Search triggers
        elements.searchTriggers.forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSearch(this);
            });
        });

        // Close search when clicking overlay
        if (elements.searchOverlay) {
            elements.searchOverlay.addEventListener('click', closeSearch);
        }

        // Close search on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && state.isSearchOpen) {
                closeSearch();
            }
        });

        // Prevent search panel from closing when clicking inside
        document.querySelectorAll('.search-panel').forEach(panel => {
            panel.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
    }

    // ========================================
    // Cart Badge Animation
    // ========================================

    /**
     * Update cart count with animation
     */
    function updateCartCount(count) {
        const cartBadge = document.querySelector('.cart-count');
        if (cartBadge) {
            cartBadge.textContent = count;
            
            // Trigger animation
            cartBadge.style.animation = 'none';
            setTimeout(() => {
                cartBadge.style.animation = 'bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, 10);
        }
    }

    /**
     * Initialize cart functionality
     */
    function initCart() {
        // This function can be extended to handle cart updates via AJAX
        // For now, it provides the animation functionality
        
        // Example: Listen for custom cart update events
        window.addEventListener('cartUpdated', function(e) {
            if (e.detail && e.detail.count !== undefined) {
                updateCartCount(e.detail.count);
            }
        });
    }

    // ========================================
    // Smooth Scroll for Anchor Links
    // ========================================

    /**
     * Initialize smooth scrolling for anchor links
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Skip if href is just "#"
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    const offsetTop = target.offsetTop - 100; // Offset for fixed navbar
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    if (state.isMobileMenuOpen) {
                        closeMobileMenu();
                    }
                }
            });
        });
    }

    // ========================================
    // Active Menu Item Highlighting
    // ========================================

    /**
     * Highlight active menu item based on current URL
     */
    function highlightActiveMenuItem() {
        const currentPath = window.location.pathname;
        
        document.querySelectorAll('.menu-link, .mobile-menu-link').forEach(link => {
            const linkPath = link.getAttribute('href');
            
            if (linkPath && linkPath !== '#' && currentPath.includes(linkPath)) {
                addClass(link.closest('.menu-item, .mobile-menu-item'), 'active');
            }
        });
    }

    // ========================================
    // Resize Handler
    // ========================================

    /**
     * Handle window resize events
     */
    function handleResize() {
        // Close mobile menu if window is resized to desktop
        if (window.innerWidth > CONFIG.mobileBreakpoint && state.isMobileMenuOpen) {
            closeMobileMenu();
        }
    }

    const debouncedHandleResize = debounce(handleResize, CONFIG.debounceDelay);

    // ========================================
    // Initialization
    // ========================================

    /**
     * Initialize all navbar functionality
     */
    function init() {
        // Check if navbar exists
        if (!elements.navbar) {
            console.warn('Modern navbar not found on this page');
            return;
        }

        // Initialize components
        initAnnouncementBar();
        initMobileMenu();
        initMobileSubmenu();
        initSearch();
        initCart();
        initSmoothScroll();
        highlightActiveMenuItem();

        // Event listeners
        window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
        window.addEventListener('resize', debouncedHandleResize);

        // Initial scroll check
        handleScroll();

        console.log('Modern navbar initialized successfully');
    }

    // ========================================
    // Auto-initialize on DOM ready
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // Public API (Optional)
    // ========================================

    window.ModernNavbar = {
        closeMobileMenu,
        openMobileMenu,
        toggleMobileMenu,
        closeSearch,
        updateCartCount,
        closeAnnouncementBar
    };

})();
