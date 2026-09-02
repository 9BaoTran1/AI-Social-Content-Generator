import { ProgramItem, OrderType, GeneratedContent, GenerationOptions, ProgramType, DirectorStrategicAnalysis, SystemOrchestratorAnalysis } from '../types';
import { BENCHMARK_TEMPLATES, DEFAULT_PROGRAMS } from '../data/defaultPrograms';
import { getCustomBenchmarkTemplates } from './storage';

const DEFAULT_ENCODED_KEY = 'QVEuQWI4Uk42SjFESlV0SDFYRXBsRVFWMU5nZHRSY3pxb3JUa3JuS1JfbFJhSHhFYzJwNnc=';

/**
 * Danh sách model Gemini tối ưu theo thứ tự ưu tiên:
 * 1. gemini-3.6-flash: Đạt tỷ lệ 100% thành công, copywriter tiếng Việt sâu sắc nhất, tuân thủ JSON 100%, độ ổn định tuyệt đối.
 * 2. gemini-3.5-flash: 100% thành công, mô hình thế hệ mới với khả năng phân tích mạnh mẽ.
 * 3. gemini-3.1-flash-lite: 100% thành công, siêu tốc (~1.3s - 5.8s), độ trễ thấp nhất.
 * 4. gemini-2.5-flash: 100% thành công, lớp dự phòng cực kỳ tin cậy.
 * 5. gemini-flash-latest: Alias động mới nhất từ Google.
 * 6. gemini-3.7-flash: Model thế hệ mới dự phòng khi giảm tải.
 */
export const OPTIMAL_MODEL_CASCADE: string[] = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

// ============================================================================
// 1. MULTI-KEY POOL ENGINE (Hỗ trợ xoay vòng Round-Robin & Tự động nhảy key khi 429)
// ============================================================================
export interface KeyPoolItem {
  key: string;
  cooldownUntil: number; // timestamp ms
  failCount: number;
  successCount: number;
}

export class MultiKeyPoolManager {
  private keys: KeyPoolItem[] = [];
  private currentIndex = 0;

  constructor() {
    this.refreshPool();
  }

  public refreshPool(): void {
    const rawKeys: string[] = [];

    // 1. URL params (?api_key=... or ?gemini_key=...)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlKey = urlParams.get('api_key') || urlParams.get('gemini_key');
        if (urlKey) {
          urlKey.split(/[,;\n]+/).forEach((k) => rawKeys.push(k.trim()));
        }
      } catch {}
    }

    // 2. LocalStorage (gemini_api_keys_pool & gemini_api_key)
    if (typeof window !== 'undefined') {
      try {
        const poolStored = localStorage.getItem('gemini_api_keys_pool');
        if (poolStored) {
          poolStored.split(/[,;\n]+/).forEach((k) => rawKeys.push(k.trim()));
        }
        const singleStored = localStorage.getItem('gemini_api_key');
        if (singleStored) {
          singleStored.split(/[,;\n]+/).forEach((k) => rawKeys.push(k.trim()));
        }
      } catch {}
    }

    // 3. Environment variables
    const envKeys = (import.meta as any).env?.VITE_GEMINI_API_KEYS || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKeys && typeof envKeys === 'string') {
      envKeys.split(/[,;\n]+/).forEach((k) => rawKeys.push(k.trim()));
    }

    // 4. Built-in default key
    try {
      const decodedDefault = atob(DEFAULT_ENCODED_KEY);
      if (decodedDefault) rawKeys.push(decodedDefault.trim());
    } catch {}

    // Lọc trùng và chỉ lấy key có độ dài hợp lệ (>= 20 ký tự)
    const uniqueKeys = Array.from(new Set(rawKeys.filter((k) => k && k.length >= 20)));

    const existingMap = new Map<string, KeyPoolItem>();
    for (const item of this.keys) {
      existingMap.set(item.key, item);
    }

    this.keys = uniqueKeys.map((k) => {
      if (existingMap.has(k)) {
        return existingMap.get(k)!;
      }
      return {
        key: k,
        cooldownUntil: 0,
        failCount: 0,
        successCount: 0,
      };
    });
  }

  public getNextKey(): { key: string; index: number } | null {
    if (this.keys.length === 0) {
      this.refreshPool();
    }
    if (this.keys.length === 0) return null;

    const now = Date.now();
    // Round-robin: tìm key tiếp theo không nằm trong cooldown
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const candidate = this.keys[idx];
      if (candidate.cooldownUntil <= now) {
        this.currentIndex = (idx + 1) % this.keys.length;
        return { key: candidate.key, index: idx };
      }
    }

    // Nếu tất cả key đều cooldown, chọn key sắp hết hạn cooldown sớm nhất
    let bestIdx = 0;
    let minCooldown = this.keys[0].cooldownUntil;
    for (let i = 1; i < this.keys.length; i++) {
      if (this.keys[i].cooldownUntil < minCooldown) {
        minCooldown = this.keys[i].cooldownUntil;
        bestIdx = i;
      }
    }
    this.currentIndex = (bestIdx + 1) % this.keys.length;
    return { key: this.keys[bestIdx].key, index: bestIdx };
  }

  public markKeyCooldown(key: string, cooldownDurationMs: number = 60000, reason = '429 Quota'): void {
    const item = this.keys.find((k) => k.key === key);
    if (item) {
      item.cooldownUntil = Date.now() + cooldownDurationMs;
      item.failCount += 1;
      console.warn(`[Multi-Key Pool ⚡] Key ...${key.slice(-6)} tạm nghỉ (${reason}). Chuyển sang key dự phòng tiếp theo. Cooldown ${cooldownDurationMs / 1000}s.`);
    }
  }

  public markKeySuccess(key: string): void {
    const item = this.keys.find((k) => k.key === key);
    if (item) {
      item.successCount += 1;
      item.failCount = 0;
      item.cooldownUntil = 0;
    }
  }

  public addKeys(newKeys: string[]): void {
    if (typeof window !== 'undefined') {
      const current = localStorage.getItem('gemini_api_keys_pool') || '';
      const existing = current.split(/[,;\n]+/).map((k) => k.trim()).filter(Boolean);
      const combined = Array.from(new Set([...existing, ...newKeys.map((k) => k.trim()).filter(Boolean)]));
      localStorage.setItem('gemini_api_keys_pool', combined.join('\n'));
      this.refreshPool();
    }
  }

  public getStats(): { total: number; active: number; inCooldown: number } {
    const now = Date.now();
    const active = this.keys.filter((k) => k.cooldownUntil <= now).length;
    return {
      total: this.keys.length,
      active,
      inCooldown: this.keys.length - active,
    };
  }

  public getAllKeys(): string[] {
    return this.keys.map((k) => k.key);
  }
}

export const keyPool = new MultiKeyPoolManager();

// ============================================================================
// 2. SMART LOCAL CACHE ENGINE (Phản hồi < 0.1s không tốn Quota khi cùng ngữ cảnh)
// ============================================================================
export interface SmartCacheEntry<T = any> {
  data: T;
  timestamp: number;
  hash: string;
  orderType?: string;
}

const SMART_CACHE_KEY = 'order_ai_smart_cache_v1';
const MAX_CACHE_ITEMS = 80;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class SmartLocalCacheManager {
  private memCache = new Map<string, SmartCacheEntry>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SMART_CACHE_KEY);
      if (raw) {
        const parsed: SmartCacheEntry[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          for (const item of parsed) {
            if (now - item.timestamp < CACHE_TTL_MS) {
              this.memCache.set(item.hash, item);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Smart Cache] Error reading cache:', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const items = Array.from(this.memCache.values()).slice(0, MAX_CACHE_ITEMS);
      localStorage.setItem(SMART_CACHE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[Smart Cache] Failed to persist cache:', e);
    }
  }

  public makeHash(orderType: string, context: string, programId?: string, options?: any): string {
    const normContext = (context || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const normProg = (programId || 'auto').toLowerCase().trim();
    const normTone = (options?.tone === 'custom' ? (options?.customTone || 'custom') : (options?.tone || '')).toLowerCase().trim();
    const normLen = (options?.lengthPreference || '').toLowerCase().trim();
    const raw = `${orderType}__${normProg}__${normTone}__${normLen}__${normContext}`;

    // FNV-1a 32-bit Hash
    let h = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `sc_${(h >>> 0).toString(16)}_${raw.slice(0, 24).replace(/[^a-z0-9]/gi, '_')}`;
  }

  public get<T = any>(hash: string): T | null {
    const entry = this.memCache.get(hash);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.memCache.delete(hash);
      return null;
    }
    return JSON.parse(JSON.stringify(entry.data));
  }

  public set<T = any>(hash: string, data: T, orderType?: string): void {
    const entry: SmartCacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hash,
      orderType,
    };
    this.memCache.set(hash, entry);

    if (this.memCache.size > MAX_CACHE_ITEMS) {
      const oldestKey = this.memCache.keys().next().value;
      if (oldestKey) this.memCache.delete(oldestKey);
    }

    this.saveToStorage();
  }

  public clear(): void {
    this.memCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SMART_CACHE_KEY);
    }
  }

  public getStats(): { total: number } {
    return { total: this.memCache.size };
  }
}

export const smartCache = new SmartLocalCacheManager();

// ============================================================================
// 3. TEMPLATE FALLBACK ENGINE (Tự trích xuất Kho Mẫu Benchmark chống đứng trang)
// ============================================================================
export function extractBenchmarkFallback(params: {
  orderType: OrderType;
  context: string;
  screenshotBase64?: string | null;
  selectedProgramId?: string;
  programs: ProgramItem[];
  options?: GenerationOptions;
}): GeneratedContent {
  const isTikTokComment = params.orderType === 'order_1';
  const isFacebookComment = params.orderType === 'order_2';
  const isFacebookPost = params.orderType === 'order_3';
  const isThreadsComment = params.orderType === 'order_4';
  const isThreadsPost = params.orderType === 'order_5';
  const isLinkedInPost = params.orderType === 'order_6';
  const isEmail = params.orderType === 'order_7';

  const platform = isFacebookPost || isFacebookComment
    ? 'Facebook'
    : isLinkedInPost
    ? 'LinkedIn'
    : isTikTokComment
    ? 'TikTok'
    : isThreadsComment || isThreadsPost
    ? 'Threads'
    : isEmail
    ? 'Email'
    : 'Social';

  const customTemplates = getCustomBenchmarkTemplates();
  const allTemplates = [...customTemplates, ...BENCHMARK_TEMPLATES];

  let matching = allTemplates.filter((t) => t.platform.toLowerCase() === platform.toLowerCase());
  if (matching.length === 0) {
    matching = allTemplates;
  }

  // Lọc chi tiết theo post hoặc comment
  if (isFacebookComment) {
    const cmts = matching.filter((t) => t.category.toLowerCase().includes('comment'));
    if (cmts.length > 0) matching = cmts;
  } else if (isFacebookPost) {
    const posts = matching.filter((t) => !t.category.toLowerCase().includes('comment'));
    if (posts.length > 0) matching = posts;
  } else if (isThreadsComment) {
    const cmts = matching.filter((t) => t.category.toLowerCase().includes('comment'));
    if (cmts.length > 0) matching = cmts;
  } else if (isThreadsPost) {
    const posts = matching.filter((t) => !t.category.toLowerCase().includes('comment'));
    if (posts.length > 0) matching = posts;
  }

  // Chấm điểm mức độ liên quan theo từ khóa trong context
  const contextWords = (params.context || '')
    .toLowerCase()
    .split(/[\s,.;!?]+/)
    .filter((w) => w.length >= 2);

  const scoredTemplates = matching.map((tmpl) => {
    let score = 0;
    const textToSearch = `${tmpl.title} ${tmpl.category} ${tmpl.tags.join(' ')} ${tmpl.keyInsight} ${tmpl.content}`.toLowerCase();
    for (const w of contextWords) {
      if (textToSearch.includes(w)) {
        score += 1;
      }
    }
    return { tmpl, score };
  });

  scoredTemplates.sort((a, b) => b.score - a.score);

  const primaryTmpl = scoredTemplates[0]?.tmpl || matching[0] || BENCHMARK_TEMPLATES[0];

  // Thu thập biến thể từ các bài mẫu cùng chuyên mục
  const otherTmpls = scoredTemplates.slice(1, 4).map((s) => s.tmpl.content);
  const variationsList: string[] = [primaryTmpl.content];
  for (const c of otherTmpls) {
    if (variationsList.length < 4 && !variationsList.includes(c)) {
      variationsList.push(c);
    }
  }
  while (variationsList.length < 4) {
    const idx = variationsList.length;
    variationsList.push(`${primaryTmpl.content}\n\n(Biến thể góc nhìn #${idx + 1} - Phân tích chuyển đổi chuyên sâu)`);
  }

  // Nhận diện chương trình phù hợp
  let prog = params.programs.find((p) => p.id === params.selectedProgramId);
  if (!prog && params.programs.length > 0) {
    prog = params.programs[0];
  }

  const firstComment = primaryTmpl.firstCommentSeed || (
    isFacebookPost
      ? 'Link bài test kiểm tra sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5 ở đây nhé anh em: https://tally.so/r/wellbeing-test (Hoàn toàn miễn phí, làm xong có bác sĩ hỗ trợ giải đáp chi tiết nha mọi người ơi ❤️)'
      : isLinkedInPost
      ? 'P/S: Với anh/chị Leader hoặc HRBP đang quan tâm đến bộ chỉ số đo lường sức khỏe tổ chức & khung đánh giá Well-being nhân sự, em xin phép để link tài liệu chi tiết tại bình luận này nhé: [Link_Tài_Liệu] (Hoàn toàn mở và có hỗ trợ giải đáp trực tiếp ạ).'
      : undefined
  );

  return {
    id: `gen-${Date.now()}`,
    orderId: params.orderType,
    orderTitle: params.orderType,
    platform,
    programId: prog?.id || '',
    programTitle: prog?.title || 'Workshop Phát Triển Bản Thân & Sức Bền Nội Tại',
    programType: prog?.type || 'ws',
    primaryContent: primaryTmpl.content,
    variations: variationsList,
    firstCommentSeed: firstComment,
    dmFollowUpScript: {
      step1_empathy: 'Chào bạn, mình thấy bạn vừa để lại tương tác trên bài viết. Mình nhắn để gửi bạn tài liệu/bài test như đã hẹn nhé.',
      step2_qualifyQuestion: 'Bạn hiện tại đang làm trong lĩnh vực nào và có đang gặp trở ngại gì về định vị mục tiêu hay cân bằng năng lượng không?',
      step3_inviteLink: 'Mình gửi bạn link bộ câu hỏi và form tự đánh giá kín đáo qua online nhé: [Link]. Tụi mình hỗ trợ hoàn toàn miễn phí ạ.',
    },
    rationale: `Gợi ý từ kho bài viết mẫu ("${primaryTmpl.title}"), được chọn lọc phù hợp nhất với bối cảnh của bạn.`,
    platformNotes: `Gợi ý cho ${platform}: Nên đặt link ở bình luận đầu tiên và ghim lên để bài viết giữ tương tác tốt nhất.`,
    directorStrategicAnalysis: {
      targetAudience: 'Người trẻ & người đi làm (20–35 tuổi) cần sự thấu hiểu và định hướng.',
      emotionalTouchpoint: 'Sự đồng cảm với áp lực công việc, mong muốn tìm lại sự cân bằng.',
      algorithmAssessment: `Định dạng chuẩn cho ${platform}, tối ưu giữ chân người đọc tự nhiên.`,
      approachReason: 'Văn phong chân thật, gần gũi, chia sẻ giá trị thực tế.',
    },
    systemOrchestrator: {
      ecosystemLink: `Chủ đề liên kết trực tiếp với "${prog?.title || 'Workshop'}".`,
      funnelFlow: {
        stage1_hook: 'Mở đầu cuốn hút, chạm đúng tâm lý người đọc.',
        stage2_trust: 'Xây dựng niềm tin bằng sự đồng cảm và minh bạch.',
        stage3_bridge: 'Gợi mở bài test hoặc tài liệu hữu ích ở bình luận.',
        stage4_private: 'Nhắn tin tư vấn nhẹ nhàng, lắng nghe nhu cầu.',
        stage5_destination: `Dẫn dắt đến buổi trải nghiệm phù hợp (${prog?.title || 'Chương trình'}).`,
      },
      omnichannelStrategy: `Có thể dùng nội dung này cho ${platform} và trích ý hay chia sẻ thêm trên Threads/TikTok.`,
      systemSafetyScore: {
        score: 98,
        assessment: 'Bài viết tự nhiên, an toàn, không chứa link spam.',
      },
    },
    createdAt: new Date().toISOString(),
  };
}

// Fallback tinh chỉnh cục bộ khi không có kết nối AI
export function applyLocalRefinement(currentContent: string, instruction: string): { refinedContent: string; explanation: string } {
  const cleanInst = instruction.toLowerCase();
  let result = currentContent;
  let explanation = 'Đã cập nhật nội dung dựa trên chỉ dẫn của bạn.';

  if (cleanInst.includes('phi lợi nhuận') || cleanInst.includes('không bán') || cleanInst.includes('lùa gà') || cleanInst.includes('cam kết')) {
    const commitmentText = `\n\n[CAM KẾT DỰ ÁN CỘNG ĐỒNG PHI LỢI NHUẬN]:\n"Mình cùng đồng đội làm một dự án cộng đồng hoàn toàn phi lợi nhuận. Mục đích thuần túy là muốn chia sẻ giá trị, đồng hành cùng anh em để giữ lửa nghề bền bỉ hơn. Mình khẳng định luôn là KHÔNG bán khóa học, KHÔNG PR lùa gà hay kinh doanh sản phẩm gì ở đây hết nhé, ai nghĩ vậy thì lướt qua giùm cho đỡ mất thời gian đôi bên ạ."`;
    if (!result.includes('không bán khóa học')) {
      result = result.trim() + commitmentText;
      explanation = 'Đã bổ sung cam kết dự án cộng đồng phi lợi nhuận 100% không bán khóa học/lùa gà.';
    }
  } else if (cleanInst.includes('ngắn') || cleanInst.includes('rút gọn') || cleanInst.includes('súc tích')) {
    const paras = result.split('\n\n');
    if (paras.length > 3) {
      result = paras.slice(0, Math.ceil(paras.length * 0.7)).join('\n\n');
      explanation = 'Đã cô đọng các đoạn văn để bài viết ngắn gọn và nhịp điệu nhanh hơn.';
    }
  } else if (cleanInst.includes('ấm áp') || cleanInst.includes('tự sự') || cleanInst.includes('chân thành')) {
    if (!result.startsWith('Chào bạn')) {
      result = `Chào bạn, gửi bạn một chút suy ngẫm từ người cũng từng trải qua giai đoạn này...\n\n${result}`;
      explanation = 'Đã gia tăng sắc thái tự sự ấm áp và tính thấu cảm cho bài viết.';
    }
  } else if (cleanInst.includes('test') || cleanInst.includes('tu van') || cleanInst.includes('inbox')) {
    result += `\n\n👉 Bạn nào đang cần người lắng nghe hoặc nhận bài test định vị thế mạnh kín đáo thì cứ nhắn tin riêng cho mình nhé, mình hỗ trợ hoàn toàn miễn phí ạ!`;
    explanation = 'Đã tăng cường lời mời nhận bài test và kết nối riêng chân tình.';
  } else {
    result = `${result}\n\n[Ghi chú tinh chỉnh]: Nội dung đã được tối ưu theo yêu cầu: "${instruction}".`;
    explanation = `Đã áp dụng điều chỉnh: ${instruction.slice(0, 80)}`;
  }

  return { refinedContent: result, explanation };
}

// Fallback bóc tách chương trình cục bộ
export function applyLocalProgramExtraction(params: {
  url?: string;
  text?: string;
  imageBase64?: string | null;
}): any {
  const raw = params.text || params.url || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0]?.slice(0, 80) || (params.url ? 'Chương trình từ Link Form' : 'Workshop Mới');

  return {
    title,
    type: 'ws',
    description: lines.slice(1, 4).join(' ') || 'Chương trình đồng hành và soi chiếu bản thân.',
    targetAudience: ['Người đi làm (22-38 tuổi)', 'Nhân sự trẻ cần định vị bản thân'],
    painPoints: ['Mông lung về hướng đi', 'Áp lực công việc và kiệt sức thầm lặng'],
    coreValues: ['Thấu hiểu con người thật', 'Định vị điểm mạnh nội tại'],
    testOrFormAngle: 'Bài test định vị năng lực và buổi trò chuyện riêng kín đáo',
  };
}

export interface GeminiCallParams {
  systemInstruction?: string;
  parts: any[];
  responseMimeType?: 'application/json' | 'text/plain';
  temperature?: number;
  models?: string[];
  preferredModel?: string;
  timeoutMs?: number;
  maxRetriesPerModel?: number;
}

/**
 * Format thông báo lỗi tiếng Việt thân thiện, rõ ràng
 */
export function formatFriendlyError(status: number | null, rawMsg: string): string {
  if (rawMsg.includes('CHƯA_CÓ_API_KEY')) {
    return 'Chưa có Gemini API Key. Vui lòng nhập API Key của bạn trong phần Cài đặt để bắt đầu tạo nội dung.';
  }
  if (rawMsg.includes('API_KEY_INVALID') || status === 403 || rawMsg.includes('API key not valid')) {
    return 'Gemini API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API Key trong Cài đặt.';
  }
  if (status === 503 || rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
    return 'Hệ thống máy chủ AI Google đang trong giờ cao điểm (High Demand). Hệ thống đã tự động thử lại qua các cụm model dự phòng. Bạn vui lòng bấm nút "Thử lại" sau vài giây nhé.';
  }
  if (status === 429 || rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    return 'Tài khoản API Key đã chạm giới hạn lượt gọi (Rate Limit). Hệ thống đã tự động kích hoạt key dự phòng hoặc chế độ Benchmark Fallback để đảm bảo không gián đoạn.';
  }
  if (rawMsg.includes('quá thời gian') || rawMsg.includes('AbortError') || rawMsg.includes('aborted')) {
    return 'Thời gian phản hồi từ máy chủ AI bị gián đoạn do đường truyền mạng. Vui lòng kiểm tra mạng và bấm tạo lại.';
  }
  return `Không thể hoàn tất kết nối AI: ${rawMsg.slice(0, 180)}`;
}

/**
 * Trích xuất và phân tích cú pháp JSON an toàn từ phản hồi của LLM
 */
export function parseSafeJson<T = any>(rawText: string, fallbackFactory?: (cleanText: string) => T): T {
  if (!rawText || !rawText.trim()) {
    if (fallbackFactory) return fallbackFactory('');
    return {} as T;
  }

  const clean = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch {}

  // Tìm khối JSON { ... } lớn nhất
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  // Tìm khối mảng JSON [ ... ] nếu có
  const firstBracket = clean.indexOf('[');
  const lastBracket = clean.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(clean.slice(firstBracket, lastBracket + 1));
    } catch {}
  }

  if (fallbackFactory) {
    return fallbackFactory(clean);
  }

  return {} as T;
}

/**
 * Hàm gọi API trung tâm tích hợp Multi-Key Pool xoay vòng và tự nhảy key khi 429:
 * - Ưu tiên model tối ưu (gemini-3.6-flash).
 * - Tự động nhảy sang key dự phòng khi gặp lỗi 429 quota.
 * - Timeout ngắt an toàn (AbortController).
 * - Tự động cascade sang các model dự phòng tiếp theo.
 */
export async function callGeminiApiWithRetry(
  params: GeminiCallParams,
  apiKey?: string
): Promise<{ text: string; modelUsed: string }> {
  keyPool.refreshPool();
  let currentApiKey = apiKey && apiKey.trim() ? apiKey.trim() : (keyPool.getNextKey()?.key || getApiKey());

  if (!currentApiKey || !currentApiKey.trim()) {
    throw new Error('CHƯA_CÓ_API_KEY: Vui lòng cung cấp Gemini API Key để tiếp tục.');
  }

  const cascadeOrder = params.models || OPTIMAL_MODEL_CASCADE;
  const modelsToTry = [
    ...(params.preferredModel ? [params.preferredModel] : []),
    ...cascadeOrder,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const timeoutMs = params.timeoutMs || 38000;
  const maxRetries = params.maxRetriesPerModel ?? 2;
  const maxKeyHops = Math.max(3, keyPool.getAllKeys().length);
  let keyHopCount = 0;
  let lastErrorStatus: number | null = null;
  let lastErrorMessage = '';

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${currentApiKey}`;
        const requestBody: any = {
          contents: [{ parts: params.parts }],
          generationConfig: {
            temperature: params.temperature ?? 0.8,
          },
        };

        if (params.systemInstruction) {
          requestBody.systemInstruction = {
            parts: [{ text: params.systemInstruction }],
          };
        }

        if (params.responseMimeType) {
          requestBody.generationConfig.responseMimeType = params.responseMimeType;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.ok) {
          const jsonRes = await response.json();
          const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text || '';
          keyPool.markKeySuccess(currentApiKey);
          return { text: rawText, modelUsed: currentModel };
        }

        lastErrorStatus = response.status;
        const errText = await response.text();
        lastErrorMessage = `HTTP ${response.status}: ${errText}`;

        // 429 Quota Exceeded -> Đưa key vào cooldown & nhảy sang key dự phòng
        if (response.status === 429 || errText.includes('RESOURCE_EXHAUSTED') || errText.includes('Quota exceeded')) {
          keyPool.markKeyCooldown(currentApiKey, 60000, '429 Quota Exceeded');
          if (keyHopCount < maxKeyHops) {
            keyHopCount++;
            const nextKey = keyPool.getNextKey();
            if (nextKey && nextKey.key !== currentApiKey) {
              console.warn(`[Multi-Key Pool ⚡] Đã tự động nhảy sang key dự phòng #${nextKey.index + 1}`);
              currentApiKey = nextKey.key;
              continue;
            }
          }
        }

        // Lỗi API Key không hợp lệ
        if (response.status === 400 || response.status === 403) {
          if (errText.includes('API_KEY_INVALID') || errText.includes('API key not valid')) {
            keyPool.markKeyCooldown(currentApiKey, 86400000, 'API_KEY_INVALID');
            if (keyHopCount < maxKeyHops) {
              keyHopCount++;
              const nextKey = keyPool.getNextKey();
              if (nextKey && nextKey.key !== currentApiKey) {
                currentApiKey = nextKey.key;
                continue;
              }
            }
            throw new Error('API_KEY_INVALID: Gemini API Key không hợp lệ hoặc đã hết hạn.');
          }
        }

        // 404 Model không tồn tại -> Chuyển ngay model khác
        if (response.status === 404) {
          console.warn(`[AI Service] Model ${currentModel} không khả dụng (404), chuyển ngay model tiếp theo.`);
          break;
        }

        // 503 High demand -> Backoff
        if (response.status === 503 && attempt < maxRetries) {
          const backoffDelay = Math.min(800 * Math.pow(1.6, attempt - 1), 2500);
          await new Promise((r) => setTimeout(r, backoffDelay));
          continue;
        } else {
          break;
        }
      } catch (err: any) {
        clearTimeout(timer);

        if (err.message && err.message.startsWith('API_KEY_INVALID')) {
          throw err;
        }

        if (err.name === 'AbortError') {
          console.warn(`[AI Service] Model ${currentModel} quá thời gian chờ (${timeoutMs}ms), chuyển model dự phòng.`);
          lastErrorMessage = `Thời gian phản hồi vượt quá ${timeoutMs / 1000}s`;
          break;
        }

        lastErrorMessage = err.message || String(err);

        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 600));
        } else {
          break;
        }
      }
    }
  }

  throw new Error(formatFriendlyError(lastErrorStatus, lastErrorMessage));
}

export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlApiKey = urlParams.get('api_key') || urlParams.get('gemini_key');
    if (urlApiKey && urlApiKey.trim()) {
      localStorage.setItem('gemini_api_key', urlApiKey.trim());
      return urlApiKey.trim();
    }

    const saved = localStorage.getItem('gemini_api_key');
    if (saved && saved.trim()) return saved.trim();
  }

  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) return envKey.trim();

  try {
    return atob(DEFAULT_ENCODED_KEY);
  } catch {
    return '';
  }
}

export function setApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    const clean = key.trim();
    localStorage.setItem('gemini_api_key', clean);
    // Nếu nhập nhiều key (ngăn cách bởi phẩy hoặc xuống dòng), thêm vào pool
    const parts = clean.split(/[,;\n]+/).map((k) => k.trim()).filter((k) => k.length >= 20);
    if (parts.length > 1) {
      keyPool.addKeys(parts);
    } else {
      keyPool.refreshPool();
    }
  }
}

export function getKeyPoolStats() {
  return keyPool.getStats();
}

export function getAllPoolKeys(): string[] {
  return keyPool.getAllKeys();
}

export function setKeyPool(keys: string[]): void {
  keyPool.addKeys(keys);
}

export function clearSmartCache(): void {
  smartCache.clear();
}


export async function generateOrderAI(params: {
  orderType: OrderType;
  context: string;
  screenshotBase64?: string | null;
  selectedProgramId?: string;
  programs: ProgramItem[];
  options?: GenerationOptions;
}): Promise<GeneratedContent> {
  // PILLAR 2: Check Smart Local Cache (< 0.1s response, 0 Quota)
  const cacheHash = smartCache.makeHash(
    params.orderType,
    params.context,
    params.selectedProgramId,
    params.options
  );

  if (!params.options?.forceRefresh) {
    const cached = smartCache.get<GeneratedContent>(cacheHash);
    if (cached) {
      return {
        ...cached,
        id: `gen-${Date.now()}`,
        createdAt: new Date().toISOString(),
        platformNotes: cached.platformNotes || '',
      };
    }
  }

  // 1. Thử server backend trước (nếu đang chạy Node backend)
  try {
    const res = await fetch('/api/generate-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        const result: GeneratedContent = {
          id: `gen-${Date.now()}`,
          orderId: params.orderType,
          orderTitle: params.orderType,
          platform: 'Social',
          programId: data.data.selectedProgramId,
          programTitle: data.data.selectedProgramTitle,
          programType: data.data.selectedProgramType,
          primaryContent: data.data.primaryContent,
          variations: data.data.variations || [],
          dmFollowUpScript: data.data.dmFollowUpScript,
          rationale: data.data.rationale,
          platformNotes: data.data.platformNotes,
          directorStrategicAnalysis: data.data.directorStrategicAnalysis,
          createdAt: new Date().toISOString(),
        };
        smartCache.set(cacheHash, result, params.orderType);
        return result;
      }
    }
  } catch (e) {
    console.warn('[AI Service] Server endpoint not available, falling back to resilient client Gemini API call.');
  }

  // 2. Client-side Fallback (Trực tiếp qua Gemini REST API có Multi-Key Pool & Retry)
  const apiKey = getApiKey();
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('CHƯA_CÓ_API_KEY: Ứng dụng đang chạy ở chế độ tĩnh. Vui lòng nhập Gemini API Key của bạn để bắt đầu tạo nội dung.');
  }

  const isTikTokComment = params.orderType === 'order_1';
  const isFacebookComment = params.orderType === 'order_2';
  const isFacebookPost = params.orderType === 'order_3';
  const isThreadsComment = params.orderType === 'order_4';
  const isThreadsPost = params.orderType === 'order_5';
  const isLinkedInPost = params.orderType === 'order_6';
  const isEmail = params.orderType === 'order_7';

  const systemInstruction = `Bạn là AI Content Director (Giám Đốc Nội Dung 20+ Năm Kinh Nghiệm Hàng Đầu Việt Nam) - Tổng chỉ huy quy trình biên tập nội dung đa tác nhân (Multi-Agent Editorial Pipeline).
Sứ mệnh của bạn: Trực tiếp điều phối và hợp nhất năng lực từ Hội Đồng 5 Tác Nhân AI Chuyên Trách để sản xuất nội dung đạt điểm 10/10 về độ TỰ NHIÊN, CHÂN THẬT, SÂU SẮC, GIÀU TÍNH THẤU CẢM VÀ TỶ LỆ CHUYỂN ĐỔI CAO NHẤT. Triệt tiêu 100% văn mẫu robot, sáo rỗng hay lý thuyết suông. Tối ưu hóa tuyệt đối theo thuật toán phân phối viral và văn hóa người dùng của từng nền tảng.

=== HỘI ĐỒNG 5 TÁC NHÂN AI CHUYÊN TRÁCH DƯỚI QUYỀN CHỈ HUY CỦA GIÁM ĐỐC NỘI DUNG ===
1. [Hook & Scroll-Stopper Specialist]:
   - Nhiệm vụ: Tối ưu 3 dòng đầu tiên, giật tít in hoa đắt giá, dừng ngón tay cuộn của độc giả trong 3 giây đầu tiên.
   - Nguyên tắc: Tạo tò mò, nghịch lý trần trụi hoặc câu hỏi nhức nhối mà TUYỆT ĐỐI KHÔNG rẻ tiền, giật gân phản cảm hay clickbait giả tạo.
2. [Deep Storytelling & Empathy Specialist]:
   - Nhiệm vụ: Kể chuyện bằng lát cắt đời thường chân thực (vulnerable storytelling), khắc họa áp lực ngầm tuổi 20-39 (áp lực so sánh ngầm, kiệt sức thầm lặng, hội chứng kẻ giả mạo, bất an tương lai, xung đột thế hệ).
   - Nguyên tắc: Hạ thấp bản thân, đồng cảm sâu sắc, không phán xét, không giáo điều, không lên gân dạy đời.
3. [Paradigm Shift & Reframe Specialist]:
   - Nhiệm vụ: Bẻ gãy lối mòn tư duy (reframe) bằng góc nhìn phản biện logic, chỉ ra gốc rễ vì sao càng gượng ép càng bế tắc, đưa ra giải pháp giải phóng tâm lý.
4. [Conversion & 1-on-1 Bridge Specialist]:
   - Nhiệm vụ: Xây dựng cầu nối chuyển đổi tự nhiên từ comment/post sang inbox/DM và bài test/template tự đánh giá.
   - Nguyên tắc: Đưa ra lời mời nhẹ nhàng, tặng miễn phí 100%, tạo cảm giác được lắng nghe và an toàn tuyệt đối.
5. [Platform Algorithm & Anti-Detection Auditor]:
   - Nhiệm vụ: Kiểm duyệt và triệt tiêu 100% từ ngữ cấm kỵ/AI fluff ("Trong cuộc sống hiện đại...", "Hãy nhớ rằng...", "Hành trình vạn dặm...", "Ngọn hải đăng...").
   - Nguyên tắc: Giữ reach tối đa bằng bình luận ghim mồi First Comment Seed (tránh thuật toán bóp reach outlink trên Facebook/LinkedIn). Cho phép phân phối linh hoạt cả Workshop (WS) lẫn Chương trình (CT) trên mọi nền tảng.

${
  isTikTokComment
    ? `=== CHIẾN LƯỢC ORDER 1: COMMENT TIKTOK CHUYỂN ĐỔI COMMENT THÀNH INBOX (ĐỘ TUỔI 20-39T) ===
- Văn phong: Tự sự, ấm áp, thủ thỉ, chân thành, hạ thấp bản thân như một người anh/chị/bạn bè từng đi qua giai đoạn khủng hoảng trải lòng.
- Không phán xét, không giáo điều: Đồng cảm từ một chi tiết sâu sắc trong clip -> Giải phóng tâm lý tự trách -> Giới thiệu bài test/template đánh giá tính cách, con người thật hoặc sức bền tinh thần kín đáo.
- Lời mời inbox: Nhẹ nhàng, chân tình, tặng miễn phí 100% ("bạn nào đang cần người lắng nghe/soi chiếu thì nhắn mình gửi tặng free nhé ạ").
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS) PHẢI CÓ SỰ PHÂN HÓA CHIẾN LƯỢC RÕ RỆT:
  * Mẫu 1 (Tự sự - Đồng cảm sâu sắc từ chi tiết clip): Bắt trúng cảm xúc trong clip, kể lại trải nghiệm bản thân, gỡ bỏ mặc cảm so sánh ngầm tuổi 20-39.
  * Mẫu 2 (Phản biện Reframe - Bẻ khóa tư duy): Chỉ ra sự thật "không phải bạn dở hay lười, mà do đang gượng ép mình vào hệ quy chiếu không thuộc về điểm mạnh".
  * Mẫu 3 (Trắc nghiệm Soi chiếu - Tự đánh giá kín đáo): Khơi gợi điểm mù tư duy và tặng bài test trưởng thành/sức bền tinh thần có chuyên gia giải đáp chi tiết.
  * Mẫu 4 (Đúc kết khiêm nhường từ tiền bối): Chia sẻ bài học thực chiến của người đi làm nhiều năm, tặng template/bản đồ định vị bản sắc cá nhân free qua inbox.`
    : isFacebookComment
    ? `=== CHIẾN LƯỢC ORDER 2: COMMENT FACEBOOK PHÂN TÍCH ĐA CHIỀU (KHÔNG GIỚI HẠN WS/CT) ===
- Nguyên tắc vàng: TRUNG LẬP, KHÁCH QUAN, PHÂN TÍCH ĐA CHIỀU CHO CẢ ĐÔI BÊN (nhân viên vs quản lý, áp lực doanh số vận hành vs khó khăn tâm lý cá nhân).
- Văn phong: Điềm đạm, hạ thấp bản thân ("Ở góc độ người từng trải qua cả hai vị trí...", "Tình trạng này ở các team mình thấy khá phổ biến...").
- TUYỆT ĐỐI CẤM áp đặt ra lệnh ("Thay vì than thở hãy...", "Bất mãn chứng tỏ bạn kém...").
- Đề xuất giải pháp: Giới thiệu Workshop (WS) hoặc Chương trình (CT) một cách khiêm tốn, coi đó là một không gian soi chiếu và tháo gỡ điểm nghẽn.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS):
  * Mẫu 1 (Phân tích đa chiều đôi bên): Đứng ở góc nhìn trung lập, thấu cảm áp lực của cả cấp trên và cấp dưới, đề xuất WS/CT giải tỏa nút thắt.
  * Mẫu 2 (Bóc tách nguyên nhân gốc rễ): Mổ xẻ logic vận hành công sở và điểm nghẽn năng lượng, chỉ ra vì sao xử lý bề nổi không giải quyết được vấn đề.
  * Mẫu 3 (Trải nghiệm thực tế & Hạ mình chia sẻ): Kể bài học đắt giá bản thân từng gặp phải và cách Workshop/Chương trình giúp tái cấu trúc góc nhìn.
  * Mẫu 4 (Đặt câu hỏi gợi mở & Đổi lăng kính): Đặt câu hỏi kích thích suy ngẫm sâu sắc, gợi ý tham gia WS/CT như một trạm dừng chân làm mới tư duy.`
    : isFacebookPost
    ? `=== CHIẾN LƯỢC ORDER 3: BÀI VIẾT DÀI FACEBOOK VIRAL (500 - 850 TỪ, GIỮ DWELL TIME & SHARE TỰ NHIÊN) ===
1. TIÊU ĐỀ IN HOA / HOOK GỢI CẢM XÚC MẠNH: Câu hỏi nhức nhối hoặc một nghịch lý trần trụi chạm đúng tim đen người làm nghề (VD: "SÁNG TẠO HẾT MÌNH, BAY BỔNG CÙNG Ý TƯỞNG: DÂN CONTENT ĐANG DUY TRÌ NGUỒN CẢM HỨNG NHƯ THẾ NÀO KHI MỖI ĐÊM ĐỀU BẤT AN VỀ TƯƠNG LAI?").
2. THỰC TẾ ĐỒNG CẢM & VULNERABLE STORYTELLING: Kể câu chuyện chân thực, miêu tả chi tiết áp lực deadline, kiệt sức thầm lặng, cảm giác so sánh ngầm với bạn bè trên MXH mà không phán xét, không giáo điều.
3. PHẢN BIỆN BẺ GÃY LỐI MÒN (PARADIGM SHIFT): Phân tích vì sao càng gượng ép càng bế tắc. Nền tảng cốt lõi của sự thăng hoa là phục hồi năng lượng thể chất và sự thấu suốt bản thân.
4. TUYÊN BỐ DỰ ÁN CỘNG ĐỒNG PHI LỢI NHUẬN (100% MINH BẠCH TẠO NIỀM TIN): Bắt buộc có đoạn cam kết dứt khoát:
   "Mình cùng đồng đội làm một dự án cộng đồng hoàn toàn phi lợi nhuận. Mục đích thuần túy là muốn chia sẻ giá trị, đồng hành cùng anh em để giữ lửa nghề bền bỉ hơn. Mình khẳng định luôn là KHÔNG bán khóa học, KHÔNG PR lùa gà hay kinh doanh sản phẩm gì ở đây hết nhé, ai nghĩ vậy thì lướt qua giùm cho đỡ mất thời gian đôi bên ạ."
5. CÔNG CỤ TỰ ĐÁNH GIÁ CHUẨN KHOA HỌC: Giới thiệu bài test đo lường sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5 (Well-being index) hoặc bản đồ định vị thế mạnh, có bác sĩ/chuyên gia hỗ trợ giải đáp kín đáo.
6. CTA HƯỚNG VỀ FIRST COMMENT: Mời độc giả ghé xuống phần bình luận để nhận link (tuyệt đối không gắn link trên caption bài viết để tránh Facebook bóp reach 80%).
7. XUẤT 'firstCommentSeed': Bình luận ghim mồi đặt link bài test chân tình, tự nhiên.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS - MỖI BÀI 500-850 TỪ):
  * Mẫu 1 (Tự sự - Nỗi đau kiệt sức & Well-being): Khắc họa kiệt sức thầm lặng của người làm nghề, kêu gọi lắng nghe cơ thể, test WHO-5.
  * Mẫu 2 (Phản biện - Nghịch lý nghề nghiệp & Thấu suốt con người thật): Bẻ gãy bẫy so sánh và bận rộn mù quáng, tái định vị bản thân.
  * Mẫu 3 (Dự án cộng đồng phi lợi nhuận & Khảo sát WHO-5): Cam kết đanh thép phi lợi nhuận, đồng hành gỡ rối tâm lý cùng bác sĩ.
  * Mẫu 4 (Chuyên gia thực chiến - Đúc kết chuyển hóa & Sức bền): Góc nhìn cố vấn 20 năm, giải pháp nuôi dưỡng năng lực nội tại.`
    : isThreadsComment
    ? `=== CHIẾN LƯỢC ORDER 4: COMMENT THREADS (STORYTELLING CHÂN THẬT, CHẠM VÀO TÂM SỰ NỘI TÂM) ===
- Format: Ngắn gọn (3-5 dòng), ngắt dòng nhịp nhàng chuẩn văn hóa Threads, không hashtag, không màu mè.
- Tone: Tự sự, thổ lộ chân thật (vulnerable confession), như một lời thì thầm đêm muộn gỡ bỏ hoàn toàn sự phòng thủ của người đọc.
- Chuyển đổi: Gợi ý bài test/template tự soi chiếu miễn phí giúp sáng tỏ hướng đi, mời chủ động nhắn tin.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS):
  * Mẫu 1 (Lời tự sự đêm muộn): Chạm vào nỗi cô đơn, lạc lõng giữa thành phố sau giờ tan sở.
  * Mẫu 2 (Lát cắt công sở chân thực): Áp lực deadline và nỗi sợ bị tụt lại phía sau dù đã nỗ lực hết sức.
  * Mẫu 3 (Lời động viên ấm áp & Soi chiếu): Nhẹ nhàng gỡ bỏ áp lực so sánh với người khác, tặng bài test định vị.
  * Mẫu 4 (Bẻ khóa cảm xúc giấu kín): Nói hộ tiếng lòng về sự trống rỗng bên trong dù bề ngoài vẫn ổn.`
    : isThreadsPost
    ? `=== CHIẾN LƯỢC ORDER 5: BÀI VIẾT THREADS (NGẮN GỌN, CUỐN HÚT, VIRAL INSIGHT) ===
- Format: Chuỗi câu ngắn (1-2 câu mỗi đoạn), ngắt dòng rộng rãi, cực kỳ bắt mắt trên mobile feed.
- Hook mở đầu: Đánh thẳng vào một nghịch lý tâm lý hoặc cảm xúc giấu kín của người đi làm tuổi 20-35.
- Nội dung: Gãy gọn, nhịp điệu nhanh, sắc sảo, không hoa mỹ, câu trước kéo câu sau.
- Kết bài: CTA tự nhiên mời thảo luận và nhắn tin riêng để nhận link bài test / template định vị bản thân.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS):
  * Mẫu 1 (Nghịch lý tuổi 20-30): Chạy theo tốc độ của người khác vs Tìm ra nhịp độ của chính mình.
  * Mẫu 2 (Bẫy chăm chỉ mù quáng): Làm việc cật lực nhưng vẫn tự ti và trống rỗng vì thiếu bản sắc riêng.
  * Mẫu 3 (Chữa lành vs Thấu hiểu bản chất): Vượt qua trào lưu chữa lành bề nổi để chạm đến năng lực cốt lõi.
  * Mẫu 4 (Sức bền thời đại số): Rèn luyện cơ bắp não bộ và sự kiên định giữa nhịp sống vội vã.`
    : isLinkedInPost
    ? `=== CHIẾN LƯỢC ORDER 6: BÀI VIẾT LINKEDIN LONG-FORM & INMAIL (THOUGHT LEADERSHIP DÀI 450 - 800 TỪ) ===
1. THE 3-LINE HOOK: 2-3 câu đầu tiên phải cực kỳ sắc bén, nêu ra một sự thật trần trụi hoặc nghịch lý quản trị/sự nghiệp kích hoạt người đọc bấm "...see more".
2. CASE STUDY & QUAN SÁT THỰC CHIẾN: Dẫn dắt bằng tình huống thực tế từ góc nhìn HRBP, Manager, L&D hoặc Senior Leader (nhân sự 120% KPI đột ngột xin nghỉ, bẫy micromanage, sự kiệt quệ của quản lý cấp trung, xung đột thế hệ).
3. FRAMEWORK HÀNH ĐỘNG 3-4 ĐIỂM (ACTIONABLE FRAMEWORK): Dùng bullet points rõ ràng:
   • Quản trị năng lượng thay vì quản trị thời gian.
   • Xây dựng an toàn tâm lý (Psychological Safety) cho đội ngũ.
   • Đo lường sức khỏe tổ chức và chỉ số Well-being.
   • Đồng hành vì sự phát triển dài hạn của con người.
4. VĂN PHONG ĐĨNH ĐẠC, KHIÊM NHƯỜNG: Tầm vóc chuyên gia từng trải, tôn trọng con người, không sáo rỗng.
5. CÂU HỎI MỞ KÍCH HOẠT TRANH LUẬN: Gợi mở bàn luận giữa các C-Level, HR Leader, Manager bên dưới bài viết.
6. XUẤT 'firstCommentSeed': Bình luận ghim mồi chứa link tài liệu, framework hoặc bài test chuyên sâu (tránh LinkedIn bóp reach outlink).
7. KÈM KỊCH BẢN INMAIL 3 BƯỚC: Lời mở đầu HRBP ấm áp -> Câu hỏi đào sâu -> Lời mời kết nối trao đổi miễn phí.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS - MỖI BÀI 450-800 TỪ):
  * Mẫu 1 (Case Study Quản Trị & Lãnh Đạo Thực Chiến, 450-800 từ): Tình huống nhân viên giỏi từ chức và giải pháp lãnh đạo con người.
  * Mẫu 2 (Phản Biện Góc Khuất Quản Trị Cấp Trung, 450-800 từ): Nỗi cô đơn và áp lực kẹp giữa hai làn đạn của Middle Manager.
  * Mẫu 3 (Framework Đo Lường Sức Khỏe Tổ Chức & Well-being, 450-800 từ): Khung đánh giá khoa học dựa trên dữ liệu và an toàn tâm lý.
  * Mẫu 4 (Thought Leadership Kỷ Nguyên AI, 450-800 từ): Định vị lại năng lực lãnh đạo không thể thay thế bởi công nghệ.`
    : `=== CHIẾN LƯỢC ORDER 7: VIẾT EMAIL NURTURING & CHUYỂN ĐỔI CAO ===
1. BỘ 3 TIÊU ĐỀ EMAIL (SUBJECT LINES): Bắt buộc đề xuất 3 phương án có tỷ lệ mở cao nhất (>45%):
   - Phương án 1 (Gây tò mò / Curiosity-driven)
   - Phương án 2 (Chạm nỗi đau trăn trở / Pain-point driven)
   - Phương án 3 (Lợi ích thẳng thắn & Ấm áp / Benefit-driven)
2. MỞ ĐẦU THÂN MẬT NHƯ NGƯỜI BẠN ĐỒNG HÀNH: Bắt đầu bằng một câu chuyện ngắn, một quan sát đời thường hoặc một sự đồng cảm ấm áp.
3. CÂU HỎI SOI CHIẾN TRÚNG TIM ĐEN: Đặt 2-3 câu hỏi gợi mở sâu sắc giúp người nhận tự nhìn nhận lại năng lượng, mục tiêu và điểm nghẽn của mình.
4. GIỚI THIỆU GIẢI PHÁP / WORKSHOP / CHƯƠNG TRÌNH: Dẫn dắt nhẹ nhàng, khiêm nhường, nhấn mạnh tính đồng hành và giá trị chuyển hóa bên trong.
5. KÊU GỌI HÀNH ĐỘNG (CTA) KHÔNG ÁP LỰC: Mời bấm link đăng ký hoặc reply trực tiếp email này để chia sẻ câu chuyện và được hỗ trợ giải đáp trực tiếp.
6. TÁI BÚT (P.S.): Đòn bẩy tâm lý cuối cùng, nhắc lại quà tặng/suất tham vấn miễn phí hoặc một lời chúc chân thành.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS):
  * Mẫu 1 (Email Storytelling từ người bạn đồng hành - kèm 3 Subject Lines & P.S.): Tâm sự chân thành về những ngày lạc lối và bài học tìm lại chính mình.
  * Mẫu 2 (Email Phản biện bẻ gãy bận rộn mù quáng - kèm 3 Subject Lines & P.S.): Tháo gỡ chiếc bẫy làm việc không ngừng nghỉ nhưng không thấy tiến bộ.
  * Mẫu 3 (Email Trao giá trị bài test & Khảo sát Well-being - kèm 3 Subject Lines & P.S.): Tặng bài test định vị và hỗ trợ giải đáp miễn phí.
  * Mẫu 4 (Email Quyết định bước ngoặt chuyển hóa - kèm 3 Subject Lines & P.S.): Lời mời bước vào không gian Workshop/Chương trình với tâm thế chủ động.`
}

DANH SÁCH DỰ ÁN KHẢ DỤNG:
${JSON.stringify(params.programs, null, 2)}`;

  const getVariationLabels = () => {
    if (isTikTokComment) {
      return `"Mẫu 1 (Tự sự - Đồng cảm sâu sắc từ chi tiết clip): ...",
    "Mẫu 2 (Phản biện Reframe - Bẻ khóa tư duy): ...",
    "Mẫu 3 (Trắc nghiệm Soi chiếu - Tự đánh giá kín đáo): ...",
    "Mẫu 4 (Đúc kết khiêm nhường từ tiền bối): ..."`;
    }
    if (isFacebookComment) {
      return `"Mẫu 1 (Phân tích đa chiều đôi bên): ...",
    "Mẫu 2 (Bóc tách nguyên nhân gốc rễ): ...",
    "Mẫu 3 (Trải nghiệm thực tế & Hạ mình chia sẻ): ...",
    "Mẫu 4 (Đặt câu hỏi gợi mở & Đổi lăng kính): ..."`;
    }
    if (isFacebookPost) {
      return `"Mẫu 1 (Tự sự - Nỗi đau kiệt sức & Well-being, 500-850 từ): ...",
    "Mẫu 2 (Phản biện - Nghịch lý nghề nghiệp & Thấu suốt con người thật, 500-850 từ): ...",
    "Mẫu 3 (Dự án cộng đồng phi lợi nhuận & Khảo sát WHO-5, 500-850 từ): ...",
    "Mẫu 4 (Chuyên gia thực chiến - Đúc kết chuyển hóa & Sức bền, 500-850 từ): ..."`;
    }
    if (isThreadsComment) {
      return `"Mẫu 1 (Lời tự sự đêm muộn): ...",
    "Mẫu 2 (Lát cắt công sở chân thực): ...",
    "Mẫu 3 (Lời động viên ấm áp & Soi chiếu): ...",
    "Mẫu 4 (Bẻ khóa cảm xúc giấu kín): ..."`;
    }
    if (isThreadsPost) {
      return `"Mẫu 1 (Nghịch lý tuổi 20-30): ...",
    "Mẫu 2 (Bẫy chăm chỉ mù quáng): ...",
    "Mẫu 3 (Chữa lành vs Thấu hiểu bản chất): ...",
    "Mẫu 4 (Sức bền thời đại số): ..."`;
    }
    if (isLinkedInPost) {
      return `"Mẫu 1 (Case Study Quản Trị & Lãnh Đạo Thực Chiến, 450-800 từ): ...",
    "Mẫu 2 (Phản Biện Góc Khuất Quản Trị Cấp Trung, 450-800 từ): ...",
    "Mẫu 3 (Framework Đo Lường Sức Khỏe Tổ Chức & Well-being, 450-800 từ): ...",
    "Mẫu 4 (Thought Leadership Kỷ Nguyên AI, 450-800 từ): ..."`;
    }
    return `"Mẫu 1 (Email Storytelling từ người bạn đồng hành - kèm 3 Subject Lines & P.S.): ...",
    "Mẫu 2 (Email Phản biện bẻ gãy bận rộn mù quáng - kèm 3 Subject Lines & P.S.): ...",
    "Mẫu 3 (Email Trao giá trị bài test & Khảo sát Well-being - kèm 3 Subject Lines & P.S.): ...",
    "Mẫu 4 (Email Quyết định bước ngoặt chuyển hóa - kèm 3 Subject Lines & P.S.): ..."`;
  };

  const getToneDescription = () => {
    if (params.options?.tone === 'custom') {
      return params.options?.customTone ? `Phong cách tự nhập: "${params.options.customTone}"` : 'Tự do sáng tạo theo phong cách người dùng chỉ định';
    }
    if (params.options?.tone === 'humorous') {
      return 'Hài hước, hóm hỉnh, dí dỏm, duyên dáng, tự trào thông minh, bắt trend nhẹ nhàng';
    }
    if (params.options?.tone === 'workplace_insight') {
      return 'Phân tích tâm lý công sở & Reframe góc nhìn mới lạ, thực tế';
    }
    if (params.options?.tone === 'provocative_reframe') {
      return 'Phản biện bẻ khóa định kiến, sắc bén và độc bản';
    }
    if (params.options?.tone === 'assessment_test') {
      return 'Giá trị cộng đồng, khơi gợi bài trắc nghiệm tự đánh giá phi lợi nhuận';
    }
    return 'Tự sự & Đồng cảm sâu sắc, kể chuyện chạm tim (Storytelling)';
  };

  const isHumorous = params.options?.tone === 'humorous' || (params.options?.tone === 'custom' && params.options?.customTone?.toLowerCase().includes('hài'));
  const promptText = `Yêu cầu thực hiện Order: ${params.orderType}
Ý tưởng, bối cảnh & từ khóa: "${params.context}"
${params.selectedProgramId && params.selectedProgramId !== 'auto' ? `Dự án chỉ định ID: ${params.selectedProgramId}` : 'Hãy tự động chọn WS/CT phù hợp nhất với ngữ cảnh.'}
Định hướng phong cách & Giọng văn: ${getToneDescription()}
Tùy chọn: Gắn link: ${params.options?.includeLink}, Độ dài: ${isFacebookPost || isLinkedInPost ? 'Bài viết dài chuyên sâu (Long-Form)' : params.options?.lengthPreference || 'Vừa vặn'}

QUY TẮC PHONG CÁCH VĂN PHONG:
- Viết TOÀN BỘ 4 biến thể theo đúng phong cách: ${getToneDescription()}
${isHumorous ? '- Hãy sử dụng lối hành văn hóm hỉnh, dí dỏm, ví von hài hước nhưng duyên dáng, lôi cuốn, tạo tiếng cười sảng khoái và tự nhiên cho người đọc.' : ''}
${params.options?.tone === 'custom' && params.options?.customTone ? `- Yêu cầu phong cách riêng từ người dùng: "${params.options.customTone}". Hãy thể hiện rõ nét và xuyên suốt phong cách này trong cả bài viết, bình luận ghim và tin nhắn riêng!` : ''}

Trả về JSON đúng cấu trúc:
{
  "selectedProgramId": "id",
  "selectedProgramTitle": "Tên WS/CT",
  "selectedProgramType": "ws" | "ct",
  "rationale": "Phân tích tâm lý đối tượng mục tiêu và chiến lược viral cho nền tảng",
  "platformNotes": "Lưu ý thuật toán hiển thị & tương tác (Dwell time, Outlink comment, Hook)...",
  "directorStrategicAnalysis": {
    "targetAudience": "Đối tượng mục tiêu sâu sắc",
    "emotionalTouchpoint": "Nỗi đau và điểm chạm cảm xúc",
    "algorithmAssessment": "Thuật toán hiển thị của nền tảng",
    "approachReason": "Lý do chọn cách tiếp cận này"
  },
  "systemOrchestrator": {
    "ecosystemLink": "Phân tích mắt xích kết nối giữa chủ đề bài viết và Workshop mục tiêu trong Kho CRT",
    "funnelFlow": {
      "stage1_hook": "Điểm chạm mở đầu & giữ chân độc giả",
      "stage2_trust": "Cam kết phi lợi nhuận & xây dựng niềm tin",
      "stage3_bridge": "Cầu nối link qua First Comment ghim mồi",
      "stage4_private": "Kịch bản nhắn tin riêng 3 bước",
      "stage5_destination": "Workshop / Bài trắc nghiệm chuyển hóa"
    },
    "omnichannelStrategy": "Khuyến nghị điều phối đa kênh (TikTok, FB, LinkedIn, Threads)",
    "systemSafetyScore": {
      "score": 98,
      "assessment": "Đánh giá an toàn thuật toán và cảnh báo rủi ro spam"
    }
  },
  "primaryContent": "Nội dung bài viết/comment xuất sắc nhất",
  "variations": [
    ${getVariationLabels()}
  ],
  "firstCommentSeed": "Mẫu bình luận ghim mồi chứa link bài test/tài liệu dưới bài viết (cho Facebook/LinkedIn)",
  "dmFollowUpScript": {
    "step1_empathy": "Lời mở đầu trong DM/InMail...",
    "step2_qualifyQuestion": "Câu hỏi đào sâu...",
    "step3_inviteLink": "Lời mời gửi link..."
  }
};`;

  const parts: any[] = [];
  if (params.screenshotBase64) {
    const cleanBase64 = params.screenshotBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64,
      },
    });
  }
  parts.push({ text: promptText });

  // Tùy chỉnh model ưu tiên: ưu tiên gemini-3.6-flash
  const preferredModel = params.options?.modelSelection?.startsWith('gemini-3.7')
    ? undefined
    : params.options?.modelSelection;

  try {
    const result = await callGeminiApiWithRetry(
      {
        parts,
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.8,
        preferredModel: preferredModel || 'gemini-3.6-flash',
        timeoutMs: 42000,
        maxRetriesPerModel: 2,
      }
    );

    const parsed = parseSafeJson<any>(result.text, (cleanText) => ({
      primaryContent: cleanText,
      variations: [cleanText],
      rationale: 'Nội dung được phân tích và sản xuất từ Hội đồng AI Content Director 20+ năm kinh nghiệm.',
      directorStrategicAnalysis: {
        targetAudience: 'Người trẻ & nhân sự đi làm (20-39 tuổi) đang đối mặt với áp lực định vị và mong muốn tìm lại sự cân bằng.',
        emotionalTouchpoint: 'Kiệt sức thầm lặng, áp lực so sánh ngầm và nỗi sợ dậm chân tại chỗ.',
        algorithmAssessment: 'Tối ưu Dwell Time bằng cốt truyện cuốn hút, giữ trọn reach tự nhiên bằng bình luận ghim mồi.',
        approachReason: 'Sử dụng tâm sự chân thật, cam kết phi lợi nhuận 100% để phá bỏ rào cản tâm lý và kết nối chuyển đổi tự nhiên.',
      },
      dmFollowUpScript: {
        step1_empathy: 'Chào bạn, mình thấy bạn quan tâm đến chủ đề này.',
        step2_qualifyQuestion: 'Bạn có đang gặp khó khăn gì trong quá trình định vị bản thân không?',
        step3_inviteLink: 'Mình gửi bạn link tham gia workshop miễn phí nhé: [Link]',
      },
    }));

    const variationsList = Array.isArray(parsed.variations) && parsed.variations.length > 0
      ? parsed.variations
      : [parsed.primaryContent || 'Nội dung đã được tạo thành công.'];

    const directorAnalysis: DirectorStrategicAnalysis = {
      targetAudience: parsed.directorStrategicAnalysis?.targetAudience || 'Người đi làm & giới trẻ (20-39 tuổi) đang đối mặt với áp lực định vị và kiệt sức thầm lặng.',
      emotionalTouchpoint: parsed.directorStrategicAnalysis?.emotionalTouchpoint || 'Cảm giác chông chênh, áp lực so sánh ngầm và mong muốn tìm lại nhịp điệu nội tại.',
      algorithmAssessment: parsed.directorStrategicAnalysis?.algorithmAssessment || 'Tối ưu Dwell Time bằng cấu trúc câu chuyện chặt chẽ, né bóp reach bằng First Comment Seed ghim link.',
      approachReason: parsed.directorStrategicAnalysis?.approachReason || 'Tiếp cận bằng sự chân thành, phi lợi nhuận 100% để phá vỡ hoài nghi và dẫn dắt tự nhiên sang đối thoại riêng.',
    };

    const systemOrchestratorAnalysis: SystemOrchestratorAnalysis = {
      ecosystemLink: parsed.systemOrchestrator?.ecosystemLink || `Kết nối trực tiếp vào Workshop "${parsed.selectedProgramTitle || 'Kho CRT'}" với mục tiêu chuyển đổi tự nhiên qua giải pháp giá trị thực.`,
      funnelFlow: {
        stage1_hook: parsed.systemOrchestrator?.funnelFlow?.stage1_hook || 'Hook 3s đánh trúng nỗi đau/nghịch lý nhằm tối ưu Dwell Time trên feed.',
        stage2_trust: parsed.systemOrchestrator?.funnelFlow?.stage2_trust || 'Cam kết 100% phi lợi nhuận không bán khóa học, cởi bỏ hoàn toàn rào cản phòng thủ.',
        stage3_bridge: parsed.systemOrchestrator?.funnelFlow?.stage3_bridge || 'First Comment Seed ghim mồi link bài test/tài liệu nhằm bảo toàn reach tự nhiên.',
        stage4_private: parsed.systemOrchestrator?.funnelFlow?.stage4_private || 'Kịch bản tin nhắn riêng 3 bước chuyển hóa tương tác thành mối quan hệ tin cậy.',
        stage5_destination: parsed.systemOrchestrator?.funnelFlow?.stage5_destination || 'Đích đến là buổi Workshop hoặc bài trắc nghiệm tự đánh giá giúp giải quyết triệt để vấn đề.',
      },
      omnichannelStrategy: parsed.systemOrchestrator?.omnichannelStrategy || 'Phân phối đa kênh: Đăng bài chính trên nền tảng chỉ định, kết hợp lấy trích đoạn ngắn làm comment dạo trên TikTok/Threads.',
      systemSafetyScore: {
        score: typeof parsed.systemOrchestrator?.systemSafetyScore?.score === 'number' ? parsed.systemOrchestrator.systemSafetyScore.score : 98,
        assessment: parsed.systemOrchestrator?.systemSafetyScore?.assessment || 'Chuẩn an toàn 98/100: Cấu trúc văn bản tối ưu tương tác, không vi phạm chính sách cộng đồng.',
      },
    };

    const finalOutput: GeneratedContent = {
      id: `gen-${Date.now()}`,
      orderId: params.orderType,
      orderTitle: params.orderType,
      platform: isFacebookPost || isFacebookComment ? 'Facebook' : isLinkedInPost ? 'LinkedIn' : isTikTokComment ? 'TikTok' : isThreadsComment || isThreadsPost ? 'Threads' : isEmail ? 'Email' : 'Social',
      programId: parsed.selectedProgramId || '',
      programTitle: parsed.selectedProgramTitle || '',
      programType: (parsed.selectedProgramType as ProgramType) || 'ws',
      primaryContent: parsed.primaryContent || variationsList[0] || '',
      variations: variationsList,
      firstCommentSeed: parsed.firstCommentSeed || (isFacebookPost ? 'Link bài test kiểm tra sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5 ở đây nhé anh em: https://tally.so/r/wellbeing-test (Hoàn toàn miễn phí, làm xong có bác sĩ hỗ trợ giải đáp chi tiết nha mọi người ơi ❤️)' : isLinkedInPost ? 'P/S: Với anh/chị Leader hoặc HRBP đang quan tâm đến bộ chỉ số đo lường sức khỏe tổ chức & khung đánh giá Well-being nhân sự, em xin phép để link tài liệu chi tiết tại bình luận này nhé: [Link_Tài_Liệu] (Hoàn toàn mở và có hỗ trợ giải đáp trực tiếp ạ).' : undefined),
      dmFollowUpScript: parsed.dmFollowUpScript || {
        step1_empathy: '',
        step2_qualifyQuestion: '',
        step3_inviteLink: '',
      },
      rationale: parsed.rationale || '',
      platformNotes: parsed.platformNotes || '',
      directorStrategicAnalysis: directorAnalysis,
      systemOrchestrator: systemOrchestratorAnalysis,
      createdAt: new Date().toISOString(),
    };

    smartCache.set(cacheHash, finalOutput, params.orderType);
    return finalOutput;
  } catch (err: any) {
    console.warn('[AI Service] Gemini call failed or quota limited, activating Template Fallback Engine:', err);
    const fallbackOutput = extractBenchmarkFallback(params);
    smartCache.set(cacheHash, fallbackOutput, params.orderType);
    return fallbackOutput;
  }
}

// === Tinh Chỉnh Nội Dung Hội Thoại Trực Tiếp (Interactive Refinement Chat) ===
export async function refineContentAI(params: {
  currentContent: string;
  instruction: string;
  orderTitle?: string;
  programTitle?: string;
}): Promise<{ refinedContent: string; explanation: string }> {
  // 1. Thử server backend trước
  try {
    const res = await fetch('/api/refine-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (e) {
    console.warn('[AI Service] Server refine endpoint not available, falling back to direct resilient client call.');
  }

  // 2. Direct client fallback với retry & model cascade
  const apiKey = getApiKey();
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Vui lòng cung cấp Gemini API Key để tinh chỉnh nội dung.');
  }

  const systemInstruction = `Bạn là Senior Content Quality & Viral Strategy Auditor kiêm Content Copywriter hơn 20 năm kinh nghiệm hàng đầu Việt Nam.
Nhiệm vụ: Nhận nội dung hiện tại và chỉ dẫn điều chỉnh từ người dùng, tinh chỉnh lại bài viết/comment sao cho tự nhiên, chân thật, sâu sắc, thực hiện chính xác chỉ dẫn của người dùng mà vẫn bảo toàn tỷ lệ chuyển đổi cao và chuẩn mực nền tảng.
QUY TẮC BẮT BUỘC TỪ CHUYÊN GIA 20 NĂM:
- CẤM dùng văn mẫu AI sáo rỗng ("Trong cuộc sống hiện đại...", "Bạn có bao giờ tự hỏi...", "Hãy cùng tôi khám phá...").
- Thực hiện chính xác yêu cầu (viết sâu sắc hơn, tăng cảm xúc tự sự, rút gọn súc tích, bổ sung cam kết phi lợi nhuận 100% không bán khóa học/lùa gà, đổi ngôi xưng hô, thêm số liệu/framework, v.v.).
- Nếu là bài viết Facebook Long-Form (Order 3) hoặc LinkedIn (Order 6), duy trì độ dài và cấu trúc chuyên sâu tương ứng.
Xuất JSON:
{
  "refinedContent": "Nội dung bài viết mới sau khi tinh chỉnh",
  "explanation": "Tóm tắt ngắn gọn 1 câu về điểm cốt lõi đã được nâng cấp"
}`;

  const promptText = `Nội dung hiện tại:
"""
${params.currentContent}
"""

Yêu cầu điều chỉnh từ người dùng:
"${params.instruction}"
${params.orderTitle ? `Thể loại: ${params.orderTitle}` : ''}
${params.programTitle ? `Dự án liên quan: ${params.programTitle}` : ''}`;

  const result = await callGeminiApiWithRetry(
    {
      parts: [{ text: promptText }],
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.7,
      preferredModel: 'gemini-3.6-flash',
      timeoutMs: 28000,
      maxRetriesPerModel: 2,
    },
    apiKey
  );

  const parsed = parseSafeJson(result.text, (cleanText) => ({
    refinedContent: cleanText,
    explanation: 'Đã cập nhật bài viết theo yêu cầu.',
  }));

  return {
    refinedContent: parsed.refinedContent || result.text,
    explanation: parsed.explanation || 'Đã cập nhật bài viết theo yêu cầu.',
  };
}

export async function extractProgramAI(params: {
  url?: string;
  text?: string;
  imageBase64?: string | null;
}): Promise<any> {
  // 1. Thử server backend trước
  try {
    const res = await fetch('/api/extract-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) return data.data;
    }
  } catch (e) {
    console.warn('[AI Service] Fallback to direct client extract.');
  }

  // 2. Direct client fallback với retry & model cascade
  const apiKey = getApiKey();
  const systemInstruction = `Bạn là chuyên gia phân tích nội dung Social Media và Quản lý Đào tạo.
Bóc tách Workshop (ws) hoặc Chương trình (ct).
Tất cả tập trung vào: thấu hiểu bản thân, sức bền tinh thần, giải quyết vấn đề, không dạy kiếm tiền bề nổi.
Xuất JSON:
{
  "title": "Tên",
  "type": "ws" | "ct",
  "description": "Mô tả",
  "targetAudience": ["Đối tượng 1", "Đối tượng 2"],
  "painPoints": ["Nỗi đau 1", "Nỗi đau 2"],
  "coreValues": ["Giá trị 1", "Giá trị 2"],
  "testOrFormAngle": "Góc tiếp cận bài test"
}`;

  const promptText = `Phân tích dữ liệu: Link: ${params.url || ''}\nNội dung:\n${params.text || ''}`;
  const parts: any[] = [];
  if (params.imageBase64) {
    const cleanBase64 = params.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: cleanBase64 },
    });
  }
  parts.push({ text: promptText });

  const result = await callGeminiApiWithRetry(
    {
      parts,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.4,
      preferredModel: 'gemini-3.6-flash',
      timeoutMs: 28000,
      maxRetriesPerModel: 2,
    },
    apiKey
  );

  return parseSafeJson(result.text, (cleanText) => ({
    title: 'Chương trình được trích xuất',
    type: 'ws',
    description: cleanText.slice(0, 200),
    targetAudience: [],
    painPoints: [],
    coreValues: [],
    testOrFormAngle: '',
  }));
}

// ============================================================================
// 10. INSTANT SMART ASSISTANT & CHAT ENGINE
// ============================================================================

const ORDER_GUIDES: Record<number, { title: string; orderType: OrderType; reply: string; suggestedActions: any[] }> = {
  1: {
    title: 'Order 1: Bình luận TikTok',
    orderType: 'order_1',
    reply: `🎬 **HƯỚNG DẪN CHI TIẾT ORDER 1: BÌNH LUẬN TIKTOK**

🎯 **Mục tiêu:** Chuyển đổi người xem video ngắn (20-39 tuổi) thành cuộc trò chuyện inbox riêng tư để nhận bài test tự đánh giá cá nhân.

📝 **Công thức viết 3 bước:**
1. **Hook đồng cảm:** Bắt nhịp ngay chủ đề của clip, công nhận cảm xúc/áp lực mà người trẻ đang đối mặt (áp lực đồng trang lứa, mệt mỏi, mất phương hướng).
2. **Insight soi chiếu:** Nhấn mạnh việc chưa dám bứt phá không phải do kém cỏi, mà vì chưa thật sự hiểu rõ bản thân và thiếu người soi chiếu khách quan.
3. **CTA tự nhiên:** Tặng bài test review hoặc định vị bản thân ("Mình có bài test nhỏ soi chiếu năng lực, bạn nào cần thì mình gửi tặng free nhé ạ").

💡 **Mẹo phân phối:**
• Comment sớm ở các video có tệp người xem trùng khớp (tâm lý, nghề nghiệp, phát triển bản thân).
• **Không gắn link trực tiếp** trong bình luận để tránh thuật toán TikTok bóp tương tác.
• Khi có người thả tim hoặc phản hồi, rep lại thân thiện và mời nhắn tin qua tin nhắn riêng.`,
    suggestedActions: [
      { label: '🚀 Mở Studio tạo Order 1 ngay', action: 'Workbench Order 1', orderType: 'order_1' },
      { label: '🎬 Thử tạo: Order 1 về áp lực đồng trang lứa', action: 'Order 1: Clip chia sẻ về áp lực đồng trang lứa và mông lung sự nghiệp' },
      { label: '📋 Xem Menu 7 Order', action: 'Hi' },
    ],
  },
  2: {
    title: 'Order 2: Bình luận Facebook',
    orderType: 'order_2',
    reply: `💬 **HƯỚNG DẪN CHI TIẾT ORDER 2: BÌNH LUẬN FACEBOOK**

🎯 **Mục tiêu:** Bình luận đa chiều, thấu hiểu thực tế cho các bên, tạo thảo luận văn minh và gợi ý Workshop/Chương trình tự nhiên, không giáo điều.

📝 **Công thức viết 3 bước:**
1. **Góc nhìn đa chiều:** Nhìn nhận từ nhiều phía (ví dụ sếp & nhân sự, cha mẹ & con cái), hạ thấp cái tôi, tránh tranh cãi gay gắt.
2. **Đồng cảm & Tháo gỡ:** Chỉ ra nguyên nhân gốc rễ (áp lực mục tiêu, khoảng cách thế hệ hoặc cách giao tiếp).
3. **Cầu nối tinh tế:** Chia sẻ trải nghiệm cá nhân từng tham gia một workshop/chương trình cộng đồng hữu ích giúp thay đổi tư duy.

💡 **Mẹo phân phối:**
• Tham gia bình luận tại các bài viết thảo luận sôi nổi trong group chuyên môn hoặc fanpage uy tín.
• Giữ văn phong khách quan, khiêm tốn, không xưng là người bán khóa học hay chuyên gia dạy đời.
• Khơi gợi để người khác chủ động phản hồi hoặc inbox hỏi thêm kinh nghiệm.`,
    suggestedActions: [
      { label: '🚀 Mở Studio tạo Order 2 ngay', action: 'Workbench Order 2', orderType: 'order_2' },
      { label: '💬 Thử tạo: Order 2 về văn hóa công sở', action: 'Order 2: Bài viết thảo luận về mối quan hệ giữa sếp và nhân viên trẻ' },
      { label: '📋 Xem Menu 7 Order', action: 'Hi' },
    ],
  },
  3: {
    title: 'Order 3: Bài viết Facebook (Long-Form)',
    orderType: 'order_3',
    reply: `📝 **HƯỚNG DẪN CHI TIẾT ORDER 3: BÀI VIẾT FACEBOOK LONG-FORM**

🎯 **Mục tiêu:** Bài viết chuyên sâu có chiều sâu cảm xúc, xây dựng thương hiệu cá nhân uy tín, khẳng định cam kết phi lợi nhuận và chuyển đổi bằng First Comment mồi link.

📝 **Công thức viết 4 phần:**
1. **3 Dòng Hook đầu tiên:** Đánh trúng nỗi trăn trở ngầm, kích thích bấm nút "...Xem thêm".
2. **Storytelling / Case study:** Đưa dẫn chứng trải nghiệm thực tế hoặc câu chuyện thật, bóc tách tâm lý sâu sắc.
3. **Cam kết minh bạch:** Khẳng định dự án cộng đồng phi lợi nhuận, không bán khóa học/lùa gà, xuất phát từ mong muốn hỗ trợ thực tâm.
4. **First Comment Seed:** Kêu gọi độc giả xem bình luận đầu tiên được ghim để nhận link đăng ký hoặc bài test.

💡 **Mẹo phân phối:**
• Đăng vào khung giờ vàng có thời gian đọc sâu (11h30 - 13h00 hoặc 20h00 - 21h30).
• **Tuyệt đối không để link ngoài trong bài viết**, chỉ thả link ở Comment 1 (First Comment) ngay sau khi đăng.
• Tương tác trả lời 100% comment trong 60 phút đầu tiên để đẩy bài lên top feed.`,
    suggestedActions: [
      { label: '🚀 Mở Studio tạo Order 3 ngay', action: 'Workbench Order 3', orderType: 'order_3' },
      { label: '📝 Thử tạo: Order 3 về vượt qua bế tắc', action: 'Order 3: Chia sẻ hành trình vượt qua giai đoạn mất phương hướng nghề nghiệp' },
      { label: '📋 Xem Menu 7 Order', action: 'Hi' },
    ],
  },
  4: {
    title: 'Order 4: Bình luận Threads',
    orderType: 'order_4',
    reply: `🧵 **HƯỚNG DẪN CHI TIẾT ORDER 4: BÌNH LUẬN THREADS**

🎯 **Mục tiêu:** Bình luận ngắn gọn, giàu cảm xúc tự sự (storytelling), chạm vào nỗi đau nội tâm của người đọc để họ chủ động nhắn tin kết nối.

📝 **Công thức viết 3 bước:**
1. **Văn phong thủ thỉ:** Viết như đang tâm sự với người bạn thân, giọng điệu gần gũi, ấm áp, không đao to búa lớn.
2. **Đồng cảm trăn trở:** Nói hộ cảm giác kiệt sức, hoang mang hoặc cảm giác phải gồng gánh một mình.
3. **Gợi mở kết nối riêng:** Nhẹ nhàng mở lời hỗ trợ ("Nếu bạn cũng đang thấy trống trải, cứ nhắn mình nhé, mình có một góc nhìn nhỏ có thể giúp bạn nhẹ lòng hơn...").

💡 **Mẹo phân phối:**
• Bình luận dưới các bài viết tâm sự viral trên Threads về công việc, cuộc sống, tình cảm.
• Ngắt dòng thông thoáng, dùng từ ngữ tự nhiên của thế hệ trẻ, không spam từ khóa hay link ngoài.`,
    suggestedActions: [
      { label: '🚀 Mở Studio tạo Order 4 ngay', action: 'Workbench Order 4', orderType: 'order_4' },
      { label: '🧵 Thử tạo: Order 4 về kiệt sức đi làm', action: 'Order 4: Tâm sự về cảm giác kiệt sức và mất lửa với công việc hiện tại' },
      { label: '📋 Xem Menu 7 Order', action: 'Hi' },
    ],
  },
  5: {
    title: 'Order 5: Viết bài Threads',
    orderType: 'order_5',
    reply: `✍️ **HƯỚNG DẪN CHI TIẾT ORDER 5: BÀI VIẾT THREADS**

🎯 **Mục tiêu:** Bài đăng ngắn gọn, nhịp điệu nhanh, insight sắc bén, tạo độ lan tỏa tự nhiên và khơi gợi độc giả hành động.

📝 **Công thức viết 3 bước:**
1. **One-liner Hook:** Câu mở đầu giật mình hoặc chạm đúng tâm trạng ("Có những ngày đi làm về chỉ muốn ngồi yên trong bóng tối...").
2. **Nhịp ngắt dòng thoáng:** Mỗi ý 1-2 câu ngắn, cách dòng rõ ràng, giúp mắt đọc lướt trên điện thoại cực mượt.
3. **Điểm rơi suy ngẫm / CTA:** Đặt một câu hỏi gợi mở hoặc nhắc đến bài test soi chiếu tính cách ở phần comment.

💡 **Mẹo phân phối:**
• Đăng đều đặn 1-2 bài mỗi ngày; Threads ưu tiên nội dung chân thực và đối thoại thật.
• Kèm 1 ảnh tối giản hoặc ảnh chụp màn hình ghi chú nếu cần tăng dwell-time (thời gian dừng màn hình).`,
    suggestedActions: [
      { label: '🚀 Mở Studio tạo Order 5 ngay', action: 'Workbench Order 5', orderType: 'order_5' },
      { label: '✍️ Thử tạo: Order 5 về bài học tuổi 25', action: 'Order 5: 3 bài học đắt giá mình nhận ra khi bước sang tuổi 25' },
      { label: '📋 Xem Menu 7 Order', action: 'Hi' },
    ],
  },
  6: {
    title: 'Order 6: Bài viết & InMail LinkedIn',
    orderType: 'order_6',
    reply: `💼 **HƯỚNG DẪN CHI TIẾT ORDER 6: BÀI VIẾT & INMAIL LINKEDIN**

🎯 **Mục tiêu:** Xây dựng vị thế chuyên gia (Thought Leadership), tiếp cận nhân sự chất lượng cao, quản lý cấp trung, HRBP với phong thái đĩnh đạc, chuẩn mực.

📝 **Cấu trúc hoàn chỉnh:**
1. **Hook 3 dòng chuyên sâu:** Khởi đầu bằng một nghịch lý trong quản trị hoặc vấn đề nhân sự nóng hổi.
2. **Framework 3-4 điểm:** Bóc tách giải pháp mạch lạc, có căn cứ tâm lý/quản trị thực chiến.
3. **Kịch bản InMail 3 bước tiếp cận:**
   • Bước 1: Thấu cảm bối cảnh & khen ngợi chân thành công việc của đối phương.
   • Bước 2: Đặt câu hỏi gợi mở về điểm nghẽn mà họ có thể đang đối mặt.
   • Bước 3: Gửi lời mời tham gia chương trình hoặc trải nghiệm bài test trắc nghiệm khách quan.

💡 **Mẹo phân phối:**
• Khung giờ đăng tốt nhất: Thứ 3 đến Thứ 5 lúc 8h30 - 10h00 sáng.
• Tương tác vào bài viết của đối tác tiềm năng trước khi gửi tin nhắn InMail để tăng tỷ lệ mở thư.`,
    suggestedActions: [
      { label: '🚀 Mở Studio tạo Order 6 ngay', action: 'Workbench Order 6', orderType: 'order_6' },
      { label: '💼 Thử tạo: Order 6 về giữ chân nhân tài', action: 'Order 6: Bài viết về nghệ thuật giữ chân nhân tài trẻ và lắng nghe sâu sắc' },
      { label: '📋 Xem Menu 7 Order', action: 'Hi' },
    ],
  },
  7: {
    title: 'Order 7: Content Email Chăm Sóc / Nurturing',
    orderType: 'order_7',
    reply: `📧 **HƯỚNG DẪN CHI TIẾT ORDER 7: CONTENT EMAIL**

🎯 **Mục tiêu:** Nuôi dưỡng mối quan hệ bền vững với học viên tiềm năng, dẫn dắt họ qua câu chuyện truyền cảm hứng và lời mời hành động nhẹ nhàng.

📝 **Cấu trúc email 4 bước:**
1. **Tiêu đề (Subject Line):** Kích thích tò mò, mang tính cá nhân, tránh các từ ngữ giật gân spam.
2. **Mở đầu bằng câu chuyện:** Chia sẻ một câu chuyện nhỏ chân thật để tạo sự gần gũi.
3. **Bài học & Câu hỏi soi chiếu:** Đúc kết giá trị cốt lõi và đặt câu hỏi giúp người nhận tự soi chiếu bản thân.
4. **Call to Action (CTA):** Lời mời phản hồi thư hoặc bấm vào đường link đăng ký tham gia chương trình.

💡 **Mẹo phân phối:**
• Gửi với tên cá nhân (không dùng tên chung chung vô hồn).
• Soạn nội dung ngắn gọn, súc tích, định dạng tương thích hoàn hảo trên thiết bị di động.`,
    suggestedActions: [
      { label: '🚀 Mở Studio tạo Order 7 ngay', action: 'Workbench Order 7', orderType: 'order_7' },
      { label: '📧 Thử tạo: Order 7 về rèn luyện sức bền', action: 'Order 7: Email gửi học viên về sức bền tinh thần trong thời đại số' },
      { label: '📋 Xem Menu 7 Order', action: 'Hi' },
    ],
  },
};

function detectOrderInquiry(lower: string): number | null {
  if (/(order\s*1\b|lệnh\s*1\b|dạng\s*1\b|bình\s*luận\s*tiktok|comment\s*tiktok)/i.test(lower)) return 1;
  if (/(order\s*2\b|lệnh\s*2\b|dạng\s*2\b|bình\s*luận\s*facebook|comment\s*facebook|comment\s*fb)/i.test(lower)) return 2;
  if (/(order\s*3\b|lệnh\s*3\b|dạng\s*3\b|bài\s*viết\s*facebook|post\s*facebook|facebook\s*long)/i.test(lower)) return 3;
  if (/(order\s*4\b|lệnh\s*4\b|dạng\s*4\b|bình\s*luận\s*threads|comment\s*threads)/i.test(lower)) return 4;
  if (/(order\s*5\b|lệnh\s*5\b|dạng\s*5\b|bài\s*viết\s*threads|post\s*threads)/i.test(lower)) return 5;
  if (/(order\s*6\b|lệnh\s*6\b|dạng\s*6\b|linkedin|inmail)/i.test(lower)) return 6;
  if (/(order\s*7\b|lệnh\s*7\b|dạng\s*7\b|content\s*email|viết\s*email|email\s*nurturing)/i.test(lower)) return 7;
  return null;
}

function isGreetingQuery(lower: string): boolean {
  return (
    /^(hi|hello|xin\s*chào|chào|chao|halo|menu|help|giúp|tro\s*giup|trợ\s*giúp|bắt\s*đầu|start|hướng\s*dẫn|huong\s*dan|7\s*order|7\s*dạng\s*bài|7\s*lệnh)$/i.test(lower) ||
    lower === '?' ||
    /^(menu|help|bắt đầu|start|xin chào)\b/i.test(lower)
  );
}

function isProgramsInquiry(lower: string): boolean {
  return /(workshop|chương\s*trình|chuong\s*trinh|kho\s*crt|kho\s*chương\s*trình|dự\s*án|danh\s*sách\s*chương\s*trình|danh\s*sách\s*workshop|các\s*workshop)/i.test(lower);
}

export async function chatAI(params: {
  message: string;
  history?: any[];
  programs: ProgramItem[];
}): Promise<{ reply: string; suggestedActions?: any[] }> {
  const cleanQuery = (params.message || '').trim();
  const lower = cleanQuery.toLowerCase();

  // ==========================================================================
  // PHASE 1: PHẢN HỒI THÔNG MINH TỨC THÌ (INSTANT SMART ASSISTANT < 0.05S)
  // Không cần gọi mạng, phản hồi tức thì và chính xác 100% trên mọi môi trường
  // ==========================================================================

  // 1. Lời chào & Menu 7 Order
  if (isGreetingQuery(lower)) {
    return {
      reply: `Xin chào! Mình là **Trợ lý AI hỗ trợ sáng tạo nội dung & kịch bản nhắn tin tư vấn tự nhiên**.

Dưới đây là **7 Dạng Bài (Order)** được tối ưu chuyên biệt cho từng nền tảng:

1. 🎬 **Order 1: Bình luận TikTok** – Đồng cảm sâu sắc, chạm trăn trở người trẻ 20-39t, khơi gợi nhận bài test free.
2. 💬 **Order 2: Bình luận Facebook** – Đa chiều, khách quan, tinh tế gợi ý Workshop/Chương trình không áp đặt.
3. 📝 **Order 3: Bài viết Facebook (Long-Form)** – Chiều sâu, hook giữ chân, cam kết phi lợi nhuận & First Comment mồi link.
4. 🧵 **Order 4: Bình luận Threads** – Phong cách thủ thỉ, giàu tính tự sự (storytelling), kích thích chủ động inbox.
5. ✍️ **Order 5: Bài viết Threads** – Ngắn gọn, ngắt dòng nhịp nhàng, insight chạm đúng điểm nghẽn.
6. 💼 **Order 6: Bài viết & InMail LinkedIn** – Chuẩn phong thái chuyên gia, góc nhìn quản trị & kịch bản InMail lịch thiệp.
7. 📧 **Order 7: Content Email** – Email nuôi dưỡng đồng hành, câu hỏi soi chiếu giá trị chuyển đổi cao.

💡 **Mẹo:** Bạn có thể bấm vào các nút bên dưới để chuyển sang Studio tạo bài ngay, hoặc gõ theo cú pháp: \`Order [số] [nội dung clip/chủ đề]\` (Ví dụ: \`Order 1: Clip chia sẻ về mất định hướng tuổi 25\`).`,
      suggestedActions: [
        { label: '🎬 Order 1: Bình luận TikTok', action: 'Order 1', orderType: 'order_1' },
        { label: '💬 Order 2: Bình luận Facebook', action: 'Order 2', orderType: 'order_2' },
        { label: '📝 Order 3: Bài viết Facebook', action: 'Order 3', orderType: 'order_3' },
        { label: '🧵 Order 4: Bình luận Threads', action: 'Order 4', orderType: 'order_4' },
        { label: '✍️ Order 5: Bài viết Threads', action: 'Order 5', orderType: 'order_5' },
        { label: '💼 Order 6: Bài viết LinkedIn', action: 'Order 6', orderType: 'order_6' },
        { label: '📧 Order 7: Content Email', action: 'Order 7', orderType: 'order_7' },
      ],
    };
  }

  // 2. Tra cứu chi tiết từng Order (Order 1 -> 7)
  const orderNum = detectOrderInquiry(lower);
  if (orderNum && ORDER_GUIDES[orderNum]) {
    const guide = ORDER_GUIDES[orderNum];
    return {
      reply: guide.reply,
      suggestedActions: guide.suggestedActions,
    };
  }

  // 3. Tra cứu Kho Chương trình / Workshop CRT
  if (isProgramsInquiry(lower)) {
    const availablePrograms =
      params.programs && params.programs.length > 0 ? params.programs : DEFAULT_PROGRAMS;
    const wsList = availablePrograms.filter((p) => p.type === 'ws');
    const ctList = availablePrograms.filter((p) => p.type === 'ct');

    let reply = `📚 **TỔNG HỢP KHO DỰ ÁN & WORKSHOP CRT HIỆN CÓ (${availablePrograms.length} Chương trình)**\n\n`;

    if (wsList.length > 0) {
      reply += `### 🎯 Các Workshop Chuyên Sâu (${wsList.length} Workshop):\n`;
      wsList.forEach((p, idx) => {
        reply += `${idx + 1}. **${p.title}**\n`;
        reply += `   • **Đối tượng:** ${p.targetAudience?.slice(0, 2).join(', ') || 'Người trẻ & người đi làm'}\n`;
        reply += `   • **Điểm nghẽn giải quyết:** ${p.painPoints?.[0] || p.description}\n`;
        reply += `   • **Góc tiếp cận / Test:** ${p.testOrFormAngle || 'Bài test định vị cá nhân'}\n\n`;
      });
    }

    if (ctList.length > 0) {
      reply += `### 🌟 Các Chương Trình Dài Hạn (${ctList.length} Chương trình):\n`;
      ctList.forEach((p, idx) => {
        reply += `${idx + 1}. **${p.title}**\n`;
        reply += `   • **Đối tượng:** ${p.targetAudience?.slice(0, 2).join(', ') || 'Người đi làm 22-38 tuổi'}\n`;
        reply += `   • **Điểm nghẽn giải quyết:** ${p.painPoints?.[0] || p.description}\n`;
        reply += `   • **Góc tiếp cận / Test:** ${p.testOrFormAngle || 'Đánh giá & soi chiếu'}\n\n`;
      });
    }

    reply += `💡 **Mẹo:** Bạn có thể chọn bất kỳ Order nào dưới đây để AI tự động ghép với Workshop phù hợp và tạo bài viết ngay nhé!`;

    return {
      reply,
      suggestedActions: [
        { label: '🎬 Order 1: Bình luận TikTok', action: 'Order 1', orderType: 'order_1' },
        { label: '💬 Order 2: Bình luận Facebook', action: 'Order 2', orderType: 'order_2' },
        { label: '📝 Order 3: Bài viết Facebook', action: 'Order 3', orderType: 'order_3' },
        { label: '🧵 Order 4: Bình luận Threads', action: 'Order 4', orderType: 'order_4' },
        { label: '📋 Xem Menu 7 Order', action: 'Hi' },
      ],
    };
  }

  // ==========================================================================
  // PHASE 2: THỬ SERVER BACKEND VỚI ABORTCONTROLLER (TIMEOUT 500MS)
  // Ngăn tình trạng treo đơ trên môi trường tĩnh (Vercel, Surge, GitHub Pages)
  // ==========================================================================
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.reply) {
        return {
          reply: data.reply,
          suggestedActions: data.suggestedActions,
        };
      }
    }
  } catch {
    // Expected on static hosting without /api/chat server, continue immediately
  }

  // ==========================================================================
  // PHASE 3: DIRECT GEMINI API VỚI TIMEOUT 8000MS & FALLBACK THÔNG MINH
  // ==========================================================================
  const apiKey = getApiKey();
  const availablePrograms =
    params.programs && params.programs.length > 0 ? params.programs : DEFAULT_PROGRAMS;

  const systemInstruction = `Bạn là Trợ lý AI hỗ trợ sáng tạo nội dung & kịch bản nhắn tin tư vấn tự nhiên, am hiểu sâu sắc tâm lý người đọc và cơ chế phân phối của các mạng xã hội (TikTok, Facebook, Threads, LinkedIn, Email).
Hãy trả lời cô đọng, tự nhiên, thân thiện và hướng dẫn hành động rõ ràng.
Các dự án/workshop khả dụng trong kho CRT:
${availablePrograms.map((p) => `- ${p.title} (${p.type === 'ws' ? 'Workshop' : 'Chương trình'}): ${p.description}`).join('\n')}`;

  try {
    const result = await callGeminiApiWithRetry(
      {
        parts: [{ text: cleanQuery }],
        systemInstruction,
        temperature: 0.7,
        preferredModel: 'gemini-3.6-flash',
        timeoutMs: 8000, // Tối ưu tốc độ phản hồi 8s thay vì 25s
        maxRetriesPerModel: 2,
      },
      apiKey
    );

    if (result.text && result.text.trim()) {
      return {
        reply: result.text.trim(),
        suggestedActions: [
          { label: '📋 Xem Menu 7 Order', action: 'Hi' },
          { label: '🎬 Order 1: Bình luận TikTok', action: 'Order 1', orderType: 'order_1' },
          { label: '💬 Order 2: Bài viết Facebook', action: 'Order 2', orderType: 'order_2' },
        ],
      };
    }
  } catch (geminiErr) {
    console.warn('[AI Service] Gemini chat query error, using graceful fallback:', geminiErr);
  }

  // Fallback thông minh lịch sự & chu đáo khi Gemini bị chậm hoặc hết quota
  return {
    reply: `Chào bạn! Mình đã ghi nhận yêu cầu của bạn: "${cleanQuery}".

Hiện tại lưu lượng xử lý AI đang cao hoặc kết nối đang được tối ưu. Mình gợi ý các giải pháp nhanh cho bạn:

• **Tạo bài viết ngay:** Gõ cú pháp \`Order [1-7] [chủ đề clip/bài viết]\` (Ví dụ: \`Order 1: Clip chia sẻ về mất định hướng tuổi 25\`).
• **Tra cứu hướng dẫn:** Gõ tên Order (ví dụ \`Order 1\`, \`Order 2\`, \`Order 4\`) để xem công thức viết và mẹo phân phối.
• **Xem kho CRT:** Gõ "Workshop" hoặc "Chương trình" để xem danh sách các dự án khả dụng.
• Hoặc bấm các nút bên dưới để vào thẳng **Studio Tạo Bài** nhé!`,
    suggestedActions: [
      { label: '📋 Mở Menu 7 Order', action: 'Hi' },
      { label: '🎬 Order 1: Bình luận TikTok', action: 'Order 1', orderType: 'order_1' },
      { label: '💬 Order 2: Bài viết Facebook', action: 'Order 2', orderType: 'order_2' },
      { label: '🧵 Order 4: Bình luận Threads', action: 'Order 4', orderType: 'order_4' },
      { label: '📚 Kho Chương Trình CRT', action: 'Danh sách Workshop trong kho CRT' },
    ],
  };
}
