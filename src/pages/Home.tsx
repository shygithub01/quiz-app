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
  Target, 
  Users,
  Zap,
  BookOpen,
  GraduationCap,
  Building,
  ArrowRight,
  CheckCircle,
  Star,
  DollarSign,
  Calendar,
  Award
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
  const { user } = useAuth();
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
        setFeaturedCompetition({
          id: competition.id,
          title: competition.title,
          prizePool: competition.prizePool || '$300',
          startDate: competition.startDate,
          participantCount: competition.participantCount || 0
        });
      }
    } catch (error) {
      console.error('Error loading featured competition:', error);
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={() => user ? navigate('/quiz-generator') : navigate('/quiz-generator')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <Brain className="mr-2 h-6 w-6" />
                {user ? 'Create Quiz Now' : 'Try Quiz Generator'}
              </Button>
              
              {featuredCompetition && (
                <Button 
                  onClick={() => navigate('/scholarship')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <Trophy className="mr-2 h-6 w-6" />
                  Win Scholarships
                </Button>
              )}
            </div>
          </div>

          {/* Featured Competition Banner */}
          {featuredCompetition && (
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-2xl p-8 border border-green-400/30 mb-16">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-500/20 rounded-full px-4 py-2 mb-4">
                  <Star className="h-4 w-4 text-yellow-300" />
                  <span className="text-green-100 font-medium">Featured Scholarship Competition</span>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">{featuredCompetition.title}</h2>
                
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

                <Button 
                  onClick={() => navigate('/scholarship')}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-full"
                >
                  Register for Scholarship
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
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

            {/* Practice Mode */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <CardTitle className="text-xl">Practice & Improve</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center mb-4">
                  Take unlimited practice tests, track your progress, and build confidence before competitions.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="bg-green-500/20 text-green-200 px-2 py-1 rounded text-sm">Unlimited Attempts</span>
                  <span className="bg-green-500/20 text-green-200 px-2 py-1 rounded text-sm">Progress Tracking</span>
                </div>
              </CardContent>
            </Card>

            {/* AI-Powered */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-orange-400" />
                <CardTitle className="text-xl">AI-Powered Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center mb-4">
                  Advanced AI ensures fair, unbiased question generation with multiple difficulty levels and formats.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="bg-orange-500/20 text-orange-200 px-2 py-1 rounded text-sm">Smart Generation</span>
                  <span className="bg-orange-500/20 text-orange-200 px-2 py-1 rounded text-sm">Fair & Unbiased</span>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Ready */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
              <CardHeader className="text-center">
                <Building className="h-12 w-12 mx-auto mb-4 text-indigo-400" />
                <CardTitle className="text-xl">Enterprise Solutions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center mb-4">
                  Scalable solutions for schools, universities, and organizations with advanced analytics and management.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="bg-indigo-500/20 text-indigo-200 px-2 py-1 rounded text-sm">Coming Soon</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* User Types Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-purple-200">
              Whether you're a student, educator, or institution, we have the right solution for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Students */}
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
                    <span>Generate quizzes from your study materials</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => navigate(user ? '/quiz-generator' : '/quiz-generator')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    {user ? 'Start Creating Quizzes' : 'Get Started Free'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Educators */}
            <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-400/30 text-white">
              <CardHeader className="text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                <CardTitle className="text-2xl">For Educators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                    <span>Create assessments from any content</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                    <span>Save time on quiz creation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                    <span>Multiple difficulty levels</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                    <span>Instant feedback and analytics</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => navigate(user ? '/quiz-generator' : '/quiz-generator')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {user ? 'Create Teaching Materials' : 'Try for Teaching'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Institutions */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-400/30 text-white">
              <CardHeader className="text-center">
                <Building className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                <CardTitle className="text-2xl">For Institutions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    <span>Enterprise-grade security</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    <span>Advanced analytics dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    <span>Custom branding options</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-400" />
                    <span>Dedicated support team</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    disabled
                    className="w-full bg-purple-600/50 text-white font-semibold cursor-not-allowed opacity-60"
                  >
                    Coming Soon - Contact Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of students and educators already using Quizist.AI to enhance their learning experience
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate(user ? '/quiz-generator' : '/quiz-generator')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <Brain className="mr-2 h-6 w-6" />
              {user ? 'Create Your First Quiz' : 'Start Free Today'}
            </Button>
            
            {featuredCompetition && (
              <Button 
                onClick={() => navigate('/scholarship')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <Award className="mr-2 h-6 w-6" />
                Win Scholarships
              </Button>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 text-purple-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>100% Free to Start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
