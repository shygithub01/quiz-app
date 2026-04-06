# Firebase Realtime Database Setup Instructions

## Task 1.1: Set up Firebase Realtime Database

### ✅ Code Changes Complete

The following code changes have been made:

1. **Updated `src/components/ui/firebase.ts`:**
   - Added `import { getDatabase } from 'firebase/database'`
   - Added `databaseURL` to Firebase config
   - Initialized Realtime Database: `const realtimeDb = getDatabase(app)`
   - Exported `realtimeDb` for use in other files

2. **Updated `.env.local`:**
   - Added `VITE_FIREBASE_DATABASE_URL="https://quizapp-42057-default-rtdb.firebaseio.com"`

### 🔧 Manual Steps Required (Firebase Console)

You need to complete these steps in the Firebase Console:

#### Step 1: Enable Firebase Realtime Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **quizapp-42057**
3. In the left sidebar, click **"Build"** → **"Realtime Database"**
4. Click **"Create Database"** button
5. Choose a location (select **us-central1** or closest to your users)
6. Start in **"Test mode"** for now (we'll add security rules next)
7. Click **"Enable"**

#### Step 2: Configure Security Rules

Once the database is created:

1. In the Realtime Database page, click the **"Rules"** tab
2. Replace the default rules with the following:

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

3. Click **"Publish"** to save the rules

#### Step 3: Verify Database URL

1. In the Realtime Database page, look at the top for your database URL
2. It should look like: `https://quizapp-42057-default-rtdb.firebaseio.com`
3. Verify this matches the URL in `.env.local`
4. If different, update `.env.local` with the correct URL

### ✅ Testing the Connection

After completing the Firebase Console steps, test the connection:

```bash
# Run the development server
npm run dev
```

Open the browser console and check for:
- ✅ No Firebase errors
- ✅ Firebase Realtime Database initialized successfully

### 📋 Security Rules Explanation

The rules we configured:

1. **liveEvents**: Only admins can create/update events, everyone can read
2. **eventParticipants**: Everyone can read, anyone can write their own session
3. **eventAnswers**: Only admins can read all answers, participants can read/write their own
4. **eventLeaderboard**: Everyone can read, only admins can write

### 🔒 Production Security

Before going to production, you should:
1. Review and tighten security rules
2. Add rate limiting
3. Add validation rules for data structure
4. Consider adding server-side validation via Cloud Functions

### ✅ Task 1.1 Complete

Once you've completed the Firebase Console steps and verified the connection works, Task 1.1 is complete!

**Next Task:** 1.2 - Create TypeScript interfaces and data models
