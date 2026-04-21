// Live Event Projector View — Enhanced for venue big-screen display
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Clock, Users, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getCompetitionById } from '@/components/ui/firebase';
import {
  getEventById,
  listenToEvent,
  listenToParticipants,
  listenToLeaderboard,
  listenToAnswerCount,
} from '@/services/liveEventService';
import { LiveEvent, GuestParticipant, LeaderboardEntry } from '@/types/liveEvent';
import { QRCodeSVG } from 'qrcode.react';
import { playVictorySound, stopBackgroundMusic } from '@/utils/backgroundMusic';

const OPTION_COLORS = [
  { bg: '#ef4444', border: '#b91c1c', label: 'A' },
  { bg: '#3b82f6', border: '#1d4ed8', label: 'B' },
  { bg: '#f59e0b', border: '#b45309', label: 'C' },
  { bg: '#22c55e', border: '#15803d', label: 'D' },
];
const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const ROW_HEIGHT = 88; // px per leaderboard row
const TOP_N = 5;

// ── Animated Leaderboard Panel ──────────────────────────────────────────────
interface RankedEntry extends LeaderboardEntry {
  prevRank?: number;
  delta?: number;  // positive = moved up, negative = moved down
}

function AnimatedLeaderboard({
  leaderboard,
  questionIndex,
  totalQuestions,
}: {
  leaderboard: LeaderboardEntry[];
  questionIndex: number;
  totalQuestions: number;
}) {
  const prevRanksRef = useRef<Record<string, number>>({});
  const [entries, setEntries] = useState<RankedEntry[]>([]);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const top = leaderboard.slice(0, TOP_N);
    const enriched: RankedEntry[] = top.map((e) => {
      const prev = prevRanksRef.current[e.sessionId];
      const delta = prev !== undefined ? prev - e.rank : 0; // positive = moved up
      return { ...e, prevRank: prev, delta };
    });

    // Flash entries that changed rank
    const changed = new Set(enriched.filter(e => e.delta !== 0).map(e => e.sessionId));
    if (changed.size > 0) {
      setFlashIds(changed);
      setTimeout(() => setFlashIds(new Set()), 1200);
    }

    // Save current ranks for next update
    top.forEach(e => { prevRanksRef.current[e.sessionId] = e.rank; });
    setEntries(enriched);
  }, [leaderboard]);

  const containerHeight = TOP_N * ROW_HEIGHT + (TOP_N - 1) * 8;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <Trophy className="h-7 w-7 text-yellow-400" />
        <span className="font-black text-2xl text-white">Top {TOP_N}</span>
        <span className="ml-auto text-white/40 font-semibold text-base">
          Q{questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* Animated rows */}
      <div className="relative flex-1" style={{ height: containerHeight }}>
        {entries.map((entry, visualIdx) => {
          const isFlashing = flashIds.has(entry.sessionId);
          const isFirst = entry.rank === 1;
          const moved = entry.delta ?? 0;

          return (
            <div
              key={entry.sessionId}
              style={{
                position: 'absolute',
                top: visualIdx * (ROW_HEIGHT + 8),
                left: 0,
                right: 0,
                height: ROW_HEIGHT,
                transition: 'top 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: isFirst ? 10 : TOP_N - visualIdx,
              }}
            >
              <div
                className="w-full h-full rounded-2xl flex items-center gap-3 px-4 overflow-hidden"
                style={{
                  background: isFirst
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : isFlashing
                    ? 'rgba(167,139,250,0.35)'
                    : 'rgba(255,255,255,0.1)',
                  border: isFirst
                    ? '2px solid #fbbf24'
                    : isFlashing
                    ? '2px solid #a78bfa'
                    : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: isFirst ? '0 4px 24px rgba(245,158,11,0.4)' : 'none',
                  transition: 'background 0.5s, border 0.5s, box-shadow 0.5s',
                }}
              >
                {/* Rank badge */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl"
                  style={{
                    background: isFirst ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.12)',
                  }}
                >
                  {RANK_MEDALS[entry.rank - 1] ?? entry.rank}
                </div>

                {/* Name + score */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white truncate leading-tight" style={{ fontSize: 'clamp(1rem, 1.4vw, 1.5rem)' }}>
                    {entry.name}
                  </p>
                  <p className={`text-sm font-semibold ${isFirst ? 'text-yellow-100' : 'text-white/50'}`}>
                    {entry.score} pts · {entry.correctAnswers}✓
                    {entry.totalTime != null && entry.totalTime > 0 && (
                      <span className={`ml-2 ${isFirst ? 'text-yellow-200/70' : 'text-white/30'}`}>
                        · {entry.totalTime.toFixed(1)}s
                      </span>
                    )}
                  </p>
                </div>

                {/* Delta indicator */}
                <div className="flex-shrink-0 flex flex-col items-center w-10">
                  {moved > 0 ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 text-xs font-black">+{moved}</span>
                    </>
                  ) : moved < 0 ? (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-400" />
                      <span className="text-red-400 text-xs font-black">{moved}</span>
                    </>
                  ) : (
                    <Minus className="h-4 w-4 text-white/20" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function LiveEventProjector() {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [participants, setParticipants] = useState<GuestParticipant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [victoryPlayed, setVictoryPlayed] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [eventWasLoaded, setEventWasLoaded] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [revealQuestion, setRevealQuestion] = useState<any>(null);

  const prevPhaseRef = useRef<string>('');
  const prevQuestionIndexRef = useRef<number>(-1);
  const answerCountUnsubRef = useRef<(() => void) | null>(null);
  // Tracks which question index we already fired auto-advance for,
  // so the 100ms timer loop never calls it more than once per question
  const autoAdvancedForRef = useRef<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load event + competition
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
          if (compData?.questions) {
            compData.questions = compData.questions.map((q: any) => {
              if (!Array.isArray(q.options) && q.options && typeof q.options === 'object') {
                const optArr = ['A','B','C','D'].map((k:string) => q.options[k]).filter(Boolean);
                const correctText = ['A','B','C','D'].includes(q.correctAnswer)
                  ? (q.options[q.correctAnswer] || q.correctAnswer) : q.correctAnswer;
                return { ...q, options: optArr, correctAnswer: correctText };
              }
              return q;
            });
          }
          setCompetition(compData);
        } else {
          clearTimeout(timeout);
          setEvent(null);
          setCompetition(null);
        }
      } catch (e) {
        clearTimeout(timeout);
      } finally {
        setDataChecked(true);
      }
    };
    loadData();
    return () => clearTimeout(timeout);
  }, [eventId]);

  // Real-time listeners
  useEffect(() => {
    if (!eventId) return;
    const unsubEvent = listenToEvent(eventId, (updated) => {
      if (updated) {
        if (prevPhaseRef.current === 'question' && updated.phase === 'leaderboard') {
          setRevealAnswer(true);
          setTimeout(() => setRevealAnswer(false), 4500);
        }
        prevPhaseRef.current = updated.phase;
        prevQuestionIndexRef.current = updated.currentQuestionIndex;
        setEvent(updated);
        setEventWasLoaded(true);
        if (updated.phase === 'results' && !victoryPlayed) {
          stopBackgroundMusic();
          setTimeout(() => stopBackgroundMusic(), 100);
          setTimeout(() => playVictorySound(), 500);
          setShowConfetti(true);
          setVictoryPlayed(true);
          setTimeout(() => setShowConfetti(false), 12000);
          setTimeout(() => window.close(), 60000);
          setCloseCountdown(60);
        }
      } else {
        // Event was deleted from Firebase. If the last known phase was 'results',
        // keep showing the results screen — don't flash "Event Ended" mid-celebration.
        if (prevPhaseRef.current === 'results') return;
        setEvent(null);
      }
    });
    const unsubParticipants = listenToParticipants(eventId, setParticipants);
    const unsubLeaderboard = listenToLeaderboard(eventId, setLeaderboard);
    return () => { unsubEvent(); unsubParticipants(); unsubLeaderboard(); };
  }, [eventId, victoryPlayed]);

  // Answer count listener
  useEffect(() => {
    if (!eventId || !event || event.phase !== 'question') { setAnsweredCount(0); return; }
    if (answerCountUnsubRef.current) answerCountUnsubRef.current();
    const unsub = listenToAnswerCount(eventId, event.currentQuestionIndex, setAnsweredCount);
    answerCountUnsubRef.current = unsub;
    return () => unsub();
  }, [eventId, event?.phase, event?.currentQuestionIndex]);

  // Keep revealQuestion synced
  useEffect(() => {
    if (revealAnswer && competition && event) {
      setRevealQuestion(competition.questions?.[event.currentQuestionIndex] ?? null);
    }
  }, [revealAnswer]);

  // Countdown
  useEffect(() => {
    if (event?.phase !== 'countdown') return;
    setCountdown(3);
    const iv = setInterval(() => setCountdown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
    return () => clearInterval(iv);
  }, [event?.phase]);

  // Timer
  useEffect(() => {
    if (!event || event.phase !== 'question' || !event.timerStartedAt) return;
    const update = () => {
      const elapsed = Date.now() - event.timerStartedAt! - event.pausedDuration;
      const remaining = Math.max(0, event.timerDuration - elapsed / 1000);
      setRemainingTime(Math.ceil(remaining));
      if (remaining <= 0 && event.settings.autoAdvanceOnTimer && event.status === 'active') handleAutoAdvance();
    };
    update();
    const iv = setInterval(update, 100);
    return () => clearInterval(iv);
  }, [event?.phase, event?.timerStartedAt, event?.timerDuration, event?.pausedDuration, event?.status]);

  // Tick down the closing countdown
  useEffect(() => {
    if (closeCountdown <= 0) return;
    const iv = setInterval(() => setCloseCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iv);
  }, [closeCountdown > 0]);

  // Audio playback: play question song when question starts, stop on phase change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (event?.phase !== 'question' || !competition) return;
    const q = competition.questions?.[event.currentQuestionIndex];
    if (!q?.audioUrl) return;

    const audio = new Audio(q.audioUrl);
    audio.volume = 0.7;
    audioRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [event?.phase, event?.currentQuestionIndex, competition]);

  const handleAutoAdvance = async () => {
    if (!event || !competition || !eventId) return;
    // Prevent the 100ms timer loop from firing this hundreds of times
    if (autoAdvancedForRef.current === event.currentQuestionIndex) return;
    autoAdvancedForRef.current = event.currentQuestionIndex;

    const { attemptAutoAdvance } = await import('@/services/liveEventService');
    await attemptAutoAdvance(
      eventId,
      event.currentQuestionIndex,
      competition.questions || [],
      event.settings.enableFastestFingerBonus
    );
  };

  // ── Error / loading screens ──
  // Guard with dataChecked — both start as null before the first fetch completes,
  // so without this guard the projector flashes "Event Ended" on every open.
  if (dataChecked && event === null && competition === null)
    return <FullScreenMsg icon="🏆" title="Event Ended" sub="This event has been completed." />;
  if (!event || !competition) {
    if (eventWasLoaded && !event) return <FullScreenMsg icon="🏆" title="Event Ended" sub="The host has ended the event." showHome />;
    if (loadingTimeout) return <FullScreenMsg icon="❌" title="Connection Error" sub="Unable to load event." showReload />;
    return <FullScreenMsg icon="⏳" title="Loading event…" sub="" />;
  }

  const currentQuestion = competition.questions?.[event.currentQuestionIndex];
  const activeParticipants = participants.filter(p => p.isActive);
  const timerPct = event.timerDuration > 0 ? remainingTime / event.timerDuration : 0;
  const timerCritical = remainingTime <= 10 && remainingTime > 0;
  const joinURL = `${window.location.origin}/live-event/join?pin=${event.pin}`;

  return (
    <div className="min-h-screen text-white overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 40%, #be185d 100%)' }}>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #f472b6, transparent)', animationDelay: '1.5s' }} />
      </div>

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <style>{`
            @keyframes cffall {
              0%{transform:translateY(-80px) rotate(0deg);opacity:1}
              100%{transform:translateY(110vh) rotate(720deg);opacity:0.1}
            }
            @keyframes zoom-in{from{transform:scale(2);opacity:0}to{transform:scale(1);opacity:1}}
          `}</style>
          {[...Array(200)].map((_, i) => (
            <div key={i} className="absolute text-4xl"
              style={{
                left: `${Math.random() * 100}%`, top: '-60px',
                animation: `cffall ${2 + Math.random() * 3}s linear ${Math.random() * 1.5}s forwards`,
              }}>
              {['🎉','🎊','⭐','✨','🏆','🎈','🌟','💫','🥇','👏','🎆','🎇'][Math.floor(Math.random() * 12)]}
            </div>
          ))}
        </div>
      )}

      {/* ── LOBBY ── */}
      {event.phase === 'lobby' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
          <div className="text-center">
            <h1 className="font-black leading-tight mb-2" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
              {competition.title}
            </h1>
            <p className="text-purple-200 font-medium" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)' }}>
              Join now to compete!
            </p>
          </div>
          <div className="flex items-center gap-12 flex-wrap justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-5 rounded-3xl shadow-2xl">
                <QRCodeSVG value={joinURL} size={200} level="H" includeMargin />
              </div>
              <p className="text-white/60 text-lg">Scan to join</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/60 font-semibold tracking-widest text-xl uppercase">PIN CODE</p>
              <div className="flex gap-3">
                {event.pin.split('').map((digit, i) => (
                  <div key={i}
                    className="w-20 h-24 rounded-2xl flex items-center justify-center font-black shadow-xl"
                    style={{ fontSize: '3.5rem', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
                    {digit}
                  </div>
                ))}
              </div>
              <p className="text-white/50 text-base mt-1">{window.location.origin}/live-event/join</p>
            </div>
          </div>
          <div className="w-full max-w-5xl">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <Users className="h-8 w-8 text-purple-300" />
              <p className="font-bold text-3xl">
                {activeParticipants.length}
                <span className="text-white/50 font-normal text-2xl"> / {event.maxParticipants} joined</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center max-h-48 overflow-hidden">
              {activeParticipants.slice(0, 30).map((p, i) => (
                <div key={p.sessionId} className="px-5 py-2 rounded-full font-semibold text-lg"
                  style={{ background: `hsl(${(i * 47) % 360}, 70%, 45%)` }}>
                  {p.name}
                </div>
              ))}
              {activeParticipants.length > 30 && (
                <div className="px-5 py-2 rounded-full bg-white/20 font-semibold text-lg">
                  +{activeParticipants.length - 30} more
                </div>
              )}
            </div>
          </div>
          <p className="text-white/40 text-xl animate-pulse">Waiting for host to start…</p>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {event.phase === 'countdown' && (
        <div className="flex items-center justify-center min-h-screen">
          <style>{`@keyframes zoom-in{from{transform:scale(2);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
          <div className="text-center">
            {countdown > 0 ? (
              <div key={countdown}
                style={{ fontSize: 'clamp(8rem,30vw,18rem)', lineHeight: 1, fontWeight: 900,
                  textShadow: '0 0 80px rgba(167,139,250,0.8)', animation: 'zoom-in 0.8s ease-out' }}>
                {countdown}
              </div>
            ) : (
              <div style={{ fontSize: 'clamp(5rem,20vw,14rem)', lineHeight: 1, fontWeight: 900,
                color: '#4ade80', textShadow: '0 0 80px rgba(74,222,128,0.8)', animation: 'zoom-in 0.4s ease-out' }}>
                GO!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUESTION PHASE ── */}
      {(event.phase === 'question' || (event.phase === 'leaderboard' && revealAnswer)) && currentQuestion && (
        <div className="flex min-h-screen p-5 gap-5">

          {/* Answer reveal overlay */}
          {revealAnswer && revealQuestion && (
            <div className="absolute inset-0 z-30 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
              <div className="text-center max-w-4xl w-full px-8">
                <p className="text-white/60 text-2xl mb-3 uppercase tracking-widest font-semibold">Correct Answer</p>
                <div className="bg-green-500 rounded-3xl p-8 shadow-2xl mb-6">
                  <p style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 800 }}>
                    {revealQuestion.correctAnswer}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(revealQuestion.options ?? []).map((opt: string, idx: number) => {
                    const isCorrect = opt === revealQuestion.correctAnswer;
                    return (
                      <div key={idx}
                        className="rounded-2xl p-4 flex items-center gap-4 font-bold"
                        style={{
                          background: isCorrect ? '#16a34a' : 'rgba(255,255,255,0.08)',
                          opacity: isCorrect ? 1 : 0.4,
                          border: isCorrect ? '3px solid #4ade80' : '3px solid transparent',
                          fontSize: 'clamp(1.1rem,2vw,1.6rem)',
                        }}>
                        <span className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-black"
                          style={{ background: OPTION_COLORS[idx]?.bg || '#6b7280' }}>
                          {OPTION_COLORS[idx]?.label}
                        </span>
                        {opt}
                        {isCorrect && <span className="ml-auto">✅</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* LEFT: Question + options + timer bar */}
          <div className="flex flex-col flex-1 gap-4 min-w-0">

            {/* Timer + answered row */}
            <div className="flex items-center gap-5 bg-black/25 rounded-2xl px-5 py-3">
              {/* Circular timer */}
              <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                  <circle cx="36" cy="36" r="30" fill="none"
                    stroke={timerCritical ? '#ef4444' : '#a78bfa'}
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - timerPct)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s' }}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center font-black text-2xl ${timerCritical ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {remainingTime}
                </span>
              </div>

              {/* Answered progress + question segments */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-white/50 flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Answered
                  </span>
                  <span className="text-white font-bold">{answeredCount} / {activeParticipants.length}</span>
                </div>
                {/* Answer fill bar */}
                <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: activeParticipants.length > 0
                        ? `${(answeredCount / activeParticipants.length) * 100}%` : '0%',
                      background: 'linear-gradient(90deg, #818cf8, #f472b6)',
                    }} />
                </div>
                {/* Question progress segments */}
                <div className="flex items-center gap-1">
                  {competition.questions.map((_: unknown, i: number) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-all duration-300"
                      style={{
                        height: 5,
                        background:
                          i < event.currentQuestionIndex
                            ? '#a78bfa'
                            : i === event.currentQuestionIndex
                            ? timerCritical ? '#ef4444' : '#e879f9'
                            : 'rgba(255,255,255,0.15)',
                        boxShadow: i === event.currentQuestionIndex
                          ? timerCritical ? '0 0 8px #ef4444' : '0 0 8px #e879f9'
                          : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Q counter */}
              <div className="flex-shrink-0 text-right">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Question</p>
                <p className="font-black text-2xl leading-none">
                  {event.currentQuestionIndex + 1}
                  <span className="text-white/30 text-lg">/{competition.questions.length}</span>
                </p>
              </div>
            </div>

            {/* Question text */}
            {currentQuestion.audioUrl && (
              <div className="flex items-center justify-center gap-3 text-purple-300 font-bold animate-pulse"
                style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)' }}>
                <span>🎵</span><span>Listen to the song!</span><span>🎵</span>
              </div>
            )}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl px-8 py-6 border border-white/15">
              <p className="font-black text-center leading-snug"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                {currentQuestion.question}
              </p>
            </div>

            {/* Color-coded options */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              {(currentQuestion.options ?? []).map((option: string, idx: number) => {
                const col = OPTION_COLORS[idx] ?? { bg: '#6b7280', border: '#4b5563', label: String.fromCharCode(65 + idx) };
                return (
                  <div key={idx}
                    className="flex items-center gap-4 rounded-3xl px-6 py-5 font-bold"
                    style={{
                      background: col.bg,
                      border: `3px solid ${col.border}`,
                      boxShadow: `0 8px 28px ${col.bg}55`,
                      fontSize: 'clamp(1.1rem, 2vw, 1.7rem)',
                      minHeight: 90,
                    }}>
                    <span className="w-12 h-12 flex-shrink-0 rounded-2xl bg-black/20 flex items-center justify-center font-black text-2xl">
                      {col.label}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Animated Live Leaderboard panel */}
          <div
            className="flex-shrink-0 rounded-3xl p-5 flex flex-col"
            style={{
              width: 'clamp(280px, 22vw, 400px)',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.12)',
            }}
          >
            <AnimatedLeaderboard
              leaderboard={leaderboard}
              questionIndex={event.currentQuestionIndex}
              totalQuestions={competition.questions.length}
            />
          </div>
        </div>
      )}

      {/* ── LEADERBOARD PHASE ── */}
      {event.phase === 'leaderboard' && !revealAnswer && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <p className="font-black text-3xl uppercase tracking-widest text-white/80">Top Players</p>
          </div>
          <div className="w-full max-w-2xl">
            <AnimatedLeaderboard
              leaderboard={leaderboard}
              questionIndex={event.currentQuestionIndex}
              totalQuestions={competition.questions.length}
            />
            {leaderboard.length > TOP_N && (
              <div className="mt-4 space-y-2">
                {leaderboard.slice(TOP_N, 10).map(entry => (
                  <div key={entry.sessionId}
                    className="flex items-center gap-4 px-5 py-3 rounded-xl bg-white/8 font-semibold text-lg">
                    <span className="text-white/40 w-8 text-center">{entry.rank}</span>
                    <span className="flex-1 truncate">{entry.name}</span>
                    <span className="text-purple-300 font-bold">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-white/40 text-xl animate-pulse">Next question coming up…</p>
        </div>
      )}

      {/* ── RESULTS ── */}
      {event.phase === 'results' && (
        <div className="flex flex-col min-h-screen p-8 gap-6 justify-center">
          <div className="text-center">
            <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-3 animate-bounce" />
            <h2 className="font-black" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
              🎉 Competition Complete! 🎉
            </h2>
            {closeCountdown > 0 && (() => {
              const r = 42, circ = 2 * Math.PI * r;
              const offset = circ * (1 - closeCountdown / 60);
              return (
                <div className="flex flex-col items-center mt-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s linear' }} />
                    </svg>
                    <span className="text-3xl font-black text-white tabular-nums drop-shadow-lg">{closeCountdown}</span>
                  </div>
                  <p className="text-white/50 text-sm mt-1 tracking-widest uppercase">closing</p>
                </div>
              );
            })()}
          </div>

          {/* Podium */}
          {leaderboard.length >= 1 && (
            <div className="flex items-end justify-center gap-4 mb-2">
              {leaderboard[1] && (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-5xl">🥈</div>
                  <div className="font-bold text-2xl text-center max-w-[180px] truncate">{leaderboard[1].name}</div>
                  <div className="text-lg text-white/70 font-bold">{leaderboard[1].score} pts</div>
                  {leaderboard[1].totalTime != null && leaderboard[1].totalTime > 0 && (
                    <div className="text-sm font-bold text-white/40">{leaderboard[1].totalTime.toFixed(1)}s</div>
                  )}
                  <div className="w-36 rounded-t-2xl flex items-center justify-center font-black text-4xl"
                    style={{ height: 110, background: 'linear-gradient(180deg,#94a3b8,#64748b)' }}>2</div>
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                <Star className="h-10 w-10 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="text-6xl">🥇</div>
                <div className="font-black text-4xl text-center max-w-[220px] truncate text-yellow-300">{leaderboard[0].name}</div>
                <div className="text-2xl text-yellow-200 font-black">{leaderboard[0].score} pts</div>
                {leaderboard[0].totalTime != null && leaderboard[0].totalTime > 0 && (
                  <div className="text-base font-bold text-yellow-200/50">{leaderboard[0].totalTime.toFixed(1)}s</div>
                )}
                <div className="w-44 rounded-t-2xl flex items-center justify-center font-black text-5xl"
                  style={{ height: 150, background: 'linear-gradient(180deg,#f59e0b,#d97706)' }}>1</div>
              </div>
              {leaderboard[2] && (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-5xl">🥉</div>
                  <div className="font-bold text-2xl text-center max-w-[180px] truncate">{leaderboard[2].name}</div>
                  <div className="text-lg text-white/70 font-bold">{leaderboard[2].score} pts</div>
                  {leaderboard[2].totalTime != null && leaderboard[2].totalTime > 0 && (
                    <div className="text-sm font-bold text-white/40">{leaderboard[2].totalTime.toFixed(1)}s</div>
                  )}
                  <div className="w-36 rounded-t-2xl flex items-center justify-center font-black text-4xl"
                    style={{ height: 80, background: 'linear-gradient(180deg,#cd7f32,#92400e)' }}>3</div>
                </div>
              )}
            </div>
          )}

          {leaderboard.length > 3 && (
            <div className="max-w-4xl mx-auto w-full">
              <p className="text-center text-white/40 font-semibold uppercase tracking-widest text-base mb-3">Full Standings</p>
              <div className="grid grid-cols-2 gap-3">
                {leaderboard.slice(3).map(entry => (
                  <div key={entry.sessionId}
                    className="flex items-center gap-4 px-5 py-3 rounded-xl bg-white/10 font-semibold text-xl">
                    <span className="text-white/40 w-8 text-center font-bold">{entry.rank}</span>
                    <span className="flex-1 truncate">{entry.name}</span>
                    <span className="text-purple-300 font-bold">{entry.score}</span>
                    {entry.totalTime != null && entry.totalTime > 0 && (
                      <span className="text-white/30 text-base font-bold ml-2">{entry.totalTime.toFixed(1)}s</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FullScreenMsg({ icon, title, sub, showHome = false, showReload = false }:
  { icon: string; title: string; sub: string; showHome?: boolean; showReload?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)' }}>
      <div className="text-center text-white">
        <div className="text-8xl mb-6">{icon}</div>
        <h2 className="text-5xl font-bold mb-4">{title}</h2>
        {sub && <p className="text-2xl text-white/60 mb-8">{sub}</p>}
        {showHome && (
          <button onClick={() => window.location.href = '/'}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-xl font-bold">
            Go Home
          </button>
        )}
        {showReload && (
          <button onClick={() => window.location.reload()}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-xl font-bold">
            Reload
          </button>
        )}
      </div>
    </div>
  );
}
