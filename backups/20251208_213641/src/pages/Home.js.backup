import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// Home.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { generateNewQuizFromDocument, generateNewQuizFromTopic, getQuizHistory, getQuizById, updateQuizCompletion } from '@/components/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast'; // correct path, keeping single quotes
import { Brain, FileText, Upload, Target, Clock, CheckCircle, XCircle, ChevronRight, ChevronLeft, RefreshCw, Book, AlertCircle } from 'lucide-react';
// Initial States
const initialQuizState = {
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    score: 0,
    showResults: false,
    isReviewMode: false
};
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const QUIZ_TYPES = ['multiple-choice', 'true-false'];
const DEFAULT_NUM_QUESTIONS = 5;
export default function Home() {
    // Hooks & State
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [quizState, setQuizState] = useState(initialQuizState);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [quizType, setQuizType] = useState('multiple-choice');
    const [numQuestions, setNumQuestions] = useState(DEFAULT_NUM_QUESTIONS);
    const [recentQuizzes, setRecentQuizzes] = useState([]);
    const [showFileUpload, setShowFileUpload] = useState(true);
    // Effects
    useEffect(() => {
        const retakeQuizId = searchParams.get('retake');
        const resultsQuizId = searchParams.get('results');
        if (retakeQuizId) {
            handleRetakeQuiz(retakeQuizId);
        }
        else if (resultsQuizId) {
            handleViewResults(resultsQuizId);
        }
        loadRecentQuizzes();
    }, []);
    // Quiz Generation Functions
    const generateQuiz = async (fromFile = true, forceNew = true) => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to generate a quiz.",
                variant: "destructive"
            });
            return;
        }
        
        try {
            setLoading(true);
            const userId = user?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }
            
            let response;
            if (fromFile && uploadedFile) {
                // Check file type immediately before making backend call
                const allowedTypes = [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain'
                ];
                
                const allowedExtensions = ['.pdf', '.docx', '.txt'];
                const fileExtension = uploadedFile.name.toLowerCase().substring(uploadedFile.name.lastIndexOf('.'));
                
                // Check for unsupported file types
                if (!allowedTypes.includes(uploadedFile.type) && !allowedExtensions.includes(fileExtension)) {
                    toast({
                        title: "File Type Not Supported",
                        description: `Please upload only: PDF (.pdf), Word documents (.docx), or text files (.txt). You uploaded: ${uploadedFile.name}`,
                        variant: "destructive"
                    });
                    setLoading(false);
                    return;
                }
                
                // Block DOC files entirely since they often fail
                if (uploadedFile.type === 'application/msword' || fileExtension === '.doc') {
                    toast({
                        title: "DOC Files Not Supported",
                        description: "DOC files are not supported due to compatibility issues. Please convert your file to DOCX format using Microsoft Word or LibreOffice, then upload the DOCX file.",
                        variant: "destructive"
                    });
                    setLoading(false);
                    return;
                }
                
                response = await generateNewQuizFromDocument({
                    file: uploadedFile,
                    numQuestions,
                    difficulty,
                    quizType
                }, userId);
            }
            else if (!fromFile && topic) {
                response = await generateNewQuizFromTopic({
                    topic,
                    difficulty,
                    quizType,
                    numQuestions
                }, userId);
            }
            else {
                throw new Error('Invalid quiz generation parameters');
            }
            
            if (response.success && response.quiz) {
                setQuizState({
                    ...initialQuizState,
                    questions: response.quiz,
                    quizId: response.quizId,
                    attemptId: response.attemptId
                });
                setShowFileUpload(false);
            }
            else {
                throw new Error(response.message || 'Failed to generate quiz');
            }
        }
        catch (error) {
            // Check if it's a file type validation error from the API
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            
            // Show specific error messages for file type issues
            if (errorMessage.includes('Unsupported file type') || 
                errorMessage.includes('Unable to read this DOC file') ||
                errorMessage.includes('Unable to read this PDF file') ||
                errorMessage.includes('corrupted or in an unsupported format')) {
                toast({
                    title: "File Type Not Supported",
                    description: errorMessage,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Quiz Generation Failed",
                    description: errorMessage,
                    variant: "destructive"
                });
            }
        }
        finally {
            setLoading(false);
        }
    };
    // Quiz Interaction Functions
    const handleAnswerSubmit = (answer) => {
        setQuizState(prev => {
            const newAnswers = [...prev.userAnswers];
            newAnswers[prev.currentQuestionIndex] = answer;
            const isLastQuestion = prev.currentQuestionIndex === prev.questions.length - 1;
            const newScore = newAnswers.reduce((score, userAnswer, index) => {
                return userAnswer === prev.questions[index].correctAnswer ? score + 1 : score;
            }, 0);
            const newState = {
                ...prev,
                userAnswers: newAnswers,
                currentQuestionIndex: isLastQuestion ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
                score: newScore,
                showResults: isLastQuestion
            };
            // Save completion when quiz finishes
            if (isLastQuestion && user?.uid && prev.attemptId) {
                updateQuizCompletion(user.uid, prev.attemptId, {
                    answers: newAnswers,
                    score: newScore,
                    completedAt: new Date().toISOString()
                }).catch(error => {
                    console.error('Failed to save quiz completion:', error);
                });
            }
            return newState;
        });
    };
    const handleRetakeQuiz = async (attemptId) => {
        try {
            setLoading(true);
            const userId = user?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }
            const quizData = await getQuizById(attemptId, userId);
            if (quizData && quizData.questions) {
                setQuizState({
                    ...initialQuizState,
                    questions: quizData.questions,
                    quizId: quizData.quizTemplateId,
                    attemptId: attemptId
                });
                setShowFileUpload(false);
                toast({
                    title: "Quiz Loaded",
                    description: `Starting retake of "${quizData.title}"`,
                });
            }
            else {
                throw new Error('Quiz data not found');
            }
        }
        catch (error) {
            toast({
                title: "Retake Failed",
                description: error instanceof Error ? error.message : 'Failed to retake quiz',
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleViewResults = async (attemptId) => {
        try {
            setLoading(true);
            const userId = user?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }
            const quizData = await getQuizById(attemptId, userId);
            console.log('🔍 DEBUG - Quiz data for results:', quizData);
            if (quizData && quizData.questions) {
                // Restore the original generation parameters for "New Quiz" to work
                if (quizData.type === 'topic' && quizData.title) {
                    const originalTopic = quizData.title.replace(' (New)', '');
                    setTopic(originalTopic);
                    console.log('📝 Restored topic:', originalTopic);
                }
                // Check if answers exist, if not use empty array to show questions without user answers
                const userAnswers = quizData.userAnswers || [];
                setQuizState({
                    questions: quizData.questions,
                    currentQuestionIndex: 0,
                    userAnswers: userAnswers,
                    score: quizData.score || 0,
                    showResults: true,
                    quizId: quizData.quizTemplateId,
                    attemptId: attemptId
                });
                setShowFileUpload(false);
                toast({
                    title: "Results Loaded",
                    description: `Viewing results for "${quizData.title}"`,
                });
            }
            else {
                throw new Error('Quiz results not found - no questions available');
            }
        }
        catch (error) {
            toast({
                title: "Results Failed",
                description: error instanceof Error ? error.message : 'Failed to load results',
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    /*  const resetQuiz = () => {
        setQuizState(initialQuizState);
        setUploadedFile(null);
        setTopic('');
        setShowFileUpload(true);
        loadRecentQuizzes(); // Refresh recent quizzes
      };
    */
    const resetQuiz = () => {
        setQuizState(initialQuizState);
        setShowFileUpload(true);
        loadRecentQuizzes(); // Refresh recent quizzes
        // Don't clear uploadedFile or topic - keep them so user can generate new quiz
    };
    // File Upload Handlers
    const handleFileDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            validateAndSetFile(file);
        }
    }, []);
    
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };
    
    const validateAndSetFile = (file) => {
        // Validate file type immediately
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];
        
        const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            toast({
                title: "File Type Not Supported",
                description: `Please upload only: PDF (.pdf), Word documents (.docx, .doc), or text files (.txt). You uploaded: ${file.name}`,
                variant: "destructive"
            });
            return;
        }
        
        setUploadedFile(file);
    };
    // Recent Quizzes Functions
    const loadRecentQuizzes = async () => {
        if (!user?.uid)
            return;
        try {
            const attempts = await getQuizHistory(user.uid);
            const recentQuizzes = attempts.slice(0, 6).map(attempt => ({
                id: attempt.id,
                title: attempt.title,
                score: attempt.score,
                totalQuestions: attempt.questionCount,
                timestamp: new Date(attempt.startedAt)
            }));
            setRecentQuizzes(recentQuizzes);
        }
        catch (error) {
            console.error('Failed to load recent quizzes:', error);
        }
    };
    // Render Functions
    const renderQuizForm = () => (_jsxs("div", { className: "space-y-8 animate-fade-in", children: [_jsxs("div", { className: "flex flex-col md:flex-row gap-6", children: [_jsxs(Card, { variant: "glass", className: "flex-1", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "w-5 h-5" }), "Upload Document"] }), _jsx(CardDescription, { children: "Generate questions from your document" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-all duration-300", onDrop: handleFileDrop, onDragOver: (e) => e.preventDefault(), children: [uploadedFile ? (_jsxs("div", { className: "flex items-center justify-center gap-2 text-white", children: [_jsx(FileText, { className: "w-5 h-5" }), uploadedFile.name] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx(Upload, { className: "w-8 h-8 mx-auto text-white/60" }), _jsx("p", { className: "text-white/60", children: "Drag & drop or click to upload" }), _jsx("p", { className: "text-xs text-white/40", children: "Supported: PDF, DOCX, TXT files" })] })), _jsx("input", { type: "file", onChange: handleFileSelect, className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer", accept: ".pdf,.doc,.docx,.txt" })] }) })] }), _jsxs(Card, { variant: "glass", className: "flex-1", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Brain, { className: "w-5 h-5" }), "Enter Topic"] }), _jsx(CardDescription, { children: "Generate questions from a specific topic" })] }), _jsx(CardContent, { children: _jsx("input", { type: "text", value: topic, onChange: (e) => setTopic(e.target.value), placeholder: "Enter a topic...", className: "w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-white/40 transition-all duration-300" }) })] })] }), _jsxs(Card, { variant: "glass", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Target, { className: "w-5 h-5" }), "Quiz Settings"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm text-white/70", children: "Difficulty" }), _jsx("select", { value: difficulty, onChange: (e) => setDifficulty(e.target.value), className: "w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white", children: DIFFICULTY_OPTIONS.map(option => (_jsx("option", { value: option, className: "bg-gray-800", children: option.charAt(0).toUpperCase() + option.slice(1) }, option))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm text-white/70", children: "Quiz Type" }), _jsx("select", { value: quizType, onChange: (e) => setQuizType(e.target.value), className: "w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white", children: QUIZ_TYPES.map(type => (_jsx("option", { value: type, className: "bg-gray-800", children: type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') }, type))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm text-white/70", children: "Number of Questions" }), _jsx("input", { type: "number", value: numQuestions, onChange: (e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 1))), min: "1", max: "20", className: "w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" })] })] }) }), _jsxs(CardFooter, { className: "justify-end space-x-4", children: [_jsx(Button, { variant: "ghost", onClick: resetQuiz, disabled: loading, children: "Reset" }), _jsx(Button, { onClick: () => generateQuiz(!!uploadedFile), disabled: loading || (!uploadedFile && !topic), className: "min-w-[120px]", children: loading ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }), "Generating..."] })) : (_jsxs(_Fragment, { children: [_jsx(Brain, { className: "w-4 h-4 mr-2" }), "Generate Quiz"] })) })] })] }), recentQuizzes.length > 0 && (_jsxs(Card, { variant: "glass", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-5 h-5" }), "Recent Quizzes"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: recentQuizzes.slice(0, 6).map((quiz) => (_jsx(Card, { variant: "ghost", className: "hover:bg-white/10 transition-all duration-300 cursor-pointer", onClick: () => handleRetakeQuiz(quiz.id), children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-lg", children: formatQuizDisplayName(quiz) }), _jsxs(CardDescription, { children: ["Score: ", quiz.score, "/", quiz.totalQuestions] })] }) }, quiz.id))) }) }), _jsx(CardFooter, { children: _jsxs(Button, { variant: "ghost", onClick: () => navigate('/past-quizzes'), children: ["View All Quizzes", _jsx(ChevronRight, { className: "w-4 h-4 ml-2" })] }) })] }))] }));
    /*
      const renderQuestion = () => {
        const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
        const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];
    
        return (
          <Card variant="glass" className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5" />
                Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-white">{currentQuestion.question}</p>
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={userAnswer === option ? 'default' : 'ghost'}
                    className="w-full justify-start text-left"
                    onClick={() => handleAnswerSubmit(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      };
    */
    // Add this new function in Home.tsx
    const formatQuizDisplayName = (quiz) => {
        const date = new Date(quiz.timestamp).toLocaleDateString();
        const time = new Date(quiz.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (quiz.type === 'topic') {
            const topicName = quiz.title.replace(' (New)', '');
            return `${topicName} - ${date} ${time}`;
        }
        else if (quiz.type === 'file') {
            const filename = quiz.originalFileName || quiz.title.replace(' (New)', '') || 'Document';
            return `${filename} - ${date} ${time}`;
        }
        return `${quiz.title} - ${date} ${time}`;
    };
    const renderQuestion = () => {
        const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
        const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];
        return (_jsxs(Card, { variant: "glass", className: "animate-fade-in-up", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Book, { className: "w-5 h-5" }), "Question ", quizState.currentQuestionIndex + 1, " of ", quizState.questions.length] }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsx("p", { className: "text-lg text-white", children: currentQuestion.question }), _jsx("div", { className: "grid grid-cols-1 gap-3", children: currentQuestion.options.map((option, index) => (_jsx(Button, { variant: userAnswer === option ? 'default' : 'ghost', className: `w-full justify-start text-left ${quizState.isReviewMode ? 'cursor-not-allowed opacity-60' : ''}`, onClick: () => {
                                    console.log('🔍 Button clicked - showResults:', quizState.isReviewMode);
                                    if (!quizState.isReviewMode) {
                                        handleAnswerSubmit(option);
                                    }
                                }, disabled: quizState.isReviewMode, children: option }, index))) }), _jsxs("div", { className: "flex justify-between items-center pt-4 border-t border-purple-600/30", children: [_jsxs(Button, { variant: "ghost", onClick: () => {
                                        if (quizState.currentQuestionIndex > 0) {
                                            setQuizState(prev => ({
                                                ...prev,
                                                currentQuestionIndex: prev.currentQuestionIndex - 1
                                            }));
                                        }
                                    }, disabled: quizState.currentQuestionIndex === 0, className: "text-white hover:bg-purple-600/30 flex items-center gap-2", children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), "Previous"] }), _jsxs("div", { className: "text-purple-200 text-sm font-medium", children: [quizState.currentQuestionIndex + 1, " of ", quizState.questions.length] }), _jsxs(Button, { variant: "ghost", onClick: () => {
                                        if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
                                            setQuizState(prev => ({
                                                ...prev,
                                                currentQuestionIndex: prev.currentQuestionIndex + 1
                                            }));
                                        }
                                    }, disabled: quizState.currentQuestionIndex === quizState.questions.length - 1, className: "text-white hover:bg-purple-600/30 flex items-center gap-2", children: ["Next", _jsx(ChevronRight, { className: "w-4 h-4" })] })] })] })] }));
    };
    const renderResults = () => (_jsxs(Card, { variant: "glass", className: "animate-fade-in", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [quizState.score / quizState.questions.length >= 0.7 ? (_jsx(CheckCircle, { className: "w-6 h-6 text-green-400" })) : (_jsx(AlertCircle, { className: "w-6 h-6 text-yellow-400" })), "Quiz Results"] }), _jsxs(CardDescription, { children: ["You scored ", quizState.score, " out of ", quizState.questions.length] })] }), _jsx(CardContent, { className: "space-y-6", children: quizState.questions.map((question, index) => (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "font-medium text-white", children: question.question }), _jsx("div", { className: "grid grid-cols-1 gap-2", children: question.options.map((option, optionIndex) => (_jsx("div", { className: `p-3 rounded-lg ${option === question.correctAnswer
                                    ? 'bg-green-500/20 border border-green-400/30'
                                    : option === quizState.userAnswers[index] && option !== question.correctAnswer
                                        ? 'bg-red-500/20 border border-red-400/30'
                                        : 'bg-white/10 border border-white/20'}`, children: _jsxs("div", { className: "flex items-center gap-2", children: [option === question.correctAnswer ? (_jsx(CheckCircle, { className: "w-4 h-4 text-green-400" })) : option === quizState.userAnswers[index] && option !== question.correctAnswer ? (_jsx(XCircle, { className: "w-4 h-4 text-red-400" })) : null, _jsx("span", { className: "text-white", children: option })] }) }, optionIndex))) })] }, index))) }), _jsx(CardFooter, { className: "justify-end", children: _jsx(Button, { onClick: () => setQuizState({ ...quizState, currentQuestionIndex: 0, showResults: false, isReviewMode: true }), children: "Review Questions" }) })] }));
    // Main Render
    return (_jsx("div", { className: "container max-w-4xl mx-auto space-y-8 py-8", children: !user ? (_jsx(Card, { variant: "glass", className: "text-center p-8", children: _jsxs(CardContent, { className: "space-y-4", children: [_jsx(Brain, { className: "w-12 h-12 mx-auto text-white/60" }), _jsx(CardTitle, { children: "Welcome to AI Quiz Generator" }), _jsx(CardDescription, { children: "Please sign in to create and take quizzes" })] }) })) : quizState.questions.length === 0 ? (renderQuizForm()) : quizState.showResults ? (renderResults()) : (renderQuestion()) }));
}
