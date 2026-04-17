// Admin Edit Quiz Template - Edit existing quiz template questions
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, getQuizTemplate } from '../components/ui/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../components/ui/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle, XCircle, Edit2, Save, AlertTriangle,
  Brain, ArrowLeft, Plus, Upload, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: string;
  explanation: string;
}

// ── Helpers ──────────────────────────────────────────────

function normalizeCorrectAnswer(q: Question): string {
  const val = q.correctAnswer;
  if (['A', 'B', 'C', 'D'].includes(val)) return val;
  const entry = Object.entries(q.options).find(([, v]) => v === val);
  return entry ? entry[0] : 'A';
}

function normalizeImportedQuestion(raw: any, id: number): Question | null {
  try {
    let options: { A: string; B: string; C: string; D: string };
    if (Array.isArray(raw.options)) {
      options = {
        A: raw.options[0] || '',
        B: raw.options[1] || '',
        C: raw.options[2] || '',
        D: raw.options[3] || '',
      };
    } else {
      options = { A: raw.options?.A || '', B: raw.options?.B || '', C: raw.options?.C || '', D: raw.options?.D || '' };
    }

    let correctAnswer = raw.correctAnswer || 'A';
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      const entry = Object.entries(options).find(([, v]) => v === correctAnswer);
      correctAnswer = entry ? entry[0] : 'A';
    }

    return {
      id,
      question: raw.question || '',
      options,
      correctAnswer,
      explanation: raw.explanation || '',
    };
  } catch {
    return null;
  }
}

function blankQuestion(id: number): Question {
  return {
    id,
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    explanation: '',
  };
}

const GLASS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' };
const INPUT_STYLE = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' };

export default function AdminEditQuizTemplate() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [templateTitle, setTemplateTitle] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => { checkAdminAndLoad(); }, [user, templateId]);

  const checkAdminAndLoad = async () => {
    if (!user) { navigate('/'); return; }
    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) { alert('Access denied. Admin privileges required.'); navigate('/'); return; }
    await loadTemplate();
  };

  const loadTemplate = async () => {
    if (!templateId) { navigate('/admin/quiz-templates/list'); return; }
    try {
      setLoading(true);
      const template = await getQuizTemplate(templateId);
      if (!template) { navigate('/admin/quiz-templates/list'); return; }
      setTemplateTitle(template.title);

      const normalized = (template.questions || []).map((q: Question) => {
        // Normalize array options → {A,B,C,D} object format
        let options = q.options as any;
        if (Array.isArray(options)) {
          options = { A: options[0] || '', B: options[1] || '', C: options[2] || '', D: options[3] || '' };
        }
        const normalized_q = { ...q, options } as Question;
        return { ...normalized_q, correctAnswer: normalizeCorrectAnswer(normalized_q) };
      });
      setQuestions(normalized);
    } catch (error) {
      console.error('❌ Error loading template:', error);
      toast({ title: 'Error', description: 'Failed to load quiz template', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    const q = questions[index];
    setEditingIndex(index);
    setEditedQuestion({ ...q, correctAnswer: normalizeCorrectAnswer(q) });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editedQuestion) {
      const updated = [...questions];
      updated[editingIndex] = { ...editedQuestion, correctAnswer: editedQuestion.correctAnswer };
      setQuestions(updated);
      setEditingIndex(null);
      setEditedQuestion(null);
      toast({ title: 'Question Updated', description: "Click 'Save All Changes' to persist." });
    }
  };

  const handleCancelEdit = () => { setEditingIndex(null); setEditedQuestion(null); };

  const handleRemoveQuestion = (index: number) => {
    if (!confirm('Remove this question?')) return;
    setQuestions(questions.filter((_, i) => i !== index));
    toast({ title: 'Question Removed', description: "Click 'Save All Changes' to persist." });
  };

  const handleAddQuestion = () => {
    const newQ = blankQuestion(Date.now());
    const newList = [...questions, newQ];
    setQuestions(newList);
    const newIndex = newList.length - 1;
    setEditingIndex(newIndex);
    setEditedQuestion({ ...newQ });
    setTimeout(() => {
      document.getElementById(`question-card-${newIndex}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImport = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importText.trim());
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setImportError('JSON must be a non-empty array of questions.');
        return;
      }
      const imported: Question[] = [];
      const errors: number[] = [];
      parsed.forEach((raw, i) => {
        const q = normalizeImportedQuestion(raw, Date.now() + i);
        if (q && q.question && q.options.A) {
          imported.push(q);
        } else {
          errors.push(i + 1);
        }
      });

      if (imported.length === 0) {
        setImportError('No valid questions found. Check the JSON format.');
        return;
      }

      setQuestions(prev => [...prev, ...imported]);
      setShowImport(false);
      setImportText('');
      toast({
        title: `Imported ${imported.length} questions`,
        description: errors.length > 0
          ? `${errors.length} questions skipped (invalid format at positions: ${errors.join(', ')})`
          : "All questions imported. Click 'Save All Changes' to persist.",
      });
    } catch {
      setImportError('Invalid JSON. Please check the format and try again.');
    }
  };

  const handleSaveAll = async () => {
    if (questions.length === 0) {
      toast({ title: 'Cannot Save', description: 'Template must have at least one question', variant: 'destructive' });
      return;
    }
    if (!templateId) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, 'quizTemplates', templateId), {
        questions,
        updatedAt: Timestamp.now()
      });
      toast({ title: 'Success!', description: `Template updated with ${questions.length} questions` });
      setTimeout(() => navigate('/admin/quiz-templates/list'), 1500);
    } catch (error) {
      console.error('❌ Error saving template:', error);
      toast({ title: 'Save Failed', description: 'Failed to save changes. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl text-white">
                  <Brain className="h-8 w-8" />
                  Edit Quiz Template
                </CardTitle>
                <p className="text-purple-100 mt-1">{templateTitle}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/quiz-templates/list')}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-bold text-white">{questions.length}</p>
                <p className="text-sm text-purple-100">Total Questions</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-bold text-white">{editingIndex !== null ? '✏️' : '✓'}</p>
                <p className="text-sm text-purple-100">{editingIndex !== null ? 'Editing' : 'Ready'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleAddQuestion}
            disabled={editingIndex !== null}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
          <Button
            onClick={() => { setShowImport(true); setImportError(''); setImportText(''); }}
            disabled={editingIndex !== null}
            variant="outline"
            className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import from JSON (ChatGPT)
          </Button>
        </div>

        {/* JSON Import Panel */}
        {showImport && (
          <Card style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-purple-200 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Questions from JSON
                </CardTitle>
                <button onClick={() => setShowImport(false)} className="text-white/40 hover:text-white/80">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg p-4 text-sm space-y-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="font-semibold text-purple-200">Ask ChatGPT to generate questions in this format:</p>
                <pre className="rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap text-white/70" style={{ background: 'rgba(0,0,0,0.3)' }}>{`[
  {
    "question": "What is the classical dance form of Odisha?",
    "options": ["Bharatanatyam", "Odissi", "Kathak", "Kuchipudi"],
    "correctAnswer": "Odissi",
    "explanation": "Odissi is one of the oldest classical dance forms from Odisha."
  }
]`}</pre>
                <p className="text-xs text-white/40">
                  Tip: Tell ChatGPT "Return ONLY valid JSON, no other text" and specify how many questions you need.
                </p>
              </div>

              <textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
                placeholder="Paste your JSON here..."
                className="w-full h-48 p-3 rounded-lg font-mono text-sm outline-none resize-y text-white placeholder-white/30"
                style={{ ...INPUT_STYLE, borderColor: 'rgba(124,58,237,0.4)' }}
              />

              {importError && (
                <div className="flex items-start gap-2 rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{importError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Questions
                </Button>
                <Button variant="outline" onClick={() => setShowImport(false)}
                  className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 && (
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.2)' }}>
              <CardContent className="pt-8 pb-8 text-center text-white/40">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No questions yet</p>
                <p className="text-sm mt-1">Click "Add Question" or "Import from JSON" to get started</p>
              </CardContent>
            </Card>
          )}

          {questions.map((q, index) => {
            const correctKey = normalizeCorrectAnswer(q);
            const isEditing = editingIndex === index;

            return (
              <Card
                key={q.id}
                id={`question-card-${index}`}
                style={isEditing
                  ? { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: '0.5rem' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <CardTitle className="text-base flex items-start gap-2 flex-1 min-w-0">
                      <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedQuestion?.question || ''}
                          onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, question: e.target.value } : null)}
                          placeholder="Enter question text..."
                          className="flex-1 p-2 rounded text-white text-sm w-full"
                          style={INPUT_STYLE}
                          autoFocus
                        />
                      ) : (
                        <span className="text-white text-sm">{q.question || <span className="text-white/30 italic">No question text</span>}</span>
                      )}
                    </CardTitle>
                    <div className="flex gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                            <Save className="h-4 w-4 mr-1" />Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}
                            className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent">Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(index)} disabled={editingIndex !== null}
                            className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent">
                            <Edit2 className="h-4 w-4 mr-1" />Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveQuestion(index)} disabled={editingIndex !== null}>
                            <XCircle className="h-4 w-4 mr-1" />Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Options */}
                  <div className="grid grid-cols-1 gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const isCorrect = isEditing
                        ? editedQuestion?.correctAnswer === key
                        : correctKey === key;

                      return (
                        <div
                          key={key}
                          style={isCorrect
                          ? { background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.5)', borderRadius: '0.5rem', padding: '0.75rem' }
                          : { background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.75rem' }
                        }
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-400 w-5 flex-shrink-0">{key}.</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedQuestion?.options[key] || ''}
                                onChange={(e) => setEditedQuestion(prev => prev ? {
                                  ...prev,
                                  options: { ...prev.options, [key]: e.target.value }
                                } : null)}
                                placeholder={`Option ${key}...`}
                                className="flex-1 p-1.5 rounded text-sm text-white"
                                style={INPUT_STYLE}
                              />
                            ) : (
                              <span className="flex-1 text-sm text-white/80">
                                {q.options[key] || <span className="text-white/20 italic">empty</span>}
                              </span>
                            )}
                            {isCorrect && <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Correct Answer Selector — only when editing */}
                  {isEditing && (
                    <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <label className="font-semibold text-green-300 text-sm whitespace-nowrap">
                        Correct Answer:
                      </label>
                      <select
                        value={editedQuestion?.correctAnswer || 'A'}
                        onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, correctAnswer: e.target.value } : null)}
                        className="p-2 rounded text-sm font-bold text-green-300"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)' }}
                      >
                        {(['A', 'B', 'C', 'D'] as const).map(k => (
                          <option key={k} value={k} style={{ background: '#1e0a3c' }}>
                            {k} — {editedQuestion?.options[k] || '(empty)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="rounded-lg p-3" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                    <p className="text-xs font-semibold text-blue-300 mb-1">Explanation:</p>
                    {isEditing ? (
                      <textarea
                        value={editedQuestion?.explanation || ''}
                        onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, explanation: e.target.value } : null)}
                        placeholder="Enter explanation..."
                        className="w-full p-2 rounded text-sm text-white"
                        style={INPUT_STYLE}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-blue-200/80">
                        {q.explanation || <span className="text-white/30 italic">No explanation</span>}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Action Bar */}
        <Card style={GLASS}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/admin/quiz-templates/list')} disabled={saving}
                  className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddQuestion}
                  disabled={editingIndex !== null || saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
              <Button
                onClick={handleSaveAll}
                disabled={saving || editingIndex !== null}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Saving...</>
                ) : (
                  <><CheckCircle className="h-5 w-5 mr-2" />Save All Changes ({questions.length} questions)</>
                )}
              </Button>
            </div>
            {editingIndex !== null && (
              <p className="text-sm text-amber-400 mt-3 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Please save or cancel the current edit before saving all changes
              </p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
