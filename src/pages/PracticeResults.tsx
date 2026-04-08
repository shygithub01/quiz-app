// Practice Live Mode Results Page
// Displays results with improvement tracking and retry option

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Trophy, TrendingUp, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCompetitionById } from '@/components/ui/firebase';
import {
  getSessionById,
  getAttemptById,
  getStudentAttempts,
  getLeaderboard,
  listenToLeaderboard
} from '@/services/practiceService';
import { PracticeSession, PracticeAttempt, LeaderboardEntry } from '@/types/practiceMode';

export default function PracticeResults() {
  const { sessionId, attemptId } = useParams<{ sessionId: string; attemptId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [attempt, setAttempt] = useState<PracticeAttempt | null>(null);
  const [allAttempts, setAllAttempts] = useState<PracticeAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [improvement, setImprovement] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Load data
  useEffect(() => {
    if (!sessionId || !attemptId) return;
    
    const loadData = async () => {
      try {
        // Load session
        const sessionData = await getSessionById(sessionId);
        if (!sessionData) {
          alert('Session not found');
          navigate('/practice/join');
          return;
        }
        setSession(sessionData);
        
        // Load competition
        const compData = await getCompetitionById(sessionData.competitionId);
        if (!compData) {
          alert('Quiz not found');
          navigate('/practice/join');
          return;
        }
        setCompetition(compData);
        
        // Load current attempt
        const attemptData = await getAttemptById(sessionId, attemptId);
        if (!attemptData) {
          alert('Attempt not found');
          navigate('/practice/join');
          return;
        }
        setAttempt(attemptData);
        
        // Load all attempts for this student
        const attempts = await getStudentAttempts(sessionId, attemptData.studentName);
        setAllAttempts(attempts);
        
        // Calculate best score and improvement
        if (attempts.length > 0) {
          const scores = attempts.map(a => a.score);
          const best = Math.max(...scores);
          const first = attempts[0].score;
          const improvementPct = first > 0 ? ((best - first) / first) * 100 : 0;
          
          setBestScore(best);
          setImprovement(Math.round(improvementPct * 10) / 10);
        }
        
        // Load leaderboard
        const leaderboardData = await getLeaderboard(sessionId);
        setLeaderboard(leaderboardData);
        
        // Find my rank
        const myEntry = leaderboardData.find(e => e.name === attemptData.studentName);
        if (myEntry) {
          setMyRank(myEntry.rank);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading results:', error);
        alert('Failed to load results');
        navigate('/practice/join');
      }
    };
    
    loadData();
  }, [sessionId, attemptId, navigate]);
  
  // Listen to real-time leaderboard updates
  useEffect(() => {
    if (!sessionId || !attempt) return;
    
    const unsubscribe = listenToLeaderboard(sessionId, (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
      
      // Update my rank
      const myEntry = updatedLeaderboard.find(e => e.name === attempt.studentName);
      if (myEntry) {
        setMyRank(myEntry.rank);
      }
    });
    
    return unsubscribe;
  }, [sessionId, attempt]);
  
  const handleTryAgain = () => {
    navigate(`/practice/quiz/${sessionId}`);
  };
  
  const handleViewLeaderboard = () => {
    // Scroll to leaderboard section
    document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Target className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading results...</p>
        </div>
      </div>
    );
  }
  
  if (!session || !competition || !attempt) {
    return null;
  }
  
  const scoreHistory = allAttempts.map((a, idx) => ({
    attempt: idx + 1,
    score: a.score
  }));
  
  const isNewBest = attempt.score === bestScore;
  const isImproved = allAttempts.length > 1 && attempt.score > allAttempts[allAttempts.length - 2].score;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <Target className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Practice Complete!</h1>
          <p className="text-green-100">{session.title}</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Score Summary */}
        <Card className="border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Score</p>
                <p className="text-5xl font-bold text-green-600">{attempt.score}%</p>
                <p className="text-sm text-gray-600 mt-2">
                  {attempt.correctAnswers}/{attempt.totalQuestions} correct
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Rank</p>
                <p className="text-5xl font-bold text-purple-600">#{myRank}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Attempt {allAttempts.length}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Best Score</p>
                <p className="text-5xl font-bold text-blue-600">{bestScore}%</p>
                {isNewBest && (
                  <p className="text-sm text-green-600 font-semibold mt-2">
                    🎉 New Personal Best!
                  </p>
                )}
              </div>
            </div>
            
            {isImproved && !isNewBest && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-semibold">
                  Great job! You improved from your last attempt!
                </p>
              </div>
            )}
            
            {improvement > 0 && allAttempts.length > 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">Overall Improvement</p>
                <p className="text-3xl font-bold text-green-600">+{improvement}%</p>
                <p className="text-xs text-gray-500">from first attempt</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Score History Chart */}
        {allAttempts.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" label={{ value: 'Attempt', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        
        {/* Question Review */}
        {session.settings.showExplanations && (
          <Card>
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {competition.questions.map((question: any, idx: number) => {
                const answer = attempt.answers[idx];
                if (!answer) return null;
                
                const wasIncorrectBefore = allAttempts.length > 1 && 
                  allAttempts.slice(0, -1).some(a => a.answers[idx] && !a.answers[idx].isCorrect);
                
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      answer.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {answer.isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2">
                          Question {idx + 1}: {question.question}
                        </p>
                        
                        {!answer.isCorrect && (
                          <div className="mb-2">
                            <p className="text-sm text-red-700">
                              Your answer: <span className="font-semibold">{answer.selectedAnswer}</span>
                            </p>
                          </div>
                        )}
                        
                        <div className="mb-2">
                          <p className="text-sm text-green-700">
                            Correct answer: <span className="font-semibold">{answer.correctAnswer}</span>
                          </p>
                        </div>
                        
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Explanation:</span> {question.explanation}
                            </p>
                          </div>
                        )}
                        
                        {wasIncorrectBefore && answer.isCorrect && (
                          <div className="mt-2 text-sm text-green-600 font-semibold">
                            ✨ You got this right this time!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
        
        {/* Leaderboard */}
        {session.settings.showLeaderboard && (
          <Card id="leaderboard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.slice(0, 20).map((entry) => (
                  <div
                    key={entry.name}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.name === attempt.studentName
                        ? 'bg-green-100 border-2 border-green-400'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold w-8 text-center">
                        {entry.rank}
                      </span>
                      <div>
                        <p className="font-bold">
                          {entry.name}
                          {entry.name === attempt.studentName && ' (You)'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Attempts: {entry.attemptCount}
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{entry.bestScore}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleTryAgain}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-6"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          
          {session.settings.showLeaderboard && (
            <Button
              onClick={handleViewLeaderboard}
              variant="outline"
              className="flex-1 font-bold text-lg py-6"
            >
              <Trophy className="h-5 w-5 mr-2" />
              View Leaderboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
