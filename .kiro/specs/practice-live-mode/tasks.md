# Implementation Plan: Practice Live Mode

## Overview

This implementation plan follows a 5-week phased approach to build Practice Live Mode, a persistent self-paced quiz system that combines Live Event Mode's accessibility with Practice Mode's multi-attempt nature. The plan reuses existing Live Event infrastructure while adding new components for practice-specific features like persistent sessions, improvement tracking, and teacher analytics.

## Tasks

- [x] 1. Phase 1: Foundation - Data Models and Service Layer (Week 1)
  - [x] 1.1 Install new dependencies (recharts for analytics)
    - Run `npm install recharts@^2.10.0`
    - Verify installation in package.json
    - _Requirements: Design dependencies section_

  - [x] 1.2 Create TypeScript interfaces for Practice Live Mode
    - Create `src/types/practiceMode.ts` with interfaces: PracticeSession, PracticeSettings, SessionStatistics, PracticeAttempt, AttemptAnswer, LeaderboardEntry, StudentSummary, PracticeAnalytics
    - Export all interfaces for use across components
    - _Requirements: 16.1, 16.2_

  - [x] 1.3 Create practiceService.ts with core functions
    - Create `src/services/practiceService.ts`
    - Implement createPracticeSession() - generates PIN, creates session in Firebase Realtime DB
    - Implement joinPracticeSession() - validates session, saves name to localStorage
    - Implement submitAttempt() - calculates score, stores attempt, updates leaderboard
    - Implement updateLeaderboard() - updates best scores, recalculates ranks
    - Implement calculateImprovement() - computes percentage improvement
    - Reuse functions from liveEventService.ts: generatePIN(), validateNameLength()
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.6, 5.1, 5.2, 5.3, 16.3, 20.4_

  - [ ]* 1.4 Write property tests for practiceService core functions
    - **Property 2: Name length validation** - validates 2-50 character requirement
    - **Property 5: PIN code generation format** - validates 6-digit unique PINs
    - **Property 31: Best score calculation** - validates max score across attempts
    - **Property 35: Improvement percentage calculation** - validates improvement formula
    - **Validates: Requirements 1.2, 3.1, 16.3, 20.4**

  - [x] 1.5 Create localStorage utility functions
    - Create `src/utils/practiceStorage.ts`
    - Implement saveNameToLocalStorage() - stores student name with session key
    - Implement getNameFromLocalStorage() - retrieves student name
    - Implement saveProgressToLocalStorage() - stores quiz progress
    - Implement resumeFromLocalStorage() - retrieves quiz progress
    - Implement clearProgressFromLocalStorage() - clears after submission
    - Handle QuotaExceededError with graceful degradation
    - _Requirements: 1.4, 1.5, 2.1, 2.2, 11.4, 18.1_

  - [ ]* 1.6 Write property tests for localStorage utilities
    - **Property 4: LocalStorage round-trip** - validates save/retrieve consistency
    - **Property 26: Progress auto-save** - validates progress persistence
    - **Validates: Requirements 1.5, 2.1, 2.2, 11.4**

  - [x] 1.7 Update Firebase Realtime Database security rules
    - Add rules for practiceSessions, practiceAttempts, practiceLeaderboard paths
    - Allow public read for sessions and leaderboard
    - Restrict write to authenticated admins for sessions
    - Allow public write for attempts and leaderboard
    - Deploy rules to Firebase
    - _Requirements: 15.5_

  - [x] 1.8 Extend AdminCreateCompetition with Practice Live Mode type
    - Open `src/pages/AdminCreateCompetition.tsx`
    - Add 4th competition type card in Step 0: type='practiceLive', label='Practice Live Mode', description='Persistent practice sessions with unlimited attempts', icon='Target'
    - Add practice-specific settings fields in Step 2: sessionDuration, customEndDate, showLeaderboard, showExplanations, maxQuestions
    - Update competition creation logic to handle 'practiceLive' type
    - Redirect to PracticeTeacherDashboard after creation
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [ ]* 1.9 Write unit tests for AdminCreateCompetition extension
    - Test Practice Live Mode card renders correctly
    - Test practice settings fields validation
    - Test session creation with practice type
    - Test redirect to dashboard after creation
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 2. Checkpoint - Foundation Complete
  - Ensure all tests pass, verify Firebase rules deployed, ask the user if questions arise.

- [x] 3. Phase 2: Core Components - Join and Participant (Week 2)
  - [x] 3.1 Create PracticeJoin component
    - Create `src/pages/PracticeJoin.tsx` adapted from LiveEventJoin.tsx
    - Add QR code scanner with auto-fill PIN
    - Add manual PIN entry (6-digit validation)
    - Add name input with localStorage auto-fill from getNameFromLocalStorage()
    - Validate session exists and is active
    - Save name to localStorage on successful join
    - Remove "event already started" check (sessions always accept joins)
    - Redirect to /practice/quiz/:sessionId on success
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 3.4, 12.2, 12.5_

  - [ ]* 3.2 Write unit tests for PracticeJoin component
    - Test PIN validation (6 digits)
    - Test name validation (2-50 characters)
    - Test localStorage name auto-fill
    - Test session validation
    - Test error messages display
    - _Requirements: 1.2, 1.5, 2.2, 3.1_

  - [x] 3.3 Create PracticeParticipant component
    - Create `src/pages/PracticeParticipant.tsx` adapted from LiveEventParticipant.tsx
    - Display questions one at a time with progress indicator
    - Remove timer display and countdown logic
    - Add answer selection with immediate localStorage save
    - Implement resume from localStorage on page load
    - Add "Previous" and "Next" navigation buttons
    - Add "Submit Quiz" button when all questions answered
    - Call submitAttempt() on submission
    - Redirect to /practice/results/:sessionId/:attemptId on completion
    - _Requirements: 4.2, 4.3, 4.4, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ]* 3.4 Write unit tests for PracticeParticipant component
    - Test question display and navigation
    - Test answer selection saves to localStorage
    - Test resume from localStorage
    - Test submit button enabled when all answered
    - Test no timer display
    - _Requirements: 11.1, 11.4, 11.5, 17.5_

  - [ ]* 3.5 Write property tests for quiz consistency
    - **Property 9: Question consistency across attempts** - validates same questions on retry
    - **Property 27: Independent student progress** - validates students at different questions
    - **Validates: Requirements 4.2, 4.3, 4.4, 12.3**

- [x] 4. Phase 2: Core Components - Results and Leaderboard (Week 3)
  - [x] 4.1 Create PracticeResults component
    - Create `src/pages/PracticeResults.tsx`
    - Fetch attempt data from Firebase Realtime DB
    - Display current score, correct answers count, percentage
    - Display best score comparison with improvement indicator
    - Display current rank on leaderboard
    - Display attempt number
    - Show question-by-question review with correct/incorrect highlighting
    - Display explanations below each question (if enabled)
    - Highlight questions that improved from previous attempts
    - Add score history chart using recharts (line chart)
    - Calculate and display improvement percentage from first attempt
    - Add prominent "Try Again" button that redirects to /practice/quiz/:sessionId
    - Add "View Leaderboard" button
    - _Requirements: 4.1, 4.5, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 20.1, 20.2, 20.3, 20.4, 20.5, 21.1, 21.2, 21.3, 21.4_

  - [ ]* 4.2 Write unit tests for PracticeResults component
    - Test score display
    - Test improvement calculation display
    - Test question review rendering
    - Test "Try Again" button functionality
    - Test score history chart rendering
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 20.1, 20.2, 20.3_

  - [x] 4.3 Create leaderboard calculation logic
    - Implement updateLeaderboard() in practiceService.ts
    - Sort by bestScore descending, then attemptCount ascending, then firstAttemptDate ascending
    - Recalculate ranks for all entries
    - Update Firebase Realtime DB at practiceLeaderboard/{sessionId}
    - Ensure updates complete within 2 seconds
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 16.4, 24.1, 24.2_

  - [ ]* 4.4 Write property tests for leaderboard logic
    - **Property 11: Leaderboard required fields** - validates name, bestScore, attemptCount present
    - **Property 12: Leaderboard primary sort** - validates descending score order
    - **Property 13: Leaderboard tie-breaking** - validates attempt count tie-breaker
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 4.5 Implement real-time leaderboard updates
    - Add Firebase Realtime DB listeners in PracticeResults component
    - Display visual indicator when leaderboard updates
    - Highlight current student's entry
    - Display timestamp of last update
    - Ensure updates reflect within 2 seconds
    - _Requirements: 5.5, 24.1, 24.2, 24.3, 24.4, 24.5_

  - [ ]* 4.6 Write integration tests for attempt submission flow
    - Test complete flow: answer questions → submit → leaderboard updates
    - Test multiple attempts update best score correctly
    - Test leaderboard ranking after multiple students
    - _Requirements: 4.6, 5.5, 16.4, 24.1_

- [x] 5. Checkpoint - Core Components Complete
  - Ensure all tests pass, verify join/quiz/results flow works end-to-end, ask the user if questions arise.

- [x] 6. Phase 3: Teacher Dashboard - Session Monitoring (Week 4)
  - [x] 6.1 Create PracticeTeacherDashboard component structure
    - Create `src/pages/PracticeTeacherDashboard.tsx`
    - Set up Firebase Realtime DB listeners for session, attempts, leaderboard
    - Create state management for DashboardState interface
    - Add loading and error states
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.2 Implement session info section
    - Display session title and description
    - Display PIN code with copy button
    - Display QR code using qrcode.react
    - Add "Download QR Code" button (PNG export)
    - Display session status (active/ended)
    - Add "End Session" button with confirmation dialog
    - _Requirements: 3.2, 3.6, 7.6, 10.2_

  - [x] 6.3 Implement real-time statistics section
    - Display total students count (unique names)
    - Display total attempts count
    - Display average score across all attempts
    - Display average attempts per student
    - Update in real-time using Firebase listeners
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4_

  - [x] 6.4 Implement live leaderboard section
    - Display top 20 students with name, best score, attempts
    - Update in real-time using Firebase listeners
    - Add pagination for viewing all students
    - Display rank, name, best score, attempt count columns
    - _Requirements: 5.7, 7.3, 7.5_

  - [ ]* 6.5 Write unit tests for PracticeTeacherDashboard
    - Test session info displays correctly
    - Test statistics calculations
    - Test leaderboard rendering
    - Test real-time updates
    - Test "End Session" functionality
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

- [ ] 7. Phase 3: Teacher Dashboard - Analytics and Reports (Week 4)
  - [ ] 7.1 Implement practice analytics calculations
    - Create calculatePracticeAnalytics() in practiceService.ts
    - Calculate score distribution (0-20, 21-40, 41-60, 61-80, 81-100 ranges)
    - Calculate improvement rate (average score increase from first to best)
    - Identify most missed questions (highest miss rate)
    - Calculate peak usage times (hour of day histogram)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 7.2 Create analytics charts section
    - Add score distribution histogram using recharts (BarChart)
    - Add improvement trend line chart using recharts (LineChart)
    - Add attempt count distribution using recharts (BarChart)
    - Add most missed questions table
    - Display all charts in responsive grid layout
    - _Requirements: 8.5, 8.6, 8.7_

  - [ ]* 7.3 Write property tests for analytics calculations
    - **Property 18: Practice analytics calculation** - validates all metrics computed correctly
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.7**

  - [ ] 7.4 Implement CSV export functionality
    - Create generateCSV() function in practiceService.ts
    - Include columns: Student Name, Best Score, Attempts, First Attempt Date, Last Attempt Date, Improvement %
    - Format dates as readable strings
    - Include session title and export date in filename
    - Trigger browser download on button click
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ] 7.5 Implement PDF export functionality
    - Create generatePDF() function using jspdf and jspdf-autotable
    - Include session title, date range, QR code image
    - Include leaderboard table (top 20 students)
    - Include analytics summary (total students, attempts, avg score, improvement rate)
    - Include score distribution chart as image
    - Format for readability with proper spacing and headers
    - Trigger browser download on button click
    - _Requirements: 9.3, 9.4, 9.6_

  - [ ]* 7.6 Write property tests for report generation
    - **Property 19: CSV export completeness** - validates all required columns present
    - **Property 20: PDF export completeness** - validates all required sections present
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.6**

  - [ ] 7.7 Add download buttons to dashboard
    - Add "Download CSV" button in dashboard header
    - Add "Download PDF" button in dashboard header
    - Show loading indicator during report generation
    - Display success message after download
    - Handle errors gracefully with user-friendly messages
    - _Requirements: 7.7, 9.1, 9.3_

- [ ] 8. Checkpoint - Teacher Dashboard Complete
  - Ensure all tests pass, verify analytics calculations correct, test CSV/PDF downloads, ask the user if questions arise.

- [ ] 9. Phase 4: Network Resilience and Session Management (Week 5)
  - [ ] 9.1 Implement network resilience for attempt submission
    - Add offline detection in PracticeParticipant component
    - Queue attempt submission to localStorage when offline
    - Add reconnection listener
    - Auto-submit queued attempts on reconnection
    - Display reconnection indicator during network interruptions
    - Implement exponential backoff retry (1s, 2s, 4s, 8s)
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ]* 9.2 Write integration tests for network resilience
    - Test progress saves during offline mode
    - Test queued submission on reconnection
    - Test retry with exponential backoff
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ] 9.3 Implement session lifecycle management
    - Add session status validation in joinPracticeSession()
    - Prevent joins when status is 'ended'
    - Implement endPracticeSession() function
    - Archive session data to Firestore on end
    - Update session status to 'ended' in Realtime DB
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 22.1_

  - [ ] 9.4 Implement data retention and archival
    - Create archivePracticeSession() function
    - Copy all session, attempts, leaderboard data to Firestore
    - Add 30-day expiration timestamp
    - Create Cloud Function to delete expired archives (or manual cleanup script)
    - Ensure guest names not stored in permanent user collections
    - _Requirements: 10.5, 22.1, 22.2, 22.3, 22.4_

  - [ ] 9.5 Implement concurrent session limit
    - Add validation in createPracticeSession() to check active session count
    - Query Firebase for teacher's active sessions
    - Reject creation if count >= 5
    - Display error message with suggestion to end inactive sessions
    - Add auto-inactive marking after 30 days of no attempts
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [ ]* 9.6 Write unit tests for session management
    - Test session status validation
    - Test concurrent session limit enforcement
    - Test archival data structure
    - Test guest data isolation
    - _Requirements: 10.2, 10.3, 22.4, 23.1, 23.2_

- [ ] 10. Phase 4: Mobile Optimization and Polish (Week 5)
  - [ ] 10.1 Optimize mobile responsiveness
    - Test all components on screen widths 320px-768px
    - Ensure no horizontal scrolling
    - Verify touch targets minimum 44px x 44px
    - Test on iOS Safari and Android Chrome
    - Add viewport meta tag to prevent accidental zooming
    - _Requirements: 6.5, 15.1, 17.1, 17.2, 17.3, 17.4_

  - [ ]* 10.2 Write property tests for mobile UI constraints
    - **Property 15: Mobile responsive range** - validates no horizontal scroll 320-768px
    - **Property 16: Touch target minimum size** - validates 44px minimum
    - **Validates: Requirements 6.5, 17.1, 17.2, 17.4**

  - [ ] 10.3 Add loading states and animations
    - Add skeleton loaders for dashboard statistics
    - Add loading spinner for quiz submission
    - Add fade-in animations for results display
    - Add smooth transitions for leaderboard updates
    - Add progress bar for quiz completion
    - _Requirements: UI/UX polish_

  - [ ] 10.4 Implement error handling and user feedback
    - Add error boundaries for all major components
    - Display user-friendly error messages for network failures
    - Add retry buttons for failed operations
    - Add success toasts for completed actions
    - Log errors to console for debugging
    - _Requirements: Error handling section_

  - [ ] 10.5 Add data validation and sanitization
    - Validate all user inputs (name, PIN, answers)
    - Sanitize student names before storage
    - Validate session configuration before creation
    - Add schema validation for localStorage data
    - Handle corrupted localStorage data gracefully
    - _Requirements: 1.2, 3.1, 19.3, 34_

  - [ ]* 10.6 Write property tests for data validation
    - **Property 1: Guest session creation** - validates no email/phone required
    - **Property 3: Duplicate names allowed** - validates multiple students same name
    - **Property 34: Session configuration validation** - validates maxQuestions 1-50
    - **Property 37: Guest data isolation** - validates no permanent user collection writes
    - **Validates: Requirements 1.1, 1.3, 19.3, 22.4**

- [x] 11. Phase 4: Routing and Integration (Week 5)
  - [x] 11.1 Add new routes to App.tsx
    - Add route: /admin/practice/create → AdminCreateCompetition (with practice mode)
    - Add route: /admin/practice/dashboard/:sessionId → PracticeTeacherDashboard
    - Add route: /practice/join → PracticeJoin
    - Add route: /practice/quiz/:sessionId → PracticeParticipant
    - Add route: /practice/results/:sessionId/:attemptId → PracticeResults
    - Add protected route guards for admin routes
    - _Requirements: Routing configuration section_

  - [ ] 11.2 Update navigation and links
    - Add "Practice Live Mode" option to admin navigation menu
    - Add link to create practice session from admin dashboard
    - Update competition list to show practice sessions separately
    - Add breadcrumb navigation to dashboard
    - _Requirements: Integration with existing system_

  - [ ] 11.3 Test complete user flows end-to-end
    - Test teacher flow: create session → view dashboard → download reports → end session
    - Test student flow: join via QR → complete quiz → view results → try again → view improved score
    - Test multi-student flow: 3 students join → complete attempts → verify leaderboard rankings
    - Test persistence flow: student starts quiz → closes browser → reopens → resumes → completes
    - _Requirements: End-to-end testing section_

  - [ ]* 11.4 Write integration tests for complete flows
    - Test teacher creates session and student joins
    - Test student completes multiple attempts
    - Test leaderboard updates with multiple students
    - Test localStorage persistence across page reloads
    - _Requirements: Integration tests section_

- [ ] 12. Phase 4: Quiz Data Serialization and Final Testing (Week 5)
  - [ ] 12.1 Implement quiz data serialization utilities
    - Create serializeQuizData() function
    - Create parseQuizData() function with validation
    - Create prettyPrintQuiz() function for reports
    - Validate required fields: question, options, correctAnswer
    - Handle parsing errors gracefully
    - _Requirements: 25.1, 25.2, 25.3, 25.4_

  - [ ]* 12.2 Write property tests for serialization
    - **Property 40: Quiz data serialization round-trip** - validates parse→serialize→parse equivalence
    - **Validates: Requirements 25.1, 25.2, 25.3, 25.5**

  - [ ] 12.3 Run comprehensive test suite
    - Run all unit tests (target 90%+ coverage)
    - Run all property-based tests (100+ iterations each)
    - Run all integration tests
    - Run end-to-end tests for all user flows
    - Fix any failing tests
    - _Requirements: Testing strategy section_

  - [ ] 12.4 Perform accessibility audit
    - Run axe-core accessibility checks on all components
    - Run Lighthouse accessibility audit
    - Verify color contrast ratios meet WCAG AA standards
    - Test keyboard navigation on all interactive elements
    - Test screen reader compatibility on results screen
    - _Requirements: Accessibility testing section_

  - [ ] 12.5 Perform performance testing
    - Test with 100 concurrent students in single session
    - Test with 50 students each completing 10 attempts
    - Measure leaderboard update latency (target < 2 seconds)
    - Measure localStorage read/write performance
    - Test rapid attempt submissions (10 students within 1 second)
    - Monitor memory usage and database connection count
    - _Requirements: Performance testing section_

- [ ] 13. Final Checkpoint - Complete Feature Verification
  - Ensure all tests pass, verify all 25 requirements met, test on multiple devices, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations
- All components reuse existing Live Event infrastructure where possible
- Firebase Realtime Database used for real-time synchronization
- LocalStorage used for guest session persistence and offline resilience
- Recharts library used for analytics visualizations
- Implementation follows 5-week phased approach: Foundation → Core Components → Analytics → Polish
- Checkpoints ensure incremental validation and user feedback opportunities
