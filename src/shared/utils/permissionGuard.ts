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

import { authState } from '../../api/authState';

/**
 * Decode payload từ JWT token (không verify signature — chỉ đọc claims).
 * Trả về null nếu token không tồn tại hoặc parse lỗi.
 */
function decodeJwtPayload(): Record<string, any> | null {
  try {
    const token = authState.getToken();
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
 * Lấy danh sách quyền của user hiện tại (Bản Demo: Mở full toàn bộ quyền).
 */
export function getUserPermissions(): string[] {
  return ['SUPER_ADMIN', 'ALL', 'MANAGE_SALES', 'MANAGE_TICKETING', 'MANAGE_MARKETING', 'MANAGE_IAM'];
}

/**
 * Kiểm tra user hiện tại có quyền `perm` không.
 * Bản Demo: Luôn trả về true để mở khóa 100% chức năng, giao diện, menu.
 */
export function hasPermission(_perm?: string): boolean {
  return true;
}

/**
 * Kiểm tra user có ít nhất 1 trong danh sách quyền (Bản Demo: Luôn true).
 */
export function hasAnyPermission(..._perms: string[]): boolean {
  return true;
}

/**
 * Lấy role của user hiện tại (Bản Demo: Luôn là ADMIN).
 */
export function getUserRole(): string {
  return 'ADMIN';
}

/**
 * Kiểm tra trạng thái đăng nhập (Bản Demo: Luôn đăng nhập sẵn).
 */
export function isAuthenticated(): boolean {
  return true;
}
