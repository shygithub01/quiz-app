import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getUserRole, 
  setUserRole, 
  UserRole, 
  setUserStatus,
  deleteUserData,
  getUserCompetitionHistory,
  getUserStatistics
} from '@/components/ui/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Crown, 
  GraduationCap, 
  Ban, 
  CheckCircle,
  Trash2,
  Trophy,
  Clock,
  Target,
  TrendingUp
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

interface CompetitionAttempt {
  id: string;
  userId: string;
  competitionId: string;
  competitionTitle: string;
  isPractice: boolean;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  rank?: number;
  completedAt: Date;
}

interface UserStats {
  totalCompetitions: number;
  practiceTests: number;
  scholarshipCompetitions: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
}

export default function AdminUserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [competitionHistory, setCompetitionHistory] = useState<CompetitionAttempt[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId, user]);

  const loadData = async () => {
    if (!user?.uid || !userId) return;

    try {
      setLoading(true);

      // Check if current user is super admin
      const role = await getUserRole(user.uid);
      setCurrentUserRole(role);

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
      const history = await getUserCompetitionHistory(userId);
      setCompetitionHistory(history);

      // Load statistics
      const userStats = await getUserStatistics(userId);
      setStats(userStats);

    } catch (error: any) {
      console.error('Error loading user details:', error);
      alert('Failed to load user details: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!userData) return;
    
    const action = userData.disabled ? 'enable' : 'disable';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      setUpdating(true);
      await setUserStatus(userData.id, !userData.disabled);
      alert(`✅ User ${action}d successfully!`);
      await loadData();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alert('❌ ' + (error.message || 'Failed to update user status'));
    } finally {
      setUpdating(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!userData) return;
    
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setUpdating(true);
      await setUserRole(userData.id, newRole, currentUserRole);
      alert('✅ Role updated successfully!');
      await loadData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert('❌ ' + (error.message || 'Failed to update role'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userData) return;
    
    const confirmText = `DELETE ${userData.displayName}`;
    const userInput = prompt(
      `⚠️ WARNING: This will permanently delete all user data including:\n` +
      `- User profile\n` +
      `- All competition attempts\n` +
      `- Leaderboard entries\n` +
      `- Scholarship registration\n\n` +
      `Type "${confirmText}" to confirm deletion:`
    );

    if (userInput !== confirmText) {
      alert('Deletion cancelled - text did not match');
      return;
    }

    try {
      setUpdating(true);
      await deleteUserData(userData.id);
      alert('✅ User deleted successfully!');
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('❌ ' + (error.message || 'Failed to delete user'));
      setUpdating(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <Crown className="h-6 w-6 text-purple-600" />;
      case UserRole.ADMIN:
        return <Shield className="h-6 w-6 text-blue-600" />;
      case UserRole.TEACHER:
        return <GraduationCap className="h-6 w-6 text-green-600" />;
      default:
        return <Users className="h-6 w-6 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case UserRole.ADMIN:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case UserRole.TEACHER:
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
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
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <Button onClick={() => navigate('/admin/users')} className="mt-4">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/users')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {getRoleIcon(userData.role)}
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {userData.displayName}
                      </h1>
                      {userData.disabled ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                          <Ban className="h-4 w-4" />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{userData.email}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(userData.role)}`}>
                        {userData.role.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {formatDate(userData.createdAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Last login: {formatDate(userData.lastLoginAt || userData.lastActivityAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {userData.id !== user?.uid && (
                    <>
                      <Button
                        variant={userData.disabled ? "default" : "destructive"}
                        onClick={handleToggleUserStatus}
                        disabled={updating}
                        className="flex items-center gap-2"
                      >
                        {userData.disabled ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Enable User
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4" />
                            Disable User
                          </>
                        )}
                      </Button>

                      <select
                        value={userData.role}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        disabled={updating}
                        className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={UserRole.STUDENT}>Student</option>
                        <option value={UserRole.TEACHER}>Teacher</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                        <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                      </select>

                      <Button
                        variant="destructive"
                        onClick={handleDeleteUser}
                        disabled={updating}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete User
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Competitions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCompetitions}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.practiceTests} practice, {stats.scholarshipCompetitions} scholarship
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Best Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.bestScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Time</p>
                    <p className="text-2xl font-bold text-gray-900">{formatTotalTime(stats.totalTimeSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Competition History */}
        <Card>
          <CardHeader>
            <CardTitle>Competition History ({competitionHistory.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {competitionHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No competition attempts yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Competition</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitionHistory.map((attempt) => (
                      <tr key={attempt.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{attempt.competitionTitle}</div>
                        </td>
                        <td className="py-3 px-4">
                          {attempt.isPractice ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Practice
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Scholarship
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">
                            {attempt.score}/{attempt.totalQuestions}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            ({Math.round((attempt.score / attempt.totalQuestions) * 100)}%)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatTime(attempt.timeSpent)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {attempt.completedAt.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          {attempt.rank ? (
                            <span className="font-medium text-gray-900">#{attempt.rank}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
