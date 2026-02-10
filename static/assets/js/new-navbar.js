/**
 * ARIO SHOP - MODERN RESPONSIVE NAVBAR
 * JavaScript functionality for the navbar
 */

(function($) {
    'use strict';

    // Navbar Manager
    const NavbarManager = {
        // Initialize
        init: function() {
            this.cacheDOM();
            this.bindEvents();
            this.handleScroll();
        },

        // Cache DOM elements
        cacheDOM: function() {
            this.$window = $(window);
            this.$header = $('#mainHeader');
            this.$stickyHeader = $('#stickyHeader');
            this.$searchBtn = $('#searchBtn');
            this.$searchPanel = $('#searchPanel');
            this.$searchClose = $('#searchClose');
            this.$mobileMenuBtn = $('#mobileMenuBtn');
            this.$mobileMenu = $('#mobileMenu');
            this.$mobileMenuOverlay = $('#mobileMenuOverlay');
            this.$mobileMenuClose = $('#mobileMenuClose');
            this.$body = $('body');
        },

        // Bind events
        bindEvents: function() {
            // Scroll event
            this.$window.on('scroll', this.handleScroll.bind(this));

            // Search events
            this.$searchBtn.on('click', this.openSearch.bind(this));
            this.$searchClose.on('click', this.closeSearch.bind(this));
            this.$searchPanel.on('click', function(e) {
                if (e.target === this) {
                    NavbarManager.closeSearch();
                }
            });

            // Mobile menu events
            this.$mobileMenuBtn.on('click', this.toggleMobileMenu.bind(this));
            this.$mobileMenuClose.on('click', this.closeMobileMenu.bind(this));
            this.$mobileMenuOverlay.on('click', this.closeMobileMenu.bind(this));

            // Mobile submenu toggle
            $('.mobile-menu-item.has-children .submenu-toggle').on('click', this.toggleSubmenu);

            // Close search on ESC
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape') {
                    NavbarManager.closeSearch();
                    NavbarManager.closeMobileMenu();
                }
            });

            // Prevent body scroll when mobile menu is open
            this.$mobileMenu.on('touchmove', function(e) {
                if ($(this).hasClass('active')) {
                    e.stopPropagation();
                }
            });

            // Close dropdowns when clicking outside
            $(document).on('click', function(e) {
                if (!$(e.target).closest('.dropdown').length) {
                    $('.dropdown-menu').removeClass('show');
                }
            });
        },

        // Handle scroll
        handleScroll: function() {
            const scrollTop = this.$window.scrollTop();
            
            if (scrollTop > 100) {
                this.$stickyHeader.addClass('scrolled');
            } else {
                this.$stickyHeader.removeClass('scrolled');
            }
        },

        // Open search
        openSearch: function() {
            this.$searchPanel.addClass('active');
            this.$searchPanel.find('input').focus();
            this.$body.css('overflow', 'hidden');
        },

        // Close search
        closeSearch: function() {
            this.$searchPanel.removeClass('active');
            this.$body.css('overflow', '');
        },

        // Toggle mobile menu
        toggleMobileMenu: function() {
            const isActive = this.$mobileMenu.hasClass('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        },

        // Open mobile menu
        openMobileMenu: function() {
            this.$mobileMenu.addClass('active');
            this.$mobileMenuOverlay.addClass('active');
            this.$mobileMenuBtn.addClass('active');
            this.$body.css('overflow', 'hidden');
        },

        // Close mobile menu
        closeMobileMenu: function() {
            this.$mobileMenu.removeClass('active');
            this.$mobileMenuOverlay.removeClass('active');
            this.$mobileMenuBtn.removeClass('active');
            this.$body.css('overflow', '');
        },

        // Toggle submenu
        toggleSubmenu: function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $parent = $(this).closest('.mobile-menu-item');
            const $submenu = $parent.find('.mobile-submenu').first();
            
            // Close other submenus
            $('.mobile-menu-item.has-children').not($parent).removeClass('open');
            
            // Toggle current submenu
            $parent.toggleClass('open');
            
            // Animate submenu
            if ($parent.hasClass('open')) {
                $submenu.css('max-height', $submenu[0].scrollHeight + 'px');
            } else {
                $submenu.css('max-height', '0');
            }
        }
    };

    // Dropdown Manager
    const DropdownManager = {
        init: function() {
            this.handleDropdowns();
            this.handleCartDropdown();
        },

        handleDropdowns: function() {
            // Desktop dropdown hover
            $('.nav-item.has-dropdown').hover(
                function() {
                    $(this).find('> .dropdown-menu').stop(true, true).fadeIn(200);
                },
                function() {
                    $(this).find('> .dropdown-menu').stop(true, true).fadeOut(200);
                }
            );

            // Submenu hover
            $('.dropdown-item.has-submenu').hover(
                function() {
                    $(this).find('> .submenu').stop(true, true).fadeIn(200);
                },
                function() {
                    $(this).find('> .submenu').stop(true, true).fadeOut(200);
                }
            );
        },

        handleCartDropdown: function() {
            // Keep cart dropdown open when hovering
            let timeout;
            
            $('.cart-dropdown').hover(
                function() {
                    clearTimeout(timeout);
                    $(this).find('.cart-dropdown-menu').addClass('show');
                },
                function() {
                    const $menu = $(this).find('.cart-dropdown-menu');
                    timeout = setTimeout(function() {
                        $menu.removeClass('show');
                    }, 300);
                }
            );
        }
    };

    // Search Autocomplete (Optional enhancement)
    const SearchAutocomplete = {
        init: function() {
            this.$searchInput = $('.search-input, .mobile-search-input');
            this.bindEvents();
        },

        bindEvents: function() {
            // You can add autocomplete functionality here
            // For now, just basic functionality
            this.$searchInput.on('input', function() {
                const query = $(this).val();
                if (query.length > 2) {
                    // Here you can add AJAX call for autocomplete
                    console.log('Search query:', query);
                }
            });
        }
    };

    // Smooth Scroll for anchor links
    const SmoothScroll = {
        init: function() {
            $('a[href*="#"]:not([href="#"])').click(function() {
                if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && 
                    location.hostname === this.hostname) {
                    let target = $(this.hash);
                    target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                    
                    if (target.length) {
                        $('html, body').animate({
                            scrollTop: target.offset().top - 100
                        }, 800);
                        return false;
                    }
                }
            });
        }
    };

    // Cart Badge Animation
    const CartBadgeAnimation = {
        init: function() {
            this.animateBadge();
        },

        animateBadge: function() {
            const $badge = $('.action-badge.has-items');
            
            if ($badge.length && parseInt($badge.text()) > 0) {
                setInterval(function() {
                    $badge.addClass('pulse');
                    setTimeout(function() {
                        $badge.removeClass('pulse');
                    }, 1000);
                }, 3000);
            }
        }
    };

    // Accessibility Enhancements
    const AccessibilityManager = {
        init: function() {
            this.handleKeyboardNavigation();
            this.addAriaLabels();
        },

        handleKeyboardNavigation: function() {
            // Tab navigation for dropdowns
            $('.nav-link, .action-btn').on('focus', function() {
                $(this).closest('.nav-item, .header-action').addClass('keyboard-focus');
            }).on('blur', function() {
                $(this).closest('.nav-item, .header-action').removeClass('keyboard-focus');
            });

            // Arrow key navigation in dropdowns
            $('.dropdown-menu').on('keydown', 'a', function(e) {
                const $items = $(this).closest('.dropdown-menu').find('a:visible');
                const currentIndex = $items.index(this);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    $items.eq(currentIndex + 1).focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    $items.eq(currentIndex - 1).focus();
                }
            });
        },

        addAriaLabels: function() {
            // Add aria-expanded to dropdown toggles
            $('.dropdown-toggle').attr('aria-expanded', 'false');
            
            $('.dropdown').on('show.bs.dropdown', function() {
                $(this).find('.dropdown-toggle').attr('aria-expanded', 'true');
            }).on('hide.bs.dropdown', function() {
                $(this).find('.dropdown-toggle').attr('aria-expanded', 'false');
            });
        }
    };

    // Performance Optimization - Debounce
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

    // Optimize scroll event
    $(window).on('scroll', debounce(function() {
        NavbarManager.handleScroll();
    }, 10));

    // Initialize on document ready
    $(document).ready(function() {
        NavbarManager.init();
        DropdownManager.init();
        SearchAutocomplete.init();
        SmoothScroll.init();
        CartBadgeAnimation.init();
        AccessibilityManager.init();

        // Add loaded class for animations
        setTimeout(function() {
            $('.ario-modern-header').addClass('loaded');
        }, 100);
    });

    // Handle window resize
    $(window).on('resize', debounce(function() {
        // Close mobile menu on desktop
        if ($(window).width() > 991) {
            NavbarManager.closeMobileMenu();
        }
    }, 250));

    // Prevent flash of unstyled content
    $(window).on('load', function() {
        $('.ario-modern-header').css('visibility', 'visible');
    });

})(jQuery);
