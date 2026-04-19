// Live Modes Hub — Kahoot-style dark redesign
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, ArrowRight, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/components/ui/firebase';

export default function LiveModesHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'live' | 'practice'>('live');
  const [activeEvent, setActiveEvent] = useState<any>(null);

  // Same live-event detection as Home
  const [liveEvent, setLiveEvent] = useState<any>(null);
  const [liveCheckDone, setLiveCheckDone] = useState(false);
  const [liveName, setLiveName] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [practicePin, setPracticePin] = useState('');

  useEffect(() => {
    const init = async () => {
      // Check live event for everyone
      try {
        const { getActiveEvent } = await import('@/services/liveEventService');
        const active = await getActiveEvent();
        setLiveEvent(active);
        if (active && user?.uid) setActiveEvent(active);
      } catch {
        setLiveEvent(null);
      } finally {
        setLiveCheckDone(true);
      }

      // Check admin status
      if (user?.uid) {
        const adminStatus = await isAdmin(user.uid);
        setUserIsAdmin(adminStatus);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const handleJoinLiveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveEvent || liveName.trim().length < 2) return;
    const storedSession = sessionStorage.getItem(`liveEvent_${liveEvent.id}_session`);
    if (storedSession) {
      navigate(`/live-event/participate/${liveEvent.id}/${storedSession}`);
      return;
    }
    try {
      setLiveLoading(true);
      setLiveError('');
      const { joinEvent } = await import('@/services/liveEventService');
      const sessionId = await joinEvent(liveEvent.id, liveName.trim());
      sessionStorage.setItem(`liveEvent_${liveEvent.id}_session`, sessionId);
      sessionStorage.setItem(`liveEvent_${liveEvent.id}_name`, liveName.trim());
      navigate(`/live-event/participate/${liveEvent.id}/${sessionId}`);
    } catch (err: any) {
      setLiveError(err.message || 'Failed to join. Please try again.');
    } finally {
      setLiveLoading(false);
    }
  };

  const handleJoinPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (practicePin.length === 6) navigate(`/practice/join?pin=${practicePin}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0f0a1e, #1e0a3c)' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
      <style>{`
        .pin-input-hub::placeholder { color: rgba(255,255,255,0.25); letter-spacing: 0.5em; }
        @keyframes pulse-glow-hub {
          0%, 100% { box-shadow: 0 0 20px rgba(167,139,250,0.4); }
          50% { box-shadow: 0 0 40px rgba(167,139,250,0.8), 0 0 80px rgba(167,139,250,0.3); }
        }
      `}</style>

      {/* Header */}
      <div className="text-center pt-8 pb-5 px-4"
        style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-4 text-sm font-bold"
          style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd' }}>
          <Zap className="h-4 w-4 text-yellow-400" /> Live Modes Hub
        </div>
        <h1 className="font-black text-white mb-2" style={{ fontSize: 'clamp(1.6rem, 5vw, 3rem)' }}>
          Choose your mode
        </h1>
        <p className="text-white/50 text-sm max-w-xl mx-auto">
          Jump into a live game or host your own. All you need is a PIN.
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 pb-16 space-y-5">

        {/* ── PIN ENTRY — matches Home screen ── */}
        <div className="rounded-3xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}>

          {/* Tab toggle */}
          <div className="flex rounded-2xl p-1 mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <button onClick={() => setTab('live')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: tab === 'live' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'transparent',
                color: tab === 'live' ? 'white' : 'rgba(255,255,255,0.4)',
              }}>
              <Zap className="h-4 w-4" /> Live Event
            </button>
            <button onClick={() => setTab('practice')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: tab === 'practice' ? 'linear-gradient(135deg,#059669,#065f46)' : 'transparent',
                color: tab === 'practice' ? 'white' : 'rgba(255,255,255,0.4)',
              }}>
              <Target className="h-4 w-4" /> Practice
            </button>
          </div>

          {/* ── LIVE TAB ── */}
          {tab === 'live' && (
            !liveCheckDone ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-7 h-7 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                <p className="text-white/40 text-sm">Checking for live events...</p>
              </div>
            ) : liveEvent && liveEvent.phase === 'lobby' ? (
              <form onSubmit={handleJoinLiveEvent} className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <p className="text-green-300 text-xs font-semibold">Live event in progress</p>
                </div>
                <input type="tel" value={liveEvent.pin} readOnly
                  className="pin-input-hub w-full text-center font-black text-5xl py-6 px-4 rounded-2xl outline-none"
                  style={{ background: 'rgba(167,139,250,0.08)', border: '2px solid rgba(167,139,250,0.25)', color: 'rgba(196,181,253,0.6)', letterSpacing: '0.3em', cursor: 'not-allowed' }}
                />
                <input
                  type="text"
                  value={liveName}
                  onChange={e => { setLiveName(e.target.value); setLiveError(''); }}
                  placeholder="Enter your name"
                  minLength={2} maxLength={50} autoFocus
                  className="w-full text-center font-bold text-xl py-5 px-4 rounded-2xl outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: liveName.trim().length >= 2 ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.15)',
                    color: 'white',
                  }}
                />
                {liveError && <p className="text-red-400 text-xs text-center">{liveError}</p>}
                <button type="submit" disabled={liveName.trim().length < 2 || liveLoading}
                  className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95"
                  style={{
                    background: liveName.trim().length >= 2 ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.08)',
                    color: liveName.trim().length >= 2 ? 'white' : 'rgba(255,255,255,0.3)',
                    cursor: liveName.trim().length >= 2 ? 'pointer' : 'not-allowed',
                    ...(liveName.trim().length >= 2 && !liveLoading ? { animation: 'pulse-glow-hub 2s ease-in-out infinite' } : {}),
                  }}>
                  {liveLoading
                    ? <><span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />Joining...</>
                    : <>Join Event <ChevronRight className="inline h-6 w-6" /></>}
                </button>
              </form>
            ) : liveEvent ? (
              <div className="space-y-3">
                <div className="rounded-xl px-4 py-3 text-center"
                  style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)' }}>
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block mr-2 align-middle" />
                  <p className="text-yellow-300 text-sm font-semibold inline">Event in progress — late join available</p>
                </div>
                <input type="tel" value={liveEvent.pin} readOnly
                  className="pin-input-hub w-full text-center font-black text-5xl py-6 px-4 rounded-2xl outline-none"
                  style={{ background: 'rgba(167,139,250,0.08)', border: '2px solid rgba(167,139,250,0.25)', color: 'rgba(196,181,253,0.6)', letterSpacing: '0.3em', cursor: 'not-allowed' }}
                />
                <button type="button" onClick={() => navigate('/live-event/join')}
                  className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white' }}>
                  Join Late <ChevronRight className="inline h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl px-4 py-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/40 text-sm font-medium">No live event is currently running</p>
                </div>
                <input type="tel" readOnly placeholder="— — — — — —"
                  className="pin-input-hub w-full text-center font-black text-5xl py-6 px-4 rounded-2xl outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em', cursor: 'not-allowed' }}
                />
                <button disabled className="w-full py-4 rounded-2xl font-bold text-base"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }}>
                  No Event Active
                </button>
                <p className="text-center text-white/30 text-xs">
                  Use <button type="button" onClick={() => setTab('practice')} className="text-emerald-400 underline underline-offset-2">Practice Mode</button> if you have a practice PIN
                </p>
              </div>
            )
          )}

          {/* ── PRACTICE TAB ── */}
          {tab === 'practice' && (
            <form onSubmit={handleJoinPractice} className="space-y-3">
              <input
                type="tel" inputMode="numeric"
                value={practicePin}
                onChange={e => setPracticePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="● ● ● ● ● ●"
                className="pin-input-hub w-full text-center font-black text-5xl py-6 px-4 rounded-2xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: practicePin.length === 6 ? '2px solid #34d399' : '2px solid rgba(255,255,255,0.12)',
                  color: 'white', letterSpacing: '0.3em',
                }}
              />
              <button type="submit" disabled={practicePin.length !== 6}
                className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: practicePin.length === 6 ? 'linear-gradient(135deg,#059669,#065f46)' : 'rgba(255,255,255,0.06)',
                  color: practicePin.length === 6 ? 'white' : 'rgba(255,255,255,0.25)',
                  cursor: practicePin.length === 6 ? 'pointer' : 'not-allowed',
                }}>
                <Target className="h-5 w-5" /> Join Practice <ChevronRight className="h-5 w-5" />
              </button>
              <p className="text-center text-white/30 text-xs">Get the PIN from your teacher or event host</p>
            </form>
          )}
        </div>

        {/* ── MODE INFO CARDS ── */}
        <div className="grid grid-cols-1 gap-4">
          <ModeCard
            emoji="⚡"
            title="Live Event"
            badge="Real-time Competition"
            badgeColor="#f59e0b"
            gradient="linear-gradient(135deg,#78350f 0%,#92400e 100%)"
            border="rgba(245,158,11,0.35)"
            features={[
              'All players answer at the same time',
              'Fastest correct answer scores highest',
              'Live leaderboard on big screen',
            ]}
            featureColor="#fde68a"
          />
          <ModeCard
            emoji="🎯"
            title="Practice Mode"
            badge="Self-paced Learning"
            badgeColor="#34d399"
            gradient="linear-gradient(135deg,#064e3b 0%,#065f46 100%)"
            border="rgba(52,211,153,0.35)"
            features={[
              'Unlimited attempts to improve',
              'No time pressure — learn at your pace',
              'Track your score over multiple tries',
            ]}
            featureColor="#6ee7b7"
          />
        </div>

        {/* ── ADMIN HOST SECTION ── */}
        {userIsAdmin && (
          <>
            {activeEvent && (
              <div className="flex items-center gap-4 rounded-2xl px-5 py-4"
                style={{ background: 'rgba(234,179,8,0.15)', border: '1.5px solid rgba(234,179,8,0.4)' }}>
                <div className="relative flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-yellow-300 text-sm">⚡ Live Event In Progress</p>
                  <p className="text-yellow-200/70 text-xs mt-0.5">
                    PIN <span className="font-black tracking-widest">{activeEvent.pin}</span>
                    {' · '}
                    {activeEvent.status === 'lobby' ? 'Waiting in lobby'
                      : activeEvent.status === 'paused' ? 'Paused'
                      : `Question ${(activeEvent.currentQuestionIndex ?? 0) + 1} · ${activeEvent.phase}`}
                  </p>
                </div>
                <button onClick={() => navigate(`/live-event/${activeEvent.id}/host`)}
                  className="px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0 active:scale-95 transition-transform"
                  style={{ background: '#eab308', color: '#713f12' }}>
                  Resume
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-white/30 font-bold text-xs uppercase tracking-widest">Host Controls</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <HostCard
                emoji="🎙️"
                title="Host Live Event"
                desc="Launch a real-time quiz from your templates."
                gradient="linear-gradient(135deg,#1e1b4b,#2e1065)"
                border="rgba(139,92,246,0.4)"
                cta="Launch from Quiz Templates"
                ctaColor="#a78bfa"
                onClick={() => navigate('/admin/quiz-templates/list')}
                secondaryCta="Open Host Control"
                secondaryOnClick={() => navigate('/admin/live-event-host')}
              />
              <HostCard
                emoji="📚"
                title="Host Practice Session"
                desc="Set up a self-paced session for students."
                gradient="linear-gradient(135deg,#064e3b,#065f46)"
                border="rgba(52,211,153,0.3)"
                cta="Launch from Quiz Templates"
                ctaColor="#34d399"
                onClick={() => navigate('/admin/quiz-templates/list')}
                secondaryCta="Manage Active Sessions"
                secondaryOnClick={() => navigate('/admin/practice/manage')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ModeCard({ emoji, title, badge, badgeColor, gradient, border, features, featureColor }: {
  emoji: string; title: string; badge: string; badgeColor: string;
  gradient: string; border: string; features: string[]; featureColor: string;
}) {
  return (
    <div className="rounded-3xl p-5 flex flex-col" style={{ background: gradient, border: `2px solid ${border}` }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mb-1"
            style={{ background: 'rgba(0,0,0,0.25)', color: badgeColor }}>
            {badge}
          </div>
          <h3 className="font-black text-white text-lg leading-none">{title}</h3>
        </div>
      </div>
      <ul className="space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm font-medium" style={{ color: featureColor }}>
            <span className="flex-shrink-0">✓</span> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HostCard({ emoji, title, desc, gradient, border, cta, ctaColor, onClick, secondaryCta, secondaryOnClick }: {
  emoji: string; title: string; desc: string; gradient: string; border: string;
  cta: string; ctaColor: string; onClick: () => void;
  secondaryCta: string; secondaryOnClick: () => void;
}) {
  return (
    <div className="rounded-3xl p-5 flex flex-col" style={{ background: gradient, border: `2px solid ${border}` }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{emoji}</span>
        <h3 className="font-black text-white text-lg">{title}</h3>
      </div>
      <p className="text-white/50 text-sm leading-relaxed mb-4">{desc}</p>
      <div className="space-y-2">
        <button onClick={onClick}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ background: 'rgba(255,255,255,0.1)', color: ctaColor, border: `1.5px solid ${ctaColor}44` }}>
          {cta} <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={secondaryOnClick}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 text-white/50 hover:text-white/80"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          {secondaryCta}
        </button>
      </div>
    </div>
  );
}
