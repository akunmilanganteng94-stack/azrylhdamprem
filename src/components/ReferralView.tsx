import React, { useState } from 'react';
import { 
  Users, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah } from '../utils/formatter';

export const ReferralView: React.FC = () => {
  const { profile } = useAuth();
  const { showSuccess } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 pb-24 sm:pb-28 animate-in fade-in duration-300">
      {/* Hero Card: 20 Teman = 10K (Wajib Beli Produk) */}
      <div className="bg-gradient-to-tr from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            <span>PROGRAM REFERRAL 20 TEMAN = 10K</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Ajak 20 Teman, Dapatkan Saldo <span className="text-emerald-400">Rp 10.000</span>
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
            Ajak 20 teman bergabung dengan kode referral Anda. Setiap teman yang <strong className="text-white">wajib membeli produk</strong> (Alight Motion atau HD Foto) akan terhitung 1 poin valid menuju bonus <strong>Rp 10.000</strong>!
          </p>

          {/* Progress Tracker toward 20 friends */}
          <div className="pt-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Progress Referral Anda</span>
              </span>
              <span className="font-mono font-black text-emerald-400">
                {validReferralCount} / {targetReferrals} Teman
              </span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{validReferralCount} dari {targetReferrals} Teman Beli Produk</span>
              <span>{progressPercent}% Menuju Bonus {formatRupiah(rewardAmount)}</span>
            </div>
          </div>
        </div>

        {/* Ambient subtle light */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Syarat Khusus Callout */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
        <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Syarat Wajib:</strong> Teman yang mendaftar menggunakan kode referral Anda <strong>harus melakukan pembelian produk</strong> minimal 1 kali agar referral dihitung sah.
        </p>
      </div>

      {/* Your Referral Code Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Kode Referral Anda
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bagikan kode atau link referral ini ke teman, media sosial, atau grup WA Anda.
          </p>
        </div>

        {/* Big Code Pill */}
        <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              KODE PENGUNDANG
            </span>
            <span className="text-2xl font-black font-mono text-emerald-600 tracking-wider">
              {userRefCode}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Tersalin' : 'Salin Kode'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Bagikan ke WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>Share WA</span>
            </button>
          </div>
        </div>

        {/* Share Link Preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Link Referral Langsung:
          </label>
          <div className="flex items-center gap-2 p-2 pl-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="font-mono text-slate-600 truncate flex-1 select-all">
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>
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
