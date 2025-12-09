// src/components/api/index.ts
// Main API functions for quiz generation with Firebase Functions

import { 
  saveQuizTemplate, 
  createAttempt, 
  updateAttempt, 
  getUserAttempts, 
  deleteAttempt, 
  getAttemptById, 
  generateQuestionHash 
} from '@/components/ui/firebase';
import { Timestamp } from 'firebase/firestore';

export interface GenerateQuizFromDocumentParams {
  file: File;
  numQuestions?: number;
  difficulty?: string;
  quizType?: string;
}

export interface GenerateQuizFromTopicParams {
  topic: string;
  difficulty: string;
  quizType: string;
  numQuestions: number;
}

interface ServerQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResponse {
  quiz: Question[];
  success: boolean;
  message?: string;
  error?: string;
  quizId?: string;
  attemptId?: string;
}

const convertQuestionFormat = (serverQuestion: ServerQuestion): Question => {
  const optionsArray = [
    serverQuestion.options.A,
    serverQuestion.options.B,
    serverQuestion.options.C,
    serverQuestion.options.D
  ];

  const correctAnswerText = serverQuestion.options[serverQuestion.correctAnswer as keyof typeof serverQuestion.options];

  return {
    id: serverQuestion.id,
    question: serverQuestion.question,
    options: optionsArray,
    correctAnswer: correctAnswerText,
    explanation: serverQuestion.explanation
  };
};

const convertQuizResponse = (serverQuiz: ServerQuestion[]): Question[] => {
  return serverQuiz.map(convertQuestionFormat);
};

// Firebase Functions URLs - Always use production
const FUNCTIONS_BASE_URL = 'https://us-central1-quizapp-42057.cloudfunctions.net';

export const generateQuizFromDocument = async (
  params: GenerateQuizFromDocumentParams, 
  userId?: string
): Promise<QuizResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", params.file);
    
    if (params.numQuestions) {
      formData.append("numQuestions", params.numQuestions.toString());
    }
    if (params.difficulty) {
      formData.append("difficulty", params.difficulty);
    }
    if (params.quizType) {
      formData.append("quizType", params.quizType);
    }

    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateQuiz`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    const convertedQuiz = convertQuizResponse(result.quiz);
    
    let quizId: string | undefined;
    let attemptId: string | undefined;
    
    if (userId) {
      try {
        const questionHash = generateQuestionHash(convertedQuiz);
        
        const quizTemplate = {
          title: params.file.name,
          type: 'document' as const,
          questions: convertedQuiz,
          fileName: params.file.name,
          settings: { 
            numQuestions: params.numQuestions, 
            difficulty: params.difficulty, 
            quizType: params.quizType 
          },
          questionHash,
        };

        quizId = await saveQuizTemplate(quizTemplate);
        attemptId = await createAttempt(userId, quizId);
      } catch (firestoreError) {
        console.warn('⚠️ Failed to save to Firestore:', firestoreError);
      }
    }
    
    return {
      quiz: convertedQuiz,
      success: true,
      quizId,
      attemptId
    };

  } catch (error) {
    console.error('❌ Error generating quiz from document:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate quiz from document');
  }
};

export const generateQuizFromTopic = async (
  params: GenerateQuizFromTopicParams, 
  userId?: string
): Promise<QuizResponse> => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateQuiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    const convertedQuiz = convertQuizResponse(result.quiz);
    
    let quizId: string | undefined;
    let attemptId: string | undefined;
    
    if (userId) {
      try {
        const questionHash = generateQuestionHash(convertedQuiz);
        
        const quizTemplate = {
          title: params.topic,
          type: 'topic' as const,
          questions: convertedQuiz,
          topic: params.topic,
          settings: { 
            numQuestions: params.numQuestions, 
            difficulty: params.difficulty, 
            quizType: params.quizType 
          },
          questionHash,
        };

        quizId = await saveQuizTemplate(quizTemplate);
        attemptId = await createAttempt(userId, quizId);
      } catch (firestoreError) {
        console.warn('⚠️ Failed to save to Firestore:', firestoreError);
      }
    }
    
    return {
      quiz: convertedQuiz,
      success: true,
      quizId,
      attemptId
    };

  } catch (error) {
    console.error('❌ Error generating quiz from topic:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate quiz from topic');
  }
};

export const getQuizHistory = async (userId?: string) => {
  if (!userId) {
    console.warn('No userId provided for getQuizHistory');
    return [];
  }
  
  try {
    const attempts = await getUserAttempts(userId);
    return attempts;
  } catch (error) {
    console.error('❌ Error fetching quiz history:', error);
    throw error;
  }
};

export const getQuizById = async (attemptId: string, userId?: string) => {
  if (!userId) {
    throw new Error('User ID required to fetch quiz');
  }
  
  try {
    const attempt = await getAttemptById(userId, attemptId);
    return attempt;
  } catch (error) {
    console.error('❌ Error fetching quiz by ID:', error);
    throw error;
  }
};

export const updateQuizCompletion = async (
  userId: string, 
  attemptId: string, 
  completionData: {
    answers: string[];
    score: number;
    completedAt: string;
    timeSpent?: number;
  }
) => {
  try {
    console.log('⏱️ Saving quiz completion with timeSpent:', completionData.timeSpent);
    await updateAttempt(userId, attemptId, {
      userAnswers: completionData.answers,
      score: completionData.score,
      completedAt: Timestamp.fromDate(new Date(completionData.completedAt)),
      timeSpent: completionData.timeSpent
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating quiz completion:', error);
    throw error;
  }
};

export const deleteQuizFromHistory = async (attemptId: string, userId?: string) => {
  if (!userId) {
    throw new Error('User ID required to delete quiz');
  }
  
  try {
    await deleteAttempt(userId, attemptId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting quiz from history:', error);
    throw error;
  }
};

export const generateNewQuizFromDocument = async (
  params: GenerateQuizFromDocumentParams
): Promise<QuizResponse> => {
  try {
    const fileContent = await params.file.text();
    
    console.log('📤 Sending document quiz request to:', `${FUNCTIONS_BASE_URL}/generateQuiz`);
    console.log('📄 File being sent:', params.file.name, 'Size:', params.file.size, 'Type:', params.file.type);
    console.log('📄 File content length:', fileContent.length);
    
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateQuiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: fileContent,
        fileName: params.file.name,
        numQuestions: params.numQuestions,
        difficulty: params.difficulty,
        quizType: params.quizType,
        forceNew: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Document quiz generated successfully');
    
    return {
      ...result,
      success: true
    };

  } catch (error) {
    console.error('❌ Error generating quiz from document:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate quiz from document');
  }
};

export const generateNewQuizFromTopic = async (
  params: GenerateQuizFromTopicParams, 
  userId?: string
): Promise<QuizResponse> => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateQuiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        forceNew: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    const convertedQuiz = convertQuizResponse(result.quiz);
    
    let quizId: string | undefined;
    let attemptId: string | undefined;
    
    if (userId) {
      try {
        const questionHash = generateQuestionHash(convertedQuiz);
        
        const quizTemplate = {
          title: `${params.topic} (New)`,
          type: 'topic' as const,
          questions: convertedQuiz,
          topic: params.topic,
          settings: { 
            numQuestions: params.numQuestions, 
            difficulty: params.difficulty, 
            quizType: params.quizType 
          },
          questionHash,
        };

        quizId = await saveQuizTemplate(quizTemplate);
        attemptId = await createAttempt(userId, quizId);
      } catch (firestoreError) {
        console.warn('⚠️ Failed to save new quiz to Firestore:', firestoreError);
      }
    }
    
    return {
      quiz: convertedQuiz,
      success: true,
      quizId,
      attemptId
    };

  } catch (error) {
    console.error('❌ Error generating new quiz from topic:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate new quiz from topic');
  }
};

export const saveQuizToHistory = async () => {
  console.log('saveQuizToHistory called');
};

export const updateQuizAttempt = async (userId: string, attemptId: string, updates: any) => {
  try {
    await updateAttempt(userId, attemptId, updates);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating quiz attempt:', error);
    throw error;
  }
};

// Generate multi-subject competition template
export interface GenerateCompetitionTemplateParams {
  subjects: {
    english: number;
    mathematics: number;
    science: number;
    socialStudies: number;
    healthWellness?: number;
  };
  difficulty: string;
  gradeLevels: string[];
}

export const generateCompetitionTemplate = async (
  params: GenerateCompetitionTemplateParams
): Promise<QuizResponse> => {
  try {
    console.log('🎓 Generating competition template with subjects:', params.subjects);
    console.log('🌐 API URL:', `${FUNCTIONS_BASE_URL}/generateCompetitionQuiz`);
    
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateCompetitionQuiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Server error response:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('📦 Raw result:', result);
    
    const convertedQuiz = convertQuizResponse(result.quiz);
    
    console.log('✅ Competition template generated:', convertedQuiz.length, 'questions');
    
    return {
      quiz: convertedQuiz,
      success: true
    };

  } catch (error) {
    console.error('❌ Error generating competition template:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    throw new Error(error instanceof Error ? error.message : 'Failed to generate competition template');
  }
};
