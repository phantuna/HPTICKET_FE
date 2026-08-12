import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product } from '../../../shared/types/hpticket';

interface ProductFormModalProps {
  editingProduct: Product | null;
  newCode: string; setNewCode: (v: string) => void;
  newName: string; setNewName: (v: string) => void;
  newCategory: string; setNewCategory: (v: string) => void;
  newUnit: string; setNewUnit: (v: string) => void;
  newCostPrice: number; setNewCostPrice: (v: number) => void;
  newPrice: number; setNewPrice: (v: number) => void;
  newTaxPercent: number; setNewTaxPercent: (v: number) => void;
  newStock: number; setNewStock: (v: number) => void;
  newMinAlert: number; setNewMinAlert: (v: number) => void;
  newSupplier: string; setNewSupplier: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  editingProduct, newCode, setNewCode, newName, setNewName, newCategory, setNewCategory,
  newUnit, setNewUnit, newCostPrice, setNewCostPrice, newPrice, setNewPrice,
  newTaxPercent, setNewTaxPercent, newStock, setNewStock, newMinAlert, setNewMinAlert,
  newSupplier, setNewSupplier, onSubmit, onClose
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-900 space-y-4">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <ShoppingBag className="w-5 h-5 text-indigo-600" /> {editingProduct ? 'Sửa Sản Phẩm' : 'Khai Báo Sản Phẩm Mới'} (/QuanLyKho)
      </h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Mã Sản Phẩm *</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 font-mono font-bold text-xs">PROD-</span>
            <input type="text" required value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="VD: WATER-500ML" className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-r-xl p-2.5 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 uppercase" />
          </div>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Phân Loại *</label>
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-medium">
            <option value="DRINK">Nước uống</option><option value="SOUVENIR">Quà lưu niệm</option><option value="FOOD">Thực phẩm</option><option value="OTHER">Khác</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Tên Sản Phẩm / Hàng Hóa *</label>
          <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Nước ngọt Pepsi lon 330ml" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-semibold" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Đơn Vị Tính</label>
          <input type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="Lon, Chai, Cái..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Nhà Cung Cấp</label>
          <input type="text" value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="e.g. PepsiCo Vietnam" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Giá Vốn Nhập (VND)</label>
          <input type="number" value={newCostPrice} onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Giá Bán Niêm Yết (VND)</label>
          <input type="number" value={newPrice} onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 font-bold text-indigo-700 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Thuế VAT (%) *</label>
          <input type="number" min="0" max="100" step="0.1" value={newTaxPercent} onChange={(e) => setNewTaxPercent(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Tồn Kho Ban Đầu</label>
          <input type="number" value={newStock} onChange={(e) => setNewStock(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Ngưỡng Cảnh Báo Tồn Tối Thiểu</label>
          <input type="number" value={newMinAlert} onChange={(e) => setNewMinAlert(parseInt(e.target.value) || 10)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition">Hủy</button>
        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs">Lưu Sản Phẩm</button>
      </div>
    </form>
  </div>
);
