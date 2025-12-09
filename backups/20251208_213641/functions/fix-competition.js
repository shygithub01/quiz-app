const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCompetition() {
  console.log('🔧 Fixing competition settings...');
  
  const data = {
    name: "Henrico Merit Scholarship Competition",
    date: "2026-03-15",
    time: "10:00",
    dateTime: "March 15, 2026 at 10:00 AM",
    shortDate: "March 15, 2026",
    prizePool: "$300",
    duration: "60 minutes",
    questionCount: 50,
    subjects: "Math, Science, English, Social Studies",
    eligibleCounty: "henrico",
    isActive: true,
    registrationOpen: true,
    registrationDeadline: "2026-03-14",
    testOpenTime: "10:00 AM",
    testCloseTime: "11:00 AM",
    rules: [
      "Complete all questions within the time limit",
      "No external resources or help allowed",
      "Each question is worth equal points",
      "Ties are broken by completion time",
      "Must be a current student in eligible county"
    ],
    instructions: [
      "Sign in 15 minutes before test start time",
      "Ensure stable internet connection",
      "Use a computer or tablet (not phone)",
      "Find a quiet space without distractions",
      "Have scratch paper and pencil ready"
    ],
    eligibilityRequirements: [
      "Current student in Henrico County",
      "Grades 9-12 only",
      "Must have parent/guardian consent if under 18",
      "One attempt per student",
      "Must complete registration by deadline"
    ],
    prizeBreakdown: [
      "1st Place: $150 + Certificate",
      "2nd Place: $100 + Certificate",
      "3rd Place: $50 + Certificate",
      "Top 10: Recognition certificates"
    ],
    contactInfo: "For questions: scholarship@quizist.ai or call (804) 263-5062",
    publishDetails: true,
    autoCloseRegistration: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Delete all existing
  console.log('🗑️ Deleting old settings...');
  const existing = await db.collection('competitionSettings').get();
  for (const doc of existing.docs) {
    await doc.ref.delete();
    console.log('   Deleted:', doc.id);
  }

  // Add new one
  console.log('✅ Creating new competition...');
  const docRef = await db.collection('competitionSettings').add(data);
  console.log('✅ Created competition with ID:', docRef.id);
  console.log('✅ Registration deadline:', data.registrationDeadline);
  console.log('✅ Competition date:', data.date);
  
  process.exit(0);
}

fixCompetition().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
