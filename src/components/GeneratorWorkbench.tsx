import React, { useState, useEffect } from 'react';
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
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  FileText,
  Layers,
  ChevronDown,
  UserCheck,
  Sliders,
  Smartphone,
  Share2,
  Heart,
  MessageCircle,
  Wand2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Info,
  Cpu,
  Brain,
  Zap,
  Download,
  SendHorizontal,
  Key,
  BookmarkPlus,
  Pin,
  Send,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { saveHistoryItem, saveCustomBenchmarkTemplate } from '../lib/storage';
import { generateOrderAI, getApiKey, setApiKey, refineContentAI } from '../lib/aiService';

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
    text: 'Sáng tạo hết mình, bay bổng cùng ý tưởng: Dân Content đang duy trì cảm hứng như thế nào? Dự án cộng đồng phi lợi nhuận kiểm tra sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5, không bán khóa học, không PR lùa gà, kèm tư vấn bác sĩ 1-1.',
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
  const [selectedProgramId, setSelectedProgramId] = useState<string>('auto');
  const [writingTone, setWritingTone] = useState<WritingToneOption>('empathy_story');
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
  const [inlineApiKey, setInlineApiKey] = useState<string>('');

  // Interactive Refinement state (Chat tiếp để chỉnh sửa theo ý muốn)
  const [refineInstruction, setRefineInstruction] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refineExplanation, setRefineExplanation] = useState<string | null>(null);

  // Save to Benchmark status
  const [savedBenchmarkIdx, setSavedBenchmarkIdx] = useState<number | null>(null);

  const copyWithFeedback = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentOrderMeta: OrderMeta =
    ORDERS_METADATA.find((o) => o.id === selectedOrderType) || ORDERS_METADATA[0];

  const isFacebook = currentOrderMeta.platform === 'Facebook';

  // Allow ALL active programs freely on Facebook & other platforms (No restriction)
  const filteredPrograms = programs.filter((p) => p.isActive !== false);

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
        return `${trimmed}\n\n[Góc tiếp cận gợi ý]: Nhấn mạnh sự đồng cảm với nỗi băn khoăn về năng lực thật sự, phân tích nguyên nhân gốc rễ và gợi mở làm bài trắc nghiệm/tham vấn 1-1 để định vị bản thân rõ ràng.`;
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
          includeLink,
          customAudience: customAudience.trim() || undefined,
          lengthPreference,
        },
      });

      result.orderTitle = currentOrderMeta.title;
      result.platform = currentOrderMeta.platform;

      setGeneratedResult(result);
      setActiveVariationIndex(0);
      setResultTab('variations');
      saveHistoryItem(result);
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportText = () => {
    if (!generatedResult) return;
    const content = `=== TỔNG HỢP NỘI DUNG ORDER ===
Lệnh: Order ${currentOrderMeta.orderNumber} - ${generatedResult.orderTitle} (${generatedResult.platform})
Dự án: ${generatedResult.programTitle}
Thời gian tạo: ${new Date(generatedResult.createdAt).toLocaleString('vi-VN')}

--- 3 PHƯƠNG ÁN NỘI DUNG ---
${generatedResult.variations.map((v, i) => `\n[PHƯƠNG ÁN ${i + 1}]:\n${v}\n`).join('\n')}

--- KỊCH BẢN DM 1-1 CHUYỂN ĐỔI ---
1. Đồng cảm:
"${generatedResult.dmFollowUpScript.step1_empathy}"

2. Câu hỏi đào sâu:
"${generatedResult.dmFollowUpScript.step2_qualifyQuestion}"

3. Lời mời gửi link test / form 1-1:
"${generatedResult.dmFollowUpScript.step3_inviteLink}"

--- LÝ DO AI CHỌN DỰ ÁN & INSIGHT ---
${generatedResult.rationale}
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
        className={`rounded-2xl p-4 shadow-sm border transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800/90'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Bước 1: Chọn Nền Tảng & Lệnh Order
            </span>
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ({ORDERS_METADATA.length} lệnh chuẩn hóa)
            </span>
          </div>
          {isFacebook && (
            <span
              className={`text-[11px] font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-lg ${
                isDark ? 'text-emerald-300/90 bg-emerald-950/40 border border-emerald-800/60' : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Facebook không bị hạn chế: Rải tự do Workshop & Chương trình</span>
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
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
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
            className={`border rounded-2xl p-5 space-y-4 shadow-sm transition-colors ${
              isDark
                ? 'bg-slate-900/90 border-slate-800/90'
                : 'bg-white border-slate-200'
            }`}
          >
            {/* Active Order Summary Note */}
            <div
              className={`border rounded-xl p-3 text-xs space-y-1 ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800/80'
                  : 'bg-indigo-50/50 border-indigo-100/80'
              }`}
            >
              <div
                className={`flex items-center justify-between font-semibold ${
                  isDark ? 'text-slate-300' : 'text-indigo-950'
                }`}
              >
                <span>Mục tiêu Order {currentOrderMeta.orderNumber}: {currentOrderMeta.title}</span>
                <span className="text-[10px] text-indigo-600 font-semibold">{currentOrderMeta.platform}</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {currentOrderMeta.description}
              </p>
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
                  <span>Workshop / Chương trình đích</span>
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
                  <option value="auto">✨ AI tự động chọn WS/CT phù hợp nhất với ngữ cảnh</option>
                  <optgroup label="Tất Cả Workshops & Chương Trình Khả Dụng">
                    {filteredPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.type === 'ws' ? 'Workshop (WS)' : 'Chương trình (CT)'}] {p.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
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
                  Cascade Model Tự Động
                </span>
              </div>

              <select
                value={writingTone}
                onChange={(e) => setWritingTone(e.target.value as WritingToneOption)}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="empathy_story">💬 Tự sự & Đồng cảm sâu sắc (Storytelling chạm tim)</option>
                <option value="workplace_insight">🏢 Phân tích tâm lý công sở & Reframe góc nhìn mới lạ</option>
                <option value="provocative_reframe">⚡ Phản biện bẻ khóa định kiến (Góc nhìn độc bản)</option>
                <option value="assessment_test">📋 Giá trị cộng đồng - Trắc nghiệm / Test 1-1 phi lợi nhuận</option>
              </select>
            </div>

            {/* Hộp Ý Tưởng, Từ Khóa & Bối Cảnh Toàn Năng (Unified Smart Composer) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
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

              {/* Quick Idea & Keyword Helper Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 no-scrollbar">
                <span className={`text-[10px] font-semibold whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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

            {/* Collapsible Advanced Settings (Keeps UI clean!) */}
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
                  className={`w-3.5 h-3.5 transform transition-transform ${
                    showAdvanced ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showAdvanced && (
                <div
                  className={`mt-3 space-y-3 p-3 rounded-xl border ${
                    isDark
                      ? 'bg-slate-950/60 border-slate-800/80'
                      : 'bg-slate-50 border-slate-200'
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
                          className={`py-1 text-xs rounded-lg border transition-all cursor-pointer ${
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

            {/* Error Display & Inline API Key Setup */}
            {error && (
              <div
                className={`p-4 rounded-xl border space-y-3 text-xs ${
                  error.includes('API_KEY') || error.includes('403') || error.includes('unregistered')
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {error.includes('API_KEY') || error.includes('403') || error.includes('unregistered') ? (
                    <Key className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-bold">
                      {error.includes('API_KEY') || error.includes('403') || error.includes('unregistered')
                        ? 'Cần nhập Gemini API Key để kích hoạt AI:'
                        : 'Thông báo xử lý:'}
                    </p>
                    <p className="leading-relaxed text-[11px] opacity-90">
                      {error.includes('API_KEY') || error.includes('403') || error.includes('unregistered')
                        ? 'Website đang chạy ở chế độ tĩnh trực tiếp trên trình duyệt. Bạn chỉ cần dán Gemini API Key vào ô dưới để tạo content ngay:'
                        : error}
                    </p>
                  </div>
                </div>

                {/* Inline API Key Input when needed */}
                {(error.includes('API_KEY') || error.includes('403') || error.includes('unregistered')) ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={inlineApiKey}
                        onChange={(e) => setInlineApiKey(e.target.value)}
                        placeholder="Dán Gemini API Key (AIzaSy...)"
                        className="flex-1 border rounded-lg px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (inlineApiKey.trim()) {
                            setApiKey(inlineApiKey.trim());
                            setError(null);
                            handleGenerate();
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        Lưu & Tạo Ngay
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-amber-800 dark:text-amber-300">Chưa có key? Nhận miễn phí vĩnh viễn:</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                      >
                        Lấy Key tại Google AI Studio ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleGenerate()}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Thử lại ngay</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button (The Clear Focal Point!) */}
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>AI Đang Phân Tích & Sản Xuất Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo 4 Phong Cách & Kịch Bản DM</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output Workbench (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {generatedResult ? (
            <div
              className={`border rounded-2xl p-5 space-y-4 shadow-sm transition-colors ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800/90'
                  : 'bg-white border-slate-200'
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
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Mục tiêu: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{generatedResult.programTitle}</strong>
                  </p>
                </div>

                {/* Clean View Tabs */}
                <div
                  className={`flex p-1 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setResultTab('variations')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      resultTab === 'variations'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    4 Phong Cách Bài Viết
                  </button>
                  <button
                    onClick={() => setResultTab('dm_script')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      resultTab === 'dm_script'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kịch Bản DM 1-1
                  </button>
                  <button
                    onClick={() => setResultTab('preview')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      resultTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Xem Trước
                  </button>
                </div>
              </div>

              {/* Utility Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleGenerate(true)}
                    disabled={isLoading}
                    title="Gọi AI đổi góc nhìn và tạo lại các phương án mới"
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-amber-800/60'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5 text-amber-500" />
                    <span>Đổi góc nhìn (Remix Thinking)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const allVariations = generatedResult.variations
                        .map((v, i) => `[MẪU ${i + 1}]:\n${v}`)
                        .join('\n\n');
                      copyWithFeedback(allVariations, 'copy-all-vars');
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {copiedId === 'copy-all-vars' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Đã chép tất cả mẫu</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sao chép tất cả</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportText}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? 'bg-slate-950 hover:bg-slate-800 text-indigo-300 border-indigo-900/60'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file .TXT</span>
                </button>
              </div>

              {/* TAB 1: 4 Content Variations */}
              {resultTab === 'variations' && (
                <div className="space-y-4">
                  {/* First Comment Seed Highlight (Facebook Posts) */}
                  {generatedResult.firstCommentSeed && (
                    <div
                      className={`p-3.5 rounded-xl border space-y-1.5 ${
                        isDark ? 'bg-amber-950/25 border-amber-900/40 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                          <Pin className="w-3.5 h-3.5 text-amber-500" />
                          Bình luận ghim mồi đặt link (Tránh bóp reach Facebook):
                        </span>
                        <button
                          onClick={() => copyWithFeedback(generatedResult.firstCommentSeed!, 'cmt-seed')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        >
                          {copiedId === 'cmt-seed' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Đã chép cmt</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép cmt</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-mono select-all whitespace-pre-line leading-relaxed opacity-95">
                        {generatedResult.firstCommentSeed}
                      </p>
                    </div>
                  )}

                  {/* List of Variations */}
                  <div className="space-y-3">
                    {generatedResult.variations.map((variation, idx) => {
                      const styleNames = [
                        'Mẫu 1: Tự Sự & Đồng Cảm Sâu Sắc (Storytelling)',
                        'Mẫu 2: Phản Biện & Góc Nhìn Mới Lạ (Reframe)',
                        'Mẫu 3: Giá Trị Cộng Đồng - Trắc Nghiệm / Test 1-1',
                        'Mẫu 4: Chuyên Gia Thực Chiến & Đúc Kết Kinh Nghiệm',
                      ];
                      const styleTitle = styleNames[idx] || `Mẫu ${idx + 1}`;
                      const isSelectedForRefine = activeVariationIndex === idx;

                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveVariationIndex(idx)}
                          className={`border rounded-xl p-4 space-y-2.5 transition-all cursor-pointer ${
                            isSelectedForRefine
                              ? isDark
                                ? 'bg-slate-950 border-indigo-500/80 ring-1 ring-indigo-500/50'
                                : 'bg-indigo-50/30 border-indigo-400 ring-1 ring-indigo-200'
                              : isDark
                              ? 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                              : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {styleTitle}
                              </span>
                              {isSelectedForRefine && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-semibold">
                                  Đang chọn chỉnh sửa
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {/* Save to Benchmark Library */}
                              <button
                                onClick={() => handleSaveToBenchmark(variation, idx)}
                                title="Lưu bài viết này vào Kho Mẫu Chuển để dùng lại"
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                                  savedBenchmarkIdx === idx
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : isDark
                                    ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-900/60'
                                    : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                <BookmarkPlus className="w-3 h-3 text-amber-500" />
                                <span>{savedBenchmarkIdx === idx ? 'Đã lưu kho!' : 'Lưu vào Kho Mẫu'}</span>
                              </button>

                              {/* Copy Button */}
                              <button
                                onClick={() => copyWithFeedback(variation, `var-${idx}`)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer ${
                                  isDark
                                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                                }`}
                              >
                                {copiedId === `var-${idx}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-semibold">Đã sao chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Sao chép</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <p
                            className={`text-xs leading-relaxed whitespace-pre-line font-sans select-all ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {variation}
                          </p>

                          <div
                            className={`text-[10px] pt-2 flex items-center justify-between border-t ${
                              isDark ? 'text-slate-500 border-slate-900' : 'text-slate-400 border-slate-200'
                            }`}
                          >
                            <span>{variation.length} ký tự</span>
                            <span className="italic text-indigo-500">Bấm vào bài viết để chọn tinh chỉnh qua Chat</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive Refinement Chat (Chat tiếp để chỉnh theo ý muốn) */}
                  <div
                    className={`border rounded-xl p-4 space-y-3 ${
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
                      <div className="p-2 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
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
                        className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
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
                            <span>Đang tinh chỉnh...</span>
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

              {/* TAB 2: DM 1-1 Inbound Script */}
              {resultTab === 'dm_script' && (
                <div className="space-y-3">
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isDark
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-indigo-50/50 border-indigo-100'
                    }`}
                  >
                    <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-indigo-950 font-medium'}`}>
                      Quy trình 3 bước xử lý khi khách hàng comment hoặc inbox xin link/test
                    </span>
                    <button
                      onClick={() => {
                        const fullScript = `BƯỚC 1 (Đồng cảm):\n${generatedResult.dmFollowUpScript.step1_empathy}\n\nBƯỚC 2 (Câu hỏi đào sâu):\n${generatedResult.dmFollowUpScript.step2_qualifyQuestion}\n\nBƯỚC 3 (Gửi link test & mời tham gia):\n${generatedResult.dmFollowUpScript.step3_inviteLink}`;
                        copyWithFeedback(fullScript, 'full-dm');
                      }}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedId === 'full-dm' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Đã chép toàn bộ</span>
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
                    className={`border rounded-xl p-3.5 space-y-1.5 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Bước 1: Chào đón & Đồng cảm (Tạo không gian an toàn)
                      </span>
                      <button
                        onClick={() =>
                          copyWithFeedback(
                            generatedResult.dmFollowUpScript.step1_empathy,
                            'step-1'
                          )
                        }
                        className={`text-[11px] cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {copiedId === 'step-1' ? '✓ Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                    <p
                      className={`text-xs leading-relaxed italic p-2.5 rounded-lg border select-all ${
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
                    className={`border rounded-xl p-3.5 space-y-1.5 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Bước 2: Câu hỏi đào sâu xác định nhu cầu (Qualifying)
                      </span>
                      <button
                        onClick={() =>
                          copyWithFeedback(
                            generatedResult.dmFollowUpScript.step2_qualifyQuestion,
                            'step-2'
                          )
                        }
                        className={`text-[11px] cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {copiedId === 'step-2' ? '✓ Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                    <p
                      className={`text-xs leading-relaxed italic p-2.5 rounded-lg border select-all ${
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
                    className={`border rounded-xl p-3.5 space-y-1.5 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Bước 3: Lời mời gửi bài test / Form tham vấn 1-1
                      </span>
                      <button
                        onClick={() =>
                          copyWithFeedback(
                            generatedResult.dmFollowUpScript.step3_inviteLink,
                            'step-3'
                          )
                        }
                        className={`text-[11px] cursor-pointer ${
                          isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {copiedId === 'step-3' ? '✓ Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                    <p
                      className={`text-xs leading-relaxed italic p-2.5 rounded-lg border select-all ${
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
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                    className={`rounded-xl border p-4 max-w-lg mx-auto space-y-3 shadow-sm ${
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
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {generatedResult.platform} • Vừa xong
                          </span>
                        </div>
                      </div>
                    </div>

                    <p
                      className={`text-xs leading-relaxed whitespace-pre-line select-all p-3 rounded-lg border ${
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
            /* Clean Empty State */
            <div
              className={`h-full min-h-[380px] rounded-2xl border p-8 flex flex-col items-center justify-center text-center space-y-3 transition-colors ${
                isDark
                  ? 'border-slate-800/80 bg-slate-900/40'
                  : 'border-slate-200 bg-white shadow-2xs'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                  isDark
                    ? 'bg-slate-850 border-slate-800 text-indigo-400'
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Sẵn sàng tạo nội dung chuyển đổi
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nhập ý tưởng bài đăng ở cột bên trái và bấm <strong>"Tạo 3 Phương Án & Kịch Bản DM"</strong> để nhận ngay kết quả.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
