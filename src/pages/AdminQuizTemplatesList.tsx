// Admin Quiz Templates List - View, Edit, and Launch Quiz Templates
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../components/ui/firebase';
import { collection, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Zap, Target, X, Trophy, Clock, AlertTriangle, ArrowUpDown, ChevronUp, ChevronDown, GraduationCap } from 'lucide-react';

export default function AdminQuizTemplatesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);

  // Launch modal state
  const [launchTemplate, setLaunchTemplate] = useState<any>(null);
  const [launchMode, setLaunchMode] = useState<'liveEvent' | 'practiceLiveEvent' | 'scholarship' | 'scholarshipPractice' | null>(null);
  const [launching, setLaunching] = useState(false);

  // Live Event settings
  const [questionTimer, setQuestionTimer] = useState(30);
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [scheduledStartEt, setScheduledStartEt] = useState('');

  // Practice settings
  const [practiceTitle, setPracticeTitle] = useState('');
  const [practiceEndDays, setPracticeEndDays] = useState(7);

  // Shuffle settings (shared)
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Active event recovery
  const [activeEvent, setActiveEvent] = useState<any>(null);

  // Table sort state
  type TplSortField = 'title' | 'subject' | 'questions' | 'difficulty' | 'createdAt';
  const [tplSortField, setTplSortField] = useState<TplSortField>('createdAt');
  const [tplSortDir, setTplSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) { navigate('/'); return; }
    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) { alert('Access denied. Admin privileges required.'); navigate('/'); return; }
    await loadTemplates();
    // Check for an active live event so the host can recover after a crash
    const { getActiveEvent } = await import('@/services/liveEventService');
    const running = await getActiveEvent();
    if (running) setActiveEvent(running);
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'quizTemplates'));
      setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      alert('Failed to load quiz templates');
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const buildQuestions = (rawQuestions: any[]) => {
    let qs = shuffleQuestions ? shuffleArray(rawQuestions) : [...rawQuestions];
    if (shuffleOptions) {
      qs = qs.map(q => {
        const opts = Array.isArray(q.options) ? q.options : Object.values(q.options || {});
        const shuffled = shuffleArray(opts as string[]);
        return { ...q, options: shuffled };
      });
    }
    return qs;
  };

  // Convert an Eastern Time datetime-local string to a UTC Unix timestamp (ms)
  const easternToUtcMs = (dateTimeStr: string): number => {
    const refUtc = new Date(dateTimeStr + 'Z');
    const etFormatted = refUtc.toLocaleString('sv', { timeZone: 'America/New_York' });
    const etAsUtcMs = new Date(etFormatted.replace(' ', 'T') + 'Z').getTime();
    const offsetMs = etAsUtcMs - refUtc.getTime();
    return refUtc.getTime() - offsetMs;
  };

  // Current time formatted as datetime-local value in Eastern timezone (for min= attribute)
  const getCurrentEtDateTimeLocal = (): string => {
    const now = new Date();
    const etStr = now.toLocaleString('sv', { timeZone: 'America/New_York' });
    return etStr.slice(0, 16).replace(' ', 'T');
  };

  const openLaunchModal = (template: any, mode: 'liveEvent' | 'practiceLiveEvent' | 'scholarship' | 'scholarshipPractice') => {
    setLaunchTemplate(template);
    setLaunchMode(mode);
    setPracticeTitle(`${template.title} — ${mode === 'practiceLiveEvent' ? 'Practice' : mode === 'scholarshipPractice' ? 'Scholarship Practice' : mode === 'scholarship' ? 'Scholarship' : 'Live Event'}`);
    setQuestionTimer(30);
    setMaxParticipants(50);
    setPracticeEndDays(7);
    setShuffleQuestions(false);
    setShuffleOptions(true);
    setScheduledStartEt('');
  };

  const closeLaunchModal = () => {
    setLaunchTemplate(null);
    setLaunchMode(null);
    setLaunching(false);
  };

  const handleLaunchLive = async () => {
    if (!launchTemplate || !user) return;
    try {
      setLaunching(true);

      // 1. Create a competition record pointing to this template's questions
      const questions = buildQuestions(launchTemplate.questions || []);
      const competitionData = {
        title: launchTemplate.title,
        subject: launchTemplate.subject || '',
        difficulty: launchTemplate.difficulty || 'medium',
        questions,
        quizTemplateId: launchTemplate.id,
        type: 'liveEvent',
        status: 'upcoming',
        isLiveEvent: true,
        isPracticeLive: false,
        questionCount: launchTemplate.questions?.length || 0,
        settings: { difficulty: launchTemplate.difficulty || 'medium', numQuestions: launchTemplate.questions?.length || 0 },
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        prizePool: '',
        eligibleCounty: '',
        prizes: [],
        createdBy: user.uid,
      };
      const competitionsRef = collection(db, 'competitions');
      const compDoc = await addDoc(competitionsRef, { ...competitionData, participantCount: 0, createdAt: Timestamp.now() });
      const competitionId = compDoc.id;

      // 2. Create the live event
      const { createLiveEvent } = await import('@/services/liveEventService');
      const scheduledStartAt = scheduledStartEt ? easternToUtcMs(scheduledStartEt) : undefined;
      const { eventId, pin } = await createLiveEvent(
        competitionId,
        { questionTimer, enableFastestFingerBonus: true, autoAdvanceOnTimer: true },
        maxParticipants,
        scheduledStartAt
      );

      closeLaunchModal();
      alert(`✅ Live Event Created!\n\nPIN: ${pin}\n\nShare this PIN with participants.`);
      navigate(`/live-event/${eventId}/host`);
    } catch (err: any) {
      if (err.message?.includes('active event already exists')) {
        const force = window.confirm(
          `⚠️ A stale live event is blocking creation.\n\nClick OK to end it and retry, or Cancel to abort.`
        );
        if (force) {
          const { endAllStaleEvents } = await import('@/services/liveEventService');
          await endAllStaleEvents();
          setLaunching(false);
          handleLaunchLive(); // retry
          return;
        }
      } else {
        alert(`❌ Failed to create live event: ${err.message}`);
      }
    } finally {
      setLaunching(false);
    }
  };

  const handleLaunchPracticeLiveEvent = async () => {
    if (!launchTemplate || !user) return;
    if (!practiceTitle.trim()) { alert('Please enter a session title'); return; }
    try {
      setLaunching(true);

      const questions = buildQuestions(launchTemplate.questions || []);
      const competitionData = {
        title: practiceTitle,
        subject: launchTemplate.subject || '',
        difficulty: launchTemplate.difficulty || 'medium',
        questions,
        quizTemplateId: launchTemplate.id,
        type: 'practice',
        status: 'active',
        isLiveEvent: false,
        isPracticeLive: true,
        questionCount: launchTemplate.questions?.length || 0,
        settings: { difficulty: launchTemplate.difficulty || 'medium', numQuestions: launchTemplate.questions?.length || 0 },
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date(Date.now() + practiceEndDays * 86400000)),
        prizePool: '',
        eligibleCounty: '',
        prizes: [],
        createdBy: user.uid,
        practiceLiveSettings: { showLeaderboard: true, showExplanations: true, maxQuestions: launchTemplate.questions?.length || 0 },
      };
      const competitionsRef = collection(db, 'competitions');
      const compDoc = await addDoc(competitionsRef, { ...competitionData, participantCount: 0, createdAt: Timestamp.now() });
      const competitionId = compDoc.id;

      const { createPracticeSession } = await import('@/services/practiceService');
      const endDate = Date.now() + practiceEndDays * 86400000;
      const { sessionId, pin } = await createPracticeSession(
        competitionId,
        practiceTitle,
        `Practice session from template: ${launchTemplate.title}`,
        { showLeaderboard: true, showExplanations: true, maxQuestions: launchTemplate.questions?.length || 0 },
        user.uid,
        endDate
      );

      closeLaunchModal();
      alert(`✅ Practice Live Event Created!\n\nPIN: ${pin}\n\nShare this PIN with students.`);
      navigate(`/admin/practice/dashboard/${sessionId}`);
    } catch (err: any) {
      alert(`❌ Failed to create practice live event: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  };

  const handleLaunchScholarship = async (isPractice: boolean) => {
    if (!launchTemplate || !user) return;
    if (!practiceTitle.trim()) { alert('Please enter a title'); return; }
    try {
      setLaunching(true);
      const questions = buildQuestions(launchTemplate.questions || []);
      const competitionData = {
        title: practiceTitle,
        subject: launchTemplate.subject || '',
        difficulty: launchTemplate.difficulty || 'medium',
        questions,
        quizTemplateId: launchTemplate.id,
        type: isPractice ? 'practice' : 'scholarship',
        status: isPractice ? 'active' : 'upcoming',
        isLiveEvent: false,
        isPracticeLive: false,
        isPractice,
        questionCount: launchTemplate.questions?.length || 0,
        settings: { difficulty: launchTemplate.difficulty || 'medium', numQuestions: launchTemplate.questions?.length || 0 },
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date(Date.now() + practiceEndDays * 86400000)),
        prizePool: isPractice ? '' : '$300',
        eligibleCounty: 'henrico',
        prizes: [],
        duration: '60 minutes',
        createdBy: user.uid,
      };
      const competitionsRef = collection(db, 'competitions');
      await addDoc(competitionsRef, { ...competitionData, participantCount: 0, createdAt: Timestamp.now() });
      closeLaunchModal();
      alert(`✅ ${isPractice ? 'Scholarship Practice' : 'Scholarship Competition'} created!`);
      navigate('/admin/competition-settings');
    } catch (err: any) {
      alert(`❌ Failed to create: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  };

  const handleTplSort = (field: TplSortField) => {
    if (tplSortField === field) {
      setTplSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setTplSortField(field);
      setTplSortDir('asc');
    }
  };

  const sortedTemplates = [...templates].sort((a, b) => {
    let av: any, bv: any;
    switch (tplSortField) {
      case 'title':     av = a.title?.toLowerCase() || '';  bv = b.title?.toLowerCase() || '';  break;
      case 'subject':   av = a.subject?.toLowerCase() || ''; bv = b.subject?.toLowerCase() || ''; break;
      case 'questions': av = a.questions?.length || 0;      bv = b.questions?.length || 0;      break;
      case 'difficulty':av = a.difficulty || '';            bv = b.difficulty || '';            break;
      case 'createdAt': av = a.createdAt?.seconds || 0;     bv = b.createdAt?.seconds || 0;     break;
      default:          av = 0; bv = 0;
    }
    if (av < bv) return tplSortDir === 'asc' ? -1 : 1;
    if (av > bv) return tplSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const TplSortTh = ({ field, label }: { field: TplSortField; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase cursor-pointer select-none hover:text-white/80 transition-colors"
      onClick={() => handleTplSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {tplSortField === field ? (
          tplSortDir === 'asc'
            ? <ChevronUp className="h-3 w-3 text-purple-400" />
            : <ChevronDown className="h-3 w-3 text-purple-400" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const BG_STYLE = { background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={BG_STYLE}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 min-h-screen p-4 md:p-6 -mx-4 md:-mx-6 -mt-8 md:-mt-12" style={BG_STYLE}>

      {/* ── Active Event Recovery Banner ── */}
      {activeEvent && (
        <div className="flex items-center gap-4 rounded-2xl px-5 py-4"
          style={{ background: 'rgba(234,179,8,0.15)', border: '1.5px solid rgba(234,179,8,0.4)' }}>
          <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-yellow-300 text-sm">Live Event In Progress</p>
            <p className="text-yellow-200/70 text-xs mt-0.5">
              PIN <span className="font-black tracking-widest">{activeEvent.pin}</span>
              {' · '}
              {activeEvent.status === 'lobby' ? 'Waiting in lobby'
                : activeEvent.status === 'paused' ? 'Paused'
                : `Question ${(activeEvent.currentQuestionIndex ?? 0) + 1} · ${activeEvent.phase}`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/live-event/${activeEvent.id}/host`)}
            className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold flex-shrink-0"
          >
            Resume Host Control
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-300" />
            Quiz Templates
          </h1>
          <p className="text-white/60 text-sm mt-0.5">Launch as Live Event, Practice Live Event, Scholarship, or Scholarship Practice</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/competition-settings')}
            className="border-white/30 text-white hover:bg-white/10 bg-transparent"
          >
            Settings
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/admin/create-competition')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create New
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      <Card style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">All Quiz Templates</CardTitle>
            <p className="text-sm text-white/50">Edit questions, or launch directly in any of the 4 modes</p>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No quiz templates created yet</p>
                <Button onClick={() => navigate('/admin/create-competition')} className="mt-4">
                  Create Your First Template
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <tr>
                      <TplSortTh field="title"      label="Title"      />
                      <TplSortTh field="questions"  label="Qs"         />
                      <TplSortTh field="difficulty" label="Difficulty" />
                      <TplSortTh field="createdAt"  label="Created"    />
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Launch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-white/5">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/admin/quiz-templates/${template.id}/edit`)}
                            className="font-medium text-purple-300 hover:text-white hover:underline text-left transition-colors"
                          >
                            {template.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60 text-center">
                          <span className="font-semibold text-white">{template.questions?.length || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            template.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                            template.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {template.difficulty?.toUpperCase() || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60">{formatDate(template.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-nowrap">
                            <button
                              onClick={() => openLaunchModal(template, 'liveEvent')}
                              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                              <Zap className="h-3 w-3" />Live Event
                            </button>
                            <button
                              onClick={() => openLaunchModal(template, 'practiceLiveEvent')}
                              className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                              <Target className="h-3 w-3" />Live Practice
                            </button>
                            <button
                              onClick={() => openLaunchModal(template, 'scholarship')}
                              className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                              <Trophy className="h-3 w-3" />Scholarship
                            </button>
                            <button
                              onClick={() => openLaunchModal(template, 'scholarshipPractice')}
                              className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                              <GraduationCap className="h-3 w-3" />S. Practice
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

      {/* Launch Modal */}
      {launchTemplate && launchMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: 'linear-gradient(160deg, #1e0a3c 0%, #0f0a1e 100%)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 rounded-t-2xl ${
              launchMode === 'liveEvent' ? 'bg-purple-600' :
              launchMode === 'practiceLiveEvent' ? 'bg-emerald-600' :
              launchMode === 'scholarship' ? 'bg-yellow-600' :
              'bg-orange-600'
            }`}>
              <div className="flex items-center gap-3">
                {launchMode === 'liveEvent' ? <Zap className="h-5 w-5 text-white" />
                  : launchMode === 'practiceLiveEvent' ? <Target className="h-5 w-5 text-white" />
                  : launchMode === 'scholarship' ? <Trophy className="h-5 w-5 text-white" />
                  : <GraduationCap className="h-5 w-5 text-white" />}
                <div>
                  <h2 className="text-white font-bold text-lg">
                    {launchMode === 'liveEvent' ? 'Launch Live Event'
                      : launchMode === 'practiceLiveEvent' ? 'Launch Practice Live Event'
                      : launchMode === 'scholarship' ? 'Launch Scholarship Competition'
                      : 'Launch Scholarship Practice'}
                  </h2>
                  <p className="text-white/70 text-xs">{launchTemplate.title}</p>
                </div>
              </div>
              <button onClick={closeLaunchModal} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Template summary */}
            <div className="px-6 pt-4">
              <div className="flex gap-3 rounded-xl p-3 text-sm text-white/60" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-indigo-500" />
                  <strong>{launchTemplate.questions?.length || 0}</strong> questions
                </span>
                <span>·</span>
                <span>{launchTemplate.subject || 'No subject'}</span>
                <span>·</span>
                <span className="capitalize">{launchTemplate.difficulty || 'medium'}</span>
              </div>
            </div>

            {/* Settings */}
            <div className="px-6 py-4 space-y-4">
              {launchMode === 'liveEvent' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Seconds per question
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={5} max={120} step={5}
                        value={questionTimer}
                        onChange={e => setQuestionTimer(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-12 text-center font-bold text-purple-400 text-lg">{questionTimer}s</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-1">Max participants</label>
                    <input
                      type="number" min={2} max={500}
                      value={maxParticipants}
                      onChange={e => setMaxParticipants(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Scheduled start time <span className="text-white/40 font-normal">(Eastern Time)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledStartEt}
                      min={getCurrentEtDateTimeLocal()}
                      onChange={e => setScheduledStartEt(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', colorScheme: 'dark' }}
                    />
                    <p className="text-xs text-white/40 mt-1">
                      {scheduledStartEt
                        ? `Event auto-starts at ${new Date(easternToUtcMs(scheduledStartEt)).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}`
                        : 'Leave blank to start manually'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-1">
                      {launchMode === 'scholarship' ? 'Competition title' :
                       launchMode === 'scholarshipPractice' ? 'Practice title' :
                       'Session title'}
                    </label>
                    <input
                      type="text"
                      value={practiceTitle}
                      onChange={e => setPracticeTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                      placeholder="e.g. Odia Culture — April 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-1">Open for (days)</label>
                    <input
                      type="number" min={1} max={365}
                      value={practiceEndDays}
                      onChange={e => setPracticeEndDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    />
                    <p className="text-xs text-white/40 mt-1">
                      Closes on {new Date(Date.now() + practiceEndDays * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Shuffle options */}
            <div className="px-6 pb-2 space-y-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Randomization</p>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-white/70">Shuffle answer options</span>
                <button
                  type="button"
                  onClick={() => setShuffleOptions(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shuffleOptions ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${shuffleOptions ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-white/70">Shuffle question order</span>
                <button
                  type="button"
                  onClick={() => setShuffleQuestions(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shuffleQuestions ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${shuffleQuestions ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </label>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3 pt-4">
              <button
                onClick={closeLaunchModal}
                className="flex-1 py-3 rounded-xl font-semibold transition-colors text-white/70 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (launchMode === 'liveEvent') handleLaunchLive();
                  else if (launchMode === 'practiceLiveEvent') handleLaunchPracticeLiveEvent();
                  else if (launchMode === 'scholarship') handleLaunchScholarship(false);
                  else if (launchMode === 'scholarshipPractice') handleLaunchScholarship(true);
                }}
                disabled={launching}
                className={`flex-1 py-3 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2 ${
                  launchMode === 'liveEvent' ? 'bg-purple-600 hover:bg-purple-700' :
                  launchMode === 'practiceLiveEvent' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  launchMode === 'scholarship' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-60`}
              >
                {launching ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                ) : launchMode === 'liveEvent' ? (
                  <><Zap className="h-4 w-4" /> Launch Live Event</>
                ) : launchMode === 'practiceLiveEvent' ? (
                  <><Target className="h-4 w-4" /> Launch Practice Live Event</>
                ) : launchMode === 'scholarship' ? (
                  <><Trophy className="h-4 w-4" /> Launch Scholarship</>
                ) : (
                  <><GraduationCap className="h-4 w-4" /> Launch Scholarship Practice</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
