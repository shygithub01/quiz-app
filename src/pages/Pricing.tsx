// Pricing Page - Display subscription tiers and handle checkout

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, Sparkles } from 'lucide-react';
import { StripeService } from '@/services/stripeService';
import { useToast } from '@/hooks/use-toast';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);
  
  const plans = [
    {
      name: 'Free',
      price: 0,
      interval: 'forever',
      description: 'Perfect for trying out Quizist.AI',
      features: [
        '✅ Unlimited scholarship competitions',
        '5 AI quiz generations per month',
        'Unlimited practice sessions',
        'View leaderboards',
        'Save up to 3 quizzes',
        'Basic performance stats'
      ],
      cta: 'Get Started Free',
      tier: 'free'
    },
    {
      name: 'Premium',
      price: interval === 'month' ? 12.99 : 99,
      interval: interval === 'month' ? 'month' : 'year',
      description: 'For serious learners and test prep',
      features: [
        '✅ Unlimited scholarship competitions',
        '✨ Unlimited AI quiz generation',
        '✨ Advanced quiz customization',
        '✨ Unlimited saved quizzes',
        '✨ Download PDFs',
        '✨ Performance analytics dashboard',
        '✨ Progress tracking over time',
        '✨ Priority AI generation',
        '✨ Exclusive practice competitions',
        '✨ Export to Anki/Quizlet',
        '✨ Ad-free experience'
      ],
      cta: 'Start 7-Day Free Trial',
      tier: 'premium',
      popular: true,
      priceId: interval === 'month' 
        ? import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID 
        : import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID,
      savings: interval === 'year' ? 'Save $56/year' : null
    }
  ];
  
  const handleSubscribe = async (priceId?: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to subscribe',
      });
      await signIn();
      return;
    }
    
    if (!priceId) {
      navigate('/quiz-generator');
      return;
    }
    
    try {
      setLoading(priceId);
      await StripeService.createCheckoutSession(priceId);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout failed',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-purple-200 mb-8">
            Start free, upgrade when you need more
          </p>
          
          {/* Interval Toggle */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full p-1">
            <button
              onClick={() => setInterval('month')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                interval === 'month'
                  ? 'bg-white text-purple-900'
                  : 'text-white hover:text-purple-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                interval === 'year'
                  ? 'bg-white text-purple-900'
                  : 'text-white hover:text-purple-200'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save 36%
              </span>
            </button>
          </div>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative ${
                plan.popular 
                  ? 'border-4 border-yellow-400 shadow-2xl scale-105' 
                  : 'border-white/20'
              } bg-white/10 backdrop-blur-sm`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-purple-200 ml-2">
                    /{plan.interval}
                  </span>
                </div>
                {plan.savings && (
                  <div className="text-green-400 font-medium">
                    {plan.savings}
                  </div>
                )}
                <p className="text-purple-200 mt-2">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loading === plan.priceId}
                  className={`w-full py-6 text-lg font-bold ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                      : 'bg-white text-purple-900 hover:bg-gray-100'
                  }`}
                >
                  {loading === plan.priceId ? 'Loading...' : plan.cta}
                </Button>
                
                {plan.tier === 'premium' && (
                  <p className="text-xs text-center text-purple-200">
                    7-day free trial • Cancel anytime
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Are scholarship competitions always free?
                </h3>
                <p className="text-purple-200">
                  Yes! Scholarship competitions are 100% free for all users, forever. 
                  We believe in equal access to educational opportunities.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-purple-200">
                  Absolutely! Cancel your subscription anytime from your account settings. 
                  You'll keep premium access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  What happens when I reach my free quiz limit?
                </h3>
                <p className="text-purple-200">
                  You can still participate in scholarship competitions and practice sessions. 
                  Your quiz generation limit resets on the 1st of each month, or upgrade to Premium for unlimited access.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Do you offer student discounts?
                </h3>
                <p className="text-purple-200">
                  Yes! Students with a .edu email address can get special discounts. 
                  Contact support@quizist.ai with your student email for details.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Scholarship Notice */}
        <div className="mt-12 text-center">
          <Card className="bg-blue-500/20 border-blue-400/50 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-blue-300" />
                <h3 className="text-xl font-bold text-white">
                  Scholarship Guarantee
                </h3>
              </div>
              <p className="text-blue-100">
                Scholarship competitions are 100% free and will NEVER require a paid subscription. 
                Premium features do not affect scholarship eligibility, scoring, or ranking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
