# UI Modernization Tests

This directory contains unit tests and property-based tests for the UI Modernization feature.

## Test Structure

```
tests/
├── unit/                    # Unit tests for specific examples and edge cases
│   └── animation-engine.test.js
├── property/                # Property-based tests (to be added)
└── README.md
```

## Running Tests

### Prerequisites

Install Node.js and npm, then install dependencies:

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test:watch
```

### Run Tests with Coverage

```bash
npm test:coverage
```

## Test Coverage

### AnimationEngine (Task 2.1)

The AnimationEngine class has comprehensive unit test coverage including:

#### Constructor Tests
- ✓ Initializes with correct default values
- ✓ Detects RTL direction from document
- ✓ Detects RTL from html element
- ✓ Defaults to LTR when no direction is set

#### checkReducedMotion() Tests
- ✓ Returns boolean value
- ✓ Returns false when matchMedia is not available

#### fadeIn() Tests
- ✓ Rejects when element is null
- ✓ Sets opacity to 1 when animation completes
- ✓ Adds element to activeAnimations during animation
- ✓ Removes element from activeAnimations after completion
- ✓ Handles reduced motion by showing element immediately

#### fadeOut() Tests
- ✓ Rejects when element is null
- ✓ Sets opacity to 0 and hides element when animation completes
- ✓ Handles reduced motion by hiding element immediately

#### slide() Tests
- ✓ Rejects when element is null
- ✓ Rejects with invalid direction
- ✓ Accepts valid directions (up, down, left, right)
- ✓ Reverses horizontal direction for RTL
- ✓ Does not reverse vertical direction for RTL
- ✓ Handles reduced motion by positioning element immediately

#### scale() Tests
- ✓ Rejects when element is null
- ✓ Rejects when from is not a number
- ✓ Rejects when to is not a number
- ✓ Scales element from one value to another
- ✓ Handles reduced motion by applying final scale immediately

#### cancel() Tests
- ✓ Handles null element gracefully
- ✓ Cancels active animation
- ✓ Handles element with no active animation

#### animate() Tests
- ✓ Rejects when element is null
- ✓ Uses default duration and easing
- ✓ Uses custom duration and easing
- ✓ Calls onComplete callback
- ✓ Skips animation with reduced motion
- ✓ Cancels existing animation before starting new one

#### stagger() Tests
- ✓ Handles empty array
- ✓ Handles null elements
- ✓ Animates multiple elements with delay
- ✓ Works with NodeList

## Requirements Validated

Task 2.1 validates the following requirements:
- **2.1**: Page fade-out before navigation
- **2.2**: Page fade-in after load
- **8.1**: Modal backdrop fade and content scale on open
- **8.2**: Modal scale down and backdrop fade on close
- **12.3**: Image lightbox fade in backdrop and scale up image
- **12.5**: Lightbox scale down image and fade out backdrop
- **16.1**: Disable decorative animations with prefers-reduced-motion
- **16.3**: Use instant transitions when animations disabled
- **17.1**: Reverse horizontal animation direction for RTL

## Implementation Details

### AnimationEngine Class

The AnimationEngine is the core animation controller that:

1. **Detects User Preferences**
   - Checks for `prefers-reduced-motion` media query
   - Detects RTL layout from document direction
   - Listens for changes to motion preferences

2. **Provides Core Animation Methods**
   - `fadeIn()` - Fade in elements with opacity transition
   - `fadeOut()` - Fade out elements and hide them
   - `slide()` - Slide elements in any direction (RTL-aware)
   - `scale()` - Scale elements from one size to another
   - `animate()` - Generic animation with CSS classes

3. **Manages Animation State**
   - Tracks active animations in a Map
   - Cancels conflicting animations automatically
   - Cleans up event listeners after completion

4. **Supports Advanced Features**
   - `stagger()` - Animate multiple elements with delays
   - `cancel()` - Stop animations in progress
   - Promise-based API for chaining

5. **Respects Accessibility**
   - Skips decorative animations when reduced motion is enabled
   - Uses instant transitions for accessibility
   - Maintains functional behavior without animations

### Key Features

- **RTL Support**: Automatically reverses horizontal slide directions for RTL layouts
- **Reduced Motion**: Respects user preferences and provides instant alternatives
- **Promise-based**: All animations return promises for easy chaining
- **Cancellation**: Prevents animation conflicts by canceling existing animations
- **Performance**: Uses CSS transitions for GPU acceleration
- **Error Handling**: Validates inputs and provides clear error messages

## Next Steps

After Task 2.1, the following tasks will add:
- Task 2.2: Property-based tests for Animation Engine
- Task 2.3: Stagger animation method (already implemented)
- Task 2.4: Property tests for animation staggering
