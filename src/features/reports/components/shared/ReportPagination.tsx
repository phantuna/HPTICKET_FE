import React from 'react';

interface ReportPaginationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>> | ((p: number) => void);
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  itemUnitLabel?: string;
  className?: string;
}

export const ReportPagination: React.FC<ReportPaginationProps> = ({
  page,
  setPage,
  totalPages,
  totalElements,
  pageSize = 20,
  itemUnitLabel = 'bản ghi',
  className = ''
}) => {
  const actualTotal = totalElements ?? 0;
  const actualTotalPages = Math.max(1, totalPages);
  const start = actualTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, actualTotal);

  const handlePrev = () => {
    if (typeof setPage === 'function') {
      (setPage as any)((p: number) => Math.max(1, p - 1));
    }
  };

  const handleNext = () => {
    if (typeof setPage === 'function') {
      (setPage as any)((p: number) => Math.min(actualTotalPages, p + 1));
    }
  };

  return (
    <div className={`p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}>
      <span>
        {totalElements != null ? (
          <>
            Hiển thị <strong className="text-slate-900 font-mono">{start}</strong> - <strong className="text-slate-900 font-mono">{end}</strong> trong tổng số <strong className="text-emerald-700 font-mono">{actualTotal.toLocaleString('vi-VN')}</strong> {itemUnitLabel} (Trang <span className="font-mono font-bold text-slate-800">{page}</span> / <span className="font-mono">{actualTotalPages}</span>)
          </>
        ) : (
          <>
            Trang <span className="font-mono font-bold text-slate-800">{page}</span> / <span className="font-mono">{actualTotalPages}</span>
          </>
        )}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={page <= 1}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition shadow-2xs flex items-center gap-1"
        >
          ← Trước
        </button>
        <span className="px-2 py-1 text-slate-700 font-mono font-bold">
          {page} / {actualTotalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={page >= actualTotalPages}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition shadow-2xs flex items-center gap-1"
        >
          Sau →
        </button>
      </div>
    </div>
  );
};
