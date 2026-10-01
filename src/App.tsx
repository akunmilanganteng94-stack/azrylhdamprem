import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SidebarDrawer } from './components/SidebarDrawer';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { OrderView } from './components/OrderView';
import { MyOrdersView } from './components/MyOrdersView';
import { DepositView } from './components/DepositView';
import { ReferralView } from './components/ReferralView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { AdminPanel } from './components/AdminPanel';
import { KatalogModal } from './components/KatalogModal';
import { ApkModal } from './components/ApkModal';
import { Logo } from './components/Logo';
import { listenProducts, listenSystemSettings, INITIAL_PRODUCTS, DEFAULT_SETTINGS } from './services/firestoreService';
import { requestNotificationPermission, setupForegroundMessageListener } from './firebase/messaging';
import type { ProductItem, SystemSettings } from './types';

const MainApp: React.FC = () => {
  const { currentUser, profile, loading: authLoading, isAdmin } = useAuth();
  const { showSuccess, showInfo } = useToast();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [orderInitialProduct, setOrderInitialProduct] = useState<'am' | 'hd'>('am');
  const [katalogOpen, setKatalogOpen] = useState<boolean>(false);
  const [apkOpen, setApkOpen] = useState<boolean>(false);
  const [hasNotifPermission, setHasNotifPermission] = useState<boolean>(false);

  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  // Check URL path for /admin or /admin.html
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('admin')) {
      setActiveTab('admin');
    }
  }, []);

  // Listen to Products & Settings
  useEffect(() => {
    const unsubProducts = listenProducts(setProducts);
    const unsubSettings = listenSystemSettings(setSettings);

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // Foreground message listener
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setHasNotifPermission(true);
    }

    const unsubMessaging = setupForegroundMessageListener((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Notifikasi AZRYLPREM';
      const body = payload.notification?.body || payload.data?.body || '';
      showSuccess(title, body);
    });

    return () => {
      if (typeof unsubMessaging === 'function') (unsubMessaging as any)();
    };
  }, [showSuccess]);

  const handleRequestNotifications = async () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      showInfo('Notifikasi Aktif', 'Pemberitahuan push sudah aktif pada peramban ini.');
      setHasNotifPermission(true);
      return;
    }

    const token = await requestNotificationPermission();
    if (token) {
      setHasNotifPermission(true);
      showSuccess('Notifikasi Aktif!', 'Anda akan menerima kabar status order dan deposit secara langsung.');
    } else {
      showInfo('Info Notifikasi', 'Izin notifikasi tidak diberikan.');
    }
  };

  const handleOpenOrder = (product: 'am' | 'hd' = 'am') => {
    setOrderInitialProduct(product);
    setActiveTab('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId: string) => {
    if (productId === 'am_prem') {
      handleOpenOrder('am');
    } else if (productId === 'hd_foto') {
      handleOpenOrder('hd');
    } else {
      handleOpenOrder('am');
    }
  };

  // Auth Loading Skeleton
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Logo size="lg" />
        <div className="mt-6 flex items-center gap-2 text-emerald-600 font-bold text-sm">
          <span className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          <span>Memuat Sistem AZRYLPREM...</span>
        </div>
      </div>
    );
  }

  // Not logged in: Show Auth View (clean, green, no demo buttons)
  if (!currentUser) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white pb-16 sm:pb-20">
      {/* Sticky Header / Navbar */}
      <Navbar
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenDeposit={() => setActiveTab('deposit')}
        onOpenAdmin={() => setActiveTab('admin')}
        onRequestNotifications={handleRequestNotifications}
        hasNotificationPermission={hasNotifPermission}
      />

      {/* Sidebar Drawer */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApkModal={() => setApkOpen(true)}
        settings={settings}
      />

      {/* Main View Router with fluid transition effect */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8">
        <div key={activeTab} className="animate-in fade-in zoom-in-98 duration-200 ease-out">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenDeposit={() => setActiveTab('deposit')}
              onOpenOrder={handleOpenOrder}
              onOpenKatalog={() => setKatalogOpen(true)}
              onNavigateTab={setActiveTab}
              onOpenApkModal={() => setApkOpen(true)}
              products={products}
              settings={settings}
            />
          )}

          {/* TAB 2: ORDER UTAMA (NEW) */}
          {activeTab === 'order' && (
            <OrderView
              initialProduct={orderInitialProduct}
              onOpenDeposit={() => setActiveTab('deposit')}
              onNavigateToMyOrders={() => setActiveTab('orders')}
              settings={settings}
            />
          )}

          {/* TAB 3: ORDER SAYA (NEW) */}
          {activeTab === 'orders' && (
            <MyOrdersView onNavigateToOrder={() => handleOpenOrder('am')} />
          )}

          {/* TAB 4: DEPOSIT (SIMPLIFIED) */}
          {activeTab === 'deposit' && (
            <DepositView
              onSuccessNavigate={() => setActiveTab('orders')}
              settings={settings}
            />
          )}

          {/* TAB 5: PROGRAM REFERRAL (BONUS DIUBAH JADI REFERRAL) */}
          {activeTab === 'referral' && (
            <ReferralView />
          )}

          {/* TAB 6: KATALOG PRODUK */}
          {activeTab === 'katalog' && (
            <div className="space-y-6 pb-20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Katalog Produk & Layanan</h2>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs font-bold text-emerald-600 underline cursor-pointer"
                >
                  Kembali ke Dashboard
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {p.badge || 'PRODUK'}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-2">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                      <p className="text-2xl font-black font-mono text-emerald-600 mt-4">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectProduct(p.id)}
                      className="mt-6 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Buka Menu Order
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: RIWAYAT MUTASI SALDO */}
          {activeTab === 'mutasi' && (
            <HistoryView initialTab="mutations" />
          )}

          {/* TAB 8: PROFILE / PROFIL */}
          {(activeTab === 'profile' || activeTab === 'menu') && (
            <ProfileView settings={settings} />
          )}

          {/* TAB 9: ADMIN PANEL */}
          {activeTab === 'admin' && (
            <AdminPanel onBackToUser={() => setActiveTab('dashboard')} />
          )}
        </div>
      </main>

      {/* Modern Bottom Navigation (HOME | ORDER | RIWAYAT | SALDO | MENU) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenOrder={() => handleOpenOrder('am')}
      />

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 bg-white/50 text-center text-xs text-slate-500 mb-16 sm:mb-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} AZRYLPREM. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
            <a
              href={settings?.whatsappChannel || 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 transition-colors"
            >
              Saluran WhatsApp
            </a>
            <span>•</span>
            <a
              href={settings?.promoUrl || 'https://www.azryl.my.id/'}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 transition-colors"
            >
              Promo Job Gmail
            </a>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <KatalogModal
        isOpen={katalogOpen}
        onClose={() => setKatalogOpen(false)}
        products={products}
        onSelectProduct={handleSelectProduct}
      />

      <ApkModal
        isOpen={apkOpen}
        onClose={() => setApkOpen(false)}
        settings={settings}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
