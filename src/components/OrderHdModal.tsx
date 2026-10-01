import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Sparkles, 
  ArrowRight,
  ZoomIn,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah } from '../utils/formatter';
import { executeOrderSuccessTransaction, recordFailedOrder } from '../services/firestoreService';
import type { SystemSettings } from '../types';

interface OrderHdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
  settings?: SystemSettings | null;
}

export const OrderHdModal: React.FC<OrderHdModalProps> = ({
  isOpen,
  onClose,
  onOpenDeposit,
  settings
}) => {
  const { profile } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const PRICE_PER_PHOTO = 50;
  const userBalance = profile?.balance || 0;
  const isBalanceEnough = userBalance >= PRICE_PER_PHOTO;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        showError('Format Tidak Didukung', 'Silakan pilih file gambar (JPG, PNG, WEBP).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImageUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        showError('Format Tidak Didukung', 'Silakan pilih file gambar (JPG, PNG, WEBP).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImageUrl(null);
    }
  };

  const handleInitiateUpscale = () => {
    if (!selectedFile) {
      showWarning('Pilih Foto', 'Silakan pilih atau upload foto yang ingin diperjelas ke HD.');
      return;
    }
    if (!isBalanceEnough) {
      showWarning('Saldo Tidak Cukup', 'Saldo Anda kurang untuk memproses HD Foto (Rp50). Silakan top up.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmUpscale = async () => {
    if (!profile || !selectedFile) return;
    setShowConfirm(false);
    setLoading(true);

    const targetEndpoint = settings?.hdApi || 'https://api.zyvor.my.id/api/imagehd/upscalev2';

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('scale', String(scale));
      formData.append('endpoint', targetEndpoint);

      const response = await fetch('/api/proxy/hd', {
        method: 'POST',
        body: formData
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const errorMsg = json.error || 'Server upscale gagal memproses foto.';
        // Log failed order without deducting balance
        await recordFailedOrder({
          uid: profile.uid,
          productId: 'hd_foto',
          productName: 'HD FOTO UPSCALE',
          unitPrice: PRICE_PER_PHOTO,
          quantity: 1,
          totalCost: PRICE_PER_PHOTO,
          errorMessage: errorMsg
        });

        showError('Order HD Foto Gagal', `${errorMsg}. Saldo Anda TIDAK terpotong.`);
        return;
      }

      // Success: Extract image result
      let resultUrl = '';
      if (json.data?.resultUrl) {
        resultUrl = json.data.resultUrl;
      } else if (typeof json.data === 'string' && json.data.startsWith('http')) {
        resultUrl = json.data;
      } else if (json.data?.url) {
        resultUrl = json.data.url;
      } else if (json.data?.image) {
        resultUrl = json.data.image;
      } else {
        resultUrl = previewUrl || '';
      }

      // Deduct balance and record success in Firestore transaction
      await executeOrderSuccessTransaction({
        uid: profile.uid,
        productId: 'hd_foto',
        productName: 'HD FOTO UPSCALE',
        unitPrice: PRICE_PER_PHOTO,
        quantity: 1,
        totalCost: PRICE_PER_PHOTO,
        resultPayload: {
          resultUrl,
          fileName: selectedFile.name,
          scale
        }
      });

      setResultImageUrl(resultUrl);
      showSuccess('HD Foto Selesai!', 'Foto Anda berhasil di-upscale menjadi super tajam.');
    } catch (err: any) {
      console.error('HD Upscale Error:', err);
      showError('Gagal Memproses Gambar', 'Terjadi gangguan jaringan server. Saldo Anda aman dan tidak terpotong.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (!resultImageUrl) return;
    const a = document.createElement('a');
    a.href = resultImageUrl;
    a.download = `AZRYLPREM_HD_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold">
              HD
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                HD FOTO UPSCALE AI
              </h2>
              <p className="text-xs text-indigo-600 font-semibold">
                Tingkatkan Resolusi & Kejernihan Foto 2x
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setResultImageUrl(null);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* SUCCESS RESULT VIEW */}
          {resultImageUrl ? (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-1.5 shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-emerald-950">Foto Berhasil Ditingkatkan ke HD!</h3>
                <p className="text-xs text-emerald-700">Saldo telah terpotong Rp50 secara otomatis.</p>
              </div>

              {/* Image Result Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md">
                <img
                  src={resultImageUrl}
                  alt="Hasil HD"
                  className="w-full max-h-72 object-contain mx-auto"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold">
                  2X UPSCALE HD
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setResultImageUrl(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Foto Lain</span>
                </button>
                <button
                  onClick={handleDownloadResult}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Gambar HD</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Saldo Indicator Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Saldo Anda Saat Ini</p>
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
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    + Top Up
                  </button>
                )}
              </div>

              {/* File Upload / Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Upload Foto Yang Ingin Diperjelas
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden group bg-slate-900">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-56 object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 text-white text-[11px] font-mono truncate max-w-[220px]">
                      {selectedFile?.name} ({(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(0)} KB)
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-violet-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-violet-50/20"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Klik untuk upload atau seret foto ke sini
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Mendukung format JPG, PNG, atau WEBP (Maks 15 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Biaya Upscale:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(PRICE_PER_PHOTO)} / foto</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Skala AI:</span>
                  <span className="font-mono font-bold text-indigo-600">2x High Definition</span>
                </div>
                <div className="pt-2 border-t border-indigo-200/50 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total Biaya:</span>
                  <span className="text-lg font-black font-mono text-indigo-700">
                    {formatRupiah(PRICE_PER_PHOTO)}
                  </span>
                </div>
              </div>

              {/* Insufficient balance message */}
              {!isBalanceEnough && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Saldo Anda kurang. Biaya proses Rp50. Silakan isi saldo terlebih dahulu.</span>
                </div>
              )}

              {/* Process Button */}
              <button
                type="button"
                onClick={handleInitiateUpscale}
                disabled={loading || !selectedFile || !isBalanceEnough}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
              >
                <span>Proses HD ({formatRupiah(PRICE_PER_PHOTO)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Proses HD</h3>
              <p className="text-xs text-slate-500 mt-1">
                Proses HD Foto akan memotong saldo <strong>Rp50</strong>. Jika proses gagal, saldo Anda tidak akan terpotong.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUpscale}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Ya, Proses HD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-70 flex flex-col items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-xl animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <p className="text-base font-bold text-white tracking-wide">Sedang Mengolah Resolusi Gambar...</p>
          <p className="text-xs text-indigo-300 mt-1">AI Upscaling 2x sedang berjalan via Zyvor Engine. Mohon tunggu.</p>
        </div>
      )}
    </div>
  );
};
