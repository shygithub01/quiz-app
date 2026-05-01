import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, ExternalLink, Trash2, ChevronDown, ChevronUp, Calendar, Infinity, Download, Clock } from 'lucide-react';
import { getCompetitions, auth, realtimeDb } from '@/components/ui/firebase';
import { ref, get } from 'firebase/database';
import {
  createPracticeSession,
  endPracticeSession,
  getActivePracticeSessionForCompetition
} from '@/services/practiceService';
import { getActiveLiveEventForCompetition } from '@/services/liveEventService';
import { PracticeSession } from '@/types/practiceMode';

const BG = { background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' };
const CARD = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

function getDaysRemaining(endDate: number | null) {
  if (!endDate) return 'No expiry';
  const diff = endDate - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Ends today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PracticeLiveHost() {
  const navigate = useNavigate();

  // Create form
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [endType, setEndType] = useState<'none' | 'date'>('none');
  const [customEndDate, setCustomEndDate] = useState('');
  const [startType, setStartType] = useState<'now' | 'date'>('now');
  const [customStartDate, setCustomStartDate] = useState('');
  const [isDaily, setIsDaily] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Sessions list
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingSession, setEndingSession] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEnding, setBulkEnding] = useState(false);
  const [extendingSession, setExtendingSession] = useState<string | null>(null);
  const [extendEndDate, setExtendEndDate] = useState('');
  const [expandedLeaderboard, setExpandedLeaderboard] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const [allComps, snap] = await Promise.all([
        getCompetitions(),
        get(ref(realtimeDb, 'practiceSessions'))
      ]);

      setCompetitions(allComps);

      if (snap.exists()) {
        const active = Object.entries(snap.val())
          .map(([id, d]: [string, any]) => ({ id, ...d } as PracticeSession))
          .filter(s => s.createdBy === userId && s.status === 'active')
          .sort((a, b) => b.createdAt - a.createdAt);
        setSessions(active);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedCompetition) { alert('Please select a question bank'); return; }

    const competition = competitions.find(c => c.id === selectedCompetition);
    if (!competition) return;

    try {
      setCreating(true);

      const activeLive = await getActiveLiveEventForCompetition(selectedCompetition);
      if (activeLive) {
        alert(`⚠️ "${competition.title}" already has an active Live Event (PIN: ${activeLive.pin}).\n\nEnd the live event first.`);
        return;
      }

      const existingPractice = await getActivePracticeSessionForCompetition(selectedCompetition);
      if (existingPractice) {
        alert(`⚠️ "${competition.title}" already has an active Practice session (PIN: ${existingPractice.pin}).\n\nEnd the existing session first.`);
        return;
      }

      const endDate = endType === 'date' && customEndDate
        ? new Date(customEndDate).getTime()
        : null;

      const startDate = startType === 'date' && customStartDate
        ? new Date(customStartDate).getTime()
        : undefined;

      const settings = competition.practiceLiveSettings || {
        showLeaderboard: true,
        showExplanations: true,
        maxQuestions: 20
      };

      const { sessionId, pin } = await createPracticeSession(
        competition.id,
        competition.title,
        competition.description || '',
        settings,
        auth.currentUser?.uid || '',
        endDate,
        startDate,
        isDaily
      );

      setShowCreate(false);
      setSelectedCompetition('');
      setEndType('none');
      setStartType('now');
      setCustomEndDate('');
      setCustomStartDate('');
      setIsDaily(false);

      await loadData();
      alert(`✅ Practice Session Created!\n\nPIN: ${pin}\n\nStudents can find and join from the home page, or enter the PIN directly.`);
      navigate(`/admin/practice/dashboard/${sessionId}`);
    } catch (err: any) {
      if (err.message?.includes('Maximum of 5')) {
        alert('⚠️ You have 5 active sessions (maximum). End one before creating a new one.');
      } else {
        alert(`Failed to create session: ${err.message}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEnd = async (sessionId: string, title: string) => {
    if (!confirm(`End "${title}"?\n\nThis will stop accepting new participants and free up a session slot.`)) return;
    try {
      setEndingSession(sessionId);
      await endPracticeSession(sessionId);
      setSelected(prev => { const n = new Set(prev); n.delete(sessionId); return n; });
      await loadData();
    } catch (err: any) {
      alert(`Failed to end session: ${err.message}`);
    } finally {
      setEndingSession(null);
    }
  };

  const handleDownloadCard = async (session: PracticeSession) => {
    try {
      const snap = await get(ref(realtimeDb, `practiceLeaderboard/${session.id}`));
      const entries = snap.exists()
        ? (Object.values(snap.val()) as any[]).sort((a, b) => a.rank - b.rank)
        : [];

      const pad = (s: string, n: number) => s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
      const rankIcon = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;
      const durLabel = (ms?: number) => {
        if (!ms) return '—';
        return ms >= 60000
          ? `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
          : `${(ms / 1000).toFixed(1)}s`;
      };

      const W = 54;
      const eq = '═'.repeat(W);
      const divider = '─'.repeat(W);
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const top3 = entries.slice(0, 3);
      const podiumLines = top3.map(e =>
        `${rankIcon(e.rank)}  ${pad(e.name ?? '?', 18)}  ${String(e.bestScore).padStart(3)}%  ${durLabel(e.lastDuration)}`
      );
      const rows = entries.map(e =>
        `${pad(rankIcon(e.rank), 4)}  ${pad(e.name ?? '?', 18)}  ${String(e.bestScore).padStart(3)}%  ${durLabel(e.lastDuration)}`
      );

      const lines = [
        `⚡ ${session.title}`,
        eq,
        `📅 ${today}`,
        `👥 ${session.statistics?.totalStudents || entries.length} Players`,
        '',
        '        ✨ TODAY\'S WINNERS ✨',
        ...podiumLines,
        '',
        eq,
        '   TODAY\'S LEADERBOARD',
        divider,
        `${'RANK'}  ${'NAME'.padEnd(18)}  ${'SCORE'.padEnd(5)}  TIME`,
        divider,
        ...rows,
        divider,
        '',
        '🧠 Play tomorrow → quizist.ai/daily',
        '📱 Powered by Quizist.AI · quizist.ai',
      ];

      const text = lines.join('\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.title.replace(/[^a-z0-9]/gi, '_')}_leaderboard.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to generate card: ' + err.message);
    }
  };

  const handleBulkEnd = async () => {
    if (selected.size === 0) return;
    if (!confirm(`End ${selected.size} selected session${selected.size > 1 ? 's' : ''}?\n\nThis cannot be undone.`)) return;
    try {
      setBulkEnding(true);
      await Promise.all([...selected].map(id => endPracticeSession(id)));
      setSelected(new Set());
      await loadData();
    } catch (err: any) {
      alert(`Failed to end sessions: ${err.message}`);
    } finally {
      setBulkEnding(false);
    }
  };

  const toggleLeaderboard = async (sessionId: string) => {
    if (expandedLeaderboard === sessionId) {
      setExpandedLeaderboard(null);
      return;
    }
    setExpandedLeaderboard(sessionId);
    if (!leaderboardData[sessionId]) {
      const snap = await get(ref(realtimeDb, `practiceLeaderboard/${sessionId}`));
      const entries = snap.exists()
        ? (Object.values(snap.val()) as any[]).sort((a, b) => a.rank - b.rank)
        : [];
      setLeaderboardData(prev => ({ ...prev, [sessionId]: entries }));
    }
  };

  const openExtend = (session: PracticeSession) => {
    // Pre-fill with current end date if set, otherwise now + 12h
    const ts = session.endDate && session.endDate > 0 ? session.endDate : Date.now() + 12 * 3600000;
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setExtendEndDate(local);
    setExtendingSession(session.id);
  };

  const handleSaveEndTime = async (sessionId: string) => {
    if (!extendEndDate) return;
    const ts = new Date(extendEndDate).getTime();
    if (isNaN(ts)) { alert('Invalid date'); return; }
    try {
      const { updateSession } = await import('@/services/practiceService');
      await updateSession(sessionId, { endDate: ts, status: 'active' });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, endDate: ts, status: 'active' } : s));
      setExtendingSession(null);
    } catch (err: any) {
      alert('Failed to update end time: ' + err.message);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    setSelected(selected.size === sessions.length ? new Set() : new Set(sessions.map(s => s.id)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={BG}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={BG}>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-emerald-400" />
              Practice Sessions
            </h1>
            <p className="text-white/40 text-sm mt-0.5">{sessions.length}/5 active</p>
          </div>
          <button
            onClick={() => setShowCreate(v => !v)}
            disabled={sessions.length >= 5}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #059669, #065f46)', color: 'white' }}
          >
            <Plus className="h-4 w-4" />
            New Session
            {showCreate ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Create form (collapsible) */}
        {showCreate && (
          <div className="rounded-2xl p-5 space-y-4" style={CARD}>
            <h2 className="text-white font-bold text-lg">Create Practice Session</h2>

            {/* Question bank picker */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">
                Question Bank
              </label>
              <select
                value={selectedCompetition}
                onChange={e => setSelectedCompetition(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white font-semibold"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <option value="" style={{ background: '#1e0a3c' }}>— Select a question bank —</option>
                {competitions.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1e0a3c' }}>
                    {c.title} ({c.questionCount || 0} questions)
                  </option>
                ))}
              </select>
            </div>

            {/* Start */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">
                Start
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(['now', 'date'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setStartType(t)}
                    className="py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: startType === t ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                      border: startType === t ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      color: startType === t ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                    }}>
                    {t === 'now' ? 'Start Now' : 'Scheduled Date'}
                  </button>
                ))}
              </div>
              {startType === 'date' && (
                <input type="datetime-local" value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-white text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
              )}
            </div>

            {/* End */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">
                End / Expiry
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(['none', 'date'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setEndType(t)}
                    className="py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: endType === t ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                      border: endType === t ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      color: endType === t ? '#6ee7b7' : 'rgba(255,255,255,0.4)',
                    }}>
                    {t === 'none' ? <><Infinity className="h-3.5 w-3.5" /> No Expiry</> : <><Calendar className="h-3.5 w-3.5" /> Set End Date</>}
                  </button>
                ))}
              </div>
              {endType === 'date' && (
                <input type="datetime-local" value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-white text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
              )}
            </div>

            {/* Daily Challenge toggle */}
            <button
              type="button"
              onClick={() => setIsDaily(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
              style={{
                background: isDaily ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.04)',
                border: isDaily ? '1px solid rgba(250,204,21,0.4)' : '1px solid rgba(255,255,255,0.1)',
              }}>
              <div className="text-left">
                <p className="font-bold text-sm" style={{ color: isDaily ? '#fde047' : 'rgba(255,255,255,0.5)' }}>
                  ⚡ Daily Challenge
                </p>
                <p className="text-xs mt-0.5" style={{ color: isDaily ? 'rgba(253,224,71,0.7)' : 'rgba(255,255,255,0.25)' }}>
                  Shows at quizist.ai/daily — shareable on social media
                </p>
              </div>
              <div className="flex-shrink-0 ml-3 w-11 h-6 rounded-full transition-all relative"
                style={{ background: isDaily ? '#ca8a04' : 'rgba(255,255,255,0.15)' }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: isDaily ? '22px' : '2px' }} />
              </div>
            </button>

            {/* Create button */}
            <button
              onClick={handleCreate}
              disabled={creating || !selectedCompetition}
              className="w-full py-4 rounded-xl font-black text-white text-base transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #059669, #065f46)' }}
            >
              {creating
                ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />Creating...</>
                : '+ Create Session'}
            </button>
          </div>
        )}

        {/* Active sessions */}
        {sessions.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={CARD}>
            <Target className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 font-semibold">No active practice sessions</p>
            <p className="text-white/30 text-sm mt-1">Create one to let students practice any time</p>
          </div>
        ) : (
          <>
            {/* Bulk action bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: selected.size === sessions.length ? '#a78bfa' : 'rgba(255,255,255,0.3)', background: selected.size === sessions.length ? 'rgba(167,139,250,0.3)' : 'transparent' }}>
                  {selected.size === sessions.length && <span className="text-purple-300 text-[10px] font-black">✓</span>}
                </span>
                {selected.size === sessions.length ? 'Deselect All' : 'Select All'}
              </button>

              {selected.size > 0 && (
                <button
                  onClick={handleBulkEnd}
                  disabled={bulkEnding}
                  className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)' }}
                >
                  {bulkEnding
                    ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                  End {selected.size} selected
                </button>
              )}
              <span className="ml-auto text-white/25 text-xs">{5 - sessions.length} slot{5 - sessions.length !== 1 ? 's' : ''} free</span>
            </div>

            <div className="space-y-2">
              {sessions.map(session => {
                const comp = competitions.find(c => c.id === session.competitionId);
                const isSelected = selected.has(session.id);
                const expiry = getDaysRemaining(session.endDate);
                const isExpired = expiry === 'Expired';
                return (
                  <div key={session.id} className="rounded-2xl p-4 transition-all"
                    style={{ ...CARD, borderColor: isSelected ? 'rgba(167,139,250,0.5)' : isExpired ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)', background: isSelected ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-start gap-3 mb-3">
                      {/* Checkbox */}
                      <button onClick={() => toggleSelect(session.id)}
                        className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        style={{ borderColor: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.25)', background: isSelected ? 'rgba(167,139,250,0.3)' : 'transparent' }}>
                        {isSelected && <span className="text-purple-300 text-xs font-black">✓</span>}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-sm truncate">{session.title}</h3>
                          {isExpired && <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>Expired</span>}
                        </div>
                        <p className="text-white/40 text-xs mt-0.5">{comp?.questionCount || 0} questions · {formatDate(session.createdAt)}</p>
                      </div>

                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handleDownloadCard(session)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                          style={{ background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.3)' }}
                          title="Download leaderboard card">
                          <Download className="h-3 w-3" />
                        </button>
                        <button onClick={() => openExtend(session)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                          style={{ background: 'rgba(251,191,36,0.15)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.3)' }}
                          title="Set / extend end time">
                          <Clock className="h-3 w-3" />
                        </button>
                        <button onClick={() => navigate(`/admin/practice/dashboard/${session.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                          style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                          title="Control page">
                          <ExternalLink className="h-3 w-3" />
                          <span>Control</span>
                        </button>
                        <button onClick={() => handleEnd(session.id, session.title)} disabled={endingSession === session.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                          {endingSession === session.id
                            ? <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <Trash2 className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Inline extend end time */}
                    {extendingSession === session.id && (
                      <div className="mb-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <Clock className="h-3.5 w-3.5 text-yellow-300 flex-shrink-0" />
                        <input
                          type="datetime-local"
                          value={extendEndDate}
                          onChange={e => setExtendEndDate(e.target.value)}
                          className="flex-1 bg-transparent text-yellow-200 text-xs font-bold outline-none"
                        />
                        <button onClick={() => handleSaveEndTime(session.id)}
                          className="px-3 py-1 rounded-lg text-xs font-black transition-all active:scale-95"
                          style={{ background: 'rgba(251,191,36,0.25)', color: '#fde68a' }}>
                          Save
                        </button>
                        <button onClick={() => setExtendingSession(null)}
                          className="text-white/30 text-xs hover:text-white/60 transition-colors">
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(167,139,250,0.1)' }}>
                        <p className="text-purple-300 font-black text-base tracking-wider">{session.pin}</p>
                        <p className="text-white/30 text-xs">PIN</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(52,211,153,0.08)' }}>
                        <p className="text-white font-bold text-base">{session.statistics?.totalStudents || 0}</p>
                        <p className="text-white/30 text-xs">Students</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-center" style={{ background: isExpired ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)' }}>
                        <p className={`font-bold text-sm ${isExpired ? 'text-red-400' : 'text-yellow-300'}`}>{expiry}</p>
                        <p className="text-white/30 text-xs">Expiry</p>
                      </div>
                    </div>

                    {/* Leaderboard toggle */}
                    <button
                      onClick={() => toggleLeaderboard(session.id)}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.99]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                    >
                      {expandedLeaderboard === session.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {expandedLeaderboard === session.id ? 'Hide Leaderboard' : 'View Leaderboard'}
                    </button>

                    {/* Inline leaderboard */}
                    {expandedLeaderboard === session.id && (
                      <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        {!leaderboardData[session.id] ? (
                          <div className="flex items-center justify-center py-4">
                            <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                          </div>
                        ) : leaderboardData[session.id].length === 0 ? (
                          <p className="text-center text-white/30 text-xs py-4">No players yet</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <th className="text-left px-3 py-2 text-white/30 font-semibold">#</th>
                                <th className="text-left px-3 py-2 text-white/30 font-semibold">Name</th>
                                <th className="text-right px-3 py-2 text-white/30 font-semibold">Score</th>
                                <th className="text-right px-3 py-2 text-white/30 font-semibold">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaderboardData[session.id].map((e, i) => {
                                const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`;
                                const ms = e.lastDuration ?? null;
                                const time = ms === null ? '—' : ms >= 60000 ? `${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s` : `${(ms/1000).toFixed(1)}s`;
                                return (
                                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                    <td className="px-3 py-2 text-base">{medal}</td>
                                    <td className="px-3 py-2 text-white font-semibold truncate max-w-[120px]">{e.name}</td>
                                    <td className="px-3 py-2 text-right text-emerald-300 font-bold">{e.bestScore}%</td>
                                    <td className="px-3 py-2 text-right text-white/40">{time}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
