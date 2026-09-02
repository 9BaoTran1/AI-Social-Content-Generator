import React, { useState, useEffect } from 'react';
import { SampleTemplate, ThemeMode } from '../types';
import { BENCHMARK_TEMPLATES } from '../data/defaultPrograms';
import {
  getCustomBenchmarkTemplates,
  saveCustomBenchmarkTemplate,
  deleteCustomBenchmarkTemplate,
} from '../lib/storage';
import {
  MessageSquare,
  Copy,
  Check,
  Plus,
  Trash2,
  BookmarkCheck,
  Search,
  ArrowRight,
  Video,
  Linkedin,
  Facebook,
  AtSign,
  X,
  Sparkles,
  Pin,
  Gauge,
  CheckCircle2,
} from 'lucide-react';

interface BenchmarkLibraryProps {
  onUseTemplate: (templateContent: string) => void;
  theme: ThemeMode;
}

export const BenchmarkLibrary: React.FC<BenchmarkLibraryProps> = ({ onUseTemplate, theme }) => {
  const isDark = theme === 'dark';
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCmtId, setCopiedCmtId] = useState<string | null>(null);

  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<SampleTemplate[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Template Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState<'Facebook' | 'TikTok' | 'Threads' | 'LinkedIn' | 'Email'>('Facebook');
  const [newCategory, setNewCategory] = useState('Bài Viết Facebook Long-Form');
  const [newContent, setNewContent] = useState('');
  const [newFirstCommentSeed, setNewFirstCommentSeed] = useState('');
  const [newKeyInsight, setNewKeyInsight] = useState('');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    setCustomTemplates(getCustomBenchmarkTemplates());
  }, []);

  const allTemplates: SampleTemplate[] = [...customTemplates, ...BENCHMARK_TEMPLATES];

  const filtered = allTemplates.filter((t) => {
    const matchPlatform = filterPlatform === 'All' || t.platform.toLowerCase() === filterPlatform.toLowerCase();
    const matchSearch =
      searchTerm.trim() === '' ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchPlatform && matchSearch;
  });

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCmt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmtId(id);
    setTimeout(() => setCopiedCmtId(null), 2000);
  };

  const copyCombo = (content: string, cmt: string | undefined, id: string) => {
    let combined = content;
    if (cmt) {
      combined += `\n\n---\n[BÌNH LUẬN GHIM MỒI ĐẶT LINK]:\n${cmt}`;
    }
    copyText(combined, id);
  };

  const getTemplateMetrics = (text: string) => {
    const clean = text.trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    const chars = clean.length;
    const readingSeconds = Math.max(5, Math.round((words / 200) * 60));
    const readingTimeStr = readingSeconds < 60 ? `~${readingSeconds}s đọc` : `~${Math.ceil(readingSeconds / 60)} phút đọc`;
    return { words, chars, readingTimeStr };
  };

  const handleSaveNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài mẫu.');
      return;
    }

    const item: SampleTemplate = {
      id: `custom-bm-${Date.now()}`,
      title: newTitle.trim(),
      platform: newPlatform,
      category: newCategory.trim() || 'Mẫu Chuyển Đổi',
      content: newContent.trim(),
      firstCommentSeed: newFirstCommentSeed.trim() || undefined,
      keyInsight: newKeyInsight.trim() || 'Bài mẫu thực chiến đã được kiểm chứng.',
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isCustom: true,
    };

    saveCustomBenchmarkTemplate(item);
    setCustomTemplates(getCustomBenchmarkTemplates());
    setIsAddModalOpen(false);

    // Reset
    setNewTitle('');
    setNewContent('');
    setNewFirstCommentSeed('');
    setNewKeyInsight('');
    setNewTags('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài mẫu này khỏi kho?')) {
      deleteCustomBenchmarkTemplate(id);
      setCustomTemplates(getCustomBenchmarkTemplates());
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'TikTok':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'LinkedIn':
        return <Linkedin className="w-4 h-4 text-sky-500" />;
      case 'Facebook':
        return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'Threads':
        return <AtSign className="w-4 h-4 text-emerald-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border-slate-800'
            : 'bg-gradient-to-br from-white via-indigo-50/40 to-slate-50 border-slate-200 shadow-xs'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Benchmark Thực Chiến 20+ Năm Kinh Nghiệm</span>
          </div>
          <h2
            className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <BookmarkCheck className="w-6 h-6 text-indigo-600" />
            <span>Kho Mẫu Bài Viết & Comment Chuyển Đổi Cao</span>
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Tuyển tập các khung mẫu content chuẩn Facebook Long-Form (Dự án cộng đồng phi lợi nhuận, Talkshow HR/L&D/QA, khám sức khỏe WHO-5), TikTok, Threads và LinkedIn. Bạn cũng có thể lưu trực tiếp bất kỳ kết quả nào từ Studio vào kho này!
          </p>
        </div>

        {/* Action Button: Add New Template */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mẫu Mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xs transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Search Box */}
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo ngành, từ khóa, tag..."
            className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
            }`}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[10px] text-slate-400 hover:text-indigo-600 absolute right-3 top-2.5 font-semibold cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Platform Filters */}
        <div
          className={`flex p-1 rounded-xl border text-xs overflow-x-auto no-scrollbar ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {['All', 'Facebook', 'TikTok', 'Threads', 'LinkedIn'].map((plat) => (
            <button
              key={plat}
              onClick={() => setFilterPlatform(plat)}
              className={`px-3 py-2 sm:py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                filterPlatform === plat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {plat === 'All' ? `Tất cả (${allTemplates.length})` : plat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item: SampleTemplate) => {
          const metrics = getTemplateMetrics(item.content);
          return (
            <div
              key={item.id}
              className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-4 transition-all hover:border-indigo-500/50 ${
                isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="space-y-3">
                {/* Header tags & Word Count Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {getPlatformIcon(item.platform)}
                    </div>
                    <span className="text-xs font-bold">
                      {item.platform} • <span className="opacity-80">{item.category}</span>
                    </span>
                    {item.isCustom && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        Mẫu của bạn
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Word Count Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isDark
                          ? 'bg-slate-950 text-slate-300 border-slate-800'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Gauge className="w-3 h-3 text-indigo-500" />
                      <span>{metrics.words} từ</span>
                      <span>•</span>
                      <span>{metrics.readingTimeStr}</span>
                    </span>

                    {item.isCustom && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Xóa mẫu này"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm tracking-tight text-indigo-600 dark:text-indigo-400">
                  {item.title}
                </h3>

                {/* Tags */}
                <div className="flex items-center gap-1 flex-wrap">
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        isDark
                          ? 'bg-slate-950 text-slate-400 border-slate-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Insight */}
                <p
                  className={`text-xs italic p-2.5 rounded-xl border ${
                    isDark
                      ? 'bg-indigo-950/20 text-indigo-300 border-indigo-900/40'
                      : 'bg-indigo-50/60 text-indigo-900 border-indigo-100'
                  }`}
                >
                  💡 <strong>Góc nhìn chuyên gia:</strong> {item.keyInsight}
                </p>

                {/* Content box */}
                <div
                  className={`p-3.5 rounded-xl border font-sans text-xs leading-relaxed whitespace-pre-line select-all max-h-72 overflow-y-auto ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800/80 text-slate-200'
                      : 'bg-slate-50/80 border-slate-200 text-slate-800'
                  }`}
                >
                  {item.content}
                </div>

                {/* First Comment Seed if available */}
                {item.firstCommentSeed && (
                  <div
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      isDark
                        ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1">
                        <Pin className="w-3 h-3 text-amber-500" />
                        Bình luận ghim mồi đặt link (Tránh bóp reach):
                      </span>
                      <button
                        onClick={() => copyCmt(item.firstCommentSeed!, item.id)}
                        className="hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                      >
                        {copiedCmtId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCmtId === item.id ? 'Đã chép cmt' : 'Copy cmt'}</span>
                      </button>
                    </div>
                    <p className="text-xs font-mono select-all whitespace-pre-line opacity-90">
                      {item.firstCommentSeed}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div
                className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}
              >
                <button
                  onClick={() => onUseTemplate(item.content)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Dùng mẫu này trong Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Combo Copy Button */}
                  {item.firstCommentSeed && (
                    <button
                      onClick={() => copyCombo(item.content, item.firstCommentSeed, `bm-combo-${item.id}`)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                    >
                      {copiedId === `bm-combo-${item.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Đã chép combo!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-amber-300" />
                          <span>Copy Bài + Cmt</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Copy Content Only Button */}
                  <button
                    onClick={() => copyText(item.content, item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedId === item.id
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : isDark
                        ? 'bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                    }`}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Đã copy!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy bài</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Thêm Mẫu Mới Vào Kho */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90dvh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm">Thêm Mẫu Bài Viết/Comment Mới Vào Kho</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Tiêu đề mẫu bài viết:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Facebook Long-Form chia sẻ kinh nghiệm vượt khủng hoảng..."
                  required
                  className={`w-full border rounded-xl p-2.5 text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Nền tảng:</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as any)}
                    className={`w-full border rounded-xl p-2 text-xs ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Threads">Threads</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Thể loại:</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Ví dụ: Bài Viết Dài, Comment Mồi..."
                    className={`w-full border rounded-xl p-2 text-xs ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Nội dung bài viết/comment mẫu:</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  placeholder="Dán toàn bộ nội dung mẫu vào đây..."
                  required
                  className={`w-full border rounded-xl p-2.5 text-xs font-sans ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Bình luận ghim mồi đặt link (tùy chọn):</label>
                <textarea
                  value={newFirstCommentSeed}
                  onChange={(e) => setNewFirstCommentSeed(e.target.value)}
                  rows={2}
                  placeholder="Mẫu bình luận ghim mồi đặt link dưới bài viết..."
                  className={`w-full border rounded-xl p-2.5 text-xs font-sans ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Góc nhìn / Insight chiến lược:</label>
                <input
                  type="text"
                  value={newKeyInsight}
                  onChange={(e) => setNewKeyInsight(e.target.value)}
                  placeholder="Ví dụ: Đánh mạnh vào nỗi đau nghề nghiệp, cam kết không bán khóa học..."
                  className={`w-full border rounded-xl p-2 text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Tags (phân cách bằng dấu phẩy):</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Facebook, Long-form, Dân Content, Well-being"
                  className={`w-full border rounded-xl p-2 text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Lưu Vào Kho Mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
