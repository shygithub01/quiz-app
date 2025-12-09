// src/components/ui/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp,
  QuerySnapshot,
  DocumentData,
  getDoc,
  where,
  increment,
  setDoc
} from 'firebase/firestore';
import CryptoJS from 'crypto-js';

// Firebase configuration from .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey) {
  throw new Error('Missing Firebase configuration. Check your .env.local file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== USER ROLE MANAGEMENT =====

// User roles enum
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Get user role from database
const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role || UserRole.STUDENT;
    }
    return UserRole.STUDENT;
  } catch (error) {
    console.error('Error getting user role:', error);
    return UserRole.STUDENT;
  }
};

// Check if a user is an admin (admin or super_admin)
const isAdmin = async (userId: string | null | undefined): Promise<boolean> => {
  if (!userId) return false;
  try {
    const role = await getUserRole(userId);
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Set user role (super admin only)
const setUserRole = async (userId: string, role: UserRole, currentUserRole: UserRole) => {
  if (currentUserRole !== UserRole.SUPER_ADMIN) {
    throw new Error('Only super admins can change user roles');
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role });
    console.log(`✅ User ${userId} role updated to ${role}`);
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

// Initialize user profile with default role
const initializeUserProfile = async (userId: string, email: string, displayName: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user profile with default student role using setDoc
      await setDoc(userRef, {
        email,
        displayName,
        role: UserRole.STUDENT,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log('✅ User profile initialized');
    }
  } catch (error) {
    console.error('Error initializing user profile:', error);
  }
};

// ===== UTILITY FUNCTIONS =====

function generateQuestionHash(questions: any): string {
  return CryptoJS.MD5(JSON.stringify(questions)).toString();
}

// ===== QUIZ TEMPLATE FUNCTIONS =====

interface QuizTemplate {
  title: string;
  type: 'document' | 'topic';
  questions: any[];
  fileName?: string;
  topic?: string;
  settings: {
    numQuestions?: number;
    difficulty?: string;
    quizType?: string;
  };
  questionHash: string;
}

const saveQuizTemplate = async (quizTemplate: QuizTemplate): Promise<string> => {
  try {
    console.log('💾 Saving quiz template:', quizTemplate.title);
    const templatesRef = collection(db, 'quizTemplates');
    const docRef = await addDoc(templatesRef, {
      ...quizTemplate,
      createdAt: Timestamp.now()
    });
    console.log('✅ Quiz template saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving quiz template:', error);
    throw error;
  }
};

const getQuizTemplate = async (templateId: string): Promise<QuizTemplate | null> => {
  try {
    const templateRef = doc(db, 'quizTemplates', templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (templateSnap.exists()) {
      const data = templateSnap.data();
      return { 
        id: templateSnap.id, 
        title: data.title,
        type: data.type,
        questions: data.questions,
        fileName: data.fileName,
        topic: data.topic,
        settings: data.settings,
        questionHash: data.questionHash
      } as QuizTemplate;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching quiz template:', error);
    throw error;
  }
};

// ===== QUIZ ATTEMPT FUNCTIONS =====

interface QuizAttempt {
  id?: string;
  userId: string;
  quizTemplateId: string;
  userAnswers: string[];
  score: number | null;
  completedAt: Timestamp | null;
  startedAt: Timestamp;
  timeSpent?: number; // in seconds
}

const createAttempt = async (userId: string, quizTemplateId: string): Promise<string> => {
  try {
    console.log('📝 Creating quiz attempt for user:', userId);
    const attemptsRef = collection(db, `users/${userId}/attempts`);
    const docRef = await addDoc(attemptsRef, {
      quizTemplateId,
      userAnswers: [],
      score: null,
      completedAt: null,
      startedAt: Timestamp.now()
    });
    console.log('✅ Quiz attempt created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating quiz attempt:', error);
    throw error;
  }
};

const updateAttempt = async (userId: string, attemptId: string, updates: Partial<QuizAttempt>): Promise<void> => {
  try {
    console.log('📝 Updating quiz attempt:', attemptId);
    const attemptRef = doc(db, `users/${userId}/attempts`, attemptId);
    const updateData: any = { ...updates };
    
    // If completing the quiz, add completion timestamp
    if (updates.score !== undefined && !updates.completedAt) {
      updateData.completedAt = Timestamp.now();
    }
    
    await updateDoc(attemptRef, updateData);
    console.log('✅ Quiz attempt updated:', attemptId);
  } catch (error) {
    console.error('❌ Error updating quiz attempt:', error);
    throw error;
  }
};

const getUserAttempts = async (userId: string): Promise<any[]> => {
  try {
    console.log('📊 Fetching attempts for user:', userId);
    const attemptsRef = collection(db, `users/${userId}/attempts`);
    const q = query(attemptsRef, orderBy('startedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const attempts = [];
    for (const attemptDoc of querySnapshot.docs) {
      const attemptData = attemptDoc.data();
      
      // Fetch the quiz template to get title and question count
      const template = await getQuizTemplate(attemptData.quizTemplateId);
      
      attempts.push({
        id: attemptDoc.id,
        title: template?.title || 'Unknown Quiz',
        type: template?.type || 'unknown',
        questionCount: template?.questions?.length || 0,
        score: attemptData.score,
        userAnswers: attemptData.userAnswers || [],
        completedAt: attemptData.completedAt?.toDate ? attemptData.completedAt.toDate().toISOString() : attemptData.completedAt,
        startedAt: attemptData.startedAt?.toDate ? attemptData.startedAt.toDate().toISOString() : attemptData.startedAt,
        settings: template?.settings || {},
        questions: template?.questions || [], // Include questions for retake
        quizTemplateId: attemptData.quizTemplateId,
        timeSpent: attemptData.timeSpent || null
      });
    }
    
    console.log('✅ Fetched attempts:', attempts.length);
    console.log('🕐 Sample attempt timeSpent:', attempts[0]?.timeSpent);
    return attempts;
  } catch (error) {
    console.error('❌ Error fetching user attempts:', error);
    throw error;
  }
};

const deleteAttempt = async (userId: string, attemptId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting attempt:', attemptId);
    const attemptRef = doc(db, `users/${userId}/attempts`, attemptId);
    await deleteDoc(attemptRef);
    console.log('✅ Quiz attempt deleted:', attemptId);
  } catch (error) {
    console.error('❌ Error deleting quiz attempt:', error);
    throw error;
  }
};

const getAttemptById = async (userId: string, attemptId: string): Promise<any | null> => {
  try {
    const attemptRef = doc(db, `users/${userId}/attempts`, attemptId);
    const attemptSnap = await getDoc(attemptRef);
    
    if (attemptSnap.exists()) {
      const attemptData = attemptSnap.data();
      const template = await getQuizTemplate(attemptData.quizTemplateId);
      
      return {
        id: attemptSnap.id,
        title: template?.title || 'Unknown Quiz',
        type: template?.type || 'unknown',
        questions: template?.questions || [],
        userAnswers: attemptData.userAnswers || [],
        score: attemptData.score,
        completedAt: attemptData.completedAt,
        startedAt: attemptData.startedAt,
        settings: template?.settings || {},
        quizTemplateId: attemptData.quizTemplateId
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching attempt by ID:', error);
    throw error;
  }
};

// ===== LEGACY FUNCTIONS (for backward compatibility) =====

const saveQuizToFirestore = async (userId: string, quizData: any) => {
  try {
    const quizzesRef = collection(db, `users/${userId}/quizzes`);
    const docRef = await addDoc(quizzesRef, {
      title: quizData.title || 'Untitled Quiz',
      type: quizData.type,
      questions: quizData.questions || [],
      userAnswers: [],
      score: null,
      questionCount: quizData.questions?.length || 0,
      createdAt: Timestamp.now(),
      completedAt: null,
      settings: quizData.settings || {}
    });
    console.log('✅ Quiz saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving quiz:', error);
    throw error;
  }
};

const getUserQuizzes = async (userId: string): Promise<QuerySnapshot<DocumentData>> => {
  try {
    const quizzesRef = collection(db, `users/${userId}/quizzes`);
    const q = query(quizzesRef, orderBy('createdAt', 'desc'));
    return await getDocs(q);
  } catch (error) {
    console.error('❌ Error fetching quizzes:', error);
    throw error;
  }
};

const updateQuiz = async (userId: string, quizId: string, updates: any) => {
  try {
    const quizRef = doc(db, `users/${userId}/quizzes`, quizId);
    await updateDoc(quizRef, {
      ...updates,
      completedAt: Timestamp.now()
    });
    console.log('✅ Quiz updated:', quizId);
  } catch (error) {
    console.error('❌ Error updating quiz:', error);
    throw error;
  }
};

const deleteQuiz = async (userId: string, quizId: string) => {
  try {
    const quizRef = doc(db, `users/${userId}/quizzes`, quizId);
    await deleteDoc(quizRef);
    console.log('✅ Quiz deleted:', quizId);
  } catch (error) {
    console.error('❌ Error deleting quiz:', error);
    throw error;
  }
};

// ===== EXPORTS =====



export { 
  // Firebase instances
  app, 
  auth, 
  db,
  
  // Utility functions
  generateQuestionHash,
  
  // Quiz Template functions
  saveQuizTemplate,
  getQuizTemplate,
  
  // Quiz Attempt functions
  createAttempt,
  updateAttempt,
  getUserAttempts,
  deleteAttempt,
  getAttemptById,
  
  // Legacy functions (for backward compatibility)
  saveQuizToFirestore, 
  getUserQuizzes, 
  updateQuiz, 
  deleteQuiz
};

// ===== COMPETITION FUNCTIONS =====

const getCompetitions = async (status?: 'upcoming' | 'active' | 'completed'): Promise<any[]> => {
  try {
    console.log('🏆 Fetching competitions, status filter:', status);
    const competitionsRef = collection(db, 'competitions');
    let q = query(competitionsRef, orderBy('startDate', 'desc'));
    
    if (status) {
      q = query(competitionsRef, where('status', '==', status), orderBy('startDate', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const competitions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
        endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      };
    });
    
    console.log('✅ Fetched competitions:', competitions.length);
    return competitions;
  } catch (error) {
    console.error('❌ Error fetching competitions:', error);
    throw error;
  }
};

const getCompetitionById = async (competitionId: string): Promise<any | null> => {
  try {
    console.log('🏆 Fetching competition:', competitionId);
    const competitionRef = doc(db, 'competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (!competitionDoc.exists()) {
      return null;
    }
    
    const data = competitionDoc.data();
    return {
      id: competitionDoc.id,
      ...data,
      startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
      endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
    };
  } catch (error) {
    console.error('❌ Error fetching competition:', error);
    throw error;
  }
};

const createCompetition = async (competitionData: any): Promise<string> => {
  try {
    console.log('🏆 Creating competition:', competitionData.title);
    const competitionsRef = collection(db, 'competitions');
    const docRef = await addDoc(competitionsRef, {
      ...competitionData,
      participantCount: 0,
      createdAt: Timestamp.now()
      // startDate and endDate are already Timestamps, don't convert again
    });
    console.log('✅ Competition created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating competition:', error);
    throw error;
  }
};

// ===== LEADERBOARD FUNCTIONS =====

const getLeaderboard = async (competitionId: string): Promise<any[]> => {
  try {
    console.log('📊 Fetching leaderboard for competition:', competitionId);
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(
      leaderboardRef,
      where('competitionId', '==', competitionId),
      orderBy('rank', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate()
    }));
    
    console.log('✅ Fetched leaderboard entries:', entries.length);
    return entries;
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    throw error;
  }
};

const checkUserParticipation = async (
  userId: string,
  competitionId: string
): Promise<boolean> => {
  try {
    console.log('🔍 Checking participation for user:', userId, 'competition:', competitionId);
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(
      leaderboardRef,
      where('competitionId', '==', competitionId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const hasParticipated = !querySnapshot.empty;
    console.log('✅ Participation check:', hasParticipated ? 'Already participated' : 'Not participated');
    return hasParticipated;
  } catch (error) {
    console.error('❌ Error checking participation:', error);
    throw error;
  }
};

const submitCompetitionAttempt = async (
  userId: string,
  competitionId: string,
  attemptData: {
    score: number;
    totalQuestions: number;
    timeSpent: number;
    attemptId: string;
    userName: string;
    userEmail: string;
    school?: string;
  }
): Promise<void> => {
  try {
    console.log('🏆 Submitting competition attempt for user:', userId);
    
    // Check if already participated
    const hasParticipated = await checkUserParticipation(userId, competitionId);
    if (hasParticipated) {
      throw new Error('You have already participated in this competition');
    }
    
    // Add to leaderboard
    const leaderboardRef = collection(db, 'leaderboard');
    await addDoc(leaderboardRef, {
      competitionId,
      userId,
      userName: attemptData.userName,
      userEmail: attemptData.userEmail,
      school: attemptData.school || null,
      score: attemptData.score,
      totalQuestions: attemptData.totalQuestions,
      timeSpent: attemptData.timeSpent,
      rank: 0, // Will be calculated
      completedAt: Timestamp.now(),
      attemptId: attemptData.attemptId
    });
    
    // Recalculate all ranks for this competition
    await recalculateRanks(competitionId);
    
    // Increment participant count
    const competitionRef = doc(db, 'competitions', competitionId);
    await updateDoc(competitionRef, {
      participantCount: increment(1)
    });
    
    console.log('✅ Competition attempt submitted');
  } catch (error) {
    console.error('❌ Error submitting competition attempt:', error);
    throw error;
  }
};

const recalculateRanks = async (competitionId: string): Promise<void> => {
  try {
    console.log('📊 Recalculating ranks for competition:', competitionId);
    
    // Fetch all entries for this competition
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, where('competitionId', '==', competitionId));
    const querySnapshot = await getDocs(q);
    
    // Sort entries: by score (desc), then by time (asc), then by completedAt (asc)
    const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ref: doc.ref,
      ...doc.data()
    })).sort((a: any, b: any) => {
      // Higher score is better
      if (b.score !== a.score) return b.score - a.score;
      // Lower time is better
      if (a.timeSpent !== b.timeSpent) return a.timeSpent - b.timeSpent;
      // Earlier completion is better
      return a.completedAt.seconds - b.completedAt.seconds;
    });
    
    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      await updateDoc(entries[i].ref, { rank: i + 1 });
    }
    
    console.log('✅ Ranks recalculated for', entries.length, 'entries');
  } catch (error) {
    console.error('❌ Error recalculating ranks:', error);
    throw error;
  }
};

// ===== TEST DATA FUNCTIONS =====

const createTestCompetition = async (): Promise<string> => {
  try {
    console.log('🧪 Creating test competition...');
    
    const now = new Date();
    const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const endDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    
    const testCompetition = {
      title: 'Winter Math Challenge 2025',
      description: 'Test your math skills in this exciting competition! Solve problems across algebra, geometry, and calculus.',
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      quizTemplateId: 'test-template-id', // You'll need to create a real template
      rules: [
        'Complete all questions within the time limit',
        'No external resources allowed',
        'Each question is worth equal points',
        'Ties are broken by completion time'
      ],
      prizes: [
        '1st Place: $500 + Trophy',
        '2nd Place: $300 + Medal',
        '3rd Place: $100 + Medal'
      ]
    };
    
    const competitionId = await createCompetition(testCompetition);
    console.log('✅ Test competition created:', competitionId);
    return competitionId;
  } catch (error) {
    console.error('❌ Error creating test competition:', error);
    throw error;
  }
};

// ===== ADMIN FUNCTIONS =====

const resetUserAttempt = async (userId: string, competitionId: string) => {
  try {
    console.log('🔄 Resetting attempt for user:', userId, 'competition:', competitionId);
    
    // Find and delete the leaderboard entry
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(
      leaderboardRef,
      where('userId', '==', userId),
      where('competitionId', '==', competitionId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('⚠️ No attempt found to reset');
      return { success: false, message: 'No attempt found for this user' };
    }
    
    // Delete all matching entries (should only be one)
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Update competition participant count
    const competitionRef = doc(db, 'competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (competitionDoc.exists()) {
      const currentCount = competitionDoc.data().participantCount || 0;
      await updateDoc(competitionRef, {
        participantCount: Math.max(0, currentCount - 1)
      });
    }
    
    console.log('✅ Attempt reset successfully');
    return { success: true, message: 'Attempt reset successfully' };
    
  } catch (error) {
    console.error('❌ Error resetting attempt:', error);
    throw error;
  }
};

// ===== COMPETITION UPDATE FUNCTIONS =====

const updateCompetition = async (competitionId: string, updateData: any) => {
  try {
    console.log('🔄 Updating competition:', competitionId);
    
    const competitionRef = doc(db, 'competitions', competitionId);
    
    // Add updatedAt timestamp
    const dataToUpdate = {
      ...updateData,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(competitionRef, dataToUpdate);
    console.log('✅ Competition updated successfully');
    
    return { success: true, message: 'Competition updated successfully' };
  } catch (error) {
    console.error('❌ Error updating competition:', error);
    throw error;
  }
};

const deleteCompetition = async (competitionId: string) => {
  try {
    console.log('🗑️ Deleting competition:', competitionId);
    
    // Delete the competition document
    const competitionRef = doc(db, 'competitions', competitionId);
    await deleteDoc(competitionRef);
    
    // Note: We might want to also delete related leaderboard entries
    // But for now, we'll keep them for historical data
    
    console.log('✅ Competition deleted successfully');
    return { success: true, message: 'Competition deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting competition:', error);
    throw error;
  }
};

// ===== COMPETITION SETTINGS FUNCTIONS =====

interface CompetitionSettings {
  id?: string;
  name: string;
  date: string;
  time: string;
  dateTime: string;
  shortDate: string;
  prizePool: string;
  duration: string;
  questionCount: number;
  subjects: string;
  eligibleCounty: string;
  isActive: boolean;
  registrationOpen: boolean;
  registrationDeadline: string;
  testOpenTime: string;
  testCloseTime: string;
  rules: string[];
  instructions: string[];
  eligibilityRequirements: string[];
  prizeBreakdown: string[];
  contactInfo: string;
  publishDetails: boolean;
  autoCloseRegistration: boolean;
  createdAt: string;
  updatedAt: string;
}

const getActiveCompetitionSettings = async (): Promise<CompetitionSettings | null> => {
  try {
    console.log('🏆 Fetching active competition settings...');
    const settingsRef = collection(db, 'competitionSettings');
    
    // Simple query - get all and filter in memory to avoid index requirements
    const querySnapshot = await getDocs(settingsRef);
    
    if (!querySnapshot.empty) {
      // Find active competition
      const activeDocs = querySnapshot.docs.filter(doc => doc.data().isActive === true);
      
      if (activeDocs.length > 0) {
        // Sort by createdAt in memory
        const sorted = activeDocs.sort((a, b) => {
          const aTime = a.data().createdAt || '';
          const bTime = b.data().createdAt || '';
          return bTime.localeCompare(aTime);
        });
        
        const doc = sorted[0];
        const settings = { id: doc.id, ...doc.data() } as CompetitionSettings;
        console.log('✅ Active competition found:', settings);
        return settings;
      }
    }
    
    console.log('⚠️ No active competition found, creating default...');
    // Create default competition if none exists
    const defaultSettings = await createDefaultCompetition();
    return defaultSettings;
  } catch (error) {
    console.error('❌ Error fetching competition settings:', error);
    console.error('❌ Full error:', error);
    return null;
  }
};

const createDefaultCompetition = async (): Promise<CompetitionSettings> => {
  try {
    console.log('🎯 Creating default competition...');
    const defaultCompetition = {
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
      autoCloseRegistration: false
    };

    const competitionId = await saveCompetitionSettings(defaultCompetition);
    return { id: competitionId, ...defaultCompetition } as CompetitionSettings;
  } catch (error) {
    console.error('❌ Error creating default competition:', error);
    throw error;
  }
};

const saveCompetitionSettings = async (settings: Omit<CompetitionSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    console.log('💾 Saving competition settings:', settings);
    
    // First, deactivate all existing competitions
    const existingRef = collection(db, 'competitionSettings');
    const existingQuery = query(existingRef, where('isActive', '==', true));
    const existingSnapshot = await getDocs(existingQuery);
    
    const deactivatePromises = existingSnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isActive: false, updatedAt: new Date().toISOString() })
    );
    await Promise.all(deactivatePromises);
    
    // Create new active competition
    const settingsRef = collection(db, 'competitionSettings');
    const docRef = await addDoc(settingsRef, {
      ...settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Competition settings saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving competition settings:', error);
    throw error;
  }
};

const updateCompetitionSettings = async (id: string, updates: Partial<CompetitionSettings>): Promise<void> => {
  try {
    console.log('🔄 Updating competition settings:', id, updates);
    const settingsRef = doc(db, 'competitionSettings', id);
    await updateDoc(settingsRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Competition settings updated');
  } catch (error) {
    console.error('❌ Error updating competition settings:', error);
    throw error;
  }
};

const getAllCompetitionSettings = async (): Promise<CompetitionSettings[]> => {
  try {
    console.log('📋 Fetching all competition settings...');
    const settingsRef = collection(db, 'competitionSettings');
    const querySnapshot = await getDocs(settingsRef);
    
    // Sort in memory to avoid index requirement
    const settings = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt || '';
        const bTime = b.createdAt || '';
        return bTime.localeCompare(aTime);
      }) as CompetitionSettings[];
    
    console.log('✅ Fetched competition settings:', settings.length);
    return settings;
  } catch (error) {
    console.error('❌ Error fetching all competition settings:', error);
    return [];
  }
};

// ===== SCHOLARSHIP REGISTRATION FUNCTIONS =====

const checkScholarshipRegistration = async (userId: string) => {
  try {
    console.log('🎓 Checking scholarship registration for user:', userId);
    const userDoc = await getDoc(doc(db, 'scholarshipRegistrations', userId));
    const registration = userDoc.exists() ? userDoc.data() : null;
    console.log('✅ Registration check result:', registration ? 'Found' : 'Not found');
    if (registration) {
      console.log('📋 Registration data:', registration);
    }
    return registration;
  } catch (error) {
    console.error('❌ Error checking scholarship registration:', error);
    console.error('❌ Error details:', error);
    return null;
  }
};

// Temporary debug function to list all registrations (admin only)
const debugListAllRegistrations = async () => {
  try {
    console.log('🔍 DEBUG: Listing all scholarship registrations...');
    const registrationsRef = collection(db, 'scholarshipRegistrations');
    const querySnapshot = await getDocs(registrationsRef);
    
    console.log('📊 Total registrations found:', querySnapshot.size);
    querySnapshot.forEach((doc) => {
      console.log('📋 Registration ID:', doc.id, 'Data:', doc.data());
    });
  } catch (error) {
    console.error('❌ Error listing registrations:', error);
  }
};

const saveScholarshipRegistration = async (userId: string, registrationData: any) => {
  try {
    console.log('💾 Saving scholarship registration for user:', userId);
    await setDoc(doc(db, 'scholarshipRegistrations', userId), {
      ...registrationData,
      registeredAt: new Date().toISOString(),
      userId
    });
    console.log('✅ Scholarship registration saved successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving scholarship registration:', error);
    return { success: false, error };
  }
};

// Export new functions
// Make debug function available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugListAllRegistrations = debugListAllRegistrations;
  (window as any).checkScholarshipRegistration = checkScholarshipRegistration;
}

export {
  // ... existing exports
  getCompetitions,
  getCompetitionById,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getLeaderboard,
  submitCompetitionAttempt,
  recalculateRanks,
  createTestCompetition,
  checkUserParticipation,
  resetUserAttempt,
  isAdmin,
  getUserRole,
  setUserRole,
  initializeUserProfile,
  checkScholarshipRegistration,
  saveScholarshipRegistration,
  debugListAllRegistrations,
  getActiveCompetitionSettings,
  saveCompetitionSettings,
  updateCompetitionSettings,
  getAllCompetitionSettings,
  createDefaultCompetition
};
