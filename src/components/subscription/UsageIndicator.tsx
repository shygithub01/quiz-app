// Usage Indicator - Show quiz generation and save limits

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertCircle } from 'lucide-react';

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
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${
            used >= limit ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {used >= limit && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>Limit reached</span>
          </div>
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
