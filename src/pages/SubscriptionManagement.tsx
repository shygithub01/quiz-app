// Subscription Management Page - View and manage subscription

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';
import { UsageIndicator } from '@/components/subscription/UsageIndicator';
import { StripeService } from '@/services/stripeService';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  CreditCard, 
  TrendingUp, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, loading, refresh } = useSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [managingSubscription, setManagingSubscription] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Check for success/cancel params from Stripe redirect
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast({
        title: 'Welcome to Premium!',
        description: 'Your subscription is now active. Enjoy unlimited features!',
      });
      refresh();
      // Clean up URL
      window.history.replaceState({}, '', '/account/subscription');
    }
    
    if (canceled === 'true') {
      toast({
        title: 'Checkout canceled',
        description: 'No charges were made. You can try again anytime.',
        variant: 'destructive'
      });
      // Clean up URL
      window.history.replaceState({}, '', '/account/subscription');
    }
  }, [user, searchParams, navigate, toast, refresh]);
  
  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);
      await StripeService.createPortalSession();
    } catch (error) {
      console.error('Error opening portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open subscription management. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setManagingSubscription(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }
  
  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to load subscription</h2>
            <p className="text-gray-600 mb-4">Please try refreshing the page</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isPremium = subscription.tier !== 'free';
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
            <p className="text-gray-600 mt-1">Manage your subscription and usage</p>
          </div>
          <SubscriptionBadge tier={subscription.tier} size="lg" />
        </div>
        
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Current Plan
            </CardTitle>
            <CardDescription>
              {isPremium 
                ? 'You have access to all premium features'
                : 'Upgrade to unlock unlimited features'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.tier === 'free' ? 'Free' : 'Premium'}
                </p>
                <p className="text-sm text-gray-600">
                  {subscription.tier === 'free' 
                    ? '5 quiz generations per month'
                    : 'Unlimited quiz generations'
                  }
                </p>
              </div>
              {!isPremium && (
                <Button 
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Upgrade to Premium
                </Button>
              )}
              {isPremium && (
                <Button 
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  variant="outline"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {managingSubscription ? 'Loading...' : 'Manage Subscription'}
                </Button>
              )}
            </div>
            
            {subscription.status === 'past_due' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Payment Failed</p>
                  <p className="text-sm text-red-700">
                    Your last payment failed. Please update your payment method to continue using Premium features.
                  </p>
                  <Button 
                    onClick={handleManageSubscription}
                    size="sm"
                    className="mt-2 bg-red-600 hover:bg-red-700"
                  >
                    Update Payment Method
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Usage This Month
            </CardTitle>
            <CardDescription>
              Your usage resets on the 1st of each month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quiz Generations</h3>
              <UsageIndicator
                used={subscription.quizGenerationsUsed}
                limit={subscription.quizGenerationsLimit}
                type="quiz"
                onUpgrade={() => navigate('/pricing')}
              />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Quizzes</h3>
              <UsageIndicator
                used={subscription.savedQuizzesCount}
                limit={subscription.savedQuizzesLimit}
                type="save"
                onUpgrade={() => navigate('/pricing')}
              />
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Next reset date:</span>
                <span className="font-medium text-gray-900">
                  {subscription.resetDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Premium Features */}
        {!isPremium && (
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Unlock Premium Features
              </CardTitle>
              <CardDescription>
                Get unlimited access to all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Unlimited Quiz Generation</p>
                    <p className="text-sm text-gray-600">Create as many quizzes as you need</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Unlimited Saved Quizzes</p>
                    <p className="text-sm text-gray-600">Save and organize all your quizzes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Download PDFs</p>
                    <p className="text-sm text-gray-600">Export quizzes for offline use</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Performance Analytics</p>
                    <p className="text-sm text-gray-600">Track your progress over time</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/pricing')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Upgrade to Premium - $12.99/month
              </Button>
              <p className="text-xs text-center text-gray-600 mt-2">
                7-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Scholarship Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  Scholarship Competitions Are Always Free
                </p>
                <p className="text-sm text-blue-700">
                  Your subscription status does not affect scholarship eligibility, scoring, or ranking. 
                  All students have equal access to scholarship opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
