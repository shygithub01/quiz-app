// Subscription Service - Manages user subscriptions and usage limits

import { doc, getDoc, updateDoc, Timestamp, setDoc, increment as firestoreIncrement } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import { 
  SubscriptionData, 
  SubscriptionTier, 
  TIER_LIMITS
} from '@/types/subscription';

export class SubscriptionService {
  
  /**
   * Get user's subscription data with usage limits
   */
  static async getSubscriptionData(userId: string): Promise<SubscriptionData> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    const tier: SubscriptionTier = userData.subscriptionTier || 'free';
    const status = userData.subscriptionStatus || 'active';
    const quizGenerationsUsed = userData.quizGenerationsThisMonth || 0;
    const savedQuizzesCount = userData.savedQuizzesCount || 0;
    
    // Get limits for tier
    const limits = TIER_LIMITS[tier];
    
    // Calculate days until reset
    const resetDate = userData.quizGenerationsResetDate?.toDate() || this.getNextResetDate();
    const now = new Date();
    const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if user can perform actions
    const canGenerateQuiz = limits.quizGenerations === -1 || quizGenerationsUsed < limits.quizGenerations;
    const canSaveQuiz = limits.savedQuizzes === -1 || savedQuizzesCount < limits.savedQuizzes;
    
    return {
      tier,
      status,
      quizGenerationsUsed,
      quizGenerationsLimit: limits.quizGenerations,
      savedQuizzesCount,
      savedQuizzesLimit: limits.savedQuizzes,
      canGenerateQuiz,
      canSaveQuiz,
      canDownloadPDF: limits.pdfDownloads,
      canAccessAnalytics: limits.analytics,
      daysUntilReset,
      resetDate,
    };
  }
  
  /**
   * Initialize subscription for new user
   */
  static async initializeSubscription(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const resetDate = this.getNextResetDate();
    
    await updateDoc(userRef, {
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      subscriptionStartDate: Timestamp.now(),
      subscriptionEndDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      quizGenerationsThisMonth: 0,
      quizGenerationsLimit: TIER_LIMITS.free.quizGenerations,
      quizGenerationsResetDate: Timestamp.fromDate(resetDate),
      savedQuizzesCount: 0,
      savedQuizzesLimit: TIER_LIMITS.free.savedQuizzes,
      trialStartDate: null,
      trialEndDate: null,
      hasUsedTrial: false,
    });
    
    console.log('✅ Subscription initialized for user:', userId);
  }
  
  /**
   * Track quiz generation usage
   */
  static async trackQuizGeneration(userId: string): Promise<boolean> {
    const subscriptionData = await this.getSubscriptionData(userId);
    
    // Check if user can generate quiz
    if (!subscriptionData.canGenerateQuiz) {
      console.log('❌ Quiz generation limit reached for user:', userId);
      return false;
    }
    
    // Check if reset is needed
    const now = new Date();
    if (now >= subscriptionData.resetDate) {
      await this.resetMonthlyUsage(userId);
    }
    
    // Increment usage
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      quizGenerationsThisMonth: firestoreIncrement(1),
    });
    
    console.log('✅ Quiz generation tracked for user:', userId);
    return true;
  }
  
  /**
   * Track saved quiz
   */
  static async trackSavedQuiz(userId: string, incrementBy: number = 1): Promise<boolean> {
    const subscriptionData = await this.getSubscriptionData(userId);
    
    // Check if user can save quiz
    if (!subscriptionData.canSaveQuiz && incrementBy > 0) {
      console.log('❌ Saved quiz limit reached for user:', userId);
      return false;
    }
    
    // Update count
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      savedQuizzesCount: firestoreIncrement(incrementBy),
    });
    
    console.log('✅ Saved quiz count updated for user:', userId);
    return true;
  }
  
  /**
   * Reset monthly usage (called automatically or by cron)
   */
  static async resetMonthlyUsage(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const nextResetDate = this.getNextResetDate();
    
    await updateDoc(userRef, {
      quizGenerationsThisMonth: 0,
      quizGenerationsResetDate: Timestamp.fromDate(nextResetDate),
    });
    
    console.log('✅ Monthly usage reset for user:', userId);
  }
  
  /**
   * Upgrade user to premium
   */
  static async upgradeToPremium(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const now = Timestamp.now();
    
    await updateDoc(userRef, {
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionStartDate: now,
      stripeCustomerId,
      stripeSubscriptionId,
      quizGenerationsLimit: -1, // unlimited
      savedQuizzesLimit: -1, // unlimited
    });
    
    // Create subscription document
    const subscriptionRef = doc(db, 'subscriptions', stripeSubscriptionId);
    await setDoc(subscriptionRef, {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      status: 'active',
      tier: 'premium',
      currentPeriodStart: now,
      currentPeriodEnd: Timestamp.fromDate(this.getNextBillingDate()),
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log('✅ User upgraded to premium:', userId);
  }
  
  /**
   * Downgrade user to free
   */
  static async downgradeToFree(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      subscriptionEndDate: Timestamp.now(),
      quizGenerationsLimit: TIER_LIMITS.free.quizGenerations,
      savedQuizzesLimit: TIER_LIMITS.free.savedQuizzes,
    });
    
    console.log('✅ User downgraded to free:', userId);
  }
  
  /**
   * Check if user has premium features
   */
  static async hasPremiumAccess(userId: string): Promise<boolean> {
    const subscriptionData = await this.getSubscriptionData(userId);
    return subscriptionData.tier !== 'free' && subscriptionData.status === 'active';
  }
  
  /**
   * Get next reset date (first day of next month)
   */
  private static getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }
  
  /**
   * Get next billing date (30 days from now)
   */
  private static getNextBillingDate(): Date {
    const now = new Date();
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  
  /**
   * Get usage summary for display
   */
  static async getUsageSummary(userId: string): Promise<{
    quizGenerations: string;
    savedQuizzes: string;
    resetDate: string;
  }> {
    const data = await this.getSubscriptionData(userId);
    
    const quizGenerations = data.quizGenerationsLimit === -1
      ? `${data.quizGenerationsUsed} (Unlimited)`
      : `${data.quizGenerationsUsed} / ${data.quizGenerationsLimit}`;
    
    const savedQuizzes = data.savedQuizzesLimit === -1
      ? `${data.savedQuizzesCount} (Unlimited)`
      : `${data.savedQuizzesCount} / ${data.savedQuizzesLimit}`;
    
    const resetDate = data.resetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    
    return {
      quizGenerations,
      savedQuizzes,
      resetDate,
    };
  }
}
