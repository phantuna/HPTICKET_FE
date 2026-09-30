import React from 'react';
import { Search } from 'lucide-react';
import { VNDateInput } from '../../../../shared/components/ui';
interface ReportDateRangeFilterProps {
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  onSearch: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const ReportDateRangeFilter: React.FC<ReportDateRangeFilterProps> = ({
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onSearch,
  children,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white p-4 rounded-md shadow-sm border border-slate-100 ${className}`}>
      <div className="flex flex-col">
        <span className="text-slate-600 font-medium text-sm mb-1">Từ ngày (dd/mm/yyyy):</span>
        <VNDateInput
          value={fromDate}
          onChange={setFromDate}
          className="w-full border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm text-slate-800 bg-white"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-slate-600 font-medium text-sm mb-1">Đến ngày (dd/mm/yyyy):</span>
        <VNDateInput
          value={toDate}
          onChange={setToDate}
          className="w-full border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm text-slate-800 bg-white"
        />
      </div>
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={onSearch}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Search className="w-4 h-4" /> Tìm kiếm
        </button>
      </div>
      {children}
    </div>
  );
};
