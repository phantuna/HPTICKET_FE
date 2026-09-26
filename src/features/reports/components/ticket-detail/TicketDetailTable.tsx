import React from 'react';
import { Ticket } from 'lucide-react';
import { ReportPagination } from '../shared/ReportPagination';

interface TicketDetailTableProps {
  issuedTickets: any[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  actualTotal: number;
  actualTotalPages: number;
}

export const TicketDetailTable: React.FC<TicketDetailTableProps> = ({
  issuedTickets,
  page,
  setPage,
  pageSize,
  actualTotal,
  actualTotalPages
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-blue-600" /> Báo Cáo Chi Tiết Lượt Vé Đã Phát Hành
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3 w-10 text-center">#</th>
              <th className="p-3">Mã vé</th>
              <th className="p-3">Loại vé</th>
              <th className="p-3">Thanh toán</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Giảm giá</th>
              <th className="p-3 text-right">Doanh thu</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issuedTickets.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-slate-500 italic">Không có dữ liệu</td></tr>
            )}
            {issuedTickets.map((t, idx) => {
              const unitPrice = t.unit_price ?? 0;
              const itemDiscount = t.discount_amount ?? 0;
              const itemRevenue = t.revenue ?? (unitPrice - itemDiscount);

              const isCash = t.payment_method === 'TIEN_MAT' || t.payment_method === 'CASH';
              const paymentMethodStr = t.payment_method ? (isCash ? 'Tiền mặt' : 'Chuyển khoản') : '---';
              
              let statusClass = "bg-slate-100 text-slate-600 border border-slate-200";
              let statusLabel = "Chưa dùng";
              if (t.status === 'UNUSED') { statusClass = "bg-slate-200 text-slate-600 font-bold border border-slate-300"; statusLabel = "Chưa dùng"; }
              else if (t.status === 'USED' || t.status === 'PARTIAL_USED') { statusClass = "bg-emerald-100 text-emerald-700 font-bold border border-emerald-200"; statusLabel = "Đã dùng"; }
              else if (t.status === 'EXPIRED') { statusClass = "bg-rose-100 text-rose-700 font-bold border border-rose-200"; statusLabel = "Hết hạn"; }

              const d = new Date(t.created_at || new Date().toISOString());
              const formattedDate = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

              return (
                <tr key={t.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                  <td className="p-3 text-center font-medium text-slate-500">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="p-3 font-mono font-medium text-slate-700">{t.qr_code_string}</td>
                  <td className="p-3 font-medium text-slate-800">{t.ticket_template_name}</td>
                  <td className="p-3 text-slate-600">{paymentMethodStr}</td>
                  <td className="p-3 text-right font-medium text-slate-700">{unitPrice.toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-right font-medium text-amber-600">{itemDiscount.toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-right font-bold text-emerald-700">{itemRevenue.toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-center"><span className={`px-2 py-1 rounded text-[10px] ${statusClass}`}>{statusLabel}</span></td>
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{formattedDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ReportPagination
        page={page}
        setPage={setPage}
        totalPages={actualTotalPages}
        totalElements={actualTotal}
        pageSize={pageSize}
        itemUnitLabel="vé"
      />
    </div>
  );
};
