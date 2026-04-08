// Live Modes Hub - Central navigation for all live modes
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Users, Zap, GraduationCap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/components/ui/firebase';

export default function LiveModesHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.uid) {
        const adminStatus = await isAdmin(user.uid);
        setUserIsAdmin(adminStatus);
      } else {
        setUserIsAdmin(false);
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Live Modes Hub
          </h1>
          <p className="text-xl text-gray-600">
            Choose your mode and start engaging with your audience
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Practice Live Mode - For Participants */}
          <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-8 w-8" />
                <CardTitle className="text-2xl">Practice Live Mode</CardTitle>
              </div>
              <p className="text-purple-100">For Students - Join & Practice</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">Unlimited attempts to improve your score</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">Same questions each time for learning</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">Track progress with average scores</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">No time pressure - learn at your pace</p>
                </div>
              </div>

              <Button
                onClick={() => navigate('/practice/join')}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg py-6"
              >
                <Target className="h-5 w-5 mr-2" />
                Join Practice Session
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Live Event Mode - For Participants */}
          <Card className="border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-8 w-8" />
                <CardTitle className="text-2xl">Live Event Mode</CardTitle>
              </div>
              <p className="text-orange-100">For Participants - Join & Compete</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">Real-time competitive quiz events</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">Fastest finger wins - speed matters</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">Live leaderboard on big screen</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">Perfect for cultural events & gatherings</p>
                </div>
              </div>

              <Button
                onClick={() => navigate('/live-event/join')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold text-lg py-6"
              >
                <Zap className="h-5 w-5 mr-2" />
                Join Live Event
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Admin-only Host Cards */}
          {userIsAdmin && (
            <>
              {/* Practice Live Mode - For Teachers */}
              <Card className="border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="h-8 w-8" />
                    <CardTitle className="text-2xl">Practice Live Mode</CardTitle>
                  </div>
                  <p className="text-green-100">For Teachers - Host & Monitor</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 font-bold text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">Create sessions from your templates</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 font-bold text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">Share PIN or QR code with students</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 font-bold text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">Monitor student progress in real-time</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 font-bold text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">View leaderboard and analytics</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/admin/practice/host')}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-6"
                  >
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Host Practice Session
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/admin/practice/manage')}
                    variant="outline"
                    className="w-full border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold text-base py-4"
                  >
                    Manage Active Sessions
                  </Button>
                </CardContent>
              </Card>

              {/* Live Event Mode - For Hosts */}
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-8 w-8" />
                    <CardTitle className="text-2xl">Live Event Mode</CardTitle>
                  </div>
                  <p className="text-blue-100">For Hosts - Create & Control</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">Host live quiz competitions</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">Control question flow in real-time</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">Projector view for audience display</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">QR code & PIN for easy joining</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/admin/live-event-host')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg py-6"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Host Live Event
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Reference */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">Quick Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-purple-600 mb-2">Practice Live Mode</h3>
                <p className="text-sm text-gray-600 mb-2">Best for: Homework, self-paced learning, skill improvement</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Students: /practice/join</li>
                  <li>• Teachers: /admin/practice-live-host</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-orange-600 mb-2">Live Event Mode</h3>
                <p className="text-sm text-gray-600 mb-2">Best for: Cultural events, competitions, gatherings</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Participants: /live-event/join</li>
                  <li>• Hosts: /admin/live-event-host</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
