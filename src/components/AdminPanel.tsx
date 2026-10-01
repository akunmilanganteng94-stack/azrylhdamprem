import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  WalletCards, 
  ShoppingBag, 
  Tag, 
  Settings, 
  Terminal, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah, formatDate } from '../utils/formatter';
import { 
  listenAllUsers, 
  listenAllDeposits, 
  listenAllOrders, 
  listenProducts, 
  listenSystemSettings,
  approveDeposit, 
  rejectDeposit, 
  adminAdjustUserBalance, 
  adminToggleUserRole,
  updateProduct,
  createProduct,
  updateSystemSettings
} from '../services/firestoreService';
import type { UserProfile, DepositRecord, OrderRecord, ProductItem, SystemSettings } from '../types';

interface AdminPanelProps {
  onBackToUser: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToUser }) => {
  const { profile, isAdmin } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'deposits' | 'orders' | 'products' | 'api-tools' | 'settings' | 'apk'
  >('dashboard');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // User search & edit modal
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editBalanceAmount, setEditBalanceAmount] = useState<number>(0);
  const [editBalanceReason, setEditBalanceReason] = useState<string>('Top Up Manual oleh Admin');
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<Partial<SystemSettings>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Product edit modal
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // API testing
  const [testingEndpoint, setTestingEndpoint] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Listen to Firestore
  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = listenAllUsers(setUsers);
    const unsubDeposits = listenAllDeposits(setDeposits);
    const unsubOrders = listenAllOrders(setOrders);
    const unsubProducts = listenProducts(setProducts);
    const unsubSettings = listenSystemSettings((data) => {
      setSettings(data);
      setSettingsForm(data);
    });

    return () => {
      unsubUsers();
      unsubDeposits();
      unsubOrders();
      unsubProducts();
      unsubSettings();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Halaman Admin Panel hanya dapat diakses oleh akun dengan wewenang Admin AZRYLPREM.
        </p>
        <button
          onClick={onBackToUser}
          className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs"
        >
          Kembali ke Dashboard User
        </button>
      </div>
    );
  }

  // Dashboard Stats Calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.orderCount && u.orderCount > 0).length || totalUsers;
  const totalTransactions = orders.length;
  const totalOmzet = orders.filter(o => o.status === 'SUCCESS').reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalDeposits = deposits.filter(d => d.status === 'APPROVED').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingDeposits = deposits.filter(d => d.status === 'PENDING');

  // Handle Approve Deposit
  const handleApproveDeposit = async (depId: string) => {
    if (!profile) return;
    try {
      await approveDeposit(depId, profile.uid);
      showSuccess('Deposit Disetujui!', 'Saldo user telah bertambah dan status diset APPROVED.');
    } catch (err: any) {
      showError('Gagal Approve Deposit', err.message);
    }
  };

  // Handle Reject Deposit
  const handleRejectDeposit = async (depId: string) => {
    if (!profile) return;
    const reason = prompt('Masukkan alasan penolakan deposit:', 'Data transfer tidak valid / mutasi tidak ditemukan');
    if (reason === null) return;
    try {
      await rejectDeposit(depId, profile.uid, reason);
      showWarning('Deposit Ditolak', 'Status deposit diubah menjadi REJECTED.');
    } catch (err: any) {
      showError('Gagal Menolak Deposit', err.message);
    }
  };

  // Handle Edit User Balance
  const handleSaveBalanceAdjustment = async () => {
    if (!selectedUser || !profile) return;
    if (editBalanceAmount === 0) {
      showWarning('Nominal Kosong', 'Masukkan nominal penyesuaian saldo.');
      return;
    }

    try {
      await adminAdjustUserBalance({
        adminUid: profile.uid,
        targetUid: selectedUser.uid,
        deltaAmount: editBalanceAmount,
        reason: editBalanceReason || 'Penyesuaian Manual Admin'
      });
      showSuccess('Saldo Berhasil Diubah', `Saldo ${selectedUser.name} disesuaikan.`);
      setBalanceModalOpen(false);
      setEditBalanceAmount(0);
    } catch (err: any) {
      showError('Gagal Mengubah Saldo', err.message);
    }
  };

  // Handle Save System Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await updateSystemSettings(settingsForm);
      showSuccess('Pengaturan Disimpan', 'Konfigurasi sistem berhasil diperbarui.');
    } catch (err: any) {
      showError('Gagal Menyimpan Pengaturan', err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Handle Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      if (isNewProduct) {
        await createProduct({
          name: editingProduct.name,
          description: editingProduct.description,
          price: Number(editingProduct.price),
          active: editingProduct.active ?? true,
          apiEndpoint: editingProduct.apiEndpoint,
          badge: editingProduct.badge || 'NEW'
        });
        showSuccess('Produk Ditambahkan', 'Produk baru siap digunakan.');
      } else {
        await updateProduct({
          ...editingProduct,
          price: Number(editingProduct.price)
        });
        showSuccess('Produk Diperbarui', 'Perubahan produk berhasil disimpan.');
      }
      setEditingProduct(null);
    } catch (err: any) {
      showError('Gagal Menyimpan Produk', err.message);
    }
  };

  // Test Endpoint
  const handleTestEndpoint = async (url: string) => {
    setTestingEndpoint(url);
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Admin Top Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">AZRYLPREM ADMIN PANEL</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-bold uppercase border border-purple-400/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola user, transaksi, konfirmasi deposit, dan konfigurasi API Zyvor.
            </p>
          </div>
        </div>

        <button
          onClick={onBackToUser}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke User Panel</span>
        </button>
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
          { id: 'users', label: '2. User', icon: Users, badge: totalUsers },
          { id: 'deposits', label: '3. Deposit', icon: WalletCards, badge: pendingDeposits.length, badgeColor: 'bg-amber-500' },
          { id: 'orders', label: '4. Order', icon: ShoppingBag, badge: orders.length },
          { id: 'products', label: '5. Produk', icon: Tag },
          { id: 'api-tools', label: '6. API Tools', icon: Terminal },
          { id: 'settings', label: '7. Pengaturan Sistem', icon: Settings },
          { id: 'apk', label: '8. APK', icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${tab.badgeColor || 'bg-slate-700'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats 7 Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total User</span>
              <p className="text-xl font-black font-mono text-slate-900 mt-1">{totalUsers}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">User Aktif</span>
              <p className="text-xl font-black font-mono text-indigo-600 mt-1">{activeUsers}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Transaksi</span>
              <p className="text-xl font-black font-mono text-slate-900 mt-1">{totalTransactions}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Deposit</span>
              <p className="text-base sm:text-lg font-black font-mono text-emerald-600 mt-1">{formatRupiah(totalDeposits)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Deposit Pending</span>
              <p className="text-xl font-black font-mono text-amber-600 mt-1">{pendingDeposits.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Produk Aktif</span>
              <p className="text-xl font-black font-mono text-violet-700 mt-1">{products.filter(p => p.active).length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Omzet</span>
              <p className="text-base sm:text-lg font-black font-mono text-purple-700 mt-1">{formatRupiah(totalOmzet)}</p>
            </div>
          </div>

          {/* Pending Deposits Alert */}
          {pendingDeposits.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                  <h3 className="text-sm font-bold text-amber-950">
                    Ada {pendingDeposits.length} Deposit Menunggu Persetujuan Admin
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('deposits')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                >
                  Buka Menu Deposit
                </button>
              </div>

              <div className="divide-y divide-amber-200/60">
                {pendingDeposits.slice(0, 3).map((dep) => (
                  <div key={dep.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold font-mono text-slate-900">{formatRupiah(dep.amount)}</span>
                      <span className="text-slate-500 ml-2">oleh {dep.senderName} ({dep.method})</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveDeposit(dep.id!)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectDeposit(dep.id!)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick System Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Status Sistem & Gateway
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Status Layanan Deposit:</span>
                <p className={`font-bold mt-1 ${settings?.depositOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {settings?.depositOpen ? '● Dibuka (Normal)' : '● Ditutup Sementara'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Akun DANA Aktif:</span>
                <p className="font-bold text-slate-900 mt-1 font-mono">
                  {settings?.danaNumber} a.n. {settings?.danaName}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">API Zyvor Connected:</span>
                <p className="font-bold text-emerald-600 mt-1">
                  ● Server Proxy Operasional
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Manajemen Pengguna ({users.length})</h3>
              <p className="text-xs text-slate-500">Lihat profil, ubah role admin/member, atau edit saldo pengguna.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Saldo</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users
                  .filter(u => 
                    !userSearch || 
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{u.email}</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-violet-700">
                        {formatRupiah(u.balance || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setBalanceModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold"
                        >
                          Edit Saldo
                        </button>
                        <button
                          onClick={() => {
                            const newRole = u.role === 'admin' ? 'member' : 'admin';
                            if (confirm(`Ubah role ${u.name} menjadi ${newRole.toUpperCase()}?`)) {
                              adminToggleUserRole(u.uid, newRole);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                        >
                          Ubah Role
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DEPOSIT APPROVAL */}
      {activeTab === 'deposits' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Kelola Pengajuan Deposit ({deposits.length})</h3>
              <p className="text-xs text-slate-500">Setujui untuk menambah saldo user secara instan atau tolak pengajuan.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Pengirim</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-slate-400">{formatDate(dep.createdAt)}</td>
                    <td className="py-3 px-4 font-black font-mono text-slate-900">
                      {formatRupiah(dep.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{dep.senderName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{dep.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {dep.method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dep.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        dep.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {dep.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApproveDeposit(dep.id!)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectDeposit(dep.id!)}
                            className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden space-y-4 p-5 sm:p-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Semua Pesanan Pengguna ({orders.length})</h3>
            <p className="text-xs text-slate-500">Riwayat seluruh order AM Prem & HD Foto yang masuk.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID / Waktu</th>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Jumlah</th>
                  <th className="py-3 px-4">Total Biaya</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">User UID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono">
                      <p className="text-slate-900 font-bold">{ord.id?.slice(0, 8)}...</p>
                      <p className="text-[10px] text-slate-400">{formatDate(ord.createdAt)}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{ord.productName}</td>
                    <td className="py-3 px-4">{ord.quantity}x</td>
                    <td className="py-3 px-4 font-mono font-bold text-violet-700">
                      {formatRupiah(ord.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[100px]">
                      {ord.uid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Pengelolaan Produk & Harga</h3>
              <p className="text-xs text-slate-500">Ubah harga, status aktif/nonaktif, dan API endpoint.</p>
            </div>

            <button
              onClick={() => {
                setEditingProduct({
                  id: '',
                  name: '',
                  description: '',
                  price: 1000,
                  active: true,
                  apiEndpoint: ''
                });
                setIsNewProduct(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    ID: {p.id}
                  </span>
                  <span className={`text-xs font-bold ${p.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {p.active ? '● Aktif' : '○ Nonaktif'}
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-900">{p.name}</h4>
                <p className="text-xs text-slate-500">{p.description}</p>
                <p className="text-sm font-black font-mono text-purple-700">
                  {formatRupiah(p.price)}
                </p>

                <div className="text-[11px] text-slate-400 font-mono truncate">
                  Endpoint: {p.apiEndpoint}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setIsNewProduct(false);
                    }}
                    className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Produk</span>
                  </button>
                  <button
                    onClick={() => {
                      updateProduct({ ...p, active: !p.active });
                    }}
                    className={`px-3 py-2 rounded-xl font-bold text-xs ${
                      p.active ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {p.active ? 'Tutup' : 'Buka'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. API TOOLS */}
      {activeTab === 'api-tools' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Konfigurasi & Uji API Zyvor</h3>
            <p className="text-xs text-slate-500">
              API dipanggil melalui Server Proxy backend AZRYLPREM untuk menghindari kendala CORS dan melindungi kredensial.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">AM Prem BulkV3 Endpoint</h4>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">
                    {settings?.amApi || 'https://api.zyvor.my.id/api/am/bulkv3'}
                  </p>
                </div>
                <button
                  onClick={() => handleTestEndpoint(settings?.amApi || 'https://api.zyvor.my.id/api/am/bulkv3')}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs"
                >
                  Uji Koneksi
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">HD Foto UpscaleV2 Endpoint</h4>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">
                    {settings?.hdApi || 'https://api.zyvor.my.id/api/imagehd/upscalev2'}
                  </p>
                </div>
                <button
                  onClick={() => handleTestEndpoint(settings?.hdApi || 'https://api.zyvor.my.id/api/imagehd/upscalev2')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Uji Koneksi
                </button>
              </div>
            </div>

            {testLoading && (
              <p className="text-xs text-purple-700 animate-pulse font-bold">
                Menguji endpoint: {testingEndpoint}...
              </p>
            )}

            {testResult && (
              <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl space-y-1">
                <p className="font-bold text-white">Hasil Uji Endpoint:</p>
                <pre className="whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl shadow-xs border border-slate-100 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Pengaturan Sistem Global</h3>
              <p className="text-xs text-slate-500">Konfigurasi nomor deposit, QRIS, link eksternal, dan nama brand.</p>
            </div>
            <button
              type="submit"
              disabled={settingsSaving}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{settingsSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Deposit</label>
              <select
                value={settingsForm.depositOpen ? 'true' : 'false'}
                onChange={(e) => setSettingsForm({ ...settingsForm, depositOpen: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="true">Buka (Pengguna dapat deposit)</option>
                <option value="false">Tutup Sementara (Maintenance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Website</label>
              <input
                type="text"
                value={settingsForm.siteName || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nominal Minimum Deposit (Rp)</label>
              <input
                type="number"
                value={settingsForm.minDeposit || 1000}
                onChange={(e) => setSettingsForm({ ...settingsForm, minDeposit: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nominal Maksimum Deposit (Rp)</label>
              <input
                type="number"
                value={settingsForm.maxDeposit || 1000000}
                onChange={(e) => setSettingsForm({ ...settingsForm, maxDeposit: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nomor Akun DANA</label>
              <input
                type="text"
                value={settingsForm.danaNumber || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, danaNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Pemilik Akun DANA</label>
              <input
                type="text"
                value={settingsForm.danaName || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, danaName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL Gambar QRIS</label>
              <input
                type="text"
                value={settingsForm.qrisUrl || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, qrisUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Link Saluran WhatsApp</label>
              <input
                type="text"
                value={settingsForm.whatsappChannel || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsappChannel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Link Promo Job Gmail</label>
              <input
                type="text"
                value={settingsForm.promoUrl || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, promoUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </form>
      )}

      {/* 8. APK MANAGEMENT */}
      {activeTab === 'apk' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl shadow-xs border border-slate-100 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Manajemen Aplikasi Android (APK)</h3>
              <p className="text-xs text-slate-500">Kelola rilis APK agar pengguna dapat mengunduh langsung dari aplikasi.</p>
            </div>
            <button
              type="submit"
              disabled={settingsSaving}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Info APK</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama APK</label>
              <input
                type="text"
                value={settingsForm.apkName || 'AZRYLPREM Mobile'}
                onChange={(e) => setSettingsForm({ ...settingsForm, apkName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Versi APK</label>
              <input
                type="text"
                value={settingsForm.apkVersion || 'v1.0.0'}
                onChange={(e) => setSettingsForm({ ...settingsForm, apkVersion: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Link Download APK (Kosongkan jika masih dipersiapkan)
              </label>
              <input
                type="url"
                value={settingsForm.apkUrl || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, apkUrl: e.target.value })}
                placeholder="https://... atau direct download .apk"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-xs text-purple-900">
              <p className="font-bold">Status Tampilan Pengguna:</p>
              <p className="mt-1">
                {settingsForm.apkUrl 
                  ? 'Pengguna akan melihat tombol aktif "Download APK".' 
                  : 'Pengguna akan melihat informasi "APK sedang dipersiapkan."'}
              </p>
            </div>
          </div>
        </form>
      )}

      {/* Modal: Edit User Balance */}
      {balanceModalOpen && selectedUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900">Edit Saldo: {selectedUser.name}</h3>
            <div className="text-xs text-slate-500">
              Saldo saat ini: <strong className="font-mono text-slate-800">{formatRupiah(selectedUser.balance || 0)}</strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nominal Tambah / Kurang (Gunakan tanda - untuk mengurangi)
              </label>
              <input
                type="number"
                value={editBalanceAmount || ''}
                onChange={(e) => setEditBalanceAmount(Number(e.target.value))}
                placeholder="+50000 atau -10000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alasan Penyesuaian
              </label>
              <input
                type="text"
                value={editBalanceReason}
                onChange={(e) => setEditBalanceReason(e.target.value)}
                placeholder="Misal: Bonus event, koreksi deposit"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBalanceModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBalanceAdjustment}
                className="flex-1 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs shadow-md"
              >
                Simpan Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit / Add Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSaveProduct} className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              {isNewProduct ? 'Tambah Produk Baru' : `Edit: ${editingProduct.name}`}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Produk</label>
              <input
                type="text"
                required
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deskripsi</label>
              <textarea
                rows={2}
                required
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={editingProduct.active ? 'true' : 'false'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">API Endpoint URL</label>
              <input
                type="text"
                required
                value={editingProduct.apiEndpoint}
                onChange={(e) => setEditingProduct({ ...editingProduct, apiEndpoint: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs shadow-md"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
