import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Lazy initialize GoogleGenAI with telemetry header
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Using fallback mode.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient API Caller with Exponential Backoff Retry, Fallback & Thinking Support
async function generateContentWithRetry(
  params: {
    contents: any;
    config?: any;
  },
  primaryModel: string = 'gemini-3.6-flash',
  maxRetriesPerModel: number = 2,
  enableThinking: boolean = false
) {
  const ai = getAi();
  
  // Model priority cascade
  const modelsToTry = [
    primaryModel,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.7-flash',
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`[Gemini API] Requesting model: ${modelName} (Thinking: ${enableThinking}, Attempt ${attempt}/${maxRetriesPerModel})...`);
        
        const mergedConfig = { ...params.config };
        
        // Configure thinking if supported & requested
        if (enableThinking && modelName.includes('3.7')) {
          mergedConfig.thinkingConfig = { thinkingBudget: 2048 };
        } else if (modelName.includes('3.7') && !enableThinking) {
          mergedConfig.thinkingConfig = { thinkingBudget: 0 };
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: mergedConfig,
        });
        
        console.log(`[Gemini API] Success with model: ${modelName}`);
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isUnavailableOrRateLimited =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('overloaded');

        console.warn(`[Gemini API] Model '${modelName}' attempt ${attempt} warning: ${errMsg}`);

        if (isUnavailableOrRateLimited) {
          if (attempt < maxRetriesPerModel) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        } else {
          // If argument/schema issue, break to next model
          break;
        }
      }
    }
  }

  // Handle human-friendly message if all attempts failed
  const errMsg = lastError?.message || String(lastError);
  if (
    errMsg.includes('503') ||
    errMsg.includes('high demand') ||
    errMsg.includes('UNAVAILABLE') ||
    errMsg.includes('overloaded')
  ) {
    throw new Error(
      'Mô hình AI đang có lượng người dùng truy cập cao đột biến (503 High Demand). Vui lòng bấm nút "Thử lại ngay" để nhận kết quả.'
    );
  }
  if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error(
      'Hạn ngạch xử lý AI tạm thời bận (429 Rate Limit). Vui lòng bấm "Thử lại ngay".'
    );
  }
  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Extract Program/Workshop from Link, Raw Text, or Image
app.post('/api/extract-program', async (req: Request, res: Response) => {
  try {
    const { url, text, imageBase64 } = req.body;

    if (!url && !text && !imageBase64) {
      return res.status(400).json({ error: 'Vui lòng cung cấp link Tally/Google Forms, nội dung văn bản hoặc hình ảnh.' });
    }

    const systemPrompt = `Bạn là một chuyên gia phân tích nội dung Social Media và Quản lý Đào tạo (10 năm kinh nghiệm).
Nhiệm vụ của bạn là bóc tách và phân tích thông tin của Workshop (WS) hoặc Chương trình (CT) từ link Tally, Google Forms, text mô tả hoặc hình ảnh được cung cấp.

QUY TẮC PHÂN LOẠI & ĐẶC ĐIỂM CỐT LÕI:
- Phân loại rõ: 'ws' (Workshop / Talkshow / Buổi chia sẻ ngắn hạn) hoặc 'ct' (Chương trình / Khóa học / Hành trình nhiều bước / Bài test định vị).
- TẤT CẢ các chương trình/workshop đều KHÔNG nhằm mục đích hướng nghiệp kỹ năng cứng hay kiếm tiền, mà tập trung vào: thấu hiểu bản thân, nhận diện thế mạnh, sức bền tinh thần, giải quyết vấn đề, cân bằng năng lượng, tư duy giao tiếp và định vị bản sắc cá nhân.
- Không gán ép template cho riêng ngành nào (IT, Tech, Y tế...).
- Người tham dự là người muốn hiểu mình và làm bản thân tốt hơn, không phải đến để làm diễn giả hay dạy người khác.

Hãy trích xuất và trả về định dạng JSON chính xác:
{
  "title": "Tên WS hoặc Chương trình",
  "type": "ws" | "ct",
  "description": "Mô tả súc tích về giá trị và mục tiêu (2-3 câu)",
  "targetAudience": ["Đối tượng 1 (kèm độ tuổi nếu có)", "Đối tượng 2", "Đối tượng 3"],
  "painPoints": ["Nỗi đau 1", "Nỗi đau 2", "Nỗi đau 3"],
  "coreValues": ["Giá trị mang lại 1", "Giá trị mang lại 2", "Giá trị mang lại 3"],
  "testOrFormAngle": "Mô tả góc tiếp cận form/bài test (ví dụ: Template đánh giá tính cách & tham vấn 1-1, Test định vị bản thân)",
  "imageUrl": "Link ảnh nếu tìm thấy trong text/link (hoặc để trống)",
  "tallyUrl": "Link Tally hoặc Form nếu có",
  "notes": "Ghi chú thêm về tone & mood hoặc lưu ý đặc thù"
}`;

    const promptText = `Hãy phân tích và trích xuất thông tin Workshop / Chương trình từ dữ liệu sau:
${url ? `Link Form / Tally: ${url}\n` : ''}
${text ? `Nội dung mô tả / Text:\n${text}\n` : ''}`;

    const contents: any[] = [];
    if (imageBase64) {
      const mimeType = imageBase64.startsWith('data:image/png')
        ? 'image/png'
        : imageBase64.startsWith('data:image/webp')
        ? 'image/webp'
        : 'image/jpeg';
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }
    contents.push({ text: promptText });

    const response = await generateContentWithRetry({
      contents: { parts: contents },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['ws', 'ct'] },
            description: { type: Type.STRING },
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            coreValues: { type: Type.ARRAY, items: { type: Type.STRING } },
            testOrFormAngle: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
            tallyUrl: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ['title', 'type', 'description', 'targetAudience', 'painPoints', 'coreValues', 'testOrFormAngle'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (url && !parsed.tallyUrl) {
      parsed.tallyUrl = url;
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error extracting program:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi trích xuất thông tin chương trình.' });
  }
});

// 2. Generate Content for Orders 1-7 (Peak Conversion & Authentic Nuance)
app.post('/api/generate-order', async (req: Request, res: Response) => {
  try {
    const {
      orderType,
      context,
      screenshotBase64,
      selectedProgramId,
      programs,
      options = {},
    } = req.body;

    const chosenModelOption = options.modelSelection || 'gemini-3.6-flash';
    const isThinkingRequested = chosenModelOption === 'gemini-3.7-flash-thinking';
    const targetModel = chosenModelOption.includes('3.6')
      ? 'gemini-3.6-flash'
      : chosenModelOption.includes('3.5')
      ? 'gemini-3.5-flash'
      : chosenModelOption.includes('3.1')
      ? 'gemini-3.1-flash-lite'
      : chosenModelOption.includes('2.5')
      ? 'gemini-2.5-flash'
      : chosenModelOption.includes('3.7')
      ? 'gemini-3.7-flash'
      : 'gemini-3.6-flash';

    // Map order definitions and strict rules
    const orderRules: Record<string, { platform: string; allowedTypes: string[]; rules: string }> = {
      order_1: {
        platform: 'TikTok',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 1: COMMENT QUA CLIP TIKTOK (THU HÚT INBOX TỰ NHIÊN, 20-39T)
- Văn phong: Tự sự, ấm áp, thủ thỉ, chân thành, hạ thấp bản thân như người anh/chị/bạn bè từng đi qua giai đoạn khủng hoảng trải lòng.
- Không phán xét, không giáo điều: Đồng cảm từ một chi tiết sâu sắc trong clip -> Giải phóng tâm lý tự trách -> Giới thiệu bài test/template đánh giá tính cách, con người thật hoặc sức bền tinh thần 1-1 kín đáo.
- Lời mời inbox: Nhẹ nhàng, chân tình, tặng miễn phí 100% ("bạn nào đang cần người lắng nghe/soi chiếu thì nhắn mình gửi tặng free nhé ạ").
- Tiêu chuẩn 4 biến thể (Variations):
  * Mẫu 1 (Tự sự - Đồng cảm sâu sắc từ chi tiết clip): Bắt trúng cảm xúc trong clip, kể lại trải nghiệm bản thân, gỡ bỏ mặc cảm so sánh ngầm tuổi 20-39.
  * Mẫu 2 (Phản biện Reframe - Bẻ khóa tư duy): Chỉ ra sự thật "không phải bạn dở hay lười, mà do đang gượng ép mình vào hệ quy chiếu không thuộc về điểm mạnh".
  * Mẫu 3 (Trắc nghiệm Soi chiếu - Test 1-1 kín đáo): Khơi gợi điểm mù tư duy và tặng bài test trưởng thành/sức bền tinh thần có chuyên gia giải đáp 1-1.
  * Mẫu 4 (Đúc kết khiêm nhường từ tiền bối): Chia sẻ bài học thực chiến của người đi làm nhiều năm, tặng template/bản đồ định vị bản sắc cá nhân free qua inbox.`,
      },
      order_2: {
        platform: 'Facebook',
        allowedTypes: ['ws', 'ct'], // Chạy tự do cả WS & CT
        rules: `ORDER 2: COMMENT QUA POST FACEBOOK (ĐA CHIỀU, KHÔNG GIỚI HẠN WS/CT)
- Nguyên tắc vàng: TRUNG LẬP, KHÁCH QUAN, PHÂN TÍCH ĐA CHIỀU CHO CẢ ĐÔI BÊN (nhân viên vs quản lý, áp lực doanh số vận hành vs khó khăn tâm lý cá nhân).
- Văn phong: Điềm đạm, hạ thấp bản thân ("Ở góc độ người từng trải qua cả hai vị trí...", "Tình trạng này ở các team mình thấy khá phổ biến...").
- TUYỆT ĐỐI CẤM áp đặt ra lệnh ("Thay vì than thở hãy...", "Bất mãn chứng tỏ bạn kém...").
- Đề xuất giải pháp: Giới thiệu Workshop (WS) hoặc Chương trình (CT) một cách khiêm tốn, coi đó là một không gian soi chiếu và tháo gỡ điểm nghẽn.
- Tiêu chuẩn 4 biến thể (Variations):
  * Mẫu 1 (Phân tích đa chiều đôi bên): Đứng ở góc nhìn trung lập, thấu cảm áp lực của cả cấp trên và cấp dưới, đề xuất WS/CT giải tỏa nút thắt.
  * Mẫu 2 (Bóc tách nguyên nhân gốc rễ): Mổ xẻ logic vận hành công sở và điểm nghẽn năng lượng, chỉ ra vì sao xử lý bề nổi không giải quyết được vấn đề.
  * Mẫu 3 (Trải nghiệm thực tế & Hạ mình chia sẻ): Kể bài học đắt giá bản thân từng gặp phải và cách Workshop/Chương trình giúp tái cấu trúc góc nhìn.
  * Mẫu 4 (Đặt câu hỏi gợi mở & Đổi lăng kính): Đặt câu hỏi kích thích suy ngẫm sâu sắc, gợi ý tham gia WS/CT như một trạm dừng chân làm mới tư duy.`,
      },
      order_3: {
        platform: 'Facebook',
        allowedTypes: ['ws', 'ct'], // Chạy tự do cả WS & CT
        rules: `ORDER 3: BÀI VIẾT FACEBOOK LONG-FORM (500 - 850 TỪ, GIỮ DWELL TIME & VIRAL)
1. TIÊU ĐỀ IN HOA / HOOK GỢI CẢM XÚC MẠNH: Câu hỏi nhức nhối hoặc một nghịch lý trần trụi chạm đúng tim đen người làm nghề.
2. THỰC TẾ ĐỒNG CẢM & VULNERABLE STORYTELLING: Kể câu chuyện chân thực, miêu tả chi tiết áp lực deadline, kiệt sức thầm lặng, cảm giác so sánh ngầm với bạn bè trên MXH mà không phán xét, không giáo điều.
3. PHẢN BIỆN BẺ GÃY LỐI MÒN (PARADIGM SHIFT): Phân tích vì sao càng gượng ép càng bế tắc. Nền tảng cốt lõi của sự thăng hoa là phục hồi năng lượng thể chất và sự thấu suốt bản thân.
4. TUYÊN BỐ DỰ ÁN CỘNG ĐỒNG PHI LỢI NHUẬN (100% MINH BẠCH TẠO NIỀM TIN): Bắt buộc có đoạn cam kết dứt khoát:
   "Mình cùng đồng đội làm một dự án cộng đồng hoàn toàn phi lợi nhuận. Mục đích thuần túy là muốn chia sẻ giá trị, đồng hành cùng anh em để giữ lửa nghề bền bỉ hơn. Mình khẳng định luôn là KHÔNG bán khóa học, KHÔNG PR lùa gà hay kinh doanh sản phẩm gì ở đây hết nhé, ai nghĩ vậy thì lướt qua giùm cho đỡ mất thời gian đôi bên ạ."
5. CÔNG CỤ TỰ ĐÁNH GIÁ CHUẨN KHOA HỌC: Giới thiệu bài test đo lường sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5 (Well-being index) hoặc bản đồ định vị thế mạnh, có bác sĩ/chuyên gia giải đáp 1-1 kín đáo.
6. CTA HƯỚNG VỀ FIRST COMMENT: Mời độc giả ghé xuống phần bình luận để nhận link (tuyệt đối không gắn link trên caption bài viết để tránh Facebook bóp reach 80%).
7. XUẤT 'firstCommentSeed': Bình luận ghim mồi đặt link bài test chân tình, tự nhiên.
- Tiêu chuẩn 4 biến thể (Variations - Mỗi bài 500-850 từ):
  * Mẫu 1 (Tự sự - Nỗi đau kiệt sức & Well-being)
  * Mẫu 2 (Phản biện - Nghịch lý nghề nghiệp & Thấu suốt con người thật)
  * Mẫu 3 (Dự án cộng đồng phi lợi nhuận & Khảo sát WHO-5)
  * Mẫu 4 (Chuyên gia thực chiến - Đúc kết chuyển hóa & Sức bền)`,
      },
      order_4: {
        platform: 'Threads',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 4: COMMENT THREADS (STORYTELLING CHÂN THẬT, CHẠM VÀO TÂM SỰ NỘI TÂM)
- Format: Ngắn gọn (3-5 dòng), ngắt dòng nhịp nhàng chuẩn văn hóa Threads, không hashtag, không màu mè.
- Tone: Tự sự, thổ lộ chân thật (vulnerable confession), như một lời thì thầm đêm muộn gỡ bỏ hoàn toàn sự phòng thủ của người đọc.
- Chuyển đổi: Gợi ý bài test/template tự soi chiếu 1-1 miễn phí giúp sáng tỏ hướng đi, mời chủ động nhắn tin.
- Tiêu chuẩn 4 biến thể (Variations):
  * Mẫu 1 (Lời tự sự đêm muộn): Chạm vào nỗi cô đơn, lạc lõng giữa thành phố sau giờ tan sở.
  * Mẫu 2 (Lát cắt công sở chân thực): Áp lực deadline và nỗi sợ bị tụt lại phía sau dù đã nỗ lực hết sức.
  * Mẫu 3 (Lời động viên ấm áp & Soi chiếu): Nhẹ nhàng gỡ bỏ áp lực so sánh với người khác, tặng test 1-1.
  * Mẫu 4 (Bẻ khóa cảm xúc giấu kín): Nói hộ tiếng lòng về sự trống rỗng bên trong dù bề ngoài vẫn ổn.`,
      },
      order_5: {
        platform: 'Threads',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 5: BÀI VIẾT THREADS (NGẮN GỌN, CUỐN HÚT, VIRAL INSIGHT)
- Format: Chuỗi câu ngắn (1-2 câu mỗi đoạn), ngắt dòng rộng rãi, cực kỳ bắt mắt trên mobile feed.
- Hook mở đầu: Đánh thẳng vào một nghịch lý tâm lý hoặc cảm xúc giấu kín của người đi làm tuổi 20-35.
- Nội dung: Gãy gọn, nhịp điệu nhanh, sắc sảo, không hoa mỹ, câu trước kéo câu sau.
- Kết bài: CTA tự nhiên mời thảo luận và nhắn tin riêng để nhận link bài test / template định vị 1-1.
- Tiêu chuẩn 4 biến thể (Variations):
  * Mẫu 1 (Nghịch lý tuổi 20-30): Chạy theo tốc độ của người khác vs Tìm ra nhịp độ của chính mình.
  * Mẫu 2 (Bẫy chăm chỉ mù quáng): Làm việc cật lực nhưng vẫn tự ti và trống rỗng vì thiếu bản sắc riêng.
  * Mẫu 3 (Chữa lành vs Thấu hiểu bản chất): Vượt qua trào lưu chữa lành bề nổi để chạm đến năng lực cốt lõi.
  * Mẫu 4 (Sức bền thời đại số): Rèn luyện cơ bắp não bộ và sự kiên định giữa nhịp sống vội vã.`,
      },
      order_6: {
        platform: 'LinkedIn',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 6: BÀI VIẾT LINKEDIN LONG-FORM & INMAIL (THOUGHT LEADERSHIP DÀI 450 - 800 TỪ)
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
- Tiêu chuẩn 4 biến thể (Variations - Mỗi bài 450-800 từ):
  * Mẫu 1 (Case Study Quản Trị & Nghịch Lý Giữ Chân Nhân Tài)
  * Mẫu 2 (Phản Biện Góc Khuất Quản Trị Cấp Trung)
  * Mẫu 3 (Framework Đo Lường Sức Khỏe Tổ Chức & Well-being)
  * Mẫu 4 (Thought Leadership Kỷ Nguyên AI)`,
      },
      order_7: {
        platform: 'Email',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 7: VIẾT CONTENT EMAIL (NURTURING & CHUYỂN ĐỔI CAO)
1. BỘ 3 TIÊU ĐỀ EMAIL (SUBJECT LINES): Bắt buộc đề xuất 3 phương án có tỷ lệ mở cao nhất (>45%):
   - Phương án 1 (Gây tò mò / Curiosity-driven)
   - Phương án 2 (Chạm nỗi đau trăn trở / Pain-point driven)
   - Phương án 3 (Lợi ích thẳng thắn & Ấm áp / Benefit-driven)
2. MỞ ĐẦU THÂN MẬT NHƯ NGƯỜI BẠN ĐỒNG HÀNH: Bắt đầu bằng một câu chuyện ngắn, một quan sát đời thường hoặc một sự đồng cảm ấm áp.
3. CÂU HỎI SOI CHIẾU TRÚNG TIM ĐEN: Đặt 2-3 câu hỏi gợi mở sâu sắc giúp người nhận tự nhìn nhận lại năng lượng, mục tiêu và điểm nghẽn của mình.
4. GIỚI THIỆU GIẢI PHÁP / WORKSHOP / CHƯƠNG TRÌNH: Dẫn dắt nhẹ nhàng, khi manh, nhấn mạnh tính đồng hành và giá trị chuyển hóa bên trong.
5. KÊU GỌI HÀNH ĐỘNG (CTA) KHÔNG ÁP LỰC: Mời bấm link đăng ký hoặc reply trực tiếp email này để chia sẻ câu chuyện và nhận tham vấn 1-1.
6. TÁI BÚT (P.S.): Đòn bẩy tâm lý cuối cùng, nhắc lại quà tặng/suất tham vấn miễn phí hoặc một lời chúc chân thành.
- Tiêu chuẩn 4 biến thể (Variations):
  * Mẫu 1 (Email Storytelling từ người bạn đồng hành - kèm 3 Subject Lines & P.S.)
  * Mẫu 2 (Email Phản biện bẻ gãy bận rộn mù quáng - kèm 3 Subject Lines & P.S.)
  * Mẫu 3 (Email Trao giá trị bài test & Khảo sát Well-being - kèm 3 Subject Lines & P.S.)
  * Mẫu 4 (Email Quyết định bước ngoặt chuyển hóa - kèm 3 Subject Lines & P.S.)`,
      },
    };

    const currentOrder = orderRules[orderType] || orderRules.order_1;

    // Filter available programs (Allowing both WS & CT)
    const availablePrograms = (programs || []).filter((p: any) => p.isActive !== false);

    const systemPrompt = `Bạn là Senior Content Quality & Viral Strategy Auditor kiêm Content Copywriter hơn 20 năm kinh nghiệm hàng đầu Việt Nam.
Sứ mệnh của bạn: Tạo ra content đạt điểm 10/10 về độ TỰ NHIÊN, SÂU SẮC, KHÔNG VĂN MẪU ROBOT, và TỐI ĐA HÓA TỶ LỆ CHUYỂN ĐỔI TỪ COMMENT/BÀI VIẾT THÀNH INBOX (1-1 DM LEAD).

QUY TẮC "ANTI-AI FLUFF" BẮT BUỘC (CỰC KỲ QUAN TRỌNG):
1. TUYỆT ĐỐI CẤM các mẫu câu sáo rỗng của AI:
   - CẤM: "Trong thế giới ngày nay...", "Bạn có bao giờ tự hỏi...", "Hãy nhớ rằng...", "Đừng ngần ngại...", "Hành trình vạn dặm...", "Ngọn hải đăng...".
   - CẤM các từ cảm thán giả tạo hoặc dùng dấu chấm than liên tiếp.
2. DÙNG NGÔN TỪ ĐỜI THƯỜNG & CHẠM TÂM LÝ NGƯỜI ĐI LÀM VIỆT NAM (20-39 tuổi):
   - Diễn đạt trúng cảm giác: loay hoay tuổi 25, hội chứng kẻ giả mạo (impostor syndrome), làm việc chăm chỉ nhưng không tự tin, sợ tụt hậu, áp lực so sánh ngầm, kiệt sức vì cố làm hài lòng mọi người.
3. QUY TẮC NỀN TẢNG:
   - Cho phép đề xuất cả Workshop (WS) và Chương trình (CT) trên mọi nền tảng khi phù hợp.
   - Không hướng nghiệp kiếm tiền nhanh; tập trung thấu hiểu bản thân, năng lực giải quyết vấn đề, sức bền tinh thần.
4. QUY TẮC RIÊNG CỦA LỆNH ĐANG XỬ LÝ:
${currentOrder.rules}

DANH SÁCH DỰ ÁN WORKSHOP / CHƯƠNG TRÌNH:
${JSON.stringify(availablePrograms, null, 2)}`;

    const userPrompt = `YÊU CẦU THỰC HIỆN:
- Loại Lệnh: ${orderType} (${currentOrder.platform})
- Ngữ cảnh bài đăng / Clip / Trăn trở người dùng:
"${context || 'Người trẻ loay hoay định vị bản thân, tự ti so sánh và muốn tìm ra thế mạnh thực sự'}"
${selectedProgramId && selectedProgramId !== 'auto' ? `- Dự án WS/CT được chỉ định: ID ${selectedProgramId}` : '- Hãy tự động chọn WS/CT phù hợp nhất với ngữ cảnh.'}
- Tùy chọn nâng cao:
  * Gắn link trực tiếp: ${options.includeLink ? 'Có gắn link trong nội dung' : 'Không gắn link trực tiếp (hướng dẫn inbox nhận)'}
  * Giọng văn mong muốn: ${options.tone || 'Tự nhiên, sâu sắc, đúng chuẩn nền tảng'}
  * Độ dài mong muốn: ${orderType === 'order_3' || orderType === 'order_6' ? 'Bài viết dài chuyên sâu (Long-Form)' : options.lengthPreference || 'Vừa vặn, súc tích'}
  * Đối tượng cụ thể: ${options.customAudience || 'Người đi làm 20-39 tuổi'}

Hãy trả về kết quả định dạng JSON chính xác:
{
  "selectedProgramId": "id của dự án được chọn",
  "selectedProgramTitle": "Tên WS/CT",
  "selectedProgramType": "ws" | "ct",
  "rationale": "Phân tích insight tâm lý khách hàng và lý do chọn dự án này",
  "platformNotes": "Chiến lược câu chữ và lưu ý tone & mood theo nền tảng",
  "primaryContent": "Phương án nội dung xuất sắc nhất",
  "variations": [
    "Mẫu 1: ...",
    "Mẫu 2: ...",
    "Mẫu 3: ...",
    "Mẫu 4: ..."
  ],
  "firstCommentSeed": "Mẫu bình luận ghim mồi chứa link bài test/tài liệu (cho Facebook/LinkedIn)",
  "dmFollowUpScript": {
    "step1_empathy": "Lời chào và đồng cảm khi khách inbox...",
    "step2_qualifyQuestion": "Câu hỏi mở đào sâu trúng tâm lý...",
    "step3_inviteLink": "Lời mời nhận bài test / link tham vấn 1-1 không áp lực..."
  }
}`;

    const parts: any[] = [];
    if (screenshotBase64) {
      const mimeType = screenshotBase64.startsWith('data:image/png')
        ? 'image/png'
        : screenshotBase64.startsWith('data:image/webp')
        ? 'image/webp'
        : 'image/jpeg';
      const cleanBase64 = screenshotBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: userPrompt });

    const response = await generateContentWithRetry(
      {
        contents: { parts },
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              selectedProgramId: { type: Type.STRING },
              selectedProgramTitle: { type: Type.STRING },
              selectedProgramType: { type: Type.STRING, enum: ['ws', 'ct'] },
              rationale: { type: Type.STRING },
              platformNotes: { type: Type.STRING },
              primaryContent: { type: Type.STRING },
              variations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              firstCommentSeed: { type: Type.STRING },
              dmFollowUpScript: {
                type: Type.OBJECT,
                properties: {
                  step1_empathy: { type: Type.STRING },
                  step2_qualifyQuestion: { type: Type.STRING },
                  step3_inviteLink: { type: Type.STRING },
                },
                required: ['step1_empathy', 'step2_qualifyQuestion', 'step3_inviteLink'],
              },
            },
            required: [
              'selectedProgramId',
              'selectedProgramTitle',
              'selectedProgramType',
              'rationale',
              'platformNotes',
              'primaryContent',
              'variations',
              'dmFollowUpScript',
            ],
          },
        },
      },
      targetModel,
      2,
      isThinkingRequested
    );

    const parsed = JSON.parse(response.text || '{}');

    // Ensure firstCommentSeed default if missing for FB/LinkedIn
    if (orderType === 'order_3' && !parsed.firstCommentSeed) {
      parsed.firstCommentSeed = 'Link bài test kiểm tra sức khỏe thể chất & tinh thần chuẩn y khoa WHO-5 ở đây nhé anh em: https://tally.so/r/wellbeing-test (Hoàn toàn miễn phí, làm xong có bác sĩ hỗ trợ giải đáp 1-1 nha mọi người ơi ❤️)';
    } else if (orderType === 'order_6' && !parsed.firstCommentSeed) {
      parsed.firstCommentSeed = 'P/S: Với anh/chị Leader hoặc HRBP đang quan tâm đến bộ chỉ số đo lường sức khỏe tổ chức & khung đánh giá Well-being nhân sự, em xin phép để link tài liệu chi tiết tại bình luận này nhé: [Link_Tài_Liệu] (Hoàn toàn mở và có hỗ trợ trao đổi 1-1 ạ).';
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error generating order content:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tạo nội dung Order.' });
  }
});

// 3. Interactive Content Refinement
app.post('/api/refine-content', async (req: Request, res: Response) => {
  try {
    const { currentContent, instruction, orderTitle, programTitle } = req.body;
    if (!currentContent || !instruction) {
      return res.status(400).json({ error: 'Thiếu nội dung hoặc chỉ dẫn tinh chỉnh.' });
    }

    const systemPrompt = `Bạn là Senior Content Quality & Viral Strategy Auditor kiêm Content Copywriter hơn 20 năm kinh nghiệm hàng đầu Việt Nam.
Nhiệm vụ: Nhận nội dung hiện tại và chỉ dẫn điều chỉnh từ người dùng, tinh chỉnh lại bài viết/comment sao cho tự nhiên, chân thật, sâu sắc, thực hiện chính xác chỉ dẫn của người dùng mà vẫn bảo toàn tỷ lệ chuyển đổi cao và chuẩn mực nền tảng.
QUY TẮC BẮT BUỘC TỪ CHUYÊN GIA 20 NĂM:
- CẤM dùng văn mẫu AI sáo rỗng ("Trong cuộc sống hiện đại...", "Bạn có bao giờ tự hỏi...", "Hãy cùng tôi khám phá...").
- Thực hiện chính xác yêu cầu (viết sâu sắc hơn, tăng cảm xúc tự sự, rút gọn súc tích, bổ sung cam kết phi lợi nhuận 100% không bán khóa học/lùa gà, đổi ngôi xưng hô, thêm số liệu/framework, v.v.).
- Nếu là bài viết Facebook Long-Form (Order 3) hoặc LinkedIn (Order 6), duy trì độ dài và cấu trúc chuyên sâu tương ứng.`;

    const promptText = `Nội dung hiện tại:
"""
${currentContent}
"""

Yêu cầu điều chỉnh từ người dùng:
"${instruction}"
${orderTitle ? `Thể loại: ${orderTitle}` : ''}
${programTitle ? `Dự án liên quan: ${programTitle}` : ''}`;

    const response = await generateContentWithRetry({
      contents: { parts: [{ text: promptText }] },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedContent: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ['refinedContent', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error refining content:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tinh chỉnh nội dung.' });
  }
});

// 4. Automated Order Chat Assistant
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, programs } = req.body;
    const lowerMessage = (message || '').trim().toLowerCase();

    // Special trigger: If message is "hi" or greeting, immediately return the automated Order menu
    if (lowerMessage === 'hi' || lowerMessage === 'hello' || lowerMessage === 'xin chào' || lowerMessage === 'chào') {
      const orderMenuText = `Xin chào bạn! Mình là Trợ lý AI Content & Social Media Manager (hơn 20 năm kinh nghiệm). Mình đã sẵn sàng hỗ trợ bạn sản xuất content chuyển đổi và kịch bản 1-1 theo chuẩn từng nền tảng.

Dưới đây là danh sách 7 Order tự động, bạn chỉ cần gõ **Order [số]** kèm thông tin/mô tả clip/post hoặc gửi ảnh màn hình nhé:

📋 **DANH SÁCH 7 ORDER TỰ ĐỘNG:**
- **Order 1**: Comment qua clip TikTok (Tự sự, thấu cảm tuổi 20-39, tặng bài test 1-1)
- **Order 2**: Comment qua post Facebook (Góc nhìn đa chiều, khách quan, tự do WS/CT)
- **Order 3**: Viết bài Facebook Long-Form (500-850 từ, cam kết phi lợi nhuận 100%, test WHO-5, link ghim mồi)
- **Order 4**: Comment Threads (Storytelling chân thật, tâm sự đêm muộn 3-5 dòng)
- **Order 5**: Viết bài Threads (Ngắn gọn, cuốn hút, hook nghịch lý/FOMO, ngắt dòng nhịp nhàng)
- **Order 6**: Bài viết & InMail LinkedIn Long-Form (Thought leadership, 3-line hook, case study quản trị, framework 3-4 điểm)
- **Order 7**: Viết content Email (3 Subject Lines, chuyện kể kết nối, câu hỏi soi chiếu, CTA chuyển đổi)

👉 *Bạn muốn thực hiện Order nào ngay bây giờ? Hãy gõ ví dụ: "Order 1 [mô tả clip]" hoặc bấm nút Order bên dưới.*`;

      return res.json({
        success: true,
        reply: orderMenuText,
        suggestedActions: [
          { label: '🎬 Order 1: Comment TikTok', action: 'Order 1', orderType: 'order_1' },
          { label: '💬 Order 2: Comment Facebook', action: 'Order 2', orderType: 'order_2' },
          { label: '📝 Order 3: Bài viết Facebook', action: 'Order 3', orderType: 'order_3' },
          { label: '🧵 Order 4: Comment Threads', action: 'Order 4', orderType: 'order_4' },
          { label: '✍️ Order 5: Bài viết Threads', action: 'Order 5', orderType: 'order_5' },
          { label: '💼 Order 6: Bài viết & InMail LinkedIn', action: 'Order 6', orderType: 'order_6' },
          { label: '📧 Order 7: Content Email', action: 'Order 7', orderType: 'order_7' },
        ],
      });
    }

    const systemPrompt = `Bạn là Senior Content Quality & Viral Strategy Auditor kiêm Content Copywriter hơn 20 năm kinh nghiệm, chuyên sâu 5 nền tảng (TikTok, Facebook, Threads, LinkedIn, Email).
Nhiệm vụ của bạn là hỗ trợ người dùng sản xuất content chuyển đổi và kịch bản chat 1-1 đạt chất lượng đỉnh cao.

QUY TẮC BẮT BUỘC:
- Cho phép phân phối tự do cả Workshop (WS) và Chương trình (CT) trên mọi nền tảng.
- Không dạy kiếm tiền bề nổi; tập trung thấu hiểu bản thân, sức bền tinh thần, giải quyết vấn đề và cân bằng năng lượng.
- Luôn giữ văn phong tự nhiên, không văn mẫu AI sáo rỗng.

DANH SÁCH WS/CT HIỆN CÓ:
${JSON.stringify(programs || [], null, 2)}`;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await generateContentWithRetry({
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({
      success: true,
      reply: response.text || 'Đã xử lý xong yêu cầu của bạn.',
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi xử lý chat.' });
  }
});

// Setup Vite or Static serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
