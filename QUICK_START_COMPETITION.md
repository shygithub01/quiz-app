# Quick Start Guide - Competition Settings

## For Admins: Getting Competition Settings Working

### Step 1: Access Debug Tool
1. Navigate to: `http://localhost:5173/admin/debug-competition`
2. You'll see 4 buttons for testing

### Step 2: Check Current State
Click **"Fetch Settings"** to see what's currently in the database.

**Expected Output:**
```
📊 Active competition: Found
📊 Total settings: 1
```

If you see "None" or "0", proceed to Step 3.

### Step 3: Initialize Settings
Click **"Initialize Settings"** to create default competition.

**Expected Output:**
```
✅ Created default competition settings with ID: [some-id]
```

### Step 4: Verify on Student Page
1. Navigate to: `http://localhost:5173/scholarship`
2. You should see:
   - Countdown timer showing days/hours/minutes
   - Competition date: March 15, 2026
   - Competition details section with rules, prizes, instructions

### Step 5: Customize (Optional)
1. Navigate to: `http://localhost:5173/admin/competition-settings`
2. Update dates, prizes, rules as needed
3. Ensure these toggles are ON:
   - ✅ Active
   - ✅ Registration Open
   - ✅ Publish Details to Students
4. Click "Save Settings"

## Browser Console Commands

Open browser console (F12) and try these:

### Check Competition Status
```javascript
await window.checkCompetition()
```

### Initialize Competition
```javascript
await window.initCompetition()
```

### Debug Registration (for Lucy)
```javascript
await window.checkScholarshipRegistration('lucy-user-id')
```

## Troubleshooting

### Problem: "Loading..." stuck on scholarship page

**Solution:**
1. Open browser console
2. Look for errors (red text)
3. Run: `await window.checkCompetition()`
4. If returns 0, run: `await window.initCompetition()`

### Problem: "Competition Details Coming Soon"

**Cause:** `publishDetails` is OFF

**Solution:**
1. Go to `/admin/competition-settings`
2. Toggle "Publish Details to Students" ON
3. Click "Save Settings"

### Problem: "Registration Closed"

**Causes:**
- Registration deadline has passed (date in past)
- `registrationOpen` toggle is OFF
- Competition date is in the past

**Solution:**
1. Go to `/admin/competition-settings`
2. Set registration deadline to future date (e.g., 2026-03-14)
3. Set competition date to future date (e.g., 2026-03-15)
4. Toggle "Registration Open" ON
5. Click "Save Settings"

### Problem: Countdown timer shows "Closed"

**Cause:** Registration deadline is in the past

**Solution:**
1. Go to `/admin/competition-settings`
2. Update "Registration Deadline" to future date
3. Click "Save Settings"
4. Refresh scholarship page

## Expected Behavior

### When Everything Works:

**Admin Panel (`/admin/competition-settings`):**
- Shows current competition settings
- All fields editable
- Toggles work correctly
- Save button updates database

**Student Page (`/scholarship`):**
- Countdown timer shows time remaining
- Competition date displays correctly
- Competition details section visible (if published)
- Registration button appears (if not registered)
- "You're Registered!" shows (if already registered)

**Debug Tool (`/admin/debug-competition`):**
- "Fetch Settings" shows active competition
- "Initialize Settings" creates default if needed
- "Check Permissions" confirms Firestore access
- Console output shows detailed logs

## Default Competition Settings

When initialized, creates:
- **Name:** Henrico Merit Scholarship Competition
- **Date:** March 15, 2026
- **Time:** 10:00 AM - 11:00 AM
- **Prize Pool:** $300
- **Questions:** 50
- **Duration:** 60 minutes
- **Status:** Active, Registration Open, Details Published

## Key Files

- **Admin Settings:** `/admin/competition-settings`
- **Debug Tool:** `/admin/debug-competition`
- **Student View:** `/scholarship`
- **Registration:** `/scholarship/register`

## Need Help?

1. Check browser console for errors
2. Use debug tool to verify database state
3. Ensure dates are in the future
4. Verify all toggles are ON in admin panel
5. Check `COMPETITION_SETTINGS_FIX.md` for detailed technical info
