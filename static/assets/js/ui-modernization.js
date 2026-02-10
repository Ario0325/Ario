/**
 * UI Modernization and Animations
 * 
 * This module provides modern UI animations and interactions for the Ario_Shop e-commerce website.
 * It includes toast notifications, smooth animations, loading states, and micro-interactions
 * while maintaining accessibility and RTL support.
 */

/**
 * Animation Configuration
 * Central configuration for all animation durations, easings, and settings
 */
const AnimationConfig = {
    // Duration presets (milliseconds)
    durations: {
        instant: 0,
        fast: 150,
        normal: 300,
        slow: 500,
        verySlow: 800
    },
    
    // Easing functions
    easings: {
        linear: 'linear',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
};

/**
 * AnimationEngine - Core animation controller
 * 
 * Manages all animations in the application, ensuring consistency, performance,
 * and accessibility. Respects user preferences for reduced motion and handles
 * RTL layout direction automatically.
 * 
 * Requirements: 2.1, 2.2, 8.1, 8.2, 12.3, 12.5, 16.1, 16.3, 17.1
 */
class AnimationEngine {
    /**
     * Create an AnimationEngine instance
     * Automatically detects reduced motion preference and RTL layout direction
     */
    constructor() {
        // Map to track active animations by element
        this.activeAnimations = new Map();
        
        // Check if user prefers reduced motion
        this.reducedMotion = this.checkReducedMotion();
        
        // Detect RTL layout direction
        this.isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
        
        // Listen for changes to reduced motion preference
        if (window.matchMedia) {
            const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            motionQuery.addEventListener('change', () => {
                this.reducedMotion = this.checkReducedMotion();
            });
        }
    }
    
    /**
     * Check if user prefers reduced motion
     * Uses the prefers-reduced-motion media query
     * 
     * @returns {boolean} True if reduced motion is preferred
     * 
     * Requirements: 16.1, 16.3
     */
    checkReducedMotion() {
        if (!window.matchMedia) {
            return false;
        }
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Generic animation method
     * Applies a CSS animation class to an element and returns a promise
     * that resolves when the animation completes
     * 
     * @param {HTMLElement} element - The element to animate
     * @param {string} animationName - The CSS animation class name
     * @param {Object} options - Animation options
     * @param {number} options.duration - Animation duration in milliseconds (default: 300)
     * @param {string} options.easing - CSS easing function (default: 'ease-in-out')
     * @param {boolean} options.fill - Whether to keep final state (default: 'forwards')
     * @returns {Promise<void>} Promise that resolves when animation completes
     * 
     * Requirements: 2.1, 2.2, 16.1
     */
    animate(element, animationName, options = {}) {
        // Validate element
        if (!element || !(element instanceof HTMLElement)) {
            return Promise.reject(new Error('Element is required for animation'));
        }
        
        // Default options
        const duration = options.duration || AnimationConfig.durations.normal;
        const easing = options.easing || AnimationConfig.easings.easeInOut;
        const fill = options.fill || 'forwards';
        const onComplete = options.onComplete;
        
        // If reduced motion is enabled, skip animation
        if (this.reducedMotion) {
            // Call onComplete callback if provided
            if (onComplete) {
                onComplete();
            }
            return Promise.resolve();
        }
        
        // Cancel any existing animation on this element
        this.cancel(element);
        
        return new Promise((resolve, reject) => {
            try {
                // Set animation properties
                element.style.animationDuration = `${duration}ms`;
                element.style.animationTimingFunction = easing;
                element.style.animationFillMode = fill;
                
                // Add animation class
                element.classList.add(animationName);
                
                // Create animation completion handler
                const handleAnimationEnd = (event) => {
                    // Only handle events for this element
                    if (event.target !== element) return;
                    
                    // Clean up
                    element.removeEventListener('animationend', handleAnimationEnd);
                    element.removeEventListener('animationcancel', handleAnimationEnd);
                    
                    // Remove from active animations
                    this.activeAnimations.delete(element);
                    
                    // Call onComplete callback if provided
                    if (onComplete) {
                        onComplete();
                    }
                    
                    resolve();
                };
                
                // Listen for animation completion
                element.addEventListener('animationend', handleAnimationEnd);
                element.addEventListener('animationcancel', handleAnimationEnd);
                
                // Store animation info for potential cancellation
                this.activeAnimations.set(element, {
                    animationName,
                    startTime: Date.now(),
                    duration,
                    cleanup: handleAnimationEnd
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Fade in an element
     * 
     * @param {HTMLElement} element - The element to fade in
     * @param {number} duration - Animation duration in milliseconds (default: 300)
     * @returns {Promise<void>} Promise that resolves when animation completes
     * 
     * Requirements: 2.1, 2.2
     */
    fadeIn(element, duration = 300) {
        if (!element || !(element instanceof HTMLElement)) {
            return Promise.reject(new Error('Element is required for fadeIn'));
        }
        
        // If reduced motion, just show the element
        if (this.reducedMotion) {
            element.style.opacity = '1';
            element.style.display = '';
            return Promise.resolve();
        }
        
        // Set initial state
        element.style.opacity = '0';
        element.style.display = '';
        
        // Use Web Animations API if available, otherwise use CSS transitions
        if (element.animate) {
            const animation = element.animate(
                [
                    { opacity: 0 },
                    { opacity: 1 }
                ],
                {
                    duration: duration,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                }
            );
            
            // Store animation for potential cancellation
            this.activeAnimations.set(element, {
                animationName: 'fadeIn',
                startTime: Date.now(),
                duration,
                animation: animation
            });
            
            return animation.finished.then(() => {
                element.style.opacity = '1';
                this.activeAnimations.delete(element);
            });
        } else {
            // Fallback to CSS transitions
            return new Promise((resolve) => {
                element.style.transition = `opacity ${duration}ms ease-in-out`;
                
                const handleTransitionEnd = () => {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.style.transition = '';
                    this.activeAnimations.delete(element);
                    resolve();
                };
                
                element.addEventListener('transitionend', handleTransitionEnd);
                
                // Trigger transition
                requestAnimationFrame(() => {
                    element.style.opacity = '1';
                });
                
                this.activeAnimations.set(element, {
                    animationName: 'fadeIn',
                    startTime: Date.now(),
                    duration,
                    cleanup: handleTransitionEnd
                });
            });
        }
    }
    
    /**
     * Fade out an element
     * 
     * @param {HTMLElement} element - The element to fade out
     * @param {number} duration - Animation duration in milliseconds (default: 300)
     * @returns {Promise<void>} Promise that resolves when animation completes
     * 
     * Requirements: 2.1, 2.2
     */
    fadeOut(element, duration = 300) {
        if (!element || !(element instanceof HTMLElement)) {
            return Promise.reject(new Error('Element is required for fadeOut'));
        }
        
        // If reduced motion, just hide the element
        if (this.reducedMotion) {
            element.style.opacity = '0';
            element.style.display = 'none';
            return Promise.resolve();
        }
        
        // Use Web Animations API if available
        if (element.animate) {
            const animation = element.animate(
                [
                    { opacity: 1 },
                    { opacity: 0 }
                ],
                {
                    duration: duration,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                }
            );
            
            this.activeAnimations.set(element, {
                animationName: 'fadeOut',
                startTime: Date.now(),
                duration,
                animation: animation
            });
            
            return animation.finished.then(() => {
                element.style.opacity = '0';
                element.style.display = 'none';
                this.activeAnimations.delete(element);
            });
        } else {
            // Fallback to CSS transitions
            return new Promise((resolve) => {
                element.style.transition = `opacity ${duration}ms ease-in-out`;
                
                const handleTransitionEnd = () => {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.style.transition = '';
                    element.style.display = 'none';
                    this.activeAnimations.delete(element);
                    resolve();
                };
                
                element.addEventListener('transitionend', handleTransitionEnd);
                
                // Trigger transition
                requestAnimationFrame(() => {
                    element.style.opacity = '0';
                });
                
                this.activeAnimations.set(element, {
                    animationName: 'fadeOut',
                    startTime: Date.now(),
                    duration,
                    cleanup: handleTransitionEnd
                });
            });
        }
    }
    
    /**
     * Slide an element in a direction
     * Automatically adjusts for RTL layout
     * 
     * @param {HTMLElement} element - The element to slide
     * @param {string} direction - Direction: 'up', 'down', 'left', 'right'
     * @param {number} duration - Animation duration in milliseconds (default: 300)
     * @param {number} distance - Distance to slide in pixels (default: 100)
     * @returns {Promise<void>} Promise that resolves when animation completes
     * 
     * Requirements: 8.1, 17.1
     */
    slide(element, direction, duration = 300, distance = 100) {
        if (!element || !(element instanceof HTMLElement)) {
            return Promise.reject(new Error('Element is required for slide'));
        }
        
        // Validate direction
        const validDirections = ['up', 'down', 'left', 'right'];
        if (!validDirections.includes(direction)) {
            return Promise.reject(new Error(`Invalid direction: ${direction}. Must be one of: ${validDirections.join(', ')}`));
        }
        
        // Adjust direction for RTL layout
        let adjustedDirection = direction;
        if (this.isRTL && (direction === 'left' || direction === 'right')) {
            adjustedDirection = direction === 'left' ? 'right' : 'left';
        }
        
        // If reduced motion, just show/hide the element
        if (this.reducedMotion) {
            element.style.transform = 'translate(0, 0)';
            return Promise.resolve();
        }
        
        // Calculate transform values
        let fromX = 0, fromY = 0;
        let transformType = 'translate';
        
        switch (adjustedDirection) {
            case 'up':
                fromY = distance;
                transformType = 'translateY';
                break;
            case 'down':
                fromY = -distance;
                transformType = 'translateY';
                break;
            case 'left':
                fromX = distance;
                transformType = 'translateX';
                break;
            case 'right':
                fromX = -distance;
                transformType = 'translateX';
                break;
        }
        
        // Determine the transform strings
        const fromTransform = transformType === 'translateY' 
            ? `translateY(${fromY}px)` 
            : `translateX(${fromX}px)`;
        const toTransform = transformType === 'translateY' 
            ? 'translateY(0)' 
            : 'translateX(0)';
        
        // Use Web Animations API if available
        if (element.animate) {
            const animation = element.animate(
                [
                    { transform: fromTransform, opacity: 0 },
                    { transform: toTransform, opacity: 1 }
                ],
                {
                    duration: duration,
                    easing: 'ease-out',
                    fill: 'forwards'
                }
            );
            
            this.activeAnimations.set(element, {
                animationName: 'slide',
                startTime: Date.now(),
                duration,
                animation: animation
            });
            
            return animation.finished.then(() => {
                element.style.transform = toTransform;
                element.style.opacity = '1';
                this.activeAnimations.delete(element);
            });
        } else {
            // Fallback to CSS transitions
            return new Promise((resolve) => {
                element.style.transform = fromTransform;
                element.style.opacity = '0';
                element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
                
                const handleTransitionEnd = () => {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.style.transition = '';
                    this.activeAnimations.delete(element);
                    resolve();
                };
                
                element.addEventListener('transitionend', handleTransitionEnd);
                
                // Trigger transition
                requestAnimationFrame(() => {
                    element.style.transform = toTransform;
                    element.style.opacity = '1';
                });
                
                this.activeAnimations.set(element, {
                    animationName: 'slide',
                    startTime: Date.now(),
                    duration,
                    cleanup: handleTransitionEnd
                });
            });
        }
    }
    
    /**
     * Scale an element from one size to another
     * 
     * @param {HTMLElement} element - The element to scale
     * @param {number} from - Starting scale (default: 0)
     * @param {number} to - Ending scale (default: 1)
     * @param {number} duration - Animation duration in milliseconds (default: 300)
     * @returns {Promise<void>} Promise that resolves when animation completes
     * 
     * Requirements: 8.1, 8.2, 12.3, 12.5
     */
    scale(element, from = 0, to = 1, duration = 300) {
        if (!element || !(element instanceof HTMLElement)) {
            return Promise.reject(new Error('Element is required for scale'));
        }
        
        // Validate from and to are numbers
        if (typeof from !== 'number' || typeof to !== 'number') {
            return Promise.reject(new Error('From and to values must be numbers'));
        }
        
        // If reduced motion, just set final scale
        if (this.reducedMotion) {
            element.style.transform = `scale(${to})`;
            return Promise.resolve();
        }
        
        // Use Web Animations API if available
        if (element.animate) {
            const animation = element.animate(
                [
                    { transform: `scale(${from})`, opacity: from === 0 ? 0 : 1 },
                    { transform: `scale(${to})`, opacity: to === 0 ? 0 : 1 }
                ],
                {
                    duration: duration,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                }
            );
            
            this.activeAnimations.set(element, {
                animationName: 'scale',
                startTime: Date.now(),
                duration,
                animation: animation
            });
            
            return animation.finished.then(() => {
                element.style.transform = `scale(${to})`;
                element.style.opacity = to === 0 ? '0' : '1';
                this.activeAnimations.delete(element);
            });
        } else {
            // Fallback to CSS transitions
            return new Promise((resolve) => {
                element.style.transform = `scale(${from})`;
                element.style.opacity = from === 0 ? '0' : '1';
                element.style.transition = `transform ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`;
                
                const handleTransitionEnd = () => {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.style.transition = '';
                    this.activeAnimations.delete(element);
                    resolve();
                };
                
                element.addEventListener('transitionend', handleTransitionEnd);
                
                // Trigger transition
                requestAnimationFrame(() => {
                    element.style.transform = `scale(${to})`;
                    element.style.opacity = to === 0 ? '0' : '1';
                });
                
                this.activeAnimations.set(element, {
                    animationName: 'scale',
                    startTime: Date.now(),
                    duration,
                    cleanup: handleTransitionEnd
                });
            });
        }
    }
    
    /**
     * Stagger animations for multiple elements
     * Animates elements one after another with a delay between each
     * 
     * @param {Array|NodeList} elements - Elements to animate
     * @param {Function} animationFn - Function that returns a promise for each element
     * @param {number} delay - Delay between each animation in milliseconds (default: 100)
     * @returns {Promise<void>} Promise that resolves when all animations complete
     * 
     * Requirements: 7.3, 14.2
     */
    async stagger(elements, animationFn, delay = 100) {
        // Handle null or empty arrays
        if (!elements || elements.length === 0) {
            return Promise.resolve();
        }
        
        // Convert NodeList to Array if needed
        const elementsArray = Array.from(elements);
        
        // Animate each element with delay
        for (let i = 0; i < elementsArray.length; i++) {
            const element = elementsArray[i];
            
            // Start animation
            animationFn(element);
            
            // Wait for delay before next animation (except for last element)
            if (i < elementsArray.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    /**
     * Cancel an active animation on an element
     * Stops the animation and cleans up resources
     * 
     * @param {HTMLElement} element - The element with animation to cancel
     * 
     * Requirements: 2.1
     */
    cancel(element) {
        if (!element || !(element instanceof HTMLElement)) {
            return;
        }
        
        const animationInfo = this.activeAnimations.get(element);
        if (!animationInfo) {
            return;
        }
        
        // Cancel Web Animations API animation
        if (animationInfo.animation) {
            animationInfo.animation.cancel();
        }
        
        // Remove event listeners
        if (animationInfo.cleanup) {
            element.removeEventListener('animationend', animationInfo.cleanup);
            element.removeEventListener('animationcancel', animationInfo.cleanup);
            element.removeEventListener('transitionend', animationInfo.cleanup);
        }
        
        // Remove animation class if present
        if (animationInfo.animationName) {
            element.classList.remove(animationInfo.animationName);
        }
        
        // Clear inline styles
        element.style.animation = '';
        element.style.transition = '';
        
        // Remove from active animations
        this.activeAnimations.delete(element);
    }
}

// Export for use in other modules (if using module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnimationEngine, AnimationConfig };
}

/**
 * ToastNotificationSystem - Modern toast notification component
 * 
 * Displays non-blocking notification messages with smooth animations.
 * Supports multiple message types (success, error, warning, info) with
 * appropriate styling and icons. Automatically dismisses after a configurable
 * duration and respects RTL layout direction.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 17.2
 */
class ToastNotificationSystem {
    /**
     * Create a ToastNotificationSystem instance
     * 
     * @param {Object} options - Configuration options
     * @param {string} options.position - Toast position: 'top-left', 'top-right', 'bottom-left', 'bottom-right' (default: 'top-left' for RTL)
     * @param {number} options.duration - Auto-dismiss duration in milliseconds (default: 5000)
     * @param {number} options.maxToasts - Maximum number of toasts to display simultaneously (default: 5)
     * @param {number} options.spacing - Spacing between toasts in pixels (default: 16)
     */
    constructor(options = {}) {
        // Detect RTL layout
        this.isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
        
        // Configuration with defaults
        this.position = options.position || (this.isRTL ? 'top-left' : 'top-right');
        this.duration = options.duration || 5000;
        this.maxToasts = options.maxToasts || 5;
        this.spacing = options.spacing || 16;
        
        // Toast type configurations
        this.types = {
            success: { 
                icon: 'icon-check', 
                color: '#28a745',
                bgColor: '#d4edda',
                borderColor: '#c3e6cb',
                textColor: '#155724'
            },
            error: { 
                icon: 'icon-close', 
                color: '#dc3545',
                bgColor: '#f8d7da',
                borderColor: '#f5c6cb',
                textColor: '#721c24'
            },
            warning: { 
                icon: 'icon-exclamation', 
                color: '#ffc107',
                bgColor: '#fff3cd',
                borderColor: '#ffeaa7',
                textColor: '#856404'
            },
            info: { 
                icon: 'icon-info', 
                color: '#17a2b8',
                bgColor: '#d1ecf1',
                borderColor: '#bee5eb',
                textColor: '#0c5460'
            }
        };
        
        // Container for toasts
        this.container = null;
        
        // Map to track active toasts
        this.activeToasts = new Map();
        
        // Counter for unique IDs
        this.toastIdCounter = 0;
        
        // Animation engine instance
        this.animationEngine = null;
        
        // Initialize the container
        this.initContainer();
    }
    
    /**
     * Initialize the toast container
     * Creates and positions the container element in the DOM
     * 
     * @private
     */
    initContainer() {
        // Check if container already exists
        this.container = document.getElementById('toast-container');
        
        if (!this.container) {
            // Create container
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            
            // Set position based on configuration
            this.container.style.position = 'fixed';
            this.container.style.zIndex = '9999';
            this.container.style.display = 'flex';
            this.container.style.flexDirection = 'column';
            this.container.style.gap = `${this.spacing}px`;
            this.container.style.pointerEvents = 'none'; // Allow clicks through container
            
            // Position based on configuration
            const [vertical, horizontal] = this.position.split('-');
            this.container.style[vertical] = '20px';
            this.container.style[horizontal] = '20px';
            
            // Add to document
            document.body.appendChild(this.container);
        }
    }
    
    /**
     * Set the animation engine instance
     * 
     * @param {AnimationEngine} engine - The animation engine to use
     */
    setAnimationEngine(engine) {
        this.animationEngine = engine;
    }
    
    /**
     * Show a toast notification
     * 
     * @param {string} message - The message to display
     * @param {string} type - Toast type: 'success', 'error', 'warning', 'info' (default: 'info')
     * @param {Object} options - Additional options
     * @param {number} options.duration - Custom duration for this toast (overrides default)
     * @param {boolean} options.dismissible - Whether the toast can be manually dismissed (default: true)
     * @param {Function} options.onDismiss - Callback function when toast is dismissed
     * @returns {HTMLElement} The created toast element
     * 
     * Requirements: 1.1, 1.6
     */
    show(message, type = 'info', options = {}) {
        // Validate message
        if (!message || typeof message !== 'string') {
            console.error('Toast message must be a non-empty string');
            return null;
        }
        
        // Validate type
        if (!this.types[type]) {
            console.warn(`Invalid toast type: ${type}. Using 'info' instead.`);
            type = 'info';
        }
        
        // Check if we've reached max toasts
        if (this.activeToasts.size >= this.maxToasts) {
            // Dismiss the oldest toast
            const oldestToastId = this.activeToasts.keys().next().value;
            const oldestToast = this.activeToasts.get(oldestToastId);
            if (oldestToast) {
                this.dismiss(oldestToast.element);
            }
        }
        
        // Generate unique ID
        const toastId = `toast-${++this.toastIdCounter}`;
        
        // Get type configuration
        const typeConfig = this.types[type];
        
        // Create toast element
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
        toast.style.pointerEvents = 'auto'; // Allow clicks on toast
        
        // Style the toast
        toast.style.display = 'flex';
        toast.style.alignItems = 'flex-start';
        toast.style.gap = '12px';
        toast.style.padding = '16px';
        toast.style.backgroundColor = typeConfig.bgColor;
        toast.style.border = `1px solid ${typeConfig.borderColor}`;
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        toast.style.minWidth = '300px';
        toast.style.maxWidth = '500px';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        
        // Create icon element (if icon class exists)
        const iconSpan = document.createElement('span');
        iconSpan.className = `toast-icon ${typeConfig.icon}`;
        iconSpan.style.fontSize = '20px';
        iconSpan.style.color = typeConfig.color;
        iconSpan.style.flexShrink = '0';
        iconSpan.style.marginTop = '2px';
        iconSpan.setAttribute('aria-hidden', 'true');
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'toast-message';
        messageDiv.textContent = message;
        messageDiv.style.flex = '1';
        messageDiv.style.color = typeConfig.textColor;
        messageDiv.style.fontSize = '14px';
        messageDiv.style.lineHeight = '1.5';
        messageDiv.style.wordWrap = 'break-word';
        
        // Create close button (if dismissible)
        const dismissible = options.dismissible !== false;
        let closeButton = null;
        
        if (dismissible) {
            closeButton = document.createElement('button');
            closeButton.className = 'toast-close';
            closeButton.innerHTML = '&times;';
            closeButton.setAttribute('aria-label', 'Close notification');
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '24px';
            closeButton.style.lineHeight = '1';
            closeButton.style.color = typeConfig.textColor;
            closeButton.style.cursor = 'pointer';
            closeButton.style.padding = '0';
            closeButton.style.marginLeft = '8px';
            closeButton.style.opacity = '0.5';
            closeButton.style.transition = 'opacity 0.2s';
            closeButton.style.flexShrink = '0';
            
            // Hover effect
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.opacity = '1';
            });
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.opacity = '0.5';
            });
            
            // Click handler
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dismiss(toast);
            });
        }
        
        // Assemble toast
        toast.appendChild(iconSpan);
        toast.appendChild(messageDiv);
        if (closeButton) {
            toast.appendChild(closeButton);
        }
        
        // Add to container
        this.container.appendChild(toast);
        
        // Trigger fade-in animation
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        
        // Store toast data
        const toastData = {
            id: toastId,
            element: toast,
            message: message,
            type: type,
            timestamp: Date.now(),
            dismissible: dismissible,
            onDismiss: options.onDismiss
        };
        
        this.activeToasts.set(toastId, toastData);
        
        // Set auto-dismiss timer
        const dismissDuration = options.duration !== undefined ? options.duration : this.duration;
        if (dismissDuration > 0) {
            const timerId = setTimeout(() => {
                this.dismiss(toast);
            }, dismissDuration);
            
            toastData.timerId = timerId;
        }
        
        return toast;
    }
    
    /**
     * Dismiss a specific toast notification
     * Animates the toast out and removes it from the DOM
     * 
     * @param {HTMLElement} toastElement - The toast element to dismiss
     * @returns {Promise<void>} Promise that resolves when toast is dismissed
     * 
     * Requirements: 1.4
     */
    dismiss(toastElement) {
        if (!toastElement || !(toastElement instanceof HTMLElement)) {
            return Promise.resolve();
        }
        
        // Find toast data
        const toastId = toastElement.id;
        const toastData = this.activeToasts.get(toastId);
        
        if (!toastData) {
            // Toast already dismissed
            return Promise.resolve();
        }
        
        // Clear auto-dismiss timer if exists
        if (toastData.timerId) {
            clearTimeout(toastData.timerId);
        }
        
        // Remove from active toasts immediately to prevent double-dismissal
        this.activeToasts.delete(toastId);
        
        // Animate out
        return new Promise((resolve) => {
            toastElement.style.opacity = '0';
            toastElement.style.transform = 'translateY(-20px)';
            
            // Wait for animation to complete
            setTimeout(() => {
                // Remove from DOM
                if (toastElement.parentNode) {
                    toastElement.parentNode.removeChild(toastElement);
                }
                
                // Call onDismiss callback if provided
                if (toastData.onDismiss) {
                    toastData.onDismiss();
                }
                
                resolve();
            }, 300); // Match transition duration
        });
    }
    
    /**
     * Dismiss all active toast notifications
     * 
     * @returns {Promise<void>} Promise that resolves when all toasts are dismissed
     * 
     * Requirements: 1.4
     */
    dismissAll() {
        const dismissPromises = [];
        
        // Collect all active toasts
        const toasts = Array.from(this.activeToasts.values());
        
        // Dismiss each toast
        for (const toastData of toasts) {
            dismissPromises.push(this.dismiss(toastData.element));
        }
        
        return Promise.all(dismissPromises);
    }
    
    /**
     * Initialize toast notifications from Django messages
     * Converts existing Django message divs to toast notifications
     * 
     * This method looks for Django messages in the DOM (typically rendered
     * by Django's messages framework) and converts them to modern toast notifications.
     * 
     * Expected Django message structure:
     * <div class="alert alert-{type}" role="alert">Message text</div>
     * 
     * Where {type} is one of: success, danger (error), warning, info
     * 
     * Requirements: 1.1
     */
    initFromDjangoMessages() {
        // Look for Django messages
        const djangoMessages = document.querySelectorAll('.alert[role="alert"]');
        
        if (djangoMessages.length === 0) {
            return;
        }
        
        // Convert each Django message to a toast
        djangoMessages.forEach((messageElement) => {
            // Extract message text
            const message = messageElement.textContent.trim();
            
            if (!message) {
                return;
            }
            
            // Determine message type from classes
            let type = 'info';
            if (messageElement.classList.contains('alert-success')) {
                type = 'success';
            } else if (messageElement.classList.contains('alert-danger') || 
                       messageElement.classList.contains('alert-error')) {
                type = 'error';
            } else if (messageElement.classList.contains('alert-warning')) {
                type = 'warning';
            } else if (messageElement.classList.contains('alert-info')) {
                type = 'info';
            }
            
            // Show toast
            this.show(message, type);
            
            // Hide the original Django message
            messageElement.style.display = 'none';
        });
    }
}

// Export for use in other modules (if using module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports.ToastNotificationSystem = ToastNotificationSystem;
}

/* ============================================
   Site Toast & UX Initialization (Django messages + scroll-top)
   ============================================ */

/**
 * Initialize site toasts (#site-toast-container): progress bar, auto-dismiss, close with exit animation
 */
function initSiteToasts() {
    var container = document.getElementById('site-toast-container');
    if (!container) return;

    var toasts = container.querySelectorAll('.site-toast');
    toasts.forEach(function (toast) {
        var duration = parseInt(toast.getAttribute('data-duration'), 10) || 5000;
        var progress = toast.querySelector('.site-toast-progress');
        if (progress) {
            progress.style.animationDuration = duration + 'ms';
        }

        var closeBtn = toast.querySelector('.site-toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                dismissSiteToast(toast, container);
            });
        }

        var timerId = setTimeout(function () {
            dismissSiteToast(toast, container);
        }, duration);
        toast._dismissTimer = timerId;
    });
}

/**
 * Dismiss a single site toast with exit animation then remove from DOM
 */
function dismissSiteToast(toast, container) {
    if (toast._dismissTimer) {
        clearTimeout(toast._dismissTimer);
        toast._dismissTimer = null;
    }
    toast.classList.add('site-toast-exit');
    setTimeout(function () {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        if (container && container.children.length === 0) {
            container.parentNode && container.parentNode.removeChild(container);
        }
    }, 320);
}

/**
 * Smoother scroll-top button: transition for show/hide and smooth scroll
 */
function initScrollTopEnhance() {
    var scrollBtn = document.getElementById('scroll-top');
    if (!scrollBtn) return;

    scrollBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease';
    scrollBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Optional: subtle micro-interactions for primary buttons and dropdown toggles
 */
function initMicroInteractions() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    document.querySelectorAll('.btn-primary, .btn-dark, .btn:not(.btn-link)').forEach(function (btn) {
        btn.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        btn.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        btn.addEventListener('mouseleave', function () {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
}

/**
 * Scroll reveal: animate elements when they enter viewport (respects prefers-reduced-motion)
 */
function initScrollReveal() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    if (!window.IntersectionObserver) return;

    var selector = [
        '.page-content .container > .breadcrumb-nav',
        '.page-content .container > .product-details-top',
        '.page-content .container > .product-details-tab',
        '.page-content .container > .row',
        '.page-content .container > h2.title',
        '.main .page-header',
        '.product-details-top .row',
        '.product.product-7',
        '.product-details .product-title',
        '.reviews .review'
    ].join(', ');
    var elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

    elements.forEach(function (el) {
        if (!el.classList.contains('scroll-reveal-visible')) {
            el.classList.add('scroll-reveal');
            observer.observe(el);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initSiteToasts();
        initScrollTopEnhance();
        initMicroInteractions();
        initScrollReveal();
    });
} else {
    initSiteToasts();
    initScrollTopEnhance();
    initMicroInteractions();
    initScrollReveal();
}
