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
  onDisconnect,
  runTransaction
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
    
    const eventData: LiveEvent = {
      id: eventId,
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
 * End all stale lobby/active/paused events so a new one can be created
 */
export async function endAllStaleEvents(): Promise<number> {
  try {
    const eventsRef = ref(realtimeDb, 'liveEvents');
    const snapshot = await get(eventsRef);
    if (!snapshot.exists()) return 0;

    const events = snapshot.val() as Record<string, any>;
    const stale = Object.entries(events).filter(
      ([, e]) => e.status === 'lobby' || e.status === 'active' || e.status === 'paused'
    );

    await Promise.all(
      stale.map(([id]) =>
        update(ref(realtimeDb, `liveEvents/${id}`), {
          status: 'completed',
          phase: 'results',
          endedAt: Date.now(),
        })
      )
    );

    return stale.length;
  } catch (error) {
    console.error('Error ending stale events:', error);
    throw error;
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
    return { id: eventId, ...(eventData as object) } as LiveEvent;
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
 * Uses aggressive deletion with retries to ensure all data is removed
 */
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    console.log('🗑️ Starting deletion for event:', eventId);
    
    const paths = [
      { name: 'liveEvents', path: `liveEvents/${eventId}` },
      { name: 'eventParticipants', path: `eventParticipants/${eventId}` },
      { name: 'eventAnswers', path: `eventAnswers/${eventId}` },
      { name: 'eventLeaderboard', path: `eventLeaderboard/${eventId}` }
    ];
    
    // Delete each path with error handling
    for (const { name, path } of paths) {
      try {
        console.log(`🗑️ Deleting ${name}...`);
        await remove(ref(realtimeDb, path));
        console.log(`✅ ${name} deleted`);
        
        // Small delay to ensure Firebase processes the deletion
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error deleting ${name}:`, error);
        // Continue with other deletions even if one fails
      }
    }
    
    // Double-check and force delete any remaining data
    console.log('🔍 Verifying deletion...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (const { name, path } of paths) {
      try {
        const snapshot = await get(ref(realtimeDb, path));
        if (snapshot.exists()) {
          console.warn(`⚠️ ${name} still exists, forcing deletion...`);
          await remove(ref(realtimeDb, path));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error verifying ${name}:`, error);
      }
    }
    
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
    
    // Atomically check + increment participant count to prevent race condition
    // when many users join simultaneously
    const counterRef = ref(realtimeDb, `liveEvents/${eventId}/participantCount`);
    const { committed } = await runTransaction(counterRef, (currentCount) => {
      const count = currentCount ?? 0;
      if (count >= event.maxParticipants) {
        return; // Abort — event is full
      }
      return count + 1;
    });

    if (!committed) {
      throw new Error('Event is full');
    }

    // Check name uniqueness
    const isUnique = await validateNameUniqueness(eventId, name);
    if (!isUnique) {
      // Roll back the counter increment since we won't actually join
      await runTransaction(counterRef, (count) => Math.max(0, (count ?? 1) - 1));
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
 * Setup automatic participant removal on disconnect (for lobby phase)
 * Uses Firebase's onDisconnect() to reliably remove participant when browser closes
 */
export async function setupParticipantDisconnectHandler(
  eventId: string,
  sessionId: string
): Promise<void> {
  try {
    const participantRef = ref(realtimeDb, `eventParticipants/${eventId}/${sessionId}`);
    
    // Set up onDisconnect handler - this will automatically execute when connection is lost
    await onDisconnect(participantRef).remove();
    
    console.log('✅ Disconnect handler set up for participant:', sessionId);
  } catch (error) {
    console.error('❌ Error setting up disconnect handler:', error);
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
 * Allows updating answer within the time limit
 */
export async function submitAnswer(
  eventId: string,
  sessionId: string,
  questionIndex: number,
  answer: string,
  timeToAnswer: number
): Promise<void> {
  try {
    const answerRef = ref(
      realtimeDb, 
      `eventAnswers/${eventId}/${sessionId}/${questionIndex}`
    );
    
    const answerData: ParticipantAnswer = {
      answer,
      timestamp: Date.now(),
      timeToAnswer
    };
    
    // Use set to allow updates (overwrites existing answer)
    await set(answerRef, answerData);
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
  
  onValue(eventRef, (snapshot) => {
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
  
  onValue(participantsRef, (snapshot) => {
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
  
  onValue(leaderboardRef, (snapshot) => {
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
  
  onValue(answersRef, (snapshot) => {
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


// ===== SCORING AND LEADERBOARD FUNCTIONS =====

/**
 * Calculate score for a participant
 * Awards 100 points for correct answers + fastest finger bonus
 */
export async function calculateScore(
  eventId: string,
  sessionId: string,
  questions: any[],
  enableFastestFingerBonus: boolean
): Promise<{ score: number; correctAnswers: number; fastestFingerBonus: number }> {
  try {
    let score = 0;
    let correctAnswers = 0;
    let fastestFingerBonus = 0;
    
    // Get all answers for this participant
    const answersRef = ref(realtimeDb, `eventAnswers/${eventId}/${sessionId}`);
    const answersSnapshot = await get(answersRef);
    
    if (!answersSnapshot.exists()) {
      return { score: 0, correctAnswers: 0, fastestFingerBonus: 0 };
    }
    
    const participantAnswers = answersSnapshot.val();
    
    // Calculate score for each question
    for (let i = 0; i < questions.length; i++) {
      const answer = participantAnswers[i];
      if (!answer) continue;
      
      const question = questions[i];
      const isCorrect = answer.answer === question.correctAnswer;
      
      if (isCorrect) {
        // Award base points
        score += 100;
        correctAnswers++;
        
        // Calculate fastest finger bonus if enabled
        if (enableFastestFingerBonus) {
          const bonus = await calculateFastestFingerBonus(eventId, i, sessionId, answer.timeToAnswer);
          score += bonus;
          fastestFingerBonus += bonus;
        }
      }
    }
    
    return { score, correctAnswers, fastestFingerBonus };
  } catch (error) {
    console.error('Error calculating score:', error);
    return { score: 0, correctAnswers: 0, fastestFingerBonus: 0 };
  }
}

/**
 * Calculate fastest finger bonus for a specific question
 * Awards 50/30/10 points for top 3 fastest correct answers
 */
async function calculateFastestFingerBonus(
  eventId: string,
  questionIndex: number,
  sessionId: string,
  _timeToAnswer: number
): Promise<number> {
  try {
    // Get all answers for this question
    const allAnswersRef = ref(realtimeDb, `eventAnswers/${eventId}`);
    const allAnswersSnapshot = await get(allAnswersRef);
    
    if (!allAnswersSnapshot.exists()) {
      return 0;
    }
    
    const allAnswers = allAnswersSnapshot.val();
    
    // Get the correct answer from the event
    const eventRef = ref(realtimeDb, `liveEvents/${eventId}`);
    const eventSnapshot = await get(eventRef);
    
    if (!eventSnapshot.exists()) {
      return 0;
    }
    
    // We'll need to get the competition to know the correct answer
    // For now, we'll collect all answers with their times
    const answerTimes: { sessionId: string; timeToAnswer: number }[] = [];
    
    Object.entries(allAnswers).forEach(([sid, sessionAnswers]: [string, any]) => {
      const answer = sessionAnswers[questionIndex];
      if (answer) {
        answerTimes.push({
          sessionId: sid,
          timeToAnswer: answer.timeToAnswer
        });
      }
    });
    
    // Sort by time (fastest first)
    answerTimes.sort((a, b) => a.timeToAnswer - b.timeToAnswer);
    
    // Find rank of this session
    const rank = answerTimes.findIndex(a => a.sessionId === sessionId);
    
    if (rank === -1) return 0;
    
    // Award bonus based on rank
    if (rank === 0) return 50; // Fastest
    if (rank === 1) return 30; // Second
    if (rank === 2) return 10; // Third
    
    return 0;
  } catch (error) {
    console.error('Error calculating fastest finger bonus:', error);
    return 0;
  }
}

/**
 * Calculate and update leaderboard for all participants
 */
export async function calculateLeaderboard(
  eventId: string,
  questions: any[],
  enableFastestFingerBonus: boolean
): Promise<void> {
  try {
    // Handle missing or invalid questions gracefully
    if (!questions || !Array.isArray(questions)) {
      console.warn('⚠️ Questions is not a valid array, using empty array');
      questions = [];
    }
    
    if (questions.length === 0) {
      console.warn('⚠️ No questions available, leaderboard will be based on participation only');
    }
    
    console.log('✅ Calculating leaderboard with', questions.length, 'questions');
    
    // Get all participants
    const participantsRef = ref(realtimeDb, `eventParticipants/${eventId}`);
    const participantsSnapshot = await get(participantsRef);
    
    if (!participantsSnapshot.exists()) {
      return;
    }
    
    const participants = participantsSnapshot.val();
    
    // Calculate scores for all participants
    const scores: Array<{
      sessionId: string;
      name: string;
      score: number;
      correctAnswers: number;
      fastestFingerBonus: number;
      totalTime: number;
    }> = [];
    
    for (const [sessionId, participant] of Object.entries(participants) as [string, any][]) {
      const { score, correctAnswers, fastestFingerBonus } = await calculateScore(
        eventId,
        sessionId,
        questions,
        enableFastestFingerBonus
      );
      
      // Calculate total time to answer (sum of timeToAnswer for all questions)
      const answersRef = ref(realtimeDb, `eventAnswers/${eventId}/${sessionId}`);
      const answersSnapshot = await get(answersRef);
      
      let totalTime = 0;
      let answeredCount = 0;
      
      if (answersSnapshot.exists()) {
        const answers = answersSnapshot.val();
        Object.values(answers).forEach((answer: any) => {
          totalTime += answer.timeToAnswer || 0;
          answeredCount++;
        });
      }
      
      // Penalize unanswered questions by adding maximum time (timerDuration) for each missed question
      const unansweredCount = questions.length - answeredCount;
      if (unansweredCount > 0) {
        // Get timer duration from event
        const eventData = await getEventById(eventId);
        const timerDuration = eventData?.timerDuration || 30;
        totalTime += unansweredCount * timerDuration;
      }
      
      console.log(`📊 ${participant.name}: score=${score}, answered=${answeredCount}/${questions.length}, totalTime=${totalTime.toFixed(2)}s`);
      
      scores.push({
        sessionId,
        name: participant.name,
        score,
        correctAnswers,
        fastestFingerBonus,
        totalTime
      });
    }
    
    // Sort by score (descending), then by total time (ascending)
    // If both score and time are equal, they share the same rank
    scores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.totalTime - b.totalTime;
    });
    
    // Assign ranks and batch-write the entire leaderboard in one atomic update.
    // This prevents the N-sequential-write race condition when 50-100 users
    // all have their scores calculated simultaneously.
    const now = Date.now();
    const leaderboardBatch: Record<string, LeaderboardEntry> = {};
    for (let i = 0; i < scores.length; i++) {
      const entry = scores[i];
      leaderboardBatch[entry.sessionId] = {
        sessionId: entry.sessionId,
        name: entry.name,
        score: entry.score,
        correctAnswers: entry.correctAnswers,
        fastestFingerBonus: entry.fastestFingerBonus,
        rank: i + 1,
        totalTime: entry.totalTime,
        lastUpdated: now
      };
    }
    await update(ref(realtimeDb, `eventLeaderboard/${eventId}`), leaderboardBatch);
    
    console.log('✅ Leaderboard calculated and updated for', scores.length, 'participants');
  } catch (error) {
    console.error('❌ Error calculating leaderboard:', error);
    throw error;
  }
}

/**
 * Get remaining time for current question
 * Handles pause/resume logic
 */
export function getRemainingTime(event: LiveEvent): number {
  if (!event.timerStartedAt) return event.timerDuration;
  
  if (event.status === 'paused' && event.pausedAt) {
    const elapsed = event.pausedAt - event.timerStartedAt - event.pausedDuration;
    return Math.max(0, event.timerDuration - elapsed / 1000);
  }
  
  const now = Date.now();
  const elapsed = now - event.timerStartedAt - event.pausedDuration;
  return Math.max(0, event.timerDuration - elapsed / 1000);
}

/**
 * Auto-advance to next question or leaderboard after timer expires
 */
export async function autoAdvanceQuestion(
  eventId: string,
  event: LiveEvent,
  totalQuestions: number
): Promise<void> {
  try {
    const remainingTime = getRemainingTime(event);
    
    if (remainingTime > 0) return; // Timer not expired yet
    
    // Wait 3 seconds before advancing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're on the last question
    if (event.currentQuestionIndex >= totalQuestions - 1) {
      // Move to results
      await updateEvent(eventId, {
        phase: 'results',
        status: 'completed',
        endedAt: Date.now()
      });
    } else {
      // Move to leaderboard phase
      await updateEvent(eventId, {
        phase: 'leaderboard'
      });
      
      // After 4 seconds, move to next question
      setTimeout(async () => {
        await updateEvent(eventId, {
          phase: 'question',
          currentQuestionIndex: event.currentQuestionIndex + 1,
          timerStartedAt: Date.now(),
          pausedDuration: 0,
          pausedAt: null
        });
      }, 4000);
    }
  } catch (error) {
    console.error('Error auto-advancing question:', error);
  }
}


// ===== DATA ARCHIVAL AND CLEANUP FUNCTIONS =====

/**
 * Archive event results to Firestore and delete guest data from Realtime DB
 */
export async function archiveAndCleanupEvent(eventId: string): Promise<void> {
  try {
    console.log('📦 Archiving event:', eventId);
    
    // Get event data
    const event = await getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Get competition data
    const { getCompetitionById } = await import('../components/ui/firebase');
    const competition = await getCompetitionById(event.competitionId);
    if (!competition) {
      throw new Error('Competition not found');
    }
    
    // Get all participants
    const participants = await getParticipants(eventId);
    
    // Get leaderboard
    const leaderboard = await getLeaderboard(eventId);
    
    // Get all answers
    const answersRef = ref(realtimeDb, `eventAnswers/${eventId}`);
    const answersSnapshot = await get(answersRef);
    const allAnswers = answersSnapshot.exists() ? answersSnapshot.val() : {};
    
    // Build results array
    const results = leaderboard.map(entry => {
      const participantAnswers = allAnswers[entry.sessionId] || {};
      const answerDetails: Record<number, {
        answer: string;
        correct: boolean;
        timeToAnswer: number;
      }> = {};
      
      // Process each answer
      Object.entries(participantAnswers).forEach(([qIndex, answerData]: [string, any]) => {
        const questionIndex = parseInt(qIndex);
        const question = competition.questions[questionIndex];
        
        answerDetails[questionIndex] = {
          answer: answerData.answer,
          correct: answerData.answer === question.correctAnswer,
          timeToAnswer: answerData.timeToAnswer
        };
      });
      
      return {
        sessionId: entry.sessionId,
        name: entry.name,
        score: entry.score,
        rank: entry.rank,
        correctAnswers: entry.correctAnswers,
        fastestFingerBonus: entry.fastestFingerBonus,
        answers: answerDetails
      };
    });
    
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Save to Firestore
    const { db } = await import('../components/ui/firebase');
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    const archiveData = {
      eventId,
      competitionId: event.competitionId,
      competitionTitle: competition.title,
      pin: event.pin,
      startedAt: Timestamp.fromMillis(event.startedAt || event.createdAt),
      endedAt: Timestamp.fromMillis(event.endedAt || Date.now()),
      participantCount: participants.length,
      results,
      expiresAt: Timestamp.fromDate(expiresAt),
      archivedAt: Timestamp.now()
    };
    
    await addDoc(collection(db, 'liveEventArchive'), archiveData);
    console.log('✅ Event archived to Firestore');
    
    // Schedule cleanup after 60 seconds
    setTimeout(async () => {
      await deleteEvent(eventId);
      console.log('✅ Guest data deleted from Realtime DB');
    }, 60000);
    
  } catch (error) {
    console.error('❌ Error archiving event:', error);
    throw error;
  }
}

/**
 * Cleanup expired archives (called by scheduled job)
 */
export async function cleanupExpiredArchives(): Promise<void> {
  try {
    console.log('🧹 Cleaning up expired archives...');
    
    const { db } = await import('../components/ui/firebase');
    const { collection, query, where, getDocs, deleteDoc, Timestamp } = await import('firebase/firestore');
    
    const archivesRef = collection(db, 'liveEventArchive');
    const now = Timestamp.now();
    const q = query(archivesRef, where('expiresAt', '<=', now));
    
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted ${snapshot.docs.length} expired archives`);
  } catch (error) {
    console.error('❌ Error cleaning up archives:', error);
    throw error;
  }
}

/**
 * Log anonymous event statistics (no PII)
 */
export async function logEventStatistics(eventId: string): Promise<void> {
  try {
    console.log('📊 Logging event statistics:', eventId);
    
    const event = await getEventById(eventId);
    if (!event) return;
    
    const participants = await getParticipants(eventId);
    const leaderboard = await getLeaderboard(eventId);
    
    // Calculate statistics
    const duration = event.endedAt && event.startedAt 
      ? (event.endedAt - event.startedAt) / 1000 / 60 // minutes
      : 0;
    
    const scores = leaderboard.map(e => e.score);
    const avgScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;
    
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    
    // Save anonymous statistics
    const { db } = await import('../components/ui/firebase');
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    await addDoc(collection(db, 'liveEventStatistics'), {
      eventId, // Event ID only, no participant names
      competitionId: event.competitionId,
      participantCount: participants.length,
      durationMinutes: Math.round(duration),
      averageScore: Math.round(avgScore),
      maxScore,
      minScore,
      questionCount: event.currentQuestionIndex + 1,
      fastestFingerEnabled: event.settings.enableFastestFingerBonus,
      timestamp: Timestamp.now()
    });
    
    console.log('✅ Event statistics logged (no PII)');
  } catch (error) {
    console.error('❌ Error logging statistics:', error);
    // Don't throw - statistics logging shouldn't break the flow
  }
}

/**
 * Reset all participant answers and scores for an event
 * Used when resetting an event back to lobby
 */
export async function resetParticipantAnswers(eventId: string): Promise<void> {
  try {
    console.log('🔄 Resetting participant answers for event:', eventId);
    
    const answersRef = ref(realtimeDb, `eventAnswers/${eventId}`);
    const leaderboardRef = ref(realtimeDb, `eventLeaderboard/${eventId}`);
    
    // Clear all answers
    await remove(answersRef);
    
    // Clear leaderboard
    await remove(leaderboardRef);
    
    console.log('✅ Participant answers and scores reset');
  } catch (error) {
    console.error('❌ Error resetting participant answers:', error);
    throw error;
  }
}

/**
 * Reactivate all participants (set isActive to true)
 * Used to fix database corruption issues
 */
export async function reactivateAllParticipants(eventId: string): Promise<void> {
  try {
    console.log('🔄 Reactivating all participants for event:', eventId);
    
    const participantsRef = ref(realtimeDb, `eventParticipants/${eventId}`);
    const snapshot = await get(participantsRef);
    
    if (!snapshot.exists()) {
      console.log('No participants to reactivate');
      return;
    }
    
    const participants = snapshot.val();
    const updates: Record<string, any> = {};
    
    // Set all participants to active
    Object.keys(participants).forEach(sessionId => {
      updates[`${sessionId}/isActive`] = true;
    });
    
    await update(participantsRef, updates);
    
    console.log('✅ All participants reactivated');
  } catch (error) {
    console.error('❌ Error reactivating participants:', error);
    throw error;
  }
}
