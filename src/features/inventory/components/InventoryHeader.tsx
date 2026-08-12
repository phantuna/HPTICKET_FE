import React from 'react';
import { Boxes, AlertTriangle } from 'lucide-react';

interface InventoryHeaderProps {
  totalStockItems: number;
  lowStockCount: number;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({ totalStockItems, lowStockCount }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
    <div className="flex items-center gap-3.5">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
        <Boxes className="w-6 h-6" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black text-indigo-900 tracking-tight uppercase">QUẢN LÝ KHO SẢN PHẨM & DỊCH VỤ</h2>
          <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">/QuanLyKho</span>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Quản lý danh mục hàng hóa (Nước uống, quà lưu niệm, áo mưa...) & Lịch sử xuất nhập kho</p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-mono">
        <div className="text-slate-500 font-sans text-[11px]">Tổng Tồn Kho</div>
        <div className="text-slate-900 font-bold text-sm">{totalStockItems.toLocaleString('vi-VN')} món</div>
      </div>
      <div className={`px-3.5 py-2 rounded-xl text-xs font-mono border ${lowStockCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
        <div className="text-slate-500 font-sans text-[11px]">Cảnh Báo Hết Hàng</div>
        <div className="font-bold text-sm flex items-center gap-1">
          {lowStockCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />}
          {lowStockCount} sản phẩm
        </div>
      </div>
    </div>
  </div>
);
