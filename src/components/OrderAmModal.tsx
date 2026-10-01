import React, { useState } from 'react';
import { 
  X, 
  Minus, 
  Plus, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Download, 
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah } from '../utils/formatter';
import { executeOrderSuccessTransaction, recordFailedOrder } from '../services/firestoreService';
import type { SystemSettings } from '../types';

interface OrderAmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
  settings?: SystemSettings | null;
}

export const OrderAmModal: React.FC<OrderAmModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit,
  settings
}) => {
  const { profile } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const UNIT_PRICE = 500;
  const totalCost = quantity * UNIT_PRICE;
  const userBalance = profile?.balance || 0;
  const isBalanceEnough = userBalance >= totalCost;

  const handleStepQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(200, prev + delta)));
  };

  const handleQuickSelect = (qty: number) => {
    setQuantity(qty);
  };

  const handleInitiateOrder = () => {
    if (!isBalanceEnough) {
      showWarning('Saldo Tidak Cukup', 'Silakan lakukan pengisian saldo (Top Up) terlebih dahulu.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    if (!profile) return;
    setShowConfirm(false);
    setLoading(true);

    const targetEndpoint = settings?.amApi || 'https://api.zyvor.my.id/api/am/bulkv3';

    try {
      const proxyResponse = await fetch('/api/proxy/am', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: quantity,
          endpoint: targetEndpoint
        })
      });

      const proxyData = await proxyResponse.json();

      if (!proxyResponse.ok || !proxyData.success) {
        const errorMsg = proxyData.error || 'Server AM Prem gagal memproses akun.';
        await recordFailedOrder({
          uid: profile.uid,
          productId: 'am_prem',
          productName: 'AM PREM VERIF',
          unitPrice: UNIT_PRICE,
          quantity,
          totalCost,
          errorMessage: errorMsg
        });
        showError('Order AM Prem Gagal', `${errorMsg}. Saldo Anda TIDAK terpotong.`);
        return;
      }

      await executeOrderSuccessTransaction({
        uid: profile.uid,
        productId: 'am_prem',
        productName: 'AM PREM VERIF',
        unitPrice: UNIT_PRICE,
        quantity,
        totalCost,
        resultPayload: proxyData.data
      });

      setOrderResult(proxyData.data);
      showSuccess('Order AM Prem Berhasil!', `Berhasil membuat ${quantity} akun AM Prem Verif.`);
    } catch (err: any) {
      console.error('Order AM Error:', err);
      showError('Gagal Memproses Order', 'Terjadi kesalahan sistem. Saldo Anda aman dan tidak terpotong.');
    } finally {
      setLoading(false);
    }
  };

  const getAccountsString = () => {
    if (!orderResult) return '';
    if (typeof orderResult === 'string') return orderResult;
    if (Array.isArray(orderResult)) {
      return orderResult.map((acc: any) => typeof acc === 'string' ? acc : JSON.stringify(acc)).join('\n');
    }
    if (orderResult.result || orderResult.data || orderResult.accounts || orderResult.results) {
      const data = orderResult.result || orderResult.data || orderResult.accounts || orderResult.results;
      if (Array.isArray(data)) return data.join('\n');
      return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }
    return JSON.stringify(orderResult, null, 2);
  };

  const handleCopyAccounts = () => {
    const text = getAccountsString();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSuccess('Disalin!', 'Daftar akun AM Prem berhasil disalin ke clipboard.');
  };

  const handleDownloadTxt = () => {
    const text = getAccountsString();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AM_PREM_${quantity}AKUN_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 font-bold">
              AM
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Order AM PREM VERIF
              </h2>
              <p className="text-xs text-violet-600 font-semibold">
                Alight Motion Premium Akun Terverifikasi
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (orderResult) setOrderResult(null);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {orderResult ? (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-950">Transaksi Berhasil!</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {quantity} akun AM Prem Verif telah berhasil digenerate oleh server.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Hasil Akun ({quantity} akun):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyAccounts}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin' : 'Salin Semua'}</span>
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh TXT</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-slate-900 rounded-2xl text-violet-300 font-mono text-xs max-h-48 overflow-y-auto leading-relaxed border border-slate-800 select-all">
                  <pre className="whitespace-pre-wrap break-all">{getAccountsString()}</pre>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setOrderResult(null);
                    setQuantity(1);
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors cursor-pointer"
                >
                  Order Lagi
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Saldo AZRYL Wallet Anda</p>
                    <p className="text-sm font-extrabold font-mono text-slate-900">
                      {formatRupiah(userBalance)}
                    </p>
                  </div>
                </div>
                {!isBalanceEnough && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDeposit();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    + Top Up
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Jumlah Akun Yang Dipesan
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleStepQuantity(-1)}
                    disabled={quantity <= 1}
                    className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-slate-800 font-bold text-lg transition-colors cursor-pointer"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Akun
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStepQuantity(1)}
                    className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 font-bold text-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {[1, 5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickSelect(preset)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quantity === preset
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {preset} akun
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Harga Satuan:</span>
                  <span className="font-mono font-bold text-slate-800">{formatRupiah(UNIT_PRICE)} / akun</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Jumlah Dipesan:</span>
                  <span className="font-mono font-bold text-slate-800">{quantity} Akun</span>
                </div>
                <div className="pt-2 border-t border-violet-200/60 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total Pembayaran:</span>
                  <span className="text-lg font-black font-mono text-violet-700">
                    {formatRupiah(totalCost)}
                  </span>
                </div>
              </div>

              {!isBalanceEnough && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Saldo Anda kurang {formatRupiah(totalCost - userBalance)}. Silakan top up terlebih dahulu.</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleInitiateOrder}
                disabled={loading || !isBalanceEnough}
                className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-extrabold text-sm shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <span>Konfirmasi Order ({formatRupiah(totalCost)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Pembelian</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin memesan <strong>{quantity} akun AM Prem Verif</strong> seharga <strong>{formatRupiah(totalCost)}</strong>?
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Saldo Anda:</span>
                <span className="font-mono font-bold">{formatRupiah(userBalance)}</span>
              </div>
              <div className="flex justify-between text-violet-700 font-bold">
                <span>Sisa Saldo Nanti:</span>
                <span className="font-mono">{formatRupiah(userBalance - totalCost)}</span>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Ya, Proses Order
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-70 flex flex-col items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 text-white flex items-center justify-center mb-4 shadow-xl animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <p className="text-base font-bold text-white tracking-wide">Menghubungi Server Zyvor AM Bulk...</p>
          <p className="text-xs text-violet-300 mt-1">Generating {quantity} akun terverifikasi. Mohon tunggu sejenak.</p>
        </div>
      )}
    </div>
  );
};
