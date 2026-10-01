import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Wallet, 
  Check, 
  AlertCircle, 
  Copy, 
  Download, 
  ArrowRight, 
  Plus, 
  Minus, 
  Upload, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Mail,
  Inbox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah } from '../utils/formatter';
import { createOrderWithDeduction } from '../services/firestoreService';
import { parseAmAccounts, extractHdImageUrl } from '../utils/orderParser';
import type { SystemSettings } from '../types';

interface OrderViewProps {
  onOpenDeposit: () => void;
  onNavigateToMyOrders: () => void;
  settings?: SystemSettings | null;
  initialProduct?: 'am' | 'hd';
}

export const OrderView: React.FC<OrderViewProps> = ({
  onOpenDeposit,
  onNavigateToMyOrders,
  settings,
  initialProduct = 'am'
}) => {
  const { profile, refreshUserProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<'am' | 'hd'>(initialProduct);
  
  // Alight Motion State
  const [amCount, setAmCount] = useState<number>(1);
  const [amLoading, setAmLoading] = useState<boolean>(false);
  const [amResult, setAmResult] = useState<any>(null);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // HD Foto State
  const [hdFile, setHdFile] = useState<File | null>(null);
  const [hdPreview, setHdPreview] = useState<string | null>(null);
  const [hdScale, setHdScale] = useState<number>(2);
  const [hdLoading, setHdLoading] = useState<boolean>(false);
  const [hdResult, setHdResult] = useState<any>(null);

  const userBalance = profile?.balance || 0;

  // Price configuration
  const AM_PRICE_PER_ITEM = 500;
  const HD_PRICE_PER_ITEM = 50;

  const totalAmPrice = amCount * AM_PRICE_PER_ITEM;
  const isAmBalanceSufficient = userBalance >= totalAmPrice;

  const totalHdPrice = HD_PRICE_PER_ITEM;
  const isHdBalanceSufficient = userBalance >= totalHdPrice;

  // Handle Alight Motion Order
  const handleConfirmAmOrder = async () => {
    if (!profile) return;
    if (amCount < 1) {
      showError('Validasi Gagal', 'Jumlah pesanan minimal 1 akun.');
      return;
    }
    if (amCount > 5) {
      showError('Batas Maksimal', 'Maksimal order Alight Motion adalah 5 akun per proses.');
      return;
    }
    if (!isAmBalanceSufficient) {
      showError('Saldo Tidak Cukup', `Saldo Anda ${formatRupiah(userBalance)}, dibutuhkan ${formatRupiah(totalAmPrice)}.`);
      return;
    }

    setAmLoading(true);
    setAmResult(null);

    try {
      // Step 1: Call proxy server to call Zyvor Bulk V3
      const response = await fetch('/api/proxy/am', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: amCount,
          endpoint: settings?.amApiEndpoint || 'https://api.zyvor.my.id/api/am/bulkv3'
        })
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Server penyedia gagal memproses akun Alight Motion.');
      }

      // Step 2: Deduct balance & record order atomically in Firestore
      const newOrder = await createOrderWithDeduction(
        profile.uid,
        'am_prem',
        'Alight motion premium',
        AM_PRICE_PER_ITEM,
        amCount,
        totalAmPrice,
        resJson.data
      );

      await refreshUserProfile();
      setAmResult({
        orderId: newOrder.id,
        data: resJson.data
      });

      showSuccess('Order Berhasil Diproses!', `${amCount} Akun Alight Motion Premium siap digunakan.`);
    } catch (err: any) {
      console.error('AM Order Error:', err);
      showError('Order Gagal', err.message || 'Terjadi kesalahan sistem saat memproses order.');
    } finally {
      setAmLoading(false);
    }
  };

  // Handle Image File Selection for HD Foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('Format Tidak Didukung', 'Silakan pilih file gambar JPEG, PNG, atau WEBP.');
        return;
      }
      setHdFile(file);
      const reader = new FileReader();
      reader.onload = () => setHdPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle HD Foto Order
  const handleConfirmHdOrder = async () => {
    if (!profile) return;
    if (!hdFile) {
      showError('Foto Belum Dipilih', 'Silakan unggah foto yang ingin ditingkatkan resolusinya.');
      return;
    }
    if (!isHdBalanceSufficient) {
      showError('Saldo Tidak Cukup', `Saldo Anda ${formatRupiah(userBalance)}, dibutuhkan ${formatRupiah(totalHdPrice)}.`);
      return;
    }

    setHdLoading(true);
    setHdResult(null);

    try {
      const formData = new FormData();
      formData.append('image', hdFile);
      formData.append('scale', String(hdScale));
      if (settings?.hdApiEndpoint) {
        formData.append('endpoint', settings.hdApiEndpoint);
      }

      const response = await fetch('/api/proxy/hd', {
        method: 'POST',
        body: formData
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Server gagal meningkatkan resolusi gambar.');
      }

      // Record order & deduct balance atomically
      const newOrder = await createOrderWithDeduction(
        profile.uid,
        'hd_foto',
        'HD FOTO RESOLUTION UPSCALE',
        HD_PRICE_PER_ITEM,
        1,
        totalHdPrice,
        resJson.data
      );

      await refreshUserProfile();
      setHdResult({
        orderId: newOrder.id,
        data: resJson.data
      });

      showSuccess('Foto HD Berhasil!', 'Resolusi foto berhasil ditingkatkan dengan jernih.');
    } catch (err: any) {
      console.error('HD Order Error:', err);
      showError('Proses Gagal', err.message || 'Gagal memproses peningkatan foto.');
    } finally {
      setHdLoading(false);
    }
  };

  const copyAmResultText = () => {
    if (!amResult?.data) return;
    let text = '';
    if (typeof amResult.data === 'string') {
      text = amResult.data;
    } else if (Array.isArray(amResult.data)) {
      text = amResult.data.map((item: any) => typeof item === 'object' ? JSON.stringify(item) : String(item)).join('\n');
    } else if (amResult.data.result) {
      text = typeof amResult.data.result === 'object' ? JSON.stringify(amResult.data.result, null, 2) : String(amResult.data.result);
    } else {
      text = JSON.stringify(amResult.data, null, 2);
    }

    navigator.clipboard.writeText(text);
    setCopiedResult(true);
    showSuccess('Tersalin!', 'Data akun berhasil disalin ke clipboard.');
    setTimeout(() => setCopiedResult(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
            </span>
            <span>ORDER LAYANAN</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pilih layanan digital premium AZRYLPREM dengan proses instan 24 jam.
          </p>
        </div>

        {/* Saldo Pill */}
        <div className="flex items-center gap-2 p-1.5 pl-3 pr-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Saldo Anda</span>
            <span className="text-sm font-black font-mono text-emerald-600">
              {formatRupiah(userBalance)}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenDeposit}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            + Top Up
          </button>
        </div>
      </div>

      {/* Product Selection Tabs */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-3xl">
        {/* TAB 1: Alight Motion Premium */}
        <button
          type="button"
          onClick={() => { setSelectedProduct('am'); setAmResult(null); }}
          className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left ${
            selectedProduct === 'am' 
              ? 'bg-white text-slate-900 shadow-md shadow-slate-200/60 ring-2 ring-emerald-500/20' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          {/* Logo Alight Motion */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shrink-0 bg-white flex items-center justify-center p-1 border border-slate-200 shadow-xs">
            <img 
              src="https://1000logos.net/wp-content/uploads/2024/03/Alight-Motion-Logo.png" 
              alt="Alight Motion" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('bg-emerald-600');
              }}
            />
            {/* Fallback */}
            <span className="text-white font-black text-xs hidden">AM</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                Alight motion premium
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                HOT
              </span>
            </div>
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 block mt-0.5">
              Rp500 <span className="text-[10px] text-slate-400 font-sans font-normal">/ akun (Max 5)</span>
            </span>
          </div>
        </button>

        {/* TAB 2: HD Foto */}
        <button
          type="button"
          onClick={() => { setSelectedProduct('hd'); setHdResult(null); }}
          className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left ${
            selectedProduct === 'hd' 
              ? 'bg-white text-slate-900 shadow-md shadow-slate-200/60 ring-2 ring-emerald-500/20' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shrink-0 bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                HD FOTO
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[9px] font-black uppercase">
                AI
              </span>
            </div>
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 block mt-0.5">
              Rp50 <span className="text-[10px] text-slate-400 font-sans font-normal">/ foto</span>
            </span>
          </div>
        </button>
      </div>

      {/* PRODUCT 1: ALIGHT MOTION PREMIUM DETAILS & FORM */}
      {selectedProduct === 'am' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/60 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Layanan Otomatis 24 Jam
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Alight motion premium
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                Dapatkan akun Alight Motion Premium siap pakai dengan masa aktif resmi. Akun langsung otomatis muncul di layar setelah transaksi berhasil.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block">Harga Satuan</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
                Rp500
              </span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Tentukan Jumlah Akun
            </label>

            {/* Quick Presets (Max 5 per proses) */}
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmCount(preset)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                    amCount === preset
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {preset} Akun
                </button>
              ))}
            </div>

            {/* Stepper Input */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setAmCount(Math.max(1, amCount - 1))}
                  className="p-3 text-slate-600 hover:bg-slate-200 transition cursor-pointer disabled:opacity-40"
                  disabled={amCount <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={amCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setAmCount(Math.min(5, Math.max(1, val)));
                  }}
                  className="w-16 text-center font-mono font-black text-slate-900 bg-transparent text-base focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAmCount(Math.min(5, amCount + 1))}
                  disabled={amCount >= 5}
                  className="p-3 text-slate-600 hover:bg-slate-200 transition cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-medium">
                  Subtotal: <span className="font-mono font-bold text-slate-900">{formatRupiah(totalAmPrice)}</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  Batas: Maksimal 5 akun / proses
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Balance Verification Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Jumlah Pesanan:</span>
              <span className="font-bold text-slate-900">{amCount} Akun</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Harga Satuan:</span>
              <span className="font-mono font-bold text-slate-900">Rp500</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Saldo Anda Saat Ini:</span>
              <span className="font-mono font-bold text-emerald-700">{formatRupiah(userBalance)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
              <span className="text-sm font-black text-slate-900">Total Harga:</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
                {formatRupiah(totalAmPrice)}
              </span>
            </div>
          </div>

          {/* Balance Warning if Insufficient */}
          {!isAmBalanceSufficient && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Saldo tidak mencukupi untuk melakukan order ini.</span>
              </div>
              <button
                type="button"
                onClick={onOpenDeposit}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shrink-0 transition"
              >
                Top Up Sekarang
              </button>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={amLoading || !isAmBalanceSufficient}
            onClick={handleConfirmAmOrder}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {amLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses Order ke Server API...</span>
              </div>
            ) : (
              <>
                <span>Konfirmasi Order ({formatRupiah(totalAmPrice)})</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>

          {/* Result: HANYA 2 BARIS (Gmail & Inbox URL) Tanpa Yang Lain */}
          {amResult && (() => {
            const parsedAccounts = parseAmAccounts(amResult.data);
            return (
              <div className="mt-6 space-y-3 animate-in fade-in">
                {parsedAccounts.map((acc, idx) => (
                  <div key={acc.id || idx} className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-emerald-500 shadow-md space-y-2.5">
                    {/* Baris 1: Gmail */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-slate-500 shrink-0">Gmail:</span>
                        <span className="text-xs sm:text-sm font-mono font-black text-slate-900 select-all truncate">
                          {acc.gmail || '-'}
                        </span>
                      </div>
                      {acc.gmail && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(acc.gmail);
                            setCopiedItem(`gmail-${idx}`);
                            showSuccess('Tersalin!', 'Gmail berhasil disalin.');
                            setTimeout(() => setCopiedItem(null), 2000);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {copiedItem === `gmail-${idx}` ? 'Tersalin' : 'Salin'}
                        </button>
                      )}
                    </div>

                    {/* Baris 2: Inbox URL */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-slate-500 shrink-0">Inbox URL:</span>
                        <a 
                          href={acc.inboxurl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs sm:text-sm font-mono text-sky-600 hover:text-sky-800 underline truncate block"
                        >
                          {acc.inboxurl || '-'}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {acc.inboxurl && (
                          <a
                            href={acc.inboxurl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                          >
                            Buka
                          </a>
                        )}
                        {acc.inboxurl && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(acc.inboxurl);
                              setCopiedItem(`inbox-${idx}`);
                              showSuccess('Tersalin!', 'Inbox URL berhasil disalin.');
                              setTimeout(() => setCopiedItem(null), 2000);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                          >
                            {copiedItem === `inbox-${idx}` ? 'Tersalin' : 'Salin'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setAmResult(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    ← Order Lagi
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateToMyOrders}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                  >
                    Lihat di Order Saya →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* PRODUCT 2: HD FOTO DETAILS & FORM */}
      {selectedProduct === 'hd' && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/60 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                AI Image Resolution Upscale
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                HD FOTO RESOLUTION
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                Jernihkan foto buram, pecah, atau blur dengan teknologi AI Upscale Super Resolution. Foto akan otomatis menjadi tajam beresolusi tinggi.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block">Harga / Foto</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
                Rp50
              </span>
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Upload Foto yang Ingin Dijernihkan
            </label>

            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 text-center transition-all bg-slate-50/60 relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {hdPreview ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                    <img src={hdPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{hdFile?.name}</span>
                  <span className="text-[11px] text-emerald-600 font-bold">Klik untuk ganti foto</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Upload className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Klik atau seret foto ke area ini
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Mendukung format JPG, PNG, WEBP (Maks 15MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scale Resolution Switcher */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Pilihan Peningkatan Resolusi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHdScale(2)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  hdScale === 2
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold ring-1 ring-emerald-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-black">2x Upscale</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Rekomendasi umum, tajam & cepat</div>
              </button>
              <button
                type="button"
                onClick={() => setHdScale(4)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  hdScale === 4
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold ring-1 ring-emerald-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-black">4x Ultra HD</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Detail maksimal untuk cetak</div>
              </button>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Layanan:</span>
              <span className="font-bold text-slate-900">HD FOTO Resolution {hdScale}x</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Saldo Anda Saat Ini:</span>
              <span className="font-mono font-bold text-emerald-700">{formatRupiah(userBalance)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
              <span className="text-sm font-black text-slate-900">Total Harga:</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
                {formatRupiah(totalHdPrice)}
              </span>
            </div>
          </div>

          {/* Balance Warning if Insufficient */}
          {!isHdBalanceSufficient && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Saldo tidak mencukupi untuk menjernihkan foto.</span>
              </div>
              <button
                type="button"
                onClick={onOpenDeposit}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shrink-0 transition"
              >
                Top Up Sekarang
              </button>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={hdLoading || !hdFile || !isHdBalanceSufficient}
            onClick={handleConfirmHdOrder}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {hdLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sedang Memproses AI Resolution...</span>
              </div>
            ) : (
              <>
                <span>Konfirmasi Order ({formatRupiah(totalHdPrice)})</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>

          {/* HD Result */}
          {hdResult && (() => {
            const hdPhotoUrl = extractHdImageUrl(hdResult.data);
            return (
              <div className="mt-6 p-5 sm:p-6 rounded-3xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-black text-emerald-900 text-sm sm:text-base">Foto Berhasil Dijernihkan!</h3>
                    <p className="text-[11px] text-emerald-700">ID Transaksi: {hdResult.orderId}</p>
                  </div>
                </div>

                {hdPhotoUrl ? (
                  <div className="space-y-4">
                    {/* Foto Display */}
                    <div className="w-full max-h-[420px] rounded-2xl overflow-hidden border-2 border-emerald-300 bg-slate-900/5 shadow-md flex items-center justify-center p-1">
                      <img 
                        src={hdPhotoUrl} 
                        alt="Hasil Foto HD" 
                        className="w-full h-full object-contain max-h-[400px] rounded-xl" 
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <a
                        href={hdPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download="foto-hd-azrylprem.jpg"
                        className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>Download Foto HD</span>
                      </a>
                      <a
                        href={hdPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-4 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Buka Foto Penuh</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-xs overflow-x-auto text-slate-800">
                    {JSON.stringify(hdResult.data, null, 2)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
