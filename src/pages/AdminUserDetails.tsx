import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getUserRole, 
  UserRole, 
  getUserCompetitionHistory, 
  getUserStatistics 
} from '@/components/ui/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import { 
  ArrowLeft, 
  Trophy, 
  Clock, 
  Target, 
  Award,
  Calendar
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
  disabled?: boolean;
  lastLoginAt?: any;
  lastActivityAt?: any;
}

export default function AdminUserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userId, user]);

  const loadUserData = async () => {
    if (!user?.uid || !userId) return;

    try {
      setLoading(true);

      // Check if current user is super admin
      const role = await getUserRole(user.uid);
      if (role !== UserRole.SUPER_ADMIN) {
        alert('Access denied. Only super admins can view user details.');
        navigate('/admin/users');
        return;
      }

      // Load user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        alert('User not found');
        navigate('/admin/users');
        return;
      }

      setUserData({
        id: userDoc.id,
        ...userDoc.data()
      } as UserData);

      // Load competition history
      const userHistory = await getUserCompetitionHistory(userId);
      setHistory(userHistory);

      // Load statistics
      const userStats = await getUserStatistics(userId);
      setStats(userStats);

    } catch (error: any) {
      console.error('Error loading user data:', error);
      alert('Failed to load user data: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{userData.displayName}</h1>
              <p className="text-gray-600 mt-1">{userData.email}</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium">{userData.role.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">{userData.disabled ? 'Disabled' : 'Active'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Joined</p>
                <p className="font-medium">{formatDate(userData.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="font-medium">{formatDate(userData.lastActivityAt || userData.lastLoginAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scholarship Performance */}
        {stats && stats.scholarship.attempts > 0 && (
          <Card className="mb-6 border-blue-300">
            <CardHeader className="bg-blue-100 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Trophy className="h-6 w-6 text-blue-700" />
                🏆 Scholarship Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Attempts</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.scholarship.attempts}</p>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                  <p className="text-3xl font-bold text-green-600">{stats.scholarship.averageScore.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Best Rank</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.scholarship.bestRank ? `#${stats.scholarship.bestRank}` : 'N/A'}</p>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Time</p>
                  <p className="text-3xl font-bold text-purple-600">{formatTime(stats.scholarship.totalTimeSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Practice Performance */}
        {stats && stats.practice.attempts > 0 && (
          <Card className="mb-6 border-green-300">
            <CardHeader className="bg-green-100 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Target className="h-6 w-6 text-green-700" />
                📚 Practice Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Attempts</p>
                  <p className="text-3xl font-bold text-green-600">{stats.practice.attempts}</p>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.practice.averageScore.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Best Score</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.practice.bestScore.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Time</p>
                  <p className="text-3xl font-bold text-orange-600">{formatTime(stats.practice.totalTimeSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Activity Message */}
        {stats && stats.totalAttempts === 0 && (
          <Card className="mb-6">
            <CardContent className="py-12 text-center text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No competition activity yet</p>
            </CardContent>
          </Card>
        )}

        {/* Competition History */}
        <Card>
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="h-6 w-6 text-gray-700" />
              📅 Complete Activity History ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No competition history</p>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 border-l-4 rounded-lg hover:bg-gray-50 ${
                      entry.type === 'scholarship' 
                        ? 'border-l-blue-500 bg-blue-50/30' 
                        : 'border-l-green-500 bg-green-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {entry.type === 'scholarship' ? (
                            <Trophy className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Target className="h-5 w-5 text-green-600" />
                          )}
                          <h3 className="font-medium text-gray-900">{entry.competitionTitle}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.type === 'scholarship' 
                              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                              : 'bg-green-100 text-green-800 border border-green-300'
                          }`}>
                            {entry.type === 'scholarship' ? '🏆 SCHOLARSHIP' : '📚 PRACTICE'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>Score: {entry.score}/{entry.totalQuestions} ({((entry.score / entry.totalQuestions) * 100).toFixed(1)}%)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(entry.timeSpent)}</span>
                          </div>
                          {entry.rank && (
                            <div className="flex items-center gap-1 font-medium text-yellow-700">
                              <Award className="h-4 w-4" />
                              <span>Rank: #{entry.rank}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(entry.completedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
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
