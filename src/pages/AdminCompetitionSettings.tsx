import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getCompetitions,
  getAppSettings,
  setFeaturedCompetition,
  isAdmin,
  getPracticeParticipantCount
} from '../components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Star,
  Trophy,
  Edit,
  Eye,
  Plus
} from 'lucide-react';

export default function AdminCompetitionSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [allCompetitions, setAllCompetitions] = useState<any[]>([]);
  const [featuredCompetitionId, setFeaturedCompetitionId] = useState<string | null>(null);
  const [scholarshipCompetitions, setScholarshipCompetitions] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) {
      alert('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    await loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all competitions
      const competitions = await getCompetitions();
      
      // Get correct participant counts for each competition
      const competitionsWithCounts = await Promise.all(
        competitions.map(async (comp: any) => {
          // For practice tests, get unique participant count from practiceAttempts
          // For scholarship competitions, use the participantCount from competition document
          const participantCount = comp.isPractice 
            ? await getPracticeParticipantCount(comp.id)
            : comp.participantCount || 0;
          
          return { ...comp, participantCount };
        })
      );
      
      setAllCompetitions(competitionsWithCounts);
      
      // Filter scholarship competitions (not practice)
      const scholarships = competitionsWithCounts.filter(
        (c: any) => !c.isPractice
      );
      setScholarshipCompetitions(scholarships);
      
      // Load featured competition setting
      const settings = await getAppSettings();
      setFeaturedCompetitionId(settings?.featuredCompetitionId || null);
      
      console.log('✅ Loaded:', competitions.length, 'competitions');
      console.log('⭐ Featured:', settings?.featuredCompetitionId);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSetFeatured = async () => {
    if (!featuredCompetitionId) {
      alert('Please select a competition to feature');
      return;
    }

    try {
      setSaving(true);
      await setFeaturedCompetition(featuredCompetitionId);
      alert('✅ Featured competition updated! The landing page will now show this competition.');
      await loadData();
    } catch (error) {
      console.error('❌ Error setting featured competition:', error);
      alert('Failed to update featured competition');
    } finally {
      setSaving(false);
    }
  };

  const handleClearFeatured = async () => {
    if (!confirm('Remove featured competition from landing page?')) return;

    try {
      setSaving(true);
      await setFeaturedCompetition(null);
      setFeaturedCompetitionId(null);
      alert('✅ Featured competition cleared');
      await loadData();
    } catch (error) {
      console.error('❌ Error clearing featured competition:', error);
      alert('Failed to clear featured competition');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'practice') {
      return <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">🎯 PRACTICE</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">🏆 SCHOLARSHIP</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8 text-indigo-600" />
              Competition Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage featured competition and view all competitions
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/create-competition')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Competition
          </Button>
        </div>

        {/* Featured Competition Section */}
        <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Star className="h-6 w-6 text-yellow-600" />
              Featured Scholarship Competition
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              This competition will be displayed on the landing page (/scholarship) for students to register
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Competition to Feature
              </label>
              <select
                value={featuredCompetitionId || ''}
                onChange={(e) => setFeaturedCompetitionId(e.target.value || null)}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={saving}
              >
                <option value="">-- No Featured Competition --</option>
                {scholarshipCompetitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.title} ({formatDate(comp.startDate)})
                  </option>
                ))}
              </select>
              {scholarshipCompetitions.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ No scholarship competitions available. Create one first using "New Competition" button.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSetFeatured}
                disabled={saving || !featuredCompetitionId}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Star className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Set as Featured'}
              </Button>
              {featuredCompetitionId && (
                <Button
                  onClick={handleClearFeatured}
                  disabled={saving}
                  variant="outline"
                  className="border-gray-300"
                >
                  Clear Featured
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Competitions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              All Competitions
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              View and manage all practice tests and scholarship competitions
            </p>
          </CardHeader>
          <CardContent>
            {allCompetitions.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No competitions created yet</p>
                <Button
                  onClick={() => navigate('/admin/create-competition')}
                  className="mt-4"
                >
                  Create Your First Competition
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allCompetitions.map((comp) => (
                      <tr key={comp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{comp.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{comp.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          {getTypeBadge(comp.isPractice ? 'practice' : 'competition')}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(comp.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{formatDate(comp.startDate)}</div>
                          <div className="text-xs text-gray-400">to {formatDate(comp.endDate)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {comp.participantCount || 0}
                        </td>
                        <td className="px-4 py-3">
                          {comp.id === featuredCompetitionId && (
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/competitions/${comp.id}`)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/competitions/${comp.id}/edit`)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
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
