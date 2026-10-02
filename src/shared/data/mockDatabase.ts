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
  Booking,
  BookingStatus,
} from '../types/hpticket';
import { apiClient, API_ENDPOINTS} from '../../api/apiConfig';
import { hasPermission } from '../utils/permissionGuard';
// Supabase connection removed

const STORAGE_KEY = 'hpticket_db_v3_real_backend_only';
const STOCK_LOGS_KEY = 'hpticket_stock_movement_logs_v1';
const SYSTEM_LOGS_KEY = 'hpticket_system_logs_v1';
const BOOKINGS_KEY = 'hpticket_bookings_store_v1';

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
  public bookings: Booking[] = [];

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
    this.loadStockLogs();
    this.loadSystemLogs();
    this.loadBookings();
  }

  public loadStockLogs(): StockMovementLog[] {
    try {
      // Dọn sạch key mock seed
      localStorage.removeItem('hpticket_opening_stock_initialized_v2');
      localStorage.removeItem('hpticket_opening_stock_initialized');

      const raw = localStorage.getItem(STOCK_LOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Tuyệt đối không dùng mock: loại bỏ bất kỳ log giả nào tạo bởi seeder cũ
          const clean = parsed.filter((l: any) => !l.id?.startsWith('slog-opening-'));
          this.stockLogs = clean;
          if (clean.length !== parsed.length) {
            localStorage.setItem(STOCK_LOGS_KEY, JSON.stringify(clean));
          }
          return clean;
        }
      }
    } catch (e) {
      console.error('Failed to load stock logs from storage:', e);
    }
    return this.stockLogs;
  }

  public saveStockLogs(logs?: StockMovementLog[]) {
    try {
      if (logs) this.stockLogs = logs;
      localStorage.setItem(STOCK_LOGS_KEY, JSON.stringify(this.stockLogs));
      window.dispatchEvent(new CustomEvent('hpticket_stock_logs_updated', { detail: this.stockLogs }));
    } catch (e) {
      console.error('Failed to save stock logs to storage:', e);
    }
  }

  public addStockLog(log: StockMovementLog) {
    this.loadStockLogs();
    this.stockLogs = [log, ...this.stockLogs];
    this.saveStockLogs();
    window.dispatchEvent(new CustomEvent('hpticket_stock_changed', { detail: log }));
  }

  public loadSystemLogs(): SystemLog[] {
    try {
      const raw = localStorage.getItem(SYSTEM_LOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.systemLogs = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load system logs:', e);
    }
    return this.systemLogs;
  }

  public saveSystemLogs() {
    try {
      const trimmed = this.systemLogs.slice(0, 200);
      localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save system logs:', e);
    }
  }

  public loadBookings(): Booking[] {
    try {
      const raw = localStorage.getItem(BOOKINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.bookings = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load bookings from storage:', e);
    }
    return this.bookings;
  }

  public saveBookings(bookings?: Booking[]) {
    try {
      if (bookings) this.bookings = bookings;
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(this.bookings));
      window.dispatchEvent(new CustomEvent('hpticket_bookings_updated', { detail: this.bookings }));
    } catch (e) {
      console.error('Failed to save bookings to storage:', e);
    }
  }

  private loadFromStorage() {
    try {
      // Dọn sạch các key rác cũ của phiên bản trước nếu còn sót lại trên trình duyệt
      ['hpticket_db_v1', 'hpticket_db_v2', 'hpticket_db', 'hpticket_backup_sync'].forEach(k => localStorage.removeItem(k));

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.licenseConfig) this.licenseConfig = parsed.licenseConfig;
        // Khôi phục companies để logo không bị mất khi reload/đăng nhập lại
        if (parsed.companies?.length > 0) this.companies = parsed.companies;

        // Tự động dọn dẹp (prune) bloat dữ liệu vé & đơn hàng cũ tồn đọng trong localStorage để giải phóng bộ nhớ trình duyệt
        if (parsed.issuedTickets || parsed.orders) {
          this.saveToStorage();
        }
      }
    } catch (e) {
      console.error('Failed to load storage:', e);
    }
  }

  public clearBrowserCache() {
    this.issuedTickets = [];
    this.orders = [];
    this.systemLogs = [];
    localStorage.removeItem(SYSTEM_LOGS_KEY);
    this.saveToStorage();
  }

  public async loadFromSupabase() {
    // Đã loại bỏ kết nối Supabase
    // Dữ liệu mock sẽ chỉ lưu trên localStorage
    return;
  }

  public saveToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          licenseConfig: this.licenseConfig,
          // Chỉ lưu cấu hình bản quyền & company (logo web/hóa đơn), KHÔNG nhồi hàng ngàn vé/đơn hàng vào localStorage
          companies: this.companies,
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
    const jwtUsername = localStorage.getItem('hpticket_username');
    let user = null;
    if (jwtUsername) {
        user = this.users.find((u) => u.username === jwtUsername || u.id === jwtUsername);
    }
    if (!user) {
        user = this.users.find((u) => u.id === this.activeUserId) || this.users[0];
    }
    if (!user) {
      return {
        id: 'system-fallback-admin',
        username: jwtUsername || 'admin',
        fullname: localStorage.getItem('hpticket_fullname') || 'System Admin',
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
    if (this.systemLogs.length > 200) {
      this.systemLogs.length = 200;
    }
    this.saveSystemLogs();
    this.saveToStorage();
  }

  /**
   * Tự động đồng bộ dữ liệu thật từ REST API Spring Boot (cổng 8080) vào bộ nhớ cục bộ
   * Giúp toàn bộ 24 màn hình API hiển thị dữ liệu thực từ PostgreSQL thay vì dữ liệu mẫu.
   */
  public async syncFromBackend(force: boolean = false): Promise<boolean> {
    
    try {
      // Chỉ gọi các API mà user hiện tại có quyền — bỏ qua nếu thiếu quyền (tránh 403)
      const safeGet = (endpoint: string, perm?: string) => {
        if (perm && !hasPermission(perm)) return Promise.resolve(null);
        return apiClient.get<any>(endpoint).catch(() => null);
      };

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
        safeGet(API_ENDPOINTS.IAM.USERS,                    'VIEW_USER'),
        safeGet(API_ENDPOINTS.IAM.ROLES,                    'VIEW_ROLE'),
        safeGet(API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS,    'VIEW_CUSTOMER_GROUP'),
        safeGet(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCES,   'VIEW_CUSTOMER_SOURCE'),
        safeGet(API_ENDPOINTS.TICKETING.TEMPLATES,          'VIEW_TICKET_TEMPLATE'),
        safeGet(API_ENDPOINTS.TICKETING.GATES,              'VIEW_GATE'),
        safeGet(API_ENDPOINTS.TICKETING.CONTROL_ZONES,      'VIEW_CONTROL_ZONE'),
        safeGet(API_ENDPOINTS.SALES.ORDERS,                 'VIEW_ORDER'),
        safeGet(API_ENDPOINTS.SALES.ISSUED_TICKETS,         'VIEW_ORDER'),
        safeGet(API_ENDPOINTS.SALES.COUNTERS,               'VIEW_COUNTER'),
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
