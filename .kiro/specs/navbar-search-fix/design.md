# Design Document: Navbar Search Dropdown Fix

## Overview

This design addresses the search dropdown overflow issue by implementing responsive positioning logic using CSS. The solution uses a combination of viewport-relative units, CSS `clamp()` for intelligent width constraints, and dynamic positioning to ensure the dropdown stays within viewport boundaries across all screen sizes.

The fix is CSS-only and requires no JavaScript changes, maintaining the existing behavior while solving the overflow problem. The approach leverages modern CSS features that are well-supported across all target browsers.

## Architecture

The solution modifies only the CSS positioning and sizing rules for the `.az-search-drop` class. The architecture remains unchanged:

- **HTML Structure**: No changes to `navbar_modern.html`
- **JavaScript Behavior**: No changes to `navbar-modern.js` 
- **CSS Modifications**: Updates to `.az-search-drop` positioning rules in `navbar-modern.css`

The fix uses a mobile-first responsive approach with three breakpoints:
1. Small phones (≤480px)
2. Tablets and mobile (481px - 992px)
3. Desktop (>992px)

## Components and Interfaces

### Modified CSS Component: `.az-search-drop`

**Current Implementation Issues:**
- Fixed `width: 320px` causes overflow on small screens
- `max-width: calc(100vw - 32px)` is applied but positioning with `right: 0` still causes overflow
- No dynamic adjustment based on available space

**New Implementation:**

```css
/* Base positioning (desktop) */
#az-nav .az-search-drop {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 320px;
    max-width: calc(100vw - 32px);
    background: var(--az-bg);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,.14);
    border: 1px solid var(--az-border);
    padding: 10px;
    opacity: 0;
    visibility: hidden;
    transition: opacity .3s var(--az-ease), visibility .3s var(--az-ease), transform .3s var(--az-ease);
    z-index: 1200;
    transform: translateY(8px);
    /* Prevent overflow by ensuring dropdown stays within viewport */
    transform-origin: top right;
}

/* Tablet and mobile (481px - 992px) */
@media(max-width: 992px) and (min-width: 481px) {
    #az-nav .az-search-drop {
        width: min(360px, calc(100vw - 32px));
        right: 0;
        left: auto;
    }
}

/* Small phones (≤480px) */
@media(max-width: 480px) {
    #az-nav .az-search-drop {
        width: calc(100vw - 32px);
        right: 16px;
        left: auto;
    }
}
```

### Positioning Strategy

**Desktop (>992px):**
- Fixed width of 320px
- Anchored to `right: 0` relative to `.az-search-wrap`
- Uses `max-width: calc(100vw - 32px)` as safety constraint
- Transform origin set to `top right` for proper animation

**Tablet/Mobile (481px - 992px):**
- Width uses `min(360px, calc(100vw - 32px))` for intelligent sizing
- Maintains right-side anchoring
- Automatically shrinks if viewport is narrower than 392px (360px + 32px margins)

**Small Phones (≤480px):**
- Full responsive width: `calc(100vw - 32px)`
- Explicit `right: 16px` positioning ensures 16px margin from right edge
- Left edge automatically positioned to maintain width

## Data Models

No data model changes required. This is a pure CSS fix.

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

For this CSS fix, properties are tested using browser automation tools (Playwright, Selenium, or Cypress) that can measure element positions, dimensions, and computed styles across different viewport sizes and browsers.

### Property 1: Viewport Boundary Containment

*For any* viewport width and height combination, when the search dropdown is opened, all edges of the dropdown (top, right, bottom, left) should be within the viewport boundaries (no part of the dropdown extends beyond the visible area).

**Validates: Requirements 1.1, 1.2, 3.2, 5.1**

### Property 2: Minimum Edge Spacing

*For any* viewport size, when the search dropdown is opened, the distance from each dropdown edge to the corresponding viewport edge should be at least 16 pixels.

**Validates: Requirements 1.3, 1.4**

### Property 3: Responsive Width Behavior

*For any* viewport width, when the search dropdown is opened, the dropdown width should match the expected width for that breakpoint:
- If viewport width ≤ 480px: dropdown width = viewport width - 32px
- If 480px < viewport width ≤ 992px: dropdown width = min(360px, viewport width - 32px)
- If viewport width > 992px: dropdown width = 320px (unless viewport is narrower than 352px, then viewport width - 32px)

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Internal Layout Consistency

*For any* dropdown width (from minimum to maximum), when the search dropdown is rendered, all internal elements (search icon, input field, submit button) should be visible, non-overlapping, and maintain their relative spacing proportions.

**Validates: Requirements 2.4, 4.3**

### Property 5: Visual Alignment with Navbar Icons

*For any* viewport size, when the search dropdown is opened, the right edge of the dropdown should be aligned with or positioned near (within 50px) the right edge of the navbar icons section.

**Validates: Requirements 3.3**

### Property 6: Style Preservation

*For any* viewport size, when the search dropdown is opened, the computed CSS values for border-radius, box-shadow, and background-color should remain constant and match the design specifications.

**Validates: Requirements 4.1**

### Property 7: Animation Preservation

*For any* viewport size, when the search dropdown is toggled open or closed, the opacity and transform transitions should be animated (not instant) with the specified duration and easing function.

**Validates: Requirements 4.2**

## Error Handling

This is a CSS-only fix with no error conditions. The CSS will gracefully degrade in older browsers:

- **Modern browsers** (Chrome 88+, Firefox 75+, Safari 13.1+, Edge 88+): Full support for `min()`, `calc()`, and all positioning features
- **Older browsers**: The `max-width: calc(100vw - 32px)` fallback ensures basic overflow prevention even if `min()` is not supported

No JavaScript error handling is required since no JS changes are made.

## Testing Strategy

### Unit Testing Approach

Since this is a CSS fix, traditional unit tests are not applicable. Instead, we use **visual regression testing** and **layout testing** with browser automation tools.

**Recommended Tools:**
- **Playwright** or **Cypress** for browser automation
- **Percy** or **Chromatic** for visual regression testing (optional)

**Test Structure:**

Each test should:
1. Set viewport to specific dimensions
2. Navigate to a page with the navbar
3. Click the search icon to open dropdown
4. Measure dropdown position and dimensions
5. Assert against expected values

**Example Test Cases (Unit-style):**

```javascript
// Example: Mobile viewport boundary test
test('search dropdown stays within viewport on mobile', async () => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto('/');
  await page.click('#azSearchToggle');
  
  const dropdown = await page.locator('#azSearchDrop');
  const dropdownBox = await dropdown.boundingBox();
  const viewportSize = page.viewportSize();
  
  // Assert dropdown is within viewport
  expect(dropdownBox.x).toBeGreaterThanOrEqual(0);
  expect(dropdownBox.y).toBeGreaterThanOrEqual(0);
  expect(dropdownBox.x + dropdownBox.width).toBeLessThanOrEqual(viewportSize.width);
  expect(dropdownBox.y + dropdownBox.height).toBeLessThanOrEqual(viewportSize.height);
});

// Example: Desktop width test
test('search dropdown has correct width on desktop', async () => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await page.click('#azSearchToggle');
  
  const dropdown = await page.locator('#azSearchDrop');
  const width = await dropdown.evaluate(el => el.offsetWidth);
  
  expect(width).toBe(320);
});

// Example: Edge spacing test
test('search dropdown maintains 16px minimum spacing', async () => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.click('#azSearchToggle');
  
  const dropdown = await page.locator('#azSearchDrop');
  const dropdownBox = await dropdown.boundingBox();
  const viewportSize = page.viewportSize();
  
  const rightSpacing = viewportSize.width - (dropdownBox.x + dropdownBox.width);
  const leftSpacing = dropdownBox.x;
  
  expect(rightSpacing).toBeGreaterThanOrEqual(16);
  expect(leftSpacing).toBeGreaterThanOrEqual(16);
});
```

### Property-Based Testing Approach

Property-based tests generate random viewport dimensions and verify properties hold across all inputs.

**Test Configuration:**
- Minimum 100 iterations per property test
- Viewport width range: 320px - 2560px
- Viewport height range: 568px - 1440px

**Property Test Examples:**

```javascript
// Property 1: Viewport Boundary Containment
test('Property 1: Dropdown always stays within viewport boundaries', async () => {
  // Feature: navbar-search-fix, Property 1: Viewport Boundary Containment
  
  for (let i = 0; i < 100; i++) {
    const width = randomInt(320, 2560);
    const height = randomInt(568, 1440);
    
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.click('#azSearchToggle');
    
    const dropdown = await page.locator('#azSearchDrop');
    const box = await dropdown.boundingBox();
    
    // Property: all edges within viewport
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    
    await page.click('#azSearchToggle'); // Close dropdown
  }
});

// Property 3: Responsive Width Behavior
test('Property 3: Dropdown width matches breakpoint rules', async () => {
  // Feature: navbar-search-fix, Property 3: Responsive Width Behavior
  
  for (let i = 0; i < 100; i++) {
    const width = randomInt(320, 2560);
    const height = randomInt(568, 1440);
    
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.click('#azSearchToggle');
    
    const dropdown = await page.locator('#azSearchDrop');
    const dropdownWidth = await dropdown.evaluate(el => el.offsetWidth);
    
    let expectedWidth;
    if (width <= 480) {
      expectedWidth = width - 32;
    } else if (width <= 992) {
      expectedWidth = Math.min(360, width - 32);
    } else {
      expectedWidth = Math.min(320, width - 32);
    }
    
    // Allow 1px tolerance for rounding
    expect(Math.abs(dropdownWidth - expectedWidth)).toBeLessThanOrEqual(1);
    
    await page.click('#azSearchToggle');
  }
});
```

### Cross-Browser Testing

All property tests should be run across multiple browsers:
- Chrome/Chromium
- Firefox
- Safari (WebKit)
- Edge

This ensures Requirement 5.1 is validated.

### Testing Balance

- **Unit-style tests**: Focus on specific viewport sizes (mobile: 375px, tablet: 768px, desktop: 1920px) and edge cases (very narrow: 320px, very wide: 2560px)
- **Property tests**: Cover the full range of viewport dimensions with randomization to catch unexpected edge cases
- Both approaches are complementary: unit tests provide clear examples of expected behavior, while property tests ensure correctness across all possible inputs

### Manual Testing Checklist

After automated tests pass, perform manual verification:

1. ✓ Open search dropdown on iPhone SE (375px width)
2. ✓ Open search dropdown on iPad (768px width)
3. ✓ Open search dropdown on laptop (1440px width)
4. ✓ Open search dropdown on ultra-wide monitor (2560px width)
5. ✓ Verify animations are smooth
6. ✓ Verify internal elements (icon, input, button) are properly laid out
7. ✓ Test in Chrome, Firefox, Safari, and Edge

## Implementation Notes

### CSS Changes Summary

Only one file needs modification: `static/assets/css/navbar-modern.css`

**Changes to `.az-search-drop` selector:**
1. Keep existing base styles
2. Update width calculation for better responsiveness
3. Add explicit positioning for mobile breakpoint
4. Ensure `transform-origin` is set for proper animations

### No Breaking Changes

This fix maintains backward compatibility:
- No HTML structure changes
- No JavaScript behavior changes
- No changes to class names or IDs
- Existing animations and transitions preserved
- Visual design remains consistent

### Browser Support

The solution uses widely-supported CSS features:
- `calc()`: Supported in all modern browsers (IE 9+)
- `min()`: Supported in Chrome 79+, Firefox 75+, Safari 11.1+, Edge 79+
- `max-width`: Universal support
- Viewport units (`vw`): Universal support in modern browsers

For browsers that don't support `min()`, the `max-width` fallback ensures basic functionality.
