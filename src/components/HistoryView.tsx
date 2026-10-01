import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  History, 
  ReceiptText, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Eye, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  Download,
  ExternalLink,
  Check,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah, formatDate } from '../utils/formatter';
import { 
  listenUserOrders, 
  listenUserDeposits, 
  listenUserMutations 
} from '../services/firestoreService';
import { parseAmAccounts, extractHdImageUrl } from '../utils/orderParser';
import type { OrderRecord, DepositRecord, MutationRecord } from '../types';

interface HistoryViewProps {
  initialTab?: 'orders' | 'deposits' | 'mutations';
}

export const HistoryView: React.FC<HistoryViewProps> = ({ initialTab = 'orders' }) => {
  const { profile } = useAuth();
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'deposits' | 'mutations'>(initialTab);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [mutations, setMutations] = useState<MutationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [orderProductFilter, setOrderProductFilter] = useState<'ALL' | 'am_prem' | 'hd_foto'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const unsubOrders = listenUserOrders(profile.uid, (data) => {
      setOrders(data);
    });
    const unsubDeposits = listenUserDeposits(profile.uid, (data) => {
      setDeposits(data);
    });
    const unsubMutations = listenUserMutations(profile.uid, (data) => {
      setMutations(data);
    });

    return () => {
      unsubOrders();
      unsubDeposits();
      unsubMutations();
    };
  }, [profile]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{status}</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>PENDING</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
            <span>PROCESSING</span>
          </span>
        );
      case 'FAILED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const copyToClipboard = (text: string, id: string, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showSuccess('Tersalin!', `${label} disalin ke clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 pb-24 sm:pb-28">
      {/* Title & Tabs */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pusat Riwayat & Laporan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau seluruh aktivitas pesanan, riwayat deposit, dan mutasi saldo akun Anda.
            </p>
          </div>
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari ID atau nama..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1.5 sm:gap-2 p-1 bg-slate-100 rounded-2xl mt-4 sm:mt-5 overflow-x-auto text-xs font-bold no-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`shrink-0 sm:flex-1 py-2 sm:py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-emerald-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Pesanan Saya ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`shrink-0 sm:flex-1 py-2 sm:py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'deposits'
                ? 'bg-white text-emerald-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Riwayat Deposit ({deposits.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mutations')}
            className={`shrink-0 sm:flex-1 py-2 sm:py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'mutations'
                ? 'bg-white text-emerald-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ReceiptText className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Mutasi Saldo ({mutations.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PESANAN SAYA */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Sub-Tabs: Pisahin AM Prem & HD Foto */}
          <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setOrderProductFilter('ALL')}
              className={`shrink-0 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                orderProductFilter === 'ALL'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Semua Pesanan</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {orders.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOrderProductFilter('am_prem')}
              className={`shrink-0 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                orderProductFilter === 'am_prem'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Alight Motion Prem</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                {orders.filter(o => o.productId === 'am_prem').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOrderProductFilter('hd_foto')}
              className={`shrink-0 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                orderProductFilter === 'hd_foto'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>HD Foto AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800">
                {orders.filter(o => o.productId === 'hd_foto').length}
              </span>
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Belum Ada Pesanan</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Anda belum pernah melakukan order produk. Silakan coba order AM Prem Verif atau HD Foto.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders
                  .filter(o => {
                    if (orderProductFilter !== 'ALL' && o.productId !== orderProductFilter) return false;
                    if (!searchTerm) return true;
                    return (
                      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (o.id && o.id.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                  })
                  .map((order) => {
                    const isAm = order.productId === 'am_prem';
                    return (
                      <div key={order.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-0 relative">
                            {isAm ? (
                              <img 
                                src="https://1000logos.net/wp-content/uploads/2024/03/Alight-Motion-Logo.png" 
                                alt="Alight Motion" 
                                className="w-full h-full object-cover scale-125"
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900">{order.productName}</h4>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Jumlah: <strong>{order.quantity}x</strong> • Total: <strong className="font-mono text-slate-800">{formatRupiah(order.total)}</strong>
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                              <span>ID: {order.id?.slice(0, 10)}...</span>
                              <button
                                onClick={() => copyToClipboard(order.id || '', `order-id-${order.id}`, 'ID Transaksi')}
                                className="hover:text-emerald-600 cursor-pointer"
                                title="Salin ID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <span>• {formatDate(order.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {order.result && (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Hasil</span>
                            </button>
                          )}
                          {order.errorMessage && (
                            <span className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                              {order.errorMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT DEPOSIT */}
      {activeTab === 'deposits' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden">
          {deposits.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Belum Ada Riwayat Deposit</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan lakukan Isi Saldo (Top Up) untuk mulai menggunakan layanan kami.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {deposits
                .filter(d => 
                  !searchTerm || 
                  d.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.method.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((deposit) => (
                  <div key={deposit.id} className="p-3.5 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        deposit.method === 'DANA' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {deposit.method}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold font-mono text-slate-900">
                            {formatRupiah(deposit.amount)}
                          </span>
                          {getStatusBadge(deposit.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Pengirim: <strong className="text-slate-700">{deposit.senderName}</strong> via {deposit.method}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(deposit.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      {deposit.rejectionReason && (
                        <p className="text-xs text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 break-words max-w-xs">
                          Alasan Ditolak: <strong>{deposit.rejectionReason}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MUTASI SALDO */}
      {activeTab === 'mutations' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden">
          {mutations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <ReceiptText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Belum Ada Mutasi Saldo</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Setiap transaksi debit/kredit saldo akan tercatat detail di sini beserta saldo sebelum & sesudahnya.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {mutations.map((mut) => {
                const isCredit = mut.type === 'credit';
                return (
                  <div key={mut.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{mut.description}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>Sebelum: {formatRupiah(mut.balanceBefore)}</span>
                          <span>•</span>
                          <span>Sesudah: <strong className="text-slate-800">{formatRupiah(mut.balanceAfter)}</strong></span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(mut.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm sm:text-base font-black font-mono ${
                        isCredit ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isCredit ? '+' : '-'}{formatRupiah(mut.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Order Result Modal (SAMAKAN FORMATNYA: CUKUP GMAIL & INBOX URL DENGAN SALIN MASING-MASING) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Detail Hasil: {selectedOrder.productName}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedOrder.productId === 'am_prem' ? (() => {
              const parsed = parseAmAccounts(selectedOrder.result);
              return (
                <div className="space-y-3">
                  {parsed.map((acc, idx) => (
                    <div key={acc.id || idx} className="p-3.5 bg-white rounded-2xl border-2 border-emerald-400 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                          Akun #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`Gmail: ${acc.gmail}\nInbox URL: ${acc.inboxurl}`, `hist-both-${idx}`, 'Gmail & Inbox URL')}
                          className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-black transition active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {copiedId === `hist-both-${idx}` ? '✓ Tersalin Keduanya' : '📋 Salin Keduanya'}
                        </button>
                      </div>

                      {/* Baris 1: Gmail murni (tanpa terpotong di mobile) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-black text-slate-500 shrink-0 mt-0.5 sm:mt-0">Gmail:</span>
                          <span className="text-xs sm:text-sm font-mono font-black text-slate-900 select-all break-all leading-snug">
                            {acc.gmail || '-'}
                          </span>
                        </div>
                        {acc.gmail && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(acc.gmail, `hist-gmail-${idx}`, 'Gmail')}
                            className="self-end sm:self-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                          >
                            {copiedId === `hist-gmail-${idx}` ? 'Tersalin' : 'Salin'}
                          </button>
                        )}
                      </div>

                      {/* Baris 2: Inbox URL murni dari API (tanpa terpotong di mobile) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-black text-slate-500 shrink-0 mt-0.5 sm:mt-0">Inbox URL:</span>
                          <a 
                            href={acc.inboxurl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm font-mono text-sky-600 hover:text-sky-800 underline break-all leading-snug block"
                          >
                            {acc.inboxurl || '-'}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
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
                              onClick={() => copyToClipboard(acc.inboxurl, `hist-inbox-${idx}`, 'Inbox URL')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                            >
                              {copiedId === `hist-inbox-${idx}` ? 'Tersalin' : 'Salin'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })() : selectedOrder.result?.resultUrl || extractHdImageUrl(selectedOrder.result) ? (() => {
              const url = selectedOrder.result?.resultUrl || extractHdImageUrl(selectedOrder.result)!;
              return (
                <div className="space-y-3">
                  <img
                    src={url}
                    alt="Hasil HD"
                    className="w-full max-h-72 object-contain rounded-2xl bg-slate-900"
                  />
                  <a
                    href={url}
                    download="HD_FOTO_AZRYL.png"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Foto HD</span>
                  </a>
                </div>
              );
            })() : (
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl max-h-60 overflow-y-auto leading-relaxed">
                <pre className="whitespace-pre-wrap break-all">
                  {typeof selectedOrder.result === 'string'
                    ? selectedOrder.result
                    : JSON.stringify(selectedOrder.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
