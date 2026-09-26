/**
 * authState — Bộ nhớ lưu Access Token trong RAM (không bao giờ chạm localStorage).
 *
 * Tách thành file riêng để tránh Circular Dependency giữa:
 *   apiConfig.ts ↔ tokenRefreshService.ts
 *
 * Tất cả các module cần đọc/ghi token đều import từ đây.
 */

let memoryToken: string | null = null;

export const authState = {
  getToken: (): string | null => memoryToken,
  setToken: (token: string | null): void => {
    memoryToken = token;
  },
  clearToken: (): void => {
    memoryToken = null;
    // Xóa thêm dấu vết expires_at nếu có
    try { localStorage.removeItem('hpticket_token_expires_at'); } catch (_) {}
  },
};
