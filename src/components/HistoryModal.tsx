import React, { useState } from 'react';
import { GeneratedContent } from '../types';
import { getSavedHistory } from '../lib/storage';
import {
  Clock,
  Trash2,
  Copy,
  Check,
  FileText,
  UserCheck,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface HistoryModalProps {
  onUseContent: (content: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onUseContent }) => {
  const [historyItems, setHistoryItems] = useState<GeneratedContent[]>(getSavedHistory());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const clearHistory = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử tạo content không?')) {
      localStorage.removeItem('order_ai_history_v1');
      setHistoryItems([]);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Lịch Sử Sản Xuất
            </span>
            <h2 className="text-lg font-bold text-white">
              Lịch Sử Tạo Content & Kịch Bản DM ({historyItems.length})
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Xem lại các bài viết, comment và kịch bản nhắn tin riêng đã tạo trước đó trên các nền tảng.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/40 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa lịch sử</span>
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <div className="min-h-[300px] rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 flex flex-col items-center justify-center text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">Chưa có lịch sử tạo content</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Các nội dung bạn tạo ở Studio hoặc Chat AI sẽ tự động được lưu lại tại đây để tái sử dụng nhanh chóng.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.orderTitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-300">
                    {item.platform}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    WS/CT: {item.programTitle}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>

              {/* Variations */}
              <div className="space-y-2">
                {item.variations.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span>Mẫu {i + 1}</span>
                      <button
                        onClick={() => copyText(v, `hist-${item.id}-${i}`)}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        {copiedId === `hist-${item.id}-${i}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Đã copy</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{v}</p>
                  </div>
                ))}
              </div>

              {/* DM Script */}
              {item.dmFollowUpScript && (
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs space-y-1">
                  <span className="font-bold text-emerald-300 block text-[11px]">
                    Kịch bản Nhắn Tin Riêng:
                  </span>
                  <p className="text-slate-300 italic">
                    1. {item.dmFollowUpScript.step1_empathy}
                  </p>
                  <p className="text-slate-300 italic">
                    2. {item.dmFollowUpScript.step2_qualifyQuestion}
                  </p>
                  <p className="text-slate-300 italic">
                    3. {item.dmFollowUpScript.step3_inviteLink}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
