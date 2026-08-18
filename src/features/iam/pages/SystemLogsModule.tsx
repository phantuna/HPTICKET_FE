import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Code, Search, Download, RefreshCw, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { SystemLog } from '../../../shared/types/hpticket';
import { iamService } from '../../../api/iamService';

const getTodayStr = () => new Date().toISOString().split('T')[0];

export const SystemLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  // Bộ lọc ngày - mặc định hôm nay
  const [fromDate, setFromDate] = useState(getTodayStr());
  const [toDate, setToDate] = useState(getTodayStr());
  const [pendingFrom, setPendingFrom] = useState(getTodayStr());
  const [pendingTo, setPendingTo] = useState(getTodayStr());

  const loadLogs = useCallback(async (p = 0, from = fromDate, to = toDate) => {
    setLoading(true);
    try {
      const res = await iamService.fetchSystemLogs(p, 20, from, to);
      if (res?.data) {
        if (res.data.content && Array.isArray(res.data.content)) {
          setLogs(res.data.content);
        } else if (Array.isArray(res.data)) {
          setLogs(res.data);
        }
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch system logs:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadLogs(page, fromDate, toDate);
  }, [page]);

  // Khi bấm Tìm kiếm
  const handleSearch = () => {
    setFromDate(pendingFrom);
    setToDate(pendingTo);
    setPage(0);
    loadLogs(0, pendingFrom, pendingTo);
  };

  // Reset về hôm nay
  const handleReset = () => {
    const today = getTodayStr();
    setPendingFrom(today);
    setPendingTo(today);
    setFromDate(today);
    setToDate(today);
    setPage(0);
    loadLogs(0, today, today);
  };

  const getActionStyle = (action: string) => {
    if (action.includes('Thêm') || action === 'CREATE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('Cập nhật') || action === 'UPDATE') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('Xóa') || action === 'DELETE') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 text-slate-900">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Nhật Ký Lịch Sử Hệ Thống
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi lại tất cả các thay đổi dữ liệu trong hệ thống theo thời gian thực
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-lg font-bold">
              {totalElements.toLocaleString('vi-VN')} bản ghi
            </span>
          </div>
        </div>

        {/* Bộ lọc ngày */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Lọc theo ngày:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Từ ngày</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={pendingFrom}
                  onChange={e => setPendingFrom(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>
            <span className="text-slate-400 text-sm mt-4">→</span>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Đến ngày</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={pendingTo}
                  onChange={e => setPendingTo(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
          >
            <Search className="w-3.5 h-3.5" /> Tìm kiếm
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Hôm nay
          </button>
        </div>
      </div>

      {/* Bảng log */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Đang tải nhật ký...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">Không có bản ghi nào trong khoảng thời gian này</p>
            <p className="text-xs mt-1">Thử chọn khoảng ngày khác</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-40">Thời Gian</th>
                  <th className="p-3.5 w-32">Người Thực Hiện</th>
                  <th className="p-3.5 w-40">Hành Động</th>
                  <th className="p-3.5 w-36">Bảng Tác Động</th>
                  <th className="p-3.5">Entity ID</th>
                  <th className="p-3.5 text-center w-32">JSON Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">@{log.username}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActionStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-indigo-700 font-semibold text-[11px]">
                      {log.entity_type}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px] truncate max-w-[160px]">
                      {log.entity_id}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition inline-flex items-center gap-1"
                      >
                        <Code className="w-3.5 h-3.5 text-indigo-600" /> JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <span className="text-xs text-slate-500 font-medium">
            Trang <strong>{page + 1}</strong> / {totalPages} &nbsp;·&nbsp; Tổng <strong>{totalElements.toLocaleString('vi-VN')}</strong> bản ghi
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page number pills */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition ${page === pageNum ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-600" /> JSON Snapshot
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] border ${getActionStyle(selectedLog.action)}`}>{selectedLog.action}</span>
                  &nbsp;·&nbsp; <strong>@{selectedLog.username}</strong>
                  &nbsp;·&nbsp; {new Date(selectedLog.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition font-semibold">
                Đóng
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" />
                  old_data (Dữ liệu trước thay đổi):
                </p>
                <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
                  {selectedLog.old_data ? JSON.stringify(selectedLog.old_data, null, 2) : 'null  // Mới khởi tạo'}
                </pre>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
                  new_data (Dữ liệu sau thay đổi):
                </p>
                <pre className="bg-slate-950 text-emerald-300 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
                  {selectedLog.new_data ? JSON.stringify(selectedLog.new_data, null, 2) : 'null'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
