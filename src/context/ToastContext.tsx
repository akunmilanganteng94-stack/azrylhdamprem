import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, description?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showWarning: (message: string, description?: string) => void;
  showInfo: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    description?: string,
    duration = 4500
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { id, type, message, description, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string, description?: string) => {
    showToast('success', message, description);
  }, [showToast]);

  const showError = useCallback((message: string, description?: string) => {
    showToast('error', message, description);
  }, [showToast]);

  const showWarning = useCallback((message: string, description?: string) => {
    showToast('warning', message, description);
  }, [showToast]);

  const showInfo = useCallback((message: string, description?: string) => {
    showToast('info', message, description);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      showToast,
      removeToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      {/* Bottom Floating Toast Notification Stack */}
      <div 
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-[92%] max-w-md pointer-events-none"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
                isSuccess
                  ? 'bg-emerald-950/90 text-white border-emerald-500/40 shadow-emerald-900/20'
                  : isWarning
                  ? 'bg-amber-950/90 text-white border-amber-500/40 shadow-amber-900/20'
                  : isError
                  ? 'bg-rose-950/90 text-white border-rose-500/40 shadow-rose-900/20'
                  : 'bg-slate-900/90 text-white border-slate-700/50 shadow-slate-950/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-sm font-semibold tracking-wide leading-tight">
                  {toast.message}
                </p>
                {toast.description && (
                  <p className="text-xs text-slate-300 mt-1 leading-snug">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-white transition-colors p-1 -mr-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
