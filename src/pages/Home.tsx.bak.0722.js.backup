import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, FileText, Zap, Upload, ArrowLeft, ArrowRight, CheckCircle, XCircle, MessageSquare, Target, Lightbulb } from 'lucide-react';
export default function Home() {
    const { user, signIn } = useAuth(); // ← FIXED: Get both user and signIn from Firebase
    const isSignedIn = !!user; // ← FIXED: Derive isSignedIn from user
    const isLoaded = true; // ← FIXED: Firebase loads quickly
    const [searchParams, setSearchParams] = useSearchParams();
    // NEW: Tab and topic states
    const [activeTab, setActiveTab] = useState('document');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [quizType, setQuizType] = useState('multiple-choice');
    // EXISTING: State management (unchanged)
    const [file, setFile] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [numQuestions, setNumQuestions] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    // EXISTING: Quiz states (unchanged)
    const [fullQuizData, setFullQuizData] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [showResults, setShowResults] = useState(false);
    // NEW: Track current quiz ID to prevent duplicates
    const [currentQuizId, setCurrentQuizId] = useState(null);
    // EXISTING: Handle retake parameter from URL (unchanged)
    useEffect(() => {
        const retakeQuizId = searchParams.get('retake');
        if (retakeQuizId && isSignedIn) {
            console.log('🔄 Retaking quiz:', retakeQuizId);
            handleRetakeQuiz(retakeQuizId);
            setSearchParams({});
        }
    }, [isSignedIn, searchParams]);
    // FIXED: Handle retaking a quiz from past quizzes (CORRECTED DATA ACCESS)
    const handleRetakeQuiz = async (quizId) => {
        try {
            setLoading(true);
            setError('');
            console.log('📥 Fetching quiz for retake:', quizId);
            const response = await fetch(`/api/quiz-history/${encodeURIComponent(quizId)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch quiz data');
            }
            const quizData = await response.json();
            console.log('📋 Retrieved quiz data:', quizData);
            // FIX: Check for quiz.length instead of questions.length
            if (!quizData.quiz || quizData.quiz.length === 0) {
                throw new Error('No questions found in saved quiz');
            }
            // FIX: Use quizData.quiz instead of quizData.questions
            setFullQuizData(quizData.quiz);
            setCurrentQuiz(quizData.quiz);
            setCurrentQuestionIndex(0);
            setUserAnswers([]);
            setQuizCompleted(false);
            setShowResults(false);
            // FIX: Set current quiz ID for retakes
            setCurrentQuizId(quizData.id || quizId);
            // FIX: Handle both document and topic quizzes
            setFile({
                name: quizData.fileName || quizData.topic || 'Unknown Quiz',
                size: 0,
                type: quizData.fileType || quizData.type || 'quiz',
                lastModified: Date.now(),
                kind: 'retake'
            });
            // FIX: Set the correct tab based on quiz type
            if (quizData.topic) {
                setActiveTab('topic');
                setTopic(quizData.topic);
                setDifficulty(quizData.settings?.difficulty || 'medium');
                setQuizType(quizData.settings?.quizType || 'multiple-choice');
                setNumQuestions(quizData.settings?.numQuestions || 5);
            }
            else {
                setActiveTab('document');
            }
            console.log('✅ Quiz retake setup complete');
        }
        catch (error) {
            console.error('❌ Error setting up retake:', error);
            setError(`Failed to retake quiz: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    // EXISTING: Parse quiz text into structured Question[] (unchanged)
    const parseQuizText = (quizText) => {
        const questions = [];
        const questionBlocks = quizText.split(/Q\d+:/);
        questionBlocks.forEach((block, index) => {
            if (index === 0 || !block.trim())
                return;
            const lines = block.trim().split('\n').filter(line => line.trim());
            if (lines.length < 6)
                return;
            const questionText = lines[0].trim();
            const options = { A: '', B: '', C: '', D: '' };
            let correctAnswer = '';
            let explanation = '';
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('A.'))
                    options.A = trimmedLine.substring(2).trim();
                else if (trimmedLine.startsWith('B.'))
                    options.B = trimmedLine.substring(2).trim();
                else if (trimmedLine.startsWith('C.'))
                    options.C = trimmedLine.substring(2).trim();
                else if (trimmedLine.startsWith('D.'))
                    options.D = trimmedLine.substring(2).trim();
                else if (trimmedLine.startsWith('Answer:'))
                    correctAnswer = trimmedLine.substring(7).trim();
                else if (trimmedLine.startsWith('Explanation:'))
                    explanation = trimmedLine.substring(12).trim();
            });
            if (questionText && options.A && options.B && options.C && options.D && correctAnswer) {
                questions.push({
                    id: index,
                    question: questionText,
                    options,
                    correctAnswer,
                    explanation
                });
            }
        });
        return questions;
    };
    // EXISTING: Universal quiz data processor (unchanged)
    const processQuizData = (data) => {
        console.log('🔍 Processing quiz data:', data);
        try {
            if (!data.quiz) {
                throw new Error('No quiz data received from server');
            }
            let questions = [];
            // Format 1: Array of objects (New local server format)
            if (Array.isArray(data.quiz)) {
                console.log('📋 Processing array format');
                questions = data.quiz.map((q, index) => ({
                    id: q.id || index + 1,
                    question: q.question || `Question ${index + 1}`,
                    options: q.options || { A: '', B: '', C: '', D: '' },
                    correctAnswer: q.correctAnswer || 'A',
                    explanation: q.explanation || ''
                }));
            }
            // Format 2: String (Old Vercel format)
            else if (typeof data.quiz === 'string') {
                console.log('📄 Processing string format');
                questions = parseQuizText(data.quiz);
            }
            else {
                throw new Error('Unsupported quiz data format');
            }
            // Validate questions
            const validQuestions = questions.filter(q => q.question &&
                q.options &&
                q.options.A &&
                q.options.B &&
                q.options.C &&
                q.options.D &&
                q.correctAnswer);
            console.log(`✅ Processed ${validQuestions.length} valid questions`);
            return validQuestions;
        }
        catch (error) {
            console.error('❌ Error processing quiz data:', error);
            throw new Error(`Failed to process quiz data: ${error.message}`);
        }
    };
    // EXISTING: File upload handler (unchanged)
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File too large! Please choose a smaller file (max 5MB).");
                e.target.value = '';
                return;
            }
            setFile(selectedFile);
            setOriginalFile(selectedFile);
            setError("");
            resetQuiz();
        }
    };
    // EXISTING: Complete reset function with NEW quiz ID reset
    const resetAll = () => {
        setFile(null);
        setOriginalFile(null);
        setFullQuizData([]);
        setCurrentQuiz([]);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setQuizCompleted(false);
        setShowResults(false);
        setError("");
        setLoading(false);
        setUploadProgress(0);
        setNumQuestions(5);
        // NEW: Reset topic-related states
        setTopic('');
        setDifficulty('medium');
        setQuizType('multiple-choice');
        setActiveTab('document');
        setCurrentQuizId(null); // NEW: Reset quiz ID
        setTimeout(() => {
            const fileInput = document.getElementById('file-upload');
            if (fileInput)
                fileInput.value = '';
        }, 100);
    };
    // EXISTING: Reset quiz for retake (unchanged)
    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setQuizCompleted(false);
        setShowResults(false);
        setError("");
    };
    // EXISTING: Main form submission with NEW quiz ID capture
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || file.kind === "file" && !('size' in file)) {
            setError("Please select a file");
            return;
        }
        setLoading(true);
        setError("");
        setUploadProgress(0);
        resetQuiz();
        const formData = new FormData();
        formData.append("file", file);
        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);
            const res = await fetch("/api/generate-quiz", {
                method: "POST",
                body: formData,
            });
            clearInterval(progressInterval);
            setUploadProgress(100);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${res.status}`);
            }
            const data = await res.json();
            const parsedQuestions = processQuizData(data);
            // NEW: Capture quiz ID to prevent duplicates
            setCurrentQuizId(data.quizId || null);
            if (parsedQuestions.length === 0) {
                throw new Error("No valid questions could be generated from your document.");
            }
            setFullQuizData(parsedQuestions);
            startQuiz(parsedQuestions, false);
        }
        catch (error) {
            setError(error.message || 'Failed to generate quiz. Please try again.');
        }
        finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };
    // NEW: Topic form submission with quiz ID capture
    const handleTopicSubmit = async (e) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError("Please enter a topic");
            return;
        }
        setLoading(true);
        setError("");
        setUploadProgress(0);
        resetQuiz();
        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);
            const res = await fetch("/api/generate-quiz-from-topic", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic: topic.trim(),
                    difficulty,
                    quizType,
                    numQuestions,
                }),
            });
            clearInterval(progressInterval);
            setUploadProgress(100);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${res.status}`);
            }
            const data = await res.json();
            const parsedQuestions = processQuizData(data);
            // NEW: Capture quiz ID to prevent duplicates
            setCurrentQuizId(data.quizId || null);
            if (parsedQuestions.length === 0) {
                throw new Error("No valid questions could be generated from this topic.");
            }
            // Set a fake file for display purposes
            setFile({
                name: `Quiz on "${topic}"`,
                size: 0,
                type: 'topic',
                lastModified: Date.now(),
                kind: 'topic'
            });
            setFullQuizData(parsedQuestions);
            startQuiz(parsedQuestions, false);
        }
        catch (error) {
            setError(error.message || 'Failed to generate quiz. Please try again.');
        }
        finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };
    // EXISTING: Start quiz with optional retake mode (unchanged)
    const startQuiz = (questions, isRetake = false) => {
        let selectedQuestions;
        if (isRetake) {
            selectedQuestions = questions;
            console.log('🔄 Starting retake with exact same questions');
        }
        else {
            const shuffled = [...questions].sort(() => Math.random() - 0.5);
            selectedQuestions = shuffled.slice(0, numQuestions);
            console.log('🎲 Starting new quiz with shuffled questions');
        }
        setCurrentQuiz(selectedQuestions);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setQuizCompleted(false);
        setShowResults(false);
    };
    // EXISTING: Retake current quiz (unchanged)
    const retakeQuiz = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setQuizCompleted(false);
        setShowResults(false);
    };
    // FIXED: Generate new quiz from same file WITH quiz ID capture
    const handleNewQuiz = async () => {
        if (!originalFile && activeTab === 'document') {
            setError("Please upload a document to generate new questions");
            return;
        }
        if (!topic.trim() && activeTab === 'topic') {
            setError("Please enter a topic to generate new questions");
            return;
        }
        setLoading(true);
        setError("");
        setShowResults(false);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setCurrentQuiz([]);
        setUploadProgress(0);
        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);
            let res;
            if (activeTab === 'document' && originalFile) {
                const formData = new FormData();
                formData.append("file", originalFile);
                res = await fetch("/api/generate-quiz", {
                    method: "POST",
                    body: formData,
                });
            }
            else if (activeTab === 'topic') {
                res = await fetch("/api/generate-quiz-from-topic", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        topic: topic.trim(),
                        difficulty,
                        quizType,
                        numQuestions,
                    }),
                });
            }
            else {
                throw new Error("No source available for new quiz generation");
            }
            clearInterval(progressInterval);
            setUploadProgress(100);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to generate new quiz");
            }
            const data = await res.json();
            const parsedQuestions = processQuizData(data);
            // FIX: Set new quiz ID
            setCurrentQuizId(data.quizId || null);
            if (parsedQuestions.length === 0) {
                throw new Error("No valid questions could be generated");
            }
            setFullQuizData(parsedQuestions);
            startQuiz(parsedQuestions, false);
        }
        catch (error) {
            setError(error.message || 'Failed to generate new quiz. Please try again.');
        }
        finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };
    // EXISTING: Answer selection (unchanged)
    const selectAnswer = (answer) => {
        const currentQuestion = currentQuiz[currentQuestionIndex];
        const newAnswers = userAnswers.filter(a => a.questionId !== currentQuestion.id);
        newAnswers.push({ questionId: currentQuestion.id, selectedAnswer: answer });
        setUserAnswers(newAnswers);
    };
    // EXISTING: Navigation (unchanged)
    const nextQuestion = () => {
        if (currentQuestionIndex < currentQuiz.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
        else {
            setQuizCompleted(true);
            setShowResults(true);
        }
    };
    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };
    // EXISTING: Calculate score (unchanged)
    const calculateScore = () => {
        let correct = 0;
        currentQuiz.forEach(question => {
            const userAnswer = userAnswers.find(a => a.questionId === question.id);
            if (userAnswer && userAnswer.selectedAnswer === question.correctAnswer) {
                correct++;
            }
        });
        return correct;
    };
    // NEW: Update existing quiz with completion data (no duplicates)
    useEffect(() => {
        if (showResults && isSignedIn && currentQuiz.length > 0 && currentQuizId) {
            fetch(`/api/quiz-history/${currentQuizId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers: userAnswers,
                    score: calculateScore(),
                    completedAt: new Date().toISOString(),
                }),
            }).catch(() => { });
        }
    }, [showResults, currentQuizId]);
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const currentUserAnswer = currentQuestion ? userAnswers.find(a => a.questionId === currentQuestion.id) : null;
    if (!isLoaded) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-[60vh] animate-fade-in", children: [_jsx("div", { className: "w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" }), _jsx("p", { className: "text-muted-foreground text-lg", children: "Loading..." })] }));
    }
    if (!isSignedIn) {
        return (_jsx("div", { className: "w-full max-w-2xl animate-fade-in", children: _jsxs(Card, { className: "bg-card/50 backdrop-blur-sm border-0 shadow-2xl", children: [_jsxs(CardHeader, { className: "text-center space-y-4", children: [_jsxs("div", { className: "flex items-center justify-center gap-3 mb-2", children: [_jsx(Brain, { className: "w-10 h-10 text-primary animate-bounce-gentle" }), _jsx(CardTitle, { className: "text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent", children: "AI Quiz Generator" })] }), _jsx("p", { className: "text-muted-foreground text-lg", children: "Create interactive quizzes from your documents using AI" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "grid gap-4", children: [_jsxs("div", { className: "flex items-center gap-4 p-4 bg-accent/50 rounded-lg border border-accent", children: [_jsx(FileText, { className: "w-6 h-6 text-primary flex-shrink-0" }), _jsx("span", { className: "text-accent-foreground", children: "Upload TXT, DOCX files" })] }), _jsxs("div", { className: "flex items-center gap-4 p-4 bg-accent/50 rounded-lg border border-accent", children: [_jsx(Brain, { className: "w-6 h-6 text-primary flex-shrink-0" }), _jsx("span", { className: "text-accent-foreground", children: "AI-powered question generation" })] }), _jsxs("div", { className: "flex items-center gap-4 p-4 bg-accent/50 rounded-lg border border-accent", children: [_jsx(Zap, { className: "w-6 h-6 text-primary flex-shrink-0" }), _jsx("span", { className: "text-accent-foreground", children: "Interactive quiz experience" })] })] }), _jsxs(Button, { variant: "gradient", size: "xl", className: "w-full", onClick: signIn, children: [_jsx(Brain, { className: "w-5 h-5" }), "Get Started - Sign In"] })] })] }) }));
    }
    // Rest of your component remains exactly the same...
    if (!currentQuiz.length && !showResults) {
        return (_jsx("div", { className: "w-full max-w-2xl animate-fade-in", children: _jsxs(Card, { className: "bg-card/50 backdrop-blur-sm border-0 shadow-2xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsxs(CardTitle, { className: "text-2xl font-bold text-foreground flex items-center justify-center gap-2", children: [_jsx(Upload, { className: "w-6 h-6 text-primary" }), "Generate Your Quiz"] }), _jsx("p", { className: "text-muted-foreground", children: "Upload a document or enter a topic to generate quiz questions" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex gap-2 mb-6 p-1 bg-muted rounded-lg", children: [_jsxs(Button, { variant: activeTab === 'document' ? 'default' : 'ghost', size: "sm", onClick: () => setActiveTab('document'), className: "flex-1", children: [_jsx(FileText, { className: "w-4 h-4" }), "Document"] }), _jsxs(Button, { variant: activeTab === 'topic' ? 'default' : 'ghost', size: "sm", onClick: () => setActiveTab('topic'), className: "flex-1", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), "Topic"] })] }), activeTab === 'document' && (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "relative", children: [_jsx("label", { htmlFor: "file-upload", className: `flex items-center gap-4 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 bg-white ${file ? 'border-primary bg-primary/10' : 'border-border'}`, children: file ? (_jsxs(_Fragment, { children: [_jsx(FileText, { className: "w-8 h-8 text-primary flex-shrink-0" }), _jsxs("div", { className: "flex flex-col flex-1 min-w-0", children: [_jsx("strong", { className: "text-foreground truncate", children: file.name }), ('size' in file && file.size > 0) && (_jsxs("small", { className: "text-muted-foreground", children: ["(", (file.size / 1024 / 1024).toFixed(2), " MB)"] }))] })] })) : (_jsxs(_Fragment, { children: [_jsx(Upload, { className: "w-8 h-8 text-primary flex-shrink-0" }), _jsx("span", { className: "text-foreground font-medium", children: "Choose a File (.txt, .docx, .pdf)" })] })) }), _jsx("input", { id: "file-upload", type: "file", onChange: handleFileChange, accept: ".txt,.docx,.pdf", className: "absolute inset-0 opacity-0 cursor-pointer", disabled: loading })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "numQuestions", className: "block text-sm font-semibold text-foreground", children: "Number of Questions:" }), _jsxs("select", { id: "numQuestions", value: numQuestions, onChange: e => setNumQuestions(Number(e.target.value)), disabled: loading, className: "w-full p-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors", children: [_jsx("option", { value: 3, children: "3 Questions" }), _jsx("option", { value: 5, children: "5 Questions" }), _jsx("option", { value: 7, children: "7 Questions" }), _jsx("option", { value: 10, children: "10 Questions" })] })] }), error && (_jsxs("div", { className: "flex items-center gap-3 bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20", children: [_jsx(XCircle, { className: "w-5 h-5 flex-shrink-0" }), _jsx("span", { children: error })] })), loading && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "w-full bg-secondary rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300 rounded-full", style: { width: `${uploadProgress}%` } }) }), _jsx("p", { className: "text-center text-muted-foreground", children: uploadProgress < 100 ? "Uploading..." : "Generating quiz..." })] })), _jsx(Button, { type: "submit", disabled: !file || loading, variant: "gradient", size: "lg", className: "w-full", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "Generating Quiz..."] })) : (_jsxs(_Fragment, { children: [_jsx(Brain, { className: "w-5 h-5" }), "Start Quiz"] })) })] })), activeTab === 'topic' && (_jsxs("form", { onSubmit: handleTopicSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "topic", className: "block text-sm font-semibold text-foreground", children: "Enter Topic or Subject:" }), _jsx("textarea", { id: "topic", value: topic, onChange: e => setTopic(e.target.value), placeholder: "e.g., World War 2, React Hooks, Biology, Machine Learning...", disabled: loading, rows: 3, className: "w-full p-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors resize-none" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { htmlFor: "difficulty", className: "block text-sm font-semibold text-foreground", children: [_jsx(Target, { className: "w-4 h-4 inline mr-1" }), "Difficulty:"] }), _jsxs("select", { id: "difficulty", value: difficulty, onChange: e => setDifficulty(e.target.value), disabled: loading, className: "w-full p-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors", children: [_jsx("option", { value: "easy", children: "Easy" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "hard", children: "Hard" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { htmlFor: "quizType", className: "block text-sm font-semibold text-foreground", children: [_jsx(Lightbulb, { className: "w-4 h-4 inline mr-1" }), "Quiz Type:"] }), _jsxs("select", { id: "quizType", value: quizType, onChange: e => setQuizType(e.target.value), disabled: loading, className: "w-full p-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors", children: [_jsx("option", { value: "multiple-choice", children: "Multiple Choice" }), _jsx("option", { value: "conceptual", children: "Conceptual" }), _jsx("option", { value: "factual", children: "Factual" }), _jsx("option", { value: "application", children: "Application" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "numQuestionsTopics", className: "block text-sm font-semibold text-foreground", children: "Number of Questions:" }), _jsxs("select", { id: "numQuestionsTopics", value: numQuestions, onChange: e => setNumQuestions(Number(e.target.value)), disabled: loading, className: "w-full p-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors", children: [_jsx("option", { value: 3, children: "3 Questions" }), _jsx("option", { value: 5, children: "5 Questions" }), _jsx("option", { value: 7, children: "7 Questions" }), _jsx("option", { value: 10, children: "10 Questions" })] })] }), error && (_jsxs("div", { className: "flex items-center gap-3 bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20", children: [_jsx(XCircle, { className: "w-5 h-5 flex-shrink-0" }), _jsx("span", { children: error })] })), loading && (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "w-full bg-secondary rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300 rounded-full", style: { width: `${uploadProgress}%` } }) }), _jsx("p", { className: "text-center text-muted-foreground", children: uploadProgress < 100 ? "Processing..." : "Generating quiz..." })] })), _jsx(Button, { type: "submit", disabled: !topic.trim() || loading, variant: "gradient", size: "lg", className: "w-full", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "Generating Quiz..."] })) : (_jsxs(_Fragment, { children: [_jsx(Brain, { className: "w-5 h-5" }), "Generate Quiz"] })) })] }))] })] }) }));
    }
    if (currentQuiz.length > 0 && !showResults && currentQuestion) {
        return (_jsx("div", { className: "w-full max-w-3xl animate-fade-in", children: _jsxs(Card, { className: "bg-card/50 backdrop-blur-sm border-0 shadow-2xl", children: [_jsxs(CardHeader, { className: "text-center space-y-4", children: [_jsxs(CardTitle, { className: "text-xl font-semibold text-foreground", children: ["Question ", currentQuestionIndex + 1, " of ", currentQuiz.length] }), _jsx("div", { className: "w-full max-w-md mx-auto bg-secondary rounded-full h-3 overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300 rounded-full", style: { width: `${((currentQuestionIndex + 1) / currentQuiz.length) * 100}%` } }) })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsx("h3", { className: "text-xl font-semibold text-foreground leading-relaxed", children: currentQuestion.question }), _jsx("div", { className: "space-y-3", children: ['A', 'B', 'C', 'D'].map((key) => (_jsxs(Button, { variant: currentUserAnswer?.selectedAnswer === key ? "default" : "quiz", className: "w-full justify-start text-left h-auto py-4 px-4", onClick: () => selectAnswer(key), children: [_jsxs("span", { className: "font-bold text-primary mr-3 text-lg", children: [key, "."] }), _jsx("span", { className: "flex-1", children: currentQuestion.options[key] })] }, key))) }), _jsxs("div", { className: "flex justify-between gap-4 pt-4", children: [_jsxs(Button, { onClick: prevQuestion, disabled: currentQuestionIndex === 0, variant: "outline", className: "px-6", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Previous"] }), _jsxs(Button, { onClick: nextQuestion, disabled: !currentUserAnswer, variant: "gradient", className: "px-6", children: [currentQuestionIndex === currentQuiz.length - 1 ? 'Finish Quiz' : 'Next', _jsx(ArrowRight, { className: "w-4 h-4" })] })] })] })] }) }));
    }
    if (showResults) {
        return (_jsx("div", { className: "w-full max-w-4xl animate-fade-in", children: _jsxs(Card, { className: "bg-card/50 backdrop-blur-sm border-0 shadow-2xl", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { className: "text-3xl font-bold text-foreground mb-4", children: "Quiz Results" }), _jsxs("div", { className: "p-6 bg-gradient-to-br from-primary/10 to-primary-glow/10 rounded-xl border border-primary/20", children: [_jsx("p", { className: "text-muted-foreground text-lg mb-2", children: "You scored" }), _jsxs("p", { className: "text-5xl font-black text-primary", children: [calculateScore(), "/", currentQuiz.length] })] })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsx("div", { className: "space-y-4", children: currentQuiz.map((question, index) => {
                                    const userAnswer = userAnswers.find(a => a.questionId === question.id);
                                    const isCorrect = userAnswer?.selectedAnswer === question.correctAnswer;
                                    return (_jsx(Card, { className: "border border-border", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("h4", { className: "text-lg font-semibold text-foreground mb-4 leading-relaxed", children: ["Q", index + 1, ": ", question.question] }), _jsx("div", { className: "space-y-2 mb-4", children: ['A', 'B', 'C', 'D'].map((key) => {
                                                        const value = question.options[key];
                                                        const isUserAnswer = userAnswer?.selectedAnswer === key;
                                                        const isCorrectAnswer = question.correctAnswer === key;
                                                        return (_jsxs("div", { className: `flex items-center gap-3 p-3 rounded-lg border ${isCorrectAnswer
                                                                ? 'bg-success/10 border-success/30'
                                                                : isUserAnswer && !isCorrect
                                                                    ? 'bg-destructive/10 border-destructive/30'
                                                                    : 'bg-muted/50 border-border'}`, children: [_jsxs("span", { className: "font-bold text-lg text-black", children: [key, "."] }), _jsx("span", { className: "flex-1 text-black", children: value }), isCorrectAnswer && _jsx(CheckCircle, { className: "w-5 h-5 text-success" }), isUserAnswer && !isCorrect && _jsx(XCircle, { className: "w-5 h-5 text-destructive" })] }, key));
                                                    }) }), _jsxs("div", { className: "space-y-2 text-sm text-black", children: [_jsxs("div", { className: `font-medium ${isCorrect ? 'text-green-700' : 'text-red-600'}`, children: [_jsx("strong", { children: "Your answer:" }), " ", userAnswer?.selectedAnswer || 'Not answered'] }), _jsxs("div", { className: "text-green-700 font-medium", children: [_jsx("strong", { children: "Correct answer:" }), " ", question.correctAnswer] }), question.explanation && (_jsxs("div", { className: "bg-accent/50 p-3 rounded-lg border-l-4 border-primary mt-3", children: [_jsx("strong", { className: "text-accent-foreground", children: "Explanation:" }), " ", question.explanation] }))] })] }) }, question.id));
                                }) }), _jsxs("div", { className: "grid gap-3", children: [_jsx(Button, { onClick: retakeQuiz, variant: "success", size: "lg", className: "w-full", children: "\uD83D\uDD04 Retake this quiz (same questions)" }), _jsx(Button, { onClick: handleNewQuiz, variant: "gradient", size: "lg", className: "w-full", children: "\uD83C\uDFB2 Start new quiz (different random questions)" }), _jsx(Button, { onClick: resetAll, variant: "outline", size: "lg", className: "w-full", children: "\uD83D\uDCC4 Generate new quiz" })] })] })] }) }));
    }
    return null;
}
