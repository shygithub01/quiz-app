// Practice Live Mode Participant View — Mobile-first redesign
// Self-paced quiz: no timer, prev/next navigation, question jump grid

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Target, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
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

const LABELS = ['A', 'B', 'C', 'D'];

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

  useEffect(() => {
    if (!sessionId) return;

    const loadData = async () => {
      try {
        const name = getNameFromLocalStorage(sessionId);
        if (!name) { navigate('/practice/join'); return; }
        setStudentName(name);

        const sessionData = await getSessionById(sessionId);
        if (!sessionData) { alert('Session not found'); navigate('/practice/join'); return; }
        if (sessionData.status !== 'active') { alert('This practice session has ended'); navigate('/practice/join'); return; }
        setSession(sessionData);

        const compData = await getCompetitionById(sessionData.competitionId);
        if (!compData?.questions) { alert('Quiz questions not found'); navigate('/practice/join'); return; }
        setCompetition(compData);

        const savedProgress = resumeFromLocalStorage(sessionId);
        if (savedProgress && !savedProgress.isComplete) {
          setShowResumePrompt(true);
        }

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
    const newAnswers = { ...answers, [currentQuestionIndex]: answer };
    setAnswers(newAnswers);
    saveProgressToLocalStorage(sessionId, {
      sessionId,
      studentName,
      currentQuestionIndex,
      answers: newAnswers,
      attemptId: Date.now().toString(),
      startedAt: Date.now(),
      isComplete: false
    });

    // Auto-advance to next question after short delay
    if (currentQuestionIndex < (competition?.questions?.length ?? 1) - 1) {
      setTimeout(() => setCurrentQuestionIndex((i) => i + 1), 400);
    }
  };

  const handleSubmit = async () => {
    if (!sessionId || !session || !competition) return;

    const unansweredCount = competition.questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirmed = window.confirm(`${unansweredCount} question(s) unanswered. Submit anyway?`);
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      const { attemptId } = await submitAttempt(sessionId, studentName, answers, competition.questions);
      clearProgressFromLocalStorage(sessionId);
      navigate(`/practice/results/${sessionId}/${attemptId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #1e1b4b 100%)' }}>
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading practice session...</p>
        </div>
      </div>
    );
  }

  if (!session || !competition) return null;

  // ── Resume Prompt ──
  if (showResumePrompt) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #1e1b4b 100%)' }}>
        <div className="text-center text-white max-w-sm w-full">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Target className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black mb-2">Resume Progress?</h2>
          <p className="text-white/60 text-sm mb-8">
            You have an incomplete attempt. Continue where you left off?
          </p>
          <div className="space-y-3">
            <button
              onClick={handleResumeProgress}
              className="w-full py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #059669, #065f46)', color: 'white' }}
            >
              Resume
            </button>
            <button
              onClick={handleStartFresh}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-white/10 text-white active:scale-95 transition-transform"
            >
              Start Fresh
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const currentQuestion = competition.questions[currentQuestionIndex];
  const totalQuestions = competition.questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;
  const progressPercent = (answeredCount / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 30%, #1e1b4b 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 px-4 pt-3 pb-3 border-b border-white/10"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Target className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span className="font-bold text-white text-sm truncate">{session.title}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-white/60 text-xs">{studentName}</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded-full border border-emerald-400/30">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">

        {/* Question number */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          {answers[currentQuestionIndex] && (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Answered
            </span>
          )}
        </div>

        {/* Question text */}
        <div className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/10">
          <p className="text-white text-lg font-bold leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        {/* Answer options */}
        <div className="space-y-3 flex-1">
          {currentQuestion.options.map((option: string, idx: number) => {
            const isSelected = answers[currentQuestionIndex] === option;
            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(option)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.98] border-2 min-h-[72px]"
                style={{
                  background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'white',
                  borderColor: isSelected ? '#34d399' : 'transparent',
                  color: isSelected ? 'white' : '#111827',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-sm"
                  style={{
                    background: isSelected ? 'rgba(52, 211, 153, 0.3)' : '#d1fae5',
                    color: isSelected ? '#34d399' : '#065f46',
                  }}
                >
                  {LABELS[idx]}
                </span>
                <span className="font-semibold text-base leading-snug flex-1">
                  {option}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Question jump grid */}
        <div className="mt-5 bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Jump to Question</p>
          <div className="grid grid-cols-5 gap-2">
            {competition.questions.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className="h-11 rounded-xl font-bold text-sm transition-all active:scale-90"
                style={{
                  background: idx === currentQuestionIndex
                    ? '#059669'
                    : answers[idx]
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255,255,255,0.1)',
                  color: idx === currentQuestionIndex
                    ? 'white'
                    : answers[idx]
                      ? '#34d399'
                      : 'rgba(255,255,255,0.5)',
                  border: idx === currentQuestionIndex ? '2px solid #34d399' : '2px solid transparent',
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10 flex gap-3"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold transition-all active:scale-95 min-h-[56px]"
          style={{
            background: currentQuestionIndex === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
            color: currentQuestionIndex === 0 ? 'rgba(255,255,255,0.2)' : 'white',
            minWidth: '80px',
          }}
        >
          <ChevronLeft className="h-5 w-5" />
          Prev
        </button>

        {!isLastQuestion ? (
          <button
            onClick={() => setCurrentQuestionIndex((i) => i + 1)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 min-h-[56px]"
            style={{ background: 'linear-gradient(135deg, #059669, #065f46)' }}
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white transition-all active:scale-95 min-h-[56px]"
            style={{
              background: allAnswered
                ? 'linear-gradient(135deg, #059669, #065f46)'
                : 'rgba(255,255,255,0.15)',
            }}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                {allAnswered ? 'Submit Quiz' : `Submit (${answeredCount}/${totalQuestions})`}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
