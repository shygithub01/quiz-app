// Practice Live Mode Teacher Dashboard
// Real-time monitoring and analytics for practice sessions

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target, 
  Users, 
  TrendingUp,
  QrCode,
  StopCircle,
  BarChart3,
  Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  listenToSession,
  listenToLeaderboard,
  listenToParticipants,
  calculatePracticeAnalytics
} from '@/services/practiceService';
import { 
  PracticeSession, 
  LeaderboardEntry, 
  PracticeAnalytics
} from '@/types/practiceMode';

export default function PracticeTeacherDashboard() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  // State management
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [analytics, setAnalytics] = useState<PracticeAnalytics | null>(null);
  const [, setActiveParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load session data and set up real-time listeners
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }
    
    console.log('📊 Dashboard loading session:', sessionId);
    
    // Listen to session updates
    const unsubscribeSession = listenToSession(sessionId, (updatedSession) => {
      console.log('📊 Session data received:', updatedSession);
      if (updatedSession) {
        setSession(updatedSession);
        setLoading(false);
      } else {
        console.error('❌ Session not found:', sessionId);
        setError('Session not found');
        setLoading(false);
      }
    });
    
    // Listen to leaderboard updates
    const unsubscribeLeaderboard = listenToLeaderboard(sessionId, (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
    });
    
    // Listen to active participants
    const unsubscribeParticipants = listenToParticipants(sessionId, (participants: any[]) => {
      setActiveParticipants(participants);
    });
    
    return () => {
      unsubscribeSession();
      unsubscribeLeaderboard();
      unsubscribeParticipants();
    };
  }, [sessionId]);
  
  // Calculate analytics when leaderboard updates
  useEffect(() => {
    if (session && leaderboard.length > 0) {
      const fetchAnalytics = async () => {
        try {
          const analyticsData = await calculatePracticeAnalytics(session.id);
          setAnalytics(analyticsData);
        } catch (error) {
          console.error('Error fetching analytics:', error);
        }
      };
      fetchAnalytics();
    }
  }, [session, leaderboard]);
  
  const getJoinURL = () => {
    if (!session) return '';
    return `${window.location.origin}/practice/join?pin=${session.pin}`;
  };
  
  const handleEndSession = async () => {
    if (!session) return;
    
    const confirm = window.confirm(
      'Are you sure you want to end this practice session?\n\n' +
      'This will:\n' +
      '- Stop accepting new participants\n' +
      '- Archive all data to Firestore\n' +
      '- Keep data for 30 days before deletion'
    );
    
    if (!confirm) return;
    
    try {
      // TODO: Implement endPracticeSession in Phase 4
      alert('End session functionality will be implemented in Phase 4');
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session');
    }
  };
  
  const handleDownloadQR = () => {
    if (!session) return;
    
    try {
      // Get the QR code SVG element
      const svg = document.querySelector('#practice-qr-code');
      if (!svg) return;
      
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size
      canvas.width = 300;
      canvas.height = 300;
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Load image and draw to canvas
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Download as PNG
        canvas.toBlob((blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `practice-qr-${session.pin}.png`;
          link.click();
          URL.revokeObjectURL(downloadUrl);
        });
        
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
        <div className="text-center">
          <Target className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
        <div className="text-center">
          <Target className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/60 mb-4">{error || 'Session not found'}</p>
          <Button onClick={() => navigate('/admin/competitions')}>
            Back to Competitions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-xl">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Target className="h-10 w-10" />
              Practice Live Mode Dashboard
            </h1>
            <p className="text-indigo-100 mt-2 text-lg">
              {session.title}
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Session Info & QR Code */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <QrCode className="h-5 w-5" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCodeSVG
                      id="practice-qr-code"
                      value={getJoinURL()}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-white/50 mb-1">PIN Code</p>
                    <p className="text-5xl font-bold text-purple-400 tracking-wider">
                      {session.pin}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(session.pin);
                        alert('PIN copied to clipboard!');
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Copy PIN
                    </Button>
                    <Button
                      onClick={handleDownloadQR}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Download QR
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/50">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      session.status === 'active' ? 'bg-green-500/20 text-green-300' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/50">Created</span>
                    <span className="text-sm font-medium text-white">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">Ends</span>
                    <span className="text-sm font-medium text-white">
                      {new Date(session.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleEndSession}
                    variant="destructive"
                    className="w-full"
                    disabled={session.status === 'ended'}
                  >
                    <StopCircle className="h-5 w-5 mr-2" />
                    End Session
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Real-time Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-medium text-white/70">Total Students</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">
                    {analytics?.totalStudents || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium text-white/70">Total Attempts</span>
                  </div>
                  <span className="text-2xl font-bold text-green-400">
                    {analytics?.totalAttempts || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-medium text-white/70">Average Score</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-400">
                    {analytics?.averageScore ? analytics.averageScore.toFixed(1) : '0.0'}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(249,115,22,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-400" />
                    <span className="text-sm font-medium text-white/70">Avg Attempts</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-400">
                    {analytics?.averageAttempts ? analytics.averageAttempts.toFixed(1) : '0.0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  Leaderboard (Top 20)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  {leaderboard.length === 0 ? (
                    <p className="text-sm text-white/40 text-center py-8">
                      No attempts yet. Students will appear here after completing their first attempt.
                    </p>
                  ) : (
                    <table className="w-full">
                      <thead className="sticky top-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white/50 uppercase">Name</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Attempts</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Worst</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Best</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-white/50 uppercase">Last</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {leaderboard.slice(0, 20).map((entry) => (
                          <tr key={entry.name} className="hover:bg-white/5">
                            <td className="px-4 py-3 font-medium text-white">{entry.name}</td>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
