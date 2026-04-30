// Practice Live Mode Participant View — Mobile-first redesign
// Self-paced quiz: no timer, prev/next navigation, question jump grid

import { useState, useEffect, useRef } from 'react';
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
  const [quizStartTime] = useState<number>(Date.now());
  const wakeLockRef = useRef<any>(null);

  // Keep screen on while practicing
  useEffect(() => {
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };
    acquire();
    const onVisible = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

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
      const { attemptId } = await submitAttempt(sessionId, studentName, answers, competition.questions, quizStartTime);
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
        style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 40%, #1e1b4b 100%)' }}>
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
        style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 40%, #1e1b4b 100%)' }}>
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
      className="h-[100dvh] flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}
    >
      {/* Header — compact */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/10 flex items-center gap-2">
        <Target className="h-4 w-4 text-emerald-400 flex-shrink-0" />
        <span className="font-bold text-white text-xs truncate flex-1">{session.title}</span>
        <span className="text-white/50 text-xs flex-shrink-0">{studentName}</span>
        <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex-shrink-0">
          {answeredCount}/{totalQuestions}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-1 bg-white/10">
        <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Question number */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">
          Q {currentQuestionIndex + 1} / {totalQuestions}
        </span>
        {answers[currentQuestionIndex] && (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Answered
          </span>
        )}
      </div>

      {/* Question text — scrollable if very long */}
      <div className="flex-shrink-0 mx-3 mb-2 rounded-xl p-3 border border-white/10" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <p className="text-white text-sm font-bold leading-snug">
          {currentQuestion.question}
        </p>
      </div>

      {/* Answer options — flex-1 on mobile to fill space, compact on desktop */}
      <div className="flex-1 flex flex-col gap-2 px-3 py-1 min-h-0">
        {currentQuestion.options.map((option: string, idx: number) => {
          const isSelected = answers[currentQuestionIndex] === option;
          return (
            <button
              key={idx}
              onClick={() => handleAnswerSelect(option)}
              className="flex-1 md:flex-none flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 active:scale-[0.98] border-2"
              style={{
                background: isSelected ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
                borderColor: isSelected ? '#34d399' : 'rgba(255,255,255,0.08)',
                color: 'white',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg font-black text-xs"
                style={{
                  background: isSelected ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.1)',
                  color: isSelected ? '#34d399' : 'rgba(255,255,255,0.6)',
                }}
              >
                {LABELS[idx]}
              </span>
              <span className="font-semibold text-sm leading-snug flex-1">{option}</span>
              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Spacer — only on mobile to push controls to bottom */}
      <div className="md:hidden flex-none" />

      {/* Jump grid — compact strip */}
      <div className="flex-shrink-0 px-3 py-2 mt-1">
        <div className="flex gap-1.5 flex-wrap">
          {competition.questions.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className="h-7 min-w-[28px] px-1 rounded-lg font-bold text-xs transition-all active:scale-90 flex-shrink-0"
              style={{
                background: idx === currentQuestionIndex ? '#059669' : answers[idx] ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)',
                color: idx === currentQuestionIndex ? 'white' : answers[idx] ? '#34d399' : 'rgba(255,255,255,0.4)',
                border: idx === currentQuestionIndex ? '1.5px solid #34d399' : '1.5px solid transparent',
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex-shrink-0 px-3 pb-3 pt-1.5 border-t border-white/10 flex gap-2"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{
            background: currentQuestionIndex === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)',
            color: currentQuestionIndex === 0 ? 'rgba(255,255,255,0.15)' : 'white',
            minWidth: '70px',
          }}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>

        {!isLastQuestion ? (
          <button
            onClick={() => setCurrentQuestionIndex((i) => i + 1)}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #059669, #065f46)' }}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl font-black text-sm text-white transition-all active:scale-95"
            style={{ background: allAnswered ? 'linear-gradient(135deg, #059669, #065f46)' : 'rgba(255,255,255,0.12)' }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
