// Home.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getFeaturedCompetition } from '@/components/ui/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  FileText, 
  Trophy,
  Users,
  Zap,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Star,
  DollarSign,
  Calendar
} from 'lucide-react';

// Types & Interfaces
interface FeaturedCompetition {
  id: string;
  title: string;
  prizePool: string;
  startDate: Date;
  participantCount: number;
}

export default function Home() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [featuredCompetition, setFeaturedCompetition] = useState<FeaturedCompetition | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCompetition();
  }, []);

  const loadFeaturedCompetition = async () => {
    try {
      const competition = await getFeaturedCompetition();
      
      if (competition) {
        // Check if competition has ended by comparing end date
        const now = new Date();
        const endDate = new Date(competition.endDate);
        
        console.log('📅 Featured competition:', competition.title);
        console.log('📅 End date:', endDate);
        console.log('📅 Current date:', now);
        console.log('📅 Has ended:', endDate < now);
        
        if (endDate < now) {
          // Featured competition has ended - show "Coming Soon"
          console.log('⚠️ Featured competition has ended, showing Coming Soon');
          setFeaturedCompetition({
            id: 'expired',
            title: 'Competition Coming Soon!',
            prizePool: '$300',
            startDate: new Date(),
            participantCount: 0
          });
        } else {
          // Featured competition is still active/upcoming - show it
          console.log('✅ Featured competition is active, showing details');
          setFeaturedCompetition({
            id: competition.id,
            title: competition.title,
            prizePool: competition.prizePool || '$300',
            startDate: competition.startDate,
            participantCount: competition.participantCount || 0
          });
        }
      } else {
        // No featured competition set - show "Coming Soon"
        console.log('⚠️ No featured competition set, showing Coming Soon');
        setFeaturedCompetition({
          id: 'none',
          title: 'Competition Coming Soon!',
          prizePool: '$300',
          startDate: new Date(),
          participantCount: 0
        });
      }
    } catch (error) {
      console.error('❌ Error loading featured competition:', error);
      // On error, show "Coming Soon"
      setFeaturedCompetition({
        id: 'error',
        title: 'Competition Coming Soon!',
        prizePool: '$300',
        startDate: new Date(),
        participantCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16">
          {/* Main Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-purple-100 font-medium">AI-Powered Quiz Generation Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Quizist.AI
              </span>
              <br />
              <span className="text-3xl md:text-4xl text-purple-200">
                Where Knowledge Meets Innovation
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Transform any document or topic into intelligent quizzes. Win scholarships. Build knowledge.
            </p>


          </div>

          {/* Featured Competition Banner */}
          {featuredCompetition && (
            <div className={`backdrop-blur-sm rounded-2xl p-8 border mb-16 ${
              featuredCompetition.id === 'expired' || featuredCompetition.id === 'none'
                ? 'bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border-orange-400/30'
                : 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-400/30'
            }`}>
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 ${
                  featuredCompetition.id === 'expired' || featuredCompetition.id === 'none'
                    ? 'bg-orange-500/20'
                    : 'bg-green-500/20'
                }`}>
                  <Star className="h-4 w-4 text-yellow-300" />
                  <span className={`font-medium ${
                    featuredCompetition.id === 'expired' || featuredCompetition.id === 'none'
                      ? 'text-orange-100'
                      : 'text-green-100'
                  }`}>Featured Scholarship Competition</span>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">{featuredCompetition.title}</h2>
                
                {featuredCompetition.id === 'expired' || featuredCompetition.id === 'none' ? (
                  <div className="max-w-2xl mx-auto mb-6">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-orange-300 opacity-50" />
                    <p className="text-xl text-orange-100">
                      The latest competition has ended. New competitions coming soon!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-6">
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-400" />
                      <div className="text-2xl font-bold text-white">{featuredCompetition.prizePool}</div>
                      <div className="text-green-200">Prize Pool</div>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                      <div className="text-2xl font-bold text-white">{formatDate(featuredCompetition.startDate)}</div>
                      <div className="text-green-200">Competition Date</div>
                    </div>
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                      <div className="text-2xl font-bold text-white">{featuredCompetition.participantCount}</div>
                      <div className="text-green-200">Registered</div>
                    </div>
                  </div>
                )}

                {featuredCompetition.id === 'expired' || featuredCompetition.id === 'none' || featuredCompetition.id === 'error' ? (
                  user && (
                    <Button 
                      onClick={() => navigate('/competitions')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full"
                    >
                      Practice Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )
                ) : (
                  <Button 
                    onClick={() => navigate('/scholarship')}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-full"
                  >
                    Register for Scholarship
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Choose Your Path Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Choose Your Path
            </h2>
            <p className="text-xl text-purple-200">
              Generate intelligent quizzes or compete for scholarships
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Try Quiz Generator */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-400/30 text-white">
              <CardHeader className="text-center">
                <Brain className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                <CardTitle className="text-2xl">Try Quiz Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    <span>Upload documents or enter topics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    <span>AI-generated intelligent questions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    <span>Multiple difficulty levels</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    <span>Instant results and explanations</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={async () => {
                      if (user) {
                        navigate('/quiz-generator');
                      } else {
                        try {
                          await signIn();
                          // After successful sign-in, navigate to quiz generator
                          navigate('/quiz-generator');
                        } catch (error) {
                          console.error('Sign-in failed:', error);
                        }
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  >
                    {user ? 'Start Creating Quizzes' : 'Sign In to Try Generator'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* For Students */}
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-400/30 text-white">
              <CardHeader className="text-center">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-green-400" />
                <CardTitle className="text-2xl">For Students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Win real money scholarships</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Practice with unlimited attempts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Track your progress over time</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Compete in timed competitions</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={async () => {
                      if (user) {
                        navigate('/scholarship');
                      } else {
                        try {
                          await signIn();
                          // After successful sign-in, navigate to scholarship
                          navigate('/scholarship');
                        } catch (error) {
                          console.error('Sign-in failed:', error);
                        }
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    {user ? 'View Scholarships' : 'Sign In for Scholarships'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Cultural Events */}
            <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-400/30 text-white">
              <CardHeader className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-orange-400" />
                <CardTitle className="text-2xl">Live Cultural Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-400" />
                    <span>Host cultural quiz competitions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-400" />
                    <span>QR code & PIN for easy joining</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-400" />
                    <span>Large-screen projector display</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-400" />
                    <span>Live leaderboard & fastest finger</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={async () => {
                      if (user) {
                        // Check for active live events first
                        try {
                          const { getCompetitions } = await import('@/components/ui/firebase');
                          const competitions = await getCompetitions();
                          
                          // Find active live events
                          const activeLiveEvent = competitions.find((comp: any) => 
                            comp.isLiveEvent && comp.status === 'active'
                          );
                          
                          if (activeLiveEvent) {
                            // Navigate to the host page for the active live event
                            navigate(`/live-event/${activeLiveEvent.id}/host`);
                          } else {
                            // No active live event, go to create competition
                            navigate('/admin/create-competition');
                          }
                        } catch (error) {
                          console.error('Error checking for active live events:', error);
                          // Fallback to create competition page
                          navigate('/admin/create-competition');
                        }
                      } else {
                        try {
                          await signIn();
                          // After sign-in, check for active live events
                          const { getCompetitions } = await import('@/components/ui/firebase');
                          const competitions = await getCompetitions();
                          
                          const activeLiveEvent = competitions.find((comp: any) => 
                            comp.isLiveEvent && comp.status === 'active'
                          );
                          
                          if (activeLiveEvent) {
                            navigate(`/live-event/${activeLiveEvent.id}/host`);
                          } else {
                            navigate('/admin/create-competition');
                          }
                        } catch (error) {
                          console.error('Sign-in failed:', error);
                        }
                      }
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                  >
                    {user ? 'Host Cultural Event' : 'Sign In to Host Event'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/5 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Every User
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              From students to educators, our AI-powered platform serves everyone's learning needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Document Upload */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <CardTitle className="text-xl">Document to Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center mb-4">
                  Upload PDFs, Word docs, or text files and instantly generate intelligent quizzes from your content.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-sm">PDF</span>
                  <span className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-sm">DOCX</span>
                  <span className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-sm">TXT</span>
                </div>
              </CardContent>
            </Card>

            {/* Topic-Based Generation */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <CardTitle className="text-xl">Topic-Based Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center mb-4">
                  Enter any topic and our AI generates comprehensive quizzes with multiple difficulty levels.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-sm">Math</span>
                  <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-sm">Science</span>
                  <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-sm">History</span>
                </div>
              </CardContent>
            </Card>

            {/* Scholarship Competitions */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                <CardTitle className="text-xl">Merit Scholarships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center mb-4">
                  Compete in timed competitions and win real money scholarships based on your knowledge and speed.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded text-sm">Cash Prizes</span>
                  <span className="bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded text-sm">Fair Competition</span>
                </div>
              </CardContent>
            </Card>




          </div>
        </div>
      </div>




    </div>
  );
}
