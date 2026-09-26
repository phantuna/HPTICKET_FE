import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { Product } from '../../../shared/types/hpticket';

// ---------------------------------------------------------------------------
// NumericInput – fully isolated local state, NO useEffect sync from parent.
// Strategy:
//   1. Parse & display value from props ONLY on first mount (initial state).
//   2. During editing (focused), the component is uncontrolled – parent value
//      changes are ignored so React never resets the cursor.
//   3. On blur we flush the canonical number up to the parent.
//   4. On focus/click we select-all with setTimeout to beat mouseup collapse.
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

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className,
  allowDecimal = false,
  required = false,
  id,
}) => {
  // Local string representation of the number – what the user actually sees.
  const [text, setText] = useState<string>(value === 0 ? '' : String(value));
  // Whether the input is currently focused.
  const isFocused = useRef(false);
  // Keep the latest `value` prop in a ref so we can sync ONLY when unfocused.
  const latestValue = useRef(value);

  // When value prop changes from outside (e.g. modal reset, parent state reset)
  // we only update local text if the user is NOT currently editing.
  useEffect(() => {
    latestValue.current = value;
    if (!isFocused.current) {
      setText(value === 0 ? '' : String(value));
    }
  }, [value]);

  // Select-all that survives Chromium's mouseup cursor collapse.
  const selectAll = (el: HTMLInputElement) => {
    el.select();
    // Schedule a second call after the browser's mouseup handler fires.
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
      // Strip leading zeros unless it's "0.xxx"
      if (v.length > 1 && v.startsWith('0') && v[1] !== '.') {
        v = v.replace(/^0+/, '') || '0';
      }
      return { text: v, num: v === '' ? 0 : parseFloat(v) || 0 };
    } else {
      let d = raw.replace(/[^0-9]/g, '');
      // Strip leading zeros
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
    // Only select-all if the whole field is not yet partially selected by user drag.
    selectAll(e.currentTarget);
  };

  const handleBlur = () => {
    isFocused.current = false;
    // On blur, normalise display – e.g. empty → show placeholder, not "0".
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
// StockMovementModal
// ---------------------------------------------------------------------------
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
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {movementType === 'IMPORT' ? (
              <ArrowDownLeft className="w-5 h-5 text-blue-600" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-amber-600" />
            )}
            <span>{movementType === 'IMPORT' ? 'Nhập Kho Bổ Sung' : 'Xuất Kho Điều Chuyển'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <div className="font-bold text-slate-900">{selectedProductForIn.name}</div>
          <div className="font-mono text-slate-500">Mã: {selectedProductForIn.code}</div>
          <div className="text-slate-700 font-medium mt-1">
            Tồn kho hiện tại: <span className="font-bold font-mono text-blue-700">{Number(selectedProductForIn.stock_quantity || 0).toLocaleString('vi-VN')}</span> {selectedProductForIn.unit || 'Cái'}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Số Lượng {movementType === 'IMPORT' ? 'Nhập Thêm' : 'Xuất Bớt'} *
            </label>
            <NumericInput
              required
              value={movementQty}
              onChange={setMovementQty}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Đơn Giá {movementType === 'IMPORT' ? 'Nhập Vốn' : 'Bán'} (VND)
            </label>
            <NumericInput
              value={movementUnitPrice}
              onChange={setMovementUnitPrice}
              placeholder={`Mặc định: ${(movementType === 'IMPORT' ? selectedProductForIn.cost_price || 0 : selectedProductForIn.price).toLocaleString('vi-VN')} đ`}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi Chú / Lý Do</label>
            <input
              type="text"
              value={movementNote}
              onChange={(e) => setMovementNote(e.target.value)}
              placeholder="Lý do nhập/xuất kho..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition">Hủy</button>
          <button
            type="submit"
            className={`flex-1 py-2 text-white font-bold text-xs rounded-lg transition shadow-xs ${
              movementType === 'IMPORT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            Xác Nhận {movementType === 'IMPORT' ? 'Nhập Kho' : 'Xuất Kho'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default StockMovementModal;
