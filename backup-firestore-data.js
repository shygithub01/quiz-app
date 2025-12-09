// Backup Firestore Data Script
// Run with: node backup-firestore-data.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const collections = [
  'competitions',
  'competitionSettings',
  'quizTemplates',
  'users',
  'scholarshipRegistrations',
  'leaderboard'
];

async function backupCollection(collectionName) {
  console.log(`📦 Backing up ${collectionName}...`);
  
  const snapshot = await db.collection(collectionName).get();
  const data = [];
  
  snapshot.forEach(doc => {
    data.push({
      id: doc.id,
      data: doc.data()
    });
  });
  
  const backupDir = path.join(__dirname, 'backups', '20251208_213641', 'firestore-data');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(backupDir, `${collectionName}.json`),
    JSON.stringify(data, null, 2)
  );
  
  console.log(`✅ ${collectionName}: ${data.length} documents backed up`);
  return data.length;
}

async function backup() {
  console.log('🔒 Starting Firestore backup...\n');
  
  let totalDocs = 0;
  
  for (const collection of collections) {
    try {
      const count = await backupCollection(collection);
      totalDocs += count;
    } catch (error) {
      console.error(`❌ Error backing up ${collection}:`, error.message);
    }
  }
  
  console.log(`\n✅ Backup complete! Total documents: ${totalDocs}`);
  console.log(`📁 Location: backups/20251208_213641/firestore-data/`);
  
  process.exit(0);
}

backup();
