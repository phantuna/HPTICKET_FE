import React from 'react';
import { Search } from 'lucide-react';
import { ExportExcelButton } from '../../../../shared/components/ExportExcelButton';
import { VNDateInput } from '../../../../shared/components/ui';

interface TicketFilterSectionProps {
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  posFilter: string;
  setPosFilter: (v: string) => void;
  sellerFilter: string;
  setSellerFilter: (v: string) => void;
  customerGroupFilter: string;
  setCustomerGroupFilter: (v: string) => void;
  customerSourceFilter: string;
  setCustomerSourceFilter: (v: string) => void;
  salesCounters: any[];
  users: any[];
  customerGroups: any[];
  customerSources: any[];
  displayRevenue: number;
  displayCash: number;
  displayBankTransfer: number;
  onSearch: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onExportExcel: () => void;
  onFilterFocus?: () => void;
}

export const TicketFilterSection: React.FC<TicketFilterSectionProps> = ({
  fromDate, setFromDate, toDate, setToDate,
  posFilter, setPosFilter, sellerFilter, setSellerFilter,
  customerGroupFilter, setCustomerGroupFilter, customerSourceFilter, setCustomerSourceFilter,
  salesCounters, users, customerGroups, customerSources,
  displayRevenue, displayCash, displayBankTransfer,
  onSearch, onExportExcel, onFilterFocus
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">BÁO CÁO DOANH THU CHI TIẾT THEO VÉ</h2>
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Từ ngày :</span>
            <div className="w-full">
              <VNDateInput
                value={fromDate}
                onChange={setFromDate}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Đến ngày :</span>
            <div className="w-full">
              <VNDateInput
                value={toDate}
                onChange={setToDate}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Quầy vé :</span>
            <select
              onFocus={onFilterFocus}
              onMouseEnter={onFilterFocus}
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
              className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
            >
              <option value="all">Tất cả</option>
              {salesCounters.map((p) => <option key={p.id} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          <div className="text-xs space-y-0.5 text-slate-700 font-medium md:text-right border-l md:border-l-0 border-slate-200 pl-3 md:pl-0">
            <p>Tổng doanh thu: <span className="font-bold text-emerald-700 font-mono">{displayRevenue.toLocaleString('vi-VN')} đ</span></p>
            <p>Tổng tiền mặt: <span className="font-bold text-amber-700 font-mono">{displayCash.toLocaleString('vi-VN')} đ</span></p>
            <p>Tổng chuyển khoản: <span className="font-bold text-blue-700 font-mono">{displayBankTransfer.toLocaleString('vi-VN')} đ</span></p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Người bán :</span>
            <select
              onFocus={onFilterFocus}
              onMouseEnter={onFilterFocus}
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
            >
              <option value="all">Tất cả</option>
              {users.map((u) => <option key={u.id} value={u.username}>{u.fullname}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Nhóm nguồn khách:</span>
            <select
              onFocus={onFilterFocus}
              onMouseEnter={onFilterFocus}
              value={customerGroupFilter}
              onChange={(e) => setCustomerGroupFilter(e.target.value)}
              className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
            >
              <option value="all">Tất cả</option>
              {customerGroups.map((g) => <option key={g.id} value={g.code}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Nguồn khách :</span>
            <select
              onFocus={onFilterFocus}
              onMouseEnter={onFilterFocus}
              value={customerSourceFilter}
              onChange={(e) => setCustomerSourceFilter(e.target.value)}
              className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
            >
              <option value="all">Không chọn / Tất cả</option>
              {customerSources.map((s) => <option key={s.id} value={s.code}>{s.company_name}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onSearch}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Search className="w-3.5 h-3.5" /> Tìm kiếm
            </button>
            <ExportExcelButton 
              onExport={onExportExcel} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              buttonText="Xuất excel"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
