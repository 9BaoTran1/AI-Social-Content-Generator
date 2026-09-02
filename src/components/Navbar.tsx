import React from 'react';
import { Sparkles, BookOpen, Bot, Plus, Sun, Moon, BookmarkCheck, Layers, BookMarked } from 'lucide-react';
import { ThemeMode } from '../types';

interface NavbarProps {
  activeTab: 'workbench' | 'orders' | 'benchmark' | 'programs' | 'assistant' | 'guide';
  setActiveTab: (tab: 'workbench' | 'orders' | 'benchmark' | 'programs' | 'assistant' | 'guide') => void;
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
  const totalPrograms = programCount.ws + programCount.ct;

  const navTabs = [
    {
      id: 'workbench' as const,
      label: 'Tạo Bài Viết',
      icon: Sparkles,
      iconColor: 'text-indigo-500',
    },
    {
      id: 'orders' as const,
      label: '7 Dạng Bài',
      icon: Layers,
      iconColor: 'text-violet-500',
    },
    {
      id: 'benchmark' as const,
      label: 'Bài Mẫu',
      icon: BookmarkCheck,
      iconColor: 'text-amber-500',
    },
    {
      id: 'programs' as const,
      label: `Kho WS / CRT (${totalPrograms})`,
      icon: BookOpen,
      iconColor: 'text-emerald-500',
    },
    {
      id: 'assistant' as const,
      label: 'Trợ Lý AI',
      icon: Bot,
      iconColor: 'text-cyan-500',
    },
    {
      id: 'guide' as const,
      label: 'Hướng Dẫn',
      icon: BookMarked,
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-slate-950/95 border-b border-slate-800/80 text-slate-100'
          : 'bg-white/95 border-b border-slate-200/90 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Row 1: Logo & Brand + Action Buttons */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Logo & Brand Info */}
          <div
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group shrink-0"
            onClick={() => setActiveTab('workbench')}
            title="Về trang Tạo Bài Viết"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-500 transition-colors shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span
                  className={`font-black text-sm sm:text-base tracking-tight font-sans ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  PROMPT ORDER AI
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full border hidden md:inline-block ${
                    isDark
                      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  Tạo Content & Kịch Bản Nhắn Tin
                </span>
              </div>
              <p
                className={`text-[10px] sm:text-xs font-medium md:hidden ${
                  isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              >
                Tạo Content & Kịch Bản Nhắn Tin
              </p>
              <p
                className={`text-[10px] sm:text-[11px] hidden md:block ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Hệ thống tạo bài viết & kịch bản nhắn tin tư vấn tự nhiên
              </p>
            </div>
          </div>

          {/* Action Buttons: Add WS/CT (Prominent Indigo) & Theme Toggle */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Add Program Button */}
            <button
              onClick={onOpenAddProgram}
              title="Thêm Workshop (WS) hoặc Chương Trình CRT Mới"
              className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/25 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span className="hidden xs:inline sm:inline">+ Thêm WS / CRT</span>
              <span className="xs:hidden sm:hidden">+ Thêm</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className={`min-h-[38px] sm:min-h-[40px] min-w-[38px] sm:min-w-[40px] p-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700/80 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-indigo-600 border-slate-200 shadow-2xs'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline text-[11px] text-slate-300 font-medium">Bản sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden lg:inline text-[11px] text-slate-700 font-semibold">Bản tối</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Navigation Tabs Bar (Grid 3 cols on mobile, 6 cols on sm+ tablet/desktop. NO overflow-x-auto, 100% visible) */}
        <div className="pb-2 pt-0.5 sm:pb-2.5 sm:pt-1 border-t border-slate-200/70 dark:border-slate-800/70">
          <nav
            aria-label="Thanh điều hướng chức năng"
            className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2"
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[40px] px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400/40 dark:ring-indigo-600/60'
                      : isDark
                      ? 'text-slate-300 bg-slate-900/80 hover:text-white hover:bg-slate-800 border border-slate-800'
                      : 'text-slate-700 bg-slate-100/90 hover:text-slate-900 hover:bg-white border border-slate-200 shadow-2xs'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-white' : tab.iconColor || 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
