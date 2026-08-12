import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Product } from '../../../shared/types/hpticket';

interface StockMovementModalProps {
  selectedProductForIn: Product;
  movementType: 'IMPORT' | 'EXPORT';
  movementQty: number; setMovementQty: (v: number) => void;
  movementUnitPrice: number; setMovementUnitPrice: (v: number) => void;
  movementNote: string; setMovementNote: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  selectedProductForIn, movementType, movementQty, setMovementQty,
  movementUnitPrice, setMovementUnitPrice, movementNote, setMovementNote,
  onSubmit, onClose
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-900 space-y-4">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        {movementType === 'IMPORT' ? <ArrowDownLeft className="w-5 h-5 text-emerald-600" /> : <ArrowUpRight className="w-5 h-5 text-amber-600" />}
        {movementType === 'IMPORT' ? 'Nhập Kho Bổ Sung' : 'Xuất Kho Điều Chuyển'}
      </h3>
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
        <div className="font-bold text-slate-900">{selectedProductForIn.name}</div>
        <div className="font-mono text-slate-500">Mã: {selectedProductForIn.code}</div>
        <div className="text-slate-700 font-medium mt-1">Tồn kho hiện tại: <span className="font-bold font-mono text-indigo-700">{selectedProductForIn.stock_quantity}</span> {selectedProductForIn.unit || 'Cái'}</div>
      </div>
      <div className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Số Lượng {movementType === 'IMPORT' ? 'Nhập Thêm' : 'Xuất Bớt'} *</label>
          <input type="number" min="1" required value={movementQty} onChange={(e) => setMovementQty(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Đơn Giá {movementType === 'IMPORT' ? 'Nhập Vốn' : 'Bán'} (VND)</label>
          <input type="number" value={movementUnitPrice} onChange={(e) => setMovementUnitPrice(parseFloat(e.target.value) || 0)} placeholder={`Mặc định: ${(movementType === 'IMPORT' ? selectedProductForIn.cost_price || 0 : selectedProductForIn.price).toLocaleString('vi-VN')} đ`} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Ghi Chú / Lý Do</label>
          <input type="text" value={movementNote} onChange={(e) => setMovementNote(e.target.value)} placeholder="Lý do nhập/xuất kho..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition">Hủy</button>
        <button type="submit" className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl transition shadow-xs ${movementType === 'IMPORT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
          Xác Nhận {movementType === 'IMPORT' ? 'Nhập Kho' : 'Xuất Kho'}
        </button>
      </div>
    </form>
  </div>
);
