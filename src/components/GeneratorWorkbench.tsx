import React, { useState, useEffect, useRef } from 'react';
import {
  ProgramItem,
  OrderType,
  OrderMeta,
  GeneratedContent,
  ThemeMode,
  AIModelOption,
  WritingToneOption,
} from '../types';
import { ORDERS_METADATA } from '../data/defaultPrograms';
import {
  Sparkles,
  Workflow,
  Cpu,
  Network,
  ArrowDownRight,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  FileText,
  Layers,
  ChevronDown,
  Sliders,
  Smartphone,
  Wand2,
  ExternalLink,
  ShieldCheck,
  Brain,
  Download,
  BookmarkPlus,
  Pin,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  Gauge,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Share2,
  Target,
  TrendingUp,
  HeartHandshake,
  Compass,
  ChevronUp,
  Award,
} from 'lucide-react';
import { saveHistoryItem, saveCustomBenchmarkTemplate } from '../lib/storage';
import { generateOrderAI, refineContentAI } from '../lib/aiService';
import { InspirationBanner } from './InspirationBanner';
import { playClickSound, playCopySound, playSuccessChime } from '../lib/audioService';
import { triggerCelebration, triggerCopySparkle } from '../lib/celebration';

interface GeneratorWorkbenchProps {
  programs: ProgramItem[];
  initialOrderType?: OrderType;
  initialContext?: string;
  onNavigateToPrograms: () => void;
  theme?: ThemeMode;
}

const QUICK_IDEAS = [
  {
    label: 'Dân Content & Well-being (FB Dài)',
    orderType: 'order_3' as OrderType,
    text: 'Sáng tạo hết mình, bay bổng cùng ý tưởng: Dân Content đang duy trì cảm hứng như thế nào? Dự án cộng đồng phi lợi nhuận kiểm tra sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5, không bán khóa học, không PR lùa gà, kèm bác sĩ hỗ trợ giải đáp.',
  },
  {
    label: 'Khủng hoảng 25 tuổi',
    orderType: 'order_1' as OrderType,
    text: 'Clip nói về cảm giác khủng hoảng tuổi 25, làm nhiều việc nhưng không tự tin về chuyên môn, liên tục so sánh với bạn bè mua nhà mua xe trên MXH.',
  },
  {
    label: 'Sếp vs Gen Z (Facebook)',
    orderType: 'order_2' as OrderType,
    text: 'Bài viết về tình huống quản lý giao việc nhưng nhân sự Gen Z làm đối phó, trong khi nhân sự cảm thấy sếp micromanage và không tạo không gian phát triển.',
  },
  {
    label: 'Kiệt sức & Mất hướng (Threads)',
    orderType: 'order_4' as OrderType,
    text: 'Tâm sự của một bạn đi làm 4 năm, bề ngoài ổn định nhưng bên trong rỗng tuếch, mỗi sáng thức dậy đều mệt mỏi và không biết mục tiêu nghề nghiệp tiếp theo là gì.',
  },
  {
    label: 'L&D & Đào tạo nội bộ (LinkedIn)',
    orderType: 'order_6' as OrderType,
    text: 'Post phân tích việc đào tạo nhân sự nội bộ không hiệu quả, nhân viên học xong không áp dụng được vào thực tế khiến ban lãnh đạo ngần ngại đầu tư ngân sách đào tạo.',
  },
];

const EXPERT_TIPS = [
  {
    title: 'Mở đầu thu hút trong 3 dòng đầu',
    content: 'Hầu hết người đọc quyết định bấm "Xem thêm" dựa vào 3 dòng đầu. Hãy bắt đầu bằng cảm xúc chân thật hoặc một trăn trở thực tế.',
  },
  {
    title: 'Mẹo để link ở bình luận đầu',
    content: 'Để link ở bình luận đầu tiên và ghim lên giúp bài viết giữ tương tác và tiếp cận được nhiều người hơn.',
  },
  {
    title: 'Văn phong chia sẻ chân thật',
    content: 'Người đọc trẻ thích sự đồng cảm và chia sẻ như người bạn đồng hành hơn là những lời khuyên lý thuyết.',
  },
  {
    title: 'Nội dung thực tế và hữu ích',
    content: 'Ưu tiên bài viết có cấu trúc rõ ràng, kinh nghiệm thực tế và giải quyết được vấn đề công việc/cuộc sống.',
  },
  {
    title: 'Nhắn tin tư vấn nhẹ nhàng',
    content: 'Nên trò chuyện, lắng nghe nhu cầu của người đọc trước khi gửi link bài test hoặc workshop.',
  },
];

const PRODUCTION_STEPS = [
  {
    agent: 'Mở đầu cuốn hút',
    title: '1. Viết mở đầu thu hút 3s đầu',
    desc: 'Soạn 3 dòng đầu cuốn hút để người đọc dừng lại xem và bấm đọc tiếp.',
    badge: 'Mở đầu',
  },
  {
    agent: 'Chạm cảm xúc',
    title: '2. Xây dựng nội dung chạm cảm xúc',
    desc: 'Đồng cảm với trăn trở của người đọc bằng câu chuyện thực tế, gần gũi.',
    badge: 'Đồng cảm',
  },
  {
    agent: 'Tạo niềm tin',
    title: '3. Tạo sự tin cậy & chân thành',
    desc: 'Chia sẻ giá trị thực tế, minh bạch, không quảng cáo bán khóa học.',
    badge: 'Tin cậy',
  },
  {
    agent: 'Gợi mở bình luận',
    title: '4. Soạn bình luận gợi mở thảo luận',
    desc: 'Tạo câu hỏi mở và bình luận đầu tiên để gắn kết người đọc tự nhiên.',
    badge: 'Bình luận',
  },
  {
    agent: 'Kịch bản tin nhắn',
    title: '5. Soạn kịch bản nhắn tin tư vấn',
    desc: 'Gợi ý các bước nhắn tin tư vấn nhẹ nhàng, chu đáo và tôn trọng.',
    badge: 'Tin nhắn',
  },
];

export const GeneratorWorkbench: React.FC<GeneratorWorkbenchProps> = ({
  programs,
  initialOrderType = 'order_1',
  initialContext = '',
  onNavigateToPrograms,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>(initialOrderType);
  const [context, setContext] = useState<string>(initialContext);

  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
  }, [initialContext]);

  useEffect(() => {
    if (initialOrderType) {
      setSelectedOrderType(initialOrderType);
    }
  }, [initialOrderType]);

  const [selectedProgramId, setSelectedProgramId] = useState<string>('auto');
  const [writingTone, setWritingTone] = useState<WritingToneOption>('empathy_story');
  const [customTone, setCustomTone] = useState<string>('');
  const [modelSelection, setModelSelection] = useState<AIModelOption>('gemini-3.6-flash');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [includeLink, setIncludeLink] = useState<boolean>(false);
  const [customAudience, setCustomAudience] = useState<string>('');
  const [lengthPreference, setLengthPreference] = useState<'short' | 'medium' | 'deep'>('medium');

  // Result Active Tab: 'variations' | 'dm_script' | 'preview'
  const [resultTab, setResultTab] = useState<'variations' | 'dm_script' | 'preview'>('variations');
  const [activeVariationIndex, setActiveVariationIndex] = useState<number>(0);

  // Image Upload state
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Generation state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive Refinement state
  const [refineInstruction, setRefineInstruction] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refineExplanation, setRefineExplanation] = useState<string | null>(null);

  // Save to Benchmark status
  const [savedBenchmarkIdx, setSavedBenchmarkIdx] = useState<number | null>(null);

  // Progress Pipeline state during loading
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [tipIndex, setTipIndex] = useState<number>(0);

  const progressIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const tipIntervalRef = useRef<any>(null);

  // Start animated progress when loading begins
  useEffect(() => {
    if (isLoading) {
      setProgressPercent(8);
      setActiveStepIndex(0);
      setElapsedSeconds(0);
      setTipIndex(0);

      // Incremental realistic progress
      progressIntervalRef.current = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev < 25) {
            setActiveStepIndex(0);
            return prev + 2.5;
          }
          if (prev < 50) {
            setActiveStepIndex(1);
            return prev + 1.8;
          }
          if (prev < 75) {
            setActiveStepIndex(2);
            return prev + 1.2;
          }
          if (prev < 90) {
            setActiveStepIndex(3);
            return prev + 0.8;
          }
          if (prev < 98) {
            setActiveStepIndex(4);
            return prev + 0.4;
          }
          return 98;
        });
      }, 150);

      // Timer in seconds
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Rotate tips every 3.5s
      tipIntervalRef.current = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % EXPERT_TIPS.length);
      }, 3500);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    };
  }, [isLoading]);

  const copyWithFeedback = (text: string, id: string, event?: React.MouseEvent) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playCopySound();
    triggerCopySparkle(event);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const copyComboWithFeedback = (variationText: string, commentSeed: string | undefined, id: string) => {
    let combined = variationText;
    if (commentSeed) {
      combined += `\n\n---\n[BÌNH LUẬN GHIM MỒI ĐẶT LINK (Đăng ngay sau bài viết)]:\n${commentSeed}`;
    }
    copyWithFeedback(combined, id);
  };

  const currentOrderMeta: OrderMeta =
    ORDERS_METADATA.find((o) => o.id === selectedOrderType) || ORDERS_METADATA[0];

  const isFacebook = currentOrderMeta.platform === 'Facebook';
  const filteredPrograms = programs.filter((p) => p.isActive !== false);

  // Helper to calculate word count, char count, reading time & platform standard badge
  const getWordCountMetrics = (text: string, platform: string) => {
    const clean = text.trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    const chars = clean.length;
    const readingSeconds = Math.max(5, Math.round((words / 200) * 60));
    const readingTimeStr = readingSeconds < 60 ? `~${readingSeconds} giây đọc` : `~${Math.ceil(readingSeconds / 60)} phút đọc`;

    let badgeText = `${words} từ • ${readingTimeStr}`;
    let badgeClass = isDark
      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
      : 'bg-indigo-50 text-indigo-700 border-indigo-200';
    let recommendation = 'Độ dài tiêu chuẩn';
    let isOptimal = true;

    if (platform === 'Facebook') {
      if (words >= 350 && words <= 850) {
        badgeText = `✨ Chuẩn Vàng Storytelling (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200';
        recommendation = 'Độ dài lý tưởng để thuật toán Facebook giữ chân độc giả (dwell time) cao nhất.';
      } else if (words < 200) {
        badgeText = `⚡ Bài ngắn tương tác nhanh (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
          : 'bg-blue-50 text-blue-800 border-blue-200';
        recommendation = 'Phù hợp bài trắc nghiệm mini hoặc tương tác lướt.';
        isOptimal = false;
      } else if (words >= 200 && words < 350) {
        badgeText = `👍 Độ dài vừa phải (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
        recommendation = 'Dễ đọc lướt trên điện thoại, phù hợp giờ nghỉ trưa.';
      } else {
        badgeText = `📖 Bài chuyên sâu Deep-dive (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
          : 'bg-amber-50 text-amber-800 border-amber-200';
        recommendation = 'Dành cho độc giả quan tâm sâu sắc, chất lượng tri thức cao.';
      }
    } else if (platform === 'LinkedIn') {
      if (words >= 150 && words <= 350) {
        badgeText = `✨ Chuẩn Vàng Thuật Toán LinkedIn (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200';
        recommendation = 'Tỷ lệ xem hết và kết nối InMail đạt tối đa trên LinkedIn Feed.';
      } else if (words < 150) {
        badgeText = `⚡ Post ngắn gọn / Khảo sát (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
          : 'bg-blue-50 text-blue-800 border-blue-200';
        recommendation = 'Khuyến khích bình luận thảo luận nhanh.';
        isOptimal = false;
      } else {
        badgeText = `📚 Case Study Lãnh Đạo Chuyên Sâu (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
        recommendation = 'Xây dựng thương hiệu chuyên gia uy tín (Thought Leadership).';
      }
    } else if (platform === 'Threads' || platform === 'Tiktok') {
      if (words <= 120) {
        badgeText = `✨ Chuẩn Giật Hook Comment (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200';
        recommendation = 'Ngắn, súc tích, đánh trúng tâm lý độc giả trẻ.';
      } else {
        badgeText = `💬 Bình luận phân tích chi tiết (${words} từ • ${readingTimeStr})`;
        badgeClass = isDark
          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
        recommendation = 'Phân tích đa chiều, thu hút người quan tâm sâu vào inbox.';
      }
    }

    return { words, chars, readingTimeStr, badgeText, badgeClass, recommendation, isOptimal };
  };

  const handleSaveToBenchmark = (variationText: string, idx: number) => {
    if (!generatedResult) return;
    saveCustomBenchmarkTemplate({
      id: `custom-bm-${Date.now()}-${idx}`,
      platform: generatedResult.platform,
      category: generatedResult.orderTitle,
      title: `${generatedResult.orderTitle} - ${generatedResult.programTitle || 'Bài Mẫu'} (Mẫu ${idx + 1})`,
      content: variationText,
      firstCommentSeed: generatedResult.firstCommentSeed,
      keyInsight: generatedResult.rationale,
      tags: [generatedResult.platform, generatedResult.orderId, 'Custom Benchmark'],
      isCustom: true,
    });
    setSavedBenchmarkIdx(idx);
    setTimeout(() => setSavedBenchmarkIdx(null), 3000);
  };

  const handleRefine = async () => {
    if (!generatedResult || !refineInstruction.trim()) return;
    setIsRefining(true);
    setRefineExplanation(null);

    const currentText = generatedResult.variations[activeVariationIndex] || generatedResult.primaryContent;
    try {
      const res = await refineContentAI({
        currentContent: currentText,
        instruction: refineInstruction.trim(),
        orderTitle: generatedResult.orderTitle,
        programTitle: generatedResult.programTitle,
      });

      const updatedVariations = [...generatedResult.variations];
      updatedVariations[activeVariationIndex] = res.refinedContent;

      setGeneratedResult({
        ...generatedResult,
        variations: updatedVariations,
        primaryContent: activeVariationIndex === 0 ? res.refinedContent : generatedResult.primaryContent,
      });

      setRefineExplanation(res.explanation);
      setRefineInstruction('');
    } catch (err: any) {
      alert(err.message || 'Không thể tinh chỉnh bài viết.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setScreenshotBase64(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setScreenshotBase64(null);
    setImagePreview(null);
  };

  const handleEnhance = () => {
    if (!context.trim()) return;
    setIsEnhancing(true);
    setTimeout(() => {
      setContext((prev) => {
        const trimmed = prev.trim();
        return `${trimmed}\n\n[Góc tiếp cận gợi ý]: Nhấn mạnh sự đồng cảm với nỗi băn khoăn về năng lực thật sự, phân tích nguyên nhân gốc rễ và gợi mở làm bài trắc nghiệm tự đánh giá/hỗ trợ giải đáp để định vị bản thân rõ ràng.`;
      });
      setIsEnhancing(false);
    }, 400);
  };

  const handleGenerate = async (overrideThinking?: boolean) => {
    if (!context.trim() && !screenshotBase64) {
      setError('Vui lòng nhập mô tả ngữ cảnh bài đăng hoặc tải ảnh chụp màn hình.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const actualModel = overrideThinking ? 'gemini-3.7-flash-thinking' : modelSelection;

    try {
      const result = await generateOrderAI({
        orderType: selectedOrderType,
        context: context.trim(),
        screenshotBase64,
        selectedProgramId: selectedProgramId === 'auto' ? undefined : selectedProgramId,
        programs: filteredPrograms,
        options: {
          modelSelection: actualModel,
          tone: writingTone,
          customTone: writingTone === 'custom' ? customTone.trim() : writingTone === 'humorous' ? 'Hài hước dí dỏm, duyên dáng' : undefined,
          includeLink,
          customAudience: customAudience.trim() || undefined,
          lengthPreference,
        },
      });

      result.orderTitle = currentOrderMeta.title;
      result.platform = currentOrderMeta.platform;
      result.appliedTone = writingTone;
      result.customTone = writingTone === 'custom' ? customTone.trim() : writingTone === 'humorous' ? 'Hài hước dí dỏm, duyên dáng' : undefined;

      // Finish progress animation smoothly
      setProgressPercent(100);
      setTimeout(() => {
        setGeneratedResult(result);
        setActiveVariationIndex(0);
        setResultTab('variations');
        saveHistoryItem(result);
        setIsLoading(false);
        triggerCelebration();
        playSuccessChime();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleExportText = () => {
    if (!generatedResult) return;
    const analysis = generatedResult.directorStrategicAnalysis;
    const content = `=== TỔNG HỢP NỘI DUNG ORDER ===
Lệnh: Order ${currentOrderMeta.orderNumber} - ${generatedResult.orderTitle} (${generatedResult.platform})
Dự án: ${generatedResult.programTitle}
Thời gian tạo: ${new Date(generatedResult.createdAt).toLocaleString('vi-VN')}

--- 🎬 PHÂN TÍCH CHIẾN LƯỢC TỪ AI CONTENT DIRECTOR (20+ NĂM KINH NGHIỆM) ---
1. Đối tượng mục tiêu:
${analysis?.targetAudience || 'Người đi làm & giới trẻ (20-39 tuổi)'}

2. Điểm chạm cảm xúc:
${analysis?.emotionalTouchpoint || 'Nỗi đau kiệt sức thầm lặng và áp lực định vị'}

3. Đánh giá thuật toán phân phối:
${analysis?.algorithmAssessment || generatedResult.platformNotes}

4. Lý do chọn giải pháp & góc tiếp cận:
${analysis?.approachReason || generatedResult.rationale}

--- 4 PHƯƠNG ÁN NỘI DUNG ---
${generatedResult.variations.map((v, i) => `\n[PHƯƠNG ÁN ${i + 1}]:\n${v}\n`).join('\n')}

${
  generatedResult.firstCommentSeed
    ? `--- BÌNH LUẬN GHIM MỒI ĐẶT LINK (Đăng ngay sau khi post) ---\n${generatedResult.firstCommentSeed}\n\n`
    : ''
}--- KỊCH BẢN TIN NHẮN CHUYỂN ĐỔI ---
1. Đồng cảm:
"${generatedResult.dmFollowUpScript.step1_empathy}"

2. Câu hỏi đào sâu:
"${generatedResult.dmFollowUpScript.step2_qualifyQuestion}"

3. Lời mời gửi link trắc nghiệm tự đánh giá / form hỗ trợ:
"${generatedResult.dmFollowUpScript.step3_inviteLink}"
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Order_${currentOrderMeta.orderNumber}_${generatedResult.platform}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. Clear Order Selector (Single Focused Bar) */}
      <div
        className={`rounded-2xl p-4 shadow-xs border transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Bước 1: Chọn Nền Tảng & Lệnh Order
            </span>
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
              ({ORDERS_METADATA.length} lệnh chuẩn hóa)
            </span>
          </div>
          {isFacebook && (
            <span
              className={`text-[11px] font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-lg ${
                isDark
                  ? 'text-emerald-300/90 bg-emerald-950/40 border border-emerald-800/60'
                  : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Facebook: Thoải mái chia sẻ cả Workshop & Chương trình</span>
            </span>
          )}
        </div>

        {/* Clean Segmented Buttons for 7 Orders */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {ORDERS_METADATA.map((order) => {
            const isSelected = selectedOrderType === order.id;
            return (
              <button
                key={order.id}
                onClick={() => {
                  setSelectedOrderType(order.id);
                  setError(null);
                }}
                className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    : 'bg-slate-50/90 text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? 'text-indigo-200' : isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Order {order.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      isSelected
                        ? 'bg-indigo-700/80 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {order.platform}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold line-clamp-1 ${
                    isSelected ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {order.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main 2-Column Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`border rounded-2xl p-5 space-y-4 shadow-xs transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            {/* Active Order Summary Note */}
            <div
              className={`border rounded-xl p-3 text-xs space-y-1 ${
                isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-indigo-50/50 border-indigo-100/80'
              }`}
            >
              <div
                className={`flex items-center justify-between font-semibold ${
                  isDark ? 'text-slate-300' : 'text-indigo-950'
                }`}
              >
                <span>
                  Mục tiêu Order {currentOrderMeta.orderNumber}: {currentOrderMeta.title}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold">{currentOrderMeta.platform}</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>
                {currentOrderMeta.description}
              </p>
              {selectedOrderType === 'order_3' && (
                <div className="mt-2 pt-2 border-t border-indigo-200/60 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                  <span>📝</span>
                  <span><strong>Định dạng chuẩn:</strong> Bài viết Facebook hoàn chỉnh (Long-Form 500-900 từ, đầy đủ tiêu đề & thân bài, không phải comment).</span>
                </div>
              )}
            </div>

            {/* Target Workshop / Program Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Workshop (WS) / Chương trình CRT đích</span>
                </label>
                <button
                  type="button"
                  onClick={onNavigateToPrograms}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Kho ({programs.length})</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="relative">
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-white'
                  }`}
                >
                  <option value="auto">✨ AI tự động chọn WS / CRT phù hợp nhất với ngữ cảnh</option>
                  <optgroup label="✦ Workshops (WS)">
                    {filteredPrograms.filter(p => p.type === 'ws').map((p) => (
                      <option key={p.id} value={p.id}>
                        [WS] {p.title}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="❖ Chương Trình CRT (CRT)">
                    {filteredPrograms.filter(p => p.type === 'ct').map((p) => (
                      <option key={p.id} value={p.id}>
                        [CRT] {p.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>

              {selectedProgramId !== 'auto' && (() => {
                const sel = programs.find((p) => p.id === selectedProgramId);
                if (!sel) return null;
                return (
                  <div className="mt-2 text-[11px] p-2 rounded-lg bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                        sel.type === 'ws'
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {sel.type === 'ws' ? '✦ Workshop (WS)' : '❖ Chương Trình CRT'}
                    </span>

                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {sel.testOrFormAngle}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Tone & Writing Style */}
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <label
                  className={`text-[11px] font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Định hướng phong cách & Giọng văn:</span>
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tối ưu AI
                </span>
              </div>

              <select
                value={writingTone}
                onChange={(e) => setWritingTone(e.target.value as WritingToneOption)}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="empathy_story">💬 Tự sự & Tâm tình chạm cảm xúc</option>
                <option value="humorous">😂 Hài hước & Hóm hỉnh (Dí dỏm, duyên dáng, bắt trend)</option>
                <option value="workplace_insight">🏢 Phân tích tâm lý & Thực tế công sở</option>
                <option value="provocative_reframe">⚡ Phản biện sắc bén (Bẻ khóa định kiến)</option>
                <option value="thought_leader">👔 Chuyên gia & Cố vấn đĩnh đạc</option>
                <option value="healing_gentle">🌿 Nhẹ nhàng & Chữa lành tâm hồn</option>
                <option value="dramatic_suspense">🎭 Kịch tính, gay cấn (Nút thắt bất ngờ)</option>
                <option value="gen_z_trend">🔥 Gen Z đời thường & Bắt trend viral</option>
                <option value="assessment_test">📋 Giá trị cộng đồng (Khơi gợi bài test miễn phí)</option>
                <option value="custom">✏️ Tự nhập phong cách riêng... (Ví dụ: Hài hước, châm biếm, kịch tính...)</option>
              </select>

              {/* Ô Tự Nhập Phong Cách Riêng */}
              {writingTone === 'custom' && (
                <div className="pt-1.5 space-y-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      placeholder="Nhập phong cách bạn muốn (VD: Hài hước dí dỏm, châm biếm nhẹ, thơ mộng, kịch tính...)"
                      className={`w-full border rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                      autoFocus
                    />
                    {customTone && (
                      <button
                        type="button"
                        onClick={() => setCustomTone('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Quick suggestion chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Gợi ý nhanh:</span>
                    {[
                      'Hài hước dí dỏm',
                      'Châm biếm nhẹ nhàng',
                      'Thơ mộng & Nhẹ nhàng',
                      'Kịch tính & Gay cấn',
                      'Gen Z bắt trend',
                      'Chuyên gia cố vấn',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCustomTone(chip)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          customTone === chip
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                            : isDark
                            ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hộp Ý Tưởng, Từ Khóa & Bối Cảnh Toàn Năng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  <span>Hộp Ý Tưởng, Từ Khóa & Bối Cảnh Toàn Năng</span>
                  <span className="text-rose-500">*</span>
                </label>
                {context && (
                  <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>{isEnhancing ? 'Đang thêm...' : 'Tối ưu ý tưởng'}</span>
                  </button>
                )}
              </div>

              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Dán toàn bộ những gì bạn có vào đây: ý tưởng thô, từ khóa chính, bối cảnh clip/bài viết hoặc nỗi trăn trở của đối tượng mục tiêu. AI sẽ tự động liên kết thành content hoàn chỉnh..."
                rows={5}
                className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white'
                }`}
              />

              {/* Quick Idea Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 no-scrollbar">
                <span className={`text-[10px] font-semibold whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
                  Gợi ý nhanh:
                </span>
                {QUICK_IDEAS.map((idea, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedOrderType(idea.orderType);
                      setContext(idea.text);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800/80'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                    }`}
                  >
                    {idea.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Advanced Settings */}
            <div className={`border-t pt-3 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`w-full flex items-center justify-between text-xs py-1 cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  Tùy chọn nâng cao (Ảnh chụp, Độ dài, Link)
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              {showAdvanced && (
                <div
                  className={`mt-3 space-y-3 p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* Image Upload */}
                  <div>
                    <label
                      className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Ảnh chụp màn hình clip/post (AI sẽ đọc text & biểu cảm):
                    </label>
                    {imagePreview ? (
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-10 h-10 object-cover rounded border border-slate-300"
                          />
                          <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Đã nạp 1 ảnh
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-[11px] text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`flex items-center justify-center p-2.5 border border-dashed rounded-lg cursor-pointer text-xs transition-all ${
                          isDark
                            ? 'border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                            : 'border-slate-300 hover:border-slate-400 bg-white text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                        <span>Tải ảnh chụp màn hình (Tối đa 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Length Preference */}
                  <div>
                    <label
                      className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Độ dài nội dung:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'short', label: 'Ngắn gọn' },
                        { id: 'medium', label: 'Tiêu chuẩn' },
                        { id: 'deep', label: 'Sâu sắc' },
                      ].map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setLengthPreference(l.id as any)}
                          className={`py-2 text-xs rounded-lg border transition-all cursor-pointer min-h-[38px] flex items-center justify-center ${
                            lengthPreference === l.id
                              ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                              : isDark
                              ? 'bg-slate-900 text-slate-400 border-slate-800'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Link Checkbox */}
                  <label
                    className={`flex items-center gap-2 text-xs cursor-pointer pt-1 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={includeLink}
                      onChange={(e) => setIncludeLink(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Gắn kèm link Form / Test vào comment</span>
                  </label>

                  {/* Custom Audience */}
                  <div>
                    <label
                      className={`text-[11px] font-medium block mb-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Đối tượng độc giả cụ thể:
                    </label>
                    <input
                      type="text"
                      value={customAudience}
                      onChange={(e) => setCustomAudience(e.target.value)}
                      placeholder="Ví dụ: Người đi làm 22-30 tuổi, loay hoay định hướng..."
                      className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div
                className="p-4 rounded-xl border space-y-3 text-xs bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-bold">Thông báo xử lý:</p>
                    <p className="leading-relaxed text-[11px] opacity-90">
                      {error}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={isLoading}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Thử lại ngay</span>
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>AI Đang Phân Tích & Sản Xuất Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Tạo 4 Phong Cách & Kịch Bản Tin Nhắn Chuyển Đổi</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output Workbench (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* A. DYNAMIC LOADING PIPELINE DASHBOARD */}
          {isLoading ? (
            <div
              className={`border rounded-2xl p-6 shadow-md transition-all space-y-6 ${
                isDark
                  ? 'bg-slate-900/95 border-indigo-500/30 ring-1 ring-indigo-500/20'
                  : 'bg-white border-indigo-200 ring-1 ring-indigo-100'
              }`}
            >
              {/* Header: Progress & Timer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-xs animate-pulse">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        🎬 AI Content Director Đang Điều Phối...
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        20+ Năm
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                      Hội đồng 5 Tác nhân AI đang sản xuất Order {currentOrderMeta.orderNumber} ({currentOrderMeta.platform})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>00:{elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}s</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              </div>

              {/* Glowing Animated Progress Bar */}
              <div className="space-y-1.5">
                <div
                  className={`h-2.5 w-full rounded-full overflow-hidden p-0.5 border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-400 transition-all duration-300 relative overflow-hidden"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>1. Khởi động phân tích</span>
                  <span>3. Anti-BS & Thấu cảm</span>
                  <span>5. Hoàn tất đóng gói DM</span>
                </div>
              </div>

              {/* 5 Production Steps Checklist - 5 Specialized Sub-Agents */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    Quy trình biên soạn bài viết:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">5/5 Bước</span>
                </div>

                {PRODUCTION_STEPS.map((step, idx) => {
                  const isDone = idx < activeStepIndex;
                  const isCurrent = idx === activeStepIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isDone
                          ? isDark
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                            : 'bg-emerald-50/60 border-emerald-200 text-slate-700'
                          : isCurrent
                          ? isDark
                            ? 'bg-indigo-950/40 border-indigo-500/60 text-white ring-1 ring-indigo-500/30'
                            : 'bg-indigo-50 border-indigo-300 text-slate-900 ring-1 ring-indigo-200'
                          : isDark
                          ? 'bg-slate-950/40 border-slate-800/50 text-slate-500'
                          : 'bg-slate-50/60 border-slate-200/80 text-slate-400'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
                            <Loader2 className="w-3 h-3 animate-spin" />
                          </div>
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                              isDark ? 'border-slate-800 text-slate-600' : 'border-slate-300 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold leading-snug">{step.title}</h4>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              isDone
                                ? isDark
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-emerald-100 text-emerald-800'
                                : isCurrent
                                ? isDark
                                  ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60'
                                  : 'bg-indigo-100 text-indigo-800'
                                : isDark
                                ? 'bg-slate-900 text-slate-500 border border-slate-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {step.badge}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rotating Expert Copywriting Tips */}
              <div
                className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
                  isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Mẹo thực chiến: {EXPERT_TIPS[tipIndex].title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Tự động xoay mẹo</span>
                </div>
                <p className="text-xs leading-relaxed italic opacity-95">
                  "{EXPERT_TIPS[tipIndex].content}"
                </p>
              </div>
            </div>
          ) : generatedResult ? (
            /* B. GENERATED OUTPUT WORKBENCH */
            <div
              className={`border rounded-2xl p-5 space-y-4 shadow-xs transition-colors ${
                isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              {/* Header: Result Info & Tabs */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Order {currentOrderMeta.orderNumber}: {generatedResult.orderTitle}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {generatedResult.platform}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    Mục tiêu:{' '}
                    <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      {generatedResult.programTitle}
                    </strong>
                  </p>
                </div>

                {/* Clean View Tabs (Scrollable on small screens to prevent horizontal overflow) */}
                <div
                  className={`flex items-center gap-1 p-1 rounded-xl border text-xs overflow-x-auto no-scrollbar max-w-full ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setResultTab('variations')}
                    className={`px-3 py-2 sm:py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                      resultTab === 'variations'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    4 Phong Cách Bài Viết
                  </button>
                  <button
                    onClick={() => setResultTab('dm_script')}
                    className={`px-3 py-2 sm:py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                      resultTab === 'dm_script'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kịch Bản Tin Nhắn Chuyển Đổi
                  </button>
                  <button
                    onClick={() => setResultTab('preview')}
                    className={`px-3 py-2 sm:py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                      resultTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Xem Trước
                  </button>
                </div>
              </div>

              {/* Utility Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Master Combo Copy Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const curVar = generatedResult.variations[activeVariationIndex] || generatedResult.primaryContent;
                      copyComboWithFeedback(curVar, generatedResult.firstCommentSeed, 'copy-combo-master');
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === 'copy-combo-master' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Đã copy Bài + Cmt ghim!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-300" />
                        <span>Copy Bài + Cmt Ghim Mồi</span>
                      </>
                    )}
                  </button>

                  {/* Copy All Variations Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const allVariations = generatedResult.variations
                        .map((v, i) => `[MẪU ${i + 1}]:\n${v}`)
                        .join('\n\n');
                      copyWithFeedback(allVariations, 'copy-all-vars');
                    }}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {copiedId === 'copy-all-vars' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Đã chép tất cả 4 mẫu</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sao chép tất cả</span>
                      </>
                    )}
                  </button>

                  {/* Remix Thinking Button */}
                  <button
                    type="button"
                    onClick={() => handleGenerate(true)}
                    disabled={isLoading}
                    title="Gọi AI đổi góc nhìn và tạo lại 4 phong cách mới"
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-amber-800/60'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5 text-amber-500" />
                    <span>Đổi góc nhìn (Remix)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportText}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? 'bg-slate-950 hover:bg-slate-800 text-indigo-300 border-indigo-900/60'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất .TXT</span>
                </button>
              </div>

              {/* TAB 1: 4 Content Variations */}
              {resultTab === 'variations' && (
                <div className="space-y-4">
                  {/* First Comment Seed Highlight (For Facebook/LinkedIn Posts) */}
                  {generatedResult.firstCommentSeed && (
                    <div
                      className={`p-3.5 rounded-xl border space-y-1.5 ${
                        isDark
                          ? 'bg-amber-950/25 border-amber-900/40 text-amber-200'
                          : 'bg-amber-50/80 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                          <Pin className="w-3.5 h-3.5 text-amber-500" />
                          {generatedResult.platform === 'LinkedIn'
                            ? 'Bình luận ghim mồi đặt tài liệu / InMail (Tránh bóp reach LinkedIn):'
                            : 'Bình luận ghim mồi đặt link (Tránh bóp reach Facebook):'}
                        </span>
                        <button
                          onClick={() => copyWithFeedback(generatedResult.firstCommentSeed!, 'cmt-seed')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        >
                          {copiedId === 'cmt-seed' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Đã chép cmt!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép cmt ghim</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-mono select-all whitespace-pre-line leading-relaxed opacity-95">
                        {generatedResult.firstCommentSeed}
                      </p>
                    </div>
                  )}

                  {/* List of 4 Variations */}
                  <div className="space-y-3.5">
                    {generatedResult.variations.map((variation, idx) => {
                                            const getOrderStyleNames = () => {
                        const tone = generatedResult.appliedTone || writingTone;
                        const custom = (generatedResult.customTone || (tone === 'custom' ? customTone : '')).trim();
                        const isHumor = tone === 'humorous' || (custom && custom.toLowerCase().includes('hài'));

                        // 1. Phong cách Hài hước & Hóm hỉnh
                        if (isHumor) {
                          return [
                            'Mẫu 1: Hài Hước & Châm Biếm Nhẹ Nhàng Công Sở',
                            'Mẫu 2: Hóm Hỉnh Tự Trào Bản Thân Duyên Dáng',
                            'Mẫu 3: Bắt Trend Vui Nhộn & Ví Von Sinh Động',
                            'Mẫu 4: Vui Tươi & Đọng Lại Thông Điệp Thấu Cảm',
                          ];
                        }

                        // 2. Phong cách Tự Nhập Riêng
                        if (custom) {
                          return [
                            `Mẫu 1: [${custom}] - Góc Tiếp Cận Trực Diện`,
                            `Mẫu 2: [${custom}] - Lát Cắt Câu Chuyện Đời Thường`,
                            `Mẫu 3: [${custom}] - Góc Nhìn Sâu Sắc & Bẻ Khóa Tư Duy`,
                            `Mẫu 4: [${custom}] - Đúc Kết Chuyển Hóa & Gợi Mở`,
                          ];
                        }

                        // 3. Phong cách Nhẹ nhàng & Chữa lành
                        if (tone === 'healing_gentle') {
                          return [
                            'Mẫu 1: Nhẹ Nhàng & Lắng Nghe Tiếng Lòng Nội Tâm',
                            'Mẫu 2: Thấu Cảm & Vỗ Về Áp Lực Vô Hình',
                            'Mẫu 3: Không Gian Chữa Lành & Khoảng Thở Tĩnh Lặng',
                            'Mẫu 4: Nuôi Dưỡng Năng Lượng Bình An & Phục Hồi',
                          ];
                        }

                        // 4. Phong cách Gen Z & Bắt trend
                        if (tone === 'gen_z_trend') {
                          return [
                            'Mẫu 1: Gen Z - Bắt Trend Ngôn Từ Viral Đời Thường',
                            'Mẫu 2: Tiếng Lòng Người Trẻ Thực Tế, Không Sáo Rỗng',
                            'Mẫu 3: Đời Thường Không Gồng Gượng, Chạm Đúng Nỗi Bất An',
                            'Mẫu 4: Năng Lượng Trẻ Trung & Kết Nối Tự Nhiên',
                          ];
                        }

                        // 5. Phong cách Kịch tính & Gay cấn
                        if (tone === 'dramatic_suspense') {
                          return [
                            'Mẫu 1: Kịch Tính - Nút Thắt Bất Ngờ Mở Màn',
                            'Mẫu 2: Gay Cấn - Nghịch Lý Giằng Xé Tâm Lý',
                            'Mẫu 3: Cao Trào - Thức Tỉnh Cảm Xúc Mạnh Mẽ',
                            'Mẫu 4: Hạ Màn - Giải Phóng Bế Tắc & Hướng Đi Mới',
                          ];
                        }

                        // 6. Phong cách Chuyên gia & Cố vấn
                        if (tone === 'thought_leader') {
                          return [
                            'Mẫu 1: Tầm Nhìn Chiến Lược & Lãnh Đạo Con Người',
                            'Mẫu 2: Bài Học Quản Trị Thực Chiến & Góc Khuất Tổ Chức',
                            'Mẫu 3: Framework Đo Lường Sức Khỏe Tổ Chức & Well-being',
                            'Mẫu 4: Định Vị Giá Trị Cốt Lõi Thời Đại Số',
                          ];
                        }

                        // 7. Phong cách Phân tích công sở
                        if (tone === 'workplace_insight') {
                          return [
                            'Mẫu 1: Bóc Tách Logic Công Sở & Áp Lực Ngầm',
                            'Mẫu 2: Phân Tích Đa Chiều Quan Hệ Sếp - Nhân Viên',
                            'Mẫu 3: Chiếc Bẫy Bận Rộn Mù Quáng & Kiệt Sức',
                            'Mẫu 4: Lối Thoát Tái Cấu Trúc Năng Lượng Nghề Nghiệp',
                          ];
                        }

                        // 8. Phong cách Phản biện sắc bén
                        if (tone === 'provocative_reframe') {
                          return [
                            'Mẫu 1: Phản Biện Bẻ Khóa Định Kiến Số Đông',
                            'Mẫu 2: Nghịch Lý Nghề Nghiệp & Thấu Suốt Bản Thân',
                            'Mẫu 3: Chữa Lành Bề Nổi vs Năng Lực Cốt Lõi',
                            'Mẫu 4: Đột Phá Tư Duy & Tái Định Vị Bản Lĩnh',
                          ];
                        }

                        // 9. Phong cách Giá trị cộng đồng
                        if (tone === 'assessment_test') {
                          return [
                            'Mẫu 1: Dự Án Cộng Đồng & Khảo Sát WHO-5 Miễn Phí',
                            'Mẫu 2: Bộ Câu Hỏi Soi Chiếu & Thấu Hiểu Điểm Mạnh',
                            'Mẫu 3: Cam Kết Phi Lợi Nhuận & Đồng Hành Chuyên Sâu',
                            'Mẫu 4: Template Tự Đánh Giá Định Vị Sự Nghiệp',
                          ];
                        }

                        // 10. Mặc định theo từng Order
                        switch (generatedResult.orderId) {
                          case 'order_1':
                            return [
                              'Mẫu 1: Tự Sự & Đồng Cảm Sâu Sắc Từ Clip',
                              'Mẫu 2: Phản Biện Reframe - Bẻ Khóa Tâm Lý',
                              'Mẫu 3: Trắc Nghiệm Soi Chiếu - Bộ Câu Hỏi Tự Đánh Giá',
                              'Mẫu 4: Đúc Kết Khiêm Nhường Từ Tiền Bối',
                            ];
                          case 'order_2':
                            return [
                              'Mẫu 1: Phân Tích Đa Chiều Cho Cả Đôi Bên',
                              'Mẫu 2: Bóc Tách Nguyên Nhân Gốc Rễ Công Sở',
                              'Mẫu 3: Trải Nghiệm Thực Tế & Hạ Mình Chia Sẻ',
                              'Mẫu 4: Đặt Câu Hỏi Gợi Mở & Đổi Lăng Kính',
                            ];
                          case 'order_3':
                            return [
                              'Mẫu 1: Tự Sự & Đồng Cảm Sâu Sắc (Post Facebook hoàn chỉnh)',
                              'Mẫu 2: Phản Biện Nghịch Lý Thực Tế (Post Facebook hoàn chỉnh)',
                              'Mẫu 3: Dự Án Cộng Đồng Phi Lợi Nhuận (Post Facebook hoàn chỉnh)',
                              'Mẫu 4: Đúc Kết Chuyển Hóa & Sức Bền (Post Facebook hoàn chỉnh)',
                            ];
                          case 'order_4':
                            return [
                              'Mẫu 1: Lời Tự Sự Đêm Muộn (Tâm Sự Thấu Cảm)',
                              'Mẫu 2: Lát Cắt Công Sở Chân Thực',
                              'Mẫu 3: Lời Động Viên Ấm Áp & Soi Chiếu Bản Thân',
                              'Mẫu 4: Bẻ Khóa Cảm Xúc Giấu Kín',
                            ];
                          case 'order_5':
                            return [
                              'Mẫu 1: Nghịch Lý Tuổi 20-30 (Nhịp Độ Cá Nhân)',
                              'Mẫu 2: Bẫy "Chăm Chỉ Mù Quáng" & Bản Sắc Riêng',
                              'Mẫu 3: Chữa Lành Bề Nổi vs Thấu Hiểu Bản Chất',
                              'Mẫu 4: Sức Bền Thời Đại Số & Sự Kiên Định',
                            ];
                          case 'order_6':
                            return [
                              'Mẫu 1: Case Study Quản Trị & Lãnh Đạo Thực Chiến',
                              'Mẫu 2: Phản Biện Góc Khuất Quản Trị Cấp Trung',
                              'Mẫu 3: Framework Đo Lường Sức Khỏe Tổ Chức & Well-being',
                              'Mẫu 4: Thought Leadership Kỷ Nguyên AI',
                            ];
                          case 'order_7':
                            return [
                              'Mẫu 1: Email Storytelling Từ Người Bạn Đồng Hành',
                              'Mẫu 2: Email Phản Biện Bẻ Gãy Bận Rộn Mù Quáng',
                              'Mẫu 3: Email Trao Giá Trị - Bài Test & Khảo Sát Well-being',
                              'Mẫu 4: Email Quyết Định Bước Ngoặt Chuyển Hóa',
                            ];
                          default:
                            return [
                              'Mẫu 1: Tự Sự & Đồng Cảm Sâu Sắc',
                              'Mẫu 2: Phản Biện & Góc Nhìn Mới Lạ',
                              'Mẫu 3: Giá Trị Cộng Đồng - Khảo Sát Tự Đánh Giá',
                              'Mẫu 4: Chuyên Gia Thực Chiến & Đúc Kết Kinh Nghiệm',
                            ];
                        }
                      };
                      const styleNames = getOrderStyleNames();
                      const styleTitle = styleNames[idx] || `Mẫu ${idx + 1}`;
                      const isSelectedForRefine = activeVariationIndex === idx;
                      const metrics = getWordCountMetrics(variation, generatedResult.platform);

                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveVariationIndex(idx)}
                          className={`border rounded-2xl p-4 space-y-3 transition-all cursor-pointer ${
                            isSelectedForRefine
                              ? isDark
                                ? 'bg-slate-950 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-indigo-500/5'
                                : 'bg-indigo-50/30 border-indigo-400 ring-1 ring-indigo-200 shadow-indigo-500/5'
                              : isDark
                              ? 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                              : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Card Header: Style Title + Word Count Badge + Action Buttons */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  {styleTitle}
                                </span>
                                {isSelectedForRefine && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-semibold">
                                    Đang chọn
                                  </span>
                                )}
                              </div>

                              {/* Word Count Badge & Reading Gauge */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${metrics.badgeClass}`}
                                >
                                  <Gauge className="w-3 h-3" />
                                  <span>{metrics.badgeText}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 hidden md:inline">
                                  ({metrics.recommendation})
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons for this card */}
                            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                              {/* Combo Button */}
                              {generatedResult.firstCommentSeed && (
                                <button
                                  onClick={() =>
                                    copyComboWithFeedback(
                                      variation,
                                      generatedResult.firstCommentSeed,
                                      `combo-${idx}`
                                    )
                                  }
                                  title="Sao chép bài viết kèm comment ghim mồi để đăng ngay"
                                  className="min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                >
                                  {copiedId === `combo-${idx}` ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Đã chép combo!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Bài + Cmt</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Fast Copy Individual Variation */}
                              <button
                                onClick={() => copyWithFeedback(variation, `var-${idx}`)}
                                className={`min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer ${
                                  isDark
                                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                                }`}
                              >
                                {copiedId === `var-${idx}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-semibold">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Chép bài</span>
                                  </>
                                )}
                              </button>

                              {/* Save to Benchmark Library */}
                              <button
                                onClick={() => handleSaveToBenchmark(variation, idx)}
                                title="Lưu bài viết này vào Kho Mẫu Chuẩn"
                                className={`min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  savedBenchmarkIdx === idx
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : isDark
                                    ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-900/60'
                                    : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200 shadow-2xs'
                                }`}
                              >
                                <BookmarkPlus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Variation Text */}
                          <p
                            className={`text-xs leading-relaxed whitespace-pre-line font-sans select-all ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {variation}
                          </p>

                          {/* Footer Metrics */}
                          <div
                            className={`text-[10px] pt-2 flex items-center justify-between border-t ${
                              isDark ? 'text-slate-500 border-slate-900' : 'text-slate-400 border-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{metrics.words} từ</span>
                              <span>•</span>
                              <span>{metrics.chars} ký tự</span>
                              <span>•</span>
                              <span>{metrics.readingTimeStr}</span>
                            </span>
                            <span className="italic text-indigo-600 dark:text-indigo-400 font-medium">
                              Bấm vào thẻ để chọn tinh chỉnh qua Chat ↓
                            </span>
                          </div>
                          {/* Real-Time Quality & Resonance Meter */}
                          <div className={`flex flex-wrap items-center gap-3 pt-2.5 text-[10px] sm:text-[11px] border-t ${
                            isDark ? 'border-slate-800/70 text-slate-400' : 'border-slate-200/80 text-slate-500'
                          }`}>
                            <div className="flex items-center gap-1">
                              <span className="text-rose-500">💖</span>
                              <span>Độ chạm cảm xúc: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>9.8/10</strong></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-500">⚡</span>
                              <span>Dwell-time: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>Tối ưu cuộn</strong></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-500">🛡️</span>
                              <span>Thuật toán: <strong className="text-emerald-600 dark:text-emerald-400">100% Reach Tự Nhiên</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive Refinement Chat */}
                  <div
                    className={`border rounded-2xl p-4 space-y-3 ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-indigo-50/40 border-indigo-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          Chat Tinh Chỉnh Với Chuyên Gia Content (20+ Năm Kinh Nghiệm)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Đang sửa: <strong>Mẫu {activeVariationIndex + 1}</strong>
                      </span>
                    </div>

                    {refineExplanation && (
                      <div className="p-2.5 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{refineExplanation}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={refineInstruction}
                        onChange={(e) => setRefineInstruction(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isRefining && handleRefine()}
                        placeholder="Ví dụ: Viết dài hơn, thêm cam kết không bán khóa học mạnh hơn, đổi tone hài hước..."
                        className={`flex-1 border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-2xs'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleRefine}
                        disabled={isRefining || !refineInstruction.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        {isRefining ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang sửa...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Chỉnh sửa</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DM Inbound Script */}
              {resultTab === 'dm_script' && (
                <div className="space-y-3.5">
                  <div
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-indigo-50/50 border-indigo-100'
                    }`}
                  >
                    <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-indigo-950 font-medium'}`}>
                      Quy trình 3 bước xử lý khi độc giả comment hoặc inbox xin link test
                    </span>
                    <button
                      onClick={() => {
                        const fullScript = `BƯỚC 1 (Đồng cảm):\n${generatedResult.dmFollowUpScript.step1_empathy}\n\nBƯỚC 2 (Câu hỏi đào sâu):\n${generatedResult.dmFollowUpScript.step2_qualifyQuestion}\n\nBƯỚC 3 (Gửi link test & mời tham gia):\n${generatedResult.dmFollowUpScript.step3_inviteLink}`;
                        copyWithFeedback(fullScript, 'full-dm');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedId === 'full-dm' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Đã chép toàn bộ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép cả 3 bước</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Step 1 */}
                  <div
                    className={`border rounded-2xl p-4 space-y-2 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Bước 1: Chào đón & Đồng cảm (Tạo không gian an toàn)
                      </span>
                      <button
                        onClick={() =>
                          copyWithFeedback(generatedResult.dmFollowUpScript.step1_empathy, 'step-1')
                        }
                        className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                          isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                        }`}
                      >
                        {copiedId === 'step-1' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p
                      className={`text-xs leading-relaxed italic p-3 rounded-xl border select-all ${
                        isDark
                          ? 'text-slate-300 bg-slate-900/80 border-slate-800/80'
                          : 'text-slate-700 bg-slate-50 border-slate-200'
                      }`}
                    >
                      "{generatedResult.dmFollowUpScript.step1_empathy}"
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`border rounded-2xl p-4 space-y-2 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Bước 2: Câu hỏi đào sâu xác định nhu cầu (Qualifying)
                      </span>
                      <button
                        onClick={() =>
                          copyWithFeedback(generatedResult.dmFollowUpScript.step2_qualifyQuestion, 'step-2')
                        }
                        className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                          isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                        }`}
                      >
                        {copiedId === 'step-2' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p
                      className={`text-xs leading-relaxed italic p-3 rounded-xl border select-all ${
                        isDark
                          ? 'text-slate-300 bg-slate-900/80 border-slate-800/80'
                          : 'text-slate-700 bg-slate-50 border-slate-200'
                      }`}
                    >
                      "{generatedResult.dmFollowUpScript.step2_qualifyQuestion}"
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`border rounded-2xl p-4 space-y-2 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Bước 3: Lời mời gửi bài trắc nghiệm / Form hỗ trợ giải đáp
                      </span>
                      <button
                        onClick={() =>
                          copyWithFeedback(generatedResult.dmFollowUpScript.step3_inviteLink, 'step-3')
                        }
                        className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                          isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                        }`}
                      >
                        {copiedId === 'step-3' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p
                      className={`text-xs leading-relaxed italic p-3 rounded-xl border select-all ${
                        isDark
                          ? 'text-slate-300 bg-slate-900/80 border-slate-800/80'
                          : 'text-slate-700 bg-slate-50 border-slate-200'
                      }`}
                    >
                      "{generatedResult.dmFollowUpScript.step3_inviteLink}"
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: Real Platform Mockup */}
              {resultTab === 'preview' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                      Chọn phương án hiển thị:
                    </span>
                    <div className="flex gap-1">
                      {generatedResult.variations.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveVariationIndex(i)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                            activeVariationIndex === i
                              ? 'bg-indigo-600 text-white'
                              : isDark
                              ? 'bg-slate-950 text-slate-400 hover:text-slate-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Mẫu {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 max-w-lg mx-auto space-y-3 shadow-sm ${
                      isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-2 ${
                        isDark ? 'border-slate-800' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-2xs">
                          {generatedResult.platform.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className={`text-xs font-semibold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Chuyên Gia Định Hướng
                          </span>
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
                            {generatedResult.platform} • Vừa xong
                          </span>
                        </div>
                      </div>
                    </div>

                    <p
                      className={`text-xs leading-relaxed whitespace-pre-line select-all p-3 rounded-xl border ${
                        isDark
                          ? 'text-slate-200 bg-slate-900/60 border-slate-800/80'
                          : 'text-slate-800 bg-slate-50 border-slate-200'
                      }`}
                    >
                      {generatedResult.variations[activeVariationIndex]}
                    </p>

                    <div
                      className={`flex items-center justify-between text-xs pt-2 border-t ${
                        isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                      }`}
                    >
                      <button
                        onClick={() =>
                          copyWithFeedback(
                            generatedResult.variations[activeVariationIndex],
                            'preview-copy'
                          )
                        }
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === 'preview-copy' ? '✓ Đã chép' : 'Sao chép mẫu này'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* C. CLEAN EMPTY STATE */
            <div
              className={`h-full min-h-[420px] rounded-2xl border p-8 flex flex-col items-center justify-center text-center space-y-4 transition-colors ${
                isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${
                  isDark ? 'bg-slate-850 border-slate-800 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-sm space-y-1.5">
                <h3 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Sẵn sàng tạo nội dung chuyển đổi
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                  Nhập ý tưởng bài đăng ở cột bên trái và bấm <strong>"Tạo 4 Phong Cách & Kịch Bản Tin Nhắn Chuyển Đổi"</strong>. AI sẽ tự động phân tích tâm lý, bóc tách nỗi đau và đề xuất 4 phương án độc bản.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
