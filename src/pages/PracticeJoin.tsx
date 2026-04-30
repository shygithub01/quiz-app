import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Target, AlertCircle, ChevronRight } from 'lucide-react';
import { getSessionByPIN, getSessionById, joinPracticeSession } from '@/services/practiceService';
import { validatePINFormat, validateNameLength } from '@/services/liveEventService';
import { saveNameToLocalStorage, getNameFromLocalStorage } from '@/utils/practiceStorage';
import { PracticeSession } from '@/types/practiceMode';

const BG = 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 40%, #0a1628 100%)';
const PIN_LENGTH = 6;

export default function PracticeJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionIdParam = searchParams.get('sessionId');
  const pinParam = searchParams.get('pin');

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(!!sessionIdParam);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(sessionIdParam);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Direct join via sessionId (from Home page card)
  useEffect(() => {
    if (!sessionIdParam) return;
    const load = async () => {
      try {
        const s = await getSessionById(sessionIdParam);
        if (!s || s.status !== 'active') {
          setError('This session is no longer available.');
          setLoading(false);
          return;
        }
        setSession(s);
        const saved = getNameFromLocalStorage(s.id);
        if (saved) setName(saved);
      } catch {
        setError('Failed to load session.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionIdParam]);

  // PIN auto-fill from QR code
  useEffect(() => {
    if (pinParam && !sessionIdParam) {
      setPin(pinParam.replace(/\D/g, '').slice(0, PIN_LENGTH));
    }
  }, [pinParam, sessionIdParam]);

  // Auto-focus
  useEffect(() => {
    if (!sessionIdParam) pinInputRef.current?.focus();
    else nameInputRef.current?.focus();
  }, [sessionIdParam, loading]);

  // Validate PIN when complete
  useEffect(() => {
    if (!sessionIdParam && pin.length === PIN_LENGTH) {
      validatePin();
      nameInputRef.current?.focus();
    }
  }, [pin]);

  // Auto-fill saved name when session resolved from PIN
  useEffect(() => {
    if (resolvedSessionId && !sessionIdParam) {
      const saved = getNameFromLocalStorage(resolvedSessionId);
      if (saved) setName(saved);
    }
  }, [resolvedSessionId]);

  const validatePin = async () => {
    try {
      const s = await getSessionByPIN(pin);
      if (s) { setResolvedSessionId(s.id); setSession(s); setError(''); }
      else { setResolvedSessionId(null); setSession(null); setError('Invalid PIN — session not found.'); }
    } catch {
      setError('Error checking PIN. Please try again.');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const sid = sessionIdParam || resolvedSessionId;
    if (!sid) { setError('Please enter a valid PIN'); return; }
    if (!validateNameLength(name)) { setError('Name must be 2–50 characters'); return; }
    if (!sessionIdParam && !validatePINFormat(pin)) { setError('PIN must be 6 digits'); return; }

    try {
      setSubmitting(true);
      const targetSession = session || await getSessionByPIN(pin);
      if (!targetSession) { setError('Session not found.'); return; }
      if (targetSession.status !== 'active') { setError('This session has ended.'); return; }

      await joinPracticeSession(targetSession.id, name);
      saveNameToLocalStorage(targetSession.id, name);
      navigate(`/practice/quiz/${targetSession.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = name.trim().length >= 2 && !submitting &&
    (sessionIdParam ? !!session : pin.length === PIN_LENGTH && !!resolvedSessionId);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: BG, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-white/10 flex items-center justify-center mb-4 border-2 border-emerald-400/30">
          <Target className="h-9 w-9 text-emerald-400" />
        </div>
        {session ? (
          <>
            <h1 className="text-xl font-black text-white text-center">{session.title}</h1>
            <p className="text-emerald-400 text-sm font-semibold mt-1">Practice Session · Open</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-white">Join Practice</h1>
            <p className="text-white/50 text-sm mt-1 text-center">Enter PIN from your teacher</p>
          </>
        )}
      </div>

      <div className="flex-1 px-5">
        <form onSubmit={handleJoin} className="space-y-4">

          {error && (
            <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* PIN input — only shown when NOT coming from direct sessionId link */}
          {!sessionIdParam && (
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
                Session PIN
              </label>
              <input
                ref={pinInputRef}
                type="tel" inputMode="numeric" pattern="[0-9]*"
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH)); setError(''); }}
                placeholder="• • • • • •"
                maxLength={PIN_LENGTH}
                className="w-full text-center text-4xl font-black tracking-[0.5em] py-5 px-4 rounded-2xl border-2 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: pin.length === PIN_LENGTH && resolvedSessionId ? '#34d399' : pin.length === PIN_LENGTH ? '#ef4444' : 'rgba(255,255,255,0.15)',
                  color: 'white', caretColor: '#34d399',
                }}
              />
              {pin.length === PIN_LENGTH && resolvedSessionId && (
                <p className="text-emerald-400 text-xs text-center mt-2 font-semibold">✓ {session?.title}</p>
              )}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Enter your name"
              minLength={2} maxLength={50}
              className="w-full text-lg font-semibold py-4 px-5 rounded-2xl border-2 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: name.trim().length >= 2 ? '#34d399' : 'rgba(255,255,255,0.15)',
                color: 'white',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-5 rounded-2xl text-lg font-black transition-all active:scale-95"
            style={{
              background: canSubmit ? 'linear-gradient(135deg, #059669, #065f46)' : 'rgba(255,255,255,0.06)',
              color: canSubmit ? 'white' : 'rgba(255,255,255,0.25)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              minHeight: '64px',
            }}
          >
            {submitting
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</>
              : <>Start Practicing <ChevronRight className="h-5 w-5" /></>}
          </button>
        </form>

        <div className="mt-5 rounded-2xl px-5 py-4 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['Unlimited attempts — practice as many times as you want', 'Self-paced — no time pressure', 'Track your improvement on the leaderboard'].map(f => (
            <div key={f} className="flex items-start gap-2">
              <span className="text-emerald-400 text-xs mt-0.5">✓</span>
              <p className="text-white/40 text-xs">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
