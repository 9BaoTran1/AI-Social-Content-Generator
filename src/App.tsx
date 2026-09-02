import React, { useState, useEffect } from 'react';
import { ProgramItem, OrderType, ThemeMode } from './types';
import { getSavedPrograms, savePrograms } from './lib/storage';
import { Navbar } from './components/Navbar';
import { GeneratorWorkbench } from './components/GeneratorWorkbench';
import { OrderGrid } from './components/OrderGrid';
import { ProgramManager } from './components/ProgramManager';
import { AssistantView } from './components/AssistantView';
import { BenchmarkLibrary } from './components/BenchmarkLibrary';
import { UserGuide } from './components/UserGuide';

export default function App() {
  const [programs, setPrograms] = useState<ProgramItem[]>(getSavedPrograms());
  const [activeTab, setActiveTab] = useState<'workbench' | 'orders' | 'benchmark' | 'programs' | 'assistant' | 'guide'>('workbench');
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>('order_1');
  const [prefillContext, setPrefillContext] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

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

  // Check admin_key in URL parameters immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const adminKey = urlParams.get('admin_key');
      if (adminKey && adminKey.trim().toLowerCase() === 'admincrt2026') {
        sessionStorage.setItem('order_ai_crt_admin_auth', 'true');
        localStorage.setItem('app_access_granted', 'true');
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('crt_admin_changed'));
        }
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('order_ai_theme', theme);
  }, [theme]);

  const handleUseTemplate = (templateContent: string) => {
    setPrefillContext(templateContent);
    setActiveTab('workbench');
  };

  const handleSelectOrderFromGrid = (orderType: OrderType) => {
    setSelectedOrderType(orderType);
    setActiveTab('workbench');
  };

  // Program Handlers
  const handleAddProgram = (newProg: ProgramItem) => {
    const updated = [newProg, ...programs];
    setPrograms(updated);
    savePrograms(updated);
  };

  const handleUpdateProgram = (updatedProg: ProgramItem) => {
    const updated = programs.map((p) => (p.id === updatedProg.id ? updatedProg : p));
    setPrograms(updated);
    savePrograms(updated);
  };

  const handleDeleteProgram = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa Workshop/Chương trình này khỏi kho?')) {
      const updated = programs.filter((p) => p.id !== id);
      setPrograms(updated);
      savePrograms(updated);
    }
  };

  const handleReloadPrograms = (newPrograms: ProgramItem[]) => {
    setPrograms(newPrograms);
    savePrograms(newPrograms);
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
        />

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
      </div>
  );
}
