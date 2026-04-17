// Practice Session Manager
// Allows teachers to view and manage all their active practice sessions

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Trash2, ExternalLink, Users, Calendar, Hash } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { realtimeDb, auth, getCompetitions } from '@/components/ui/firebase';
import { endPracticeSession } from '@/services/practiceService';
import { PracticeSession } from '@/types/practiceMode';

const BG_STYLE = { background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' };
const DARK_CARD = 'bg-white/5 border border-white/10';

export default function PracticeSessionManager() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [competitionData, setCompetitionData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [endingSession, setEndingSession] = useState<string | null>(null);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  const loadActiveSessions = async () => {
    try {
      setLoading(true);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Not authenticated');
      }

      console.log('📋 Loading sessions for user:', userId);

      const sessionsRef = ref(realtimeDb, 'practiceSessions');
      const snapshot = await get(sessionsRef);

      console.log('📋 Sessions snapshot exists:', snapshot.exists());

      if (!snapshot.exists()) {
        console.log('📋 No sessions found in database');
        setSessions([]);
        return;
      }

      const allSessions = snapshot.val();
      console.log('📋 All sessions:', Object.keys(allSessions).length);

      const activeSessions = Object.entries(allSessions)
        .map(([id, data]: [string, any]) => ({ id, ...data }))
        .filter((session: any) =>
          session.createdBy === userId &&
          session.status === 'active'
        )
        .sort((a: any, b: any) => b.createdAt - a.createdAt);

      console.log('📋 Active sessions for this user:', activeSessions.length);
      setSessions(activeSessions as PracticeSession[]);

      const { getQuizTemplate } = await import('@/components/ui/firebase');
      const competitions = await getCompetitions();
      const compData: Record<string, any> = {};

      for (const comp of competitions) {
        try {
          if (comp.quizTemplateId) {
            const template = await getQuizTemplate(comp.quizTemplateId);
            compData[comp.id] = {
              ...comp,
              questionCount: template?.questions?.length || comp.questionCount || 0
            };
          } else {
            compData[comp.id] = comp;
          }
        } catch (error) {
          console.error('Error loading template for competition:', comp.id, error);
          compData[comp.id] = comp;
        }
      }

      setCompetitionData(compData);
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      alert(`Failed to load sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async (sessionId: string, title: string) => {
    const confirmed = confirm(
      `Are you sure you want to end "${title}"?\n\nThis will:\n• Stop accepting new participants\n• Archive the session data\n• Free up a session slot`
    );

    if (!confirmed) return;

    try {
      setEndingSession(sessionId);
      await endPracticeSession(sessionId);
      alert('✅ Session ended successfully');
      await loadActiveSessions();
    } catch (error: any) {
      console.error('Error ending session:', error);
      alert(`Failed to end session: ${error.message}`);
    } finally {
      setEndingSession(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (endDate: number) => {
    const now = Date.now();
    const diff = endDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Expired';
    if (days === 0) return 'Ends today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={BG_STYLE}>
        <div className="text-center">
          <Target className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={BG_STYLE}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl shadow-xl">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Target className="h-10 w-10" />
              Manage Practice Sessions
            </h1>
            <p className="text-purple-100 mt-2 text-lg">
              {sessions.length} of 5 active sessions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/practice/host')}
              className="bg-white text-purple-600 hover:bg-purple-50 border-0 font-semibold"
            >
              + Create New
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/competitions')}
              className="bg-white text-purple-600 hover:bg-purple-50 border-0 font-semibold"
            >
              ← Back
            </Button>
          </div>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card className={DARK_CARD}>
            <CardContent className="py-12 text-center">
              <Target className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Active Sessions
              </h3>
              <p className="text-white/60 mb-6">
                You don't have any active practice sessions yet.
              </p>
              <Button
                onClick={() => navigate('/admin/practice/host')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Create Your First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className={`${DARK_CARD} hover:bg-white/10 transition-colors`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 text-white">{session.title}</CardTitle>
                      {session.description && (
                        <p className="text-sm text-white/60">{session.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/practice/dashboard/${session.id}`)}
                        className="border-indigo-400/50 text-indigo-300 hover:bg-indigo-500/20 bg-transparent"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Dashboard
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndSession(session.id, session.title)}
                        disabled={endingSession === session.id}
                        className="border-red-400/50 text-red-300 hover:bg-red-500/20 bg-transparent"
                      >
                        {endingSession === session.id ? (
                          <>
                            <Target className="h-4 w-4 mr-1 animate-spin" />
                            Ending...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            End
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 col-span-2">
                      <Hash className="h-5 w-5 text-purple-400" />
                      <div className="flex-1">
                        <p className="text-xs text-white/50">Session PIN</p>
                        <p className="font-bold text-2xl text-purple-400">{session.pin}</p>
                        {competitionData[session.competitionId] && (
                          <p className="text-sm text-white/50 mt-0.5">
                            {competitionData[session.competitionId].questionCount || 0} questions
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-400" />
                      <div>
                        <p className="text-xs text-white/50">Students</p>
                        <p className="font-bold text-lg text-white">{session.statistics?.totalStudents || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-xs text-white/50">Attempts</p>
                        <p className="font-bold text-lg text-white">{session.statistics?.totalAttempts || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-orange-400" />
                      <div>
                        <p className="text-xs text-white/50">Duration</p>
                        <p className="font-bold text-sm text-white">{getDaysRemaining(session.endDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
                    Created {formatDate(session.createdAt)}
                    {session.statistics?.averageScore !== undefined && (
                      <span className="ml-4">
                        • Avg Score: <span className="font-semibold text-white/70">{session.statistics.averageScore}%</span>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        {sessions.length > 0 && (
          <Card className="border border-purple-500/30 bg-purple-500/10">
            <CardContent className="pt-6">
              <h3 className="font-bold text-purple-300 mb-2">Session Management Tips</h3>
              <ul className="text-sm text-purple-200/70 space-y-1">
                <li>• You can have up to 5 active sessions at a time</li>
                <li>• End sessions you no longer need to free up slots</li>
                <li>• Ended sessions are automatically archived for 30 days</li>
                <li>• Click "Dashboard" to view real-time participant activity</li>
                <li>• Share the PIN with students to let them join</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
