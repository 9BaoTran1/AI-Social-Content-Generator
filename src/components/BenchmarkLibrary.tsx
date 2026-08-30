import React, { useState } from 'react';
import { SampleTemplate, ThemeMode } from '../types';
import { BENCHMARK_TEMPLATES } from '../data/defaultPrograms';
import {
  MessageSquare,
  Copy,
  Check,
  Sparkles,
  Tag,
  ArrowRight,
  Video,
  Linkedin,
  Facebook,
  Search,
  BookmarkCheck,
  AtSign
} from 'lucide-react';

interface BenchmarkLibraryProps {
  onUseTemplate: (templateContent: string) => void;
  theme: ThemeMode;
}

export const BenchmarkLibrary: React.FC<BenchmarkLibraryProps> = ({ onUseTemplate, theme }) => {
  const isDark = theme === 'dark';
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = BENCHMARK_TEMPLATES.filter((t) => {
    const matchPlatform = filterPlatform === 'All' || t.platform.toLowerCase() === filterPlatform.toLowerCase();
    const matchSearch =
      searchTerm.trim() === '' ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchPlatform && matchSearch;
  });

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'TikTok':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'LinkedIn':
        return <Linkedin className="w-4 h-4 text-sky-500" />;
      case 'Facebook':
        return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'Threads':
        return <AtSign className="w-4 h-4 text-emerald-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Benchmark Thực Chiến
            </span>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-indigo-600" />
              <span>Kho Mẫu Comment & Post Chuyển Đổi Cao</span>
            </h2>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Tuyển tập các khung mẫu content TikTok, Facebook (HR, L&D, QA/QC Talkshow), Threads và LinkedIn InMail đã được kiểm chứng thực tế mang lại tỷ lệ chuyển đổi cao nhất thành tin nhắn 1-1.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ngành, vị trí (HR, QA, L&D)..."
              className={`w-full sm:w-60 border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Platform Filters */}
          <div
            className={`flex p-1 rounded-xl border text-xs overflow-x-auto ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {['All', 'TikTok', 'Facebook', 'Threads', 'LinkedIn'].map((plat) => (
              <button
                key={plat}
                onClick={() => setFilterPlatform(plat)}
                className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterPlatform === plat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {plat === 'All' ? 'Tất cả' : plat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item: SampleTemplate) => (
          <div
            key={item.id}
            className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-4 transition-all hover:border-indigo-500/50 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="space-y-3">
              {/* Header tags */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    {getPlatformIcon(item.platform)}
                  </div>
                  <span className="text-xs font-bold">
                    {item.platform} • <span className="opacity-80">{item.category}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-bold text-sm tracking-tight">{item.title}</h3>

              {/* Insight */}
              <p className={`text-xs italic p-2.5 rounded-xl border ${
                isDark ? 'bg-indigo-950/20 text-indigo-300 border-indigo-900/40' : 'bg-indigo-50/60 text-indigo-900 border-indigo-100'
              }`}>
                💡 <strong>Insight:</strong> {item.keyInsight}
              </p>

              {/* Content box */}
              <div
                className={`p-3.5 rounded-xl border font-sans text-xs leading-relaxed whitespace-pre-line select-all max-h-72 overflow-y-auto ${
                  isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-200' : 'bg-slate-50/80 border-slate-200 text-slate-800'
                }`}
              >
                {item.content}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className={`pt-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                onClick={() => onUseTemplate(item.content)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Dùng mẫu này trong Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => copyText(item.content, item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  copiedId === item.id
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
                }`}
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Đã copy!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy mẫu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
