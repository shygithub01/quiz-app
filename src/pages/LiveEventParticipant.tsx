// Live Event Participant View
// Mobile-first full-screen interface for participants to answer questions

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Award, Wifi, WifiOff, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { getCompetitionById } from '@/components/ui/firebase';
import BottomNav from '@/components/BottomNav';
import {
  getEventById,
  listenToEvent,
  listenToLeaderboard,
  submitAnswer,
  updateHeartbeat
} from '@/services/liveEventService';
import { LiveEvent, LeaderboardEntry } from '@/types/liveEvent';

// Medal emoji by rank
function rankMedal(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

// Answer label: A, B, C, D
const LABELS = ['A', 'B', 'C', 'D'];

export default function LiveEventParticipant() {
  const { eventId, sessionId } = useParams<{ eventId: string; sessionId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [myTotalTime, setMyTotalTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [queuedAnswer, setQueuedAnswer] = useState<{
    answer: string;
    timeToAnswer: number;
    questionIndex: number;
  } | null>(null);
  const [myName, setMyName] = useState<string>('You');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [eventWasLoaded, setEventWasLoaded] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const questionStartTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number>(0);
  const prevQuestionIndexRef = useRef<number>(-1);

  // Load event and competition
  useEffect(() => {
    if (!eventId) return;

    const timeout = setTimeout(() => setLoadingTimeout(true), 10000);

    const loadData = async () => {
      try {
        const eventData = await getEventById(eventId);
        if (eventData) {
          setEvent(eventData);
          clearTimeout(timeout);
          const compData = await getCompetitionById(eventData.competitionId);
          setCompetition(compData);
        } else {
          clearTimeout(timeout);
          setEvent(null);
          setCompetition(null);
        }
      } catch (error) {
        console.error('❌ Participant - Error loading data:', error);
        clearTimeout(timeout);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
    return () => clearTimeout(timeout);
  }, [eventId]);

  // Load participant name
  useEffect(() => {
    if (!eventId || !sessionId) return;

    const loadParticipantName = async () => {
      try {
        const { getParticipants, reactivateParticipant } = await import('@/services/liveEventService');
        const participants = await getParticipants(eventId);
        const myParticipant = participants.find(p => p.sessionId === sessionId);
        if (myParticipant) {
          setMyName(myParticipant.name);
          sessionStorage.setItem(`liveEvent_${eventId}_name`, myParticipant.name);
          // If onDisconnect marked us inactive during page navigation, reactivate now
          if (!myParticipant.isActive) {
            await reactivateParticipant(eventId, sessionId);
          }
        } else {
          const storedName = sessionStorage.getItem(`liveEvent_${eventId}_name`);
          if (storedName) setMyName(storedName);
        }
      } catch {
        const storedName = sessionStorage.getItem(`liveEvent_${eventId}_name`);
        if (storedName) setMyName(storedName);
      }
    };

    loadParticipantName();
  }, [eventId, sessionId]);

  // Real-time listeners
  useEffect(() => {
    if (!eventId) return;

    const connectionTimeout = setTimeout(() => setIsConnected(false), 5000);

    const unsubscribeEvent = listenToEvent(eventId, (updatedEvent) => {
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      reconnectTimeoutRef.current = Date.now();

      if (updatedEvent) {
        setEvent(updatedEvent);
        setEventWasLoaded(true);

        // Reset answer state only when question index actually changes
        if (
          updatedEvent.phase === 'question' &&
          updatedEvent.currentQuestionIndex !== prevQuestionIndexRef.current
        ) {
          prevQuestionIndexRef.current = updatedEvent.currentQuestionIndex;
          setSelectedAnswer(null);
          setHasAnswered(false);
          questionStartTimeRef.current = Date.now();
        }
      } else {
        setEvent(null);
      }
    });

    const unsubscribeLeaderboard = listenToLeaderboard(eventId, (updatedLeaderboard) => {
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      reconnectTimeoutRef.current = Date.now();

      setLeaderboard(updatedLeaderboard);
      const myEntry = updatedLeaderboard.find(entry => entry.sessionId === sessionId);
      if (myEntry) {
        setMyScore(myEntry.score);
        setMyRank(myEntry.rank);
        setMyTotalTime(myEntry.totalTime || 0);
      }
    });

    return () => {
      clearTimeout(connectionTimeout);
      unsubscribeEvent();
      unsubscribeLeaderboard();
    };
  }, [eventId, sessionId]);

  // Heartbeat
  useEffect(() => {
    if (!eventId || !sessionId) return;

    const sendHeartbeat = () => updateHeartbeat(eventId, sessionId);
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    const setupDisconnectHandler = async () => {
      if (event?.phase === 'lobby') {
        const { setupParticipantDisconnectHandler } = await import('@/services/liveEventService');
        await setupParticipantDisconnectHandler(eventId, sessionId);
      }
    };
    setupDisconnectHandler();

    return () => clearInterval(interval);
  }, [eventId, sessionId, event?.phase]);

  // Countdown animation
  useEffect(() => {
    if (event?.phase !== 'countdown') return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [event?.phase]);

  // Timer countdown
  useEffect(() => {
    if (!event || event.phase !== 'question' || !event.timerStartedAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - event.timerStartedAt! - event.pausedDuration;
      const remaining = Math.max(0, event.timerDuration - elapsed / 1000);
      setRemainingTime(Math.ceil(remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [event?.phase, event?.timerStartedAt, event?.timerDuration, event?.pausedDuration]);

  // Set question start time
  useEffect(() => {
    if (event?.phase === 'question' && event.timerStartedAt) {
      questionStartTimeRef.current = event.timerStartedAt;
    }
  }, [event?.phase, event?.timerStartedAt]);

  // Retry queued answer on reconnect
  useEffect(() => {
    if (!isConnected || !queuedAnswer || !eventId || !sessionId || !event) return;

    const retryAnswer = async () => {
      try {
        const now = Date.now();
        const timeSinceDisconnect = now - reconnectTimeoutRef.current;
        if (timeSinceDisconnect > 60000) {
          alert('Your session has expired. Please rejoin the event.');
          setQueuedAnswer(null);
          return;
        }

        const elapsed = now - event.timerStartedAt! - event.pausedDuration;
        const remaining = event.timerDuration - elapsed / 1000;

        if (remaining > 0) {
          await submitAnswer(eventId, sessionId, queuedAnswer.questionIndex, queuedAnswer.answer, queuedAnswer.timeToAnswer);
          setHasAnswered(true);
          setQueuedAnswer(null);
        } else {
          alert('Time expired. Your answer could not be submitted.');
          setQueuedAnswer(null);
        }
      } catch (error) {
        console.error('Error retrying answer:', error);
      }
    };

    retryAnswer();
  }, [isConnected, queuedAnswer, eventId, sessionId, event]);

  const handleAnswerSelect = async (answer: string) => {
    if (!event || !eventId || !sessionId || hasAnswered || remainingTime === 0) return;

    setSelectedAnswer(answer);

    try {
      const now = Date.now();
      const timeToAnswer = (now - questionStartTimeRef.current) / 1000;
      await submitAnswer(eventId, sessionId, event.currentQuestionIndex, answer, timeToAnswer);
      setHasAnswered(true);

      // Haptic feedback on mobile
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      if (!isConnected) {
        const now = Date.now();
        const timeToAnswer = (now - questionStartTimeRef.current) / 1000;
        setQueuedAnswer({ answer, timeToAnswer, questionIndex: event.currentQuestionIndex });
        alert('Connection lost. Your answer will be submitted when connection is restored.');
      } else {
        alert(error.message || 'Failed to submit answer');
        setSelectedAnswer(null);
      }
    }
  };

  // ──────────────── Error / Loading States ────────────────

  // Show a loading spinner while the initial Firebase fetch is in flight.
  // Previously this fell through to the "Event Ended" screen because event and
  // competition both start as null — causing a black/ended screen for 1-2s on load.
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Joining event...</p>
        </div>
      </div>
    );
  }

  if (event === null && competition === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <div className="text-center text-white max-w-sm w-full">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Event Ended</h2>
          <p className="text-white/70 mb-6">This event has been completed and deleted by the host.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl active:scale-95 transition-transform"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!event || !competition) {
    if (eventWasLoaded && !event) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-6">
          <div className="text-center text-white max-w-sm w-full">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Event Ended</h2>
            <p className="text-white/70 mb-6">The host has ended this event.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl active:scale-95 transition-transform"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    if (loadingTimeout) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-6">
          <div className="text-center text-white max-w-sm w-full">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Connection Error</h2>
            <p className="text-white/70 mb-6">Unable to load event. It may have been deleted.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl mb-3 active:scale-95 transition-transform"
            >
              Reload
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-white/10 text-white font-semibold text-lg rounded-2xl active:scale-95 transition-transform"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = competition.questions?.[event.currentQuestionIndex];
  const totalQuestions = competition.questions?.length || 0;
  const timerPercent = event.timerDuration > 0 ? (remainingTime / event.timerDuration) * 100 : 0;
  const timerUrgent = remainingTime <= 10 && remainingTime > 0;

  // ──────────────── Main Render ────────────────
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 px-4 pt-3 pb-2"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Trophy className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <span className="font-bold text-white text-sm truncate">{competition.title}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Score badge */}
            <div className="flex items-center gap-1 bg-white/15 rounded-full px-3 py-1">
              <Award className="h-3.5 w-3.5 text-yellow-300" />
              <span className="text-white text-xs font-bold">{myScore}</span>
              {myRank > 0 && (
                <span className="text-white/70 text-xs ml-1">#{myRank}</span>
              )}
            </div>
            {/* Connection indicator */}
            {isConnected
              ? <Wifi className="h-4 w-4 text-green-400" />
              : <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />
            }
          </div>
        </div>

        {/* Name tag */}
        <p className="text-white/60 text-xs">{myName}</p>

        {/* Connection lost banner */}
        {!isConnected && (
          <div className="mt-2 flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-xl px-3 py-2">
            <WifiOff className="h-4 w-4 text-orange-400 flex-shrink-0" />
            <p className="text-orange-300 text-xs">Connection lost — reconnecting...</p>
          </div>
        )}
        {queuedAnswer && (
          <div className="mt-2 flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-xl px-3 py-2">
            <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <p className="text-blue-300 text-xs">Answer queued — will submit on reconnect</p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-4 pb-4 overflow-y-auto">

        {/* ── LOBBY ── */}
        {event.phase === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 pb-24">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-purple-600/40 flex items-center justify-center mx-auto">
                <Trophy className="h-12 w-12 text-yellow-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome, {myName}!</h2>
            <p className="text-white/60 mb-3">You've successfully joined.</p>
            <div className="bg-white/10 rounded-2xl px-6 py-4 inline-block">
              <p className="text-white/80 text-sm">Waiting for host to start...</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {event.phase === 'countdown' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {countdown > 0 ? (
                <div>
                  <p className="text-white/60 text-lg mb-2 font-medium">Get ready!</p>
                  <p className="text-[120px] font-black text-white leading-none animate-bounce">
                    {countdown}
                  </p>
                </div>
              ) : (
                <p className="text-[100px] font-black text-green-400 leading-none animate-pulse">GO!</p>
              )}
            </div>
          </div>
        )}

        {/* ── QUESTION ── */}
        {event.phase === 'question' && currentQuestion && (
          <div className="flex-1 flex flex-col">
            {/* Progress + Timer */}
            <div className="mb-4">
              {/* Progress line */}
              <div className="flex items-center justify-between text-white/60 text-xs mb-2">
                <span>Q{event.currentQuestionIndex + 1} of {totalQuestions}</span>
                <span className={`font-bold text-base ${timerUrgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {remainingTime}s
                </span>
              </div>

              {/* Timer bar */}
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    timerUrgent ? 'bg-red-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>

              {/* Big timer circle on mobile */}
              <div className="flex justify-center mt-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                  timerUrgent
                    ? 'border-red-400 bg-red-500/20'
                    : 'border-white/30 bg-white/10'
                }`}>
                  <span className={`text-xl font-black ${timerUrgent ? 'text-red-400' : 'text-white'}`}>
                    {remainingTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/10">
              <p className="text-white text-lg md:text-xl font-bold leading-relaxed text-center">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 flex-1">
              {currentQuestion.options.map((option: string, idx: number) => {
                const isSelected = selectedAnswer === option;
                const isDisabled = hasAnswered || remainingTime === 0;

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left
                      transition-all duration-150 active:scale-[0.98] touch-manipulation
                      border-2 min-h-[72px]
                      ${isSelected
                        ? 'bg-purple-500 border-purple-300 text-white shadow-lg scale-[1.01]'
                        : isDisabled
                          ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                          : 'bg-white border-white/0 text-gray-900 hover:bg-purple-50 hover:border-purple-200 active:bg-purple-100'
                      }
                    `}
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {LABELS[idx]}
                    </span>
                    <span className="font-semibold text-base leading-snug flex-1">
                      {option}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answered confirmation */}
            {hasAnswered && (
              <div className="mt-4 flex items-center justify-center gap-3 bg-green-500/20 border border-green-400/30 rounded-2xl px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <p className="text-green-300 font-semibold text-sm">
                  Answer submitted! Waiting for others...
                </p>
              </div>
            )}

            {/* Time's up */}
            {remainingTime === 0 && !hasAnswered && (
              <div className="mt-4 flex items-center justify-center gap-3 bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3">
                <Clock className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 font-semibold text-sm">Time's up!</p>
              </div>
            )}
          </div>
        )}

        {/* ── CORRECT / WRONG FLASH ── */}
        {hasAnswered && event.phase === 'question' && currentQuestion && (() => {
          const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
          return (
            <div
              className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
              style={{
                background: isCorrect
                  ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              {isCorrect ? (
                <CheckCircle2 className="h-28 w-28 text-white mb-5 drop-shadow-lg" />
              ) : (
                <XCircle className="h-28 w-28 text-white mb-5 drop-shadow-lg" />
              )}

              <h2 className="text-5xl font-black text-white mb-6 tracking-tight">
                {isCorrect ? 'Correct!' : 'Wrong!'}
              </h2>

              <div className="bg-white/20 rounded-2xl px-6 py-4 text-center max-w-xs w-full">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                  Your answer
                </p>
                <p className="text-white font-bold text-lg leading-snug">
                  {selectedAnswer}
                </p>
              </div>

              <p className="text-white/50 text-sm mt-6">
                Waiting for others...
              </p>
            </div>
          );
        })()}

        {/* ── LEADERBOARD (between questions) ── */}
        {event.phase === 'leaderboard' && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl font-black text-white text-center mb-4">Current Standings</h2>

            {/* Top entries */}
            <div className="space-y-2 flex-1">
              {leaderboard.slice(0, 10).map((entry) => {
                const isMe = entry.sessionId === sessionId;
                return (
                  <div
                    key={entry.sessionId}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      isMe
                        ? 'bg-purple-500 border-2 border-purple-300 shadow-lg'
                        : 'bg-white/10 border border-white/10'
                    }`}
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0">
                      {rankMedal(entry.rank)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate text-sm ${isMe ? 'text-white' : 'text-white/90'}`}>
                        {entry.name}{isMe ? ' (You)' : ''}
                      </p>
                      <p className={`text-xs ${isMe ? 'text-purple-200' : 'text-white/50'}`}>
                        {entry.correctAnswers} correct
                      </p>
                    </div>
                    <span className={`text-lg font-black flex-shrink-0 ${isMe ? 'text-white' : 'text-white/90'}`}>
                      {entry.score}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pinned: my rank if outside top 10 */}
            {myRank > 10 && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-500 border-2 border-purple-300">
                  <span className="text-xl w-8 text-center flex-shrink-0">#{myRank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{myName} (You)</p>
                  </div>
                  <span className="text-lg font-black text-white flex-shrink-0">{myScore}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {event.phase === 'results' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 pb-24">
            <div className="text-6xl mb-4">
              {myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎉'}
            </div>
            <h2 className="text-2xl font-black text-white mb-6">Quiz Complete!</h2>

            <div className="bg-white/10 rounded-3xl p-6 mb-6 w-full max-w-xs border border-white/20">
              <p className="text-white/60 text-sm mb-1">Your Final Rank</p>
              <p className="text-6xl font-black text-white mb-2">#{myRank}</p>
              <p className="text-3xl font-bold text-purple-300 mb-1">{myScore} pts</p>
              {myTotalTime > 0 && (
                <p className="text-sm text-white/50">{myTotalTime.toFixed(1)}s total time</p>
              )}
            </div>

            <p className="text-white/60 text-sm mb-8">Thank you for participating!</p>

            <button
              onClick={() => navigate('/')}
              className="w-full max-w-xs py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl active:scale-95 transition-transform"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav — visible during lobby and results phases only */}
      {(event.phase === 'lobby' || event.phase === 'results') && <BottomNav />}
    </div>
  );
}
