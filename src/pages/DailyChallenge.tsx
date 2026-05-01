import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/components/ui/firebase';
import { getDailySession, joinPracticeSession, getExistingAttemptByUid } from '@/services/practiceService';
import { saveNameToLocalStorage, saveUidToLocalStorage } from '@/utils/practiceStorage';

const ADMIN_EMAIL = 'mohapatra.shyam@gmail.com';
import { PracticeSession } from '@/types/practiceMode';

const BG = 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 45%, #0a1628 100%)';

const RANDOM_NAMES = [
  'Priya Sharma','Rahul Verma','Ananya Singh','Arjun Nair','Meera Pillai',
  'Vikram Patel','Divya Menon','Rohan Gupta','Kavya Reddy','Aditya Kumar',
  'Sneha Joshi','Kiran Rao','Pooja Iyer','Nikhil Mehta','Swati Agarwal',
  'Siddharth Das','Riya Chopra','Manish Tiwari','Shruti Bhat','Akash Nanda',
  'Tanvi Desai','Varun Shah','Deepa Srinivas','Harish Yadav','Nisha Malhotra',
];

function randomName() {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function useCountdownToClose(endDate: number | null) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const diff = endDate - Date.now();
      if (diff <= 0) { setTimeLeft('Closed'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 3600000); // under 1 hour = urgent
      setTimeLeft(h > 0 ? `${h}h ${m}m left` : m > 0 ? `${m}m ${s}s left` : `${s}s left`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return { timeLeft, urgent };
}

function useCountdown(from: number | null, onDone: () => void) {
  const [n, setN] = useState(from);
  useEffect(() => {
    if (from === null) return;
    setN(from);
    const id = setInterval(() => {
      setN(prev => {
        if (prev === null || prev <= 1) { clearInterval(id); onDone(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [from]);
  return n;
}

export default function DailyChallenge() {
  const navigate = useNavigate();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [startingCountdown, setStartingCountdown] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Name confirmation step (Google or guest)
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem('daily_streak_count') || '0');
    const lastPlayed = localStorage.getItem('daily_last_played_date');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastPlayed === today || lastPlayed === yesterday) setStreak(saved);
  }, []);

  const { timeLeft, urgent } = useCountdownToClose(session?.endDate ?? null);

  const countdownVal = useCountdown(
    startingCountdown ? 3 : null,
    () => { if (sessionId) navigate(`/practice/quiz/${sessionId}`); }
  );

  useEffect(() => {
    let redirected = false;
    // Wait for Firebase auth to initialize, then check if already played
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (redirected) return;
      const s = await getDailySession();
      setSession(s);
      if (s && user && user.email !== ADMIN_EMAIL) {
        const existing = await getExistingAttemptByUid(s.id, user.uid);
        if (existing && existing !== 'played') {
          redirected = true;
          navigate(`/practice/results/${s.id}/${existing}`);
          return;
        }
      }
      setLoading(false);
      unsubscribe();
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!session) return;
    try {
      setSigningIn(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { uid, email, displayName } = result.user;
      const isAdmin = email === ADMIN_EMAIL;

      // Non-admins: check for existing attempt and redirect if already played
      if (!isAdmin) {
        const existingAttemptId = await getExistingAttemptByUid(session.id, uid);
        if (existingAttemptId) {
          navigate(`/practice/results/${session.id}/${existingAttemptId}`);
          return;
        }
      }

      // Save UID so PracticeParticipant can enforce one-attempt-per-Gmail (skip for admin)
      if (!isAdmin) saveUidToLocalStorage(session.id, uid);

      const googleName = displayName || email?.split('@')[0] || 'Player';
      setPendingName(googleName);
      setEditedName(googleName);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') setError('Sign-in failed — please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleStartWithName = async () => {
    if (!session || !editedName.trim()) return;
    try {
      setSigningIn(true);
      const name = editedName.trim();
      await joinPracticeSession(session.id, name);
      saveNameToLocalStorage(session.id, name);
      setSessionId(session.id);
      setStartingCountdown(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start. Try again.');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: BG }}>
        <div className="w-10 h-10 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Countdown screen
  if (startingCountdown && countdownVal !== null && countdownVal > 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center" style={{ background: BG }}>
        <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-8">Get Ready!</p>
        <div
          key={countdownVal}
          className="text-[140px] font-black text-white leading-none"
          style={{ textShadow: '0 0 80px rgba(250,204,21,0.6)', animation: 'ping-once 0.3s ease-out' }}
        >
          {countdownVal}
        </div>
        <style>{`.ping-once { animation: pingOnce 0.3s ease-out; } @keyframes pingOnce { 0% { transform: scale(1.4); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center" style={{ background: BG }}>
        <p className="text-5xl mb-5">📅</p>
        <h1 className="text-white font-black text-2xl mb-3">No Challenge Today</h1>
        <p className="text-white/40 text-sm max-w-xs leading-relaxed">A new challenge drops every morning. Check back soon.</p>
        <button onClick={() => navigate('/')} className="mt-10 text-white/30 text-sm hover:text-white/60 transition-colors">
          ← Back to home
        </button>
      </div>
    );
  }

  const playerCount = session.statistics?.totalStudents || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center" style={{ background: BG }}>
    <div
      className="w-full max-w-md flex flex-col flex-1"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '100dvh' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
          style={{ background: 'rgba(250,204,21,0.15)', color: '#fde047', border: '1px solid rgba(250,204,21,0.25)' }}>
          ⚡ Daily Challenge
        </div>
        {timeLeft && (
          <div className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
              color: urgent ? '#fca5a5' : 'rgba(255,255,255,0.4)',
              border: urgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
            }}>
            {urgent ? '🔥 ' : '⏱ '}{timeLeft}
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center px-5 py-6">
        <p className="text-white/35 text-sm font-semibold mb-3">{todayLabel()}</p>

        <h1 className="text-4xl font-black text-white leading-tight mb-6"
          style={{ textShadow: '0 2px 40px rgba(167,139,250,0.3)' }}>
          {session.title}
        </h1>

        {/* Live stats */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold text-sm">
              {playerCount} {playerCount === 1 ? 'person' : 'people'} played
            </span>
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}>
              <span className="text-orange-300 font-black text-sm">🔥 {streak} day streak</span>
            </div>
          )}
        </div>

        {/* What to expect */}
        <div className="space-y-3 mb-2">
          {[
            ['🏆', 'Compete with everyone who plays today'],
            ['📊', 'See live standings after you finish'],
            ['🔗', 'Share your rank — challenge your network'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <p className="text-white/50 text-sm font-medium">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sign-in / Name confirmation */}
      <div className="px-5 pb-8 space-y-3">
        {error && <p className="text-red-400 text-sm text-center font-semibold">{error}</p>}

        {pendingName !== null ? (
          /* Name entry step — Google pre-fills, guest starts blank */
          <>
            <p className="text-white/50 text-xs text-center font-semibold uppercase tracking-wider">
              {isGuest ? 'Pick a name for the leaderboard' : 'Your leaderboard name'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={editedName}
                onChange={e => setEditedName(e.target.value)}
                placeholder={isGuest ? 'Enter your name…' : ''}
                className="flex-1 px-4 py-3 rounded-xl text-white font-bold text-base outline-none"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', caretColor: '#a78bfa' }}
                maxLength={30}
                autoFocus
              />
              <button
                onClick={() => setEditedName(randomName())}
                className="px-3 py-3 rounded-xl text-lg transition-all active:scale-95"
                style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
                title="Random name"
              >
                🎲
              </button>
            </div>
            <button
              onClick={handleStartWithName}
              disabled={signingIn || editedName.trim().length < 2}
              className="w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}
            >
              {signingIn ? 'Starting...' : "Let's Go! →"}
            </button>
            {isGuest && (
              <button onClick={() => { setIsGuest(false); setPendingName(null); setEditedName(''); }}
                className="w-full text-center text-white/30 text-xs hover:text-white/50 transition-colors">
                ← Sign in with Google instead
              </button>
            )}
          </>
        ) : (
          /* Auth choice */
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: 'white', color: '#111', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              {signingIn ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {signingIn ? 'Signing in...' : 'Sign in with Google'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <span className="text-white/25 text-xs font-semibold">or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            </div>

            <button
              onClick={() => { setIsGuest(true); setPendingName(''); setEditedName(''); }}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Play as Guest →
            </button>

            <p className="text-center text-white/20 text-xs leading-relaxed">
              Google saves your rank · Guest plays anonymously
            </p>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
