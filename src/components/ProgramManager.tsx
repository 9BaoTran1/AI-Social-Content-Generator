import React, { useState } from 'react';
import { ProgramItem, ProgramType, ThemeMode } from '../types';
import {
  Plus,
  BookOpen,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Upload,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProgramManagerProps {
  programs: ProgramItem[];
  onAddProgram: (program: ProgramItem) => void;
  onUpdateProgram: (program: ProgramItem) => void;
  onDeleteProgram: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  theme?: ThemeMode;
}

export const ProgramManager: React.FC<ProgramManagerProps> = ({
  programs,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
  isAddModalOpen,
  setIsAddModalOpen,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [filterType, setFilterType] = useState<'all' | 'ws' | 'ct'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract Modal state
  const [inputUrl, setInputUrl] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [inputImageBase64, setInputImageBase64] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Extracted Result Draft for review before saving
  const [draftProgram, setDraftProgram] = useState<Partial<ProgramItem> | null>(null);

  // Editing existing program state
  const [editingProgram, setEditingProgram] = useState<ProgramItem | null>(null);

  const filteredPrograms = programs.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.targetAudience.some((a) => a.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = async () => {
    if (!inputUrl.trim() && !inputText.trim() && !inputImageBase64) {
      setExtractError('Vui lòng nhập link Tally/Form, dán văn bản mô tả hoặc tải ảnh lên.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch('/api/extract-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputUrl.trim() || undefined,
          text: inputText.trim() || undefined,
          imageBase64: inputImageBase64,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Không thể bóc tách thông tin.');
      }

      const extracted = resData.data;
      setDraftProgram({
        id: `prog-${Date.now()}`,
        title: extracted.title || 'Chương trình mới',
        type: (extracted.type as ProgramType) || 'ws',
        description: extracted.description || '',
        targetAudience: extracted.targetAudience || [],
        painPoints: extracted.painPoints || [],
        coreValues: extracted.coreValues || [],
        testOrFormAngle: extracted.testOrFormAngle || '',
        imageUrl: extracted.imageUrl || undefined,
        tallyUrl: extracted.tallyUrl || inputUrl.trim() || undefined,
        notes: extracted.notes || '',
        isActive: true,
        isBuiltin: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setExtractError(err.message || 'Lỗi khi bóc tách.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveDraft = () => {
    if (!draftProgram || !draftProgram.title) return;
    onAddProgram(draftProgram as ProgramItem);
    setDraftProgram(null);
    setInputUrl('');
    setInputText('');
    setInputImageBase64(null);
    setIsAddModalOpen(false);
  };

  const handleSaveEditing = () => {
    if (editingProgram) {
      onUpdateProgram(editingProgram);
      setEditingProgram(null);
    }
  };

  const toggleProgramActive = (p: ProgramItem) => {
    onUpdateProgram({
      ...p,
      isActive: !p.isActive,
    });
  };

  const wsCount = programs.filter((p) => p.type === 'ws').length;
  const ctCount = programs.filter((p) => p.type === 'ct').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div
        className={`border p-5 rounded-2xl space-y-4 shadow-sm transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>Kho Workshop & Chương Trình</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {programs.length} mục
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cơ sở dữ liệu kiến thức để AI học và đối chiếu khi sản xuất content cho từng nền tảng
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center justify-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mới Bằng Link / AI</span>
          </button>
        </div>

        {/* Filter Tabs & Search Box */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border text-xs w-full sm:w-auto ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({programs.length})
            </button>
            <button
              onClick={() => setFilterType('ws')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'ws'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Workshop (WS: {wsCount})
            </button>
            <button
              onClick={() => setFilterType('ct')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'ct'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chương trình (CT: {ctCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, nỗi đau..."
              className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPrograms.map((program) => {
          const isWS = program.type === 'ws';
          return (
            <div
              key={program.id}
              className={`border rounded-2xl p-5 shadow-sm space-y-3 transition-all ${
                isDark
                  ? `bg-slate-900/90 ${program.isActive ? 'border-slate-800/90' : 'border-slate-800/40 opacity-50'}`
                  : `bg-white ${program.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`
              }`}
            >
              {/* Card Top: Badges & Controls */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        isWS
                          ? isDark
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isDark
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}
                    >
                      {isWS ? 'Workshop (WS)' : 'Chương trình (CT)'}
                    </span>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                        isWS
                          ? isDark
                            ? 'bg-slate-950 text-emerald-400 border-slate-800'
                            : 'bg-emerald-50/70 text-emerald-700 border-emerald-200'
                          : isDark
                          ? 'bg-slate-950 text-slate-400 border-slate-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isWS ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Chạy được Facebook</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3 h-3 text-slate-400" />
                          <span>Không chạy Facebook</span>
                        </>
                      )}
                    </span>

                    {program.isBuiltin && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          isDark
                            ? 'bg-slate-950 text-slate-400 border-slate-800'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        Hệ thống
                      </span>
                    )}
                  </div>

                  <h3 className={`font-bold text-sm leading-snug pt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {program.title}
                  </h3>
                </div>

                {/* Edit & Delete Controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleProgramActive(program)}
                    title={program.isActive ? 'Tạm ngắt kích hoạt' : 'Kích hoạt'}
                    className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      program.isActive
                        ? isDark
                          ? 'text-slate-400 hover:text-white bg-slate-950 border-slate-800'
                          : 'text-slate-500 hover:text-slate-800 bg-slate-50 border-slate-200'
                        : isDark
                        ? 'text-emerald-400 bg-slate-950 border-emerald-800/60'
                        : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    {program.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditingProgram(program)}
                    title="Chỉnh sửa"
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isDark
                        ? 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800 border-slate-800 bg-slate-950'
                        : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border-slate-200 bg-slate-50'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteProgram(program.id)}
                    title="Xóa"
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isDark
                        ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800 border-slate-800 bg-slate-950'
                        : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200 bg-slate-50'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {program.description}
              </p>

              {/* Target Audience & Pain Points */}
              <div
                className={`space-y-2 pt-2 border-t text-xs ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}
              >
                {program.targetAudience?.length > 0 && (
                  <div>
                    <span
                      className={`text-[11px] font-semibold block mb-1 ${
                        isDark ? 'text-indigo-300' : 'text-indigo-900'
                      }`}
                    >
                      🎯 Đối tượng phù hợp:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {program.targetAudience.map((aud, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded-md border text-[11px] ${
                            isDark
                              ? 'bg-slate-950 text-slate-300 border-slate-800'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {aud}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {program.painPoints?.length > 0 && (
                  <div>
                    <span
                      className={`text-[11px] font-semibold block mb-1 ${
                        isDark ? 'text-rose-300' : 'text-rose-900'
                      }`}
                    >
                      ⚡ Nỗi đau giải quyết (Pain Points):
                    </span>
                    <ul
                      className={`list-disc list-inside text-[11px] space-y-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {program.painPoints.slice(0, 2).map((point, i) => (
                        <li key={i} className="line-clamp-1">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {program.testOrFormAngle && (
                  <div>
                    <span
                      className={`text-[11px] font-semibold block mb-1 ${
                        isDark ? 'text-emerald-300' : 'text-emerald-900'
                      }`}
                    >
                      📋 Góc tiếp cận bài test / form 1-1:
                    </span>
                    <p
                      className={`text-[11px] italic p-2 rounded-lg border select-all ${
                        isDark
                          ? 'text-slate-300 bg-slate-950/80 border-slate-800/80'
                          : 'text-slate-700 bg-emerald-50/50 border-emerald-100'
                      }`}
                    >
                      "{program.testOrFormAngle}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Extract Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Thêm Workshop / Chương Trình
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Dán link Tally, Form hoặc text mô tả để AI tự động bóc tách kiến thức
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setDraftProgram(null);
                }}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!draftProgram ? (
              /* Step 1: Input link / text / image */
              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    1. Dán Link Tally hoặc Google Form (Tùy chọn)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://storage.tally.so/... hoặc https://forms.gle/..."
                      className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white'
                      }`}
                    />
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    2. Hoặc Dán Nội Dung Mô Tả / Copy từ Tally (Được khuyên dùng)
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Dán toàn bộ nội dung giới thiệu chương trình, nỗi đau, giá trị, quyền lợi..."
                    rows={5}
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    3. Tải Ảnh Poster / Banner (Tùy chọn)
                  </label>
                  <label
                    className={`flex items-center justify-center p-2.5 border border-dashed rounded-xl cursor-pointer ${
                      isDark
                        ? 'border-slate-800 bg-slate-950/60 hover:bg-slate-950'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400 mr-2" />
                    <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {inputImageBase64 ? '✓ Đã chọn file ảnh' : 'Chọn file ảnh poster'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {extractError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>{extractError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                      isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleExtract}
                    disabled={isExtracting}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isExtracting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang bóc tách dữ liệu...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Bóc Tách & Học Dữ Liệu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Review & Edit extracted draft */
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>AI đã bóc tách thành công! Vui lòng kiểm tra lại trước khi lưu.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Tên Workshop / CT
                    </label>
                    <input
                      type="text"
                      value={draftProgram.title || ''}
                      onChange={(e) => setDraftProgram({ ...draftProgram, title: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-xs ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Phân loại
                    </label>
                    <select
                      value={draftProgram.type || 'ws'}
                      onChange={(e) =>
                        setDraftProgram({ ...draftProgram, type: e.target.value as ProgramType })
                      }
                      className={`w-full border rounded-xl px-3 py-2 text-xs ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="ws">Workshop (WS - Được chạy trên Facebook)</option>
                      <option value="ct">Chương trình (CT - Không chạy Facebook)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Mô tả ngắn
                  </label>
                  <textarea
                    value={draftProgram.description || ''}
                    onChange={(e) =>
                      setDraftProgram({ ...draftProgram, description: e.target.value })
                    }
                    rows={2}
                    className={`w-full border rounded-xl p-2.5 text-xs ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Góc tiếp cận bài test / form 1-1
                  </label>
                  <input
                    type="text"
                    value={draftProgram.testOrFormAngle || ''}
                    onChange={(e) =>
                      setDraftProgram({ ...draftProgram, testOrFormAngle: e.target.value })
                    }
                    className={`w-full border rounded-xl px-3 py-2 text-xs ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className={`flex justify-between items-center pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button
                    onClick={() => setDraftProgram(null)}
                    className={`px-3 py-1.5 text-xs cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ← Bóc tách lại
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu Vào Kho Dự Án</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Existing Modal */}
      {editingProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Chỉnh sửa Workshop / CT
              </h3>
              <button
                onClick={() => setEditingProgram(null)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Tiêu đề
              </label>
              <input
                type="text"
                value={editingProgram.title}
                onChange={(e) => setEditingProgram({ ...editingProgram, title: e.target.value })}
                className={`w-full border rounded-xl px-3 py-2 text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Phân loại
              </label>
              <select
                value={editingProgram.type}
                onChange={(e) =>
                  setEditingProgram({ ...editingProgram, type: e.target.value as ProgramType })
                }
                className={`w-full border rounded-xl px-3 py-2 text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="ws">Workshop (WS - Được phép chạy Facebook)</option>
                <option value="ct">Chương trình (CT - Không chạy Facebook)</option>
              </select>
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Mô tả
              </label>
              <textarea
                value={editingProgram.description}
                onChange={(e) =>
                  setEditingProgram({ ...editingProgram, description: e.target.value })
                }
                rows={3}
                className={`w-full border rounded-xl p-2.5 text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Góc tiếp cận bài test / form
              </label>
              <input
                type="text"
                value={editingProgram.testOrFormAngle}
                onChange={(e) =>
                  setEditingProgram({ ...editingProgram, testOrFormAngle: e.target.value })
                }
                className={`w-full border rounded-xl px-3 py-2 text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                onClick={() => setEditingProgram(null)}
                className={`px-4 py-2 text-xs cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
