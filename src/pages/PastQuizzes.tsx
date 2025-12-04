import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getQuizHistory, deleteQuizFromHistory } from '@/components/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Trash2, Play, FileText, Target, Eye } from 'lucide-react'; // Added Eye icon
import { useNavigate } from 'react-router-dom';

interface PastQuiz {
  id: string;
  title: string;
  type: 'document' | 'topic';
  score?: number;
  questionCount: number;
  createdAt: string;
  completedAt?: string;
  timeSpent?: number;
  settings?: {
    difficulty?: string;
    numQuestions?: number;
  };
}

const formatQuizTitle = (quiz: PastQuiz) => {
  if (quiz.type === 'topic') {
    return `${quiz.title} (${quiz.settings?.difficulty || 'medium'}, ${quiz.settings?.numQuestions || quiz.questionCount}Q)`;
  }
  return quiz.title || 'Untitled Quiz';
};

export default function PastQuizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pastQuizzes, setPastQuizzes] = useState<PastQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Loading quiz attempts for user:', user.uid);
        const attempts = await getQuizHistory(user.uid);
        
        const quizzes: PastQuiz[] = attempts.map(attempt => ({
          id: attempt.id,
          title: attempt.title,
          type: attempt.type,
          score: attempt.score || 0, // Ensure score defaults to 0 if undefined
          questionCount: attempt.questionCount,
          createdAt: attempt.startedAt,
          completedAt: attempt.completedAt,
          timeSpent: attempt.timeSpent,
          settings: attempt.settings
        }));
        
        setPastQuizzes(quizzes);
        console.log('📊 Loaded quiz attempts:', quizzes.length);
        console.log('⏱️ Sample quiz timeSpent:', quizzes[0]?.timeSpent);
      } catch (error) {
        console.error('Failed to load quiz attempts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [user?.uid]);

  const handleRetake = (quizId: string) => {
    navigate(`/?retake=${quizId}`);
  };

  // Added handleViewResults function

  const handleViewResults = (attemptId: string) => {
    navigate(`/?results=${attemptId}`);
  };

  const handleDelete = async (attemptId: string) => {
    if (!user?.uid) return;

    try {
      await deleteQuizFromHistory(attemptId, user.uid);
      setPastQuizzes(prev => prev.filter(q => q.id !== attemptId));
      console.log('🗑️ Quiz attempt deleted:', attemptId);
    } catch (error) {
      console.error('Error deleting quiz attempt:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-indigo-600 flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Past Quizzes
          </h1>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            Back to Home
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Your Quiz History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : pastQuizzes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No past quizzes yet. Go back to home and generate some!
              </p>
            ) : (
              <div className="space-y-4">
                {pastQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${quiz.type === 'document' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {quiz.type === 'document' ? (
                          <FileText className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Target className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{formatQuizTitle(quiz)}</h3>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(quiz.createdAt).toLocaleDateString()}
                          {quiz.completedAt ? 
                            ` • Completed: ${new Date(quiz.completedAt).toLocaleDateString()}` : 
                            ' • Not completed'}
                        </p>
                        {quiz.score !== undefined && quiz.completedAt && (
                          <p className="text-sm text-gray-600 mt-1">
                            Score: {quiz.score}/{quiz.questionCount} 
                            ({Math.round((quiz.score / quiz.questionCount) * 100)}%)
                            {quiz.timeSpent && (
                              <span className="ml-3 text-indigo-600">
                                • Time: {Math.floor(quiz.timeSpent / 60)}:{(quiz.timeSpent % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    


                  {/* Enhanced button section with View Results */}
<div className="flex gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleRetake(quiz.id)}
    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
  >
    <Play className="h-4 w-4" />
    Retake
  </Button>
  
  {/* Only show View Results if quiz was completed */}
  {quiz.completedAt && quiz.score !== undefined && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleViewResults(quiz.id)}
      className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
    >
      <Eye className="h-4 w-4" />
      Results
    </Button>
  )}
  
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleDelete(quiz.id)}
    className="text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>







                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
