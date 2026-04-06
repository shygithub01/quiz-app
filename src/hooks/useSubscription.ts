// useSubscription Hook - Track user subscription and usage limits

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionService } from '@/services/subscriptionService';
import { SubscriptionData } from '@/types/subscription';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setSubscription(null);
      return;
    }
    
    loadSubscription();
  }, [user]);
  
  const loadSubscription = async () => {
    if (!user?.uid) return;
    
    try {
      const data = await SubscriptionService.getSubscriptionData(user.uid);
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      // Set default free tier on error
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      
      setSubscription({
        tier: 'free',
        status: 'active',
        quizGenerationsUsed: 0,
        quizGenerationsLimit: 5,
        savedQuizzesCount: 0,
        savedQuizzesLimit: 3,
        canGenerateQuiz: true,
        canSaveQuiz: true,
        canDownloadPDF: false,
        canAccessAnalytics: false,
        daysUntilReset: 30,
        resetDate: nextMonth
      });
    } finally {
      setLoading(false);
    }
  };
  
  const refresh = () => {
    loadSubscription();
  };
  
  return {
    subscription,
    loading,
    refresh,
    isPremium: subscription ? SubscriptionService.isPremium(subscription.tier) : false,
    canGenerateQuiz: subscription?.canGenerateQuiz ?? false,
    canSaveQuiz: subscription?.canSaveQuiz ?? false
  };
}
