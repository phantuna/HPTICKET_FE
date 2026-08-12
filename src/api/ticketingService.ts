/**
 * Ticketing & Access Control Service Layer
 * Server-authoritative turnstile gate scanner pipeline with Pessimistic Locking (@Transactional FOR UPDATE) simulation,
 * Anti-passback/multi-pass pass counter increments, zone matching, and audit logging.
 */

import { dbStore } from '../shared/data/mockDatabase';
import {
  TicketTemplate,
  ControlGate,
  ControlZone,
  TicketZone,
  AudienceType,
  IssuedTicket,
  GateAccessLog,
  ScanStatusResult,
  TicketStatus,
  ApiResponse,
} from '../shared/types/hpticket';
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

export interface GateScanPayload {
  gate_id: string; // control_gate_id
  qr_string: string; // Raw text read from device scanner
}

export interface GateScanResponse {
  result: ScanStatusResult;
  message: string;
  ticket?: IssuedTicket;
  gate?: ControlGate;
  zone?: ControlZone;
  passes_remaining?: number;
  allowed_passes?: number;
  used_passes?: number;
  staff_info?: {
    fullname: string;
    phone: string;
    role_name: string;
    username: string;
    qr_code: string;
  };
}

export const ticketingService = {
  // Synchronous helpers for backward compatibility
  getControlGates(): ApiResponse<ControlGate[]> {
    return {
      code: 200,
      message: 'Lấy danh sách cửa kiểm soát thành công',
      data: dbStore.controlGates.filter((g) => g.is_active),
    };
  },

  getControlZones(): ApiResponse<ControlZone[]> {
    return {
      code: 200,
      message: 'Lấy danh sách khu vực kiểm soát thành công',
      data: dbStore.controlZones.filter((z) => z.is_active),
    };
  },

  getTicketTemplates(): ApiResponse<TicketTemplate[]> {
    return {
      code: 200,
      message: 'Lấy danh sách mẫu vé gốc thành công',
      data: dbStore.ticketTemplates.filter((t) => t.is_active),
    };
  },

  getAccessLogs(): ApiResponse<GateAccessLog[]> {
    return {
      code: 200,
      message: 'Lấy nhật ký qua cổng thành công',
      data: dbStore.gateAccessLogs,
    };
  },

  // =========================================================
  // ASYNC REAL SPRING BOOT BACKEND API METHODS (/api/v1/ticketing)
  // =========================================================

  // 1. CONTROL GATES (/ticketing/gates)
  async fetchControlGates(): Promise<ApiResponse<ControlGate[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TICKETING.GATES);
        const list = normalizeList<ControlGate>(res.data);
        if (list && list.length > 0) {
          dbStore.controlGates = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách cổng kiểm soát thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Ticketing Service] Backend fetchControlGates failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return this.getControlGates();
  },

  async createControlGate(
    dto: Omit<ControlGate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<ControlGate>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<ControlGate>>(API_ENDPOINTS.TICKETING.GATES, dto);
        if (res?.data) {
          dbStore.logAudit('CREATE', 'control_gates', res.data.id, null, res.data);
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend createControlGate failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newGate: ControlGate = {
      ...dto,
      id: `gate-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.controlGates.push(newGate);
    dbStore.logAudit('CREATE', 'control_gates', newGate.id, null, newGate);
    dbStore.saveToStorage();
    return { code: 201, message: 'Tạo cổng kiểm soát thành công', data: newGate };
  },

  async updateControlGate(id: string, dto: Partial<ControlGate>): Promise<ApiResponse<ControlGate>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<ControlGate>>(API_ENDPOINTS.TICKETING.GATE_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.controlGates.findIndex((g) => g.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.controlGates[idx] };
            dbStore.controlGates[idx] = res.data;
            dbStore.logAudit('UPDATE', 'control_gates', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateControlGate failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.controlGates.findIndex((g) => g.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy cổng kiểm soát', data: null as any };
    }
    const old = { ...dbStore.controlGates[idx] };
    const now = new Date().toISOString();
    const updated: ControlGate = { ...old, ...dto, updated_at: now };
    dbStore.controlGates[idx] = updated;
    dbStore.logAudit('UPDATE', 'control_gates', id, old, updated);
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật cổng kiểm soát thành công', data: updated };
  },

  async deleteControlGate(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.TICKETING.GATE_DETAIL(id));
      } catch (err) {
        console.warn('[Ticketing Service] Backend deleteControlGate failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.controlGates.find(g => g.id === id);
    if (old) dbStore.logAudit('DELETE', 'control_gates', id, old, null);
    dbStore.controlGates = dbStore.controlGates.filter((g) => g.id !== id);
    dbStore.saveToStorage();
    return { code: 200, message: 'Xóa cổng kiểm soát thành công', data: undefined };
  },

  async updateControlGateStatus(id: string, isActive: boolean): Promise<ApiResponse<ControlGate>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<ControlGate>>(
          API_ENDPOINTS.TICKETING.GATE_STATUS(id),
          undefined,
          { params: { isActive } }
        );
        if (res?.data) {
          const idx = dbStore.controlGates.findIndex((g) => g.id === id);
          if (idx !== -1) {
            dbStore.controlGates[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateControlGateStatus failed:', err);
        throw err;
      }
    }
    const idx = dbStore.controlGates.findIndex((g) => g.id === id);
    if (idx === -1) return { code: 404, message: 'Not found', data: null as any };
    dbStore.controlGates[idx].is_active = isActive;
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật trạng thái thành công', data: dbStore.controlGates[idx] };
  },


  // 2. CONTROL ZONES (/ticketing/control-zones)
  async fetchControlZones(): Promise<ApiResponse<ControlZone[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TICKETING.CONTROL_ZONES);
        const list = normalizeList<ControlZone>(res.data);
        if (list && list.length > 0) {
          dbStore.controlZones = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách khu vực kiểm soát thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Ticketing Service] Backend fetchControlZones failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return this.getControlZones();
  },

  async createControlZone(
    dto: Omit<ControlZone, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<ControlZone>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<ControlZone>>(API_ENDPOINTS.TICKETING.CONTROL_ZONES, dto);
        if (res?.data) {
          dbStore.logAudit('CREATE', 'control_zones', res.data.id, null, res.data);
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend createControlZone failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newZone: ControlZone = {
      ...dto,
      id: `czone-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.controlZones.push(newZone);
    dbStore.logAudit('CREATE', 'control_zones', newZone.id, null, newZone);
    dbStore.saveToStorage();
    return { code: 201, message: 'Tạo khu vực kiểm soát thành công', data: newZone };
  },

  async updateControlZone(id: string, dto: Partial<ControlZone>): Promise<ApiResponse<ControlZone>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<ControlZone>>(API_ENDPOINTS.TICKETING.CONTROL_ZONE_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.controlZones.findIndex((z) => z.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.controlZones[idx] };
            dbStore.controlZones[idx] = res.data;
            dbStore.logAudit('UPDATE', 'control_zones', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateControlZone failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.controlZones.findIndex((z) => z.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy khu vực kiểm soát', data: null as any };
    }
    const old = { ...dbStore.controlZones[idx] };
    const now = new Date().toISOString();
    const updated: ControlZone = { ...old, ...dto, updated_at: now };
    dbStore.controlZones[idx] = updated;
    dbStore.logAudit('UPDATE', 'control_zones', id, old, updated);
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật khu vực kiểm soát thành công', data: updated };
  },

  async deleteControlZone(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.TICKETING.CONTROL_ZONE_DETAIL(id));
      } catch (err) {
        console.warn('[Ticketing Service] Backend deleteControlZone failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.controlZones.find((z) => z.id === id);
    if (old) dbStore.logAudit('DELETE', 'control_zones', id, old, null);
    dbStore.controlZones = dbStore.controlZones.filter((z) => z.id !== id);
    dbStore.saveToStorage();
    return { code: 200, message: 'Xóa khu vực kiểm soát thành công', data: undefined };
  },

  async updateControlZoneStatus(id: string, isActive: boolean): Promise<ApiResponse<ControlZone>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<ControlZone>>(
          API_ENDPOINTS.TICKETING.CONTROL_ZONE_STATUS(id),
          undefined,
          { params: { isActive } }
        );
        if (res?.data) {
          const idx = dbStore.controlZones.findIndex((z) => z.id === id);
          if (idx !== -1) {
            dbStore.controlZones[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateControlZoneStatus failed:', err);
        throw err;
      }
    }
    const idx = dbStore.controlZones.findIndex((z) => z.id === id);
    if (idx === -1) return { code: 404, message: 'Not found', data: null as any };
    dbStore.controlZones[idx].is_active = isActive;
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật trạng thái thành công', data: dbStore.controlZones[idx] };
  },


  // 3. TICKET TEMPLATES (/ticketing/templates)
  async fetchTicketTemplates(): Promise<ApiResponse<TicketTemplate[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TICKETING.TEMPLATES);
        const list = normalizeList<TicketTemplate>(res.data);
        if (list && list.length > 0) {
          dbStore.ticketTemplates = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách mẫu vé thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Ticketing Service] Backend fetchTicketTemplates failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return this.getTicketTemplates();
  },

  async createTicketTemplate(
    dto: Omit<TicketTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<TicketTemplate>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<TicketTemplate>>(API_ENDPOINTS.TICKETING.TEMPLATES, dto);
        if (res?.data) {
          dbStore.logAudit('CREATE', 'ticket_templates', res.data.id, null, res.data);
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend createTicketTemplate failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newTpl: TicketTemplate = {
      ...dto,
      id: `tpl-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.ticketTemplates.push(newTpl);
    dbStore.logAudit('CREATE', 'ticket_templates', newTpl.id, null, newTpl);
    dbStore.saveToStorage();
    return { code: 201, message: 'Tạo mẫu vé thành công', data: newTpl };
  },

  async updateTicketTemplate(id: string, dto: Partial<TicketTemplate>): Promise<ApiResponse<TicketTemplate>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<TicketTemplate>>(API_ENDPOINTS.TICKETING.TEMPLATE_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.ticketTemplates.findIndex((t) => t.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.ticketTemplates[idx] };
            dbStore.ticketTemplates[idx] = res.data;
            dbStore.logAudit('UPDATE', 'ticket_templates', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateTicketTemplate failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const idx = dbStore.ticketTemplates.findIndex((t) => t.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy mẫu vé', data: null as any };
    }
    const old = { ...dbStore.ticketTemplates[idx] };
    const now = new Date().toISOString();
    const updated: TicketTemplate = { ...old, ...dto, updated_at: now };
    dbStore.ticketTemplates[idx] = updated;
    dbStore.logAudit('UPDATE', 'ticket_templates', id, old, updated);
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật mẫu vé thành công', data: updated };
  },

  async deleteTicketTemplate(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.TICKETING.TEMPLATE_DETAIL(id));
      } catch (err) {
        console.warn('[Ticketing Service] Backend deleteTicketTemplate failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    const old = dbStore.ticketTemplates.find((t) => t.id === id);
    if (old) dbStore.logAudit('DELETE', 'ticket_templates', id, old, null);
    dbStore.ticketTemplates = dbStore.ticketTemplates.filter((t) => t.id !== id);
    dbStore.saveToStorage();
    return { code: 200, message: 'Xóa mẫu vé thành công', data: undefined };
  },

  async updateTicketTemplateStatus(id: string, isActive: boolean): Promise<ApiResponse<TicketTemplate>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<TicketTemplate>>(
          API_ENDPOINTS.TICKETING.TEMPLATE_STATUS(id),
          undefined,
          { params: { isActive } }
        );
        if (res?.data) {
          const idx = dbStore.ticketTemplates.findIndex((t) => t.id === id);
          if (idx !== -1) {
            dbStore.ticketTemplates[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateTicketTemplateStatus failed:', err);
        throw err;
      }
    }
    const idx = dbStore.ticketTemplates.findIndex((t) => t.id === id);
    if (idx === -1) return { code: 404, message: 'Not found', data: null as any };
    dbStore.ticketTemplates[idx].is_active = isActive;
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật trạng thái thành công', data: dbStore.ticketTemplates[idx] };
  },


  // 3.8. TICKET ZONES (/ticketing/zones)
  async fetchTicketZones(): Promise<ApiResponse<TicketZone[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TICKETING.ZONES);
        const list = normalizeList<TicketZone>(res.data).map((item: any) => ({
          ...item,
          control_zone_id: item.control_zone_id || item.zone_id,
          zone_id: item.zone_id || item.control_zone_id,
        }));
        if (list && list.length > 0) {
          dbStore.ticketZones = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách khu vực vé thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Ticketing Service] Backend fetchTicketZones failed:', err);
        throw err;
      }
    }
    const list = dbStore.ticketZones.map((item: any) => ({
      ...item,
      control_zone_id: item.control_zone_id || item.zone_id,
      zone_id: item.zone_id || item.control_zone_id,
    }));
    return { code: 200, message: 'Mock', data: list };
  },

  async createTicketZone(
    dto: Omit<TicketZone, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<TicketZone>> {
    const payload: any = {
      ...dto,
      zone_ids: (dto as any).zone_ids || [(dto as any).zone_id || (dto as any).control_zone_id].filter(Boolean),
    };
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<TicketZone>>(API_ENDPOINTS.TICKETING.ZONES, payload);
        if (res?.data) {
          dbStore.logAudit('CREATE', 'ticket_zones', res.data.id, null, res.data);
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend createTicketZone failed:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const newZone: TicketZone = {
      ...payload,
      id: `tzone-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: 'admin',
      updated_by: 'admin',
    };
    dbStore.ticketZones.push(newZone);
    dbStore.logAudit('CREATE', 'ticket_zones', newZone.id, null, newZone);
    dbStore.saveToStorage();
    return { code: 201, message: 'Tạo khu vực vé thành công', data: newZone };
  },

  async updateTicketZone(id: string, dto: Partial<TicketZone>): Promise<ApiResponse<TicketZone>> {
    const payload: any = {
      ...dto,
      zone_ids: (dto as any).zone_ids || [(dto as any).zone_id || (dto as any).control_zone_id].filter(Boolean),
    };
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<TicketZone>>(API_ENDPOINTS.TICKETING.ZONE_DETAIL(id), payload);
        if (res?.data) {
          const old = dbStore.ticketZones.find(z => z.id === id);
          if (old) dbStore.logAudit('UPDATE', 'ticket_zones', id, old, res.data);
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateTicketZone failed:', err);
        throw err;
      }
    }
    const idx = dbStore.ticketZones.findIndex((z) => z.id === id);
    if (idx !== -1) {
      const updated = {
        ...dbStore.ticketZones[idx],
        ...payload,
        zone_ids: payload.zone_ids || (dbStore.ticketZones[idx] as any).zone_ids,
      };
      const oldDto = { ...dbStore.ticketZones[idx] };
      dbStore.ticketZones[idx] = updated;
      dbStore.logAudit('UPDATE', 'ticket_zones', id, oldDto, updated);
      dbStore.saveToStorage();
      return { code: 200, message: 'Cập nhật thành công', data: updated };
    }
    return { code: 200, message: 'Cập nhật thành công', data: dto as TicketZone };
  },

  async deleteTicketZone(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.TICKETING.ZONE_DETAIL(id));
      } catch (err) {
        console.warn('[Ticketing Service] Backend deleteTicketZone failed:', err);
        throw err;
      }
    }
    const old = dbStore.ticketZones.find(z => z.id === id);
    if (old) dbStore.logAudit('DELETE', 'ticket_zones', id, old, null);
    dbStore.ticketZones = dbStore.ticketZones.filter(z => z.id !== id);
    dbStore.saveToStorage();
    return { code: 200, message: 'Xóa khu vực vé thành công', data: undefined };
  },

  async updateTicketZoneStatus(id: string, isActive: boolean): Promise<ApiResponse<TicketZone>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<TicketZone>>(
          API_ENDPOINTS.TICKETING.ZONE_STATUS(id),
          undefined,
          { params: { isActive } }
        );
        if (res?.data) {
          // ticketZones doesn't have is_active but let's just handle it generally
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateTicketZoneStatus failed:', err);
        throw err;
      }
    }
    return { code: 200, message: 'Cập nhật trạng thái thành công', data: null as any };
  },


  // 3.5. AUDIENCE TYPES (/ticketing/audience-types)
  async fetchAudienceTypes(): Promise<ApiResponse<AudienceType[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TICKETING.AUDIENCE_TYPES);
        const list = normalizeList<AudienceType>(res.data);
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách đối tượng thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Ticketing Service] Backend fetchAudienceTypes failed:', err);
        throw err;
      }
    }
    return { code: 200, message: 'Mock', data: [] };
  },

  async createAudienceType(
    dto: Omit<AudienceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<AudienceType>> {
    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<AudienceType>>(API_ENDPOINTS.TICKETING.AUDIENCE_TYPES, dto);
        if (res?.data) {
          dbStore.logAudit('CREATE', 'audience_types', res.data.id, null, res.data);
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend createAudienceType failed:', err);
        throw err;
      }
    }
    const now = new Date().toISOString();
    const newType: AudienceType = {
      ...dto,
      id: `aud-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: 'admin',
      updated_by: 'admin',
    };
    dbStore.audienceTypes.push(newType);
    dbStore.logAudit('CREATE', 'audience_types', newType.id, null, newType);
    dbStore.saveToStorage();
    return { code: 201, message: 'Tạo đối tượng thành công', data: newType };
  },

  async updateAudienceType(id: string, dto: Partial<AudienceType>): Promise<ApiResponse<AudienceType>> {
    if (true) {
      try {
        const res = await apiClient.put<ApiResponse<AudienceType>>(API_ENDPOINTS.TICKETING.AUDIENCE_TYPE_DETAIL(id), dto);
        if (res?.data) {
          const old = dbStore.audienceTypes.find(a => a.id === id);
          if (old) dbStore.logAudit('UPDATE', 'audience_types', id, old, res.data);
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateAudienceType failed:', err);
        throw err;
      }
    }
    const oldDto = dbStore.audienceTypes.find(a => a.id === id) || null;
    dbStore.logAudit('UPDATE', 'audience_types', id, oldDto, dto);
    return { code: 200, message: 'Cập nhật thành công', data: dto as AudienceType };
  },

  async deleteAudienceType(id: string): Promise<ApiResponse<void>> {
    if (true) {
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.TICKETING.AUDIENCE_TYPE_DETAIL(id));
      } catch (err) {
        console.warn('[Ticketing Service] Backend deleteAudienceType failed:', err);
        throw err;
      }
    }
    const old = dbStore.audienceTypes.find(a => a.id === id);
    if (old) dbStore.logAudit('DELETE', 'audience_types', id, old, null);
    dbStore.audienceTypes = dbStore.audienceTypes.filter(a => a.id !== id);
    dbStore.saveToStorage();
    return { code: 200, message: 'Xóa đối tượng thành công', data: undefined };
  },

  async updateAudienceTypeStatus(id: string, isActive: boolean): Promise<ApiResponse<AudienceType>> {
    if (true) {
      try {
        const res = await apiClient.patch<ApiResponse<AudienceType>>(
          API_ENDPOINTS.TICKETING.AUDIENCE_TYPE_STATUS(id),
          undefined,
          { params: { isActive } }
        );
        if (res?.data) {
          const idx = dbStore.audienceTypes.findIndex((a) => a.id === id);
          if (idx !== -1) {
            dbStore.audienceTypes[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend updateAudienceTypeStatus failed:', err);
        throw err;
      }
    }
    const idx = dbStore.audienceTypes.findIndex((a) => a.id === id);
    if (idx === -1) return { code: 404, message: 'Not found', data: null as any };
    dbStore.audienceTypes[idx].is_active = isActive;
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật trạng thái thành công', data: dbStore.audienceTypes[idx] };
  },


  // 4. ACCESS LOGS (/ticketing/access-logs)
  async fetchAccessLogs(): Promise<ApiResponse<GateAccessLog[]>> {
    if (true) {
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.TICKETING.ACCESS_LOGS);
        const list = normalizeList<GateAccessLog>(res.data);
        if (list && list.length > 0) {
          dbStore.gateAccessLogs = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy nhật ký qua cổng thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Ticketing Service] Backend fetchAccessLogs failed, fallback to Mock DB:', err);
        throw err;
      }
    }
    return this.getAccessLogs();
  },

  /**
   * Core Access Control Gate Verification Pipeline
   * Executed sequentially inside @Transactional with Pessimistic Locking (FOR UPDATE)
   */
  async scanGatePass(payload: GateScanPayload): Promise<ApiResponse<GateScanResponse>> {
    const { gate_id, qr_string } = payload;

    if (true) {
      try {
        const res = await apiClient.post<ApiResponse<GateScanResponse>>(API_ENDPOINTS.TICKETING.SCAN, {
          qr_code_string: qr_string,
          gate_id: gate_id,
        });
        return res;
      } catch (err) {
        console.warn('[Ticketing Service] Backend scanGatePass failed, falling back to Mock DB Turnstile logic:', err);
        throw err;
      }
    }

    const now = new Date().toISOString();
    const todayDate = now.split('T')[0];
    const activeUser = dbStore.getActiveUser();

    // 1. Identify Gate Device
    const gate = dbStore.controlGates.find((g) => g.id === gate_id);
    if (!gate || !gate.is_active) {
      return {
        code: 400,
        message: 'Cổng kiểm soát không hoạt động hoặc không tồn tại',
        data: {
          result: ScanStatusResult.DENY_INACTIVE_GATE,
          message: 'LỖI: Thiết bị cổng bị khóa hoặc dừng hoạt động!',
        },
      };
    }

    const gateZone = dbStore.controlZones.find((z) => z.id === gate.control_zone_id);

    // 2. Locate Issued Ticket in DB (Supports both raw text code and JSON payload)
    let cleanQr = (qr_string || '').trim();
    if (cleanQr.startsWith('{') && cleanQr.endsWith('}')) {
      try {
        const parsedObj = JSON.parse(cleanQr);
        cleanQr = parsedObj.ticket_code || parsedObj.qr_code_string || parsedObj.qr_string || parsedObj.code || cleanQr;
      } catch (err) {
        console.warn('Unable to parse JSON QR payload, falling back to raw string', err);
        throw err;
      }
    }

    // 2a. Check if QR belongs to an Employee / Staff Member
    const staffUser = dbStore.users.find(
      (u) =>
        u.qr_code === cleanQr ||
        (cleanQr.startsWith('EMP-') && u.qr_code === cleanQr) ||
        u.username === cleanQr ||
        u.phone === cleanQr ||
        (cleanQr.length > 10 && (cleanQr.includes(u.qr_code) || cleanQr.includes(u.phone) || cleanQr.includes(u.username)))
    );

    if (staffUser) {
      const role = dbStore.roles.find((r) => r.id === staffUser.role_id);
      const roleName = role?.name || 'Cán bộ / Nhân viên';

      if (!staffUser.is_active) {
        const failedLog: GateAccessLog = {
          id: `log-gate-${Date.now()}`,
          issued_ticket_id: `STAFF-${staffUser.id}`,
          control_gate_id: gate.id,
          scan_time: now,
          status_result: ScanStatusResult.DENY_NOT_FOUND,
          ticket_qr: cleanQr,
          gate_name: gate.device_name,
          created_at: now,
          updated_at: now,
          created_by: activeUser.username,
          updated_by: activeUser.username,
        };
        dbStore.gateAccessLogs.unshift(failedLog);
        dbStore.saveToStorage();

        return {
          code: 403,
          message: `Thẻ nhân viên ${staffUser.fullname} đã bị tạm khóa`,
          data: {
            result: ScanStatusResult.DENY_NOT_FOUND,
            message: `TỪ CHỐI: Thẻ nhân viên ${staffUser.fullname} hiện đang bị TẠM KHÓA!`,
            gate,
            zone: gateZone,
            staff_info: {
              fullname: staffUser.fullname,
              phone: staffUser.phone || '0901234567',
              role_name: roleName,
              username: staffUser.username,
              qr_code: staffUser.qr_code,
            },
          },
        };
      }

      // Success Staff Pass
      const successLog: GateAccessLog = {
        id: `log-gate-${Date.now()}`,
        issued_ticket_id: `STAFF-${staffUser.id}`,
        control_gate_id: gate.id,
        scan_time: now,
        status_result: ScanStatusResult.SUCCESS,
        ticket_qr: cleanQr,
        gate_name: gate.device_name,
        created_at: now,
        updated_at: now,
        created_by: activeUser.username,
        updated_by: activeUser.username,
      };
      dbStore.gateAccessLogs.unshift(successLog);
      dbStore.saveToStorage();

      return {
        code: 200,
        message: 'Xác thực thẻ nhân viên thành công',
        data: {
          result: ScanStatusResult.SUCCESS,
          message: `MỜI QUA CỔNG: XÁC THỰC NHÂN VIÊN SỐ [${staffUser.fullname}] - SĐT: ${staffUser.phone || '0901234567'} (${roleName})`,
          gate,
          zone: gateZone,
          staff_info: {
            fullname: staffUser.fullname,
            phone: staffUser.phone || '0901234567',
            role_name: roleName,
            username: staffUser.username,
            qr_code: staffUser.qr_code,
          },
        },
      };
    }

    // 2b. Locate Issued Ticket in DB
    const ticket = dbStore.issuedTickets.find(
      (t) =>
        t.qr_code_string === cleanQr ||
        cleanQr.includes(t.qr_code_string)
    );

    if (!ticket) {
      // Record failed log
      const failedLog: GateAccessLog = {
        id: `log-gate-${Date.now()}`,
        issued_ticket_id: 'UNKNOWN',
        control_gate_id: gate.id,
        scan_time: now,
        status_result: ScanStatusResult.DENY_NOT_FOUND,
        ticket_qr: cleanQr,
        gate_name: gate.device_name,
        created_at: now,
        updated_at: now,
        created_by: activeUser.username,
        updated_by: activeUser.username,
      };
      dbStore.gateAccessLogs.unshift(failedLog);
      dbStore.saveToStorage();

      return {
        code: 404,
        message: 'Mã QR vé không tồn tại trên hệ thống',
        data: {
          result: ScanStatusResult.DENY_NOT_FOUND,
          message: 'TỪ CHỐI: Không tìm thấy vé tương ứng!',
          gate,
          zone: gateZone,
        },
      };
    }

    // 3. Find Ticket Template & Validate Control Zone
    // Chuỗi: ticket -> template -> ticketZone (ticket_zones) -> control_zone_id (control_zones)
    const template = dbStore.ticketTemplates.find((t) => t.id === ticket.ticket_template_id);
    
    // Tìm ticket_zone được gán cho template (qua ticket_name_id hoặc template ID)
    const templateTicketZone = dbStore.ticketZones.find(
      (tz) => tz.id === (template as any)?.ticket_name_id || tz.id === (template as any)?.ticketZone_id
    );
    // control_zone_id của vé (được gán qua ticketZone)
    const ticketControlZoneId = (templateTicketZone as any)?.control_zone_id || (templateTicketZone as any)?.zone_id;
    const ticketControlZone = ticketControlZoneId
      ? dbStore.controlZones.find((z) => z.id === ticketControlZoneId)
      : null;

    // Chỉ kiểm tra nếu vé có gán khu vực (ticketZone) VÀ cổng cũng có zone
    if (ticketControlZoneId && gateZone && ticketControlZoneId !== gate.control_zone_id) {
      const failedLog: GateAccessLog = {
        id: `log-gate-${Date.now()}`,
        issued_ticket_id: ticket.id,
        control_gate_id: gate.id,
        scan_time: now,
        status_result: ScanStatusResult.DENY_WRONG_ZONE,
        ticket_qr: cleanQr,
        gate_name: gate.device_name,
        created_at: now,
        updated_at: now,
        created_by: activeUser.username,
        updated_by: activeUser.username,
      };
      dbStore.gateAccessLogs.unshift(failedLog);
      dbStore.saveToStorage();

      return {
        code: 403,
        message: 'Vé không đúng khu vực kiểm soát của cổng này',
        data: {
          result: ScanStatusResult.DENY_WRONG_ZONE,
          message: `TỪ CHỐI: Vé chỉ hợp lệ tại khu vực [${ticketControlZone?.name || ticketControlZoneId}]. Cổng [${gate.device_name}] thuộc khu vực [${gateZone?.name}] - không khớp!`,
          ticket,
          gate,
          zone: gateZone,
        },
      };
    }

    // 4. Validate Valid Date
    if (ticket.valid_date > todayDate) {
      const failedLog: GateAccessLog = {
        id: `log-gate-${Date.now()}`,
        issued_ticket_id: ticket.id,
        control_gate_id: gate.id,
        scan_time: now,
        status_result: ScanStatusResult.DENY_EXPIRED,
        ticket_qr: cleanQr,
        gate_name: gate.device_name,
        created_at: now,
        updated_at: now,
        created_by: activeUser.username,
        updated_by: activeUser.username,
      };
      dbStore.gateAccessLogs.unshift(failedLog);
      dbStore.saveToStorage();

      return {
        code: 400,
        message: 'Vé chưa đến ngày sử dụng',
        data: {
          result: ScanStatusResult.DENY_EXPIRED,
          message: `TỪ CHỐI: Vé được đặt cho ngày ${ticket.valid_date}, chưa đến ngày sử dụng! (Ngày hiện tại: ${todayDate})`,
          ticket,
          gate,
          zone: gateZone,
        },
      };
    }

    if (ticket.valid_date < todayDate) {
      const failedLog: GateAccessLog = {
        id: `log-gate-${Date.now()}`,
        issued_ticket_id: ticket.id,
        control_gate_id: gate.id,
        scan_time: now,
        status_result: ScanStatusResult.DENY_EXPIRED,
        ticket_qr: cleanQr,
        gate_name: gate.device_name,
        created_at: now,
        updated_at: now,
        created_by: activeUser.username,
        updated_by: activeUser.username,
      };
      dbStore.gateAccessLogs.unshift(failedLog);
      dbStore.saveToStorage();

      return {
        code: 400,
        message: 'Vé đã hết hạn sử dụng',
        data: {
          result: ScanStatusResult.DENY_EXPIRED,
          message: `TỪ CHỐI: Vé đã quá hạn (Ngày hết hạn: ${ticket.valid_date})!`,
          ticket,
          gate,
          zone: gateZone,
        },
      };
    }

    // 5. Check Pass Counter (Pessimistic Locking Simulation & Multi-pass check)
    const isUnlimited = (ticket as any).ticket_type === 'UNLIMITED' || ticket.allowed_passes >= 999999 || ticket.allowed_passes === -1;
    if (!isUnlimited && ticket.used_passes >= ticket.allowed_passes) {
      const failedLog: GateAccessLog = {
        id: `log-gate-${Date.now()}`,
        issued_ticket_id: ticket.id,
        control_gate_id: gate.id,
        scan_time: now,
        status_result: ScanStatusResult.DENY_PASSES_EXHAUSTED,
        ticket_qr: cleanQr,
        gate_name: gate.device_name,
        created_at: now,
        updated_at: now,
        created_by: activeUser.username,
        updated_by: activeUser.username,
      };
      dbStore.gateAccessLogs.unshift(failedLog);
      dbStore.saveToStorage();

      return {
        code: 400,
        message: 'Vé đã hết lượt sử dụng',
        data: {
          result: ScanStatusResult.DENY_PASSES_EXHAUSTED,
          message: `TỪ CHỐI: Vé đã sử dụng tối đa ${ticket.used_passes}/${ticket.allowed_passes} lượt!`,
          ticket,
          gate,
          zone: gateZone,
          passes_remaining: 0,
          allowed_passes: ticket.allowed_passes,
          used_passes: ticket.used_passes,
        },
      };
    }

    // 6. Pessimistic Lock Granted -> Increment Pass Count (@Transactional FOR UPDATE)
    const oldTicketData = { ...ticket };
    ticket.used_passes += 1;
    ticket.updated_at = now;

    if (!isUnlimited && ticket.used_passes >= ticket.allowed_passes) {
      ticket.status = TicketStatus.USED;
    } else {
      ticket.status = TicketStatus.PARTIAL_USED;
    }

    const passesRemaining = ticket.allowed_passes - ticket.used_passes;

    // 7. Write Gate Log & Audit Trail
    const successLog: GateAccessLog = {
      id: `log-gate-${Date.now()}`,
      issued_ticket_id: ticket.id,
      control_gate_id: gate.id,
      scan_time: now,
      status_result: ScanStatusResult.SUCCESS,
      ticket_qr: cleanQr,
      gate_name: gate.device_name,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.gateAccessLogs.unshift(successLog);

    dbStore.logAudit('SCAN_PASS', 'issued_tickets', ticket.id, oldTicketData, {
      used_passes: ticket.used_passes,
      allowed_passes: ticket.allowed_passes,
      status: ticket.status,
      gate_id: gate.id,
    });

    dbStore.saveToStorage();

    return {
      code: 200,
      message: 'Mở cổng thành công! Hợp lệ.',
      data: {
        result: ScanStatusResult.SUCCESS,
        message: `MỜI QUA CỔNG! Quét lượt ${ticket.used_passes}/${ticket.allowed_passes} thành công. (Còn lại: ${passesRemaining} lượt)`,
        ticket,
        gate,
        zone: gateZone,
        passes_remaining: passesRemaining,
        allowed_passes: ticket.allowed_passes,
        used_passes: ticket.used_passes,
      },
    };
  },
};
