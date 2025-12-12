import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompetitions, checkUserParticipation, checkPracticeParticipation, getPracticeParticipantCount } from '@/components/ui/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Calendar, Users, DollarSign, BookOpen } from 'lucide-react';

interface Competition {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  isPractice?: boolean;
  prizePool: number;
  participantCount: number;
  hasParticipated?: boolean;
}

export default function Competitions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    loadCompetitions();
  }, [user]);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const data = await getCompetitions();
      
      // Check participation and get correct participant counts
      const competitionsWithData = await Promise.all(
        data.map(async (comp) => {
          // For practice tests, get unique participant count from practiceAttempts
          // For scholarship competitions, use the participantCount from competition document
          const actualCount = comp.isPractice 
            ? await getPracticeParticipantCount(comp.id)
            : comp.participantCount || 0;
          
          // Add marketing boost to participant count
          // Practice: +100, Scholarship: +25
          const participantCount = comp.isPractice 
            ? actualCount + 100
            : actualCount + 25;
          
          // Check participation for each competition if user is logged in
          let hasParticipated = false;
          if (user?.uid) {
            // For practice tests, check practiceAttempts collection
            // For scholarship competitions, check leaderboard collection
            hasParticipated = comp.isPractice 
              ? await checkPracticeParticipation(user.uid, comp.id)
              : await checkUserParticipation(user.uid, comp.id);
          }
          
          return { ...comp, hasParticipated, participantCount };
        })
      );
      
      setCompetitions(competitionsWithData);
    } catch (error) {
      console.error('Failed to load competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompetitions = competitions.filter(comp => {
    if (filter === 'all') return true;
    return comp.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  /**
   * FIXED: Renders practice competition button with consistent styling
   * based ONLY on competition status - hasParticipated is COMPLETELY IGNORED
   * 
   * PRACTICE COMPETITIONS = UNLIMITED ATTEMPTS
   * - Users can retake practice tests as many times as they want
   * - Button appearance is the same for everyone (status-based only)
   * - No "Already Participated" blocking for practice
   */
  const renderPracticeButton = (competition: Competition) => {
    // Determine button state based ONLY on status
    const isCompleted = competition.status === 'completed';
    const isActive = competition.status === 'active';
    const isUpcoming = competition.status === 'upcoming';

    // For completed practice competitions - ALWAYS grey, ALWAYS same text
    if (isCompleted) {
      return (
        <button
          disabled
          className="flex-1 font-medium transition-all shadow-lg rounded-md px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 cursor-not-allowed"
        >
          📅 Practice Ended
        </button>
      );
    }

    // For active practice competitions - same button for everyone
    if (isActive) {
      return (
        <button
          onClick={() => navigate(`/competitions/${competition.id}`)}
          className="flex-1 font-medium transition-all shadow-lg hover:shadow-xl rounded-md px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
        >
          ▶️ Start Practice
        </button>
      );
    }

    // For upcoming practice competitions
    if (isUpcoming) {
      return (
        <button
          disabled
          className="flex-1 font-medium transition-all shadow-lg rounded-md px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 cursor-not-allowed"
        >
          ⏰ Coming Soon
        </button>
      );
    }

    // Fallback (should never reach here)
    return (
      <button
        disabled
        className="flex-1 font-medium transition-all shadow-lg rounded-md px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 cursor-not-allowed"
      >
        📅 Practice Ended
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-indigo-600 flex items-center gap-3">
              <Trophy className="h-10 w-10" />
              Scholarship Competitions
            </h1>
            <p className="text-gray-600 mt-2">
              Compete for scholarships by demonstrating your knowledge and speed
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['all', 'active', 'upcoming', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Competitions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No competitions found</p>
              <p className="text-gray-500 mt-2">Check back soon for new scholarship opportunities!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCompetitions.map((competition) => (
              <Card key={competition.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                        {competition.title}
                      </CardTitle>
                    </div>
                    {getStatusBadge(competition.status)}
                  </div>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {competition.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Show prize only for scholarship competitions */}
                    {!competition.isPractice && competition.prizePool > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          ${competition.prizePool.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {/* Show practice indicator for practice competitions */}
                    {competition.isPractice && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-semibold">Practice Session</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{competition.participantCount} participants</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {/* PRACTICE COMPETITIONS - FIXED BUTTON LOGIC */}
                    {competition.isPractice && renderPracticeButton(competition)}
 
                    {/* SCHOLARSHIP COMPETITIONS - ONE-TIME PARTICIPATION ONLY */}
                    {!competition.isPractice && (
                      <>
                        {/* Main Competition Button */}
                        {!competition.hasParticipated && competition.status === 'active' ? (
                          // User hasn't participated yet AND competition is active - allow joining
                          <button 
                            onClick={() => navigate(`/competitions/${competition.id}`)}
                            className="flex-1 font-medium transition-all shadow-lg hover:shadow-xl rounded-md px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                          >
                            🚀 Join Competition
                          </button>
                        ) : competition.hasParticipated ? (
                          // User already participated - show grey disabled button
                          <button 
                            disabled
                            className="flex-1 font-medium bg-gray-100 text-gray-800 border border-gray-300 cursor-not-allowed rounded-md px-4 py-2"
                          >
                            ✅ Already Participated
                          </button>
                        ) : competition.status === 'completed' ? (
                          // Competition is completed
                          <button 
                            disabled
                            className="flex-1 font-medium bg-gray-100 text-gray-800 border border-gray-300 cursor-not-allowed rounded-md px-4 py-2"
                          >
                            📅 Completed
                          </button>
                        ) : (
                          // Competition is upcoming
                          <button 
                            disabled
                            className="flex-1 font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 cursor-not-allowed rounded-md px-4 py-2"
                          >
                            ⏰ Upcoming
                          </button>
                        )}
                        
                        {/* View Details Button - Always Available */}
                        <button 
                          onClick={() => navigate(`/competitions/${competition.id}`)}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all rounded-md px-4 py-2"
                        >
                          📋 View Details
                        </button>
                        
                        {/* Leaderboard Button - Always Available */}
                        <button 
                          onClick={() => navigate(`/competitions/${competition.id}/leaderboard`)}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all rounded-md px-4 py-2"
                        >
                          🏆 Leaderboard
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
