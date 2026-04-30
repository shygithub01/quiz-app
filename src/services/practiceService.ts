// Practice Live Mode Service Layer
// Handles all Firebase Realtime Database operations for Practice Live Mode

import { 
  ref, 
  set, 
  get, 
  update, 
  remove,
  onValue,
  off,
  push,
  onDisconnect
} from 'firebase/database';
import { realtimeDb } from '../components/ui/firebase';
import { 
  PracticeSession,
  PracticeSettings,
  PracticeAttempt,
  LeaderboardEntry,
  PracticeAnalytics
} from '../types/practiceMode';

// Reuse utility functions from liveEventService
import { generatePIN, generateEventId, validateNameLength } from './liveEventService';

// ===== SESSION CRUD OPERATIONS =====

/**
 * Create a new practice session
 */
export async function createPracticeSession(
  competitionId: string,
  title: string,
  description: string,
  settings: PracticeSettings,
  createdBy: string,
  endDate: number | null,
  startDate?: number,
  isDaily?: boolean
): Promise<{ sessionId: string; pin: string }> {
  try {
    const sessionId = generateEventId();
    const pin = generatePIN();

    const activeSessionCount = await getActiveSessionCount(createdBy);
    if (activeSessionCount >= 5) {
      throw new Error('Maximum of 5 active sessions reached. Please end an existing session first.');
    }

    const sessionData: PracticeSession = {
      id: sessionId,
      competitionId,
      pin,
      status: 'active',
      title,
      description,
      createdBy,
      createdAt: Date.now(),
      ...(startDate ? { startDate } : {}),
      ...(isDaily ? { isDaily: true } : {}),
      endDate,
      settings,
      statistics: {
        totalStudents: 0,
        totalAttempts: 0,
        averageScore: 0
      }
    };

    await set(ref(realtimeDb, `practiceSessions/${sessionId}`), sessionData);
    return { sessionId, pin };
  } catch (error) {
    console.error('❌ Error creating practice session:', error);
    throw error;
  }
}

export async function getActivePracticeSessions(): Promise<PracticeSession[]> {
  try {
    const snapshot = await get(ref(realtimeDb, 'practiceSessions'));
    if (!snapshot.exists()) return [];
    const now = Date.now();
    return Object.entries(snapshot.val())
      .map(([id, data]: [string, any]) => ({ id, ...data } as PracticeSession))
      .filter(s =>
        s.status === 'active' &&
        !s.isDaily &&
        (!s.startDate || s.startDate <= now) &&
        (s.endDate === null || s.endDate === 0 || s.endDate > now)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getDailySession(): Promise<PracticeSession | null> {
  try {
    const snapshot = await get(ref(realtimeDb, 'practiceSessions'));
    if (!snapshot.exists()) return null;
    const now = Date.now();
    const sessions = Object.entries(snapshot.val())
      .map(([id, data]: [string, any]) => ({ id, ...data } as PracticeSession))
      .filter(s =>
        s.isDaily &&
        s.status === 'active' &&
        (!s.startDate || s.startDate <= now) &&
        (s.endDate === null || s.endDate === 0 || s.endDate > now)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
    return sessions[0] ?? null;
  } catch {
    return null;
  }
}

export async function getActivePracticeSessionForCompetition(competitionId: string): Promise<PracticeSession | null> {
  try {
    const snapshot = await get(ref(realtimeDb, 'practiceSessions'));
    if (!snapshot.exists()) return null;
    const sessions = snapshot.val();
    const entry = Object.entries(sessions).find(([_, s]: [string, any]) =>
      (s as any).competitionId === competitionId && (s as any).status === 'active'
    );
    if (!entry) return null;
    const [id, data] = entry;
    return { id, ...(data as object) } as PracticeSession;
  } catch {
    return null;
  }
}

/**
 * Get active session count for a teacher
 */
export async function getActiveSessionCount(teacherId: string): Promise<number> {
  try {
    const sessionsRef = ref(realtimeDb, 'practiceSessions');
    const snapshot = await get(sessionsRef);
    
    if (!snapshot.exists()) {
      return 0;
    }
    
    const now = Date.now();
    const sessions = snapshot.val();
    const activeSessions = Object.values(sessions).filter(
      (session: any) =>
        session.createdBy === teacherId &&
        session.status === 'active' &&
        (session.endDate === null || session.endDate === 0 || session.endDate === undefined || session.endDate > now)
    );

    return activeSessions.length;
  } catch (error) {
    console.error('Error getting active session count:', error);
    return 0;
  }
}

/**
 * Get session by PIN
 */
export async function getSessionByPIN(pin: string): Promise<PracticeSession | null> {
  try {
    const sessionsRef = ref(realtimeDb, 'practiceSessions');
    const snapshot = await get(sessionsRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const sessions = snapshot.val();
    const sessionEntry = Object.entries(sessions).find(
      ([_, session]: [string, any]) => session.pin === pin
    );
    
    if (!sessionEntry) {
      return null;
    }
    
    const [sessionId, sessionData] = sessionEntry;
    return { id: sessionId, ...(sessionData as object) } as PracticeSession;
  } catch (error) {
    console.error('Error getting session by PIN:', error);
    throw error;
  }
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<PracticeSession | null> {
  try {
    const sessionRef = ref(realtimeDb, `practiceSessions/${sessionId}`);
    const snapshot = await get(sessionRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return { id: sessionId, ...snapshot.val() } as PracticeSession;
  } catch (error) {
    console.error('Error getting session by ID:', error);
    throw error;
  }
}

/**
 * Update session data
 */
export async function updateSession(
  sessionId: string, 
  updates: Partial<PracticeSession>
): Promise<void> {
  try {
    const sessionRef = ref(realtimeDb, `practiceSessions/${sessionId}`);
    await update(sessionRef, updates);
    console.log('✅ Session updated:', sessionId);
  } catch (error) {
    console.error('❌ Error updating session:', error);
    throw error;
  }
}

/**
 * End a practice session
 */
export async function endPracticeSession(sessionId: string): Promise<void> {
  try {
    await updateSession(sessionId, {
      status: 'ended',
      endDate: Date.now()
    });
    
    console.log('✅ Practice session ended:', sessionId);
    
    // Note: Archiving to Firestore is disabled for now due to permissions
    // Will be enabled in a future update when Firestore rules are configured
  } catch (error) {
    console.error('❌ Error ending practice session:', error);
    throw error;
  }
}

// ===== JOIN OPERATIONS =====

/**
 * Validate and join a practice session
 * Note: This only validates - name is stored in localStorage, not database
 */
export async function joinPracticeSession(
  sessionId: string,
  studentName: string
): Promise<void> {
  try {
    // Validate name length
    if (!validateNameLength(studentName)) {
      throw new Error('Name must be between 2 and 50 characters');
    }
    
    // Check session exists and is active
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.status !== 'active') {
      throw new Error('This practice session has ended. No new attempts allowed.');
    }
    
    // Check if session has reached end date
    if (session.endDate && Date.now() > session.endDate) {
      throw new Error('This practice session has expired.');
    }
    
    console.log('✅ Validation passed for:', studentName);
    // Name will be stored in localStorage by the component
  } catch (error) {
    console.error('❌ Error joining practice session:', error);
    throw error;
  }
}

/**
 * Setup automatic participant removal on disconnect
 * Uses Firebase's onDisconnect() to reliably remove participant when browser closes
 */
export async function setupParticipantDisconnectHandler(
  sessionId: string,
  participantId: string
): Promise<void> {
  try {
    const participantRef = ref(realtimeDb, `practiceParticipants/${sessionId}/${participantId}`);
    
    // Set up onDisconnect handler - this will automatically execute when connection is lost
    await onDisconnect(participantRef).remove();
    
    console.log('✅ Disconnect handler set up for participant:', participantId);
  } catch (error) {
    console.error('❌ Error setting up disconnect handler:', error);
    throw error;
  }
}

/**
 * Add participant to active participants list
 */
export async function addParticipant(
  sessionId: string,
  participantId: string,
  studentName: string
): Promise<void> {
  try {
    const participantRef = ref(realtimeDb, `practiceParticipants/${sessionId}/${participantId}`);
    
    await set(participantRef, {
      id: participantId,
      name: studentName,
      joinedAt: Date.now(),
      status: 'active'
    });
    
    // Set up automatic removal on disconnect
    await setupParticipantDisconnectHandler(sessionId, participantId);
    
    console.log('✅ Participant added:', studentName);
  } catch (error) {
    console.error('❌ Error adding participant:', error);
    throw error;
  }
}

/**
 * Remove participant from active participants list
 */
export async function removeParticipant(
  sessionId: string,
  participantId: string
): Promise<void> {
  try {
    const participantRef = ref(realtimeDb, `practiceParticipants/${sessionId}/${participantId}`);
    await remove(participantRef);
    console.log('✅ Participant removed:', participantId);
  } catch (error) {
    console.error('❌ Error removing participant:', error);
    throw error;
  }
}

/**
 * Listen to active participants
 */
export function listenToParticipants(
  sessionId: string,
  callback: (participants: any[]) => void
): () => void {
  const participantsRef = ref(realtimeDb, `practiceParticipants/${sessionId}`);
  
  onValue(participantsRef, (snapshot) => {
    if (snapshot.exists()) {
      const participants = Object.values(snapshot.val());
      callback(participants);
    } else {
      callback([]);
    }
  });
  
  return () => off(participantsRef);
}

// ===== ATTEMPT OPERATIONS =====

/**
 * Submit a practice attempt
 */
export async function submitAttempt(
  sessionId: string,
  studentName: string,
  answers: Record<number, string>,
  questions: any[],
  startedAt?: number
): Promise<{ attemptId: string; score: number }> {
  try {
    // Calculate score
    let correctAnswers = 0;
    const attemptAnswers: Record<number, any> = {};
    
    Object.entries(answers).forEach(([qIndex, answer]) => {
      const questionIndex = parseInt(qIndex);
      const question = questions[questionIndex];
      const isCorrect = answer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      attemptAnswers[questionIndex] = {
        selectedAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    // Create attempt record
    const attemptRef = push(ref(realtimeDb, `practiceAttempts/${sessionId}`));
    const attemptId = attemptRef.key!;
    
    const completedAt = Date.now();
    const resolvedStartedAt = startedAt ?? completedAt - 60000;
    const duration = completedAt - resolvedStartedAt; // milliseconds

    const attemptData: PracticeAttempt = {
      id: attemptId,
      sessionId,
      studentName,
      score,
      correctAnswers,
      totalQuestions: questions.length,
      startedAt: resolvedStartedAt,
      completedAt,
      answers: attemptAnswers
    };

    await set(attemptRef, attemptData);

    // Update leaderboard
    await updateLeaderboardEntry(sessionId, studentName, score, completedAt, duration);
    
    // Update session statistics
    await updateSessionStatistics(sessionId);
    
    console.log('✅ Attempt submitted:', attemptId, 'Score:', score);
    return { attemptId, score };
  } catch (error) {
    console.error('❌ Error submitting attempt:', error);
    throw error;
  }
}

/**
 * Get all attempts for a student
 */
export async function getStudentAttempts(
  sessionId: string,
  studentName: string
): Promise<PracticeAttempt[]> {
  try {
    const attemptsRef = ref(realtimeDb, `practiceAttempts/${sessionId}`);
    const snapshot = await get(attemptsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allAttempts = snapshot.val();
    const studentAttempts = Object.values(allAttempts)
      .filter((attempt: any) => attempt.studentName === studentName)
      .sort((a: any, b: any) => a.completedAt - b.completedAt);
    
    return studentAttempts as PracticeAttempt[];
  } catch (error) {
    console.error('Error getting student attempts:', error);
    return [];
  }
}

/**
 * Get attempt by ID
 */
export async function getAttemptById(
  sessionId: string,
  attemptId: string
): Promise<PracticeAttempt | null> {
  try {
    const attemptRef = ref(realtimeDb, `practiceAttempts/${sessionId}/${attemptId}`);
    const snapshot = await get(attemptRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return { id: attemptId, ...snapshot.val() } as PracticeAttempt;
  } catch (error) {
    console.error('Error getting attempt by ID:', error);
    return null;
  }
}

// ===== LEADERBOARD OPERATIONS =====

/**
 * Update leaderboard entry for a student
 */
export async function updateLeaderboardEntry(
  sessionId: string,
  studentName: string,
  newScore: number,
  attemptDate: number,
  duration?: number
): Promise<void> {
  try {
    const leaderboardRef = ref(realtimeDb, `practiceLeaderboard/${sessionId}/${studentName}`);
    const snapshot = await get(leaderboardRef);
    
    if (snapshot.exists()) {
      // Update existing entry
      const entry = snapshot.val();
      const attempts = await getStudentAttempts(sessionId, studentName);
      const firstScore = attempts.length > 0 ? attempts[0].score : newScore;
      const improvement = calculateImprovement(firstScore, Math.max(entry.bestScore, newScore));
      
      await update(leaderboardRef, {
        bestScore: Math.max(entry.bestScore, newScore),
        worstScore: Math.min(entry.worstScore || newScore, newScore),
        lastScore: newScore,
        attemptCount: entry.attemptCount + 1,
        lastAttemptDate: attemptDate,
        improvement,
        ...(duration !== undefined && { lastDuration: duration })
      });
    } else {
      // Create new entry
      const entryData: LeaderboardEntry = {
        name: studentName,
        bestScore: newScore,
        worstScore: newScore,
        lastScore: newScore,
        attemptCount: 1,
        firstAttemptDate: attemptDate,
        lastAttemptDate: attemptDate,
        improvement: 0,
        rank: 0, // Will be calculated
        ...(duration !== undefined && { lastDuration: duration })
      };
      
      await set(leaderboardRef, entryData);
    }
    
    // Recalculate all ranks
    await recalculateRanks(sessionId);
    
    console.log('✅ Leaderboard updated for:', studentName);
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
    throw error;
  }
}

/**
 * Recalculate ranks for all leaderboard entries
 */
async function recalculateRanks(sessionId: string): Promise<void> {
  try {
    const leaderboardRef = ref(realtimeDb, `practiceLeaderboard/${sessionId}`);
    const snapshot = await get(leaderboardRef);
    
    if (!snapshot.exists()) {
      return;
    }
    
    const entries = Object.entries(snapshot.val()).map(([name, data]: [string, any]) => ({
      name,
      ...data
    }));
    
    // Sort by bestScore (desc), then attemptCount (asc), then firstAttemptDate (asc)
    entries.sort((a, b) => {
      if (b.bestScore !== a.bestScore) {
        return b.bestScore - a.bestScore;
      }
      if (a.attemptCount !== b.attemptCount) {
        return a.attemptCount - b.attemptCount;
      }
      return a.firstAttemptDate - b.firstAttemptDate;
    });
    
    // Update ranks
    const updates: Record<string, any> = {};
    entries.forEach((entry, index) => {
      updates[`${entry.name}/rank`] = index + 1;
    });
    
    await update(leaderboardRef, updates);
  } catch (error) {
    console.error('Error recalculating ranks:', error);
    throw error;
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
  try {
    const leaderboardRef = ref(realtimeDb, `practiceLeaderboard/${sessionId}`);
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

// ===== CALCULATION FUNCTIONS =====

/**
 * Calculate improvement percentage
 */
export function calculateImprovement(firstScore: number, bestScore: number): number {
  if (firstScore === 0) {
    return 0;
  }
  
  const improvement = ((bestScore - firstScore) / firstScore) * 100;
  return Math.round(improvement * 10) / 10; // Round to 1 decimal place
}

/**
 * Update session statistics
 */
async function updateSessionStatistics(sessionId: string): Promise<void> {
  try {
    const attemptsRef = ref(realtimeDb, `practiceAttempts/${sessionId}`);
    const snapshot = await get(attemptsRef);
    
    if (!snapshot.exists()) {
      return;
    }
    
    const attempts = Object.values(snapshot.val()) as PracticeAttempt[];
    const uniqueStudents = new Set(attempts.map(a => a.studentName));
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    
    await updateSession(sessionId, {
      statistics: {
        totalStudents: uniqueStudents.size,
        totalAttempts: attempts.length,
        averageScore: Math.round(totalScore / attempts.length)
      }
    });
  } catch (error) {
    console.error('Error updating session statistics:', error);
  }
}

// ===== ANALYTICS FUNCTIONS =====

/**
 * Calculate practice analytics
 */
export async function calculatePracticeAnalytics(
  sessionId: string
): Promise<PracticeAnalytics> {
  try {
    const attemptsRef = ref(realtimeDb, `practiceAttempts/${sessionId}`);
    const snapshot = await get(attemptsRef);
    
    if (!snapshot.exists()) {
      return {
        totalStudents: 0,
        totalAttempts: 0,
        averageScore: 0,
        averageAttempts: 0,
        mostMissedQuestions: [],
        scoreDistribution: [],
        improvementRate: 0
      };
    }
    
    const attempts = Object.values(snapshot.val()) as PracticeAttempt[];
    const uniqueStudents = new Set(attempts.map(a => a.studentName));
    
    // Calculate score distribution
    const scoreRanges = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 }
    ];
    
    attempts.forEach(attempt => {
      if (attempt.score <= 20) scoreRanges[0].count++;
      else if (attempt.score <= 40) scoreRanges[1].count++;
      else if (attempt.score <= 60) scoreRanges[2].count++;
      else if (attempt.score <= 80) scoreRanges[3].count++;
      else scoreRanges[4].count++;
    });
    
    // Calculate most missed questions
    const questionMisses: Record<number, number> = {};
    const questionTotal: Record<number, number> = {};
    
    attempts.forEach(attempt => {
      Object.entries(attempt.answers).forEach(([qIndex, answer]: [string, any]) => {
        const index = parseInt(qIndex);
        questionTotal[index] = (questionTotal[index] || 0) + 1;
        if (!answer.isCorrect) {
          questionMisses[index] = (questionMisses[index] || 0) + 1;
        }
      });
    });
    
    const mostMissedQuestions = Object.entries(questionMisses)
      .map(([qIndex, misses]) => ({
        questionIndex: parseInt(qIndex),
        missRate: Math.round((misses / questionTotal[parseInt(qIndex)]) * 100)
      }))
      .sort((a, b) => b.missRate - a.missRate)
      .slice(0, 5);
    
    // Calculate improvement rate
    const studentImprovements: number[] = [];
    uniqueStudents.forEach(studentName => {
      const studentAttempts = attempts
        .filter(a => a.studentName === studentName)
        .sort((a, b) => a.completedAt - b.completedAt);
      
      if (studentAttempts.length > 1) {
        const firstScore = studentAttempts[0].score;
        const bestScore = Math.max(...studentAttempts.map(a => a.score));
        const improvement = calculateImprovement(firstScore, bestScore);
        studentImprovements.push(improvement);
      }
    });
    
    const improvementRate = studentImprovements.length > 0
      ? Math.round(studentImprovements.reduce((a, b) => a + b, 0) / studentImprovements.length)
      : 0;
    
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    
    return {
      totalStudents: uniqueStudents.size,
      totalAttempts: attempts.length,
      averageScore: Math.round(totalScore / attempts.length),
      averageAttempts: Math.round(attempts.length / uniqueStudents.size),
      mostMissedQuestions,
      scoreDistribution: scoreRanges,
      improvementRate
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    throw error;
  }
}

// ===== REALTIME LISTENERS =====

/**
 * Listen to session changes
 */
export function listenToSession(
  sessionId: string,
  callback: (session: PracticeSession | null) => void
): () => void {
  const sessionRef = ref(realtimeDb, `practiceSessions/${sessionId}`);
  
  onValue(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: sessionId, ...snapshot.val() } as PracticeSession);
    } else {
      callback(null);
    }
  });
  
  return () => off(sessionRef);
}

/**
 * Listen to leaderboard changes
 */
export function listenToLeaderboard(
  sessionId: string,
  callback: (leaderboard: LeaderboardEntry[]) => void
): () => void {
  const leaderboardRef = ref(realtimeDb, `practiceLeaderboard/${sessionId}`);
  
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

// ===== DATA ARCHIVAL =====

/**
 * Archive practice session to Firestore
 */
export async function archivePracticeSession(sessionId: string): Promise<void> {
  try {
    console.log('📦 Archiving practice session:', sessionId);
    
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const leaderboard = await getLeaderboard(sessionId);
    const analytics = await calculatePracticeAnalytics(sessionId);
    
    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Save to Firestore
    const { db } = await import('../components/ui/firebase');
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    const archiveData = {
      sessionId,
      competitionId: session.competitionId,
      title: session.title,
      pin: session.pin,
      createdAt: Timestamp.fromMillis(session.createdAt),
      endedAt: session.endDate ? Timestamp.fromMillis(session.endDate) : Timestamp.now(),
      leaderboard,
      analytics,
      expiresAt: Timestamp.fromDate(expiresAt),
      archivedAt: Timestamp.now()
    };
    
    await addDoc(collection(db, 'practiceSessionArchive'), archiveData);
    console.log('✅ Practice session archived to Firestore');
  } catch (error) {
    console.error('❌ Error archiving practice session:', error);
    throw error;
  }
}
