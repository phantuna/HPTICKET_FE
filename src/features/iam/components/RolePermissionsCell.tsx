import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

interface RolePermissionsCellProps {
  permissions: string[];
  roleName?: string;
  roleCode?: string;
}

// Chú thích tiếng Việt đơn giản cho các quyền chính
const PERMISSION_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Toàn quyền tối cao',
  MANAGE_TICKETING: 'Quản lý Vé & POS',
  MANAGE_SALES: 'Quản lý Bán hàng & Doanh thu',
  MANAGE_IAM: 'Quản lý Tài khoản & Phân quyền',
  MANAGE_MARKETING: 'Quản lý Marketing & Khách hàng',
  MANAGE_VINVOICE: 'Quản lý Hóa đơn điện tử',

  CREATE_ORDER: 'Tạo đơn và bán vé POS',
  VIEW_ORDER: 'Xem danh sách hóa đơn đơn hàng',
  CANCEL_ORDER: 'Hủy đơn hàng và vé',
  VIEW_REPORT: 'Xem báo cáo doanh thu',

  VIEW_BOOKING: 'Xem danh sách đặt chỗ',
  CREATE_BOOKING: 'Tạo đơn đặt trước',
  UPDATE_BOOKING: 'Cập nhật / Xác nhận booking',
  CANCEL_BOOKING: 'Hủy đơn đặt chỗ',
  FULFILL_BOOKING: 'Xuất vé POS cho booking',

  SCAN_TICKET: 'Quét mã vạch soát vé',
  VIEW_CONTROL_GATE: 'Xem cửa soát vé',
  VIEW_CONTROL_ZONE: 'Xem khu kiểm soát',
  VIEW_TICKET_TEMPLATE: 'Xem bảng giá loại vé',
  CREATE_TICKET_TEMPLATE: 'Tạo mới mẫu vé',
  UPDATE_TICKET_TEMPLATE: 'Sửa mẫu vé',
  DELETE_TICKET_TEMPLATE: 'Xóa mẫu vé',
  VIEW_TICKET_ZONE: 'Xem vùng vé áp dụng',
  VIEW_AUDIENCE_TYPE: 'Xem đối tượng khách',
  VIEW_ISSUED_TICKET: 'Xem vé đã bán / vé tháng',
  UPDATE_ISSUED_TICKET: 'Gia hạn vé đã bán',

  VIEW_PRODUCT: 'Xem danh mục hàng hóa',
  CREATE_PRODUCT: 'Thêm mới hàng hóa',
  UPDATE_PRODUCT: 'Sửa hàng hóa',
  DELETE_PRODUCT: 'Xóa hàng hóa',
  INVENTORY_VIEW: 'Xem kho hàng',
  INVENTORY_IMPORT: 'Nhập kho',
  INVENTORY_EXPORT: 'Xuất kho',
  INVENTORY_ADJUST: 'Kiểm kê kho',
  INVENTORY_EXPORT_REPORT: 'Báo cáo tồn kho',

  VIEW_CUSTOMER_GROUP: 'Xem nhóm khách hàng',
  VIEW_CUSTOMER_SOURCE: 'Xem nguồn khách / Công ty lữ hành',
  VIEW_PROMOTION: 'Xem & Áp dụng khuyến mãi',
  VIEW_HOLIDAY: 'Xem ngày lễ',
  VIEW_COMPANY: 'Xem thông tin công ty',
  VIEW_SALES_LOCATION: 'Xem điểm bán vé',
  VIEW_SALES_COUNTER: 'Xem quầy thu ngân',

  ISSUE_INVOICE: 'Xuất hóa đơn điện tử',
  VIEW_USER: 'Xem nhân viên',
  VIEW_ROLE: 'Xem nhóm quyền',
  VIEW_SYSTEM_LOG: 'Xem nhật ký hệ thống',
};

export const RolePermissionsCell: React.FC<RolePermissionsCellProps> = ({
  permissions = [],
  roleName = '',
  roleCode = '',
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Nếu chưa có quyền nào
  if (!permissions || permissions.length === 0) {
    return <span className="text-xs text-slate-400 italic">Chưa gán quyền</span>;
  }

  // 2. Nếu là SUPER_ADMIN
  if (permissions.includes('SUPER_ADMIN')) {
    return (
      <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">
        SUPER_ADMIN
      </span>
    );
  }

  // 3. Hiển thị tối đa 2 quyền đầu tiên theo phong cách chuẩn của hệ thống
  const displayLimit = 2;
  const displayItems = permissions.slice(0, displayLimit);
  const remainingCount = permissions.length - displayLimit;

  // Lọc quyền trong modal
  const filteredList = permissions.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const label = (PERMISSION_LABELS[p] || '').toLowerCase();
    return p.toLowerCase().includes(term) || label.includes(term);
  });

  return (
    <>
      <div className="flex items-center flex-wrap gap-1">
        {displayItems.map((p) => (
          <span
            key={p}
            className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded"
          >
            {p}
          </span>
        ))}

        {remainingCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpenModal(true);
            }}
            className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded font-semibold cursor-pointer transition"
            title="Bấm để xem danh sách đầy đủ"
          >
            +{remainingCount} quyền
          </button>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT - PHONG CÁCH ĐƠN GIẢN, ĐỒNG BỘ VỚI HỆ THỐNG */}
      {isOpenModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsOpenModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  {roleName || roleCode || 'Danh mục quyền'}
                </span>
                <span className="text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-semibold">
                  {permissions.length} quyền
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ô tìm kiếm */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm mã quyền hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Danh sách quyền hiển thị chuẩn theo hệ thống */}
            <div className="p-4 overflow-y-auto flex-1 space-y-1.5">
              {filteredList.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  Không tìm thấy quyền phù hợp
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {filteredList.map((p) => {
                    const label = PERMISSION_LABELS[p];
                    return (
                      <div
                        key={p}
                        className="flex items-center justify-between p-1.5 px-2.5 rounded bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 transition"
                      >
                        <span className="font-mono text-[11px] font-semibold text-blue-700">
                          {p}
                        </span>
                        {label && (
                          <span className="text-xs text-slate-500 truncate max-w-[240px] text-right">
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
