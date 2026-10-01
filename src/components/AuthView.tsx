import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthView: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const { showSuccess, showError } = useToast();

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setUnauthorizedDomain(null);

    if (isRegister) {
      if (!name.trim()) {
        setErrorMsg('Nama lengkap wajib diisi.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi password tidak cocok.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password minimal 6 karakter.');
        return;
      }

      try {
        setLoading(true);
        await registerWithEmail(name.trim(), email.trim(), password);
        showSuccess('Pendaftaran Berhasil!', 'Selamat datang di platform premium AZRYLPREM.');
      } catch (err: any) {
        console.error('Register error:', err);
        const code = err.code || '';
        let msg = 'Gagal mendaftar akun.';
        if (code === 'auth/email-already-in-use') msg = 'Email sudah terdaftar. Silakan login.';
        else if (code === 'auth/invalid-email') msg = 'Format email tidak valid.';
        else if (code === 'auth/weak-password') msg = 'Password terlalu lemah (min 6 karakter).';
        setErrorMsg(msg);
        showError('Pendaftaran Gagal', msg);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        await loginWithEmail(email.trim(), password);
        showSuccess('Login Berhasil!', 'Selamat datang kembali di AZRYLPREM.');
      } catch (err: any) {
        const code = err.code || '';
        let msg = 'Email atau kata sandi tidak cocok.';
        if (code === 'auth/user-not-found') msg = 'Akun dengan email ini belum terdaftar.';
        else if (code === 'auth/wrong-password') msg = 'Kata sandi tidak sesuai.';
        setErrorMsg(msg);
        showError('Login Gagal', msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setUnauthorizedDomain(null);
      const result = await loginWithGoogle();
      if (result && !result.success) {
        if (result.unauthorizedDomain) {
          setUnauthorizedDomain(result.unauthorizedDomain);
        } else if (result.error && result.error !== 'Popup login ditutup.') {
          setErrorMsg(result.error);
        }
      } else if (result && result.success) {
        showSuccess('Login Google Berhasil!', 'Selamat datang di AZRYLPREM.');
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(currentHostname);
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        const msg = err?.message || 'Gagal login menggunakan Google.';
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyDomain = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
      showSuccess('Domain Tersalin', `${currentHostname} disalin ke clipboard.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 flex flex-col justify-center items-center px-4 py-8">
      {/* Background ambient lighting */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 p-6 sm:p-8 relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 tracking-tight">
            {isRegister ? 'Buat Akun Baru' : 'Masuk ke AZRYLPREM'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
            {isRegister 
              ? 'Daftar akun untuk order Alight Motion Premium & gunakan AI HD tools.' 
              : 'Kelola transaksi, pantau saldo, dan order layanan digital AZRYLPREM.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-5 text-sm font-bold">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); setUnauthorizedDomain(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              !isRegister ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); setUnauthorizedDomain(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              isRegister ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Unauthorized Domain Explanatory Banner */}
        {unauthorizedDomain && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">
                    Domain Belum Diizinkan di Firebase Console
                  </p>
                  <p className="text-amber-800 mt-1 leading-relaxed">
                    Google Sign-In membutuhkan domain saat ini didaftarkan pada Authorized Domains di Firebase Console proyek Anda (<span className="font-mono text-amber-900 font-semibold">azrylstore-7f4e2</span>).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnauthorizedDomain(null)}
                className="text-amber-600 hover:text-amber-800 font-bold text-xs p-1"
                title="Tutup pemberitahuan"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between gap-2 font-mono text-[11px]">
              <span className="truncate text-slate-800 font-semibold">{currentHostname}</span>
              <button
                type="button"
                onClick={copyDomain}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-sans font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? 'Tersalin' : 'Salin Domain'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://console.firebase.google.com/project/azrylstore-7f4e2/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold transition shadow-xs"
              >
                <span>Buka Firebase Console Settings</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="text-[11px] text-amber-900/90 space-y-1 pt-1 border-t border-amber-200/60">
              <p><strong>Langkah Aktivasi Google Auth:</strong></p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Klik tombol di atas untuk membuka <strong>Firebase Console &rarr; Authentication &rarr; Settings</strong>.</li>
                <li>Pilih tab <strong>Authorized domains &rarr; Add domain</strong>.</li>
                <li>Paste domain <code className="bg-amber-100/70 px-1 py-0.5 rounded">{currentHostname}</code> lalu klik Simpan.</li>
              </ol>
            </div>

            <p className="text-[11px] font-bold text-emerald-700 pt-1 border-t border-amber-200/60">
              💡 Solusi Instan: Gunakan Form Email &amp; Password di bawah yang aktif 100% tanpa perlu whitelist domain!
            </p>
          </div>
        )}

        {/* Regular Error Alert */}
        {errorMsg && !unauthorizedDomain && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Azril Pratama"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password di atas"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Daftar Sekarang' : 'Masuk Sekarang'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
              Atau Lanjutkan Dengan
            </span>
          </div>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleAuth}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Masuk dengan Google</span>
        </button>

        {/* Security badge */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sistem Keamanan Terenkripsi Firebase Auth</span>
        </div>
      </div>
    </div>
  );
};
