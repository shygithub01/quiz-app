# 🆘 EMERGENCY RESTORE INSTRUCTIONS

## If Something Breaks - Follow These Steps

### Step 1: Restore Code
```bash
# Navigate to project root
cd /Users/shyammohapatra/projects/quiz_app_firebase_deployment

# Restore all source files
cp -r backups/20251208_213641/src ./
cp -r backups/20251208_213641/functions ./
cp backups/20251208_213641/firestore.rules ./
cp backups/20251208_213641/firestore.indexes.json ./
cp backups/20251208_213641/firebase.json ./

# Reinstall dependencies (if needed)
npm install
cd functions && npm install && cd ..
```

### Step 2: Rebuild and Deploy
```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy
```

### Step 3: Check if Working
1. Open: https://quizapp-42057.web.app
2. Test the scholarship page
3. Test the competitions page
4. Test admin pages

### Step 4: Restore Firestore Data (if needed)

**Option A: Via Firebase Console**
1. Go to: https://console.firebase.google.com/project/quizapp-42057/firestore
2. Manually recreate any lost data

**Option B: Via Script (if you ran the backup)**
```bash
node restore-firestore-data.js
```

## What Was Backed Up

✅ All source code in `src/`
✅ All Firebase functions in `functions/`
✅ Firestore rules
✅ Firebase configuration
✅ Package dependencies list

## Backup Timestamp

**Created:** December 8, 2025 at 9:36 PM
**Before:** Implementing featured competition system

## Quick Rollback Command

```bash
# One-liner to restore everything
cd /Users/shyammohapatra/projects/quiz_app_firebase_deployment && \
cp -r backups/20251208_213641/src ./ && \
cp -r backups/20251208_213641/functions ./ && \
cp backups/20251208_213641/*.{rules,json} ./ && \
npm run build && \
firebase deploy
```

## Contact

If you need help restoring, you have this backup to reference.
