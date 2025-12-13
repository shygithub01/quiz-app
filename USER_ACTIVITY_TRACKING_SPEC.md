# User Activity Tracking & Management Feature Spec

## Overview
Enhance admin capabilities to view detailed user activity, track competition participation, and manage user access.

## Current State
- Admin User Management page exists (`/admin/users`)
- Can view list of users
- Can change user roles (Super Admin only)
- Basic user info displayed (name, email, role)

## Proposed Features

### 1. User Management Page Enhancements

**Add to each user row:**
- **"View Details" button** - Navigate to user details page
- **"Disable/Enable" toggle** - Prevent/allow user access
- **Status indicator** - Show if user is active or disabled
- **Last activity date** - Show when user last logged in

### 2. New User Details Page (`/admin/users/:userId`)

**User Profile Section:**
- Name, email, role
- Account status (Active/Disabled)
- Created date
- Last login date
- Total competitions taken

**Competition History Table:**
| Competition | Type | Score | Time | Date | Rank | Actions |
|-------------|------|-------|------|------|------|---------|
| Henrico Merit | Scholarship | 45/50 | 12:34 | Dec 10 | #2 | View Details |
| Practice Test | Practice | 38/50 | 15:22 | Dec 9 | - | View Details |

**Statistics Cards:**
- Total Competitions: 15
- Practice Tests: 10
- Scholarship Competitions: 5
- Average Score: 82%
- Best Score: 95%
- Total Time Spent: 3h 45m

**Admin Actions:**
- Disable/Enable User
- Change Role
- Reset Specific Competition Attempt
- Delete User (with confirmation)

### 3. Firebase Functions to Add

```typescript
// Get all user's competition attempts
getUserCompetitionHistory(userId: string): Promise<CompetitionAttempt[]>

// Get user statistics
getUserStatistics(userId: string): Promise<UserStats>

// Disable/Enable user
setUserStatus(userId: string, disabled: boolean): Promise<void>

// Delete user and all their data
deleteUser(userId: string): Promise<void>
```

### 4. Data Structure

**Add to users collection:**
```typescript
{
  disabled: boolean,
  lastLoginAt: Timestamp,
  lastActivityAt: Timestamp
}
```

**CompetitionAttempt interface:**
```typescript
{
  id: string,
  userId: string,
  competitionId: string,
  competitionTitle: string,
  isPractice: boolean,
  score: number,
  totalQuestions: number,
  timeSpent: number,
  rank?: number,
  completedAt: Timestamp
}
```

## Implementation Steps

1. **Add Firebase functions** (firebase.ts)
   - getUserCompetitionHistory
   - getUserStatistics
   - setUserStatus
   - deleteUser

2. **Update User Management page**
   - Add "View Details" button
   - Add Disable/Enable toggle
   - Add status indicator
   - Add last activity column

3. **Create User Details page** (AdminUserDetails.tsx)
   - User profile section
   - Competition history table
   - Statistics cards
   - Admin action buttons

4. **Add routing** (App.tsx)
   - Route: `/admin/users/:userId`

5. **Add authentication check**
   - Prevent disabled users from logging in
   - Show message if account is disabled

## UI Mockup

### User Management Page
```
┌─────────────────────────────────────────────────────────┐
│ User Management                                          │
├─────────────────────────────────────────────────────────┤
│ Shyam Mohapatra                                          │
│ mohapatra.lucy@gmail.com                                 │
│ [SUPER ADMIN] [Active] Last: Dec 12, 2024               │
│ [View Details] [Disable]                                 │
├─────────────────────────────────────────────────────────┤
│ Lucy Mohapatra                                           │
│ mohapatra.lucy@gmail.com                                 │
│ [STUDENT] [Active] Last: Dec 11, 2024                   │
│ [View Details] [Disable]                                 │
└─────────────────────────────────────────────────────────┘
```

### User Details Page
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Users                                          │
│                                                          │
│ Lucy Mohapatra                                           │
│ mohapatra.lucy@gmail.com                                 │
│ Role: Student | Status: Active                           │
│ [Disable User] [Change Role] [Delete User]              │
├─────────────────────────────────────────────────────────┤
│ Statistics                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │ Total: 15│ │ Avg: 82% │ │ Best: 95%│                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
├─────────────────────────────────────────────────────────┤
│ Competition History                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Henrico Merit | Scholarship | 45/50 | 12:34 | #2   │ │
│ │ Practice Test | Practice    | 38/50 | 15:22 | -    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Questions for Review

1. Should disabled users see a message when they try to log in?
2. Should we send email notification when user is disabled?
3. Should we allow filtering/searching in competition history?
4. Should we show detailed answers for each attempt?
5. Should we allow exporting user data to CSV?

## Estimated Effort
- Firebase functions: 1-2 hours
- User Management updates: 30 minutes
- User Details page: 2-3 hours
- Testing: 1 hour
- **Total: 4-6 hours**

---

**Status:** Awaiting approval
**Created:** December 12, 2024
