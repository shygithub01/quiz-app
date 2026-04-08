// Practice Live Mode Participant View
// Self-paced quiz interface for students

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { getCompetitionById } from '@/components/ui/firebase';
import {
  getSessionById,
  submitAttempt
} from '@/services/practiceService';
import {
  getNameFromLocalStorage,
  saveProgressToLocalStorage,
  resumeFromLocalStorage,
  clearProgressFromLocalStorage
} from '@/utils/practiceStorage';
import { PracticeSession } from '@/types/practiceMode';

export default function PracticeParticipant() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [studentName, setStudentName] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  
  // Load session, competition, and check for saved progress
  useEffect(() => {
    if (!sessionId) return;
    
    const loadData = async () => {
      try {
        console.log('🔍 PracticeParticipant: Starting to load session:', sessionId);
        
        // Get student name from localStorage
        const name = getNameFromLocalStorage(sessionId);
        console.log('👤 Student name from localStorage:', name);
        
        if (!name) {
          // No name found, redirect to join page
          console.log('❌ No name found, redirecting to join page');
          navigate(`/practice/join`);
          return;
        }
        setStudentName(name);
        
        // Load session
        console.log('📡 Fetching session data...');
        const sessionData = await getSessionById(sessionId);
        console.log('📊 Session data received:', sessionData);
        
        if (!sessionData) {
          console.error('❌ Session not found');
          alert('Session not found');
          navigate('/practice/join');
          return;
        }
        
        if (sessionData.status !== 'active') {
          console.error('❌ Session is not active:', sessionData.status);
          alert('This practice session has ended');
          navigate('/practice/join');
          return;
        }
        
        setSession(sessionData);
        
        // Load competition
        console.log('📡 Fetching competition data for:', sessionData.competitionId);
        const compData = await getCompetitionById(sessionData.competitionId);
        console.log('📊 Competition data received:', compData);
        
        if (!compData || !compData.questions) {
          console.error('❌ Quiz questions not found');
          alert('Quiz questions not found');
          navigate('/practice/join');
          return;
        }
        setCompetition(compData);
        
        // Note: Participant tracking temporarily disabled due to database permissions
        // Will be re-enabled after database rules are updated
        
        // Check for saved progress
        const savedProgress = resumeFromLocalStorage(sessionId);
        if (savedProgress && !savedProgress.isComplete) {
          console.log('💾 Found saved progress, showing resume prompt');
          setShowResumePrompt(true);
        }
        
        console.log('✅ Loading complete');
        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        alert('Failed to load practice session');
        navigate('/practice/join');
      }
    };
    
    loadData();
  }, [sessionId, navigate]);
  
  const handleResumeProgress = () => {
    if (!sessionId) return;
    
    const savedProgress = resumeFromLocalStorage(sessionId);
    if (savedProgress) {
      setCurrentQuestionIndex(savedProgress.currentQuestionIndex);
      setAnswers(savedProgress.answers);
    }
    setShowResumePrompt(false);
  };
  
  const handleStartFresh = () => {
    if (!sessionId) return;
    clearProgressFromLocalStorage(sessionId);
    setShowResumePrompt(false);
  };
  
  const handleAnswerSelect = (answer: string) => {
    if (!sessionId) return;
    
    const newAnswers = {
      ...answers,
      [currentQuestionIndex]: answer
    };
    setAnswers(newAnswers);
    
    // Save progress to localStorage
    saveProgressToLocalStorage(sessionId, {
      sessionId,
      studentName,
      currentQuestionIndex,
      answers: newAnswers,
      attemptId: Date.now().toString(),
      startedAt: Date.now(),
      isComplete: false
    });
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < competition.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!sessionId || !session || !competition) return;
    
    // Check if all questions are answered
    const unansweredCount = competition.questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Submit anyway?`
      );
      if (!confirm) return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit attempt
      const { attemptId, score } = await submitAttempt(
        sessionId,
        studentName,
        answers,
        competition.questions
      );
      
      // Clear progress from localStorage
      clearProgressFromLocalStorage(sessionId);
      
      // Redirect to results
      navigate(`/practice/results/${sessionId}/${attemptId}`);
    } catch (error: any) {
      console.error('Error submitting attempt:', error);
      alert(error.message || 'Failed to submit attempt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Target className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading practice session...</p>
        </div>
      </div>
    );
  }
  
  if (!session || !competition) {
    return null;
  }
  
  // Resume prompt
  if (showResumePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Target className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Resume Progress?
            </h2>
            <p className="text-gray-600 mb-6">
              You have an incomplete attempt. Would you like to continue where you left off?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleStartFresh}
                variant="outline"
                className="flex-1"
              >
                Start Fresh
              </Button>
              <Button
                onClick={handleResumeProgress}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const currentQuestion = competition.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === competition.questions.length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              <span className="font-bold text-xl">{session.title}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-base">
            <span className="font-medium">{studentName}</span>
            <span className="font-medium">
              Progress: {answeredCount}/{competition.questions.length}
            </span>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {competition.questions.length}</span>
            <span>{Math.round((answeredCount / competition.questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / competition.questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Question Card */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="text-xl font-bold text-gray-900 leading-relaxed mb-6">
              {currentQuestion.question}
            </p>
            
            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, idx: number) => (
                <Button
                  key={idx}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full text-left justify-start text-lg font-semibold py-6 px-6 ${
                    answers[currentQuestionIndex] === option
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200'
                  }`}
                  style={{ minHeight: '44px', touchAction: 'manipulation' }}
                >
                  <span className="mr-3 text-xl">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                  {answers[currentQuestionIndex] === option && (
                    <CheckCircle className="h-5 w-5 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex-1 bg-gray-700 text-white hover:bg-gray-600"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>
          
          {currentQuestionIndex < competition.questions.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
            >
              {submitting ? (
                'Submitting...'
              ) : allAnswered ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Quiz
                </>
              ) : (
                `Submit (${answeredCount}/${competition.questions.length})`
              )}
            </Button>
          )}
        </div>
        
        {/* Question Navigator */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Question Navigator
            </p>
            <div className="grid grid-cols-5 gap-2">
              {competition.questions.map((_: any, idx: number) => (
                <Button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  variant="outline"
                  className={`h-12 font-bold ${
                    idx === currentQuestionIndex
                      ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                      : answers[idx]
                      ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                      : 'bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
