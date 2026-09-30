import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

export interface VNDateInputProps {
  value: string; // Chuẩn ISO YYYY-MM-DD
  onChange: (val: string) => void; // Trả về chuẩn ISO YYYY-MM-DD (không đổi logic BE)
  className?: string; // Class CSS cho input (chứa style viền, màu, font, và có thể chứa w-...)
  wrapperClassName?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
}

/**
 * Component nhập/chọn ngày chuẩn Định Dạng Việt Nam (DD/MM/YYYY)
 * - Hiển thị trên giao diện luôn luôn là: Ngày / Tháng / Năm (dd/MM/yyyy)
 * - Giá trị (value) và callback (onChange) luôn là: YYYY-MM-DD (Chuẩn ISO, giữ nguyên 100% logic Backend)
 * - Click vào mở popup lịch trực quan
 * - Cho phép nhập tay trực tiếp dạng dd/mm/yyyy
 * - Tự động khít với container, không bao giờ bị tràn layout hay đè chữ
 */
export const VNDateInput: React.FC<VNDateInputProps> = ({
  value,
  onChange,
  className = '',
  wrapperClassName = '',
  min,
  max,
  disabled = false,
  placeholder = 'dd/mm/yyyy',
  id,
  name,
}) => {
  const nativePickerRef = useRef<HTMLInputElement>(null);

  // Chuyển YYYY-MM-DD sang DD/MM/YYYY
  const isoToVn = (isoStr: string): string => {
    if (!isoStr) return '';
    const clean = String(isoStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      if (y && m && d) return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return isoStr;
  };

  // Chuyển DD/MM/YYYY sang YYYY-MM-DD
  const vnToIso = (vnStr: string): string | null => {
    if (!vnStr) return '';
    const parts = vnStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
    return null;
  };

  const [inputText, setInputText] = useState<string>(() => isoToVn(value));

  // Đồng bộ khi value từ prop cha thay đổi
  useEffect(() => {
    setInputText(isoToVn(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);
    const parsedIso = vnToIso(raw);
    if (parsedIso) {
      onChange(parsedIso);
    }
  };

  const handleBlur = () => {
    const parsed = vnToIso(inputText);
    if (parsed) {
      onChange(parsed);
      setInputText(isoToVn(parsed));
    } else if (inputText.trim() === '') {
      onChange('');
      setInputText('');
    } else {
      setInputText(isoToVn(value));
    }
  };

  const openCalendar = () => {
    if (disabled) return;
    if (nativePickerRef.current) {
      if (typeof nativePickerRef.current.showPicker === 'function') {
        try {
          nativePickerRef.current.showPicker();
        } catch {
          nativePickerRef.current.focus();
        }
      } else {
        nativePickerRef.current.focus();
      }
    }
  };

  // Bóc tách class width nếu có để gán trực tiếp cho wrapper
  const widthRegex = /\b(w-(?:\[[^\]]+\]|\S+))\b/;
  const widthMatch = className.match(widthRegex) || wrapperClassName.match(widthRegex);
  const containerWidth = widthMatch ? widthMatch[1] : 'w-full';

  // Lọc bỏ class width khỏi input để input luôn lọt vừa khít w-full bên trong wrapper
  const cleanInputClass = className.replace(widthRegex, '').trim();

  return (
    <div
      className={`relative inline-flex items-center shrink-0 ${containerWidth} ${wrapperClassName} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {/* Input hiển thị định dạng ngày/tháng/năm dd/MM/yyyy */}
      <input
        type="text"
        id={id}
        name={name}
        disabled={disabled}
        placeholder={placeholder}
        value={inputText}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={`w-full min-w-0 box-border text-center font-mono ${cleanInputClass} pr-8 font-medium`}
      />

      {/* Nút bấm biểu tượng Lịch để mở popup chọn ngày */}
      <button
        type="button"
        tabIndex={-1}
        onClick={openCalendar}
        disabled={disabled}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-emerald-600 focus:outline-none transition-colors p-1 rounded cursor-pointer"
        title="Chọn ngày trên lịch (dd/MM/yyyy)"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>

      {/* Native picker ẩn dùng để mở popup lịch của trình duyệt */}
      <input
        ref={nativePickerRef}
        type="date"
        tabIndex={-1}
        disabled={disabled}
        min={min}
        max={max}
        value={value || ''}
        onChange={(e) => {
          const newVal = e.target.value;
          onChange(newVal);
          setInputText(isoToVn(newVal));
        }}
        className="absolute bottom-0 right-0 w-0 h-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
