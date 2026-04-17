// Practice Live Mode Host Control Panel
// Allows teachers to create practice sessions from templates

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Trophy, Calendar } from 'lucide-react';
import { getCompetitions } from '@/components/ui/firebase';
import { createPracticeSession } from '@/services/practiceService';
import { auth } from '@/components/ui/firebase';

export default function PracticeLiveHost() {
  const navigate = useNavigate();
  
  // State
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Session settings
  const [sessionDuration, setSessionDuration] = useState<'week' | 'month' | 'semester' | 'custom'>('month');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Load competitions on mount
  useEffect(() => {
    loadCompetitions();
  }, []);
  
  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const allCompetitions = await getCompetitions();
      
      // Filter for Practice Live Mode templates
      const practiceLiveTemplates = allCompetitions.filter(
        (comp: any) => comp.isPracticeLive === true
      );
      
      setCompetitions(practiceLiveTemplates);
    } catch (error) {
      console.error('Error loading competitions:', error);
      alert('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateSession = async () => {
    if (!selectedCompetition) {
      alert('Please select a template');
      return;
    }
    
    try {
      setCreating(true);
      
      const competition = competitions.find(c => c.id === selectedCompetition);
      if (!competition) {
        throw new Error('Competition not found');
      }
      
      // Calculate end date based on session duration
      let calculatedEndDate = Date.now();
      if (sessionDuration === 'week') {
        calculatedEndDate += 7 * 24 * 60 * 60 * 1000;
      } else if (sessionDuration === 'month') {
        calculatedEndDate += 30 * 24 * 60 * 60 * 1000;
      } else if (sessionDuration === 'semester') {
        calculatedEndDate += 120 * 24 * 60 * 60 * 1000; // ~4 months
      } else if (sessionDuration === 'custom' && customEndDate) {
        calculatedEndDate = new Date(customEndDate).getTime();
      }
      
      // Get settings from competition template
      const settings = competition.practiceLiveSettings || {
        showLeaderboard: true,
        showExplanations: true,
        maxQuestions: 20
      };
      
      const { sessionId, pin } = await createPracticeSession(
        competition.id,
        competition.title,
        competition.description || '',
        settings,
        auth.currentUser?.uid || '',
        calculatedEndDate
      );
      
      alert(`✅ Practice Session Created!\n\nPIN: ${pin}\n\nShare this PIN with students or show the QR code.`);
      
      // Redirect to teacher dashboard
      navigate(`/admin/practice/dashboard/${sessionId}`);
    } catch (error: any) {
      console.error('Error creating session:', error);
      
      // Check if it's the session limit error
      if (error.message.includes('Maximum of 5 active sessions')) {
        const goToManager = confirm(
          '⚠️ Session Limit Reached\n\n' +
          'You have 5 active practice sessions (maximum allowed).\n\n' +
          'Would you like to go to the Session Manager to end an existing session?\n\n' +
          'Click OK to manage sessions, or Cancel to stay here.'
        );
        
        if (goToManager) {
          navigate('/admin/practice/manage');
        }
      } else {
        alert(`Failed to create session: ${error.message}`);
      }
    } finally {
      setCreating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
        <div className="text-center">
          <Target className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1e0a3c 50%, #0a1628 100%)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 md:p-6 rounded-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
                <Target className="h-7 w-7 md:h-10 md:w-10 flex-shrink-0" />
                Practice Live Mode Host
              </h1>
              <p className="text-purple-100 mt-1 text-sm md:text-lg">
                Create practice sessions from your templates
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/practice/manage')}
                className="bg-white text-purple-600 hover:bg-purple-50 border-0 font-semibold text-sm"
              >
                Manage Sessions
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/competitions')}
                className="bg-white text-purple-600 hover:bg-purple-50 border-0 font-semibold text-sm"
              >
                ← Back
              </Button>
            </div>
          </div>
        </div>
        
        {/* Create Session Card */}
        <Card style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Create New Practice Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {competitions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 mb-4">
                  No Practice Live Mode templates found.
                </p>
                <p className="text-sm text-white/40 mb-4">
                  Create a competition with "Practice Live Mode" type first.
                </p>
                <Button onClick={() => navigate('/admin/create-competition')}>
                  Create Template
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Select Template
                  </label>
                  <select
                    value={selectedCompetition}
                    onChange={(e) => setSelectedCompetition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <option value="" style={{ background: '#1e0a3c' }}>-- Select a template --</option>
                    {competitions.map((comp) => (
                      <option key={comp.id} value={comp.id} style={{ background: '#1e0a3c' }}>
                        {comp.title} ({comp.questionCount} questions)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Session Duration
                  </label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-white"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <option value="week" style={{ background: '#1e0a3c' }}>1 Week</option>
                    <option value="month" style={{ background: '#1e0a3c' }}>1 Month</option>
                    <option value="semester" style={{ background: '#1e0a3c' }}>1 Semester (~4 months)</option>
                    <option value="custom" style={{ background: '#1e0a3c' }}>Custom</option>
                  </select>
                </div>

                {sessionDuration === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Custom End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleCreateSession}
                    disabled={!selectedCompetition || creating || (sessionDuration === 'custom' && !customEndDate)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg py-6"
                  >
                    {creating ? (
                      <>
                        <Target className="h-6 w-6 mr-2 animate-spin" />
                        Creating Session...
                      </>
                    ) : (
                      <>
                        <Target className="h-6 w-6 mr-2" />
                        Create Practice Session
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Info Card */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(124,58,237,0.12)', border: '1.5px solid rgba(124,58,237,0.3)' }}>
          <h3 className="font-bold text-purple-300 mb-2">How Practice Live Mode Works</h3>
          <ul className="text-sm text-purple-200/70 space-y-1">
            <li>• Select a template you created earlier</li>
            <li>• Choose how long the session should last</li>
            <li>• Students join using PIN or QR code (no sign-in required)</li>
            <li>• Students can attempt the quiz multiple times</li>
            <li>• Same questions on each retry for improvement tracking</li>
            <li>• Monitor progress in real-time on the dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
