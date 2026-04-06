// Upgrade Prompt Modal - Encourage users to upgrade to Premium

import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  reason: 'quiz_limit' | 'save_limit' | 'premium_feature';
}

export function UpgradePrompt({ open, onClose, reason }: UpgradePromptProps) {
  const navigate = useNavigate();
  
  if (!open) return null;
  
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-center text-2xl font-bold mb-2">
          {message.title}
        </h2>
        <p className="text-center text-gray-600 mb-6">
          {message.description}
        </p>
        
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
      </div>
    </div>
  );
}
