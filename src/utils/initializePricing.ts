// Initialize default pricing in Firestore
// Run this once to set up initial pricing

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';

export async function initializeDefaultPricing(adminUserId: string): Promise<void> {
  try {
    console.log('🎯 Initializing default pricing...');

    // Premium Monthly
    const premiumMonthlyRef = doc(collection(db, 'dynamicPricing'));
    await setDoc(premiumMonthlyRef, {
      tier: 'premium',
      interval: 'month',
      basePrice: 12.99,
      currentPrice: 12.99,
      stripePriceId: process.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
      isActive: true,
      effectiveFrom: Timestamp.now(),
      effectiveUntil: null,
      createdBy: adminUserId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Premium Yearly
    const premiumYearlyRef = doc(collection(db, 'dynamicPricing'));
    await setDoc(premiumYearlyRef, {
      tier: 'premium',
      interval: 'year',
      basePrice: 99.0,
      currentPrice: 99.0,
      stripePriceId: process.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
      isActive: true,
      effectiveFrom: Timestamp.now(),
      effectiveUntil: null,
      createdBy: adminUserId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Default pricing initialized');
    console.log('  - Premium Monthly: $12.99');
    console.log('  - Premium Yearly: $99.00');
  } catch (error) {
    console.error('❌ Error initializing pricing:', error);
    throw error;
  }
}

// Example discount codes to create
export async function createExampleDiscounts(adminUserId: string): Promise<void> {
  try {
    console.log('🎯 Creating example discount codes...');

    // LAUNCH50 - 50% off for first 100 users
    const launch50Ref = doc(collection(db, 'discountCodes'));
    await setDoc(launch50Ref, {
      code: 'LAUNCH50',
      type: 'percentage',
      value: 50,
      applicableTiers: ['premium'],
      maxUses: 100,
      currentUses: 0,
      isActive: true,
      validFrom: Timestamp.now(),
      validUntil: Timestamp.fromDate(new Date('2025-03-31')),
      description: 'Launch promotion - 50% off for first 100 users',
      createdBy: adminUserId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // STUDENT25 - 25% off for students (unlimited)
    const student25Ref = doc(collection(db, 'discountCodes'));
    await setDoc(student25Ref, {
      code: 'STUDENT25',
      type: 'percentage',
      value: 25,
      applicableTiers: ['premium'],
      maxUses: -1, // unlimited
      currentUses: 0,
      isActive: true,
      validFrom: Timestamp.now(),
      validUntil: null,
      description: 'Student discount - 25% off (verify .edu email)',
      createdBy: adminUserId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Example discount codes created');
    console.log('  - LAUNCH50: 50% off (100 uses)');
    console.log('  - STUDENT25: 25% off (unlimited)');
  } catch (error) {
    console.error('❌ Error creating discount codes:', error);
    throw error;
  }
}
