// Practice Live Mode Join Page
// Allows students to join practice sessions using PIN or QR code

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, AlertCircle } from 'lucide-react';
import {
  getSessionByPIN,
  joinPracticeSession
} from '@/services/practiceService';
import { validatePINFormat, validateNameLength } from '@/services/liveEventService';
import {
  saveNameToLocalStorage,
  getNameFromLocalStorage
} from '@/utils/practiceStorage';

export default function PracticeJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Auto-fill PIN from QR code
  useEffect(() => {
    const pinFromQR = searchParams.get('pin');
    if (pinFromQR) {
      setPin(pinFromQR);
    }
  }, [searchParams]);
  
  // Auto-fill name from localStorage when session is found
  useEffect(() => {
    if (sessionId) {
      const savedName = getNameFromLocalStorage(sessionId);
      if (savedName) {
        setName(savedName);
      }
    }
  }, [sessionId]);
  
  // Validate PIN and get session when PIN is complete
  useEffect(() => {
    if (pin.length === 6) {
      validateSession();
    }
  }, [pin]);
  
  const validateSession = async () => {
    try {
      console.log('🔍 Validating PIN:', pin);
      const session = await getSessionByPIN(pin);
      console.log('📊 Session found:', session);
      
      if (session) {
        setSessionId(session.id);
        setError('');
        console.log('✅ Valid session ID:', session.id);
      } else {
        setSessionId(null);
        setError('Invalid PIN. Session not found.');
        console.log('❌ No session found for PIN:', pin);
      }
    } catch (error) {
      console.error('❌ Error validating session:', error);
      setSessionId(null);
      setError('Error validating PIN. Please try again.');
    }
  };
  
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate PIN format
    if (!validatePINFormat(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    
    // Validate name length
    if (!validateNameLength(name)) {
      setError('Name must be between 2 and 50 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if session exists
      const session = await getSessionByPIN(pin);
      if (!session) {
        setError('Invalid PIN. Session not found.');
        return;
      }
      
      // Validate and join the session (no database write, just validation)
      await joinPracticeSession(session.id, name);
      
      // Save name to localStorage
      saveNameToLocalStorage(session.id, name);
      
      // Redirect to quiz interface
      navigate(`/practice/quiz/${session.id}`);
    } catch (error: any) {
      console.error('Error joining session:', error);
      setError(error.message || 'Failed to join session. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <Target className="h-16 w-16" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Join Practice Session
          </CardTitle>
          <p className="text-purple-100 mt-2">
            Enter the session PIN and your name to start practicing
          </p>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleJoin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Session PIN *
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPin(value);
                  setError('');
                }}
                placeholder="Enter 6-digit PIN"
                className="w-full px-4 py-3 text-2xl font-bold text-center tracking-widest border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Get the PIN from your teacher or scan the QR code
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                minLength={2}
                maxLength={50}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                2-50 characters • Your name will be saved for future attempts
              </p>
            </div>
            
            <Button
              type="submit"
              disabled={loading || pin.length !== 6 || name.trim().length < 2}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg py-6"
            >
              {loading ? (
                <>
                  <Users className="h-5 w-5 mr-2 animate-spin" />
                  Joining Session...
                </>
              ) : (
                <>
                  <Target className="h-5 w-5 mr-2" />
                  Start Practicing
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-purple-900 mb-2">
                🎯 Practice Live Mode Features
              </h3>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>✓ Unlimited attempts - practice as many times as you want</li>
                <li>✓ Same questions each time - track your improvement</li>
                <li>✓ No time pressure - answer at your own pace</li>
                <li>✓ See your progress on the leaderboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
