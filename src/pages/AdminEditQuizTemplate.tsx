// Admin Edit Quiz Template - Edit existing quiz template questions
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, getQuizTemplate } from '../components/ui/firebase';
import { doc, updateDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { db, uploadQuestionAudio } from '../components/ui/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle, XCircle, Edit2, Save, AlertTriangle,
  Brain, ArrowLeft, Plus, Upload, X, Music, Loader2, Pencil,
  Library, ChevronDown, ChevronRight
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
      ...(raw.audioUrl ? { audioUrl: raw.audioUrl } : {}),
    };
  } catch {
    return null;
  }
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

  const [editingTitle, setEditingTitle] = useState(false);

  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTemplates, setLibraryTemplates] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<{ templateId: string; question: Question }[]>([]);

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

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

  const isQuestionSelected = (tid: string, qId: number) =>
    selectedQuestions.some(s => s.templateId === tid && s.question.id === qId);

  const toggleQuestionSelect = (tid: string, q: Question) => {
    setSelectedQuestions(prev =>
      isQuestionSelected(tid, q.id)
        ? prev.filter(s => !(s.templateId === tid && s.question.id === q.id))
        : [...prev, { templateId: tid, question: q }]
    );
  };

  const addSelectedToQuiz = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const toAdd = selectedQuestions.map((s, i) => ({ ...s.question, id: nextId + i }));
    setQuestions(prev => [...prev, ...toAdd]);
    setSelectedQuestions([]);
    setShowLibrary(false);
    toast({ title: `${toAdd.length} question${toAdd.length !== 1 ? 's' : ''} added`, description: "Click 'Save All Changes' to persist." });
  };

  const handleAudioUpload = async (file: File) => {
    if (!editedQuestion) return;
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|mp4)$/i.test(file.name);
    if (!isAudio) {
      toast({ title: 'Invalid file', description: 'Please select an audio file (MP3, etc.)', variant: 'destructive' });
      return;
    }
    try {
      setUploadingAudio(true);
      const url = await uploadQuestionAudio(editedQuestion.id, file);
      setEditedQuestion(prev => prev ? { ...prev, audioUrl: url } : null);
      toast({ title: 'Audio uploaded!', description: 'Song will play when this question appears.' });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload audio. Try again.', variant: 'destructive' });
    } finally {
      setUploadingAudio(false);
    }
  };

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
        title: templateTitle,
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
                <div className="mt-2 flex items-center gap-2">
                  {editingTitle ? (
                    <input
                      type="text"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                      onBlur={() => setEditingTitle(false)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
                      className="text-white text-base font-medium bg-white/10 border border-white/30 rounded px-2 py-1 outline-none w-72"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingTitle(true)}
                      className="flex items-center gap-2 text-purple-100 hover:text-white group"
                    >
                      <span className="text-base font-medium">{templateTitle || 'Untitled Quiz'}</span>
                      <Pencil className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                    </button>
                  )}
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
            onClick={openLibrary}
            disabled={editingIndex !== null}
            variant="outline"
            className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20 bg-transparent"
          >
            <Library className="h-4 w-4 mr-2" />
            Add from Library
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
                <p className="text-center text-white/40 py-6">No other quiz templates found.</p>
              )}
              {libraryTemplates
                .filter(t => t.id !== templateId)
                .map(template => {
                  const qs: Question[] = (template.questions || []).map((q: any, i: number) => normalizeQuestion(q, i));
                  const isExpanded = expandedTemplate === template.id;
                  return (
                    <div key={template.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
                      <button
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 rounded-t"
                        onClick={() => setExpandedTemplate(prev => prev === template.id ? null : template.id)}
                      >
                        <div>
                          <span className="font-semibold text-white">{template.title || 'Untitled'}</span>
                          <span className="ml-2 text-xs text-white/40">{qs.length} questions</span>
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-white/50" /> : <ChevronRight className="h-4 w-4 text-white/50" />}
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          {qs.map(q => {
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
    "explanation": "Odissi is one of the oldest classical dance forms from Odisha.",
    "audioUrl": "https://..."  (optional — public MP3 URL)
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

                  {/* Audio */}
                  {isEditing ? (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
                      <p className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1">
                        <Music className="h-3.5 w-3.5" /> Question Audio (optional)
                      </p>
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept=".mp3,.mp4,.wav,.ogg,.m4a,audio/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioUpload(f); }}
                      />
                      {editedQuestion?.audioUrl ? (
                        <div className="space-y-2">
                          <audio controls src={editedQuestion.audioUrl} className="w-full h-8" style={{ accentColor: '#a855f7' }} />
                          <div className="flex gap-2">
                            <button
                              onClick={() => audioInputRef.current?.click()}
                              disabled={uploadingAudio}
                              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-purple-300 hover:text-purple-100"
                              style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}
                            >
                              <Upload className="h-3 w-3" /> Replace
                            </button>
                            <button
                              onClick={() => setEditedQuestion(prev => prev ? { ...prev, audioUrl: undefined } : null)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-red-400 hover:text-red-300"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                              <X className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => audioInputRef.current?.click()}
                          disabled={uploadingAudio}
                          className="flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold text-purple-300 hover:text-purple-100 w-full justify-center"
                          style={{ background: 'rgba(168,85,247,0.15)', border: '1.5px dashed rgba(168,85,247,0.4)' }}
                        >
                          {uploadingAudio ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                          ) : (
                            <><Music className="h-4 w-4" /> Upload MP3 song for this question</>
                          )}
                        </button>
                      )}
                    </div>
                  ) : q.audioUrl ? (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
                      <Music className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span className="text-purple-300 text-xs font-semibold">Song attached</span>
                    </div>
                  ) : null}
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
