// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  userType: 'student' | 'admin';
  school?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz types
export interface Quiz {
  id: string;
  title: string;
  type: 'document' | 'topic';
  questions: Question[];
  createdAt: Date;
  settings?: {
    difficulty?: string;
    numQuestions?: number;
    quizType?: string;
  };
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  timeSpent?: number; // in seconds
  userAnswers?: string[];
}

// Competition types
export interface Competition {
  id: string;
  title: string;
  description: string;
  quizTemplateId: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  competitionType: 'scholarship' | 'practice';
  prizePool?: number;
  prizes?: string[]; // Array of prize descriptions
  rules?: string[]; // Array of rules
  maxAttempts?: number;
  participantCount: number;
  createdAt?: Date;
  createdBy?: string;
}

export interface LeaderboardEntry {
  id: string;
  competitionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  school?: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  rank: number;
  completedAt: Date;
  attemptId: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'competition' | 'result' | 'reminder';
  isRead: boolean;
  createdAt: Date;
}
