import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserRole, setUserRole, UserRole, setUserStatus } from '@/components/ui/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import { Shield, Users, Crown, GraduationCap, AlertCircle, Eye, Ban, CheckCircle, Search, ChevronLeft, ChevronRight, Mail } from 'lucide-react';

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

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 50;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Check if current user is super admin
      const role = await getUserRole(user.uid);
      setCurrentUserRole(role);

      if (role !== UserRole.SUPER_ADMIN) {
        alert('Access denied. Only super admins can manage users.');
        navigate('/');
        return;
      }

      // Load all users
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data()
        } as UserData);
      });

      setUsers(usersData);
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

  const handleViewDetails = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(userData => {
      // Search filter - ONLY search in display name
      const query = searchQuery.toLowerCase();
      const name = userData.displayName.toLowerCase();
      
      const matchesSearch = searchQuery === '' || name.includes(query);
      
      // Role filter
      const matchesRole = roleFilter === 'all' || userData.role === roleFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && !userData.disabled) ||
        (statusFilter === 'disabled' && userData.disabled);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const handleToggleUserStatus = async (userId: string, currentlyDisabled: boolean) => {
    const action = currentlyDisabled ? 'enable' : 'disable';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      setUpdating(userId);
      await setUserStatus(userId, !currentlyDisabled);
      alert(`✅ User ${action}d successfully!`);
      await loadData();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alert('❌ ' + (error.message || 'Failed to update user status'));
    } finally {
      setUpdating(null);
    }
  };

  const handleEditEmail = async (userId: string, currentEmail: string) => {
    const newEmail = prompt('Enter new email address:', currentEmail);
    if (!newEmail || newEmail === currentEmail) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert('❌ Invalid email format');
      return;
    }

    if (!confirm(`Are you sure you want to change email from\n${currentEmail}\nto\n${newEmail}?`)) {
      return;
    }

    try {
      setUpdating(userId);
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), { email: newEmail });
      alert('✅ Email updated successfully!');
      await loadData();
    } catch (error: any) {
      console.error('Error updating email:', error);
      alert('❌ ' + (error.message || 'Failed to update email'));
    } finally {
      setUpdating(null);
    }
  };

  const formatLastActivity = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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



        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value={UserRole.STUDENT}>Students</option>
                <option value={UserRole.TEACHER}>Teachers</option>
                <option value={UserRole.ADMIN}>Admins</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admins</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {paginatedUsers.length} of {filteredUsers.length} users
              {filteredUsers.length !== users.length && ` (filtered from ${users.length} total)`}
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
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paginatedUsers.map((userData) => (
                <div
                  key={userData.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                    {getRoleIcon(userData.role)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900">
                          {userData.displayName}
                          {userData.id === user?.uid && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                        </div>
                        {userData.disabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-sm text-gray-600">{userData.email}</div>
                        {userData.id !== user?.uid && (
                          <button
                            onClick={() => handleEditEmail(userData.id, userData.email)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit email"
                          >
                            <Mail className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userData.role)}`}>
                          {userData.role.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last activity: {formatLastActivity(userData.lastActivityAt || userData.lastLoginAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4 w-[180px]">
                    <button
                      onClick={() => handleViewDetails(userData.id)}
                      className="w-full px-3 py-2 border rounded-lg text-sm hover:bg-gray-100 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    
                    {userData.id !== user?.uid && (
                      <>
                        <select
                          value={userData.role}
                          onChange={(e) => handleRoleChange(userData.id, e.target.value as UserRole)}
                          disabled={updating === userData.id}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={UserRole.STUDENT}>Student</option>
                          <option value={UserRole.TEACHER}>Teacher</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                          <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                        </select>
                        
                        <button
                          onClick={() => handleToggleUserStatus(userData.id, userData.disabled || false)}
                          disabled={updating === userData.id}
                          className={`w-full px-3 py-2 border rounded-lg text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                            userData.disabled 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {userData.disabled ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Enable
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4" />
                              Disable
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {userData.id === user?.uid && (
                      <div className="text-xs text-gray-500 px-2 py-2 text-center border rounded-lg bg-gray-50">
                        Cannot modify own account
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              ))}

              {paginatedUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
                    ? 'No users match your filters' 
                    : 'No users found'}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredUsers.length > usersPerPage && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 border rounded-lg text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
