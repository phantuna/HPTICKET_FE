import React from 'react';
import { ShoppingBag, History, Plus } from 'lucide-react';

interface InventoryTabsProps {
  currentTab: string;
  setTab: (t: string) => void;
  productsCount: number;
  stockLogsCount: number;
  onAddNew: () => void;
}

export const InventoryTabs: React.FC<InventoryTabsProps> = ({ currentTab, setTab, productsCount, stockLogsCount, onAddNew }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs overflow-x-auto scrollbar-none">
    <div className="flex items-center gap-2">
      <button onClick={() => setTab('KhoHang')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${currentTab === 'KhoHang' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
        <ShoppingBag className="w-4 h-4" /><span>Danh Sách Tồn Kho ({productsCount})</span>
      </button>
      <button onClick={() => setTab('LichSu')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${currentTab === 'LichSu' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
        <History className="w-4 h-4" /><span>Lịch Sử Nhập Xuất Kho ({stockLogsCount})</span>
      </button>
    </div>
    <button onClick={onAddNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap">
      <Plus className="w-4 h-4" /><span>Khai Báo Sản Phẩm Mới</span>
    </button>
  </div>
);
