import React, { useEffect, useRef, useState } from 'react';
import { ShoppingBag, X, AlertTriangle } from 'lucide-react';
import { Product } from '../../../shared/types/hpticket';
import { useFormShortcuts } from '../../../shared/hooks';

// ---------------------------------------------------------------------------
// NumericInput – uncontrolled-during-edit pattern.
// Parent value changes are ignored while the field is focused.
// ---------------------------------------------------------------------------
interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  allowDecimal?: boolean;
  required?: boolean;
  id?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className,
  allowDecimal = false,
  required = false,
  id,
}) => {
  const [text, setText] = useState<string>(value === 0 ? '' : String(value));
  const isFocused = useRef(false);
  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;
    if (!isFocused.current) {
      setText(value === 0 ? '' : String(value));
    }
  }, [value]);

  const selectAll = (el: HTMLInputElement) => {
    el.select();
    requestAnimationFrame(() => {
      el.select();
      try { el.setSelectionRange(0, el.value.length); } catch (_) {}
    });
  };

  const parse = (raw: string): { text: string; num: number } => {
    if (allowDecimal) {
      let v = raw.replace(/[^0-9.]/g, '');
      const parts = v.split('.');
      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
      if (v.length > 1 && v.startsWith('0') && v[1] !== '.') {
        v = v.replace(/^0+/, '') || '0';
      }
      return { text: v, num: v === '' ? 0 : parseFloat(v) || 0 };
    } else {
      let d = raw.replace(/[^0-9]/g, '');
      if (d.length > 1) {
        d = d.replace(/^0+/, '') || '0';
      }
      return { text: d, num: d === '' ? 0 : parseInt(d, 10) || 0 };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { text: t, num } = parse(e.target.value);
    setText(t);
    onChange(num);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocused.current = true;
    selectAll(e.currentTarget);
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    selectAll(e.currentTarget);
  };

  const handleBlur = () => {
    isFocused.current = false;
    const current = latestValue.current;
    setText(current === 0 ? '' : String(current));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      required={required}
      value={text}
      placeholder={placeholder}
      onFocus={handleFocus}
      onClick={handleClick}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

// ---------------------------------------------------------------------------
// ProductFormModal
// ---------------------------------------------------------------------------
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
  newSupplier?: string; setNewSupplier?: (v: string) => void;
  adjustmentReason?: string; setAdjustmentReason?: (v: string) => void;
  loading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  editingProduct, newCode, setNewCode, newName, setNewName, newCategory, setNewCategory,
  newUnit, setNewUnit, newCostPrice, setNewCostPrice, newPrice, setNewPrice,
  newTaxPercent, setNewTaxPercent, newStock, setNewStock, newMinAlert, setNewMinAlert,
  newSupplier, setNewSupplier,
  adjustmentReason = '', setAdjustmentReason, loading = false, isSubmitting = false, onSubmit, onClose
}) => {
  const isBusy = Boolean(loading || isSubmitting);
  useFormShortcuts({
    isOpen: true,
    onClose,
    onSubmit,
    isSubmitting: isBusy,
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span>{editingProduct ? 'Sửa Sản Phẩm / Hàng Hóa' : 'Khai Báo Sản Phẩm Mới'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mã Sản Phẩm *</label>
            <div className="flex">
              <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 text-slate-500 font-mono font-bold text-xs">PROD-</span>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="VD: WATER-500ML"
                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-r-lg p-2 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phân Loại *</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
            >
              <option value="DRINK">Nước uống</option>
              <option value="SOUVENIR">Quà lưu niệm</option>
              <option value="FOOD">Thực phẩm</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Tên Sản Phẩm / Hàng Hóa *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Nước ngọt Pepsi lon 330ml"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Đơn Vị Tính</label>
            <input
              type="text"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Lon, Chai, Cái..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nhà Cung Cấp</label>
            <input
              type="text"
              value={newSupplier}
              onChange={(e) => setNewSupplier(e.target.value)}
              placeholder="e.g. PepsiCo Vietnam"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Giá Vốn Nhập (VND)</label>
            <NumericInput
              value={newCostPrice}
              onChange={setNewCostPrice}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Giá Bán Niêm Yết (VND)</label>
            <NumericInput
              value={newPrice}
              onChange={setNewPrice}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 font-bold outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Thuế VAT (%) *</label>
            <NumericInput
              value={newTaxPercent}
              onChange={setNewTaxPercent}
              allowDecimal={true}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 font-bold outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {editingProduct ? 'Tồn Kho Thực Tế' : 'Tồn Kho Ban Đầu'}
            </label>
            <NumericInput
              value={newStock}
              onChange={setNewStock}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cảnh Báo Tối Thiểu</label>
            <NumericInput
              value={newMinAlert}
              onChange={setNewMinAlert}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {editingProduct && Number(editingProduct.stock_quantity || 0) !== Number(newStock) && (
            <div className="col-span-2 bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Phát hiện chênh lệch tồn kho: {editingProduct.stock_quantity || 0} → {newStock} {newUnit || 'Cái'}{' '}
                  ({newStock > (editingProduct.stock_quantity || 0) ? `+${newStock - (editingProduct.stock_quantity || 0)}` : `${newStock - (editingProduct.stock_quantity || 0)}`})
                </span>
              </div>
              <label className="block font-semibold text-slate-700 text-xs">
                Lý do điều chỉnh kiểm kê <span className="text-red-500">* (bắt buộc để ghi log kiểm toán)</span>
              </label>
              <input
                type="text"
                required
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason && setAdjustmentReason(e.target.value)}
                placeholder="VD: Kiểm kê thực tế cuối ngày, hàng hỏng hao hụt, khớp lại sổ sách..."
                className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 outline-none focus:ring-1 focus:ring-amber-500 text-xs font-medium placeholder:text-slate-400"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button type="button" disabled={isBusy} onClick={onClose} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs rounded-lg transition">Hủy</button>
          <button
            type="submit"
            disabled={isBusy}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
          >
            {isBusy && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isBusy ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ProductFormModal;
