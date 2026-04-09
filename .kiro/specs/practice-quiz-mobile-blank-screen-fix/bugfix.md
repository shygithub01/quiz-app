# Bugfix Requirements Document

## Introduction

When taking the Practice Live Quiz on mobile devices, after answering a few questions, the screen goes completely blank showing only the purple/pink gradient background. All quiz content (header, question card, answer options, navigation buttons, question navigator) disappears, blocking users from completing quizzes on mobile devices.

The root cause is conflicting background gradients and z-index layering between the global App.tsx background (fixed positioning with animated elements) and the PracticeParticipant.tsx page-level background gradient. The fixed global background layers are covering the quiz content on mobile viewports.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user takes the Practice Live Quiz on a mobile device and answers a few questions THEN the screen shows only the purple/pink gradient background with all quiz content (header, question card, answer options, navigation buttons, question navigator) becoming invisible

1.2 WHEN the PracticeParticipant page renders on mobile devices THEN the page's `bg-gradient-to-br from-purple-50 to-indigo-100` background conflicts with the global App.tsx fixed background gradient (`fixed inset-0` with multiple radial overlays and animated elements)

1.3 WHEN content is rendered within the PracticeParticipant page THEN the z-index layering causes the fixed global background to cover the quiz content on smaller mobile viewports

### Expected Behavior (Correct)

2.1 WHEN a user takes the Practice Live Quiz on a mobile device and answers questions THEN all quiz content (header, question card, answer options, navigation buttons, question navigator) SHALL remain visible and interactive throughout the entire quiz session

2.2 WHEN the PracticeParticipant page renders on mobile devices THEN the page SHALL NOT apply its own background gradient that conflicts with the global App.tsx background

2.3 WHEN content is rendered within the PracticeParticipant page THEN the content SHALL have proper z-index values to ensure it appears above the global fixed background on all viewport sizes

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user takes the Practice Live Quiz on desktop devices THEN the system SHALL CONTINUE TO display all quiz content correctly with the existing visual styling

3.2 WHEN the PracticeParticipant page renders the loading state THEN the system SHALL CONTINUE TO show the loading spinner with the Target icon and "Loading practice session..." message

3.3 WHEN the PracticeParticipant page renders the resume prompt dialog THEN the system SHALL CONTINUE TO display the dialog correctly with "Resume Progress?" options

3.4 WHEN a user interacts with quiz navigation (Previous/Next buttons, question navigator) THEN the system SHALL CONTINUE TO function correctly with proper state management

3.5 WHEN a user selects answers and submits the quiz THEN the system SHALL CONTINUE TO save progress to localStorage and submit attempts correctly

3.6 WHEN other pages in the application render THEN the system SHALL CONTINUE TO display correctly with the global App.tsx background gradient
