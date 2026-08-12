import React from 'react';
import { FileText, Users, RefreshCw, X } from 'lucide-react';

interface InvoiceActionBarProps {
  selectedCount: number;
  isSubmitting: boolean;
  todayDate: string; // YYYY-MM-DD
  onIssueSelected: () => void;      // Mở modal nhập thông tin MST
  onIssueBulkRetail: () => void;    // Gộp HĐ cuối ngày cho khách lẻ
  onClearSelection: () => void;
}

/**
 * Thanh hành động HĐDT - hiện ra khi người dùng đã chọn ít nhất 1 đơn hàng.
 * Nằm giữa filter bar và bảng đơn hàng.
 */
export const InvoiceActionBar: React.FC<InvoiceActionBarProps> = ({
  selectedCount,
  isSubmitting,
  todayDate,
  onIssueSelected,
  onIssueBulkRetail,
  onClearSelection,
}) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Badge số lượng đã chọn */}
      <div className="flex items-center gap-2">
        <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {selectedCount} đã chọn
        </span>
        <button
          onClick={onClearSelection}
          className="text-blue-400 hover:text-blue-600 transition"
          title="Bỏ chọn tất cả"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-wrap gap-2">
        {/* Nút phát hành HĐ cho đơn đã chọn (khách công ty) */}
        <button
          onClick={onIssueSelected}
          disabled={isSubmitting || selectedCount === 0}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition shadow-sm"
        >
          {isSubmitting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          Tạo HĐ Nháp ({selectedCount} đơn)
        </button>

        {/* Nút gộp HĐ cuối ngày - không cần chọn từng đơn */}
        <button
          onClick={onIssueBulkRetail}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition shadow-sm"
        >
          <Users className="w-3.5 h-3.5" />
          Gộp HĐ Nháp Khách Lẻ ({todayDate})
        </button>
      </div>
    </div>
  );
};
