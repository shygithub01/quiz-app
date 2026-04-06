# Live Event Mode - Technical Design Document

## Overview

Live Event Mode is a real-time quiz competition system designed for in-person cultural events where participants use their personal devices while a shared projector displays questions, timers, and live leaderboards. The system enables guest participation without email/phone registration, uses QR codes and PIN codes for easy joining, and provides a dual-screen experience optimized for both elderly attendees (large fonts on projector) and mobile users.

### Key Features

- Guest participation without email/phone registration
- QR code and 6-digit PIN access
- Dual-screen architecture (Projector View + Participant View)
- Real-time synchronization using Firebase Realtime Database
- Live leaderboard with animations
- Fastest finger bonus scoring
- Mobile-responsive participant interface
- Large, accessible projector display for elderly attendees
- Event lobby with participant management
- Synchronized countdown and question transitions
- Results download (CSV/PDF)

### Design Goals

1. **Accessibility**: Large fonts and high contrast for elderly attendees
2. **Simplicity**: No registration barriers for quick event participation
3. **Real-time**: Sub-second synchronization across all devices
4. **Scalability**: Support 50-100 simultaneous participants
5. **Reliability**: Handle network disconnections gracefully
6. **Reusability**: Leverage existing quiz generation and templates


## Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Live Event System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │ Admin Panel  │────────▶│ Event Host   │                      │
│  │ (Create/     │         │ Control      │                      │
│  │  Configure)  │         │ Interface    │                      │
│  └──────────────┘         └──────┬───────┘                      │
│                                   │                               │
│                                   ▼                               │
│                    ┌──────────────────────────┐                  │
│                    │ Firebase Realtime DB     │                  │
│                    │ - Event State            │                  │
│                    │ - Participant Sessions   │                  │
│                    │ - Live Answers           │                  │
│                    │ - Leaderboard Data       │                  │
│                    └────────┬─────────────────┘                  │
│                             │                                     │
│              ┌──────────────┴──────────────┐                    │
│              ▼                              ▼                     │
│   ┌──────────────────┐          ┌──────────────────┐           │
│   │ Projector View   │          │ Participant View │           │
│   │ (Large Screen)   │          │ (Mobile Device)  │           │
│   │ - Questions      │          │ - Questions      │           │
│   │ - Timer          │          │ - Answer Buttons │           │
│   │ - Leaderboard    │          │ - Personal Score │           │
│   │ - QR Code        │          │ - Rank Display   │           │
│   └──────────────────┘          └──────────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Integration with Existing System

Live Event Mode extends the existing quiz platform architecture:

1. **Reuses AdminCreateCompetition.tsx** for question generation
2. **Extends Competition model** with `isLiveEvent` flag
3. **Leverages existing quiz templates** from `quizTemplates` collection
4. **Uses Firebase Realtime Database** (new) alongside Firestore
5. **Adds new routes** for projector and participant views


### Technology Stack

- **Frontend**: React + TypeScript + Vite (existing)
- **UI Components**: Shadcn/ui + Tailwind CSS (existing)
- **Real-time Sync**: Firebase Realtime Database (new)
- **Persistent Storage**: Firebase Firestore (existing)
- **Authentication**: Firebase Auth (existing, but guest sessions bypass it)
- **QR Code Generation**: `qrcode.react` library
- **PDF Generation**: `jspdf` + `jspdf-autotable`
- **CSV Export**: Native JavaScript

### Component Hierarchy

```
App.tsx
├── AdminCreateCompetition.tsx (extended with Live Event toggle)
├── LiveEventHost.tsx (new - host control panel)
├── LiveEventProjector.tsx (new - projector display)
├── LiveEventJoin.tsx (new - participant join page)
├── LiveEventParticipant.tsx (new - participant quiz interface)
└── LiveEventResults.tsx (new - final results display)
```


## Components and Interfaces

### 1. AdminCreateCompetition.tsx (Extended)

**Purpose**: Add "Live Event Mode" toggle to existing competition creation flow

**New Fields**:
```typescript
interface CompetitionFormData {
  // ... existing fields ...
  isLiveEvent: boolean;
  liveEventSettings?: {
    maxParticipants: number; // default: 50, max: 100
    questionTimer: number; // seconds per question (15-120)
    enableFastestFingerBonus: boolean; // default: true
    autoAdvanceOnTimer: boolean; // default: true
  };
}
```

**UI Changes**:
- Add toggle switch: "Enable Live Event Mode"
- When enabled, show additional settings panel
- Validate that event is set to "active" status for live events

### 2. LiveEventHost.tsx (New)

**Purpose**: Host control panel for managing live events

**Features**:
- View event details and PIN code
- See participant list in real-time
- Start/pause/resume event
- Manually advance questions
- Extend timer for current question
- End event early
- Download results (CSV/PDF)

**State Management**:
```typescript
interface HostState {
  event: LiveEvent;
  participants: GuestParticipant[];
  currentPhase: 'lobby' | 'countdown' | 'question' | 'leaderboard' | 'results';
  currentQuestionIndex: number;
  isPaused: boolean;
}
```


### 3. LiveEventProjector.tsx (New)

**Purpose**: Large-screen display for venue attendees

**Phases**:

1. **Lobby Phase**:
   - Display QR code (large, centered)
   - Show PIN code (72px font)
   - List joined participants (scrolling)
   - Show participant count

2. **Countdown Phase**:
   - Display "3-2-1-GO" animation
   - Full-screen countdown numbers (200px font)

3. **Question Phase**:
   - Question text (32px font minimum)
   - Timer (48px font, red when < 10s)
   - "Answered: X/Y" counter
   - Question number indicator

4. **Leaderboard Phase**:
   - Top 5 participants
   - Animated rank changes
   - Score updates with transitions
   - 3-5 second display between questions

5. **Results Phase**:
   - Winner announcement with confetti
   - Top 3 podium visualization
   - Full leaderboard (scrollable)

**Styling Requirements**:
- Minimum font: 24px for all text
- High contrast (7:1 ratio minimum)
- Sans-serif fonts
- Color-blind friendly indicators
- No rapid animations


### 4. LiveEventJoin.tsx (New)

**Purpose**: Participant entry point

**Features**:
- QR code scanner (optional, auto-fills PIN)
- Manual PIN entry (6-digit input)
- Guest name input (2-50 characters)
- Duplicate name validation
- Event status check
- Redirect to participant view on success

**Form Validation**:
```typescript
interface JoinFormValidation {
  pin: string; // 6 digits, required
  name: string; // 2-50 chars, required, unique in event
  eventExists: boolean;
  eventActive: boolean;
  nameAvailable: boolean;
}
```

### 5. LiveEventParticipant.tsx (New)

**Purpose**: Mobile interface for individual participants

**Features**:
- Question display (mobile-optimized)
- Answer buttons (44px minimum touch target)
- Personal score display
- Current rank indicator
- Timer display
- Answer confirmation
- Reconnection handling

**State Management**:
```typescript
interface ParticipantState {
  sessionId: string;
  name: string;
  currentQuestionIndex: number;
  answers: Record<number, string>; // questionIndex -> answer
  score: number;
  rank: number;
  hasAnswered: boolean;
  isConnected: boolean;
}
```

**Mobile Optimizations**:
- Prevent accidental zoom
- Touch-optimized buttons
- Responsive layout (320px - 768px)
- Minimal data usage
- Offline answer queuing


### 6. LiveEventResults.tsx (New)

**Purpose**: Final results display for both projector and participants

**Features**:
- Final leaderboard
- Per-question breakdown
- Correct answer reveal
- Participant performance summary
- Download options (host only)

### 7. Home.tsx (Extended)

**Purpose**: Add Live Events section to landing page

**New Section**:
```tsx
<section className="live-events-section">
  <h2>Join Live Events</h2>
  <p>Participate in real-time quiz competitions at cultural events</p>
  <Button onClick={() => navigate('/live-event/join')}>
    Enter Event PIN
  </Button>
</section>
```


## Data Models

### Firebase Realtime Database Structure

```json
{
  "liveEvents": {
    "{eventId}": {
      "competitionId": "string",
      "pin": "123456",
      "status": "lobby | active | paused | completed",
      "phase": "lobby | countdown | question | leaderboard | results",
      "currentQuestionIndex": 0,
      "timerStartedAt": 1234567890,
      "timerDuration": 30,
      "maxParticipants": 50,
      "settings": {
        "questionTimer": 30,
        "enableFastestFingerBonus": true,
        "autoAdvanceOnTimer": true
      },
      "createdAt": 1234567890,
      "startedAt": 1234567890,
      "endedAt": null
    }
  },
  
  "eventParticipants": {
    "{eventId}": {
      "{sessionId}": {
        "name": "John Doe",
        "joinedAt": 1234567890,
        "isActive": true,
        "lastSeen": 1234567890
      }
    }
  },
  
  "eventAnswers": {
    "{eventId}": {
      "{sessionId}": {
        "{questionIndex}": {
          "answer": "Option A",
          "timestamp": 1234567890,
          "timeToAnswer": 5.2
        }
      }
    }
  },
  
  "eventLeaderboard": {
    "{eventId}": {
      "{sessionId}": {
        "name": "John Doe",
        "score": 150,
        "correctAnswers": 3,
        "fastestFingerBonus": 50,
        "rank": 1,
        "lastUpdated": 1234567890
      }
    }
  }
}
```


### Firestore Collections (Extended)

**competitions** collection (extended):
```typescript
interface Competition {
  // ... existing fields ...
  isLiveEvent: boolean;
  liveEventSettings?: {
    maxParticipants: number;
    questionTimer: number;
    enableFastestFingerBonus: boolean;
    autoAdvanceOnTimer: boolean;
  };
}
```

**liveEventArchive** collection (new):
```typescript
interface LiveEventArchive {
  eventId: string;
  competitionId: string;
  pin: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  participantCount: number;
  results: {
    sessionId: string;
    name: string;
    score: number;
    rank: number;
    answers: Record<number, {
      answer: string;
      correct: boolean;
      timeToAnswer: number;
    }>;
  }[];
  downloadedAt?: Timestamp;
  expiresAt: Timestamp; // 24 hours after event end
}
```

### TypeScript Interfaces

```typescript
interface LiveEvent {
  id: string;
  competitionId: string;
  pin: string;
  status: 'lobby' | 'active' | 'paused' | 'completed';
  phase: 'lobby' | 'countdown' | 'question' | 'leaderboard' | 'results';
  currentQuestionIndex: number;
  timerStartedAt: number | null;
  timerDuration: number;
  maxParticipants: number;
  settings: LiveEventSettings;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
}

interface LiveEventSettings {
  questionTimer: number; // seconds
  enableFastestFingerBonus: boolean;
  autoAdvanceOnTimer: boolean;
}

interface GuestParticipant {
  sessionId: string;
  name: string;
  joinedAt: number;
  isActive: boolean;
  lastSeen: number;
}

interface ParticipantAnswer {
  answer: string;
  timestamp: number;
  timeToAnswer: number; // seconds from question start
}

interface LeaderboardEntry {
  sessionId: string;
  name: string;
  score: number;
  correctAnswers: number;
  fastestFingerBonus: number;
  rank: number;
  lastUpdated: number;
}
```


## State Management

### Real-Time Event State

The system uses Firebase Realtime Database for real-time state synchronization across all connected clients (host, projector, participants).

**State Flow**:
```
Host Control → Realtime DB → Projector View
                           → Participant Views (1-100)
```

**State Updates**:
- Host actions (start, pause, advance) update Realtime DB
- All clients listen to Realtime DB changes
- Updates propagate within 500ms-1s

### Participant Answer Tracking

**Answer Submission Flow**:
1. Participant selects answer
2. Answer + timestamp written to Realtime DB
3. Projector counter updates
4. Score calculation triggered
5. Leaderboard updates

**Answer Immutability**:
- Once submitted, answers cannot be changed
- Timestamp recorded for fastest finger calculation
- Answers locked when timer expires

### Leaderboard Updates

**Scoring Algorithm**:
```typescript
function calculateScore(
  answers: ParticipantAnswer[],
  questions: Question[],
  allAnswers: Map<number, ParticipantAnswer[]>
): number {
  let score = 0;
  
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    const question = questions[i];
    
    // Base points for correct answer
    if (answer.answer === question.correctAnswer) {
      score += 100;
      
      // Fastest finger bonus (if enabled)
      const questionAnswers = allAnswers.get(i) || [];
      const correctAnswers = questionAnswers
        .filter(a => a.answer === question.correctAnswer)
        .sort((a, b) => a.timeToAnswer - b.timeToAnswer);
      
      const rank = correctAnswers.findIndex(a => a.timestamp === answer.timestamp);
      if (rank === 0) score += 50; // Fastest
      else if (rank === 1) score += 30; // Second
      else if (rank === 2) score += 10; // Third
    }
  }
  
  return score;
}
```

**Rank Calculation**:
- Sort by score (descending)
- Ties broken by total time to answer (ascending)
- Recalculated after each question


### Timer Synchronization

**Timer Implementation**:
```typescript
interface TimerState {
  startedAt: number; // Unix timestamp
  duration: number; // seconds
  isPaused: boolean;
  pausedAt: number | null;
  pausedDuration: number; // accumulated pause time
}

function getRemainingTime(timer: TimerState): number {
  if (timer.isPaused && timer.pausedAt) {
    const elapsed = timer.pausedAt - timer.startedAt - timer.pausedDuration;
    return Math.max(0, timer.duration - elapsed / 1000);
  }
  
  const now = Date.now();
  const elapsed = now - timer.startedAt - timer.pausedDuration;
  return Math.max(0, timer.duration - elapsed / 1000);
}
```

**Timer Synchronization**:
- Server timestamp used as source of truth
- Clients calculate remaining time locally
- Periodic sync every 5 seconds to prevent drift
- Red warning when < 10 seconds remaining


## API Design

### Firebase Realtime Database Listeners

**Event State Listener** (All Clients):
```typescript
const eventRef = ref(realtimeDb, `liveEvents/${eventId}`);
onValue(eventRef, (snapshot) => {
  const event = snapshot.val();
  updateLocalState(event);
});
```

**Participants Listener** (Host & Projector):
```typescript
const participantsRef = ref(realtimeDb, `eventParticipants/${eventId}`);
onValue(participantsRef, (snapshot) => {
  const participants = snapshot.val();
  updateParticipantList(participants);
});
```

**Answers Listener** (Host & Projector):
```typescript
const answersRef = ref(realtimeDb, `eventAnswers/${eventId}`);
onValue(answersRef, (snapshot) => {
  const answers = snapshot.val();
  updateAnswerCount(answers);
  recalculateLeaderboard(answers);
});
```

**Leaderboard Listener** (All Clients):
```typescript
const leaderboardRef = ref(realtimeDb, `eventLeaderboard/${eventId}`);
onValue(leaderboardRef, (snapshot) => {
  const leaderboard = snapshot.val();
  updateLeaderboardDisplay(leaderboard);
});
```

### Firebase Realtime Database Writers

**Create Event** (Host):
```typescript
async function createLiveEvent(competitionId: string): Promise<string> {
  const eventId = generateEventId();
  const pin = generatePIN();
  
  await set(ref(realtimeDb, `liveEvents/${eventId}`), {
    competitionId,
    pin,
    status: 'lobby',
    phase: 'lobby',
    currentQuestionIndex: 0,
    timerStartedAt: null,
    timerDuration: 30,
    maxParticipants: 50,
    settings: {
      questionTimer: 30,
      enableFastestFingerBonus: true,
      autoAdvanceOnTimer: true
    },
    createdAt: serverTimestamp(),
    startedAt: null,
    endedAt: null
  });
  
  return eventId;
}
```

**Join Event** (Participant):
```typescript
async function joinEvent(eventId: string, name: string): Promise<string> {
  const sessionId = generateSessionId();
  
  // Check if name is unique
  const participantsSnapshot = await get(
    ref(realtimeDb, `eventParticipants/${eventId}`)
  );
  const participants = participantsSnapshot.val() || {};
  
  if (Object.values(participants).some((p: any) => p.name === name)) {
    throw new Error('Name already taken');
  }
  
  // Add participant
  await set(
    ref(realtimeDb, `eventParticipants/${eventId}/${sessionId}`),
    {
      name,
      joinedAt: serverTimestamp(),
      isActive: true,
      lastSeen: serverTimestamp()
    }
  );
  
  return sessionId;
}
```

**Submit Answer** (Participant):
```typescript
async function submitAnswer(
  eventId: string,
  sessionId: string,
  questionIndex: number,
  answer: string,
  timeToAnswer: number
): Promise<void> {
  await set(
    ref(realtimeDb, `eventAnswers/${eventId}/${sessionId}/${questionIndex}`),
    {
      answer,
      timestamp: serverTimestamp(),
      timeToAnswer
    }
  );
}
```

**Update Event Phase** (Host):
```typescript
async function updateEventPhase(
  eventId: string,
  phase: string,
  additionalUpdates?: Record<string, any>
): Promise<void> {
  await update(ref(realtimeDb, `liveEvents/${eventId}`), {
    phase,
    ...additionalUpdates
  });
}
```


### Guest Authentication Flow

```
┌─────────────┐
│ Scan QR or  │
│ Enter PIN   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Validate    │
│ PIN exists  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Enter Name  │
│ (2-50 char) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Check Name  │
│ Uniqueness  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Create      │
│ Session     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Redirect to │
│ Participant │
│ View        │
└─────────────┘
```

**Session Management**:
- Session ID stored in localStorage
- Heartbeat every 30 seconds to update `lastSeen`
- Inactive after 60 seconds of no heartbeat
- Session deleted when event ends

### QR Code Generation

```typescript
function generateEventQR(eventId: string, pin: string): string {
  const url = `${window.location.origin}/live-event/join?pin=${pin}`;
  return url; // Pass to QRCode component
}
```

**QR Code Component**:
```tsx
import QRCode from 'qrcode.react';

<QRCode
  value={generateEventQR(eventId, pin)}
  size={256}
  level="H"
  includeMargin={true}
/>
```


### Results Download

**CSV Export**:
```typescript
function exportToCSV(results: LiveEventArchive): string {
  const headers = ['Rank', 'Name', 'Score', 'Correct Answers', 'Fastest Finger Bonus'];
  const rows = results.results.map(r => [
    r.rank,
    r.name,
    r.score,
    Object.values(r.answers).filter(a => a.correct).length,
    r.score - (Object.values(r.answers).filter(a => a.correct).length * 100)
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
  
  return csv;
}
```

**PDF Export**:
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function exportToPDF(results: LiveEventArchive): void {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Live Event Results', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Event: ${results.competitionId}`, 14, 30);
  doc.text(`Date: ${new Date(results.startedAt).toLocaleString()}`, 14, 37);
  doc.text(`Participants: ${results.participantCount}`, 14, 44);
  
  autoTable(doc, {
    startY: 50,
    head: [['Rank', 'Name', 'Score', 'Correct', 'Bonus']],
    body: results.results.map(r => [
      r.rank,
      r.name,
      r.score,
      Object.values(r.answers).filter(a => a.correct).length,
      r.score - (Object.values(r.answers).filter(a => a.correct).length * 100)
    ])
  });
  
  doc.save(`live-event-results-${results.eventId}.pdf`);
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Guest Session Creation Without Email/Phone

*For any* valid guest name (2-50 characters), creating a guest session should succeed without requiring email or phone fields, and the created session should only contain name, joinedAt, isActive, and lastSeen fields.

**Validates: Requirements 1.1, 1.5**

### Property 2: Name Length Validation

*For any* string input, the system should accept it as a guest name if and only if its length is between 2 and 50 characters (inclusive).

**Validates: Requirements 1.2**

### Property 3: Name Uniqueness Within Event

*For any* live event with existing participants, attempting to join with a name that already exists in that event should be rejected, while joining with a unique name should succeed.

**Validates: Requirements 1.3**

### Property 4: Guest Data Cleanup on Event End

*For any* live event with guest participants, when the event ends, all guest session data should be deleted from the Realtime Database within 60 seconds.

**Validates: Requirements 1.4, 16.1**

### Property 5: PIN Code Generation

*For any* newly created live event, the system should generate a PIN code that is exactly 6 digits long and unique among all active events.

**Validates: Requirements 2.1**


### Property 6: QR Code Content Verification

*For any* live event, the generated QR code should decode to a URL containing both the join page path and the correct PIN code for that event.

**Validates: Requirements 2.2, 2.4**

### Property 7: PIN Validation

*For any* PIN code input, the system should grant access if the PIN matches an active event, and display an error message if the PIN is invalid or the event is not active.

**Validates: Requirements 2.5, 2.6**

### Property 8: Projector View Font Size Minimum

*For any* text element in the Projector View, the computed font size should be at least 24 pixels, with question text at least 32 pixels and timer at least 48 pixels.

**Validates: Requirements 3.1, 6.2, 7.3**

### Property 9: View Synchronization Latency

*For any* state change initiated by the host (question display, phase transition), both Projector View and all Participant Views should reflect the change within 500 milliseconds.

**Validates: Requirements 3.5, 6.1**

### Property 10: Answer Selection Privacy

*For any* participant answer submission, the Projector View should never display which specific participant selected which answer, only aggregate counts.

**Validates: Requirements 3.6**

### Property 11: Participant List Update Latency

*For any* participant join event, the Projector View participant list should update within 1 second of the join.

**Validates: Requirements 4.2, 13.4**


### Property 12: Participant Counter Format

*For any* event state, the Projector View participant counter should display in the format "X/Y joined" where X is the current participant count and Y is the maximum participant limit.

**Validates: Requirements 4.3**

### Property 13: Host Participant Management

*For any* participant in the event lobby, the host should be able to view their details and remove them, and removal should update the participant list immediately.

**Validates: Requirements 4.4, 4.5**

### Property 14: Lobby Closure on Start

*For any* event in lobby phase, when the host starts the competition, the system should transition to countdown phase and reject any new join attempts with an appropriate error message.

**Validates: Requirements 4.6**

### Property 15: Countdown Synchronization

*For any* countdown sequence, both Projector View and all Participant Views should display the same countdown value (3, 2, 1, GO) at the same time, with each value displayed for exactly 1 second (±100ms tolerance).

**Validates: Requirements 5.2, 5.3**

### Property 16: Countdown to Competition Transition

*For any* countdown sequence, the system should transition from "GO" to displaying the first question within 500 milliseconds.

**Validates: Requirements 5.4**

### Property 17: Answer Timestamp Recording

*For any* answer submission, the system should record a timestamp accurate to the millisecond, which is used for fastest finger bonus calculation.

**Validates: Requirements 6.4**


### Property 18: Answer Immutability

*For any* participant who has submitted an answer to a question, any subsequent attempt to change that answer should be rejected, ensuring the first answer is preserved.

**Validates: Requirements 6.5**

### Property 19: Answer Counter Accuracy

*For any* question during the competition, the Projector View "Answered: X/Y" counter should accurately reflect the number of participants who have submitted answers (X) out of total active participants (Y).

**Validates: Requirements 6.6**

### Property 20: Timer Duration Configuration

*For any* timer duration input, the system should accept values between 15 and 120 seconds (inclusive) and reject values outside this range.

**Validates: Requirements 7.1**

### Property 21: Timer Auto-Start

*For any* question display event, the timer should start counting down immediately, with the start timestamp recorded in the database.

**Validates: Requirements 7.2**

### Property 22: Timer Warning Color

*For any* timer state, when the remaining time is 10 seconds or less, the timer display should change to red color, otherwise it should use the default color.

**Validates: Requirements 7.4**

### Property 23: Answer Submission After Timer Expiry

*For any* answer submission attempt, if the submission timestamp is after the timer expiry time, the submission should be rejected.

**Validates: Requirements 7.5**


### Property 24: Timer Auto-Advance

*For any* question with auto-advance enabled, the system should automatically transition to the next question (or leaderboard phase) exactly 3 seconds (±200ms) after the timer expires.

**Validates: Requirements 7.6**

### Property 25: Manual Question Advance

*For any* active question, the host should be able to manually advance to the next question before the timer expires, and this should immediately update all views.

**Validates: Requirements 7.7, 14.3**

### Property 26: Leaderboard Top 5 Display

*For any* leaderboard state with more than 5 participants, the Projector View should display exactly the top 5 participants by score (with ties broken by time), and if there are 5 or fewer participants, all should be displayed.

**Validates: Requirements 8.1**

### Property 27: Leaderboard Update Latency

*For any* answer submission that changes scores, the leaderboard should update within 2 seconds to reflect the new scores and rankings.

**Validates: Requirements 8.2**

### Property 28: Leaderboard Animation Duration

*For any* leaderboard animation between questions, the animation should last between 3 and 5 seconds before transitioning to the next question.

**Validates: Requirements 8.5**

### Property 29: Correct Answer Scoring

*For any* participant answer that matches the correct answer for a question, the participant should receive exactly 100 base points for that question.

**Validates: Requirements 9.1**


### Property 30: Incorrect Answer Scoring

*For any* participant answer that does not match the correct answer for a question, the participant should receive exactly 0 points for that question (no base points, no bonus).

**Validates: Requirements 9.2**

### Property 31: Fastest Finger Bonus Distribution

*For any* question with correct answers, when fastest finger bonus is enabled, the fastest correct answer should receive +50 points, the second fastest +30 points, the third fastest +10 points, and all others +0 bonus points.

**Validates: Requirements 9.3, 9.4, 9.5**

### Property 32: Bonus Only for Correct Answers

*For any* incorrect answer, regardless of how fast it was submitted, the participant should receive 0 bonus points (fastest finger bonus only applies to correct answers).

**Validates: Requirements 9.6**

### Property 33: Real-Time Score Updates

*For any* question completion, all participant scores should be recalculated and updated in the leaderboard within 2 seconds of the question ending.

**Validates: Requirements 9.7**

### Property 34: Correct Answer Concealment During Competition

*For any* question during the competition phase (before results phase), the correct answer should not be visible in any view (projector or participant).

**Validates: Requirements 10.1**

### Property 35: Transition to Results Phase

*For any* event where the final question is completed, the system should automatically transition to the results phase.

**Validates: Requirements 10.2**


### Property 36: Answer Highlighting in Results

*For any* participant's results view, correct answers should be highlighted in green, incorrect answers selected by the participant should be highlighted in red, and unselected options should have neutral styling.

**Validates: Requirements 10.5**

### Property 37: Results Font Size

*For any* text in the Projector View results display, the font size should be at least 36 pixels.

**Validates: Requirements 11.1**

### Property 38: CSV Export Completeness

*For any* event results exported to CSV, the file should contain all participants with their name, final score, rank, and per-question performance (correct/incorrect, time taken).

**Validates: Requirements 11.5, 11.7**

### Property 39: PDF Export Completeness

*For any* event results exported to PDF, the file should contain all participants with their name, final score, rank, and per-question performance in a readable table format.

**Validates: Requirements 11.6, 11.7**

### Property 40: Quiz Template Integration

*For any* quiz template created through AdminCreateCompetition.tsx, the template should be usable for creating a live event, and all questions should be accessible during the live event.

**Validates: Requirements 12.1, 12.2**

### Property 41: Configuration Reuse

*For any* live event created from an existing competition, the subject distribution and difficulty settings from the original competition should be preserved and applied to the live event.

**Validates: Requirements 12.3, 12.4**


### Property 42: Live Mode Real-Time Configuration

*For any* competition with "Live Event Mode" enabled, the system should configure Firebase Realtime Database listeners and disable Firestore-based participant tracking.

**Validates: Requirements 12.6**

### Property 43: Participant Capacity

*For any* live event, the system should support between 50 and 100 simultaneous participants without degradation in synchronization performance (updates within 1 second).

**Validates: Requirements 13.2**

### Property 44: Host Control Synchronization

*For any* host control action (pause, resume, skip, extend timer, end early), all participant views should reflect the change within 1 second.

**Validates: Requirements 13.3, 14.6**

### Property 45: Network Disconnection Handling

*For any* participant who loses network connection, the Participant View should display a reconnection indicator, and upon reconnection within 60 seconds, the session state should be restored.

**Validates: Requirements 13.5, 13.6, 19.1, 19.2**

### Property 46: Participant Inactivity Timeout

*For any* participant who has not sent a heartbeat for more than 60 seconds, the system should mark them as inactive in the participant list.

**Validates: Requirements 19.3**

### Property 47: Offline Answer Queuing

*For any* answer submission attempted while offline, the answer should be queued locally, and upon reconnection, if the timer has not expired, the answer should be submitted to the server.

**Validates: Requirements 19.4, 19.5**


### Property 48: Pause and Resume Functionality

*For any* active event, the host should be able to pause the competition (freezing the timer), and subsequently resume it (continuing the timer from where it paused), with both actions synchronizing to all views within 1 second.

**Validates: Requirements 14.1, 14.2**

### Property 49: Timer Extension

*For any* active question timer, the host should be able to extend the timer by a specified duration, and the new remaining time should be reflected in all views within 1 second.

**Validates: Requirements 14.4**

### Property 50: Early Event Termination

*For any* active event, the host should be able to end the event early, which should immediately transition all views to the results phase and trigger data cleanup.

**Validates: Requirements 14.5**

### Property 51: Single Active Event Constraint

*For any* system state, there should be at most one active live event at any time, and attempting to create a second active event should fail with an error message.

**Validates: Requirements 15.1, 15.2**

### Property 52: Event Creation After Completion

*For any* completed event, the system should allow creation of a new live event within 5 seconds of the previous event ending.

**Validates: Requirements 15.3**

### Property 53: Event Inactivity Timeout

*For any* event that has had no activity (no host actions, no participant joins/answers) for 4 hours, the system should automatically mark the event as inactive.

**Validates: Requirements 15.4**


### Property 54: Results Retention Period

*For any* completed event, the results should remain available for host download for exactly 24 hours, after which they should be automatically deleted.

**Validates: Requirements 16.2, 16.3**

### Property 55: Guest Data Isolation

*For any* guest participant, their name and session data should only exist in Firebase Realtime Database under the event-specific paths, and should never be written to permanent Firestore collections (users, participants, etc.).

**Validates: Requirements 16.4**

### Property 56: Anonymous Event Statistics

*For any* event completion, the system should log statistics (participant count, duration, average score) without including any personally identifiable information (names, session IDs).

**Validates: Requirements 16.5**

### Property 57: Mobile Responsive Range

*For any* screen width between 320 pixels and 768 pixels, the Participant View should render without horizontal scrolling and all interactive elements should be accessible.

**Validates: Requirements 17.1, 17.4**

### Property 58: Touch Target Minimum Size

*For any* interactive button in the Participant View, the touch target size should be at least 44 pixels in both width and height.

**Validates: Requirements 17.2**

### Property 59: Orientation Change Adaptation

*For any* device orientation change, the Participant View should adapt its layout within 500 milliseconds without losing state or requiring page reload.

**Validates: Requirements 17.5**


### Property 60: Color Contrast Accessibility

*For any* text and background color combination in the Projector View, the contrast ratio should be at least 7:1 to meet WCAG AAA standards.

**Validates: Requirements 18.1**

### Property 61: Sans-Serif Font Usage

*For any* text element in the Projector View, the font-family should be a sans-serif font (e.g., Arial, Helvetica, system-ui).

**Validates: Requirements 18.2**

### Property 62: Question Number Display Format

*For any* question displayed in the Projector View, the question number should be shown in the format "Question X of Y" where X is the current question number and Y is the total number of questions.

**Validates: Requirements 18.3**

### Property 63: Color-Blind Friendly Indicators

*For any* status indicator in the Projector View, the indicator should use both color and a non-color cue (icon, text, pattern) to convey status, ensuring color-blind users can distinguish states.

**Validates: Requirements 18.4**

### Property 64: Event Configuration Validation

*For any* event configuration, the host should be able to set event title, select quiz template, configure timer duration (15-120s), set participant limit (1-100, default 50), and toggle fastest finger bonus, with all values validated before event creation.

**Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5**

### Property 65: Projector View Preview

*For any* configured event before it starts, the host should be able to preview the Projector View, which should display the lobby screen with QR code and PIN without actually creating an active event.

**Validates: Requirements 20.6**


## Error Handling

### Network Errors

**Connection Loss**:
- Display reconnection indicator
- Queue actions locally
- Retry with exponential backoff (1s, 2s, 4s, 8s)
- After 60s, mark participant as inactive
- On reconnection, sync state and submit queued actions

**Timeout Errors**:
- Set 10s timeout for all database operations
- Display user-friendly error message
- Provide retry option
- Log error details for debugging

### Validation Errors

**Invalid PIN**:
```typescript
if (!eventExists(pin)) {
  throw new ValidationError('Invalid PIN code. Please check and try again.');
}
```

**Duplicate Name**:
```typescript
if (nameExists(eventId, name)) {
  throw new ValidationError('This name is already taken. Please choose another name.');
}
```

**Event Full**:
```typescript
if (participantCount >= maxParticipants) {
  throw new ValidationError('This event is full. Maximum participants reached.');
}
```

**Event Not in Lobby**:
```typescript
if (event.status !== 'lobby') {
  throw new ValidationError('This event has already started. New participants cannot join.');
}
```


### State Errors

**Concurrent Event Creation**:
```typescript
const activeEvents = await getActiveEvents();
if (activeEvents.length > 0) {
  throw new StateError('Another live event is currently active. Please wait for it to end.');
}
```

**Invalid Phase Transition**:
```typescript
const validTransitions = {
  'lobby': ['countdown'],
  'countdown': ['question'],
  'question': ['leaderboard', 'results'],
  'leaderboard': ['question', 'results'],
  'results': []
};

if (!validTransitions[currentPhase].includes(newPhase)) {
  throw new StateError(`Cannot transition from ${currentPhase} to ${newPhase}`);
}
```

**Answer After Timer Expiry**:
```typescript
if (Date.now() > timerExpiryTime) {
  throw new StateError('Time has expired. Answer cannot be submitted.');
}
```

### Data Errors

**Missing Quiz Template**:
```typescript
const template = await getQuizTemplate(competitionId);
if (!template || !template.questions || template.questions.length === 0) {
  throw new DataError('Quiz template not found or has no questions.');
}
```

**Corrupted Event Data**:
```typescript
try {
  const event = await getEvent(eventId);
  validateEventSchema(event);
} catch (error) {
  throw new DataError('Event data is corrupted. Please create a new event.');
}
```

### Error Recovery Strategies

1. **Automatic Retry**: Network errors, timeout errors
2. **User Retry**: Validation errors with correctable input
3. **Graceful Degradation**: Show cached data if real-time updates fail
4. **Admin Intervention**: State errors, data corruption
5. **Event Restart**: Unrecoverable errors in active event


## Testing Strategy

### Dual Testing Approach

The Live Event Mode feature requires both unit testing and property-based testing for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and UI component rendering
- **Property tests**: Verify universal properties across all inputs, ensuring correctness at scale

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Unit Testing

**Component Tests**:
- LiveEventJoin: PIN validation, name input, error messages
- LiveEventProjector: Phase rendering, font sizes, QR code display
- LiveEventParticipant: Answer submission, timer display, reconnection UI
- LiveEventHost: Control panel actions, participant management

**Integration Tests**:
- Event creation flow (admin → competition → live event)
- Join flow (QR scan → name entry → participant view)
- Question flow (display → answer → leaderboard → next)
- Results flow (final question → results → download)

**Edge Cases**:
- Empty participant list
- Single participant
- Maximum participants (100)
- Timer at 0 seconds
- All participants answer incorrectly
- Network disconnection during answer submission
- Event end during active question


### Property-Based Testing

**Testing Library**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: live-event-mode, Property {number}: {property_text}`
- Tests should reference the design document property number

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: live-event-mode, Property 2: Name Length Validation
test('Property 2: Name length validation', () => {
  fc.assert(
    fc.property(fc.string(), (name) => {
      const isValid = validateGuestName(name);
      const expectedValid = name.length >= 2 && name.length <= 50;
      expect(isValid).toBe(expectedValid);
    }),
    { numRuns: 100 }
  );
});

// Feature: live-event-mode, Property 29: Correct Answer Scoring
test('Property 29: Correct answer scoring', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        question: fc.string(),
        options: fc.array(fc.string(), { minLength: 2, maxLength: 4 }),
        correctAnswer: fc.string()
      })),
      fc.array(fc.string()),
      (questions, answers) => {
        const score = calculateScore(answers, questions);
        const correctCount = answers.filter((a, i) => 
          a === questions[i]?.correctAnswer
        ).length;
        expect(score).toBeGreaterThanOrEqual(correctCount * 100);
      }
    ),
    { numRuns: 100 }
  );
});
```


**Property Test Generators**:

```typescript
// Generate valid guest names
const validGuestName = fc.string({ minLength: 2, maxLength: 50 });

// Generate valid PIN codes
const validPIN = fc.integer({ min: 100000, max: 999999 }).map(n => n.toString());

// Generate timer durations
const validTimerDuration = fc.integer({ min: 15, max: 120 });

// Generate participant counts
const validParticipantCount = fc.integer({ min: 1, max: 100 });

// Generate event phases
const eventPhase = fc.constantFrom('lobby', 'countdown', 'question', 'leaderboard', 'results');

// Generate questions
const question = fc.record({
  question: fc.string({ minLength: 10 }),
  options: fc.array(fc.string(), { minLength: 2, maxLength: 4 }),
  correctAnswer: fc.string()
});

// Generate participant answers with timestamps
const participantAnswer = fc.record({
  answer: fc.string(),
  timestamp: fc.integer({ min: 0 }),
  timeToAnswer: fc.float({ min: 0.1, max: 120 })
});
```

### Performance Testing

**Load Tests**:
- 50 concurrent participants (minimum requirement)
- 100 concurrent participants (maximum capacity)
- Measure synchronization latency under load
- Measure database read/write throughput

**Stress Tests**:
- Rapid answer submissions (all participants answer within 1 second)
- Rapid participant joins (50 joins within 10 seconds)
- Network interruption simulation
- Database connection pool exhaustion

**Metrics to Track**:
- P50, P95, P99 latency for state updates
- Time to first byte for Realtime DB updates
- Memory usage per participant
- Database connection count
- Error rate under load


### End-to-End Testing

**Test Scenarios**:

1. **Happy Path - Full Event Flow**:
   - Admin creates live event
   - Host opens projector view
   - 10 participants join via QR/PIN
   - Host starts event
   - Countdown displays
   - 5 questions answered by all participants
   - Leaderboard updates between questions
   - Results displayed
   - Host downloads CSV and PDF

2. **Late Joiner Rejection**:
   - Event in lobby
   - Participant 1 joins successfully
   - Host starts event
   - Participant 2 attempts to join
   - Verify rejection with error message

3. **Network Resilience**:
   - Participant joins and answers 2 questions
   - Simulate network disconnection
   - Participant attempts to answer question 3 (queued)
   - Network reconnects
   - Verify queued answer submitted
   - Verify session state restored

4. **Concurrent Event Prevention**:
   - Admin creates Event A
   - Event A is active
   - Admin attempts to create Event B
   - Verify error message
   - Event A ends
   - Admin creates Event B successfully

5. **Data Cleanup**:
   - Event with 20 participants completes
   - Verify guest data exists in Realtime DB
   - Wait 60 seconds
   - Verify guest data deleted from Realtime DB
   - Verify results archived in Firestore
   - Wait 24 hours (simulated)
   - Verify archived results deleted

### Accessibility Testing

**Manual Tests**:
- Screen reader compatibility (projector view announcements)
- Keyboard navigation (participant view)
- Color contrast verification (automated + manual)
- Font size verification at different zoom levels
- Touch target size on various mobile devices

**Automated Tests**:
- axe-core accessibility checks
- Lighthouse accessibility audit
- Color contrast ratio calculations
- Font size measurements


## Implementation Notes

### Phase 1: Foundation (Week 1-2)

1. **Firebase Realtime Database Setup**:
   - Enable Realtime Database in Firebase Console
   - Configure security rules
   - Add Realtime Database SDK to project

2. **Data Models**:
   - Create TypeScript interfaces
   - Implement database helper functions
   - Add validation utilities

3. **AdminCreateCompetition Extension**:
   - Add "Live Event Mode" toggle
   - Add live event settings panel
   - Update competition creation logic

### Phase 2: Core Components (Week 3-4)

1. **LiveEventHost Component**:
   - Event creation flow
   - Participant management
   - Control panel (start, pause, advance, end)

2. **LiveEventProjector Component**:
   - Lobby phase UI
   - Countdown animation
   - Question display
   - Leaderboard display
   - Results display

3. **LiveEventJoin Component**:
   - PIN entry form
   - Name validation
   - QR code scanning (optional)

4. **LiveEventParticipant Component**:
   - Question display
   - Answer submission
   - Personal score/rank display
   - Reconnection handling

### Phase 3: Real-Time Sync (Week 5)

1. **State Synchronization**:
   - Implement Realtime DB listeners
   - Handle state updates
   - Manage subscriptions/unsubscriptions

2. **Timer System**:
   - Server-based timer
   - Client-side countdown
   - Sync mechanism

3. **Leaderboard Calculation**:
   - Score calculation logic
   - Rank calculation
   - Real-time updates


### Phase 4: Polish & Testing (Week 6-7)

1. **UI/UX Refinements**:
   - Animations and transitions
   - Loading states
   - Error messages
   - Accessibility improvements

2. **Results & Export**:
   - Results display
   - CSV export
   - PDF export
   - Data archival

3. **Testing**:
   - Unit tests
   - Property-based tests
   - Integration tests
   - Load testing

4. **Documentation**:
   - User guide for hosts
   - Participant instructions
   - Admin documentation

### Dependencies

**New NPM Packages**:
```json
{
  "dependencies": {
    "firebase": "^10.7.0", // Already installed, ensure Realtime DB enabled
    "qrcode.react": "^3.1.0", // QR code generation
    "jspdf": "^2.5.1", // PDF export
    "jspdf-autotable": "^3.8.0" // PDF tables
  },
  "devDependencies": {
    "fast-check": "^3.15.0" // Property-based testing
  }
}
```

**Firebase Configuration**:
- Enable Firebase Realtime Database
- Configure security rules
- Set up database indexes (if needed)

**Environment Variables**:
```
VITE_FIREBASE_DATABASE_URL=https://[project-id].firebaseio.com
```


### Firebase Realtime Database Security Rules

```json
{
  "rules": {
    "liveEvents": {
      "$eventId": {
        ".read": true,
        ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'super_admin')"
      }
    },
    "eventParticipants": {
      "$eventId": {
        ".read": true,
        "$sessionId": {
          ".write": true
        }
      }
    },
    "eventAnswers": {
      "$eventId": {
        ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'super_admin')",
        "$sessionId": {
          ".read": true,
          ".write": true
        }
      }
    },
    "eventLeaderboard": {
      "$eventId": {
        ".read": true,
        ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'super_admin')"
      }
    }
  }
}
```

### Routing Configuration

**New Routes**:
```typescript
// src/App.tsx
<Route path="/admin/live-event/create" element={<LiveEventHost />} />
<Route path="/live-event/projector/:eventId" element={<LiveEventProjector />} />
<Route path="/live-event/join" element={<LiveEventJoin />} />
<Route path="/live-event/participate/:eventId/:sessionId" element={<LiveEventParticipant />} />
<Route path="/live-event/results/:eventId" element={<LiveEventResults />} />
```

### Monitoring & Observability

**Metrics to Track**:
- Active events count
- Participants per event
- Average event duration
- Answer submission rate
- Synchronization latency (P50, P95, P99)
- Error rate by type
- Database read/write operations

**Logging**:
- Event lifecycle (created, started, ended)
- Participant joins/leaves
- Answer submissions
- Host control actions
- Errors and exceptions

**Alerts**:
- Synchronization latency > 2 seconds
- Error rate > 5%
- Database connection failures
- Event stuck in active state > 4 hours


## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Multi-Language Support**:
   - Internationalization for UI
   - Support for non-English questions
   - RTL language support

2. **Advanced Analytics**:
   - Question difficulty analysis
   - Participant engagement metrics
   - Time-to-answer distribution
   - Drop-off analysis

3. **Enhanced Projector Features**:
   - Multiple projector views (split screen)
   - Custom branding/themes
   - Sponsor logo display
   - Background music

4. **Participant Features**:
   - Avatar selection
   - Achievement badges
   - Personal statistics
   - Practice mode

5. **Host Features**:
   - Question pool randomization
   - Dynamic difficulty adjustment
   - Team mode (group participants)
   - Custom scoring rules

6. **Integration Features**:
   - Zoom/Teams integration for virtual events
   - Social media sharing
   - Email results to participants
   - SMS notifications

### Scalability Considerations

**Current Design Limits**:
- 100 participants per event
- 1 active event at a time
- 24-hour result retention

**Future Scaling Options**:
- Multiple concurrent events (requires event isolation)
- 500+ participants (requires sharding strategy)
- Longer result retention (requires archival strategy)
- Multi-region deployment (requires geo-replication)

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Ready for Implementation

