import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Brain, Sparkles, Trophy, Calendar, DollarSign, Clock, MapPin,
  Target, Presentation, BookOpen, AlignLeft, FileCode, GraduationCap
} from 'lucide-react';
import { saveQuizTemplate, createCompetition } from '@/components/ui/firebase';
import { generateCompetitionTemplate } from '@/components/api';
import { Timestamp } from 'firebase/firestore';

const BG_STYLE = { background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' };
const GLASS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem' };
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '0.5rem',
  color: 'white',
  width: '100%',
  padding: '0.5rem 0.75rem',
};

type CompType = 'scholarshipPractice' | 'scholarship' | 'practiceLiveEvent' | 'liveEvent';
type QuestionSource = 'subject' | 'jsonImport' | 'manual';

export default function AdminCreateCompetition() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const [competitionType, setCompetitionType] = useState<CompType | null>(null);
  const [questionSource, setQuestionSource] = useState<QuestionSource | null>(null);

  // Subject-based
  const [subjectDistribution, setSubjectDistribution] = useState({
    english: 1, mathematics: 0, science: 0, socialStudies: 0, healthWellness: 0
  });

  // JSON Import
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState<any[]>([]);

  // Competition details
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [competitionTitle, setCompetitionTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(tomorrow);
  const [endTime, setEndTime] = useState('11:00');
  const [prizePool, setPrizePool] = useState('$300');
  const [duration, setDuration] = useState('60');
  const [eligibleCounty, setEligibleCounty] = useState('henrico');

  // Live event settings
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [questionTimer, setQuestionTimer] = useState(30);
  const [enableFastestFingerBonus, setEnableFastestFingerBonus] = useState(true);
  const [autoAdvanceOnTimer, setAutoAdvanceOnTimer] = useState(true);

  // Practice live settings
  const [sessionDuration, setSessionDuration] = useState<'week' | 'month' | 'semester' | 'custom'>('month');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [maxQuestions, setMaxQuestions] = useState(20);

  const totalSubjectQuestions = Object.values(subjectDistribution).reduce((a, b) => a + b, 0);

  const isStep1Enabled = competitionType !== null && questionSource !== null;
  const isStep2Enabled = questionsGenerated || questionSource === 'manual';

  const handleGenerateQuestions = async () => {
    if (questionSource === 'subject') {
      if (totalSubjectQuestions === 0) { alert('Please set at least one subject with questions.'); return; }
    }
    try {
      setGenerating(true);
      const result = await generateCompetitionTemplate({
        subjects: subjectDistribution,
        difficulty,
        gradeLevels: ['9', '10', '11', '12']
      });
      if (result.success && result.quiz) {
        const generatedQuestions = result.quiz.map((q: any) => ({
          question: q.question, options: q.options,
          correctAnswer: q.correctAnswer, explanation: q.explanation || ''
        }));
        setQuestions(generatedQuestions);
        setQuestionsGenerated(true);
        alert(`✅ Generated ${generatedQuestions.length} questions! Fill in details below.`);
      } else {
        throw new Error(result.message || 'No questions generated');
      }
    } catch (error: any) {
      alert(`❌ Failed to generate questions.\n\nError: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleJsonImport = () => {
    setJsonError('');
    try {
      const raw = jsonInput.trim();
      if (!raw) { setJsonError('Paste JSON first'); return; }
      let arr = JSON.parse(raw);
      if (!Array.isArray(arr)) arr = [arr];
      if (arr.length === 0) throw new Error('Expected a non-empty JSON array');
      const imported = arr.map((q: any, idx: number) => {
        // Support both array options and A/B/C/D object formats
        let options: string[] = [];
        if (Array.isArray(q.options)) {
          options = q.options;
        } else if (q.A || q.a) {
          options = [q.A || q.a, q.B || q.b, q.C || q.c, q.D || q.d].filter(Boolean);
        }
        const correctAnswer = q.correctAnswer || q.correct_answer || q.answer || '';
        return {
          question: q.question || `Question ${idx + 1}`,
          options,
          correctAnswer,
          explanation: q.explanation || ''
        };
      });
      setQuestions(imported);
      setQuestionsGenerated(true);
      setJsonInput('');
      alert(`✅ Imported ${imported.length} questions! Fill in details below.`);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
    }
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questionSource !== 'manual' && (!questionsGenerated || questions.length === 0)) {
      alert('Please generate or import questions first!');
      return;
    }
    if (!competitionTitle || !startDate || !endDate) {
      alert('Please fill in all required competition details');
      return;
    }

    try {
      const startDateTime = `${startDate}T${startTime}:00.000`;
      const endDateTime = `${endDate}T${endTime}:00.000`;
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert('Invalid date/time format!');
        return;
      }

      // Save quiz template
      const formattedQuestions = questions.map((q, idx) => ({
        id: idx + 1, question: q.question, options: q.options,
        correctAnswer: q.correctAnswer, explanation: q.explanation || ''
      }));

      const template = {
        title: `${competitionTitle} - Questions`,
        type: 'topic' as const,
        subject: 'Multi-Subject',
        difficulty,
        questions: formattedQuestions,
        settings: { difficulty, numQuestions: questions.length, quizType: 'multiple-choice' },
        questionHash: Date.now().toString()
      };

      const templateId = await saveQuizTemplate(template);

      const isLiveEvent = competitionType === 'liveEvent';
      const isPracticeLive = competitionType === 'practiceLiveEvent';
      const isPractice = competitionType === 'scholarshipPractice';

      const competitionData: any = {
        title: competitionTitle, description,
        status: isPractice || isPracticeLive ? 'active' : 'upcoming',
        isPractice,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        quizTemplateId: templateId,
        prizePool: competitionType === 'scholarship' ? prizePool : '',
        duration: `${duration} minutes`,
        questionCount: questions.length,
        eligibleCounty: isLiveEvent || isPracticeLive ? '' : eligibleCounty,
        isLiveEvent, isPracticeLive,
        ...(isLiveEvent && { liveEventSettings: { maxParticipants, questionTimer, enableFastestFingerBonus, autoAdvanceOnTimer } }),
        ...(isPracticeLive && { practiceLiveSettings: { sessionDuration, ...(sessionDuration === 'custom' && { customEndDate }), showLeaderboard, showExplanations, maxQuestions } }),
      };

      const competitionId = await createCompetition(competitionData);

      if (isLiveEvent) {
        const { createLiveEvent } = await import('../services/liveEventService');
        const { eventId, pin } = await createLiveEvent(competitionId, { questionTimer, enableFastestFingerBonus, autoAdvanceOnTimer }, maxParticipants);
        alert(`✅ Live Event Created!\n\nPIN: ${pin}\n\nRedirecting to Host Control...`);
        navigate(`/live-event/${eventId}/host`);
      } else if (questionSource === 'manual') {
        alert(`✅ Competition created! Redirecting to edit questions...`);
        navigate(`/admin/quiz-templates/${templateId}/edit`);
      } else {
        const label =
          isPractice ? 'Scholarship Practice Quiz' :
          isPracticeLive ? 'Practice Live Session' :
          'Scholarship Competition';
        alert(`✅ ${label} created!`);
        navigate('/admin/competition-settings');
      }
    } catch (error: any) {
      alert(`❌ Failed to create competition.\n\n${error.message}`);
    }
  };

  // ── Type selection cards ────────────────────────────────
  const TypeCard = ({ type, label, desc, icon }: { type: CompType; label: string; desc: string; icon: React.ReactNode }) => (
    <button type="button" onClick={() => setCompetitionType(type)}
      className="text-left p-4 rounded-xl transition-all duration-200"
      style={{
        background: competitionType === type ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
        border: competitionType === type ? '2px solid rgba(167,139,250,0.8)' : '2px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className={`flex items-center gap-2 font-bold mb-1 ${competitionType === type ? 'text-purple-300' : 'text-white/80'}`}>
        {icon} {label}
      </div>
      <p className="text-xs text-white/50">{desc}</p>
    </button>
  );

  // ── Question source cards ───────────────────────────────
  const SourceCard = ({ src, label, desc, icon }: { src: QuestionSource; label: string; desc: string; icon: React.ReactNode }) => (
    <button type="button" onClick={() => { setQuestionSource(src); setQuestionsGenerated(false); setQuestions([]); setJsonInput(''); setJsonError(''); }}
      className="text-left p-4 rounded-xl transition-all duration-200"
      style={{
        background: questionSource === src ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
        border: questionSource === src ? '2px solid rgba(96,165,250,0.8)' : '2px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className={`flex items-center gap-2 font-bold mb-1 text-sm ${questionSource === src ? 'text-blue-300' : 'text-white/80'}`}>
        {icon} {label}
      </div>
      <p className="text-xs text-white/50">{desc}</p>
    </button>
  );

  const submitLabel = () => {
    if (!isStep2Enabled || !competitionType) return 'Complete Steps Above First';
    switch (competitionType) {
      case 'scholarshipPractice': return 'Create Scholarship Practice';
      case 'scholarship':         return 'Create Scholarship Competition';
      case 'practiceLiveEvent':   return 'Create Practice Live Event';
      case 'liveEvent':           return 'Create Live Event';
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={BG_STYLE}>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-xl shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8" /> Create New Competition
            </h1>
            <p className="text-indigo-100 mt-1 text-sm">Type → Source → Questions → Details → Done</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/quiz-templates/list')}
            className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 font-semibold">
            ← Back
          </Button>
        </div>

        <form onSubmit={handleCreateCompetition} className="space-y-5">

          {/* STEP 0: Competition Type */}
          <div className="p-5 space-y-4" style={GLASS}>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-400" /> Step 0: Choose Competition Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <TypeCard type="scholarshipPractice" label="Scholarship Practice" desc="Unlimited attempts to prep for the scholarship exam" icon={<GraduationCap className="h-4 w-4" />} />
              <TypeCard type="scholarship"         label="Scholarship"          desc="One attempt with prizes and scoring" icon={<Trophy className="h-4 w-4" />} />
              <TypeCard type="practiceLiveEvent"   label="Practice Live Event"  desc="Self-paced, persistent session for students" icon={<Target className="h-4 w-4" />} />
              <TypeCard type="liveEvent"           label="Live Event"           desc="Real-time synchronized with projector and timers" icon={<Presentation className="h-4 w-4" />} />
            </div>
          </div>

          {/* STEP 0b: Question Source */}
          <div className={`p-5 space-y-4 transition-opacity ${!competitionType ? 'opacity-40 pointer-events-none' : ''}`} style={GLASS}>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-400" /> Step 0b: Choose Question Source
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SourceCard src="subject"    label="Subject Based"  desc="Enter subject counts — AI generates by curriculum area" icon={<BookOpen className="h-4 w-4" />} />
              <SourceCard src="jsonImport" label="JSON Import"    desc="Paste JSON from ChatGPT or any source" icon={<FileCode className="h-4 w-4" />} />
              <SourceCard src="manual"     label="Manual Entry"   desc="Create competition now, add/edit questions after" icon={<AlignLeft className="h-4 w-4" />} />
            </div>
          </div>

          {/* STEP 1: Questions */}
          {questionSource === 'subject' && (
            <div className={`p-5 space-y-4 transition-opacity ${!isStep1Enabled ? 'opacity-40 pointer-events-none' : ''}`} style={GLASS}>
              <h2 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" /> Step 1: Generate Questions with AI
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'english', label: 'English' },
                  { key: 'mathematics', label: 'Mathematics' },
                  { key: 'science', label: 'Science' },
                  { key: 'socialStudies', label: 'Social Studies' },
                  { key: 'healthWellness', label: 'Health & Wellness' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-white/70 mb-1">{label}</label>
                    <input type="number" value={(subjectDistribution as any)[key]}
                      onChange={e => setSubjectDistribution({ ...subjectDistribution, [key]: parseInt(e.target.value) || 0 })}
                      style={INPUT_STYLE} min="0" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Total</label>
                  <div className="px-3 py-2 rounded-lg font-bold text-lg text-purple-400"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    {totalSubjectQuestions}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ ...INPUT_STYLE, width: '180px' }}>
                  <option value="easy" style={{ background: '#1e0a3c' }}>Easy</option>
                  <option value="medium" style={{ background: '#1e0a3c' }}>Medium</option>
                  <option value="hard" style={{ background: '#1e0a3c' }}>Hard</option>
                </select>
              </div>
              {generating && (
                <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <Brain className="h-5 w-5 text-blue-400 animate-spin inline mr-2" />
                  <span className="text-blue-300 font-medium">AI is generating questions... 30-60 seconds</span>
                </div>
              )}
              {questionsGenerated && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <p className="text-green-300 font-medium">✅ {questions.length} questions ready!</p>
                </div>
              )}
              <Button type="button" onClick={handleGenerateQuestions}
                disabled={generating || questionsGenerated || !isStep1Enabled}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold py-5">
                {generating ? <><Brain className="h-5 w-5 mr-2 animate-spin" />Generating...</>
                  : questionsGenerated ? <><Sparkles className="h-5 w-5 mr-2" />✅ {questions.length} Questions Ready!</>
                  : <><Sparkles className="h-5 w-5 mr-2" />Generate Questions with AI</>}
              </Button>
            </div>
          )}

          {questionSource === 'jsonImport' && (
            <div className={`p-5 space-y-4 transition-opacity ${!isStep1Enabled ? 'opacity-40 pointer-events-none' : ''}`} style={GLASS}>
              <h2 className="font-bold text-white flex items-center gap-2">
                <FileCode className="h-4 w-4 text-yellow-400" /> Step 1: Import Questions from JSON
              </h2>
              <p className="text-xs text-white/50">Paste a JSON array of questions from ChatGPT or any source. Supports array options and A/B/C/D object formats.</p>
              <textarea
                value={jsonInput}
                onChange={e => { setJsonInput(e.target.value); setJsonError(''); }}
                rows={8}
                style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.75rem' } as React.CSSProperties}
                placeholder={'[\n  {\n    "question": "...",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswer": "A",\n    "explanation": "..."\n  }\n]'}
              />
              {jsonError && <p className="text-red-400 text-sm font-medium">Error: {jsonError}</p>}
              {questionsGenerated && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <p className="text-green-300 font-medium">✅ {questions.length} questions imported!</p>
                </div>
              )}
              <Button type="button" onClick={handleJsonImport}
                disabled={!jsonInput.trim() || questionsGenerated}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold py-5">
                <FileCode className="h-5 w-5 mr-2" />
                {questionsGenerated ? `✅ ${questions.length} Questions Imported` : 'Import Questions'}
              </Button>
              {questionsGenerated && (
                <button type="button" onClick={() => { setQuestionsGenerated(false); setQuestions([]); }}
                  className="text-xs text-white/40 hover:text-white/70 underline">
                  Clear and re-import
                </button>
              )}
            </div>
          )}

          {questionSource === 'manual' && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <p className="text-blue-300 flex items-center gap-2">
                <AlignLeft className="h-4 w-4" />
                <strong>Manual Entry</strong> — Fill in competition details below, then you'll be redirected to add questions.
              </p>
            </div>
          )}

          {/* STEP 2: Competition Details */}
          <div className={`p-5 space-y-4 transition-opacity ${!isStep2Enabled ? 'opacity-40 pointer-events-none' : ''}`} style={GLASS}>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" /> Step 2: Competition Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Title *</label>
              <input type="text" required value={competitionTitle} onChange={e => setCompetitionTitle(e.target.value)}
                style={INPUT_STYLE} placeholder="e.g., Henrico Merit Scholarship — Spring 2026"
                disabled={!isStep2Enabled} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                style={{ ...INPUT_STYLE, resize: 'vertical' } as React.CSSProperties}
                placeholder="Brief description..." disabled={!isStep2Enabled} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1"><Calendar className="h-3 w-3 inline mr-1" />Start Date *</label>
                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} style={INPUT_STYLE} disabled={!isStep2Enabled} />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1"><Clock className="h-3 w-3 inline mr-1" />Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={INPUT_STYLE} disabled={!isStep2Enabled} />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">End Date *</label>
                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} style={INPUT_STYLE} disabled={!isStep2Enabled} />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">End Time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={INPUT_STYLE} disabled={!isStep2Enabled} />
              </div>
            </div>

            {/* Scholarship-only fields */}
            {competitionType === 'scholarship' && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1"><DollarSign className="h-3 w-3 inline mr-1" />Prize Pool</label>
                <input type="text" value={prizePool} onChange={e => setPrizePool(e.target.value)} style={INPUT_STYLE} disabled={!isStep2Enabled} />
              </div>
            )}

            {/* Live Event settings */}
            {competitionType === 'liveEvent' && (
              <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
                <h3 className="text-sm font-bold text-purple-300">Live Event Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Max Participants</label>
                    <input type="number" value={maxParticipants}
                      onChange={e => setMaxParticipants(Math.min(500, Math.max(2, parseInt(e.target.value) || 50)))}
                      style={INPUT_STYLE} min="2" max="500" disabled={!isStep2Enabled} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Timer/Question (sec)</label>
                    <input type="number" value={questionTimer}
                      onChange={e => setQuestionTimer(Math.min(120, Math.max(5, parseInt(e.target.value) || 30)))}
                      style={INPUT_STYLE} min="5" max="120" disabled={!isStep2Enabled} />
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { state: enableFastestFingerBonus, setter: setEnableFastestFingerBonus, label: 'Fastest Finger Bonus' },
                    { state: autoAdvanceOnTimer, setter: setAutoAdvanceOnTimer, label: 'Auto-advance on timer' },
                  ].map(({ state, setter, label }) => (
                    <label key={label} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input type="checkbox" checked={state} onChange={e => setter(e.target.checked)}
                        className="rounded" disabled={!isStep2Enabled} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Live Event settings */}
            {competitionType === 'practiceLiveEvent' && (
              <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <h3 className="text-sm font-bold text-green-300">Practice Live Event Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Session Duration</label>
                    <select value={sessionDuration} onChange={e => setSessionDuration(e.target.value as any)} style={INPUT_STYLE} disabled={!isStep2Enabled}>
                      <option value="week" style={{ background: '#1e0a3c' }}>1 Week</option>
                      <option value="month" style={{ background: '#1e0a3c' }}>1 Month</option>
                      <option value="semester" style={{ background: '#1e0a3c' }}>1 Semester</option>
                      <option value="custom" style={{ background: '#1e0a3c' }}>Custom</option>
                    </select>
                  </div>
                  {sessionDuration === 'custom' && (
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">Custom End Date</label>
                      <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={INPUT_STYLE} disabled={!isStep2Enabled} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Max Questions</label>
                    <input type="number" value={maxQuestions}
                      onChange={e => setMaxQuestions(Math.min(50, Math.max(1, parseInt(e.target.value) || 20)))}
                      style={INPUT_STYLE} min="1" max="50" disabled={!isStep2Enabled} />
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { state: showLeaderboard, setter: setShowLeaderboard, label: 'Show leaderboard to students' },
                    { state: showExplanations, setter: setShowExplanations, label: 'Show answer explanations' },
                  ].map(({ state, setter, label }) => (
                    <label key={label} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input type="checkbox" checked={state} onChange={e => setter(e.target.checked)} className="rounded" disabled={!isStep2Enabled} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Duration (minutes)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} style={{ ...INPUT_STYLE, width: '120px' }} disabled={!isStep2Enabled} />
            </div>

            {(competitionType === 'scholarship' || competitionType === 'scholarshipPractice') && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1"><MapPin className="h-3 w-3 inline mr-1" />Eligible County</label>
                <select value={eligibleCounty} onChange={e => setEligibleCounty(e.target.value)} style={INPUT_STYLE} disabled={!isStep2Enabled}>
                  <option value="henrico" style={{ background: '#1e0a3c' }}>Henrico County</option>
                  <option value="chesterfield" style={{ background: '#1e0a3c' }}>Chesterfield County</option>
                  <option value="richmond" style={{ background: '#1e0a3c' }}>Richmond Metro</option>
                  <option value="all" style={{ background: '#1e0a3c' }}>All Virginia</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/quiz-templates/list')}
              className="flex-1 border-white/20 text-white/70 hover:bg-white/10 bg-transparent py-5">
              Cancel
            </Button>
            <Button type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold py-5"
              disabled={!isStep2Enabled || !competitionType}>
              <Trophy className="h-5 w-5 mr-2" />
              {submitLabel()}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
