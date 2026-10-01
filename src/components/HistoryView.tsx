import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  History, 
  ReceiptText, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Copy, 
  Eye, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah, formatDate } from '../utils/formatter';
import { 
  listenUserOrders, 
  listenUserDeposits, 
  listenUserMutations 
} from '../services/firestoreService';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);

    const unsubOrders = listenUserOrders(profile.uid, (data) => {
      setOrders(data);
      setLoading(false);
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

  const copyToClipboard = (text: string, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    showSuccess('Tersalin!', `${label} disalin ke clipboard.`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mt-5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pesanan Saya ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('deposits')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'deposits'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Deposit ({deposits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mutations')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'mutations'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Mutasi Saldo ({mutations.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PESANAN SAYA */}
      {activeTab === 'orders' && (
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
                .filter(o => 
                  !searchTerm || 
                  o.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (o.id && o.id.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((order) => (
                  <div key={order.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {order.productId === 'am_prem' ? 'AM' : 'HD'}
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
                            onClick={() => copyToClipboard(order.id || '', 'ID Transaksi')}
                            className="hover:text-violet-600"
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
                          className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
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
                ))}
            </div>
          )}
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
                  <div key={deposit.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        deposit.method === 'DANA' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {deposit.method}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold font-mono text-slate-900">
                            {formatRupiah(deposit.amount)}
                          </span>
                          {getStatusBadge(deposit.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pengirim: <strong className="text-slate-700">{deposit.senderName}</strong> via {deposit.method}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(deposit.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {deposit.rejectionReason && (
                        <p className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                          Alasan: {deposit.rejectionReason}
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
                          <span>→</span>
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

      {/* Order Result Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Detail Hasil: {selectedOrder.productName}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedOrder.result?.resultUrl ? (
              <div className="space-y-3">
                <img
                  src={selectedOrder.result.resultUrl}
                  alt="Hasil HD"
                  className="w-full max-h-72 object-contain rounded-2xl bg-slate-900"
                />
                <a
                  href={selectedOrder.result.resultUrl}
                  download="HD_FOTO_AZRYL.png"
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Foto HD</span>
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>Daftar Akun:</span>
                  <button
                    onClick={() => {
                      const text = typeof selectedOrder.result === 'string' 
                        ? selectedOrder.result 
                        : JSON.stringify(selectedOrder.result, null, 2);
                      copyToClipboard(text, 'Akun');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </button>
                </div>
                <div className="p-3.5 bg-slate-900 text-violet-300 font-mono text-xs rounded-2xl max-h-60 overflow-y-auto leading-relaxed">
                  <pre className="whitespace-pre-wrap break-all">
                    {typeof selectedOrder.result === 'string'
                      ? selectedOrder.result
                      : JSON.stringify(selectedOrder.result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
