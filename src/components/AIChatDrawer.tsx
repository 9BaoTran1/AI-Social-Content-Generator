import React, { useState, useRef, useEffect } from 'react';
import { ProgramItem, OrderType, ChatMessage, GeneratedContent } from '../types';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Layers,
  FileText,
  UserCheck
} from 'lucide-react';
import { saveHistoryItem } from '../lib/storage';

interface AIChatDrawerProps {
  programs: ProgramItem[];
  onSelectOrderForWorkbench: (orderType: OrderType) => void;
  externalTriggerHi?: number;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  programs,
  onSelectOrderForWorkbench,
  externalTriggerHi,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Xin chào! Mình là Trợ lý AI Content 10 năm kinh nghiệm & Social Media Manager.

💡 Bạn có thể gõ **"Hi"** bất cứ lúc nào để mở Menu 7 Order tự động, hoặc gõ trực tiếp **"Order 1 [mô tả clip]"** để mình sản xuất content và kịch bản chat 1-1 ngay nhé!`,
      timestamp: new Date().toISOString(),
      suggestedActions: [
        { label: 'Gõ "Hi" mở 7 Order', action: 'Hi' },
        { label: '🎬 Order 1: Comment TikTok', action: 'Order 1', orderType: 'order_1' },
        { label: '💬 Order 2: Comment Facebook', action: 'Order 2', orderType: 'order_2' },
        { label: '🧵 Order 4: Comment Threads', action: 'Order 4', orderType: 'order_4' },
        { label: '💼 Order 6: Tin nhắn LinkedIn', action: 'Order 6', orderType: 'order_6' },
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external trigger for "Hi"
  useEffect(() => {
    if (externalTriggerHi && externalTriggerHi > 0) {
      handleSendMessage('Hi');
    }
  }, [externalTriggerHi]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Check if user is triggering an Order like "Order 1 [context]" or "Order 2"
      const lower = query.toLowerCase();
      const orderMatch = lower.match(/^order\s*([1-7])(.*)/i);

      if (orderMatch && orderMatch[2].trim().length > 5) {
        const orderNum = parseInt(orderMatch[1], 10);
        const orderContext = orderMatch[2].trim();
        const orderKey = `order_${orderNum}` as OrderType;

        // Call generate order directly
        const genRes = await fetch('/api/generate-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderType: orderKey,
            context: orderContext,
            programs,
          }),
        });

        const genData = await genRes.json();
        if (genData.success && genData.data) {
          const generatedObj: GeneratedContent = {
            id: `gen-${Date.now()}`,
            orderId: orderKey,
            orderTitle: `Order ${orderNum}`,
            platform: orderNum === 1 ? 'TikTok' : orderNum <= 3 ? 'Facebook' : orderNum <= 5 ? 'Threads' : orderNum === 6 ? 'LinkedIn' : 'Email',
            programId: genData.data.selectedProgramId,
            programTitle: genData.data.selectedProgramTitle,
            programType: genData.data.selectedProgramType,
            primaryContent: genData.data.primaryContent,
            variations: genData.data.variations || [],
            dmFollowUpScript: genData.data.dmFollowUpScript,
            rationale: genData.data.rationale,
            platformNotes: genData.data.platformNotes,
            createdAt: new Date().toISOString(),
          };

          saveHistoryItem(generatedObj);

          const assistantMsg: ChatMessage = {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content: `Đã hoàn thành **Order ${orderNum}** cho bạn! Dự án được chọn: **${generatedObj.programTitle}** (${generatedObj.programType === 'ws' ? 'Workshop' : 'Chương trình'}). Dưới đây là 3 phương án content và kịch bản chat 1-1:`,
            generatedResult: generatedObj,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setIsLoading(false);
          return;
        }
      }

      // Normal chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          programs,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể kết nối đến máy chủ.');
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        suggestedActions: data.suggestedActions,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Có lỗi xảy ra: ${err.message || 'Vui lòng thử lại.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[750px] shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-sm">Trợ Lý AI Order Tự Động</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gõ "Hi" để mở menu • Nhận diện Order 1-7 • Hướng dẫn chat 1-1
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSendMessage('Hi')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gõ "Hi"</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${
                isUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-emerald-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble Content */}
              <div className="space-y-2 max-w-[88%]">
                <div
                  className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950/90 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Inline Generated Result Card if present */}
                {msg.generatedResult && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-indigo-300">
                        {msg.generatedResult.programTitle}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Nền tảng: {msg.generatedResult.platform}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {msg.generatedResult.variations.map((v, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <span>Phương án {i + 1}</span>
                            <button
                              onClick={() => copyText(v, `v-${msg.id}-${i}`)}
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              {copiedId === `v-${msg.id}-${i}` ? (
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
                          <p className="text-slate-200 leading-normal">{v}</p>
                        </div>
                      ))}
                    </div>

                    {/* DM Script Preview */}
                    <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 space-y-1 text-[11px]">
                      <span className="font-bold text-emerald-300 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        Kịch bản Chat 1-1:
                      </span>
                      <p className="text-slate-300 italic">
                        1. {msg.generatedResult.dmFollowUpScript.step1_empathy}
                      </p>
                      <p className="text-slate-300 italic">
                        2. {msg.generatedResult.dmFollowUpScript.step2_qualifyQuestion}
                      </p>
                      <p className="text-slate-300 italic">
                        3. {msg.generatedResult.dmFollowUpScript.step3_inviteLink}
                      </p>
                    </div>
                  </div>
                )}

                {/* Suggested Action Buttons */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (action.orderType) {
                            onSelectOrderForWorkbench(action.orderType);
                          } else {
                            handleSendMessage(action.action);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Trợ lý AI đang xử lý theo quy tắc nền tảng...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type 'Hi' hoặc gõ 'Order 1 [mô tả clip/bài đăng]'..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
