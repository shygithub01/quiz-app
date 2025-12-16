// Pricing Service - Dynamic pricing, discounts, and refunds

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment as firestoreIncrement,
} from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import {
  DynamicPricing,
  DiscountCode,
  PricingHistory,
  PromotionalCampaign,
  PriceCalculation,
} from '@/types/pricing';

export class PricingService {
  /**
   * Get current active pricing for a tier
   */
  static async getCurrentPricing(
    tier: 'premium' | 'family' | 'teacher',
    interval: 'month' | 'year'
  ): Promise<DynamicPricing | null> {
    try {
      const pricingRef = collection(db, 'dynamicPricing');
      const q = query(
        pricingRef,
        where('tier', '==', tier),
        where('interval', '==', interval),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        effectiveFrom: data.effectiveFrom.toDate(),
        effectiveUntil: data.effectiveUntil?.toDate() || null,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as DynamicPricing;
    } catch (error) {
      console.error('Error getting current pricing:', error);
      return null;
    }
  }

  /**
   * Update pricing (admin only)
   */
  static async updatePricing(
    tier: 'premium' | 'family' | 'teacher',
    interval: 'month' | 'year',
    newPrice: number,
    adminUserId: string,
    reason: string
  ): Promise<void> {
    try {
      const currentPricing = await this.getCurrentPricing(tier, interval);

      if (!currentPricing) {
        throw new Error('No active pricing found for this tier');
      }

      // Save pricing history
      const historyRef = doc(collection(db, 'pricingHistory'));
      await setDoc(historyRef, {
        tier,
        interval,
        oldPrice: currentPricing.currentPrice,
        newPrice,
        reason,
        changedBy: adminUserId,
        changedAt: Timestamp.now(),
      });

      // Update current pricing
      const pricingRef = doc(db, 'dynamicPricing', currentPricing.id);
      await updateDoc(pricingRef, {
        currentPrice: newPrice,
        updatedAt: Timestamp.now(),
      });

      console.log(`✅ Pricing updated for ${tier} ${interval}: $${newPrice}`);
    } catch (error) {
      console.error('Error updating pricing:', error);
      throw error;
    }
  }

  /**
   * Validate and apply discount code
   */
  static async validateDiscountCode(code: string): Promise<DiscountCode | null> {
    try {
      const discountRef = collection(db, 'discountCodes');
      const q = query(discountRef, where('code', '==', code.toUpperCase()));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      const discount: DiscountCode = {
        id: doc.id,
        ...data,
        validFrom: data.validFrom.toDate(),
        validUntil: data.validUntil?.toDate() || null,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as DiscountCode;

      // Validate discount
      const now = new Date();

      if (!discount.isActive) {
        console.log('❌ Discount code is inactive');
        return null;
      }

      if (now < discount.validFrom) {
        console.log('❌ Discount code not yet valid');
        return null;
      }

      if (discount.validUntil && now > discount.validUntil) {
        console.log('❌ Discount code expired');
        return null;
      }

      if (discount.maxUses !== -1 && discount.currentUses >= discount.maxUses) {
        console.log('❌ Discount code max uses reached');
        return null;
      }

      return discount;
    } catch (error) {
      console.error('Error validating discount code:', error);
      return null;
    }
  }

  /**
   * Calculate final price with discount
   */
  static async calculatePrice(
    tier: 'premium' | 'family' | 'teacher',
    interval: 'month' | 'year',
    discountCode?: string
  ): Promise<PriceCalculation> {
    const pricing = await this.getCurrentPricing(tier, interval);

    if (!pricing) {
      throw new Error('Pricing not found');
    }

    let discountAmount = 0;
    let appliedCode: string | undefined;

    if (discountCode) {
      const discount = await this.validateDiscountCode(discountCode);

      if (discount && discount.applicableTiers.includes(tier)) {
        if (discount.type === 'percentage') {
          discountAmount = (pricing.currentPrice * discount.value) / 100;
        } else {
          discountAmount = discount.value;
        }
        appliedCode = discount.code;
      }
    }

    const finalPrice = Math.max(0, pricing.currentPrice - discountAmount);
    const savings = pricing.basePrice - finalPrice;
    const savingsPercentage = (savings / pricing.basePrice) * 100;

    return {
      basePrice: pricing.basePrice,
      discountAmount,
      discountCode: appliedCode,
      finalPrice,
      savings,
      savingsPercentage,
    };
  }

  /**
   * Apply discount code (increment usage)
   */
  static async applyDiscountCode(code: string): Promise<void> {
    try {
      const discountRef = collection(db, 'discountCodes');
      const q = query(discountRef, where('code', '==', code.toUpperCase()));

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          currentUses: firestoreIncrement(1),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error applying discount code:', error);
    }
  }

  /**
   * Create discount code (admin only)
   */
  static async createDiscountCode(
    code: string,
    type: 'percentage' | 'fixed_amount',
    value: number,
    applicableTiers: ('premium' | 'family' | 'teacher')[],
    maxUses: number,
    validFrom: Date,
    validUntil: Date | null,
    description: string,
    adminUserId: string
  ): Promise<string> {
    try {
      const discountRef = doc(collection(db, 'discountCodes'));

      await setDoc(discountRef, {
        code: code.toUpperCase(),
        type,
        value,
        applicableTiers,
        maxUses,
        currentUses: 0,
        isActive: true,
        validFrom: Timestamp.fromDate(validFrom),
        validUntil: validUntil ? Timestamp.fromDate(validUntil) : null,
        description,
        createdBy: adminUserId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log(`✅ Discount code created: ${code}`);
      return discountRef.id;
    } catch (error) {
      console.error('Error creating discount code:', error);
      throw error;
    }
  }

  /**
   * Issue refund (admin only)
   */
  static async issueRefund(
    userId: string,
    subscriptionId: string,
    amount: number,
    reason: string,
    reasonDetails: string,
    adminUserId: string
  ): Promise<string> {
    try {
      const refundRef = doc(collection(db, 'refunds'));

      await setDoc(refundRef, {
        userId,
        subscriptionId,
        stripeRefundId: null, // Will be set by Stripe webhook
        amount,
        reason,
        reasonDetails,
        status: 'pending',
        processedBy: adminUserId,
        processedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      console.log(`✅ Refund issued for user ${userId}: $${amount}`);
      return refundRef.id;
    } catch (error) {
      console.error('Error issuing refund:', error);
      throw error;
    }
  }

  /**
   * Get all active discount codes (admin only)
   */
  static async getAllDiscountCodes(): Promise<DiscountCode[]> {
    try {
      const discountRef = collection(db, 'discountCodes');
      const q = query(discountRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          validFrom: data.validFrom.toDate(),
          validUntil: data.validUntil?.toDate() || null,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as DiscountCode;
      });
    } catch (error) {
      console.error('Error getting discount codes:', error);
      return [];
    }
  }

  /**
   * Get pricing history (admin only)
   */
  static async getPricingHistory(): Promise<PricingHistory[]> {
    try {
      const historyRef = collection(db, 'pricingHistory');
      const q = query(historyRef, orderBy('changedAt', 'desc'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          changedAt: data.changedAt.toDate(),
        } as PricingHistory;
      });
    } catch (error) {
      console.error('Error getting pricing history:', error);
      return [];
    }
  }

  /**
   * Create promotional campaign (admin only)
   */
  static async createPromotionalCampaign(
    name: string,
    description: string,
    discountPercentage: number,
    applicableTiers: ('premium' | 'family' | 'teacher')[],
    startDate: Date,
    endDate: Date,
    targetAudience: 'all' | 'new_users' | 'existing_free' | 'lapsed_premium',
    adminUserId: string
  ): Promise<string> {
    try {
      const campaignRef = doc(collection(db, 'promotionalCampaigns'));

      await setDoc(campaignRef, {
        name,
        description,
        discountPercentage,
        applicableTiers,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        isActive: true,
        targetAudience,
        createdBy: adminUserId,
        createdAt: Timestamp.now(),
      });

      console.log(`✅ Promotional campaign created: ${name}`);
      return campaignRef.id;
    } catch (error) {
      console.error('Error creating promotional campaign:', error);
      throw error;
    }
  }

  /**
   * Get active promotional campaigns
   */
  static async getActivePromotions(): Promise<PromotionalCampaign[]> {
    try {
      const campaignRef = collection(db, 'promotionalCampaigns');
      const q = query(campaignRef, where('isActive', '==', true));

      const snapshot = await getDocs(q);
      const now = new Date();

      return snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            createdAt: data.createdAt.toDate(),
          } as PromotionalCampaign;
        })
        .filter((campaign) => now >= campaign.startDate && now <= campaign.endDate);
    } catch (error) {
      console.error('Error getting active promotions:', error);
      return [];
    }
  }
}
