# Practice Quiz Mobile Blank Screen Fix - Bugfix Design

## Overview

This bugfix addresses a critical mobile rendering issue where quiz content becomes invisible after answering a few questions on mobile devices. The root cause is a z-index layering conflict between the global fixed background gradient in App.tsx (with animated elements at `fixed inset-0`) and the page-level background gradient in PracticeParticipant.tsx. On mobile viewports, the fixed global background layers cover the quiz content, making it invisible while still showing the purple/pink gradient background.

The fix involves removing the conflicting page-level background gradient from PracticeParticipant.tsx and ensuring proper z-index values for content to appear above the global fixed background on all viewport sizes.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when quiz content becomes invisible on mobile devices due to z-index layering conflicts
- **Property (P)**: The desired behavior - all quiz content remains visible and interactive on mobile devices throughout the quiz session
- **Preservation**: Existing desktop functionality, loading states, resume prompts, navigation, and submission logic that must remain unchanged
- **PracticeParticipant**: The React component in `src/pages/PracticeParticipant.tsx` that renders the self-paced quiz interface for students
- **Global Background**: The fixed background gradient system in `src/App.tsx` with `fixed inset-0` positioning and multiple animated radial overlay elements
- **Z-index Layering**: The stacking order of visual elements where higher z-index values appear above lower values

## Bug Details

### Bug Condition

The bug manifests when a user takes the Practice Live Quiz on a mobile device. After answering a few questions, all quiz content (header, question card, answer options, navigation buttons, question navigator) becomes invisible, showing only the purple/pink gradient background. The content is still present in the DOM but is visually covered by the global fixed background layers.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { viewport: ViewportSize, page: string, userInteraction: string }
  OUTPUT: boolean
  
  RETURN input.viewport.width <= 768
         AND input.page === 'PracticeParticipant'
         AND input.userInteraction === 'answering questions'
         AND quizContentIsInvisible()
         AND globalBackgroundIsVisible()
END FUNCTION
```

### Examples

- **Mobile iPhone 12 (390px width)**: User opens practice quiz, answers 2-3 questions, screen shows only gradient background with no visible content
- **Mobile Samsung Galaxy S21 (360px width)**: User navigates through questions, after scrolling content disappears leaving only the purple/pink gradient
- **Tablet iPad Mini (768px width)**: User takes quiz, content becomes invisible intermittently when scrolling or navigating
- **Desktop (1920px width)**: Quiz displays correctly with all content visible throughout the session (no bug)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Desktop quiz display must continue to work correctly with existing visual styling
- Loading state with Target icon spinner and "Loading practice session..." message must remain unchanged
- Resume prompt dialog with "Resume Progress?" options must display correctly
- Quiz navigation (Previous/Next buttons, question navigator) must function correctly with proper state management
- Answer selection and submission logic must continue to save progress to localStorage and submit attempts correctly
- All other pages in the application must continue to display correctly with the global App.tsx background gradient

**Scope:**
All inputs that do NOT involve mobile viewport rendering of the PracticeParticipant page should be completely unaffected by this fix. This includes:
- Desktop browser usage (viewport width > 768px)
- Other pages in the application (Home, Competitions, Admin pages, etc.)
- Loading and error states
- Navigation and routing behavior

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Conflicting Background Gradients**: The PracticeParticipant component applies its own `bg-gradient-to-br from-purple-50 to-indigo-100` background gradient on the root div, which conflicts with the global App.tsx fixed background gradient that uses `fixed inset-0` positioning with multiple radial overlays and animated elements.

2. **Z-index Layering Problem**: The global background in App.tsx is positioned with `fixed inset-0` and contains animated elements, but the main content wrapper only has `relative z-10`. On mobile viewports, this z-index value may be insufficient to ensure content appears above all the fixed background layers.

3. **Mobile Viewport Rendering**: The issue manifests specifically on mobile devices, suggesting that the stacking context behaves differently on smaller viewports, possibly due to how mobile browsers handle fixed positioning and z-index layering.

4. **Duplicate Background Styling**: Having two background gradient systems (global fixed + page-level) creates unnecessary complexity and increases the likelihood of rendering conflicts, especially on mobile devices with different rendering engines.

## Correctness Properties

Property 1: Bug Condition - Mobile Quiz Content Visibility

_For any_ mobile viewport (width <= 768px) where a user is taking the Practice Live Quiz and interacting with questions, the fixed PracticeParticipant component SHALL ensure all quiz content (header, question card, answer options, navigation buttons, question navigator) remains visible and interactive throughout the entire quiz session, appearing above the global fixed background.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Desktop and Other Page Behavior

_For any_ viewport size on desktop (width > 768px) OR any page that is NOT PracticeParticipant, the fixed code SHALL produce exactly the same visual behavior as the original code, preserving all existing functionality for desktop quiz display, loading states, resume prompts, navigation, submission logic, and other application pages.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/PracticeParticipant.tsx`

**Component**: `PracticeParticipant`

**Specific Changes**:

1. **Remove Page-Level Background Gradient**: Remove the `bg-gradient-to-br from-purple-50 to-indigo-100` class from the root div element (line ~220) to eliminate the conflicting background gradient. The global App.tsx background will provide the visual styling.

2. **Remove Loading State Background**: Remove the `bg-gradient-to-br from-purple-50 to-indigo-100` class from the loading state div (line ~200) to maintain consistency with the global background.

3. **Remove Resume Prompt Background**: Remove the `bg-gradient-to-br from-purple-50 to-indigo-100` class from the resume prompt div (line ~230) to maintain consistency with the global background.

4. **Ensure Proper Z-index**: Verify that all content containers have appropriate z-index values to appear above the global fixed background. The main content wrapper should maintain or increase its z-index value if needed.

5. **Test Mobile Rendering**: After removing the conflicting backgrounds, test on actual mobile devices (iOS Safari, Chrome Android) to verify content visibility throughout the quiz session.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code using mobile device testing, then verify the fix works correctly and preserves existing behavior across all viewport sizes.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis by testing on actual mobile devices and mobile browser emulators.

**Test Plan**: Use browser DevTools mobile emulation and actual mobile devices to simulate the quiz-taking experience. Run these tests on the UNFIXED code to observe the blank screen issue and understand the exact conditions that trigger it.

**Test Cases**:
1. **iPhone 12 Emulation (390px)**: Open practice quiz, answer 3-4 questions, observe if content becomes invisible (will fail on unfixed code)
2. **Samsung Galaxy S21 Emulation (360px)**: Navigate through questions using Next button, observe if content disappears after scrolling (will fail on unfixed code)
3. **iPad Mini Emulation (768px)**: Take full quiz, observe if content visibility is intermittent (may fail on unfixed code)
4. **Actual iOS Device Test**: Use real iPhone to take quiz, observe blank screen issue in Safari (will fail on unfixed code)
5. **Actual Android Device Test**: Use real Android phone to take quiz, observe blank screen issue in Chrome (will fail on unfixed code)

**Expected Counterexamples**:
- Quiz content becomes invisible after answering 2-3 questions on mobile viewports
- Only the purple/pink gradient background is visible, no quiz elements
- Possible causes: z-index layering conflict, conflicting background gradients, mobile-specific rendering behavior

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (mobile viewports taking quiz), the fixed component produces the expected behavior (visible content).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := PracticeParticipant_fixed(input)
  ASSERT allQuizContentVisible(result)
  ASSERT contentAboveBackground(result)
  ASSERT userCanInteractWithQuiz(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (desktop viewports, other pages), the fixed component produces the same result as the original component.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT PracticeParticipant_original(input) = PracticeParticipant_fixed(input)
END FOR
```

**Testing Approach**: Manual testing is recommended for this visual rendering bug because:
- The bug is viewport-specific and requires visual inspection on actual devices
- Z-index and background rendering behavior varies across browsers and devices
- Property-based testing would require complex visual regression testing infrastructure
- Manual testing with real devices provides the most reliable validation

**Test Plan**: Observe behavior on UNFIXED code first for desktop and other pages, then apply fix and verify these behaviors remain unchanged while mobile rendering is corrected.

**Test Cases**:
1. **Desktop Quiz Display (1920px)**: Verify quiz displays correctly with all styling intact after fix
2. **Loading State Preservation**: Verify loading spinner and message display correctly on all viewports
3. **Resume Prompt Preservation**: Verify resume dialog displays correctly on all viewports
4. **Navigation Preservation**: Verify Previous/Next buttons and question navigator work correctly
5. **Submission Preservation**: Verify answer selection, localStorage saving, and quiz submission work correctly
6. **Other Pages Preservation**: Verify Home, Competitions, Admin pages display correctly with global background

### Unit Tests

- Test that PracticeParticipant component renders without background gradient classes
- Test that loading state renders without conflicting background
- Test that resume prompt renders without conflicting background
- Test that content containers have appropriate z-index values

### Property-Based Tests

Not applicable for this visual rendering bug. Manual testing on actual devices is more appropriate.

### Integration Tests

- Test full quiz flow on mobile emulator (iPhone 12, 390px width)
- Test full quiz flow on mobile emulator (Samsung Galaxy S21, 360px width)
- Test full quiz flow on tablet emulator (iPad Mini, 768px width)
- Test full quiz flow on desktop browser (1920px width)
- Test on actual iOS device (Safari browser)
- Test on actual Android device (Chrome browser)
- Verify content remains visible throughout entire quiz session on all mobile devices
- Verify desktop experience remains unchanged
- Verify other pages in application display correctly
