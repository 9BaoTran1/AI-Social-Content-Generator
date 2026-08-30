import React, { useState, useEffect } from 'react';
import { ProgramItem, OrderType, ThemeMode } from './types';
import { getSavedPrograms, savePrograms } from './lib/storage';
import { Navbar } from './components/Navbar';
import { GeneratorWorkbench } from './components/GeneratorWorkbench';
import { ProgramManager } from './components/ProgramManager';
import { AssistantView } from './components/AssistantView';
import { AccessGuard } from './components/AccessGuard';

export default function App() {
  const [programs, setPrograms] = useState<ProgramItem[]>(getSavedPrograms());
  const [activeTab, setActiveTab] = useState<'workbench' | 'programs' | 'assistant'>('workbench');
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>('order_1');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Theme State (default: 'light' since user asked for light version, or stored preference)
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

  useEffect(() => {
    localStorage.setItem('order_ai_theme', theme);
  }, [theme]);

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

  const wsCount = programs.filter((p) => p.type === 'ws').length;
  const ctCount = programs.filter((p) => p.type === 'ct').length;

  const isDark = theme === 'dark';

  return (
    <AccessGuard theme={theme}>
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
              onNavigateToPrograms={() => setActiveTab('programs')}
              theme={theme}
            />
          )}

          {activeTab === 'programs' && (
            <ProgramManager
              programs={programs}
              onAddProgram={handleAddProgram}
              onUpdateProgram={handleUpdateProgram}
              onDeleteProgram={handleDeleteProgram}
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
        </main>

        {/* Footer */}
        <footer
          className={`border-t py-4 text-center text-xs transition-colors ${
            isDark
              ? 'border-slate-900 bg-slate-950 text-slate-500'
              : 'border-slate-200 bg-white text-slate-500'
          }`}
        >
          <p>
            AI Social Content Specialist • Chuyển đổi Comment thành Inbox • Tuân thủ chuẩn TikTok, Facebook, Threads, LinkedIn
          </p>
        </footer>
      </div>
    </AccessGuard>
  );
}
