import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getCompetitions,
  getAppSettings,
  setFeaturedCompetition,
  isAdmin,
  getPracticeParticipantCount,
  deleteCompetition
} from '../components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Star,
  Trophy,
  Plus,
  Brain
} from 'lucide-react';

const BG_STYLE = { background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' };
const DARK_CARD = 'bg-white/5 border border-white/10';

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

      const competitions = await getCompetitions();

      const competitionsWithCounts = await Promise.all(
        competitions.map(async (comp: any) => {
          const participantCount = comp.isPractice
            ? await getPracticeParticipantCount(comp.id)
            : comp.participantCount || 0;
          return { ...comp, participantCount };
        })
      );

      setAllCompetitions(competitionsWithCounts);

      const scholarships = competitionsWithCounts.filter(
        (c: any) => !c.isPractice
      );
      setScholarshipCompetitions(scholarships);

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

  const handleDeleteCompetition = async (competitionId: string, title: string) => {
    const confirmed = confirm(
      `⚠️ Are you sure you want to delete "${title}"?\n\n` +
      'This will permanently delete:\n' +
      '• The competition\n' +
      '• All participant data\n' +
      '• All leaderboard entries\n\n' +
      'This action CANNOT be undone!'
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteCompetition(competitionId);
      alert('✅ Competition deleted successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting competition:', error);
      alert('Failed to delete competition. Please try again.');
    } finally {
      setSaving(false);
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
    const styles: Record<string, string> = {
      upcoming: 'bg-blue-500/20 text-blue-300',
      active: 'bg-green-500/20 text-green-300',
      completed: 'bg-white/10 text-white/60'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status] || 'bg-white/10 text-white/60'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'practiceLive') {
      return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-300">🎯 PRACTICE LIVE</span>;
    }
    if (type === 'practice') {
      return <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/20 text-purple-300">🎯 PRACTICE</span>;
    }
    if (type === 'liveEvent') {
      return <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300">🎪 LIVE EVENT</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-300">🏆 SCHOLARSHIP</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={BG_STYLE}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={BG_STYLE}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="h-8 w-8 text-purple-400" />
              Competition Settings
            </h1>
            <p className="text-white/60 mt-1">
              Manage featured competition and view all competitions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/quiz-templates/list')}
              className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
            >
              <Brain className="h-4 w-4 mr-2" />
              Quiz Templates
            </Button>
            <Button
              onClick={() => navigate('/admin/create-competition')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Competition
            </Button>
          </div>
        </div>

        {/* Featured Competition Section */}
        <Card className="border border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Star className="h-6 w-6 text-yellow-400" />
              Featured Scholarship Competition
            </CardTitle>
            <p className="text-sm text-white/50 mt-1">
              This competition will be displayed on the landing page (/scholarship) for students to register
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Select Competition to Feature
              </label>
              <select
                value={featuredCompetitionId || ''}
                onChange={(e) => setFeaturedCompetitionId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg text-white"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                disabled={saving}
              >
                <option value="" style={{ background: '#1e0a3c' }}>-- No Featured Competition --</option>
                {scholarshipCompetitions.map((comp) => (
                  <option key={comp.id} value={comp.id} style={{ background: '#1e0a3c' }}>
                    {comp.title} ({formatDate(comp.startDate)})
                  </option>
                ))}
              </select>
              {scholarshipCompetitions.length === 0 && (
                <p className="text-sm text-yellow-400/80 mt-2">
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
                  className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent"
                >
                  Clear Featured
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Competitions Table */}
        <Card className={DARK_CARD}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-yellow-400" />
              All Competitions
            </CardTitle>
            <p className="text-sm text-white/50 mt-1">
              View and manage all practice tests and scholarship competitions
            </p>
          </CardHeader>
          <CardContent>
            {allCompetitions.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No competitions created yet</p>
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
                  <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Participants</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Featured</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allCompetitions.map((comp) => (
                      <tr key={comp.id} className="hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{comp.title}</div>
                          <div className="text-sm text-white/40 truncate max-w-xs">{comp.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          {getTypeBadge(comp.isPracticeLive ? 'practiceLive' : comp.isPractice ? 'practice' : comp.isLiveEvent ? 'liveEvent' : 'competition')}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(comp.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60">
                          <div>{formatDate(comp.startDate)}</div>
                          <div className="text-xs text-white/40">to {formatDate(comp.endDate)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60">
                          {comp.participantCount || 0}
                        </td>
                        <td className="px-4 py-3">
                          {comp.id === featuredCompetitionId && (
                            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (comp.isPracticeLive || comp.type === 'practiceLive') {
                                  navigate('/admin/practice/manage');
                                } else if (comp.isLiveEvent || comp.type === 'liveEvent') {
                                  navigate(`/live-event/${comp.id}/host`);
                                } else {
                                  navigate(`/competitions/${comp.id}`);
                                }
                              }}
                              className="px-3 py-1 text-sm bg-blue-500/80 text-white rounded hover:bg-blue-500 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/admin/competitions/${comp.id}/edit`)}
                              className="px-3 py-1 text-sm bg-green-600/80 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCompetition(comp.id, comp.title)}
                              disabled={saving}
                              className="px-3 py-1 text-sm bg-red-600/80 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Delete
                            </button>
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
