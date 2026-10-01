import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Receipt, 
  Sparkles, 
  RefreshCw,
  Mail,
  Inbox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listenUserOrders } from '../services/firestoreService';
import { formatRupiah, formatDate } from '../utils/formatter';
import { parseAmAccounts, extractHdImageUrl } from '../utils/orderParser';
import type { OrderRecord } from '../types';

interface MyOrdersViewProps {
  onNavigateToOrder: () => void;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({ onNavigateToOrder }) => {
  const { profile } = useAuth();
  const { showSuccess } = useToast();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    const unsub = listenUserOrders(profile.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    return order.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Success</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showSuccess('Tersalin!', 'Data pesanan berhasil disalin.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <Receipt className="w-6 h-6 stroke-[2.5]" />
            </span>
            <span>ORDER SAYA</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau dan kelola seluruh transaksi layanan digital Anda secara transparan.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToOrder}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition cursor-pointer self-start sm:self-auto flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Buat Order Baru</span>
        </button>
      </div>

      {/* Modern Status Filter Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl overflow-x-auto scrollbar-none">
        {[
          { key: 'ALL', label: 'Semua Order', count: orders.length },
          { key: 'SUCCESS', label: 'Success', count: orders.filter(o => o.status === 'SUCCESS').length },
          { key: 'PROCESSING', label: 'Processing', count: orders.filter(o => o.status === 'PROCESSING').length },
          { key: 'PENDING', label: 'Pending', count: orders.filter(o => o.status === 'PENDING').length },
          { key: 'FAILED', label: 'Failed', count: orders.filter(o => o.status === 'FAILED').length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-white text-emerald-700 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              statusFilter === tab.key ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Memuat riwayat transaksi order Anda...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-black text-slate-900">Belum Ada Pesanan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === 'ALL' 
              ? 'Anda belum pernah melakukan order. Dapatkan akun Alight Motion Premium atau jernihkan foto sekarang.'
              : `Tidak ada pesanan dengan status ${statusFilter}.`}
          </p>
          <button
            type="button"
            onClick={onNavigateToOrder}
            className="mt-5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Mulai Order Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const isAm = order.productId === 'am_prem';
            const formattedTotal = formatRupiah(order.total || (order.amount * order.quantity));

            return (
              <div 
                key={order.id} 
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* Header row: Product Name + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white p-1 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                      {isAm ? (
                        <img 
                          src="https://1000logos.net/wp-content/uploads/2024/03/Alight-Motion-Logo.png" 
                          alt="Alight Motion" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-emerald-600');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                        {order.productName || (isAm ? 'Alight motion premium' : 'HD FOTO')}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-500 font-semibold">#{order.id.slice(-8)}</span>
                        <span>•</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {getStatusBadge(order.status)}
                    <span className="block text-sm sm:text-base font-black font-mono text-slate-900 mt-1">
                      {formattedTotal}
                    </span>
                  </div>
                </div>

                {/* Details Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 text-slate-600">
                    <span>
                      Jumlah: <strong className="text-slate-900 font-bold">{order.quantity} {isAm ? 'Akun' : 'Foto'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Harga Satuan: <strong className="text-slate-900 font-mono">{formatRupiah(order.amount)}</strong>
                    </span>
                  </div>

                  {/* Actions / View Result */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(order.id, order.id)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      title="Salin ID Transaksi"
                    >
                      {copiedId === order.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === order.id ? 'Tersalin' : 'Salin ID'}</span>
                    </button>

                    {order.result && (
                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{isExpanded ? 'Tutup Hasil' : 'Lihat Hasil Akun / Foto'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Result Drawer */}
                {isExpanded && order.result && (() => {
                  const isAmProduct = order.productId === 'am_prem';
                  const parsedAccounts = isAmProduct ? parseAmAccounts(order.result) : [];
                  const hdPhotoUrl = !isAmProduct ? extractHdImageUrl(order.result) : null;

                  return (
                    <div className="pt-3 border-t border-emerald-100 bg-emerald-50/60 -mx-5 -mb-5 p-5 rounded-b-3xl space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                          Detail Hasil: {order.productName || (isAmProduct ? 'Alight motion premium' : 'HD FOTO')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(
                            typeof order.result === 'string' ? order.result : JSON.stringify(order.result, null, 2),
                            `res-${order.id}`
                          )}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-lg flex items-center gap-1 hover:bg-emerald-700 transition cursor-pointer active:scale-95"
                        >
                          {copiedId === `res-${order.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>Salin Semua Data</span>
                        </button>
                      </div>

                      {/* 1. JIKA ALIGHT MOTION: HANYA 2 BARIS (Gmail & Inbox URL) Tanpa Yang Lain */}
                      {isAmProduct && parsedAccounts.length > 0 ? (
                        <div className="space-y-2.5">
                          {parsedAccounts.map((acc, idx) => (
                            <div key={acc.id || idx} className="p-3 bg-white rounded-2xl border-2 border-emerald-400 shadow-2xs space-y-2">
                              {/* Baris 1: Gmail */}
                              <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-black text-slate-500 shrink-0">Gmail:</span>
                                  <span className="text-xs sm:text-sm font-mono font-black text-slate-900 select-all truncate">
                                    {acc.gmail || '-'}
                                  </span>
                                </div>

                                {acc.gmail && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(acc.gmail, `gmail-${order.id}-${idx}`)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                                  >
                                    {copiedId === `gmail-${order.id}-${idx}` ? 'Tersalin' : 'Salin'}
                                  </button>
                                )}
                              </div>

                              {/* Baris 2: Inbox URL */}
                              <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
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
                                      onClick={() => handleCopyText(acc.inboxurl, `inbox-${order.id}-${idx}`)}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                                    >
                                      {copiedId === `inbox-${order.id}-${idx}` ? 'Tersalin' : 'Salin'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* 2. JIKA HD FOTO: TAMPILKAN FOTO LANGSUNG */}
                      {hdPhotoUrl ? (
                        <div className="space-y-3">
                          <div className="w-full max-h-72 rounded-2xl overflow-hidden border border-emerald-200 bg-black/5 flex items-center justify-center p-1">
                            <img 
                              src={hdPhotoUrl} 
                              alt="Foto HD" 
                              className="w-full h-full object-contain max-h-68 rounded-xl" 
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={hdPhotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={`foto-hd-${order.id.slice(-6)}.jpg`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh Foto HD</span>
                            </a>
                            <a
                              href={hdPhotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Ukuran Penuh</span>
                            </a>
                          </div>
                        </div>
                      ) : null}

                      {/* Fallback jika format data raw */}
                      {!parsedAccounts.length && !hdPhotoUrl && (
                        <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-xs overflow-x-auto select-all max-h-48 text-slate-800">
                          {typeof order.result === 'string' 
                            ? order.result 
                            : JSON.stringify(order.result, null, 2)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
