# Admin Setup Guide

This guide explains how to set up and manage administrators for the Quizist.AI platform.

## Overview

The admin system uses a Firestore collection called `admins` to manage administrator access. This is secure, scalable, and easy to manage.

## Initial Admin Setup

### Step 1: Sign In as Admin User

1. Go to the application homepage
2. Click "Sign In with Google"
3. Sign in with the admin Google account: `shyammohapatra@mac.com`

### Step 2: Initialize Admin Access

After signing in for the first time, you need to add yourself to the admins collection:

**Option A: Using Browser Console (Recommended for first admin)**

1. Open browser developer console (F12 or right-click → Inspect)
2. Go to the Console tab
3. Get your user ID by running:
   ```javascript
   firebase.auth().currentUser.uid
   ```
4. Copy the user ID
5. Run the initialization function:
   ```javascript
   window.initializeAdmin('YOUR_USER_ID_HERE')
   ```
6. You should see a success message
7. Refresh the page - you now have admin access!

**Option B: Using Firestore Console (Alternative)**

1. Go to Firebase Console → Firestore Database
2. Create a new collection called `admins`
3. Add a document with:
   - Document ID: Your Firebase User ID (UID)
   - Fields:
     - `email`: "shyammohapatra@mac.com"
     - `displayName`: "Shyamalendu Mohapatra"
     - `addedAt`: (timestamp) Current timestamp
     - `addedBy`: "system"
4. Save the document
5. Refresh the application - you now have admin access!

## Managing Additional Admins

Once you have admin access, you can add/remove other admins through the UI:

### Adding a New Admin

1. The new admin must sign in to the platform at least once
2. Go to **Admin → Users** page
3. Find the user in the list and copy their User ID (UID)
4. Go to **Admin → Manage Admins** page (route: `/admin/manage-admins`)
5. Fill in the form:
   - User ID: Paste the UID
   - Email: Enter their email address
   - Display Name: Enter their name
6. Click "Add Admin"
7. The user immediately has admin access

### Removing an Admin

1. Go to **Admin → Manage Admins** page
2. Find the admin in the list
3. Click "Remove" button
4. Confirm the action
5. The user immediately loses admin access

## Admin Features

Admins have access to:

- **Quiz Generator**: Create quizzes from documents or topics
- **History**: View past quiz attempts
- **Pricing**: View subscription plans
- **Live Modes**: Join practice and live events
- **Competitions**: View and manage scholarship competitions
- **New Competition**: Create new competitions
- **Settings**: Manage competition settings
- **Users**: View and manage all users
- **Manage Admins**: Add/remove administrator access

## Security Notes

1. **Secure by Design**: Admin status is checked server-side via Firestore
2. **No Hardcoded Emails**: Admin emails are stored in the database, not in code
3. **Easy to Update**: Add/remove admins through the UI without code changes
4. **Audit Trail**: All admin additions are timestamped and tracked
5. **Self-Service**: Admins can manage other admins without developer intervention

## Troubleshooting

### "Admin access denied" after adding to admins collection

- Clear browser cache and cookies
- Sign out and sign in again
- Check that the User ID matches exactly (no spaces or extra characters)
- Verify the document exists in Firestore → admins collection

### Can't access admin management page

- Ensure you're signed in
- Verify you exist in the `admins` collection
- Check browser console for errors
- Try refreshing the page

### Need to remove all admin access

If you need to reset admin access:

1. Go to Firebase Console → Firestore Database
2. Delete the `admins` collection
3. Follow the "Initial Admin Setup" steps again

## Technical Details

### Admin Check Function

The `isAdmin()` function checks if a user ID exists in the `admins` collection:

```typescript
const isAdmin = async (userId: string | null | undefined): Promise<boolean> => {
  if (!userId) return false;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
```

### Admin Collection Structure

```
admins (collection)
  └── {userId} (document)
      ├── email: string
      ├── displayName: string
      ├── addedAt: timestamp
      └── addedBy: string
```

## Support

For issues or questions about admin management, contact the development team.
