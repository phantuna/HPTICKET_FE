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

const IGNORED_DIFF_KEYS = new Set([
  'array', 'bigDecimal', 'bigInteger', 'binary', 'boolean', 'containerNode',
  'empty', 'floatingPointNumber', 'integralNumber', 'missingNode', 'nodeType',
  'null', 'number', 'object', 'pojo', 'short', 'textual', 'valueNode'
]);

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

export const SystemLogReportTab: React.FC<SystemLogReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, setSearchTrigger, searchTrigger = 0,
  page, setPage, pageSize, setSelectedLog
}) => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'UNKNOWN'>('ALL');
  const [localTrigger, setLocalTrigger] = useState(0);

  const handleSearch = () => {
    setPage(1);
    setLocalTrigger(prev => prev + 1);
    if (setSearchTrigger) {
      setSearchTrigger(prev => prev + 1);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page: Math.max(0, page - 1),
          size: pageSize,
        };
        if (fromDate && fromDate.trim()) params.fromDate = fromDate.trim();
        if (toDate && toDate.trim()) params.toDate = toDate.trim();

        const res = await apiClient.get<any>(API_ENDPOINTS.IAM.SYSTEM_LOGS, params);
        
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
  }, [page, pageSize, searchTrigger, localTrigger]);

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
    const act = (action || '').toUpperCase();
    if (act.includes('THÊM') || act.includes('TẠO') || act === 'CREATE') {
      return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tạo mới</span>;
    }
    if (act.includes('CẬP NHẬT') || act.includes('SỬA') || act === 'UPDATE') {
      return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Cập nhật</span>;
    }
    if (act.includes('XÓA') || act === 'DELETE') {
      return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Xóa</span>;
    }
    if (act.includes('ĐĂNG NHẬP') || act.includes('LOGIN')) {
      return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Đăng nhập</span>;
    }
    if (act.includes('ĐĂNG XUẤT') || act.includes('LOGOUT')) {
      return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Đăng xuất</span>;
    }
    if (act.includes('MẬT KHẨU') || act.includes('PASSWORD')) {
      return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Đổi mật khẩu</span>;
    }
    return <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 truncate max-w-full">{action}</span>;
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
    
    const shortEntityId = log.entity_id
      ? (log.entity_id.length > 12 ? `${log.entity_id.slice(0, 4)}...${log.entity_id.slice(-4)}` : log.entity_id)
      : '';

    if (rawAction.includes('LOGIN') || rawAction.includes('Đăng nhập')) {
      return (
        <span className="text-slate-800 text-[11px] leading-relaxed">
          <strong className="text-indigo-700 font-semibold">{user}</strong> đã đăng nhập thành công vào hệ thống.
        </span>
      );
    }
    if (rawAction.includes('LOGOUT') || rawAction.includes('Đăng xuất')) {
      return (
        <span className="text-slate-800 text-[11px] leading-relaxed">
          <strong className="text-slate-700 font-semibold">{user}</strong> đã đăng xuất khỏi phiên làm việc.
        </span>
      );
    }
    if (rawAction.includes('PASSWORD') || rawAction.includes('Mật khẩu')) {
      return (
        <span className="text-slate-800 text-[11px] leading-relaxed">
          <strong className="text-amber-800 font-semibold">{user}</strong> đã thực hiện đổi mật khẩu tài khoản.
        </span>
      );
    }

    const changes = parseJsonSafe(log.changes);
    let diffDetails: React.ReactNode = null;

    if (changes && typeof changes === 'object') {
      const keys = Object.keys(changes).filter(k => !IGNORED_DIFF_KEYS.has(k));
      if (keys.length > 0) {
        const readableDiffs = keys.slice(0, 2).map((k) => {
          const item = changes[k];
          const fieldName = FIELD_LABELS[k] || k;
          if (item && typeof item === 'object' && 'old' in item && 'new' in item) {
            return (
              <span key={k} className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                <span className="font-semibold text-slate-700">{fieldName}:</span>
                <span className="text-rose-600 line-through truncate max-w-[60px]" title={String(item.old || '')}>{String(item.old || 'trống')}</span>
                <span className="text-slate-400">→</span>
                <span className="text-emerald-700 font-semibold truncate max-w-[80px]" title={String(item.new || '')}>{String(item.new || 'trống')}</span>
              </span>
            );
          }
          return (
            <span key={k} className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
              <span className="font-semibold text-slate-700">{fieldName}:</span>
              <span className="text-emerald-700 truncate max-w-[100px]" title={String(item)}>{String(item)}</span>
            </span>
          );
        });

        diffDetails = (
          <div className="mt-1 flex flex-wrap gap-1 items-center">
            {readableDiffs}
            {keys.length > 2 && (
              <span className="text-[10px] text-slate-400 italic">+{keys.length - 2} thay đổi khác</span>
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
      <div className="text-slate-800 text-[11px] leading-relaxed">
        <div>
          <strong className="text-slate-900 font-semibold">{user}</strong>{' '}
          <span className="text-slate-600">{verb}</span>{' '}
          <span className="font-semibold text-slate-900">{entityLabel}</span>{' '}
          {shortEntityId && (
            <span 
              className="font-mono text-indigo-700 font-semibold cursor-help"
              title={log.entity_id}
            >
              #{shortEntityId}
            </span>
          )}
        </div>
        {diffDetails}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Khối bộ lọc tìm kiếm */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
          NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG
        </h2>
        <div className="border border-slate-200/80 rounded-xl p-3.5 bg-slate-50/70">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            {/* Cụm bộ lọc điều kiện */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold whitespace-nowrap">Từ ngày:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="bg-white border border-slate-200 px-3 py-1.5 text-slate-800 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs w-[145px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold whitespace-nowrap">Đến ngày:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="bg-white border border-slate-200 px-3 py-1.5 text-slate-800 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs w-[145px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold whitespace-nowrap">Kết quả:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 px-3 py-1.5 text-slate-800 font-medium rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs min-w-[150px]"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="FAILED">Thất bại</option>
                  <option value="UNKNOWN">Lịch sử cũ</option>
                </select>
              </div>
            </div>

            {/* Cụm nút hành động */}
            <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              >
                <Search className="w-3.5 h-3.5" /> Tìm kiếm
              </button>
              <ExportExcelButton 
                onExport={handleExport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                buttonText="Xuất excel"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bảng nhật ký hệ thống */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Báo Cáo Nhật Ký Thay Đổi & Kiểm Toán
          </h3>
          {loading && <div className="text-xs text-emerald-600 font-semibold animate-pulse">Đang tải nhật ký...</div>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 table-fixed">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-2.5 w-[105px]">Thời gian</th>
                <th className="p-2.5 w-[85px]">Thao tác</th>
                <th className="p-2.5 w-[130px]">Đối tượng</th>
                <th className="p-2.5">Mô tả chi tiết</th>
                <th className="p-2.5 text-center w-[95px]">Trạng thái</th>
                <th className="p-2.5 w-[95px]">Địa chỉ IP</th>
                <th className="p-2.5 text-center w-[65px]">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Không có nhật ký phù hợp trong khoảng thời gian này.
                  </td>
                </tr>
              )}
              {filteredLogs.map((log) => {
                const isSuccess = log.result === 'SUCCESS';
                const isFailed = log.result === 'FAILED';
                const isUnknown = !isSuccess && !isFailed;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition border-b border-slate-100">
                    {/* Thời gian */}
                    <td className="p-2.5 font-mono text-[11px]">
                      <div className="flex flex-col leading-tight">
                        <span className="text-slate-800 font-semibold">{formatDate(log.created_at)}</span>
                        <span className="text-slate-400 text-[10px]">{formatTime(log.created_at)}</span>
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="p-2.5 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>

                    {/* Đối tượng */}
                    <td className="p-2.5">
                      <div className="flex flex-col min-w-0" title={`${log.entity_type} ${log.entity_id || ''}`}>
                        <span className="font-semibold text-slate-800 text-[11px] truncate">
                          {ENTITY_NAMES[log.entity_type] || log.entity_type}
                        </span>
                        {log.entity_id && (
                          <span className="font-mono text-indigo-700 text-[10px] bg-indigo-50/80 px-1 py-0.5 rounded truncate w-fit max-w-full">
                            #{log.entity_id.length > 12 ? `${log.entity_id.slice(0, 4)}...${log.entity_id.slice(-4)}` : log.entity_id}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mô tả chi tiết */}
                    <td className="p-2.5 break-words">
                      {renderNaturalDescription(log)}
                    </td>

                    {/* Trạng thái */}
                    <td className="p-2.5 text-center whitespace-nowrap">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <HelpCircle className="w-3 h-3 text-slate-400" /> Lịch sử
                        </span>
                      )}
                    </td>

                    {/* Địa chỉ IP */}
                    <td className="p-2.5 font-mono text-slate-600 text-[10px]">
                      <span 
                        className="truncate block max-w-full" 
                        title={log.ip_address || (log as any).ipAddress || '--'}
                      >
                        {log.ip_address || (log as any).ipAddress || '--'}
                      </span>
                    </td>

                    {/* Chi tiết */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedLog(log)} 
                        title="Xem toàn bộ nhật ký & snapshot dữ liệu"
                        className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-200 hover:border-indigo-200 transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-indigo-600" /> Xem
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
