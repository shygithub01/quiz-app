// API utility functions for quiz generation
// API Base URL - CRITICAL: Point to your local server
const API_BASE_URL = 'http://localhost:3001';
// Generate quiz from uploaded document
export const generateQuizFromDocument = async (params) => {
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
    const response = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
        method: "POST",
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    return await response.json();
};
// Generate quiz from topic - CORRECTED ENDPOINT
export const generateQuizFromTopic = async (params) => {
    const response = await fetch(`${API_BASE_URL}/api/generate-quiz-from-topic`, {
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
    return await response.json();
};
// Get quiz history
export const getQuizHistory = async () => {
    const response = await fetch(`${API_BASE_URL}/api/quiz-history`);
    if (!response.ok) {
        throw new Error('Failed to fetch quiz history');
    }
    return await response.json();
};
// Get specific quiz by ID
export const getQuizById = async (quizId) => {
    const response = await fetch(`${API_BASE_URL}/api/quiz-history/${encodeURIComponent(quizId)}`);
    if (!response.ok) {
        throw new Error('Failed to fetch quiz data');
    }
    return await response.json();
};
// Save quiz to history
export const saveQuizToHistory = async (quizData) => {
    const response = await fetch(`${API_BASE_URL}/api/quiz-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
    });
    if (!response.ok) {
        throw new Error('Failed to save quiz history');
    }
    return await response.json();
};
// Delete quiz from history
export const deleteQuizFromHistory = async (quizId) => {
    const response = await fetch(`${API_BASE_URL}/api/quiz-history/${encodeURIComponent(quizId)}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error('Failed to delete quiz');
    }
    return await response.json();
};
// ********** New Code **********
// Integrated Firestore persistence with existing OpenAI calls
// Now, generation functions save to Firestore after OpenAI response
// History functions use Firestore instead
// Requires userId (from useAuth) when calling generation functions
import { saveQuizTemplate, createAttempt, updateAttempt, getUserAttempts, deleteAttempt, generateQuestionHash } from '@/components/ui/firebase'; // Adjust path if needed
// Rename original generation functions to avoid conflict
const originalGenerateQuizFromDocument = generateQuizFromDocument;
const originalGenerateQuizFromTopic = generateQuizFromTopic;
// Updated generate EpidemiologyFromDocument with Firestore save
export const generateQuizFromDocument = async (params, userId, forceNew = false) => {
    const openAIResponse = await originalGenerateQuizFromDocument(params);
    const questionHash = generateQuestionHash(openAIResponse.quiz);
    const quizTemplate = {
        title: params.file.name,
        type: 'document',
        questions: openAIResponse.quiz,
        fileName: params.file.name,
        settings: { numQuestions: params.numQuestions, difficulty: params.difficulty, quizType: params.quizType },
        questionHash,
    };
    const quizId = await saveQuizTemplate(quizTemplate);
    const attemptId = await createAttempt(userId, quizId);
    return { ...openAIResponse, quizId, attemptId };
};
// Updated generateQuizFromTopic with Firestore save
export const generateQuizFromTopic = async (params, userId, forceNew = false) => {
    const openAIResponse = await originalGenerateQuizFromTopic(params);
    const questionHash = generateQuestionHash(openAIResponse.quiz);
    const quizTemplate = {
        title: params.topic,
        type: 'topic',
        questions: openAIResponse.quiz,
        topic: params.topic,
        settings: { numQuestions: params.numQuestions, difficulty: params.difficulty, quizType: params.quizType },
        questionHash,
    };
    const quizId = await saveQuizTemplate(quizTemplate);
    const attemptId = await createAttempt(userId, quizId);
    return { ...openAIResponse, quizId, attemptId };
};
// Updated getQuizHistory to use Firestore
export const getQuizHistory = async (userId) => {
    return await getUserAttempts(userId);
};
// Updated deleteQuizFromHistory to delete attempt in Firestore
export const deleteQuizFromHistory = async (userId, attemptId) => {
    await deleteAttempt(userId, attemptId);
    return { success: true };
};
// New function to update attempt (used for progressive saves)
export const updateQuizAttempt = async (userId, attemptId, updates) => {
    await updateAttempt(userId, attemptId, updates);
};
// Updated getQuizById to fetch attempt from Firestore (adjust if you need full quiz template too)
export const getQuizById = async (userId, attemptId) => {
    const attempts = await getUserAttempts(userId);
    const attempt = attempts.find(a => a.id === attemptId);
    if (!attempt)
        throw new Error('Attempt not found');
    return attempt;
};
