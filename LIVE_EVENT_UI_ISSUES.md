# Live Event Mode - UI/UX Issues Found During Testing

## Date: April 6, 2026
## Status: Testing Phase - Issues Identified

---

## Critical Issues

### 1. Competition Type Confusion
**Problem**: Live Event Mode is a toggle on Practice/Scholarship types, not its own type
- Current: Practice Test + Live Event Mode toggle
- Issue: Practice tests shouldn't have prize pools, but the form shows prize pool field
- Issue: Scholarship + Live Event doesn't make sense (scholarships are online, not in-person)

**Solution Needed**:
- Make "Live Event" its own competition type (3rd option)
- Remove the toggle, make it a radio button choice:
  - Practice Test (online, unlimited attempts)
  - Scholarship Competition (online, one attempt, prizes)
  - Live Cultural Event (in-person, projector, QR codes, optional prizes)

---

### 2. Mixed Competition List
**Problem**: Competition Settings page shows all types mixed together
- Practice tests, Scholarship competitions, and Live Events all in one list
- Hard to distinguish between types
- Cluttered and confusing UI

**Solution Needed**:
- Separate tabs or sections:
  - "Practice Tests" tab
  - "Scholarship Competitions" tab
  - "Live Events" tab
- OR: Dedicated "Live Events" page separate from Competition Settings

---

### 3. Form Fields Not Conditional
**Problem**: All fields show regardless of competition type
- Prize Pool shows for Practice Tests (shouldn't)
- Eligible County shows for Live Events (not relevant for in-person)
- Duration field unclear (per question? total?)

**Solution Needed**:
- Show/hide fields based on competition type:
  - **Practice Test**: No prize pool, no county
  - **Scholarship**: Prize pool, county, registration fields
  - **Live Event**: Optional prize pool, max participants, timer per question

---

### 4. Live Event Settings Hidden
**Problem**: Live Event specific settings are buried in a toggle
- Max Participants field only shows when toggle is ON
- Timer per Question field only shows when toggle is ON
- Fastest Finger Bonus checkbox only shows when toggle is ON

**Solution Needed**:
- When "Live Event" is selected as type, show all relevant fields prominently
- Remove the toggle concept entirely

---

## UI/UX Improvements Needed

### 5. Step 1 - Question Generation
**Problem**: Subject categories (English, Math, Science) don't match cultural event needs
- User wants "Odia Cultural Quiz" but has to pick "English" or "Social Studies"
- No way to specify custom topics or cultural content

**Solution Needed**:
- Add "Custom Topic" field where user can enter "Odia Culture", "Indian History", etc.
- OR: Add "Cultural Studies" as a subject category
- OR: Allow manual question entry without AI generation

---

### 6. Cost Display Confusion
**Problem**: "$1 per question" shown during generation
- Users think they'll be charged
- It's just OpenAI API cost estimate, not user charge
- Confusing and scary for users

**Solution Needed**:
- Remove cost display for end users
- OR: Clarify it's "API cost (not charged to you)"
- OR: Only show for super admins

---

### 7. Success Message Unclear
**Problem**: After creation, shows "Practice quiz is now live!"
- But user created a Live Event, not a Practice quiz
- Message doesn't match what was created
- No clear next steps shown

**Solution Needed**:
- Show type-specific success message:
  - Practice: "Practice quiz is now live!"
  - Scholarship: "Scholarship competition created!"
  - Live Event: "Live event created! Click 'Start Event' to begin."
- Include next steps in the message

---

## Testing Notes

### What Works ✅
- Questions generated successfully (5 English questions)
- Competition created in Firestore
- Live Event badge shows in Competition Settings
- Competition details page loads

### What Needs Testing 🔄
- Live Event Host control panel (waiting for start time: 4:15 PM)
- Projector view with QR code
- Guest joining via PIN
- Real-time sync during event
- Leaderboard updates
- Fastest finger scoring

---

## Recommended Refactoring Priority

1. **High Priority** (Before production):
   - Separate Live Event as its own competition type
   - Conditional form fields based on type
   - Clear success messages with next steps

2. **Medium Priority** (Nice to have):
   - Separate tabs/pages for different competition types
   - Custom topic field for question generation
   - Remove/clarify cost display

3. **Low Priority** (Future enhancement):
   - Better visual distinction between types
   - Bulk actions for managing competitions
   - Templates for common event types

---

## Next Steps
1. Test Live Event Host control panel at 4:15 PM
2. Test full event flow (lobby → countdown → questions → leaderboard → results)
3. Document any additional issues found during testing
4. Create cleanup spec for UI refactoring
