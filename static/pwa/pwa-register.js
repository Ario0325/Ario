/**
 * Ario Shop PWA Registration Script
 * 
 * Features:
 * - Service worker registration with error handling
 * - Update notification to users
 * - Works in local development without HTTPS
 * - Proper update lifecycle handling
 */

(function() {
    'use strict';

    // Configuration
    const SW_PATH = '/static/pwa/sw.js';
    const UPDATE_NOTIFICATION_DELAY = 3000; // 3 seconds

    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
        // Register service worker on page load
        window.addEventListener('load', function() {
            registerServiceWorker();
        });
    } else {
        console.log('[PWA] Service workers not supported in this browser');
    }

    // Register the service worker
    function registerServiceWorker() {
        navigator.serviceWorker.register(SW_PATH)
            .then(function(registration) {
                console.log('[PWA] Service worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', function() {
                    handleUpdateFound(registration);
                });

                // If there's an existing registration, check if it's active
                if (registration.active) {
                    console.log('[PWA] Service worker is active');
                }
            })
            .catch(function(error) {
                console.error('[PWA] Service worker registration failed:', error);
            });
    }

    // Handle service worker update found
    function handleUpdateFound(registration) {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed but not yet active
                // Show update notification to user
                showUpdateNotification();
            }
        });
    }

    // Show update notification to user
    function showUpdateNotification() {
        // Check if body exists
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', function() {
                showUpdateNotification();
            });
            return;
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="pwa-notification-content">
                <span>نسخه جدید موجود است</span>
                <button id="pwa-update-btn">به‌روزرسانی</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Tahoma, Arial, sans-serif;
            font-size: 14px;
            animation: slideUp 0.3s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            .pwa-notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            #pwa-update-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }
            #pwa-update-btn:hover {
                background: #0056b3;
            }
        `;
        document.head.appendChild(style);

        // Add to body
        document.body.appendChild(notification);

        // Handle update button click
        document.getElementById('pwa-update-btn').addEventListener('click', function() {
            // Tell service worker to skip waiting
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Reload page to activate new service worker
            window.location.reload();
        });
    }

    // Handle incoming messages from service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'VERSION_INFO') {
                console.log('[PWA] Service worker version:', event.data.version);
            }
        });
    }

    // Expose global function to check PWA status
    window.PWA = {
        isSupported: function() {
            return 'serviceWorker' in navigator;
        },
        
        getVersion: function() {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
            }
        },
        
        update: function() {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        }
    };

    console.log('[PWA] Registration script loaded');
})();
