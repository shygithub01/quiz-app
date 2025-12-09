// Competition Configuration
export const COMPETITION_CONFIG = {
  // Next competition details
  nextCompetition: {
    date: 'March 15, 2025',
    time: '10:00 AM',
    dateTime: 'March 15, 2025 at 10:00 AM',
    shortDate: 'March 15',
    prizePool: '$300',
    duration: '60 minutes',
    questionCount: 50,
    subjects: 'Math, Science, English, Social Studies',
    eligibleCounty: 'henrico'
  },
  
  // Prize breakdown
  prizes: {
    first: '$150',
    second: '$100', 
    third: '$50',
    total: '$300'
  },
  
  // Eligibility
  eligibility: {
    primaryCounty: 'henrico',
    primaryCountyName: 'Henrico County',
    waitlistCounties: ['chesterfield', 'richmond', 'hanover']
  }
};

// Helper functions (with fallback to static config)
export const getNextCompetitionDate = (dynamicSettings?: any) => 
  dynamicSettings?.dateTime || COMPETITION_CONFIG.nextCompetition.dateTime;

export const getNextCompetitionShortDate = (dynamicSettings?: any) => 
  dynamicSettings?.shortDate || COMPETITION_CONFIG.nextCompetition.shortDate;

export const getPrizePool = (dynamicSettings?: any) => 
  dynamicSettings?.prizePool || COMPETITION_CONFIG.nextCompetition.prizePool;

export const isEligibleCounty = (county: string, dynamicSettings?: any) => 
  county === (dynamicSettings?.eligibleCounty || COMPETITION_CONFIG.eligibility.primaryCounty);

// Dynamic competition data fetcher
export const getDynamicCompetitionConfig = async () => {
  try {
    // This will be imported dynamically to avoid circular dependencies
    const { getActiveCompetitionSettings } = await import('../components/ui/firebase');
    return await getActiveCompetitionSettings();
  } catch (error) {
    console.error('Error fetching dynamic competition config:', error);
    return null;
  }
};