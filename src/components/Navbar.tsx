import React from 'react';
import { 
  Menu, 
  Bell, 
  ShieldCheck, 
  User
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenSidebar: () => void;
  onOpenProfile: () => void;
  onOpenDeposit: () => void;
  onOpenAdmin: () => void;
  onRequestNotifications?: () => void;
  hasNotificationPermission?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSidebar,
  onOpenProfile,
  onOpenDeposit,
  onOpenAdmin,
  onRequestNotifications,
  hasNotificationPermission
}) => {
  const { profile, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-1.5 sm:p-2 -ml-1 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors focus:outline-hidden cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="cursor-pointer shrink min-w-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size="md" />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Admin Switcher Button */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-black transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* Web Push Notification Bell */}
          <button
            type="button"
            onClick={onRequestNotifications}
            className={`p-1.5 sm:p-2 rounded-xl transition-all relative cursor-pointer ${
              hasNotificationPermission 
                ? 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50' 
                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 animate-pulse'
            }`}
            title={hasNotificationPermission ? 'Notifikasi Aktif' : 'Klik untuk mengaktifkan notifikasi web'}
          >
            <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            {!hasNotificationPermission && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
            )}
          </button>

          {/* Profile Quick Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 pl-1 sm:pl-1.5 pr-1.5 sm:pr-2 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/60 transition-colors cursor-pointer"
            aria-label="User Profile"
          >
            <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-green-400 text-white font-black flex items-center justify-center text-xs shadow-xs">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </div>
            <span className="hidden md:inline-block text-xs font-bold max-w-[100px] truncate text-slate-700">
              {profile?.name || 'Profil'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
