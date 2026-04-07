# CRITICAL BUG: Live Event Mode Toggle Doesn't Work

## Date: April 6, 2026
## Status: 🔴 CRITICAL - Blocks Live Event Testing

---

## Bug Description

When creating a competition with "Live Event Mode" toggle enabled, the system creates a regular competition in Firestore but DOES NOT create the corresponding Live Event in Firebase Realtime Database. This means:

- Competition appears as a regular Practice Test or Scholarship Competition
- No PIN code is generated
- No QR code is available
- Host control panel cannot be accessed
- Projector view cannot be opened
- Participants cannot join via PIN

## Root Cause

In `src/pages/AdminCreateCompetition.tsx`, the `handleCreateCompetition` function:

1. ✅ Sets `isLiveEvent: true` in competition data
2. ✅ Includes `liveEventSettings` in competition data
3. ✅ Calls `createCompetition()` to save to Firestore
4. ❌ **NEVER calls `createLiveEvent()` from `liveEventService.ts`**

The Live Event Mode toggle only affects the Firestore document, but doesn't trigger the creation of the actual Live Event in Realtime Database.

## Expected Behavior

When `isLiveEvent` is `true`, the system should:

1. Create competition in Firestore (existing behavior)
2. **ALSO** call `createLiveEvent(competitionId, settings, maxParticipants)` from `liveEventService.ts`
3. Store the returned `eventId` and `pin` in the Firestore competition document
4. Display the PIN and event details in the success message
5. Redirect to Live Event Host control panel instead of Competition Settings

## Code Location

**File**: `src/pages/AdminCreateCompetition.tsx`
**Function**: `handleCreateCompetition` (lines ~90-180)

**Current Code** (simplified):
```typescript
const handleCreateCompetition = async (e: React.FormEvent) => {
  // ... validation ...
  
  const competitionData = {
    // ... other fields ...
    isLiveEvent,
    liveEventSettings: isLiveEvent ? {
      maxParticipants,
      questionTimer,
      enableFastestFingerBonus,
      autoAdvanceOnTimer
    } : undefined
  };
  
  const competitionId = await createCompetition(competitionData);
  
  // ❌ MISSING: No call to createLiveEvent()
  
  alert('Competition created!');
  navigate('/admin/competitions');
}
```

**Required Fix**:
```typescript
const handleCreateCompetition = async (e: React.FormEvent) => {
  // ... validation ...
  
  const competitionData = {
    // ... other fields ...
    isLiveEvent,
    liveEventSettings: isLiveEvent ? {
      maxParticipants,
      questionTimer,
      enableFastestFingerBonus,
      autoAdvanceOnTimer
    } : undefined
  };
  
  const competitionId = await createCompetition(competitionData);
  
  // ✅ ADD THIS: Create Live Event in Realtime DB
  if (isLiveEvent) {
    const { createLiveEvent } = await import('../services/liveEventService');
    const { eventId, pin } = await createLiveEvent(
      competitionId,
      {
        questionTimer,
        enableFastestFingerBonus,
        autoAdvanceOnTimer
      },
      maxParticipants
    );
    
    // Store eventId and pin in Firestore competition
    await updateCompetition(competitionId, {
      liveEventId: eventId,
      liveEventPin: pin
    });
    
    alert(`Live Event created!\nPIN: ${pin}\nEvent ID: ${eventId}`);
    navigate(`/live-event/${eventId}/host`);
  } else {
    alert('Competition created!');
    navigate('/admin/competitions');
  }
}
```

## Impact

**Severity**: 🔴 CRITICAL
**Affected Users**: Event hosts trying to create Live Events
**Workaround**: None - feature is completely broken

## Testing Evidence

User created "Odia Test 1" with:
- Live Event Mode toggle: ON
- Max Participants: 50
- Question Timer: 30s
- Fastest Finger Bonus: Enabled

Result:
- Competition created in Firestore ✅
- Competition appears in Competition Settings ✅
- Competition shows "Live Event" badge ✅
- BUT: No Live Event in Realtime Database ❌
- BUT: No PIN code generated ❌
- BUT: Cannot access Host control panel ❌
- BUT: Competition behaves like regular Practice Test ❌

## Related Files

- `src/pages/AdminCreateCompetition.tsx` - Needs fix
- `src/services/liveEventService.ts` - Has `createLiveEvent()` function
- `src/components/ui/firebase.ts` - May need `updateCompetition()` function
- `src/pages/CompetitionDetails.tsx` - Should show "Start Event" button for Live Events
- `src/pages/LiveEventHost.tsx` - Host control panel (cannot be accessed)

## Next Steps

1. Fix `AdminCreateCompetition.tsx` to call `createLiveEvent()` when toggle is ON
2. Add `liveEventId` and `liveEventPin` fields to Competition type
3. Update `CompetitionDetails.tsx` to show Live Event specific buttons
4. Test full flow: Create → Host Panel → Projector → Join → Play
5. Verify Realtime Database structure matches design spec

## Additional UI Issues (Lower Priority)

While fixing this critical bug, also consider:
- Live Event should be its own competition type (not a toggle)
- Form fields should be conditional based on type
- Success message should be type-specific
- Redirect should go to Host panel for Live Events

See `LIVE_EVENT_UI_ISSUES.md` for full list of UX improvements.

---

## Status: 🔴 BLOCKING ALL LIVE EVENT TESTING

This bug must be fixed before any Live Event functionality can be tested.
