import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Trash2,
  Users,
  Download,
  Share2
} from 'lucide-react';

const BG_STYLE = { background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' };
const DARK_CARD = 'bg-white/5 border border-white/10';

export default function AdminCompetitionSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allCompetitions, setAllCompetitions] = useState<any[]>([]);
  const [featuredCompetitionId, setFeaturedCompetitionId] = useState<string | null>(null);
  const [scholarshipCompetitions, setScholarshipCompetitions] = useState<any[]>([]);

  // Live Event History
  const [liveArchives, setLiveArchives] = useState<any[]>([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [expandedArchive, setExpandedArchive] = useState<string | null>(null);
  const [maskedArchives, setMaskedArchives] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  // Scroll to #history section when navigated directly via hash link
  useEffect(() => {
    if (location.hash === '#history' && !loading) {
      setTimeout(() => {
        document.getElementById('live-event-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash, loading]);

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
    await loadLiveArchives();
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

  const loadLiveArchives = async () => {
    try {
      setArchivesLoading(true);
      const { getLiveEventArchives } = await import('@/services/liveEventService');
      setLiveArchives(await getLiveEventArchives());
    } catch { /* silent */ } finally {
      setArchivesLoading(false);
    }
  };

  const handleDownloadArchive = (archive: any) => {
    const startedAt = archive.startedAt?.toDate ? archive.startedAt.toDate() : new Date(archive.startedAt);
    const dateStr = startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = startedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    const sorted = [...(archive.results || [])].sort((a: any, b: any) => a.rank - b.rank);

    const rankIcon = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r} `;
    const pad = (s: string, n: number) => s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);

    const rows = sorted.map((p: any) => {
      const correct = p.correctAnswers ?? Object.values(p.answers || {}).filter((a: any) => a.correct).length;
      const t = p.totalTime ?? Object.values(p.answers || {}).reduce((sum: number, a: any) => sum + (a.timeToAnswer || 0), 0);
      const elapsed = t > 0 ? `${t.toFixed(1)}s` : '—';
      return `${pad(rankIcon(p.rank), 5)}  ${pad(p.name ?? '?', 18)}  ${pad(String(p.score), 7)}  ${pad(`${correct}/${archive.totalQuestions || '?'}`, 7)}  ${elapsed}`;
    });

    const W = 54;
    const eq = '='.repeat(W);
    const divider = '-'.repeat(W);

    const top3 = sorted.slice(0, 3);
    const podiumIcons = ['🥇', '🥈', '🥉'];
    const podiumLines = top3.map((p: any) => {
      const correct = p.correctAnswers ?? Object.values(p.answers || {}).filter((a: any) => a.correct).length;
      return `${podiumIcons[p.rank - 1]}  ${pad(p.name ?? '?', 16)}  ${String(p.score).padStart(5)} pts  (${correct}/${archive.totalQuestions || '?'})`;
    });

    const lines = [
      `🏆 ${archive.competitionTitle}`,
      eq,
      `📅 ${dateStr} · ${timeStr}`,
      `👥 ${archive.participantCount} Participants · ${archive.totalQuestions || '?'} Questions · PIN: ${archive.pin}`,
      '',
      '        ✨ WINNERS ✨',
      ...podiumLines,
      '',
      eq,
      '   FULL LEADERBOARD',
      divider,
      `${'RANK '}  ${'NAME'.padEnd(18)}  ${'SCORE'.padEnd(7)}  ${'CORRECT'.padEnd(7)}  TIME`,
      divider,
      ...rows,
      divider,
      '',
      '📱 Powered by Quizist.AI · quizist.ai',
    ];

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${archive.competitionTitle.replace(/[^a-z0-9]/gi, '_')}_results.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteArchive = async (archiveId: string, title: string) => {
    if (!confirm(`Delete the results for "${title}"?\n\nThis permanently removes all scores and participant data for this event.`)) return;
    try {
      const { deleteLiveEventArchive } = await import('@/services/liveEventService');
      await deleteLiveEventArchive(archiveId);
      setLiveArchives(prev => prev.filter(a => a.id !== archiveId));
      if (expandedArchive === archiveId) setExpandedArchive(null);
    } catch { alert('Failed to delete archive'); }
  };

  const handleDeleteParticipant = async (archiveId: string, sessionId: string, name: string) => {
    if (!confirm(`Remove ${name} from this event's results?`)) return;
    try {
      const { deleteArchiveParticipant } = await import('@/services/liveEventService');
      await deleteArchiveParticipant(archiveId, sessionId);
      setLiveArchives(prev => prev.map(a =>
        a.id === archiveId
          ? { ...a, results: a.results.filter((r: any) => r.sessionId !== sessionId), participantCount: a.participantCount - 1 }
          : a
      ));
    } catch { alert('Failed to remove participant'); }
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
        {/* ── Live Event History ── */}
        <Card id="live-event-history" className={DARK_CARD}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5 text-purple-400" />
                  Live Event History
                </CardTitle>
                <p className="text-sm text-white/50 mt-1">
                  Archived results from all completed live events — stored permanently until you delete them
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadLiveArchives}
                disabled={archivesLoading}
                className="flex-shrink-0 text-white/60 border-white/20 hover:bg-white/10"
              >
                {archivesLoading ? '...' : '↻ Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {archivesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : liveArchives.length === 0 ? (
              <div className="text-center py-10">
                <Zap className="h-12 w-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No live event results yet.</p>
                <p className="text-white/30 text-xs mt-1">Results will appear here after each completed live event.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveArchives.map(archive => {
                  const isExpanded = expandedArchive === archive.id;
                  const startedAt = archive.startedAt?.toDate ? archive.startedAt.toDate() : new Date(archive.startedAt);
                  const sortedResults = [...(archive.results || [])].sort((a: any, b: any) => a.rank - b.rank);

                  return (
                    <div key={archive.id} className="rounded-2xl overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

                      {/* Row header */}
                      <div className="flex items-center gap-4 px-5 py-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{archive.competitionTitle}</p>
                          <p className="text-white/40 text-xs mt-0.5">
                            {startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' · '}
                            {startedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
                            {' · '}PIN {archive.pin}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-white/50 text-sm flex-shrink-0">
                          <Users className="h-4 w-4" />
                          {archive.participantCount}
                          <span className="text-white/30">·</span>
                          <span>{archive.totalQuestions || '?'}Q</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setMaskedArchives(prev => {
                              const next = new Set(prev);
                              next.has(archive.id) ? next.delete(archive.id) : next.add(archive.id);
                              return next;
                            })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={maskedArchives.has(archive.id)
                              ? { background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }
                              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                            {maskedArchives.has(archive.id) ? '👁️ Unmask' : '🙈 Mask Names'}
                          </button>
                          <button
                            onClick={() => setExpandedArchive(isExpanded ? null : archive.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd' }}>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {isExpanded ? 'Hide' : 'View'}
                          </button>
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/event-results/${archive.id}`;
                              if (navigator.share) {
                                navigator.share({ title: archive.competitionTitle, url });
                              } else {
                                navigator.clipboard.writeText(url);
                                alert('Share link copied!\n\n' + url);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
                            title="Share results link">
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </button>
                          <button
                            onClick={() => handleDownloadArchive(archive)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: 'rgba(34,197,94,0.12)', color: '#86efac' }}
                            title="Download results as text file">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteArchive(archive.id, archive.competitionTitle)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5' }}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Expanded leaderboard */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {sortedResults.length === 0 ? (
                            <p className="text-white/40 text-sm text-center py-6">No participant data</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                  <th className="px-5 py-2 text-left text-xs text-white/40 uppercase font-medium">Rank</th>
                                  <th className="px-3 py-2 text-left text-xs text-white/40 uppercase font-medium">Name</th>
                                  <th className="px-3 py-2 text-right text-xs text-white/40 uppercase font-medium">Score</th>
                                  <th className="px-3 py-2 text-right text-xs text-white/40 uppercase font-medium">Correct</th>
                                  <th className="px-3 py-2 text-right text-xs text-white/40 uppercase font-medium">Time</th>
                                  <th className="px-3 py-2 text-right text-xs text-white/40 uppercase font-medium w-10"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {sortedResults.map((p: any) => (
                                  <tr key={p.sessionId} className="hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3 font-bold text-white/80">
                                      {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                                    </td>
                                    <td className="px-3 py-3 text-white font-medium">
                                      {maskedArchives.has(archive.id)
                                        ? `${p.name?.[0] ?? '?'}${'*'.repeat(Math.max(1, (p.name?.length ?? 2) - 1))}`
                                        : p.name}
                                    </td>
                                    <td className="px-3 py-3 text-right text-purple-300 font-bold">{p.score}</td>
                                    <td className="px-3 py-3 text-right text-white/60">
                                      {p.correctAnswers ?? Object.values(p.answers || {}).filter((a: any) => a.correct).length}
                                      /{archive.totalQuestions || '?'}
                                    </td>
                                    <td className="px-3 py-3 text-right text-white/40 text-xs font-mono">
                                      {(() => {
                                        const t = p.totalTime ?? Object.values(p.answers || {}).reduce((sum: number, a: any) => sum + (a.timeToAnswer || 0), 0);
                                        return t > 0 ? `${t.toFixed(1)}s` : '—';
                                      })()}
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                      <button
                                        onClick={() => handleDeleteParticipant(archive.id, p.sessionId, p.name)}
                                        className="text-white/20 hover:text-red-400 transition-colors"
                                        title="Remove participant">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
