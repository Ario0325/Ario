# PWA Implementation Plan for Ario Shop

## Project Analysis Summary

**Current State:**
- Django 6.0 e-commerce project (Ario Shop)
- Uses static files from `static/` directory
- Has a partial/incorrect manifest (references missing android-chrome icons)
- No existing service worker
- Uses AJAX for cart operations
- Has admin functionality that should NOT be cached
- Uses CSRF protection (service worker must handle this correctly)
- DEBUG=True in development

---

## Implementation Plan (Addressing All User Requirements)

### 1. PWA Icons Creation
**Location:** `static/pwa/`
- `icon-192x192.png` - 192x192 PNG for home screen
- `icon-512x512.png` - 512x512 PNG for install prompt
- Use existing logo or create placeholder SVG

### 2. Web App Manifest
**File:** `static/pwa/manifest.json`
```json
{
  "name": "آریو شاپ - Ario Shop",
  "short_name": "آریو شاپ",
  "description": "فروشگاه اینترنتی آریو شاپ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/static/pwa/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/static/pwa/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 3. Service Worker - Versioned Caching
**File:** `static/pwa/sw.js`

**Version Control:**
- Cache version stored in `CACHE_VERSION` constant
- Old caches cleaned up on update
- Version embedded in cache names: `ario-static-v1`, `ario-dynamic-v1`

**Caching Strategies:**

| Type | Strategy | Cache Name |
|------|----------|------------|
| Static assets (CSS, JS, images) | Cache-first | `ario-static-v{version}` |
| HTML pages | Network-first | `ario-dynamic-v{version}` |
| API calls | Network-first (no cache) | In-memory only |
| Fonts | Cache-first with expiration | `ario-fonts-v{version}` |

**Cache Size Limits:**
- Static cache: 50MB limit
- Dynamic cache: 20MB limit
- LRU (Least Recently Used) eviction policy

**URLs NEVER to cache:**
- `/admin/` - Admin pages
- `/cart/checkout/` - Checkout pages
- `/accounts/` - User account pages
- Any POST requests
- Any URLs with `csrfmiddlewaretoken`
- API endpoints returning user-specific data

### 4. Service Worker - Update Lifecycle
**File:** `static/pwa/sw.js`

```javascript
// Update flow:
1. New service worker detected
2. Skip waiting phase (notify user)
3. Activate event: clean old caches
4. Clients.claim() - take control immediately
```

**Registration with Update Notification:**
```javascript
// pwa-register.js
- Check for updates on page load
- Show "Update available" prompt
- Reload page on user confirmation
```

### 5. Offline Fallback Page
**File:** `templates/pwa/offline.html`

```html
- Simple branded offline page
- Shows when offline and requested page not cached
- Links to reload when online
- Does NOT require authentication
```

### 6. Django Session Compatibility
**Security Measures:**
- Service worker NEVER caches CSRF tokens
- Session cookies not stored in service worker
- Cache key excludes session ID
- No caching of authenticated-only routes

**CSRF-Safe Patterns:**
```javascript
// Skip caching for these URL patterns
const CACHE_BLACKLIST = [
  /\/admin\//,
  /\/accounts\//,
  /\/cart\/checkout\//,
  /\/api\/.*user.*/
];
```

### 7. Local Development Compatibility
**Development Mode (DEBUG=True):**
- Service worker registration works on localhost/127.0.0.1
- No HTTPS requirement enforced
- More aggressive caching disabled in DEBUG
- Detailed logging in console

**Production Ready:**
- Full HTTPS support
- Aggressive caching enabled
- Minified assets cached

---

## File Structure Changes

```
static/
  └── pwa/
      ├── icon-192x192.png    (NEW)
      ├── icon-512x512.png    (NEW)
      ├── manifest.json       (NEW)
      ├── sw.js               (NEW)
      └── pwa-register.js     (NEW)

templates/
  └── pwa/
      └── offline.html        (NEW)

templates/shared/
  └── base.html               (MODIFIED - add PWA links)
```

---

## Integration Steps

1. **Create PWA directory:** `static/pwa/`
2. **Add icons:** Create 192x192 and 512x512 icons
3. **Create manifest.json:** With proper app configuration
4. **Create service worker:** With versioned caching and lifecycle
5. **Create offline page:** Fallback for offline users
6. **Create registration JS:** Handle updates gracefully
7. **Modify base.html:** Add PWA meta tags and manifest link
8. **Test locally:** Verify service worker registers and caches work

---

## Verification Checklist

- [ ] UI remains unchanged
- [ ] All static assets load correctly
- [ ] Service worker registers without errors
- [ ] Caching works for static assets
- [ ] Dynamic pages work (network-first)
- [ ] Offline fallback shows when offline
- [ ] Update notification works
- [ ] Admin pages NOT cached
- [ ] Django sessions work correctly
- [ ] No CSRF errors introduced
- [ ] Works on localhost without HTTPS
- [ ] No JavaScript console errors
- [ ] No backend errors introduced
