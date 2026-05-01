// Practice Live Mode Teacher Dashboard
// Real-time monitoring and analytics for practice sessions

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Target,
  Users,
  TrendingUp,
  QrCode,
  StopCircle,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  listenToSession,
  listenToLeaderboard,
  listenToParticipants,
  calculatePracticeAnalytics
} from '@/services/practiceService';
import {
  PracticeSession,
  LeaderboardEntry,
  PracticeAnalytics
} from '@/types/practiceMode';

const BG_STYLE = { background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' };
const GLASS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
const GLASS_ROUNDED = { ...GLASS, borderRadius: '0.75rem' };

type SortField = 'name' | 'attemptCount' | 'worstScore' | 'bestScore' | 'lastScore' | 'lastDuration';
type SortDir = 'asc' | 'desc';

export default function PracticeTeacherDashboard() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [analytics, setAnalytics] = useState<PracticeAnalytics | null>(null);
  const [, setActiveParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>('bestScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [maskNames, setMaskNames] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const unsubscribeSession = listenToSession(sessionId, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
        setLoading(false);
      } else {
        setError('Session not found');
        setLoading(false);
      }
    });

    const unsubscribeLeaderboard = listenToLeaderboard(sessionId, setLeaderboard);
    const unsubscribeParticipants = listenToParticipants(sessionId, (p: any[]) => setActiveParticipants(p));

    return () => {
      unsubscribeSession();
      unsubscribeLeaderboard();
      unsubscribeParticipants();
    };
  }, [sessionId]);

  useEffect(() => {
    if (session && leaderboard.length > 0) {
      calculatePracticeAnalytics(session.id)
        .then(setAnalytics)
        .catch(console.error);
    }
  }, [session, leaderboard]);

  const getJoinURL = () => session ? `${window.location.origin}/practice/join?pin=${session.pin}` : '';

  const handleEndSession = async () => {
    if (!session) return;
    if (!window.confirm('Are you sure you want to end this practice session?')) return;
    alert('End session functionality will be implemented in Phase 4');
  };

  const handleDownloadStats = async () => {
    if (!captureRef.current || !session) return;
    setIsCapturing(true);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const el = captureRef.current;

      // Force minimum width so the output is never low-res
      const prevMinWidth = el.style.minWidth;
      el.style.minWidth = '700px';
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const { default: html2canvas } = await import('html2canvas');
      const raw = await html2canvas(el, {
        backgroundColor: '#0f0a1e',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1440,
      });

      el.style.minWidth = prevMinWidth;

      // Build header (at scale 2: 1px CSS = 2px canvas)
      const TITLE_H = 200;
      const PAD = 40;
      const interim = document.createElement('canvas');
      interim.width = raw.width;
      interim.height = raw.height + TITLE_H;

      const ic = interim.getContext('2d')!;
      const g = ic.createLinearGradient(0, 0, interim.width, interim.height);
      g.addColorStop(0, '#0f0a1e');
      g.addColorStop(0.5, '#1e0a3c');
      g.addColorStop(1, '#0a1628');
      ic.fillStyle = g;
      ic.fillRect(0, 0, interim.width, interim.height);

      ic.fillStyle = '#a78bfa';
      ic.font = 'bold 60px -apple-system, BlinkMacSystemFont, sans-serif';
      ic.fillText('quizist.ai daily stat', PAD, 76);

      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      ic.fillStyle = 'rgba(255,255,255,0.9)';
      ic.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
      ic.fillText(date, PAD, 128);

      ic.fillStyle = 'rgba(255,255,255,0.4)';
      ic.font = '28px -apple-system, BlinkMacSystemFont, sans-serif';
      ic.fillText(session.title, PAD, 172);

      ic.drawImage(raw, 0, TITLE_H);

      // Normalise to exactly 1200px wide — LinkedIn's sweet spot, no upscaling needed
      const TARGET_W = 1200;
      const ratio = TARGET_W / interim.width;
      const final = document.createElement('canvas');
      final.width = TARGET_W;
      final.height = Math.round(interim.height * ratio);
      const fc = final.getContext('2d')!;
      fc.imageSmoothingEnabled = true;
      fc.imageSmoothingQuality = 'high';
      fc.drawImage(interim, 0, 0, final.width, final.height);

      setIsCapturing(false);
      final.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `quizist-daily-stat-${new Date().toISOString().split('T')[0]}.jpg`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/jpeg', 0.97);
    } catch (e) {
      setIsCapturing(false);
      console.error('Screenshot failed', e);
    }
  };

  const handleDownloadQR = () => {
    if (!session) return;
    try {
      const svg = document.querySelector('#practice-qr-code');
      if (!svg) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 300; canvas.height = 300;
      const svgData = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
        canvas.toBlob(blob => {
          if (!blob) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `practice-qr-${session.pin}.png`;
          a.click();
        });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch { alert('Failed to download QR code'); }
  };

  // ── Sort helpers ────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    let av: any, bv: any;
    switch (sortField) {
      case 'name':         av = a.name.toLowerCase();       bv = b.name.toLowerCase();       break;
      case 'attemptCount': av = a.attemptCount;             bv = b.attemptCount;             break;
      case 'worstScore':   av = a.worstScore;               bv = b.worstScore;               break;
      case 'bestScore':    av = a.bestScore;                bv = b.bestScore;                break;
      case 'lastScore':    av = a.lastScore;                bv = b.lastScore;                break;
      case 'lastDuration': av = a.lastDuration ?? Infinity; bv = b.lastDuration ?? Infinity; break;
      default:             av = a.rank; bv = b.rank;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const maskName = (name: string) => {
    if (!maskNames) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase() + '***';
    return (parts[0][0] ?? '?').toUpperCase() + '. ' + (parts[parts.length - 1][0] ?? '?').toUpperCase() + '.';
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  const SortTh = ({ field, label, leftAlign }: { field: SortField; label: string; leftAlign?: boolean }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-4 py-2 text-xs font-medium text-white/50 uppercase cursor-pointer select-none hover:text-white/80 transition-colors ${leftAlign ? 'text-left' : 'text-center'}`}
    >
      <span className={`flex items-center gap-1 ${leftAlign ? '' : 'justify-center'}`}>
        {label}
        {sortField === field
          ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-purple-400" /> : <ChevronDown className="h-3 w-3 text-purple-400" />
          : <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </th>
  );

  // ── States ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={BG_STYLE}>
        <div className="text-center">
          <Target className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={BG_STYLE}>
        <div className="text-center">
          <Target className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/60 mb-4">{error || 'Session not found'}</p>
          <Button onClick={() => navigate('/admin/practice/manage')}>Back to Practice Sessions</Button>
        </div>
      </div>
    );
  }

  const statBlocks = [
    { label: 'Total Participants', value: analytics?.totalStudents || 0, color: 'text-blue-400', bg: 'rgba(59,130,246,0.15)', Icon: Users },
    { label: 'Total Attempts', value: analytics?.totalAttempts || 0, color: 'text-green-400', bg: 'rgba(34,197,94,0.15)', Icon: Target },
    { label: 'Average Score', value: `${analytics?.averageScore ? analytics.averageScore.toFixed(1) : '0.0'}%`, color: 'text-purple-400', bg: 'rgba(124,58,237,0.15)', Icon: TrendingUp },
    { label: 'Avg Attempts', value: analytics?.averageAttempts ? analytics.averageAttempts.toFixed(1) : '0.0', color: 'text-orange-400', bg: 'rgba(249,115,22,0.15)', Icon: Clock },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6" style={BG_STYLE}>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-xl shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8" />
              Practice Dashboard
            </h1>
            <p className="text-indigo-100 mt-1">{session.title}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/practice/manage')}
            className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 font-semibold"
          >
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column: Session Details ── */}
          <div className="lg:col-span-1">
            <div className="rounded-xl p-5 space-y-4 h-full" style={GLASS_ROUNDED}>
              <h2 className="flex items-center gap-2 text-white font-semibold">
                <QrCode className="h-5 w-5" /> Session Details
              </h2>

              <div className="text-center">
                <div className="bg-white p-3 rounded-lg inline-block">
                  <QRCodeSVG id="practice-qr-code" value={getJoinURL()} size={160} level="H" includeMargin />
                </div>
                <div className="mt-3">
                  <p className="text-xs text-white/50 mb-1">PIN Code</p>
                  <p className="text-4xl font-bold text-purple-400 tracking-wider">{session.pin}</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={() => { navigator.clipboard.writeText(session.pin); alert('PIN copied!'); }}
                    variant="outline" size="sm" className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent text-xs">
                    Copy PIN
                  </Button>
                  <Button onClick={handleDownloadQR}
                    variant="outline" size="sm" className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent text-xs">
                    Save QR
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${session.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}>
                    {session.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Created</span>
                  <span className="text-sm text-white">{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Ends</span>
                  <span className="text-sm text-white">{session.endDate ? new Date(session.endDate).toLocaleDateString() : 'No expiry'}</span>
                </div>
              </div>

              <Button onClick={handleEndSession} variant="destructive" className="w-full" disabled={session.status === 'ended'}>
                <StopCircle className="h-4 w-4 mr-2" /> End Session
              </Button>
            </div>
          </div>

          {/* ── Right column: Stats + Leaderboard ── */}
          <div ref={captureRef} className="lg:col-span-2 flex flex-col gap-4">

            {/* Statistics — compact row */}
            <div className="rounded-xl p-4" style={GLASS_ROUNDED}>
              <h2 className="flex items-center gap-2 text-white font-semibold mb-3">
                <BarChart3 className="h-4 w-4" /> Statistics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statBlocks.map(({ label, value, color, bg, Icon }) => (
                  <div key={label} className="flex flex-col items-center p-3 rounded-lg gap-1" style={{ background: bg }}>
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className={`text-xl font-bold ${color}`}>{value}</span>
                    <span className="text-xs text-white/50 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="rounded-xl flex flex-col flex-1 min-h-0" style={GLASS_ROUNDED}>
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <h2 className="flex items-center gap-2 text-white font-semibold">
                  <Users className="h-4 w-4" /> Leaderboard (Top 20)
                </h2>
                {!isCapturing && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadStats}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => setMaskNames(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                      style={{
                        background: maskNames ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: maskNames ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {maskNames ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {maskNames ? 'Hidden' : 'Mask'}
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-y-auto flex-1 min-h-0 px-2 pb-4" style={{ maxHeight: isCapturing ? 'none' : '420px' }}>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-8">
                    No attempts yet. Students will appear here after their first attempt.
                  </p>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0" style={{ background: 'rgba(15,10,30,0.95)' }}>
                      <tr>
                        <SortTh field="name"         label="Name"     leftAlign />
                        <SortTh field="attemptCount" label="Attempts" />
                        <SortTh field="worstScore"   label="Worst"    />
                        <SortTh field="bestScore"    label="Best"     />
                        <SortTh field="lastScore"    label="Last"     />
                        <SortTh field="lastDuration" label="Time"     />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedLeaderboard.slice(0, isCapturing ? 10 : 20).map((entry) => (
                        <tr key={entry.name} className="hover:bg-white/5">
                          <td className="px-4 py-2.5 font-medium text-white text-sm">{maskName(entry.name)}</td>
                          <td className="px-4 py-2.5 text-center text-white/60 text-sm">{entry.attemptCount}</td>
                          <td className="px-4 py-2.5 text-center font-semibold text-red-400 text-sm">{entry.worstScore}%</td>
                          <td className="px-4 py-2.5 text-center font-bold text-green-400 text-sm">{entry.bestScore}%</td>
                          <td className="px-4 py-2.5 text-center font-semibold text-purple-400 text-sm">{entry.lastScore}%</td>
                          <td className="px-4 py-2.5 text-center text-white/50 text-sm">{formatDuration(entry.lastDuration)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
