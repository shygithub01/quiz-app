# Phase 2 - Stripe Integration & Cloud Functions DEPLOYED ✅

**Deployment Date**: December 16, 2025  
**Git Tag**: Phase-2-Complete  
**Live URL**: https://quizapp-42057.web.app

---

## What Was Deployed

### 1. Stripe Service (Frontend)
**File**: `src/services/stripeService.ts`
- `createCheckoutSession()` - Redirect users to Stripe checkout
- `createPortalSession()` - Allow users to manage subscriptions

### 2. Subscription Hook
**File**: `src/hooks/useSubscription.ts`
- React hook to track subscription status
- Automatically loads user's subscription data
- Provides `isPremium`, `canGenerateQuiz`, `canSaveQuiz` flags
- Includes `refresh()` method to reload subscription after changes

### 3. UI Components
**Files**: `src/components/subscription/`
- `UsageIndicator.tsx` - Shows quiz generation/save limits with progress bar
- `UpgradePrompt.tsx` - Modal to encourage Premium upgrades
- `SubscriptionBadge.tsx` - Display Premium/Family/Teacher badges

### 4. Cloud Functions (Stripe Integration)
**File**: `functions/index.js`

**New Functions**:
- `createCheckoutSession` - Create Stripe checkout session
  - URL: https://us-central1-quizapp-42057.cloudfunctions.net/createCheckoutSession
  - Handles 7-day free trial for new users
  - Creates/retrieves Stripe customer
  
- `createPortalSession` - Create Stripe customer portal session
  - URL: https://us-central1-quizapp-42057.cloudfunctions.net/createPortalSession
  - Allows users to manage subscriptions, update payment methods, cancel
  
- `handleStripeWebhook` - Process Stripe webhook events
  - URL: https://us-central1-quizapp-42057.cloudfunctions.net/handleStripeWebhook
  - Handles: subscription.created, subscription.updated, subscription.deleted
  - Handles: invoice.payment_succeeded, invoice.payment_failed
  - Updates Firestore with subscription status

**Webhook Handlers**:
- `handleSubscriptionUpdate()` - Update user to Premium when subscription activates
- `handleSubscriptionCanceled()` - Downgrade user to Free when subscription ends
- `handlePaymentSucceeded()` - Log successful payments
- `handlePaymentFailed()` - Mark user as past_due on payment failure

### 5. Environment Variables
**File**: `.env.local`
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_premium_monthly
VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_premium_yearly
```

---

## How It Works

### Subscription Flow

1. **User Clicks "Upgrade to Premium"**
   - Frontend calls `StripeService.createCheckoutSession(priceId)`
   - Cloud Function creates Stripe checkout session
   - User redirected to Stripe checkout page

2. **User Completes Payment**
   - Stripe sends webhook to `handleStripeWebhook`
   - Webhook handler updates Firestore:
     - Sets `subscriptionTier: 'premium'`
     - Sets `quizGenerationsLimit: -1` (unlimited)
     - Sets `savedQuizzesLimit: -1` (unlimited)
     - Creates subscription document

3. **User Generates Quiz**
   - Frontend checks `subscription.canGenerateQuiz`
   - If Free tier and limit reached, shows `UpgradePrompt`
   - If Premium, allows unlimited generation
   - Increments usage counter via `SubscriptionService.trackQuizGeneration()`

4. **User Manages Subscription**
   - User clicks "Manage Subscription"
   - Frontend calls `StripeService.createPortalSession()`
   - User redirected to Stripe customer portal
   - Can update payment method, cancel subscription, view invoices

### Webhook Events

**customer.subscription.created/updated**:
```javascript
{
  userId: 'user_123',
  subscriptionTier: 'premium',
  subscriptionStatus: 'active',
  quizGenerationsLimit: -1,
  savedQuizzesLimit: -1,
  stripeSubscriptionId: 'sub_xxx',
  stripeCustomerId: 'cus_xxx'
}
```

**customer.subscription.deleted**:
```javascript
{
  userId: 'user_123',
  subscriptionTier: 'free',
  subscriptionStatus: 'canceled',
  quizGenerationsLimit: 5,
  savedQuizzesLimit: 3
}
```

**invoice.payment_failed**:
```javascript
{
  userId: 'user_123',
  subscriptionStatus: 'past_due'
}
```

---

## Setup Instructions

### 1. Create Stripe Account
1. Go to https://stripe.com
2. Create account (use test mode for development)
3. Get API keys from Dashboard → Developers → API keys

### 2. Create Products in Stripe Dashboard
1. Go to Products → Add Product
2. Create "Premium Monthly" - $12.99/month
   - Copy Price ID → `VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID`
3. Create "Premium Yearly" - $99/year
   - Copy Price ID → `VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID`

### 3. Configure Webhook
1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://us-central1-quizapp-42057.cloudfunctions.net/handleStripeWebhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

### 4. Update Environment Variables
Update `.env.local` with your Stripe keys:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_YOUR_MONTHLY_PRICE_ID
VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_YOUR_YEARLY_PRICE_ID
```

### 5. Set Firebase Environment Config
```bash
firebase functions:config:set stripe.secret_key="sk_test_YOUR_SECRET_KEY"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
```

### 6. Redeploy
```bash
npm run build
firebase deploy
```

---

## Testing Checklist

### Test Checkout Flow
- [ ] Click "Upgrade to Premium" button
- [ ] Redirected to Stripe checkout
- [ ] Complete payment with test card: `4242 4242 4242 4242`
- [ ] Redirected back to success page
- [ ] User upgraded to Premium in Firestore
- [ ] Subscription document created

### Test Webhooks
- [ ] Stripe sends `customer.subscription.created` webhook
- [ ] Cloud Function processes webhook successfully
- [ ] User document updated with Premium status
- [ ] Subscription document created

### Test Usage Limits
- [ ] Free user sees "5/5 used" indicator
- [ ] Free user blocked from generating more quizzes
- [ ] Upgrade prompt shown when limit reached
- [ ] Premium user sees "Unlimited" indicator
- [ ] Premium user can generate unlimited quizzes

### Test Customer Portal
- [ ] Click "Manage Subscription"
- [ ] Redirected to Stripe customer portal
- [ ] Can view subscription details
- [ ] Can update payment method
- [ ] Can cancel subscription
- [ ] Cancellation triggers webhook
- [ ] User downgraded to Free

### Test Stripe Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`

---

## What's Next

**Phase 3**: Frontend UI Integration
- Create Pricing page with tier comparison
- Integrate usage indicators into QuizGenerator
- Add Premium badges to navigation
- Create subscription management page
- Add paywalls to premium features (PDF download, analytics)

**Phase 4**: Usage Enforcement
- Enforce quiz generation limits in Cloud Functions
- Track usage in `usageTracking` collection
- Auto-reset monthly usage on 1st of month
- Add usage analytics for admins

---

## Important Notes

### Security
- Stripe webhook signature verification prevents unauthorized requests
- Cloud Functions verify Firebase Auth tokens before creating sessions
- Firestore rules prevent users from modifying their own subscription status

### Trial Period
- New users get 7-day free trial automatically
- `hasUsedTrial` flag prevents multiple trials
- Trial tracked in `trialStartDate` and `trialEndDate`

### Subscription Status
- `active` - Subscription is active and paid
- `trialing` - In free trial period
- `past_due` - Payment failed, grace period
- `canceled` - Subscription canceled
- `expired` - Subscription ended

### Graceful Degradation
- Stripe functions check if Stripe is configured
- Return 503 error if Stripe keys missing
- Allows deployment without Stripe setup
- Add keys later when ready to accept payments

---

## Troubleshooting

### Webhook Not Receiving Events
1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check Cloud Function logs: `firebase functions:log`
4. Test webhook in Stripe Dashboard → Webhooks → Send test webhook

### Checkout Session Creation Fails
1. Verify Stripe publishable key is correct
2. Check price ID exists in Stripe Dashboard
3. Verify user is authenticated
4. Check Cloud Function logs

### User Not Upgraded After Payment
1. Check webhook was received (Stripe Dashboard → Webhooks)
2. Check Cloud Function logs for errors
3. Verify Firestore rules allow Cloud Functions to write
4. Check subscription document was created

---

**Status**: ✅ DEPLOYED TO PRODUCTION  
**Next Step**: Phase 3 - Frontend UI Integration
