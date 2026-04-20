import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Brain, Sparkles, Trophy, FileCode, BookOpen, AlignLeft
} from 'lucide-react';
import { saveQuizTemplate } from '@/components/ui/firebase';
import { generateCompetitionTemplate } from '@/components/api';

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

type QuestionSource = 'subject' | 'jsonImport' | 'manual';

export default function AdminCreateCompetition() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questionsReady, setQuestionsReady] = useState(false);

  const [questionSource, setQuestionSource] = useState<QuestionSource | null>(null);

  // Subject-based
  const [subjectDistribution, setSubjectDistribution] = useState({
    english: 1, mathematics: 0, science: 0, socialStudies: 0, healthWellness: 0
  });
  const [difficulty, setDifficulty] = useState('medium');

  // JSON Import
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [questions, setQuestions] = useState<any[]>([]);

  // Template details — just title + description
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const totalSubjectQuestions = Object.values(subjectDistribution).reduce((a, b) => a + b, 0);
  const isStep2Enabled = questionsReady || questionSource === 'manual';

  const handleGenerateQuestions = async () => {
    if (totalSubjectQuestions === 0) { alert('Please set at least one subject with questions.'); return; }
    try {
      setGenerating(true);
      const result = await generateCompetitionTemplate({
        subjects: subjectDistribution,
        difficulty,
        gradeLevels: ['9', '10', '11', '12']
      });
      if (result.success && result.quiz) {
        const generated = result.quiz.map((q: any) => ({
          question: q.question, options: q.options,
          correctAnswer: q.correctAnswer, explanation: q.explanation || ''
        }));
        setQuestions(generated);
        setQuestionsReady(true);
      } else {
        throw new Error(result.message || 'No questions generated');
      }
    } catch (error: any) {
      alert(`❌ Failed to generate questions.\n\n${error.message}`);
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
        let options: string[] = [];
        if (Array.isArray(q.options)) {
          options = q.options;
        } else if (q.A || q.a) {
          options = [q.A || q.a, q.B || q.b, q.C || q.c, q.D || q.d].filter(Boolean);
        }
        return {
          question: q.question || `Question ${idx + 1}`,
          options,
          correctAnswer: q.correctAnswer || q.correct_answer || q.answer || '',
          explanation: q.explanation || '',
          ...(q.audioUrl ? { audioUrl: q.audioUrl } : {}),
        };
      });
      setQuestions(imported);
      setQuestionsReady(true);
      setJsonInput('');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { alert('Please enter a title.'); return; }
    if (questionSource !== 'manual' && questions.length === 0) {
      alert('Please import or generate questions first.'); return;
    }

    try {
      setSaving(true);
      const formattedQuestions = questions.map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        ...(q.audioUrl ? { audioUrl: q.audioUrl } : {}),
      }));

      const templateId = await saveQuizTemplate({
        title: title.trim(),
        type: 'topic' as const,
        questions: formattedQuestions,
        settings: { difficulty, numQuestions: formattedQuestions.length, quizType: 'multiple-choice' },
        questionHash: Date.now().toString(),
      });

      navigate(`/admin/quiz-templates/${templateId}/edit`);
    } catch (error: any) {
      alert(`❌ Failed to save template.\n\n${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const SourceCard = ({ src, label, desc, icon }: { src: QuestionSource; label: string; desc: string; icon: React.ReactNode }) => (
    <button type="button" onClick={() => { setQuestionSource(src); setQuestionsReady(false); setQuestions([]); setJsonInput(''); setJsonError(''); }}
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

  return (
    <div className="min-h-screen p-4 md:p-6" style={BG_STYLE}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-xl shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8" /> Create Quiz Template
            </h1>
            <p className="text-indigo-100 mt-1 text-sm">Add questions → save template → choose event type from the template</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/quiz-templates/list')}
            className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 font-semibold">
            ← Back
          </Button>
        </div>

        <form onSubmit={handleSaveTemplate} className="space-y-5">

          {/* Step 1: Question Source */}
          <div className="p-5 space-y-4" style={GLASS}>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-400" /> Step 1: Choose Question Source
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SourceCard src="subject"    label="Subject Based"  desc="AI generates by curriculum area" icon={<BookOpen className="h-4 w-4" />} />
              <SourceCard src="jsonImport" label="JSON Import"    desc="Paste JSON from ChatGPT or any source" icon={<FileCode className="h-4 w-4" />} />
              <SourceCard src="manual"     label="Manual Entry"   desc="Add/edit questions after saving" icon={<AlignLeft className="h-4 w-4" />} />
            </div>
          </div>

          {/* Subject-based generation */}
          {questionSource === 'subject' && (
            <div className="p-5 space-y-4" style={GLASS}>
              <h2 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" /> Generate Questions with AI
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
                  <span className="text-blue-300 font-medium">AI is generating questions… 30–60 seconds</span>
                </div>
              )}
              {questionsReady && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <p className="text-green-300 font-medium">✅ {questions.length} questions ready!</p>
                </div>
              )}
              <Button type="button" onClick={handleGenerateQuestions}
                disabled={generating || questionsReady}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold py-5">
                {generating ? <><Brain className="h-5 w-5 mr-2 animate-spin" />Generating…</>
                  : questionsReady ? <><Sparkles className="h-5 w-5 mr-2" />✅ {questions.length} Questions Ready</>
                  : <><Sparkles className="h-5 w-5 mr-2" />Generate Questions with AI</>}
              </Button>
            </div>
          )}

          {/* JSON Import */}
          {questionSource === 'jsonImport' && (
            <div className="p-5 space-y-4" style={GLASS}>
              <h2 className="font-bold text-white flex items-center gap-2">
                <FileCode className="h-4 w-4 text-yellow-400" /> Import Questions from JSON
              </h2>
              <p className="text-xs text-white/50">Paste a JSON array from ChatGPT. Optionally include <code className="text-purple-300">"audioUrl"</code> per question.</p>
              <textarea
                value={jsonInput}
                onChange={e => { setJsonInput(e.target.value); setJsonError(''); }}
                rows={8}
                style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.75rem' } as React.CSSProperties}
                placeholder={'[\n  {\n    "question": "...",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswer": "A",\n    "explanation": "..."\n  }\n]'}
              />
              {jsonError && <p className="text-red-400 text-sm font-medium">Error: {jsonError}</p>}
              {questionsReady && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <p className="text-green-300 font-medium">✅ {questions.length} questions imported!</p>
                </div>
              )}
              <Button type="button" onClick={handleJsonImport}
                disabled={!jsonInput.trim() || questionsReady}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold py-5">
                <FileCode className="h-5 w-5 mr-2" />
                {questionsReady ? `✅ ${questions.length} Questions Imported` : 'Import Questions'}
              </Button>
              {questionsReady && (
                <button type="button" onClick={() => { setQuestionsReady(false); setQuestions([]); }}
                  className="text-xs text-white/40 hover:text-white/70 underline">
                  Clear and re-import
                </button>
              )}
            </div>
          )}

          {questionSource === 'manual' && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <p className="text-blue-300 flex items-center gap-2 text-sm">
                <AlignLeft className="h-4 w-4 flex-shrink-0" />
                <span>Save the template below — you'll be taken to the question editor to add questions and audio.</span>
              </p>
            </div>
          )}

          {/* Step 2: Title + Description only */}
          <div className={`p-5 space-y-4 transition-opacity ${!isStep2Enabled ? 'opacity-40 pointer-events-none' : ''}`} style={GLASS}>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" /> Step 2: Template Details
            </h2>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Title *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                style={INPUT_STYLE} placeholder="e.g., Odia Culture Quiz — April 2026"
                disabled={!isStep2Enabled} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Description <span className="text-white/30">(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                style={{ ...INPUT_STYLE, resize: 'vertical' } as React.CSSProperties}
                placeholder="Brief description of this quiz..." disabled={!isStep2Enabled} />
            </div>
            <p className="text-xs text-white/40">
              After saving you'll land on the template editor — add audio, edit questions, then create a Live Event, Practice, or Scholarship from there.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/quiz-templates/list')}
              className="flex-1 border-white/20 text-white/70 hover:bg-white/10 bg-transparent py-5">
              Cancel
            </Button>
            <Button type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold py-5"
              disabled={!isStep2Enabled || !title.trim() || saving}>
              {saving
                ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Saving…</>
                : <><Trophy className="h-5 w-5 mr-2" />Save Quiz Template</>
              }
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
