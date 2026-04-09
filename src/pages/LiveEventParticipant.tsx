// Live Event Participant View
// Mobile-optimized interface for participants to answer questions

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Clock, Award, Wifi, WifiOff } from 'lucide-react';
import { getCompetitionById } from '@/components/ui/firebase';
import {
  getEventById,
  listenToEvent,
  listenToLeaderboard,
  submitAnswer,
  updateHeartbeat
} from '@/services/liveEventService';
import { LiveEvent, LeaderboardEntry } from '@/types/liveEvent';

export default function LiveEventParticipant() {
  const { eventId, sessionId } = useParams<{ eventId: string; sessionId: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [myTotalTime, setMyTotalTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [queuedAnswer, setQueuedAnswer] = useState<{
    answer: string;
    timeToAnswer: number;
    questionIndex: number;
  } | null>(null);
  const [myName, setMyName] = useState<string>('You');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [eventWasLoaded, setEventWasLoaded] = useState(false);
  
  const questionStartTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number>(0);
  
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
          console.log('📊 Participant - Event loaded:', eventData);
          setEvent(eventData);
          clearTimeout(timeout);
          
          const compData = await getCompetitionById(eventData.competitionId);
          console.log('📚 Participant - Competition loaded:', compData);
          console.log('❓ Participant - Questions count:', compData?.questions?.length || 0);
          setCompetition(compData);
        } else {
          // Event doesn't exist
          clearTimeout(timeout);
          setEvent(null);
          setCompetition(null);
        }
      } catch (error) {
        console.error('❌ Participant - Error loading data:', error);
        clearTimeout(timeout);
      }
    };
    
    loadData();
    
    return () => clearTimeout(timeout);
  }, [eventId]);
  
  // Load participant name from database
  useEffect(() => {
    if (!eventId || !sessionId) return;
    
    const loadParticipantName = async () => {
      try {
        const { getParticipants } = await import('@/services/liveEventService');
        const participants = await getParticipants(eventId);
        const myParticipant = participants.find(p => p.sessionId === sessionId);
        
        if (myParticipant) {
          setMyName(myParticipant.name);
          // Also store in sessionStorage for faster access
          sessionStorage.setItem(`liveEvent_${eventId}_name`, myParticipant.name);
        } else {
          // Fallback to sessionStorage
          const storedName = sessionStorage.getItem(`liveEvent_${eventId}_name`);
          if (storedName) {
            setMyName(storedName);
          }
        }
      } catch (error) {
        console.error('Error loading participant name:', error);
        // Fallback to sessionStorage
        const storedName = sessionStorage.getItem(`liveEvent_${eventId}_name`);
        if (storedName) {
          setMyName(storedName);
        }
      }
    };
    
    loadParticipantName();
  }, [eventId, sessionId]);
  
  // Listen to real-time updates
  useEffect(() => {
    if (!eventId) return;
    
    // Connection timeout detection
    const connectionTimeout = setTimeout(() => {
      setIsConnected(false);
    }, 5000);
    
    const unsubscribeEvent = listenToEvent(eventId, (updatedEvent) => {
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      reconnectTimeoutRef.current = Date.now();
      
      if (updatedEvent) {
        setEvent(updatedEvent);
        setEventWasLoaded(true);
        
        // Reset answer state when question changes
        if (updatedEvent.phase === 'question' && 
            updatedEvent.currentQuestionIndex !== event?.currentQuestionIndex) {
          setSelectedAnswer(null);
          setHasAnswered(false);
          questionStartTimeRef.current = Date.now();
        }
      } else {
        // Event was deleted
        setEvent(null);
      }
    });
    
    const unsubscribeLeaderboard = listenToLeaderboard(eventId, (updatedLeaderboard) => {
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      reconnectTimeoutRef.current = Date.now();
      
      setLeaderboard(updatedLeaderboard);
      
      // Find my score and rank
      const myEntry = updatedLeaderboard.find(entry => entry.sessionId === sessionId);
      if (myEntry) {
        setMyScore(myEntry.score);
        setMyRank(myEntry.rank);
        setMyTotalTime(myEntry.totalTime || 0);
      }
    });
    
    return () => {
      clearTimeout(connectionTimeout);
      unsubscribeEvent();
      unsubscribeLeaderboard();
    };
  }, [eventId, sessionId, event?.currentQuestionIndex]);
  
  // Heartbeat mechanism and auto-cleanup on disconnect
  useEffect(() => {
    if (!eventId || !sessionId) return;
    
    const sendHeartbeat = () => {
      updateHeartbeat(eventId, sessionId);
    };
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);
    
    // Set up Firebase onDisconnect to auto-remove participant when browser closes
    // This only applies during lobby phase
    const setupDisconnectHandler = async () => {
      if (event?.phase === 'lobby') {
        const { setupParticipantDisconnectHandler } = await import('@/services/liveEventService');
        await setupParticipantDisconnectHandler(eventId, sessionId);
      }
    };
    
    setupDisconnectHandler();
    
    return () => {
      clearInterval(interval);
    };
  }, [eventId, sessionId, event?.phase]);
  
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
  
  // Set question start time
  useEffect(() => {
    if (event?.phase === 'question' && event.timerStartedAt) {
      questionStartTimeRef.current = event.timerStartedAt;
    }
  }, [event?.phase, event?.timerStartedAt]);
  
  // Retry queued answer on reconnection
  useEffect(() => {
    if (!isConnected || !queuedAnswer || !eventId || !sessionId || !event) return;
    
    const retryAnswer = async () => {
      try {
        // Check if still within time limit
        const now = Date.now();
        const timeSinceDisconnect = now - reconnectTimeoutRef.current;
        
        if (timeSinceDisconnect > 60000) {
          // More than 60 seconds offline, session expired
          alert('Your session has expired. Please rejoin the event.');
          setQueuedAnswer(null);
          return;
        }
        
        // Check if timer hasn't expired
        const elapsed = now - event.timerStartedAt! - event.pausedDuration;
        const remaining = event.timerDuration - elapsed / 1000;
        
        if (remaining > 0) {
          await submitAnswer(
            eventId,
            sessionId,
            queuedAnswer.questionIndex,
            queuedAnswer.answer,
            queuedAnswer.timeToAnswer
          );
          
          setHasAnswered(true);
          setQueuedAnswer(null);
        } else {
          // Timer expired, can't submit
          alert('Time expired. Your answer could not be submitted.');
          setQueuedAnswer(null);
        }
      } catch (error) {
        console.error('Error retrying answer:', error);
      }
    };
    
    retryAnswer();
  }, [isConnected, queuedAnswer, eventId, sessionId, event]);
  
  const handleAnswerSelect = async (answer: string) => {
    if (!event || !eventId || !sessionId) return;
    
    setSelectedAnswer(answer);
    
    try {
      const now = Date.now();
      const timeToAnswer = (now - questionStartTimeRef.current) / 1000;
      
      await submitAnswer(
        eventId,
        sessionId,
        event.currentQuestionIndex,
        answer,
        timeToAnswer
      );
      
      setHasAnswered(true);
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      
      // Queue answer if network error
      if (!isConnected) {
        const now = Date.now();
        const timeToAnswer = (now - questionStartTimeRef.current) / 1000;
        
        setQueuedAnswer({
          answer,
          timeToAnswer,
          questionIndex: event.currentQuestionIndex
        });
        
        alert('Connection lost. Your answer will be submitted when connection is restored.');
      } else {
        alert(error.message || 'Failed to submit answer');
        setSelectedAnswer(null);
      }
    }
  };
  
  // Check if event was deleted or loading timeout
  if (event === null && competition === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Event Ended
            </h2>
            <p className="text-gray-600 mb-6">
              This event has been completed and deleted by the host.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!event || !competition) {
    // If event was previously loaded but now is null, it was deleted
    if (eventWasLoaded && !event) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center p-4">
          <Card className="max-w-md bg-purple-700 border-purple-500">
            <CardContent className="pt-6 text-center">
              <Trophy className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Event Ended
              </h2>
              <p className="text-white text-lg mb-4">
                This event has been deleted by the host.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
              >
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (loadingTimeout) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Trophy className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connection Error
              </h2>
              <p className="text-gray-600 mb-4">
                Unable to load event. The event may have been deleted.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 mb-2"
              >
                Reload Page
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading event...</p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = competition.questions?.[event.currentQuestionIndex];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              <span className="font-bold text-lg">{competition.title}</span>
            </div>
            {isConnected ? (
              <Wifi className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-300 animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>{myName}</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                Score: {myScore}
              </span>
              <span>Rank: #{myRank || '-'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto p-4">
        {/* Connection Status Banner */}
        {!isConnected && (
          <Card className="mb-4 bg-orange-50 border-2 border-orange-300">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <WifiOff className="h-6 w-6 text-orange-600 animate-pulse" />
                <div>
                  <p className="font-bold text-orange-900">Connection Lost</p>
                  <p className="text-sm text-orange-700">
                    Attempting to reconnect... Your answers will be saved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {queuedAnswer && (
          <Card className="mb-4 bg-blue-50 border-2 border-blue-300">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                <div>
                  <p className="font-bold text-blue-900">Answer Queued</p>
                  <p className="text-sm text-blue-700">
                    Your answer will be submitted when connection is restored.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Lobby Phase */}
        {event.phase === 'lobby' && (
          <Card className="mt-8">
            <CardContent className="pt-6 text-center">
              <Trophy className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {myName}!
              </h2>
              <p className="text-gray-600 mb-4">
                You've successfully joined the event.
              </p>
              <p className="text-lg text-purple-600 font-semibold">
                Waiting for the host to start the competition...
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Countdown Phase */}
        {event.phase === 'countdown' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-9xl font-bold text-purple-600 animate-bounce">
                  {countdown}
                </p>
              ) : (
                <p className="text-9xl font-bold text-green-600 animate-pulse">
                  GO!
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Question Phase */}
        {event.phase === 'question' && currentQuestion && (
          <div className="space-y-4 mt-4">
            {/* Question Header */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-600">
                    Question {event.currentQuestionIndex + 1} of {competition.questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className={`text-2xl font-bold ${remainingTime <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                      {remainingTime}s
                    </span>
                  </div>
                </div>
                
                <p className="text-xl font-bold text-gray-900 leading-relaxed">
                  {currentQuestion.question}
                </p>
              </CardContent>
            </Card>
            
            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, idx: number) => (
                <Button
                  key={idx}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={remainingTime === 0}
                  className={`w-full text-left justify-start text-lg font-semibold py-8 px-6 ${
                    selectedAnswer === option
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200'
                  }`}
                  style={{ minHeight: '44px', touchAction: 'manipulation' }}
                >
                  <span className="mr-3 text-xl">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </Button>
              ))}
            </div>
            
            {hasAnswered && (
              <Card className="bg-green-50 border-2 border-green-200">
                <CardContent className="pt-4">
                  <p className="text-center text-green-800 font-semibold">
                    ✅ Answer submitted! Waiting for other participants...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Leaderboard Phase */}
        {event.phase === 'leaderboard' && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-center mb-6">
                🏆 Current Standings
              </h2>
              
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry) => (
                  <div
                    key={entry.sessionId}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.sessionId === sessionId
                        ? 'bg-purple-100 border-2 border-purple-400'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold w-8 text-center">
                        {entry.rank}
                      </span>
                      <div>
                        <p className="font-bold">
                          {entry.name}
                          {entry.sessionId === sessionId && ' (You)'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {entry.correctAnswers} correct
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{entry.score}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Results Phase */}
        {event.phase === 'results' && (
          <Card className="mt-8">
            <CardContent className="pt-6 text-center">
              <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Competition Complete!
              </h2>
              
              <div className="bg-purple-50 rounded-lg p-6 mb-6">
                <p className="text-lg text-gray-700 mb-2">Your Final Result</p>
                <p className="text-5xl font-bold text-purple-600 mb-2">
                  #{myRank}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {myScore} points
                </p>
                {myTotalTime !== undefined && myTotalTime > 0 && (
                  <p className="text-lg text-gray-600 mt-2">
                    {myTotalTime.toFixed(1)}s total time
                  </p>
                )}
              </div>
              
              <p className="text-gray-600">
                Thank you for participating!
              </p>
              
              <Button
                onClick={() => navigate('/')}
                className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
