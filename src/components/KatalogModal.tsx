import React from 'react';
import { Tag, ArrowRight, X } from 'lucide-react';
import { formatRupiah } from '../utils/formatter';
import type { ProductItem } from '../types';

interface KatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onSelectProduct: (productId: string) => void;
}

export const KatalogModal: React.FC<KatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Katalog & Daftar Harga</h2>
              <p className="text-xs text-slate-500">Daftar produk resmi & harga bersahabat AZRYLPREM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                prod.active 
                  ? 'border-slate-100 hover:border-emerald-500 bg-slate-50/50 hover:bg-white shadow-xs hover:shadow-md' 
                  : 'border-slate-200 bg-slate-100/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    prod.id === 'am_prem' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    {prod.badge || 'PRODUK'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {prod.active ? 'Tersedia' : 'Habis'}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">{prod.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prod.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Harga</span>
                  <span className="text-lg font-black font-mono text-emerald-600">
                    {formatRupiah(prod.price)}
                  </span>
                </div>
                <button
                  disabled={!prod.active}
                  onClick={() => {
                    onClose();
                    onSelectProduct(prod.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <span>Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
