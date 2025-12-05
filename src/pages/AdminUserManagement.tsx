import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserRole, setUserRole, UserRole } from '@/components/ui/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import { Shield, Users, Crown, GraduationCap, AlertCircle } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
}

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) {
      console.log('No user ID found');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading user data for:', user.uid);

      // Check if current user is super admin
      const role = await getUserRole(user.uid);
      console.log('Current user role:', role);
      setCurrentUserRole(role);

      // Temporarily allow access for debugging
      // TODO: Re-enable this check after setting up first super admin
      // if (role !== UserRole.SUPER_ADMIN) {
      //   alert('Access denied. Only super admins can manage users.\n\nYour current role: ' + role + '\n\nPlease set your role to "super_admin" in Firebase Console first.');
      //   navigate('/');
      //   return;
      // }

      // Load all users
      console.log('Loading all users from Firestore...');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      console.log('Found', querySnapshot.size, 'users');

      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        console.log('User doc:', doc.id, doc.data());
        usersData.push({
          id: doc.id,
          ...doc.data()
        } as UserData);
      });

      setUsers(usersData);
      console.log('Users loaded:', usersData.length);
    } catch (error: any) {
      console.error('Error loading users:', error);
      alert('Failed to load users: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setUpdating(userId);
      await setUserRole(userId, newRole, currentUserRole);
      alert('✅ Role updated successfully!');
      await loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert('❌ ' + (error.message || 'Failed to update role'));
    } finally {
      setUpdating(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <Crown className="h-5 w-5 text-purple-600" />;
      case UserRole.ADMIN:
        return <Shield className="h-5 w-5 text-blue-600" />;
      case UserRole.TEACHER:
        return <GraduationCap className="h-5 w-5 text-green-600" />;
      default:
        return <Users className="h-5 w-5 text-gray-600" />;
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage user roles and permissions</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/competitions')}>
            Back to Admin
          </Button>
        </div>

        {/* Debug Info */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">Debug Info:</p>
              <ul className="space-y-1">
                <li>Your User ID: {user?.uid}</li>
                <li>Your Email: {user?.email}</li>
                <li>Your Current Role: <strong>{currentUserRole}</strong></li>
                <li>Users Found: <strong>{users.length}</strong></li>
              </ul>
              {currentUserRole === UserRole.STUDENT && (
                <p className="mt-3 text-red-600 font-medium">
                  ⚠️ You need to set your role to "super_admin" in Firebase Console first!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Role Hierarchy:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Super Admin:</strong> Full access, can manage all users and roles</li>
                  <li><strong>Admin:</strong> Can manage competitions, templates, and reset attempts</li>
                  <li><strong>Teacher:</strong> Can create competitions and view analytics</li>
                  <li><strong>Student:</strong> Can participate in competitions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((userData) => (
                <div
                  key={userData.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getRoleIcon(userData.role)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {userData.displayName}
                        {userData.id === user?.uid && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{userData.email}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userData.role)}`}>
                      {userData.role.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {userData.id !== user?.uid && (
                      <>
                        <select
                          value={userData.role}
                          onChange={(e) => handleRoleChange(userData.id, e.target.value as UserRole)}
                          disabled={updating === userData.id}
                          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={UserRole.STUDENT}>Student</option>
                          <option value={UserRole.TEACHER}>Teacher</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                          <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                        </select>
                      </>
                    )}
                    {userData.id === user?.uid && (
                      <span className="text-sm text-gray-500 px-3 py-2">
                        Cannot change own role
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
