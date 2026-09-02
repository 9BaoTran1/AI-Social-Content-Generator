import { ProgramItem, GeneratedContent } from '../types';
import { DEFAULT_PROGRAMS } from '../data/defaultPrograms';

const STORAGE_KEYS = {
  PROGRAMS: 'order_ai_programs_v1',
  HISTORY: 'order_ai_history_v1',
  CUSTOM_BENCHMARKS: 'order_ai_custom_benchmarks_v1',
  CRT_ADMIN_AUTH: 'order_ai_crt_admin_auth',
};

const DEFAULT_CRT_ADMIN_KEY = 'admincrt2026';

export function getSavedPrograms(): ProgramItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    if (!saved) {
      const initial = DEFAULT_PROGRAMS.map((p) => ({ ...p, isCore: true }));
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const coreIds = new Set(DEFAULT_PROGRAMS.map((p) => p.id));
      return parsed.map((p: ProgramItem) => ({
        ...p,
        isCore: p.isCore ?? coreIds.has(p.id) ?? p.isBuiltin ?? false,
      }));
    }
    return DEFAULT_PROGRAMS.map((p) => ({ ...p, isCore: true }));
  } catch (e) {
    console.error('Failed to load saved programs:', e);
    return DEFAULT_PROGRAMS.map((p) => ({ ...p, isCore: true }));
  }
}

export function savePrograms(programs: ProgramItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  } catch (e) {
    console.error('Failed to save programs:', e);
  }
}

export function resetProgramsToDefault(): ProgramItem[] {
  try {
    const reset = DEFAULT_PROGRAMS.map((p) => ({ ...p, isCore: true }));
    savePrograms(reset);
    return reset;
  } catch (e) {
    console.error('Failed to reset programs:', e);
    return DEFAULT_PROGRAMS;
  }
}

export function exportProgramsToJson(): string {
  const current = getSavedPrograms();
  const exportPayload = {
    app: 'AI-Social-Content-Generator',
    version: '2026.1',
    exportedAt: new Date().toISOString(),
    totalCount: current.length,
    programs: current,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importProgramsFromJson(jsonString: string): { success: boolean; count?: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const rawList = Array.isArray(parsed) ? parsed : parsed.programs;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return { success: false, error: 'Định dạng JSON không chứa danh sách chương trình hợp lệ.' };
    }

    const validated: ProgramItem[] = rawList
      .filter((item: any) => item && typeof item.title === 'string' && item.title.trim())
      .map((item: any, idx: number) => ({
        id: item.id || `custom-${Date.now()}-${idx}`,
        title: String(item.title).trim(),
        type: item.type === 'ct' ? 'ct' : 'ws',
        description: item.description || '',
        targetAudience: Array.isArray(item.targetAudience) ? item.targetAudience : [],
        painPoints: Array.isArray(item.painPoints) ? item.painPoints : [],
        coreValues: Array.isArray(item.coreValues) ? item.coreValues : [],
        testOrFormAngle: item.testOrFormAngle || '',
        imageUrl: item.imageUrl,
        tallyUrl: item.tallyUrl,
        isBuiltin: Boolean(item.isBuiltin),
        isCore: Boolean(item.isCore),
        isActive: item.isActive !== false,
        notes: item.notes,
        createdAt: item.createdAt || new Date().toISOString(),
      }));

    if (validated.length === 0) {
      return { success: false, error: 'Không tìm thấy mục chương trình nào có tiêu đề hợp lệ.' };
    }

    savePrograms(validated);
    return { success: true, count: validated.length };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi khi phân tích cú pháp JSON.' };
  }
}

export function getSavedHistory(): GeneratedContent[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
}

export function saveHistoryItem(item: GeneratedContent): void {
  try {
    const existing = getSavedHistory();
    const updated = [item, ...existing.slice(0, 49)]; // keep latest 50
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

// === Benchmark Templates Storage ===
import { SampleTemplate } from '../types';

export function getCustomBenchmarkTemplates(): SampleTemplate[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_BENCHMARKS);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
}

export function saveCustomBenchmarkTemplate(template: SampleTemplate): void {
  try {
    const existing = getCustomBenchmarkTemplates();
    const filtered = existing.filter((t) => t.id !== template.id);
    const updated = [{ ...template, isCustom: true }, ...filtered];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BENCHMARKS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom benchmark template:', e);
  }
}

export function deleteCustomBenchmarkTemplate(id: string): void {
  try {
    const existing = getCustomBenchmarkTemplates();
    const updated = existing.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BENCHMARKS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete custom benchmark template:', e);
  }
}

// === CRT Admin Authentication ===
export function notifyAdminStatusChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('crt_admin_changed'));
  }
}

export function checkAdminKeyFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get('admin_key');
    if (adminKey && adminKey.trim().toLowerCase() === DEFAULT_CRT_ADMIN_KEY.toLowerCase()) {
      sessionStorage.setItem(STORAGE_KEYS.CRT_ADMIN_AUTH, 'true');
      notifyAdminStatusChanged();
      return true;
    }
  } catch (e) {
    console.error('Failed to parse admin_key from URL:', e);
  }
  return false;
}

// Auto check URL parameter on module load
if (typeof window !== 'undefined') {
  checkAdminKeyFromUrl();
}

export function isCrtAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(STORAGE_KEYS.CRT_ADMIN_AUTH) === 'true') return true;
  return checkAdminKeyFromUrl();
}

export function verifyCrtAdmin(passcode: string): boolean {
  const cleanPasscode = passcode.trim().toLowerCase();
  const validKey = (localStorage.getItem('crt_custom_admin_key') || DEFAULT_CRT_ADMIN_KEY).toLowerCase();
  if (cleanPasscode === validKey) {
    sessionStorage.setItem(STORAGE_KEYS.CRT_ADMIN_AUTH, 'true');
    notifyAdminStatusChanged();
    return true;
  }
  return false;
}

export function logoutCrtAdmin(): void {
  sessionStorage.removeItem(STORAGE_KEYS.CRT_ADMIN_AUTH);
  notifyAdminStatusChanged();
}

export function changeCrtAdminKey(newKey: string): { success: boolean; message: string } {
  const trimmed = newKey.trim();
  if (trimmed.length < 6) {
    return { success: false, message: 'Mật mã quản trị mới phải có ít nhất 6 ký tự.' };
  }
  localStorage.setItem('crt_custom_admin_key', trimmed);
  sessionStorage.setItem(STORAGE_KEYS.CRT_ADMIN_AUTH, 'true');
  notifyAdminStatusChanged();
  return { success: true, message: 'Đã cập nhật mật mã Admin thành công!' };
}

