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

// Format milliseconds as HH:MM:SS
function formatLobbyCountdown(ms: number): string {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Format UTC timestamp as Eastern time string e.g. "7:00 PM"
function formatEasternTime(utcMs: number): string {
  return new Date(utcMs).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format UTC timestamp as local time with day label e.g. "Today at 4:00 PM" or "Tomorrow at 12:00 AM"
function formatLocalStartTime(utcMs: number): string {
  const now = new Date();
  const target = new Date(utcMs);
  const timeStr = target.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (target.toDateString() === now.toDateString()) return `Today at ${timeStr}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (target.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${timeStr}`;
  const dateStr = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dateStr} at ${timeStr}`;
}

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
  const [showDrumroll, setShowDrumroll] = useState(false);
  const [myAnswers, setMyAnswers] = useState<Record<number, { answer: string; timeToAnswer: number }>>({});
  const [lobbyCountdownMs, setLobbyCountdownMs] = useState(0);
  const [showFiveMinWarning, setShowFiveMinWarning] = useState(false);

  const questionStartTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number>(0);
  const prevQuestionIndexRef = useRef<number>(-1);
  const prevPhaseRef = useRef<string>('');
  const lastQuestionRef = useRef<any>(null);
  // Tracks which question we already fired the participant fallback for
  const participantAutoAdvancedForRef = useRef<number>(-1);

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
        // Event deleted from Firebase. If we were already on results,
        // stay there — don't replace the dashboard with "Event Ended".
        if (prevPhaseRef.current === 'results') return;
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

  // Lobby countdown to scheduledStartAt
  useEffect(() => {
    if (event?.phase !== 'lobby' || !event.scheduledStartAt) return;

    const tick = () => {
      const remaining = event.scheduledStartAt! - Date.now();
      setLobbyCountdownMs(remaining);
      if (remaining <= 300000 && remaining > 0) setShowFiveMinWarning(true);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [event?.phase, event?.scheduledStartAt]);

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

  // Participant-side fallback auto-advance.
  // If BOTH the host tab and projector tab close/crash, nothing would normally
  // advance the event — participants would sit frozen. This effect fires 5 seconds
  // after the timer expires, giving the host screen priority to act first.
  // attemptAutoAdvance is idempotent: it re-reads Firebase state before touching
  // anything, so 1000 clients calling it simultaneously is safe — only the first
  // one through the guard actually writes.
  useEffect(() => {
    if (!event || !eventId || !competition) return;
    if (event.phase !== 'question' || event.status !== 'active') return;
    if (!event.timerStartedAt || !event.settings?.autoAdvanceOnTimer) return;

    const questionIndex = event.currentQuestionIndex;
    let hasFired = false;

    const check = async () => {
      if (hasFired) return;
      if (participantAutoAdvancedForRef.current === questionIndex) return;
      const elapsed = Date.now() - event.timerStartedAt! - event.pausedDuration;
      const remaining = event.timerDuration - elapsed / 1000;
      // 5-second buffer — host/projector get first shot
      if (remaining <= -5) {
        hasFired = true;
        participantAutoAdvancedForRef.current = questionIndex;
        const { attemptAutoAdvance } = await import('@/services/liveEventService');
        await attemptAutoAdvance(
          eventId,
          questionIndex,
          competition.questions || [],
          event.settings.enableFastestFingerBonus
        );
      }
    };

    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [event?.phase, event?.currentQuestionIndex, event?.timerStartedAt, event?.status, competition]);

  // Auto-close after 2 minutes on results screen
  const [closeCountdown, setCloseCountdown] = useState(0);
  useEffect(() => {
    if (event?.phase !== 'results') return;
    setCloseCountdown(120);
    const t = setTimeout(() => { window.close(); window.location.href = '/'; }, 120000);
    const iv = setInterval(() => setCloseCountdown(c => Math.max(0, c - 1)), 1000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [event?.phase]);

  // Fetch participant's own answers when results phase is reached
  useEffect(() => {
    if (!eventId || !sessionId || event?.phase !== 'results') return;

    const fetchMyAnswers = async () => {
      try {
        const { get, ref } = await import('firebase/database');
        const { realtimeDb } = await import('@/components/ui/firebase');
        const snapshot = await get(ref(realtimeDb, `eventAnswers/${eventId}/${sessionId}`));
        if (snapshot.exists()) {
          const raw = snapshot.val() as Record<string, { answer: string; timeToAnswer: number }>;
          // Firebase stores keys as strings; convert to number-keyed map
          const parsed: Record<number, { answer: string; timeToAnswer: number }> = {};
          Object.entries(raw).forEach(([k, v]) => { parsed[Number(k)] = v; });
          setMyAnswers(parsed);
        }
      } catch (err) {
        console.error('Error fetching my answers:', err);
      }
    };

    fetchMyAnswers();
  }, [event?.phase, eventId, sessionId]);

  // Drumroll: triggers on question → leaderboard phase transition
  useEffect(() => {
    if (!event?.phase) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = event.phase;

    if (prev === 'question' && event.phase === 'leaderboard') {
      // Snapshot the question that was just answered before index could change
      const q = competition?.questions?.[event.currentQuestionIndex] ?? null;
      lastQuestionRef.current = q;
      setShowDrumroll(true);
      const timer = setTimeout(() => setShowDrumroll(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [event?.phase, event?.currentQuestionIndex, competition]);

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
      // Cache locally so results dashboard works even if Firebase data is deleted before results phase
      setMyAnswers(prev => ({ ...prev, [event.currentQuestionIndex]: { answer, timeToAnswer } }));
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
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 pb-24">

            {event.scheduledStartAt ? (
              <>
                {/* 5-min warning banner */}
                {showFiveMinWarning && lobbyCountdownMs > 0 && (
                  <div className="w-full mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 animate-pulse"
                    style={{ background: 'rgba(234,179,8,0.2)', border: '1.5px solid rgba(234,179,8,0.5)' }}>
                    <span className="text-yellow-300 text-lg">⚡</span>
                    <p className="text-yellow-200 font-bold text-sm">Starting in 5 minutes — get ready!</p>
                  </div>
                )}

                {lobbyCountdownMs > 0 ? (
                  <>
                    <div className="relative mb-5">
                      <div className="w-20 h-20 rounded-full bg-purple-600/40 flex items-center justify-center mx-auto">
                        <Trophy className="h-10 w-10 text-yellow-400" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Welcome, {myName}!</h2>
                    <p className="text-white/50 text-sm mb-6">Event starts automatically — no action needed</p>

                    {/* Big countdown */}
                    <div className="rounded-3xl px-8 py-6 mb-5 w-full max-w-xs"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Event starts in</p>
                      <p className="text-5xl font-black text-white tracking-wider tabular-nums">
                        {formatLobbyCountdown(lobbyCountdownMs)}
                      </p>
                      <div className="mt-4 space-y-1">
                        <p className="text-white/40 text-xs">
                          {formatEasternTime(event.scheduledStartAt)} Eastern
                        </p>
                        <p className="text-white/80 text-sm font-semibold">
                          {formatLocalStartTime(event.scheduledStartAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 text-white/40 text-sm">
                      <span>📋 {competition?.questions?.length || 0} questions</span>
                      <span>·</span>
                      <span>⏱ {event.settings?.questionTimer || 30}s each</span>
                    </div>
                  </>
                ) : (
                  /* Countdown hit 0 — waiting for Firebase phase change */
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-5" />
                    <p className="text-white text-2xl font-bold">Starting now...</p>
                    <p className="text-white/50 text-sm mt-2">Get ready!</p>
                  </div>
                )}
              </>
            ) : (
              /* No scheduled time — waiting for host */
              <>
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
              </>
            )}
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
              {(currentQuestion.options ?? []).map((option: string, idx: number) => {
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
                <CheckCircle2 className="h-24 w-24 text-white mb-4 drop-shadow-lg" />
              ) : (
                <XCircle className="h-24 w-24 text-white mb-4 drop-shadow-lg" />
              )}

              <h2 className="text-5xl font-black text-white mb-4 tracking-tight">
                {isCorrect ? 'Correct!' : 'Wrong!'}
              </h2>

              {/* Circular countdown timer — bold, above answer boxes */}
              {(() => {
                const radius = 52;
                const circumference = 2 * Math.PI * radius;
                const progress = event.timerDuration > 0 ? remainingTime / event.timerDuration : 0;
                const dashOffset = circumference * (1 - progress);
                const urgent = remainingTime <= 10 && remainingTime > 0;
                return (
                  <div className={`relative w-36 h-36 flex items-center justify-center mb-5 ${urgent ? 'animate-pulse' : ''}`}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
                      {/* Track */}
                      <circle
                        cx="72" cy="72" r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="12"
                      />
                      {/* Progress arc */}
                      <circle
                        cx="72" cy="72" r={radius}
                        fill="none"
                        stroke={urgent ? '#f87171' : '#facc15'}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
                      />
                    </svg>
                    <span className={`text-5xl font-black tabular-nums drop-shadow-lg ${urgent ? 'text-red-300' : 'text-yellow-300'}`}>
                      {remainingTime}
                    </span>
                  </div>
                );
              })()}

              {/* Answer comparison — both boxes identical size */}
              <div className="w-full max-w-xs space-y-3">
                {/* Their answer */}
                <div className={`rounded-2xl px-5 py-4 text-center border-2 ${
                  isCorrect
                    ? 'bg-white/20 border-white/30'
                    : 'bg-white/10 border-red-300/50'
                }`}>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                    {isCorrect ? 'Your answer' : 'You answered'}
                  </p>
                  <p className="text-white font-black text-xl leading-snug">
                    {selectedAnswer}
                  </p>
                </div>

                {/* Correct answer — same box style, shown when wrong */}
                {!isCorrect && (
                  <div className="bg-green-500/25 border-2 border-green-400/60 rounded-2xl px-5 py-4 text-center">
                    <p className="text-green-300/80 text-xs font-bold uppercase tracking-widest mb-1">
                      Correct answer
                    </p>
                    <p className="text-white font-black text-xl leading-snug">
                      {currentQuestion.correctAnswer}
                    </p>
                  </div>
                )}
              </div>
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

        {/* ── RESULTS DASHBOARD ── */}
        {event.phase === 'results' && (
          <div className="flex-1 flex flex-col pb-24">

            {/* Hero: rank + score */}
            <div className="flex flex-col items-center text-center py-6">
              <div className="text-6xl mb-3">
                {myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎉'}
              </div>
              <h2 className="text-2xl font-black text-white mb-4">Quiz Complete!</h2>
              {closeCountdown > 0 && (
                <p className="text-white/40 text-xs mt-1 mb-2">Closing in {closeCountdown}s</p>
              )}

              <div className="bg-white/10 rounded-3xl p-5 w-full border border-white/20 mb-2">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-white/50 text-xs mb-1">Rank</p>
                    <p className="text-4xl font-black text-white">#{myRank}</p>
                  </div>
                  <div className="w-px h-12 bg-white/20" />
                  <div className="text-center">
                    <p className="text-white/50 text-xs mb-1">Score</p>
                    <p className="text-4xl font-black text-purple-300">{myScore}</p>
                  </div>
                  <div className="w-px h-12 bg-white/20" />
                  <div className="text-center">
                    <p className="text-white/50 text-xs mb-1">Correct</p>
                    <p className="text-4xl font-black text-green-400">
                      {competition?.questions
                        ? Object.entries(myAnswers).filter(([qi, a]) =>
                            a.answer === competition.questions[Number(qi)]?.correctAnswer
                          ).length
                        : '—'}
                    </p>
                  </div>
                </div>
                {myTotalTime > 0 && (
                  <p className="text-white/40 text-xs text-center mt-3">{myTotalTime.toFixed(1)}s total answer time</p>
                )}
              </div>
            </div>

            {/* Podium */}
            {leaderboard.length > 0 && (
              <div className="mb-4">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 px-1 text-center">Final Standings</p>
                <div className="flex items-end justify-center gap-3 mb-3">
                  {/* 2nd place */}
                  {leaderboard[1] && (() => {
                    const isMe = leaderboard[1].sessionId === sessionId;
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-3xl">🥈</span>
                        <p className={`font-bold text-sm text-center max-w-[90px] truncate ${isMe ? 'text-purple-300' : 'text-white/80'}`}>
                          {leaderboard[1].name}{isMe ? ' (You)' : ''}
                        </p>
                        <p className="text-xs font-bold text-white/50">{leaderboard[1].score} pts</p>
                        {leaderboard[1].totalTime != null && leaderboard[1].totalTime > 0 && (
                          <p className="text-[10px] font-bold text-white/30">{leaderboard[1].totalTime.toFixed(1)}s</p>
                        )}
                        <div className="w-20 rounded-t-xl flex items-center justify-center font-black text-2xl text-white"
                          style={{ height: 64, background: 'linear-gradient(180deg,#94a3b8,#64748b)' }}>2</div>
                      </div>
                    );
                  })()}
                  {/* 1st place */}
                  {(() => {
                    const isMe = leaderboard[0].sessionId === sessionId;
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-4xl">🥇</span>
                        <p className={`font-black text-base text-center max-w-[110px] truncate ${isMe ? 'text-yellow-300' : 'text-white'}`}>
                          {leaderboard[0].name}{isMe ? ' (You)' : ''}
                        </p>
                        <p className="text-sm font-black text-yellow-200">{leaderboard[0].score} pts</p>
                        {leaderboard[0].totalTime != null && leaderboard[0].totalTime > 0 && (
                          <p className="text-[10px] font-bold text-yellow-200/40">{leaderboard[0].totalTime.toFixed(1)}s</p>
                        )}
                        <div className="w-24 rounded-t-xl flex items-center justify-center font-black text-3xl text-white"
                          style={{ height: 88, background: 'linear-gradient(180deg,#f59e0b,#d97706)' }}>1</div>
                      </div>
                    );
                  })()}
                  {/* 3rd place */}
                  {leaderboard[2] && (() => {
                    const isMe = leaderboard[2].sessionId === sessionId;
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-3xl">🥉</span>
                        <p className={`font-bold text-sm text-center max-w-[90px] truncate ${isMe ? 'text-purple-300' : 'text-white/80'}`}>
                          {leaderboard[2].name}{isMe ? ' (You)' : ''}
                        </p>
                        <p className="text-xs font-bold text-white/50">{leaderboard[2].score} pts</p>
                        {leaderboard[2].totalTime != null && leaderboard[2].totalTime > 0 && (
                          <p className="text-[10px] font-bold text-white/30">{leaderboard[2].totalTime.toFixed(1)}s</p>
                        )}
                        <div className="w-20 rounded-t-xl flex items-center justify-center font-black text-2xl text-white"
                          style={{ height: 48, background: 'linear-gradient(180deg,#cd7f32,#92400e)' }}>3</div>
                      </div>
                    );
                  })()}
                </div>
                {/* Pinned: my entry if outside top 3 */}
                {myRank > 3 && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-500 border-2 border-purple-300 mt-2">
                    <span className="text-lg w-7 text-center flex-shrink-0 font-black">#{myRank}</span>
                    <p className="flex-1 font-bold text-white text-sm truncate">{myName} (You)</p>
                    <span className="font-black text-white text-sm">{myScore} pts</span>
                  </div>
                )}
              </div>
            )}

            {/* Per-question breakdown */}
            {competition?.questions && competition.questions.length > 0 && (
              <div className="mb-4">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 px-1">Your Answers</p>
                <div className="space-y-2">
                  {competition.questions.map((q: any, qi: number) => {
                    const myAns = myAnswers[qi];
                    const correct = q.correctAnswer;
                    const isCorrect = myAns?.answer === correct;
                    const skipped = !myAns;

                    return (
                      <div key={qi}
                        className={`rounded-2xl p-4 border ${
                          skipped
                            ? 'bg-white/5 border-white/10'
                            : isCorrect
                              ? 'bg-green-500/15 border-green-500/30'
                              : 'bg-red-500/15 border-red-500/30'
                        }`}>
                        {/* Q number + status */}
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            skipped ? 'bg-white/10' : isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'
                          }`}>
                            {skipped
                              ? <span className="text-white/40 text-xs font-bold">—</span>
                              : isCorrect
                                ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                : <XCircle className="h-4 w-4 text-red-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/50 text-xs mb-1">Q{qi + 1}</p>
                            <p className="text-white text-sm font-semibold leading-snug mb-2">{q.question}</p>

                            {skipped ? (
                              <p className="text-white/30 text-xs italic">Not answered</p>
                            ) : (
                              <div className="space-y-1">
                                {/* Their answer */}
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                                  isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                }`}>
                                  <span className="flex-shrink-0">{isCorrect ? '✓' : '✗'}</span>
                                  <span className="truncate">{myAns.answer}</span>
                                  {myAns.timeToAnswer > 0 && (
                                    <span className="ml-auto flex-shrink-0 text-white/30">{myAns.timeToAnswer.toFixed(1)}s</span>
                                  )}
                                </div>
                                {/* Correct answer if wrong */}
                                {!isCorrect && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-500/20 text-green-300">
                                    <span className="flex-shrink-0">✓</span>
                                    <span className="truncate">{correct}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl active:scale-95 transition-transform mt-2"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>

      {/* ── DRUMROLL OVERLAY ── */}
      {showDrumroll && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-8"
          style={{
            background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 50%, #312e81 100%)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Drum emoji — bounces */}
          <div className="text-[80px] mb-4 animate-bounce">🥁</div>

          <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tight">
            Calculating scores...
          </h2>

          {/* Bouncing dots */}
          <div className="flex items-center gap-2 mb-8">
            <span className="w-3 h-3 bg-purple-300 rounded-full animate-bounce" />
            <span className="w-3 h-3 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <span className="w-3 h-3 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>

          {/* Correct answer reveal */}
          {lastQuestionRef.current && (
            <div className="bg-white/15 rounded-2xl px-6 py-5 text-center max-w-xs w-full border border-white/25">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">
                Correct answer
              </p>
              <p className="text-white font-bold text-xl leading-snug">
                {lastQuestionRef.current.correctAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom nav — visible during lobby and results phases only */}
      {(event.phase === 'lobby' || event.phase === 'results') && <BottomNav />}
    </div>
  );
}
