// Admin Quiz Templates List - View, Edit, and Launch Quiz Templates
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../components/ui/firebase';
import { collection, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Edit, Plus, Zap, Target, X, Trophy, Clock } from 'lucide-react';

export default function AdminQuizTemplatesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);

  // Launch modal state
  const [launchTemplate, setLaunchTemplate] = useState<any>(null);
  const [launchMode, setLaunchMode] = useState<'live' | 'practice' | null>(null);
  const [launching, setLaunching] = useState(false);

  // Live Event settings
  const [questionTimer, setQuestionTimer] = useState(30);
  const [maxParticipants, setMaxParticipants] = useState(50);

  // Practice settings
  const [practiceTitle, setPracticeTitle] = useState('');
  const [practiceEndDays, setPracticeEndDays] = useState(7);

  // Shuffle settings (shared)
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) { navigate('/'); return; }
    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) { alert('Access denied. Admin privileges required.'); navigate('/'); return; }
    await loadTemplates();
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
        const shuffled = shuffleArray(q.options as string[]);
        return { ...q, options: shuffled };
      });
    }
    return qs;
  };

  const openLaunchModal = (template: any, mode: 'live' | 'practice') => {
    setLaunchTemplate(template);
    setLaunchMode(mode);
    setPracticeTitle(`${template.title} — Practice`);
    setQuestionTimer(30);
    setMaxParticipants(50);
    setPracticeEndDays(7);
    setShuffleQuestions(false);
    setShuffleOptions(true);
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
      const { eventId, pin } = await createLiveEvent(
        competitionId,
        { questionTimer, enableFastestFingerBonus: true, autoAdvanceOnTimer: true },
        maxParticipants
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

  const handleLaunchPractice = async () => {
    if (!launchTemplate || !user) return;
    if (!practiceTitle.trim()) { alert('Please enter a session title'); return; }
    try {
      setLaunching(true);

      // 1. Create competition record
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

      // 2. Create practice session
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
      alert(`✅ Practice Session Created!\n\nPIN: ${pin}\n\nShare this PIN with students. Go to Practice Host to manage.`);
      navigate(`/admin/practice/dashboard/${sessionId}`);
    } catch (err: any) {
      alert(`❌ Failed to create practice session: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-300" />
            Quiz Templates
          </h1>
          <p className="text-white/60 text-sm mt-0.5">Launch as Live Event or Practice from any template</p>
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
            onClick={() => navigate('/admin/quiz-templates')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create New Template
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      <Card className="bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-900">All Quiz Templates</CardTitle>
            <p className="text-sm text-gray-500">Edit questions, or launch directly as Live Event or Practice session</p>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No quiz templates created yet</p>
                <Button onClick={() => navigate('/admin/quiz-templates')} className="mt-4">
                  Create Your First Template
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{template.title}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{template.subject || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="font-semibold">{template.questions?.length || 0}</span> questions
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            template.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            template.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {template.difficulty?.toUpperCase() || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(template.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => navigate(`/admin/quiz-templates/${template.id}/edit`)}
                              className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => openLaunchModal(template, 'live')}
                              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                            >
                              <Zap className="h-3 w-3" />
                              Launch Live
                            </button>
                            <button
                              onClick={() => openLaunchModal(template, 'practice')}
                              className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center gap-1"
                            >
                              <Target className="h-3 w-3" />
                              Launch Practice
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 rounded-t-2xl ${
              launchMode === 'live' ? 'bg-purple-600' : 'bg-emerald-600'
            }`}>
              <div className="flex items-center gap-3">
                {launchMode === 'live'
                  ? <Zap className="h-5 w-5 text-white" />
                  : <Target className="h-5 w-5 text-white" />
                }
                <div>
                  <h2 className="text-white font-bold text-lg">
                    {launchMode === 'live' ? 'Launch Live Event' : 'Launch Practice Session'}
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
              <div className="flex gap-3 bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
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
              {launchMode === 'live' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Seconds per question
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={10} max={120} step={5}
                        value={questionTimer}
                        onChange={e => setQuestionTimer(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-12 text-center font-bold text-purple-700 text-lg">{questionTimer}s</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Max participants</label>
                    <input
                      type="number" min={2} max={500}
                      value={maxParticipants}
                      onChange={e => setMaxParticipants(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Session title</label>
                    <input
                      type="text"
                      value={practiceTitle}
                      onChange={e => setPracticeTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g. Odia Culture Practice — April 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Session open for (days)</label>
                    <input
                      type="number" min={1} max={90}
                      value={practiceEndDays}
                      onChange={e => setPracticeEndDays(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Closes on {new Date(Date.now() + practiceEndDays * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Shuffle options */}
            <div className="px-6 pb-2 space-y-2 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Randomization</p>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Shuffle answer options</span>
                <button
                  type="button"
                  onClick={() => setShuffleOptions(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shuffleOptions ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${shuffleOptions ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Shuffle question order</span>
                <button
                  type="button"
                  onClick={() => setShuffleQuestions(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shuffleQuestions ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${shuffleQuestions ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </label>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3 pt-4">
              <button
                onClick={closeLaunchModal}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={launchMode === 'live' ? handleLaunchLive : handleLaunchPractice}
                disabled={launching}
                className={`flex-1 py-3 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2 ${
                  launchMode === 'live'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:opacity-60`}
              >
                {launching ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                ) : launchMode === 'live' ? (
                  <><Zap className="h-4 w-4" /> Launch Live Event</>
                ) : (
                  <><Target className="h-4 w-4" /> Launch Practice</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
