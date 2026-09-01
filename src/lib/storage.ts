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
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(DEFAULT_PROGRAMS));
      return DEFAULT_PROGRAMS;
    }
    const parsed = JSON.parse(saved);
    // Ensure all default programs are present if missing
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PROGRAMS;
  } catch (e) {
    console.error('Failed to load saved programs:', e);
    return DEFAULT_PROGRAMS;
  }
}

export function savePrograms(programs: ProgramItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  } catch (e) {
    console.error('Failed to save programs:', e);
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
export function isCrtAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEYS.CRT_ADMIN_AUTH) === 'true';
}

export function verifyCrtAdmin(passcode: string): boolean {
  const cleanPasscode = passcode.trim().toLowerCase();
  const validKey = (localStorage.getItem('crt_custom_admin_key') || DEFAULT_CRT_ADMIN_KEY).toLowerCase();
  if (cleanPasscode === validKey) {
    sessionStorage.setItem(STORAGE_KEYS.CRT_ADMIN_AUTH, 'true');
    return true;
  }
  return false;
}

export function logoutCrtAdmin(): void {
  sessionStorage.removeItem(STORAGE_KEYS.CRT_ADMIN_AUTH);
}
