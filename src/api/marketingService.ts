/**
 * Marketing & Partner Service Layer
 * Integrated with Spring Boot Backend (/api/v1/marketing)
 * Provides CRUD for Customer Groups, Customer Sources, Companies, Promotions, and Holidays.
 */

import { dbStore } from '../shared/data/mockDatabase';
import { CustomerGroup, CustomerSource, Company, Holiday, Promotion, ApiResponse } from '../shared/types/hpticket';
import { apiClient, API_ENDPOINTS} from './apiConfig';

/**
 * Helper to normalize paginated or list responses from Spring Boot Backend.
 */
function normalizeList<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

export const marketingService = {
  // ==========================================
  // 1. CUSTOMER GROUPS (/marketing/customer-groups)
  // ==========================================

  async fetchCustomerGroups(): Promise<ApiResponse<CustomerGroup[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS);
        const list = normalizeList<CustomerGroup>(res.data);
        if (list && list.length > 0) {
          dbStore.customerGroups = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách nhóm khách hàng thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Marketing Service] Backend fetchCustomerGroups failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return {
      code: 200,
      message: 'Lấy danh sách nhóm khách hàng thành công (Mock DB)',
      data: dbStore.customerGroups.filter((g) => !g.deleted_at),
    };
  },

  async createCustomerGroup(
    dto: Omit<CustomerGroup, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<CustomerGroup>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<CustomerGroup>>(API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS, dto);
        if (res?.data) {
          dbStore.customerGroups.push(res.data);
          dbStore.logAudit('CREATE', 'customer_groups', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend createCustomerGroup failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newGroup: CustomerGroup = {
      ...dto,
      id: `grp-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.customerGroups.push(newGroup);
          dbStore.logAudit('CREATE', 'customer_groups', newGroup.id, null, newGroup);
          dbStore.saveToStorage();
    return {
      code: 201,
      message: 'Tạo nhóm khách hàng thành công',
      data: newGroup,
    };
  },


  async updateCustomerGroup(id: string, dto: Partial<CustomerGroup>): Promise<ApiResponse<CustomerGroup>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<CustomerGroup>>(API_ENDPOINTS.MARKETING.CUSTOMER_GROUP_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.customerGroups.findIndex((g) => g.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.customerGroups[idx] };
            dbStore.customerGroups[idx] = res.data;
            dbStore.logAudit('UPDATE', 'customer_groups', res.data.id || id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend updateCustomerGroup failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.customerGroups.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Customer group not found');
    const oldGroup = { ...dbStore.customerGroups[idx] };
    const updatedGroup = {
      ...oldGroup,
      ...dto,
      updated_at: new Date().toISOString(),
      updated_by: dbStore.getActiveUser().username,
    };
    dbStore.customerGroups[idx] = updatedGroup;
    dbStore.logAudit('UPDATE', 'customer_groups', id, oldGroup, updatedGroup);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Cập nhật nhóm khách hàng thành công',
      data: updatedGroup,
    };
  },

  async updateCustomerGroupStatus(id: string, isActive: boolean): Promise<ApiResponse<CustomerGroup>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<CustomerGroup>>(
          `${API_ENDPOINTS.MARKETING.CUSTOMER_GROUP_STATUS(id)}?isActive=${isActive}`
        );
        if (res?.data) {
          const idx = dbStore.customerGroups.findIndex((g) => g.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.customerGroups[idx] };
            dbStore.customerGroups[idx] = res.data;
            dbStore.logAudit('UPDATE', 'customer_groups', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend updateCustomerGroupStatus failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.customerGroups.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Customer group not found');
    const oldGroup = { ...dbStore.customerGroups[idx] };
    const updatedGroup = {
      ...oldGroup,
      is_active: isActive,
      updated_at: new Date().toISOString(),
      updated_by: dbStore.getActiveUser().username,
    };
    dbStore.customerGroups[idx] = updatedGroup;
    dbStore.logAudit('UPDATE', 'customer_groups', id, oldGroup, updatedGroup);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: isActive ? 'Đã bật sử dụng nhóm khách hàng' : 'Đã tắt sử dụng nhóm khách hàng',
      data: updatedGroup,
    };
  },
  async deleteCustomerGroup(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.MARKETING.CUSTOMER_GROUP_DETAIL(id));
      } catch (err) {
        console.warn('[Marketing Service] Backend deleteCustomerGroup failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.customerGroups.find(x => x.id === id);
    if (old) dbStore.logAudit('DELETE', 'customer_groups', id, old, null);
    dbStore.customerGroups = dbStore.customerGroups.filter((g) => g.id !== id);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Xóa nhóm khách hàng thành công',
      data: undefined,
    };
  },

  // ==========================================
  // 2. CUSTOMER SOURCES (/marketing/customer-sources)
  // ==========================================

  async fetchCustomerSources(): Promise<ApiResponse<CustomerSource[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCES);
        const list = normalizeList<CustomerSource>(res.data);
        if (list && list.length > 0) {
          dbStore.customerSources = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách nguồn khách thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Marketing Service] Backend fetchCustomerSources failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return {
      code: 200,
      message: 'Lấy danh sách nguồn khách thành công (Mock DB)',
      data: dbStore.customerSources.filter((s) => !s.deleted_at),
    };
  },

  async createCustomerSource(
    dto: Omit<CustomerSource, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<CustomerSource>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<CustomerSource>>(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCES, dto);
        if (res?.data) {
          dbStore.customerSources.push(res.data);
          dbStore.logAudit('CREATE', 'customer_sources', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend createCustomerSource failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newSource: CustomerSource = {
      ...dto,
      id: `src-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.customerSources.push(newSource);
          dbStore.logAudit('CREATE', 'customer_sources', newSource.id, null, newSource);
          dbStore.saveToStorage();
    return {
      code: 201,
      message: 'Tạo nguồn khách thành công',
      data: newSource,
    };
  },

  async updateCustomerSource(id: string, dto: Partial<CustomerSource>): Promise<ApiResponse<CustomerSource>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<CustomerSource>>(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCE_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.customerSources.findIndex((s) => s.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.customerSources[idx] };
            dbStore.customerSources[idx] = res.data;
            dbStore.logAudit('UPDATE', 'customer_sources', res.data.id || id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend updateCustomerSource failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.customerSources.findIndex((s) => s.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy nguồn khách', data: null as any };
    }
    const old = { ...dbStore.customerSources[idx] };
    const now = new Date().toISOString();
    const updated: CustomerSource = {
      ...old,
      ...dto,
      updated_at: now,
    };
    dbStore.customerSources[idx] = updated;
            dbStore.logAudit('UPDATE', 'customer_sources', updated.id || id, old, updated);
            dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Cập nhật nguồn khách thành công',
      data: updated,
    };
  },


  async updateCustomerSourceStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<any>>(
          `${API_ENDPOINTS.MARKETING.CUSTOMER_SOURCE_STATUS(id)}?isActive=${isActive}`
        );
        if (res?.data) {
          const idx = dbStore.customerSources.findIndex((g: any) => g.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.customerSources[idx] };
            dbStore.customerSources[idx] = res.data;
            dbStore.logAudit('UPDATE', 'customer_sources', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn(`[Marketing Service] Backend updateCustomerSourceStatus failed, fallback to Mock DB:`, err);
        throw err;
      }
    }
    const idx = dbStore.customerSources.findIndex((g: any) => g.id === id);
    if (idx === -1) throw new Error('CustomerSource not found');
    const oldItem = { ...dbStore.customerSources[idx] };
    const updatedItem = {
      ...oldItem,
      is_active: isActive,
      updated_at: new Date().toISOString(),
      updated_by: dbStore.getActiveUser().username,
    };
    dbStore.customerSources[idx] = updatedItem;
    dbStore.logAudit('UPDATE', 'customer_sources', id, oldItem, updatedItem);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: isActive ? 'Đã bật sử dụng nguồn khách hàng' : 'Đã tắt sử dụng nguồn khách hàng',
      data: updatedItem,
    };
  },

  async deleteCustomerSource(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCE_DETAIL(id));
      } catch (err) {
        console.warn('[Marketing Service] Backend deleteCustomerSource failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.customerSources.find(x => x.id === id);
    if (old) dbStore.logAudit('DELETE', 'customer_sources', id, old, null);
    dbStore.customerSources = dbStore.customerSources.filter((s) => s.id !== id);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Xóa nguồn khách thành công',
      data: undefined,
    };
  },

  // ==========================================
  // 3. COMPANIES (/marketing/companies)
  // ==========================================

  async fetchCompanies(): Promise<ApiResponse<Company[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.MARKETING.COMPANIES);
        const list = normalizeList<Company>(res.data);
        if (list && list.length > 0) {
          dbStore.companies = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách công ty thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Marketing Service] Backend fetchCompanies failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return {
      code: 200,
      message: 'Lấy danh sách công ty thành công (Mock DB)',
      data: dbStore.companies.filter((c) => !c.deleted_at),
    };
  },

  async createCompany(
    dto: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<Company>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<Company>>(API_ENDPOINTS.MARKETING.COMPANIES, dto);
        if (res?.data) {
          dbStore.companies.push(res.data);
          dbStore.logAudit('CREATE', 'companies', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend createCompany failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newComp: Company = {
      ...dto,
      id: `cmp-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.companies.push(newComp);
          dbStore.logAudit('CREATE', 'companies', newComp.id, null, newComp);
          dbStore.saveToStorage();
    return {
      code: 201,
      message: 'Tạo công ty thành công',
      data: newComp,
    };
  },

  async updateCompany(id: string, dto: Partial<Company>): Promise<ApiResponse<Company>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<Company>>(API_ENDPOINTS.MARKETING.COMPANY_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.companies.findIndex((c) => c.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.companies[idx] };
            dbStore.companies[idx] = res.data;
            dbStore.logAudit('UPDATE', 'companies', res.data.id || id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend updateCompany failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.companies.findIndex((c) => c.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy công ty', data: null as any };
    }
    const old = { ...dbStore.companies[idx] };
    const now = new Date().toISOString();
    const updated: Company = {
      ...old,
      ...dto,
      updated_at: now,
    };
    dbStore.companies[idx] = updated;
            dbStore.logAudit('UPDATE', 'companies', updated.id || id, old, updated);
            dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Cập nhật công ty thành công',
      data: updated,
    };
  },


  async updateCompanyStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<any>>(
          `${API_ENDPOINTS.MARKETING.COMPANY_STATUS(id)}?isActive=${isActive}`
        );
        if (res?.data) {
          const idx = dbStore.companies.findIndex((g: any) => g.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.companies[idx] };
            dbStore.companies[idx] = res.data;
            dbStore.logAudit('UPDATE', 'companies', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn(`[Marketing Service] Backend updateCompanyStatus failed, fallback to Mock DB:`, err);
        throw err;
      }
    }
    const idx = dbStore.companies.findIndex((g: any) => g.id === id);
    if (idx === -1) throw new Error('Company not found');
    const oldItem = { ...dbStore.companies[idx] };
    const updatedItem = {
      ...oldItem,
      is_active: isActive,
      updated_at: new Date().toISOString(),
      updated_by: dbStore.getActiveUser().username,
    };
    dbStore.companies[idx] = updatedItem;
    dbStore.logAudit('UPDATE', 'companies', id, oldItem, updatedItem);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: isActive ? 'Đã bật sử dụng công ty du lịch' : 'Đã tắt sử dụng công ty du lịch',
      data: updatedItem,
    };
  },

  async deleteCompany(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.MARKETING.COMPANY_DETAIL(id));
      } catch (err) {
        console.warn('[Marketing Service] Backend deleteCompany failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.companies.find(x => x.id === id);
    if (old) dbStore.logAudit('DELETE', 'companies', id, old, null);
    dbStore.companies = dbStore.companies.filter((c) => c.id !== id);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Xóa công ty thành công',
      data: undefined,
    };
  },

  // ==========================================
  // 4. PROMOTIONS (/marketing/promotions)
  // ==========================================

  async fetchPromotions(): Promise<ApiResponse<Promotion[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.MARKETING.PROMOTIONS);
        const list = normalizeList<Promotion>(res.data);
        if (list && list.length > 0) {
          dbStore.promotions = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách khuyến mại thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Marketing Service] Backend fetchPromotions failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return {
      code: 200,
      message: 'Lấy danh sách khuyến mại thành công (Mock DB)',
      data: dbStore.promotions.filter((p) => !p.deleted_at),
    };
  },

  async createPromotion(
    dto: Omit<Promotion, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<Promotion>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<Promotion>>(API_ENDPOINTS.MARKETING.PROMOTIONS, dto);
        if (res?.data) {
          dbStore.promotions.push(res.data);
          dbStore.logAudit('CREATE', 'promotions', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend createPromotion failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newPromo: Promotion = {
      ...dto,
      id: `pro-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.promotions.push(newPromo);
          dbStore.logAudit('CREATE', 'promotions', newPromo.id, null, newPromo);
          dbStore.saveToStorage();
    return {
      code: 201,
      message: 'Tạo khuyến mại thành công',
      data: newPromo,
    };
  },

  async updatePromotion(id: string, dto: Partial<Promotion>): Promise<ApiResponse<Promotion>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<Promotion>>(API_ENDPOINTS.MARKETING.PROMOTION_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.promotions.findIndex((p) => p.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.promotions[idx] };
            dbStore.promotions[idx] = res.data;
            dbStore.logAudit('UPDATE', 'promotions', res.data.id || id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend updatePromotion failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.promotions.findIndex((p) => p.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy khuyến mại', data: null as any };
    }
    const old = { ...dbStore.promotions[idx] };
    const now = new Date().toISOString();
    const updated: Promotion = {
      ...old,
      ...dto,
      updated_at: now,
    };
    dbStore.promotions[idx] = updated;
            dbStore.logAudit('UPDATE', 'promotions', updated.id || id, old, updated);
            dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Cập nhật khuyến mại thành công',
      data: updated,
    };
  },


  async updatePromotionStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<any>>(
          `${API_ENDPOINTS.MARKETING.PROMOTION_STATUS(id)}?isActive=${isActive}`
        );
        if (res?.data) {
          const idx = dbStore.promotions.findIndex((g: any) => g.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.promotions[idx] };
            dbStore.promotions[idx] = res.data;
            dbStore.logAudit('UPDATE', 'promotions', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn(`[Marketing Service] Backend updatePromotionStatus failed, fallback to Mock DB:`, err);
        throw err;
      }
    }
    const idx = dbStore.promotions.findIndex((g: any) => g.id === id);
    if (idx === -1) throw new Error('Promotion not found');
    const oldItem = { ...dbStore.promotions[idx] };
    const updatedItem = {
      ...oldItem,
      is_active: isActive,
      updated_at: new Date().toISOString(),
      updated_by: dbStore.getActiveUser().username,
    };
    dbStore.promotions[idx] = updatedItem;
    dbStore.logAudit('UPDATE', 'promotions', id, oldItem, updatedItem);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: isActive ? 'Đã bật sử dụng chương trình khuyến mãi' : 'Đã tắt sử dụng chương trình khuyến mãi',
      data: updatedItem,
    };
  },

  async deletePromotion(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.MARKETING.PROMOTION_DETAIL(id));
      } catch (err) {
        console.warn('[Marketing Service] Backend deletePromotion failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.promotions.find(x => x.id === id);
    if (old) dbStore.logAudit('DELETE', 'promotions', id, old, null);
    dbStore.promotions = dbStore.promotions.filter((p) => p.id !== id);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Xóa khuyến mại thành công',
      data: undefined,
    };
  },

  // ==========================================
  // 5. HOLIDAYS (/marketing/holidays)
  // ==========================================

  async fetchHolidays(): Promise<ApiResponse<Holiday[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.MARKETING.HOLIDAYS);
        const list = normalizeList<Holiday>(res.data);
        if (list && list.length > 0) {
          dbStore.holidays = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách ngày lễ thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Marketing Service] Backend fetchHolidays failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return {
      code: 200,
      message: 'Lấy danh sách ngày lễ thành công (Mock DB)',
      data: dbStore.holidays.filter((h) => !h.deleted_at),
    };
  },

  async createHoliday(
    dto: Omit<Holiday, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<Holiday>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<Holiday>>(API_ENDPOINTS.MARKETING.HOLIDAYS, dto);
        if (res?.data) {
          dbStore.holidays.push(res.data);
          dbStore.logAudit('CREATE', 'holidays', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend createHoliday failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newHol: Holiday = {
      ...dto,
      id: `hol-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.holidays.push(newHol);
          dbStore.logAudit('CREATE', 'holidays', newHol.id, null, newHol);
          dbStore.saveToStorage();
    return {
      code: 201,
      message: 'Tạo ngày lễ thành công',
      data: newHol,
    };
  },

  async updateHoliday(id: string, dto: Partial<Holiday>): Promise<ApiResponse<Holiday>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<Holiday>>(API_ENDPOINTS.MARKETING.HOLIDAY_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.holidays.findIndex((h) => h.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.holidays[idx] };
            dbStore.holidays[idx] = res.data;
            dbStore.logAudit('UPDATE', 'holidays', res.data.id || id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Marketing Service] Backend updateHoliday failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.holidays.findIndex((h) => h.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy ngày lễ', data: null as any };
    }
    const old = { ...dbStore.holidays[idx] };
    const now = new Date().toISOString();
    const updated: Holiday = {
      ...old,
      ...dto,
      updated_at: now,
    };
    dbStore.holidays[idx] = updated;
            dbStore.logAudit('UPDATE', 'holidays', updated.id || id, old, updated);
            dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Cập nhật ngày lễ thành công',
      data: updated,
    };
  },


  async updateHolidayStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<any>>(
          `${API_ENDPOINTS.MARKETING.HOLIDAY_STATUS(id)}?isActive=${isActive}`
        );
        if (res?.data) {
          const idx = dbStore.holidays.findIndex((g: any) => g.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.holidays[idx] };
            dbStore.holidays[idx] = res.data;
            dbStore.logAudit('UPDATE', 'holidays', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn(`[Marketing Service] Backend updateHolidayStatus failed, fallback to Mock DB:`, err);
        throw err;
      }
    }
    const idx = dbStore.holidays.findIndex((g: any) => g.id === id);
    if (idx === -1) throw new Error('Holiday not found');
    const oldItem = { ...dbStore.holidays[idx] };
    const updatedItem = {
      ...oldItem,
      is_active: isActive,
      updated_at: new Date().toISOString(),
      updated_by: dbStore.getActiveUser().username,
    };
    dbStore.holidays[idx] = updatedItem;
    dbStore.logAudit('UPDATE', 'holidays', id, oldItem, updatedItem);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: isActive ? 'Đã bật sử dụng ngày lễ / đỉnh điểm' : 'Đã tắt sử dụng ngày lễ / đỉnh điểm',
      data: updatedItem,
    };
  },

  async deleteHoliday(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.MARKETING.HOLIDAY_DETAIL(id));
      } catch (err) {
        console.warn('[Marketing Service] Backend deleteHoliday failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.holidays.find(x => x.id === id);
    if (old) dbStore.logAudit('DELETE', 'holidays', id, old, null);
    dbStore.holidays = dbStore.holidays.filter((h) => h.id !== id);
    dbStore.saveToStorage();
    return {
      code: 200,
      message: 'Xóa ngày lễ thành công',
      data: undefined,
    };
  },
};
