# Requirements Document: Practice Live Mode

## Introduction

Practice Live Mode is a new competition type that combines the accessibility of Live Event Mode with the self-paced, multi-attempt nature of Practice Mode. This feature enables teachers to create persistent practice sessions where students can join anytime using a shared QR code, attempt quizzes multiple times to improve their scores, and track their progress over time. Unlike competitive Live Events that are time-bound and single-attempt, Practice Live Mode sessions remain active for extended periods (weeks or months) and allow unlimited retries with the same questions for skill improvement tracking.

## Glossary

- **Practice_Live_System**: The complete system for hosting persistent practice sessions
- **Teacher**: The admin/educator who creates and monitors practice sessions
- **Student**: A person participating in practice sessions without email/phone registration
- **Practice_Session**: A persistent quiz session that remains active for extended periods
- **Student_Session**: Browser-based session data stored in localStorage
- **QR_Code**: Quick Response code for joining practice sessions
- **PIN_Code**: 6-digit numeric code for manual session joining
- **Attempt**: A single completion of the quiz by a student
- **Best_Score**: The highest score achieved by a student across all attempts
- **Leaderboard**: Ranking display showing best scores and attempt counts
- **Teacher_Dashboard**: Interface for monitoring student activity and downloading reports
- **Firebase_Realtime_Database**: Real-time synchronization service for live updates
- **Practice_Analytics**: Statistics about student performance and session usage
- **Try_Again_Button**: UI control that allows immediate quiz retry with same questions

## Requirements

### Requirement 1: Guest Participation Without Sign-In

**User Story:** As a student, I want to join practice sessions without providing email or phone number, so that I can quickly start practicing.

#### Acceptance Criteria

1. WHEN a Student enters their name, THE Practice_Live_System SHALL create a Student_Session without requiring email or phone
2. THE Practice_Live_System SHALL validate that Student names are between 2 and 50 characters
3. THE Practice_Live_System SHALL allow duplicate names across different browser sessions
4. THE Practice_Live_System SHALL store the Student name in browser localStorage
5. WHEN a Student returns to the same session URL, THE Practice_Live_System SHALL retrieve their name from localStorage

### Requirement 2: Persistent Name Storage

**User Story:** As a student, I want my name remembered in my browser, so that I don't have to re-enter it on each attempt.

#### Acceptance Criteria

1. WHEN a Student successfully joins a Practice_Session, THE Practice_Live_System SHALL store their name in localStorage with key `practiceLive_{sessionId}_name`
2. WHEN a Student returns to the same Practice_Session, THE Practice_Live_System SHALL auto-fill their name from localStorage
3. WHEN a Student clears browser data, THE Practice_Live_System SHALL prompt for name entry on next visit
4. THE Practice_Live_System SHALL allow Students to change their stored name at any time
5. THE Practice_Live_System SHALL NOT sync names across different browsers or devices

### Requirement 3: Shared QR Code Access

**User Story:** As a teacher, I want one QR code that unlimited students can use, so that I can easily share practice sessions.

#### Acceptance Criteria

1. WHEN a Teacher creates a Practice_Session, THE Practice_Live_System SHALL generate a unique 6-digit PIN_Code
2. WHEN a Teacher creates a Practice_Session, THE Practice_Live_System SHALL generate a QR_Code containing the session URL and PIN_Code
3. THE QR_Code SHALL remain valid for the entire duration of the Practice_Session
4. THE Practice_Live_System SHALL allow unlimited Students to join using the same QR_Code
5. THE Practice_Live_System SHALL NOT expire the QR_Code based on time or usage count
6. THE Teacher SHALL be able to download the QR_Code as a PNG image

### Requirement 4: Same Questions on Retry

**User Story:** As a student, I want to see the same questions when I retry, so that I can learn from my mistakes and improve my score.

#### Acceptance Criteria

1. WHEN a Student completes a quiz, THE Practice_Live_System SHALL display a Try_Again_Button
2. WHEN a Student clicks Try_Again_Button, THE Practice_Live_System SHALL restart the quiz with identical questions in the same order
3. THE Practice_Live_System SHALL NOT randomize question order between attempts
4. THE Practice_Live_System SHALL NOT change answer options between attempts
5. THE Practice_Live_System SHALL reset the timer for each new attempt
6. THE Practice_Live_System SHALL track each attempt separately in the database

### Requirement 5: Leaderboard with Attempt Tracking

**User Story:** As a student, I want to see how many attempts others have made, so that I can understand the leaderboard context.

#### Acceptance Criteria

1. THE Leaderboard SHALL display Student name, Best_Score, and attempt count
2. THE Leaderboard SHALL rank Students by Best_Score in descending order
3. WHEN two Students have the same Best_Score, THE Leaderboard SHALL rank by fewest attempts
4. WHEN Best_Score and attempts are equal, THE Leaderboard SHALL rank by earliest first attempt timestamp
5. THE Leaderboard SHALL update in real-time when Students complete attempts
6. THE Leaderboard SHALL display "Attempts: X" next to each Student's score
7. THE Leaderboard SHALL show the top 20 Students by default

### Requirement 6: No Projector View

**User Story:** As a teacher, I want a simple mobile-only experience, so that students can practice independently without requiring a projector setup.

#### Acceptance Criteria

1. THE Practice_Live_System SHALL NOT provide a projector view interface
2. THE Practice_Live_System SHALL provide only a mobile-responsive student interface
3. THE Practice_Live_System SHALL provide a Teacher_Dashboard for monitoring
4. THE Teacher_Dashboard SHALL NOT be designed for projector display
5. THE Practice_Live_System SHALL optimize all interfaces for mobile devices (320px-768px width)

### Requirement 7: Teacher Dashboard

**User Story:** As a teacher, I want to monitor student activity in real-time, so that I can track engagement and progress.

#### Acceptance Criteria

1. THE Teacher_Dashboard SHALL display the total number of active Students
2. THE Teacher_Dashboard SHALL display the total number of attempts across all Students
3. THE Teacher_Dashboard SHALL display the current Leaderboard with Best_Score and attempts
4. THE Teacher_Dashboard SHALL display average score across all attempts
5. THE Teacher_Dashboard SHALL update in real-time when Students complete attempts
6. THE Teacher_Dashboard SHALL display the Practice_Session PIN_Code and QR_Code
7. THE Teacher_Dashboard SHALL provide a "Download Report" button

### Requirement 8: Practice Analytics

**User Story:** As a teacher, I want to see practice statistics, so that I can understand usage patterns and student engagement.

#### Acceptance Criteria

1. THE Teacher_Dashboard SHALL display total Students who have attempted the quiz
2. THE Teacher_Dashboard SHALL display total attempts across all Students
3. THE Teacher_Dashboard SHALL display average score across all attempts
4. THE Teacher_Dashboard SHALL display average attempts per Student
5. THE Teacher_Dashboard SHALL display the most commonly missed questions
6. THE Teacher_Dashboard SHALL display peak usage times (hour of day)
7. THE Teacher_Dashboard SHALL calculate and display improvement rate (average score increase from first to best attempt)

### Requirement 9: Downloadable Reports

**User Story:** As a teacher, I want to download practice reports, so that I can analyze student performance offline.

#### Acceptance Criteria

1. THE Teacher_Dashboard SHALL provide a "Download CSV" button
2. WHEN the Teacher clicks "Download CSV", THE Practice_Live_System SHALL generate a CSV file with columns: Student Name, Best Score, Attempts, First Attempt Date, Last Attempt Date, Improvement
3. THE Practice_Live_System SHALL provide a "Download PDF" button
4. WHEN the Teacher clicks "Download PDF", THE Practice_Live_System SHALL generate a formatted PDF report with Leaderboard and Practice_Analytics
5. THE CSV filename SHALL include the session title and download date
6. THE PDF SHALL include the session title, date range, and QR_Code

### Requirement 10: Persistent Sessions

**User Story:** As a teacher, I want practice sessions to remain active for weeks or months, so that students can practice over extended periods.

#### Acceptance Criteria

1. WHEN a Teacher creates a Practice_Session, THE Practice_Live_System SHALL set no automatic expiration
2. THE Teacher SHALL be able to manually end a Practice_Session at any time
3. WHEN a Practice_Session is active, THE Practice_Live_System SHALL accept new Students and attempts
4. THE Practice_Live_System SHALL retain all attempt data until the Teacher ends the session
5. WHEN a Teacher ends a Practice_Session, THE Practice_Live_System SHALL archive the data for 30 days before deletion

### Requirement 11: Individual Pacing

**User Story:** As a student, I want to answer questions at my own pace, so that I'm not rushed by timers.

#### Acceptance Criteria

1. THE Practice_Live_System SHALL NOT display countdown timers during quiz attempts
2. THE Practice_Live_System SHALL allow Students to take unlimited time per question
3. THE Practice_Live_System SHALL allow Students to pause and resume attempts
4. WHEN a Student closes the browser mid-attempt, THE Practice_Live_System SHALL save progress in localStorage
5. WHEN a Student returns after closing the browser, THE Practice_Live_System SHALL offer to resume the incomplete attempt

### Requirement 12: No Synchronized Start

**User Story:** As a student, I want to start the quiz whenever I'm ready, so that I don't have to wait for others.

#### Acceptance Criteria

1. THE Practice_Live_System SHALL NOT require a countdown or synchronized start
2. WHEN a Student joins a Practice_Session, THE Practice_Live_System SHALL immediately display the quiz
3. THE Practice_Live_System SHALL allow multiple Students to be at different questions simultaneously
4. THE Practice_Live_System SHALL NOT display "Waiting for others" messages
5. THE Practice_Live_System SHALL allow Students to join and start at any time

### Requirement 13: Immediate Results Display

**User Story:** As a student, I want to see my results immediately after completing the quiz, so that I can learn from my mistakes.

#### Acceptance Criteria

1. WHEN a Student completes all questions, THE Practice_Live_System SHALL immediately display the results screen
2. THE results screen SHALL display the Student's score, correct answers count, and percentage
3. THE results screen SHALL display the Student's current rank on the Leaderboard
4. THE results screen SHALL display the Student's attempt number
5. THE results screen SHALL display a question-by-question review with correct answers highlighted
6. THE results screen SHALL display the Try_Again_Button prominently

### Requirement 14: Integration with Competition Type Selection

**User Story:** As a teacher, I want to select Practice Live Mode from the competition creation interface, so that I can easily create practice sessions.

#### Acceptance Criteria

1. THE AdminCreateCompetition Step 0 SHALL display a fourth competition type card for "Practice Live Mode"
2. THE Practice Live Mode card SHALL display icon, title, and description
3. WHEN the Teacher selects Practice Live Mode, THE Practice_Live_System SHALL enable Step 1 for question generation
4. WHEN questions are generated, THE Practice_Live_System SHALL display Practice Live Mode-specific fields in Step 2
5. THE Practice_Live_System SHALL reuse existing question generation infrastructure from AdminCreateCompetition

### Requirement 15: Reuse of Live Event Infrastructure

**User Story:** As a system, I need to reuse existing Live Event infrastructure, so that development is efficient and maintainable.

#### Acceptance Criteria

1. THE Practice_Live_System SHALL use Firebase_Realtime_Database for real-time synchronization
2. THE Practice_Live_System SHALL reuse liveEventService.ts functions: generatePIN, generateEventId, validateNameLength
3. THE Practice_Live_System SHALL reuse LiveEventJoin.tsx component with modifications for Practice Live Mode
4. THE Practice_Live_System SHALL reuse LiveEventParticipant.tsx component with modifications for self-paced mode
5. THE Practice_Live_System SHALL create new database paths: `practiceSessions/{sessionId}`, `practiceAttempts/{sessionId}`, `practiceLeaderboard/{sessionId}`

### Requirement 16: Data Structure for Attempts

**User Story:** As a system, I need to store attempt data efficiently, so that I can track student progress and generate analytics.

#### Acceptance Criteria

1. THE Practice_Live_System SHALL store each attempt with fields: attemptId, studentName, sessionId, score, correctAnswers, timestamp, answers
2. THE Practice_Live_System SHALL store answers as an array of objects with fields: questionIndex, selectedAnswer, correctAnswer, isCorrect
3. THE Practice_Live_System SHALL calculate Best_Score by comparing all attempts for each Student
4. THE Practice_Live_System SHALL update the Leaderboard in real-time after each attempt
5. THE Practice_Live_System SHALL index attempts by studentName for efficient querying

### Requirement 17: Mobile-Optimized Quiz Interface

**User Story:** As a student using a mobile device, I want a touch-friendly interface, so that I can practice comfortably on my phone.

#### Acceptance Criteria

1. THE quiz interface SHALL be responsive for screen sizes from 320 pixels to 768 pixels width
2. THE quiz interface SHALL use touch-optimized buttons with minimum 44-pixel touch targets
3. THE quiz interface SHALL prevent accidental zooming during interaction
4. THE quiz interface SHALL display questions and options without horizontal scrolling
5. THE quiz interface SHALL display progress indicator showing "Question X of Y"

### Requirement 18: Network Resilience

**User Story:** As a student, I want the system to handle poor network conditions, so that I don't lose my progress.

#### Acceptance Criteria

1. WHEN a Student loses network connection mid-attempt, THE Practice_Live_System SHALL save progress in localStorage
2. WHEN network connection is restored, THE Practice_Live_System SHALL sync the saved progress to the database
3. WHEN a Student submits an attempt offline, THE Practice_Live_System SHALL queue the submission
4. WHEN connection is restored, THE Practice_Live_System SHALL submit the queued attempt
5. THE Practice_Live_System SHALL display a reconnection indicator during network interruptions

### Requirement 19: Session Configuration

**User Story:** As a teacher, I want to configure practice session settings, so that the session matches my teaching goals.

#### Acceptance Criteria

1. THE Teacher SHALL be able to set the session title before creating
2. THE Teacher SHALL be able to select a quiz template or generate new questions
3. THE Teacher SHALL be able to set the number of questions (default: 20, maximum: 50)
4. THE Teacher SHALL be able to enable or disable the Leaderboard visibility to Students
5. THE Teacher SHALL be able to enable or disable question explanations in results
6. THE Teacher SHALL be able to set a description for the practice session

### Requirement 20: Improvement Tracking

**User Story:** As a student, I want to see my improvement over attempts, so that I can track my learning progress.

#### Acceptance Criteria

1. WHEN a Student completes an attempt, THE results screen SHALL display their previous best score
2. WHEN a Student improves their score, THE results screen SHALL display a congratulatory message
3. THE results screen SHALL display a score history chart showing all attempt scores
4. THE results screen SHALL calculate and display improvement percentage from first to current attempt
5. THE results screen SHALL highlight questions that were incorrect in previous attempts but correct in current attempt

### Requirement 21: Question Explanations

**User Story:** As a student, I want to see explanations for correct answers, so that I can learn from my mistakes.

#### Acceptance Criteria

1. WHEN a Student views results, THE Practice_Live_System SHALL display explanations for all questions
2. THE explanations SHALL be displayed below each question in the results review
3. THE Practice_Live_System SHALL highlight the correct answer in green
4. THE Practice_Live_System SHALL highlight the Student's incorrect answer in red (if different from correct)
5. WHEN the Teacher disables explanations in settings, THE Practice_Live_System SHALL hide explanations from Students

### Requirement 22: Data Privacy and Retention

**User Story:** As a system administrator, I want to manage data retention appropriately, so that privacy is maintained and storage is optimized.

#### Acceptance Criteria

1. WHEN a Teacher ends a Practice_Session, THE Practice_Live_System SHALL archive all data to Firestore
2. THE archived data SHALL be retained for 30 days for Teacher access
3. WHEN 30 days have passed since session end, THE Practice_Live_System SHALL delete archived data
4. THE Practice_Live_System SHALL NOT store Student names in permanent user collections
5. THE Practice_Live_System SHALL log session statistics (total Students, total attempts) without personal information

### Requirement 23: Concurrent Session Limit

**User Story:** As a system administrator, I want to limit concurrent practice sessions per teacher, so that system resources are managed effectively.

#### Acceptance Criteria

1. THE Practice_Live_System SHALL allow up to 5 active Practice_Sessions per Teacher simultaneously
2. WHEN a Teacher attempts to create a 6th session, THE Practice_Live_System SHALL display an error message
3. THE Practice_Live_System SHALL suggest ending inactive sessions before creating new ones
4. THE Practice_Live_System SHALL automatically mark sessions as inactive after 30 days of no attempts
5. THE Teacher SHALL be able to manually reactivate inactive sessions

### Requirement 24: Real-Time Leaderboard Updates

**User Story:** As a student, I want to see the leaderboard update in real-time, so that I can see my ranking immediately after completing an attempt.

#### Acceptance Criteria

1. WHEN a Student completes an attempt, THE Practice_Live_System SHALL update the Leaderboard within 2 seconds
2. WHEN viewing the Leaderboard, THE Practice_Live_System SHALL use real-time listeners for live updates
3. THE Leaderboard SHALL display a visual indicator when it updates
4. THE Leaderboard SHALL highlight the current Student's entry
5. THE Leaderboard SHALL display the timestamp of the last update

### Requirement 25: Parser and Serializer for Quiz Data

**User Story:** As a system, I need to parse and serialize quiz data correctly, so that questions and answers are stored and retrieved accurately.

#### Acceptance Criteria

1. WHEN storing quiz data, THE Practice_Live_System SHALL serialize questions to JSON format
2. WHEN retrieving quiz data, THE Practice_Live_System SHALL parse JSON into question objects
3. THE Practice_Live_System SHALL validate that all required fields (question, options, correctAnswer) are present
4. THE Practice_Live_System SHALL provide a pretty printer for formatting quiz data for reports
5. FOR ALL valid quiz objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)

