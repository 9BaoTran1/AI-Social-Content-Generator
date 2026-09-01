import React, { useState } from 'react';
import { OrderMeta, OrderType } from '../types';
import { ORDERS_METADATA } from '../data/defaultPrograms';
import {
  Video,
  Facebook,
  MessageCircle,
  Mail,
  Linkedin,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  HelpCircle,
  Flame,
  ShieldAlert
} from 'lucide-react';

interface OrderGridProps {
  onSelectOrder: (orderType: OrderType) => void;
}

export const OrderGrid: React.FC<OrderGridProps> = ({ onSelectOrder }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Tiktok':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'Facebook':
        return <Facebook className="w-5 h-5 text-blue-400" />;
      case 'Threads':
        return <MessageCircle className="w-5 h-5 text-neutral-300" />;
      case 'LinkedIn':
        return <Linkedin className="w-5 h-5 text-sky-400" />;
      case 'Email':
        return <Mail className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'Tiktok':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Facebook':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Threads':
        return 'bg-neutral-800 text-neutral-200 border-neutral-700';
      case 'LinkedIn':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'Email':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
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
      {/* Top Banner Notice with Strict Rules Recap & Quick Info */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/90 rounded-2xl p-6 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Hệ Thống 7 Lệnh Order Content Chuyên Gia (10 Năm Kinh Nghiệm)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Biến Comment Thành Inbox & Đơn Đăng Ký
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
              Chọn Order phù hợp theo nền tảng, AI sẽ tự động bóc tách ngữ cảnh, lựa chọn đúng Workshop (WS) hoặc Chương trình (CT), đảm bảo tone & mood tự nhiên, không lộ liễu và cung cấp kịch bản inbox 1-1 chuyển đổi cao.
            </p>
          </div>

            <div className="p-3 rounded-xl bg-blue-950/70 text-blue-200 border border-blue-800/60 text-xs flex items-start gap-2 shadow-inner">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-300 block font-semibold">Tự do trên Facebook:</strong>
                Chạy tự do cả Workshop (WS) & Chương trình (CT). Đa dạng phong cách từ bài viết dài, trắc nghiệm đến comment tự sự.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/60 text-rose-200 border border-rose-800/50 text-xs flex items-start gap-2 shadow-inner">
              <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300 block font-semibold">Quy tắc TikTok & Threads:</strong>
                Tập trung đối tượng 20-39 tuổi, chạm đúng nỗi đau và dẫn dắt làm bài test 1-1 tự nhiên.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-sm">
        {/* Platform Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedPlatform === p.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
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
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-slate-400 hover:text-white absolute right-3 top-2.5"
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
              className={`group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 hover:border-indigo-500/60 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-indigo-500/10 flex flex-col justify-between ${
                isFacebook ? 'ring-1 ring-blue-500/30' : ''
              }`}
            >
              <div>
                {/* Header: Order number + Platform badge */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-105 group-hover:border-indigo-500/40 transition-all">
                      {getPlatformIcon(order.platform)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Order #{order.orderNumber}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm group-hover:text-indigo-300 transition-colors">
                        {order.title}
                      </h3>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getPlatformBadge(order.platform)}`}>
                    {order.platform}
                  </span>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-xs leading-relaxed mb-3.5 line-clamp-3">
                  {order.description}
                </p>

                {/* Notice if Facebook */}
                {isFacebook && (
                  <div className="mb-3.5 p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200/90 leading-tight flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-300 font-semibold block">✨ Không giới hạn Facebook:</strong>
                      Rải tự do cả Workshop (WS) & Chương trình (CT), đa dạng phong cách bài viết & comment.
                    </div>
                  </div>
                )}

                {/* Tone Guideline Preview */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 mb-4">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-0.5">
                    Tone & Mood chuẩn:
                  </span>
                  <span className="italic text-slate-300 line-clamp-2">"{order.toneGuideline}"</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
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
