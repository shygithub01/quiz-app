// Live Event Join Page
// Allows participants to join events using PIN or QR code

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, AlertCircle } from 'lucide-react';
import {
  getEventByPIN,
  joinEvent,
  validatePINFormat,
  validateNameLength
} from '@/services/liveEventService';

export default function LiveEventJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Auto-fill PIN from QR code
  useEffect(() => {
    const pinFromQR = searchParams.get('pin');
    if (pinFromQR) {
      setPin(pinFromQR);
    }
  }, [searchParams]);
  
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
      
      // Check if event exists
      const event = await getEventByPIN(pin);
      if (!event) {
        setError('Invalid PIN. Event not found.');
        return;
      }
      
      // Check if event is in lobby phase
      if (event.phase !== 'lobby') {
        setError('This event has already started. You cannot join now.');
        return;
      }
      
      // Join the event
      const sessionId = await joinEvent(event.id, name);
      
      // Store session info in sessionStorage (per-tab, not per-browser)
      sessionStorage.setItem(`liveEvent_${event.id}_session`, sessionId);
      sessionStorage.setItem(`liveEvent_${event.id}_name`, name);
      
      // Redirect to participant view
      navigate(`/live-event/participate/${event.id}/${sessionId}`);
    } catch (error: any) {
      console.error('Error joining event:', error);
      setError(error.message || 'Failed to join event. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Join Live Event
          </CardTitle>
          <p className="text-purple-100 mt-2">
            Enter the event PIN and your name to participate
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
                Event PIN *
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
                Get the PIN from the event organizer or scan the QR code
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
                2-50 characters • Must be unique in this event
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
                  Joining Event...
                </>
              ) : (
                <>
                  <Trophy className="h-5 w-5 mr-2" />
                  Join Event
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-600 mb-2">
              Don't have a PIN?
            </p>
            <p className="text-xs text-gray-500">
              Ask the event organizer for the PIN code or scan the QR code displayed on the projector screen
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
