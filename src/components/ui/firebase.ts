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
  getDoc
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
        quizTemplateId: attemptData.quizTemplateId
      });
    }
    
    console.log('✅ Fetched attempts:', attempts.length);
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
