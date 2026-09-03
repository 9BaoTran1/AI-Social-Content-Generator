import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, ChevronRight, Lightbulb, Compass, HeartHandshake, Eye } from 'lucide-react';
import { playClickSound } from '../lib/audioService';

interface InspirationBannerProps {
  theme: 'light' | 'dark';
}

const CREATIVE_INSIGHTS = [
  {
    icon: HeartHandshake,
    category: 'Văn phong thấu cảm',
    text: 'Hãy viết như đang trò chuyện với một người bạn thân qua ly cà phê: không giáo điều, không dạy đời, chỉ có thấu cảm chân thành.',
    author: 'Nguyên tắc vàng người làm Content',
  },
  {
    icon: Compass,
    category: '3 Giây Đầu Quyết Định',
    text: 'Dừng ngón tay cuộn không đến từ sự giật gân, mà đến từ một lát cắt nghịch lý đời thường bóc đúng tâm trạng người đọc.',
    author: 'Hook & Scroll-Stopper',
  },
  {
    icon: Lightbulb,
    category: 'Bẻ Khóa Tư Duy (Reframe)',
    text: 'Đừng chỉ an ủi "hãy cố lên", hãy giúp độc giả nhận ra điểm nghẽn thực sự đang kìm hãm năng lượng của họ.',
    author: 'Tư duy Đa Chiều',
  },
  {
    icon: Sparkles,
    category: 'Vulnerable Storytelling',
    text: 'Sự dũng cảm thừa nhận thất bại và bế tắc cá nhân có sức chạm gấp 10 lần những bài học thành công hào nhoáng.',
    author: 'Nghệ thuật Kể chuyện',
  },
  {
    icon: Eye,
    category: 'Chuyển đổi tự nhiên',
    text: 'Lời mời giá trị thực luôn xuất phát từ sự khiêm nhường: tặng miễn phí, lắng nghe trước khi đưa ra bất kỳ giải pháp nào.',
    author: 'Cầu nối Chuyển đổi',
  },
  {
    icon: Lightbulb,
    category: 'Kháng bóp reach',
    text: 'Giữ bài viết sạch sẽ, chia sẻ giá trị trọn vẹn và khéo léo gieo link ở bình luận đầu tiên để thuật toán tự do phân phối.',
    author: 'Thuật toán Nền tảng',
  },
];

export const InspirationBanner: React.FC<InspirationBannerProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [index, setIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const current = CREATIVE_INSIGHTS[index];
  const IconComponent = current.icon;

  const handleNext = () => {
    playClickSound();
    setIsRotating(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % CREATIVE_INSIGHTS.length);
      setIsRotating(false);
    }, 150);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 mb-5 transition-all duration-300 ${
        isDark
          ? 'bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border-slate-800/80 shadow-xs'
          : 'bg-gradient-to-r from-indigo-50/70 via-white to-amber-50/50 border-indigo-100/90 shadow-2xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-indigo-950/80 text-indigo-400 border-indigo-800/80'
                : 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
            }`}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-800/60'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                }`}
              >
                💡 {current.category}
              </span>
              <span className={`text-[10px] hidden md:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                • {current.author}
              </span>
            </div>

            <p
              className={`text-xs sm:text-[13px] font-medium leading-relaxed italic transition-opacity duration-200 ${
                isRotating ? 'opacity-20' : 'opacity-100'
              } ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
            >
              "{current.text}"
            </p>
          </div>
        </div>

        <button
          onClick={handleNext}
          title="Xem góc nhìn cảm hứng khác"
          className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs'
          }`}
        >
          <RefreshCw className={`w-3 h-3 text-indigo-500 ${isRotating ? 'animate-spin' : ''}`} />
          <span>Đổi Cảm Hứng</span>
        </button>
      </div>
    </div>
  );
};
