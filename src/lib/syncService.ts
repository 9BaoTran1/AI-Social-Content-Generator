import { ProgramItem } from '../types';
import { getSavedPrograms, savePrograms } from './storage';

const STORAGE_KEYS = {
  CLOUD_SYNC_CONFIG: 'order_ai_cloud_sync_config_v1',
  LAST_SYNC_TIME: 'order_ai_last_sync_time',
};

export interface CloudSyncConfig {
  endpointUrl: string; // URL REST API / JSONBin / MockAPI / KV
  apiKey?: string; // Optional API key or bearer token
  autoSync: boolean; // Tự động đồng bộ khi khởi động
  lastSyncedAt?: string;
}

const DEFAULT_CONFIG: CloudSyncConfig = {
  endpointUrl: '',
  apiKey: '',
  autoSync: true,
  lastSyncedAt: undefined,
};

// UTF-8 Safe Base64 Helpers
export function encodeUtf8Base64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Failed to encode base64:', e);
    return '';
  }
}

export function decodeUtf8Base64(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch (e) {
    console.error('Failed to decode base64:', e);
    return '';
  }
}

// === P2P Shareable Link Sync ===

/**
 * Tạo URL chứa dữ liệu của 1 CRT cụ thể để gửi qua Zalo/Telegram/Chat.
 * Bất kỳ ai click vào link này sẽ tự động được thêm CRT mới vào máy.
 */
export function generateShareableCrtUrl(program: ProgramItem): string {
  if (typeof window === 'undefined') return '';
  const payload = {
    type: 'single',
    version: '2026.1',
    data: program,
  };
  const encoded = encodeUtf8Base64(JSON.stringify(payload));
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?import_crt=${encodeURIComponent(encoded)}`;
}

/**
 * Tạo URL chứa toàn bộ danh sách CRT tùy chỉnh hiện tại để chia sẻ cả kho.
 */
export function generateShareableAllCrtUrl(programs: ProgramItem[]): string {
  if (typeof window === 'undefined') return '';
  const customOnly = programs.filter((p) => !p.isCore);
  const payload = {
    type: 'batch',
    version: '2026.1',
    data: customOnly.length > 0 ? customOnly : programs,
  };
  const encoded = encodeUtf8Base64(JSON.stringify(payload));
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?import_all_crt=${encodeURIComponent(encoded)}`;
}

/**
 * Kiểm tra xem URL có chứa tham số import_crt hoặc import_all_crt hay không.
 * Nếu có, giải mã, validate, gộp vào LocalStorage và dọn dẹp URL.
 */
export function checkAndImportFromUrl(): {
  imported: boolean;
  count: number;
  titles: string[];
} | null {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const singleParam = urlParams.get('import_crt');
    const batchParam = urlParams.get('import_all_crt');

    if (!singleParam && !batchParam) return null;

    let incomingPrograms: ProgramItem[] = [];

    if (singleParam) {
      const decodedJson = decodeUtf8Base64(decodeURIComponent(singleParam));
      if (!decodedJson) return null;
      const parsed = JSON.parse(decodedJson);
      const rawItem = parsed.data || parsed;
      if (rawItem && rawItem.title) {
        incomingPrograms.push(normalizeProgramItem(rawItem));
      }
    } else if (batchParam) {
      const decodedJson = decodeUtf8Base64(decodeURIComponent(batchParam));
      if (!decodedJson) return null;
      const parsed = JSON.parse(decodedJson);
      const rawList = Array.isArray(parsed.data) ? parsed.data : Array.isArray(parsed) ? parsed : [];
      incomingPrograms = rawList.filter((item: any) => item && item.title).map(normalizeProgramItem);
    }

    if (incomingPrograms.length === 0) return null;

    // Smart Merge vào danh sách hiện có
    const current = getSavedPrograms();
    const currentMap = new Map(current.map((p) => [p.id, p]));
    const importedTitles: string[] = [];

    incomingPrograms.forEach((prog) => {
      currentMap.set(prog.id, {
        ...prog,
        isCore: false, // Chương trình được import luôn là custom
        createdAt: prog.createdAt || new Date().toISOString(),
      });
      importedTitles.push(prog.title);
    });

    const updatedList = Array.from(currentMap.values());
    savePrograms(updatedList);

    // Dọn dẹp URL param để tránh lặp lại khi F5
    urlParams.delete('import_crt');
    urlParams.delete('import_all_crt');
    const newSearch = urlParams.toString();
    const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState({}, document.title, cleanUrl);

    // Phát event thông báo giao diện cập nhật
    window.dispatchEvent(new CustomEvent('crt_programs_synced', { detail: updatedList }));

    return {
      imported: true,
      count: incomingPrograms.length,
      titles: importedTitles,
    };
  } catch (err) {
    console.error('Lỗi khi phân tích CRT từ link URL:', err);
    return null;
  }
}

function normalizeProgramItem(item: any): ProgramItem {
  return {
    id: item.id || `crt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: String(item.title || 'Chương trình mới').trim(),
    type: item.type === 'ct' ? 'ct' : 'ws',
    description: String(item.description || ''),
    targetAudience: Array.isArray(item.targetAudience) ? item.targetAudience : [],
    painPoints: Array.isArray(item.painPoints) ? item.painPoints : [],
    coreValues: Array.isArray(item.coreValues) ? item.coreValues : [],
    testOrFormAngle: String(item.testOrFormAngle || ''),
    imageUrl: item.imageUrl || undefined,
    tallyUrl: item.tallyUrl || undefined,
    isBuiltin: false,
    isCore: false,
    isActive: item.isActive !== false,
    notes: item.notes || '',
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

// === Central Cloud Sync Layer (Powered by GitHub Gist Backbone) ===

export const CENTRAL_GIST = {
  ID: '46850c70585979ebd4256a108039359e',
  FILENAME: 'programs_sync.json',
  API_URL: 'https://api.github.com/gists/46850c70585979ebd4256a108039359e',
};

export function getAdminSyncToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('order_ai_admin_sync_token') || '';
}

export function saveAdminSyncToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('order_ai_admin_sync_token', token.trim());
}

export function getCloudSyncConfig(): CloudSyncConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveCloudSyncConfig(cfg: Partial<CloudSyncConfig>): CloudSyncConfig {
  const current = getCloudSyncConfig();
  const updated = { ...current, ...cfg };
  try {
    localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC_CONFIG, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save cloud sync config:', e);
  }
  return updated;
}

/**
 * TỰ ĐỘNG ĐẨY LÊN CLOUD (Dành cho Admin):
 * Mỗi khi Admin thêm, sửa hoặc xóa bất kỳ Workshop/CRT nào,
 * hàm này sẽ tự động chạy ngầm để cập nhật lên Cloud trung tâm ngay lập tức.
 */
export async function autoPublishToCloud(programs: ProgramItem[]): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const customOnly = programs.filter((p) => !p.isCore);
    const payload = customOnly.length > 0 ? customOnly : programs;

    const token = getAdminSyncToken();
    if (!token) {
      return { success: false, message: 'Chưa có quyền ghi Admin lên Cloud' };
    }

    const resp = await fetch(CENTRAL_GIST.API_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'AI-Social-Content-Generator',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: `Order AI CRT Programs Sync Storage (Auto-synced: ${new Date().toISOString()})`,
        files: {
          [CENTRAL_GIST.FILENAME]: {
            content: JSON.stringify(payload, null, 2),
          },
        },
      }),
    });

    if (resp.ok) {
      const now = new Date().toISOString();
      saveCloudSyncConfig({ lastSyncedAt: now });
      return {
        success: true,
        message: 'Đã tự động đồng bộ toàn bộ Workshop lên hệ thống Cloud trung tâm!',
      };
    } else {
      console.warn('Gist auto-sync PATCH status:', resp.status);
      return { success: false, message: `Lỗi đồng bộ Cloud (${resp.status})` };
    }
  } catch (err: any) {
    console.error('Lỗi khi tự động đẩy lên Cloud:', err);
    return { success: false, message: err.message || 'Lỗi mạng khi đồng bộ Cloud' };
  }
}

/**
 * TỰ ĐỘNG TẢI TỪ CLOUD (Dành cho toàn bộ người dùng & Client):
 * Chạy ngầm khi mở ứng dụng, khi chuyển tab quay lại, hoặc theo chu kỳ.
 * Không cần token, 100% public GET, tự động gộp các CRT mới nhất từ Admin.
 */
export async function syncProgramsFromCloud(): Promise<{
  success: boolean;
  count: number;
  updated: boolean;
  message?: string;
  titles?: string[];
}> {
  try {
    const cfg = getCloudSyncConfig();
    const targetUrl =
      cfg.endpointUrl && cfg.endpointUrl.trim().startsWith('http')
        ? cfg.endpointUrl.trim()
        : CENTRAL_GIST.API_URL;

    const isCentral = targetUrl === CENTRAL_GIST.API_URL;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'Accept': isCentral ? 'application/vnd.github.v3+json' : 'application/json',
    };
    if (!isCentral && cfg.apiKey) {
      headers['X-Master-Key'] = cfg.apiKey;
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    }

    const resp = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      return { success: false, count: 0, updated: false, message: `Lỗi kết nối (${resp.status})` };
    }

    const json = await resp.json();

    let rawList: any[] = [];
    if (isCentral) {
      const fileObj = json.files?.[CENTRAL_GIST.FILENAME];
      if (fileObj?.content) {
        rawList = JSON.parse(fileObj.content);
      }
    } else {
      rawList = Array.isArray(json)
        ? json
        : Array.isArray(json.record?.programs)
        ? json.record.programs
        : Array.isArray(json.record)
        ? json.record
        : Array.isArray(json.programs)
        ? json.programs
        : [];
    }

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return { success: true, count: 0, updated: false };
    }

    const cloudPrograms = rawList.map(normalizeProgramItem);
    const localPrograms = getSavedPrograms();
    const localMap = new Map(localPrograms.map((p) => [p.id, p]));

    let newlyAddedCount = 0;
    const addedTitles: string[] = [];

    cloudPrograms.forEach((cp) => {
      if (!localMap.has(cp.id)) {
        localMap.set(cp.id, cp);
        newlyAddedCount++;
        addedTitles.push(cp.title);
      } else {
        const existing = localMap.get(cp.id)!;
        if (!existing.isCore) {
          const isDifferent =
            existing.title !== cp.title ||
            existing.description !== cp.description ||
            existing.type !== cp.type ||
            existing.isActive !== cp.isActive;
          if (isDifferent) {
            localMap.set(cp.id, { ...existing, ...cp, isCore: false });
            newlyAddedCount++;
            addedTitles.push(cp.title);
          }
        }
      }
    });

    if (newlyAddedCount > 0) {
      const merged = Array.from(localMap.values());
      savePrograms(merged);
      const now = new Date().toISOString();
      saveCloudSyncConfig({ lastSyncedAt: now });
      window.dispatchEvent(new CustomEvent('crt_programs_synced', { detail: merged }));
      return {
        success: true,
        count: newlyAddedCount,
        updated: true,
        message: `Đã tự động nhận ${newlyAddedCount} Workshop/Chương trình mới từ Admin!`,
        titles: addedTitles,
      };
    }

    const now = new Date().toISOString();
    saveCloudSyncConfig({ lastSyncedAt: now });
    return { success: true, count: 0, updated: false };
  } catch (err: any) {
    return { success: false, count: 0, updated: false, message: err.message };
  }
}

/**
 * Đẩy toàn bộ danh sách CRT hiện tại từ Admin lên Cloud Endpoint.
 */
export async function publishProgramsToCloud(programs: ProgramItem[]): Promise<{
  success: boolean;
  message: string;
}> {
  return autoPublishToCloud(programs);
}
