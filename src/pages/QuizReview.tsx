// Quiz Review Page - Admin can review and edit AI-generated questions
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Edit2, Save, AlertTriangle, Brain } from 'lucide-react';
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
  verified?: boolean;
  hasIssue?: boolean;
  verificationIssue?: string;
}

export default function QuizReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [quizMetadata, setQuizMetadata] = useState<any>(null);
  
  useEffect(() => {
    // Get generated questions from navigation state
    const state = location.state as { questions: Question[]; metadata: any };
    if (state?.questions) {
      // Map questions and mark those with verification issues
      const mappedQuestions = state.questions.map(q => ({
        ...q,
        verified: q.verified || false,
        hasIssue: q.hasIssue || false
      }));
      
      setQuestions(mappedQuestions);
      setQuizMetadata(state.metadata);
      
      // Show toast if there are pre-flagged issues
      const issueCount = mappedQuestions.filter(q => q.hasIssue).length;
      if (issueCount > 0) {
        toast({
          title: "Verification Issues Detected",
          description: `${issueCount} question(s) were flagged during AI verification. Please review them carefully.`,
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "No Questions to Review",
        description: "Redirecting to quiz generator...",
        variant: "destructive"
      });
      navigate('/quiz-generator');
    }
  }, [location, navigate, toast]);
  
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedQuestion({ ...questions[index] });
  };
  
  const handleSaveEdit = () => {
    if (editingIndex !== null && editedQuestion) {
      const updated = [...questions];
      updated[editingIndex] = { ...editedQuestion, verified: true };
      setQuestions(updated);
      setEditingIndex(null);
      setEditedQuestion(null);
      
      toast({
        title: "Question Updated",
        description: "Changes saved successfully"
      });
    }
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion(null);
  };
  
  const handleVerify = (index: number) => {
    const updated = [...questions];
    updated[index].verified = true;
    updated[index].hasIssue = false;
    setQuestions(updated);
  };
  
  const handleMarkIssue = (index: number) => {
    const updated = [...questions];
    updated[index].hasIssue = true;
    updated[index].verified = false;
    setQuestions(updated);
  };
  
  const handleRemoveQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    
    toast({
      title: "Question Removed",
      description: "Question has been removed from the quiz"
    });
  };
  
  const handleApproveAll = () => {
    const verifiedCount = questions.filter(q => q.verified).length;
    const issueCount = questions.filter(q => q.hasIssue).length;
    
    if (issueCount > 0) {
      toast({
        title: "Cannot Approve",
        description: `${issueCount} question(s) marked with issues. Please fix or remove them first.`,
        variant: "destructive"
      });
      return;
    }
    
    if (verifiedCount < questions.length) {
      toast({
        title: "Verification Incomplete",
        description: `Please verify all ${questions.length} questions before approving.`,
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to save quiz with approved questions
    navigate('/quiz-generator', {
      state: {
        approvedQuestions: questions,
        metadata: quizMetadata
      }
    });
    
    toast({
      title: "Quiz Approved!",
      description: `${questions.length} questions approved and ready to use.`
    });
  };
  
  const verifiedCount = questions.filter(q => q.verified).length;
  const issueCount = questions.filter(q => q.hasIssue).length;
  
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <Card style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Brain className="h-8 w-8" />
            Review AI-Generated Questions
          </CardTitle>
          <p className="text-purple-100 mt-2">
            Review each question for accuracy. Edit, verify, or mark issues before approving.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-3xl font-bold">{questions.length}</p>
              <p className="text-sm text-purple-100">Total Questions</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-3xl font-bold text-green-300">{verifiedCount}</p>
              <p className="text-sm text-purple-100">Verified</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-3xl font-bold text-red-300">{issueCount}</p>
              <p className="text-sm text-purple-100">Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, index) => (
          <Card 
            key={q.id} 
            className={`${
              q.verified ? 'border-green-500 bg-green-50' :
              q.hasIssue ? 'border-red-500 bg-red-50' :
              'border-gray-200'
            }`}
          >
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <CardTitle className="text-lg flex items-start gap-2 flex-1 min-w-0">
                  <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm flex-shrink-0">
                    {index + 1}
                  </span>
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={editedQuestion?.question || ''}
                      onChange={(e) => setEditedQuestion(prev => prev ? { ...prev, question: e.target.value } : null)}
                      className="flex-1 p-2 border rounded"
                    />
                  ) : (
                    <span className="break-words">{q.question}</span>
                  )}
                </CardTitle>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
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
                      {!q.verified && !q.hasIssue && (
                        <>
                          <Button size="sm" onClick={() => handleVerify(index)} className="bg-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleMarkIssue(index)}>
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Issue
                          </Button>
                        </>
                      )}
                      {q.verified && (
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <CheckCircle className="h-5 w-5" />
                          Verified
                        </span>
                      )}
                      {q.hasIssue && (
                        <span className="flex items-center gap-1 text-red-600 font-semibold">
                          <XCircle className="h-5 w-5" />
                          Has Issue
                        </span>
                      )}
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
              
              {/* Verification Issue Warning */}
              {q.verificationIssue && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-1">AI Verification Warning:</p>
                      <p className="text-sm text-yellow-800">{q.verificationIssue}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Remove Button */}
              {q.hasIssue && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleRemoveQuestion(index)}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Remove This Question
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/quiz-generator')}>
              Cancel Review
            </Button>
            <Button
              onClick={handleApproveAll}
              disabled={verifiedCount < questions.length || issueCount > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Approve All & Save ({verifiedCount}/{questions.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
