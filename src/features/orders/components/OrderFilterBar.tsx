import React from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';

interface OrderFilterBarProps {
  activeSubTab: 'orders' | 'tickets';
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  fromDate: string;
  setFromDate: (val: string) => void;
  toDate: string;
  setToDate: (val: string) => void;
  filterCounterId: string;
  setFilterCounterId: (val: string) => void;
  filterOrderCode: string;
  setFilterOrderCode: (val: string) => void;
  filterBookingCode: string;
  setFilterBookingCode: (val: string) => void;
  filterSourceId: string;
  setFilterSourceId: (val: string) => void;
  ticketCounters: any[];
  customerSources: any[];
  isLoading: boolean;
  onSearch: () => void;
  onFilterFocus?: () => void;
  onExportOrders?: () => void;
}

export const OrderFilterBar: React.FC<OrderFilterBarProps> = ({
  activeSubTab, searchQuery, setSearchQuery,
  fromDate, setFromDate, toDate, setToDate,
  filterCounterId, setFilterCounterId,
  filterOrderCode, setFilterOrderCode,
  filterBookingCode, setFilterBookingCode,
  filterSourceId, setFilterSourceId,
  ticketCounters, customerSources,
  isLoading, onSearch, onFilterFocus, onExportOrders
}) => {
  if (activeSubTab === 'tickets') {
    return (
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo chuỗi mã QR vé hoặc tên mẫu vé..."
            className="w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-800 pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={onSearch}
          className={`bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition shadow-xs ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Làm Mới
        </button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-2xl bg-white p-5 text-xs font-medium text-slate-700 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 font-bold uppercase text-[10px]">Từ ngày</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 bg-slate-50 font-mono" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 font-bold uppercase text-[10px]">Đến ngày</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 bg-slate-50 font-mono" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 font-bold uppercase text-[10px]">Quầy vé</label>
          <select onFocus={onFilterFocus} onMouseEnter={onFilterFocus} value={filterCounterId} onChange={e => setFilterCounterId(e.target.value)} className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 bg-slate-50">
            <option value="">Tất cả</option>
            {ticketCounters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden md:block"></div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 font-bold uppercase text-[10px]">Mã HĐ</label>
          <input 
            type="text" 
            value={filterOrderCode}
            onChange={(e) => setFilterOrderCode(e.target.value)}
            placeholder="VD: HD-1786..."
            className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 bg-slate-50 font-mono" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 font-bold uppercase text-[10px]">Mã đặt</label>
          <input 
            type="text" 
            value={filterBookingCode}
            onChange={(e) => setFilterBookingCode(e.target.value)}
            placeholder="Nhập mã đặt..." 
            className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 bg-slate-50 font-mono" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-500 font-bold uppercase text-[10px]">Nguồn khách</label>
          <select onFocus={onFilterFocus} onMouseEnter={onFilterFocus} value={filterSourceId} onChange={e => setFilterSourceId(e.target.value)} className="w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 bg-slate-50">
            <option value="">Không chọn</option>
            {customerSources.map(s => (
              <option key={s.id} value={s.id}>{s.company_name || s.code}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-start gap-2">
          <button 
            onClick={onSearch}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs w-full sm:w-auto"
          >
            <Search className="w-4 h-4" /> Tìm kiếm
          </button>
          {onExportOrders && (
            <button 
              onClick={onExportOrders}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs w-full sm:w-auto"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
