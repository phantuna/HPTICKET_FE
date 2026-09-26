import React from 'react';
import { Search } from 'lucide-react';
import { ExportExcelButton } from '../../../../shared/components/ExportExcelButton';

interface UserRevenueFilterProps {
  sellerFilter: string;
  setSellerFilter: (v: string) => void;
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  users: any[];
  displayTotalRevenue: number;
  onSearch: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onExportExcel: () => void;
  onFilterFocus?: () => void;
}

export const UserRevenueFilter: React.FC<UserRevenueFilterProps> = ({
  sellerFilter,
  setSellerFilter,
  selectedMonth,
  setSelectedMonth,
  users,
  displayTotalRevenue,
  onSearch,
  onExportExcel,
  onFilterFocus
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">BÁO CÁO DOANH THU NHÂN VIÊN THEO THÁNG</h2>
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Người bán :</span>
              <select
                onFocus={onFilterFocus}
                onMouseEnter={onFilterFocus}
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-32 shadow-xs"
              >
                <option value="all">Tất cả</option>
                {users.map((u) => <option key={u.id} value={u.username}>{u.fullname}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Tháng :</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-28 shadow-xs"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m.toString()}>Tháng {m}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-700 font-medium whitespace-nowrap px-2 md:border-l md:border-slate-200">
              Tổng doanh thu: <span className="font-bold text-emerald-700 font-mono text-sm ml-1">{displayTotalRevenue.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onSearch}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" /> Tìm kiếm
            </button>
            <ExportExcelButton 
              onExport={onExportExcel} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
              buttonText="Xuất excel"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
