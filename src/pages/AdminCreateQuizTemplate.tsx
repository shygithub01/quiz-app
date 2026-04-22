// Admin Create Quiz Template - Create a new quiz template, optionally importing questions from existing templates
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../components/ui/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../components/ui/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain, ArrowLeft, Plus, Save, CheckCircle, XCircle,
  Edit2, AlertTriangle, Library, ChevronDown, ChevronRight, X, Pencil
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: string;
  explanation: string;
  audioUrl?: string;
}

function normalizeCorrectAnswer(q: Question): string {
  const val = q.correctAnswer;
  if (['A', 'B', 'C', 'D'].includes(val)) return val;
  const entry = Object.entries(q.options).find(([, v]) => v === val);
  return entry ? entry[0] : 'A';
}

function normalizeQuestion(raw: any, id: number): Question {
  let options: { A: string; B: string; C: string; D: string };
  if (Array.isArray(raw.options)) {
    options = { A: raw.options[0] || '', B: raw.options[1] || '', C: raw.options[2] || '', D: raw.options[3] || '' };
  } else {
    options = { A: raw.options?.A || '', B: raw.options?.B || '', C: raw.options?.C || '', D: raw.options?.D || '' };
  }
  const KEYS = ['A', 'B', 'C', 'D'] as const;
  let correctAnswer = 'A';
  const rawCA = raw.correctAnswer;
  if (typeof rawCA === 'number') {
    correctAnswer = KEYS[rawCA] ?? 'A';
  } else if (KEYS.includes(rawCA)) {
    correctAnswer = rawCA;
  } else if (rawCA) {
    const trimmed = String(rawCA).trim();
    const entry = Object.entries(options).find(([, v]) => v.trim() === trimmed);
    correctAnswer = entry ? entry[0] : 'A';
  }
  return { id, question: raw.question || '', options, correctAnswer, explanation: raw.explanation || '', ...(raw.audioUrl ? { audioUrl: raw.audioUrl } : {}) };
}

function blankQuestion(id: number): Question {
  return { id, question: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', explanation: '' };
}

const BG_STYLE = { background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' };
const GLASS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' };
const INPUT_STYLE = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' };

export default function AdminCreateQuizTemplate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTitle, setEditingTitle] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);

  // Library drawer state
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTemplates, setLibraryTemplates] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<{ templateId: string; question: Question }[]>([]);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkAdmin(); }, [user]);

  const checkAdmin = async () => {
    if (!user) { navigate('/'); return; }
    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) { alert('Access denied. Admin privileges required.'); navigate('/'); return; }
  };

  const openLibrary = async () => {
    setShowLibrary(true);
    if (libraryTemplates.length > 0) return;
    try {
      setLibraryLoading(true);
      const snap = await getDocs(collection(db, 'quizTemplates'));
      setLibraryTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally {
      setLibraryLoading(false);
    }
  };

  const toggleTemplateExpand = (id: string) => {
    setExpandedTemplate(prev => prev === id ? null : id);
  };

  const isQuestionSelected = (templateId: string, qId: number) =>
    selectedQuestions.some(s => s.templateId === templateId && s.question.id === qId);

  const toggleQuestionSelect = (templateId: string, q: Question) => {
    setSelectedQuestions(prev =>
      isQuestionSelected(templateId, q.id)
        ? prev.filter(s => !(s.templateId === templateId && s.question.id === q.id))
        : [...prev, { templateId, question: q }]
    );
  };

  const addSelectedToQuiz = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const toAdd = selectedQuestions.map((s, i) => ({ ...s.question, id: nextId + i }));
    setQuestions(prev => [...prev, ...toAdd]);
    setSelectedQuestions([]);
    setShowLibrary(false);
    toast({ title: `${toAdd.length} question${toAdd.length !== 1 ? 's' : ''} added`, description: "Click 'Save Quiz' when ready." });
  };

  const handleAddBlank = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions(prev => [...prev, blankQuestion(nextId)]);
    setEditingIndex(questions.length);
    setEditedQuestion(blankQuestion(nextId));
  };

  const handleEdit = (index: number) => {
    const q = questions[index];
    setEditingIndex(index);
    setEditedQuestion({ ...q, correctAnswer: normalizeCorrectAnswer(q) });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editedQuestion) {
      const updated = [...questions];
      updated[editingIndex] = editedQuestion;
      setQuestions(updated);
      setEditingIndex(null);
      setEditedQuestion(null);
      toast({ title: 'Question updated', description: "Click 'Save Quiz' to persist." });
    }
  };

  const handleCancelEdit = () => { setEditingIndex(null); setEditedQuestion(null); };

  const handleRemove = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please give your quiz a title.', variant: 'destructive' });
      setEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 50);
      return;
    }
    if (questions.length === 0) {
      toast({ title: 'No questions', description: 'Add at least one question before saving.', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, 'quizTemplates'), {
        title: title.trim(),
        description: description.trim(),
        questions,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({ title: 'Quiz created!', description: `"${title.trim()}" saved with ${questions.length} questions.` });
      setTimeout(() => navigate(`/admin/quiz-templates/${docRef.id}/edit`), 1200);
    } catch {
      toast({ title: 'Save failed', description: 'Could not create quiz. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-4 md:p-6 -mx-4 md:-mx-6 -mt-8 md:-mt-12" style={BG_STYLE}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header card */}
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-white" />
                <div>
                  <CardTitle className="text-2xl text-white">New Quiz Template</CardTitle>
                  <p className="text-purple-200 text-sm mt-0.5">Build from scratch or pick from your library</p>
                </div>
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
        </Card>

        {/* Title & description */}
        <Card style={GLASS}>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-purple-300 mb-1 block">Quiz Title *</label>
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => { if (title.trim()) setEditingTitle(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) setEditingTitle(false); }}
                  placeholder="e.g. Indian History – Chapter 3"
                  className="w-full p-3 rounded-lg text-white text-lg font-medium outline-none"
                  style={INPUT_STYLE}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="flex items-center gap-2 text-white hover:text-purple-200 group w-full text-left"
                >
                  <span className="text-lg font-medium">{title}</span>
                  <Pencil className="h-4 w-4 opacity-40 group-hover:opacity-80 flex-shrink-0" />
                </button>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-purple-300 mb-1 block">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of this quiz..."
                className="w-full p-3 rounded-lg text-white text-sm outline-none resize-none"
                style={INPUT_STYLE}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleAddBlank}
            disabled={editingIndex !== null}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Blank Question
          </Button>
          <Button
            onClick={openLibrary}
            disabled={editingIndex !== null}
            variant="outline"
            className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
          >
            <Library className="h-4 w-4 mr-2" />
            Add from Library
          </Button>
        </div>

        {/* Library Drawer */}
        {showLibrary && (
          <Card style={{ background: 'rgba(99,60,180,0.12)', border: '1px solid rgba(139,92,246,0.4)' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-purple-200 flex items-center gap-2">
                  <Library className="h-5 w-5" />
                  Pick Questions from Library
                </CardTitle>
                <button onClick={() => { setShowLibrary(false); setSelectedQuestions([]); }} className="text-white/40 hover:text-white/80">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-white/50">Expand a template, check the questions you want, then click Add.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {libraryLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
                </div>
              )}

              {!libraryLoading && libraryTemplates.length === 0 && (
                <p className="text-center text-white/40 py-6">No existing quiz templates found.</p>
              )}

              {libraryTemplates.map(template => {
                const qs: Question[] = (template.questions || []).map((q: any, i: number) => normalizeQuestion(q, i));
                const isExpanded = expandedTemplate === template.id;
                return (
                  <div key={template.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
                    <button
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 rounded-t"
                      onClick={() => toggleTemplateExpand(template.id)}
                    >
                      <div>
                        <span className="font-semibold text-white">{template.title || 'Untitled'}</span>
                        <span className="ml-2 text-xs text-white/40">{qs.length} questions</span>
                      </div>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-white/50" /> : <ChevronRight className="h-4 w-4 text-white/50" />}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {qs.map((q) => {
                          const selected = isQuestionSelected(template.id, q.id);
                          return (
                            <label
                              key={q.id}
                              className="flex items-start gap-3 p-2 rounded cursor-pointer hover:bg-white/5"
                              style={selected ? { background: 'rgba(139,92,246,0.15)', borderRadius: '0.375rem' } : {}}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleQuestionSelect(template.id, q)}
                                className="mt-0.5 accent-purple-500"
                              />
                              <span className="text-sm text-white/80 leading-snug">{q.question || <span className="italic text-white/30">No text</span>}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedQuestions.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-sm text-purple-300">{selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected</span>
                  <Button onClick={addSelectedToQuiz} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add Selected
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Question list */}
        <div className="space-y-4">
          {questions.length === 0 && (
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.2)' }}>
              <CardContent className="pt-8 pb-8 text-center text-white/40">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No questions yet</p>
                <p className="text-sm mt-1">Add a blank question or pick from your library</p>
              </CardContent>
            </Card>
          )}

          {questions.map((q, index) => {
            const correctKey = normalizeCorrectAnswer(q);
            const isEditing = editingIndex === index;
            return (
              <Card
                key={q.id}
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
                          <Button size="sm" variant="destructive" onClick={() => handleRemove(index)} disabled={editingIndex !== null}>
                            <XCircle className="h-4 w-4 mr-1" />Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const isCorrect = isEditing ? editedQuestion?.correctAnswer === key : correctKey === key;
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
                                onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, options: { ...prev.options, [key]: e.target.value } } : null)}
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

                  {isEditing && (
                    <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <label className="font-semibold text-green-300 text-sm whitespace-nowrap">Correct Answer:</label>
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

        {/* Bottom action bar */}
        <Card style={GLASS}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/admin/quiz-templates/list')} disabled={saving}
                  className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBlank}
                  disabled={editingIndex !== null || saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || editingIndex !== null}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Saving...</>
                ) : (
                  <><CheckCircle className="h-5 w-5 mr-2" />Save Quiz ({questions.length} question{questions.length !== 1 ? 's' : ''})</>
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
    </div>
  );
}
