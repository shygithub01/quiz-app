// Restoration script - Run step by step
const admin = require('firebase-admin');

// Initialize with your project
admin.initializeApp({
  projectId: 'quizapp-42057'
});

const db = admin.firestore();

async function step1_verifyCompetitionSettings() {
  console.log('\n=== STEP 1: Verify Competition Settings ===');
  const snapshot = await db.collection('competitionSettings').get();
  console.log(`Found ${snapshot.size} competition settings`);
  
  if (snapshot.size > 0) {
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('✅ Competition:', data.name);
      console.log('   Date:', data.date);
      console.log('   Registration Deadline:', data.registrationDeadline);
      console.log('   Active:', data.isActive);
      console.log('   Registration Open:', data.registrationOpen);
    });
  } else {
    console.log('❌ No competition settings found');
  }
}

async function step2_restoreUserRoles() {
  console.log('\n=== STEP 2: Restore User Roles ===');
  
  // Restore admin user
  const adminUser = {
    email: 'mohapatra.shyam@gmail.com',
    displayName: 'Shyam Mohapatra',
    role: 'super_admin',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  };
  
  await db.collection('users').doc('tWGgvEZ7yDhpWsveTUvp78OxQdI2').set(adminUser);
  console.log('✅ Restored admin user:', adminUser.email);
  
  // Restore Lucy (test student)
  const lucyUser = {
    email: 'mohapatra.lucy@gmail.com',
    displayName: 'Lucy Mohapatra',
    role: 'student',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  };
  
  // You'll need Lucy's user ID - let me know if you have it
  console.log('⚠️  Need Lucy\'s user ID to restore her profile');
}

async function step3_restoreScholarshipRegistrations() {
  console.log('\n=== STEP 3: Restore Scholarship Registrations ===');
  
  // Restore Lucy's registration
  const lucyRegistration = {
    county: 'henrico',
    gradeLevel: '10th Grade',
    school: 'Deep Run High School',
    birthYear: '2007',
    parentEmail: '',
    agreeToTerms: true,
    marketingConsent: false,
    registeredAt: new Date().toISOString(),
    userId: 'LUCY_USER_ID' // Need actual ID
  };
  
  console.log('⚠️  Need Lucy\'s user ID to restore registration');
  console.log('   Registration data ready:', lucyRegistration);
}

async function runStep(stepNumber) {
  try {
    switch(stepNumber) {
      case 1:
        await step1_verifyCompetitionSettings();
        break;
      case 2:
        await step2_restoreUserRoles();
        break;
      case 3:
        await step3_restoreScholarshipRegistrations();
        break;
      default:
        console.log('Invalid step number');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the step specified in command line
const step = parseInt(process.argv[2]) || 1;
runStep(step).then(() => {
  console.log('\n✅ Step', step, 'complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
