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
      alert(`Failed to create session: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl shadow-xl">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Target className="h-10 w-10" />
              Practice Live Mode Host
            </h1>
            <p className="text-green-100 mt-2 text-lg">
              Create practice sessions from your templates
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/competitions')}
            className="bg-white text-green-600 hover:bg-green-50 border-0 font-semibold"
          >
            ← Back
          </Button>
        </div>
        
        {/* Create Session Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Create New Practice Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {competitions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No Practice Live Mode templates found.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Create a competition with "Practice Live Mode" type first.
                </p>
                <Button onClick={() => navigate('/admin/create-competition')}>
                  Create Template
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Template
                  </label>
                  <select
                    value={selectedCompetition}
                    onChange={(e) => setSelectedCompetition(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- Select a template --</option>
                    {competitions.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.title} ({comp.questionCount} questions)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Session Duration
                  </label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="week">1 Week</option>
                    <option value="month">1 Month</option>
                    <option value="semester">1 Semester (~4 months)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                {sessionDuration === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleCreateSession}
                    disabled={!selectedCompetition || creating || (sessionDuration === 'custom' && !customEndDate)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-6"
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
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <h3 className="font-bold text-green-900 mb-2">How Practice Live Mode Works</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Select a template you created earlier</li>
              <li>• Choose how long the session should last</li>
              <li>• Students join using PIN or QR code (no sign-in required)</li>
              <li>• Students can attempt the quiz multiple times</li>
              <li>• Same questions on each retry for improvement tracking</li>
              <li>• Monitor progress in real-time on the dashboard</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
