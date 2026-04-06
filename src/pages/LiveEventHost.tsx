// Live Event Host Control Panel
// Allows hosts to create and manage live events

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trophy, 
  Users, 
  Play, 
  Pause, 
  SkipForward, 
  Clock, 
  StopCircle,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { getCompetitions } from '@/components/ui/firebase';
import { 
  createLiveEvent,
  listenToEvent,
  listenToParticipants,
  updateEvent,
  checkActiveEvents
} from '@/services/liveEventService';
import { LiveEvent, GuestParticipant } from '@/types/liveEvent';
import { QRCodeSVG } from 'qrcode.react';

export default function LiveEventHost() {
  const navigate = useNavigate();
  
  // Step 1: Select Competition
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Step 2: Event Created
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [participants, setParticipants] = useState<GuestParticipant[]>([]);
  const [hasActiveEvent, setHasActiveEvent] = useState(false);
  
  // Load competitions on mount
  useEffect(() => {
    loadCompetitions();
    checkForActiveEvents();
  }, []);
  
  // Listen to event changes
  useEffect(() => {
    if (!event) return;
    
    const unsubscribeEvent = listenToEvent(event.id, (updatedEvent) => {
      if (updatedEvent) {
        setEvent(updatedEvent);
      }
    });
    
    const unsubscribeParticipants = listenToParticipants(event.id, (updatedParticipants) => {
      setParticipants(updatedParticipants);
    });
    
    return () => {
      unsubscribeEvent();
      unsubscribeParticipants();
    };
  }, [event?.id]);
  
  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const allCompetitions = await getCompetitions();
      
      // Filter for live event enabled competitions
      const liveEventCompetitions = allCompetitions.filter(
        (comp: any) => comp.isLiveEvent === true
      );
      
      setCompetitions(liveEventCompetitions);
    } catch (error) {
      console.error('Error loading competitions:', error);
      alert('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };
  
  const checkForActiveEvents = async () => {
    const active = await checkActiveEvents();
    setHasActiveEvent(active);
  };
  
  const handleCreateEvent = async () => {
    if (!selectedCompetition) {
      alert('Please select a competition');
      return;
    }
    
    try {
      const competition = competitions.find(c => c.id === selectedCompetition);
      if (!competition) {
        throw new Error('Competition not found');
      }
      
      const { eventId, pin } = await createLiveEvent(
        selectedCompetition,
        competition.liveEventSettings,
        competition.liveEventSettings.maxParticipants
      );
      
      // Get the created event
      const { getEventById } = await import('@/services/liveEventService');
      const createdEvent = await getEventById(eventId);
      
      if (createdEvent) {
        setEvent(createdEvent);
        setHasActiveEvent(true);
      }
      
      alert(`✅ Event created!\n\nPIN: ${pin}\n\nShare this PIN with participants or show the QR code.`);
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(`Failed to create event: ${error.message}`);
    }
  };
  
  const handleStartEvent = async () => {
    if (!event) return;
    
    if (participants.length === 0) {
      alert('No participants have joined yet. Wait for at least one participant before starting.');
      return;
    }
    
    try {
      // Initialize leaderboard with zero scores
      const { calculateLeaderboard } = await import('@/services/liveEventService');
      const competition = competitions.find(c => c.id === event.competitionId);
      if (competition) {
        await calculateLeaderboard(event.id, competition.questions, event.settings.enableFastestFingerBonus);
      }
      
      await updateEvent(event.id, {
        status: 'active',
        phase: 'countdown',
        startedAt: Date.now()
      });
      
      // Open projector view in new window
      window.open(`/live-event/projector/${event.id}`, '_blank');
    } catch (error) {
      console.error('Error starting event:', error);
      alert('Failed to start event');
    }
  };
  
  const handlePauseEvent = async () => {
    if (!event) return;
    
    try {
      await updateEvent(event.id, {
        status: 'paused',
        pausedAt: Date.now()
      });
    } catch (error) {
      console.error('Error pausing event:', error);
      alert('Failed to pause event');
    }
  };
  
  const handleResumeEvent = async () => {
    if (!event) return;
    
    try {
      const pauseDuration = event.pausedAt ? Date.now() - event.pausedAt : 0;
      await updateEvent(event.id, {
        status: 'active',
        pausedDuration: event.pausedDuration + pauseDuration,
        pausedAt: null
      });
    } catch (error) {
      console.error('Error resuming event:', error);
      alert('Failed to resume event');
    }
  };
  
  const handleNextQuestion = async () => {
    if (!event) return;
    
    try {
      // Get competition to access questions
      const competition = competitions.find(c => c.id === event.competitionId);
      if (!competition) {
        throw new Error('Competition not found');
      }
      
      // Calculate leaderboard before advancing
      const { calculateLeaderboard } = await import('@/services/liveEventService');
      await calculateLeaderboard(
        event.id,
        competition.questions,
        event.settings.enableFastestFingerBonus
      );
      
      // Check if this is the last question
      if (event.currentQuestionIndex >= competition.questions.length - 1) {
        // Move to results phase
        await updateEvent(event.id, {
          phase: 'results',
          status: 'completed',
          endedAt: Date.now()
        });
      } else {
        // Move to next question
        await updateEvent(event.id, {
          currentQuestionIndex: event.currentQuestionIndex + 1,
          phase: 'question',
          timerStartedAt: Date.now(),
          pausedDuration: 0,
          pausedAt: null
        });
      }
    } catch (error) {
      console.error('Error advancing question:', error);
      alert('Failed to advance question');
    }
  };
  
  const handleExtendTimer = async () => {
    if (!event) return;
    
    try {
      await updateEvent(event.id, {
        timerDuration: event.timerDuration + 15
      });
      
      alert('✅ Added 15 seconds to timer');
    } catch (error) {
      console.error('Error extending timer:', error);
      alert('Failed to extend timer');
    }
  };
  
  const handleEndEvent = async () => {
    if (!event) return;
    
    const confirm = window.confirm(
      'Are you sure you want to end this event?\n\nThis will:\n- Stop the competition\n- Show final results\n- Archive results to Firestore\n- Delete guest data after 60 seconds'
    );
    
    if (!confirm) return;
    
    try {
      // Calculate final leaderboard
      const { calculateLeaderboard } = await import('@/services/liveEventService');
      const competition = competitions.find(c => c.id === event.competitionId);
      if (competition) {
        await calculateLeaderboard(
          event.id,
          competition.questions,
          event.settings.enableFastestFingerBonus
        );
      }
      
      // Update event status
      await updateEvent(event.id, {
        status: 'completed',
        phase: 'results',
        endedAt: Date.now()
      });
      
      // Archive and cleanup
      const { archiveAndCleanupEvent, logEventStatistics } = await import('@/services/liveEventService');
      await archiveAndCleanupEvent(event.id);
      await logEventStatistics(event.id);
      
      alert('✅ Event ended. Results archived and guest data will be deleted in 60 seconds.');
    } catch (error) {
      console.error('Error ending event:', error);
      alert('Failed to end event');
    }
  };
  
  const getJoinURL = () => {
    if (!event) return '';
    return `${window.location.origin}/live-event/join?pin=${event.pin}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading competitions...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl shadow-xl">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Trophy className="h-10 w-10" />
              Live Event Host Control
            </h1>
            <p className="text-purple-100 mt-2 text-lg">
              Create and manage real-time quiz competitions
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/competitions')}
            className="bg-white text-purple-600 hover:bg-purple-50 border-0 font-semibold"
          >
            ← Back
          </Button>
        </div>
        
        {/* Active Event Warning */}
        {hasActiveEvent && !event && (
          <Card className="border-2 border-orange-300 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-orange-900 mb-1">Active Event Detected</h3>
                  <p className="text-sm text-orange-700">
                    There is already an active event running. Only one event can be active at a time. 
                    Please end the current event before creating a new one.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!event ? (
          /* Step 1: Create Event */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Create New Live Event
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {competitions.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No live event competitions found.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Create a competition with "Live Event Mode" enabled first.
                  </p>
                  <Button onClick={() => navigate('/admin/create-competition')}>
                    Create Competition
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Competition
                    </label>
                    <select
                      value={selectedCompetition}
                      onChange={(e) => setSelectedCompetition(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">-- Select a competition --</option>
                      {competitions.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.title} ({comp.questionCount} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Button
                    onClick={handleCreateEvent}
                    disabled={!selectedCompetition || hasActiveEvent}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg py-6"
                  >
                    <Trophy className="h-6 w-6 mr-2" />
                    Create Live Event
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Step 2: Event Control Panel */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Event Info & QR Code */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <QRCodeSVG
                        value={getJoinURL()}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">PIN Code</p>
                      <p className="text-5xl font-bold text-purple-600 tracking-wider">
                        {event.pin}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        event.status === 'lobby' ? 'bg-blue-100 text-blue-800' :
                        event.status === 'active' ? 'bg-green-100 text-green-800' :
                        event.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Phase</span>
                      <span className="font-semibold">{event.phase}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({participants.length}/{event.maxParticipants})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {participants.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No participants yet
                      </p>
                    ) : (
                      participants.map((p) => (
                        <div
                          key={p.sessionId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Controls */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Host Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {event.status === 'lobby' && (
                      <Button
                        onClick={handleStartEvent}
                        className="col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
                      >
                        <Play className="h-6 w-6 mr-2" />
                        Start Event
                      </Button>
                    )}
                    
                    {event.status === 'active' && (
                      <>
                        <Button
                          onClick={handlePauseEvent}
                          variant="outline"
                          className="border-2"
                        >
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </Button>
                        
                        <Button
                          onClick={handleNextQuestion}
                          variant="outline"
                          className="border-2"
                        >
                          <SkipForward className="h-5 w-5 mr-2" />
                          Next Question
                        </Button>
                        
                        <Button
                          onClick={handleExtendTimer}
                          variant="outline"
                          className="border-2"
                        >
                          <Clock className="h-5 w-5 mr-2" />
                          +15 Seconds
                        </Button>
                        
                        <Button
                          onClick={handleEndEvent}
                          variant="destructive"
                        >
                          <StopCircle className="h-5 w-5 mr-2" />
                          End Event
                        </Button>
                      </>
                    )}
                    
                    {event.status === 'paused' && (
                      <>
                        <Button
                          onClick={handleResumeEvent}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Resume
                        </Button>
                        
                        <Button
                          onClick={handleEndEvent}
                          variant="destructive"
                        >
                          <StopCircle className="h-5 w-5 mr-2" />
                          End Event
                        </Button>
                      </>
                    )}
                    
                    {event.status === 'completed' && (
                      <div className="col-span-2 text-center py-8">
                        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Event Completed!
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Results are displayed on the projector view.
                        </p>
                        <Button
                          onClick={() => navigate('/admin/competitions')}
                          variant="outline"
                        >
                          Back to Competitions
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {event.status !== 'completed' && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => window.open(`/live-event/projector/${event.id}`, '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        <QrCode className="h-5 w-5 mr-2" />
                        Open Projector View
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
