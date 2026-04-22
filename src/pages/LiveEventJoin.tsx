// Live Event Join Page — Mobile-first redesign

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, Users, AlertCircle, ChevronRight } from 'lucide-react';
import {
  getEventByPIN,
  getActiveEvent,
  joinEvent,
  validatePINFormat,
  validateNameLength
} from '@/services/liveEventService';
import { unlockAudioOnGesture } from '@/utils/audioUnlock';

const PIN_LENGTH = 6;

export default function LiveEventJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinLocked, setPinLocked] = useState(false);
  const [eventInProgress, setEventInProgress] = useState(false);
  const [eventJustWentLive, setEventJustWentLive] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill PIN from QR code
  useEffect(() => {
    const pinFromQR = searchParams.get('pin');
    if (pinFromQR) {
      setPin(pinFromQR.replace(/\D/g, '').slice(0, PIN_LENGTH));
      setPinLocked(true);
    }
  }, [searchParams]);

  // Auto-fill PIN from active event — polls until one appears
  useEffect(() => {
    const pinFromQR = searchParams.get('pin');
    if (pinFromQR) return; // QR takes priority

    let stopped = false;
    let intervalId: ReturnType<typeof setInterval>;

    const checkForEvent = async (isFirstCheck: boolean) => {
      try {
        const active = await getActiveEvent();
        if (active && active.status !== 'completed') {
          setPin(active.pin);
          setPinLocked(true);
          if (active.phase !== 'lobby') setEventInProgress(true);
          if (!isFirstCheck) setEventJustWentLive(true);
        } else {
          // Event gone — reset so user knows
          setPin('');
          setPinLocked(false);
          setEventInProgress(false);
          setEventJustWentLive(false);
        }
      } catch {
        // silently ignore
      }
    };

    checkForEvent(true);
    // Poll every 5s so users who opened the page early get PIN auto-filled
    intervalId = setInterval(() => {
      if (!stopped) checkForEvent(false);
    }, 5000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, []);

  // Auto-focus: skip PIN (it's pre-filled), go straight to name
  useEffect(() => {
    if (pinLocked) {
      nameInputRef.current?.focus();
    } else {
      pinInputRef.current?.focus();
    }
  }, [pinLocked]);

  // Move focus to name once PIN is manually completed
  useEffect(() => {
    if (!pinLocked && pin.length === PIN_LENGTH) {
      nameInputRef.current?.focus();
    }
  }, [pin, pinLocked]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    unlockAudioOnGesture(); // unlock iOS audio during this user gesture, before any async work

    if (!validatePINFormat(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    if (!validateNameLength(name)) {
      setError('Name must be 2–50 characters');
      return;
    }

    try {
      setLoading(true);
      const event = await getEventByPIN(pin);
      if (!event) { setError('Invalid PIN. Event not found.'); return; }
      if (event.status === 'completed') { setError('This event has already ended.'); return; }
      if (event.phase !== 'lobby') setEventInProgress(true);

      const sessionId = await joinEvent(event.id, name);
      sessionStorage.setItem(`liveEvent_${event.id}_session`, sessionId);
      sessionStorage.setItem(`liveEvent_${event.id}_name`, name);
      navigate(`/live-event/participate/${event.id}/${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = pin.length === PIN_LENGTH && name.trim().length >= 2 && !loading;

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #3730a3 50%, #1e1b4b 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Top branding */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 border-2 border-white/20">
          <Trophy className="h-10 w-10 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-black text-white">Join Live Event</h1>
        <p className="text-white/60 text-sm mt-1 text-center">
          Enter the PIN shown on screen + your name
        </p>
      </div>

      {/* Form card */}
      <div className="flex-1 px-5">
        <form onSubmit={handleJoin} className="space-y-5">

          {/* Event just went live banner */}
          {eventJustWentLive && !error && (
            <div className="flex items-center gap-3 bg-green-500/20 border border-green-400/40 rounded-2xl px-4 py-3 animate-pulse">
              <span className="text-xl">🎉</span>
              <p className="text-green-200 text-sm font-semibold">Event just went live! PIN filled — enter your name and join.</p>
            </div>
          )}

          {/* In-progress notice */}
          {eventInProgress && !error && (
            <div className="flex items-start gap-3 bg-yellow-500/20 border border-yellow-400/30 rounded-2xl px-4 py-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-200 text-sm">Game is already in progress — you'll join from the current question. Questions you missed won't count toward your score.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* PIN input */}
          <div>
            <label className="block text-white/70 text-xs font-semibold mb-2 uppercase tracking-wider">
              Event PIN
              {pinLocked && (
                <span className="ml-2 text-green-400 normal-case font-normal">✓ auto-filled</span>
              )}
            </label>
            <input
              ref={pinInputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => {
                if (pinLocked) return;
                setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
                setError('');
              }}
              readOnly={pinLocked}
              placeholder="• • • • • •"
              maxLength={PIN_LENGTH}
              required
              className="w-full text-center text-4xl font-black tracking-[0.5em] py-5 px-4 rounded-2xl border-2 outline-none transition-all"
              style={{
                background: pinLocked ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.1)',
                borderColor: pin.length === PIN_LENGTH ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                color: pinLocked ? '#c4b5fd' : 'white',
                caretColor: '#a78bfa',
              }}
            />
            <p className="text-white/40 text-xs text-center mt-2">
              {pinLocked ? 'PIN loaded from active event' : `${pin.length}/${PIN_LENGTH} digits entered`}
            </p>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-white/70 text-xs font-semibold mb-2 uppercase tracking-wider">
              Your Display Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Enter your name"
              minLength={2}
              maxLength={50}
              required
              className="w-full text-lg font-semibold py-4 px-5 rounded-2xl border-2 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: name.trim().length >= 2 ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                color: 'white',
              }}
            />
            <p className="text-white/40 text-xs mt-2">
              This name will appear on the leaderboard
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-black transition-all active:scale-95"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : 'rgba(255,255,255,0.1)',
              color: canSubmit ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              minHeight: '64px',
            }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="h-5 w-5" />
                Join Event
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Hint */}
        <div className="mt-8 bg-white/5 rounded-2xl px-5 py-4 border border-white/10">
          <p className="text-white/50 text-xs text-center leading-relaxed">
            Don't have a PIN? Ask the event organizer or scan the QR code displayed on the projector screen.
          </p>
        </div>
      </div>
    </div>
  );
}
