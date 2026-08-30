import React, { useState } from 'react';
import { SampleTemplate } from '../types';
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
  Facebook
} from 'lucide-react';

interface BenchmarkLibraryProps {
  onUseTemplate: (templateContent: string) => void;
}

export const BenchmarkLibrary: React.FC<BenchmarkLibraryProps> = ({ onUseTemplate }) => {
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered =
    filterPlatform === 'All'
      ? BENCHMARK_TEMPLATES
      : BENCHMARK_TEMPLATES.filter((t) => t.platform === filterPlatform);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'TikTok':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'LinkedIn':
        return <Linkedin className="w-4 h-4 text-sky-400" />;
      case 'Facebook':
        return <Facebook className="w-4 h-4 text-blue-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Benchmark Thực Chiến
            </span>
            <h2 className="text-lg font-bold text-white">
              Kho Khung Mẫu Comment & Outreach Đã Có Kết Quả Tốt
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Tổng hợp các mẫu comment TikTok, tin nhắn LinkedIn và phân tích Facebook đã được chứng minh tỷ lệ chuyển đổi cao thành inbox.
          </p>
        </div>

        {/* Platform Filter Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {['All', 'TikTok', 'LinkedIn', 'Facebook'].map((plat) => (
            <button
              key={plat}
              onClick={() => setFilterPlatform(plat)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterPlatform === plat
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {plat === 'All' ? 'Tất cả mẫu' : plat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item: SampleTemplate) => (
          <div
            key={item.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-slate-800">
                    {getPlatformIcon(item.platform)}
                  </div>
                  <span className="text-xs font-bold text-slate-300">
                    {item.platform} • {item.category}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="font-bold text-white text-sm">{item.title}</h3>

              <p className="text-xs text-indigo-300/90 italic bg-indigo-950/30 p-2 rounded-lg border border-indigo-900/40">
                💡 Insight: {item.keyInsight}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-line select-all">
                {item.content}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => onUseTemplate(item.content)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Dùng mẫu này trong Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => copyText(item.content, item.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Đã copy!</span>
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
