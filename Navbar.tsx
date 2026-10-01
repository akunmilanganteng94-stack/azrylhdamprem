import React from 'react';
import { 
  Menu, 
  Bell, 
  Wallet, 
  ShieldCheck, 
  User
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../utils/formatter';

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
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-2 -ml-1 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors focus:outline-hidden cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size="md" />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Balance Chip */}
          {profile && (
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-emerald-950 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
              title="Isi Saldo"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 group-hover:rotate-12 transition-transform">
                <Wallet className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="text-xs sm:text-sm font-bold font-mono tracking-tight text-emerald-300">
                {formatRupiah(profile.balance || 0)}
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-800/80 px-1.5 py-0.5 rounded-full font-bold text-emerald-100">
                + Top Up
              </span>
            </button>
          )}

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
            className={`p-2 rounded-xl transition-all relative cursor-pointer ${
              hasNotificationPermission 
                ? 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50' 
                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 animate-pulse'
            }`}
            title={hasNotificationPermission ? 'Notifikasi Aktif' : 'Klik untuk mengaktifkan notifikasi web'}
          >
            <Bell className="w-5 h-5" />
            {!hasNotificationPermission && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
            )}
          </button>

          {/* Profile Quick Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/60 transition-colors cursor-pointer"
            aria-label="User Profile"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-green-400 text-white font-black flex items-center justify-center text-xs shadow-xs">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
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
