# Competition Mode & Leaderboard Feature Specification

## Overview
Add competition mode where students compete for scholarships based on quiz performance (accuracy + speed). Include a real-time leaderboard showing rankings.

## Current State
- Tag: `timing-feature-complete`
- Quiz timing working (tracks completion time)
- Practice mode only (unlimited attempts)
- No competition or ranking system

## Goals

### Primary Goals
1. Create scheduled competitions with prize pools
2. Track student performance in competitions
3. Display real-time leaderboard with rankings
4. Determine winners based on score + speed

### User Experience
- **Students**: See available competitions, participate, view leaderboard
- **Admins**: Create/manage competitions, view results, select winners

## Requirements

### 1. Competition System

#### Competition Structure
```typescript
interface Competition {
  id: string;
  title: string;
  description: string;
  quizTemplateId: string; // Which quiz to use
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  prizePool: number; // Total prize money
  prizes: {
    first: number;   // e.g., $500
    second: number;  // e.g., $300
    third: number;   // e.g., $200
  };
  rules: string;
  maxAttempts: number; // Usually 1 for competition
  participantCount: number;
  createdAt: Date;
  createdBy: string; // Admin user ID
}
```

#### Competition States
- **Upcoming**: Not started yet, students can register
- **Active**: Currently running, students can participate
- **Completed**: Ended, winners determined, leaderboard frozen

### 2. Leaderboard System

#### Leaderboard Entry
```typescript
interface LeaderboardEntry {
  id: string;
  competitionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  school?: string;
  score: number; // Correct answers
  totalQuestions: number;
  timeSpent: number; // In seconds
  rank: number;
  completedAt: Date;
  attemptId: string; // Reference to quiz attempt
}
```

#### Ranking Algorithm
```
1. Sort by score (descending) - higher score = better rank
2. If scores are equal, sort by time (ascending) - faster time = better rank
3. If both equal, sort by completion time (ascending) - earlier submission = better rank
```

### 3. User Interface Components

#### New Pages/Components Needed

**A. Competitions Page** (`src/pages/Competitions.tsx`)
- List all competitions (upcoming, active, completed)
- Filter by status
- Show competition details
- "Join Competition" button for active competitions
- "View Leaderboard" button

**B. Competition Details Page** (`src/pages/CompetitionDetails.tsx`)
- Competition information
- Rules and prize breakdown
- Start/end dates
- Participant count
- "Start Quiz" button (if active and not attempted)
- Leaderboard (if active or completed)

**C. Leaderboard Component** (`src/components/Leaderboard.tsx`)
- Real-time rankings table
- Columns: Rank, Name, School, Score, Time, Completion Date
- Highlight top 3 (gold, silver, bronze)
- Show current user's rank (if participated)
- Auto-refresh every 30 seconds (for active competitions)

**D. Admin Competition Manager** (`src/pages/admin/CompetitionManager.tsx`)
- Create new competition
- Edit existing competitions
- View all competitions
- Declare winners
- Export results

### 4. Database Schema

#### Firestore Collections

**competitions** (root collection)
```
/competitions/{competitionId}
  - title: string
  - description: string
  - quizTemplateId: string
  - startDate: timestamp
  - endDate: timestamp
  - status: string
  - prizePool: number
  - prizes: object
  - rules: string
  - maxAttempts: number
  - participantCount: number
  - createdAt: timestamp
  - createdBy: string
```

**leaderboard** (root collection)
```
/leaderboard/{entryId}
  - competitionId: string
  - userId: string
  - userName: string
  - userEmail: string
  - school: string (optional)
  - score: number
  - totalQuestions: number
  - timeSpent: number
  - rank: number
  - completedAt: timestamp
  - attemptId: string
```

**competitionAttempts** (subcollection under users)
```
/users/{userId}/competitionAttempts/{attemptId}
  - competitionId: string
  - quizTemplateId: string
  - score: number
  - timeSpent: number
  - completedAt: timestamp
  - submitted: boolean
```

### 5. Firestore Security Rules

Add to `firestore.rules`:

```javascript
// Competitions - anyone can read, only admins can write
match /competitions/{competitionId} {
  allow read: if true;
  allow write: if request.auth != null && 
               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin';
}

// Leaderboard - anyone can read, only system can write
match /leaderboard/{entryId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null && 
                          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin';
}

// Competition attempts - users can only access their own
match /users/{userId}/competitionAttempts/{attemptId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Implementation Steps

### Phase 1: Database & Types (Foundation)

**Step 1.1**: Add types to `src/types/index.ts`

```typescript
export interface Competition {
  id: string;
  title: string;
  description: string;
  quizTemplateId: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  prizePool: number;
  prizes: {
    first: number;
    second: number;
    third: number;
  };
  rules: string;
  maxAttempts: number;
  participantCount: number;
  createdAt: Date;
  createdBy: string;
}

export interface LeaderboardEntry {
  id: string;
  competitionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  school?: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  rank: number;
  completedAt: Date;
  attemptId: string;
}
```

**Step 1.2**: Update Firestore rules in `firestore.rules`

Add the competition and leaderboard rules shown above.

**Step 1.3**: Create Firebase helper functions in `src/components/ui/firebase.ts`

```typescript
// Competition functions
const getCompetitions = async (status?: string): Promise<Competition[]> => {
  // Fetch competitions, optionally filtered by status
}

const getCompetitionById = async (competitionId: string): Promise<Competition | null> => {
  // Fetch single competition
}

const createCompetition = async (competition: Omit<Competition, 'id' | 'createdAt'>): Promise<string> => {
  // Create new competition (admin only)
}

// Leaderboard functions
const getLeaderboard = async (competitionId: string): Promise<LeaderboardEntry[]> => {
  // Fetch leaderboard for a competition, sorted by rank
}

const submitCompetitionAttempt = async (
  userId: string,
  competitionId: string,
  attemptData: {
    score: number;
    timeSpent: number;
    attemptId: string;
  }
): Promise<void> => {
  // Submit attempt and update leaderboard
  // Calculate rank based on score + time
}

const calculateRank = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
  // Sort by score (desc), then time (asc), then completedAt (asc)
  // Assign ranks
}
```

### Phase 2: UI Components

**Step 2.1**: Create Competitions List Page

File: `src/pages/Competitions.tsx`

Features:
- Tabs for "Active", "Upcoming", "Completed"
- Competition cards showing:
  - Title, description
  - Prize pool
  - Start/end dates
  - Participant count
  - Status badge
  - "Join" or "View Leaderboard" button

**Step 2.2**: Create Competition Details Page

File: `src/pages/CompetitionDetails.tsx`

Features:
- Full competition information
- Rules section
- Prize breakdown (1st: $500, 2nd: $300, 3rd: $200)
- Timer showing time until start/end
- "Start Quiz" button (if eligible)
- Embedded leaderboard

**Step 2.3**: Create Leaderboard Component

File: `src/components/Leaderboard.tsx`

Features:
- Table with columns: Rank, Name, School, Score, Time
- Top 3 highlighted with colors (gold, silver, bronze)
- Trophy icons for top 3
- Current user highlighted (if participated)
- Auto-refresh for active competitions
- Pagination (if many entries)

**Step 2.4**: Update Navigation

Add "Competitions" link to `src/components/Layout.tsx`

### Phase 3: Competition Flow

**Step 3.1**: Modify Quiz Taking Flow

Update `src/pages/Home.tsx`:
- Accept `competitionId` parameter
- If in competition mode:
  - Show competition banner
  - Disable retakes
  - Show "Submit to Competition" button
  - On completion, submit to leaderboard

**Step 3.2**: Competition Submission

When quiz completes in competition mode:
1. Save quiz attempt as usual
2. Submit to leaderboard
3. Calculate rank
4. Show "Competition Submitted" message
5. Redirect to leaderboard

**Step 3.3**: Leaderboard Updates

For active competitions:
- Recalculate ranks when new submission arrives
- Update all affected ranks
- Use Firestore transactions to prevent race conditions

### Phase 4: Admin Features

**Step 4.1**: Admin Competition Manager

File: `src/pages/admin/CompetitionManager.tsx`

Features:
- List all competitions
- Create new competition form:
  - Title, description
  - Select quiz template
  - Start/end dates
  - Prize amounts
  - Rules text
- Edit existing competitions
- View participants and submissions
- Declare winners button

**Step 4.2**: Admin Dashboard

Add admin-only route in `src/App.tsx`:
```typescript
<Route path="/admin/competitions" element={
  <ProtectedRoute requireAdmin>
    <CompetitionManager />
  </ProtectedRoute>
} />
```

## UI Design Guidelines

### Competition Card
```
┌─────────────────────────────────────┐
│ 🏆 Winter Math Challenge            │
│                                     │
│ Prize Pool: $1,000                  │
│ 📅 Dec 15 - Dec 22, 2025           │
│ 👥 156 participants                 │
│                                     │
│ [ACTIVE] [Join Competition →]       │
└─────────────────────────────────────┘
```

### Leaderboard Table
```
┌──────┬─────────────┬──────────┬───────┬─────────┐
│ Rank │ Name        │ School   │ Score │ Time    │
├──────┼─────────────┼──────────┼───────┼─────────┤
│ 🥇 1 │ John Doe    │ MIT      │ 5/5   │ 2:34    │
│ 🥈 2 │ Jane Smith  │ Harvard  │ 5/5   │ 2:45    │
│ 🥉 3 │ Bob Wilson  │ Stanford │ 5/5   │ 3:12    │
│   4  │ Alice Brown │ Yale     │ 4/5   │ 2:10    │
│   5  │ You         │ UCLA     │ 4/5   │ 2:30    │ ← Highlighted
└──────┴─────────────┴──────────┴───────┴─────────┘
```

## Testing Checklist

### Competition Creation (Admin)
- [ ] Admin can create competition
- [ ] Competition appears in list
- [ ] Status updates automatically (upcoming → active → completed)

### Student Participation
- [ ] Student can view competitions
- [ ] Student can join active competition
- [ ] Quiz loads with competition banner
- [ ] Timer tracks time correctly
- [ ] Submission goes to leaderboard

### Leaderboard
- [ ] Leaderboard shows correct rankings
- [ ] Ranks update when new submissions arrive
- [ ] Top 3 highlighted correctly
- [ ] Current user highlighted
- [ ] Auto-refresh works

### Edge Cases
- [ ] Can't join competition twice
- [ ] Can't join before start time
- [ ] Can't join after end time
- [ ] Ties handled correctly (same score + time)
- [ ] Empty leaderboard displays properly

## Future Enhancements (Not in this phase)

- Email notifications for competition start/end
- Student verification (.edu email)
- Anti-cheating measures (tab switching detection)
- Certificate generation for winners
- Payment/prize distribution system
- Competition analytics dashboard
- Team competitions
- Multiple quiz rounds

## Notes

- Start simple: Manual winner selection by admin
- Auto-refresh leaderboard every 30 seconds during active competitions
- Use Firestore real-time listeners for leaderboard updates
- Cache competition data to reduce reads
- Consider pagination for large leaderboards (>100 entries)

## Success Criteria

✅ Students can view and join competitions
✅ Quiz completion submits to leaderboard
✅ Leaderboard shows correct rankings (score + time)
✅ Top 3 clearly highlighted
✅ Admin can create and manage competitions
✅ System handles concurrent submissions correctly

---

**Ready to implement?** Start with Phase 1 (Database & Types), then move to Phase 2 (UI Components).
