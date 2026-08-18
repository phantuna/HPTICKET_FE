/**
 * permissionGuard.ts
 *
 * Utility đọc JWT token từ localStorage, decode permissions,
 * và cung cấp hàm kiểm tra quyền động — không fix cứng.
 *
 * Sử dụng:
 *   import { hasPermission, getUserPermissions } from '../utils/permissionGuard';
 *   if (hasPermission('VIEW_ROLE')) { ...gọi API... }
 */

/**
 * Decode payload từ JWT token (không verify signature — chỉ đọc claims).
 * Trả về null nếu token không tồn tại hoặc parse lỗi.
 */
function decodeJwtPayload(): Record<string, any> | null {
  try {
    const token = localStorage.getItem('hpticket_token');
    if (!token) return null;
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    // Xử lý base64url (thay - thành +, _ thành /)
    const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch (_) {
    return null;
  }
}

/**
 * Lấy danh sách quyền của user hiện tại từ JWT.
 * Trả về mảng rỗng nếu không có token hoặc không có permissions.
 */
export function getUserPermissions(): string[] {
  const payload = decodeJwtPayload();
  if (!payload) return [];
  return Array.isArray(payload.permissions) ? payload.permissions : [];
}

/**
 * Kiểm tra user hiện tại có quyền `perm` không.
 * Trả về true nếu user có SUPER_ADMIN (qua hết mọi thứ).
 *
 * @param perm - Tên permission cần kiểm tra (vd: 'VIEW_ROLE', 'CREATE_ORDER')
 */
export function hasPermission(perm: string): boolean {
  const permissions = getUserPermissions();
  // SUPER_ADMIN qua hết
  if (permissions.includes('SUPER_ADMIN')) return true;
  return permissions.includes(perm);
}

/**
 * Kiểm tra user có ít nhất 1 trong danh sách quyền.
 */
export function hasAnyPermission(...perms: string[]): boolean {
  return perms.some(p => hasPermission(p));
}

/**
 * Lấy role của user hiện tại từ JWT.
 */
export function getUserRole(): string {
  const payload = decodeJwtPayload();
  return payload?.role ?? '';
}

/**
 * Kiểm tra có token hợp lệ không (đã đăng nhập chưa).
 */
export function isAuthenticated(): boolean {
  const payload = decodeJwtPayload();
  if (!payload) return false;
  // Kiểm tra token có hết hạn chưa (exp là Unix timestamp tính theo giây)
  if (payload.exp && Date.now() / 1000 > payload.exp) return false;
  return true;
}
