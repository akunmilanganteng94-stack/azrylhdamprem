import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ShoppingBag, 
  History, 
  Tag, 
  Gift, 
  HelpCircle, 
  ReceiptText, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Crown, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, getGreeting, calculateUserRank } from '../utils/formatter';
import { listenUserOrders, listenAllUsers } from '../services/firestoreService';
import type { ProductItem, OrderRecord, SystemSettings, UserProfile } from '../types';

interface DashboardViewProps {
  onOpenDeposit: () => void;
  onOpenOrder: (product?: 'am' | 'hd') => void;
  onOpenKatalog: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenApkModal: () => void;
  products: ProductItem[];
  settings?: SystemSettings | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenDeposit,
  onOpenOrder,
  onOpenKatalog,
  onNavigateTab,
  products,
  settings
}) => {
  const { profile } = useAuth();
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!profile) return;
    const unsubUser = listenUserOrders(profile.uid, (orders) => {
      setUserOrders(orders);
    });
    const unsubUsers = listenAllUsers((users) => {
      setAllUsers(users);
    });
    return () => {
      unsubUser();
      unsubUsers();
    };
  }, [profile]);

  const greeting = getGreeting();
  const userName = profile?.name || 'Member';
  const balance = profile?.balance || 0;
  const rank = calculateUserRank(profile?.totalSpent || 0);

  // Top Sultan calculations
  const topSultans = [...allUsers]
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, 5);

  const quickMenus = [
    {
      id: 'order',
      title: 'ORDER',
      subtitle: 'Beli Baru',
      icon: ShoppingBag,
      color: 'bg-emerald-600 text-white',
      badge: 'Utama',
      onClick: () => onOpenOrder('am')
    },
    {
      id: 'pantau',
      title: 'ORDER SAYA',
      subtitle: 'Riwayat',
      icon: History,
      color: 'bg-slate-800 text-white',
      onClick: () => onNavigateTab('orders')
    },
    {
      id: 'top-up',
      title: 'TOP UP',
      subtitle: 'Isi Saldo',
      icon: Wallet,
      color: 'bg-teal-600 text-white',
      badge: 'Instan',
      onClick: () => onOpenDeposit()
    },
    {
      id: 'referral',
      title: 'REFERRAL',
      subtitle: '20 Teman 10K',
      icon: Gift,
      color: 'bg-green-600 text-white',
      badge: '10K',
      onClick: () => onNavigateTab('referral')
    },
    {
      id: 'katalog',
      title: 'KATALOG',
      subtitle: 'Daftar Harga',
      icon: Tag,
      color: 'bg-slate-700 text-white',
      onClick: () => onOpenKatalog()
    },
    {
      id: 'mutasi',
      title: 'MUTASI',
      subtitle: 'Laporan Saldo',
      icon: ReceiptText,
      color: 'bg-emerald-700 text-white',
      onClick: () => onNavigateTab('mutasi')
    },
    {
      id: 'bantuan',
      title: 'BANTUAN',
      subtitle: 'Saluran Info',
      icon: HelpCircle,
      color: 'bg-sky-600 text-white',
      onClick: () => {
        if (settings?.whatsappChannel) {
          window.open(settings.whatsappChannel, '_blank');
        }
      }
    },
    {
      id: 'profil',
      title: 'PROFIL',
      subtitle: 'Akun Saya',
      icon: User,
      color: 'bg-slate-900 text-white',
      onClick: () => onNavigateTab('profile')
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-7 pb-24 animate-in fade-in duration-300">
      {/* 1. Header Greeting (Minimalist & Clean) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Selamat {greeting}, {userName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola transaksi, pantau saldo, dan gunakan tools premium AZRYLPREM.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onOpenOrder('am')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Layanan</span>
          </button>
        </div>
      </div>

      {/* 2. Wallet Card in Dark Slate + Emerald Green */}
      <div className="bg-gradient-to-tr from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/10 border border-emerald-900/40 relative overflow-hidden transition-all duration-300 hover:shadow-emerald-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
                AZRYLPREM WALLET
              </span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
                title={showBalance ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Total Balance
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1">
                {showBalance ? formatRupiah(balance) : 'Rp ••••••••'}
              </div>
            </div>

            {/* Status & Level Progress */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {profile?.role === 'admin' ? 'ADMIN OWNER' : 'MEMBER AKTIF'}
              </span>
              <span className="text-slate-400">Level {rank.level} ({rank.name})</span>
            </div>

            {/* XP Bar */}
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>XP {profile?.xp || 25}</span>
                <span>Level Berikutnya</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, ((profile?.xp || 25) % 100)))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Wallet CTA buttons */}
          <div className="flex flex-row md:flex-col items-center sm:items-stretch gap-2.5">
            <button
              type="button"
              onClick={onOpenDeposit}
              className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Isi Saldo (Top Up)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span>Order Saya</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ORDER LAYANAN UTAMA - KECIL 1 BARIS 2 PRODUK */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
              ORDER LAYANAN UTAMA
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenOrder('am')}
            className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Semua Layanan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1 BARIS 2 PRODUK (COMPACT & SLEEK) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* Produk 1: Alight Motion Premium */}
          <div 
            onClick={() => onOpenOrder('am')}
            className="bg-white rounded-3xl p-3.5 sm:p-4.5 border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all active:scale-98 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-0 relative">
                  <img 
                    src="https://1000logos.net/wp-content/uploads/2024/03/Alight-Motion-Logo.png" 
                    alt="Alight Motion Logo" 
                    className="w-full h-full object-cover scale-125"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('bg-emerald-600');
                    }}
                  />
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                  HOT
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                Alight motion premium
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                Max 5 akun / proses
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-600">
                  Rp500
                </span>
                <span className="text-[9px] text-slate-400 block -mt-0.5">/ akun</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white font-black text-[10px] sm:text-xs shadow-xs transition flex items-center gap-1">
                <span>Order</span>
                <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </span>
            </div>
          </div>

          {/* Produk 2: HD Foto */}
          <div 
            onClick={() => onOpenOrder('hd')}
            className="bg-white rounded-3xl p-3.5 sm:p-4.5 border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all active:scale-98 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2.5">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[9px] font-black uppercase">
                  AI
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                HD FOTO RESOLUTION
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                Jernihkan foto 2x / 4x
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black font-mono text-emerald-600">
                  Rp50
                </span>
                <span className="text-[9px] text-slate-400 block -mt-0.5">/ foto</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 group-hover:bg-slate-800 text-white font-black text-[10px] sm:text-xs shadow-xs transition flex items-center gap-1">
                <span>Jernihkan</span>
                <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Grid Menu Cepat */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Menu Cepat
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
          {quickMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.id}
                type="button"
                onClick={menu.onClick}
                className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all active:scale-95 flex flex-col items-center text-center relative group cursor-pointer"
              >
                {menu.badge && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[8px] sm:text-[9px] font-black uppercase">
                    {menu.badge}
                  </span>
                )}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${menu.color} shadow-xs mb-1.5 transition-transform group-hover:rotate-6`}>
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                  {menu.title}
                </span>
                <span className="text-[9px] text-slate-400 font-medium hidden sm:block mt-0.5">
                  {menu.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Statistik Transaksi & Pesanan Pengguna */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 block">Total Pesanan</span>
          <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 mt-1 block">
            {userOrders.length}
          </span>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            {userOrders.filter(o => o.status === 'SUCCESS').length} Sukses
          </span>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 block">Total Belanja</span>
          <span className="text-lg sm:text-2xl font-black font-mono text-emerald-600 mt-1 block">
            {formatRupiah(profile?.totalSpent || 0)}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 block">Akumulasi</span>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 block">Saldo Aktif</span>
          <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 mt-1 block">
            {formatRupiah(balance)}
          </span>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 block">Siap Order</span>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 block">Status Akun</span>
          <span className="text-sm sm:text-lg font-black text-slate-900 mt-1 block truncate">
            {rank.name}
          </span>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 block">Level {rank.level}</span>
        </div>
      </section>

      {/* 6. Top Sultan Pengguna */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
              Top Sultan Pengguna
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Leaderboard Belanja
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {topSultans.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 col-span-full text-center">Belum ada data sultan.</p>
          ) : (
            topSultans.map((sultan, index) => (
              <div 
                key={sultan.uid || index}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    index === 0 ? 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300' :
                    index === 1 ? 'bg-slate-300 text-slate-900' :
                    index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-bold text-slate-800 truncate">
                    {sultan.name || 'Member'}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-600 shrink-0 ml-2">
                  {formatRupiah(sultan.totalSpent || 0)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
