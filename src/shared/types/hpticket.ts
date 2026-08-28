/**
 * HPTICKET System Domain Models & Enums
 * Standardized according to HPTicket Architecture Specification.
 */

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface BaseEntity {
  id: string; // UUID String (VARCHAR)
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at?: string | null;
}

// ----------------------------------------------------
// 1. IAM MODULE ENUMS & INTERFACES
// ----------------------------------------------------

export enum UserRoleCode {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  TICKET_INSPECTOR = 'TICKET_INSPECTOR',
  MANAGER = 'MANAGER',
}

export interface Permission extends BaseEntity {
  code: string;
  name: string;
  module?: string;
  description?: string;
  is_active: boolean;
}

export interface Role extends BaseEntity {
  code: UserRoleCode | string;
  name: string;
  is_active: boolean;
  permissions: string[]; // List of permission codes
}

export interface User extends BaseEntity {
  username: string;
  password?: string; // Masked for security
  fullname: string;
  phone: string;
  qr_code: string; // Unique employee identification string
  role_id: string;
  is_active: boolean;
  /** Danh sách ID quầy được phân công (dùng khi gửi lên API) */
  assigned_counter_ids?: string[];
  /** Danh sách quầy được phân công trả về từ API (dạng {id, code, name}) */
  assigned_counters?: { id: string; code: string; name: string }[];
}

export interface LicenseConfig {
  license_key: string;
  expires_at: string | null; // ISO Date String or null if lifetime
  is_locked: boolean;
  is_permanent?: boolean; // True if activated permanently with lifetime key
  permanent_key?: string;
  lock_reason: string;
  master_unlock_key: string;
  activated_at: string;
}

// ----------------------------------------------------
// 2. MARKETING MODULE INTERFACES
// ----------------------------------------------------

export interface Company extends BaseEntity {
  name: string;
  address: string;
  phone: string;
  fax: string;
  web_logo_url: string;
  invoice_logo_url: string;
}

export interface CustomerGroup extends BaseEntity {
  code: string;
  name: string; // e.g. "Khách lẻ", "Đại lý lữ hành", "Khách đoàn"
  discount_percent: number; // e.g. 0, 10, 15
  is_active: boolean;
}

export interface CustomerSource extends BaseEntity {
  code: string;
  company_name: string;
  address: string;
  phone: string;
  email: string;
  customer_group_id: string;
  is_active: boolean;
}

export interface Holiday extends BaseEntity {
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Promotion extends BaseEntity {
  code: string;
  name: string;
  discount_value: number; // Fixed amount in VND or percentage
  start_date: string;
  end_date: string;
  is_active: boolean;
}

// ----------------------------------------------------
// 3. TICKETING MODULE ENUMS & INTERFACES
// ----------------------------------------------------

export interface AudienceType extends BaseEntity {
  code: string; // e.g. ADULT, CHILD, GROUP, VIP
  name: string;
  is_active: boolean;
}

export interface ControlZone extends BaseEntity {
  code: string;
  name: string; // e.g. "Khu A - Khai Mạc", "Khu B - Triển Lãm", "Cổng Chính VIP"
  is_active: boolean;
}

export interface TicketZone extends BaseEntity {
  name: string;
  control_zone_id: string;
}

export interface TicketTemplate extends BaseEntity {
  code: string;
  control_zone_ids: string[]; // Points to multiple ControlZones
  name: string; // Display name derived from TicketZone
  price: number; // Stored in absolute decimal / bigint precision (VND)
  tax_percent?: number;
  audience_type_id: string;
  ticket_type?: 'SINGLE' | 'MULTI' | 'UNLIMITED';
  validity_days?: number;
  allowed_passes?: number;
  valid_days?: string;
  is_holiday_applicable?: boolean;
  is_promotion_applicable?: boolean;
  is_active: boolean;
}

export interface ControlGate extends BaseEntity {
  device_name: string;
  ip_address: string;
  device_port: number; // INT as per code standard
  control_zone_id: string;
  is_active: boolean;
}

export enum ScanStatusResult {
  SUCCESS = 'SUCCESS',
  DENY_EXPIRED = 'DENY_EXPIRED',
  DENY_WRONG_ZONE = 'DENY_WRONG_ZONE',
  DENY_PASSES_EXHAUSTED = 'DENY_PASSES_EXHAUSTED',
  DENY_INACTIVE_GATE = 'DENY_INACTIVE_GATE',
  DENY_NOT_FOUND = 'DENY_NOT_FOUND',
}

export interface GateAccessLog extends BaseEntity {
  issued_ticket_id: string;
  control_gate_id: string;
  scan_time: string;
  status_result: ScanStatusResult;
  ticket_qr?: string;
  gate_name?: string;
}

// ----------------------------------------------------
// 4. SALES MODULE ENUMS & INTERFACES
// ----------------------------------------------------

export enum PosType {
  TICKET = 'TICKET',
  DRINK = 'DRINK'
}

export enum ProductCategory {
  DRINK = 'DRINK',
  SOUVENIR = 'SOUVENIR',
  FOOD = 'FOOD',
  OTHER = 'OTHER'
}

export const ProductCategoryLabels: Record<ProductCategory, string> = {
  [ProductCategory.DRINK]: 'Nước uống',
  [ProductCategory.SOUVENIR]: 'Quà lưu niệm',
  [ProductCategory.FOOD]: 'Đồ ăn nhanh',
  [ProductCategory.OTHER]: 'Khác'
};

export enum PaymentMethod {
  CASH = 'TIEN_MAT',
  TIEN_MAT = 'TIEN_MAT',
  BANK_TRANSFER = 'CHUYEN_KHOAN',
  CHUYEN_KHOAN = 'CHUYEN_KHOAN',
  CREDIT_CARD = 'THE_TIN_DUNG',
  THE_TIN_DUNG = 'THE_TIN_DUNG',
  VNPAY = 'CHUYEN_KHOAN',
  MOMO = 'CHUYEN_KHOAN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  FAILED = 'FAILED',
}

export enum ItemType {
  TICKET = 'TICKET',
  PRODUCT = 'PRODUCT',
}

export enum TicketStatus {
  UNUSED = 'UNUSED',
  PARTIAL_USED = 'PARTIAL_USED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

export interface SalesLocation extends BaseEntity {
  code: string;
  name: string;
  address?: string;
  is_active: boolean;
}

export interface SalesCounter extends BaseEntity {
  code: string;
  name: string;
  sales_location_id: string;
  is_active: boolean;
  supportedTypes?: PosType[];
}

export interface Product extends BaseEntity {
  code: string;
  name: string;
  category?: string; // e.g. "Nước uống", "Quà lưu niệm", "Áo mưa", "Thực phẩm"
  unit?: string; // "Chai", "Lon", "Cái", "Bộ", "Hộp"
  cost_price?: number; // Giá vốn
  price: number; // Giá bán
  tax_percent?: number;
  stock_quantity: number;
  min_stock_alert?: number; // Ngưỡng cảnh báo tồn tối thiểu
  supplier?: string;
  is_active: boolean;
}

export interface StockMovementLog extends BaseEntity {
  product_id: string;
  product_code: string;
  product_name: string;
  type: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'POS_SALE';
  quantity: number;
  unit_price: number;
  total_value: number;
  performed_by: string;
  note: string;
}

export interface OrderDetail extends BaseEntity {
  order_id: string;
  item_type: ItemType;
  item_id: string; // VARCHAR/UUID
  quantity: number;
  unit_price: number;
  total_price: number;
  item_name?: string;
  ticket_zone_name?: string;
}

export interface Order extends BaseEntity {
  order_code: string;
  customer_source_id?: string | null;
  sales_counter_id: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  invoice_status: InvoiceStatus;
  invoice_number?: string | null;
  invoice_lookup_code?: string | null;
  details?: OrderDetail[];
}

export interface IssuedTicket extends BaseEntity {
  qr_code_string: string; // Static unique UUID string
  qr_display?: string; // Signed Base64 string for QR code generation
  order_id: string;
  ticket_template_id: string;
  valid_date: string; // YYYY-MM-DD
  expire_at?: string; // ISO datetime for validity expiration
  allowed_passes: number; // 1 for standard ticket, N for multi-pass group ticket, -1/999999 for unlimited
  used_passes: number; // Counter incremented per gate scan
  status: TicketStatus;
  ticket_type?: 'SINGLE' | 'MULTI' | 'UNLIMITED';
  ticket_template_name?: string;
  ticket_template_code?: string;
}

// ----------------------------------------------------
// 5. SYSTEM AUDIT LOGS INTERFACE
// ----------------------------------------------------

export interface SystemLog extends BaseEntity {
  user_id: string;
  username?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CHECKOUT_POS' | 'SCAN_PASS' | 'ISSUE_INVOICE';
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, any> | null; // JSON snapshot
  new_data?: Record<string, any> | null; // JSON snapshot
  ip_address: string;
  user_agent: string;
}
