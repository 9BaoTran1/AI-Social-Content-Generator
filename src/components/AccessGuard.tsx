import React, { useState, useEffect } from 'react';
import { Lock, Key, ShieldCheck, ArrowRight, AlertCircle, Check, Copy } from 'lucide-react';
import { ThemeMode } from '../types';

interface AccessGuardProps {
  children: React.ReactNode;
  theme: ThemeMode;
}

const DEFAULT_SECRET_KEY = 'ordersieunhan';

export const AccessGuard: React.FC<AccessGuardProps> = ({ children, theme }) => {
  const isDark = theme === 'dark';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check URL parameters (?key=... or ?access=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlKey = urlParams.get('key') || urlParams.get('access');

      const customStoredKey = localStorage.getItem('app_custom_secret_key') || DEFAULT_SECRET_KEY;
      const adminKey = urlParams.get('admin_key');

      if (
        (urlKey && urlKey.trim().toLowerCase() === customStoredKey.toLowerCase()) ||
        (adminKey && adminKey.trim().toLowerCase() === 'admincrt2026')
      ) {
        localStorage.setItem('app_access_granted', 'true');
        if (adminKey && adminKey.trim().toLowerCase() === 'admincrt2026') {
          sessionStorage.setItem('order_ai_crt_admin_auth', 'true');
        }
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // 2. Check localStorage
      const granted = localStorage.getItem('app_access_granted');
      if (granted === 'true') {
        setIsAuthenticated(true);
      }
      setIsChecking(false);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const customStoredKey = localStorage.getItem('app_custom_secret_key') || DEFAULT_SECRET_KEY;

    if (passcode.trim().toLowerCase() === customStoredKey.toLowerCase()) {
      localStorage.setItem('app_access_granted', 'true');
      setIsAuthenticated(true);
      setErrorMessage(null);
    } else {
      setErrorMessage('Mã truy cập không chính xác. Vui lòng kiểm tra lại hoặc sử dụng đường link bảo mật.');
    }
  };

  if (isChecking) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-2xl p-6 sm:p-8 border shadow-xl space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Khu Vực Làm Việc Riêng Tư</h1>
          <p className={`text-xs leading-relaxed max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Ứng dụng được bảo vệ ở chế độ riêng tư. Chỉ những ai có <strong>Mã bảo mật</strong> hoặc truy cập bằng <strong>Link riêng</strong> mới có thể sử dụng.
          </p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Mã truy cập / Mật khẩu:
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Nhập mã truy cập..."
                autoFocus
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Mở Khóa Truy Cập</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Tip for Link Sharing */}
        <div
          className={`p-3 rounded-xl border text-[11px] space-y-1 leading-relaxed ${
            isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-indigo-50/50 border-indigo-100 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mẹo truy cập 1 chạm không cần nhập mật khẩu:</span>
          </div>
          <p>
            Bạn có thể đính kèm đuôi <code className="font-mono bg-indigo-100 dark:bg-indigo-950 px-1 py-0.2 rounded">?key={DEFAULT_SECRET_KEY}</code> vào cuối link web để người nhận tự động vào thẳng ứng dụng.
          </p>
        </div>
      </div>
    </div>
  );
};
