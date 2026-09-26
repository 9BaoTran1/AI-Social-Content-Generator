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

// === Cloud Sync Layer ===

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
 * Đồng bộ danh sách chương trình từ Cloud Endpoint về máy người dùng.
 * Chạy ngầm trong background khi mở ứng dụng.
 */
export async function syncProgramsFromCloud(): Promise<{
  success: boolean;
  count: number;
  updated: boolean;
  message?: string;
}> {
  const cfg = getCloudSyncConfig();
  if (!cfg.endpointUrl || !cfg.endpointUrl.trim().startsWith('http')) {
    return { success: false, count: 0, updated: false, message: 'Chưa cấu hình Endpoint Cloud' };
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (cfg.apiKey) {
      headers['X-Master-Key'] = cfg.apiKey;
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout để không ảnh hưởng UX

    const resp = await fetch(cfg.endpointUrl.trim(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      return { success: false, count: 0, updated: false, message: `Lỗi kết nối Cloud (${resp.status})` };
    }

    const json = await resp.json();
    // Support standard payloads, JSONBin (record.programs or record), or direct array
    const rawList = Array.isArray(json)
      ? json
      : Array.isArray(json.record?.programs)
      ? json.record.programs
      : Array.isArray(json.record)
      ? json.record
      : Array.isArray(json.programs)
      ? json.programs
      : [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return { success: true, count: 0, updated: false, message: 'Cloud chưa có chương trình tùy chỉnh nào' };
    }

    const cloudPrograms = rawList.map(normalizeProgramItem);
    const localPrograms = getSavedPrograms();
    const localMap = new Map(localPrograms.map((p) => [p.id, p]));

    let newlyAddedCount = 0;
    cloudPrograms.forEach((cp) => {
      if (!localMap.has(cp.id)) {
        localMap.set(cp.id, cp);
        newlyAddedCount++;
      } else {
        // Cập nhật nếu cloud có sửa đổi
        const existing = localMap.get(cp.id)!;
        if (!existing.isCore) {
          localMap.set(cp.id, { ...existing, ...cp, isCore: false });
        }
      }
    });

    if (newlyAddedCount > 0) {
      const merged = Array.from(localMap.values());
      savePrograms(merged);
      const now = new Date().toISOString();
      saveCloudSyncConfig({ lastSyncedAt: now });
      window.dispatchEvent(new CustomEvent('crt_programs_synced', { detail: merged }));
      return { success: true, count: newlyAddedCount, updated: true, message: `Đã tự động tải về ${newlyAddedCount} CRT mới từ Cloud` };
    }

    const now = new Date().toISOString();
    saveCloudSyncConfig({ lastSyncedAt: now });
    return { success: true, count: 0, updated: false, message: 'Dữ liệu đã khớp với Cloud mới nhất' };
  } catch (err: any) {
    // Yên lặng khi offline, không gây phiền người dùng
    return { success: false, count: 0, updated: false, message: err.message || 'Lỗi mạng khi đồng bộ Cloud' };
  }
}

/**
 * Đẩy toàn bộ danh sách CRT hiện tại từ Admin lên Cloud Endpoint.
 */
export async function publishProgramsToCloud(programs: ProgramItem[]): Promise<{
  success: boolean;
  message: string;
}> {
  const cfg = getCloudSyncConfig();
  if (!cfg.endpointUrl || !cfg.endpointUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Vui lòng nhập Cloud Endpoint URL hợp lệ trong Cài đặt Đồng bộ trước khi xuất bản.',
    };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cfg.apiKey) {
      headers['X-Master-Key'] = cfg.apiKey;
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    }

    const payload = {
      app: 'AI-Social-Content-Generator',
      updatedAt: new Date().toISOString(),
      count: programs.length,
      programs,
    };

    const resp = await fetch(cfg.endpointUrl.trim(), {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      // Fallback thử POST nếu endpoint không hỗ trợ PUT
      const postResp = await fetch(cfg.endpointUrl.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!postResp.ok) {
        return {
          success: false,
          message: `Không thể lưu lên Cloud (Mã phản hồi: ${resp.status}/${postResp.status}). Vui lòng kiểm tra quyền ghi API Key.`,
        };
      }
    }

    const now = new Date().toISOString();
    saveCloudSyncConfig({ lastSyncedAt: now });
    return {
      success: true,
      message: `Đã xuất bản thành công ${programs.length} chương trình lên Cloud cho toàn bộ người dùng!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi kết nối tới Cloud Endpoint: ${err.message || 'Không có phản hồi'}`,
    };
  }
}
