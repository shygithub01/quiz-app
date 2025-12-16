// Subscription types for Quizist.AI Freemium Model

export type SubscriptionTier = 'free' | 'premium' | 'family' | 'teacher';

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'canceled' 
  | 'expired' 
  | 'past_due';

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  quizGenerationsUsed: number;
  quizGenerationsLimit: number;
  savedQuizzesCount: number;
  savedQuizzesLimit: number;
  canGenerateQuiz: boolean;
  canSaveQuiz: boolean;
  canDownloadPDF: boolean;
  canAccessAnalytics: boolean;
  daysUntilReset: number;
  resetDate: Date;
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

export interface UserSubscription {
  // Subscription info
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  
  // Usage tracking
  quizGenerationsThisMonth: number;
  quizGenerationsLimit: number; // 5 for free, -1 for unlimited
  quizGenerationsResetDate: Date;
  savedQuizzesCount: number;
  savedQuizzesLimit: number; // 3 for free, -1 for unlimited
  
  // Trial tracking
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  hasUsedTrial: boolean;
}

export interface SubscriptionDocument {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageTracking {
  id: string; // Format: userId_YYYY_MM
  userId: string;
  month: string; // Format: YYYY-MM
  quizGenerations: number;
  quizGenerationDetails: Array<{
    timestamp: Date;
    quizId: string;
    type: 'document' | 'topic';
  }>;
  pdfDownloads: number;
  analyticsViews: number;
}

// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    quizGenerations: 5,
    savedQuizzes: 3,
    pdfDownloads: false,
    analytics: false,
    priorityGeneration: false,
  },
  premium: {
    quizGenerations: -1, // unlimited
    savedQuizzes: -1, // unlimited
    pdfDownloads: true,
    analytics: true,
    priorityGeneration: true,
  },
  family: {
    quizGenerations: -1,
    savedQuizzes: -1,
    pdfDownloads: true,
    analytics: true,
    priorityGeneration: true,
  },
  teacher: {
    quizGenerations: -1,
    savedQuizzes: -1,
    pdfDownloads: true,
    analytics: true,
    priorityGeneration: true,
  },
} as const;

// Pricing configuration
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    interval: 'month',
    stripePriceId: '',
    features: [
      '5 AI quiz generations per month',
      'Unlimited scholarship access',
      'Save up to 3 quizzes',
      'Basic performance stats',
      'View leaderboards',
    ],
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    tier: 'premium',
    price: 12.99,
    interval: 'month',
    stripePriceId: process.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    features: [
      'Unlimited AI quiz generation',
      'Unlimited saved quizzes',
      'Download PDFs',
      'Performance analytics',
      'Progress tracking',
      'Priority generation',
      'Ad-free experience',
    ],
    popular: true,
  },
  {
    id: 'premium-yearly',
    name: 'Premium Annual',
    tier: 'premium',
    price: 99,
    interval: 'year',
    stripePriceId: process.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    features: [
      'Unlimited AI quiz generation',
      'Unlimited saved quizzes',
      'Download PDFs',
      'Performance analytics',
      'Progress tracking',
      'Priority generation',
      'Ad-free experience',
      '2 months free!',
    ],
    savings: 'Save $56/year',
  },
];
