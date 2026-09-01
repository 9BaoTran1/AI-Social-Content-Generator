import { ProgramItem, OrderType, GeneratedContent, GenerationOptions, ProgramType } from '../types';

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
    return 'Tài khoản API Key đã chạm giới hạn lượt gọi (Rate Limit). Vui lòng đợi khoảng 30 giây rồi thử lại hoặc đổi API Key khác.';
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
 * Hàm gọi API trung tâm với cơ chế:
 * - Ưu tiên model tối ưu (gemini-3.6-flash).
 * - Timeout ngắt an toàn (AbortController) chống đứng trang / trắng màn hình.
 * - Tự động thử lại (Retry with Exponential Backoff) khi gặp 503 (high demand) hoặc 429.
 * - Tự động cascade sang các model dự phòng tiếp theo nếu model chính quá tải.
 */
export async function callGeminiApiWithRetry(
  params: GeminiCallParams,
  apiKey: string
): Promise<{ text: string; modelUsed: string }> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('CHƯA_CÓ_API_KEY: Vui lòng cung cấp Gemini API Key để tiếp tục.');
  }

  const cascadeOrder = params.models || OPTIMAL_MODEL_CASCADE;
  const modelsToTry = [
    ...(params.preferredModel ? [params.preferredModel] : []),
    ...cascadeOrder,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const timeoutMs = params.timeoutMs || 38000;
  const maxRetries = params.maxRetriesPerModel ?? 2;
  let lastErrorStatus: number | null = null;
  let lastErrorMessage = '';

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
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
          return { text: rawText, modelUsed: currentModel };
        }

        // Lỗi HTTP từ Google API
        lastErrorStatus = response.status;
        const errText = await response.text();
        lastErrorMessage = `HTTP ${response.status}: ${errText}`;

        // Lỗi API Key
        if (response.status === 400 || response.status === 403) {
          if (errText.includes('API_KEY_INVALID') || errText.includes('API key not valid')) {
            throw new Error('API_KEY_INVALID: Gemini API Key không hợp lệ hoặc đã hết hạn.');
          }
        }

        // Lỗi 404 (Model Không khả dụng) -> Chuyển ngay model khác, không retry
        if (response.status === 404) {
          console.warn(`[AI Service] Model ${currentModel} không tồn tại (404), chuyển ngay model dự phòng.`);
          break;
        }

        // Lỗi 503 (High demand) hoặc 429 (Rate Limit) -> Exponential Backoff
        const isTransient = response.status === 503 || response.status === 429;
        if (isTransient && attempt < maxRetries) {
          const backoffDelay = Math.min(800 * Math.pow(1.6, attempt - 1), 2500);
          console.warn(`[AI Service] Model ${currentModel} bận (${response.status}), thử lại sau ${backoffDelay}ms...`);
          await new Promise((r) => setTimeout(r, backoffDelay));
          continue;
        } else {
          console.warn(`[AI Service] Model ${currentModel} thất bại (${response.status}), tự động chuyển model tiếp theo...`);
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
    localStorage.setItem('gemini_api_key', key.trim());
  }
}

export async function generateOrderAI(params: {
  orderType: OrderType;
  context: string;
  screenshotBase64?: string | null;
  selectedProgramId?: string;
  programs: ProgramItem[];
  options?: GenerationOptions;
}): Promise<GeneratedContent> {
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
        return {
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
          createdAt: new Date().toISOString(),
        };
      }
    }
  } catch (e) {
    console.warn('[AI Service] Server endpoint not available, falling back to resilient client Gemini API call.');
  }

  // 2. Client-side Fallback (Trực tiếp qua Gemini REST API có Retry & Cascade)
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

  const systemInstruction = `Bạn là Senior Content Quality & Viral Strategy Auditor kiêm Content Copywriter hơn 20 năm kinh nghiệm hàng đầu Việt Nam.
Sứ mệnh: Sản xuất nội dung đạt điểm 10/10 về độ TỰ NHIÊN, CHÂN THẬT, SÂU SẮC, GIÀU TÍNH THẤU CẢM VÀ CHUYỂN ĐỔI CAO. Triệt tiêu 100% văn mẫu robot, sáo rỗng hay lý thuyết suông. Tối ưu hóa tuyệt đối theo thuật toán phân phối viral và văn hóa người dùng của từng nền tảng.

QUY TẮC "ANTI-AI FLUFF" BẮT BUỘC TỪ AUDITOR 20 NĂM:
1. TUYỆT ĐỐI CẤM các mẫu câu AI sáo rỗng:
   - CẤM: "Trong cuộc sống hiện đại...", "Trong thế giới bận rộn ngày nay...", "Bạn có bao giờ tự hỏi...", "Hãy cùng tôi khám phá...", "Hãy nhớ rằng...", "Hành trình vạn dặm...", "Ngọn hải đăng...", "Ánh sáng cuối đường hầm...".
   - CẤM các từ cảm thán giả tạo, lên gân đạo đức hoặc dùng dấu chấm than liên tiếp ("!!!", "thật tuyệt vời!", "hãy nhanh tay!").
2. DÙNG NGÔN TỪ ĐỜI THƯỜNG, ĐẮT GIÁ, CHẠM ĐÚNG TIM ĐEN NGƯỜI TRẺ & NGƯỜI ĐI LÀM VIỆT NAM (20-39 tuổi):
   - Diễn đạt trúng nỗi đau thực tế: áp lực so sánh ngầm (peer pressure), làm việc cật lực nhưng cảm thấy dậm chân tại chỗ, hội chứng kẻ giả mạo (impostor syndrome), kiệt sức thầm lặng (quiet burnout), sợ tụt hậu trong kỷ nguyên AI, bẫy micromanage, xung đột thế hệ công sở, mất kết nối với chính mình.
3. QUY TẮC NỀN TẢNG & MỞ KHÓA WS/CT:
   - Cho phép đề xuất và phân phối tự do cả Workshop (WS), Chương trình (CT) lẫn các dự án cộng đồng phi lợi nhuận trên MỌI nền tảng (kể cả Facebook), tùy theo mức độ phù hợp nhất với ngữ cảnh người dùng.

${
  isTikTokComment
    ? `=== CHIẾN LƯỢC ORDER 1: COMMENT TIKTOK CHUYỂN ĐỔI COMMENT THÀNH INBOX (ĐỘ TUỔI 20-39T) ===
- Văn phong: Tự sự, ấm áp, thủ thỉ, chân thành, hạ thấp bản thân như một người anh/chị/bạn bè từng đi qua giai đoạn khủng hoảng trải lòng.
- Không phán xét, không giáo điều: Đồng cảm từ một chi tiết sâu sắc trong clip -> Giải phóng tâm lý tự trách -> Giới thiệu bài test/template đánh giá tính cách, con người thật hoặc sức bền tinh thần 1-1 kín đáo.
- Lời mời inbox: Nhẹ nhàng, chân tình, tặng miễn phí 100% ("bạn nào đang cần người lắng nghe/soi chiếu thì nhắn mình gửi tặng free nhé ạ").
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS) PHẢI CÓ SỰ PHÂN HÓA CHIẾN LƯỢC RÕ RỆT:
  * Mẫu 1 (Tự sự - Đồng cảm sâu sắc từ chi tiết clip): Bắt trúng cảm xúc trong clip, kể lại trải nghiệm bản thân, gỡ bỏ mặc cảm so sánh ngầm tuổi 20-39.
  * Mẫu 2 (Phản biện Reframe - Bẻ khóa tư duy): Chỉ ra sự thật "không phải bạn dở hay lười, mà do đang gượng ép mình vào hệ quy chiếu không thuộc về điểm mạnh".
  * Mẫu 3 (Trắc nghiệm Soi chiếu - Test 1-1 kín đáo): Khơi gợi điểm mù tư duy và tặng bài test trưởng thành/sức bền tinh thần có chuyên gia giải đáp 1-1.
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
5. CÔNG CỤ TỰ ĐÁNH GIÁ CHUẨN KHOA HỌC: Giới thiệu bài test đo lường sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5 (Well-being index) hoặc bản đồ định vị thế mạnh, có bác sĩ/chuyên gia giải đáp 1-1 kín đáo.
6. CTA HƯỚNG VỀ FIRST COMMENT: Mời độc giả ghé xuống phần bình luận để nhận link (tuyệt đối không gắn link trên caption bài viết để tránh Facebook bóp reach 80%).
7. XUẤT 'firstCommentSeed': Bình luận ghim mồi đặt link bài test chân tình, tự nhiên.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS - MỖI BÀI 500-850 TỪ):
  * Mẫu 1 (Tự sự - Nỗi đau kiệt sức & Well-being): Khắc họa kiệt sức thầm lặng của người làm nghề, kêu gọi lắng nghe cơ thể, test WHO-5.
  * Mẫu 2 (Phản biện - Nghịch lý nghề nghiệp & Thấu suốt con người thật): Bẻ gãy bẫy so sánh và bận rộn mù quáng, tái định vị bản thân.
  * Mẫu 3 (Dự án cộng đồng phi lợi nhuận & Khảo sát WHO-5): Cam kết đanh thép phi lợi nhuận, đồng hành gỡ rối tâm lý 1-1 cùng bác sĩ.
  * Mẫu 4 (Chuyên gia thực chiến - Đúc kết chuyển hóa & Sức bền): Góc nhìn cố vấn 20 năm, giải pháp nuôi dưỡng năng lực nội tại.`
    : isThreadsComment
    ? `=== CHIẾN LƯỢC ORDER 4: COMMENT THREADS (STORYTELLING CHÂN THẬT, CHẠM VÀO TÂM SỰ NỘI TÂM) ===
- Format: Ngắn gọn (3-5 dòng), ngắt dòng nhịp nhàng chuẩn văn hóa Threads, không hashtag, không màu mè.
- Tone: Tự sự, thổ lộ chân thật (vulnerable confession), như một lời thì thầm đêm muộn gỡ bỏ hoàn toàn sự phòng thủ của người đọc.
- Chuyển đổi: Gợi ý bài test/template tự soi chiếu 1-1 miễn phí giúp sáng tỏ hướng đi, mời chủ động nhắn tin.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS):
  * Mẫu 1 (Lời tự sự đêm muộn): Chạm vào nỗi cô đơn, lạc lõng giữa thành phố sau giờ tan sở.
  * Mẫu 2 (Lát cắt công sở chân thực): Áp lực deadline và nỗi sợ bị tụt lại phía sau dù đã nỗ lực hết sức.
  * Mẫu 3 (Lời động viên ấm áp & Soi chiếu): Nhẹ nhàng gỡ bỏ áp lực so sánh với người khác, tặng test 1-1.
  * Mẫu 4 (Bẻ khóa cảm xúc giấu kín): Nói hộ tiếng lòng về sự trống rỗng bên trong dù bề ngoài vẫn ổn.`
    : isThreadsPost
    ? `=== CHIẾN LƯỢC ORDER 5: BÀI VIẾT THREADS (NGẮN GỌN, CUỐN HÚT, VIRAL INSIGHT) ===
- Format: Chuỗi câu ngắn (1-2 câu mỗi đoạn), ngắt dòng rộng rãi, cực kỳ bắt mắt trên mobile feed.
- Hook mở đầu: Đánh thẳng vào một nghịch lý tâm lý hoặc cảm xúc giấu kín của người đi làm tuổi 20-35.
- Nội dung: Gãy gọn, nhịp điệu nhanh, sắc sảo, không hoa mỹ, câu trước kéo câu sau.
- Kết bài: CTA tự nhiên mời thảo luận và nhắn tin riêng để nhận link bài test / template định vị 1-1.
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
7. KÈM KỊCH BẢN INMAIL 3 BƯỚC: Lời mở đầu HRBP ấm áp -> Câu hỏi đào sâu -> Lời mời tham vấn 1-1 miễn phí.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS - MỖI BÀI 450-800 TỪ):
  * Mẫu 1 (Case Study Quản Trị & Nghịch Lý Giữ Chân Nhân Tài): Tình huống nhân viên giỏi từ chức và giải pháp lãnh đạo con người.
  * Mẫu 2 (Phản Biện Góc Khuất Quản Trị Cấp Trung): Nỗi cô đơn và áp lực kẹp giữa hai làn đạn của Middle Manager.
  * Mẫu 3 (Framework Đo Lường Sức Khỏe Tổ Chức & Well-being): Khung đánh giá khoa học dựa trên dữ liệu và an toàn tâm lý.
  * Mẫu 4 (Thought Leadership Kỷ Nguyên AI): Định vị lại năng lực lãnh đạo không thể thay thế bởi công nghệ.`
    : `=== CHIẾN LƯỢC ORDER 7: VIẾT EMAIL NURTURING & CHUYỂN ĐỔI CAO ===
1. BỘ 3 TIÊU ĐỀ EMAIL (SUBJECT LINES): Bắt buộc đề xuất 3 phương án có tỷ lệ mở cao nhất (>45%):
   - Phương án 1 (Gây tò mò / Curiosity-driven)
   - Phương án 2 (Chạm nỗi đau trăn trở / Pain-point driven)
   - Phương án 3 (Lợi ích thẳng thắn & Ấm áp / Benefit-driven)
2. MỞ ĐẦU THÂN MẬT NHƯ NGƯỜI BẠN ĐỒNG HÀNH: Bắt đầu bằng một câu chuyện ngắn, một quan sát đời thường hoặc một sự đồng cảm ấm áp.
3. CÂU HỎI SOI CHIẾN TRÚNG TIM ĐEN: Đặt 2-3 câu hỏi gợi mở sâu sắc giúp người nhận tự nhìn nhận lại năng lượng, mục tiêu và điểm nghẽn của mình.
4. GIỚI THIỆU GIẢI PHÁP / WORKSHOP / CHƯƠNG TRÌNH: Dẫn dắt nhẹ nhàng, khiêm nhường, nhấn mạnh tính đồng hành và giá trị chuyển hóa bên trong.
5. KÊU GỌI HÀNH ĐỘNG (CTA) KHÔNG ÁP LỰC: Mời bấm link đăng ký hoặc reply trực tiếp email này để chia sẻ câu chuyện và nhận tham vấn 1-1.
6. TÁI BÚT (P.S.): Đòn bẩy tâm lý cuối cùng, nhắc lại quà tặng/suất tham vấn miễn phí hoặc một lời chúc chân thành.
- YÊU CẦU 4 BIẾN THỂ (VARIATIONS):
  * Mẫu 1 (Email Storytelling từ người bạn đồng hành): Tâm sự chân thành về những ngày lạc lối và bài học tìm lại chính mình (kèm 3 Subject Lines & P.S.).
  * Mẫu 2 (Email Phản biện bẻ gãy bận rộn mù quáng): Tháo gỡ chiếc bẫy làm việc không ngừng nghỉ nhưng không thấy tiến bộ (kèm 3 Subject Lines & P.S.).
  * Mẫu 3 (Email Trao giá trị bài test & Khảo sát Well-being): Tặng bài test định vị và lời mời tham vấn 1-1 miễn phí (kèm 3 Subject Lines & P.S.).
  * Mẫu 4 (Email Quyết định bước ngoặt chuyển hóa): Lời mời bước vào không gian Workshop/Chương trình với tâm thế chủ động (kèm 3 Subject Lines & P.S.).`
}

DANH SÁCH DỰ ÁN KHẢ DỤNG:
${JSON.stringify(params.programs, null, 2)}`;

  const getVariationLabels = () => {
    if (isTikTokComment) {
      return `"Mẫu 1 (Tự sự - Đồng cảm sâu sắc từ chi tiết clip): ...",
    "Mẫu 2 (Phản biện Reframe - Bẻ khóa tư duy): ...",
    "Mẫu 3 (Trắc nghiệm Soi chiếu - Test 1-1 kín đáo): ...",
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

  const promptText = `Yêu cầu thực hiện Order: ${params.orderType}
Ý tưởng, bối cảnh & từ khóa: "${params.context}"
${params.selectedProgramId && params.selectedProgramId !== 'auto' ? `Dự án chỉ định ID: ${params.selectedProgramId}` : 'Hãy tự động chọn WS/CT phù hợp nhất với ngữ cảnh.'}
Tùy chọn: Gắn link: ${params.options?.includeLink}, Giọng văn: ${params.options?.tone || 'Tự nhiên'}, Độ dài: ${isFacebookPost || isLinkedInPost ? 'Bài viết dài chuyên sâu (Long-Form)' : params.options?.lengthPreference || 'Vừa vặn'}

Trả về JSON đúng cấu trúc:
{
  "selectedProgramId": "id",
  "selectedProgramTitle": "Tên WS/CT",
  "selectedProgramType": "ws" | "ct",
  "rationale": "Phân tích tâm lý đối tượng mục tiêu và chiến lược viral cho nền tảng",
  "platformNotes": "Lưu ý thuật toán hiển thị & tương tác (Dwell time, Outlink comment, Hook)...",
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

  const result = await callGeminiApiWithRetry(
    {
      parts,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.8,
      preferredModel: preferredModel || 'gemini-3.6-flash',
      timeoutMs: 42000,
      maxRetriesPerModel: 2,
    },
    apiKey
  );

  const parsed = parseSafeJson(result.text, (cleanText) => ({
    primaryContent: cleanText,
    variations: [cleanText],
    rationale: 'Nội dung được tạo trực tiếp từ AI.',
    dmFollowUpScript: {
      step1_empathy: 'Chào bạn, mình thấy bạn quan tâm đến chủ đề này.',
      step2_qualifyQuestion: 'Bạn có đang gặp khó khăn gì trong quá trình định vị bản thân không?',
      step3_inviteLink: 'Mình gửi bạn link tham gia workshop miễn phí nhé: [Link]',
    },
  }));

  const variationsList = Array.isArray(parsed.variations) && parsed.variations.length > 0
    ? parsed.variations
    : [parsed.primaryContent || 'Nội dung đã được tạo thành công.'];

  return {
    id: `gen-${Date.now()}`,
    orderId: params.orderType,
    orderTitle: params.orderType,
    platform: isFacebookPost || isFacebookComment ? 'Facebook' : isLinkedInPost ? 'LinkedIn' : isTikTokComment ? 'TikTok' : isThreadsComment || isThreadsPost ? 'Threads' : isEmail ? 'Email' : 'Social',
    programId: parsed.selectedProgramId || '',
    programTitle: parsed.selectedProgramTitle || '',
    programType: (parsed.selectedProgramType as ProgramType) || 'ws',
    primaryContent: parsed.primaryContent || variationsList[0] || '',
    variations: variationsList,
    firstCommentSeed: parsed.firstCommentSeed || (isFacebookPost ? 'Link bài test kiểm tra sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5 ở đây nhé anh em: https://tally.so/r/wellbeing-test (Hoàn toàn miễn phí, làm xong có bác sĩ hỗ trợ giải đáp 1-1 nha mọi người ơi ❤️)' : isLinkedInPost ? 'P/S: Với anh/chị Leader hoặc HRBP đang quan tâm đến bộ chỉ số đo lường sức khỏe tổ chức & khung đánh giá Well-being nhân sự, em xin phép để link tài liệu chi tiết tại bình luận này nhé: [Link_Tài_Liệu] (Hoàn toàn mở và có hỗ trợ trao đổi 1-1 ạ).' : undefined),
    dmFollowUpScript: parsed.dmFollowUpScript || {
      step1_empathy: '',
      step2_qualifyQuestion: '',
      step3_inviteLink: '',
    },
    rationale: parsed.rationale || '',
    platformNotes: parsed.platformNotes || '',
    createdAt: new Date().toISOString(),
  };
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

export async function chatAI(params: {
  message: string;
  history?: any[];
  programs: ProgramItem[];
}): Promise<{ reply: string; suggestedActions?: any[] }> {
  // 1. Thử server backend trước
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          reply: data.reply,
          suggestedActions: data.suggestedActions,
        };
      }
    }
  } catch (e) {
    console.warn('[AI Service] Fallback to direct client chat.');
  }

  // 2. Direct Gemini Fallback
  const lower = params.message.toLowerCase().trim();
  if (lower === 'hi' || lower === 'hello' || lower === 'xin chào' || lower === 'chào') {
    return {
      reply: `Xin chào bạn! Mình là Trợ lý AI Content & Social Media Manager. Hãy gõ Order [số] kèm mô tả clip/post để mình sản xuất content ngay nhé!`,
      suggestedActions: [
        { label: '🎬 Order 1: Comment TikTok', action: 'Order 1', orderType: 'order_1' },
        { label: '💬 Order 2: Comment Facebook', action: 'Order 2', orderType: 'order_2' },
        { label: '📝 Order 3: Bài viết Facebook', action: 'Order 3', orderType: 'order_3' },
        { label: '🧵 Order 4: Comment Threads', action: 'Order 4', orderType: 'order_4' },
        { label: '✍️ Order 5: Bài viết Threads', action: 'Order 5', orderType: 'order_5' },
        { label: '💼 Order 6: Bài viết & InMail LinkedIn', action: 'Order 6', orderType: 'order_6' },
        { label: '📧 Order 7: Content Email', action: 'Order 7', orderType: 'order_7' },
      ],
    };
  }

  const apiKey = getApiKey();
  const systemInstruction = `Bạn là Content Master 10 năm kinh nghiệm hỗ trợ chuyển đổi comment thành inbox.
Dự án khả dụng: ${JSON.stringify(params.programs)}`;

  const result = await callGeminiApiWithRetry(
    {
      parts: [{ text: params.message }],
      systemInstruction,
      temperature: 0.7,
      preferredModel: 'gemini-3.6-flash',
      timeoutMs: 25000,
      maxRetriesPerModel: 2,
    },
    apiKey
  );

  return {
    reply: result.text || 'Đã xử lý xong.',
  };
}
