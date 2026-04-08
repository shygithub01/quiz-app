# Design Document: Practice Live Mode

## Overview

Practice Live Mode is a persistent, self-paced quiz system that combines the accessibility of Live Event Mode (guest participation via QR codes) with the multi-attempt nature of Practice Mode. Unlike competitive Live Events that are time-bound and single-attempt, Practice Live Mode sessions remain active for extended periods (weeks or months), allowing students to join anytime, attempt quizzes multiple times with the same questions, and track their improvement over time.

### Key Features

- Guest participation without email/phone registration
- Persistent name storage in browser localStorage
- Shared QR code for unlimited students
- Same questions on every retry for improvement tracking
- Leaderboard showing best scores and attempt counts
- No projector view (mobile-only experience)
- Teacher dashboard with real-time analytics
- Multiple attempts allowed per student
- Individual pacing (no timers or synchronized starts)
- Persistent sessions (weeks/months duration)
- Downloadable reports (CSV/PDF)

### Design Goals

1. **Accessibility**: No registration barriers, quick join via QR/PIN
2. **Persistence**: Sessions remain active for extended periods
3. **Improvement Tracking**: Same questions allow students to learn and improve
4. **Simplicity**: Mobile-only interface, no projector setup required
5. **Reusability**: Leverage existing Live Event infrastructure
6. **Analytics**: Comprehensive teacher dashboard with insights



## Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Practice Live Mode System                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │ Admin Panel  │────────▶│ Teacher      │                      │
│  │ (Create      │         │ Dashboard    │                      │
│  │  Session)    │         │              │                      │
│  └──────────────┘         └──────┬───────┘                      │
│                                   │                               │
│                                   ▼                               │
│                    ┌──────────────────────────┐                  │
│                    │ Firebase Realtime DB     │                  │
│                    │ - Practice Sessions      │                  │
│                    │ - Student Attempts       │                  │
│                    │ - Leaderboard Data       │                  │
│                    └────────┬─────────────────┘                  │
│                             │                                     │
│                             ▼                                     │
│                  ┌──────────────────┐                           │
│                  │ Student View     │                           │
│                  │ (Mobile Device)  │                           │
│                  │ - Quiz Interface │                           │
│                  │ - Results        │                           │
│                  │ - Leaderboard    │                           │
│                  │ - Try Again      │                           │
│                  └──────────────────┘                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Integration with Existing System

Practice Live Mode extends the existing quiz platform:

1. **Reuses AdminCreateCompetition.tsx** - Add 4th competition type
2. **Reuses liveEventService.ts** - PIN generation, validation functions
3. **Reuses LiveEventJoin.tsx** - Modified for practice mode
4. **Reuses LiveEventParticipant.tsx** - Modified for self-paced mode
5. **New Firebase paths**: `practiceSessions`, `practiceAttempts`, `practiceLeaderboard`
6. **New component**: PracticeTeacherDashboard.tsx



### Technology Stack

- **Frontend**: React + TypeScript + Vite (existing)
- **UI Components**: Shadcn/ui + Tailwind CSS (existing)
- **Real-time Sync**: Firebase Realtime Database (existing)
- **Persistent Storage**: Firebase Firestore (existing)
- **QR Code Generation**: `qrcode.react` library (existing)
- **PDF Generation**: `jspdf` + `jspdf-autotable` (existing)
- **CSV Export**: Native JavaScript
- **Charts**: `recharts` library (new)

### Component Hierarchy

```
App.tsx
├── AdminCreateCompetition.tsx (extended with Practice Live Mode type)
├── PracticeTeacherDashboard.tsx (new - teacher monitoring)
├── PracticeJoin.tsx (new - adapted from LiveEventJoin.tsx)
├── PracticeParticipant.tsx (new - adapted from LiveEventParticipant.tsx)
└── PracticeResults.tsx (new - results with retry option)
```



## Components and Interfaces

### 1. AdminCreateCompetition.tsx (Extended)

**Purpose**: Add "Practice Live Mode" as 4th competition type in Step 0

**New Type Card**:
```typescript
{
  type: 'practiceLive',
  label: 'Practice Live Mode',
  description: 'Persistent practice sessions with unlimited attempts',
  icon: 'Target',
  fields: ['common', 'practiceSettings']
}
```

**New Fields in Step 2**:
```typescript
interface PracticeLiveSettings {
  sessionDuration: 'week' | 'month' | 'semester' | 'custom'; // default: 'month'
  customEndDate?: string; // if sessionDuration === 'custom'
  showLeaderboard: boolean; // default: true
  showExplanations: boolean; // default: true
  maxQuestions: number; // default: 20, max: 50
}
```



### 2. PracticeTeacherDashboard.tsx (New)

**Purpose**: Real-time monitoring and analytics for teachers

**Features**:
- Session info (PIN, QR code, status)
- Real-time statistics (students, attempts, avg score)
- Live leaderboard
- Analytics charts (score distribution, improvement trends)
- Download reports (CSV/PDF)
- End session button

**State Management**:
```typescript
interface DashboardState {
  session: PracticeSession;
  students: StudentSummary[];
  attempts: PracticeAttempt[];
  leaderboard: LeaderboardEntry[];
  analytics: PracticeAnalytics;
}

interface StudentSummary {
  name: string;
  attemptCount: number;
  bestScore: number;
  firstAttemptDate: number;
  lastAttemptDate: number;
  improvement: number; // percentage
}

interface PracticeAnalytics {
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  averageAttempts: number;
  mostMissedQuestions: { questionIndex: number; missRate: number }[];
  scoreDistribution: { range: string; count: number }[];
  improvementRate: number;
}
```



### 3. PracticeJoin.tsx (New - Adapted from LiveEventJoin.tsx)

**Purpose**: Student entry point with localStorage name persistence

**Features**:
- QR code scanner (auto-fills PIN)
- Manual PIN entry (6-digit)
- Name input with localStorage auto-fill
- Session validation
- Redirect to quiz interface

**Key Differences from LiveEventJoin**:
- Check localStorage for saved name: `localStorage.getItem('practiceLive_{sessionId}_name')`
- No "event already started" check (sessions always accept joins)
- Save name to localStorage on successful join
- Allow duplicate names (different browsers)

**Form Validation**:
```typescript
interface JoinFormValidation {
  pin: string; // 6 digits, required
  name: string; // 2-50 chars, required
  sessionExists: boolean;
  sessionActive: boolean;
}
```



### 4. PracticeParticipant.tsx (New - Adapted from LiveEventParticipant.tsx)

**Purpose**: Self-paced quiz interface for students

**Features**:
- Question display (one at a time)
- Answer selection
- Progress indicator
- No timer display
- Resume incomplete attempts from localStorage
- Submit quiz when complete

**Key Differences from LiveEventParticipant**:
- No timer countdown
- No real-time synchronization with other students
- Save progress to localStorage after each answer
- Allow browser close/reopen with resume
- No "waiting for others" states

**State Management**:
```typescript
interface ParticipantState {
  sessionId: string;
  studentName: string;
  currentQuestionIndex: number;
  answers: Record<number, string>; // questionIndex -> answer
  attemptId: string;
  startedAt: number;
  isComplete: boolean;
}

// localStorage key: `practiceLive_{sessionId}_progress`
```



### 5. PracticeResults.tsx (New)

**Purpose**: Display results with improvement tracking and retry option

**Features**:
- Score display (current attempt)
- Best score comparison
- Rank on leaderboard
- Question-by-question review with explanations
- Score history chart (all attempts)
- Improvement percentage
- Prominent "Try Again" button
- View leaderboard button

**UI Sections**:
```typescript
interface ResultsDisplay {
  currentScore: number;
  bestScore: number;
  rank: number;
  attemptNumber: number;
  improvement: number; // percentage from first attempt
  questionReview: QuestionReview[];
  scoreHistory: number[];
}

interface QuestionReview {
  questionIndex: number;
  question: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  wasIncorrectBefore: boolean; // highlight improvement
}
```



## Data Models

### Firebase Realtime Database Structure

```json
{
  "practiceSessions": {
    "{sessionId}": {
      "competitionId": "string",
      "pin": "123456",
      "status": "active | ended",
      "title": "string",
      "description": "string",
      "createdBy": "userId",
      "createdAt": 1234567890,
      "endDate": 1234567890,
      "settings": {
        "showLeaderboard": true,
        "showExplanations": true,
        "maxQuestions": 20
      },
      "statistics": {
        "totalStudents": 0,
        "totalAttempts": 0,
        "averageScore": 0
      }
    }
  },
  
  "practiceAttempts": {
    "{sessionId}": {
      "{attemptId}": {
        "studentName": "John Doe",
        "score": 85,
        "correctAnswers": 17,
        "totalQuestions": 20,
        "startedAt": 1234567890,
        "completedAt": 1234567890,
        "answers": {
          "0": {
            "selectedAnswer": "Option A",
            "correctAnswer": "Option A",
            "isCorrect": true
          }
        }
      }
    }
  },
  
  "practiceLeaderboard": {
    "{sessionId}": {
      "{studentName}": {
        "name": "John Doe",
        "bestScore": 95,
        "attemptCount": 5,
        "firstAttemptDate": 1234567890,
        "lastAttemptDate": 1234567890,
        "improvement": 25.5,
        "rank": 1
      }
    }
  }
}
```



### TypeScript Interfaces

```typescript
interface PracticeSession {
  id: string;
  competitionId: string;
  pin: string;
  status: 'active' | 'ended';
  title: string;
  description: string;
  createdBy: string;
  createdAt: number;
  endDate: number;
  settings: PracticeSettings;
  statistics: SessionStatistics;
}

interface PracticeSettings {
  showLeaderboard: boolean;
  showExplanations: boolean;
  maxQuestions: number;
}

interface SessionStatistics {
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
}

interface PracticeAttempt {
  id: string;
  sessionId: string;
  studentName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  startedAt: number;
  completedAt: number;
  answers: Record<number, AttemptAnswer>;
}

interface AttemptAnswer {
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface LeaderboardEntry {
  name: string;
  bestScore: number;
  attemptCount: number;
  firstAttemptDate: number;
  lastAttemptDate: number;
  improvement: number;
  rank: number;
}
```



## Key Functions with Formal Specifications

### Function 1: createPracticeSession()

```typescript
async function createPracticeSession(
  competitionId: string,
  settings: PracticeSettings,
  endDate: number
): Promise<{ sessionId: string; pin: string }>
```

**Preconditions:**
- `competitionId` exists in Firestore
- `settings` is valid (maxQuestions 1-50)
- `endDate` is in the future
- User is authenticated as admin/teacher

**Postconditions:**
- New session created in `practiceSessions/{sessionId}`
- Unique 6-digit PIN generated
- Session status is 'active'
- Returns sessionId and PIN

**Loop Invariants:** N/A



### Function 2: joinPracticeSession()

```typescript
async function joinPracticeSession(
  sessionId: string,
  studentName: string
): Promise<void>
```

**Preconditions:**
- `sessionId` exists in database
- Session status is 'active'
- `studentName` is 2-50 characters
- Session has not reached end date

**Postconditions:**
- Student name stored in localStorage: `practiceLive_{sessionId}_name`
- No database write (guest participation)
- Returns successfully

**Loop Invariants:** N/A

### Function 3: submitAttempt()

```typescript
async function submitAttempt(
  sessionId: string,
  studentName: string,
  answers: Record<number, string>,
  questions: Question[]
): Promise<{ attemptId: string; score: number }>
```

**Preconditions:**
- `sessionId` exists and is active
- `answers` contains entries for all questions
- `questions` array matches competition questions
- `studentName` is valid

**Postconditions:**
- New attempt created in `practiceAttempts/{sessionId}/{attemptId}`
- Score calculated correctly (100 points per correct answer)
- Leaderboard updated if new best score
- Session statistics updated
- localStorage progress cleared
- Returns attemptId and score

**Loop Invariants:**
- For each question: score += (answer === correctAnswer) ? 100 : 0



### Function 4: updateLeaderboard()

```typescript
async function updateLeaderboard(
  sessionId: string,
  studentName: string,
  newScore: number,
  attemptDate: number
): Promise<void>
```

**Preconditions:**
- `sessionId` exists
- `studentName` is valid
- `newScore` is 0-100 * questionCount
- `attemptDate` is valid timestamp

**Postconditions:**
- If first attempt: Create new leaderboard entry
- If new best score: Update bestScore
- Increment attemptCount
- Update lastAttemptDate
- Recalculate improvement percentage
- Recalculate all ranks (sorted by bestScore desc, then attemptCount asc)

**Loop Invariants:**
- For all entries: rank is correctly assigned based on sort order

### Function 5: calculateImprovement()

```typescript
function calculateImprovement(
  firstScore: number,
  bestScore: number
): number
```

**Preconditions:**
- `firstScore` >= 0
- `bestScore` >= firstScore

**Postconditions:**
- Returns percentage improvement: ((bestScore - firstScore) / firstScore) * 100
- If firstScore is 0, returns 0
- Result is rounded to 1 decimal place

**Loop Invariants:** N/A



### Function 6: saveProgressToLocalStorage()

```typescript
function saveProgressToLocalStorage(
  sessionId: string,
  progress: ParticipantState
): void
```

**Preconditions:**
- `sessionId` is valid
- `progress` contains current quiz state
- localStorage is available

**Postconditions:**
- Progress saved to localStorage with key: `practiceLive_{sessionId}_progress`
- Data serialized as JSON
- Previous progress overwritten

**Loop Invariants:** N/A

### Function 7: resumeFromLocalStorage()

```typescript
function resumeFromLocalStorage(
  sessionId: string
): ParticipantState | null
```

**Preconditions:**
- `sessionId` is valid
- localStorage is available

**Postconditions:**
- If progress exists: Returns deserialized ParticipantState
- If no progress: Returns null
- If parse error: Returns null and logs error

**Loop Invariants:** N/A



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Guest Session Creation Without Email/Phone

*For any* valid student name (2-50 characters), creating a guest session should succeed without requiring email or phone fields, and the created session should only contain name and timestamp fields.

**Validates: Requirements 1.1, 1.4**

### Property 2: Name Length Validation

*For any* string input, the system should accept it as a student name if and only if its length is between 2 and 50 characters (inclusive).

**Validates: Requirements 1.2**

### Property 3: Duplicate Names Allowed

*For any* practice session with existing students, attempting to join with a name that already exists should succeed (duplicate names are allowed across different browsers).

**Validates: Requirements 1.3**

### Property 4: LocalStorage Name Persistence Round-Trip

*For any* valid student name and session ID, storing the name to localStorage then retrieving it should return the exact same name.

**Validates: Requirements 1.5, 2.1, 2.2**



### Property 5: PIN Code Generation Format

*For any* newly created practice session, the system should generate a PIN code that is exactly 6 digits long and unique among all active sessions.

**Validates: Requirements 3.1**

### Property 6: QR Code Content Verification

*For any* practice session, the generated QR code should decode to a URL containing both the join page path and the correct PIN code for that session.

**Validates: Requirements 3.2**

### Property 7: QR Code Validity Duration

*For any* practice session, the QR code should remain valid (allow successful joins) from session creation until session end, regardless of time elapsed or number of uses.

**Validates: Requirements 3.3, 3.5**

### Property 8: Unlimited Student Joins

*For any* active practice session and any number of join attempts, all join attempts with valid names should succeed without hitting a participant limit.

**Validates: Requirements 3.4**

### Property 9: Question Consistency Across Attempts

*For any* practice session and any two attempts by the same student, the questions should be identical in content and order.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 10: Attempt Isolation

*For any* student with multiple attempts, each attempt should have a unique attempt ID and be stored separately in the database.

**Validates: Requirements 4.6**



### Property 11: Leaderboard Required Fields

*For any* leaderboard entry, it should contain student name, best score, and attempt count fields.

**Validates: Requirements 5.1, 5.6**

### Property 12: Leaderboard Primary Sort Order

*For any* leaderboard with multiple students, students should be ranked by best score in descending order.

**Validates: Requirements 5.2**

### Property 13: Leaderboard Tie-Breaking

*For any* two students with the same best score, the student with fewer attempts should rank higher; if attempts are also equal, the student with the earlier first attempt timestamp should rank higher.

**Validates: Requirements 5.3, 5.4**

### Property 14: Leaderboard Real-Time Updates

*For any* completed attempt, the leaderboard should reflect the new score and ranking within 2 seconds.

**Validates: Requirements 5.5**

### Property 15: Mobile Responsive Range

*For any* screen width between 320 pixels and 768 pixels, the student interface should render without horizontal scrolling and all interactive elements should be accessible.

**Validates: Requirements 6.2, 6.5, 17.1, 17.4**

### Property 16: Touch Target Minimum Size

*For any* interactive button in the student interface, the touch target size should be at least 44 pixels in both width and height.

**Validates: Requirements 17.2**



### Property 17: Teacher Dashboard Completeness

*For any* active practice session, the teacher dashboard should display total students, total attempts, average score, current leaderboard, PIN code, and QR code.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6**

### Property 18: Practice Analytics Calculation

*For any* practice session with attempts, the analytics should correctly calculate total students, total attempts, average score, average attempts per student, and improvement rate.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.7**

### Property 19: CSV Export Completeness

*For any* practice session, the exported CSV should contain columns for student name, best score, attempts, first attempt date, last attempt date, and improvement percentage.

**Validates: Requirements 9.1, 9.2**

### Property 20: PDF Export Completeness

*For any* practice session, the exported PDF should contain session title, date range, QR code, leaderboard, and analytics summary.

**Validates: Requirements 9.3, 9.4, 9.6**

### Property 21: No Automatic Expiration

*For any* newly created practice session, the system should not set an automatic expiration timestamp, allowing the session to remain active indefinitely until manually ended.

**Validates: Requirements 10.1**

### Property 22: Active Session Accepts Joins

*For any* practice session with status 'active', join attempts with valid names should succeed.

**Validates: Requirements 10.3, 12.5**



### Property 23: Data Retention Until Session End

*For any* active practice session, all attempt data should remain in the database until the teacher manually ends the session.

**Validates: Requirements 10.4**

### Property 24: Archival After Session End

*For any* ended practice session, the system should archive all data to Firestore and retain it for exactly 30 days before deletion.

**Validates: Requirements 10.5, 22.2, 22.3**

### Property 25: No Time Limit Enforcement

*For any* question in a practice attempt, the student should be able to take unlimited time to answer, and submission should succeed regardless of time elapsed.

**Validates: Requirements 11.2**

### Property 26: Progress Auto-Save to LocalStorage

*For any* answer selection during an attempt, the system should immediately save the updated progress to localStorage.

**Validates: Requirements 11.4**

### Property 27: Independent Student Progress

*For any* two students in the same practice session, they should be able to be at different question indices simultaneously without affecting each other.

**Validates: Requirements 12.3**

### Property 28: Results Screen Completeness

*For any* completed attempt, the results screen should display current score, best score, rank, attempt number, question-by-question review, and score history.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**



### Property 29: Database Path Structure

*For any* practice session, the system should use the database paths `practiceSessions/{sessionId}`, `practiceAttempts/{sessionId}`, and `practiceLeaderboard/{sessionId}`.

**Validates: Requirements 15.5**

### Property 30: Attempt Data Structure

*For any* stored attempt, it should contain fields: attemptId, studentName, sessionId, score, correctAnswers, timestamp, and answers array.

**Validates: Requirements 16.1, 16.2**

### Property 31: Best Score Calculation

*For any* student with multiple attempts, the best score should equal the maximum score across all their attempts.

**Validates: Requirements 16.3**

### Property 32: Network Resilience - Progress Preservation

*For any* student who loses network connection mid-attempt, the progress should be saved in localStorage, and upon reconnection, the student should be able to continue from where they left off.

**Validates: Requirements 18.1, 18.2**

### Property 33: Offline Submission Queuing

*For any* attempt submission while offline, the submission should be queued locally, and upon reconnection, should be submitted to the server.

**Validates: Requirements 18.3, 18.4**

### Property 34: Session Configuration Validation

*For any* session configuration, the system should validate that maxQuestions is between 1 and 50, and all boolean settings are valid.

**Validates: Requirements 19.3**



### Property 35: Improvement Percentage Calculation

*For any* student with multiple attempts, the improvement percentage should equal ((bestScore - firstScore) / firstScore) * 100, or 0 if firstScore is 0.

**Validates: Requirements 20.4**

### Property 36: Question Explanation Display

*For any* completed attempt with explanations enabled, the results should display explanations for all questions below each question.

**Validates: Requirements 21.1, 21.2**

### Property 37: Guest Data Isolation

*For any* guest student, their name and session data should only exist in Firebase Realtime Database under session-specific paths, and should never be written to permanent Firestore user collections.

**Validates: Requirements 22.4**

### Property 38: Concurrent Session Limit

*For any* teacher, the system should allow up to 5 active practice sessions simultaneously, and reject attempts to create a 6th session.

**Validates: Requirements 23.1, 23.2**

### Property 39: Leaderboard Update Latency

*For any* completed attempt, the leaderboard should update within 2 seconds to reflect the new score and ranking.

**Validates: Requirements 24.1, 24.2**

### Property 40: Quiz Data Serialization Round-Trip

*For any* valid quiz object, serializing to JSON then parsing back should produce an equivalent object with all required fields (question, options, correctAnswer) intact.

**Validates: Requirements 25.1, 25.2, 25.3, 25.5**



## Error Handling

### Validation Errors

**Invalid PIN**:
```typescript
if (!sessionExists(pin)) {
  throw new ValidationError('Invalid PIN code. Please check and try again.');
}
```

**Invalid Name Length**:
```typescript
if (name.length < 2 || name.length > 50) {
  throw new ValidationError('Name must be between 2 and 50 characters.');
}
```

**Session Ended**:
```typescript
if (session.status === 'ended') {
  throw new ValidationError('This practice session has ended. No new attempts allowed.');
}
```

**Session Limit Reached**:
```typescript
if (teacherActiveSessions.length >= 5) {
  throw new ValidationError('Maximum of 5 active sessions reached. Please end an existing session first.');
}
```



### Network Errors

**Connection Loss During Attempt**:
- Save progress to localStorage immediately
- Display reconnection indicator
- Queue submission if attempt is complete
- Retry with exponential backoff (1s, 2s, 4s, 8s)
- On reconnection, sync progress and submit queued data

**Timeout Errors**:
- Set 10s timeout for all database operations
- Display user-friendly error message
- Provide retry option
- Log error details for debugging

**LocalStorage Errors**:
```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.warn('LocalStorage quota exceeded, clearing old data');
    clearOldPracticeData();
    localStorage.setItem(key, value);
  } else {
    console.error('LocalStorage error:', error);
    // Continue without localStorage (degraded mode)
  }
}
```

### Data Errors

**Missing Competition**:
```typescript
const competition = await getCompetitionById(competitionId);
if (!competition || !competition.questions || competition.questions.length === 0) {
  throw new DataError('Quiz template not found or has no questions.');
}
```

**Corrupted Progress Data**:
```typescript
try {
  const progress = JSON.parse(localStorage.getItem(key));
  validateProgressSchema(progress);
  return progress;
} catch (error) {
  console.error('Corrupted progress data, starting fresh:', error);
  localStorage.removeItem(key);
  return null;
}
```



## Testing Strategy

### Dual Testing Approach

The Practice Live Mode feature requires both unit testing and property-based testing for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and UI component rendering
- **Property tests**: Verify universal properties across all inputs, ensuring correctness at scale

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Unit Testing

**Component Tests**:
- PracticeJoin: PIN validation, name input with localStorage, error messages
- PracticeParticipant: Answer selection, progress save/resume, no timer display
- PracticeResults: Score display, improvement tracking, try again button
- PracticeTeacherDashboard: Analytics display, leaderboard updates, report downloads

**Integration Tests**:
- Session creation flow (admin → competition → practice session)
- Join flow (QR scan → name entry → quiz interface)
- Attempt flow (answer questions → submit → results → try again)
- Leaderboard update flow (submit attempt → calculate score → update leaderboard)

**Edge Cases**:
- Empty leaderboard (no attempts yet)
- Single student with single attempt
- Student with 10+ attempts
- All students with same score (tie-breaking)
- LocalStorage full (quota exceeded)
- Network disconnection during submission
- Browser close mid-attempt
- Session end during active attempt



### Property-Based Testing

**Testing Library**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: practice-live-mode, Property {number}: {property_text}`
- Tests should reference the design document property number

**Example Property Tests**:

```typescript
import fc from 'fast-check';

// Feature: practice-live-mode, Property 2: Name Length Validation
test('Property 2: Name length validation', () => {
  fc.assert(
    fc.property(fc.string(), (name) => {
      const isValid = validateNameLength(name);
      const expectedValid = name.length >= 2 && name.length <= 50;
      expect(isValid).toBe(expectedValid);
    }),
    { numRuns: 100 }
  );
});

// Feature: practice-live-mode, Property 4: LocalStorage Round-Trip
test('Property 4: LocalStorage name persistence round-trip', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 2, maxLength: 50 }),
      fc.string({ minLength: 10, maxLength: 20 }),
      (name, sessionId) => {
        saveNameToLocalStorage(sessionId, name);
        const retrieved = getNameFromLocalStorage(sessionId);
        expect(retrieved).toBe(name);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: practice-live-mode, Property 9: Question Consistency
test('Property 9: Question consistency across attempts', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        question: fc.string(),
        options: fc.array(fc.string(), { minLength: 2, maxLength: 4 }),
        correctAnswer: fc.string()
      }), { minLength: 5, maxLength: 20 }),
      (questions) => {
        const attempt1 = getQuestionsForAttempt(questions, 1);
        const attempt2 = getQuestionsForAttempt(questions, 2);
        expect(attempt1).toEqual(attempt2);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: practice-live-mode, Property 31: Best Score Calculation
test('Property 31: Best score equals maximum across attempts', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 10 }),
      (scores) => {
        const bestScore = calculateBestScore(scores);
        const expectedBest = Math.max(...scores);
        expect(bestScore).toBe(expectedBest);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: practice-live-mode, Property 35: Improvement Calculation
test('Property 35: Improvement percentage calculation', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 100 }),
      fc.integer({ min: 0, max: 100 }),
      (firstScore, bestScore) => {
        fc.pre(bestScore >= firstScore); // Precondition
        const improvement = calculateImprovement(firstScore, bestScore);
        
        if (firstScore === 0) {
          expect(improvement).toBe(0);
        } else {
          const expected = ((bestScore - firstScore) / firstScore) * 100;
          expect(improvement).toBeCloseTo(expected, 1);
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: practice-live-mode, Property 40: Serialization Round-Trip
test('Property 40: Quiz data serialization round-trip', () => {
  fc.assert(
    fc.property(
      fc.record({
        question: fc.string({ minLength: 10 }),
        options: fc.array(fc.string(), { minLength: 2, maxLength: 4 }),
        correctAnswer: fc.string(),
        explanation: fc.string()
      }),
      (quizData) => {
        const serialized = JSON.stringify(quizData);
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(quizData);
      }
    ),
    { numRuns: 100 }
  );
});
```



**Property Test Generators**:

```typescript
// Generate valid student names
const validStudentName = fc.string({ minLength: 2, maxLength: 50 });

// Generate valid PIN codes
const validPIN = fc.integer({ min: 100000, max: 999999 }).map(n => n.toString());

// Generate session IDs
const sessionId = fc.string({ minLength: 10, maxLength: 30 });

// Generate attempt IDs
const attemptId = fc.uuid();

// Generate scores (0-100 per question)
const score = fc.integer({ min: 0, max: 100 });

// Generate questions
const question = fc.record({
  question: fc.string({ minLength: 10 }),
  options: fc.array(fc.string(), { minLength: 2, maxLength: 4 }),
  correctAnswer: fc.string(),
  explanation: fc.string()
});

// Generate practice session
const practiceSession = fc.record({
  id: sessionId,
  pin: validPIN,
  status: fc.constantFrom('active', 'ended'),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  createdAt: fc.integer({ min: 0 }),
  endDate: fc.integer({ min: 0 }),
  settings: fc.record({
    showLeaderboard: fc.boolean(),
    showExplanations: fc.boolean(),
    maxQuestions: fc.integer({ min: 1, max: 50 })
  })
});
```

### End-to-End Testing

**Test Scenarios**:

1. **Happy Path - Full Practice Flow**:
   - Teacher creates practice session
   - Teacher opens dashboard
   - Student 1 joins via QR/PIN
   - Student 1 completes attempt (score: 80)
   - Leaderboard updates
   - Student 1 clicks "Try Again"
   - Student 1 completes second attempt (score: 90)
   - Leaderboard updates with new best score
   - Student 2 joins and completes attempt (score: 85)
   - Leaderboard shows correct rankings
   - Teacher downloads CSV and PDF reports

2. **LocalStorage Persistence**:
   - Student joins session (name: "Alice")
   - Verify localStorage contains name
   - Student closes browser
   - Student reopens join page
   - Verify name is auto-filled from localStorage
   - Student starts quiz
   - Student answers 5 questions
   - Student closes browser mid-attempt
   - Student reopens quiz page
   - Verify resume prompt appears
   - Student resumes from question 6

3. **Network Resilience**:
   - Student starts attempt
   - Student answers 10 questions
   - Simulate network disconnection
   - Student answers remaining 10 questions (saved to localStorage)
   - Student submits attempt (queued)
   - Network reconnects
   - Verify queued submission succeeds
   - Verify leaderboard updates

4. **Multiple Attempts - Same Questions**:
   - Student completes attempt 1
   - Record question order and content
   - Student clicks "Try Again"
   - Verify questions are identical in order and content
   - Student completes attempt 2
   - Verify both attempts stored separately
   - Verify leaderboard shows best score

5. **Session Lifecycle**:
   - Teacher creates session (status: active)
   - Students join and complete attempts
   - Verify data persists in Realtime DB
   - Teacher ends session
   - Verify status changes to 'ended'
   - Verify data archived to Firestore
   - Wait 30 days (simulated)
   - Verify archived data deleted



### Performance Testing

**Load Tests**:
- 100 concurrent students in single session
- 50 students each completing 10 attempts
- Measure leaderboard update latency
- Measure database read/write throughput

**Stress Tests**:
- Rapid attempt submissions (10 students submit within 1 second)
- Rapid joins (50 joins within 10 seconds)
- LocalStorage quota exhaustion
- Network interruption simulation

**Metrics to Track**:
- P50, P95, P99 latency for leaderboard updates
- Time to first byte for Realtime DB updates
- LocalStorage read/write performance
- Memory usage per student session
- Database connection count
- Error rate under load

### Accessibility Testing

**Manual Tests**:
- Screen reader compatibility (results screen)
- Keyboard navigation (quiz interface)
- Color contrast verification
- Font size verification at different zoom levels
- Touch target size on various mobile devices

**Automated Tests**:
- axe-core accessibility checks
- Lighthouse accessibility audit
- Color contrast ratio calculations
- Touch target size measurements



## Implementation Notes

### Phase 1: Foundation (Week 1)

1. **AdminCreateCompetition Extension**:
   - Add "Practice Live Mode" as 4th competition type card
   - Add practice-specific settings panel
   - Update competition creation logic

2. **Data Models**:
   - Create TypeScript interfaces for Practice Live Mode
   - Add database helper functions
   - Implement validation utilities

3. **Service Layer**:
   - Create `practiceService.ts` extending `liveEventService.ts`
   - Implement session CRUD operations
   - Implement attempt submission logic
   - Implement leaderboard calculation

### Phase 2: Core Components (Week 2-3)

1. **PracticeJoin Component**:
   - Adapt from LiveEventJoin.tsx
   - Add localStorage name persistence
   - Remove "event started" check
   - Add session validation

2. **PracticeParticipant Component**:
   - Adapt from LiveEventParticipant.tsx
   - Remove timer display and logic
   - Add progress save/resume from localStorage
   - Remove real-time synchronization
   - Add self-paced navigation

3. **PracticeResults Component**:
   - Create new component
   - Display score and improvement metrics
   - Show question-by-question review
   - Add "Try Again" button
   - Display score history chart

4. **PracticeTeacherDashboard Component**:
   - Create new component
   - Display session info and QR code
   - Show real-time statistics
   - Display leaderboard
   - Add analytics charts
   - Implement report downloads



### Phase 3: Analytics & Reports (Week 4)

1. **Analytics Calculation**:
   - Implement score distribution analysis
   - Calculate improvement rates
   - Identify most missed questions
   - Track peak usage times

2. **Report Generation**:
   - Implement CSV export
   - Implement PDF export with charts
   - Add download functionality
   - Format reports for readability

3. **Charts and Visualizations**:
   - Score distribution histogram
   - Improvement trend line chart
   - Attempt count bar chart
   - Question difficulty analysis

### Phase 4: Polish & Testing (Week 5)

1. **UI/UX Refinements**:
   - Animations and transitions
   - Loading states
   - Error messages
   - Mobile optimizations

2. **Testing**:
   - Unit tests (90%+ coverage)
   - Property-based tests (all 40 properties)
   - Integration tests
   - End-to-end tests
   - Performance tests

3. **Documentation**:
   - Teacher guide
   - Student instructions
   - Admin documentation
   - API documentation



### Dependencies

**New NPM Packages**:
```json
{
  "dependencies": {
    "recharts": "^2.10.0" // Charts for analytics dashboard
  },
  "devDependencies": {
    "fast-check": "^3.15.0" // Property-based testing (if not already installed)
  }
}
```

**Existing Dependencies** (Already Installed):
- `firebase`: ^10.7.0 (Realtime Database + Firestore)
- `qrcode.react`: ^3.1.0 (QR code generation)
- `jspdf`: ^2.5.1 (PDF export)
- `jspdf-autotable`: ^3.8.0 (PDF tables)

**Firebase Configuration**:
- Firebase Realtime Database (already enabled for Live Event Mode)
- Firestore (already configured)
- Security rules update for new database paths

### Firebase Realtime Database Security Rules

```json
{
  "rules": {
    "practiceSessions": {
      "$sessionId": {
        ".read": true,
        ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'super_admin')"
      }
    },
    "practiceAttempts": {
      "$sessionId": {
        ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'super_admin')",
        "$attemptId": {
          ".write": true
        }
      }
    },
    "practiceLeaderboard": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```



### Routing Configuration

**New Routes**:
```typescript
// src/App.tsx
<Route path="/admin/practice/create" element={<AdminCreateCompetition />} />
<Route path="/admin/practice/dashboard/:sessionId" element={<PracticeTeacherDashboard />} />
<Route path="/practice/join" element={<PracticeJoin />} />
<Route path="/practice/quiz/:sessionId" element={<PracticeParticipant />} />
<Route path="/practice/results/:sessionId/:attemptId" element={<PracticeResults />} />
```

### LocalStorage Keys

**Key Format**:
- Student name: `practiceLive_{sessionId}_name`
- Progress: `practiceLive_{sessionId}_progress`
- Attempt history: `practiceLive_{sessionId}_attempts`

**Data Cleanup**:
- Clear progress after successful submission
- Keep name for future attempts
- Clear all data when session ends (optional)

### Monitoring & Observability

**Metrics to Track**:
- Active sessions count
- Students per session
- Attempts per session
- Average session duration
- Average attempts per student
- Leaderboard update latency
- Error rate by type
- LocalStorage usage

**Logging**:
- Session lifecycle (created, ended)
- Attempt submissions
- Leaderboard updates
- Errors and exceptions
- Performance metrics

**Alerts**:
- Leaderboard update latency > 3 seconds
- Error rate > 5%
- Database connection failures
- LocalStorage quota exceeded



## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Advanced Analytics**:
   - Learning curve analysis
   - Time-to-mastery metrics
   - Question difficulty calibration
   - Personalized recommendations

2. **Student Features**:
   - Personal progress dashboard
   - Achievement badges
   - Study streaks
   - Peer comparison (anonymous)

3. **Teacher Features**:
   - Custom question pools
   - Adaptive difficulty
   - Group management
   - Progress reports by student

4. **Integration Features**:
   - Google Classroom integration
   - Canvas LMS integration
   - Email progress reports
   - Parent notifications

5. **Gamification**:
   - Points and levels
   - Leaderboard tiers
   - Daily challenges
   - Team competitions

### Scalability Considerations

**Current Design Limits**:
- 5 active sessions per teacher
- Unlimited students per session
- 30-day data retention after session end

**Future Scaling Options**:
- Increase session limit for premium teachers
- Add session templates for quick creation
- Longer data retention options
- Multi-teacher collaboration on sessions

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Ready for Implementation

