import React, { useState } from 'react';
import { Sparkles, BookOpen, Bot, Plus, Sun, Moon, Key, Check } from 'lucide-react';
import { ThemeMode } from '../types';
import { getApiKey, setApiKey } from '../lib/aiService';

interface NavbarProps {
  activeTab: 'workbench' | 'programs' | 'assistant';
  setActiveTab: (tab: 'workbench' | 'programs' | 'assistant') => void;
  onOpenAddProgram: () => void;
  programCount: { ws: number; ct: number };
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddProgram,
  programCount,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(getApiKey());
  const [keySavedFeedback, setKeySavedFeedback] = useState<boolean>(false);

  const handleSaveKey = () => {
    setApiKey(apiKeyInput.trim());
    setKeySavedFeedback(true);
    setTimeout(() => {
      setKeySavedFeedback(false);
      setShowKeyModal(false);
    }, 1200);
  };

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-slate-950/90 border-b border-slate-800/80 text-slate-100'
          : 'bg-white/95 border-b border-slate-200/90 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clean Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('workbench')}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-500 transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`font-bold text-base tracking-tight font-sans ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  PROMPT ORDER AI
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700/60'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Social Conversion
                </span>
              </div>
              <p
                className={`text-[11px] hidden sm:block ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Hệ thống 7 Order chuyển đổi Comment thành Inbox
              </p>
            </div>
          </div>

          {/* Clean 3 Main Tabs */}
          <nav
            className={`flex items-center space-x-1 p-1 rounded-xl border ${
              isDark
                ? 'bg-slate-900/90 border-slate-800/80'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setActiveTab('workbench')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'workbench'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio Tạo Content</span>
            </button>

            <button
              onClick={() => setActiveTab('programs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'programs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kho WS/CT ({programCount.ws + programCount.ct})</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Trợ Lý & Lịch Sử</span>
            </button>
          </nav>

          {/* Actions: Theme Toggle & Add Button */}
          <div className="flex items-center space-x-2">
            {/* API Key Modal Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              title="Cài đặt Gemini API Key"
              className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline text-[11px]">API Key</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700/80'
                  : 'bg-white hover:bg-slate-50 text-indigo-600 border-slate-200 shadow-xs'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px] text-slate-300">Bản sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline text-[11px] text-slate-700 font-semibold">Bản tối</span>
                </>
              )}
            </button>

            {/* Add Program Button */}
            <button
              onClick={onOpenAddProgram}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Thêm WS / CT</span>
            </button>
          </div>
        </div>
      </div>

      {/* API Key Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl p-5 border shadow-xl space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold">Cài đặt Gemini API Key</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Ứng dụng có thể chạy trực tiếp trên trình duyệt hoặc qua server. Nhập Gemini API Key của bạn để sử dụng độc lập mọi lúc mọi nơi:
              </p>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Nhập AIzaSy... hoặc khóa API của bạn"
                className="w-full border rounded-xl p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400">
                Khóa API được lưu an toàn trong trình duyệt của bạn (Local Storage) và không bị gửi ra ngoài.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {keySavedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Đã lưu!</span>
                  </>
                ) : (
                  <span>Lưu Cài Đặt</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
