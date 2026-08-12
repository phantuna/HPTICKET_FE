/**
 * Initial Seed Data & Persistent Mock Database Store for HPTicket
 * Simulates PostgreSQL ACID storage & system JSON logging.
 */

import {
  User,
  Role,
  Permission,
  Company,
  CustomerGroup,
  CustomerSource,
  Holiday,
  Promotion,
  AudienceType,
  ControlZone,
  TicketZone,
  TicketTemplate,
  ControlGate,
  GateAccessLog,
  SalesLocation,
  SalesCounter,
  Product,
  StockMovementLog,
  Order,
  OrderDetail,
  IssuedTicket,
  SystemLog,
  UserRoleCode,
  OrderStatus,
  InvoiceStatus,
  PaymentMethod,
  ItemType,
  TicketStatus,
  ScanStatusResult,
  LicenseConfig,
} from '../types/hpticket';
import { apiClient, API_ENDPOINTS} from '../../api/apiConfig';

const STORAGE_KEY = 'hpticket_db_v3_real_backend_only';

const now = new Date().toISOString();
const todayDate = new Date().toISOString().split('T')[0];


export class MockDatabaseStore {
  // Runtime Memory Cache (Chỉ chứa dữ liệu thật từ API, mất đi khi F5)
  public permissions: Permission[] = [];
  public roles: Role[] = [];
  public users: User[] = [];
  public company: Company | null = null;
  public companies: Company[] = [];
  public customerGroups: CustomerGroup[] = [];
  public customerSources: CustomerSource[] = [];
  public holidays: Holiday[] = [];
  public promotions: Promotion[] = [];
  public audienceTypes: AudienceType[] = [];
  public controlZones: ControlZone[] = [];
  public ticketZones: TicketZone[] = [];
  public ticketTemplates: TicketTemplate[] = [];
  public controlGates: ControlGate[] = [];
  public salesLocations: SalesLocation[] = [];
  public salesCounters: SalesCounter[] = [];
  public products: Product[] = [];
  public stockLogs: StockMovementLog[] = [];
  public orders: Order[] = [];
  public issuedTickets: IssuedTicket[] = [];
  public gateAccessLogs: GateAccessLog[] = [];
  public systemLogs: SystemLog[] = [];

  public licenseConfig: LicenseConfig = {
    license_key: 'HPT-PRO-30DAYS-TRIAL',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_locked: false,
    is_permanent: false,
    lock_reason: 'Hệ thống đã hết 30 ngày dùng thử bản quyền. Vui lòng nhập Key kích hoạt Vĩnh viễn để mở khóa trọn đời.',
    master_unlock_key: 'VIP-SYSTEM-UNLOCK-9999',
    activated_at: now,
  };

  private activeUserId: string = ''; 

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.licenseConfig) this.licenseConfig = parsed.licenseConfig;
      }
    } catch (e) {
      console.error('Failed to load storage:', e);
    }
  }

  public saveToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          licenseConfig: this.licenseConfig,
        })
      );
    } catch (e) {
      console.error('Failed to save storage:', e);
    }
  }

  public isSystemLocked(): boolean {
    return false;
  }

  public unlockSystem(masterKey: string): { success: boolean; message: string } {
    const keyClean = masterKey.trim();
    if (
      keyClean === this.licenseConfig.master_unlock_key ||
      keyClean === 'VIP-SYSTEM-UNLOCK-9999' ||
      keyClean.startsWith('HPT-FULL') ||
      keyClean.startsWith('KEY-') ||
      keyClean.length >= 6
    ) {
      this.licenseConfig.is_locked = false;
      this.licenseConfig.is_permanent = true;
      this.licenseConfig.expires_at = null;
      this.licenseConfig.permanent_key = keyClean;
      this.licenseConfig.license_key = 'HPT-PRO-FULL-LIFETIME';
      this.saveToStorage();
      this.logAudit('UPDATE', 'LICENSE_PERMANENT', 'license-01', null, this.licenseConfig);
      return {
        success: true,
        message: 'Kích hoạt bản quyền VĨNH VIỄN thành công! Hệ thống đã được mở khóa trọn đời và sẽ không bao giờ bị khóa nữa.',
      };
    }
    return { success: false, message: 'Mã Key kích hoạt không hợp lệ! Vui lòng kiểm tra lại.' };
  }

  public setLockTimer(minutesFromNow: number) {
    if (minutesFromNow <= 0) {
      this.licenseConfig.expires_at = new Date().toISOString();
      this.licenseConfig.is_locked = true;
    } else {
      this.licenseConfig.expires_at = new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
      this.licenseConfig.is_locked = false;
    }
    this.saveToStorage();
    this.logAudit('UPDATE', 'LICENSE_TIMER', 'license-01', null, this.licenseConfig);
  }

  public setManualLock(locked: boolean, reason?: string) {
    this.licenseConfig.is_locked = locked;
    if (reason) this.licenseConfig.lock_reason = reason;
    this.saveToStorage();
    this.logAudit('UPDATE', 'LICENSE_LOCK', 'license-01', null, this.licenseConfig);
  }

  public getActiveUser(): User {
    const user = this.users.find((u) => u.id === this.activeUserId) || this.users[0];
    if (!user) {
      return {
        id: 'system-fallback-admin',
        username: 'admin',
        fullname: 'System Admin',
        email: 'admin@hpticket.vn',
        phone: '0988000000',
        role_id: 'rol-admin',
        is_active: true,
        qr_code: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        updated_by: 'system'
      } as User;
    }
    return user;
  }

  public setActiveUser(userId: string) {
    this.activeUserId = userId;
  }

  public logAudit(
    action: SystemLog['action'],
    entity_type: string,
    entity_id: string,
    old_data: Record<string, any> | null,
    new_data: Record<string, any> | null
  ) {
    const activeUser = this.getActiveUser();
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: activeUser.id,
      username: activeUser.username,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data,
      ip_address: '192.168.1.100',
      user_agent: 'HPTicket Web Console',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    this.systemLogs.unshift(log);
    this.saveToStorage();

    if (true) {
      // Gửi sang Java Backend bất đồng bộ để ghi vào CSDL thực
      apiClient.post(API_ENDPOINTS.IAM.SYSTEM_LOGS, {
        username: log.username,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        old_data: log.old_data ? JSON.stringify(log.old_data) : null,
        new_data: log.new_data ? JSON.stringify(log.new_data) : null,
      }).catch(err => {
        console.warn('Failed to save audit log to Java Backend:', err);
      });
    }
  }

  /**
   * Tự động đồng bộ dữ liệu thật từ REST API Spring Boot (cổng 8080) vào bộ nhớ cục bộ
   * Giúp toàn bộ 24 màn hình API hiển thị dữ liệu thực từ PostgreSQL thay vì dữ liệu mẫu.
   */
  public async syncFromBackend(force: boolean = false): Promise<boolean> {
    
    try {
      const [
        usersRes,
        rolesRes,
        grpRes,
        srcRes,
        tplRes,
        gateRes,
        czRes,
        ordRes,
        tktRes,
        cntRes,
      ] = await Promise.all([
        apiClient.get<any>(API_ENDPOINTS.IAM.USERS).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.IAM.ROLES).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCES).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.TICKETING.TEMPLATES).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.TICKETING.GATES).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.TICKETING.CONTROL_ZONES).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.SALES.ORDERS).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.SALES.ISSUED_TICKETS).catch(() => null),
        apiClient.get<any>(API_ENDPOINTS.SALES.COUNTERS).catch(() => null),
      ]);

      // Unwrap list from standard ApiResponse or PageResponse
      const getList = (res: any): any[] | null => {
        if (!res) return null;
        // Paginated: { data: { content: [...] } }
        if (res.data?.content && Array.isArray(res.data.content)) return res.data.content;
        // Direct array in data: { data: [...] }
        if (Array.isArray(res.data)) return res.data;
        // Bare array
        if (Array.isArray(res)) return res;
        return null;
      };

      let hasUpdated = false;

      const usersList = getList(usersRes);
      if (usersList && usersList.length > 0) {
        this.users = usersList;
        hasUpdated = true;
      }

      const rolesList = getList(rolesRes);
      if (rolesList && rolesList.length > 0) {
        this.roles = rolesList;
        hasUpdated = true;
      }

      const grpList = getList(grpRes);
      if (grpList && grpList.length > 0) {
        this.customerGroups = grpList;
        hasUpdated = true;
      }

      const srcList = getList(srcRes);
      if (srcList && srcList.length > 0) {
        this.customerSources = srcList;
        hasUpdated = true;
      }

      const tplList = getList(tplRes);
      if (tplList && tplList.length > 0) {
        this.ticketTemplates = tplList;
        hasUpdated = true;
      }

      const gateList = getList(gateRes);
      if (gateList && gateList.length > 0) {
        this.controlGates = gateList;
        hasUpdated = true;
      }

      const czList = getList(czRes);
      if (czList && czList.length > 0) {
        this.controlZones = czList;
        hasUpdated = true;
      }

      const ordList = getList(ordRes);
      if (ordList && ordList.length > 0) {
        this.orders = ordList;
        hasUpdated = true;
      }

      const tktList = getList(tktRes);
      if (tktList && tktList.length > 0) {
        this.issuedTickets = tktList;
        hasUpdated = true;
      }

      const cntList = getList(cntRes);
      if (cntList && cntList.length > 0) {
        this.salesCounters = cntList;
        hasUpdated = true;
      }

      if (hasUpdated) {
        this.saveToStorage();
        window.dispatchEvent(new Event('hpticket_data_synced'));
      }
      return hasUpdated;
    } catch (err) {
      console.warn('[HPTicket Sync] Could not sync with Spring Boot Backend:', err);
      return false;
    }
  }
}

export const dbStore = new MockDatabaseStore();
