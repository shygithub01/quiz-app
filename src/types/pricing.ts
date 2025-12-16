// Dynamic Pricing & Discount Management

export interface DynamicPricing {
  id: string;
  tier: 'premium' | 'family' | 'teacher';
  interval: 'month' | 'year';
  basePrice: number; // Original price
  currentPrice: number; // Active price (after discount)
  stripePriceId: string;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  createdBy: string; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountCode {
  id: string;
  code: string; // e.g., "STUDENT50", "LAUNCH25"
  type: 'percentage' | 'fixed_amount';
  value: number; // 50 for 50%, or 5.00 for $5 off
  applicableTiers: ('premium' | 'family' | 'teacher')[];
  maxUses: number; // -1 for unlimited
  currentUses: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date | null;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  userId: string;
  subscriptionId: string;
  stripeRefundId: string | null;
  amount: number;
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'admin_discretion' | 'other';
  reasonDetails: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  processedBy: string; // Admin user ID
  processedAt: Date;
  createdAt: Date;
}

export interface PricingHistory {
  id: string;
  tier: 'premium' | 'family' | 'teacher';
  interval: 'month' | 'year';
  oldPrice: number;
  newPrice: number;
  reason: string;
  changedBy: string;
  changedAt: Date;
}

export interface PromotionalCampaign {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  applicableTiers: ('premium' | 'family' | 'teacher')[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  targetAudience: 'all' | 'new_users' | 'existing_free' | 'lapsed_premium';
  createdBy: string;
  createdAt: Date;
}

// Admin pricing configuration
export interface AdminPricingConfig {
  canAdjustPrices: boolean;
  canCreateDiscounts: boolean;
  canIssueRefunds: boolean;
  canViewPricingHistory: boolean;
  maxDiscountPercentage: number; // e.g., 90 (can't discount more than 90%)
  maxRefundAmount: number; // e.g., 500 (can't refund more than $500 without approval)
}

// Pricing calculation result
export interface PriceCalculation {
  basePrice: number;
  discountAmount: number;
  discountCode?: string;
  finalPrice: number;
  savings: number;
  savingsPercentage: number;
}
