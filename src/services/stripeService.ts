// Stripe Service - Handle checkout and subscription management

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

let stripeInstance: Stripe | null = null;

async function getStripe(): Promise<Stripe> {
  if (!stripeInstance) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (!key) {
      throw new Error('Stripe publishable key not configured');
    }
    stripeInstance = await loadStripe(key);
    if (!stripeInstance) {
      throw new Error('Failed to load Stripe');
    }
  }
  return stripeInstance;
}

export class StripeService {
  /**
   * Create Stripe checkout session and redirect to checkout
   */
  static async createCheckoutSession(priceId: string): Promise<void> {
    try {
      const functions = getFunctions();
      const createCheckout = httpsCallable<
        { priceId: string; successUrl: string; cancelUrl: string },
        { sessionId: string }
      >(functions, 'createCheckoutSession');
      
      const response = await createCheckout({
        priceId,
        successUrl: `${window.location.origin}/account/subscription?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`
      });
      
      const { sessionId } = response.data;
      
      const stripe = await getStripe();
      
      // Redirect to Stripe Checkout
      // @ts-ignore - redirectToCheckout exists but types may be outdated
      const result = await stripe.redirectToCheckout({ sessionId });
      
      if (result && result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create customer portal session for subscription management
   */
  static async createPortalSession(): Promise<void> {
    try {
      const functions = getFunctions();
      const createPortal = httpsCallable<
        { returnUrl: string },
        { url: string }
      >(functions, 'createPortalSession');
      
      const response = await createPortal({
        returnUrl: `${window.location.origin}/account/subscription`
      });
      
      const { url } = response.data;
      
      // Redirect to Stripe customer portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }
}
