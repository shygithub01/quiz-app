import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Trophy, Calendar, DollarSign, Clock, MapPin } from 'lucide-react';
import { saveQuizTemplate, createCompetition } from '@/components/ui/firebase';
import { generateCompetitionTemplate } from '@/components/api';
import { Timestamp } from 'firebase/firestore';

export default function AdminCreateCompetition() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  
  // Question Generation Settings
  const [subjectDistribution, setSubjectDistribution] = useState({
    english: 1,
    mathematics: 0,
    science: 0,
    socialStudies: 0,
    healthWellness: 0
  });
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Competition Details
  // Set default dates to today
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const [competitionTitle, setCompetitionTitle] = useState('');
  const [description, setDescription] = useState('A guided practice quiz covering all major subjects included in the Merit Scholarship Competition. Students can take unlimited attempts to build confidence, review detailed explanations, and improve their overall performance before the real competition.');
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(tomorrow);
  const [endTime, setEndTime] = useState('11:00');
  const [prizePool, setPrizePool] = useState('$300');
  const [duration, setDuration] = useState('60');
  const [eligibleCounty, setEligibleCounty] = useState('henrico');
  const [competitionType, setCompetitionType] = useState<'practice' | 'competition'>('practice');

  const totalQuestions = Object.values(subjectDistribution).reduce((a, b) => a + b, 0);

  const handleGenerateQuestions = async () => {
    if (totalQuestions === 0) {
      alert('Please set at least one subject with questions to generate.');
      return;
    }
    
    try {
      setGenerating(true);
      console.log('🎓 Generating questions with:', subjectDistribution);
      
      const result = await generateCompetitionTemplate({
        subjects: subjectDistribution,
        difficulty,
        gradeLevels: ['9', '10', '11', '12']
      });
      
      if (result.success && result.quiz) {
        const generatedQuestions = result.quiz.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || ''
        }));
        
        setQuestions(generatedQuestions);
        setQuestionsGenerated(true);
        alert(`✅ Generated ${generatedQuestions.length} questions!\n\nNow fill in competition details below.`);
      } else {
        throw new Error(result.message || 'No questions generated');
      }
    } catch (error: any) {
      console.error('❌ Failed to generate questions:', error);
      alert(`❌ Failed to generate questions.\n\nError: ${error.message}\n\nPlease check your Firebase Functions and OpenAI API configuration.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionsGenerated || questions.length === 0) {
      alert('Please generate questions first!');
      return;
    }

    if (!competitionTitle || !startDate || !endDate) {
      alert('Please fill in all required competition details');
      return;
    }

    try {
      console.log('💾 Saving quiz template...');
      
      // Save quiz template
      const formattedQuestions = questions.map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      }));

      const template = {
        title: `${competitionTitle} - Questions`,
        type: 'topic' as const,
        subject: 'Multi-Subject Competition',
        difficulty,
        questions: formattedQuestions,
        settings: {
          difficulty,
          numQuestions: questions.length,
          quizType: 'multiple-choice'
        },
        questionHash: Date.now().toString() // Simple hash based on timestamp
      };

      const templateId = await saveQuizTemplate(template);
      console.log('✅ Template saved:', templateId);

      // Create competition
      console.log('🏆 Creating competition...');
      console.log('Raw dates:', { startDate, startTime, endDate, endTime });
      
      // Parse dates properly - ensure YYYY-MM-DD format
      const startDateTime = `${startDate}T${startTime}:00.000`;
      const endDateTime = `${endDate}T${endTime}:00.000`;
      
      console.log('Formatted:', { startDateTime, endDateTime });
      
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      
      console.log('Parsed dates:', { start, end });
      console.log('Timestamps:', { startTime: start.getTime(), endTime: end.getTime() });
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert(`Invalid date/time format!\nStart: ${startDateTime}\nEnd: ${endDateTime}\nPlease use YYYY-MM-DD format for dates.`);
        throw new Error('Invalid date/time format');
      }
      
      const competitionData = {
        title: competitionTitle,
        description,
        status: competitionType === 'practice' ? 'active' : 'upcoming',
        competitionType: competitionType, // 'practice' or 'competition'
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        quizTemplateId: templateId,
        prizePool,
        duration: `${duration} minutes`,
        questionCount: totalQuestions, // Add actual question count
        eligibleCounty,
        rules: [
          competitionType === 'practice' 
            ? 'Unlimited attempts allowed for practice'
            : 'One attempt only - make it count!',
          'Complete all questions within the time limit',
          'No external resources or help allowed',
          'Each question is worth equal points',
          'Ties are broken by completion time'
        ],
        prizes: competitionType === 'practice' ? [] : [
          '1st Place: $150 + Trophy',
          '2nd Place: $100 + Medal',
          '3rd Place: $50 + Medal'
        ],
        subjects: Object.entries(subjectDistribution)
          .filter(([_, count]) => count > 0)
          .map(([subject, count]) => `${subject}: ${count} questions`)
          .join(', '),
        isPractice: competitionType === 'practice'
      };

      const competitionId = await createCompetition(competitionData);
      console.log('✅ Competition created:', competitionId);

      alert(`✅ Success!\n\nQuiz Template ID: ${templateId}\nCompetition ID: ${competitionId}\n\n${competitionType === 'practice' ? 'Practice quiz' : 'Competition'} is now live!`);
      
      navigate('/admin/competitions');
    } catch (error: any) {
      console.error('❌ Failed to create competition:', error);
      alert(`❌ Failed to create competition.\n\nError: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-xl">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Trophy className="h-10 w-10" />
              Create New Competition
            </h1>
            <p className="text-indigo-100 mt-2 text-lg">
              Step 1: Generate Questions → Step 2: Set Details → Done!
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/competitions')}
            className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 font-semibold"
          >
            ← Back
          </Button>
        </div>

        <form onSubmit={handleCreateCompetition} className="space-y-6">
          {/* STEP 1: Generate Questions */}
          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Sparkles className="h-5 w-5" />
                Step 1: Generate Questions with AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Total Questions</label>
                  <div className="px-3 py-2 border rounded-lg bg-gray-100 font-bold text-lg">
                    {totalQuestions}
                  </div>
                </div>
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

              {questionsGenerated && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-900 font-medium mb-2">
                    <Sparkles className="h-5 w-5" />
                    ✅ {questions.length} questions generated successfully!
                  </div>
                  <p className="text-sm text-green-700">
                    Now fill in the competition details below and click "Create Competition"
                  </p>
                </div>
              )}
              
              <Button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={generating || questionsGenerated}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg py-6 shadow-xl"
              >
                {generating ? (
                  <>
                    <Brain className="h-6 w-6 mr-3 animate-spin" />
                    Generating {totalQuestions} Questions... Please Wait
                  </>
                ) : questionsGenerated ? (
                  <>
                    <Sparkles className="h-6 w-6 mr-3" />
                    ✅ {questions.length} Questions Ready!
                  </>
                ) : (
                  <>
                    <Sparkles className="h-6 w-6 mr-3" />
                    🚀 Generate {totalQuestions} Questions with AI (Cost: ~$1)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* STEP 2: Competition Details */}
          <Card className={!questionsGenerated ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Step 2: Competition Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Competition Type</label>
                <select
                  value={competitionType}
                  onChange={(e) => setCompetitionType(e.target.value as 'practice' | 'competition')}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={!questionsGenerated}
                >
                  <option value="practice">🎯 Practice Test (Unlimited Attempts)</option>
                  <option value="competition">🏆 Scholarship Competition (One Attempt Only)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {competitionType === 'practice' 
                    ? 'Practice tests appear on the Competitions page for students to practice anytime.'
                    : 'Scholarship competitions can be featured on the landing page and have prizes.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={competitionTitle}
                  onChange={(e) => setCompetitionTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Henrico Merit Scholarship Competition - Practice"
                  disabled={!questionsGenerated}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  disabled={!questionsGenerated}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!questionsGenerated}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!questionsGenerated}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!questionsGenerated}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!questionsGenerated}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Prize Pool
                  </label>
                  <input
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!questionsGenerated}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!questionsGenerated}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Eligible County
                  </label>
                  <select
                    value={eligibleCounty}
                    onChange={(e) => setEligibleCounty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!questionsGenerated}
                  >
                    <option value="henrico">Henrico County</option>
                    <option value="chesterfield">Chesterfield County</option>
                    <option value="richmond">Richmond Metro</option>
                    <option value="all">All Virginia</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/competitions')}
              className="flex-1 text-lg py-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-6 shadow-xl"
              disabled={!questionsGenerated}
            >
              <Trophy className="h-6 w-6 mr-3" />
              {questionsGenerated 
                ? `✅ Create ${competitionType === 'practice' ? 'Practice Quiz' : 'Competition'} Now!`
                : `⏳ Generate Questions First`
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
