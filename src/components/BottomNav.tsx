// Standalone BottomNav — used on full-screen pages that bypass Layout
// Shows on lobby + results phases; hidden during active quiz

import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Zap, Sparkles } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/past-quizzes', label: 'History', icon: BookOpen },
  { to: '/live-modes', label: 'Live', icon: Zap },
  { to: '/pricing', label: 'Pricing', icon: Sparkles },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
      style={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #3730a3 100%)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[60px] transition-all duration-200 ${
                isActive ? 'bg-white/15' : 'opacity-70'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/70'}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
