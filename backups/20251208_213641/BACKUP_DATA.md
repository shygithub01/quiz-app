# Firestore Data Backup - December 8, 2025 9:36 PM

## How to Backup Firestore Data

Run this command to export all Firestore data:

```bash
firebase firestore:export gs://quizapp-42057.firebasestorage.app/backups/20251208_213641
```

## How to Restore Firestore Data

If you need to restore:

```bash
firebase firestore:import gs://quizapp-42057.firebasestorage.app/backups/20251208_213641
```

## Manual Backup via Console

Alternatively, you can backup via Firebase Console:
1. Go to: https://console.firebase.google.com/project/quizapp-42057/firestore
2. Click on "Import/Export" tab
3. Click "Export"
4. Select all collections
5. Choose destination: gs://quizapp-42057.firebasestorage.app/backups/20251208_213641

## Collections to Backup

- competitions
- competitionSettings
- quizTemplates
- users
- scholarshipRegistrations
- leaderboard
- userQuizHistories

## Code Backup Location

All source code backed up to: `backups/20251208_213641/`

## Restore Instructions

To restore code:
```bash
# If something breaks, restore from backup
cp -r backups/20251208_213641/src ./
cp -r backups/20251208_213641/functions ./
cp backups/20251208_213641/firestore.rules ./
```

## What's Being Changed

1. AdminCreateCompetition.tsx - competition type selection
2. AdminCompetitionSettings.tsx - featured competition dropdown
3. ScholarshipHome.tsx - load from featured competition
4. firebase.ts - new functions for app settings
5. Competitions.tsx - filter improvements

## Rollback Plan

If anything breaks:
1. Restore code from this backup folder
2. Restore Firestore data using import command above
3. Redeploy: `npm run build && firebase deploy`
