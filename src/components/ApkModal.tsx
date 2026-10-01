import React from 'react';
import { Smartphone, Download, CheckCircle2, ShieldCheck, X, AlertCircle } from 'lucide-react';
import type { SystemSettings } from '../types';

interface ApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: SystemSettings | null;
}

export const ApkModal: React.FC<ApkModalProps> = ({ isOpen, onClose, settings }) => {
  if (!isOpen) return null;

  const apkName = settings?.apkName || 'AZRYLPREM Mobile App';
  const apkVersion = settings?.apkVersion || 'v1.0.0 (Terbaru)';
  const apkUrl = settings?.apkUrl || '';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
            <Smartphone className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{apkName}</h2>
          <span className="inline-block px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold font-mono">
            Versi {apkVersion}
          </span>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Nikmati kemudahan transaksi instan dan pantau saldo langsung dari genggaman ponsel Anda.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Notifikasi push transaksi & deposit real-time</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Ringan, cepat, dan hemat kuota</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Akses langsung ke AM Bulk Verif & HD Upscaler</span>
          </div>
        </div>

        {/* Download Action */}
        <div className="pt-2">
          {apkUrl ? (
            <a
              href={apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download APK Sekarang</span>
            </a>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>APK sedang dipersiapkan</span>
              </div>
              <p className="text-xs text-amber-700">
                Aplikasi Android native sedang dalam tahap finalisasi build. Silakan gunakan versi web responsif ini terlebih dahulu.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
          <span>Bebas Virus & Terverifikasi Aman</span>
        </div>
      </div>
    </div>
  );
};
