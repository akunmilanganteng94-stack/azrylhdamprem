import React, { useState } from 'react';
import { 
  Users, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  ArrowRight, 
  Coins, 
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah } from '../utils/formatter';
import { addReferralBonus } from '../services/firestoreService';

export const ReferralView: React.FC = () => {
  const { profile, refreshUserProfile } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputReferral, setInputReferral] = useState('');
  const [loadingClaim, setLoadingClaim] = useState(false);

  // Generate deterministic referral code from user UID
  const userRefCode = profile?.uid ? `AZP-${profile.uid.slice(0, 6).toUpperCase()}` : 'AZP-MEMBER';
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?ref=${userRefCode}` 
    : `https://azrylprem.com/?ref=${userRefCode}`;

  const validReferralCount = (profile as any)?.referralCount || 0;
  const targetReferrals = 20;
  const rewardAmount = 10000;
  const progressPercent = Math.min(100, Math.round((validReferralCount / targetReferrals) * 100));

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userRefCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showSuccess('Kode Disalin!', `Kode referral ${userRefCode} disalin ke clipboard.`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showSuccess('Link Disalin!', 'Link referral siap dibagikan ke teman Anda.');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Halo! Gunakan kode referral *${userRefCode}* saat order di AZRYLPREM untuk mendapatkan layanan Alight Motion Premium murah Rp500 & HD Foto AI: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const cleanCode = inputReferral.trim().toUpperCase();
    if (!cleanCode) {
      showWarning('Kode Kosong', 'Silakan masukkan kode referral teman Anda.');
      return;
    }
    if (cleanCode === userRefCode) {
      showError('Tidak Valid', 'Anda tidak dapat menggunakan kode referral milik sendiri.');
      return;
    }

    setLoadingClaim(true);
    try {
      await addReferralBonus(profile.uid, cleanCode, 500);
      await refreshUserProfile();
      showSuccess('Bonus Diklaim!', 'Selamat! Anda berhasil terhubung dengan referral teman Anda.');
      setInputReferral('');
    } catch (err: any) {
      showError('Gagal Klaim', err.message || 'Kode referral tidak valid atau sudah pernah digunakan.');
    } finally {
      setLoadingClaim(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Hero Card: 20 Teman = 10K (Wajib Beli Produk) */}
      <div className="bg-gradient-to-tr from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            <span>PROGRAM REFERRAL 20 TEMAN = 10K</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Undang 20 Teman, Dapatkan Rp 10.000!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-lg leading-relaxed">
            Ajak 20 teman bergabung dengan kode referral Anda. Setiap teman yang <strong className="text-white">wajib membeli produk</strong> (Alight Motion atau HD Foto) akan terhitung 1 poin valid menuju bonus <strong>Rp 10.000</strong>!
          </p>
        </div>
      </div>

      {/* Progress Milestone Card: 20 Teman 10K */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">
              Progress Referral Anda
            </h2>
          </div>
          <span className="text-xs font-black font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
            Target Hadiah: {formatRupiah(rewardAmount)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>{validReferralCount} dari {targetReferrals} Teman Beli Produk</span>
            <span className="font-mono text-emerald-600">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-2.5">
          <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Syarat Wajib:</strong> Teman yang mendaftar menggunakan kode referral Anda <strong>harus melakukan pembelian produk</strong> minimal 1 kali agar referral dihitung sah.
          </p>
        </div>
      </div>

      {/* Your Referral Code Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Kode Referral Anda
        </span>

        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-900">
              {userRefCode}
            </span>
            <span className="block text-[11px] text-emerald-700 mt-0.5">
              Bagikan kode ini ke teman atau grup WhatsApp
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Tersalin' : 'Salin Kode'}</span>
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              title="Share to WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Share Link */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Tautan Undangan Langsung
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl shrink-0 transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Claim a Friend's Referral Code */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <span>Punya Kode Referral Teman?</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Masukkan kode referral teman yang mengundang Anda untuk mengaktifkan hubungan referral.
          </p>
        </div>

        <form onSubmit={handleClaimReferral} className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <input
            type="text"
            required
            value={inputReferral}
            onChange={(e) => setInputReferral(e.target.value)}
            placeholder="Contoh: AZP-ABC123"
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold font-mono text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={loadingClaim}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {loadingClaim ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Hubungkan Kode</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Referral Program Rules & Perks */}
      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
          Syarat & Ketentuan Program Referral:
        </h3>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>20 Teman = Rp 10.000</strong>: Bonus saldo Rp 10.000 otomatis diberikan ketika Anda berhasil mengajak 20 teman yang melakukan order.</li>
          <li><strong>Wajib Beli Produk</strong>: Teman yang diajak wajib melakukan pembelian produk digital (AM Premium / HD Foto) agar terverifikasi sah.</li>
          <li>Bonus saldo dapat langsung digunakan untuk belanja atau order akun baru!</li>
        </ul>
      </div>
    </div>
  );
};
