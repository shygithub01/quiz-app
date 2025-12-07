// Home.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  generateNewQuizFromDocument,
  generateNewQuizFromTopic,
  getQuizHistory, 
  getQuizById, 
  updateQuizCompletion 
} from '@/components/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';  // correct path, keeping single quotes
import { 
  Brain, 
  FileText, 
  Upload, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Book,
  AlertCircle
} from 'lucide-react';

// Types & Interfaces
interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: string[];
  score: number;
  showResults: boolean;
  quizId?: string;
  attemptId?: string;
  isReviewMode?: boolean;
  startTime?: number; // timestamp when quiz started
  currentTime?: number; // current timestamp for live timer
}

interface QuizHistoryItem {
  id: string;
  title: string;
  score?: number;
  totalQuestions: number;
  timestamp: Date;
}

// Initial States
const initialQuizState: QuizState = {
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
  const [quizState, setQuizState] = useState<QuizState>(initialQuizState);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('multiple-choice');
  const [numQuestions, setNumQuestions] = useState(DEFAULT_NUM_QUESTIONS);
  const [recentQuizzes, setRecentQuizzes] = useState<QuizHistoryItem[]>([]);
  
  // Timer effect - updates every second when quiz is active
  useEffect(() => {
    if (quizState.startTime && !quizState.showResults && quizState.questions.length > 0 && !quizState.isReviewMode) {
      const interval = setInterval(() => {
        setQuizState(prev => ({ ...prev, currentTime: Date.now() }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quizState.startTime, quizState.showResults, quizState.questions.length, quizState.isReviewMode]);

  // Effects

  useEffect(() => {
  const retakeQuizId = searchParams.get('retake');
  const resultsQuizId = searchParams.get('results');
  
  if (retakeQuizId) {
    handleRetakeQuiz(retakeQuizId);
  } else if (resultsQuizId) {
    handleViewResults(resultsQuizId);
  }
  loadRecentQuizzes();
}, []);

  // Quiz Generation Functions
  const generateQuiz = async (fromFile: boolean = true) => {
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
        response = await generateNewQuizFromDocument({
          file: uploadedFile,
          numQuestions,
          difficulty,
          quizType
        });
      } else if (!fromFile && topic) {
        response = await generateNewQuizFromTopic({
          topic,
          difficulty,
          quizType,
          numQuestions
        }, userId);
      } else {
        throw new Error('Invalid quiz generation parameters');
      }

      if (response.success && response.quiz) {
        console.log('🎯 QUIZ GENERATION SUCCESS - About to set state');
        const startTime = Date.now();
        console.log('⏱️ Quiz started at:', new Date(startTime).toLocaleTimeString());
        console.log('⏱️ startTime value:', startTime);
        setQuizState({
          ...initialQuizState,
          questions: response.quiz,
          quizId: response.quizId,
          attemptId: response.attemptId,
          startTime,
          currentTime: startTime
        });

        // setShowFileUpload(false); // This line was removed from the new_code
      } else {
        throw new Error(response.message || 'Failed to generate quiz');
      }
    } catch (error) {
      toast({
        title: "Quiz Generation Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Quiz Interaction Functions
  const handleAnswerSubmit = (answer: string) => {
    setQuizState(prev => {
      const newAnswers = [...prev.userAnswers];
      newAnswers[prev.currentQuestionIndex] = answer;

      const isLastQuestion = prev.currentQuestionIndex === prev.questions.length - 1;
      const newScore = newAnswers.reduce((score, userAnswer, index) => {
        return userAnswer === prev.questions[index].correctAnswer ? score + 1 : score;
      }, 0);

      // Calculate time spent if quiz is finishing
      const timeSpent = isLastQuestion && prev.startTime 
        ? Math.floor((Date.now() - prev.startTime) / 1000)
        : undefined;

      const newState = {
        ...prev,
        userAnswers: newAnswers,
        currentQuestionIndex: isLastQuestion ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
        score: newScore,
        showResults: isLastQuestion
      };

      // Save completion when quiz finishes
      if (isLastQuestion && user?.uid && prev.attemptId) {
        console.log('⏱️ Quiz completed in', timeSpent, 'seconds');
        updateQuizCompletion(user.uid, prev.attemptId, {
          answers: newAnswers,
          score: newScore,
          completedAt: new Date().toISOString(),
          timeSpent
        }).catch(error => {
          console.error('Failed to save quiz completion:', error);
        });
      }

      return newState;

    });
  };

  const handleRetakeQuiz = async (attemptId: string) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userId = user?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const quizData = await getQuizById(attemptId, user.uid) as {
        questions: any[];
        userAnswers: string[];
        score: number;
        quizTemplateId: string;
        title: string;
      } | null;
      
      if (quizData && quizData.questions) {
        const startTime = Date.now();
        setQuizState({
          ...initialQuizState,
          questions: quizData.questions,
          quizId: quizData.quizTemplateId,
          attemptId: attemptId,
          startTime,
          currentTime: startTime
        });
        
        toast({
          title: "Quiz Loaded",
          description: `Starting retake of "${quizData.title}"`,
        });
      } else {
        throw new Error('Quiz data not found');
      }
    } catch (error) {
      toast({
        title: "Retake Failed",
        description: error instanceof Error ? error.message : 'Failed to retake quiz',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
 

  


  const handleViewResults = async (attemptId: string) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const quizData = await getQuizById(attemptId, user.uid) as {
        questions: any[];
        userAnswers: string[];
        score: number;
        quizTemplateId: string;
        title: string;
      } | null;
      console.log('🔍 DEBUG - Quiz data for results:', quizData);
      
      if (quizData && quizData.questions) {
        setQuizState({
          questions: quizData.questions,
          currentQuestionIndex: 0,
          userAnswers: quizData.userAnswers || [],
          score: quizData.score || 0,
          showResults: true,
          quizId: quizData.quizTemplateId,
          attemptId: attemptId
        });
        
        toast({
          title: "Results Loaded",
          description: `Viewing results for "${quizData.title}"`,
        });
      } else {
        throw new Error('Quiz results not found - no questions available');
      }
    } catch (error) {
      toast({
        title: "Results Failed",
        description: error instanceof Error ? error.message : 'Failed to load results',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuizState(initialQuizState);
    loadRecentQuizzes(); // Refresh recent quizzes
    // Don't clear uploadedFile or topic - keep them so user can generate new quiz
  };

  // File Upload Handlers
  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  // Recent Quizzes Functions

  const loadRecentQuizzes = async () => {
    if (!user?.uid) return;
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
    } catch (error) {
      console.error('Failed to load recent quizzes:', error);
    }
  }; 

  // Render Functions
  const renderQuizForm = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        {/* File Upload Section */}
        <Card variant="glass" className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Generate questions from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-all duration-300"
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-2 text-white">
                  <FileText className="w-5 h-5" />
                  {uploadedFile.name}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-white/60" />
                  <p className="text-white/60">Drag & drop or click to upload</p>
                </div>
              )}
              <input
                type="file"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.txt"
              />
            </div>
          </CardContent>
        </Card>

        {/* Topic Input Section */}
        <Card variant="glass" className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Enter Topic
            </CardTitle>
            <CardDescription>
              Generate questions from a specific topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic..."
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-white/40 transition-all duration-300"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quiz Settings */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quiz Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                {DIFFICULTY_OPTIONS.map(option => (
                  <option key={option} value={option} className="bg-gray-800">
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Quiz Type</label>
              <select
                value={quizType}
                onChange={(e) => setQuizType(e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                {QUIZ_TYPES.map(type => (
                  <option key={type} value={type} className="bg-gray-800">
                    {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Number of Questions</label>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                min="1"
                max="20"
                className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end space-x-4">
          <Button 
            variant="ghost" 
            onClick={resetQuiz}
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            onClick={() => generateQuiz(!!uploadedFile)}
            disabled={loading || (!uploadedFile && !topic)}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate Quiz
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Recent Quizzes Section */}
      {recentQuizzes.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentQuizzes.slice(0, 6).map((quiz) => (
                <Card 
                  key={quiz.id} 
                  variant="ghost"
                  className="hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  onClick={() => handleRetakeQuiz(quiz.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{formatQuizDisplayName(quiz)}</CardTitle>
                    <CardDescription>
                      Score: {quiz.score}/{quiz.totalQuestions}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" onClick={() => navigate('/past-quizzes')}>
              View All Quizzes
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );

  // Add this new function in Home.tsx
const formatQuizDisplayName = (quiz: any) => {
  const date = new Date(quiz.timestamp).toLocaleDateString();
  const time = new Date(quiz.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (quiz.type === 'topic') {
    const topicName = quiz.title.replace(' (New)', '');
    return `${topicName} - ${date} ${time}`;
  } else if (quiz.type === 'file') {
    const filename = quiz.originalFileName || quiz.title.replace(' (New)', '') || 'Document';
    return `${filename} - ${date} ${time}`;
  }
  
  return `${quiz.title} - ${date} ${time}`;
};  


  const renderQuestion = () => {
  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
  const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];

  return (
    <Card variant="glass" className="animate-fade-in-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
          </CardTitle>
          {/* Live Timer Display - Bold & Beautiful */}
          {quizState.startTime && quizState.currentTime && !quizState.isReviewMode && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 rounded-xl shadow-lg animate-pulse-subtle">
              <Clock className="w-6 h-6 text-white animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs text-white/80 font-medium uppercase tracking-wide">Time Elapsed</span>
                <span className="text-2xl font-bold text-white tabular-nums">
                  {Math.floor((quizState.currentTime - quizState.startTime) / 60000)}:{Math.floor(((quizState.currentTime - quizState.startTime) % 60000) / 1000).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg text-white">{currentQuestion.question}</p>
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              variant={userAnswer === option ? 'default' : 'ghost'}
                            className={`w-full justify-start text-left ${quizState.isReviewMode ? 'cursor-not-allowed opacity-60' : ''}`}
              onClick={() => {
                console.log('🔍 Button clicked - showResults:', quizState.isReviewMode);
                if (!quizState.isReviewMode) {
                  handleAnswerSubmit(option);
                }
              }}
              disabled={quizState.isReviewMode}
            >
              {option}
            </Button>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-purple-600/30">
          <Button
            variant="ghost"
            onClick={() => {
              if (quizState.currentQuestionIndex > 0) {
                setQuizState(prev => ({
                  ...prev,
                  currentQuestionIndex: prev.currentQuestionIndex - 1
                }));
              }
            }}
            disabled={quizState.currentQuestionIndex === 0}
            className="text-white hover:bg-purple-600/30 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="text-purple-200 text-sm font-medium">
            {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
                setQuizState(prev => ({
                  ...prev,
                  currentQuestionIndex: prev.currentQuestionIndex + 1
                }));
              }
            }}
            disabled={quizState.currentQuestionIndex === quizState.questions.length - 1}
            className="text-white hover:bg-purple-600/30 flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

  const renderResults = () => (
    <Card variant="glass" className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {quizState.score / quizState.questions.length >= 0.7 ? (
            <CheckCircle className="w-6 h-6 text-green-400" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          )}
          Quiz Results
        </CardTitle>
        <CardDescription>
          You scored {quizState.score} out of {quizState.questions.length}
          {quizState.startTime && quizState.currentTime && (
            <span className="ml-3 text-indigo-300">
              • Time: {Math.floor((quizState.currentTime - quizState.startTime) / 60000)}:{Math.floor(((quizState.currentTime - quizState.startTime) % 60000) / 1000).toString().padStart(2, '0')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {quizState.questions.map((question, index) => (
          <div key={index} className="space-y-2">
            <p className="font-medium text-white">{question.question}</p>
            <div className="grid grid-cols-1 gap-2">
              {question.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`p-3 rounded-lg ${
                    option === question.correctAnswer
                      ? 'bg-green-500/20 border border-green-400/30'
                      : option === quizState.userAnswers[index] && option !== question.correctAnswer
                      ? 'bg-red-500/20 border border-red-400/30'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option === question.correctAnswer ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : option === quizState.userAnswers[index] && option !== question.correctAnswer ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : null}
                    <span className="text-white">{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>

<CardFooter className="justify-end">
      <Button onClick={() => setQuizState({ ...quizState, currentQuestionIndex: 0, showResults: false, isReviewMode: true })}>
  Review Questions
      </Button>
      </CardFooter>


    </Card>
  );

  // Main Render
  return (
    <div className="container max-w-4xl mx-auto space-y-8 py-8">
      {!user ? (
        <Card variant="glass" className="text-center p-8">
          <CardContent className="space-y-4">
            <Brain className="w-12 h-12 mx-auto text-white/60" />
            <CardTitle>Welcome to Quizist.AI</CardTitle>
            <CardDescription>
              AI-Powered Merit Scholarship Platform - Where Knowledge Earns Scholarships
            </CardDescription>
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-400/30">
                <p className="text-green-100 text-sm mb-3">
                  🎓 <strong>For Students:</strong> Win real money scholarships with our merit-based competitions
                </p>
                <Button 
                  onClick={() => window.open('/scholarship', '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white w-full"
                >
                  View Scholarship Opportunities
                </Button>
              </div>
              
              <div className="p-4 bg-purple-900/20 rounded-lg">
                <p className="text-purple-100 text-sm mb-3">
                  🏫 <strong>For Schools:</strong> Transform your scholarship program with fair, AI-powered competitions
                </p>
                <Button 
                  onClick={() => window.open('/schools', '_blank')}
                  variant="outline" 
                  className="border-purple-300 text-purple-100 hover:bg-purple-800 w-full"
                >
                  Learn More for Schools
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : quizState.questions.length === 0 ? (
        renderQuizForm()
      ) : quizState.showResults ? (
        renderResults()
      ) : (
        renderQuestion()
      )}
    </div>
  );
}
