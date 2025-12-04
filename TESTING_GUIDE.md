# Competition & Leaderboard Testing Guide

## What's Been Built

### Phase 1 & 2 (Completed)
✅ Competition types and database schema  
✅ Competitions page with filtering (active, upcoming, completed)  
✅ Leaderboard component with real-time rankings  
✅ Firebase functions for competitions and leaderboard  
✅ Navigation link to competitions  

### Phase 3 (Completed)
✅ Competition details page  
✅ Full competition info display (description, rules, prizes)  
✅ Embedded leaderboard on details page  
✅ Start competition button  
✅ Test competition creation utility  

## How to Test

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Create a Test Competition

Open your browser console and run:
```javascript
window.createTestCompetition()
```

This will create a test competition called "Winter Math Challenge 2025" that is currently active.

### 3. View Competitions

Navigate to: `http://localhost:5173/competitions`

You should see:
- The test competition card
- Status badge showing "ACTIVE"
- Start and end dates
- Participant count (0 initially)
- "Join Competition" and "View Details" buttons

### 4. View Competition Details

Click "View Details" or navigate to: `http://localhost:5173/competitions/{competition-id}`

You should see:
- Full competition description
- Start/end dates
- Participant count
- Rules list
- Prizes with medals (🥇🥈🥉)
- Empty leaderboard (no participants yet)
- "Start Competition" button

### 5. Test Filtering

On the competitions page, test the filter tabs:
- **All**: Shows all competitions
- **Active**: Shows only active competitions
- **Upcoming**: Shows competitions that haven't started
- **Completed**: Shows finished competitions

## Database Structure

### Collections Created

1. **competitions**
   - title, description, status
   - startDate, endDate
   - quizTemplateId
   - rules (array), prizes (array)
   - participantCount

2. **leaderboard**
   - competitionId, userId
   - userName, userEmail, school
   - score, totalQuestions, timeSpent
   - rank, completedAt, attemptId

## Next Steps

### Phase 4: Quiz Integration (TODO)
- [ ] Modify quiz taking flow to support competition mode
- [ ] Pass competitionId to quiz component
- [ ] Submit scores to leaderboard on completion
- [ ] Show competition results after submission
- [ ] Prevent multiple attempts (or track best attempt)

### Phase 5: Real-time Updates (TODO)
- [ ] Add Firestore listeners for live leaderboard updates
- [ ] Show notifications when rank changes
- [ ] Display "New participant joined" messages

### Phase 6: Admin Features (TODO)
- [ ] Create competition form
- [ ] Edit/delete competitions
- [ ] Manage participants
- [ ] Export results

## Troubleshooting

### Competition not showing up?
- Check browser console for errors
- Verify Firebase connection
- Check that `createTestCompetition()` completed successfully

### Leaderboard empty?
- This is expected - no one has completed the competition yet
- Once quiz integration is complete, scores will appear here

### Can't start competition?
- Make sure you're signed in
- Check that competition status is "active"
- Verify dates are correct (should be active now)

## Files Modified/Created

### New Files
- `src/pages/Competitions.tsx` - Competitions list page
- `src/pages/CompetitionDetails.tsx` - Competition details page
- `src/components/Leaderboard.tsx` - Leaderboard component
- `src/types/index.ts` - TypeScript type definitions
- `src/utils/createTestCompetition.ts` - Test utility

### Modified Files
- `src/components/ui/firebase.ts` - Added competition & leaderboard functions
- `src/App.tsx` - Added routes
- `src/pages/Layout.tsx` - Added navigation link
- `src/main.tsx` - Import test utility in dev mode
