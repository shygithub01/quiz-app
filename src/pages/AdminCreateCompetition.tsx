import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Trophy, Calendar, DollarSign, Clock, MapPin, Target, Presentation } from 'lucide-react';
import { saveQuizTemplate, createCompetition } from '@/components/ui/firebase';
import { generateCompetitionTemplate } from '@/components/api';
import { Timestamp } from 'firebase/firestore';
import TypeSelectionCard from '@/components/TypeSelectionCard';

export default function AdminCreateCompetition() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  
  // Step 0: Competition Type Selection
  const [competitionType, setCompetitionType] = useState<'practice' | 'scholarship' | 'liveEvent' | null>(null);
  
  // Competition type metadata
  const COMPETITION_TYPES = {
    practice: {
      type: 'practice' as const,
      label: 'Practice Test',
      description: 'Unlimited attempts for student practice',
      icon: <Target className="h-5 w-5" />
    },
    scholarship: {
      type: 'scholarship' as const,
      label: 'Scholarship Competition',
      description: 'One attempt only with prizes and registration',
      icon: <Trophy className="h-5 w-5" />
    },
    liveEvent: {
      type: 'liveEvent' as const,
      label: 'Live Event',
      description: 'In-person cultural event with projector display',
      icon: <Presentation className="h-5 w-5" />
    }
  };
  
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
  
  // Topic-based generation (for Live Events)
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  
  // Competition Details
  // Set default dates to today
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
  
  // Remove the old competitionType state - now managed in Step 0
  // const [competitionType, setCompetitionType] = useState<'practice' | 'competition' | 'liveEvent'>('practice');
  
  // Live Event Mode Settings (only used when competitionType === 'liveEvent')
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [questionTimer, setQuestionTimer] = useState(30);
  const [enableFastestFingerBonus, setEnableFastestFingerBonus] = useState(true);
  const [autoAdvanceOnTimer, setAutoAdvanceOnTimer] = useState(true);

  const totalQuestions = Object.values(subjectDistribution).reduce((a, b) => a + b, 0);

  // Step enablement logic
  const isStep1Enabled = competitionType !== null;
  const isStep2Enabled = questionsGenerated;

  const handleTypeSelection = (type: 'practice' | 'scholarship' | 'liveEvent') => {
    console.log('Competition type selected:', type);
    console.log('isStep1Enabled will be:', type !== null);
    setCompetitionType(type);
  };

  const handleGenerateQuestions = async () => {
    // Validation based on competition type
    if (competitionType === 'liveEvent') {
      if (!topic.trim()) {
        alert('Please enter a topic for Live Event questions.');
        return;
      }
    } else {
      if (totalQuestions === 0) {
        alert('Please set at least one subject with questions to generate.');
        return;
      }
    }
    
    try {
      setGenerating(true);
      
      let result;
      
      if (competitionType === 'liveEvent') {
        // Topic-based generation for Live Events
        console.log('🎪 Generating Live Event questions with topic:', topic);
        const { generateNewQuizFromTopic } = await import('@/components/api');
        
        result = await generateNewQuizFromTopic({
          topic,
          difficulty,
          quizType: 'multiple-choice',
          numQuestions
        });
      } else {
        // Subject distribution for Practice/Scholarship
        console.log('🎓 Generating questions with:', subjectDistribution);
        
        result = await generateCompetitionTemplate({
          subjects: subjectDistribution,
          difficulty,
          gradeLevels: ['9', '10', '11', '12']
        });
      }
      
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
    
    console.log('🎯 Form submitted!', { competitionType, questionsGenerated, questions: questions.length });

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
      
      const isLiveEvent = competitionType === 'liveEvent';
      const isPractice = competitionType === 'practice';
      
      const competitionData = {
        title: competitionTitle,
        description,
        status: isPractice ? 'active' : 'upcoming',
        isPractice, // true for practice, false for scholarship/liveEvent
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        quizTemplateId: templateId,
        prizePool: isPractice ? '' : prizePool, // No prize pool for practice
        duration: `${duration} minutes`,
        questionCount: questions.length, // Use actual generated questions count
        eligibleCounty: isLiveEvent ? '' : eligibleCounty, // No county for live events
        isLiveEvent,
        liveEventSettings: isLiveEvent ? {
          maxParticipants,
          questionTimer,
          enableFastestFingerBonus,
          autoAdvanceOnTimer
        } : undefined,
        rules: competitionType === 'liveEvent' ? [
          'In-person event with projector display',
          'Join using QR code or PIN',
          'Answer on your mobile device',
          'Fastest correct answers get bonus points',
          'Real-time leaderboard updates'
        ] : [
          isPractice 
            ? 'Unlimited attempts allowed for practice'
            : 'One attempt only - make it count!',
          'Complete all questions within the time limit',
          'No external resources or help allowed',
          'Each question is worth equal points',
          'Ties are broken by completion time'
        ],
        prizes: isPractice ? [] : isLiveEvent ? [] : [
          '1st Place: $150 + Trophy',
          '2nd Place: $100 + Medal',
          '3rd Place: $50 + Medal'
        ],
        subjects: Object.entries(subjectDistribution)
          .filter(([_, count]) => count > 0)
          .map(([subject, count]) => `${subject}: ${count} questions`)
          .join(', ')
      };

      const competitionId = await createCompetition(competitionData);
      console.log('✅ Competition created:', competitionId);

      // If Live Event Mode is enabled, create the Live Event in Realtime Database
      if (isLiveEvent) {
        try {
          console.log('🎪 Creating Live Event in Realtime Database...');
          const { createLiveEvent } = await import('../services/liveEventService');
          
          const { eventId, pin } = await createLiveEvent(
            competitionId,
            {
              questionTimer,
              enableFastestFingerBonus,
              autoAdvanceOnTimer
            },
            maxParticipants
          );
          
          console.log('✅ Live Event created:', eventId, 'PIN:', pin);
          
          alert(`✅ Live Event Created Successfully!\n\nEvent PIN: ${pin}\nEvent ID: ${eventId}\n\nRedirecting to Host Control Panel...`);
          
          // Redirect to Live Event Host control panel
          navigate(`/live-event/${eventId}/host`);
        } catch (error: any) {
          console.error('❌ Failed to create Live Event:', error);
          alert(`⚠️ Competition created but Live Event setup failed.\n\nError: ${error.message}\n\nYou can still use this as a regular competition.`);
          navigate('/admin/competitions');
        }
      } else {
        alert(`✅ Success!\n\nQuiz Template ID: ${templateId}\nCompetition ID: ${competitionId}\n\n${isPractice ? 'Practice quiz' : 'Competition'} is now live!`);
        
        navigate('/admin/competitions');
      }
    } catch (error: any) {
      console.error('❌ Failed to create competition:', error);
      alert(`❌ Failed to create competition.\n\nError: ${error.message}\n\nPlease check the console for details.`);
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
              Step 0: Choose Type → Step 1: Generate Questions → Step 2: Set Details → Done!
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
          {/* STEP 0: Choose Competition Type */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Trophy className="h-5 w-5" />
                Step 0: Choose Competition Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-purple-700 mb-4">
                Select the type of competition you want to create. This will determine which fields you'll need to fill in later.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TypeSelectionCard
                  type="practice"
                  title={COMPETITION_TYPES.practice.label}
                  description={COMPETITION_TYPES.practice.description}
                  icon={COMPETITION_TYPES.practice.icon}
                  selected={competitionType === 'practice'}
                  onSelect={handleTypeSelection}
                />
                <TypeSelectionCard
                  type="scholarship"
                  title={COMPETITION_TYPES.scholarship.label}
                  description={COMPETITION_TYPES.scholarship.description}
                  icon={COMPETITION_TYPES.scholarship.icon}
                  selected={competitionType === 'scholarship'}
                  onSelect={handleTypeSelection}
                />
                <TypeSelectionCard
                  type="liveEvent"
                  title={COMPETITION_TYPES.liveEvent.label}
                  description={COMPETITION_TYPES.liveEvent.description}
                  icon={COMPETITION_TYPES.liveEvent.icon}
                  selected={competitionType === 'liveEvent'}
                  onSelect={handleTypeSelection}
                />
              </div>
            </CardContent>
          </Card>

          {/* STEP 1: Generate Questions */}
          <Card className={`border-2 border-indigo-200 bg-indigo-50 ${!isStep1Enabled ? 'opacity-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Sparkles className="h-5 w-5" />
                Step 1: Generate Questions with AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isStep1Enabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Please select a competition type in Step 0 first
                  </p>
                </div>
              )}
              
              {/* Live Event: Topic-based generation */}
              {competitionType === 'liveEvent' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Topic *</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Indian History, General Knowledge, Science Facts"
                      disabled={!isStep1Enabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter a topic for AI to generate questions about</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Number of Questions</label>
                      <input
                        type="number"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="1"
                        max="50"
                        disabled={!isStep1Enabled}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={!isStep1Enabled}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* Practice/Scholarship: Subject distribution */
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">English</label>
                  <input
                    type="number"
                    value={subjectDistribution.english}
                    onChange={(e) => setSubjectDistribution({...subjectDistribution, english: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    disabled={!isStep1Enabled}
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
                    disabled={!isStep1Enabled}
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
                    disabled={!isStep1Enabled}
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
                    disabled={!isStep1Enabled}
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
                    disabled={!isStep1Enabled}
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
                  disabled={!isStep1Enabled}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </>
          )}
              
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
                disabled={generating || questionsGenerated || !isStep1Enabled}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg py-6 shadow-xl"
              >
                {generating ? (
                  <>
                    <Brain className="h-6 w-6 mr-3 animate-spin" />
                    Generating Questions... Please Wait
                  </>
                ) : questionsGenerated ? (
                  <>
                    <Sparkles className="h-6 w-6 mr-3" />
                    ✅ {questions.length} Questions Ready!
                  </>
                ) : (
                  <>
                    <Sparkles className="h-6 w-6 mr-3" />
                    🚀 Generate Questions using AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* STEP 2: Competition Details */}
          <Card className={!isStep2Enabled ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Step 2: Competition Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isStep2Enabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Please generate questions in Step 1 first
                  </p>
                </div>
              )}
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
                  placeholder={
                    competitionType === 'practice' 
                      ? 'A guided practice quiz to help students prepare and build confidence...'
                      : competitionType === 'scholarship'
                      ? 'A competitive scholarship quiz with prizes for top performers...'
                      : 'An interactive live event where participants compete in real-time...'
                  }
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

              {/* Conditional fields based on competition type */}
              <div className="space-y-4">
                {/* Prize Pool - Only for Scholarship competitions */}
                {competitionType === 'scholarship' && (
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
                )}

                {/* Live Event Settings - Only show when Live Event type is selected */}
                {competitionType === 'liveEvent' && (
                  <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-bold text-purple-900">
                        🎪 Live Event Settings
                      </h3>
                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-semibold">
                        NEW
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mb-4">
                      Configure settings for your in-person cultural event. Guests can join without registration using QR code or PIN.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-purple-900 mb-1">
                            Max Participants (1-100)
                          </label>
                          <input
                            type="number"
                            value={maxParticipants}
                            onChange={(e) => setMaxParticipants(Math.min(100, Math.max(1, parseInt(e.target.value) || 50)))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            min="1"
                            max="100"
                            disabled={!isStep2Enabled}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-purple-900 mb-1">
                            Timer per Question (15-120s)
                          </label>
                          <input
                            type="number"
                            value={questionTimer}
                            onChange={(e) => setQuestionTimer(Math.min(120, Math.max(15, parseInt(e.target.value) || 30)))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            min="15"
                            max="120"
                            disabled={!isStep2Enabled}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-purple-900">
                          <input
                            type="checkbox"
                            checked={enableFastestFingerBonus}
                            onChange={(e) => setEnableFastestFingerBonus(e.target.checked)}
                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                            disabled={!isStep2Enabled}
                          />
                          <span>Enable Fastest Finger Bonus (+50/+30/+10 for top 3)</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm text-purple-900">
                          <input
                            type="checkbox"
                            checked={autoAdvanceOnTimer}
                            onChange={(e) => setAutoAdvanceOnTimer(e.target.checked)}
                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                            disabled={!isStep2Enabled}
                          />
                          <span>Auto-advance when timer expires</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Eligible County - Only for Practice and Scholarship, not Live Events */}
                {competitionType !== 'liveEvent' && (
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
                )}
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
              disabled={!questionsGenerated || !competitionType}
              onClick={() => {
                console.log('🔘 Button clicked!', { 
                  questionsGenerated, 
                  competitionType, 
                  competitionTitle,
                  disabled: !questionsGenerated 
                });
                // Don't prevent default - let form submission happen naturally
              }}
            >
              <Trophy className="h-6 w-6 mr-3" />
              {questionsGenerated 
                ? `✅ Create ${competitionType === 'practice' ? 'Practice Quiz' : competitionType === 'liveEvent' ? 'Live Event' : 'Scholarship Competition'} Now!`
                : `⏳ Generate Questions First`
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
