// src/components/api/index.ts
// Main API functions for quiz generation with Firebase Functions
import { saveQuizTemplate, createAttempt, updateAttempt, getUserAttempts, deleteAttempt, getAttemptById, generateQuestionHash } from '@/components/ui/firebase';
const convertQuestionFormat = (serverQuestion) => {
    const optionsArray = [
        serverQuestion.options.A,
        serverQuestion.options.B,
        serverQuestion.options.C,
        serverQuestion.options.D
    ];
    const correctAnswerText = serverQuestion.options[serverQuestion.correctAnswer];
    return {
        id: serverQuestion.id,
        question: serverQuestion.question,
        options: optionsArray,
        correctAnswer: correctAnswerText,
        explanation: serverQuestion.explanation
    };
};
const convertQuizResponse = (serverQuiz) => {
    return serverQuiz.map(convertQuestionFormat);
};
// Firebase Functions URLs - Update these with your project ID
const isDevelopment = import.meta.env.DEV;
const FUNCTIONS_BASE_URL = isDevelopment
    ? 'http://localhost:5001/quizapp-42057/us-central1'
    : 'https://us-central1-quizapp-42057.cloudfunctions.net';
export const generateQuizFromDocument = async (params, userId) => {
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
            const errorMessage = errorData.error || `Server error: ${response.status}`;
            throw new Error(errorMessage);
        }
        const result = await response.json();
        const convertedQuiz = convertQuizResponse(result.quiz);
        let quizId;
        let attemptId;
        if (userId) {
            try {
                const questionHash = generateQuestionHash(convertedQuiz);
                const quizTemplate = {
                    title: params.file.name,
                    type: 'document',
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
            }
            catch (firestoreError) {
                console.warn('⚠️ Failed to save to Firestore:', firestoreError);
            }
        }
        return {
            quiz: convertedQuiz,
            success: true,
            quizId,
            attemptId
        };
    }
    catch (error) {
        console.error('❌ Error generating quiz from document:', error);
        // Preserve the original error message instead of overriding it
        throw error;
    }
};
export const generateQuizFromTopic = async (params, userId) => {
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
            const errorMessage = errorData.error || `Server error: ${response.status}`;
            throw new Error(errorMessage);
        }
        const result = await response.json();
        const convertedQuiz = convertQuizResponse(result.quiz);
        let quizId;
        let attemptId;
        if (userId) {
            try {
                const questionHash = generateQuestionHash(convertedQuiz);
                const quizTemplate = {
                    title: params.topic,
                    type: 'topic',
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
            }
            catch (firestoreError) {
                console.warn('⚠️ Failed to save to Firestore:', firestoreError);
            }
        }
        return {
            quiz: convertedQuiz,
            success: true,
            quizId,
            attemptId
        };
    }
    catch (error) {
        console.error('❌ Error generating quiz from topic:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate quiz from topic');
    }
};
export const getQuizHistory = async (userId) => {
    if (!userId) {
        console.warn('No userId provided for getQuizHistory');
        return [];
    }
    try {
        const attempts = await getUserAttempts(userId);
        return attempts;
    }
    catch (error) {
        console.error('❌ Error fetching quiz history:', error);
        throw error;
    }
};
export const getQuizById = async (attemptId, userId) => {
    if (!userId) {
        throw new Error('User ID required to fetch quiz');
    }
    try {
        const attempt = await getAttemptById(userId, attemptId);
        return attempt;
    }
    catch (error) {
        console.error('❌ Error fetching quiz by ID:', error);
        throw error;
    }
};
export const updateQuizCompletion = async (userId, attemptId, completionData) => {
    try {
        await updateAttempt(userId, attemptId, {
            userAnswers: completionData.answers,
            score: completionData.score,
            completedAt: completionData.completedAt,
            status: 'completed'
        });
        return { success: true };
    }
    catch (error) {
        console.error('❌ Error updating quiz completion:', error);
        throw error;
    }
};
export const deleteQuizFromHistory = async (attemptId, userId) => {
    if (!userId) {
        throw new Error('User ID required to delete quiz');
    }
    try {
        await deleteAttempt(userId, attemptId);
        return { success: true };
    }
    catch (error) {
        console.error('❌ Error deleting quiz from history:', error);
        throw error;
    }
};
export const generateNewQuizFromDocument = async (params, userId) => {
    try {
        console.log('📤 Sending document quiz request to:', `${FUNCTIONS_BASE_URL}/generateQuiz`);
        console.log('📄 File being sent:', params.file.name, 'Size:', params.file.size, 'Type:', params.file.type);
        
        // Validate file type before processing
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];
        
        const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
        const fileExtension = params.file.name.toLowerCase().substring(params.file.name.lastIndexOf('.'));
        
        if (!allowedTypes.includes(params.file.type) && !allowedExtensions.includes(fileExtension)) {
            throw new Error(`Unsupported file type. Please upload only: PDF (.pdf), Word documents (.docx, .doc), or text files (.txt). You uploaded: ${params.file.name}`);
        }
        
        // Convert file to base64 string using FileReader (browser-compatible)
        const base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(params.file);
        });
        
        console.log('📄 File converted to base64, length:', base64String.length);
        
        const response = await fetch(`${FUNCTIONS_BASE_URL}/generateQuiz`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                file: base64String,
                fileName: params.file.name,
                fileType: params.file.type,
                numQuestions: params.numQuestions,
                difficulty: params.difficulty,
                quizType: params.quizType,
                forceNew: true
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Server error: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Document quiz generated successfully');
        
        // Convert the quiz response to the expected format
        const convertedQuiz = convertQuizResponse(result.quiz);
        
        let quizId;
        let attemptId;
        if (userId) {
            try {
                const questionHash = generateQuestionHash(convertedQuiz);
                const quizTemplate = {
                    title: `${params.file.name} (New)`,
                    type: 'document',
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
            }
            catch (firestoreError) {
                console.warn('⚠️ Failed to save new quiz to Firestore:', firestoreError);
            }
        }
        
        return {
            quiz: convertedQuiz,
            success: true,
            quizId,
            attemptId
        };
    }
    catch (error) {
        console.error('❌ Error generating quiz from document:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate quiz from document');
    }
};
export const generateNewQuizFromTopic = async (params, userId) => {
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
            const errorMessage = errorData.error || `Server error: ${response.status}`;
            throw new Error(errorMessage);
        }
        const result = await response.json();
        const convertedQuiz = convertQuizResponse(result.quiz);
        let quizId;
        let attemptId;
        if (userId) {
            try {
                const questionHash = generateQuestionHash(convertedQuiz);
                const quizTemplate = {
                    title: `${params.topic} (New)`,
                    type: 'topic',
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
            }
            catch (firestoreError) {
                console.warn('⚠️ Failed to save new quiz to Firestore:', firestoreError);
            }
        }
        return {
            quiz: convertedQuiz,
            success: true,
            quizId,
            attemptId
        };
    }
    catch (error) {
        console.error('❌ Error generating new quiz from topic:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate new quiz from topic');
    }
};
export const saveQuizToHistory = async (quizData) => {
    console.warn('saveQuizToHistory is deprecated - quiz saving now handled automatically');
    return { success: true };
};
export const updateQuizAttempt = async (userId, attemptId, updates) => {
    try {
        await updateAttempt(userId, attemptId, updates);
        return { success: true };
    }
    catch (error) {
        console.error('❌ Error updating quiz attempt:', error);
        throw error;
    }
};
