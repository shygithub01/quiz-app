// Live Event Join Page — Mobile-first redesign

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, Users, AlertCircle, ChevronRight } from 'lucide-react';
import {
  getEventByPIN,
  joinEvent,
  validatePINFormat,
  validateNameLength
} from '@/services/liveEventService';

const PIN_LENGTH = 6;

export default function LiveEventJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pinInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill PIN from QR code
  useEffect(() => {
    const pinFromQR = searchParams.get('pin');
    if (pinFromQR) setPin(pinFromQR.replace(/\D/g, '').slice(0, PIN_LENGTH));
  }, [searchParams]);

  // Auto-focus PIN on mount
  useEffect(() => {
    pinInputRef.current?.focus();
  }, []);

  // Move focus to name once PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      nameInputRef.current?.focus();
    }
  }, [pin]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      if (event.phase !== 'lobby') { setError('This event has already started. You cannot join now.'); return; }

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
            </label>
            <input
              ref={pinInputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
                setError('');
              }}
              placeholder="• • • • • •"
              maxLength={PIN_LENGTH}
              required
              className="w-full text-center text-4xl font-black tracking-[0.5em] py-5 px-4 rounded-2xl border-2 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: pin.length === PIN_LENGTH ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                color: 'white',
                caretColor: '#a78bfa',
              }}
            />
            <p className="text-white/40 text-xs text-center mt-2">
              {pin.length}/{PIN_LENGTH} digits entered
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
