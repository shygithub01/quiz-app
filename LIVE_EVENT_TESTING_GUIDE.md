# Live Event Mode - Local Testing Guide

## Prerequisites

Before testing, ensure you have:
- ✅ Firebase Realtime Database enabled (already done in Phase 1)
- ✅ Local development server running
- ✅ Admin access to create competitions
- ✅ Multiple devices/browsers for multi-participant testing

## Setup Steps

### 1. Start Local Development Server

```bash
npm run dev
```

The app should start on `http://localhost:5173` (or similar port)

### 2. Verify Firebase Realtime Database

Check that your `.env.local` has:
```
VITE_FIREBASE_DATABASE_URL=https://quizapp-42057-default-rtdb.firebaseio.com
```

## Testing Workflow

### Phase 1: Create a Live Event Competition

1. **Login as Admin**
   - Navigate to: `http://localhost:5173`
   - Login with your admin account

2. **Create Competition**
   - Go to: Admin → Create Competition
   - Fill in competition details:
     - Title: "Test Live Event Quiz"
     - Generate 5-10 questions (any topic)
   - **IMPORTANT**: Enable "Live Event Mode" toggle
   - Configure Live Event Settings:
     - Max Participants: 10 (for testing)
     - Question Timer: 30 seconds
     - Enable Fastest Finger Bonus: ✓
     - Auto Advance on Timer: ✓
   - Save the competition

3. **Verify Competition Created**
   - Go to: Admin → Competitions
   - Confirm your live event competition appears with "Live Event" badge

### Phase 2: Start a Live Event (Host View)

1. **Navigate to Host Control**
   - Go to: Admin → Competitions
   - Click "Host Live Event" button (or navigate to `/admin/live-event/create`)

2. **Create Event**
   - Select your test competition from dropdown
   - Click "Create Live Event"
   - **Note the 6-digit PIN** displayed (e.g., 123456)
   - **Note the QR code** displayed

3. **Verify Event Created**
   - Check that event status shows "LOBBY"
   - Check that phase shows "lobby"
   - Participant count should be "0/10 joined"

### Phase 3: Join as Participants (Multiple Devices/Browsers)

You'll need to simulate multiple participants. Use:
- Different browser windows (Chrome, Firefox, Safari)
- Incognito/Private windows
- Mobile devices on same network
- Different computers

**For Each Participant:**

1. **Navigate to Join Page**
   - Open: `http://localhost:5173/live-event/join`
   - OR scan the QR code from host view

2. **Enter PIN**
   - Enter the 6-digit PIN from host view
   - Click "Continue"

3. **Enter Name**
   - Enter a unique name (e.g., "Alice", "Bob", "Charlie")
   - Click "Join Event"

4. **Verify Joined**
   - Should see "Welcome, [Name]!" message
   - Should see "Waiting for host to start..."
   - Check host view - participant should appear in list

**Recommended: Join with at least 3 participants for testing**

### Phase 4: Open Projector View

1. **From Host Control Panel**
   - Click "Open Projector View" button
   - New window/tab opens with projector display

2. **Verify Projector Lobby**
   - Should see large QR code
   - Should see PIN in 96px font
   - Should see participant list
   - Should see "X/10 Joined" counter
   - Verify all joined participants appear

**Tip**: Put projector view on a separate monitor or large screen if available

### Phase 5: Start the Event

1. **From Host Control Panel**
   - Click "Start Event" button
   - Projector view should open automatically (if not already open)

2. **Verify Countdown (All Views)**
   - **Projector**: Should show "3-2-1-GO" animation (200px font)
   - **Participants**: Should show "3-2-1-GO" animation (mobile-sized)
   - Each number displays for exactly 1 second
   - After "GO", should transition to first question

### Phase 6: Answer Questions

**For Each Question:**

1. **Verify Question Display**
   - **Projector**: 
     - Question text (40px font)
     - Timer (48px font, starts at 30s)
     - "Answered: 0/3" counter
     - Question number "Question 1 of 5"
   - **Participants**:
     - Question text
     - 4 answer buttons (A, B, C, D)
     - Timer countdown
     - Touch targets at least 44px

2. **Submit Answers (Participants)**
   - Each participant selects an answer
   - Click answer button
   - Should see "✅ Answer submitted!" confirmation
   - Button should be disabled after selection
   - **Try different speeds** to test fastest finger bonus

3. **Verify Answer Counter (Projector)**
   - Counter should update in real-time
   - "Answered: 1/3" → "Answered: 2/3" → "Answered: 3/3"
   - Updates should appear within 1 second

4. **Wait for Timer or Manual Advance**
   - **Option A**: Let timer expire (30 seconds)
     - Timer should turn red at 10 seconds
     - After expiry, wait 3 seconds
     - Should auto-advance to leaderboard
   - **Option B**: Manual advance (Host)
     - Click "Next Question" button
     - Should immediately advance to leaderboard

5. **Verify Leaderboard Display**
   - **Projector**:
     - Shows "🏆 Leaderboard"
     - Displays top 5 participants
     - Shows rank, name, score, correct answers
     - Fastest finger bonus displayed if applicable
     - Displays for 4 seconds
   - **Participants**:
     - Shows "🏆 Current Standings"
     - Shows top 10 participants
     - Highlights own entry with purple background
     - Shows personal rank and score

6. **Auto-Advance to Next Question**
   - After 4 seconds, should automatically move to next question
   - Timer resets to 30 seconds
   - Answer buttons re-enabled
   - Question counter increments

**Repeat for all questions (5 total)**

### Phase 7: Test Scoring

**Verify Scoring Logic:**

1. **Correct Answer**: Should award 100 points
2. **Incorrect Answer**: Should award 0 points
3. **Fastest Finger Bonus** (if enabled):
   - 1st fastest correct: +50 points
   - 2nd fastest correct: +30 points
   - 3rd fastest correct: +10 points
   - Only for correct answers

**Check Leaderboard After Each Question:**
- Scores should update correctly
- Ranks should be sorted by score (descending)
- Ties broken by total time (ascending)

### Phase 8: Final Results

After the last question:

1. **Verify Results Phase**
   - **Projector**:
     - Shows "🎉 Competition Complete! 🎉"
     - Displays winner with trophy animation
     - Shows winner's name in 80px font
     - Shows final score
     - Displays full leaderboard (scrollable)
   - **Participants**:
     - Shows "Competition Complete!"
     - Shows personal final rank (large)
     - Shows personal final score
     - "Back to Home" button

2. **Verify Data Archival (Host)**
   - Should see alert: "Event ended. Results archived..."
   - Check Firebase Console → Firestore → `liveEventArchive`
   - Should see new document with event results

3. **Verify Data Cleanup (After 60 seconds)**
   - Wait 60 seconds
   - Check Firebase Console → Realtime Database
   - Guest data should be deleted from:
     - `liveEvents/{eventId}`
     - `eventParticipants/{eventId}`
     - `eventAnswers/{eventId}`
     - `eventLeaderboard/{eventId}`

### Phase 9: Test Host Controls

**Test Pause/Resume:**

1. During a question, click "Pause" (Host)
2. Verify timer freezes on all views
3. Click "Resume" (Host)
4. Verify timer continues from paused time

**Test Extend Timer:**

1. During a question, click "+15 Seconds" (Host)
2. Verify timer adds 15 seconds
3. Should see alert confirmation

**Test Manual Advance:**

1. During a question, click "Next Question" (Host)
2. Should immediately advance to leaderboard
3. Then to next question after 4 seconds

**Test Early End:**

1. Click "End Event" (Host)
2. Confirm dialog
3. Should move to results phase
4. Should trigger archival and cleanup

### Phase 10: Test Network Resilience (Participant)

1. **During a Question:**
   - Disconnect participant's internet (turn off WiFi)
   - Try to submit an answer
   - Should see "Connection Lost" banner
   - Should see "Answer Queued" message

2. **Reconnect:**
   - Turn WiFi back on
   - Answer should auto-submit if within time limit
   - Should see success confirmation

3. **Session Timeout:**
   - Disconnect for more than 60 seconds
   - Should see "Session expired" message

## Test Checklist

### Core Functionality
- [ ] Create live event competition
- [ ] Generate PIN and QR code
- [ ] Join with multiple participants
- [ ] Start event and countdown
- [ ] Display questions on all views
- [ ] Submit answers from participants
- [ ] Real-time answer counter updates
- [ ] Timer countdown and expiry
- [ ] Auto-advance to leaderboard
- [ ] Leaderboard display (top 5 on projector)
- [ ] Auto-advance to next question
- [ ] Final results display
- [ ] Data archival to Firestore
- [ ] Guest data cleanup after 60s

### Scoring
- [ ] Correct answer awards 100 points
- [ ] Incorrect answer awards 0 points
- [ ] Fastest finger bonus (50/30/10)
- [ ] Bonus only for correct answers
- [ ] Leaderboard sorted correctly
- [ ] Ties broken by time

### Host Controls
- [ ] Pause event
- [ ] Resume event
- [ ] Extend timer (+15s)
- [ ] Manual advance to next question
- [ ] End event early

### Real-Time Sync
- [ ] Participant join updates within 1s
- [ ] Answer submission updates within 1s
- [ ] Leaderboard updates within 2s
- [ ] Phase transitions sync across all views
- [ ] Timer synchronized across all views

### Network Resilience
- [ ] Connection status indicator
- [ ] Answer queuing during disconnect
- [ ] Auto-submit on reconnect
- [ ] Session timeout after 60s

### Accessibility (Projector)
- [ ] Minimum 24px font for all text
- [ ] 32px font for questions
- [ ] 48px font for timer
- [ ] High contrast colors
- [ ] Timer turns red at 10s

### Mobile (Participant)
- [ ] Touch targets at least 44px
- [ ] Responsive layout (320px-768px)
- [ ] No accidental zoom
- [ ] Buttons disabled after selection

## Common Issues & Solutions

### Issue: "Event not found" when joining
**Solution**: Verify PIN is correct and event is in lobby phase

### Issue: "Name already taken"
**Solution**: Each participant needs a unique name

### Issue: Timer not synchronized
**Solution**: Check system clocks are synchronized, refresh browsers

### Issue: Projector view not updating
**Solution**: Check Firebase Realtime Database connection, check browser console for errors

### Issue: Participants can't join after event starts
**Solution**: This is expected - lobby closes when event starts

### Issue: Answer counter not updating
**Solution**: Check Firebase Realtime Database rules, verify listeners are active

## Firebase Console Verification

### Check Realtime Database Structure

Navigate to: Firebase Console → Realtime Database

**During Event:**
```
liveEvents/
  {eventId}/
    - competitionId
    - pin
    - status: "active"
    - phase: "question"
    - currentQuestionIndex: 0
    - timerStartedAt: timestamp
    - ...

eventParticipants/
  {eventId}/
    {sessionId}/
      - name: "Alice"
      - joinedAt: timestamp
      - isActive: true
      - lastSeen: timestamp

eventAnswers/
  {eventId}/
    {sessionId}/
      0/
        - answer: "Option A"
        - timestamp: timestamp
        - timeToAnswer: 5.2

eventLeaderboard/
  {eventId}/
    {sessionId}/
      - name: "Alice"
      - score: 150
      - rank: 1
      - correctAnswers: 2
      - fastestFingerBonus: 50
```

**After Event (60+ seconds):**
- All above data should be deleted

### Check Firestore Collections

Navigate to: Firebase Console → Firestore

**liveEventArchive:**
```
{documentId}/
  - eventId
  - competitionId
  - competitionTitle
  - pin
  - startedAt
  - endedAt
  - participantCount
  - results: [array of participant results]
  - expiresAt: (24 hours from now)
  - archivedAt
```

**liveEventStatistics:**
```
{documentId}/
  - eventId
  - competitionId
  - participantCount
  - durationMinutes
  - averageScore
  - maxScore
  - minScore
  - questionCount
  - fastestFingerEnabled
  - timestamp
```

## Performance Benchmarks

- Participant join → Projector update: < 1 second
- Answer submit → Counter update: < 1 second
- Question end → Leaderboard update: < 2 seconds
- Timer expiry → Auto-advance: 3 seconds
- Leaderboard display → Next question: 4 seconds

## Next Steps After Testing

1. **Document any bugs found** with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/videos if possible

2. **Test with more participants** (if possible):
   - Ideal: 10-20 participants
   - Maximum: 50-100 participants

3. **Test on different devices**:
   - Desktop browsers (Chrome, Firefox, Safari)
   - Mobile devices (iOS, Android)
   - Tablets
   - Different screen sizes

4. **Report results** to continue with Phase 7 implementation

## Quick Test Script (Minimal)

If you want a quick smoke test:

1. Create live event competition (2 minutes)
2. Start event as host (30 seconds)
3. Join with 2 participants in different browsers (1 minute)
4. Open projector view (10 seconds)
5. Start event and answer 2-3 questions (3 minutes)
6. Verify leaderboard updates (30 seconds)
7. End event and check archival (1 minute)

**Total time: ~8 minutes**

---

Good luck with testing! Let me know if you encounter any issues or need clarification on any steps.
