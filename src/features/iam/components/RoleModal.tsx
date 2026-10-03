import React, { useState, useMemo } from 'react';
import {
  Shield, Search, X, Check, ChevronDown, ChevronRight,
  ShoppingCart, Ticket, Users, Gift, FileText, Database,
  Package, CalendarClock, Receipt, QrCode, Crown, CheckSquare, Square
} from 'lucide-react';
import { Button } from '../../../shared/components/ui';
import { useFormShortcuts } from '../../../shared/hooks';

interface RoleModalProps {
  editingRoleId: string | null;
  roleCode: string;
  setRoleCode: (v: string) => void;
  roleName: string;
  setRoleName: (v: string) => void;
  rolePermissions: string[];
  setRolePermissions: (v: string[]) => void;
  allPermissions: any[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

// CÁC QUYỀN TO TOÀN DIỆN (MANAGERS)
interface BigManager {
  code: string;
  label: string;
  module: string;
  icon: React.ElementType;
}

const BIG_MANAGERS: BigManager[] = [
  { code: 'SUPER_ADMIN', label: 'Toàn quyền Tối cao', module: 'SYSTEM', icon: Crown },
  { code: 'MANAGE_TICKETING', label: 'Quản lý Vé & POS Bán vé', module: 'TICKETING', icon: Ticket },
  { code: 'MANAGE_SALES', label: 'Quản lý Bán hàng & Doanh thu', module: 'SALES', icon: ShoppingCart },
  { code: 'MANAGE_IAM', label: 'Quản lý Tài khoản & Quyền', module: 'IAM', icon: Users },
  { code: 'MANAGE_MARKETING', label: 'Quản lý Marketing & Khách hàng', module: 'MARKETING', icon: Gift },
  { code: 'MANAGE_VINVOICE', label: 'Quản lý Hóa đơn điện tử', module: 'VINVOICE', icon: FileText },
];

// ÁNH XẠ TRANG TRÊN NAVBAR/SIDEBAR RA DANH SÁCH PERMISSION TƯƠNG ỨNG
interface NavPageDefinition {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  managerCode: string;
  managerCodes?: string[];
  description: string;
  permissions: {
    code: string;
    label: string;
    action: 'Xem' | 'Thêm' | 'Sửa' | 'Xóa' | 'Nghiệp vụ';
  }[];
}

const getPageManagers = (page: NavPageDefinition): string[] => page.managerCodes || [page.managerCode];

const NAV_PAGES: NavPageDefinition[] = [
  // 1. NHÓM: BÁN HÀNG & THU NGÂN
  {
    id: 'pos',
    title: 'Đặt vé / Bán vé thu ngân (POS)',
    category: 'BÁN HÀNG & THU NGÂN',
    icon: ShoppingCart,
    managerCode: 'MANAGE_TICKETING',
    managerCodes: ['MANAGE_TICKETING', 'MANAGE_SALES'],
    description: 'Truy cập màn hình POS bán vé, in hóa đơn và nhận thanh toán tại quầy',
    permissions: [
      { code: 'CREATE_ORDER', label: 'Tạo đơn và bán vé POS', action: 'Thêm' },
      { code: 'VIEW_ORDER', label: 'Xem danh sách đơn hàng đã bán', action: 'Xem' },
      { code: 'ISSUE_INVOICE', label: 'Tạo & Xuất hóa đơn điện tử (HĐĐT)', action: 'Nghiệp vụ' },
      { code: 'VIEW_COMPANY', label: 'Xem thông tin doanh nghiệp xuất HĐĐT', action: 'Xem' },
      { code: 'VIEW_PRODUCT', label: 'Xem danh mục sản phẩm / dịch vụ', action: 'Xem' },
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem bảng giá loại vé bán tại quầy', action: 'Xem' },
      { code: 'VIEW_PROMOTION', label: 'Xem & Áp dụng khuyến mãi / Voucher', action: 'Xem' },
      { code: 'VIEW_CUSTOMER_GROUP', label: 'Xem nhóm khách hàng & chiết khấu', action: 'Xem' },
      { code: 'VIEW_CUSTOMER_SOURCE', label: 'Xem nguồn khách tại quầy', action: 'Xem' },
      { code: 'VIEW_SALES_LOCATION', label: 'Xem điểm bán vé', action: 'Xem' },
      { code: 'VIEW_SALES_COUNTER', label: 'Xem quầy thu ngân', action: 'Xem' },
      { code: 'VIEW_TICKET_ZONE', label: 'Xem khu vực vé áp dụng', action: 'Xem' },
      { code: 'VIEW_CONTROL_ZONE', label: 'Xem khu kiểm soát vé', action: 'Xem' },
      { code: 'VIEW_HOLIDAY', label: 'Xem chính sách giá ngày lễ', action: 'Xem' },
      { code: 'VIEW_AUDIENCE_TYPE', label: 'Xem phân loại đối tượng khách', action: 'Xem' },
      { code: 'VIEW_ISSUED_TICKET', label: 'Xem danh sách vé đã bán', action: 'Xem' },
    ],
  },
  {
    id: 'bookings',
    title: 'Quản lý đặt trước (Booking)',
    category: 'BÁN HÀNG & THU NGÂN',
    icon: CalendarClock,
    managerCode: 'MANAGE_TICKETING',
    managerCodes: ['MANAGE_TICKETING', 'MANAGE_SALES'],
    description: 'Quản lý danh sách đặt chỗ trước của tour đoàn, nhận cọc và xuất vé tại quầy',
    permissions: [
      { code: 'VIEW_BOOKING', label: 'Xem danh sách đặt chỗ', action: 'Xem' },
      { code: 'CREATE_BOOKING', label: 'Tạo đơn đặt trước mới', action: 'Thêm' },
      { code: 'UPDATE_BOOKING', label: 'Cập nhật / Xác nhận booking', action: 'Sửa' },
      { code: 'CANCEL_BOOKING', label: 'Hủy đơn đặt chỗ', action: 'Xóa' },
      { code: 'FULFILL_BOOKING', label: 'Xuất vé POS cho đơn đặt trước', action: 'Nghiệp vụ' },
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem bảng giá vé (để chọn vé đặt chỗ)', action: 'Xem' },
      { code: 'VIEW_PROMOTION', label: 'Xem khuyến mãi & Voucher (để áp dụng giảm giá)', action: 'Xem' },
      { code: 'VIEW_CUSTOMER_GROUP', label: 'Xem nhóm khách đoàn / lẻ', action: 'Xem' },
      { code: 'VIEW_CUSTOMER_SOURCE', label: 'Xem nguồn khách / Công ty lữ hành', action: 'Xem' },
      { code: 'VIEW_SALES_LOCATION', label: 'Xem điểm bán vé', action: 'Xem' },
      { code: 'VIEW_SALES_COUNTER', label: 'Xem quầy xuất vé', action: 'Xem' },
      { code: 'VIEW_ORDER', label: 'Xem đơn hàng sinh ra từ booking', action: 'Xem' },
      { code: 'VIEW_AUDIENCE_TYPE', label: 'Xem phân loại đối tượng', action: 'Xem' },
      { code: 'VIEW_ISSUED_TICKET', label: 'Xem vé phát hành từ booking', action: 'Xem' },
    ],
  },
  {
    id: 'orders',
    title: 'Danh sách hóa đơn vé',
    category: 'BÁN HÀNG & THU NGÂN',
    icon: Receipt,
    managerCode: 'MANAGE_TICKETING',
    managerCodes: ['MANAGE_TICKETING', 'MANAGE_SALES'],
    description: 'Tra cứu lịch sử đơn hàng, xem chi tiết vé đã bán và hủy đơn hàng lỗi',
    permissions: [
      { code: 'VIEW_ORDER', label: 'Xem danh sách hóa đơn đơn hàng', action: 'Xem' },
      { code: 'ISSUE_INVOICE', label: 'Phát hành / Xuất hóa đơn điện tử (HĐĐT)', action: 'Nghiệp vụ' },
      { code: 'VIEW_COMPANY', label: 'Xem thông tin doanh nghiệp xuất HĐĐT', action: 'Xem' },
      { code: 'CANCEL_ORDER', label: 'Hủy đơn hàng và vé', action: 'Xóa' },
      { code: 'VIEW_REPORT', label: 'Xem báo cáo doanh thu đơn hàng', action: 'Xem' },
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem thông tin loại vé trong đơn', action: 'Xem' },
      { code: 'VIEW_ISSUED_TICKET', label: 'Xem chi tiết các vé trong hóa đơn', action: 'Xem' },
      { code: 'VIEW_PRODUCT', label: 'Xem sản phẩm/dịch vụ trong đơn', action: 'Xem' },
      { code: 'VIEW_CUSTOMER_GROUP', label: 'Xem nhóm khách hàng trong đơn', action: 'Xem' },
      { code: 'VIEW_CUSTOMER_SOURCE', label: 'Xem nguồn đối tác lữ hành', action: 'Xem' },
      { code: 'VIEW_SALES_LOCATION', label: 'Xem điểm bán của đơn', action: 'Xem' },
      { code: 'VIEW_SALES_COUNTER', label: 'Xem quầy thu ngân lập đơn', action: 'Xem' },
    ],
  },
  {
    id: 'gate',
    title: 'Kiểm tra vé / Soát cổng',
    category: 'BÁN HÀNG & THU NGÂN',
    icon: QrCode,
    managerCode: 'MANAGE_TICKETING',
    managerCodes: ['MANAGE_TICKETING', 'MANAGE_SALES'],
    description: 'Màn hình nhân viên soát vé, quét mã vạch kiểm soát lượt khách ra vào',
    permissions: [
      { code: 'SCAN_TICKET', label: 'Quét mã vạch soát vé cổng', action: 'Nghiệp vụ' },
      { code: 'VIEW_CONTROL_GATE', label: 'Xem trạng thái cửa soát vé', action: 'Xem' },
      { code: 'VIEW_CONTROL_ZONE', label: 'Xem khu kiểm soát vé', action: 'Xem' },
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem mẫu vé hợp lệ qua cổng', action: 'Xem' },
      { code: 'VIEW_ISSUED_TICKET', label: 'Tra cứu thông tin vé khi quét', action: 'Xem' },
      { code: 'VIEW_ORDER', label: 'Xem đơn hàng của vé soát', action: 'Xem' },
    ],
  },
  {
    id: 'inventory',
    title: 'Quản lý kho & Hàng hóa',
    category: 'BÁN HÀNG & THU NGÂN',
    icon: Package,
    managerCode: 'MANAGE_SALES',
    managerCodes: ['MANAGE_SALES'],
    description: 'Khai báo hàng hóa, nhập xuất kho, điều chỉnh kiểm kê và tải báo cáo xuất nhập tồn',
    permissions: [
      { code: 'VIEW_PRODUCT', label: 'Xem danh sách hàng hóa', action: 'Xem' },
      { code: 'CREATE_PRODUCT', label: 'Thêm mới hàng hóa', action: 'Thêm' },
      { code: 'UPDATE_PRODUCT', label: 'Chỉnh sửa thông tin hàng hóa', action: 'Sửa' },
      { code: 'DELETE_PRODUCT', label: 'Xóa hàng hóa', action: 'Xóa' },
      { code: 'INVENTORY_VIEW', label: 'Xem lịch sử biến động kho', action: 'Xem' },
      { code: 'INVENTORY_IMPORT', label: 'Nhập kho hàng hóa', action: 'Thêm' },
      { code: 'INVENTORY_EXPORT', label: 'Xuất kho hàng hóa', action: 'Nghiệp vụ' },
      { code: 'INVENTORY_ADJUST', label: 'Điều chỉnh kiểm kê kho', action: 'Sửa' },
      { code: 'INVENTORY_EXPORT_REPORT', label: 'Tải báo cáo xuất nhập tồn Excel', action: 'Xem' },
      { code: 'VIEW_SALES_LOCATION', label: 'Xem điểm bán hàng', action: 'Xem' },
      { code: 'VIEW_SALES_COUNTER', label: 'Xem quầy bán hàng', action: 'Xem' },
    ],
  },

  // 2. NHÓM: BÁO CÁO & THỐNG KÊ
  {
    id: 'reports',
    title: 'Báo cáo doanh thu & Ra vào',
    category: 'BÁO CÁO & THỐNG KÊ',
    icon: Receipt,
    managerCode: 'MANAGE_SALES',
    managerCodes: ['MANAGE_SALES', 'MANAGE_TICKETING'],
    description: 'Xem các báo cáo doanh thu tổng quan, so sánh ngày/tháng, loại vé và thống kê ra vào cổng',
    permissions: [
      { code: 'VIEW_REPORT', label: 'Xem toàn bộ các loại báo cáo doanh thu', action: 'Xem' },
      { code: 'VIEW_ORDER', label: 'Xem dữ liệu hóa đơn đối soát', action: 'Xem' },
      { code: 'VIEW_ISSUED_TICKET', label: 'Xem dữ liệu vé đã bán đối soát', action: 'Xem' },
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem doanh thu theo loại vé', action: 'Xem' },
      { code: 'VIEW_PRODUCT', label: 'Xem doanh thu theo sản phẩm', action: 'Xem' },
      { code: 'VIEW_SALES_COUNTER', label: 'Xem doanh thu theo quầy', action: 'Xem' },
      { code: 'VIEW_SALES_LOCATION', label: 'Xem doanh thu theo điểm', action: 'Xem' },
    ],
  },
  {
    id: 'audit_logs',
    title: 'Nhật ký lịch sử hệ thống',
    category: 'BÁO CÁO & THỐNG KÊ',
    icon: Shield,
    managerCode: 'MANAGE_IAM',
    managerCodes: ['MANAGE_IAM'],
    description: 'Theo dõi nhật ký hoạt động, thao tác tạo/sửa/xóa của nhân viên trong ca làm việc',
    permissions: [
      { code: 'VIEW_SYSTEM_LOG', label: 'Xem lịch sử nhật ký hệ thống', action: 'Xem' },
    ],
  },

  // 3. NHÓM: KHAI BÁO VÉ & SOÁT CỔNG
  {
    id: 'ticket_template',
    title: 'Khai báo mẫu vé / Loại vé',
    category: 'KHAI BÁO VÉ & SOÁT CỔNG',
    icon: Ticket,
    managerCode: 'MANAGE_TICKETING',
    managerCodes: ['MANAGE_TICKETING', 'MANAGE_SALES'],
    description: 'Thiết lập loại vé, giá vé, cấu hình mã vạch và phân quyền khu vực đi qua',
    permissions: [
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem danh sách mẫu vé', action: 'Xem' },
      { code: 'CREATE_TICKET_TEMPLATE', label: 'Thêm mới mẫu vé', action: 'Thêm' },
      { code: 'UPDATE_TICKET_TEMPLATE', label: 'Sửa thông tin mẫu vé', action: 'Sửa' },
      { code: 'DELETE_TICKET_TEMPLATE', label: 'Xóa mẫu vé', action: 'Xóa' },
      { code: 'VIEW_TICKET_ZONE', label: 'Xem nhóm vé áp dụng khu vực', action: 'Xem' },
      { code: 'CREATE_TICKET_ZONE', label: 'Thêm vùng áp dụng vé', action: 'Thêm' },
      { code: 'UPDATE_TICKET_ZONE', label: 'Sửa vùng áp dụng vé', action: 'Sửa' },
      { code: 'DELETE_TICKET_ZONE', label: 'Xóa vùng áp dụng vé', action: 'Xóa' },
      { code: 'VIEW_AUDIENCE_TYPE', label: 'Xem đối tượng áp dụng vé', action: 'Xem' },
      { code: 'VIEW_CONTROL_ZONE', label: 'Xem khu kiểm soát vé', action: 'Xem' },
    ],
  },
  {
    id: 'audience_type',
    title: 'Khai báo đối tượng khách',
    category: 'KHAI BÁO VÉ & SOÁT CỔNG',
    icon: Users,
    managerCode: 'MANAGE_TICKETING',
    managerCodes: ['MANAGE_TICKETING', 'MANAGE_SALES'],
    description: 'Phân loại đối tượng (Người lớn, Trẻ em, Học sinh, Khách VIP...) áp dụng giá vé',
    permissions: [
      { code: 'VIEW_AUDIENCE_TYPE', label: 'Xem danh sách đối tượng', action: 'Xem' },
      { code: 'CREATE_AUDIENCE_TYPE', label: 'Thêm loại đối tượng mới', action: 'Thêm' },
      { code: 'UPDATE_AUDIENCE_TYPE', label: 'Sửa loại đối tượng', action: 'Sửa' },
      { code: 'DELETE_AUDIENCE_TYPE', label: 'Xóa loại đối tượng', action: 'Xóa' },
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem các loại vé liên kết', action: 'Xem' },
    ],
  },
  {
    id: 'control_zone_gate',
    title: 'Khai báo khu & Cửa kiểm soát',
    category: 'KHAI BÁO VÉ & SOÁT CỔNG',
    icon: Shield,
    managerCode: 'MANAGE_TICKETING',
    managerCodes: ['MANAGE_TICKETING', 'MANAGE_SALES'],
    description: 'Khai báo khu vực kiểm soát, cửa barrier, thiết bị xoay và cấu hình IP máy quét',
    permissions: [
      { code: 'VIEW_CONTROL_ZONE', label: 'Xem danh sách khu kiểm soát', action: 'Xem' },
      { code: 'CREATE_CONTROL_ZONE', label: 'Thêm khu kiểm soát', action: 'Thêm' },
      { code: 'UPDATE_CONTROL_ZONE', label: 'Sửa khu kiểm soát', action: 'Sửa' },
      { code: 'DELETE_CONTROL_ZONE', label: 'Xóa khu kiểm soát', action: 'Xóa' },
      { code: 'VIEW_CONTROL_GATE', label: 'Xem danh sách cửa soát vé', action: 'Xem' },
      { code: 'CREATE_CONTROL_GATE', label: 'Thêm cửa soát vé barrier', action: 'Thêm' },
      { code: 'UPDATE_CONTROL_GATE', label: 'Sửa cửa soát vé', action: 'Sửa' },
      { code: 'DELETE_CONTROL_GATE', label: 'Xóa cửa soát vé', action: 'Xóa' },
      { code: 'VIEW_TICKET_ZONE', label: 'Xem vùng vé áp dụng', action: 'Xem' },
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem mẫu vé kiểm soát', action: 'Xem' },
    ],
  },
  {
    id: 'monthly_tickets',
    title: 'Quản lý vé tháng / Vé đã bán',
    category: 'KHAI BÁO VÉ & SOÁT CỔNG',
    icon: CalendarClock,
    managerCode: 'MANAGE_TICKETING',
    managerCodes: ['MANAGE_TICKETING', 'MANAGE_SALES'],
    description: 'Tra cứu danh sách vé đã phát hành, gia hạn vé tháng và kiểm tra hạn sử dụng',
    permissions: [
      { code: 'VIEW_ISSUED_TICKET', label: 'Xem danh sách vé đã bán', action: 'Xem' },
      { code: 'UPDATE_ISSUED_TICKET', label: 'Gia hạn / Cập nhật vé đã bán', action: 'Sửa' },
      { code: 'VIEW_ORDER', label: 'Xem đơn hàng gốc của vé', action: 'Xem' },
      { code: 'VIEW_TICKET_TEMPLATE', label: 'Xem mẫu vé tháng', action: 'Xem' },
      { code: 'VIEW_CUSTOMER_GROUP', label: 'Xem nhóm khách hàng', action: 'Xem' },
      { code: 'VIEW_CUSTOMER_SOURCE', label: 'Xem nguồn khách', action: 'Xem' },
    ],
  },

  // 4. NHÓM: QUẢN TRỊ TÀI KHOẢN & NHÂN SỰ
  {
    id: 'users_cards',
    title: 'Khai báo tài khoản & Thẻ nhân viên',
    category: 'TÀI KHOẢN & PHÂN QUYỀN',
    icon: Users,
    managerCode: 'MANAGE_IAM',
    description: 'Khai báo tài khoản đăng nhập, quét gán mã thẻ QR nhân viên và phân công ca trực',
    permissions: [
      { code: 'VIEW_USER', label: 'Xem danh sách nhân viên', action: 'Xem' },
      { code: 'CREATE_USER', label: 'Thêm tài khoản nhân viên mới', action: 'Thêm' },
      { code: 'UPDATE_USER', label: 'Sửa thông tin / Đổi mật khẩu nhân viên', action: 'Sửa' },
      { code: 'DELETE_USER', label: 'Xóa tài khoản nhân viên', action: 'Xóa' },
    ],
  },
  {
    id: 'roles_permissions',
    title: 'Khai báo nhóm quyền (Vai trò)',
    category: 'TÀI KHOẢN & PHÂN QUYỀN',
    icon: Shield,
    managerCode: 'MANAGE_IAM',
    description: 'Tạo nhóm vai trò (Thu ngân, Soát vé, Kế toán...) và phân bổ quyền cho các chức năng',
    permissions: [
      { code: 'VIEW_ROLE', label: 'Xem danh sách nhóm quyền', action: 'Xem' },
      { code: 'CREATE_ROLE', label: 'Thêm mới nhóm quyền', action: 'Thêm' },
      { code: 'UPDATE_ROLE', label: 'Cập nhật phân quyền nhóm', action: 'Sửa' },
      { code: 'DELETE_ROLE', label: 'Xóa nhóm quyền', action: 'Xóa' },
      { code: 'VIEW_PERMISSION', label: 'Xem danh mục các quyền', action: 'Xem' },
    ],
  },

  // 5. NHÓM: MARKETING & ĐỐI TÁC
  {
    id: 'marketing_programs',
    title: 'Khuyến mãi & Ngày lễ',
    category: 'MARKETING & ĐỐI TÁC',
    icon: Gift,
    managerCode: 'MANAGE_MARKETING',
    description: 'Khai báo chính sách giá ngày lễ Tết và các chương trình khuyến mãi giảm giá',
    permissions: [
      { code: 'VIEW_PROMOTION', label: 'Xem chương trình khuyến mãi', action: 'Xem' },
      { code: 'CREATE_PROMOTION', label: 'Tạo chương trình khuyến mãi', action: 'Thêm' },
      { code: 'UPDATE_PROMOTION', label: 'Sửa chương trình khuyến mãi', action: 'Sửa' },
      { code: 'DELETE_PROMOTION', label: 'Xóa chương trình khuyến mãi', action: 'Xóa' },
      { code: 'VIEW_HOLIDAY', label: 'Xem danh sách ngày lễ', action: 'Xem' },
      { code: 'CREATE_HOLIDAY', label: 'Thêm ngày lễ mới', action: 'Thêm' },
      { code: 'UPDATE_HOLIDAY', label: 'Sửa ngày lễ', action: 'Sửa' },
      { code: 'DELETE_HOLIDAY', label: 'Xóa ngày lễ', action: 'Xóa' },
    ],
  },
  {
    id: 'customers_partners',
    title: 'Nguồn khách & Nhóm đối tác',
    category: 'MARKETING & ĐỐI TÁC',
    icon: Users,
    managerCode: 'MANAGE_MARKETING',
    description: 'Quản lý danh sách cty du lịch, tour lữ hành, nhóm khách hàng thân thiết',
    permissions: [
      { code: 'VIEW_CUSTOMER_GROUP', label: 'Xem nhóm nguồn khách', action: 'Xem' },
      { code: 'CREATE_CUSTOMER_GROUP', label: 'Tạo nhóm khách mới', action: 'Thêm' },
      { code: 'UPDATE_CUSTOMER_GROUP', label: 'Sửa nhóm khách', action: 'Sửa' },
      { code: 'DELETE_CUSTOMER_GROUP', label: 'Xóa nhóm khách', action: 'Xóa' },
      { code: 'VIEW_CUSTOMER_SOURCE', label: 'Xem danh sách nguồn khách', action: 'Xem' },
      { code: 'CREATE_CUSTOMER_SOURCE', label: 'Tạo nguồn khách mới', action: 'Thêm' },
      { code: 'UPDATE_CUSTOMER_SOURCE', label: 'Sửa nguồn khách', action: 'Sửa' },
      { code: 'DELETE_CUSTOMER_SOURCE', label: 'Xóa nguồn khách', action: 'Xóa' },
    ],
  },
  {
    id: 'company_locations',
    title: 'Thông tin công ty & Điểm/Quầy bán',
    category: 'MARKETING & ĐỐI TÁC',
    icon: ShoppingCart,
    managerCode: 'MANAGE_SALES',
    description: 'Khai báo thông tin đơn vị in hóa đơn, điểm bán vé và quầy thu ngân',
    permissions: [
      { code: 'VIEW_COMPANY', label: 'Xem thông tin công ty', action: 'Xem' },
      { code: 'CREATE_COMPANY', label: 'Tạo thông tin công ty', action: 'Thêm' },
      { code: 'UPDATE_COMPANY', label: 'Sửa thông tin công ty & Logo', action: 'Sửa' },
      { code: 'DELETE_COMPANY', label: 'Xóa thông tin công ty', action: 'Xóa' },
      { code: 'VIEW_SALES_LOCATION', label: 'Xem điểm bán vé', action: 'Xem' },
      { code: 'CREATE_SALES_LOCATION', label: 'Thêm điểm bán vé', action: 'Thêm' },
      { code: 'UPDATE_SALES_LOCATION', label: 'Sửa điểm bán vé', action: 'Sửa' },
      { code: 'DELETE_SALES_LOCATION', label: 'Xóa điểm bán vé', action: 'Xóa' },
      { code: 'VIEW_SALES_COUNTER', label: 'Xem quầy bán vé', action: 'Xem' },
      { code: 'CREATE_SALES_COUNTER', label: 'Thêm quầy bán vé', action: 'Thêm' },
      { code: 'UPDATE_SALES_COUNTER', label: 'Sửa quầy bán vé', action: 'Sửa' },
      { code: 'DELETE_SALES_COUNTER', label: 'Xóa quầy bán vé', action: 'Xóa' },
    ],
  },

  // 6. HÓA ĐƠN ĐIỆN TỬ
  {
    id: 'vinvoice',
    title: 'Hóa đơn điện tử (FPT / Viettel)',
    category: 'HÓA ĐƠN ĐIỆN TỬ',
    icon: FileText,
    managerCode: 'MANAGE_VINVOICE',
    description: 'Tích hợp kết nối và phát hành hóa đơn điện tử hợp lệ tới cơ quan thuế',
    permissions: [
      { code: 'ISSUE_INVOICE', label: 'Phát hành / Xuất hóa đơn điện tử', action: 'Nghiệp vụ' },
    ],
  },
];

export const RoleModal: React.FC<RoleModalProps> = ({
  editingRoleId,
  roleCode,
  setRoleCode,
  roleName,
  setRoleName,
  rolePermissions,
  setRolePermissions,
  allPermissions,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);

  const isSuperAdminChecked = rolePermissions.includes('SUPER_ADMIN');

  // Phím tắt Enter để Lưu / Escape để đóng
  useFormShortcuts({
    isOpen: true,
    onClose,
    onSubmit,
    isSubmitting,
  });

  // Toggle mở rộng chi tiết các quyền con của 1 trang
  const toggleExpand = (pageId: string) => {
    setExpandedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    );
  };

  // Gom nhóm danh sách trang theo danh mục Navbar
  const categorizedPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const map = new Map<string, NavPageDefinition[]>();

    for (const page of NAV_PAGES) {
      if (q) {
        const matchTitle = page.title.toLowerCase().includes(q);
        const matchDesc = page.description.toLowerCase().includes(q);
        const matchPerms = page.permissions.some(
          (p) => p.code.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchDesc && !matchPerms) continue;
      }

      if (!map.has(page.category)) {
        map.set(page.category, []);
      }
      map.get(page.category)!.push(page);
    }

    return Array.from(map.entries());
  }, [searchQuery]);

  // Kiểm tra trạng thái của 1 trang trên navbar:
  // - checked: Tất cả quyền của trang đều được chọn
  // - partial: Chỉ 1 số quyền được chọn
  // - unchecked: Không có quyền nào được chọn
  const getPageState = (page: NavPageDefinition) => {
    if (isSuperAdminChecked) return 'checked';
    const mgrs = getPageManagers(page);
    if (mgrs.some((m) => rolePermissions.includes(m))) return 'checked';

    const pagePermCodes = page.permissions.map((p) => p.code);
    const checkedCount = pagePermCodes.filter((c) => rolePermissions.includes(c)).length;

    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === pagePermCodes.length) return 'checked';
    return 'partial';
  };

  // Bật / Tắt toàn bộ quyền của 1 trang trên navbar
  const handleTogglePage = (page: NavPageDefinition) => {
    const currentState = getPageState(page);
    const pagePermCodes = page.permissions.map((p) => p.code);
    const mgrs = getPageManagers(page);

    if (currentState === 'checked') {
      let basePerms = [...rolePermissions];
      // Nếu đang dùng quyền Manager to, mở rộng ra các quyền con của các trang khác cùng manager
      for (const mgr of mgrs) {
        if (basePerms.includes(mgr)) {
          basePerms = basePerms.filter((k) => k !== mgr);
          const sisterPages = NAV_PAGES.filter(
            (p) => getPageManagers(p).includes(mgr) && p.id !== page.id
          );
          const sisterPerms = sisterPages.flatMap((p) => p.permissions.map((x) => x.code));
          basePerms = Array.from(new Set([...basePerms, ...sisterPerms]));
        }
      }

      // Giữ lại các quyền đọc dùng chung mà các trang khác vẫn đang dùng
      const otherPages = NAV_PAGES.filter((p) => p.id !== page.id);
      const otherNeededPerms = new Set(
        otherPages
          .filter((p) => p.permissions.some((x) => basePerms.includes(x.code)))
          .flatMap((p) => p.permissions.map((x) => x.code))
      );

      const next = basePerms.filter(
        (k) =>
          (!pagePermCodes.includes(k) || otherNeededPerms.has(k)) &&
          !mgrs.includes(k) &&
          k !== 'SUPER_ADMIN'
      );
      setRolePermissions(next);
    } else {
      // Đang tắt hoặc 1 phần -> Bật toàn bộ quyền của trang này (loại bỏ SUPER_ADMIN nếu có để tránh conflict)
      const next = Array.from(
        new Set([...rolePermissions.filter((k) => k !== 'SUPER_ADMIN'), ...pagePermCodes])
      );
      setRolePermissions(next);
    }
  };

  // Bật / Tắt 1 quyền chi tiết bên trong trang
  const handleTogglePerm = (permCode: string, page: NavPageDefinition) => {
    const mgrs = getPageManagers(page);
    // Nếu đang bật SUPER_ADMIN mà bỏ tick 1 quyền lẻ -> bung các quyền khác ra trừ quyền này
    if (isSuperAdminChecked) {
      const allCodes = allPermissions
        .map((p) => p.name || p.code)
        .filter((c) => c !== 'SUPER_ADMIN' && c !== permCode);
      setRolePermissions(allCodes);
      return;
    }

    // Nếu đang bật Manager của module mà bỏ tick 1 quyền lẻ -> bung các quyền của module đó trừ quyền này
    const activeMgr = mgrs.find((m) => rolePermissions.includes(m));
    if (activeMgr) {
      const relatedPages = NAV_PAGES.filter((p) => getPageManagers(p).includes(activeMgr));
      const allChildCodes = relatedPages.flatMap((p) => p.permissions.map((x) => x.code));
      const remainingChildCodes = allChildCodes.filter((c) => c !== permCode);
      const otherPerms = rolePermissions.filter((k) => k !== activeMgr);
      setRolePermissions(Array.from(new Set([...otherPerms, ...remainingChildCodes])));
      return;
    }

    if (rolePermissions.includes(permCode)) {
      setRolePermissions(rolePermissions.filter((k) => k !== permCode));
    } else {
      setRolePermissions([...rolePermissions, permCode]);
    }
  };

  // Bật / Tắt quyền Quản trị cấp cao (Big Manager) - TỐI ƯU TOKEN GỌN NHẸ
  const handleToggleBigManager = (mgrCode: string, moduleKey: string) => {
    if (mgrCode === 'SUPER_ADMIN') {
      if (isSuperAdminChecked) {
        setRolePermissions(rolePermissions.filter((k) => k !== 'SUPER_ADMIN'));
      } else {
        // TỐI ƯU TOKEN: Chỉ lưu duy nhất 'SUPER_ADMIN' — không nhồi nhét 86 quyền làm phình to JWT Token!
        setRolePermissions(['SUPER_ADMIN']);
      }
      return;
    }

    const isCurrentChecked = rolePermissions.includes(mgrCode) || isSuperAdminChecked;
    const relatedPages = NAV_PAGES.filter((p) => getPageManagers(p).includes(mgrCode));
    const allChildCodes = relatedPages.flatMap((p) => p.permissions.map((x) => x.code));

    if (isCurrentChecked) {
      const next = rolePermissions.filter(
        (k) => !allChildCodes.includes(k) && k !== mgrCode && k !== 'SUPER_ADMIN'
      );
      setRolePermissions(next);
    } else {
      // TỐI ƯU TOKEN: Chỉ cần lưu mã MANAGE_<MODULE>, tự động xóa các quyền con lẻ tẻ của module này
      const cleanOtherPerms = rolePermissions.filter(
        (k) => !allChildCodes.includes(k) && k !== 'SUPER_ADMIN'
      );
      setRolePermissions([...cleanOtherPerms, mgrCode]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-900 flex flex-col h-[88vh] max-h-[820px] overflow-hidden"
      >
        {/* 1. HEADER: CỐ ĐỊNH, TINH TẾ */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  {editingRoleId ? 'Cập nhật nhóm quyền' : 'Khai báo nhóm quyền mới'}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  {isSuperAdminChecked ? 'Toàn quyền Super Admin (1 quyền tối ưu)' : `${rolePermissions.length} quyền đã chọn`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chọn trực tiếp các trang chức năng trên thanh menu mà nhóm tài khoản này được phép truy cập
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} loadingText="Đang lưu...">
              Lưu nhóm quyền
            </Button>
          </div>
        </div>

        {/* 2. FORM THÔNG TIN: MÃ VÀ TÊN NHÓM TRÊN 1 DÒNG */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-bold text-slate-700 shrink-0">
              <span className="text-red-500 mr-1">*</span>Mã nhóm:
            </label>
            <input
              type="text"
              required
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/\s/g, '_'))}
              placeholder="VD: CASHIER_POS"
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-bold text-slate-700 shrink-0">
              <span className="text-red-500 mr-1">*</span>Tên nhóm:
            </label>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="VD: Thu ngân quầy vé POS"
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 3. THANH TÌM KIẾM TRANG NHANH */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên trang (vd: Booking, POS, Báo cáo, Khuyến mãi...)"
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleToggleBigManager('SUPER_ADMIN', 'SYSTEM')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition select-none ${isSuperAdminChecked
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                }`}
            >
              <Crown className={`w-3.5 h-3.5 ${isSuperAdminChecked ? 'text-white' : 'text-blue-600'}`} />
              <span>{isSuperAdminChecked ? 'Đang bật Toàn quyền Tối cao (SUPER_ADMIN)' : 'Toàn quyền Tối cao (SUPER_ADMIN)'}</span>
              {isSuperAdminChecked && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <span className="text-slate-200">|</span>

            <button
              type="button"
              onClick={() => setRolePermissions([])}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {/* 5. VÙNG DANH SÁCH DUY NHẤT: CÁC TRANG TRÊN NAVBAR VÀ CHI TIẾT (1 THANH SCROLL) */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {categorizedPages.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Không tìm thấy trang nào phù hợp với từ khóa "{searchQuery}"
            </div>
          ) : (
            categorizedPages.map(([category, pages]) => (
              <div key={category} className="space-y-1.5">
                {/* Tiêu đề nhóm Navbar */}
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  {category}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {pages.map((page) => {
                    const state = getPageState(page);
                    const isExpanded = expandedPageIds.includes(page.id);
                    const IconComp = page.icon;

                    return (
                      <div key={page.id} className="transition">
                        {/* DÒNG TÊN TRANG TRÊN NAVBAR */}
                        <div
                          className={`px-3.5 py-2.5 flex items-center justify-between gap-3 transition select-none ${state === 'checked'
                              ? 'bg-emerald-50/50'
                              : state === 'partial'
                                ? 'bg-amber-50/40'
                                : 'hover:bg-slate-50'
                            }`}
                        >
                          {/* Checkbox & Tên Trang */}
                          <div
                            onClick={() => handleTogglePage(page)}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="text-emerald-600 shrink-0">
                              {state === 'checked' ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : state === 'partial' ? (
                                <div className="w-4 h-4 rounded border-2 border-amber-500 flex items-center justify-center bg-amber-500">
                                  <div className="w-2 h-0.5 bg-white" />
                                </div>
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            <IconComp
                              className={`w-4 h-4 shrink-0 ${state === 'checked' ? 'text-emerald-700' : 'text-slate-500'
                                }`}
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold truncate ${state === 'checked' ? 'text-emerald-950' : 'text-slate-800'
                                    }`}
                                >
                                  {page.title}
                                </span>
                                {state === 'checked' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                    Được truy cập
                                  </span>
                                )}
                                {state === 'partial' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                    Một phần quyền
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {page.description}
                              </p>
                            </div>
                          </div>

                          {/* Nút Xem chi tiết quyền con */}
                          <button
                            type="button"
                            onClick={() => toggleExpand(page.id)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 shrink-0 transition"
                          >
                            <span>{page.permissions.length} quyền con</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* VÙNG SỔ XUỐNG: CÁC QUYỀN CON CỤ THỂ NẾU CẦN CHỈNH SÂU */}
                        {isExpanded && (
                          <div className="bg-slate-50/70 border-t border-slate-100 px-4 py-2 pl-11 space-y-1">
                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                              Chi tiết quyền API của trang này:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {page.permissions.map((p) => {
                                const mgrs = getPageManagers(page);
                                const isPermChecked =
                                  rolePermissions.includes(p.code) ||
                                  mgrs.some((m) => rolePermissions.includes(m)) ||
                                  isSuperAdminChecked;

                                return (
                                  <label
                                    key={p.code}
                                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition ${isPermChecked
                                        ? 'bg-white border-emerald-300 text-emerald-900 shadow-2xs'
                                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isPermChecked}
                                      onChange={() => handleTogglePerm(p.code, page)}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-mono font-bold text-[11px] truncate">
                                          {p.code}
                                        </span>
                                        <span
                                          className={`text-[9px] font-semibold px-1 rounded ${p.action === 'Xem'
                                              ? 'bg-slate-100 text-slate-700'
                                              : p.action === 'Thêm'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : p.action === 'Sửa'
                                                  ? 'bg-blue-50 text-blue-700'
                                                  : p.action === 'Xóa'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                          {p.action}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {p.label}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </form>
    </div>
  );
};
