/**
 * Demo Mock Database Store for HPTicket
 * Mô phỏng cơ sở dữ liệu hoàn chỉnh, độc lập cho bản Demo giới thiệu sản phẩm.
 * Tích hợp tự động nạp Mock Data phong phú và đồng bộ Supabase / LocalStorage.
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
  LicenseConfig,
  Booking,
} from '../types/hpticket';

import {
  demoCompanies,
  demoSalesLocations,
  demoSalesCounters,
  demoControlZones,
  demoTicketZones,
  demoAudienceTypes,
  demoTicketTemplates,
  demoProducts,
  demoCustomerGroups,
  demoCustomerSources,
  demoPromotions,
  demoControlGates,
  demoUsers,
  demoRoles,
  demoOrders,
  demoIssuedTickets,
  demoBookings,
} from './demoSeedData';

import {
  isSupabaseConfigured,
  syncStateToSupabase,
  loadStateFromSupabase,
} from '../../api/supabaseClient';

const STORAGE_KEY = 'hpticket_demo_mock_db_v1';
const STOCK_LOGS_KEY = 'hpticket_demo_stock_movement_logs_v1';
const SYSTEM_LOGS_KEY = 'hpticket_demo_system_logs_v1';
const BOOKINGS_KEY = 'hpticket_demo_bookings_store_v1';

const now = new Date().toISOString();

export class MockDatabaseStore {
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
    license_key: 'HPT-PRO-SHOWCASE-DEMO',
    expires_at: null,
    is_locked: false,
    is_permanent: true,
    lock_reason: '',
    master_unlock_key: 'VIP-SYSTEM-UNLOCK-9999',
    activated_at: now,
  };

  private activeUserId: string = 'usr-admin-01';

  constructor() {
    this.seedDemoData();
    this.loadFromStorage();
    this.loadStockLogs();
    this.loadSystemLogs();
    this.loadBookings();
  }

  public seedDemoData() {
    this.companies = [...demoCompanies];
    this.company = demoCompanies[0] || null;
    this.salesLocations = [...demoSalesLocations];
    this.salesCounters = [...demoSalesCounters];
    this.controlZones = [...demoControlZones];
    this.ticketZones = [...demoTicketZones];
    this.audienceTypes = [...demoAudienceTypes];
    this.ticketTemplates = [...demoTicketTemplates];
    this.products = [...demoProducts];
    this.customerGroups = [...demoCustomerGroups];
    this.customerSources = [...demoCustomerSources];
    this.promotions = [...demoPromotions];
    this.controlGates = [...demoControlGates];
    this.users = [...demoUsers];
    this.roles = [...demoRoles];
    this.orders = [...demoOrders];
    this.issuedTickets = [...demoIssuedTickets];
    this.bookings = [...demoBookings];
  }

  public loadStockLogs(): StockMovementLog[] {
    try {
      const raw = localStorage.getItem(STOCK_LOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.stockLogs = parsed;
          return parsed;
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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.products?.length > 0) this.products = parsed.products;
        if (parsed.ticketTemplates?.length > 0) this.ticketTemplates = parsed.ticketTemplates;
        if (parsed.salesCounters?.length > 0) this.salesCounters = parsed.salesCounters;
        if (parsed.salesLocations?.length > 0) this.salesLocations = parsed.salesLocations;
        if (parsed.customerGroups?.length > 0) this.customerGroups = parsed.customerGroups;
        if (parsed.customerSources?.length > 0) this.customerSources = parsed.customerSources;
        if (parsed.promotions?.length > 0) this.promotions = parsed.promotions;
        if (parsed.orders?.length > 0) this.orders = parsed.orders;
        if (parsed.issuedTickets?.length > 0) this.issuedTickets = parsed.issuedTickets;
        if (parsed.companies?.length > 0) {
          this.companies = parsed.companies;
          this.company = parsed.companies[0] || null;
        }
        if (parsed.users?.length > 0) this.users = parsed.users;
        if (parsed.roles?.length > 0) this.roles = parsed.roles;
        if (parsed.ticketZones?.length > 0) this.ticketZones = parsed.ticketZones;
        if (parsed.controlZones?.length > 0) this.controlZones = parsed.controlZones;
        if (parsed.controlGates?.length > 0) this.controlGates = parsed.controlGates;
        if (parsed.bookings?.length > 0) this.bookings = parsed.bookings;
      } else {
        // Lưu lần đầu để có sẵn cache
        this.saveToStorage(false);
      }
    } catch (e) {
      console.warn('Failed to load storage, maintaining seed defaults:', e);
    }

    // Tự động kéo dữ liệu mới nhất từ Supabase nếu đã cấu hình
    if (isSupabaseConfigured) {
      this.loadFromSupabase().catch(() => {});
    }
  }

  public clearBrowserCache() {
    this.seedDemoData();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYSTEM_LOGS_KEY);
    localStorage.removeItem(STOCK_LOGS_KEY);
    this.saveToStorage(false);
  }

  public async loadFromSupabase() {
    if (!isSupabaseConfigured) return;
    try {
      const s = await loadStateFromSupabase();
      if (s) {
        if (s.products?.length > 0) this.products = s.products;
        if (s.ticketTemplates?.length > 0) this.ticketTemplates = s.ticketTemplates;
        if (s.salesCounters?.length > 0) this.salesCounters = s.salesCounters;
        if (s.orders?.length > 0) this.orders = s.orders;
        if (s.customerGroups?.length > 0) this.customerGroups = s.customerGroups;
        this.saveToStorage(false);
        window.dispatchEvent(new Event('hpticket_data_synced'));
      }
    } catch (e) {
      console.warn('[Supabase Sync] Load error:', e);
    }
  }

  public saveToStorage(syncSupabase: boolean = true) {
    try {
      const state = {
        products: this.products,
        ticketTemplates: this.ticketTemplates,
        salesCounters: this.salesCounters,
        salesLocations: this.salesLocations,
        customerGroups: this.customerGroups,
        customerSources: this.customerSources,
        promotions: this.promotions,
        orders: this.orders,
        issuedTickets: this.issuedTickets,
        companies: this.companies,
        users: this.users,
        roles: this.roles,
        ticketZones: this.ticketZones,
        controlZones: this.controlZones,
        controlGates: this.controlGates,
        bookings: this.bookings,
        licenseConfig: this.licenseConfig,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      // Bất đồng bộ lưu lên Supabase nếu có cấu hình
      if (syncSupabase && isSupabaseConfigured) {
        syncStateToSupabase(state).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to save storage:', e);
    }
  }

  public isSystemLocked(): boolean {
    return false;
  }

  public unlockSystem(_masterKey: string): { success: boolean; message: string } {
    return {
      success: true,
      message: 'Bản quyền Demo vĩnh viễn đã được kích hoạt thành công!',
    };
  }

  public setLockTimer(_minutesFromNow: number) {
    // Không khóa trong bản demo
  }

  public setManualLock(_locked: boolean, _reason?: string) {
    // Không khóa trong bản demo
  }

  public getActiveUser(): User {
    const jwtUsername = localStorage.getItem('hpticket_username') || 'admin';
    const user = this.users.find((u) => u.username === jwtUsername || u.id === jwtUsername);
    if (user) return user;
    return this.users[0] || demoUsers[0];
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
      ip_address: '127.0.0.1',
      user_agent: 'HPTicket Showcase Demo',
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
  }

  public async syncFromBackend(_force: boolean = false): Promise<boolean> {
    // Đã chạy chế độ Demo Mock độc lập — không gọi máy chủ thật
    return true;
  }
}

export const dbStore = new MockDatabaseStore();
