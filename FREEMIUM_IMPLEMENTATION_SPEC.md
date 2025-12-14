# Freemium Implementation Spec
**Quizist.AI - Subscription Model Conversion**

## 📋 Executive Summary

Convert Quizist.AI from fully free to freemium model while keeping scholarship competitions 100% free.

**Timeline**: 4-6 weeks  
**Pricing**: Free (5 quizzes/month) | Premium ($12.99/month or $99/year)  
**Goal**: Generate $2,000-$5,000 MRR in first 6 months

---

## 🎯 Subscription Tiers

### FREE Tier
- ✅ Unlimited scholarship competition access
- ✅ 5 AI quiz generations per month
- ✅ Unlimited practice sessions
- ✅ View leaderboards
- ✅ Save up to 3 quizzes
- ✅ Basic performance stats

### PREMIUM Tier ($12.99/month or $99/year)
- ✅ Unlimited AI quiz generation
- ✅ Advanced quiz customization
- ✅ Unlimited saved quizzes with folders
- ✅ Download PDFs of quizzes
- ✅ Performance analytics dashboard
- ✅ Progress tracking over time
- ✅ Priority AI generation (faster)
- ✅ Exclusive premium practice competitions
- ✅ Export to Anki/Quizlet
- ✅ Ad-free experience

---

## 📊 Phase 1: Foundation (Week 1-2)

### 1.1 Database Schema Updates

**Add to `users` collection**:
```typescript
interface User {
  // Existing fields...
  
  // Subscription fields
  subscriptionTier: 'free' | 'premium' | 'family' | 'teacher';
  subscriptionStatus: 'active' | 'trialing' | 'canceled' | 'expired' | 'past_due';
  subscriptionStartDate: Timestamp | null;
  subscriptionEndDate: Timestamp | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  
  // Usage tracking
  quizGenerationsThisMonth: number;
  quizGenerationsLimit: number; // 5 for free, -1 for unlimited
  quizGenerationsResetDate: Timestamp;
  savedQuizzesCount: number;
  savedQuizzesLimit: number; // 3 for free, -1 for unlimited
  
  // Trial tracking
  trialStartDate: Timestamp | null;
  trialEndDate: Timestamp | null;
  hasUsedTrial: boolean;
}
```

**Create new `subscriptions` collection**:
```typescript
interface Subscription {
  id: string; // Firestore doc ID
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'trialing' | 'canceled' | 'expired' | 'past_due';
  tier: 'premium' | 'family' | 'teacher';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Create new `usageTracking` collection**:
```typescript
interface UsageTracking {
  id: string; // Format: userId_YYYY_MM
  userId: string;
  month: string; // Format: YYYY-MM
  quizGenerations: number;
  quizGenerationDetails: Array<{
    timestamp: Timestamp;
    quizId: string;
    type: 'document' | 'topic';
  }>;
  pdfDownloads: number;
  analyticsViews: number;
}
```

### 1.2 Firebase Security Rules Updates

Add to `firestore.rules`:
```javascript
// Subscription rules
match /subscriptions/{subscriptionId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin');
  allow write: if false; // Only Cloud Functions can write
}

// Usage tracking rules
match /usageTracking/{trackingId} {
  allow read: if request.auth != null && 
    trackingId.matches(request.auth.uid + '_.*');
  allow write: if false; // Only Cloud Functions can write
}
```

### 1.3 TypeScript Types

Create `src/types/subscription.ts`:
```typescript
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
  daysUntilReset: number;
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
}
```

---

## 💻 Phase 2: Core Subscription Logic (Week 2-3)

### 2.1 Subscription Service

Create `src/services/subscriptionService.ts`:
```typescript
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import { SubscriptionData, SubscriptionTier } from '@/types/subscription';

export class SubscriptionService {
  
  /**
   * Get user's subscription data
   */
  static async getSubscriptionData(userId: string): Promise<SubscriptionData> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    const tier = userData.subscriptionTier || 'free';
    const status = userData.subscriptionStatus || 'active';
    const quizGenerationsUsed = userData.quizGenerationsThisMonth || 0;
    const savedQuizzesCount = userData.savedQuizzesCount || 0;
    
    // Set limits based on tier
    const limits = this.getLimitsForTier(tier);
    
    // Calculate days until reset
    const resetDate = userData.quizGenerationsResetDate?.toDate() || new Date();
    const now = new Date();
    const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      tier,
      status,
      quizGenerationsUsed,
      quizGenerationsLimit: limits.quizGenerations,
      savedQuizzesCount,
      savedQuizzesLimit: limits.savedQuizzes,
      canGenerateQuiz: this.canGenerateQuiz(tier, quizGenerationsUsed, limits.quizGenerations),
      canSaveQuiz: this.canSaveQuiz(tier, savedQuizzesCount, limits.savedQuizzes),
      daysUntilReset
    };
  }
  
  /**
   * Get limits for subscription tier
   */
  static getLimitsForTier(tier: SubscriptionTier) {
    switch (tier) {
      case 'free':
        return { quizGenerations: 5, savedQuizzes: 3 };
      case 'premium':
      case 'family':
      case 'teacher':
        return { quizGenerations: -1, savedQuizzes: -1 }; // -1 = unlimited
      default:
        return { quizGenerations: 5, savedQuizzes: 3 };
    }
  }
  
  /**
   * Check if user can generate quiz
   */
  static canGenerateQuiz(
    tier: SubscriptionTier, 
    used: number, 
    limit: number
  ): boolean {
    if (limit === -1) return true; // Unlimited
    return used < limit;
  }
  
  /**
   * Check if user can save quiz
   */
  static canSaveQuiz(
    tier: SubscriptionTier, 
    saved: number, 
    limit: number
  ): boolean {
    if (limit === -1) return true; // Unlimited
    return saved < limit;
  }
  
  /**
   * Increment quiz generation count
   */
  static async incrementQuizGeneration(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const currentCount = userData?.quizGenerationsThisMonth || 0;
    
    await updateDoc(userRef, {
      quizGenerationsThisMonth: currentCount + 1
    });
  }
  
  /**
   * Check if user is on premium tier
   */
  static isPremium(tier: SubscriptionTier): boolean {
    return ['premium', 'family', 'teacher'].includes(tier);
  }
}
```

### 2.2 Usage Tracking Hook

Create `src/hooks/useSubscription.ts`:
```typescript
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
```

---

## 🎨 Phase 3: UI Components (Week 3)

### 3.1 Usage Indicator Component

Create `src/components/subscription/UsageIndicator.tsx`:
```typescript
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

interface UsageIndicatorProps {
  used: number;
  limit: number;
  type: 'quiz' | 'save';
  onUpgrade?: () => void;
}

export function UsageIndicator({ used, limit, type, onUpgrade }: UsageIndicatorProps) {
  const navigate = useNavigate();
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 100 : (used / limit) * 100;
  const remaining = isUnlimited ? '∞' : limit - used;
  
  const label = type === 'quiz' ? 'Quiz Generations' : 'Saved Quizzes';
  
  if (isUnlimited) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Zap className="h-4 w-4" />
        <span className="font-medium">Unlimited {label}</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${used >= limit ? 'text-red-600' : 'text-gray-900'}`}>
          {used}/{limit} used
        </span>
      </div>
      
      <Progress 
        value={percentage} 
        className={`h-2 ${used >= limit ? 'bg-red-100' : 'bg-gray-200'}`}
      />
      
      {used >= limit && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-600">Limit reached</span>
          <Button 
            size="sm" 
            onClick={onUpgrade || (() => navigate('/pricing'))}
            className="h-7 text-xs"
          >
            Upgrade for Unlimited
          </Button>
        </div>
      )}
      
      {used >= limit * 0.8 && used < limit && (
        <p className="text-xs text-orange-600">
          {remaining} {label.toLowerCase()} remaining this month
        </p>
      )}
    </div>
  );
}
```

### 3.2 Upgrade Prompt Modal

Create `src/components/subscription/UpgradePrompt.tsx`:
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  reason: 'quiz_limit' | 'save_limit' | 'premium_feature';
}

export function UpgradePrompt({ open, onClose, reason }: UpgradePromptProps) {
  const navigate = useNavigate();
  
  const messages = {
    quiz_limit: {
      title: "You've reached your monthly quiz limit",
      description: "Upgrade to Premium for unlimited AI quiz generation"
    },
    save_limit: {
      title: "You've reached your saved quiz limit",
      description: "Upgrade to Premium to save unlimited quizzes"
    },
    premium_feature: {
      title: "This is a Premium feature",
      description: "Upgrade to unlock advanced features and analytics"
    }
  };
  
  const message = messages[reason];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {message.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {message.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 my-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-sm">Unlimited AI quiz generation</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-sm">Save unlimited quizzes</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-sm">Download PDFs</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-sm">Performance analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-sm">Priority AI generation</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Upgrade to Premium - $12.99/month
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
        
        <p className="text-xs text-center text-gray-500 mt-4">
          7-day free trial • Cancel anytime
        </p>
      </DialogContent>
    </Dialog>
  );
}
```

### 3.3 Subscription Badge

Create `src/components/subscription/SubscriptionBadge.tsx`:
```typescript
import { Crown, Zap } from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
}

export function SubscriptionBadge({ tier, size = 'md' }: SubscriptionBadgeProps) {
  if (tier === 'free') return null;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const badges = {
    premium: {
      label: 'Premium',
      icon: Zap,
      className: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
    },
    family: {
      label: 'Family',
      icon: Crown,
      className: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
    },
    teacher: {
      label: 'Teacher',
      icon: Crown,
      className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
    }
  };
  
  const badge = badges[tier];
  const Icon = badge.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${badge.className} ${sizeClasses[size]}`}>
      <Icon className={iconSizes[size]} />
      <span>{badge.label}</span>
    </div>
  );
}
```

---

## 💳 Phase 4: Stripe Integration (Week 3-4)

### 4.1 Stripe Setup

**Install Stripe**:
```bash
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe
```

**Environment Variables** (`.env.local`):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Firebase Functions** (`functions/package.json`):
```json
{
  "dependencies": {
    "stripe": "^14.0.0"
  }
}
```

### 4.2 Stripe Price IDs

Create products in Stripe Dashboard:

**Premium Monthly**: `price_premium_monthly`
**Premium Yearly**: `price_premium_yearly`
**Family Monthly**: `price_family_monthly`
**Teacher Monthly**: `price_teacher_monthly`

### 4.3 Cloud Function: Create Checkout Session

Add to `functions/index.js`:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { priceId, successUrl, cancelUrl } = data;
  const userId = context.auth.uid;
  
  try {
    // Get or create Stripe customer
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    let customerId = userData.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;
      
      // Save customer ID
      await admin.firestore().collection('users').doc(userId).update({
        stripeCustomerId: customerId
      });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: userData.hasUsedTrial ? 0 : 7,
        metadata: {
          firebaseUID: userId
        }
      },
      metadata: {
        firebaseUID: userId
      }
    });
    
    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 4.4 Cloud Function: Stripe Webhook Handler

Add to `functions/index.js`:
```javascript
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});

async function handleSubscriptionUpdate(subscription) {
  const userId = subscription.metadata.firebaseUID;
  const priceId = subscription.items.data[0].price.id;
  
  // Determine tier from price ID
  let tier = 'premium';
  if (priceId.includes('family')) tier = 'family';
  if (priceId.includes('teacher')) tier = 'teacher';
  
  const status = subscription.status;
  
  await admin.firestore().collection('users').doc(userId).update({
    subscriptionTier: tier,
    subscriptionStatus: status,
    subscriptionStartDate: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    subscriptionEndDate: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    stripeSubscriptionId: subscription.id,
    quizGenerationsLimit: -1, // Unlimited
    savedQuizzesLimit: -1, // Unlimited
    hasUsedTrial: true
  });
  
  // Create/update subscription document
  await admin.firestore().collection('subscriptions').doc(subscription.id).set({
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    status,
    tier,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function handleSubscriptionCanceled(subscription) {
  const userId = subscription.metadata.firebaseUID;
  
  await admin.firestore().collection('users').doc(userId).update({
    subscriptionTier: 'free',
    subscriptionStatus: 'canceled',
    quizGenerationsLimit: 5,
    savedQuizzesLimit: 3
  });
}
```

### 4.5 Frontend: Checkout Flow

Create `src/services/stripeService.ts`:
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export class StripeService {
  static async createCheckoutSession(priceId: string) {
    const functions = getFunctions();
    const createCheckout = httpsCallable(functions, 'createCheckoutSession');
    
    const result = await createCheckout({
      priceId,
      successUrl: `${window.location.origin}/account/subscription?success=true`,
      cancelUrl: `${window.location.origin}/pricing?canceled=true`
    });
    
    const { sessionId } = result.data as { sessionId: string };
    
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message);
    }
  }
}
```

---

## 📄 Phase 5: Pricing Page (Week 4)

### 5.1 Pricing Page Component

Create `src/pages/Pricing.tsx`:
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Crown } from 'lucide-react';
import { StripeService } from '@/services/stripeService';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);
  
  const plans = [
    {
      name: 'Free',
      price: 0,
      interval: 'forever',
      description: 'Perfect for trying out Quizist.AI',
      features: [
        'Enter scholarship competitions',
        '5 AI quiz generations per month',
        'Unlimited practice sessions',
        'View leaderboards',
        'Save up to 3 quizzes',
        'Basic performance stats'
      ],
      cta: 'Get Started',
      tier: 'free'
    },
    {
      name: 'Premium',
      price: interval === 'month' ? 12.99 : 99,
      interval: interval === 'month' ? 'month' : 'year',
      description: 'For serious learners and test prep',
      features: [
        'Everything in Free, plus:',
        'Unlimited AI quiz generation',
        'Advanced quiz customization',
        'Unlimited saved quizzes',
        'Download PDFs',
        'Performance analytics dashboard',
        'Progress tracking',
        'Priority AI generation',
        'Exclusive practice competitions',
        'Export to Anki/Quizlet',
        'Ad-free experience'
      ],
      cta: '7-Day Free Trial',
      tier: 'premium',
      popular: true,
      priceId: interval === 'month' ? 'price_premium_monthly' : 'price_premium_yearly',
      savings: interval === 'year' ? 'Save $56/year' : null
    }
  ];
  
  const handleSubscribe = async (priceId?: string) => {
    if (!user) {
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
      alert('Failed to start checkout. Please try again.');
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
                    7-day free trial • Cancel anytime • No credit card required for trial
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
                  Yes! Students with a .edu email address get 50% off Premium. 
                  Contact support@quizist.ai with your student email to get your discount code.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔧 Phase 6: Integrate Paywalls (Week 4-5)

### 6.1 Update Quiz Generator

Modify `src/pages/QuizGenerator.tsx`:
```typescript
import { useSubscription } from '@/hooks/useSubscription';
import { UsageIndicator } from '@/components/subscription/UsageIndicator';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { SubscriptionService } from '@/services/subscriptionService';

export default function QuizGenerator() {
  const { user } = useAuth();
  const { subscription, loading: subLoading, refresh } = useSubscription();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // ... existing state ...
  
  const handleGenerateQuiz = async () => {
    if (!user) {
      await signIn();
      return;
    }
    
    // Check if user can generate quiz
    if (!subscription?.canGenerateQuiz) {
      setShowUpgradePrompt(true);
      return;
    }
    
    try {
      setGenerating(true);
      
      // Generate quiz (existing logic)
      // ...
      
      // Increment usage counter
      await SubscriptionService.incrementQuizGeneration(user.uid);
      refresh(); // Refresh subscription data
      
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Usage Indicator */}
      {subscription && !subscription.canGenerateQuiz && (
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <UsageIndicator
                used={subscription.quizGenerationsUsed}
                limit={subscription.quizGenerationsLimit}
                type="quiz"
                onUpgrade={() => setShowUpgradePrompt(true)}
              />
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Existing quiz generator UI */}
      {/* ... */}
      
      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        reason="quiz_limit"
      />
    </div>
  );
}
```

### 6.2 Add Premium Badge to Navigation

Modify `src/pages/Layout.tsx`:
```typescript
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';

export default function Layout() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  return (
    <div>
      <nav>
        {/* Existing nav items */}
        
        {user && subscription && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user.displayName}</span>
            <SubscriptionBadge tier={subscription.tier} size="sm" />
          </div>
        )}
      </nav>
      
      {/* Rest of layout */}
    </div>
  );
}
```

---

## 📊 Phase 7: Analytics & Admin Tools (Week 5-6)

### 7.1 Subscription Analytics Dashboard

Create `src/pages/admin/SubscriptionAnalytics.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import { DollarSign, Users, TrendingUp, CreditCard } from 'lucide-react';

export default function SubscriptionAnalytics() {
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    mrr: 0,
    freeUsers: 0,
    premiumUsers: 0,
    churnRate: 0
  });
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    // Load all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => doc.data());
    
    const freeUsers = users.filter(u => u.subscriptionTier === 'free').length;
    const premiumUsers = users.filter(u => 
      ['premium', 'family', 'teacher'].includes(u.subscriptionTier)
    ).length;
    
    // Calculate MRR (simplified - assumes all premium at $12.99)
    const mrr = premiumUsers * 12.99;
    
    setStats({
      totalSubscribers: premiumUsers,
      mrr,
      freeUsers,
      premiumUsers,
      churnRate: 0 // Calculate from cancellation data
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Subscription Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.mrr.toFixed(2)}</div>
              <p className="text-xs text-gray-500">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.premiumUsers}</div>
              <p className="text-xs text-gray-500">Active subscribers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Free Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.freeUsers}</div>
              <p className="text-xs text-gray-500">Free tier users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((stats.premiumUsers / (stats.freeUsers + stats.premiumUsers)) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">Free to Premium</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Implementation Checklist

### Week 1-2: Foundation
- [ ] Update Firestore schema (users, subscriptions, usageTracking)
- [ ] Update security rules
- [ ] Create TypeScript types
- [ ] Build SubscriptionService
- [ ] Build useSubscription hook
- [ ] Test usage tracking locally

### Week 3: UI Components
- [ ] Build UsageIndicator component
- [ ] Build UpgradePrompt modal
- [ ] Build SubscriptionBadge component
- [ ] Add usage indicators to QuizGenerator
- [ ] Add premium badges to navigation
- [ ] Test UI components

### Week 3-4: Stripe Integration
- [ ] Set up Stripe account
- [ ] Create products and prices
- [ ] Install Stripe packages
- [ ] Build createCheckoutSession function
- [ ] Build handleStripeWebhook function
- [ ] Build StripeService
- [ ] Test checkout flow in test mode

### Week 4: Pricing Page
- [ ] Build Pricing page
- [ ] Add monthly/yearly toggle
- [ ] Integrate with Stripe checkout
- [ ] Add FAQ section
- [ ] Test pricing page

### Week 4-5: Paywalls
- [ ] Add paywall to QuizGenerator
- [ ] Add paywall to save quiz feature
- [ ] Add paywall to PDF download
- [ ] Add paywall to analytics
- [ ] Test all paywalls

### Week 5-6: Analytics & Polish
- [ ] Build subscription analytics dashboard
- [ ] Add conversion tracking
- [ ] Test end-to-end flow
- [ ] Fix bugs
- [ ] Deploy to production

---

## 🚀 Launch Strategy

### Pre-Launch (1 week before)
1. Email existing users about new premium features
2. Offer "early adopter" discount (20% off for first 100 subscribers)
3. Create launch announcement
4. Prepare support documentation

### Launch Day
1. Deploy freemium features
2. Send launch email to all users
3. Post on social media
4. Monitor for issues
5. Respond to user feedback

### Post-Launch (First month)
1. Track conversion metrics daily
2. A/B test pricing page
3. Gather user feedback
4. Iterate on premium features
5. Optimize upgrade prompts

---

## 📈 Success Metrics

### Key Performance Indicators (KPIs)
- **Conversion Rate**: Target 5-10% (free to premium)
- **MRR Growth**: Target $2,000 in first 3 months
- **Churn Rate**: Target <5% monthly
- **Trial Conversion**: Target 40% (trial to paid)
- **Average Revenue Per User (ARPU)**: Target $12.99

### Tracking Tools
- Stripe Dashboard for revenue
- Firebase Analytics for user behavior
- Custom dashboard for conversion funnel
- Google Analytics for traffic sources

---

## 🎯 Next Steps

1. **Review this spec** with your team
2. **Set up Stripe account** and create test products
3. **Start with Phase 1** (database schema)
4. **Build incrementally** - test each phase before moving on
5. **Launch with 7-day free trial** to reduce friction

Want me to start implementing any specific phase? I can create the actual code files and help you deploy!
