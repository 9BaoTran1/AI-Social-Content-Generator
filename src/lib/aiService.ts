import { ProgramItem, OrderType, GeneratedContent, GenerationOptions, ProgramType } from '../types';

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
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
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

  const modelName = params.options?.modelSelection?.startsWith('gemini-2.5')
    ? 'gemini-2.5-flash'
    : 'gemini-2.5-flash';

  const systemInstruction = `Bạn là Content Master 10 năm kinh nghiệm và Social Media Copywriter hàng đầu Việt Nam.
Nhiệm vụ: Tạo ra content đạt điểm 10/10 về độ TỰ NHIÊN, CHÂN THẬT, KHÔNG VĂN MẪU ROBOT và tối đa tỷ lệ chuyển đổi từ comment/post thành tin nhắn 1-1 (DM).
QUY TẮC:
- CẤM văn mẫu AI sáo rỗng ("Trong cuộc sống...", "Bạn có bao giờ...").
- Dùng từ ngữ đời thường của người đi làm 20-39 tuổi (áp lực so sánh ngầm, kiệt sức, loay hoay định vị, sợ tụt hậu).
- Nền tảng Facebook TUYỆT ĐỐI chỉ rải Workshop (WS), KHÔNG rải Chương trình (CT), tone khách quan trung lập.
- 3 Biến thể: Mẫu 1 (Đồng cảm & Storytelling), Mẫu 2 (Phản biện & Reframe), Mẫu 3 (Trắc nghiệm & Test 1-1).

DANH SÁCH DỰ ÁN:
${JSON.stringify(params.programs, null, 2)}`;

  const promptText = `Yêu cầu thực hiện Order: ${params.orderType}
Ngữ cảnh: "${params.context}"
${params.selectedProgramId && params.selectedProgramId !== 'auto' ? `Dự án chỉ định ID: ${params.selectedProgramId}` : 'Hãy tự động chọn WS/CT phù hợp nhất.'}
Tùy chọn: Gắn link: ${params.options?.includeLink}, Giọng văn: ${params.options?.tone || 'Tự nhiên'}, Độ dài: ${params.options?.lengthPreference || 'Vừa vặn'}

Trả về JSON đúng cấu trúc:
{
  "selectedProgramId": "id",
  "selectedProgramTitle": "Tên WS/CT",
  "selectedProgramType": "ws" | "ct",
  "rationale": "Lý do và phân tích tâm lý",
  "platformNotes": "Lưu ý tone & mood",
  "primaryContent": "Nội dung chính",
  "variations": [
    "Mẫu 1 (Đồng cảm & Storytelling): ...",
    "Mẫu 2 (Phản biện & Reframe đa chiều): ...",
    "Mẫu 3 (Trắc nghiệm & Test 1-1 miễn phí): ..."
  ],
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
    throw new Error(`Lỗi kết nối Gemini API (${response.status}): ${errText}`);
  }

  const jsonRes = await response.json();
  const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(rawText);

  return {
    id: `gen-${Date.now()}`,
    orderId: params.orderType,
    orderTitle: params.orderType,
    platform: 'Social',
    programId: parsed.selectedProgramId || '',
    programTitle: parsed.selectedProgramTitle || '',
    programType: (parsed.selectedProgramType as ProgramType) || 'ws',
    primaryContent: parsed.primaryContent || '',
    variations: parsed.variations || [],
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
