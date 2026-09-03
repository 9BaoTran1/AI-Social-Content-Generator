import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Layers,
  BookmarkCheck,
  BookOpen,
  Bot,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { OrderType, ProgramItem, ThemeMode } from '../types';
import { ORDERS_METADATA } from '../data/defaultPrograms';
import { isSoundEnabled, toggleSound, playClickSound } from '../lib/audioService';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'workbench' | 'orders' | 'benchmark' | 'programs' | 'assistant' | 'guide') => void;
  onSelectOrder: (order: OrderType) => void;
  programs: ProgramItem[];
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectOrder,
  programs,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSoundOn(isSoundEnabled());
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          const evt = new CustomEvent('open_command_palette');
          window.dispatchEvent(evt);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  const filteredOrders = ORDERS_METADATA.filter(
    (o) =>
      o.title.toLowerCase().includes(query.toLowerCase()) ||
      o.platform.toLowerCase().includes(query.toLowerCase()) ||
      `order ${o.orderNumber}`.includes(query.toLowerCase())
  );

  const filteredPrograms = programs.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-indigo-950/20'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/40'
        }`}
      >
        {/* Search Input Bar */}
        <div className={`flex items-center px-4 py-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <Search className="w-4 h-4 text-indigo-500 mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhanh Order 1-7, Workshop, CRT, hoặc thao tác..."
            className={`w-full text-xs sm:text-sm bg-transparent outline-none placeholder-slate-400 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-400 ml-2">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          <div>
            <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Thao Tác Nhanh
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  playClickSound();
                  onToggleTheme();
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{isDark ? 'Giao Diện Sáng' : 'Giao Diện Tối'}</span>
              </button>

              <button
                onClick={handleToggleSound}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                {soundOn ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>{soundOn ? 'Âm Thanh: Bật' : 'Âm Thanh: Tắt'}</span>
              </button>
            </div>
          </div>

          {/* Orders 1 - 7 */}
          {filteredOrders.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                7 Dạng Bài (Orders)
              </p>
              <div className="space-y-1">
                {filteredOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => {
                      playClickSound();
                      onSelectOrder(order.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-indigo-950/40 text-slate-200' : 'hover:bg-indigo-50/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {order.orderNumber}
                      </span>
                      <span className="font-semibold">{order.title}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        • {order.platform}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Programs / CRT */}
          {filteredPrograms.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kho Workshop (WS) & Chương Trình (CRT)
              </p>
              <div className="space-y-1">
                {filteredPrograms.slice(0, 5).map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => {
                      playClickSound();
                      onSelectTab('programs');
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 border ${
                          prog.type === 'ws'
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {prog.type === 'ws' ? 'WS' : 'CRT'}
                      </span>
                      <span className="font-medium truncate">{prog.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredOrders.length === 0 && filteredPrograms.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Không tìm thấy kết quả phù hợp với "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className={`px-4 py-2 border-t text-[11px] flex items-center justify-between ${
            isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-indigo-500" />
            <span>Phím tắt mở nhanh: <strong>Ctrl + K</strong> hoặc <strong>⌘K</strong></span>
          </div>
          <button
            onClick={onClose}
            className="text-xs hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
