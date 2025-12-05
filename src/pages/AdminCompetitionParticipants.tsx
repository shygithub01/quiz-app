import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getCompetitionById, 
  getLeaderboard, 
  resetUserAttempt,
  isAdmin 
} from '@/components/ui/firebase';
import { Trash2, ArrowLeft, Users, Trophy, Clock } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  rank: number;
  completedAt: any;
}

export default function AdminCompetitionParticipants() {
  const { id: competitionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [competition, setCompetition] = useState<any>(null);
  const [participants, setParticipants] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [competitionId, user]);

  const loadData = async () => {
    if (!competitionId || !user?.uid) return;

    try {
      setLoading(true);

      // Check if user is admin
      const adminStatus = await isAdmin(user.uid);

      if (!adminStatus) {
        alert('Access denied. Admin only.');
        navigate('/');
        return;
      }

      // Load competition
      const comp = await getCompetitionById(competitionId);
      setCompetition(comp);

      // Load participants
      const leaderboard = await getLeaderboard(competitionId);
      setParticipants(leaderboard);

    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAttempt = async (userId: string, userName: string) => {
    if (!competitionId) return;

    const confirmed = confirm(
      `⚠️ Reset attempt for ${userName}?\n\n` +
      'This will:\n' +
      '• Delete their score from the leaderboard\n' +
      '• Allow them to retake the competition\n' +
      '• Remove their previous answers\n\n' +
      'This action cannot be undone!'
    );

    if (!confirmed) return;

    try {
      setResetting(userId);
      const result = await resetUserAttempt(userId, competitionId);

      if (result.success) {
        alert('✅ Attempt reset successfully!');
        await loadData(); // Refresh the list
      } else {
        alert('⚠️ ' + result.message);
      }
    } catch (error) {
      console.error('Error resetting attempt:', error);
      alert('❌ Failed to reset attempt');
    } finally {
      setResetting(null);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/competitions/${competitionId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Competition
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Participants
              </h1>
              <p className="text-gray-600 mt-2">{competition?.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-5 w-5" />
                <span className="font-medium">{participants.length} Participants</span>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/competitions/${competitionId}/edit`)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
              >
                ✏️ Edit Competition
              </Button>
            </div>
          </div>
        </div>

        {/* Participants List */}
        <Card>
          <CardHeader>
            <CardTitle>All Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No participants yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-800 font-bold">
                        #{participant.rank}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {participant.userName}
                          {participant.userId === user?.uid && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{participant.userEmail}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Completed: {formatDate(participant.completedAt)}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <Trophy className="h-4 w-4" />
                            <span className="text-xs">Score</span>
                          </div>
                          <div className="font-bold text-lg">
                            {participant.score}/{participant.totalQuestions}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round((participant.score / participant.totalQuestions) * 100)}%
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">Time</span>
                          </div>
                          <div className="font-bold text-lg">
                            {formatTime(participant.timeSpent)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetAttempt(participant.userId, participant.userName)}
                      disabled={resetting === participant.userId}
                      className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {resetting === participant.userId ? 'Resetting...' : 'Reset'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
