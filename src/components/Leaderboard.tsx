import { useEffect, useState } from 'react';
import { getLeaderboard } from '@/components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  rank: number;
  userName: string;
  school?: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  userId: string;
}

interface LeaderboardProps {
  competitionId: string;
  currentUserId?: string;
  autoRefresh?: boolean;
}

export default function Leaderboard({ competitionId, currentUserId, autoRefresh = false }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();

    if (autoRefresh) {
      const interval = setInterval(loadLeaderboard, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [competitionId, autoRefresh]);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(competitionId);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'bg-gray-50 border-gray-300';
    if (rank === 3) return 'bg-orange-50 border-orange-200';
    return '';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 py-8">
            No submissions yet. Be the first to compete!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">School</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Score</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    entry.userId === currentUserId ? 'bg-indigo-50 font-semibold' : ''
                  } ${getRankColor(entry.rank)}`}
                >
                  <td className="py-3 px-4">
                    <span className="text-2xl">{getRankIcon(entry.rank)}</span>
                  </td>
                  <td className="py-3 px-4">
                    {entry.userName}
                    {entry.userId === currentUserId && (
                      <span className="ml-2 text-xs text-indigo-600">(You)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {entry.school || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold">
                      {entry.score}/{entry.totalQuestions}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({Math.round((entry.score / entry.totalQuestions) * 100)}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-sm">
                    {formatTime(entry.timeSpent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
