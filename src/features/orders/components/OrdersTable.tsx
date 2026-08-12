import React from 'react';
import { Eye, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface OrdersTableProps {
  orders: any[];
  fetchOrderDetail: (ord: any) => void;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
  // Invoice Selection Props
  selectedOrderIds?: string[];
  onToggleSelectOrder?: (id: string) => void;
  onToggleSelectAll?: (orders: any[]) => void;
  isAllSelected?: boolean;
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN');
};

const InvoiceStatusBadge = ({ status, invoiceNo, lookupCode }: { status: string, invoiceNo?: string, lookupCode?: string }) => {
  if (status === 'ISSUED' || status === 'ISSUED_BULK') {
    return (
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span className="font-mono text-emerald-600 font-semibold text-[11px]">{invoiceNo}</span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono">Tra cứu: {lookupCode}</p>
        {status === 'ISSUED_BULK' && <p className="text-[9px] text-emerald-500 font-medium italic mt-0.5">HĐ Gộp Cuối Ngày</p>}
      </div>
    );
  }
  if (status === 'DRAFT') {
    return (
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          <FileText className="w-3 h-3 text-blue-600" />
          <span className="font-mono text-blue-600 font-semibold text-[11px]">Hóa Đơn Nháp</span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono">Tra cứu: {lookupCode}</p>
      </div>
    );
  }
  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-medium">
        <XCircle className="w-3 h-3" /> Lỗi Phát Hành
      </div>
    );
  }
  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
        <Clock className="w-3 h-3" /> Đang Chờ Xuất
      </div>
    );
  }
  return (
    <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
      Chưa Tạo HĐ
    </span>
  );
};

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  fetchOrderDetail,
  currentPage,
  pageSize,
  totalElements,
  totalPages,
  goToPage,
  changePageSize,
  selectedOrderIds = [],
  onToggleSelectOrder,
  onToggleSelectAll,
  isAllSelected = false,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => onToggleSelectAll && onToggleSelectAll(orders)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-3.5">Mã Đơn Hàng</th>
              <th className="p-3.5">Thời Gian</th>
              <th className="p-3.5">Người Bán (Thu Ngân)</th>
              <th className="p-3.5">Hóa Đơn Điện Tử (Viettel)</th>
              <th className="p-3.5">Thanh Toán</th>
              <th className="p-3.5 text-right">Tổng Tiền</th>
              <th className="p-3.5 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Không tìm thấy đơn hàng nào
                </td>
              </tr>
            ) : (
              orders.map((ord) => {
                const isSelected = selectedOrderIds.includes(ord.id);
                const invoiceStatus = ord.invoice_status || (ord.invoice_number ? 'ISSUED' : 'UNISSUED');
                const isEligible = invoiceStatus !== 'ISSUED' && invoiceStatus !== 'ISSUED_BULK' && invoiceStatus !== 'PENDING';
                
                return (
                  <tr
                    key={ord.id}
                    className={`transition ${isEligible ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default bg-slate-50/30'} ${isSelected ? 'bg-blue-50/50' : ''}`}
                    onClick={(e) => {
                      // Prevent toggling when clicking action buttons
                      if ((e.target as HTMLElement).closest('button')) return;
                      if (!isEligible) return;
                      onToggleSelectOrder && onToggleSelectOrder(ord.id);
                    }}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isEligible}
                        onChange={() => onToggleSelectOrder && onToggleSelectOrder(ord.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">{ord.order_code}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {formatDate(ord.created_at)}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      @{ord.created_by || 'admin'}
                    </td>
                    <td className="p-3.5">
                      <InvoiceStatusBadge
                        status={invoiceStatus}
                        invoiceNo={ord.invoice_number}
                        lookupCode={ord.invoice_lookup_code}
                      />
                    </td>
                    <td className="p-3.5 font-medium">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {ord.payment_method}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                      {ord.final_amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchOrderDetail(ord);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi Tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>/ trang · Tổng: <strong className="text-slate-800">{totalElements.toLocaleString('vi-VN')}</strong> đơn hàng</span>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(0)} disabled={currentPage === 0}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono">
              «
            </button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
              return start + i;
            }).map(p => (
              <button key={p} onClick={() => goToPage(p)}
                className={`w-7 h-7 text-xs rounded-lg border transition font-semibold ${p === currentPage
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}>
                {p + 1}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
              ›
            </button>
            <button onClick={() => goToPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono">
              »
            </button>
          </div>

          <span className="text-xs text-slate-400">Trang {currentPage + 1} / {totalPages.toLocaleString('vi-VN')}</span>
        </div>
      )}
    </div>
  );
};
