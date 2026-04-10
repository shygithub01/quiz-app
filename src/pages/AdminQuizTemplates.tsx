import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Plus, Trash2, Sparkles, FileCode } from 'lucide-react';
import { saveQuizTemplate } from '@/components/ui/firebase';
import { generateCompetitionTemplate } from '@/components/api';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function AdminQuizTemplates() {
  const navigate = useNavigate();
  const [templateTitle, setTemplateTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
  ]);
  const [generating, setGenerating] = useState(false);
  const [jsonImport, setJsonImport] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [subjectDistribution, setSubjectDistribution] = useState({
    english: 13,
    mathematics: 13,
    science: 13,
    socialStudies: 11,
    healthWellness: 0
  });

  const handleGenerateWithAI = async () => {
    const totalQuestions = Object.values(subjectDistribution).reduce((a, b) => a + b, 0);
    
    if (totalQuestions === 0) {
      alert('Please set at least one subject with questions to generate.');
      return;
    }
    
    try {
      setGenerating(true);
      console.log('🎓 Starting AI generation with:', subjectDistribution);
      
      const result = await generateCompetitionTemplate({
        subjects: subjectDistribution,
        difficulty,
        gradeLevels: ['9', '10', '11', '12']
      });
      
      console.log('✅ Generation result:', result);
      
      if (result.success && result.quiz) {
        // Convert API format to form format
        const generatedQuestions = result.quiz.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || ''
        }));
        
        console.log('✅ Converted questions:', generatedQuestions.length);
        
        setQuestions(generatedQuestions);
        setTemplateTitle(`Competition Template - ${new Date().toLocaleDateString()}`);
        setSubject('Multi-Subject Competition');
        alert(`✅ Generated ${generatedQuestions.length} questions!\n\nReview and edit before saving.`);
      } else {
        throw new Error(result.message || 'No questions generated');
      }
    } catch (error: any) {
      console.error('❌ Failed to generate questions:', error);
      const errorMessage = error.message || 'Unknown error';
      alert(`❌ Failed to generate questions.\n\nError: ${errorMessage}\n\nPlease check:\n1. Your internet connection\n2. Firebase Functions are deployed\n3. OpenAI API key is configured\n\nTry again or contact support.`);
    } finally {
      setGenerating(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { 
      question: '', 
      options: ['', '', '', ''], 
      correctAnswer: '', 
      explanation: '' 
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleJsonImport = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonImport.trim());
      const arr = Array.isArray(parsed) ? parsed : parsed.questions || parsed.quiz;
      if (!Array.isArray(arr) || arr.length === 0) throw new Error('Expected a JSON array of questions');

      const imported: Question[] = arr.map((q: any, idx: number) => {
        // Normalize options: support array or object {A,B,C,D}
        let opts: string[];
        if (Array.isArray(q.options)) {
          opts = q.options.map(String);
        } else if (q.options && typeof q.options === 'object') {
          opts = ['A', 'B', 'C', 'D'].map(k => q.options[k] || '');
        } else {
          throw new Error(`Question ${idx + 1}: invalid options format`);
        }
        if (opts.length < 2) throw new Error(`Question ${idx + 1}: need at least 2 options`);
        while (opts.length < 4) opts.push('');

        // Normalize correctAnswer: support letter key ("A") or full text
        const raw = q.correctAnswer || q.correct_answer || q.answer || '';
        let correctAnswer = '';
        if (['A', 'B', 'C', 'D'].includes(String(raw).trim().toUpperCase())) {
          const idx2 = ['A', 'B', 'C', 'D'].indexOf(String(raw).trim().toUpperCase());
          correctAnswer = opts[idx2] || '';
        } else {
          correctAnswer = String(raw);
        }

        return {
          question: q.question || q.text || '',
          options: opts,
          correctAnswer,
          explanation: q.explanation || q.reason || ''
        };
      });

      setQuestions(imported);
      if (!templateTitle) setTemplateTitle(`Imported Quiz - ${new Date().toLocaleDateString()}`);
      setJsonImport('');
      alert(`✅ Imported ${imported.length} questions successfully!`);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!templateTitle || !subject) {
      alert('Please fill in title and subject');
      return;
    }

    const invalidQuestions = questions.filter(q => 
      !q.question || 
      q.options.some(opt => !opt) || 
      !q.correctAnswer ||
      !q.options.includes(q.correctAnswer)
    );

    if (invalidQuestions.length > 0) {
      alert('Please complete all questions with valid options and correct answers');
      return;
    }

    try {
      const template = {
        title: templateTitle,
        type: 'topic' as 'document' | 'topic', // Use existing type
        subject,
        difficulty,
        questions: questions.map((q, idx) => ({
          id: idx + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        })),
        settings: {
          difficulty,
          numQuestions: questions.length,
          quizType: 'multiple-choice'
        },
        questionHash: '' // Will be generated by saveQuizTemplate
      };

      const templateId = await saveQuizTemplate(template);
      alert(`Quiz template created! ID: ${templateId}`);
      navigate('/admin/competitions');
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create quiz template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 flex items-center gap-3">
              <Brain className="h-8 w-8" />
              Create Quiz Template
            </h1>
            <p className="text-gray-600 mt-2">
              Create a fixed question set for competitions
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/competitions')}>
            Back to Admin
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Generation Section */}
          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Sparkles className="h-5 w-5" />
                AI-Assisted Generation (Recommended)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                Generate 50 questions uniformly distributed across core subjects for scholarship competitions.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">English</label>
                  <input
                    type="number"
                    value={subjectDistribution.english}
                    onChange={(e) => setSubjectDistribution({...subjectDistribution, english: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Grades 9-12</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Mathematics</label>
                  <input
                    type="number"
                    value={subjectDistribution.mathematics}
                    onChange={(e) => setSubjectDistribution({...subjectDistribution, mathematics: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Algebra II, Geometry, Pre-Calc</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Science</label>
                  <input
                    type="number"
                    value={subjectDistribution.science}
                    onChange={(e) => setSubjectDistribution({...subjectDistribution, science: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Biology, Chemistry, Physics</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Social Studies</label>
                  <input
                    type="number"
                    value={subjectDistribution.socialStudies}
                    onChange={(e) => setSubjectDistribution({...subjectDistribution, socialStudies: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">History, Government</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Health & Wellness</label>
                  <input
                    type="number"
                    value={subjectDistribution.healthWellness}
                    onChange={(e) => setSubjectDistribution({...subjectDistribution, healthWellness: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Grades 9-10</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Total Questions</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-100 font-bold text-lg">
                    {Object.values(subjectDistribution).reduce((a, b) => a + b, 0)}
                  </div>
                </div>
              </div>
              
              {generating && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Brain className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="text-blue-900 font-medium">AI is generating your questions...</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    This may take 30-60 seconds. Please wait.
                  </p>
                </div>
              )}
              
              <Button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={generating}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {generating ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate {Object.values(subjectDistribution).reduce((a, b) => a + b, 0)} Questions with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* JSON Import Section */}
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <FileCode className="h-5 w-5" />
                Import from JSON (ChatGPT)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                Paste JSON from ChatGPT or any source. Supports both array options and A/B/C/D object formats.
              </p>
              <details className="bg-white rounded-lg border border-emerald-200 p-3">
                <summary className="text-xs font-semibold text-emerald-800 cursor-pointer">Show expected format</summary>
                <pre className="text-xs text-gray-600 mt-2 overflow-x-auto whitespace-pre-wrap">{`[
  {
    "question": "What is the capital of India?",
    "options": ["Mumbai", "Delhi", "Chennai", "Kolkata"],
    "correctAnswer": "B",
    "explanation": "New Delhi is the capital."
  }
]`}</pre>
              </details>
              <textarea
                value={jsonImport}
                onChange={(e) => { setJsonImport(e.target.value); setJsonError(''); }}
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg font-mono text-xs"
                rows={6}
                placeholder="Paste your JSON array here..."
              />
              {jsonError && (
                <p className="text-red-600 text-sm font-medium">Error: {jsonError}</p>
              )}
              <Button
                type="button"
                onClick={handleJsonImport}
                disabled={!jsonImport.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <FileCode className="h-4 w-4 mr-2" />
                Import Questions
              </Button>
            </CardContent>
          </Card>

          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Title</label>
                <input
                  type="text"
                  required
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Algebra Basics Quiz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Mathematics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          {questions.map((question, qIndex) => (
            <Card key={qIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Question {qIndex + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Question Text</label>
                  <textarea
                    required
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    placeholder="Enter your question..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Options</label>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <input
                        key={optIndex}
                        type="text"
                        required
                        value={option}
                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder={`Option ${optIndex + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Correct Answer</label>
                  <select
                    required
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select correct answer</option>
                    {question.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option || `Option ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Explanation (Optional)</label>
                  <textarea
                    value={question.explanation}
                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    placeholder="Explain why this is the correct answer..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
            <Button type="submit" className="flex-1">
              Save Quiz Template
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
