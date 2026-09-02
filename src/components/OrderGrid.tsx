import React, { useState } from 'react';
import { OrderMeta, OrderType, ThemeMode } from '../types';
import { ORDERS_METADATA } from '../data/defaultPrograms';
import {
  Video,
  Facebook,
  MessageCircle,
  Mail,
  Linkedin,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

interface OrderGridProps {
  onSelectOrder: (orderType: OrderType) => void;
  theme?: ThemeMode;
}

export const OrderGrid: React.FC<OrderGridProps> = ({ onSelectOrder, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Tiktok':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'Facebook':
        return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'Threads':
        return <MessageCircle className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />;
      case 'LinkedIn':
        return <Linkedin className="w-4 h-4 text-sky-500" />;
      case 'Email':
        return <Mail className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'Tiktok':
        return isDark
          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          : 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Facebook':
        return isDark
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          : 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Threads':
        return isDark
          ? 'bg-neutral-800 text-neutral-200 border-neutral-700'
          : 'bg-neutral-100 text-neutral-800 border-neutral-300';
      case 'LinkedIn':
        return isDark
          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
          : 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Email':
        return isDark
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return isDark
          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const filteredOrders = ORDERS_METADATA.filter((order) => {
    if (selectedPlatform !== 'All' && order.platform !== selectedPlatform) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.title.toLowerCase().includes(q) ||
        order.description.toLowerCase().includes(q) ||
        order.platform.toLowerCase().includes(q) ||
        order.toneGuideline.toLowerCase().includes(q) ||
        `order ${order.orderNumber}`.includes(q)
      );
    }
    return true;
  });

  const platforms = [
    { id: 'All', label: 'Tất Cả 7 Order', count: 7 },
    { id: 'Tiktok', label: 'TikTok (Order 1)', count: 1 },
    { id: 'Facebook', label: 'Facebook (Order 2-3)', count: 2 },
    { id: 'Threads', label: 'Threads (Order 4-5)', count: 2 },
    { id: 'LinkedIn', label: 'LinkedIn (Order 6)', count: 1 },
    { id: 'Email', label: 'Email (Order 7)', count: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Notice with Clean Modern Gradient */}
      <div
        className={`relative overflow-hidden border rounded-3xl p-6 sm:p-8 shadow-xs transition-colors ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-slate-800/90'
            : 'bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border-slate-200/90'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hệ Thống 7 Lệnh Chuyển Đổi Thực Chiến (10 Năm Kinh Nghiệm)</span>
            </div>
            <h1
              className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Biến Comment Lướt Thành Đơn Đăng Ký & Khách Nhắn Tin
            </h1>
            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-700 font-medium'
              }`}
            >
              Mỗi lệnh Order được tối ưu thuật toán riêng cho từng nền tảng (TikTok, Facebook, Threads, LinkedIn, Email). AI tự động phân tích tâm lý, bóc tách nỗi đau, đề xuất 4 phong cách viral và kịch bản tư vấn cá nhân hóa.
            </p>
          </div>

          {/* Quick Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 min-w-[280px]">
            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-colors ${
                isDark
                  ? 'bg-blue-950/40 text-blue-200 border-blue-800/50'
                  : 'bg-blue-50/70 text-blue-900 border-blue-200/80'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Facebook Tự Do 100%:</strong>
                <span className="text-[11px] opacity-90">
                  Rải tự do cả Workshop (WS) & Chương trình (CT), hỗ trợ comment ghim chống bóp reach.
                </span>
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-colors ${
                isDark
                  ? 'bg-rose-950/40 text-rose-200 border-rose-800/50'
                  : 'bg-rose-50/70 text-rose-900 border-rose-200/80'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">TikTok & Threads (20-39 tuổi):</strong>
                <span className="text-[11px] opacity-90">
                  Đồng cảm sâu sắc, không bán khóa học lộ liễu, dẫn dắt nhận bài test tự nhiên.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xs transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800/90'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Platform Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedPlatform === p.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm Order theo từ khóa..."
            className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white'
            }`}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-slate-400 hover:text-indigo-600 absolute right-3 top-2.5 font-semibold cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order: OrderMeta) => {
          const isFacebook = order.platform === 'Facebook';
          return (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-xs flex flex-col justify-between border hover:scale-[1.01] ${
                isDark
                  ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800/90 hover:border-indigo-500/60 hover:shadow-indigo-500/10'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-indigo-400 hover:shadow-indigo-500/10'
              } ${isFacebook ? 'ring-1 ring-blue-500/30' : ''}`}
            >
              <div>
                {/* Header: Order number + Platform badge */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`p-2.5 rounded-xl border group-hover:scale-105 transition-all ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 group-hover:border-indigo-500/40'
                          : 'bg-slate-50 border-slate-200 group-hover:border-indigo-400'
                      }`}
                    >
                      {getPlatformIcon(order.platform)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        LỆNH #{order.orderNumber}
                      </span>
                      <h3
                        className={`font-bold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}
                      >
                        {order.title}
                      </h3>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getPlatformBadge(
                      order.platform
                    )}`}
                  >
                    {order.platform}
                  </span>
                </div>

                {/* Description */}
                <p
                  className={`text-xs leading-relaxed mb-3.5 line-clamp-3 ${
                    isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
                  }`}
                >
                  {order.description}
                </p>

                {/* Facebook Free Placement Notice */}
                {isFacebook && (
                  <div
                    className={`mb-3.5 p-2.5 rounded-xl border text-[11px] leading-tight flex items-start gap-1.5 ${
                      isDark
                        ? 'bg-blue-950/40 border-blue-800/40 text-blue-200/90'
                        : 'bg-blue-50/90 border-blue-200 text-blue-950 font-medium'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-blue-600 dark:text-blue-300">
                        ✨ Không giới hạn Facebook:
                      </strong>
                      Rải tự do cả Workshop (WS) & Chương trình (CT), đa dạng phong cách bài viết & comment mồi.
                    </div>
                  </div>
                )}

                {/* Tone Guideline Preview */}
                <div
                  className={`p-2.5 rounded-xl border text-[11px] mb-4 ${
                    isDark
                      ? 'bg-slate-950/70 border-slate-800/80 text-slate-300'
                      : 'bg-slate-50 border-slate-300 text-slate-800 font-medium'
                  }`}
                >
                  <span className="text-slate-600 dark:text-slate-400 font-bold block text-[10px] uppercase mb-0.5">
                    Tone & Mood chuẩn:
                  </span>
                  <span className="italic line-clamp-2">"{order.toneGuideline}"</span>
                </div>
              </div>

              {/* Action Button */}
              <div
                className={`pt-3 border-t flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 transition-colors ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Mở Studio Tạo Order {order.orderNumber}
                </span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
