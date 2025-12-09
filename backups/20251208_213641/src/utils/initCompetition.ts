// Simple utility to initialize competition settings
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../components/ui/firebase';

export const initializeCompetitionSettings = async () => {
  try {
    console.log('🔍 Checking for existing competition settings...');
    
    // Check if any settings exist - simple query without filters
    const settingsRef = collection(db, 'competitionSettings');
    const snapshot = await getDocs(settingsRef);
    
    console.log(`📊 Found ${snapshot.size} competition settings in database`);
    
    if (!snapshot.empty) {
      // Check for active settings
      const activeSettings = snapshot.docs.find(doc => doc.data().isActive === true);
      if (activeSettings) {
        console.log('✅ Active competition settings found');
        const existing = { id: activeSettings.id, ...activeSettings.data() };
        console.log('📋 Current settings:', existing);
        return existing;
      } else {
        console.log('⚠️ Settings exist but none are active');
      }
    }
    
    console.log('🎯 Creating default competition settings...');
    
    // Create default settings with future date
    const defaultSettings = {
      name: 'Henrico Merit Scholarship Competition',
      date: '2026-03-15',
      time: '10:00',
      dateTime: 'March 15, 2026 at 10:00 AM',
      shortDate: 'March 15, 2026',
      prizePool: '$300',
      duration: '60 minutes',
      questionCount: 50,
      subjects: 'Math, Science, English, Social Studies',
      eligibleCounty: 'henrico',
      isActive: true,
      registrationOpen: true,
      registrationDeadline: '2026-03-14',
      testOpenTime: '10:00 AM',
      testCloseTime: '11:00 AM',
      rules: [
        'Complete all questions within the time limit',
        'No external resources or help allowed',
        'Each question is worth equal points',
        'Ties are broken by completion time',
        'Must be a current student in eligible county'
      ],
      instructions: [
        'Sign in 15 minutes before test start time',
        'Ensure stable internet connection',
        'Use a computer or tablet (not phone)',
        'Find a quiet space without distractions',
        'Have scratch paper and pencil ready'
      ],
      eligibilityRequirements: [
        'Current student in Henrico County',
        'Grades 9-12 only',
        'Must have parent/guardian consent if under 18',
        'One attempt per student',
        'Must complete registration by deadline'
      ],
      prizeBreakdown: [
        '1st Place: $150 + Certificate',
        '2nd Place: $100 + Certificate',
        '3rd Place: $50 + Certificate',
        'Top 10: Recognition certificates'
      ],
      contactInfo: 'For questions: scholarship@quizist.ai or call (555) 123-4567',
      publishDetails: true,
      autoCloseRegistration: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('💾 Writing to Firestore...');
    const docRef = await addDoc(settingsRef, defaultSettings);
    console.log('✅ Created default competition settings with ID:', docRef.id);
    
    return { id: docRef.id, ...defaultSettings };
  } catch (error) {
    console.error('❌ Error initializing competition settings:', error);
    console.error('❌ Error details:', error);
    throw error;
  }
};

// Make utilities available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).initCompetition = initializeCompetitionSettings;
  
  // Quick check function
  (window as any).checkCompetition = async () => {
    console.log('🔍 Checking competition settings...');
    const settingsRef = collection(db, 'competitionSettings');
    const snapshot = await getDocs(settingsRef);
    console.log(`📊 Total settings in database: ${snapshot.size}`);
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n📋 ID: ${doc.id}`);
      console.log(`   Active: ${data.isActive}`);
      console.log(`   Date: ${data.date}`);
      console.log(`   Registration Open: ${data.registrationOpen}`);
      console.log(`   Publish Details: ${data.publishDetails}`);
    });
    return snapshot.size;
  };
}
