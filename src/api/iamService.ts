/**
 * IAM Service Layer
 * Strict separation of IAM entities (users, roles, permissions).
 */

import { dbStore } from '../shared/data/mockDatabase';
import { User, Role, Permission, ApiResponse } from '../shared/types/hpticket';
import { apiClient, API_ENDPOINTS } from './apiConfig';
import { hasPermission } from '../shared/utils/permissionGuard';

export const iamService = {
  /**
   * Đăng nhập qua Real Spring Boot Backend (POST /api/v1/iam/auth/login)
   * Tự động fallback về Mock Database nếu chọn Offline Mode hoặc Backend mất kết nối.
   */
  async login(username: string, password?: string): Promise<ApiResponse<any>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINTS.IAM.AUTH_LOGIN, {
          username,
          password: password || '123456',
        });
        if (res?.data?.token) {
          localStorage.setItem('hpticket_token', res.data.token);
        }
        return res;
      } catch (err) {
        console.warn('[IAM Service] Backend login failed, falling back to Mock DB:', err);
        throw err;
      }
    }
    const user = dbStore.users.find((u) => u.username === username || u.phone === username);
    if (!user) {
      return { code: 401, message: 'Tài khoản không hợp lệ', data: null };
    }
    dbStore.setActiveUser(user.id);
    return {
      code: 200,
      message: 'Đăng nhập thành công (Mock Mode)',
      data: { token: `MOCK_JWT_${user.id}`, user },
    };
  },

  /**
   * Lấy thông tin tài khoản hiện tại (GET /api/v1/iam/auth/me)
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    if (true) {
      try {
        return await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.IAM.AUTH_ME);
      } catch (err) {
        console.warn('[IAM Service] Backend auth/me failed, fallback to Mock DB');
        throw err;
      }
    }
    return {
      code: 200,
      message: 'Lấy thông tin tài khoản thành công',
      data: dbStore.getActiveUser(),
    };
  },

  async fetchUsers(): Promise<ApiResponse<User[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.IAM.USERS);
        const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        if (list && list.length > 0) {
          dbStore.users = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách người dùng thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[IAM Service] Backend fetchUsers failed, fallback to Mock DB');
        throw err;
      }
    }
    return this.getUsers();
  },

  async fetchRoles(): Promise<ApiResponse<Role[]>> {
    // Không có quyền VIEW_ROLE -> trả về mock data trực tiếp, không gọi API
    if (!hasPermission('VIEW_ROLE')) return this.getRoles();
    try {
      const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.IAM.ROLES);
      const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      if (list && list.length > 0) {
        dbStore.roles = list;
        dbStore.saveToStorage();
      }
      return {
        code: res.code || 200,
        message: res.message || 'Lấy danh sách nhóm quyền thành công',
        data: list,
      };
    } catch (err) {
      console.warn('[IAM Service] Backend fetchRoles failed, fallback to Mock DB');
      throw err;
    }
  },

  async fetchPermissions(): Promise<ApiResponse<Permission[]>> {
    // Không có quyền VIEW_PERMISSION -> trả về mock data trực tiếp, không gọi API
    if (!hasPermission('VIEW_PERMISSION')) return this.getPermissions();
    try {
      const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.IAM.PERMISSIONS);
      const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      if (list && list.length > 0) {
        dbStore.permissions = list;
        dbStore.saveToStorage();
      }
      return {
        code: res.code || 200,
        message: res.message || 'Lấy danh sách quyền chi tiết thành công',
        data: list,
      };
    } catch (err) {
      console.warn('[IAM Service] Backend fetchPermissions failed, fallback to Mock DB');
      throw err;
    }
  },

  getUsers(): ApiResponse<User[]> {
    return {
      code: 200,
      message: 'Lấy danh sách người dùng thành công',
      data: dbStore.users.filter((u) => !u.deleted_at),
    };
  },

  getRoles(): ApiResponse<Role[]> {
    return {
      code: 200,
      message: 'Lấy danh sách nhóm quyền thành công',
      data: dbStore.roles.filter((r) => !r.deleted_at),
    };
  },

  getPermissions(): ApiResponse<Permission[]> {
    return {
      code: 200,
      message: 'Lấy danh sách quyền chi tiết thành công',
      data: dbStore.permissions,
    };
  },

  async createUser(userDto: Omit<User, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<ApiResponse<User>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<User>>(API_ENDPOINTS.IAM.USERS, userDto);
        if (res?.data) {
          dbStore.users.push(res.data);
          dbStore.logAudit('CREATE', 'users', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[IAM Service] Backend createUser failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();

    const newUser: User = {
      ...userDto,
      id: `usr-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };

    dbStore.users.push(newUser);
    dbStore.logAudit('CREATE', 'users', newUser.id, null, newUser);
    dbStore.saveToStorage();

    return {
      code: 201,
      message: 'Tạo tài khoản người dùng thành công',
      data: newUser,
    };
  },

  async updateUser(id: string, userDto: Partial<User>): Promise<ApiResponse<User>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<User>>(API_ENDPOINTS.IAM.USER_DETAIL(id), userDto);
        if (res?.data) {
          const idx = dbStore.users.findIndex((u) => u.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.users[idx] };
            dbStore.users[idx] = res.data;
            dbStore.logAudit('UPDATE', 'users', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[IAM Service] Backend updateUser failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const userIndex = dbStore.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return { code: 404, message: 'Không tìm thấy người dùng', data: null as any };
    }

    const oldUser = { ...dbStore.users[userIndex] };
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();

    const updatedUser: User = {
      ...oldUser,
      ...userDto,
      updated_at: now,
      updated_by: activeUser.username,
    };

    dbStore.users[userIndex] = updatedUser;
    dbStore.logAudit('UPDATE', 'users', id, oldUser, updatedUser);
    dbStore.saveToStorage();

    return {
      code: 200,
      message: 'Cập nhật thông tin tài khoản thành công',
      data: updatedUser,
    };
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<ApiResponse<User>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<User>>(
          API_ENDPOINTS.IAM.USER_STATUS(id),
          undefined,
          { params: { isActive: isActive } }
        );
        if (res?.data) {
          const idx = dbStore.users.findIndex((u) => u.id === id);
          if (idx !== -1) {
            dbStore.users[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[IAM Service] Backend updateUserStatus failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const userIndex = dbStore.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return { code: 404, message: 'Không tìm thấy người dùng', data: null as any };
    }
    dbStore.users[userIndex].is_active = isActive;
    dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Cập nhật trạng thái thành công',
      data: dbStore.users[userIndex],
    };
  },


  async deleteUser(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.IAM.USER_DETAIL(id));
      } catch (err) {
        console.warn('[IAM Service] Backend deleteUser failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.users.find(u => u.id === id);
    if (old) dbStore.logAudit('DELETE', 'users', id, old, null);
    dbStore.users = dbStore.users.filter((u) => u.id !== id);
    dbStore.saveToStorage();
    return { code: 200, message: 'Xóa người dùng thành công', data: undefined };
  },

  async createRole(roleDto: Omit<Role, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<ApiResponse<Role>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<Role>>(API_ENDPOINTS.IAM.ROLES, roleDto);
        if (res?.data) {
          if (roleDto.permissions && roleDto.permissions.length > 0) {
            await apiClient.post(API_ENDPOINTS.IAM.ROLE_PERMISSIONS(res.data.id), roleDto.permissions);
            res.data.permissions = roleDto.permissions;
          }
          dbStore.roles.push(res.data);
          dbStore.logAudit('CREATE', 'roles', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[IAM Service] Backend createRole failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();

    const newRole: Role = {
      ...roleDto,
      id: `role-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };

    dbStore.roles.push(newRole);
    dbStore.logAudit('CREATE', 'roles', newRole.id, null, newRole);
    dbStore.saveToStorage();

    return {
      code: 201,
      message: 'Tạo nhóm quyền mới thành công',
      data: newRole,
    };
  },

  async updateRole(id: string, roleDto: Partial<Role>): Promise<ApiResponse<Role>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<Role>>(API_ENDPOINTS.IAM.ROLE_DETAIL(id), roleDto);
        if (res?.data) {
          if (roleDto.permissions) {
            await apiClient.post(API_ENDPOINTS.IAM.ROLE_PERMISSIONS(id), roleDto.permissions);
            res.data.permissions = roleDto.permissions;
          }
          const idx = dbStore.roles.findIndex((r) => r.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.roles[idx] };
            dbStore.roles[idx] = res.data;
            dbStore.logAudit('UPDATE', 'roles', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[IAM Service] Backend updateRole failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.roles.findIndex((r) => r.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy nhóm quyền', data: null as any };
    }
    const old = { ...dbStore.roles[idx] };
    const now = new Date().toISOString();
    const updated: Role = { ...old, ...roleDto, updated_at: now };
    dbStore.roles[idx] = updated;
    dbStore.logAudit('UPDATE', 'roles', id, old, updated);
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật nhóm quyền thành công', data: updated };
  },

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.IAM.ROLE_DETAIL(id));
      } catch (err) {
        console.warn('[IAM Service] Backend deleteRole failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.roles.find(r => r.id === id);
    if (old) dbStore.logAudit('DELETE', 'roles', id, old, null);
    dbStore.roles = dbStore.roles.filter((r) => r.id !== id);
    dbStore.saveToStorage();
    return { code: 200, message: 'Xóa nhóm quyền thành công', data: undefined };
  },

  async updateRoleStatus(id: string, isActive: boolean): Promise<ApiResponse<Role>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<Role>>(
          API_ENDPOINTS.IAM.ROLE_STATUS(id),
          undefined,
          { params: { isActive: isActive } }
        );
        if (res?.data) {
          const idx = dbStore.roles.findIndex((r) => r.id === id);
          if (idx !== -1) {
            dbStore.roles[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[IAM Service] Backend updateRoleStatus failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.roles.findIndex((r) => r.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy nhóm quyền', data: null as any };
    }
    dbStore.roles[idx].is_active = isActive;
    dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Cập nhật trạng thái thành công',
      data: dbStore.roles[idx],
    };
  },

  async fetchSystemLogs(page: number = 0, size: number = 20, fromDate?: string, toDate?: string): Promise<ApiResponse<any>> {
    // Không có quyền VIEW_SYSTEM_LOG -> trả về empty, không gọi API
    if (!hasPermission('VIEW_SYSTEM_LOG')) {
      return { code: 200, message: 'Không có quyền xem log', data: { content: [], totalElements: 0, totalPages: 0 } };
    }
    try {
      let url = `${API_ENDPOINTS.IAM.SYSTEM_LOGS}?page=${page}&size=${size}&sort=created_at,desc`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      const res = await apiClient.get<ApiResponse<any>>(url);
      if (res?.data) return res;
    } catch (err) {
      console.warn('[IAM Service] Backend fetchSystemLogs failed, fallback to Mock DB:', err);
      throw err;
    }
    return {
      code: 200,
      message: 'Lấy nhật ký hệ thống thành công (Mock DB)',
      data: {
        content: dbStore.systemLogs,
        totalElements: dbStore.systemLogs.length,
        totalPages: 1,
      },
    };
  },
};
