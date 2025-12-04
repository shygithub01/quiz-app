// Utility to create a test competition
// Run this from the browser console: window.createTestCompetition()

import { createTestCompetition } from '../components/ui/firebase';

// Make it available globally for testing
(window as any).createTestCompetition = async () => {
  try {
    console.log('Creating test competition...');
    const competitionId = await createTestCompetition();
    console.log('✅ Test competition created with ID:', competitionId);
    console.log('Navigate to /competitions to see it!');
    return competitionId;
  } catch (error) {
    console.error('❌ Failed to create test competition:', error);
    throw error;
  }
};

console.log('💡 To create a test competition, run: window.createTestCompetition()');
