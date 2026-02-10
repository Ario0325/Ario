/**
 * Modern Product Gallery - JavaScript Module
 * Professional touch-optimized image gallery for mobile devices
 * Features: Swipe gestures, smooth scrolling, pagination, accessibility
 * 
 * @author Professional Code
 * @version 1.0.0
 * @license MIT
 */

(function (window, document, $) {
    'use strict';

    /**
     * ModernProductGallery - Main Gallery Controller
     * @param {Object} options - Configuration options
     */
    const ModernProductGallery = (function () {
        // Private variables
        let mainImage = null;
        let galleryContainer = null;
        let galleryItems = [];
        let currentIndex = 0;
        let isMobile = false;
        let isTouch = false;
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const SWIPE_THRESHOLD = 50; // pixels
        const SWIPE_TIME_THRESHOLD = 300; // milliseconds

        /**
         * Initialize the gallery
         */
        function init() {
            mainImage = document.getElementById('product-zoom');
            galleryContainer = document.getElementById('product-zoom-gallery');

            if (!mainImage || !galleryContainer) {
                console.warn('[ModernProductGallery] Required elements not found');
                return false;
            }

            galleryItems = Array.from(
                galleryContainer.querySelectorAll('.product-gallery-item')
            );

            if (galleryItems.length === 0) {
                console.warn('[ModernProductGallery] No gallery items found');
                return false;
            }

            // Detect mobile and touch
            isMobile = window.innerWidth < 768;
            isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (!isMobile) {
                console.info('[ModernProductGallery] Desktop mode - using standard gallery');
                return initDesktopGallery();
            }

            console.info('[ModernProductGallery] Mobile mode - initializing modern gallery');

            // Setup mobile gallery
            setupMobileGallery();
            bindGalleryEvents();
            bindWindowEvents();
            addAccessibilityFeatures();
            addPaginationDots();
            addGalleryCounter();
            addTouchIndicator();

            // Initial state
            updateActiveItem(0);

            return true;
        }

        /**
         * Setup modern mobile gallery structure
         */
        function setupMobileGallery() {
            // Ensure gallery container is scrollable
            galleryContainer.setAttribute('role', 'region');
            galleryContainer.setAttribute('aria-label', 'صور المنتج - Gallery Navigation');

            // Add data attributes for tracking
            galleryItems.forEach((item, index) => {
                item.setAttribute('data-gallery-index', index);
                item.setAttribute('role', 'button');
                item.setAttribute('tabindex', index === 0 ? '0' : '-1');
                item.setAttribute('aria-label', `صورة المنتج ${index + 1} من ${galleryItems.length}`);
            });
        }

        /**
         * Add pagination dots for modern mobile UI
         */
        function addPaginationDots() {
            if (galleryItems.length <= 1) return;

            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'gallery-pagination';
            paginationContainer.setAttribute('role', 'tablist');
            paginationContainer.setAttribute('aria-label', 'صور المنتج');

            galleryItems.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `pagination-dot ${index === 0 ? 'active' : ''}`;
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
                dot.setAttribute('aria-label', `صورة ${index + 1}`);
                dot.setAttribute('data-pagination-index', index);

                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateToItem(index, 'pagination');
                });

                paginationContainer.appendChild(dot);
            });

            // Insert after gallery container
            galleryContainer.parentNode.insertBefore(
                paginationContainer,
                galleryContainer.nextSibling
            );
        }

        /**
         * Add image counter badge
         */
        function addGalleryCounter() {
            if (galleryItems.length <= 1) return;

            const counter = document.createElement('div');
            counter.className = 'gallery-counter';
            counter.setAttribute('aria-live', 'polite');
            counter.setAttribute('aria-atomic', 'true');
            updateCounterText(counter);

            const mainImageFigure = mainImage.closest('figure');
            if (mainImageFigure) {
                mainImageFigure.appendChild(counter);
            }

            // Store reference for updating
            mainImage.parentElement.__galleryCounter = counter;
        }

        /**
         * Update counter text
         */
        function updateCounterText(counter) {
            counter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
        }

        /**
         * Add touch swipe indicator for better UX
         */
        function addTouchIndicator() {
            if (galleryItems.length <= 1 || !isTouch()) return;

            // Don't show indicator on subsequent visits
            if (sessionStorage.getItem('gallery-swipe-hint-shown')) return;

            const indicator = document.createElement('div');
            indicator.className = 'touch-indicator';
            indicator.setAttribute('aria-hidden', 'true');
            indicator.textContent = 'اسحب';

            const mainImageFigure = mainImage.closest('figure');
            if (mainImageFigure) {
                mainImageFigure.appendChild(indicator);

                // Hide after 3 seconds
                setTimeout(() => {
                    indicator.style.opacity = '0';
                    indicator.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => indicator.remove(), 300);
                }, 3000);

                sessionStorage.setItem('gallery-swipe-hint-shown', 'true');
            }
        }

        /**
         * Bind gallery item click/tap events
         */
        function bindGalleryEvents() {
            galleryItems.forEach((item, index) => {
                // Click/Tap
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateToItem(index, 'click');
                });

                // Keyboard support
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateToItem(index, 'keyboard');
                    }
                });

                // Touch events for swipe
                item.addEventListener('touchstart', handleTouchStart, false);
                item.addEventListener('touchend', handleTouchEnd, false);
            });

            // Main image swipe support
            mainImage.addEventListener('touchstart', handleTouchStart, false);
            mainImage.addEventListener('touchend', handleTouchEnd, false);
        }

        /**
         * Handle touch start event
         */
        function handleTouchStart(e) {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
            touchStartTime = Date.now();
        }

        /**
         * Handle touch end event - implement swipe logic
         */
        function handleTouchEnd(e) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();
            const deltaX = Math.abs(touchEndX - touchStartX);
            const deltaY = Math.abs(touchEndY - touchStartY);
            const deltaTime = touchEndTime - touchStartTime;

            // Check if swipe is valid (horizontal, fast enough)
            if (deltaTime < SWIPE_TIME_THRESHOLD && deltaX > SWIPE_THRESHOLD && deltaX > deltaY) {
                if (touchEndX < touchStartX) {
                    // Swiped left - next image (RTL: swiped right means next)
                    navigateNext();
                } else {
                    // Swiped right - previous image
                    navigatePrevious();
                }
            }
        }

        /**
         * Navigate to next item
         */
        function navigateNext() {
            const nextIndex = (currentIndex + 1) % galleryItems.length;
            navigateToItem(nextIndex, 'swipe-next');
        }

        /**
         * Navigate to previous item
         */
        function navigatePrevious() {
            const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            navigateToItem(prevIndex, 'swipe-prev');
        }

        /**
         * Navigate to specific item
         * @param {number} index - Item index
         * @param {string} trigger - Navigation trigger source
         */
        function navigateToItem(index, trigger = 'direct') {
            if (index === currentIndex || index < 0 || index >= galleryItems.length) {
                return;
            }

            const item = galleryItems[index];
            const imageUrl = item.getAttribute('data-image');
            const zoomUrl = item.getAttribute('data-zoom-image') || imageUrl;

            if (!imageUrl) {
                console.warn(`[ModernProductGallery] No image URL found for item ${index}`);
                return;
            }

            // Add loading class
            mainImage.classList.add('loading');

            // Preload image
            const tempImg = new Image();
            tempImg.onload = function () {
                // Update main image with smooth transition
                mainImage.style.opacity = '0.8';
                mainImage.setAttribute('src', imageUrl);
                mainImage.setAttribute('data-zoom-image', zoomUrl);

                // Trigger smooth opacity restoration
                setTimeout(() => {
                    mainImage.style.opacity = '1';
                    mainImage.classList.remove('loading');
                }, 50);

                // Update active states
                updateActiveItem(index);

                // Log navigation
                logGalleryInteraction(index, trigger);
            };

            tempImg.onerror = function () {
                console.error(`[ModernProductGallery] Failed to load image: ${imageUrl}`);
                mainImage.classList.remove('loading');
            };

            // Start loading
            tempImg.src = imageUrl;

            // Scroll thumbnail into view
            scrollThumbnailIntoView(item);
        }

        /**
         * Update visual active item indicator
         * @param {number} index - New active index
         */
        function updateActiveItem(index) {
            // Update current index
            currentIndex = index;

            // Update gallery items active state
            galleryItems.forEach((item, i) => {
                const isActive = i === index;
                item.classList.toggle('active', isActive);
                item.setAttribute('aria-selected', isActive ? 'true' : 'false');
                item.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            // Update pagination dots
            const paginationDots = document.querySelectorAll('.pagination-dot');
            paginationDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
                dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
            });

            // Update counter
            const counter = mainImage.parentElement?.__galleryCounter;
            if (counter) {
                updateCounterText(counter);
            }
        }

        /**
         * Scroll thumbnail into view smoothly
         * @param {HTMLElement} item - Gallery item element
         */
        function scrollThumbnailIntoView(item) {
            requestAnimationFrame(() => {
                galleryContainer.scrollTo({
                    left: item.offsetLeft - galleryContainer.offsetWidth / 2 + item.offsetWidth / 2,
                    behavior: 'smooth'
                });
            });
        }

        /**
         * Add keyboard navigation support
         */
        function bindWindowEvents() {
            document.addEventListener('keydown', (e) => {
                // Only if gallery has focus
                if (!galleryContainer.contains(document.activeElement) && 
                    !mainImage.contains(document.activeElement)) {
                    return;
                }

                switch (e.key) {
                    case 'ArrowRight': // Next in LTR, Previous in RTL
                        e.preventDefault();
                        navigatePrevious();
                        break;
                    case 'ArrowLeft': // Previous in LTR, Next in RTL
                        e.preventDefault();
                        navigateNext();
                        break;
                    case 'Home':
                        e.preventDefault();
                        navigateToItem(0, 'keyboard');
                        break;
                    case 'End':
                        e.preventDefault();
                        navigateToItem(galleryItems.length - 1, 'keyboard');
                        break;
                }
            });
        }

        /**
         * Add accessibility features
         */
        function addAccessibilityFeatures() {
            const mainImageFigure = mainImage.closest('figure');
            if (mainImageFigure) {
                mainImageFigure.setAttribute('role', 'region');
                mainImageFigure.setAttribute('aria-live', 'polite');
                mainImageFigure.setAttribute('aria-label', 'صورة المنتج الرئيسية');
            }

            mainImage.setAttribute('alt', 'صورة المنتج الرئيسية');
        }

        /**
         * Initialize desktop gallery (standard behavior)
         */
        function initDesktopGallery() {
            // Keep original zoom functionality
            if (typeof $.fn.elevateZoom !== 'undefined') {
                $('#product-zoom').elevateZoom({
                    gallery: 'product-zoom-gallery',
                    galleryActiveClass: 'active',
                    zoomType: 'lens',
                    lensShape: 'round',
                    lensSize: 180,
                    cursor: 'crosshair',
                    zoomWindowFadeIn: 300,
                    zoomWindowFadeOut: 300,
                    lensFadeIn: 200,
                    lensFadeOut: 200,
                    scrollZoom: true,
                    responsive: true,
                    borderColour: '#cc9966',
                    borderSize: 2
                });
            } else {
                // Fallback
                setupFallbackGallery();
            }

            return true;
        }

        /**
         * Fallback gallery for desktop without elevateZoom
         */
        function setupFallbackGallery() {
            galleryItems.forEach((item) => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const index = galleryItems.indexOf(item);
                    const imageUrl = item.getAttribute('data-image');
                    const zoomUrl = item.getAttribute('data-zoom-image') || imageUrl;

                    if (imageUrl) {
                        mainImage.setAttribute('src', imageUrl);
                        mainImage.setAttribute('data-zoom-image', zoomUrl);
                        updateActiveItem(index);
                    }
                });
            });
        }

        /**
         * Log gallery interactions for analytics
         * @param {number} index - Image index
         * @param {string} trigger - Interaction trigger
         */
        function logGalleryInteraction(index, trigger) {
            if (typeof window.gtag === 'undefined') return;

            try {
                gtag('event', 'gallery_image_viewed', {
                    event_category: 'product_gallery',
                    event_label: `Image ${index + 1}`,
                    trigger_type: trigger,
                    gallery_size: galleryItems.length
                });
            } catch (error) {
                console.warn('[ModernProductGallery] Analytics logging failed:', error);
            }
        }

        /**
         * Handle window resize
         */
        function handleResize() {
            const wasMobile = isMobile;
            isMobile = window.innerWidth < 768;

            // If switch between mobile and desktop, reinitialize
            if (wasMobile !== isMobile) {
                console.info('[ModernProductGallery] Screen size changed, reinitializing...');
                window.location.reload();
            }
        }

        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 250);
        });

        /**
         * Cleanup and destroy
         */
        function destroy() {
            galleryItems.forEach((item) => {
                item.removeEventListener('click', null);
                item.removeEventListener('keydown', null);
                item.removeEventListener('touchstart', null);
                item.removeEventListener('touchend', null);
            });

            mainImage.removeEventListener('touchstart', null);
            mainImage.removeEventListener('touchend', null);

            console.info('[ModernProductGallery] Destroyed');
        }

        // Public API
        return {
            init: init,
            destroy: destroy,
            navigateNext: navigateNext,
            navigatePrevious: navigatePrevious,
            navigateToItem: navigateToItem
        };
    })();

    /**
     * Initialize on DOM ready
     */
    function initOnReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                ModernProductGallery.init();
            });
        } else {
            ModernProductGallery.init();
        }
    }

    /**
     * Initialize with jQuery if available
     */
    $(function () {
        ModernProductGallery.init();
    });

    // Also try on DOM ready
    initOnReady();

    // Export for global access
    window.ModernProductGallery = ModernProductGallery;

})(window, document, $ || jQuery);
