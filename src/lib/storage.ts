import { ProgramItem, GeneratedContent } from '../types';
import { DEFAULT_PROGRAMS } from '../data/defaultPrograms';

const STORAGE_KEYS = {
  PROGRAMS: 'order_ai_programs_v1',
  HISTORY: 'order_ai_history_v1',
};

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
