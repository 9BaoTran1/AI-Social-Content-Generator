import React, { useState } from 'react';
import { ThemeMode } from '../types';
import {
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  AlertTriangle,
  Flame,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface UserGuideProps {
  theme?: ThemeMode;
  onNavigate?: (tab: 'workbench' | 'orders' | 'benchmark' | 'programs' | 'assistant') => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ theme = 'light', onNavigate }) => {
  const isDark = theme === 'dark';
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const sampleDmScript = `[Bước 1 - Đồng cảm]: Chào bạn [Tên], mình vừa đọc bình luận của bạn thấy rất đồng cảm vì mình cũng từng trải qua cảm giác quá tải và loay hoay giống bạn...
[Bước 2 - Gợi mở]: Không biết hiện tại điều khiến bạn băn khoăn nhất là khối lượng công việc áp lực hay do chưa rõ định hướng tiếp theo vậy bạn ha?
[Bước 3 - Mời link]: Cuối tuần này bên tụi mình có buổi Workshop / Bài test trắc nghiệm miễn phí 100% không bán khóa học, gửi bạn tham khảo nha: [Link_Dang_Ky]`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sampleDmScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800'
            : 'bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 border-indigo-100 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Zap className="w-3.5 h-3.5" />
              <span>Sổ Tay Thực Chiến 2 Phút</span>
            </div>
            <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Hướng Dẫn Sử Dụng & Bí Kíp Thuật Toán
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Những điều cốt lõi nhất để tạo bài viral, tránh bị bóp tương tác và chuyển đổi comment thành tin nhắn riêng.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('workbench')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>Vào Studio Tạo Bài</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid 2x2: 4 Khối Cốt Lõi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Khối 1: Quy Trình 3 Bước */}
        <div
          className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
            isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b pb-3 dark:border-slate-800 border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Quy Trình 3 Bước Tạo Bài
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Từ ý tưởng đến lúc nổ inbox
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">B1:</span>
              <div>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Chọn Order phù hợp:</strong>
                <p className={`mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Comment dạo kéo tương tác (Order 1, 2, 4) hoặc Bài viết dài xây uy tín cá nhân (Order 3, 6).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">B2:</span>
              <div>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Dán bối cảnh & Tạo bài:</strong>
                <p className={`mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Dán link bài hoặc ý tưởng vào ô Studio ➔ Bấm <span className="font-semibold text-indigo-500">"Tạo Nội Dung Ngay"</span>. AI sẽ xuất ra 4 biến thể phong cách.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">B3:</span>
              <div>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Copy Combo & Đăng:</strong>
                <p className={`mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Bấm <span className="font-semibold text-emerald-500">"Copy Bài + Cmt Ghim Mồi"</span>. Đăng bài lên feed và thả ngay comment mồi bên dưới.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Khối 2: 3 Quy Tắc Thuật Toán Sống Còn */}
        <div
          className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
            isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b pb-3 dark:border-slate-800 border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                3 Quy Tắc Thuật Toán Sống Còn
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Để bài viết được phân phối mạnh nhất
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>1. CẤM để link ở Caption bài viết:</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300/90">
                Facebook & LinkedIn sẽ bóp 70–80% lượt xem nếu có link ngoài ở bài đăng. <strong>Luôn luôn để link ở Bình luận đầu tiên (First Comment)</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-500 shrink-0 mt-0.5">⚡ 2.</span>
              <div>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Hook 3 giây đầu quyết định 90%:</strong>
                <p className={`mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  1–2 dòng đầu phải viết hoa hoặc đánh trúng nỗi đau/nghịch lý để người đọc dừng ngón tay cuộn và bấm <em>"...Xem thêm"</em>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-500 shrink-0 mt-0.5">🤝 3.</span>
              <div>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Cam kết phi lợi nhuận minh bạch:</strong>
                <p className={`mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Nhấn mạnh rõ: <em>"100% phi lợi nhuận, không bán khóa học, không lùa gà"</em> để xóa tan hoài nghi của người đọc.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Khối 3: Kịch Bản Tin Nhắn Chuyển Đổi */}
        <div
          className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
            isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800 border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Kịch Bản Tin Nhắn Chuyển Đổi
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Biến comment thành đăng ký giữ chỗ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyScript}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                copiedScript
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {copiedScript ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Đã chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Chép Mẫu</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <span className="font-bold text-indigo-500 block mb-0.5">Bước 1: Mở lời đồng cảm</span>
              <p className="text-[11px] italic">
                "Chào bạn [Tên], mình vừa đọc cmt của bạn thấy rất đồng cảm vì mình cũng từng quá tải như vậy..."
              </p>
            </div>

            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <span className="font-bold text-amber-500 block mb-0.5">Bước 2: Gợi mở vấn đề sâu</span>
              <p className="text-[11px] italic">
                "Không biết đợt này điều làm bạn băn khoăn nhất là áp lực công việc hay chưa rõ định hướng tiếp theo vậy bạn?"
              </p>
            </div>

            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <span className="font-bold text-emerald-500 block mb-0.5">Bước 3: Mời nhận link nhẹ nhàng</span>
              <p className="text-[11px] italic">
                "Cuối tuần này bên tụi mình có buổi Workshop / Bài test miễn phí 100%, gửi bạn link tham khảo nhé: [Link]"
              </p>
            </div>
          </div>
        </div>

        {/* Khối 4: Mẹo An Toàn Tài Khoản */}
        <div
          className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
            isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 border-b pb-3 dark:border-slate-800 border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Mẹo An Toàn Cho Tài Khoản
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tránh checkpoint và chống spam
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">⏱️</span>
              <div>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Giãn cách thời gian:</strong>
                <p className={`mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Mỗi comment hoặc bài đăng cách nhau ít nhất 10–15 phút. Nick mới nên đăng 3–5 bài/ngày, nick lâu năm 8–10 bài/ngày.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">🔄</span>
              <div>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Luân phiên nội dung:</strong>
                <p className={`mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sử dụng linh hoạt 4 biến thể AI tạo ra. Tuyệt đối không copy-paste 1 nội dung lặp lại trên nhiều bài viết khác nhau.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">💬</span>
              <div>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>Tương tác lại nhiệt tình:</strong>
                <p className={`mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Khi có ai phản hồi comment của bạn, hãy reply lại ngay để thuật toán nhận diện thảo luận sôi nổi và đẩy comment lên Top 1.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
