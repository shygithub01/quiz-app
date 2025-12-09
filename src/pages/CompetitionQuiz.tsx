import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getCompetitionById, 
  getQuizTemplate, 
  checkUserParticipation,
  submitCompetitionAttempt 
} from '../components/ui/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Trophy, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function CompetitionQuiz() {
  const { id: competitionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [competition, setCompetition] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Timer effect
  useEffect(() => {
    if (startTime && !showResults && questions.length > 0) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, showResults, questions.length]);

  // Load competition and questions
  useEffect(() => {
    const loadCompetitionQuiz = async () => {
      if (!competitionId || !user?.uid) return;

      try {
        setLoading(true);

        // Load competition first to check type
        const comp = await getCompetitionById(competitionId);
        if (!comp) {
          setError('Competition not found');
          setLoading(false);
          return;
        }

        // Check if already participated (only for scholarship competitions)
        // Practice tests allow unlimited attempts
        if (!comp.isPractice) {
          const hasParticipated = await checkUserParticipation(user.uid, competitionId);
          if (hasParticipated) {
            setError('You have already participated in this scholarship competition. Only one attempt is allowed.');
            setLoading(false);
            return;
          }
        }

        if (comp.status !== 'active') {
          setError('This competition is not currently active');
          setLoading(false);
          return;
        }

        setCompetition(comp);

        // Load quiz template
        const template = await getQuizTemplate(comp.quizTemplateId);
        if (!template || !template.questions) {
          setError('Quiz questions not found');
          setLoading(false);
          return;
        }

        setQuestions(template.questions);
        setUserAnswers(new Array(template.questions.length).fill(''));
        setStartTime(Date.now());
        setCurrentTime(Date.now());
        setLoading(false);
      } catch (err) {
        console.error('Error loading competition quiz:', err);
        setError('Failed to load competition quiz');
        setLoading(false);
      }
    };

    loadCompetitionQuiz();
  }, [competitionId, user]);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !competitionId) return;

    // Check if all questions are answered
    const unanswered = userAnswers.filter(a => !a).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);

      // Calculate score
      const finalScore = userAnswers.reduce((score, answer, index) => {
        return answer === questions[index].correctAnswer ? score + 1 : score;
      }, 0);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      // Submit to leaderboard (only for scholarship competitions)
      await submitCompetitionAttempt(user.uid, competitionId, {
        score: finalScore,
        totalQuestions: questions.length,
        timeSpent,
        attemptId: `${competitionId}-${user.uid}-${Date.now()}`,
        userName: user.displayName || 'Anonymous',
        userEmail: user.email || '',
        school: undefined,
        isPractice: competition?.isPractice || false
      });

      setScore(finalScore);
      setShowResults(true);
    } catch (err: any) {
      console.error('Error submitting competition:', err);
      alert(err.message || 'Failed to submit competition results');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 text-lg mb-4">{error}</p>
            <Button onClick={() => navigate(`/competitions/${competitionId}`)}>
              Back to Competition
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Competition Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {score}/{questions.length}
              </div>
              <p className="text-xl text-gray-700 mb-2">
                {score === questions.length ? 'Perfect Score! 🎉' : 
                 score >= questions.length * 0.7 ? 'Great Job! 👏' : 
                 'Good Effort! 💪'}
              </p>
              <p className="text-gray-600">
                Time: {formatTime(currentTime - startTime)}
              </p>
            </div>

            {/* Only show leaderboard message for scholarship competitions */}
            {!competition?.isPractice && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-center">
                  Your score has been submitted to the leaderboard!
                </p>
              </div>
            )}

            {/* Show practice message for practice tests */}
            {competition?.isPractice && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-center">
                  Great practice! You can retake this as many times as you want to improve.
                </p>
              </div>
            )}

            {/* Show answers */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Review Your Answers</h3>
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <p className="font-medium mb-2">
                    {index + 1}. {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-2 rounded ${
                          option === question.correctAnswer
                            ? 'bg-green-100 border border-green-400'
                            : option === userAnswers[index] && option !== question.correctAnswer
                            ? 'bg-red-100 border border-red-400'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {option === question.correctAnswer && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {option === userAnswers[index] && option !== question.correctAnswer && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      💡 {question.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              {/* Show different buttons based on competition type */}
              {competition?.isPractice ? (
                <>
                  <Button 
                    onClick={() => navigate(`/competitions/${competitionId}/quiz`)}
                    className="flex-1"
                  >
                    🔄 Practice Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/competitions')}
                    className="flex-1"
                  >
                    Browse Competitions
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate(`/competitions/${competitionId}/leaderboard`)}
                    className="flex-1"
                  >
                    View Leaderboard
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/competitions')}
                    className="flex-1"
                  >
                    Browse Competitions
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Competition Header */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{competition?.title}</h1>
            <p className="text-blue-100">
              {competition?.isPractice
                ? 'Practice Session - Multiple Attempts Allowed'
                : 'Scholarship Competition - One Attempt Only'}
            </p>
          </div>
          {/* Timer */}
          <div className="flex items-center gap-3 bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">
            <Clock className="w-6 h-6 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs text-white/80 font-medium uppercase tracking-wide">Time Elapsed</span>
              <span className="text-2xl font-bold tabular-nums">
                {formatTime(currentTime - startTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">{currentQuestion.question}</p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  userAnswers[currentQuestionIndex] === option
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="text-blue-600 font-bold">
                {userAnswers.filter(a => a).length}/{questions.length} answered
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(userAnswers.filter(a => a).length / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Navigation Grid */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Jump to Question:</p>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`relative h-10 rounded-lg text-sm font-medium transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white shadow-lg scale-110 ring-2 ring-blue-300'
                      : userAnswers[index]
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={userAnswers[index] ? `Question ${index + 1} - Answered` : `Question ${index + 1} - Not answered`}
                >
                  <span className="relative inline-block">
                    {index + 1}
                    {userAnswers[index] && index !== currentQuestionIndex && (
                      <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-white bg-green-600 rounded-full" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="min-w-[120px]"
            >
              ← Previous
            </Button>

            <div>
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 min-w-[180px]"
                >
                  {submitting ? 'Submitting...' : '✓ Submit Competition'}
                </Button>
              ) : (
                <Button onClick={handleNext} className="min-w-[120px]">
                  Next →
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
