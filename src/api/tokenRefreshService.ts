/**
 * TokenRefreshService — Dịch vụ Gia hạn Token Tự động (Chạy ngầm)
 *
 * Chiến lược PROACTIVE (như Facebook/Google):
 * - Sau khi login, đặt timer tự gọi /auth/refresh TRƯỚC 3 phút khi Access Token hết hạn
 * - Không cần đợi nhận 401 từ API — user không bao giờ bị gián đoạn
 * - Khi tab đóng/mở lại, tự tính lại thời gian còn lại và set lại timer
 * - Chỉ hiện popup nhập lại mật khẩu khi Refresh Token (7 ngày) thực sự hết hạn
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_URL)
  ? (import.meta as any).env.VITE_API_URL
  : 'https://api.vnscout.io.vn/api/v1';

import { authState } from './authState';

const TOKEN_KEY        = 'hpticket_token';
const EXPIRES_AT_KEY   = 'hpticket_token_expires_at';

/** Bao nhiêu ms TRƯỚC khi hết hạn thì bắt đầu refresh (3 phút) */
const REFRESH_BEFORE_EXPIRY_MS = 3 * 60 * 1000;
/** Tần suất kiểm tra backup (fallback nếu timer bị trình duyệt throttle) */
const HEARTBEAT_INTERVAL_MS    = 60 * 1000; // 1 phút

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let isRefreshingProactive = false;

/** Cờ bật/tắt log debug để console gọn gàng. Muốn xem log, gõ localStorage.setItem('DEBUG_TOKEN', 'true') vào console */
const DEBUG = localStorage.getItem('DEBUG_TOKEN') === 'true';
const logDebug = (...args: any[]) => { if (DEBUG) console.info(...args); };

const authChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('hpticket_auth_channel')
  : null;

/**
 * Gọi /auth/refresh và cập nhật token mới vào memory.
 * Returns 'SUCCESS' nếu thành công, 'EXPIRED' nếu lỗi 401/403, 'ERROR' nếu lỗi mạng/server.
 */
async function doRefresh(): Promise<'SUCCESS' | 'EXPIRED' | 'ERROR'> {
  if (isRefreshingProactive) return 'ERROR';
  isRefreshingProactive = true;

  try {
    const res = await fetch(`${API_BASE_URL}/iam/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include', // Gửi HttpOnly Cookie refresh_token
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      console.warn('[TokenRefresh] Refresh thất bại, status:', res.status);
      if (res.status === 401 || res.status === 403) {
        return 'EXPIRED';
      }
      return 'ERROR'; // Lỗi mạng hoặc server (5xx)
    }

    const data = await res.json();
    const newToken: string | undefined = data?.data?.token;
    const expiresIn: number | undefined = data?.data?.expires_in; // giây

    if (!newToken) return 'ERROR';

    // Lưu token mới vào memory
    authState.setToken(newToken);
    if (expiresIn) {
      localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresIn * 1000));
    }

    // Thông báo các tab khác cùng cập nhật
    authChannel?.postMessage({ type: 'SESSION_REFRESHED', token: newToken });

    logDebug('[TokenRefresh] ✅ Gia hạn token thành công');
    return 'SUCCESS';
  } catch (err) {
    console.error('[TokenRefresh] Lỗi mạng khi gọi /auth/refresh:', err);
    return 'ERROR';
  } finally {
    isRefreshingProactive = false;
  }
}

/**
 * Đặt/reset timer để refresh trước khi token hết hạn.
 */
function scheduleRefresh(): void {
  if (refreshTimer) clearTimeout(refreshTimer);

  const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY) || '0');
  if (!expiresAt) return;

  const msUntilRefresh = expiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS;

  if (msUntilRefresh <= 0) {
    // Token đã gần/hết hạn — refresh ngay lập tức
    logDebug('[TokenRefresh] Token sắp hết hạn, refresh ngay...');
    handleRefreshCycle();
    return;
  }

  logDebug(`[TokenRefresh] ⏱ Sẽ refresh sau ${Math.round(msUntilRefresh / 1000)}s`);
  refreshTimer = setTimeout(handleRefreshCycle, msUntilRefresh);
}

/**
 * Thực hiện refresh và lên lịch lần tiếp theo.
 */
async function handleRefreshCycle(): Promise<void> {
  const token = authState.getToken();
  if (!token) return; // User đã đăng xuất

  const result = await doRefresh();

  if (result === 'SUCCESS') {
    scheduleRefresh(); // Lên lịch cho lần tiếp theo
  } else if (result === 'EXPIRED') {
    // Refresh Token hết hạn — buộc user đăng nhập lại
    stopService();
    authState.clearToken();
    authChannel?.postMessage({ type: 'SESSION_EXPIRED' });
    window.dispatchEvent(new CustomEvent('session_expired_modal'));
    console.warn('[TokenRefresh] Refresh Token hết hạn. Yêu cầu đăng nhập lại.');
  } else {
    // result === 'ERROR' (Lỗi mạng hoặc Server đang Restart)
    // KHÔNG LOG OUT! Đợi heartbeat kích hoạt lại sau 1 phút
    console.warn('[TokenRefresh] Gặp lỗi mạng/server, sẽ thử lại sau...');
  }
}

/**
 * Heartbeat: Kiểm tra định kỳ phòng trường hợp timer bị trình duyệt ngủ (tab nền, laptop ngủ).
 */
function startHeartbeat(): void {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY) || '0');
    const token = authState.getToken();
    if (!token || !expiresAt) return;

    const msLeft = expiresAt - Date.now();
    if (msLeft <= REFRESH_BEFORE_EXPIRY_MS) {
      console.info('[TokenRefresh] Heartbeat: token gần hết hạn, kích hoạt refresh');
      handleRefreshCycle();
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function stopService(): void {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

// Lắng nghe cập nhật từ các tab khác
authChannel?.addEventListener('message', (event) => {
  if (event.data.type === 'SESSION_REFRESHED' && event.data.token) {
    authState.setToken(event.data.token);
    scheduleRefresh();
  } else if (event.data.type === 'SESSION_EXPIRED') {
    stopService();
  }
});

// Lắng nghe khi tab được focus lại (sau khi laptop ngủ/màn hình khóa)
window.addEventListener('focus', () => {
  const token = authState.getToken();
  if (token) scheduleRefresh();
});

export const tokenRefreshService = {
  /**
   * Khởi động service sau khi đăng nhập thành công.
   * @param expiresInSeconds - Số giây Access Token sống (từ login response.data.expires_in)
   */
  start(expiresInSeconds: number, initialToken: string): void {
    authState.setToken(initialToken);
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    scheduleRefresh();
    startHeartbeat();
    logDebug(`[TokenRefresh] 🚀 Service khởi động. Token hết hạn sau ${expiresInSeconds}s`);
  },

  /**
   * Gọi khi app khởi động lại (F5/mở tab mới) — tự tính lại timer từ localStorage.
   */
  async resume(): Promise<boolean> {
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    // Nếu có session trước đó, cố gắng refresh
    if (expiresAt) {
      logDebug('[TokenRefresh] ▶ Khôi phục session...');
      const result = await doRefresh();
      if (result === 'SUCCESS') {
        scheduleRefresh();
        startHeartbeat();
        return true;
      } else {
        authState.clearToken();
        return false;
      }
    }
    return false;
  },

  /** Dừng service hoàn toàn (khi đăng xuất). */
  stop(): void { 
    stopService(); 
    authState.clearToken();
  },
  
  doRefresh // Export doRefresh for manual silent refresh if needed
};
