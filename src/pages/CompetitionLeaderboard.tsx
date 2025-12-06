import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompetitionById, getLeaderboard } from '@/components/ui/firebase';
import { ArrowLeft, Trophy, Medal, Award, Clock, Target } from 'lucide-react';

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

export default function CompetitionLeaderboard() {
  const { id: competitionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [competitionId]);

  const loadData = async () => {
    if (!competitionId) return;

    try {
      setLoading(true);

      // Load competition details
      const comp = await getCompetitionById(competitionId);
      setCompetition(comp);

      // Load leaderboard
      const leaderboardData = await getLeaderboard(competitionId);
      setLeaderboard(leaderboardData);

    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-800">#{rank}</div>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-6">
            <button
              onClick={() => navigate(`/competitions/${competitionId}`)}
              className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Competition
            </button>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg p-6 mb-6">
              <h1 className="text-4xl font-bold mb-3">
                🏆 Competition Leaderboard
              </h1>
              <p className="text-2xl font-semibold text-amber-100 mb-4">{competition?.title}</p>
              
              {/* Competition Stats */}
              <div className="flex justify-center gap-8 text-amber-100">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">{leaderboard.length} Participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <span className="font-medium">50 Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    competition?.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {competition?.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No participants yet</p>
                <p className="text-sm">Be the first to take this competition!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                      entry.rank <= 3 
                        ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-16">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 ml-4">
                      <div className="font-bold text-lg text-gray-900">
                        {entry.userName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.userEmail}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Completed: {formatDate(entry.completedAt)}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-center mx-6">
                      <div className="text-2xl font-bold text-gray-900">
                        {entry.score}
                      </div>
                      <div className="text-xs text-gray-500">
                        out of {entry.totalQuestions}
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {Math.round((entry.score / entry.totalQuestions) * 100)}%
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-center mx-6">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{formatTime(entry.timeSpent)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        completion time
                      </div>
                    </div>

                    {/* Rank Badge */}
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${getRankBadgeColor(entry.rank)}`}>
                      #{entry.rank}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Competition Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(`/competitions/${competitionId}`)}
            className="px-8 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Back to Competition Details
          </button>
        </div>
      </div>
    </div>
  );
}