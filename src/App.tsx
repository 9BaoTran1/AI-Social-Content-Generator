import React, { useState, useEffect } from 'react';
import { ProgramItem, OrderType, ThemeMode } from './types';
import { getSavedPrograms, savePrograms } from './lib/storage';
import { checkAndImportFromUrl, syncProgramsFromCloud, autoPublishToCloud, saveAdminSyncToken } from './lib/syncService';
import { Navbar } from './components/Navbar';
import { GeneratorWorkbench } from './components/GeneratorWorkbench';
import { OrderGrid } from './components/OrderGrid';
import { ProgramManager } from './components/ProgramManager';
import { AssistantView } from './components/AssistantView';
import { BenchmarkLibrary } from './components/BenchmarkLibrary';
import { UserGuide } from './components/UserGuide';
import { CommandPalette } from './components/CommandPalette';
import { CheckCircle2, X, Sparkles } from 'lucide-react';

export default function App() {
  const [programs, setPrograms] = useState<ProgramItem[]>(getSavedPrograms());
  const [activeTab, setActiveTab] = useState<'workbench' | 'orders' | 'benchmark' | 'programs' | 'assistant' | 'guide'>('workbench');
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>('order_1');
  const [prefillContext, setPrefillContext] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [syncAlert, setSyncAlert] = useState<{ message: string; titles?: string[] } | null>(null);

  // Theme State (stored preference or default 'light')
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('order_ai_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('order_ai_theme', next);
      return next;
    });
  };

  // Check admin_key and sync_token in URL parameters immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const adminKey = urlParams.get('admin_key');
      const syncToken = urlParams.get('sync_token') || urlParams.get('admin_sync_token');

      if (syncToken) {
        saveAdminSyncToken(syncToken);
        urlParams.delete('sync_token');
        urlParams.delete('admin_sync_token');
        const newSearch = urlParams.toString();
        window.history.replaceState({}, document.title, window.location.pathname + (newSearch ? `?${newSearch}` : ''));
      }

      if (adminKey && adminKey.trim().toLowerCase() === 'admincrt2026') {
        sessionStorage.setItem('order_ai_crt_admin_auth', 'true');
        localStorage.setItem('app_access_granted', 'true');
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('crt_admin_changed'));
        }
      }
    }
  }, []);

  // CRT Auto-Sync: Tự động kéo từ Cloud khi khởi động, khi chuyển tab, và định kỳ 45s
  useEffect(() => {
    // 1. Kiểm tra link P2P nếu có
    const imported = checkAndImportFromUrl();
    if (imported && imported.imported) {
      const fresh = getSavedPrograms();
      setPrograms(fresh);
      setSyncAlert({
        message: `Đã tự động đồng bộ ${imported.count} Workshop/Chương trình mới từ Admin!`,
        titles: imported.titles,
      });
      setTimeout(() => setSyncAlert(null), 8000);
    }

    // 2. Hàm kiểm tra và gộp cập nhật từ Central Cloud
    const doCloudSync = () => {
      syncProgramsFromCloud().then((res) => {
        if (res.updated) {
          const fresh = getSavedPrograms();
          setPrograms(fresh);
          setSyncAlert({
            message: res.message || `Đã tự động nhận ${res.count} chương trình mới từ Admin!`,
            titles: res.titles,
          });
          setTimeout(() => setSyncAlert(null), 6000);
        }
      });
    };

    // Chạy ngay khi tải trang
    doCloudSync();

    // Tự động kiểm tra cập nhật mỗi khi người dùng chuyển lại tab này
    const handleFocus = () => {
      doCloudSync();
    };
    window.addEventListener('focus', handleFocus);

    // Chạy ngầm định kỳ mỗi 45 giây để người dùng luôn có dữ liệu mới nhất
    const intervalId = setInterval(doCloudSync, 45000);

    // Lắng nghe sự kiện đồng bộ từ các component khác
    const handleSynced = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPrograms(e.detail);
      } else {
        setPrograms(getSavedPrograms());
      }
    };
    window.addEventListener('crt_programs_synced', handleSynced);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      window.removeEventListener('crt_programs_synced', handleSynced);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('order_ai_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleOpenPalette = () => setIsCommandPaletteOpen(true);
    window.addEventListener('open_command_palette', handleOpenPalette);
    return () => window.removeEventListener('open_command_palette', handleOpenPalette);
  }, []);

  const handleUseTemplate = (templateContent: string) => {
    setPrefillContext(templateContent);
    setActiveTab('workbench');
  };

  const handleSelectOrderFromGrid = (orderType: OrderType) => {
    setSelectedOrderType(orderType);
    setActiveTab('workbench');
  };

  // Program Handlers: TỰ ĐỘNG ĐẨY LÊN CLOUD NGAY KHI ADMIN CẬP NHẬT
  const handleAddProgram = (newProg: ProgramItem) => {
    const updated = [newProg, ...programs];
    setPrograms(updated);
    savePrograms(updated);
    
    // Tự động đẩy lên Cloud cho toàn bộ người dùng
    autoPublishToCloud(updated).then((res) => {
      if (res.success) {
        setSyncAlert({
          message: 'Đã tự động đồng bộ Workshop mới lên hệ thống cho mọi người dùng!',
          titles: [newProg.title],
        });
        setTimeout(() => setSyncAlert(null), 5000);
      }
    });
  };

  const handleUpdateProgram = (updatedProg: ProgramItem) => {
    const updated = programs.map((p) => (p.id === updatedProg.id ? updatedProg : p));
    setPrograms(updated);
    savePrograms(updated);

    // Tự động cập nhật thay đổi lên Cloud cho toàn bộ người dùng
    autoPublishToCloud(updated).then((res) => {
      if (res.success) {
        setSyncAlert({
          message: 'Đã tự động cập nhật thay đổi lên hệ thống cho mọi người dùng!',
          titles: [updatedProg.title],
        });
        setTimeout(() => setSyncAlert(null), 5000);
      }
    });
  };

  const handleDeleteProgram = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa Workshop/Chương trình này khỏi kho?')) {
      const updated = programs.filter((p) => p.id !== id);
      setPrograms(updated);
      savePrograms(updated);

      // Tự động cập nhật xóa lên Cloud cho toàn bộ người dùng
      autoPublishToCloud(updated).then((res) => {
        if (res.success) {
          setSyncAlert({
            message: 'Đã tự động cập nhật xóa mục này khỏi hệ thống chung của đội ngũ!',
          });
          setTimeout(() => setSyncAlert(null), 4000);
        }
      });
    }
  };

  const handleReloadPrograms = (newPrograms: ProgramItem[]) => {
    setPrograms(newPrograms);
    savePrograms(newPrograms);
    autoPublishToCloud(newPrograms);
  };

  const wsCount = programs.filter((p) => p.type === 'ws').length;
  const ctCount = programs.filter((p) => p.type === 'ct').length;

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddProgram={() => {
            setActiveTab('programs');
            setIsAddModalOpen(true);
          }}
          programCount={{ ws: wsCount, ct: ctCount }}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Sync Success Alert Banner */}
        {syncAlert && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
                isDark
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <span>{syncAlert.message}</span>
                  {syncAlert.titles && syncAlert.titles.length > 0 && (
                    <span className="opacity-90 ml-1.5 font-bold">
                      ({syncAlert.titles.slice(0, 3).join(', ')}
                      {syncAlert.titles.length > 3 ? '...' : ''})
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSyncAlert(null)}
                className="p-1 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'workbench' && (
            <GeneratorWorkbench
              programs={programs}
              initialOrderType={selectedOrderType}
              initialContext={prefillContext}
              onNavigateToPrograms={() => setActiveTab('programs')}
              theme={theme}
            />
          )}

          {activeTab === 'orders' && (
            <OrderGrid
              onSelectOrder={handleSelectOrderFromGrid}
              theme={theme}
            />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkLibrary
              onUseTemplate={handleUseTemplate}
              theme={theme}
            />
          )}

          {activeTab === 'programs' && (
            <ProgramManager
              programs={programs}
              onAddProgram={handleAddProgram}
              onUpdateProgram={handleUpdateProgram}
              onDeleteProgram={handleDeleteProgram}
              onReloadPrograms={handleReloadPrograms}
              isAddModalOpen={isAddModalOpen}
              setIsAddModalOpen={setIsAddModalOpen}
              theme={theme}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantView
              programs={programs}
              onSelectOrder={(orderType) => {
                setSelectedOrderType(orderType);
                setActiveTab('workbench');
              }}
              theme={theme}
            />
          )}

          {activeTab === 'guide' && (
            <UserGuide
              onNavigate={(tab) => setActiveTab(tab)}
              theme={theme}
            />
          )}
        </main>

        {/* Footer */}
        <footer
          className={`border-t py-4 text-center text-xs transition-colors ${
            isDark
              ? 'border-slate-900 bg-slate-950 text-slate-500'
              : 'border-slate-200 bg-white text-slate-500'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              PROMPT ORDER AI • Công cụ tạo nội dung & kịch bản chuyển đổi
            </p>
            <p className="text-[11px] text-slate-400">
              Tối ưu cho TikTok, Facebook, Threads, LinkedIn & Email
            </p>
          </div>
        </footer>
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectTab={setActiveTab}
          onSelectOrder={(order) => {
            setSelectedOrderType(order);
            setActiveTab('workbench');
          }}
          programs={programs}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
  );
}
