import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Star,
  ArrowRight,
  Calendar,
  Award,
  Brain,
  Shield
} from 'lucide-react';

export default function ScholarshipHome() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [participantCount] = useState(47);

  // Countdown timer for next competition
  useEffect(() => {
    const targetDate = new Date('2025-03-15T10:00:00').getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft('Registration Closed');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSignUp = () => {
    if (user) {
      navigate('/scholarship/register');
    } else {
      signIn();
    }
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
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
              <MapPin className="h-4 w-4 text-purple-300" />
              <span className="text-purple-100 font-medium">Starting in Henrico County, VA</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              🏆 HENRICO MERIT
              <br />
              <span className="text-purple-300">SCHOLARSHIP</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-purple-100 mb-4 max-w-3xl mx-auto">
              Win Real Money for Your Knowledge
            </p>
            
            <p className="text-lg text-purple-200 mb-8 max-w-2xl mx-auto">
              AI-powered fair competitions. Merit-based scholarships. Local students first.
            </p>

            {/* Next Competition Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-300" />
                  <div className="text-2xl font-bold text-white">March 15</div>
                  <div className="text-purple-200">Next Competition</div>
                </div>
                <div>
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <div className="text-2xl font-bold text-white">$300</div>
                  <div className="text-purple-200">Prize Pool</div>
                </div>
                <div>
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <div className="text-2xl font-bold text-white">{participantCount}</div>
                  <div className="text-purple-200">Registered</div>
                </div>
                <div>
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                  <div className="text-2xl font-bold text-white">{timeLeft}</div>
                  <div className="text-purple-200">Time Left</div>
                </div>
              </div>
            </div>

            {/* Prize Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                <div className="text-xl font-bold text-white">$150</div>
                <div className="text-yellow-200 text-sm">1st Place</div>
              </div>
              <div className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 backdrop-blur-sm rounded-lg p-4 border border-gray-400/30">
                <Award className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                <div className="text-xl font-bold text-white">$100</div>
                <div className="text-gray-200 text-sm">2nd Place</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30">
                <Star className="h-6 w-6 mx-auto mb-2 text-orange-400" />
                <div className="text-xl font-bold text-white">$50</div>
                <div className="text-orange-200 text-sm">3rd Place</div>
              </div>
            </div>

            {/* CTA Button */}
            <Button 
              onClick={handleSignUp}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
            >
              {user ? 'Register for Competition' : 'Sign In & Register FREE'}
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>

            <p className="text-purple-200 text-sm mt-4">
              ✅ Free Registration • ✅ Henrico County Students Only • ✅ Grades 9-12 + College
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/5 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Why Students Love Our Scholarship Program
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <CardTitle className="text-lg">AI-Generated Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center">
                  100% fair and unbiased. No human favoritism, just pure knowledge assessment.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <CardTitle className="text-lg">One Attempt Only</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center">
                  Merit-based competition. Your knowledge and preparation determine your success.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <CardTitle className="text-lg">Real Money Prizes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center">
                  Actual cash scholarships paid directly to winners within 24 hours.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-orange-400" />
                <CardTitle className="text-lg">Local Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 text-center">
                  Supporting Henrico County students first, with expansion plans across Virginia.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            What Students Are Saying
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="ml-3">
                    <div className="text-white font-semibold">Sarah M.</div>
                    <div className="text-purple-200 text-sm">Deep Run High School</div>
                  </div>
                </div>
                <p className="text-purple-100 italic">
                  "I won $150 and it covered my textbooks for the semester! The questions were fair and I felt like my studying actually paid off."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="ml-3">
                    <div className="text-white font-semibold">Mike J.</div>
                    <div className="text-purple-200 text-sm">VCU Student</div>
                  </div>
                </div>
                <p className="text-purple-100 italic">
                  "Finally, a scholarship that rewards actual knowledge instead of essay writing skills. The AI questions were challenging but fair."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="ml-3">
                    <div className="text-white font-semibold">Alex P.</div>
                    <div className="text-purple-200 text-sm">Freeman High School</div>
                  </div>
                </div>
                <p className="text-purple-100 italic">
                  "The practice mode helped me prepare, and when I won $100, my parents were so proud. This program is amazing!"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Expansion Preview */}
      <div className="bg-white/5 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            🚀 Coming Soon to More Areas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">Chesterfield County</h3>
              <p className="text-purple-200 mb-4">Summer 2025</p>
              <Button variant="outline" className="border-purple-300 text-purple-100 hover:bg-purple-800">
                Join Waitlist
              </Button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">Richmond Metro</h3>
              <p className="text-purple-200 mb-4">Fall 2025</p>
              <Button variant="outline" className="border-purple-300 text-purple-100 hover:bg-purple-800">
                Join Waitlist
              </Button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">Statewide Virginia</h3>
              <p className="text-purple-200 mb-4">2026</p>
              <Button variant="outline" className="border-purple-300 text-purple-100 hover:bg-purple-800">
                Join Waitlist
              </Button>
            </div>
          </div>

          <p className="text-purple-200 mt-8 max-w-2xl mx-auto">
            We're starting local and expanding based on success. Join our waitlist to be notified 
            when scholarships become available in your area!
          </p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Win Your First Scholarship?
          </h2>
          
          <p className="text-xl text-purple-100 mb-8">
            Join {participantCount} Henrico students already registered for March 15th competition
          </p>
          
          <Button 
            onClick={handleSignUp}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
          >
            {user ? 'Complete Registration' : 'Sign In with Google - FREE'}
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>

          <div className="mt-8 flex items-center justify-center gap-8 text-purple-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Secure Google Sign-In</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Real Cash Prizes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}