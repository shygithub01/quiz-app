// Live Event Projector View
// Large-screen display for venue attendees with accessibility features

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Users, Clock, Award } from 'lucide-react';
import { getCompetitionById } from '@/components/ui/firebase';
import {
  getEventById,
  listenToEvent,
  listenToParticipants,
  listenToLeaderboard,
  listenToAnswerCount
} from '@/services/liveEventService';
import { LiveEvent, GuestParticipant, LeaderboardEntry } from '@/types/liveEvent';
import QRCode from 'qrcode.react';

export default function LiveEventProjector() {
  const { eventId } = useParams<{ eventId: string }>();
  
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [participants, setParticipants] = useState<GuestParticipant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [answerCount, setAnswerCount] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // Load event and competition
  useEffect(() => {
    if (!eventId) return;
    
    const loadData = async () => {
      const eventData = await getEventById(eventId);
      if (eventData) {
        setEvent(eventData);
        
        const compData = await getCompetitionById(eventData.competitionId);
        setCompetition(compData);
      }
    };
    
    loadData();
  }, [eventId]);
  
  // Listen to real-time updates
  useEffect(() => {
    if (!eventId) return;
    
    const unsubscribeEvent = listenToEvent(eventId, (updatedEvent) => {
      if (updatedEvent) {
        setEvent(updatedEvent);
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
  }, [eventId]);
  
  // Listen to answer count for current question
  useEffect(() => {
    if (!eventId || !event) return;
    
    const unsubscribe = listenToAnswerCount(
      eventId,
      event.currentQuestionIndex,
      (count) => setAnswerCount(count)
    );
    
    return unsubscribe;
  }, [eventId, event?.currentQuestionIndex]);
  
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
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 100);
    
    return () => clearInterval(interval);
  }, [event?.phase, event?.timerStartedAt, event?.timerDuration, event?.pausedDuration]);
  
  if (!event || !competition) {
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-8">
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
            <QRCode
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Trophy className="h-12 w-12" />
              <p className="text-3xl font-bold" style={{ fontSize: '32px' }}>
                Question {event.currentQuestionIndex + 1} of {competition.questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Users className="h-10 w-10" />
                <p className="text-3xl font-bold" style={{ fontSize: '32px' }}>
                  Answered: {answerCount}/{activeParticipants.length}
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
      
      {/* Leaderboard Phase */}
      {event.phase === 'leaderboard' && (
        <div className="flex flex-col min-h-screen justify-center">
          <div className="text-center mb-12">
            <h2 className="text-6xl font-bold mb-4" style={{ fontSize: '64px' }}>
              🏆 Leaderboard
            </h2>
            <p className="text-3xl text-purple-200" style={{ fontSize: '32px' }}>
              Top 5 Participants
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto w-full space-y-4">
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <div
                key={entry.sessionId}
                className={`flex items-center justify-between p-8 rounded-2xl transition-all duration-500 ${
                  idx === 0 ? 'bg-yellow-500/20 border-4 border-yellow-400' :
                  idx === 1 ? 'bg-gray-300/20 border-4 border-gray-300' :
                  idx === 2 ? 'bg-orange-600/20 border-4 border-orange-500' :
                  'bg-white/10 border-2 border-white/20'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="text-5xl font-bold w-16 text-center" style={{ fontSize: '48px' }}>
                    {entry.rank}
                  </div>
                  <div>
                    <p className="text-4xl font-bold" style={{ fontSize: '40px' }}>
                      {entry.name}
                    </p>
                    <p className="text-2xl text-purple-200" style={{ fontSize: '24px' }}>
                      {entry.correctAnswers} correct
                      {entry.fastestFingerBonus > 0 && ` • +${entry.fastestFingerBonus} bonus`}
                    </p>
                  </div>
                </div>
                <div className="text-5xl font-bold" style={{ fontSize: '52px' }}>
                  {entry.score}
                </div>
              </div>
            ))}
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
                    <span className="text-3xl font-semibold" style={{ fontSize: '32px' }}>
                      {entry.name}
                    </span>
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
