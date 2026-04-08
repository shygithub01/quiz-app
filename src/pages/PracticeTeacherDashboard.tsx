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
  Download,
  QrCode,
  StopCircle,
  BarChart3,
  Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  listenToSession,
  listenToLeaderboard,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load session data and set up real-time listeners
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }
    
    // Listen to session updates
    const unsubscribeSession = listenToSession(sessionId, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
        setLoading(false);
      } else {
        setError('Session not found');
        setLoading(false);
      }
    });
    
    // Listen to leaderboard updates
    const unsubscribeLeaderboard = listenToLeaderboard(sessionId, (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
    });
    
    return () => {
      unsubscribeSession();
      unsubscribeLeaderboard();
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
  
  const handleDownloadCSV = () => {
    // TODO: Implement CSV export in Phase 3 Task 7.4
    alert('CSV export will be implemented in Phase 3 Task 7.4');
  };
  
  const handleDownloadPDF = () => {
    // TODO: Implement PDF export in Phase 3 Task 7.5
    alert('PDF export will be implemented in Phase 3 Task 7.5');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Session not found'}</p>
          <Button onClick={() => navigate('/admin/competitions')}>
            Back to Competitions
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
                <CardTitle className="flex items-center gap-2">
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
                    <p className="text-sm text-gray-600 mb-1">PIN Code</p>
                    <p className="text-5xl font-bold text-indigo-600 tracking-wider">
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
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      session.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ends</span>
                    <span className="text-sm font-medium">
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
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Total Students</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {analytics?.totalStudents || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Total Attempts</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {analytics?.totalAttempts || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {analytics?.averageScore.toFixed(1) || '0.0'}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Avg Attempts</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {analytics?.averageAttempts.toFixed(1) || '0.0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Leaderboard & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Download Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleDownloadCSV}
                    variant="outline"
                    className="border-2"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download CSV
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="border-2"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Leaderboard (Top 20)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  {leaderboard.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No attempts yet. Students will appear here after completing their first attempt.
                    </p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Best Score</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Attempts</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Improvement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {leaderboard.slice(0, 20).map((entry, index) => (
                          <tr key={entry.name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-50 text-gray-600'
                              }`}>
                                {entry.rank}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">{entry.name}</td>
                            <td className="px-4 py-3 text-center font-bold text-indigo-600">
                              {entry.bestScore}%
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {entry.attemptCount}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                entry.improvement > 0 ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {entry.improvement > 0 ? '+' : ''}{entry.improvement.toFixed(1)}%
                              </span>
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
