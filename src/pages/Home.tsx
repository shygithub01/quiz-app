// Home.tsx — Kahoot-style redesign
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getFeaturedCompetition } from '@/components/ui/firebase';
import { Zap, Trophy, Target, Brain, ArrowRight, Star, ChevronRight } from 'lucide-react';

interface FeaturedCompetition {
  id: string;
  title: string;
  prizePool: string;
  startDate: Date;
  participantCount: number;
}

// Floating particle component
function Particle({ x, y, size, color, duration }: { x: number; y: number; size: number; color: string; duration: number }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`, top: `${y}%`,
        width: size, height: size,
        background: color, opacity: 0.6,
        animation: `float-particle ${duration}s ease-in-out infinite`,
      }}
    />
  );
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 4 + Math.random() * 10,
  color: ['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'][Math.floor(Math.random() * 5)],
  duration: 4 + Math.random() * 6,
}));

const STATS = [
  { value: '75+', label: 'Questions per quiz' },
  { value: '100+', label: 'Participants supported' },
  { value: '3', label: 'Modes: Live, Practice, AI' },
  { value: '∞', label: 'Practice attempts' },
];

export default function Home() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [featuredCompetition, setFeaturedCompetition] = useState<FeaturedCompetition | null>(null);
  const [pin, setPin] = useState('');
  const [practicePin, setPracticePin] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | 'practice'>('live');
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadFeaturedCompetition(); }, []);

  const loadFeaturedCompetition = async () => {
    try {
      const competition = await getFeaturedCompetition();
      if (competition) {
        const now = new Date();
        const endDate = new Date(competition.endDate);
        if (endDate < now) {
          setFeaturedCompetition({ id: 'expired', title: 'Competition Coming Soon!', prizePool: '$300', startDate: new Date(), participantCount: 0 });
        } else {
          setFeaturedCompetition({ id: competition.id, title: competition.title, prizePool: competition.prizePool || '$300', startDate: competition.startDate, participantCount: competition.participantCount || 0 });
        }
      } else {
        setFeaturedCompetition({ id: 'none', title: 'Competition Coming Soon!', prizePool: '$300', startDate: new Date(), participantCount: 0 });
      }
    } catch {
      setFeaturedCompetition({ id: 'error', title: 'Competition Coming Soon!', prizePool: '$300', startDate: new Date(), participantCount: 0 });
    }
  };

  const handleJoinLive = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) navigate(`/live-event/join?pin=${pin}`);
  };

  const handleJoinPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (practicePin.length === 6) navigate(`/practice/join?pin=${practicePin}`);
  };

  const isExpired = !featuredCompetition || ['expired', 'none', 'error'].includes(featuredCompetition.id);

  return (
    <div className="w-full overflow-hidden">
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.9; }
        }
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(167,139,250,0.4); }
          50% { box-shadow: 0 0 40px rgba(167,139,250,0.8), 0 0 80px rgba(167,139,250,0.3); }
        }
        .slide-up { animation: slide-up 0.6s ease-out forwards; }
        .slide-up-2 { animation: slide-up 0.6s 0.15s ease-out both; }
        .slide-up-3 { animation: slide-up 0.6s 0.3s ease-out both; }
        .pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        .pin-input::placeholder { color: rgba(255,255,255,0.25); letter-spacing: 0.5em; }
      `}</style>

      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 40%, #0a1628 100%)' }}>

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map(p => <Particle key={p.id} {...p} />)}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
        </div>

        {/* Badge */}
        <div className="slide-up flex items-center gap-2 px-5 py-2 rounded-full mb-6 text-sm font-bold"
          style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', color: '#c4b5fd' }}>
          <Zap className="h-4 w-4 text-yellow-400" />
          AI-Powered · Live · Competitive
        </div>

        {/* Headline */}
        <div className="slide-up-2 text-center mb-4 relative z-10">
          <h1 className="font-black leading-none mb-3" style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}>
            <span style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Quizist
            </span>
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              .AI
            </span>
          </h1>
          <p className="text-white/60 font-medium max-w-xl mx-auto" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}>
            The smartest way to quiz. Create with AI. Compete live. Win scholarships.
          </p>
        </div>

        {/* ── PIN JOIN BOX ── */}
        <div className="slide-up-3 w-full max-w-md relative z-10 mt-6">
          {/* Tab switcher */}
          <div className="flex rounded-2xl p-1 mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('live')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: activeTab === 'live' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                color: activeTab === 'live' ? 'white' : 'rgba(255,255,255,0.5)',
              }}>
              <Zap className="h-4 w-4" /> Join Live Event
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: activeTab === 'practice' ? 'linear-gradient(135deg, #059669, #065f46)' : 'transparent',
                color: activeTab === 'practice' ? 'white' : 'rgba(255,255,255,0.5)',
              }}>
              <Target className="h-4 w-4" /> Join Practice
            </button>
          </div>

          {/* PIN form */}
          {activeTab === 'live' ? (
            <form onSubmit={handleJoinLive} className="space-y-3">
              <input
                ref={pinRef}
                type="tel"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter PIN"
                className="pin-input w-full text-center font-black text-5xl py-6 px-4 rounded-2xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: pin.length === 6 ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  letterSpacing: '0.3em',
                }}
              />
              <button
                type="submit"
                disabled={pin.length !== 6}
                className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95"
                style={{
                  background: pin.length === 6 ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.08)',
                  color: pin.length === 6 ? 'white' : 'rgba(255,255,255,0.3)',
                  cursor: pin.length === 6 ? 'pointer' : 'not-allowed',
                  ...(pin.length === 6 ? { animation: 'pulse-glow 2s ease-in-out infinite' } : {}),
                }}>
                Enter! <ChevronRight className="inline h-6 w-6" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinPractice} className="space-y-3">
              <input
                type="tel"
                inputMode="numeric"
                value={practicePin}
                onChange={e => setPracticePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter PIN"
                className="pin-input w-full text-center font-black text-5xl py-6 px-4 rounded-2xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: practicePin.length === 6 ? '2px solid #34d399' : '2px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  letterSpacing: '0.3em',
                }}
              />
              <button
                type="submit"
                disabled={practicePin.length !== 6}
                className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95"
                style={{
                  background: practicePin.length === 6 ? 'linear-gradient(135deg, #059669, #065f46)' : 'rgba(255,255,255,0.08)',
                  color: practicePin.length === 6 ? 'white' : 'rgba(255,255,255,0.3)',
                  cursor: practicePin.length === 6 ? 'pointer' : 'not-allowed',
                }}>
                Enter! <ChevronRight className="inline h-6 w-6" />
              </button>
            </form>
          )}

          <p className="text-center text-white/30 text-sm mt-3">
            Get the PIN from your teacher or event host
          </p>
        </div>

        {/* Divider */}
        <div className="relative z-10 flex items-center gap-4 w-full max-w-md mt-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-sm font-semibold">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Host / Create CTA */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full max-w-md mt-4">
          <button
            onClick={() => user ? navigate('/admin/quiz-templates/list') : signIn()}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all active:scale-95 border"
            style={{ border: '2px solid rgba(167,139,250,0.4)', color: '#c4b5fd', background: 'rgba(124,58,237,0.1)' }}>
            <Brain className="h-5 w-5" />
            {user ? 'Create a Quiz' : 'Sign in to Create'}
          </button>
          <button
            onClick={() => navigate('/live-modes')}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all active:scale-95 border"
            style={{ border: '2px solid rgba(251,191,36,0.4)', color: '#fde68a', background: 'rgba(245,158,11,0.1)' }}>
            <Trophy className="h-5 w-5" />
            Host an Event
          </button>
        </div>
      </section>

      {/* ── STATS TICKER ── */}
      <section className="py-10 border-y" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto px-6">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-black text-4xl" style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </p>
              <p className="text-white/50 text-sm font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3 MODE CARDS ── */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(180deg, #0f0a1e 0%, #1a0533 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
              Three ways to play
            </h2>
            <p className="text-white/50 text-lg">Pick your mode. Jump in. Have fun.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '⚡',
                title: 'Live Event',
                subtitle: 'Real-time competition',
                desc: 'Host a room. Everyone answers at the same time. Fastest wins.',
                color: '#f59e0b',
                gradient: 'linear-gradient(135deg, #78350f, #92400e)',
                border: 'rgba(245,158,11,0.4)',
                action: () => navigate('/live-event/join'),
                label: 'Join a Live Event',
              },
              {
                icon: '🎯',
                title: 'Practice Mode',
                subtitle: 'Self-paced learning',
                desc: 'Attempt as many times as you want. Learn and improve at your pace.',
                color: '#34d399',
                gradient: 'linear-gradient(135deg, #064e3b, #065f46)',
                border: 'rgba(52,211,153,0.4)',
                action: () => navigate('/practice/join'),
                label: 'Join Practice',
              },
              {
                icon: '🧠',
                title: 'AI Generator',
                subtitle: 'Create instantly',
                desc: 'Upload a doc or type a topic. AI builds 75+ questions in seconds.',
                color: '#a78bfa',
                gradient: 'linear-gradient(135deg, #2e1065, #4c1d95)',
                border: 'rgba(167,139,250,0.4)',
                action: () => user ? navigate('/quiz-generator') : signIn(),
                label: user ? 'Generate Now' : 'Sign in to Create',
              },
            ].map((card, i) => (
              <button
                key={i}
                onClick={card.action}
                className="group text-left rounded-3xl p-6 transition-all duration-200 active:scale-95 hover:scale-[1.02]"
                style={{ background: card.gradient, border: `2px solid ${card.border}`, boxShadow: `0 8px 32px ${card.color}22` }}>
                <div className="text-5xl mb-4">{card.icon}</div>
                <h3 className="font-black text-white text-2xl mb-1">{card.title}</h3>
                <p className="font-semibold mb-3" style={{ color: card.color }}>{card.subtitle}</p>
                <p className="text-white/60 text-sm leading-relaxed mb-5">{card.desc}</p>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: card.color }}>
                  {card.label} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COMPETITION BANNER ── */}
      {featuredCompetition && (
        <section className="py-12 px-4" style={{ background: 'linear-gradient(135deg, #1a0533, #0f0a1e)' }}>
          <div className="max-w-3xl mx-auto rounded-3xl p-8 text-center relative overflow-hidden"
            style={{
              background: isExpired
                ? 'linear-gradient(135deg, rgba(120,53,15,0.4), rgba(78,52,46,0.4))'
                : 'linear-gradient(135deg, rgba(4,120,87,0.4), rgba(5,150,105,0.3))',
              border: isExpired ? '2px solid rgba(245,158,11,0.3)' : '2px solid rgba(52,211,153,0.3)',
            }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.1) 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fde68a' }}>
                <Star className="h-4 w-4" /> Featured Scholarship Competition
              </div>
              <h2 className="font-black text-white text-3xl mb-4">{featuredCompetition.title}</h2>
              {!isExpired ? (
                <div className="flex justify-center gap-8 mb-6">
                  <div>
                    <p className="font-black text-2xl text-green-400">{featuredCompetition.prizePool}</p>
                    <p className="text-white/50 text-sm">Prize Pool</p>
                  </div>
                  <div>
                    <p className="font-black text-2xl text-blue-400">{featuredCompetition.participantCount}</p>
                    <p className="text-white/50 text-sm">Registered</p>
                  </div>
                </div>
              ) : (
                <p className="text-white/60 mb-6">New competitions launching soon. Stay tuned!</p>
              )}
              <button
                onClick={() => navigate(isExpired ? '/competitions' : '/scholarship')}
                className="px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95"
                style={{ background: isExpired ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #059669, #065f46)', color: 'white' }}>
                {isExpired ? 'Practice Now →' : 'Register for Scholarship →'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-4" style={{ background: '#0f0a1e' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="font-black text-white text-center mb-12" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📝', title: 'Create or Join', desc: 'Build a quiz with AI in seconds — or jump into a live session with just a PIN.' },
              { step: '02', icon: '🏆', title: 'Compete Live', desc: 'Answer fast. Climb the real-time leaderboard. Fastest correct answer wins.' },
              { step: '03', icon: '🎉', title: 'Win & Learn', desc: 'See the podium, review correct answers, and track your progress over time.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="font-black text-8xl absolute -top-4 -left-2 select-none pointer-events-none"
                  style={{ color: 'rgba(167,139,250,0.08)' }}>{s.step}</div>
                <div className="relative z-10 pt-6">
                  <div className="text-4xl mb-3">{s.icon}</div>
                  <h3 className="font-black text-white text-xl mb-2">{s.title}</h3>
                  <p className="text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1e0a3c, #0f0a1e)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-black text-white mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Ready to play?
          </h2>
          <p className="text-white/50 text-lg mb-8">No download. No setup. Just enter a PIN and go.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { setActiveTab('live'); pinRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-10 py-5 rounded-2xl font-black text-xl transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}>
              <Zap className="inline h-6 w-6 mr-2" /> Join a Game
            </button>
            <button
              onClick={() => user ? navigate('/quiz-generator') : signIn()}
              className="px-10 py-5 rounded-2xl font-black text-xl transition-all active:scale-95 border"
              style={{ border: '2px solid rgba(167,139,250,0.4)', color: '#c4b5fd', background: 'transparent' }}>
              <Brain className="inline h-6 w-6 mr-2" /> Create a Quiz
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
