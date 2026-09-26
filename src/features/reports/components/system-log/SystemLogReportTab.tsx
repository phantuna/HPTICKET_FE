import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, CheckCircle2, XCircle, HelpCircle, Eye, ShieldCheck, Filter } from 'lucide-react';
import { downloadExcelFromApi } from '../../utils/excelExporter';
import { toast } from '../../../../shared/utils/toast';
import { ExportExcelButton } from '../../../../shared/components/ExportExcelButton';
import { apiClient, API_ENDPOINTS } from '../../../../api/apiConfig';
import { SystemLog } from '../../../../shared/types/hpticket';
import { ReportPagination } from '../shared/ReportPagination';

export interface SystemLogReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  searchTrigger?: number;
  handleExportExcel?: (tab: string) => void;
  page: number; setPage: React.Dispatch<React.SetStateAction<number>>; pageSize: number;
  setSelectedLog: (log: any) => void;
}

const ENTITY_NAMES: Record<string, string> = {
  orders: 'đơn hàng',
  Order: 'đơn hàng',
  products: 'sản phẩm / hàng hóa',
  Product: 'sản phẩm / hàng hóa',
  inventory_stock: 'tồn kho hàng hóa',
  'issued-tickets': 'vé phát hành',
  IssuedTicket: 'vé phát hành',
  users: 'tài khoản người dùng',
  User: 'tài khoản người dùng',
  roles: 'vai trò',
  Role: 'vai trò',
  permissions: 'quyền hạn',
  Permission: 'quyền hạn',
  promotions: 'khuyến mãi',
  Promotion: 'khuyến mãi',
  'customer-groups': 'nhóm khách hàng',
  'customer-sources': 'nguồn khách hàng',
  holidays: 'ngày lễ',
  companies: 'công ty đối tác',
  Company: 'công ty đối tác',
  templates: 'mẫu vé',
  TicketTemplate: 'mẫu vé',
  'ticket-zones': 'khu vực vé',
  'control-zones': 'vùng kiểm soát',
  gates: 'cổng kiểm soát',
  Gate: 'cổng kiểm soát',
  'audience-types': 'đối tượng khách',
  counters: 'quầy bán vé',
  SalesCounter: 'quầy bán vé',
  locations: 'địa điểm bán',
  Auth: 'hệ thống máy chủ'
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Tên',
  code: 'Mã',
  product_name: 'Tên sản phẩm',
  product_code: 'Mã sản phẩm',
  stock_quantity: 'Tồn kho',
  quantity_deducted: 'Số lượng trừ',
  quantity_change: 'Số lượng thay đổi',
  movement_type: 'Loại thao tác',
  unit: 'Đơn vị tính',
  order_code: 'Mã đơn',
  role: 'Vai trò',
  status: 'Trạng thái',
  active: 'Kích hoạt',
  is_active: 'Kích hoạt',
  price: 'Giá vé',
  unit_price: 'Đơn giá',
  quantity: 'Số lượng',
  total_amount: 'Tổng tiền',
  final_amount: 'Tiền thanh toán',
  invoice_type: 'Loại HĐ VAT',
  invoice_status: 'Trạng thái HĐ',
  customer_name: 'Khách hàng',
  customer_type: 'Loại khách hàng',
  phone: 'Số điện thoại',
  email: 'Email',
  payment_method: 'Phương thức thanh toán',
  booking_code: 'Mã đặt chỗ'
};

export const SystemLogReportTab: React.FC<SystemLogReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, setSearchTrigger, searchTrigger = 0,
  page, setPage, pageSize, setSelectedLog
}) => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'UNKNOWN'>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(API_ENDPOINTS.IAM.SYSTEM_LOGS, {
          page: page - 1,
          size: pageSize,
          fromDate,
          toDate
        });
        
        if (res && res.data) {
          if (Array.isArray(res.data.content)) {
            setLogs(res.data.content);
            setTotalElements(res.data.totalElements || res.data.content.length);
          } else if (Array.isArray(res.data)) {
            setLogs(res.data);
            setTotalElements(res.data.length);
          }
        }
      } catch (err) {
        console.error("Failed to fetch system logs", err);
        setLogs([]);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, pageSize, searchTrigger]);

  const handleExport = async () => {
    if (!fromDate || !toDate) {
      toast.info("Vui lòng chọn Từ ngày và Đến ngày để xuất Excel.");
      return;
    }
    const diff = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24));
    if (diff < 0) return toast.info("Đến ngày phải lớn hơn hoặc bằng Từ ngày.");
    if (diff > 30) return toast.info("Khoảng thời gian xuất báo cáo tối đa là 30 ngày.");

    await downloadExcelFromApi('/iam/system-logs/export', { fromDate, toDate }, 'NhatKyHeThong.xlsx');
  };

  const filteredLogs = useMemo(() => {
    if (statusFilter === 'ALL') return logs;
    return logs.filter(log => {
      if (statusFilter === 'SUCCESS') return log.result === 'SUCCESS';
      if (statusFilter === 'FAILED') return log.result === 'FAILED';
      if (statusFilter === 'UNKNOWN') return log.result !== 'SUCCESS' && log.result !== 'FAILED';
      return true;
    });
  }, [logs, statusFilter]);

  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  const renderActionBadge = (action: string) => {
    if (action.includes('Thêm') || action.includes('Tạo') || action === 'CREATE') {
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tạo mới</span>;
    }
    if (action.includes('Cập nhật') || action.includes('Sửa') || action === 'UPDATE') {
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Cập nhật</span>;
    }
    if (action.includes('Xóa') || action === 'DELETE') {
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Xóa</span>;
    }
    if (action.includes('Đăng nhập') || action.includes('LOGIN')) {
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Đăng nhập</span>;
    }
    if (action.includes('Đăng xuất') || action.includes('LOGOUT')) {
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Đăng xuất</span>;
    }
    if (action.includes('Mật khẩu') || action.includes('PASSWORD')) {
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Đổi mật khẩu</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200">{action}</span>;
  };

  const parseJsonSafe = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return null;
  };

  const renderNaturalDescription = (log: SystemLog) => {
    const rawAction = log.action || '';
    const user = log.username ? `@${log.username}` : 'Hệ thống';
    const entityType = log.entity_type || '';
    const entityLabel = ENTITY_NAMES[entityType] || entityType.toLowerCase();
    const entityId = log.entity_id ? `#${log.entity_id}` : '';

    if (rawAction.includes('LOGIN') || rawAction.includes('Đăng nhập')) {
      return (
        <span className="text-slate-800">
          <strong className="text-indigo-700 font-semibold">{user}</strong> đã đăng nhập thành công vào hệ thống.
        </span>
      );
    }
    if (rawAction.includes('LOGOUT') || rawAction.includes('Đăng xuất')) {
      return (
        <span className="text-slate-800">
          <strong className="text-slate-700 font-semibold">{user}</strong> đã đăng xuất khỏi phiên làm việc.
        </span>
      );
    }
    if (rawAction.includes('PASSWORD') || rawAction.includes('Mật khẩu')) {
      return (
        <span className="text-slate-800">
          <strong className="text-amber-800 font-semibold">{user}</strong> đã thực hiện đổi mật khẩu tài khoản.
        </span>
      );
    }

    const changes = parseJsonSafe(log.changes);
    let diffDetails: React.ReactNode = null;

    if (changes && typeof changes === 'object') {
      const keys = Object.keys(changes);
      if (keys.length > 0) {
        const readableDiffs = keys.slice(0, 3).map((k) => {
          const item = changes[k];
          const fieldName = FIELD_LABELS[k] || k;
          if (item && typeof item === 'object' && 'old' in item && 'new' in item) {
            return (
              <span key={k} className="inline-block mr-2 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                <span className="font-semibold text-slate-700">{fieldName}: </span>
                <span className="text-rose-600 line-through mr-1">{String(item.old || 'trống')}</span>
                <span className="text-slate-400">→</span>
                <span className="text-emerald-700 font-semibold ml-1">{String(item.new || 'trống')}</span>
              </span>
            );
          }
          return (
            <span key={k} className="inline-block mr-2 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              <span className="font-semibold text-slate-700">{fieldName}: </span>
              <span className="text-emerald-700">{String(item)}</span>
            </span>
          );
        });

        diffDetails = (
          <div className="mt-1 flex flex-wrap gap-1 items-center">
            {readableDiffs}
            {keys.length > 3 && (
              <span className="text-[10px] text-slate-400 italic">+{keys.length - 3} thay đổi khác</span>
            )}
          </div>
        );
      }
    }

    let verb = 'thao tác trên';
    if (rawAction.includes('Thêm') || rawAction.includes('Tạo') || rawAction === 'CREATE') verb = 'tạo mới';
    else if (rawAction.includes('Cập nhật') || rawAction.includes('Sửa') || rawAction === 'UPDATE') verb = 'cập nhật';
    else if (rawAction.includes('Xóa') || rawAction === 'DELETE') verb = 'xóa';

    return (
      <div className="text-slate-800 text-xs">
        <div>
          <strong className="text-slate-900 font-semibold">{user}</strong>{' '}
          <span className="text-slate-600">{verb}</span>{' '}
          <span className="font-semibold text-slate-900">{entityLabel}</span>{' '}
          {entityId && <span className="font-mono text-indigo-700 font-bold">{entityId}</span>}
        </div>
        {diffDetails}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG</h2>
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center">
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Từ ngày :</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Đến ngày :</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Kết quả :</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Thất bại</option>
                <option value="UNKNOWN">Lịch sử cũ</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSearchTrigger(prev => prev + 1)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Search className="w-3.5 h-3.5" /> Tìm kiếm
              </button>
              <ExportExcelButton 
                onExport={handleExport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                buttonText="Xuất excel"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Báo Cáo Nhật Ký Thay Đổi & Kiểm Toán
          </h3>
          {loading && <div className="text-xs text-emerald-600 font-semibold animate-pulse">Đang tải nhật ký...</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3 w-36 whitespace-nowrap">Thời gian</th>
                <th className="p-3 w-28 whitespace-nowrap">Thao tác</th>
                <th className="p-3 w-32 whitespace-nowrap">Đối tượng</th>
                <th className="p-3">Mô tả chi tiết</th>
                <th className="p-3 text-center w-28 whitespace-nowrap">Trạng thái</th>
                <th className="p-3 w-28 whitespace-nowrap">Địa chỉ IP</th>
                <th className="p-3 text-center w-28 whitespace-nowrap">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 && !loading && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400 italic">Không có nhật ký phù hợp trong khoảng thời gian này.</td></tr>
              )}
              {filteredLogs.map((log) => {
                const isSuccess = log.result === 'SUCCESS';
                const isFailed = log.result === 'FAILED';
                const isUnknown = !isSuccess && !isFailed;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition border-b border-slate-100">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono text-indigo-700 font-semibold text-[11px] bg-indigo-50/60 px-2 py-0.5 rounded border border-indigo-100">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </span>
                    </td>
                    <td className="p-3">
                      {renderNaturalDescription(log)}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {isSuccess && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Thành công
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" /> Thất bại
                        </span>
                      )}
                      {isUnknown && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <HelpCircle className="w-3 h-3 text-slate-400" /> Lịch sử
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {log.ip_address || (log as any).ipAddress || '--'}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedLog(log)} 
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" /> Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ReportPagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          itemUnitLabel="bản ghi"
        />
      </div>
    </div>
  );
};
