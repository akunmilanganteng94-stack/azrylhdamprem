import React, { useState } from 'react';
import { 
  Home, 
  ShoppingBag, 
  History, 
  Wallet, 
  User
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onOpenOrder: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenOrder,
}) => {
  const [clickedTab, setClickedTab] = useState<string | null>(null);

  const handleTabClick = (tab: string, isOrder = false) => {
    setClickedTab(tab);
    setTimeout(() => setClickedTab(null), 300);

    if (isOrder) {
      onOpenOrder();
    } else {
      onChangeTab(tab);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'HOME', icon: Home, isOrder: false },
    { id: 'order', label: 'ORDER', icon: ShoppingBag, isOrder: true },
    { id: 'orders', label: 'RIWAYAT', icon: History, isOrder: false },
    { id: 'deposit', label: 'SALDO', icon: Wallet, isOrder: false },
    { id: 'profile', label: 'PROFIL', icon: User, isOrder: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-2 sm:px-6 safe-area-pb">
      <div className="max-w-md sm:max-w-xl mx-auto h-16 sm:h-18 flex items-center justify-between px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAnimating = clickedTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id, item.isOrder)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all select-none cursor-pointer relative ${
                isActive 
                  ? 'text-emerald-600 font-black' 
                  : 'text-slate-400 hover:text-slate-700 font-semibold'
              } ${isAnimating ? 'scale-90' : 'active:scale-95'}`}
            >
              {/* Active top pill indicator with glow */}
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-in fade-in zoom-in-75 duration-200" />
              )}

              {/* Icon Container with subtle animation */}
              <div className={`p-1.5 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-600 scale-110 shadow-xs' 
                  : 'hover:bg-slate-100 text-slate-500'
              }`}>
                <Icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
              </div>

              <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight transition-all duration-200 ${
                isActive ? 'text-emerald-700 font-black scale-105' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
