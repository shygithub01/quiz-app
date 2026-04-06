// Live Event Service Layer
// Handles all Firebase Realtime Database operations for Live Event Mode

import { 
  ref, 
  set, 
  get, 
  update, 
  remove,
  onValue,
  off,
  serverTimestamp,
  DatabaseReference
} from 'firebase/database';
import { realtimeDb } from '../components/ui/firebase';
import { 
  LiveEvent, 
  LiveEventSettings, 
  GuestParticipant, 
  ParticipantAnswer, 
  LeaderboardEntry 
} from '../types/liveEvent';

// ===== ID GENERATION FUNCTIONS =====

/**
 * Generate a unique 6-digit PIN code
 * Format: 6 digits (100000-999999)
 */
export function generatePIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a unique session ID for a participant
 * Format: timestamp + random string
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${randomStr}`;
}

/**
 * Generate a unique event ID
 * Format: evt_ + timestamp + random string
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `evt_${timestamp}_${randomStr}`;
}

// ===== VALIDATION UTILITIES =====

/**
 * Validate guest name length (2-50 characters)
 */
export function validateNameLength(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

/**
 * Validate PIN format (exactly 6 digits)
 */
export function validatePINFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Validate timer duration (15-120 seconds)
 */
export function validateTimerDuration(duration: number): boolean {
  return duration >= 15 && duration <= 120;
}

/**
 * Validate participant count (1-100)
 */
export function validateParticipantCount(count: number): boolean {
  return count >= 1 && count <= 100;
}

/**
 * Validate name uniqueness within an event
 */
export async function validateNameUniqueness(
  eventId: string, 
  name: string
): Promise<boolean> {
  try {
    const participantsRef = ref(realtimeDb, `eventParticipants/${eventId}`);
    const snapshot = await get(participantsRef);
    
    if (!snapshot.exists()) {
      return true; // No participants yet, name is unique
    }
    
    const participants = snapshot.val();
    const names = Object.values(participants).map((p: any) => p.name.toLowerCase());
    return !names.includes(name.toLowerCase());
  } catch (error) {
    console.error('Error validating name uniqueness:', error);
    throw error;
  }
}

// ===== EVENT CRUD OPERATIONS =====

/**
 * Create a new live event
 */
export async function createLiveEvent(
  competitionId: string,
  settings: LiveEventSettings,
  maxParticipants: number = 50
): Promise<{ eventId: string; pin: string }> {
  try {
    const eventId = generateEventId();
    const pin = generatePIN();
    
    // Check for existing active events (single event constraint)
    const hasActiveEvent = await checkActiveEvents();
    if (hasActiveEvent) {
      throw new Error('An active event already exists. Please end it before creating a new one.');
    }
    
    const eventData: Omit<LiveEvent, 'id'> = {
      competitionId,
      pin,
      status: 'lobby',
      phase: 'lobby',
      currentQuestionIndex: 0,
      timerStartedAt: null,
      timerDuration: settings.questionTimer,
      pausedAt: null,
      pausedDuration: 0,
      maxParticipants,
      settings,
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null
    };
    
    await set(ref(realtimeDb, `liveEvents/${eventId}`), eventData);
    
    console.log('✅ Live event created:', eventId, 'PIN:', pin);
    return { eventId, pin };
  } catch (error) {
    console.error('❌ Error creating live event:', error);
    throw error;
  }
}

/**
 * Check if there are any active events
 */
export async function checkActiveEvents(): Promise<boolean> {
  try {
    const eventsRef = ref(realtimeDb, 'liveEvents');
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    const events = snapshot.val();
    const activeEvents = Object.values(events).filter(
      (event: any) => event.status === 'lobby' || event.status === 'active' || event.status === 'paused'
    );
    
    return activeEvents.length > 0;
  } catch (error) {
    console.error('Error checking active events:', error);
    return false;
  }
}

/**
 * Get event by PIN
 */
export async function getEventByPIN(pin: string): Promise<LiveEvent | null> {
  try {
    const eventsRef = ref(realtimeDb, 'liveEvents');
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const events = snapshot.val();
    const eventEntry = Object.entries(events).find(
      ([_, event]: [string, any]) => event.pin === pin
    );
    
    if (!eventEntry) {
      return null;
    }
    
    const [eventId, eventData] = eventEntry;
    return { id: eventId, ...eventData } as LiveEvent;
  } catch (error) {
    console.error('Error getting event by PIN:', error);
    throw error;
  }
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<LiveEvent | null> {
  try {
    const eventRef = ref(realtimeDb, `liveEvents/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return { id: eventId, ...snapshot.val() } as LiveEvent;
  } catch (error) {
    console.error('Error getting event by ID:', error);
    throw error;
  }
}

/**
 * Update event data
 */
export async function updateEvent(
  eventId: string, 
  updates: Partial<LiveEvent>
): Promise<void> {
  try {
    const eventRef = ref(realtimeDb, `liveEvents/${eventId}`);
    await update(eventRef, updates);
    console.log('✅ Event updated:', eventId);
  } catch (error) {
    console.error('❌ Error updating event:', error);
    throw error;
  }
}

/**
 * Delete event and all related data
 */
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    // Delete event
    await remove(ref(realtimeDb, `liveEvents/${eventId}`));
    
    // Delete participants
    await remove(ref(realtimeDb, `eventParticipants/${eventId}`));
    
    // Delete answers
    await remove(ref(realtimeDb, `eventAnswers/${eventId}`));
    
    // Delete leaderboard
    await remove(ref(realtimeDb, `eventLeaderboard/${eventId}`));
    
    console.log('✅ Event and related data deleted:', eventId);
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    throw error;
  }
}

// ===== PARTICIPANT OPERATIONS =====

/**
 * Add participant to event
 */
export async function joinEvent(
  eventId: string, 
  name: string
): Promise<string> {
  try {
    // Validate name length
    if (!validateNameLength(name)) {
      throw new Error('Name must be between 2 and 50 characters');
    }
    
    // Check event exists and is in lobby phase
    const event = await getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    if (event.phase !== 'lobby') {
      throw new Error('Event has already started');
    }
    
    // Check participant limit
    const participantCount = await getParticipantCount(eventId);
    if (participantCount >= event.maxParticipants) {
      throw new Error('Event is full');
    }
    
    // Check name uniqueness
    const isUnique = await validateNameUniqueness(eventId, name);
    if (!isUnique) {
      throw new Error('Name is already taken');
    }
    
    // Create session
    const sessionId = generateSessionId();
    const participantData: GuestParticipant = {
      sessionId,
      name: name.trim(),
      joinedAt: Date.now(),
      isActive: true,
      lastSeen: Date.now()
    };
    
    await set(
      ref(realtimeDb, `eventParticipants/${eventId}/${sessionId}`),
      participantData
    );
    
    console.log('✅ Participant joined:', sessionId, name);
    return sessionId;
  } catch (error) {
    console.error('❌ Error joining event:', error);
    throw error;
  }
}

/**
 * Update participant heartbeat
 */
export async function updateHeartbeat(
  eventId: string, 
  sessionId: string
): Promise<void> {
  try {
    await update(
      ref(realtimeDb, `eventParticipants/${eventId}/${sessionId}`),
      { lastSeen: Date.now() }
    );
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    // Don't throw - heartbeat failures shouldn't break the app
  }
}

/**
 * Remove participant from event
 */
export async function removeParticipant(
  eventId: string, 
  sessionId: string
): Promise<void> {
  try {
    await remove(ref(realtimeDb, `eventParticipants/${eventId}/${sessionId}`));
    console.log('✅ Participant removed:', sessionId);
  } catch (error) {
    console.error('❌ Error removing participant:', error);
    throw error;
  }
}

/**
 * Get participant count
 */
export async function getParticipantCount(eventId: string): Promise<number> {
  try {
    const participantsRef = ref(realtimeDb, `eventParticipants/${eventId}`);
    const snapshot = await get(participantsRef);
    
    if (!snapshot.exists()) {
      return 0;
    }
    
    return Object.keys(snapshot.val()).length;
  } catch (error) {
    console.error('Error getting participant count:', error);
    return 0;
  }
}

/**
 * Get all participants
 */
export async function getParticipants(eventId: string): Promise<GuestParticipant[]> {
  try {
    const participantsRef = ref(realtimeDb, `eventParticipants/${eventId}`);
    const snapshot = await get(participantsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const participants = snapshot.val();
    return Object.values(participants) as GuestParticipant[];
  } catch (error) {
    console.error('Error getting participants:', error);
    return [];
  }
}

// ===== ANSWER OPERATIONS =====

/**
 * Submit participant answer
 */
export async function submitAnswer(
  eventId: string,
  sessionId: string,
  questionIndex: number,
  answer: string,
  timeToAnswer: number
): Promise<void> {
  try {
    // Check if answer already exists (immutability)
    const existingAnswerRef = ref(
      realtimeDb, 
      `eventAnswers/${eventId}/${sessionId}/${questionIndex}`
    );
    const existingSnapshot = await get(existingAnswerRef);
    
    if (existingSnapshot.exists()) {
      throw new Error('Answer already submitted for this question');
    }
    
    const answerData: ParticipantAnswer = {
      answer,
      timestamp: Date.now(),
      timeToAnswer
    };
    
    await set(existingAnswerRef, answerData);
    console.log('✅ Answer submitted:', sessionId, questionIndex);
  } catch (error) {
    console.error('❌ Error submitting answer:', error);
    throw error;
  }
}

/**
 * Get all answers for a question
 */
export async function getQuestionAnswers(
  eventId: string,
  questionIndex: number
): Promise<Record<string, ParticipantAnswer>> {
  try {
    const answersRef = ref(realtimeDb, `eventAnswers/${eventId}`);
    const snapshot = await get(answersRef);
    
    if (!snapshot.exists()) {
      return {};
    }
    
    const allAnswers = snapshot.val();
    const questionAnswers: Record<string, ParticipantAnswer> = {};
    
    Object.entries(allAnswers).forEach(([sessionId, sessionAnswers]: [string, any]) => {
      if (sessionAnswers[questionIndex]) {
        questionAnswers[sessionId] = sessionAnswers[questionIndex];
      }
    });
    
    return questionAnswers;
  } catch (error) {
    console.error('Error getting question answers:', error);
    return {};
  }
}

/**
 * Get answer count for current question
 */
export async function getAnswerCount(
  eventId: string,
  questionIndex: number
): Promise<number> {
  try {
    const answers = await getQuestionAnswers(eventId, questionIndex);
    return Object.keys(answers).length;
  } catch (error) {
    console.error('Error getting answer count:', error);
    return 0;
  }
}

// ===== LEADERBOARD OPERATIONS =====

/**
 * Update leaderboard entry
 */
export async function updateLeaderboard(
  eventId: string,
  sessionId: string,
  entry: LeaderboardEntry
): Promise<void> {
  try {
    await set(
      ref(realtimeDb, `eventLeaderboard/${eventId}/${sessionId}`),
      entry
    );
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
  try {
    const leaderboardRef = ref(realtimeDb, `eventLeaderboard/${eventId}`);
    const snapshot = await get(leaderboardRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const entries = Object.values(snapshot.val()) as LeaderboardEntry[];
    return entries.sort((a, b) => a.rank - b.rank);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// ===== REALTIME LISTENERS =====

/**
 * Listen to event changes
 */
export function listenToEvent(
  eventId: string,
  callback: (event: LiveEvent | null) => void
): () => void {
  const eventRef = ref(realtimeDb, `liveEvents/${eventId}`);
  
  const unsubscribe = onValue(eventRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: eventId, ...snapshot.val() } as LiveEvent);
    } else {
      callback(null);
    }
  });
  
  // Return cleanup function
  return () => off(eventRef);
}

/**
 * Listen to participants changes
 */
export function listenToParticipants(
  eventId: string,
  callback: (participants: GuestParticipant[]) => void
): () => void {
  const participantsRef = ref(realtimeDb, `eventParticipants/${eventId}`);
  
  const unsubscribe = onValue(participantsRef, (snapshot) => {
    if (snapshot.exists()) {
      const participants = Object.values(snapshot.val()) as GuestParticipant[];
      callback(participants);
    } else {
      callback([]);
    }
  });
  
  return () => off(participantsRef);
}

/**
 * Listen to leaderboard changes
 */
export function listenToLeaderboard(
  eventId: string,
  callback: (leaderboard: LeaderboardEntry[]) => void
): () => void {
  const leaderboardRef = ref(realtimeDb, `eventLeaderboard/${eventId}`);
  
  const unsubscribe = onValue(leaderboardRef, (snapshot) => {
    if (snapshot.exists()) {
      const entries = Object.values(snapshot.val()) as LeaderboardEntry[];
      const sorted = entries.sort((a, b) => a.rank - b.rank);
      callback(sorted);
    } else {
      callback([]);
    }
  });
  
  return () => off(leaderboardRef);
}

/**
 * Listen to answer count for current question
 */
export function listenToAnswerCount(
  eventId: string,
  questionIndex: number,
  callback: (count: number) => void
): () => void {
  const answersRef = ref(realtimeDb, `eventAnswers/${eventId}`);
  
  const unsubscribe = onValue(answersRef, (snapshot) => {
    if (snapshot.exists()) {
      const allAnswers = snapshot.val();
      let count = 0;
      
      Object.values(allAnswers).forEach((sessionAnswers: any) => {
        if (sessionAnswers[questionIndex]) {
          count++;
        }
      });
      
      callback(count);
    } else {
      callback(0);
    }
  });
  
  return () => off(answersRef);
}
