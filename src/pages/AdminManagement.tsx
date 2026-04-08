// Admin Management Page
// Allows existing admins to add/remove other admins
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isAdmin, getAllAdmins, addAdmin, removeAdmin } from '@/components/ui/firebase';
import { Shield, UserPlus, UserMinus, AlertCircle } from 'lucide-react';

export default function AdminManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) {
      navigate('/');
      return;
    }

    await loadAdmins();
    setLoading(false);
  };

  const loadAdmins = async () => {
    try {
      const adminList = await getAllAdmins();
      setAdmins(adminList);
    } catch (error) {
      console.error('Error loading admins:', error);
      setError('Failed to load admin list');
    }
  };

  const handleAddAdmin = async () => {
    setError('');
    setSuccess('');

    if (!newAdminUserId || !newAdminEmail || !newAdminName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await addAdmin(newAdminUserId, newAdminEmail, newAdminName);
      setSuccess(`Admin added: ${newAdminEmail}`);
      setNewAdminUserId('');
      setNewAdminEmail('');
      setNewAdminName('');
      await loadAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      setError('Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove admin access for ${email}?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await removeAdmin(adminId);
      setSuccess(`Admin removed: ${email}`);
      await loadAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      setError('Failed to remove admin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Shield className="h-10 w-10 text-purple-600" />
          Admin Management
        </h1>
        <p className="text-gray-600">Manage administrator access for the platform</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Add Admin Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID (Firebase UID)
              </label>
              <input
                type="text"
                value={newAdminUserId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdminUserId(e.target.value)}
                placeholder="Enter Firebase User ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                The user must sign in first. Get their UID from the Users page.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdminName(e.target.value)}
                placeholder="Admin Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <Button
              onClick={handleAddAdmin}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Admins ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No admins found</p>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{admin.displayName}</div>
                    <div className="text-sm text-gray-600">{admin.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Added: {admin.addedAt ? new Date(admin.addedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={admin.id === user?.uid}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How to Add an Admin</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>1. The user must sign in to the platform at least once</p>
          <p>2. Go to the Users page to find their Firebase User ID (UID)</p>
          <p>3. Copy their UID, email, and name</p>
          <p>4. Paste the information in the form above and click "Add Admin"</p>
          <p>5. The user will immediately have admin access</p>
        </CardContent>
      </Card>
    </div>
  );
}
