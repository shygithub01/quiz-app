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
  const [averageScore, setAverageScore] = useState(0);
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
        
        // Calculate average score and improvement
        if (attempts.length > 0) {
          const scores = attempts.map(a => a.score);
          const totalScore = scores.reduce((sum, score) => sum + score, 0);
          const avg = Math.round(totalScore / scores.length);
          const first = attempts[0].score;
          const improvementPct = first > 0 ? ((avg - first) / first) * 100 : 0;
          
          setAverageScore(avg);
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
        <div className="text-center">
          <Target className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-lg text-white/60">Loading results...</p>
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
  
  const isNewBest = attempt.score >= averageScore;
  const isImproved = allAttempts.length > 1 && attempt.score > allAttempts[allAttempts.length - 2].score;
  
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
      {/* Header */}
      <div className="p-6" style={{ background: 'rgba(124,58,237,0.2)', borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Target className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h1 className="text-3xl font-bold mb-2 text-white">Practice Complete!</h1>
          <p className="text-purple-300">{session.title}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Score Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-white/50 mb-2">Your Score</p>
                <p className="text-5xl font-bold text-green-400">{attempt.score}%</p>
                <p className="text-sm text-white/50 mt-2">
                  {attempt.correctAnswers}/{attempt.totalQuestions} correct
                </p>
              </div>

              <div>
                <p className="text-sm text-white/50 mb-2">Your Rank</p>
                <p className="text-5xl font-bold text-purple-400">#{myRank}</p>
                <p className="text-sm text-white/50 mt-2">
                  Attempt {allAttempts.length}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/50 mb-2">Average Score</p>
                <p className="text-5xl font-bold text-blue-400">{averageScore}%</p>
                {isNewBest && allAttempts.length > 1 && (
                  <p className="text-sm text-green-400 font-semibold mt-2">
                    🎉 Above Your Average!
                  </p>
                )}
              </div>
            </div>

            {isImproved && !isNewBest && (
              <div className="mt-6 rounded-lg p-4 text-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-semibold">
                  Great job! You improved from your last attempt!
                </p>
              </div>
            )}

            {improvement > 0 && allAttempts.length > 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-white/50">Overall Improvement</p>
                <p className="text-3xl font-bold text-green-400">+{improvement}%</p>
                <p className="text-xs text-white/40">from first attempt</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Score History Chart */}
        {allAttempts.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="attempt" label={{ value: 'Attempt', position: 'insideBottom', offset: -5 }} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                  <Tooltip contentStyle={{ background: '#1e0a3c', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} />
                  <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        
        {/* Question Review */}
        {session.settings.showExplanations && (
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Question Review</CardTitle>
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
                    className="p-4 rounded-lg"
                    style={{
                      background: answer.isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${answer.isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {answer.isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-white mb-2">
                          Question {idx + 1}: {question.question}
                        </p>

                        {!answer.isCorrect && (
                          <div className="mb-2">
                            <p className="text-sm text-red-300">
                              Your answer: <span className="font-semibold">{answer.selectedAnswer}</span>
                            </p>
                          </div>
                        )}

                        <div className="mb-2">
                          <p className="text-sm text-green-300">
                            Correct answer: <span className="font-semibold">{answer.correctAnswer}</span>
                          </p>
                        </div>

                        {question.explanation && (
                          <div className="mt-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-sm text-white/70">
                              <span className="font-semibold text-white">Explanation:</span> {question.explanation}
                            </p>
                          </div>
                        )}

                        {wasIncorrectBefore && answer.isCorrect && (
                          <div className="mt-2 text-sm text-green-400 font-semibold">
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
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Leaderboard (Top 20)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-8">
                    No other participants yet.
                  </p>
                ) : (
                  <table className="w-full">
                    <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/50 uppercase">Name</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Attempts</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Worst</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Best</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Last</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {leaderboard.slice(0, 20).map((entry) => (
                        <tr
                          key={entry.name}
                          style={entry.name === attempt.studentName ? { background: 'rgba(34,197,94,0.12)' } : undefined}
                          className="hover:bg-white/5"
                        >
                          <td className="px-4 py-3 font-medium text-white">
                            {entry.name}
                            {entry.name === attempt.studentName && <span className="text-green-400 ml-1">(You)</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-white/60">
                            {entry.attemptCount}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-red-400">
                            {entry.worstScore}%
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-green-400">
                            {entry.bestScore}%
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-purple-400">
                            {entry.lastScore}%
                          </td>
                          <td className="px-4 py-3 text-center text-white/50 text-sm">
                            {entry.lastDuration
                              ? (() => { const s = Math.floor(entry.lastDuration / 1000); const m = Math.floor(s / 60); return m > 0 ? `${m}m ${s % 60}s` : `${s}s`; })()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleTryAgain}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg py-6"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Try Again
          </Button>

          {session.settings.showLeaderboard && (
            <Button
              onClick={handleViewLeaderboard}
              variant="outline"
              className="flex-1 font-bold text-lg py-6 text-white border-white/20 hover:bg-white/10"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Leaderboard
            </Button>
          )}
        </div>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full font-semibold text-base py-5 text-white/60 border-white/10 hover:bg-white/5 hover:text-white"
        >
          ← Back to Home
        </Button>
      </div>
    </div>
  );
}
