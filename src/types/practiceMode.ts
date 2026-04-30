// TypeScript interfaces for Practice Live Mode

export interface PracticeSession {
  id: string;
  competitionId: string;
  pin: string;
  status: 'active' | 'ended';
  title: string;
  description: string;
  createdBy: string;
  createdAt: number;
  startDate?: number;     // if set and in future, session hidden from discovery
  endDate: number | null; // null = no expiry
  settings: PracticeSettings;
  statistics: SessionStatistics;
}

export interface PracticeSettings {
  showLeaderboard: boolean;
  showExplanations: boolean;
  maxQuestions: number;
}

export interface SessionStatistics {
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
}

export interface PracticeAttempt {
  id: string;
  sessionId: string;
  studentName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  startedAt: number;
  completedAt: number;
  answers: Record<number, AttemptAnswer>;
}

export interface AttemptAnswer {
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface LeaderboardEntry {
  name: string;
  bestScore: number;
  worstScore: number;
  lastScore: number;
  attemptCount: number;
  firstAttemptDate: number;
  lastAttemptDate: number;
  improvement: number;
  rank: number;
  lastDuration?: number; // ms — time spent on last attempt
}

export interface StudentSummary {
  name: string;
  attemptCount: number;
  bestScore: number;
  firstAttemptDate: number;
  lastAttemptDate: number;
  improvement: number;
}

export interface PracticeAnalytics {
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  averageAttempts: number;
  mostMissedQuestions: { questionIndex: number; missRate: number }[];
  scoreDistribution: { range: string; count: number }[];
  improvementRate: number;
}

export interface ParticipantState {
  sessionId: string;
  studentName: string;
  currentQuestionIndex: number;
  answers: Record<number, string>;
  attemptId: string;
  startedAt: number;
  isComplete: boolean;
}

export interface DashboardState {
  session: PracticeSession;
  students: StudentSummary[];
  attempts: PracticeAttempt[];
  leaderboard: LeaderboardEntry[];
  analytics: PracticeAnalytics;
}

export interface QuestionReview {
  questionIndex: number;
  question: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  wasIncorrectBefore: boolean;
}

export interface ResultsDisplay {
  currentScore: number;
  bestScore: number;
  rank: number;
  attemptNumber: number;
  improvement: number;
  questionReview: QuestionReview[];
  scoreHistory: number[];
}
