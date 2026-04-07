// Live Event Projector View
// Large-screen display for venue attendees with accessibility features

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Clock, Users } from 'lucide-react';
import { getCompetitionById } from '@/components/ui/firebase';
import {
  getEventById,
  listenToEvent,
  listenToParticipants,
  listenToLeaderboard
} from '@/services/liveEventService';
import { LiveEvent, GuestParticipant, LeaderboardEntry } from '@/types/liveEvent';
import { QRCodeSVG } from 'qrcode.react';
import { playVictorySound, stopBackgroundMusic } from '@/utils/backgroundMusic';

export default function LiveEventProjector() {
  const { eventId } = useParams<{ eventId: string }>();
  
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [participants, setParticipants] = useState<GuestParticipant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [victoryPlayed, setVictoryPlayed] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Load event and competition
  useEffect(() => {
    if (!eventId) return;
    
    // Set timeout for loading state
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // 10 seconds
    
    const loadData = async () => {
      try {
        const eventData = await getEventById(eventId);
        if (eventData) {
          console.log('📊 Event loaded:', eventData);
          setEvent(eventData);
          clearTimeout(timeout);
          
          const compData = await getCompetitionById(eventData.competitionId);
          console.log('📚 Competition loaded:', compData);
          console.log('❓ Questions count:', compData?.questions?.length || 0);
          setCompetition(compData);
        } else {
          // Event doesn't exist
          clearTimeout(timeout);
          setEvent(null);
          setCompetition(null);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        clearTimeout(timeout);
      }
    };
    
    loadData();
    
    return () => clearTimeout(timeout);
  }, [eventId]);
  
  // Listen to real-time updates
  useEffect(() => {
    if (!eventId) return;
    
    const unsubscribeEvent = listenToEvent(eventId, (updatedEvent) => {
      if (updatedEvent) {
        setEvent(updatedEvent);
        
        // Play victory sound and show confetti when results phase starts
        if (updatedEvent.phase === 'results' && !victoryPlayed) {
          // Stop background music IMMEDIATELY and aggressively
          console.log('🎵 Stopping music for results phase');
          stopBackgroundMusic();
          
          // Stop again after a short delay to ensure it's really stopped
          setTimeout(() => {
            console.log('🎵 Double-checking music stop');
            stopBackgroundMusic();
          }, 100);
          
          // Then play victory sound
          setTimeout(() => {
            playVictorySound();
          }, 500);
          
          setShowConfetti(true);
          setVictoryPlayed(true);
          
          // Stop confetti after 10 seconds
          setTimeout(() => setShowConfetti(false), 10000);
          
          // Stop music one more time after confetti ends
          setTimeout(() => {
            console.log('🎵 Final music stop after confetti');
            stopBackgroundMusic();
          }, 10500);
        }
      } else {
        // Event was deleted
        setEvent(null);
      }
    });
    
    const unsubscribeParticipants = listenToParticipants(eventId, (updatedParticipants) => {
      setParticipants(updatedParticipants);
    });
    
    const unsubscribeLeaderboard = listenToLeaderboard(eventId, (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
    });
    
    return () => {
      unsubscribeEvent();
      unsubscribeParticipants();
      unsubscribeLeaderboard();
    };
  }, [eventId, victoryPlayed]);
  
  // Countdown animation
  useEffect(() => {
    if (event?.phase !== 'countdown') return;
    
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
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
      
      // Auto-advance when timer expires (if enabled and not paused)
      if (remaining <= 0 && event.settings.autoAdvanceOnTimer && event.status === 'active') {
        handleAutoAdvance();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 100);
    
    return () => clearInterval(interval);
  }, [event?.phase, event?.timerStartedAt, event?.timerDuration, event?.pausedDuration, event?.status]);
  
  const handleAutoAdvance = async () => {
    if (!event || !competition || !eventId) return;
    
    try {
      // Calculate leaderboard
      const { calculateLeaderboard } = await import('@/services/liveEventService');
      await calculateLeaderboard(
        eventId,
        competition.questions,
        event.settings.enableFastestFingerBonus
      );
      
      // Wait 3 seconds before advancing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if this is the last question
      if (event.currentQuestionIndex >= competition.questions.length - 1) {
        // Move to results phase
        const { updateEvent } = await import('@/services/liveEventService');
        await updateEvent(eventId, {
          phase: 'results',
          status: 'completed',
          endedAt: Date.now()
        });
      } else {
        // Move directly to next question (skip leaderboard phase)
        const { updateEvent } = await import('@/services/liveEventService');
        await updateEvent(eventId, {
          phase: 'question',
          currentQuestionIndex: event.currentQuestionIndex + 1,
          timerStartedAt: Date.now(),
          pausedDuration: 0,
          pausedAt: null
        });
      }
    } catch (error) {
      console.error('Error auto-advancing:', error);
    }
  };
  
  // Check if event was deleted or loading timeout
  if (event === null && competition === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-4">Event Ended</h2>
          <p className="text-xl text-gray-300">
            This event has been completed and deleted by the host.
          </p>
        </div>
      </div>
    );
  }
  
  if (!event || !competition) {
    if (loadingTimeout) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <Trophy className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Connection Error</h2>
            <p className="text-xl text-gray-300 mb-4">
              Unable to load event. The event may have been deleted.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-lg font-semibold"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Trophy className="h-16 w-16 animate-spin mx-auto mb-4" />
          <p className="text-2xl">Loading event...</p>
        </div>
      </div>
    );
  }
  
  const getJoinURL = () => {
    return `${window.location.origin}/live-event/join?pin=${event.pin}`;
  };
  
  const currentQuestion = competition.questions?.[event.currentQuestionIndex];
  const activeParticipants = participants.filter(p => p.isActive);
  const top5Leaderboard = leaderboard.slice(0, 5);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-8">
      {/* Confetti Effect for Results */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(150)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-100px',
                animationDuration: `${2 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            >
              {['🎉', '🎊', '⭐', '✨', '🏆', '🎈', '🌟', '💫', '🥇', '👏'][Math.floor(Math.random() * 10)]}
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0.3;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
      {/* Lobby Phase */}
      {event.phase === 'lobby' && (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-12">
          <div className="text-center">
            <h1 className="text-7xl font-bold mb-4" style={{ fontSize: '72px' }}>
              {competition.title}
            </h1>
            <p className="text-4xl text-purple-200" style={{ fontSize: '36px' }}>
              Scan QR Code or Enter PIN to Join
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <QRCodeSVG
              value={getJoinURL()}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          
          <div className="text-center">
            <p className="text-3xl text-purple-200 mb-2" style={{ fontSize: '32px' }}>
              PIN CODE
            </p>
            <p className="text-9xl font-bold tracking-widest" style={{ fontSize: '96px' }}>
              {event.pin}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Users className="h-12 w-12" />
              <p className="text-5xl font-bold" style={{ fontSize: '48px' }}>
                {activeParticipants.length}/{event.maxParticipants} Joined
              </p>
            </div>
            
            <div className="grid grid-cols-4 gap-4 max-w-4xl">
              {activeParticipants.slice(0, 20).map((p) => (
                <div
                  key={p.sessionId}
                  className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl"
                >
                  <p className="text-2xl font-semibold truncate" style={{ fontSize: '24px' }}>
                    {p.name}
                  </p>
                </div>
              ))}
            </div>
            
            {activeParticipants.length > 20 && (
              <p className="text-2xl text-purple-200 mt-4" style={{ fontSize: '24px' }}>
                + {activeParticipants.length - 20} more participants
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Countdown Phase */}
      {event.phase === 'countdown' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            {countdown > 0 ? (
              <p 
                className="font-bold animate-bounce" 
                style={{ fontSize: '200px', lineHeight: '1' }}
              >
                {countdown}
              </p>
            ) : (
              <p 
                className="font-bold animate-pulse" 
                style={{ fontSize: '200px', lineHeight: '1', color: '#10b981' }}
              >
                GO!
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Question Phase */}
      {event.phase === 'question' && currentQuestion && (
        <div className="flex flex-col min-h-screen">
          {/* Persistent Top 5 Leaderboard Bar */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <span className="text-2xl font-bold">Top 5</span>
              </div>
              <div className="flex items-center gap-6">
                {top5Leaderboard.map((entry, idx) => (
                  <div key={entry.sessionId} className="flex items-center gap-2">
                    <span className="text-2xl">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                    </span>
                    <span className="text-xl font-semibold truncate max-w-[150px]">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold" style={{ fontSize: '32px' }}>
                Question {event.currentQuestionIndex + 1} of {competition.questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-12 w-12" />
              <p 
                className={`text-5xl font-bold ${remainingTime <= 10 ? 'text-red-500 animate-pulse' : ''}`}
                style={{ fontSize: '48px' }}
              >
                {remainingTime}s
              </p>
            </div>
          </div>
          
          {/* Question */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-6xl w-full">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 mb-8">
                <p 
                  className="text-center font-bold leading-relaxed"
                  style={{ fontSize: '40px', minHeight: '120px' }}
                >
                  {currentQuestion.question}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {currentQuestion.options.map((option: string, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-8"
                  >
                    <p className="text-3xl font-semibold" style={{ fontSize: '32px' }}>
                      {String.fromCharCode(65 + idx)}. {option}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      

      {/* Results Phase */}
      {event.phase === 'results' && (
        <div className="flex flex-col min-h-screen justify-center">
          <div className="text-center mb-12">
            <div className="mb-8">
              <Trophy className="h-32 w-32 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-7xl font-bold mb-4" style={{ fontSize: '72px' }}>
                🎉 Competition Complete! 🎉
              </h2>
            </div>
            
            {leaderboard[0] && (
              <div className="mb-12">
                <p className="text-4xl text-purple-200 mb-2" style={{ fontSize: '36px' }}>
                  Winner
                </p>
                <p className="text-8xl font-bold text-yellow-400" style={{ fontSize: '80px' }}>
                  {leaderboard[0].name}
                </p>
                <p className="text-5xl font-bold mt-4" style={{ fontSize: '48px' }}>
                  {leaderboard[0].score} points
                </p>
                {leaderboard[0].totalTime !== undefined && (
                  <p className="text-3xl text-purple-200 mt-2" style={{ fontSize: '28px' }}>
                    {leaderboard[0].totalTime.toFixed(1)}s total time
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="max-w-6xl mx-auto w-full">
            <h3 className="text-4xl font-bold mb-6 text-center" style={{ fontSize: '40px' }}>
              Final Standings
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leaderboard.map((entry) => (
                <div
                  key={entry.sessionId}
                  className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold w-12 text-center" style={{ fontSize: '32px' }}>
                      {entry.rank}
                    </span>
                    <div>
                      <span className="text-3xl font-semibold" style={{ fontSize: '32px' }}>
                        {entry.name}
                      </span>
                      {entry.totalTime !== undefined && (
                        <p className="text-xl text-purple-200" style={{ fontSize: '20px' }}>
                          {entry.totalTime.toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-4xl font-bold" style={{ fontSize: '36px' }}>
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
