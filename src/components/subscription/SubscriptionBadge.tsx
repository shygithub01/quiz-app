// Subscription Badge - Display user's subscription tier

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
