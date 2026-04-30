import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getArchiveById } from '@/services/liveEventService';

const BG = 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 45%, #0a1628 100%)';

function formatDate(ts: any): string {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

export default function EventResultsCard() {
  const { archiveId } = useParams<{ archiveId: string }>();
  const [archive, setArchive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!archiveId) return;
    getArchiveById(archiveId).then(data => {
      setArchive(data);
      setLoading(false);
    });
  }, [archiveId]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: archive?.competitionTitle, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!archive) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: BG }}>
        <div className="text-center text-white">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-white/60 font-semibold">Results not found</p>
          <p className="text-white/30 text-sm mt-2">This link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  const sorted = [...(archive.results || [])].sort((a: any, b: any) => a.rank - b.rank);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const podiumOrder = top3.length >= 2 ? [top3[1], top3[0], top3[2]].filter(Boolean) : top3;
  const podiumHeight = ['h-24', 'h-32', 'h-20'];
  const podiumHeightFor = (rank: number) => rank === 1 ? podiumHeight[1] : rank === 2 ? podiumHeight[0] : podiumHeight[2];
  const medalColor = (rank: number) => rank === 1 ? '#facc15' : rank === 2 ? '#94a3b8' : '#fb923c';
  const medalEmoji = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: BG, paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Header */}
      <div className="px-5 pt-10 pb-6 text-center">
        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Event Results</p>
        <h1 className="text-2xl font-black text-white leading-tight">{archive.competitionTitle}</h1>
        <p className="text-white/40 text-sm mt-1">{formatDate(archive.startedAt)}</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-white/50 text-xs font-semibold">
          <span>👥 {archive.participantCount} players</span>
          <span>·</span>
          <span>❓ {archive.totalQuestions} questions</span>
        </div>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-end justify-center gap-3">
            {podiumOrder.map((p: any) => (
              <div key={p.sessionId || p.name} className="flex flex-col items-center gap-1" style={{ flex: p.rank === 1 ? '0 0 38%' : '0 0 28%' }}>
                <p className="text-2xl">{medalEmoji(p.rank)}</p>
                <p className="text-white font-black text-center text-sm leading-tight px-1 truncate w-full text-center">{p.name}</p>
                <p className="font-black text-sm" style={{ color: medalColor(p.rank) }}>{p.score} pts</p>
                <p className="text-white/30 text-xs">{p.correctAnswers ?? 0}/{archive.totalQuestions}</p>
                <div className={`w-full rounded-t-xl ${podiumHeightFor(p.rank)} flex items-center justify-center`}
                  style={{ background: p.rank === 1 ? 'rgba(250,204,21,0.15)' : p.rank === 2 ? 'rgba(148,163,184,0.12)' : 'rgba(251,146,60,0.12)', border: `1px solid ${p.rank === 1 ? 'rgba(250,204,21,0.3)' : p.rank === 2 ? 'rgba(148,163,184,0.2)' : 'rgba(251,146,60,0.2)'}` }}>
                  <span className="text-3xl">{p.rank === 1 ? '👑' : p.rank === 2 ? '🥈' : '🥉'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full leaderboard */}
      <div className="flex-1 px-4 pb-6">
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-white font-bold text-sm">Full Leaderboard</span>
            <span className="text-white/30 text-xs ml-auto">{sorted.length} players</span>
          </div>

          {/* Top 3 in list */}
          {top3.map((p: any) => (
            <div key={p.sessionId || p.name} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-lg w-7 text-center flex-shrink-0">{medalEmoji(p.rank)}</span>
              <span className="flex-1 text-white font-bold text-sm truncate">{p.name}</span>
              <span className="font-black text-sm flex-shrink-0" style={{ color: medalColor(p.rank) }}>{p.score}</span>
              <span className="text-white/30 text-xs flex-shrink-0 w-12 text-right">{p.correctAnswers ?? 0}/{archive.totalQuestions}</span>
            </div>
          ))}

          {/* Rest */}
          {rest.map((p: any) => (
            <div key={p.sessionId || p.name} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span className="text-white/30 font-bold text-xs w-7 text-center flex-shrink-0">#{p.rank}</span>
              <span className="flex-1 text-white/80 text-sm truncate">{p.name}</span>
              <span className="text-white font-bold text-sm flex-shrink-0">{p.score}</span>
              <span className="text-white/30 text-xs flex-shrink-0 w-12 text-right">{p.correctAnswers ?? 0}/{archive.totalQuestions}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share + branding */}
      <div className="px-4 pb-8 space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
          style={{ background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`, color: copied ? '#6ee7b7' : 'white' }}
        >
          {copied ? '✓ Link Copied!' : '🔗 Share These Results'}
        </button>

        <div className="text-center">
          <p className="text-white/20 text-xs font-semibold tracking-wider">Powered by</p>
          <p className="text-white/40 text-sm font-black tracking-wide">Quizist.AI</p>
          <p className="text-white/15 text-xs mt-0.5">quizist.ai</p>
        </div>
      </div>
    </div>
  );
}
