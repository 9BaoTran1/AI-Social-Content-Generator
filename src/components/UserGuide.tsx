import React, { useState } from 'react';
import { ThemeMode } from '../types';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  Facebook,
  Linkedin,
  Video,
  MessageCircle,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Clock,
  Target,
  Users,
  MessageSquare,
  Compass,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  Share2,
} from 'lucide-react';

interface UserGuideProps {
  theme?: ThemeMode;
  onNavigate?: (tab: 'workbench' | 'orders' | 'benchmark' | 'programs' | 'assistant') => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ theme = 'light', onNavigate }) => {
  const isDark = theme === 'dark';

  // Section active navigation
  const [activeSection, setActiveSection] = useState<'workflow' | 'algorithm' | 'dm_script' | 'safety_faq'>('workflow');

  // Platform sub-tab in Algorithm section
  const [selectedPlatform, setSelectedPlatform] = useState<'Facebook' | 'LinkedIn' | 'TikTok' | 'Threads' | 'Email'>('Facebook');

  // Copied feedback states for DM templates
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // FAQ open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Ready-to-copy DM Templates
  const dmTemplates = [
    {
      id: 'script_burnout',
      category: 'Người Đi Làm & Khủng Hoảng Stress / Burn-Out',
      target: 'Dành cho độc giả bình luận dưới bài viết áp lực công sở, kiệt sức, mất cân bằng',
      steps: {
        step1: 'Chào bạn [Tên] nè, mình vừa đọc bình luận của bạn dưới bài viết về áp lực công việc. Thấy bạn chia sẻ đợt này hay bị quá tải và mất ngủ, mình thực sự rất đồng cảm vì năm ngoái mình cũng từng rơi vào đúng trạng thái kiệt sức này...',
        step2: 'Không biết hiện tại điều khiến bạn cảm thấy ngột ngạt nhất là khối lượng công việc quá tải hay do chưa tìm thấy môi trường và người thấu hiểu vậy bạn ha? Nếu tiện, mình lắng nghe bạn tâm sự thêm nè.',
        step3: 'Cảm ơn bạn đã tin tưởng mở lòng. Bên cộng đồng tụi mình cuối tuần này có buổi Workshop ấm cúng "Quản Trị Năng Lượng & Phục Hồi Thân - Tâm" hoàn toàn miễn phí, chia sẻ các bài tập điều hòa nhịp thở và giải tỏa stress rất thực tế. Nếu bạn thấy thoải mái, mình gửi bạn link thông tin đăng ký giữ chỗ nhé: [Link_Tally]',
      },
    },
    {
      id: 'script_career',
      category: 'Định Hướng Sự Nghiệp & Khủng Hoảng Tuổi 25-30',
      target: 'Dành cho độc giả trăn trở nhảy việc, bế tắc mục tiêu cuộc đời, thiếu tự tin',
      steps: {
        step1: 'Chào bạn [Tên], mình thấy chia sẻ của bạn về cảm giác chênh vênh tuổi 25+ rất sâu sắc. Giai đoạn nhìn bạn bè xung quanh ai cũng ổn định còn mình vẫn loay hoay thật sự không hề dễ chịu chút nào.',
        step2: 'Theo bạn thì rào cản lớn nhất lúc này là bạn chưa rõ thế mạnh nội tại của mình, hay bạn đang có quá nhiều hướng đi nhưng chưa dám đưa ra quyết định dứt khoát?',
        step3: 'Tụi mình có một bài Trắc Nghiệm Đánh Giá Bánh Xe Cuộc Đời & Nhận Diện Điểm Mạnh chuẩn quốc tế, làm xong có anh/chị mentor hỗ trợ phản hồi 1-1 miễn phí. Mình gửi bạn link làm thử trong 5 phút xem sao nhé: [Link_Test]',
      },
    },
    {
      id: 'script_family',
      category: 'Gia Đình, Mối Quan Hệ & Thấu Hiểu Con Cái',
      target: 'Dành cho phụ huynh hoặc người trẻ đang bế tắc trong giao tiếp gia đình',
      steps: {
        step1: 'Dạ em chào chị [Tên] ạ! Em đọc comment của chị thấy thương và đồng cảm vô cùng. Làm cha mẹ trong thời đại công nghệ số này thực sự có quá nhiều áp lực mà ít ai thấu hiểu cho mình...',
        step2: 'Chị cho em hỏi bé nhà mình năm nay đang ở độ tuổi nào rồi ạ? Khoảng cách lớn nhất giữa hai mẹ con hiện tại là bé ít chịu tâm sự hay do con dễ phản kháng khi ba mẹ khuyên bảo ạ?',
        step3: 'Cuối tuần này bên em có buổi tọa đàm trực tuyến thân mật "Cầu Nối Yêu Thương: Cách Trò Chuyện Để Con Mở Lòng" do chuyên gia tâm lý dẫn dắt, hoàn toàn miễn phí cho phụ huynh. Em xin phép gửi chị link đăng ký tham gia nhé: [Link_Dang_Ky]',
      },
    },
    {
      id: 'script_assessment',
      category: 'Kích Hoạt Làm Bài Test Sức Khỏe & Tâm Lý Miễn Phí',
      target: 'Dành cho khách hàng chấm "." hoặc tương tác muốn nhận bộ câu hỏi trắc nghiệm',
      steps: {
        step1: 'Chào bạn [Tên] ơi! Mình thấy bạn để lại bình luận quan tâm đến bộ câu hỏi đánh giá chỉ số Well-being & Cân bằng cuộc sống ở bài viết vừa rồi.',
        step2: 'Dạo này bạn cảm thấy mức độ tập trung và năng lượng mỗi sáng thức dậy của mình đang ở khoảng mấy điểm trên thang điểm 10 vậy?',
        step3: 'Mình gửi bạn link làm bài test nhanh 3 phút (theo chuẩn WHO-5 quốc tế) ở đây nhé: [Link_Test]. Sau khi làm xong hệ thống sẽ trả kết quả trực quan, nếu cần mình có thể gửi thêm gợi ý cải thiện riêng cho bạn nha ❤️',
      },
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Hero Header Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 border shadow-md transition-all ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800'
            : 'bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border-indigo-100/80'
        }`}
      >
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
            <BookOpen className="w-3.5 h-3.5" />
            <span>PLAYBOOK THỰC CHIẾN 2026</span>
          </div>

          <h1
            className={`text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            📖 Cẩm Nang Sử Dụng & Bí Kíp Thuật Toán Mạng Xã Hội 2026
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Bẻ khóa cơ chế phân phối của <strong>Facebook, LinkedIn, TikTok, Threads & Email</strong>. Hướng dẫn chi tiết
            cách biến những lượt tương tác, lượt thả like và bình luận thành những cuộc hội thoại 1-1 ấm áp với{' '}
            <strong>Kịch bản DM 3 Bước Chuyển Đổi Cao</strong>.
          </p>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Quy Trình 3 Bước Tự Động Hóa
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              Bí Kíp Dwell Time & Chống Bóp Reach
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              Kịch Bản DM 3 Bước Chốt Lịch 1-1
            </span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Bảo Vệ Tài Khoản An Toàn
            </span>
          </div>
        </div>

        {/* Decorative Background Blob */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Tabs Bar */}
      <div
        className={`sticky top-20 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl border backdrop-blur-md overflow-x-auto no-scrollbar shadow-xs transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}
      >
        <button
          onClick={() => setActiveSection('workflow')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'workflow'
              ? 'bg-indigo-600 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span>1. Quy Trình 3 Bước</span>
        </button>

        <button
          onClick={() => setActiveSection('algorithm')}
          className={`flex-1 min-w-[160px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'algorithm'
              ? 'bg-indigo-600 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4 shrink-0" />
          <span>2. Bí Kíp Thuật Toán 2026</span>
        </button>

        <button
          onClick={() => setActiveSection('dm_script')}
          className={`flex-1 min-w-[160px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'dm_script'
              ? 'bg-indigo-600 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>3. Kịch Bản DM 3 Bước</span>
        </button>

        <button
          onClick={() => setActiveSection('safety_faq')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'safety_faq'
              ? 'bg-indigo-600 text-white shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>4. An Toàn & FAQs</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: QUY TRÌNH 3 BƯỚC THỰC CHIẾN                                     */}
      {/* ========================================================================= */}
      {activeSection === 'workflow' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Zap className="w-6 h-6 text-amber-500" />
                Quy Trình 3 Bước Thực Chiến: Từ Lướt Web Đến Nổ Inbox 1-1
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Chiến lược khép kín giúp bạn không bao giờ cạn kiệt ý tưởng và tối ưu chuyển đổi tự nhiên
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('workbench')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>Vào Studio Thử Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 3 Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div
              className={`rounded-2xl p-6 border transition-all relative flex flex-col justify-between ${
                isDark ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                    1
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Săn Ý Tưởng
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Lướt Thấy Bài Hay & Chọn Lệnh Order Phù Hợp
                </h3>

                <ul className="text-xs space-y-2.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Lướt Facebook/TikTok/Threads thấy video/status triệu view chạm đúng nỗi đau (stress, bế tắc, bất hòa).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Xác định mục tiêu: Comment mồi leo Top hay Viết bài Long-form dẫn dắt?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Chọn 1 trong <strong>7 Lệnh Order chuyên biệt</strong> đã được lập trình sẵn chuẩn thuật toán.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>Mẹo: Sao chép cả link hoặc toàn bộ văn bản của bài viral đó.</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`rounded-2xl p-6 border transition-all relative flex flex-col justify-between ${
                isDark ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                    2
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    AI Studio Hóa
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Dán Vào Studio & Nhận Trọn Bộ Combo Chuyển Đổi
                </h3>

                <ul className="text-xs space-y-2.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Dán nội dung vào ô ngữ cảnh Studio Tạo Bài.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Gắn với 1 Workshop/Chương trình bạn muốn phễu tới (ví dụ: Trắc nghiệm WHO-5, Khủng hoảng tuổi 25).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Bấm <strong>Tạo Bài</strong>: Nhận ngay bài viết tối ưu Dwell Time + <strong>Bình luận ghim mồi</strong> + <strong>Kịch bản DM 3 bước</strong>.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Chỉ 5-10 giây để có trọn combo content + phễu inbox hoàn chỉnh.</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`rounded-2xl p-6 border transition-all relative flex flex-col justify-between ${
                isDark ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                    3
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Đăng & Nổ Inbox
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Đăng Bài Khéo Léo & Kích Hoạt Kịch Bản DM 1-1
                </h3>

                <ul className="text-xs space-y-2.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Đăng bài thuần chữ/ảnh (KHÔNG kèm link trong caption).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Thả ngay <strong>Bình luận mồi</strong> đặt link bài test/tài liệu ở comment #1.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Khi có người thả tim, comment hoặc chấm '.': mở kịch bản DM 3 bước nhắn tin riêng để thấu hiểu nỗi đau & gửi link.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span>Tỷ lệ phản hồi inbox tăng gấp 3 lần so với spam link trực tiếp!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Golden Rules Summary Card */}
          <div
            className={`rounded-2xl p-5 border space-y-3 ${
              isDark ? 'bg-indigo-950/30 border-indigo-900/60 text-slate-200' : 'bg-indigo-50/70 border-indigo-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-600 dark:text-indigo-400">
              <Award className="w-4 h-4" />
              <span>3 Nguyên Tắc Sống Còn Khi Triển Khai Content Chuyển Đổi</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs leading-relaxed">
              <div className="space-y-1">
                <span className="font-bold block text-slate-900 dark:text-white">1. Không Bao Giờ Bán Hàng Thô:</span>
                <span>Luôn đóng vai trò người đồng hành chia sẻ giải pháp hoặc góc nhìn nhân văn, phi lợi nhuận.</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold block text-slate-900 dark:text-white">2. Không Đặt Link Ở Caption:</span>
                <span>Facebook bóp chết 80% tương tác nếu có link ngoài. Luôn để ở bình luận ghim hoặc chuyển vào DM.</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold block text-slate-900 dark:text-white">3. Tương Tác Kép Trong 60 Phút:</span>
                <span>Trả lời mọi comment trong 1 giờ đầu tiên để thuật toán nhận diện bài viết sôi động và phân phối tiếp.</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: BÍ KÍP THUẬT TOÁN 5 NỀN TẢNG (Facebook, LinkedIn, TikTok, Threads, Email) */}
      {/* ========================================================================= */}
      {activeSection === 'algorithm' && (
        <section className="space-y-6">
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Compass className="w-6 h-6 text-indigo-500" />
              Bí Kíp Thuật Toán Phân Phối Từng Nền Tảng 2026
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Khám phá cơ chế phân phối ngầm và hành vi người dùng trên 5 kênh trọng điểm
            </p>
          </div>

          {/* Platform Switcher Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'Facebook', label: 'Facebook (Order 2 & 3)', icon: Facebook, color: 'text-blue-500' },
              { id: 'LinkedIn', label: 'LinkedIn (Order 6)', icon: Linkedin, color: 'text-sky-500' },
              { id: 'TikTok', label: 'TikTok (Order 1)', icon: Video, color: 'text-rose-500' },
              { id: 'Threads', label: 'Threads (Order 4 & 5)', icon: MessageCircle, color: 'text-neutral-700 dark:text-neutral-300' },
              { id: 'Email', label: 'Email Newsletter (Order 7)', icon: Mail, color: 'text-amber-500' },
            ].map((plat) => {
              const IconComp = plat.icon;
              const isSelected = selectedPlatform === plat.id;
              return (
                <button
                  key={plat.id}
                  onClick={() => setSelectedPlatform(plat.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : plat.color}`} />
                  <span>{plat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Platform Detail View */}
          {selectedPlatform === 'Facebook' && (
            <div
              className={`rounded-3xl p-6 sm:p-8 border space-y-6 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <Facebook className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Facebook: Nghệ Thuật Giữ Dwell Time & Chiến Lược Bình Luận Ghim
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Áp dụng cho Order 2 (Comment bài hot) & Order 3 (Bài viết Long-Form cá nhân/group)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      1. Chỉ số Dwell Time (Thời gian dừng mắt)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Facebook 2026 đánh giá chất lượng bài viết chủ yếu dựa vào thời gian người dùng dừng lại đọc (Dwell
                      Time trên 30-45s). Do đó, cấu trúc bài viết dài cần có nhịp ngắt dòng hợp lý, câu văn gợi cảm xúc,
                      kể một câu chuyện có nút thắt và bài học sâu sắc thay vì chỉ liệt kê gạch đầu dòng khô khan.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      2. Tại sao CẤM đặt Link ở Caption? (Bóp 80% Reach)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Facebook là một "khu vườn khép kín" (Walled Garden). Bất kỳ bài viết nào chứa liên kết dẫn ra ngoài
                      (Tally, Google Forms, Website) đều bị thuật toán tự động giảm mạnh lượng phân phối hiển thị tới bạn bè
                      và thành viên nhóm. <strong>Giải pháp chuẩn:</strong> Để link quà tặng/bài test ở{' '}
                      <strong>bình luận đầu tiên (First Comment)</strong> và kêu gọi trong bài: "Mình để link bài test miễn
                      phí dưới bình luận đầu tiên nhé".
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      3. Sức mạnh của Hook IN HOA 1-2 dòng đầu
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Người lướt Facebook chỉ mất 1.7 giây để quyết định có dừng lại bấm "...Xem thêm" hay không. 1-2 dòng
                      đầu phải viết HOA một phần, đánh thẳng vào sự tò mò, nghịch lý hoặc nỗi sợ ngầm.
                      <br />
                      <em>Ví dụ: "ĐỪNG NGHỈ VIỆC NẾU BẠN CHƯA BIẾT ĐIỀU NÀY..." hoặc "30 TUỔI, TÔI TỪNG NGHĨ MÌNH LÀ KẺ THẤT BẠI."</em>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      4. Cam kết Phi Lợi Nhuận & Bài Test Tâm Lý 1-1
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tránh xa các từ khóa thương mại thô thiển ("học phí", "khóa học", "mua ngay"). Thay vào đó, định vị
                      hoạt động là "buổi chia sẻ nội bộ cộng đồng phi lợi nhuận", "bài test đánh giá sức khỏe tinh thần theo
                      chuẩn WHO-5". Người dùng Facebook rất thích tự khám phá bản thân và đánh giá cao tinh thần phụng sự.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPlatform === 'LinkedIn' && (
            <div
              className={`rounded-3xl p-6 sm:p-8 border space-y-6 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                  <Linkedin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    LinkedIn: Thought Leadership & Kích Hoạt Thảo Luận C-Level & HRBP
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Áp dụng cho Order 6 (Bài viết chuyên môn & tiếp cận qua InMail/DM LinkedIn)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      1. Tối ưu hóa 140 ký tự đầu cho nút "...see more"
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Thuật toán LinkedIn xem mỗi cú click vào nút <strong>"...see more"</strong> là tín hiệu tương tác có
                      trọng số cực lớn. Nếu 3 dòng đầu tiên khơi gợi được một góc nhìn trái chiều hoặc một bài học đau đớn
                      trong nghề, bài viết sẽ được hiển thị tới mạng lưới bạn bè cấp 2 (2nd connection) và cấp 3 (3rd
                      connection) một cách hữu cơ.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      2. Cấu trúc Thought Leadership (Lãnh đạo tư tưởng)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Người dùng LinkedIn là chuyên gia, quản lý và nhân sự có tri thức cao. Tuyệt đối không đăng nội dung
                      sáo rỗng. Cấu trúc chuẩn: <strong>Thực trạng doanh nghiệp</strong> {'->'}{' '}
                      <strong>Gốc rễ vấn đề (Tâm lý học hành vi/Văn hóa tổ chức)</strong> {'->'}{' '}
                      <strong>Framework giải pháp thực tế</strong> {'->'}{' '}
                      <strong>Lời mời cùng đóng góp góc nhìn</strong>.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      3. Đặt câu hỏi kích hoạt tranh luận của C-Level & HRBP
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Cuối bài viết luôn phải có một câu hỏi mang tầm tư duy chiến lược để mời các Leader hoặc HRBP chia
                      sẻ kinh nghiệm. Khi một CEO hoặc HR Director để lại bình luận phân tích, toàn bộ nhân sự dưới quyền
                      và mạng lưới của họ sẽ nhìn thấy bài viết của bạn trên Feed của họ.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      4. Văn phong Chuyên Nghiệp nhưng Chân Thực
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Dùng từ ngữ chuẩn xác, xưng hô "anh/chị/em" hoặc "chúng ta". Tránh dùng quá nhiều emoji lòe loẹt,
                      chỉ nên dùng các biểu tượng tinh tế như 📌, 💡, 🎯 để chia tách các luận điểm mạch lạc.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPlatform === 'TikTok' && (
            <div
              className={`rounded-3xl p-6 sm:p-8 border space-y-6 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    TikTok: Thấu Hiểu Tâm Lý 20-39 Tuổi & Chiến Thuật Chiếm Lĩnh Top Comment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Áp dụng cho Order 1 (Comment mồi dưới video triệu view)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
                      1. Tâm lý thế hệ 20-39 tuổi trên TikTok
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Nhóm độc giả này đang chịu áp lực lớn về "cơm áo gạo tiền", khủng hoảng danh tính và sự cô đơn giữa
                      đô thị. Họ cực kỳ dị ứng với những lời khuyên dạy đời, đao to búa lớn. Họ chỉ tin những người dám
                      thừa nhận sự yếu đuối, chia sẻ trải nghiệm thất bại thật và đưa ra lời động viên chân thành.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      2. Công thức leo Top 1-3 Bình Luận
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tìm những clip hot mới đăng trong vòng 2-12 tiếng. Viết bình luận tóm tắt lại ý đắt nhất của video
                      kèm theo một câu hỏi kích thích người xem khác phản hồi (Trigger replies). Thuật toán TikTok ưu tiên
                      đẩy các comment có nhiều lượt trả lời (Reply count) lên thẳng vị trí trên cùng.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4" />
                      3. Tối ưu Bio Profile TikTok để đón traffic
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Khi comment của bạn đạt Top 1, sẽ có hàng ngàn người tò mò bấm vào avatar của bạn để xem trang cá
                      nhân. Hãy chắc chắn Bio của bạn có: (1) Một câu định vị ấm áp; (2) Link bio rõ ràng dẫn tới nhóm
                      cộng đồng hoặc bài test miễn phí; (3) 1-3 video ghim thể hiện câu chuyện và giá trị bản thân.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      4. Tuyệt đối không spam link trong comment
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Bình luận chứa link URL trên TikTok sẽ bị ẩn (shadowban) ngay lập tức hoặc bị chủ kênh xóa vì coi là
                      quảng cáo rác. Hãy để người đọc tự chủ động reply hoặc vào bio của bạn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPlatform === 'Threads' && (
            <div
              className={`rounded-3xl p-6 sm:p-8 border space-y-6 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-neutral-500/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center font-bold">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Threads: Nhịp Ngắt Dòng Thoáng & Hiệu Ứng Tâm Sự Đêm Muộn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Áp dụng cho Order 4 (Comment Threads) & Order 5 (Viết bài Threads)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      1. Nhịp ngắt dòng 1-2 câu (Mobile First)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Giao diện Threads rất tối giản. Nếu viết nguyên một đoạn văn dài quá 3 dòng, mắt người đọc sẽ bị mỏi
                      và lướt qua ngay. Hãy ngắt mỗi câu thành một dòng riêng biệt, tạo khoảng thở và nhịp điệu như đang trò
                      chuyện thì thầm trực tiếp với một người bạn thân.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-indigo-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      2. Khung giờ vàng "Tâm Sự Đêm Muộn" (21h - 24h)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Người dùng Threads có xu hướng mở ứng dụng vào đêm khuya khi cảm thấy cô đơn hoặc khó ngủ. Những bài
                      viết tâm sự về nỗi sợ, sự hoài nghi bản thân, cảm giác lạc lõng giữa thành phố luôn đạt lượng
                      Repost và Like cao nhất vào khung giờ 21:30 - 23:45.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      3. Tương tác đa chiều & Dẫn dắt sang Instagram Direct
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Threads liên kết mật thiết với Instagram. Khi độc giả comment đồng cảm, bạn có thể chủ động nhắn
                      Instagram Direct (IG DM) một cách rất tự nhiên mà không bị coi là người lạ xâm phạm quyền riêng tư.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" />
                      4. Không dùng văn phong khuôn mẫu
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tránh xa giọng văn quảng cáo hay dạy đời. Hãy sử dụng ngôn ngữ tự nhiên, chân phương: "Tự nhiên hôm
                      nay ngồi một mình nghĩ lại...", "Có ai giống mình không, nhiều khi thấy...", "Hôm nay mình vừa nhận ra một chuyện..."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPlatform === 'Email' && (
            <div
              className={`rounded-3xl p-6 sm:p-8 border space-y-6 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Email: Tỷ Lệ Mở Cao & Nghệ Thuật Kể Chuyện Micro-Storytelling
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Áp dụng cho Order 7 (Viết bản tin Email kết nối chuyên sâu)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      1. Tiêu đề Email quyết định 80% Tỷ lệ mở (Open Rate)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tránh tuyệt đối các từ khóa kích hoạt bộ lọc spam (như: "MIỄN PHÍ", "KHẨN CẤP", "GIẢM GIÁ 100%").
                      Tiêu đề email hiệu quả nhất luôn viết như một người bạn gửi riêng:
                      <br />
                      <em>Ví dụ: "[Tên], bạn có đang ổn không?", "Một quan sát nhỏ sáng nay về sự bình an", "Gửi bạn một chút năng lượng tích cực hôm nay".</em>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      2. Cấu trúc Micro-Storytelling (Câu chuyện bỏ túi)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Mở đầu bằng một khoảnh khắc đời thường (uống ly cà phê, quan sát một người trên đường, một cuộc trò
                      chuyện ngắn). Từ chi tiết nhỏ đó khái quát lên một quy luật tâm lý hoặc một bài học thức tỉnh, rồi
                      mới nhẹ nhàng giới thiệu buổi workshop như một giải pháp đồng hành.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      3. Kêu gọi hành động dạng Soft CTA (Nhẹ nhàng)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Thay vì nút bấm lớn "ĐĂNG KÝ NGAY HÔM NAY", hãy sử dụng liên kết văn bản mộc mạc: "Nếu bạn cảm thấy
                      chủ đề này có thể giúp ích cho bạn hoặc một người bạn thân đang mệt mỏi, bạn có thể dành vài phút
                      đăng ký tham gia cùng tụi mình ở đường link này nhé...".
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-blue-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      4. Tỷ lệ phản hồi & Uy tín gửi thư (Deliverability)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Khuyến khích độc giả bấm nút "Reply" trả lời lại email. Khi hộp thư nhận thấy người nhận thường
                      xuyên phản hồi email của bạn, hệ thống sẽ xếp email của bạn vào tab Primary (Hộp thư chính) thay vì
                      bị ném vào tab Quảng cáo hay Spam.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: KỊCH BẢN DM 3 BƯỚC CHUYỂN ĐỔI CAO                               */}
      {/* ========================================================================= */}
      {activeSection === 'dm_script' && (
        <section className="space-y-6">
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-6 h-6 text-emerald-500" />
              Kịch Bản DM 3 Bước Chuyển Đổi Cao: Từ Comment Vào Inbox 1-1
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Quy tắc chuyển đổi vàng giúp độc giả cảm nhận sự ấm áp, tôn trọng và tự nguyện đăng ký tham gia
            </p>
          </div>

          {/* Philosophy Card */}
          <div
            className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Triết Lý Cốt Lõi: Đừng Bán Khi Khách Chưa Mở Lòng</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  90% thất bại vì khi khách vừa tương tác đã vội vã spam link giới thiệu. Người dùng hiện đại chỉ hành động khi họ thấy mình được thấu hiểu.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Table: Bad vs Good */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`rounded-2xl p-5 border space-y-3 ${
                isDark ? 'bg-rose-950/20 border-rose-900/40 text-slate-200' : 'bg-rose-50/60 border-rose-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 text-sm">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>Cách Làm Sai Khiến Khách "Bỏ Chạy" (Hard Selling)</span>
              </div>
              <ul className="text-xs space-y-2 leading-relaxed text-slate-600 dark:text-slate-300">
                <li>❌ Khách vừa comment '.', ngay lập tức nhắn: "Chào bạn, bên mình đang có khóa học X giảm giá 50%..."</li>
                <li>❌ Dán nguyên một đoạn văn quảng cáo dài 1000 từ kèm 5 link vào tin nhắn riêng.</li>
                <li>❌ Giọng điệu thúc ép: "Bạn đăng ký ngay kẻo hết hạn nhé!"</li>
                <li>❌ Hậu quả: Khách hàng "Seen" không trả lời, chặn nick hoặc báo cáo spam tài khoản.</li>
              </ul>
            </div>

            <div
              className={`rounded-2xl p-5 border space-y-3 ${
                isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200' : 'bg-emerald-50/60 border-emerald-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Cách Làm Chuẩn Chuyên Gia 3 Bước (Consultative)</span>
              </div>
              <ul className="text-xs space-y-2 leading-relaxed text-slate-600 dark:text-slate-300">
                <li>✅ <strong>Bước 1 - Mở lời đồng cảm:</strong> Ghi nhận bình luận, nhắc lại một chi tiết cụ thể họ đã chia sẻ.</li>
                <li>✅ <strong>Bước 2 - Đào sâu nỗi đau:</strong> Đặt câu hỏi thăm dò mở để họ tự nói ra khúc mắc thực sự.</li>
                <li>✅ <strong>Bước 3 - Gửi link nhẹ nhàng (Soft CTA):</strong> Giới thiệu workshop/bài test như một món quà giúp đỡ chân thành.</li>
                <li>✅ Kết quả: Khách hàng cảm kích, mở lòng tâm sự và tỷ lệ điền link đạt trên 60%.</li>
              </ul>
            </div>
          </div>

          {/* Interactive Ready-to-use DM Script Templates */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Copy className="w-4 h-4 text-indigo-500" />
              <span>Kho Mẫu Kịch Bản DM Thực Chiến (Sao Chép 1 Cú Click)</span>
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {dmTemplates.map((tpl) => {
                const isCopied = copiedKey === tpl.id;
                const fullText = `[BƯỚC 1 - ĐỒNG CẢM & GHI NHẬN]:\n${tpl.steps.step1}\n\n[BƯỚC 2 - ĐÀO SÂU NỖI ĐAU]:\n${tpl.steps.step2}\n\n[BƯỚC 3 - GỬI LINK NHẸ NHÀNG (SOFT CTA)]:\n${tpl.steps.step3}`;

                return (
                  <div
                    key={tpl.id}
                    className={`rounded-2xl border p-5 sm:p-6 transition-all space-y-4 ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {tpl.category}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                          {tpl.target}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleCopy(fullText, tpl.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã Sao Chép Trọn Bộ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Chép Kịch Bản 3 Bước</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step Breakdown */}
                    <div className="space-y-3 text-xs leading-relaxed">
                      {/* Step 1 */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                              1
                            </span>
                            Bước 1: Mở lời đồng cảm & ghi nhận
                          </span>
                          <button
                            onClick={() => handleCopy(tpl.steps.step1, `${tpl.id}_s1`)}
                            className="text-[11px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `${tpl.id}_s1` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === `${tpl.id}_s1` ? 'Đã chép' : 'Chép bước 1'}</span>
                          </button>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic">"{tpl.steps.step1}"</p>
                      </div>

                      {/* Step 2 */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">
                              2
                            </span>
                            Bước 2: Câu hỏi đào sâu nỗi đau (Khơi gợi nhu cầu)
                          </span>
                          <button
                            onClick={() => handleCopy(tpl.steps.step2, `${tpl.id}_s2`)}
                            className="text-[11px] text-slate-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `${tpl.id}_s2` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === `${tpl.id}_s2` ? 'Đã chép' : 'Chép bước 2'}</span>
                          </button>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic">"{tpl.steps.step2}"</p>
                      </div>

                      {/* Step 3 */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                              3
                            </span>
                            Bước 3: Gửi link nhẹ nhàng (Soft CTA)
                          </span>
                          <button
                            onClick={() => handleCopy(tpl.steps.step3, `${tpl.id}_s3`)}
                            className="text-[11px] text-slate-400 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `${tpl.id}_s3` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === `${tpl.id}_s3` ? 'Đã chép' : 'Chép bước 3'}</span>
                          </button>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic">"{tpl.steps.step3}"</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: CẨM NANG AN TOÀN & FAQS                                          */}
      {/* ========================================================================= */}
      {activeSection === 'safety_faq' && (
        <section className="space-y-6">
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              Cẩm Nang An Toàn Tài Khoản & Giải Đáp Thắc Mắc (FAQs)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Bảo vệ độ trust của tài khoản, xử lý rủi ro tâm lý và cách đo lường tỷ lệ chuyển đổi hiệu quả
            </p>
          </div>

          {/* Safe Posting Frequency Matrix */}
          <div
            className={`rounded-2xl p-6 border space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Ma Trận Tần Suất Đăng Bài & Bình Luận An Toàn (Anti-Spam)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tuân thủ các ngưỡng này để tránh bị hệ thống quét hành vi bất thường (Shadowban hoặc Checkpoint xác minh danh tính):
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b ${isDark ? 'border-slate-800 text-slate-300 bg-slate-800/40' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                  <tr>
                    <th className="p-3 font-bold rounded-l-xl">Loại Tài Khoản</th>
                    <th className="p-3 font-bold">Tần Suất Bài Đăng</th>
                    <th className="p-3 font-bold">Số Lượt Comment / Ngày</th>
                    <th className="p-3 font-bold">Khoảng Cách Giữa Các Lần</th>
                    <th className="p-3 font-bold rounded-r-xl">Lưu Ý Sống Còn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Nick Mới (&lt; 3 tháng)</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">Tối đa 1 bài/ngày</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">3 - 5 comment chất lượng</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">Cách nhau ít nhất 20-30 phút</td>
                    <td className="p-3 text-amber-600 dark:text-amber-400">Tuyệt đối không dán cùng một nội dung liên tục</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Nick Thường (3-12 tháng)</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">1 - 2 bài/ngày</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">6 - 10 comment / ngày</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">Cách nhau 10-15 phút</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Tương tác like/reply trước khi đăng</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Nick Trust Cao (&gt; 1 năm)</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">1 - 3 bài/ngày</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">10 - 15 comment / ngày</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">Linh hoạt tự nhiên</td>
                    <td className="p-3 text-indigo-600 dark:text-indigo-400">Ưu tiên comment bài trong nhóm chuyên môn</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Objection Handling Card */}
          <div
            className={`rounded-2xl p-6 border space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>Cách Xử Lý Khi Bị Nghi Ngờ Bán Hàng, Đa Cấp Hay "Lùa Gà"</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Khi bạn chia sẻ về workshop hay bài test, đôi khi sẽ gặp những bình luận tiêu cực như: "Lại bán khóa học à?", "Đa cấp trá hình". Đừng tranh cãi đối đầu, hãy xử lý theo quy tắc 3 bước hòa giải:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">1. Xác nhận và đồng cảm với sự thận trọng của họ:</span>
                <p className="italic text-slate-700 dark:text-slate-300">
                  "Dạ em rất hiểu sự thận trọng của anh/chị ạ. Thời buổi bây giờ trên mạng có quá nhiều chương trình thu phí đội lốt chia sẻ nên tâm lý đề phòng là hoàn toàn bình thường..."
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">2. Khẳng định tính minh bạch và cam kết không ràng buộc:</span>
                <p className="italic text-slate-700 dark:text-slate-300">
                  "Workshop bên em là hoạt động sinh hoạt định kỳ của cộng đồng phi lợi nhuận, hoàn toàn không thu bất kỳ chi phí nào và cũng không bán sản phẩm/khóa học nào phía sau cả. Mọi người đến tham gia với tinh thần học hỏi, nếu thấy không phù hợp có thể thoải mái rời nhóm bất cứ lúc nào ạ."
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-amber-600 dark:text-amber-400">3. Chuyển quyền quyết định cho họ:</span>
                <p className="italic text-slate-700 dark:text-slate-300">
                  "Em xin phép gửi anh/chị tài liệu tóm tắt tham khảo trước, nếu thấy có giá trị thì mình giao lưu thêm, không thì cũng coi như thêm một góc nhìn mới trong ngày ạ ❤️"
                </p>
              </div>
            </div>
          </div>

          {/* Conversion Measurement Framework */}
          <div
            className={`rounded-2xl p-6 border space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
              <Target className="w-5 h-5 text-indigo-500" />
              <span>Khung Đo Lường Hiệu Quả Chuyển Đổi (Tracking Funnel)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <span className="text-[11px] font-bold text-slate-400">Tầng 1: Thu Hút</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Lượt Xem & Dwell Time</p>
                <p className="text-[10px] text-slate-500">Mục tiêu: Độc giả dừng lại đọc &gt; 30 giây</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <span className="text-[11px] font-bold text-slate-400">Tầng 2: Tương Tác</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Comment / Thả Tim</p>
                <p className="text-[10px] text-slate-500">Mục tiêu: Kích hoạt &gt; 15 comment thảo luận</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <span className="text-[11px] font-bold text-slate-400">Tầng 3: Kết Nối</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Tỷ Lệ Mở DM 1-1</p>
                <p className="text-[10px] text-slate-500">Mục tiêu: &gt; 40% người comment đồng ý chat</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-center">
                <span className="text-[11px] font-bold text-slate-400">Tầng 4: Chuyển Đổi</span>
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Điền Form / Đăng Ký</p>
                <p className="text-[10px] text-slate-500">Mục tiêu: &gt; 60% người đã chat hoàn tất form</p>
              </div>
            </div>
          </div>

          {/* Interactive Collapsible FAQ Accordion */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Những Câu Hỏi Thường Gặp (FAQs)</span>
            </h3>

            {[
              {
                q: 'Làm sao để nhận biết bài viết hoặc nick của mình bị Shadowban (giảm tương tác ngầm)?',
                a: 'Nếu các bài đăng trước đây thường có 50-100 tương tác nhưng 2-3 bài gần đây tụt xuống dưới 5 like dù nội dung hay, hoặc khi dùng nick khác tìm kiếm tên bạn không thấy xuất hiện trên thanh tìm kiếm của nền tảng, có thể bạn đã bị đưa vào danh sách kiểm duyệt ngầm. Cách khắc phục: Ngừng đăng bài và ngừng rải link trong 48 - 72 giờ, chỉ lướt xem video, like dạo để làm ấm lại tài khoản.',
              },
              {
                q: 'Có nên tạo nhiều tài khoản clone (nick phụ) để đi rải comment không?',
                a: 'Không khuyến khích. Thuật toán của Meta và TikTok hiện tại nhận diện chung địa chỉ IP, vân tay thiết bị (Device Fingerprint) và mẫu hành vi lặp lại. Các tài khoản clone thiếu hoạt động đời thường rất dễ bị khóa hàng loạt. Hãy tập trung xây dựng 1-2 tài khoản chính chủ có đầy đủ ảnh đại diện, thông tin xác thực để gia tăng tối đa niềm tin khi nhắn tin 1-1.',
              },
              {
                q: 'Sau khi đăng bài bao lâu thì nên vào thả bình luận ghim mồi đặt link?',
                a: 'Thời điểm lý tưởng nhất là trong vòng 1 - 3 phút ngay sau khi đăng bài. Bạn tự để lại bình luận đầu tiên chứa link bài test/khảo sát. Sau đó, dùng một nick bạn bè vào trả lời (reply) bình luận đó để đẩy nó lên nổi bật nhất.',
              },
              {
                q: 'Nếu khách hàng im lặng sau khi mình gửi tin nhắn DM Bước 1 thì xử lý ra sao?',
                a: 'Không nên nhắn dồn dập hay hỏi "Sao bạn chưa trả lời mình?". Hãy để sau 24-48 giờ, bạn chỉ cần gửi một tin nhắn ngắn nhẹ nhàng: "Chào bạn [Tên], hôm qua thấy bạn bận nên mình không dám làm phiền thêm nè. Chúc bạn một ngày mới nhiều năng lượng nhé ❤️". Độc giả sẽ cảm kích sự lịch sự của bạn và thường sẽ chủ động trả lời lại.',
              },
              {
                q: 'Làm thế nào để duy trì nguồn ý tưởng đăng bài liên tục mỗi ngày mà không bị cạn kiệt?',
                a: 'Hãy áp dụng "Quy tắc 1 biến thành 5": Một trải nghiệm hoặc một cuộc trò chuyện thú vị trong ngày có thể viết lại theo 5 hình thức: (1) Post tâm sự Threads; (2) Post phân tích bài học trên Facebook; (3) Comment chia sẻ dưới video TikTok; (4) Bài học quản trị trên LinkedIn; (5) Một lá thư Email gửi độc giả. Bạn chỉ cần nhập ý tưởng thô vào Studio, AI sẽ giúp bạn biến hóa ra mọi định dạng.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs shrink-0 font-bold">
                        ?
                      </span>
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom Conversion CTA */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border text-center space-y-4 ${
          isDark
            ? 'bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border-indigo-900/40'
            : 'bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border-indigo-100'
        }`}
      >
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
          Sẵn Sàng Biến Mỗi Bài Đăng Thành Khách Hàng Inbox Tiềm Năng?
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Chọn ngay 1 trong 7 Lệnh Order được thiết kế sẵn hoặc vào Studio để AI hỗ trợ bạn sáng tạo nội dung chuyển đổi đỉnh cao chỉ trong vài giây!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('workbench')}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Vào Studio Tạo Bài Ngay</span>
              </button>
              <button
                onClick={() => onNavigate('orders')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                }`}
              >
                <Compass className="w-4 h-4 text-indigo-500" />
                <span>Khám Phá 7 Lệnh Order</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
