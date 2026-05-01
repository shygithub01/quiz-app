// LocalStorage utility functions for Practice Live Mode
// Handles persistent storage of student names and quiz progress

import { ParticipantState } from '../types/practiceMode';

// ===== NAME STORAGE =====

/**
 * Save student name to localStorage
 * Key format: practiceLive_{sessionId}_name
 */
export function saveNameToLocalStorage(sessionId: string, name: string): void {
  try {
    const key = `practiceLive_${sessionId}_name`;
    localStorage.setItem(key, name);
    console.log('✅ Name saved to localStorage:', name);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('⚠️ LocalStorage quota exceeded, clearing old practice data');
      clearOldPracticeData();
      try {
        localStorage.setItem(`practiceLive_${sessionId}_name`, name);
      } catch (retryError) {
        console.error('❌ Failed to save name after clearing:', retryError);
      }
    } else {
      console.error('❌ Error saving name to localStorage:', error);
    }
  }
}

/**
 * Get student name from localStorage
 * Returns null if not found
 */
export function getNameFromLocalStorage(sessionId: string): string | null {
  try {
    const key = `practiceLive_${sessionId}_name`;
    const name = localStorage.getItem(key);
    return name;
  } catch (error) {
    console.error('❌ Error getting name from localStorage:', error);
    return null;
  }
}

/**
 * Clear student name from localStorage
 */
export function clearNameFromLocalStorage(sessionId: string): void {
  try {
    const key = `practiceLive_${sessionId}_name`;
    localStorage.removeItem(key);
    console.log('✅ Name cleared from localStorage');
  } catch (error) {
    console.error('❌ Error clearing name from localStorage:', error);
  }
}

// ===== UID STORAGE (daily challenge dedup) =====

export function saveUidToLocalStorage(sessionId: string, uid: string): void {
  try { localStorage.setItem(`practiceLive_${sessionId}_uid`, uid); } catch {}
}

export function getUidFromLocalStorage(sessionId: string): string | null {
  try { return localStorage.getItem(`practiceLive_${sessionId}_uid`); } catch { return null; }
}

// ===== PROGRESS STORAGE =====

/**
 * Save quiz progress to localStorage
 * Key format: practiceLive_{sessionId}_progress
 */
export function saveProgressToLocalStorage(
  sessionId: string,
  progress: ParticipantState
): void {
  try {
    const key = `practiceLive_${sessionId}_progress`;
    const data = JSON.stringify(progress);
    localStorage.setItem(key, data);
    console.log('✅ Progress saved to localStorage');
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('⚠️ LocalStorage quota exceeded, clearing old practice data');
      clearOldPracticeData();
      try {
        localStorage.setItem(`practiceLive_${sessionId}_progress`, JSON.stringify(progress));
      } catch (retryError) {
        console.error('❌ Failed to save progress after clearing:', retryError);
      }
    } else {
      console.error('❌ Error saving progress to localStorage:', error);
    }
  }
}

/**
 * Resume quiz progress from localStorage
 * Returns null if not found or corrupted
 */
export function resumeFromLocalStorage(sessionId: string): ParticipantState | null {
  try {
    const key = `practiceLive_${sessionId}_progress`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      return null;
    }
    
    const progress = JSON.parse(data) as ParticipantState;
    
    // Validate progress schema
    if (!validateProgressSchema(progress)) {
      console.warn('⚠️ Invalid progress schema, clearing corrupted data');
      clearProgressFromLocalStorage(sessionId);
      return null;
    }
    
    console.log('✅ Progress resumed from localStorage');
    return progress;
  } catch (error) {
    console.error('❌ Corrupted progress data, starting fresh:', error);
    clearProgressFromLocalStorage(sessionId);
    return null;
  }
}

/**
 * Clear quiz progress from localStorage
 */
export function clearProgressFromLocalStorage(sessionId: string): void {
  try {
    const key = `practiceLive_${sessionId}_progress`;
    localStorage.removeItem(key);
    console.log('✅ Progress cleared from localStorage');
  } catch (error) {
    console.error('❌ Error clearing progress from localStorage:', error);
  }
}

// ===== ATTEMPT HISTORY STORAGE =====

/**
 * Save attempt history to localStorage (for score history chart)
 * Key format: practiceLive_{sessionId}_attempts
 */
export function saveAttemptHistory(
  sessionId: string,
  studentName: string,
  score: number
): void {
  try {
    const key = `practiceLive_${sessionId}_attempts_${studentName}`;
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    
    history.push({
      score,
      timestamp: Date.now()
    });
    
    localStorage.setItem(key, JSON.stringify(history));
    console.log('✅ Attempt history saved');
  } catch (error) {
    console.error('❌ Error saving attempt history:', error);
  }
}

/**
 * Get attempt history from localStorage
 */
export function getAttemptHistory(
  sessionId: string,
  studentName: string
): Array<{ score: number; timestamp: number }> {
  try {
    const key = `practiceLive_${sessionId}_attempts_${studentName}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      return [];
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error getting attempt history:', error);
    return [];
  }
}

// ===== VALIDATION =====

/**
 * Validate progress schema
 */
function validateProgressSchema(progress: any): boolean {
  return (
    progress &&
    typeof progress.sessionId === 'string' &&
    typeof progress.studentName === 'string' &&
    typeof progress.currentQuestionIndex === 'number' &&
    typeof progress.answers === 'object' &&
    typeof progress.attemptId === 'string' &&
    typeof progress.startedAt === 'number' &&
    typeof progress.isComplete === 'boolean'
  );
}

// ===== CLEANUP =====

/**
 * Clear old practice data from localStorage
 * Removes data older than 30 days
 */
export function clearOldPracticeData(): void {
  try {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const keysToRemove: string[] = [];
    
    // Find all practice-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('practiceLive_')) {
        // Check if it's an attempt history with timestamp
        if (key.includes('_attempts_')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const history = JSON.parse(data);
              const lastAttempt = history[history.length - 1];
              if (lastAttempt && lastAttempt.timestamp < thirtyDaysAgo) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // If we can't parse it, remove it
            keysToRemove.push(key);
          }
        }
      }
    }
    
    // Remove old keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`✅ Cleared ${keysToRemove.length} old practice data entries`);
  } catch (error) {
    console.error('❌ Error clearing old practice data:', error);
  }
}

/**
 * Clear all practice data for a specific session
 */
export function clearAllSessionData(sessionId: string): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`practiceLive_${sessionId}_`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`✅ Cleared all data for session ${sessionId}`);
  } catch (error) {
    console.error('❌ Error clearing session data:', error);
  }
}

/**
 * Get localStorage usage statistics
 */
export function getStorageStats(): {
  used: number;
  available: number;
  percentage: number;
} {
  try {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        used += key.length + (value?.length || 0);
      }
    }
    
    // Most browsers have 5-10MB limit, we'll assume 5MB
    const available = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = Math.round((used / available) * 100);
    
    return { used, available, percentage };
  } catch (error) {
    console.error('❌ Error getting storage stats:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}
