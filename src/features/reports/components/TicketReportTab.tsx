import React from 'react';
import { Ticket, Search, Download } from 'lucide-react';

interface TicketReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  posFilter: string; setPosFilter: (v: string) => void;
  sellerFilter: string; setSellerFilter: (v: string) => void;
  customerGroupFilter: string; setCustomerGroupFilter: (v: string) => void;
  customerSourceFilter: string; setCustomerSourceFilter: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleExportExcel: (tab: string) => void;
  salesCounters: any[]; users: any[]; customerGroups: any[]; customerSources: any[];
  totalRevenue: number; totalCash: number; totalBankTransfer: number;
  issuedTickets: any[]; rawOrders: any[];
  page: number; setPage: React.Dispatch<React.SetStateAction<number>>; pageSize: number;
}

export const TicketReportTab: React.FC<TicketReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, posFilter, setPosFilter,
  sellerFilter, setSellerFilter, customerGroupFilter, setCustomerGroupFilter,
  customerSourceFilter, setCustomerSourceFilter, setSearchTrigger, handleExportExcel,
  salesCounters, users, customerGroups, customerSources,
  totalRevenue, totalCash, totalBankTransfer, issuedTickets, rawOrders,
  page, setPage, pageSize
}) => (
  <div className="space-y-6">
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">BÁO CÁO DOANH THU CHI TIẾT THEO VÉ</h2>
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Từ ngày :</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Đến ngày :</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Quầy vé :</span>
            <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs">
              <option value="all">Tất cả</option>
              {salesCounters.map((p) => <option key={p.id} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          <div className="text-xs space-y-0.5 text-slate-700 font-medium md:text-right border-l md:border-l-0 border-slate-200 pl-3 md:pl-0">
            <p>Tổng doanh thu: <span className="font-bold text-emerald-700 font-mono">{totalRevenue.toLocaleString('vi-VN')} đ</span></p>
            <p>Tổng tiền mặt: <span className="font-bold text-amber-700 font-mono">{totalCash.toLocaleString('vi-VN')} đ</span></p>
            <p>Tổng chuyển khoản: <span className="font-bold text-blue-700 font-mono">{totalBankTransfer.toLocaleString('vi-VN')} đ</span></p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Người bán :</span>
            <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs">
              <option value="all">Tất cả</option>
              {users.map((u) => <option key={u.id} value={u.username}>{u.fullname}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Nhóm nguồn khách:</span>
            <select value={customerGroupFilter} onChange={(e) => setCustomerGroupFilter(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs">
              <option value="all">Tất cả</option>
              {customerGroups.map((g) => <option key={g.id} value={g.code}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Nguồn khách :</span>
            <select value={customerSourceFilter} onChange={(e) => setCustomerSourceFilter(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs">
              <option value="all">Không chọn / Tất cả</option>
              {customerSources.map((s) => <option key={s.id} value={s.code}>{s.company_name}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setSearchTrigger(prev => prev + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"><Search className="w-3.5 h-3.5" /> Tìm kiếm</button>
            <button onClick={() => handleExportExcel('BaoCaoVeChiTiet')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"><Download className="w-3.5 h-3.5" /> Xuất excel</button>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-blue-600" /> Báo Cáo Chi Tiết Lượt Vé Đã Phát Hành
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
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
            {issuedTickets.slice((page - 1) * pageSize, page * pageSize).map((t, idx) => {
              const parentOrder = rawOrders.find(o => o.id === t.order_id || (o as any).order_id === t.order_id);
              const details = parentOrder?.details || (parentOrder as any)?.items || [];
              const orderDetail = details.find((d: any) => d.item_id === t.ticket_template_id || (d.item_type === 'TICKET' && d.item_name === t.ticket_template_name));
              
              const unitPrice = orderDetail?.unit_price || orderDetail?.price || orderDetail?.pre_tax_price || 0;
              const orderTotal = (parentOrder?.total_amount && parentOrder.total_amount > 0) ? parentOrder.total_amount : 1;
              const orderDiscount = parentOrder?.applied_discount_amount || parentOrder?.discount_amount || 0;
              const itemDiscount = Math.round((unitPrice / orderTotal) * orderDiscount);
              const itemRevenue = unitPrice - itemDiscount;

              const isCash = parentOrder?.payment_method === 'TIEN_MAT' || parentOrder?.payment_method === 'CASH';
              const paymentMethodStr = parentOrder ? (isCash ? 'Tiền mặt' : 'Chuyển khoản') : '---';
              
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
      <div className="flex justify-between items-center mt-4 p-2 text-xs font-medium text-slate-500">
        <span>Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, issuedTickets.length)} trong tổng số {issuedTickets.length}</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Trước</button>
          <button onClick={() => setPage(p => Math.min(Math.ceil(issuedTickets.length / pageSize), p + 1))} disabled={page === Math.ceil(issuedTickets.length / pageSize) || issuedTickets.length === 0} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Sau</button>
        </div>
      </div>
    </div>
  </div>
);
