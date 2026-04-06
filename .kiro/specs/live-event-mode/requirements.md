# Requirements Document: Live Event Mode

## Introduction

Live Event Mode is a new feature for hosting in-person quiz competitions at cultural programs and events. This mode enables event organizers to conduct real-time quiz competitions in physical venues where participants use their personal devices to answer questions while a shared projector/TV displays questions, timers, and live leaderboards for all attendees to see. The system supports guest participation without requiring email/phone registration, uses QR codes and PIN codes for easy joining, and provides a two-screen experience optimized for both elderly participants (large fonts on projector) and mobile users.

## Glossary

- **Live_Event_System**: The complete system for hosting in-person quiz competitions
- **Event_Host**: The admin/organizer who creates and controls the live event
- **Guest_Participant**: A person joining the event without email/phone registration
- **Projector_View**: The large-screen display visible to all attendees in the venue
- **Participant_View**: The mobile interface used by individual participants on their devices
- **Event_Lobby**: The pre-competition phase where participants join and wait
- **Competition_Phase**: The active quiz phase where questions are displayed and answered
- **Leaderboard**: Real-time ranking display showing participant scores
- **QR_Code**: Quick Response code for easy event joining
- **PIN_Code**: 6-digit numeric code for manual event joining
- **Firebase_Realtime_Database**: Real-time synchronization service for live updates
- **Guest_Session**: Temporary participant data that exists only during the event
- **Fastest_Finger_Bonus**: Additional points awarded for speed of correct answers

## Requirements

### Requirement 1: Guest Participation System

**User Story:** As an event participant, I want to join competitions without providing email or phone number, so that I can quickly participate in cultural events.

#### Acceptance Criteria

1. WHEN a Guest_Participant enters their name, THE Live_Event_System SHALL create a Guest_Session without requiring email or phone
2. THE Live_Event_System SHALL validate that Guest_Participant names are between 2 and 50 characters
3. THE Live_Event_System SHALL prevent duplicate names within the same event
4. WHEN an event ends, THE Live_Event_System SHALL delete all Guest_Session data
5. THE Live_Event_System SHALL NOT store Guest_Participant information in permanent database collections

### Requirement 2: QR Code and PIN Access

**User Story:** As an event participant, I want to join using a QR code or PIN, so that I can easily access the competition from my phone.

#### Acceptance Criteria

1. WHEN an Event_Host creates a live event, THE Live_Event_System SHALL generate a unique 6-digit PIN_Code
2. WHEN an Event_Host creates a live event, THE Live_Event_System SHALL generate a QR_Code containing the event URL and PIN_Code
3. THE Live_Event_System SHALL display the QR_Code on the Projector_View during Event_Lobby phase
4. WHEN a Guest_Participant scans the QR_Code, THE Live_Event_System SHALL navigate to the join page with pre-filled PIN_Code
5. WHEN a Guest_Participant enters a valid PIN_Code, THE Live_Event_System SHALL grant access to the event
6. IF a Guest_Participant enters an invalid PIN_Code, THEN THE Live_Event_System SHALL display an error message

### Requirement 3: Two-Screen Display System

**User Story:** As an event organizer, I want separate displays for projector and participant phones, so that elderly attendees can see clearly while participants interact on their devices.

#### Acceptance Criteria

1. THE Projector_View SHALL use a minimum font size of 24 pixels for all text
2. THE Projector_View SHALL display questions, timers, and leaderboards visible to all attendees
3. THE Participant_View SHALL be mobile-responsive with touch-optimized controls
4. THE Participant_View SHALL display questions and answer options for individual interaction
5. WHEN a question is displayed, THE Live_Event_System SHALL synchronize display on both Projector_View and Participant_View within 500 milliseconds
6. THE Projector_View SHALL NOT display individual participant answer selections

### Requirement 4: Event Lobby Management

**User Story:** As an event host, I want to see participants join in real-time before starting, so that I can ensure everyone is ready.

#### Acceptance Criteria

1. WHEN the Event_Lobby is active, THE Projector_View SHALL display the QR_Code and PIN_Code
2. WHEN a Guest_Participant joins, THE Projector_View SHALL update the participant list within 1 second
3. THE Projector_View SHALL display a participant counter showing "X/Y joined" format
4. THE Event_Host SHALL be able to view the complete list of joined participants
5. THE Event_Host SHALL be able to remove participants from the Event_Lobby
6. WHEN the Event_Host starts the competition, THE Live_Event_System SHALL close the Event_Lobby and prevent new joins

### Requirement 5: Synchronized Start Sequence

**User Story:** As an event host, I want a countdown before starting, so that all participants are ready simultaneously.

#### Acceptance Criteria

1. WHEN the Event_Host initiates start, THE Live_Event_System SHALL display a countdown sequence "3-2-1-GO"
2. THE Live_Event_System SHALL synchronize the countdown on both Projector_View and Participant_View
3. THE countdown SHALL display each number for exactly 1 second
4. WHEN the countdown reaches "GO", THE Live_Event_System SHALL transition to Competition_Phase within 500 milliseconds
5. THE Live_Event_System SHALL display the first question immediately after "GO"

### Requirement 6: Real-Time Question Display

**User Story:** As a participant, I want to see questions on both the projector and my phone, so that I can read comfortably regardless of my position in the venue.

#### Acceptance Criteria

1. WHEN a question is displayed, THE Live_Event_System SHALL show it on both Projector_View and Participant_View simultaneously
2. THE Projector_View SHALL display the question text with minimum 32-pixel font size
3. THE Participant_View SHALL display the question text with answer buttons
4. WHEN a Guest_Participant selects an answer, THE Live_Event_System SHALL record the selection timestamp
5. THE Live_Event_System SHALL prevent answer changes after initial selection
6. THE Projector_View SHALL display an "Answered: X/Y" counter showing response progress

### Requirement 7: Question Timer System

**User Story:** As an event host, I want configurable timers per question, so that I can control the pace of the competition.

#### Acceptance Criteria

1. THE Event_Host SHALL be able to configure question timer duration between 15 and 120 seconds
2. WHEN a question is displayed, THE Live_Event_System SHALL start the timer countdown
3. THE Projector_View SHALL display the remaining time with minimum 48-pixel font size
4. WHEN the timer reaches 10 seconds remaining, THE Live_Event_System SHALL display the timer in red color
5. WHEN the timer expires, THE Live_Event_System SHALL prevent new answer submissions
6. WHEN the timer expires, THE Live_Event_System SHALL auto-advance to the next question after 3 seconds
7. THE Event_Host SHALL be able to manually advance to the next question before timer expiration

### Requirement 8: Live Leaderboard Display

**User Story:** As an event attendee, I want to see live rankings during the competition, so that I can track the competition progress.

#### Acceptance Criteria

1. THE Projector_View SHALL display the top 5 participants on the Leaderboard during Competition_Phase
2. WHEN a question is answered, THE Live_Event_System SHALL update the Leaderboard within 2 seconds
3. THE Leaderboard SHALL display participant name, score, and rank
4. WHEN transitioning between questions, THE Live_Event_System SHALL display animated Leaderboard updates
5. THE Leaderboard animation SHALL last between 3 and 5 seconds
6. THE Participant_View SHALL display the participant's current rank and score

### Requirement 9: Scoring System

**User Story:** As a participant, I want points for correct answers and speed bonuses, so that both accuracy and quickness are rewarded.

#### Acceptance Criteria

1. WHEN a Guest_Participant answers correctly, THE Live_Event_System SHALL award 100 points
2. WHEN a Guest_Participant answers incorrectly, THE Live_Event_System SHALL award 0 points
3. WHEN a Guest_Participant is the fastest correct answer, THE Live_Event_System SHALL award an additional 50 points
4. WHEN a Guest_Participant is the second fastest correct answer, THE Live_Event_System SHALL award an additional 30 points
5. WHEN a Guest_Participant is the third fastest correct answer, THE Live_Event_System SHALL award an additional 10 points
6. THE Live_Event_System SHALL calculate Fastest_Finger_Bonus only for correct answers
7. THE Live_Event_System SHALL update scores in real-time after each question

### Requirement 10: Answer Reveal Timing

**User Story:** As an event host, I want to show correct answers only at the end, so that suspense is maintained throughout the competition.

#### Acceptance Criteria

1. THE Live_Event_System SHALL NOT display correct answers during Competition_Phase
2. WHEN the final question is completed, THE Live_Event_System SHALL transition to results phase
3. THE Live_Event_System SHALL display all questions with correct answers in the results phase
4. THE Participant_View SHALL show which answers the participant selected
5. THE Participant_View SHALL highlight correct answers in green and incorrect selections in red

### Requirement 11: Final Results Display

**User Story:** As an event attendee, I want to see final results with large fonts and animations, so that winners are celebrated appropriately.

#### Acceptance Criteria

1. WHEN the competition ends, THE Projector_View SHALL display final results with minimum 36-pixel font size
2. THE Projector_View SHALL display a winner announcement with confetti animation
3. THE Projector_View SHALL display a top 3 podium visualization
4. THE Projector_View SHALL display a scrollable full Leaderboard
5. THE Event_Host SHALL be able to download results in CSV format
6. THE Event_Host SHALL be able to download results in PDF format
7. THE downloaded results SHALL include participant name, final score, rank, and per-question performance

### Requirement 12: Integration with Existing System

**User Story:** As an event host, I want to reuse existing question generation, so that I can create live events efficiently.

#### Acceptance Criteria

1. THE Live_Event_System SHALL integrate with AdminCreateCompetition.tsx question generation
2. THE Live_Event_System SHALL support all existing quiz templates from AdminQuizTemplates.tsx
3. THE Live_Event_System SHALL reuse existing subject distribution configuration
4. THE Live_Event_System SHALL reuse existing difficulty level settings
5. THE Live_Event_System SHALL add a "Live Event Mode" toggle to the admin competition creation interface
6. WHEN "Live Event Mode" is enabled, THE Live_Event_System SHALL configure real-time synchronization settings

### Requirement 13: Real-Time Synchronization

**User Story:** As an event host, I want all participants synchronized in real-time, so that the competition runs smoothly.

#### Acceptance Criteria

1. THE Live_Event_System SHALL use Firebase_Realtime_Database for state synchronization
2. THE Live_Event_System SHALL support 50 to 100 simultaneous participants
3. WHEN the Event_Host advances to the next question, THE Live_Event_System SHALL update all Participant_Views within 1 second
4. WHEN a Guest_Participant submits an answer, THE Live_Event_System SHALL update the Projector_View counter within 1 second
5. THE Live_Event_System SHALL handle network disconnections gracefully with reconnection logic
6. WHEN a Guest_Participant reconnects, THE Live_Event_System SHALL restore their session state

### Requirement 14: Admin Control Interface

**User Story:** As an event host, I want manual controls during the event, so that I can handle unexpected situations.

#### Acceptance Criteria

1. THE Event_Host SHALL be able to pause the competition at any time
2. THE Event_Host SHALL be able to resume the competition after pausing
3. THE Event_Host SHALL be able to skip to the next question manually
4. THE Event_Host SHALL be able to extend the timer for the current question
5. THE Event_Host SHALL be able to end the competition early
6. WHEN the Event_Host uses manual controls, THE Live_Event_System SHALL synchronize changes to all participants within 1 second

### Requirement 15: Single Event Constraint

**User Story:** As a system administrator, I want to prevent multiple simultaneous events, so that system resources are managed effectively.

#### Acceptance Criteria

1. THE Live_Event_System SHALL allow only one active live event at any time
2. WHEN an Event_Host attempts to create a new live event while one is active, THE Live_Event_System SHALL display an error message
3. WHEN a live event ends, THE Live_Event_System SHALL allow creation of a new live event within 5 seconds
4. THE Live_Event_System SHALL automatically mark events as inactive after 4 hours of inactivity

### Requirement 16: Data Privacy and Cleanup

**User Story:** As a system administrator, I want guest data deleted after events, so that privacy is maintained and storage is optimized.

#### Acceptance Criteria

1. WHEN an Event_Host ends a live event, THE Live_Event_System SHALL delete all Guest_Session data within 60 seconds
2. THE Live_Event_System SHALL retain event results for Event_Host download for 24 hours
3. WHEN 24 hours have passed since event end, THE Live_Event_System SHALL delete event results
4. THE Live_Event_System SHALL NOT store Guest_Participant names in permanent user collections
5. THE Live_Event_System SHALL log event statistics (participant count, duration) without personal information

### Requirement 17: Mobile Responsiveness

**User Story:** As a participant using a mobile device, I want an optimized interface, so that I can participate comfortably on my phone.

#### Acceptance Criteria

1. THE Participant_View SHALL be responsive for screen sizes from 320 pixels to 768 pixels width
2. THE Participant_View SHALL use touch-optimized buttons with minimum 44-pixel touch targets
3. THE Participant_View SHALL prevent accidental zooming during interaction
4. THE Participant_View SHALL display questions and options without horizontal scrolling
5. WHEN the device orientation changes, THE Participant_View SHALL adapt layout within 500 milliseconds

### Requirement 18: Accessibility for Elderly Participants

**User Story:** As an elderly event attendee, I want large, clear text on the projector, so that I can follow the competition easily.

#### Acceptance Criteria

1. THE Projector_View SHALL use high contrast color schemes (minimum 7:1 contrast ratio)
2. THE Projector_View SHALL use sans-serif fonts for better readability
3. THE Projector_View SHALL display question numbers prominently (e.g., "Question 5 of 20")
4. THE Projector_View SHALL use color-blind friendly colors for status indicators
5. THE Projector_View SHALL avoid rapid animations that could cause discomfort

### Requirement 19: Network Resilience

**User Story:** As a participant, I want the system to handle poor network conditions, so that I don't lose my progress.

#### Acceptance Criteria

1. WHEN a Guest_Participant loses network connection, THE Participant_View SHALL display a reconnection indicator
2. WHEN network connection is restored, THE Live_Event_System SHALL synchronize the participant's state within 3 seconds
3. IF a Guest_Participant is disconnected for more than 60 seconds, THE Live_Event_System SHALL mark them as inactive
4. THE Live_Event_System SHALL queue answer submissions during network interruptions
5. WHEN connection is restored, THE Live_Event_System SHALL submit queued answers if still within time limit

### Requirement 20: Event Configuration

**User Story:** As an event host, I want to configure event settings before starting, so that the competition matches my event requirements.

#### Acceptance Criteria

1. THE Event_Host SHALL be able to set the event title before starting
2. THE Event_Host SHALL be able to select a quiz template from existing templates
3. THE Event_Host SHALL be able to configure question timer duration (default: 30 seconds)
4. THE Event_Host SHALL be able to set maximum participant limit (default: 50, maximum: 100)
5. THE Event_Host SHALL be able to enable or disable Fastest_Finger_Bonus
6. THE Event_Host SHALL be able to preview the Projector_View before starting the event
