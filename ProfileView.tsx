import React, { useState } from 'react';
import { 
  Mail, 
  Bell, 
  Sparkles, 
  LogOut, 
  Check, 
  Edit3, 
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah, calculateUserRank } from '../utils/formatter';
import { requestNotificationPermission } from '../firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { SystemSettings } from '../types';

interface ProfileViewProps {
  settings?: SystemSettings | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ settings }) => {
  const { profile, logout } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const rank = calculateUserRank(profile?.totalSpent || 0);

  const handleSaveName = async () => {
    if (!profile || !nameInput.trim()) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { name: nameInput.trim() });
      setIsEditing(false);
      showSuccess('Profil Diperbarui', 'Nama profil Anda berhasil disimpan.');
    } catch (err: any) {
      showError('Gagal Menyimpan Nama', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPush = async () => {
    setNotifLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token && profile) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, { fcmToken: token });
        showSuccess('Notifikasi Aktif!', 'Anda akan menerima notifikasi deposit & order langsung di browser.');
      } else {
        showInfo('Izin Notifikasi', 'Izin notifikasi tidak diberikan atau lingkungan browser membatasi Web Push.');
      }
    } catch (err: any) {
      showError('Gagal Mengaktifkan Notifikasi', err.message);
    } finally {
      setNotifLoading(false);
    }
  };

  const waChannel = settings?.whatsappChannel || 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-green-500 to-teal-400 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-3 py-1 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                    {profile?.name || 'Member AZRYL'}
                  </h1>
                  <button
                    onClick={() => {
                      setNameInput(profile?.name || '');
                      setIsEditing(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Ubah Nama"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              <span>{profile?.email}</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                profile?.role === 'admin' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {profile?.role === 'admin' ? '👑 Administrator' : '⭐ Active Member'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Level {rank.level} • {rank.name}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Stat Quick Snapshot */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Saldo Wallet</span>
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 mt-1 block">
              {formatRupiah(profile?.balance || 0)}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Belanja</span>
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1 block">
              {formatRupiah(profile?.totalSpent || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Account Settings & Preferences */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Pengaturan Aplikasi
        </h3>

        {/* Web Push Notification Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">Notifikasi Push Browser</p>
              <p className="text-[11px] text-slate-400">Dapatkan update instan ketika deposit & pesanan berhasil.</p>
            </div>
          </div>
          <button
            onClick={handleRequestPush}
            disabled={notifLoading}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {notifLoading ? 'Mengaktifkan...' : 'Aktifkan'}
          </button>
        </div>

        {/* WhatsApp Channel */}
        <a
          href={waChannel}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50/50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">Saluran Resmi WhatsApp</p>
              <p className="text-[11px] text-slate-400">Informasi restock, update sistem & promo spesial.</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </a>

        {/* App Info */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Versi Platform</p>
              <p className="text-[11px] text-slate-400">AZRYLPREM Web & PWA</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {settings?.apkVersion || 'v2.0.0'}
          </span>
        </div>
      </div>

      {/* Logout Action Card */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun (Logout)</span>
        </button>
      </div>
    </div>
  );
};
