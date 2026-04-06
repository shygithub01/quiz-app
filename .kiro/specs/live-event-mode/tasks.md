# Implementation Plan: Live Event Mode

## Overview

This plan implements a real-time quiz competition system for in-person cultural events. The system enables guest participation without registration, uses QR codes and PIN codes for easy joining, and provides a dual-screen experience (projector + mobile) optimized for both elderly attendees and mobile users. Implementation follows a phased approach with testing and git backups after each major milestone.

## Tasks

- [ ] 1. Phase 1: Foundation (Database, Types, Basic Setup)
  - [x] 1.1 Set up Firebase Realtime Database
    - Enable Firebase Realtime Database in Firebase Console
    - Add Realtime Database URL to environment variables (VITE_FIREBASE_DATABASE_URL)
    - Configure security rules for liveEvents, eventParticipants, eventAnswers, eventLeaderboard
    - Test database connection and basic read/write operations
    - _Requirements: 13.1_
  
  - [x] 1.2 Create TypeScript interfaces and data models
    - Create src/types/liveEvent.ts with LiveEvent, LiveEventSettings, GuestParticipant, ParticipantAnswer, LeaderboardEntry interfaces
    - Add isLiveEvent and liveEventSettings fields to Competition interface
    - Create LiveEventArchive interface for Firestore collection
    - _Requirements: 1.1, 1.2, 1.3, 12.6_
  
  - [x] 1.3 Create database service layer
    - Create src/services/liveEventService.ts with helper functions for CRUD operations
    - Implement PIN generation (6-digit unique code)
    - Implement session ID generation
    - Implement event ID generation
    - Add validation utilities (name length, PIN format, timer duration)
    - _Requirements: 2.1, 1.2, 7.1_
  
  - [ ]* 1.4 Write unit tests for validation utilities
    - Test name length validation (2-50 characters)
    - Test PIN format validation (6 digits)
    - Test timer duration validation (15-120 seconds)
    - Test participant count validation (1-100)
    - _Requirements: 1.2, 2.1, 7.1, 20.4_
  
  - [x] 1.5 Install required NPM packages
    - Install qrcode.react for QR code generation
    - Install jspdf and jspdf-autotable for PDF export
    - Install fast-check for property-based testing (dev dependency)
    - Update package.json and run npm install
    - _Requirements: 2.2, 11.6_
  
  - [x] 1.6 Git backup: Phase 1 complete
    - Create git commit with message "Phase 1: Foundation complete - Database, types, and services"
    - Tag as "live-event-phase-1"
    - _Requirements: N/A_

- [ ] 2. Phase 2: Admin & Host Components
  - [x] 2.1 Extend AdminCreateCompetition with Live Event Mode toggle
    - Add "Enable Live Event Mode" toggle switch to competition creation form
    - Add live event settings panel (maxParticipants, questionTimer, enableFastestFingerBonus, autoAdvanceOnTimer)
    - Add validation for live event settings
    - Update competition creation logic to save liveEventSettings
    - _Requirements: 12.5, 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [x] 2.2 Create LiveEventHost component
    - Create src/pages/LiveEventHost.tsx with host control panel
    - Implement event creation flow (select competition, generate PIN, create event in Realtime DB)
    - Display event details (PIN, QR code, participant count)
    - Implement participant list view with real-time updates
    - Add control buttons (Start Event, Pause, Resume, Next Question, Extend Timer, End Event)
    - Implement single active event constraint check
    - _Requirements: 4.4, 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2_
  
  - [x] 2.3 Implement host control actions
    - Implement startEvent() - transition to countdown phase
    - Implement pauseEvent() - freeze timer
    - Implement resumeEvent() - continue timer
    - Implement nextQuestion() - manually advance
    - Implement extendTimer() - add time to current question
    - Implement endEvent() - transition to results and trigger cleanup
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 2.4 Write unit tests for host control actions
    - Test event creation with valid/invalid settings
    - Test single active event constraint
    - Test pause/resume timer logic
    - Test manual question advance
    - Test timer extension
    - Test early event termination
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 15.1_
  
  - [x] 2.5 Add Live Event routes to App.tsx
    - Add route /admin/live-event/create → LiveEventHost
    - Add route /live-event/projector/:eventId → LiveEventProjector (placeholder)
    - Add route /live-event/join → LiveEventJoin (placeholder)
    - Add route /live-event/participate/:eventId/:sessionId → LiveEventParticipant (placeholder)
    - Add route /live-event/results/:eventId → LiveEventResults (placeholder)
    - _Requirements: N/A_
  
  - [x] 2.6 Git backup: Phase 2 complete
    - Create git commit with message "Phase 2: Admin & Host components complete"
    - Tag as "live-event-phase-2"
    - _Requirements: N/A_

- [ ] 3. Phase 3: Projector View
  - [x] 3.1 Create LiveEventProjector component structure
    - Create src/pages/LiveEventProjector.tsx
    - Set up Realtime DB listeners for event state, participants, answers, leaderboard
    - Implement phase-based rendering (lobby, countdown, question, leaderboard, results)
    - Apply accessibility styling (minimum 24px font, high contrast, sans-serif)
    - _Requirements: 3.1, 3.2, 18.1, 18.2_
  
  - [x] 3.2 Implement Lobby Phase UI
    - Display large QR code (centered, 256px size)
    - Display PIN code with 72px font
    - Display participant list with scrolling
    - Display participant counter in "X/Y joined" format
    - Update participant list in real-time (< 1 second)
    - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.3_
  
  - [x] 3.3 Implement Countdown Phase UI
    - Display "3-2-1-GO" animation with 200px font
    - Each number displays for exactly 1 second
    - Full-screen countdown with smooth transitions
    - Synchronize with Realtime DB countdown state
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 3.4 Implement Question Phase UI
    - Display question text with minimum 32px font
    - Display question number in "Question X of Y" format
    - Display timer with minimum 48px font
    - Change timer to red when < 10 seconds remaining
    - Display "Answered: X/Y" counter
    - Update counter in real-time as participants answer
    - _Requirements: 6.2, 6.6, 7.3, 7.4, 18.3_
  
  - [x] 3.5 Implement Leaderboard Phase UI
    - Display top 5 participants with name, score, and rank
    - Implement animated rank changes with 3-5 second duration
    - Display score updates with smooth transitions
    - Use color-blind friendly indicators
    - _Requirements: 8.1, 8.2, 8.5, 18.4_
  
  - [x] 3.6 Implement Results Phase UI
    - Display winner announcement with confetti animation
    - Display top 3 podium visualization
    - Display full scrollable leaderboard with minimum 36px font
    - Show all questions with correct answers
    - _Requirements: 10.3, 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 3.7 Write unit tests for Projector component
    - Test phase rendering (lobby, countdown, question, leaderboard, results)
    - Test font size requirements (24px minimum, 32px questions, 48px timer)
    - Test timer color change at 10 seconds
    - Test participant counter format
    - Test leaderboard top 5 filtering
    - _Requirements: 3.1, 6.2, 7.3, 7.4, 8.1_
  
  - [-] 3.8 Git backup: Phase 3 complete
    - Create git commit with message "Phase 3: Projector view complete"
    - Tag as "live-event-phase-3"
    - _Requirements: N/A_

- [ ] 4. Phase 4: Participant Components
  - [ ] 4.1 Create LiveEventJoin component
    - Create src/pages/LiveEventJoin.tsx
    - Implement PIN entry form (6-digit input with validation)
    - Implement guest name input (2-50 characters with validation)
    - Check for duplicate names in real-time
    - Validate event exists and is in lobby phase
    - Display appropriate error messages (invalid PIN, duplicate name, event full, event started)
    - Redirect to participant view on successful join
    - _Requirements: 1.2, 1.3, 2.5, 2.6_
  
  - [ ] 4.2 Implement QR code scanning support
    - Parse URL parameters for pre-filled PIN from QR code
    - Auto-fill PIN field when coming from QR code
    - Test QR code flow end-to-end
    - _Requirements: 2.4_
  
  - [ ] 4.3 Create LiveEventParticipant component
    - Create src/pages/LiveEventParticipant.tsx
    - Set up Realtime DB listeners for event state and leaderboard
    - Implement session management (store sessionId in localStorage)
    - Implement heartbeat mechanism (update lastSeen every 30 seconds)
    - Display personal score and rank
    - _Requirements: 8.6, 13.6_
  
  - [ ] 4.4 Implement participant question display
    - Display question text (mobile-responsive)
    - Display answer options as buttons (minimum 44px touch target)
    - Prevent accidental zoom on mobile
    - Display timer countdown
    - Disable answer buttons after selection
    - Prevent answer changes after initial selection
    - _Requirements: 3.3, 3.4, 6.4, 6.5, 17.2, 17.3_
  
  - [ ] 4.5 Implement answer submission logic
    - Record answer selection with timestamp
    - Calculate timeToAnswer from question start
    - Submit answer to Realtime DB
    - Validate submission is within timer duration
    - Display confirmation after submission
    - _Requirements: 6.4, 7.5_
  
  - [ ] 4.6 Implement mobile responsiveness
    - Ensure layout works on 320px to 768px width screens
    - Test touch targets (minimum 44px)
    - Prevent horizontal scrolling
    - Handle orientation changes within 500ms
    - _Requirements: 17.1, 17.2, 17.4, 17.5_
  
  - [ ]* 4.7 Write unit tests for participant components
    - Test PIN validation and error messages
    - Test name validation (length, uniqueness)
    - Test answer submission and immutability
    - Test timer expiry validation
    - Test mobile responsive breakpoints
    - _Requirements: 1.2, 1.3, 2.5, 2.6, 6.5, 7.5_
  
  - [ ] 4.8 Git backup: Phase 4 complete
    - Create git commit with message "Phase 4: Participant components complete"
    - Tag as "live-event-phase-4"
    - _Requirements: N/A_

- [ ] 5. Phase 5: Real-Time Sync & Testing
  - [ ] 5.1 Implement scoring algorithm
    - Create calculateScore() function in liveEventService.ts
    - Award 100 points for correct answers
    - Award 0 points for incorrect answers
    - Calculate fastest finger bonus (50, 30, 10 for top 3 correct answers)
    - Ensure bonus only applies to correct answers
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ] 5.2 Implement leaderboard calculation
    - Create calculateLeaderboard() function
    - Sort by score (descending), then by total time (ascending) for ties
    - Calculate ranks (1, 2, 3, etc.)
    - Update leaderboard in Realtime DB after each question
    - Ensure updates complete within 2 seconds
    - _Requirements: 8.2, 8.3, 9.7_
  
  - [ ] 5.3 Implement timer synchronization
    - Use server timestamp as source of truth
    - Implement getRemainingTime() with pause support
    - Sync timer every 5 seconds to prevent drift
    - Handle pause/resume with accumulated pause time
    - Implement auto-advance after timer expiry (3 second delay)
    - _Requirements: 7.2, 7.6, 14.1, 14.2_
  
  - [ ] 5.4 Implement network resilience
    - Display reconnection indicator on connection loss
    - Queue answer submissions during network interruptions
    - Submit queued answers on reconnection if within time limit
    - Restore session state on reconnection within 60 seconds
    - Mark participant as inactive after 60 seconds of no heartbeat
    - _Requirements: 13.5, 13.6, 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [ ]* 5.5 Write property-based tests for scoring
    - **Property 29: Correct answer scoring** - Verify 100 points awarded for correct answers
    - **Property 30: Incorrect answer scoring** - Verify 0 points for incorrect answers
    - **Property 31: Fastest finger bonus distribution** - Verify 50/30/10 bonus for top 3 correct
    - **Property 32: Bonus only for correct answers** - Verify no bonus for incorrect answers
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 5.6 Write property-based tests for validation
    - **Property 2: Name length validation** - Verify 2-50 character requirement
    - **Property 20: Timer duration configuration** - Verify 15-120 second range
    - **Property 7: PIN validation** - Verify 6-digit format and event existence check
    - _Requirements: 1.2, 7.1, 2.5, 2.6_
  
  - [ ]* 5.7 Write integration tests for real-time sync
    - Test participant join updates projector within 1 second
    - Test answer submission updates counter within 1 second
    - Test host control actions sync to all views within 1 second
    - Test leaderboard updates within 2 seconds after question
    - Test countdown synchronization across all views
    - _Requirements: 4.2, 6.6, 8.2, 13.3, 13.4, 14.6_
  
  - [ ] 5.8 Checkpoint - Ensure all tests pass
    - Run all unit tests and property-based tests
    - Verify real-time synchronization performance
    - Test with 10-20 simulated participants
    - Ask the user if questions arise
    - _Requirements: N/A_
  
  - [ ] 5.9 Git backup: Phase 5 complete
    - Create git commit with message "Phase 5: Real-time sync and testing complete"
    - Tag as "live-event-phase-5"
    - _Requirements: N/A_

- [ ] 6. Phase 6: Results & Export
  - [ ] 6.1 Create LiveEventResults component
    - Create src/pages/LiveEventResults.tsx
    - Display final leaderboard with all participants
    - Show per-question breakdown for each participant
    - Highlight correct answers in green, incorrect in red
    - Display participant's selected answers
    - Make results accessible to both host and participants
    - _Requirements: 10.3, 10.4, 10.5, 11.4_
  
  - [ ] 6.2 Implement CSV export functionality
    - Create exportToCSV() function in liveEventService.ts
    - Include columns: Rank, Name, Score, Correct Answers, Fastest Finger Bonus
    - Add per-question performance columns
    - Trigger download on host action
    - _Requirements: 11.5, 11.7_
  
  - [ ] 6.3 Implement PDF export functionality
    - Create exportToPDF() function using jspdf and jspdf-autotable
    - Include event details (title, date, participant count)
    - Create table with participant results
    - Format for readability and printing
    - Trigger download on host action
    - _Requirements: 11.6, 11.7_
  
  - [ ] 6.4 Implement data archival and cleanup
    - Create archiveEventResults() function
    - Save results to liveEventArchive Firestore collection on event end
    - Delete guest data from Realtime DB within 60 seconds of event end
    - Set expiration timestamp (24 hours from event end)
    - Implement cleanup job to delete expired archives
    - _Requirements: 1.4, 16.1, 16.2, 16.3_
  
  - [ ] 6.5 Implement event statistics logging
    - Log anonymous statistics (participant count, duration, average score)
    - Ensure no PII is included in logs
    - Store statistics separately from guest data
    - _Requirements: 16.5_
  
  - [ ]* 6.6 Write unit tests for export functionality
    - Test CSV export format and completeness
    - Test PDF export format and completeness
    - Test data archival process
    - Test cleanup timing (60 seconds, 24 hours)
    - Test statistics logging without PII
    - _Requirements: 11.5, 11.6, 11.7, 16.1, 16.2, 16.3, 16.5_
  
  - [ ] 6.7 Git backup: Phase 6 complete
    - Create git commit with message "Phase 6: Results and export complete"
    - Tag as "live-event-phase-6"
    - _Requirements: N/A_

- [ ] 7. Phase 7: Final Testing & Deployment
  - [ ] 7.1 Add Live Events section to Home page
    - Update src/pages/Home.tsx with Live Events section
    - Add "Join Live Event" button linking to /live-event/join
    - Add brief description of live event feature
    - _Requirements: N/A_
  
  - [ ] 7.2 Implement event inactivity timeout
    - Create background job to check for inactive events (4 hours no activity)
    - Automatically mark inactive events as completed
    - Trigger cleanup for inactive events
    - _Requirements: 15.4_
  
  - [ ] 7.3 Implement projector view preview
    - Add "Preview Projector View" button to host control panel
    - Open preview in new window/tab showing lobby screen
    - Display QR code and PIN without creating active event
    - _Requirements: 20.6_
  
  - [ ]* 7.4 Perform load testing
    - Test with 50 concurrent participants (minimum requirement)
    - Test with 100 concurrent participants (maximum capacity)
    - Measure synchronization latency (P50, P95, P99)
    - Verify all updates occur within 1 second under load
    - Test rapid answer submissions (all participants answer within 1 second)
    - Test rapid participant joins (50 joins within 10 seconds)
    - _Requirements: 13.2, 13.3_
  
  - [ ]* 7.5 Perform end-to-end testing
    - Test complete happy path (create → join → compete → results → download)
    - Test late joiner rejection (event already started)
    - Test network resilience (disconnect/reconnect during event)
    - Test concurrent event prevention
    - Test data cleanup after event end
    - _Requirements: 1.4, 4.6, 13.5, 13.6, 15.1, 15.2, 16.1_
  
  - [ ]* 7.6 Perform accessibility testing
    - Verify color contrast ratios (minimum 7:1 for projector view)
    - Test keyboard navigation on participant view
    - Verify font sizes meet requirements (24px, 32px, 48px minimums)
    - Test touch target sizes on mobile (minimum 44px)
    - Test with screen reader (basic announcements)
    - _Requirements: 3.1, 17.2, 18.1_
  
  - [ ] 7.7 Create user documentation
    - Write host guide (how to create and manage live events)
    - Write participant instructions (how to join and participate)
    - Document troubleshooting steps (connection issues, errors)
    - Add inline help text to UI components
    - _Requirements: N/A_
  
  - [ ] 7.8 Final checkpoint - Production readiness
    - Review all test results
    - Verify all requirements are met
    - Check Firebase security rules are properly configured
    - Verify environment variables are set
    - Ensure all tests pass
    - Ask the user if questions arise before deployment
    - _Requirements: N/A_
  
  - [ ] 7.9 Git backup: Phase 7 complete - Production ready
    - Create git commit with message "Phase 7: Final testing and deployment preparation complete"
    - Tag as "live-event-production-ready"
    - _Requirements: N/A_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each phase ends with a git backup for easy restoration if needed
- Testing is integrated throughout to catch issues early
- Real-time synchronization performance is critical - verify < 1 second latency
- Accessibility requirements are strict for elderly attendees - verify font sizes and contrast
- Guest data privacy is paramount - ensure no PII stored in permanent collections
- Single active event constraint must be enforced to manage system resources
- Property-based tests use fast-check library with minimum 100 iterations
- Load testing should verify system handles 50-100 concurrent participants
- Each task references specific requirements for traceability

## Success Criteria

- Guest participants can join without email/phone registration
- QR code and PIN access work seamlessly
- Projector view displays with large, accessible fonts (24px minimum)
- Participant view is mobile-responsive with 44px touch targets
- Real-time synchronization occurs within 1 second for all state changes
- Scoring algorithm correctly awards points and fastest finger bonuses
- Leaderboard updates within 2 seconds after each question
- Results can be exported to CSV and PDF formats
- Guest data is deleted within 60 seconds of event end
- System supports 50-100 concurrent participants without performance degradation
- All accessibility requirements met (7:1 contrast, sans-serif fonts, color-blind friendly)
