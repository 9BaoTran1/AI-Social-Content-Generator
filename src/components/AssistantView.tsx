import React, { useState, useRef, useEffect } from 'react';
import { ProgramItem, OrderType, ChatMessage, GeneratedContent, ThemeMode } from '../types';
import {
  Bot,
  Sparkles,
  Clock,
  MessageSquare,
  Send,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { getSavedHistory, saveHistoryItem } from '../lib/storage';
import { BENCHMARK_TEMPLATES } from '../data/defaultPrograms';
import { generateOrderAI, chatAI } from '../lib/aiService';

interface AssistantViewProps {
  programs: ProgramItem[];
  onSelectOrder: (orderType: OrderType) => void;
  theme?: ThemeMode;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  programs,
  onSelectOrder,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [subTab, setSubTab] = useState<'chat' | 'history' | 'benchmark'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Xin chào! Mình là Trợ lý AI Content 10 năm kinh nghiệm & Social Media Manager.

💡 Bạn có thể hỏi bất kỳ thắc mắc nào, gõ **"Hi"** để mở nhanh 7 Lệnh Order, hoặc gõ **"Order 1 [nội dung clip]"** để mình trực tiếp phân tích & tạo content ngay trong chat!`,
      timestamp: new Date().toISOString(),
      suggestedActions: [
        { label: 'Gõ "Hi" mở Menu 7 Order', action: 'Hi' },
        { label: '🎬 Order 1: Comment TikTok', action: 'Order 1: Clip nói về loay hoay tuổi 25' },
        { label: '💬 Order 2: Phân tích Facebook', action: 'Order 2: Bài viết về văn hóa sếp và nhân viên' },
        { label: '🧵 Order 4: Rải Comment Threads', action: 'Order 4: Tâm sự người đi làm kiệt sức' },
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // History State
  const [historyItems, setHistoryItems] = useState<GeneratedContent[]>(getSavedHistory());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (subTab === 'chat') {
      scrollToBottom();
    } else if (subTab === 'history') {
      setHistoryItems(getSavedHistory());
    }
  }, [subTab, messages, isChatLoading]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsChatLoading(true);

    try {
      // Check if user is triggering an Order like "Order 1 [context]"
      const lower = query.toLowerCase();
      const orderMatch = lower.match(/^order\s*([1-7])(.*)/i);

      if (orderMatch && orderMatch[2].trim().length > 5) {
        const orderNum = parseInt(orderMatch[1], 10);
        const orderContext = orderMatch[2].trim();
        const orderKey = `order_${orderNum}` as OrderType;

        const generatedObj = await generateOrderAI({
          orderType: orderKey,
          context: orderContext,
          programs,
        });

        generatedObj.orderTitle = `Order ${orderNum}`;
        generatedObj.platform =
          orderNum === 1
            ? 'TikTok'
            : orderNum <= 3
            ? 'Facebook'
            : orderNum <= 5
            ? 'Threads'
            : orderNum === 6
            ? 'LinkedIn'
            : 'Email';

        saveHistoryItem(generatedObj);
        setHistoryItems(getSavedHistory());

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: `Đã hoàn thành **Order ${orderNum}** cho bạn! Dự án được AI lựa chọn: **${generatedObj.programTitle}** (${
            generatedObj.programType === 'ws' ? 'Workshop' : 'Chương trình'
          }). Dưới đây là các phương án nội dung và kịch bản tin nhắn chuyển đổi:`,
          generatedResult: generatedObj,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsChatLoading(false);
        return;
      }

      // Normal chat request via aiService
      const chatRes = await chatAI({
        message: query,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        programs,
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: chatRes.reply,
        suggestedActions: chatRes.suggestedActions,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Xin lỗi, đã có lỗi xảy ra: ${err.message || 'Vui lòng thử lại.'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử tạo content không?')) {
      localStorage.removeItem('order_ai_history_v1');
      setHistoryItems([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border shadow-sm transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span>Trợ Lý AI & Thư Viện</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Hỏi đáp trực tiếp với chuyên gia Social Media, tra cứu lịch sử và học hỏi từ các bài mẫu chuẩn
          </p>
        </div>

        {/* Sub-tab pills */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setSubTab('chat')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chat Trợ Lý (Gõ Hi)</span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lịch Sử ({historyItems.length})</span>
          </button>

          <button
            onClick={() => setSubTab('benchmark')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'benchmark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Mẫu Benchmark ({BENCHMARK_TEMPLATES.length})</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CHAT AI */}
      {subTab === 'chat' && (
        <div
          className={`border rounded-2xl flex flex-col h-[600px] shadow-sm overflow-hidden transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                      isAssistant
                        ? isDark
                          ? 'bg-slate-950 border border-slate-800/90 text-slate-200'
                          : 'bg-slate-50 border border-slate-200 text-slate-800'
                        : 'bg-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line font-sans">{msg.content}</p>

                    {/* Render generated result inside chat if triggered */}
                    {msg.generatedResult && (
                      <div
                        className={`mt-3 pt-3 border-t space-y-2 ${
                          isDark ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className={`text-[11px] font-bold block ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
                          4 Phương án đề xuất:
                        </span>
                        {msg.generatedResult.variations.map((v, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded-lg border space-y-1 ${
                              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Mẫu {i + 1}</span>
                              <button
                                onClick={() => copyText(v, `chat-v-${msg.id}-${i}`)}
                                className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium"
                              >
                                {copiedId === `chat-v-${msg.id}-${i}` ? '✓ Đã chép' : 'Sao chép'}
                              </button>
                            </div>
                            <p className={`text-xs whitespace-pre-line ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{v}</p>
                          </div>
                        ))}

                        {msg.generatedResult.dmFollowUpScript && (
                          <div
                            className={`p-2.5 rounded-lg border text-[11px] space-y-1 mt-2 ${
                              isDark
                                ? 'bg-slate-900 border-slate-800 text-slate-300'
                                : 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                            }`}
                          >
                            <span className={`font-bold block ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                              Kịch bản Tin Nhắn Chuyển Đổi (3 bước):
                            </span>
                            <p className="italic">
                              1. {msg.generatedResult.dmFollowUpScript.step1_empathy}
                            </p>
                            <p className="italic">
                              2. {msg.generatedResult.dmFollowUpScript.step2_qualifyQuestion}
                            </p>
                            <p className="italic">
                              3. {msg.generatedResult.dmFollowUpScript.step3_inviteLink}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested actions / Quick prompts */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div
                        className={`flex flex-wrap gap-1.5 mt-3 pt-2 border-t ${
                          isDark ? 'border-slate-800/80' : 'border-slate-200'
                        }`}
                      >
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(action.action)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                              isDark
                                ? 'bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border-slate-700/80'
                                : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className={`p-3 border-t ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập câu hỏi hoặc gõ 'Hi' để mở Menu 7 Order..."
                className={`flex-1 border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                }`}
              />
              <button
                type="submit"
                disabled={isChatLoading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 2: HISTORY */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Tổng số nội dung đã tạo: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{historyItems.length}</strong>
            </span>
            {historyItems.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa lịch sử</span>
              </button>
            )}
          </div>

          {historyItems.length === 0 ? (
            <div
              className={`min-h-[250px] rounded-2xl border p-8 flex flex-col items-center justify-center text-center space-y-2 ${
                isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'
              }`}
            >
              <Clock className="w-8 h-8 text-slate-400" />
              <h3 className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Chưa có lịch sử tạo content</h3>
              <p className={`text-[11px] max-w-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Khi bạn tạo content tại Studio hoặc Chat AI, kết quả sẽ tự động được lưu lại tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-4 space-y-3 shadow-sm transition-colors ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.orderTitle}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.platform}
                      </span>
                      <span className={`text-xs font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Dự án: {item.programTitle}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {item.variations.map((v, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-xl p-3 space-y-1 text-xs ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Mẫu {idx + 1}</span>
                          <button
                            onClick={() => copyText(v, `hist-${item.id}-${idx}`)}
                            className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium"
                          >
                            {copiedId === `hist-${item.id}-${idx}` ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                        <p className={`leading-relaxed whitespace-pre-line ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: BENCHMARK TEMPLATES */}
      {subTab === 'benchmark' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENCHMARK_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className={`border rounded-2xl p-5 space-y-3 shadow-sm transition-colors ${
                isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tmpl.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {tmpl.platform}
                  </span>
                </div>
                <button
                  onClick={() => copyText(tmpl.content, `tmpl-${tmpl.id}`)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === `tmpl-${tmpl.id}` ? '✓ Đã chép' : 'Sao chép'}</span>
                </button>
              </div>

              <p
                className={`text-xs leading-relaxed p-3 rounded-xl border whitespace-pre-line font-sans select-all ${
                  isDark ? 'text-slate-200 bg-slate-950 border-slate-800' : 'text-slate-800 bg-slate-50 border-slate-200'
                }`}
              >
                {tmpl.content}
              </p>

              <div
                className={`text-[11px] p-2 rounded-lg border ${
                  isDark
                    ? 'text-slate-400 bg-slate-950/60 border-slate-800/60'
                    : 'text-slate-600 bg-indigo-50/50 border-indigo-100'
                }`}
              >
                💡 <strong className={isDark ? 'text-slate-300' : 'text-indigo-950'}>Insight phân tích:</strong> {tmpl.keyInsight}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
