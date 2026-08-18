/**
 * usePermission.ts
 *
 * React hook để kiểm tra quyền user trong component.
 * Đọc từ JWT token — tự động cập nhật khi đăng nhập/đăng xuất.
 *
 * Cách dùng:
 *   const { can } = usePermission();
 *   if (can('VIEW_SYSTEM_LOG')) { // hiện menu/nút }
 *
 * Hoàn toàn ĐỘNG — không fix cứng role hay user nào.
 * Chỉ cần BE gán/bỏ permission trong role, FE tự cập nhật sau khi login lại.
 */

import { useMemo } from 'react';
import { hasPermission, hasAnyPermission, getUserPermissions, getUserRole } from '../utils/permissionGuard';

export interface PermissionHook {
  /** Kiểm tra user có 1 quyền cụ thể không */
  can: (perm: string) => boolean;
  /** Kiểm tra user có ít nhất 1 trong danh sách quyền */
  canAny: (...perms: string[]) => boolean;
  /** Danh sách tất cả quyền của user hiện tại (từ JWT) */
  permissions: string[];
  /** Role hiện tại từ JWT */
  role: string;
  /** Shortcut: user có SUPER_ADMIN không */
  isAdmin: boolean;
}

export function usePermission(): PermissionHook {
  return useMemo(() => {
    const permissions = getUserPermissions();
    const role = getUserRole();
    const isSuperAdmin = permissions.includes('SUPER_ADMIN');

    return {
      can: (perm: string) => hasPermission(perm),
      canAny: (...perms: string[]) => hasAnyPermission(...perms),
      permissions,
      role,
      isAdmin: isSuperAdmin || role.toLowerCase().includes('admin'),
    };
  }, []);
}
