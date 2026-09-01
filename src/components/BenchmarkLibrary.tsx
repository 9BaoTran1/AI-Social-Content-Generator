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
        className={`p-6 rounded-2xl border shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Benchmark Thực Chiến 20+ Năm
            </span>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-indigo-600" />
              <span>Kho Mẫu Comment & Post Chuyển Đổi Cao</span>
            </h2>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Tuyển tập các khung mẫu content Facebook Long-Form (Dự án cộng đồng, Talkshow HR/L&D/QA), TikTok, Threads và LinkedIn. Bạn cũng có thể lưu bất kỳ bài viết/comment nào từ Studio vào kho này!
          </p>
        </div>

        {/* Action Button: Add New Template */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mẫu Vào Kho</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo ngành, từ khóa, tag..."
            className={`w-full border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-2xs'
            }`}
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        </div>

        {/* Platform Filters */}
        <div
          className={`flex p-1 rounded-xl border text-xs overflow-x-auto ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {['All', 'Facebook', 'TikTok', 'Threads', 'LinkedIn'].map((plat) => (
            <button
              key={plat}
              onClick={() => setFilterPlatform(plat)}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
        {filtered.map((item: SampleTemplate) => (
          <div
            key={item.id}
            className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-4 transition-all hover:border-indigo-500/50 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="space-y-3">
              {/* Header tags */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
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
                      isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Insight */}
              <p className={`text-xs italic p-2.5 rounded-xl border ${
                isDark ? 'bg-indigo-950/20 text-indigo-300 border-indigo-900/40' : 'bg-indigo-50/60 text-indigo-900 border-indigo-100'
              }`}>
                💡 <strong>Góc nhìn chuyên gia:</strong> {item.keyInsight}
              </p>

              {/* Content box */}
              <div
                className={`p-3.5 rounded-xl border font-sans text-xs leading-relaxed whitespace-pre-line select-all max-h-72 overflow-y-auto ${
                  isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-200' : 'bg-slate-50/80 border-slate-200 text-slate-800'
                }`}
              >
                {item.content}
              </div>

              {/* First Comment Seed if available */}
              {item.firstCommentSeed && (
                <div
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Pin className="w-3 h-3 text-amber-500" />
                      Bình luận ghim mồi đặt link (Tránh bóp reach):
                    </span>
                    <button
                      onClick={() => copyCmt(item.firstCommentSeed!, item.id)}
                      className="hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {copiedCmtId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmtId === item.id ? 'Đã copy cmt' : 'Copy cmt'}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono select-all whitespace-pre-line opacity-90">
                    {item.firstCommentSeed}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className={`pt-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                onClick={() => onUseTemplate(item.content)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Dùng mẫu này trong Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => copyText(item.content, item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  copiedId === item.id
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
                }`}
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Đã copy!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy bài viết</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Thêm Mẫu Mới Vào Kho */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                  className="px-4 py-2 rounded-xl border text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
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
