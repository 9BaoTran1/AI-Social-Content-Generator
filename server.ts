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
  primaryModel: string = 'gemini-3.7-flash',
  maxRetriesPerModel: number = 2,
  enableThinking: boolean = false
) {
  const ai = getAi();
  
  // Model priority cascade
  const modelsToTry = [
    primaryModel,
    'gemini-3.7-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
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

    const chosenModelOption = options.modelSelection || 'gemini-3.7-flash';
    const isThinkingRequested = chosenModelOption === 'gemini-3.7-flash-thinking';
    const targetModel = chosenModelOption.startsWith('gemini-2.5')
      ? 'gemini-2.5-flash'
      : 'gemini-3.7-flash';

    // Map order definitions and strict rules
    const orderRules: Record<string, { platform: string; allowedTypes: string[]; rules: string }> = {
      order_1: {
        platform: 'TikTok',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 1: COMMENT QUA CLIP TIKTOK (THU HÚT INBOX TỰ NHIÊN)
- Mục tiêu: Chuyển đổi người xem đang đồng cảm với clip thành người chủ động inbox nhận bài test/lời khuyên 1-1, tuyệt đối không lộ mùi bán hàng/quảng cáo lộ liễu.
- Tone & Mood: Ấm áp, thấu cảm sâu sắc, nói chuyện như một người bạn/tiền bối đi trước 1-2 năm trải lòng chân thành.
- Độ tuổi mục tiêu: 20-39 tuổi (người trẻ đi làm đang tự ti so sánh, sợ dậm chân tại chỗ, kiệt sức vì overthinking hoặc chưa rõ điểm mạnh).
- Tiêu chuẩn 3 biến thể (Variations):
  * Mẫu 1 (Story & Đồng Cảm): Nhắc trực tiếp đến 1 chi tiết/câu nói đắt giá trong clip, chia sẻ sự đồng cảm cá nhân và gieo góc nhìn giải phóng tâm lý.
  * Mẫu 2 (Phản Biện Reframe): Bẻ khóa tư duy (ví dụ: "Thật ra không phải do bạn kém, mà do bạn đang ép mình vào một cái khuôn không thuộc về điểm mạnh của bạn...").
  * Mẫu 3 (Trắc Nghiệm Tự Vấn): Khơi gợi tò mò về bài test định vị bản thân/năng lượng 1-1 có giải đáp chi tiết, mời inbox nhận free một cách khiêm tốn.`,
      },
      order_2: {
        platform: 'Facebook',
        allowedTypes: ['ws'], // STRICTLY WS ONLY!
        rules: `ORDER 2: COMMENT QUA POST FACEBOOK
*** QUY TẮC SỐNG CÒN TRÊN FACEBOOK ***:
- TUYỆT ĐỐI KHÔNG RẢI CHƯƠNG TRÌNH (CT). CHỈ ĐƯỢC PHÉP ĐỀ XUẤT WORKSHOP (WS).
- Tone & Mood: KHÁCH QUAN, TRUNG LẬP, PHÂN TÍCH ĐA CHIỀU CHO CẢ ĐÔI BÊN (nhân viên vs quản lý, áp lực thực tế vs kỳ vọng phát triển).
- TUYỆT ĐỐI CẤM các câu áp đặt ra lệnh như: "Thay vì than thở hãy...", "Việc bạn bất mãn chứng tỏ bạn..." (nghe rất phản cảm và giáo điều).
- HẠ THẤP BẢN THÂN, dùng câu từ khiêm nhường: "Tình trạng này ở các team mình thấy khá phổ biến...", "Nếu bạn muốn nhìn lại một cách khách quan có thể tham khảo WS..."`,
      },
      order_3: {
        platform: 'Facebook',
        allowedTypes: ['ws'], // STRICTLY WS ONLY!
        rules: `ORDER 3: BÀI VIẾT FACEBOOK (POST CHUYÊN SÂU)
*** QUY TẮC SỐNG CÒN TRÊN FACEBOOK ***:
- TUYỆT ĐỐI CHỈ VIẾT VỀ WORKSHOP (WS), KHÔNG VIẾT CHƯƠNG TRÌNH (CT).
- Format: Bài viết có cấu trúc rõ ràng, ngắt đoạn thoáng, dẫn dắt từ một lát cắt thực tế công sở -> mổ xẻ nguyên nhân tâm lý/vận hành -> đề xuất giải pháp khiêm tốn qua Workshop.
- Tone: Trưởng thành, đa chiều, có chiều sâu trải nghiệm, không rao giảng đạo đức.`,
      },
      order_4: {
        platform: 'Threads',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 4: COMMENT THREADS (CHẠM VÀO TÂM SỰ NỘI TÂM)
- Format: Ngắn gọn (3-5 dòng), ngắt dòng nhịp nhàng chuẩn văn hóa Threads.
- Tone: Tự sự, thật thà (vulnerable), gỡ bỏ phòng thủ của người đọc, như một lời thì thầm đồng cảm giữa đêm muộn.
- Chuyển đổi: Gợi ý về một bảng câu hỏi tự soi chiếu hoặc bài test 1-1 miễn phí giúp sáng tỏ vấn đề.`,
      },
      order_5: {
        platform: 'Threads',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 5: BÀI VIẾT THREADS (VIRAL INSIGHT THREAD)
- Format: Chuỗi các câu ngắn (1-2 câu mỗi đoạn), cách dòng rộng rãi, cực kỳ bắt mắt trên mobile feed.
- Hook mở đầu: Đánh thẳng vào một nghịch lý tâm lý hoặc cảm xúc giấu kín của người đi làm.
- Đoạn kết: Mở rộng thảo luận và mời nhắn tin riêng để nhận bộ tài liệu/template định vị 1-1.`,
      },
      order_6: {
        platform: 'LinkedIn',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 6: TIẾP CẬN QUA TIN NHẮN LINKEDIN (INMAIL / DM)
- Tone & Mood: Lịch thiệp, ấm áp, chuyên nghiệp, định vị là HRBP hoặc người làm People & Culture tâm huyết.
- Nhắc đến cơ sở khoa học (MBTI, quản trị năng lượng, định vị thế mạnh nội tại), nhấn mạnh tính phi lợi nhuận và tham vấn 1:1 miễn phí.`,
      },
      order_7: {
        platform: 'Email',
        allowedTypes: ['ws', 'ct'],
        rules: `ORDER 7: VIẾT CONTENT EMAIL (TỶ LỆ MỞ VÀ PHẢN HỒI CAO)
- Cung cấp: 3 phương án tiêu đề (Subject Line) kích thích tò mò + Nội dung thư ấm áp, có cốt truyện và câu hỏi tự vấn sâu sắc + CTA hành động rõ ràng.`,
      },
    };

    const currentOrder = orderRules[orderType] || orderRules.order_1;

    // Filter available programs based on platform restrictions
    let availablePrograms = (programs || []).filter((p: any) => p.isActive !== false);
    if (currentOrder.allowedTypes.length === 1 && currentOrder.allowedTypes[0] === 'ws') {
      availablePrograms = availablePrograms.filter((p: any) => p.type === 'ws');
    }

    const systemPrompt = `Bạn là một Content Master & Social Copywriting Specialist 10 năm kinh nghiệm hàng đầu Việt Nam.
Sứ mệnh của bạn: Tạo ra content đạt điểm 10/10 về độ TỰ NHIÊN, SÂU SẮC, KHÔNG VĂN MẪU ROBOT, và TỐI ĐA HÓA TỶ LỆ CHUYỂN ĐỔI TỪ COMMENT/BÀI VIẾT THÀNH INBOX (1-1 DM LEAD).

QUY TẮC "ANTI-AI FLUFF" BẮT BUỘC (CỰC KỲ QUAN TRỌNG):
1. TUYỆT ĐỐI CẤM các mẫu câu sáo rỗng của AI:
   - CẤM: "Trong thế giới ngày nay...", "Bạn có bao giờ tự hỏi...", "Hãy nhớ rằng...", "Đừng ngần ngại...", "Hành trình vạn dặm...", "Ngọn hải đăng...".
   - CẤM các từ cảm thán giả tạo hoặc dùng dấu chấm than liên tiếp.
2. DÙNG NGÔN TỪ ĐỜI THƯỜNG & CHẠM TÂM LÝ NGƯỜI ĐI LÀM VIỆT NAM (20-39 tuổi):
   - Diễn đạt trúng cảm giác: loay hoay tuổi 25, hội chứng kẻ giả mạo (impostor syndrome), làm việc chăm chỉ nhưng không tự tin, sợ tụt hậu, áp lực so sánh ngầm, kiệt sức vì cố làm hài lòng mọi người.
3. QUY TẮC NỀN TẢNG:
   - Trên Facebook: TUYỆT ĐỐI CHỈ DÙNG WORKSHOP (WS), CẤM RẢI CHƯƠNG TRÌNH (CT). Tone Facebook phải khách quan, trung lập, hạ thấp bản thân.
   - Không hướng nghiệp kiếm tiền nhanh; tập trung thấu hiểu bản thân, năng lực giải quyết vấn đề, sức bền tinh thần.
4. NGUYÊN TẮC 3 BIẾN THỂ (VARIATIONS):
   - Mẫu 1: Góc nhìn Đồng cảm & Storytelling (Chân thật, kể chuyện, tạo sự kết nối tức thì).
   - Mẫu 2: Góc nhìn Phản biện & Logic người đi làm (Reframe góc nhìn, đa chiều, sâu sắc).
   - Mẫu 3: Góc nhìn Trắc nghiệm & Tham vấn 1-1 (Khơi gợi điểm mù bản thân, mời nhận test free).
5. KỊCH BẢN DM 1-1 (FOLLOW-UP):
   - Phải tự nhiên như một người bạn biết lắng nghe, qua 3 bước: Đồng cảm -> Câu hỏi mở đào sâu -> Mời gửi link bài test 1-1.

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
  * Độ dài mong muốn: ${options.lengthPreference || 'Vừa vặn, súc tích'}
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
    "Mẫu 1 (Đồng cảm & Storytelling): ...",
    "Mẫu 2 (Phản biện & Reframe đa chiều): ...",
    "Mẫu 3 (Trắc nghiệm & Test 1-1 miễn phí): ..."
  ],
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

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error generating order content:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tạo nội dung Order.' });
  }
});

// 3. Automated Order Chat Assistant
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, programs } = req.body;
    const lowerMessage = (message || '').trim().toLowerCase();

    // Special trigger: If message is "hi" or greeting, immediately return the automated Order menu
    if (lowerMessage === 'hi' || lowerMessage === 'hello' || lowerMessage === 'xin chào' || lowerMessage === 'chào') {
      const orderMenuText = `Xin chào bạn! Mình là Trợ lý AI Content & Social Media Manager (10 năm kinh nghiệm). Mình đã sẵn sàng hỗ trợ bạn sản xuất content chuyển đổi và dẫn dắt 1-1 theo chuẩn từng nền tảng.

Dưới đây là danh sách các Order tự động, bạn chỉ cần gõ **Order [số]** kèm thông tin/mô tả clip/post hoặc gửi ảnh màn hình nhé:

📋 **DANH SÁCH ORDER TỰ ĐỘNG:**
- **Order 1**: Comment qua clip TikTok (Đồng cảm tuổi 20-39, tặng bài test 1-1)
- **Order 2**: Comment qua post Facebook (*Chỉ Workshop (WS), tone trung lập phân tích hai chiều)
- **Order 3**: Viết bài Facebook (*Chỉ Workshop (WS), phân tích sâu sắc, hỏi link)
- **Order 4**: Comment Threads (Tự sự, chân thật, chạm nỗi đau nội tâm)
- **Order 5**: Viết bài Threads (Ngắn gọn, hook bắt tai, ngắt dòng nhịp nhàng)
- **Order 6**: Viết bài tiếp cận qua tin nhắn LinkedIn (Góc nhìn HRBP/L&D, MBTI & năng lượng)
- **Order 7**: Viết content Email (Tiêu đề tò mò, câu chuyện kết nối, câu hỏi tự vấn)

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
          { label: '💼 Order 6: Tin nhắn LinkedIn', action: 'Order 6', orderType: 'order_6' },
          { label: '📧 Order 7: Content Email', action: 'Order 7', orderType: 'order_7' },
        ],
      });
    }

    const systemPrompt = `Bạn là Content Master 10 năm kinh nghiệm, Social Media Manager chuyên sâu 4 nền tảng (TikTok, Facebook, Threads, LinkedIn, Email).
Nhiệm vụ của bạn là hỗ trợ người dùng sản xuất content chuyển đổi comment thành inbox và kịch bản chat 1-1.

QUY TẮC BẮT BUỘC:
- Nếu người dùng yêu cầu Order 1-7, hãy kiểm tra quy tắc: Facebook TUYỆT ĐỐI chỉ rải Workshop (WS), KHÔNG rải Chương trình (CT). Tone Facebook phải trung lập, phân tích đa chiều cho cả hai bên, hạ thấp bản thân, không dùng câu khẳng định áp đặt.
- Các chương trình không dạy kỹ năng kiếm tiền/hướng nghiệp bề nổi mà tập trung thấu hiểu bản thân, sức bền tinh thần, giải quyết vấn đề.
- Luôn đưa ra gợi ý kịch bản trả lời tin nhắn 1-1 (DM) khi có người quan tâm.

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
