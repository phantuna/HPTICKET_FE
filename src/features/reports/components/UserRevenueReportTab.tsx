import React from 'react';
import { UserCheck, Search, Download } from 'lucide-react';

interface UserRevenueReportTabProps {
  sellerFilter: string; setSellerFilter: (v: string) => void;
  selectedMonth: string; setSelectedMonth: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleExportExcel: (tab: string) => void;
  users: any[]; rawOrders: any[];
  totalRevenue: number;
}

export const UserRevenueReportTab: React.FC<UserRevenueReportTabProps> = ({
  sellerFilter, setSellerFilter, selectedMonth, setSelectedMonth,
  setSearchTrigger, handleExportExcel, users, rawOrders, totalRevenue
}) => (
  <div className="space-y-6">
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">BÁO CÁO DOANH THU NHÂN VIÊN THEO THÁNG</h2>
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Người bán :</span>
            <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs">
              <option value="all">Tất cả</option>
              {users.map((u) => <option key={u.id} value={u.username}>{u.fullname}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Chọn tháng :</span>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => <option key={m} value={m.toString()}>Tháng {m}</option>)}
            </select>
          </div>
          <div className="text-xs text-slate-700 font-medium">Tổng doanh thu: <span className="font-bold text-emerald-700 font-mono">{totalRevenue.toLocaleString('vi-VN')} đ</span></div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setSearchTrigger(prev => prev + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"><Search className="w-3.5 h-3.5" /> Tìm kiếm</button>
            <button onClick={() => handleExportExcel('BaoCaoDoanhThu_User_Thang')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"><Download className="w-3.5 h-3.5" /> Xuất excel</button>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-600" /> Báo Cáo Doanh Thu Nhân Viên Theo Tháng</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((usr) => {
          const userOrders = rawOrders.filter((o) => o.created_by === usr.username || o.created_by === 'cashier1');
          const userTotal = userOrders.reduce((acc, o) => acc + (o.final_amount || 0), 0);
          return (
            <div key={usr.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{usr.fullname}</h4>
                  <p className="text-xs text-blue-600 font-mono">@{usr.username} • SĐT: {usr.phone}</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold font-mono">{userTotal.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="text-xs text-slate-600 flex justify-between pt-2 border-t border-slate-200">
                <span>Số đơn hàng thực hiện: <strong className="text-slate-900">{userOrders.length} Đơn</strong></span>
                <span>Thẻ QR Nhân viên: <strong className="text-slate-900 font-mono">{usr.qr_code}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
