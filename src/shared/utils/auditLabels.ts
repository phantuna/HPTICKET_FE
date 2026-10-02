/**
 * Bảng ánh xạ đồng bộ tên bảng / đối tượng, trường dữ liệu và mô tả hành động
 * sang tiếng Việt tự nhiên, trực quan cho toàn bộ hệ thống HPTicket.
 */

export const ENTITY_NAMES: Record<string, string> = {
  // ── 1. Khai Báo Hệ Thống (Khớp 100% Navbar Sidebar) ────────────────────────
  companies: 'Khai báo thông tin công ty',
  Company: 'Khai báo thông tin công ty',
  company: 'Khai báo thông tin công ty',
  'Công ty / Đối tác': 'Khai báo thông tin công ty',

  'customer-groups': 'Khai báo nhóm nguồn khách',
  CustomerGroup: 'Khai báo nhóm nguồn khách',
  customer_group: 'Khai báo nhóm nguồn khách',
  customer_groups: 'Khai báo nhóm nguồn khách',
  'Nhóm khách hàng': 'Khai báo nhóm nguồn khách',

  'customer-sources': 'Khai báo nguồn khách',
  CustomerSource: 'Khai báo nguồn khách',
  customer_sources: 'Khai báo nguồn khách',
  customer_source: 'Khai báo nguồn khách',
  'Nguồn khách hàng': 'Khai báo nguồn khách',

  locations: 'Khai báo điểm bán vé',
  Location: 'Khai báo điểm bán vé',
  SalesLocation: 'Khai báo điểm bán vé',
  sales_locations: 'Khai báo điểm bán vé',
  'sales-locations': 'Khai báo điểm bán vé',
  'Khai báo điểm bán': 'Khai báo điểm bán vé',

  counters: 'Khai báo quầy bán vé',
  Counter: 'Khai báo quầy bán vé',
  SalesCounter: 'Khai báo quầy bán vé',
  sales_counters: 'Khai báo quầy bán vé',
  'sales-counters': 'Khai báo quầy bán vé',
  'Điểm bán vé': 'Khai báo quầy bán vé',

  'control-zones': 'Khai báo khu kiểm soát',
  ControlZone: 'Khai báo khu kiểm soát',
  control_zones: 'Khai báo khu kiểm soát',
  control_zone: 'Khai báo khu kiểm soát',
  'Khu vực kiểm soát': 'Khai báo khu kiểm soát',

  gates: 'Khai báo cửa kiểm soát',
  Gate: 'Khai báo cửa kiểm soát',
  ControlGate: 'Khai báo cửa kiểm soát',
  controlgate: 'Khai báo cửa kiểm soát',
  control_gates: 'Khai báo cửa kiểm soát',
  control_gate: 'Khai báo cửa kiểm soát',
  'control-gates': 'Khai báo cửa kiểm soát',
  'Cổng soát vé': 'Khai báo cửa kiểm soát',

  'audience-types': 'Khai báo đối tượng',
  AudienceType: 'Khai báo đối tượng',
  audience_types: 'Khai báo đối tượng',
  audience_type: 'Khai báo đối tượng',
  'Loại đối tượng': 'Khai báo đối tượng',

  templates: 'Khai báo mẫu vé / Loại vé',
  TicketTemplate: 'Khai báo mẫu vé / Loại vé',
  ticket_templates: 'Khai báo mẫu vé / Loại vé',
  ticket_template: 'Khai báo mẫu vé / Loại vé',
  'ticket-templates': 'Khai báo mẫu vé / Loại vé',
  'Mẫu vé': 'Khai báo mẫu vé / Loại vé',

  zones: 'Khai báo nhóm vé áp dụng (Khu vực)',
  'ticket-zones': 'Khai báo nhóm vé áp dụng (Khu vực)',
  TicketZone: 'Khai báo nhóm vé áp dụng (Khu vực)',
  ticket_zone: 'Khai báo nhóm vé áp dụng (Khu vực)',
  ticket_zones: 'Khai báo nhóm vé áp dụng (Khu vực)',
  'Vùng vé': 'Khai báo nhóm vé áp dụng (Khu vực)',

  'issued-tickets': 'Quản lý vé tháng',
  IssuedTicket: 'Quản lý vé tháng',
  issued_tickets: 'Quản lý vé tháng',
  'monthly-tickets': 'Quản lý vé tháng',
  'Vé đã phát hành': 'Quản lý vé tháng',

  roles: 'Khai báo nhóm quyền',
  role: 'Khai báo nhóm quyền',
  Role: 'Khai báo nhóm quyền',
  'Nhóm quyền (Role)': 'Khai báo nhóm quyền',
  'Vai trò / Phân quyền': 'Khai báo nhóm quyền',
  'Vai trò / Nhóm quyền': 'Khai báo nhóm quyền',

  users: 'Khai báo tài khoản đăng nhập',
  user: 'Khai báo tài khoản đăng nhập',
  User: 'Khai báo tài khoản đăng nhập',
  'Tài khoản (User)': 'Khai báo tài khoản đăng nhập',
  'Tài khoản người dùng': 'Khai báo tài khoản đăng nhập',

  'staff-cards': 'Khai báo thẻ nhân viên / QR',
  StaffCard: 'Khai báo thẻ nhân viên / QR',
  staff_cards: 'Khai báo thẻ nhân viên / QR',

  holidays: 'Khai báo các ngày lễ',
  holiday: 'Khai báo các ngày lễ',
  Holiday: 'Khai báo các ngày lễ',
  'Ngày lễ': 'Khai báo các ngày lễ',

  promotions: 'Khai báo chương trình khuyến mại',
  promotion: 'Khai báo chương trình khuyến mại',
  Promotion: 'Khai báo chương trình khuyến mại',
  'Khuyến mãi': 'Khai báo chương trình khuyến mại',
  'Chương trình khuyến mãi': 'Khai báo chương trình khuyến mại',

  products: 'Quản lý kho & Sản phẩm',
  Product: 'Quản lý kho & Sản phẩm',
  product: 'Quản lý kho & Sản phẩm',
  'stock-movements': 'Biến động kho',
  StockMovement: 'Biến động kho',
  inventory_stock: 'Quản lý kho & Sản phẩm',
  'Sản phẩm / Hàng hóa': 'Quản lý kho & Sản phẩm',
  'Biến động kho': 'Biến động kho',

  // ── 2. Quản Lý Vé & POS (Khớp 100% Navbar Sidebar) ────────────────────────
  orders: 'Đặt vé / Bán vé thu ngân',
  Order: 'Đặt vé / Bán vé thu ngân',
  order: 'Đặt vé / Bán vé thu ngân',
  pos: 'Đặt vé / Bán vé thu ngân',
  'Đơn hàng': 'Đặt vé / Bán vé thu ngân',

  'order-details': 'Danh sách hóa đơn vé',
  OrderDetail: 'Danh sách hóa đơn vé',
  invoices: 'Danh sách hóa đơn vé',
  Invoice: 'Danh sách hóa đơn vé',
  invoice: 'Danh sách hóa đơn vé',
  'Chi tiết đơn hàng': 'Danh sách hóa đơn vé',
  'Hóa đơn điện tử': 'Danh sách hóa đơn vé',

  scan: 'Kiểm tra vé / Soát cổng',
  GateScan: 'Kiểm tra vé / Soát cổng',
  gate_access_logs: 'Kiểm tra vé / Soát cổng',
  'Quẹt vé qua cổng': 'Kiểm tra vé / Soát cổng',

  // ── 3. Quản trị hệ thống & Khác ───────────────────────────────────────────
  backups: 'Sao lưu & Phục hồi dữ liệu',
  BackupJob: 'Sao lưu & Phục hồi dữ liệu',
  BackupSetting: 'Sao lưu & Phục hồi dữ liệu',
  'Sao lưu & phục hồi CSDL': 'Sao lưu & Phục hồi dữ liệu',

  permissions: 'Quyền hạn hệ thống',
  permission: 'Quyền hạn hệ thống',
  Permission: 'Quyền hạn hệ thống',

  exports: 'Báo Cáo & Thống Kê',
  export: 'Báo Cáo & Thống Kê',
  Export: 'Báo Cáo & Thống Kê',
  ExportJob: 'Báo Cáo & Thống Kê',
  'Xuất báo cáo': 'Báo Cáo & Thống Kê',
  'Báo cáo & Thống kê': 'Báo Cáo & Thống Kê',
  'Báo Cáo & Thống Kê': 'Báo Cáo & Thống Kê',

  license: 'Bản quyền phần mềm',
  License: 'Bản quyền phần mềm',
  Auth: 'Hệ thống xác thực'
};

export const FIELD_LABELS: Record<string, string> = {
  device_name: 'Tên thiết bị / Cửa kiểm soát',
  deviceName: 'Tên thiết bị / Cửa kiểm soát',
  device_port: 'Cổng kết nối (Port)',
  devicePort: 'Cổng kết nối (Port)',
  name: 'Tên',
  code: 'Mã định danh',
  status: 'Trạng thái',
  active: 'Trạng thái hoạt động',
  is_active: 'Trạng thái hoạt động',
  price: 'Giá vé',
  unit_price: 'Đơn giá',
  quantity: 'Số lượng',
  stock_quantity: 'Tồn kho',
  quantity_deducted: 'Số lượng trừ',
  quantity_change: 'Số lượng thay đổi',
  movement_type: 'Loại thao tác kho',
  unit: 'Đơn vị tính',
  total_amount: 'Tổng tiền',
  final_amount: 'Tiền thanh toán',
  discount: 'Giảm giá',
  discount_rate: 'Tỷ lệ giảm (%)',
  start_date: 'Ngày bắt đầu',
  end_date: 'Ngày kết thúc',
  holiday_date: 'Ngày diễn ra lễ',
  ip_address: 'Địa chỉ IP',
  port: 'Cổng kết nối (Port)',
  gate_type: 'Loại cổng',
  direction: 'Chiều soát vé',
  zone_id: 'Vùng vé',
  control_zone_id: 'Khu vực kiểm soát',
  sales_location_id: 'Điểm bán',
  product_name: 'Tên sản phẩm',
  product_code: 'Mã sản phẩm',
  customer_name: 'Khách hàng',
  customer_type: 'Loại khách hàng',
  phone: 'Số điện thoại',
  email: 'Email',
  address: 'Địa chỉ',
  description: 'Mô tả',
  note: 'Ghi chú',
  username: 'Tên đăng nhập',
  fullname: 'Họ và tên',
  fullName: 'Họ và tên',
  role: 'Vai trò',
  role_id: 'Mã vai trò',
  roleId: 'Mã vai trò',
  roles: 'Danh sách vai trò',
  roleNames: 'Danh sách vai trò',
  permissions: 'Danh sách quyền hạn',
  permissionNames: 'Danh sách quyền hạn',
  assigned_counters: 'Quầy bán phân công',
  assigned_counter_ids: 'Quầy bán phân công',
  payment_method: 'Phương thức thanh toán',
  booking_code: 'Mã đặt chỗ',
  order_code: 'Mã đơn',
  invoice_type: 'Loại HĐ VAT',
  invoice_status: 'Trạng thái HĐ'
};

export const IGNORED_DIFF_KEYS = new Set([
  // Jackson JsonNode getters & Java reflection leaks (double, float, int, etc.)
  'array', 'bigDecimal', 'bigInteger', 'binary', 'boolean', 'byte', 'char',
  'containerNode', 'double', 'elements', 'empty', 'fieldNames', 'float',
  'floatingPointNumber', 'int', 'integralNumber', 'long', 'missingNode',
  'nodeType', 'null', 'number', 'object', 'pojo', 'short', 'size',
  'textual', 'valueNode', 'class', 'declaringClass',
  'hibernateLazyInitializer', 'handler',
  // Bảo mật: Mật khẩu, token, secret
  'password', 'passwordhash', 'password_hash', 'token', 'accesstoken',
  'access_token', 'refreshtoken', 'refresh_token', 'secret', 'clientsecret',
  // Auditing & internal timestamps
  'created_at', 'updated_at', 'created_by', 'updated_by', 'version',
  'created_date', 'modified_date', 'created_date_time', 'modified_date_time',
  'deleted_at'
]);

/**
 * Lấy nhãn tiếng Việt của thực thể (hoặc giữ nguyên nếu đã là tiếng Việt)
 */
export const getEntityLabel = (entityType?: string): string => {
  if (!entityType) return 'Hệ thống';
  return ENTITY_NAMES[entityType] || entityType;
};

/**
 * Format giá trị trường trong diff dễ đọc cho người dùng
 */
export const formatDiffValue = (val: any): string => {
  if (val === null || val === undefined) return 'trống';
  if (typeof val === 'boolean') return val ? 'Hoạt động' : 'Tạm ngưng';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

/**
 * Xác định động từ hành động tiếng Việt phù hợp với ngữ cảnh
 */
export const getActionVerb = (rawAction: string = ''): string => {
  const act = rawAction.toLowerCase();
  if (act.includes('trạng thái') || act.includes('status')) return 'đổi trạng thái';
  if (act.includes('thêm') || act.includes('tạo') || act === 'create') return 'tạo mới';
  if (act.includes('cập nhật') || act.includes('sửa') || act === 'update') return 'cập nhật';
  if (act.includes('xóa') || act === 'delete') return 'xóa';
  if (act.includes('khóa')) return 'khóa khẩn cấp';
  if (act.includes('hủy')) return 'hủy';
  if (act.includes('gia hạn')) return 'gia hạn';
  if (act.includes('phát hành')) return 'phát hành';
  if (act.includes('sao lưu')) return 'sao lưu';
  if (act.includes('khôi phục')) return 'khôi phục';
  if (act.includes('kích hoạt')) return 'kích hoạt';
  if (act.includes('quẹt') || act.includes('quét')) return 'quẹt vé qua';
  return 'thao tác trên';
};

/**
 * Chuẩn hóa tiêu đề hành động thân thiện (loại bỏ tên class/tiếng Anh ControlGate, User...)
 */
export const cleanActionTitle = (action: string = '', entityType?: string): string => {
  const act = (action || '').toLowerCase();
  const entityLabel = getEntityLabel(entityType);
  if (act.includes('trạng thái') || act.includes('status')) return `Đổi trạng thái ${entityLabel}`;
  if (act.includes('thêm') || act.includes('tạo') || act.includes('create')) return `Tạo mới ${entityLabel}`;
  if (act.includes('cập nhật') || act.includes('sửa') || act.includes('update')) return `Cập nhật ${entityLabel}`;
  if (act.includes('xóa') || act.includes('delete')) return `Xóa ${entityLabel}`;
  if (act.includes('đăng nhập') || act.includes('login')) return 'Đăng nhập hệ thống';
  if (act.includes('đăng xuất') || act.includes('logout')) return 'Đăng xuất';
  if (act.includes('mật khẩu') || act.includes('password')) return 'Đổi mật khẩu';
  return action;
};

/**
 * Trích xuất tên hiển thị thân thiện của thực thể từ log (kể cả bản ghi cũ lưu entity_name = null)
 */
export const resolveEntityName = (log: { 
  entity_name?: string | null; 
  changes?: any; 
  newData?: any; 
  oldData?: any; 
  entity_id?: string;
}): string | null => {
  if (log.entity_name && log.entity_name.trim() && log.entity_name !== 'null') {
    return log.entity_name.trim();
  }

  const parseSafe = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return null; }
  };

  const candidateKeys = [
    'device_name', 'deviceName', 'name', 'code', 'title', 'gateName', 'zoneName',
    'productName', 'fullName', 'full_name', 'username', 'customerName',
    'orderCode', 'order_code', 'bookingCode', 'booking_code'
  ];

  const checkObj = (obj: any): string | null => {
    if (!obj || typeof obj !== 'object') return null;
    for (const key of candidateKeys) {
      if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim()) {
        const v = String(obj[key]).trim();
        if (v && v !== 'null' && v !== 'undefined') return v;
      }
    }
    return null;
  };

  // 1. Kiểm tra newData
  const nData = parseSafe(log.newData);
  const fromNew = checkObj(nData);
  if (fromNew) return fromNew;

  // 2. Kiểm tra oldData
  const oData = parseSafe(log.oldData);
  const fromOld = checkObj(oData);
  if (fromOld) return fromOld;

  // 3. Kiểm tra changes
  const ch = parseSafe(log.changes);
  if (ch && typeof ch === 'object') {
    for (const key of candidateKeys) {
      if (ch[key]) {
        const item = ch[key];
        if (typeof item === 'object' && item.new && String(item.new).trim()) return String(item.new).trim();
        if (typeof item === 'object' && item.old && String(item.old).trim()) return String(item.old).trim();
        if (typeof item === 'string' && item.trim()) return item.trim();
      }
    }
  }

  return null;
};
