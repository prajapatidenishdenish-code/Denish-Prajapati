import React from 'react';
import { Home, PlaySquare, Wallet as WalletIcon, Users, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab, openAuthModal }) => {
  const { user, wallet } = useAuth();

  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'earn', label: 'Earn', icon: PlaySquare, highlight: true },
    { id: 'wallet', label: 'Wallet', icon: WalletIcon },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'profile', label: 'Profile', icon: User, requiresAuth: true },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.requiresAuth && !user) {
                openAuthModal('login');
              } else {
                setCurrentTab(item.id);
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isActive ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.highlight ? (
              <div className="w-10 h-10 -mt-4 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center text-slate-950">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-amber-400">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            ) : (
              <Icon className="w-5 h-5" />
            )}
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
