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
  correctAnswer: string; // Always stored as A/B/C/D key
  explanation: string;
}

// ── Helpers ──────────────────────────────────────────────

/** Normalize correctAnswer to key format (A/B/C/D) */
function normalizeCorrectAnswer(q: Question): string {
  const val = q.correctAnswer;
  if (['A', 'B', 'C', 'D'].includes(val)) return val;
  // If stored as option text, find the matching key
  const entry = Object.entries(q.options).find(([, v]) => v === val);
  return entry ? entry[0] : 'A';
}

/** Convert imported JSON question (correctAnswer = text) to internal format */
function normalizeImportedQuestion(raw: any, id: number): Question | null {
  try {
    // Support both array options and object options
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

    // correctAnswer could be "A"/"B"/"C"/"D" or the actual option text
    let correctAnswer = raw.correctAnswer || 'A';
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      // Find the key whose value matches
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

// ── Blank question factory ────────────────────────────────
function blankQuestion(id: number): Question {
  return {
    id,
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    explanation: '',
  };
}

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

  // JSON import state
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

      // Normalize all correctAnswers to key format on load
      const normalized = (template.questions || []).map((q: Question) => ({
        ...q,
        correctAnswer: normalizeCorrectAnswer(q),
      }));
      setQuestions(normalized);
    } catch (error) {
      console.error('❌ Error loading template:', error);
      toast({ title: 'Error', description: 'Failed to load quiz template', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Edit handlers ────────────────────────────────────────

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

  // ── Add question ─────────────────────────────────────────

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

  // ── JSON import ──────────────────────────────────────────

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

  // ── Save all ─────────────────────────────────────────────

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

  // ── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">

      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
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
              <p className="text-3xl font-bold">{questions.length}</p>
              <p className="text-sm text-purple-100">Total Questions</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-3xl font-bold">{editingIndex !== null ? '✏️' : '✓'}</p>
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
          className="border-purple-400 text-purple-700 hover:bg-purple-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import from JSON (ChatGPT)
        </Button>
      </div>

      {/* JSON Import Panel */}
      {showImport && (
        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Questions from JSON
              </CardTitle>
              <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200 text-sm text-gray-700 space-y-2">
              <p className="font-semibold text-purple-800">Ask ChatGPT to generate questions in this format:</p>
              <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap">{`[
  {
    "question": "What is the classical dance form of Odisha?",
    "options": ["Bharatanatyam", "Odissi", "Kathak", "Kuchipudi"],
    "correctAnswer": "Odissi",
    "explanation": "Odissi is one of the oldest classical dance forms from Odisha."
  }
]`}</pre>
              <p className="text-xs text-gray-500">
                Tip: Tell ChatGPT "Return ONLY valid JSON, no other text" and specify how many questions you need.
              </p>
            </div>

            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder="Paste your JSON here..."
              className="w-full h-48 p-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-purple-500 outline-none resize-y"
            />

            {importError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{importError}</p>
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
              <Button variant="outline" onClick={() => setShowImport(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 && (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="pt-8 pb-8 text-center text-gray-500">
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
            <Card key={q.id} id={`question-card-${index}`} className={`border-2 ${isEditing ? 'border-purple-400' : 'border-gray-200'}`}>
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
                        className="flex-1 p-2 border rounded text-gray-900 text-sm w-full"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-900 text-sm">{q.question || <span className="text-gray-400 italic">No question text</span>}</span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                          <Save className="h-4 w-4 mr-1" />Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(index)} disabled={editingIndex !== null}>
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
                        className={`p-3 rounded-lg border-2 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-600 w-5 flex-shrink-0">{key}.</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedQuestion?.options[key] || ''}
                              onChange={(e) => setEditedQuestion(prev => prev ? {
                                ...prev,
                                options: { ...prev.options, [key]: e.target.value }
                              } : null)}
                              placeholder={`Option ${key}...`}
                              className="flex-1 p-1.5 border rounded text-sm"
                            />
                          ) : (
                            <span className="flex-1 text-sm">{q.options[key] || <span className="text-gray-300 italic">empty</span>}</span>
                          )}
                          {isCorrect && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Correct Answer Selector — only when editing */}
                {isEditing && (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <label className="font-semibold text-green-900 text-sm whitespace-nowrap">
                      Correct Answer:
                    </label>
                    <select
                      value={editedQuestion?.correctAnswer || 'A'}
                      onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, correctAnswer: e.target.value } : null)}
                      className="p-2 border border-green-300 rounded text-sm font-bold text-green-800 bg-white"
                    >
                      {(['A', 'B', 'C', 'D'] as const).map(k => (
                        <option key={k} value={k}>
                          {k} — {editedQuestion?.options[k] || '(empty)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Explanation */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Explanation:</p>
                  {isEditing ? (
                    <textarea
                      value={editedQuestion?.explanation || ''}
                      onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, explanation: e.target.value } : null)}
                      placeholder="Enter explanation..."
                      className="w-full p-2 border rounded text-sm"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-blue-800">{q.explanation || <span className="text-gray-400 italic">No explanation</span>}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/admin/quiz-templates/list')} disabled={saving}>
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
            <p className="text-sm text-amber-600 mt-3 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Please save or cancel the current edit before saving all changes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
