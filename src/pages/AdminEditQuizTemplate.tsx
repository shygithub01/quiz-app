// Admin Edit Quiz Template - Edit existing quiz template questions
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, getQuizTemplate } from '../components/ui/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../components/ui/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Edit2, Save, AlertTriangle, Brain, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
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
  
  useEffect(() => {
    checkAdminAndLoad();
  }, [user, templateId]);
  
  const checkAdminAndLoad = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) {
      alert('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    await loadTemplate();
  };
  
  const loadTemplate = async () => {
    if (!templateId) {
      toast({
        title: "Error",
        description: "No template ID provided",
        variant: "destructive"
      });
      navigate('/admin/quiz-templates/list');
      return;
    }
    
    try {
      setLoading(true);
      const template = await getQuizTemplate(templateId);
      
      if (!template) {
        toast({
          title: "Template Not Found",
          description: "The quiz template could not be found",
          variant: "destructive"
        });
        navigate('/admin/quiz-templates/list');
        return;
      }
      
      setTemplateTitle(template.title);
      setQuestions(template.questions || []);
      console.log('✅ Loaded template:', template.title, 'with', template.questions?.length, 'questions');
    } catch (error) {
      console.error('❌ Error loading template:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedQuestion({ ...questions[index] });
  };
  
  const handleSaveEdit = () => {
    if (editingIndex !== null && editedQuestion) {
      const updated = [...questions];
      updated[editingIndex] = editedQuestion;
      setQuestions(updated);
      setEditingIndex(null);
      setEditedQuestion(null);
      
      toast({
        title: "Question Updated",
        description: "Changes saved locally. Click 'Save All Changes' to persist."
      });
    }
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion(null);
  };
  
  const handleRemoveQuestion = (index: number) => {
    if (!confirm('Are you sure you want to remove this question?')) return;
    
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    
    toast({
      title: "Question Removed",
      description: "Question removed. Click 'Save All Changes' to persist."
    });
  };
  
  const handleSaveAll = async () => {
    if (questions.length === 0) {
      toast({
        title: "Cannot Save",
        description: "Template must have at least one question",
        variant: "destructive"
      });
      return;
    }
    
    if (!templateId) return;
    
    try {
      setSaving(true);
      
      // Update the quiz template in Firestore
      const templateRef = doc(db, 'quizTemplates', templateId);
      await updateDoc(templateRef, {
        questions,
        updatedAt: Timestamp.now()
      });
      
      toast({
        title: "Success!",
        description: `Template updated with ${questions.length} questions`
      });
      
      // Navigate back to list
      setTimeout(() => {
        navigate('/admin/quiz-templates/list');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error saving template:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Brain className="h-8 w-8" />
                Edit Quiz Template
              </CardTitle>
              <p className="text-purple-100 mt-2">
                {templateTitle}
              </p>
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
      
      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, index) => (
          <Card key={q.id} className="border-gray-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={editedQuestion?.question || ''}
                      onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, question: e.target.value } : null)}
                      className="flex-1 p-2 border rounded text-gray-900"
                    />
                  ) : (
                    <span className="text-gray-900">{q.question}</span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  {editingIndex === index ? (
                    <>
                      <Button size="sm" onClick={handleSaveEdit} className="bg-green-600">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(index)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveQuestion(index)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Options */}
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(q.options).map(([key, value]) => (
                  <div 
                    key={key}
                    className={`p-3 rounded-lg border-2 ${
                      q.correctAnswer === key 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">{key}.</span>
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={editedQuestion?.options[key as keyof typeof editedQuestion.options] || ''}
                          onChange={(e) => setEditedQuestion(prev => prev ? {
                            ...prev,
                            options: { ...prev.options, [key]: e.target.value }
                          } : null)}
                          className="flex-1 p-2 border rounded"
                        />
                      ) : (
                        <span className="flex-1">{value}</span>
                      )}
                      {q.correctAnswer === key && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Correct Answer Selector (when editing) */}
              {editingIndex === index && (
                <div className="flex items-center gap-2">
                  <label className="font-semibold">Correct Answer:</label>
                  <select
                    value={editedQuestion?.correctAnswer || ''}
                    onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, correctAnswer: e.target.value } : null)}
                    className="p-2 border rounded"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              )}
              
              {/* Explanation */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                {editingIndex === index ? (
                  <textarea
                    value={editedQuestion?.explanation || ''}
                    onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, explanation: e.target.value } : null)}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm text-blue-800">{q.explanation}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/quiz-templates/list')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAll}
              disabled={saving || editingIndex !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Save All Changes ({questions.length} questions)
                </>
              )}
            </Button>
          </div>
          {editingIndex !== null && (
            <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Please save or cancel the current edit before saving all changes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
