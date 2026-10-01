import React, { useState } from 'react';
import { 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  ArrowLeft,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah } from '../utils/formatter';
import { createDeposit } from '../services/firestoreService';
import type { SystemSettings } from '../types';

interface DepositViewProps {
  onSuccessNavigate?: () => void;
  settings?: SystemSettings | null;
}

export const DepositView: React.FC<DepositViewProps> = ({ onSuccessNavigate, settings }) => {
  const { profile } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const minDeposit = settings?.minDeposit ?? 1000;
  const maxDeposit = settings?.maxDeposit ?? 1000000;
  const isDepositOpen = settings?.depositOpen ?? true;
  const danaNumber = settings?.danaNumber || '085786683784';
  const danaName = settings?.danaName || 'JEJE';
  const qrisUrl = settings?.qrisUrl || 'https://api.zyvor.my.id/files/16e4dbd0fc28a8031b247897df219df5.jpeg';

  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState<number>(10000);
  const [senderName, setSenderName] = useState<string>(profile?.name || '');
  const [method, setMethod] = useState<'DANA' | 'QRIS'>('QRIS');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedDana, setCopiedDana] = useState<boolean>(false);

  const presets = [1000, 5000, 10000, 25000, 50000, 100000, 250000];

  const handleCopyDana = () => {
    navigator.clipboard.writeText(danaNumber);
    setCopiedDana(true);
    setTimeout(() => setCopiedDana(false), 2000);
    showSuccess('Disalin!', `Nomor DANA ${danaNumber} disalin ke clipboard.`);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDepositOpen) {
      showError('Deposit Ditutup', 'Layanan deposit saat ini sedang ditutup sementara oleh Admin.');
      return;
    }
    if (!senderName.trim()) {
      showWarning('Nama Wajib Diisi', 'Silakan masukkan nama Anda / nama pengirim transfer.');
      return;
    }
    if (amount < minDeposit) {
      showWarning('Nominal Terlalu Kecil', `Minimal deposit adalah ${formatRupiah(minDeposit)}.`);
      return;
    }
    if (amount > maxDeposit) {
      showWarning('Nominal Terlalu Besar', `Maksimal deposit adalah ${formatRupiah(maxDeposit)}.`);
      return;
    }
    setStep(2);
  };

  const handleConfirmPaid = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await createDeposit({
        uid: profile.uid,
        email: profile.email,
        amount,
        senderName: senderName.trim(),
        method
      });

      showSuccess(
        'Deposit Berhasil Dikirim!',
        `Deposit ${formatRupiah(amount)} sedang dicek oleh admin. Saldo akan bertambah setelah disetujui.`
      );
      if (onSuccessNavigate) {
        onSuccessNavigate();
      }
    } catch (err: any) {
      console.error('Deposit error:', err);
      showError('Gagal Mengirim Deposit', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Wallet Balance Hero Card in Emerald Dark */}
      <div className="bg-gradient-to-tr from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
              AZRYLPREM WALLET
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono mt-3 tracking-tight text-white">
              {formatRupiah(profile?.balance || 0)}
            </div>
            <p className="text-xs text-emerald-200/70 mt-1">
              Saldo otomatis terpotong saat melakukan order layanan.
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <span className="text-slate-400 block">Status Akun:</span>
            <span className="font-black text-emerald-400 uppercase tracking-wider bg-emerald-900/50 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {profile?.role === 'admin' ? 'ADMIN OWNER' : 'ACTIVE MEMBER'}
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: Input Nominal & Nama */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>Isi Saldo AZRYLPREM</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan nominal yang ingin diisi dan nama pengirim transfer Anda.
            </p>
          </div>

          {/* Input Nominal */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nominal Saldo (Rp)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                Rp
              </span>
              <input
                type="number"
                required
                min={minDeposit}
                max={maxDeposit}
                step={500}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                placeholder="Contoh: 10000"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Nominal Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    amount === val
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formatRupiah(val)}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 block">
              Minimal deposit {formatRupiah(minDeposit)} • Maksimal {formatRupiah(maxDeposit)}.
            </span>
          </div>

          {/* Input Nama Pengirim */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nama Pengirim
            </label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Contoh: Azril / Jeje / Sesuai Akun Pembayaran"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            <span className="text-[11px] text-slate-400 block">
              Nama ini digunakan admin untuk mencocokkan mutasi saldo Anda.
            </span>
          </div>

          {/* Tombol Lanjut Konfirmasi */}
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Konfirmasi Pembayaran ({formatRupiah(amount)})</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      )}

      {/* STEP 2: Pilih Metode DANA/QRIS & Konfirmasi Sudah Bayar */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Pilih Metode Pembayaran
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih DANA atau QRIS, transfer sesuai nominal, lalu klik Konfirmasi Sudah Bayar.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Nominal</span>
              <span className="text-lg font-black font-mono text-emerald-600">
                {formatRupiah(amount)}
              </span>
            </div>
          </div>

          {/* Ringkasan Ringkas */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-500">Nama Pengirim: <strong className="text-slate-900 font-bold">{senderName}</strong></span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-emerald-600 font-bold hover:underline"
            >
              Ubah
            </button>
          </div>

          {/* Segmented Button Metode: DANA / QRIS */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMethod('QRIS')}
              className={`py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                method === 'QRIS'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS Instan (Semua E-Wallet & Bank)</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('DANA')}
              className={`py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                method === 'DANA'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>DANA E-Wallet</span>
            </button>
          </div>

          {/* TAMPILAN DETAIL DANA */}
          {method === 'DANA' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-sky-50/70 border border-sky-200 text-sky-950 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-800">
                  Pembayaran DANA
                </span>
                <span className="text-xs bg-sky-200/70 px-2 py-0.5 rounded-md font-bold text-sky-900">
                  A.N {danaName}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-sky-200 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Nomor Akun DANA</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-wider">
                    {danaNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDana}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiedDana ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedDana ? 'Tersalin' : 'Salin Nomor'}</span>
                </button>
              </div>

              <ol className="list-decimal pl-4 text-xs text-sky-900/80 space-y-1">
                <li>Buka aplikasi DANA di HP Anda.</li>
                <li>Pilih menu <strong>Kirim / Transfer</strong> ke nomor DANA di atas.</li>
                <li>Kirim saldo tepat sejumlah <strong>{formatRupiah(amount)}</strong>.</li>
                <li>Setelah berhasil, klik tombol <strong>"Saya Sudah Bayar"</strong> di bawah.</li>
              </ol>
            </div>
          )}

          {/* TAMPILAN DETAIL QRIS */}
          {method === 'QRIS' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-4 text-center">
              <div className="flex items-center justify-between text-left">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Scan QRIS Pembayaran
                </span>
                <span className="text-xs bg-emerald-200/70 px-2 py-0.5 rounded-md font-bold text-emerald-900">
                  Otomatis / Real-Time
                </span>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 inline-block shadow-md mx-auto max-w-[240px]">
                <img 
                  src={qrisUrl} 
                  alt="QRIS AZRYLPREM" 
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                />
                <span className="text-[10px] text-slate-400 font-bold block mt-2">
                  Bisa Scan via DANA, GoPay, OVO, ShopeePay, BCA, Mandiri dll
                </span>
              </div>

              <div className="flex justify-center gap-2">
                <a
                  href={qrisUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="qris-azrylprem.jpg"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Gambar QRIS</span>
                </a>
              </div>

              <p className="text-xs text-emerald-800/80">
                Transfer tepat sebesar <strong className="font-mono font-black text-slate-900">{formatRupiah(amount)}</strong>.
              </p>
            </div>
          )}

          {/* Tombol Konfirmasi Sudah Bayar */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmPaid}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan Konfirmasi Deposit...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Saya Sudah Bayar</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400 text-center block">
              Status deposit akan tercatat sebagai PENDING dan diverifikasi admin dalam 1-5 menit.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
