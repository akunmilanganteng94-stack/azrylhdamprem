import React from 'react';
import { 
  LayoutDashboard, 
  WalletCards, 
  Tag, 
  ShoppingBag, 
  History, 
  ReceiptText, 
  UserCheck, 
  Smartphone, 
  MessageCircle, 
  Sparkles, 
  LogOut, 
  X, 
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Gift
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { calculateUserRank, formatRupiah } from '../utils/formatter';
import type { SystemSettings } from '../types';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenApkModal: () => void;
  settings?: SystemSettings | null;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenApkModal,
  settings
}) => {
  const { profile, isAdmin, logout } = useAuth();
  const rank = calculateUserRank(profile?.totalSpent || 0);

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'order', label: 'Order Layanan', icon: ShoppingBag, badge: 'Utama' },
    { id: 'orders', label: 'Order Saya', icon: History },
    { id: 'deposit', label: 'Isi Saldo', icon: WalletCards, badge: 'Instant' },
    { id: 'referral', label: 'Program Referral', icon: Gift, badge: 'Rp500' },
    { id: 'katalog', label: 'Daftar Harga', icon: Tag },
    { id: 'mutasi', label: 'Mutasi Saldo', icon: ReceiptText },
    { id: 'profile', label: 'Profil Akun', icon: UserCheck },
  ];

  const waLink = settings?.whatsappChannel || 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C';
  const promoLink = settings?.promoUrl || 'https://www.azryl.my.id/';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-white border-r border-slate-100 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold tracking-wider uppercase">
            <span>{isAdmin ? 'AZRYLPREM • ADMIN PANEL' : 'AZRYLPREM • USER PANEL'}</span>
          </div>

          {/* User mini badge inside drawer */}
          {profile && (
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-300 font-medium">Masuk Sebagai</p>
                  <p className="text-sm font-bold text-white truncate max-w-[170px]">{profile.name}</p>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  {profile.role.toUpperCase()}
                </span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-sans">Saldo:</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(profile.balance || 0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
            Menu Utama
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Switcher in Drawer */}
          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className={`w-full mt-2 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin Dashboard</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-500" />
            </button>
          )}

          <div className="pt-4 mt-2 border-t border-slate-100">
            <p className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              Layanan & Komunitas
            </p>

            {/* Download APK Mobile */}
            <button
              onClick={() => {
                onOpenApkModal();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>Download APK Mobile</span>
              </div>
              <span className="text-[10px] text-slate-400">Android</span>
            </button>

            {/* Saluran WhatsApp */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>Saluran Informasi</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Promo Job Gmail */}
            <a
              href={promoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Promo Job Gmail</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Drawer Footer / Logout Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
