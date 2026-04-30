import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/components/ui/firebase';
import { getDailySession, joinPracticeSession } from '@/services/practiceService';
import { saveNameToLocalStorage } from '@/utils/practiceStorage';
import { PracticeSession } from '@/types/practiceMode';

const BG = 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 45%, #0a1628 100%)';

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DailyChallenge() {
  const navigate = useNavigate();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDailySession().then(s => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  // Countdown then navigate
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) return; // handled below after render
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && session) {
      navigate(`/practice/quiz/${session.id}`);
    }
  }, [countdown, session, navigate]);

  const handleGoogleSignIn = async () => {
    if (!session) return;
    try {
      setSigningIn(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const name = result.user.displayName || result.user.email?.split('@')[0] || 'Player';
      await joinPracticeSession(session.id, name);
      saveNameToLocalStorage(session.id, name);
      setCountdown(3);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.');
      }
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
  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center" style={{ background: BG }}>
        <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-6">Get Ready!</p>
        <div className="text-[120px] font-black text-white leading-none animate-pulse" key={countdown}>
          {countdown}
        </div>
        <p className="text-white/30 text-sm mt-8">Starting quiz...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center" style={{ background: BG }}>
        <p className="text-5xl mb-4">📅</p>
        <h1 className="text-white font-black text-2xl mb-2">No Daily Challenge Today</h1>
        <p className="text-white/40 text-sm max-w-xs">Check back soon — a new challenge drops every morning.</p>
        <button onClick={() => navigate('/')} className="mt-8 text-white/30 text-sm hover:text-white/60 transition-colors">
          ← Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: BG, paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-12 pb-6">

        <div className="mb-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(250,204,21,0.15)', color: '#fde047', border: '1px solid rgba(250,204,21,0.3)' }}>
          ⚡ Daily Challenge
        </div>

        <p className="text-white/40 text-sm mt-3 mb-1">{todayLabel()}</p>
        <h1 className="text-3xl font-black text-white leading-tight mb-2">{session.title}</h1>
        <p className="text-white/40 text-sm max-w-xs">
          {session.statistics?.totalStudents || 0} people playing today · live leaderboard after you finish
        </p>

        {session.endDate && (
          <p className="text-white/25 text-xs mt-3">
            Closes {new Date(session.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
          </p>
        )}
      </div>

      {/* Sign-in card */}
      <div className="px-5 pb-8 space-y-3 max-w-sm mx-auto w-full">

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'white', color: '#1a1a2e' }}
        >
          {signingIn ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {signingIn ? 'Signing in...' : 'Sign in with Google to Play'}
        </button>

        <p className="text-center text-white/25 text-xs px-4">
          Your Google name appears on the leaderboard. No passwords, no sign-up.
        </p>
      </div>
    </div>
  );
}
