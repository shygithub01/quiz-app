// Live Event Mode TypeScript Interfaces

import { Timestamp } from 'firebase/firestore';

/**
 * Live Event Settings
 * Configuration for a live event competition
 */
export interface LiveEventSettings {
  questionTimer: number; // seconds per question (15-120)
  enableFastestFingerBonus: boolean; // award bonus points for speed
  autoAdvanceOnTimer: boolean; // auto-advance when timer expires
}

/**
 * Live Event
 * Main event state stored in Firebase Realtime Database
 */
export interface LiveEvent {
  id: string;
  competitionId: string;
  pin: string; // 6-digit PIN code
  status: 'lobby' | 'active' | 'paused' | 'completed';
  phase: 'lobby' | 'countdown' | 'question' | 'leaderboard' | 'results';
  currentQuestionIndex: number;
  timerStartedAt: number | null; // Unix timestamp
  timerDuration: number; // seconds
  pausedAt: number | null; // Unix timestamp when paused
  pausedDuration: number; // accumulated pause time in milliseconds
  maxParticipants: number;
  settings: LiveEventSettings;
  createdAt: number; // Unix timestamp
  startedAt: number | null; // Unix timestamp
  endedAt: number | null; // Unix timestamp
  scheduledStartAt?: number; // Unix timestamp — if set, event auto-starts at this time
}

/**
 * Guest Participant
 * Participant session data in Realtime Database
 */
export interface GuestParticipant {
  sessionId: string;
  name: string; // 2-50 characters
  joinedAt: number; // Unix timestamp
  isActive: boolean;
  lastSeen: number; // Unix timestamp for heartbeat
}

/**
 * Participant Answer
 * Answer submission data in Realtime Database
 */
export interface ParticipantAnswer {
  answer: string; // selected answer option
  timestamp: number; // Unix timestamp
  timeToAnswer: number; // seconds from question start
}

/**
 * Leaderboard Entry
 * Real-time leaderboard data in Realtime Database
 */
export interface LeaderboardEntry {
  sessionId: string;
  name: string;
  score: number;
  correctAnswers: number;
  fastestFingerBonus: number;
  rank: number;
  totalTime?: number; // Total time in seconds to answer all questions (optional for backward compatibility)
  lastUpdated: number; // Unix timestamp
}

/**
 * Live Event Archive
 * Permanent storage in Firestore after event ends
 */
export interface LiveEventArchive {
  eventId: string;
  competitionId: string;
  pin: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  participantCount: number;
  results: {
    sessionId: string;
    name: string;
    score: number;
    rank: number;
    answers: Record<number, {
      answer: string;
      correct: boolean;
      timeToAnswer: number;
    }>;
  }[];
  downloadedAt?: Timestamp;
  expiresAt: Timestamp; // 24 hours after event end
}

/**
 * Extended Competition interface
 * Adds live event fields to existing Competition type
 */
export interface LiveEventCompetition {
  isLiveEvent: boolean;
  liveEventSettings?: LiveEventSettings;
}
