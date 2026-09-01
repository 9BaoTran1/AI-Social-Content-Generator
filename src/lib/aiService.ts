import { ProgramItem, OrderType, GeneratedContent, GenerationOptions, ProgramType } from '../types';

const DEFAULT_ENCODED_KEY = 'QVEuQWI4Uk42SjFESlV0SDFYRXBsRVFWMU5nZHRSY3pxb3JUa3JuS1JfbFJhSHhFYzJwNnc=';

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
  // 1. Try server backend first
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
    console.warn('[AI Service] Server endpoint not available, falling back to direct client Gemini API call.');
  }

  // 2. Client-side Fallback (Direct Gemini REST API)
  const apiKey = getApiKey();
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('CHƯA_CÓ_API_KEY: Ứng dụng đang chạy ở chế độ tĩnh. Vui lòng nhập Gemini API Key của bạn để bắt đầu tạo nội dung.');
  }

  const isFacebookPost = params.orderType === 'order_3';

  const systemInstruction = `Bạn là Chuyên gia Social Media & Content Copywriter hơn 20 năm kinh nghiệm hàng đầu Việt Nam.
Nhiệm vụ: Tạo ra content đạt điểm 10/10 về độ TỰ NHIÊN, CHÂN THẬT, KHÔNG VĂN MẪU ROBOT, KHÔNG SÁO RỖNG và tối đa tỷ lệ chuyển đổi từ comment/post thành tin nhắn 1-1 (DM) hoặc tương tác bình luận.

QUY TẮC VÀNG TỪ CHUYÊN GIA 20 NĂM:
- CẤM văn mẫu AI sáo rỗng ("Trong cuộc sống...", "Bạn có bao giờ tự hỏi...", "Hãy cùng tôi khám phá...").
- Dùng ngôn ngữ đời thường, gãy gọn, chạm đúng tâm lý thực tế của người đi làm (áp lực so sánh ngầm, kiệt sức, loay hoay định vị, bế tắc ý tưởng, sợ tụt hậu).
- Nền tảng Facebook: Cho phép rải tự do cả Workshop (WS), Chương trình (CT) hoặc các dự án cộng đồng phi lợi nhuận.
${
  isFacebookPost
    ? `- ĐẶC BIỆT VỚI BÀI VIẾT FACEBOOK (ORDER 3): Phải là BÀI VIẾT DÀI (Long-form 350 - 650 từ) có chiều sâu, ngắt đoạn thoáng, cảm xúc chân thực theo cấu trúc:
       1. Tiêu đề in hoa / Hook giật tít không phản cảm, gợi mở nghịch lý hoặc câu hỏi trăn trở lớn.
       2. Đoạn mở đầu thấu hiểu, đồng cảm sâu sắc về áp lực, cảm xúc làm nghề của độc giả.
       3. Tuyên bố dự án cộng đồng phi lợi nhuận chia sẻ giá trị: Khẳng định thẳng thắn "KHÔNG bán khóa học, KHÔNG PR lùa gà hay kinh doanh sản phẩm gì ở đây hết".
       4. Móc nối thời điểm (kỳ nghỉ, cuối tuần, thời điểm chuyển giao) để refresh tâm trí và nạp năng lượng.
       5. Giới thiệu giải pháp / bài test (Well-being WHO-5, Trắc nghiệm thế mạnh, Định vị bản thân...) kèm hỗ trợ giải đáp 1-1 hoặc tư vấn từ chuyên gia.
       6. Kêu gọi hành động khéo léo (CTA): Hướng dẫn ghé xuống phần bình luận để nhận link / trải nghiệm thử (không để link trực tiếp trên cap bài viết để tránh bị Facebook bóp reach!).
       7. Tự động sinh thêm 'firstCommentSeed' (Bình luận mồi ghim đầu) chứa link và lời mời thân thiện.`
    : `- Với Comment TikTok/Facebook/Threads: Ngắn gọn, tự nhiên như người dùng thật đang tâm sự hoặc chia sẻ góc nhìn đắt giá.`
}

DANH SÁCH DỰ ÁN KHẢ DỤNG:
${JSON.stringify(params.programs, null, 2)}`;

  const promptText = `Yêu cầu thực hiện Order: ${params.orderType}
Ý tưởng, bối cảnh & từ khóa: "${params.context}"
${params.selectedProgramId && params.selectedProgramId !== 'auto' ? `Dự án chỉ định ID: ${params.selectedProgramId}` : 'Hãy tự động chọn WS/CT phù hợp nhất với ngữ cảnh.'}
Tùy chọn: Gắn link: ${params.options?.includeLink}, Giọng văn: ${params.options?.tone || 'Tự nhiên'}, Độ dài: ${params.options?.lengthPreference || 'Vừa vặn'}

Trả về JSON đúng cấu trúc:
{
  "selectedProgramId": "id",
  "selectedProgramTitle": "Tên WS/CT",
  "selectedProgramType": "ws" | "ct",
  "rationale": "Phân tích tâm lý đối tượng và lý do lựa chọn góc tiếp cận",
  "platformNotes": "Lưu ý thuật toán hiển thị & tương tác",
  "primaryContent": "Nội dung bài viết/comment xuất sắc nhất",
  "variations": [
    "Mẫu 1 (Tự sự - Đồng cảm sâu sắc): ...",
    "Mẫu 2 (Phản biện - Góc nhìn mới lạ): ...",
    "Mẫu 3 (Giá trị cộng đồng - Trắc nghiệm / Test 1-1 phi lợi nhuận): ...",
    "Mẫu 4 (Chuyên gia thực chiến - Đúc kết kinh nghiệm): ..."
  ],
  "firstCommentSeed": "Mẫu bình luận ghim mồi chứa link bài test/đăng ký dưới bài viết Facebook (nếu là bài FB)",
  "dmFollowUpScript": {
    "step1_empathy": "Lời mở đầu trong DM...",
    "step2_qualifyQuestion": "Câu hỏi đào sâu...",
    "step3_inviteLink": "Lời mời gửi link..."
  }
}`;

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

  const modelsToTry = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  let parsed: any = null;
  let lastErrMessage = '';

  for (const currentModel of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.8,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastErrMessage = `(${response.status}): ${errText}`;
        continue;
      }

      const jsonRes = await response.json();
      const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJsonText = rawText.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
      
      try {
        parsed = JSON.parse(cleanJsonText);
      } catch (jsonErr) {
        // If not valid JSON, treat raw text as primary content
        parsed = {
          primaryContent: cleanJsonText,
          variations: [cleanJsonText],
          rationale: 'Nội dung được tạo trực tiếp từ AI.',
          dmFollowUpScript: {
            step1_empathy: 'Chào bạn, mình thấy bạn quan tâm đến chủ đề này.',
            step2_qualifyQuestion: 'Bạn có đang gặp khó khăn gì trong quá trình định vị bản thân không?',
            step3_inviteLink: 'Mình gửi bạn link tham gia workshop miễn phí nhé: [Link]'
          }
        };
      }
      break;
    } catch (e: any) {
      lastErrMessage = e.message || String(e);
    }
  }

  if (!parsed) {
    throw new Error(`Lỗi kết nối Gemini API: ${lastErrMessage}`);
  }

  const variationsList = Array.isArray(parsed.variations) && parsed.variations.length > 0
    ? parsed.variations
    : [parsed.primaryContent || 'Nội dung đã được tạo thành công.'];

  return {
    id: `gen-${Date.now()}`,
    orderId: params.orderType,
    orderTitle: params.orderType,
    platform: isFacebookPost ? 'Facebook' : 'Social',
    programId: parsed.selectedProgramId || '',
    programTitle: parsed.selectedProgramTitle || '',
    programType: (parsed.selectedProgramType as ProgramType) || 'ws',
    primaryContent: parsed.primaryContent || variationsList[0] || '',
    variations: variationsList,
    firstCommentSeed: parsed.firstCommentSeed || (isFacebookPost ? 'Link bài test và thông tin chi tiết mình để ở bình luận này nhé mọi người ơi: [Link_Đăng_Ký]' : undefined),
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
  const apiKey = getApiKey();
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Vui lòng cung cấp Gemini API Key để tinh chỉnh nội dung.');
  }

  const systemInstruction = `Bạn là Chuyên gia Social Media & Content Copywriter hơn 20 năm kinh nghiệm.
Nhiệm vụ: Nhận nội dung hiện tại và yêu cầu chỉnh sửa từ người dùng, sau đó tinh chỉnh lại bài viết/comment cho thật tự nhiên, hấp dẫn, đúng yêu cầu và giữ vững chuyển đổi cao.
QUY TẮC:
- CẤM dùng văn mẫu AI sáo rỗng.
- Thực hiện chính xác yêu cầu (viết dài hơn, ngắn lại, thêm cam kết phi lợi nhuận, đổi giọng văn, v.v.).
Xuất JSON:
{
  "refinedContent": "Nội dung bài viết mới sau khi chỉnh sửa",
  "explanation": "Tóm tắt ngắn gọn 1 câu về điểm đã được điều chỉnh"
}`;

  const promptText = `Nội dung hiện tại:
"""
${params.currentContent}
"""

Yêu cầu điều chỉnh từ người dùng:
"${params.instruction}"
${params.orderTitle ? `Thể loại: ${params.orderTitle}` : ''}
${params.programTitle ? `Dự án liên quan: ${params.programTitle}` : ''}`;

  const modelsToTry = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
  ];

  let lastErr = '';
  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
        }),
      });

      if (!res.ok) {
        lastErr = await res.text();
        continue;
      }

      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const clean = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(clean);
      return {
        refinedContent: parsed.refinedContent || clean,
        explanation: parsed.explanation || 'Đã cập nhật bài viết theo yêu cầu.',
      };
    } catch (e: any) {
      lastErr = e.message || String(e);
    }
  }

  throw new Error(`Không thể tinh chỉnh nội dung: ${lastErr}`);
}

export async function extractProgramAI(params: {
  url?: string;
  text?: string;
  imageBase64?: string | null;
}): Promise<any> {
  // 1. Try server first
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

  // 2. Direct Gemini API Fallback
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) throw new Error('Không thể bóc tách thông tin chương trình.');
  const jsonRes = await res.json();
  return JSON.parse(jsonRes.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
}

export async function chatAI(params: {
  message: string;
  history?: any[];
  programs: ProgramItem[];
}): Promise<{ reply: string; suggestedActions?: any[] }> {
  // 1. Try server first
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
        { label: '💼 Order 6: Tin nhắn LinkedIn', action: 'Order 6', orderType: 'order_6' },
        { label: '📧 Order 7: Content Email', action: 'Order 7', orderType: 'order_7' },
      ],
    };
  }

  const apiKey = getApiKey();
  const systemInstruction = `Bạn là Content Master 10 năm kinh nghiệm hỗ trợ chuyển đổi comment thành inbox.
Dự án khả dụng: ${JSON.stringify(params.programs)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: params.message }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
  });

  if (!res.ok) throw new Error('Lỗi kết nối Trợ lý AI.');
  const jsonRes = await res.json();
  return {
    reply: jsonRes.candidates?.[0]?.content?.parts?.[0]?.text || 'Đã xử lý xong.',
  };
}
