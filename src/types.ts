export type ThemeMode = 'light' | 'dark';

export type ProgramType = 'ws' | 'ct';

export interface ProgramItem {
  id: string;
  title: string;
  type: ProgramType; // 'ws' for Workshop, 'ct' for Chương trình
  description: string;
  targetAudience: string[];
  painPoints: string[];
  coreValues: string[];
  testOrFormAngle: string;
  imageUrl?: string;
  tallyUrl?: string;
  isBuiltin?: boolean;
  isCore?: boolean; // Chương trình gốc của hệ thống (được bảo vệ, chống xóa nhầm)
  isActive?: boolean;
  notes?: string;
  createdAt: string;
}

export type OrderType =
  | 'order_1' // Comment qua clip Tiktok
  | 'order_2' // Comment qua post Facebook (Không giới hạn, chạy tự do WS & CT)
  | 'order_3' // Viết bài Facebook Long-Form (Không giới hạn, chạy tự do WS & CT)
  | 'order_4' // Comment Threads
  | 'order_5' // Viết bài Threads
  | 'order_6' // Viết bài tiếp cận qua tin nhắn LinkedIn
  | 'order_7'; // Viết content Email

export interface OrderMeta {
  id: OrderType;
  orderNumber: number;
  title: string;
  platform: 'Tiktok' | 'Facebook' | 'Threads' | 'LinkedIn' | 'Email';
  category: 'comment' | 'post' | 'message' | 'email';
  allowedTypes: ('ws' | 'ct')[];
  description: string;
  toneGuideline: string;
  defaultPrompt: string;
}

export type AIModelOption =
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-3.7-flash'
  | 'gemini-3.7-flash-thinking';

export type WritingToneOption =
  | 'empathy_story' // Tự sự & Tâm tình (Chân thật, chạm cảm xúc)
  | 'humorous' // Hài hước & Hóm hỉnh (Dí dỏm, duyên dáng, tự trào)
  | 'workplace_insight' // Phân tích & Thực tế công sở (Góc nhìn nghề nghiệp)
  | 'provocative_reframe' // Phản biện sắc bén (Bẻ khóa định kiến)
  | 'thought_leader' // Chuyên gia & Cố vấn (Đĩnh đạc, sâu sắc)
  | 'healing_gentle' // Nhẹ nhàng & Chữa lành (Thấu cảm, vỗ về)
  | 'dramatic_suspense' // Kịch tính & Gay cấn (Mở màn nút thắt bất ngờ)
  | 'gen_z_trend' // Gen Z & Bắt trend viral (Ngôn từ đời thường)
  | 'assessment_test' // Giá trị cộng đồng (Khơi gợi bài test miễn phí)
  | 'custom'; // Tự nhập phong cách riêng

export interface GenerationOptions {
  includeLink?: boolean;
  introduceProgram?: boolean;
  tone?: WritingToneOption;
  customTone?: string;
  modelSelection?: AIModelOption;
  customAudience?: string;
  selectedProgramId?: string;
  targetAge?: string;
  lengthPreference?: 'short' | 'medium' | 'long';
  forceRefresh?: boolean;
}

export interface DmFollowUpScript {
  step1_empathy: string;
  step2_qualifyQuestion: string;
  step3_inviteLink: string;
}

export interface DirectorStrategicAnalysis {
  targetAudience: string; // Đối tượng mục tiêu
  emotionalTouchpoint: string; // Điểm chạm cảm xúc
  algorithmAssessment: string; // Đánh giá thuật toán phân phối
  approachReason: string; // Lý do chọn giải pháp & góc tiếp cận
}

export interface SystemOrchestratorAnalysis {
  ecosystemLink: string; // Mắt xích kết nối giữa bối cảnh bài viết với Workshop mục tiêu trong Kho CRT
  funnelFlow: {
    stage1_hook: string; // Điểm chạm ban đầu (Hook 3s & Dwell Time)
    stage2_trust: string; // Giải phóng tâm lý (Cam kết phi lợi nhuận & Thấu cảm)
    stage3_bridge: string; // Cầu nối qua First Comment (Tránh bóp reach outlink)
    stage4_private: string; // Hội thoại riêng tư (Đồng cảm -> Gợi mở -> Mời link)
    stage5_destination: string; // Đích đến chuyển hóa (Workshop / Bài trắc nghiệm tự đánh giá)
  };
  omnichannelStrategy: string; // Khuyến nghị điều phối phân phối đa kênh (TikTok, FB, LinkedIn, Threads)
  systemSafetyScore: {
    score: number; // 90-100%
    assessment: string; // Đánh giá an toàn thuật toán, cảnh báo rủi ro spam
  };
}

export interface GeneratedContent {
  id: string;
  orderId: OrderType;
  orderTitle: string;
  platform: string;
  programId: string;
  programTitle: string;
  programType: ProgramType;
  primaryContent: string;
  variations: string[];
  appliedTone?: WritingToneOption;
  customTone?: string;
  firstCommentSeed?: string; // Bình luận mồi chứa link cho bài Facebook
  dmFollowUpScript: DmFollowUpScript;
  rationale: string;
  platformNotes: string;
  directorStrategicAnalysis?: DirectorStrategicAnalysis;
  systemOrchestrator?: SystemOrchestratorAnalysis;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  orderTriggered?: OrderType;
  generatedResult?: GeneratedContent;
  timestamp: string;
  suggestedActions?: { label: string; action: string; orderType?: OrderType }[];
}

export interface SampleTemplate {
  id: string;
  platform: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  keyInsight: string;
  firstCommentSeed?: string;
  isCustom?: boolean;
}
