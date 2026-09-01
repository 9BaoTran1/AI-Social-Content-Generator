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
  | 'empathy_story' // Tâm sự tự sự & Đồng cảm sâu sắc
  | 'workplace_insight' // Đa chiều & Phân tích tâm lý công sở
  | 'provocative_reframe' // Phản biện bẻ khóa góc nhìn (Reframe)
  | 'assessment_test'; // Khơi gợi bài test & Trắc nghiệm 1-1

export interface GenerationOptions {
  includeLink?: boolean;
  introduceProgram?: boolean;
  tone?: WritingToneOption;
  modelSelection?: AIModelOption;
  customAudience?: string;
  selectedProgramId?: string;
  targetAge?: string;
  lengthPreference?: 'short' | 'medium' | 'long';
}

export interface DmFollowUpScript {
  step1_empathy: string;
  step2_qualifyQuestion: string;
  step3_inviteLink: string;
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
  firstCommentSeed?: string; // Bình luận mồi chứa link cho bài Facebook
  dmFollowUpScript: DmFollowUpScript;
  rationale: string;
  platformNotes: string;
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
