// Live Modes Hub — Kahoot-style dark redesign
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, ArrowRight, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/components/ui/firebase';

export default function LiveModesHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [livePin, setLivePin] = useState('');
  const [practicePin, setPracticePin] = useState('');
  const [tab, setTab] = useState<'live' | 'practice'>('live');

  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.uid) {
        const adminStatus = await isAdmin(user.uid);
        setUserIsAdmin(adminStatus);
      } else {
        setUserIsAdmin(false);
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

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

  const handleJoinLive = (e: React.FormEvent) => {
    e.preventDefault();
    if (livePin.length === 6) navigate(`/live-event/join?pin=${livePin}`);
  };

  const handleJoinPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (practicePin.length === 6) navigate(`/practice/join?pin=${practicePin}`);
  };

  return (
    <div className="w-full min-h-screen" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
      <style>{`
        .pin-input-hub::placeholder { color: rgba(255,255,255,0.2); letter-spacing: 0.5em; }
      `}</style>

      {/* Header */}
      <div className="text-center pt-12 pb-8 px-4">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-5 text-sm font-bold"
          style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd' }}>
          <Zap className="h-4 w-4 text-yellow-400" /> Live Modes Hub
        </div>
        <h1 className="font-black text-white mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
          Choose your mode
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Jump into a live game or host your own. All you need is a PIN.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">

        {/* ── PIN ENTRY CARD ── */}
        <div className="rounded-3xl p-6 md:p-8"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
          <h2 className="font-black text-white text-2xl mb-5 text-center">Join a session</h2>

          {/* Tab toggle */}
          <div className="flex rounded-2xl p-1 mb-5 max-w-sm mx-auto" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <button onClick={() => setTab('live')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: tab === 'live' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'transparent', color: tab === 'live' ? 'white' : 'rgba(255,255,255,0.4)' }}>
              <Zap className="h-4 w-4" /> Live Event
            </button>
            <button onClick={() => setTab('practice')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: tab === 'practice' ? 'linear-gradient(135deg,#059669,#065f46)' : 'transparent', color: tab === 'practice' ? 'white' : 'rgba(255,255,255,0.4)' }}>
              <Target className="h-4 w-4" /> Practice
            </button>
          </div>

          <div className="max-w-sm mx-auto">
            {tab === 'live' ? (
              <form onSubmit={handleJoinLive} className="space-y-3">
                <input
                  type="tel" inputMode="numeric"
                  value={livePin}
                  onChange={e => setLivePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter PIN"
                  className="pin-input-hub w-full text-center font-black py-5 rounded-2xl outline-none transition-all"
                  style={{
                    fontSize: '2.5rem', letterSpacing: '0.3em',
                    background: 'rgba(255,255,255,0.07)',
                    border: livePin.length === 6 ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.12)',
                    color: 'white',
                  }}
                />
                <button type="submit" disabled={livePin.length !== 6}
                  className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: livePin.length === 6 ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.06)',
                    color: livePin.length === 6 ? 'white' : 'rgba(255,255,255,0.25)',
                    cursor: livePin.length === 6 ? 'pointer' : 'not-allowed',
                  }}>
                  <Zap className="h-5 w-5" /> Join Live Event <ChevronRight className="h-5 w-5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinPractice} className="space-y-3">
                <input
                  type="tel" inputMode="numeric"
                  value={practicePin}
                  onChange={e => setPracticePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter PIN"
                  className="pin-input-hub w-full text-center font-black py-5 rounded-2xl outline-none transition-all"
                  style={{
                    fontSize: '2.5rem', letterSpacing: '0.3em',
                    background: 'rgba(255,255,255,0.07)',
                    border: practicePin.length === 6 ? '2px solid #34d399' : '2px solid rgba(255,255,255,0.12)',
                    color: 'white',
                  }}
                />
                <button type="submit" disabled={practicePin.length !== 6}
                  className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: practicePin.length === 6 ? 'linear-gradient(135deg,#059669,#065f46)' : 'rgba(255,255,255,0.06)',
                    color: practicePin.length === 6 ? 'white' : 'rgba(255,255,255,0.25)',
                    cursor: practicePin.length === 6 ? 'pointer' : 'not-allowed',
                  }}>
                  <Target className="h-5 w-5" /> Join Practice <ChevronRight className="h-5 w-5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── PARTICIPANT CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              'Perfect for events & gatherings',
            ]}
            featureColor="#fde68a"
            cta="Join a Live Event"
            ctaGradient="linear-gradient(135deg,#d97706,#b45309)"
            onClick={() => navigate('/live-event/join')}
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
              'Great for exam prep',
            ]}
            featureColor="#6ee7b7"
            cta="Join a Practice Session"
            ctaGradient="linear-gradient(135deg,#059669,#065f46)"
            onClick={() => navigate('/practice/join')}
          />
        </div>

        {/* ── ADMIN / HOST SECTION ── */}
        {userIsAdmin && (
          <>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-white/30 font-bold text-sm uppercase tracking-widest">Host Controls</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <HostCard
                emoji="🎙️"
                title="Host Live Event"
                desc="Launch a real-time quiz from your templates. Control the flow, see live answers."
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
                desc="Set up a self-paced session for students. Share a PIN and monitor progress."
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

function ModeCard({ emoji, title, badge, badgeColor, gradient, border, features, featureColor, cta, ctaGradient, onClick }: {
  emoji: string; title: string; badge: string; badgeColor: string;
  gradient: string; border: string; features: string[]; featureColor: string;
  cta: string; ctaGradient: string; onClick: () => void;
}) {
  return (
    <div className="rounded-3xl p-6 flex flex-col" style={{ background: gradient, border: `2px solid ${border}` }}>
      <div className="text-5xl mb-3">{emoji}</div>
      <div className="inline-flex items-center self-start gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
        style={{ background: 'rgba(0,0,0,0.25)', color: badgeColor }}>
        {badge}
      </div>
      <h3 className="font-black text-white text-2xl mb-4">{title}</h3>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm font-medium" style={{ color: featureColor }}>
            <span className="mt-0.5 flex-shrink-0">✓</span> {f}
          </li>
        ))}
      </ul>
      <button onClick={onClick}
        className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95 flex items-center justify-center gap-2"
        style={{ background: ctaGradient }}>
        {cta} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function HostCard({ emoji, title, desc, gradient, border, cta, ctaColor, onClick, secondaryCta, secondaryOnClick }: {
  emoji: string; title: string; desc: string; gradient: string; border: string;
  cta: string; ctaColor: string; onClick: () => void;
  secondaryCta: string; secondaryOnClick: () => void;
}) {
  return (
    <div className="rounded-3xl p-6 flex flex-col" style={{ background: gradient, border: `2px solid ${border}` }}>
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-black text-white text-xl mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed mb-5 flex-1">{desc}</p>
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
