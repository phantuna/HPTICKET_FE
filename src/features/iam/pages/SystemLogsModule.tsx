import React, { useState, useEffect } from 'react';
import { FileText, Code, Clock, User, Eye } from 'lucide-react';
import { dbStore } from '../../../shared/data/mockDatabase';
import { SystemLog } from '../../../shared/types/hpticket';
import { iamService } from '../../../api/iamService';

export const SystemLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await iamService.fetchSystemLogs(page, 20);
        if (res?.data) {
          if (res.data.content && Array.isArray(res.data.content)) {
            setLogs(res.data.content);
          } else if (Array.isArray(res.data)) {
            setLogs(res.data);
          }
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        console.warn('Failed to fetch system logs from API, fallback to mock DB');
      }
    };
    loadLogs();
  }, [page]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Nhật Ký Hệ Thống & Ảnh Chụp CSDL (System Audit Logs)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tuân thủ nguyên tắc HPTicket: Bảng system_logs lưu vết ảnh chụp Snapshot dạng JSON (old_data / new_data)
        </p>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Thời Gian</th>
                <th className="p-3.5">Người Thực Hiện</th>
                <th className="p-3.5">Hành Động</th>
                <th className="p-3.5">Bảng Tác Động</th>
                <th className="p-3.5">Entity ID</th>
                <th className="p-3.5 text-center">Xem JSON Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-mono text-[11px] text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">@{log.username}</td>
                  <td className="p-3.5 font-mono">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-indigo-700 font-semibold">{log.entity_type}</td>
                  <td className="p-3.5 font-mono text-slate-600 truncate max-w-[120px]">{log.entity_id}</td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition inline-flex items-center gap-1"
                    >
                      <Code className="w-3.5 h-3.5 text-indigo-600" /> JSON Snapshot
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <span className="text-xs text-slate-500 font-medium">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Trang Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Trang Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" /> Bức Ảnh Chụp JSON (Snapshot) - {selectedLog.action}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition"
              >
                Đóng
              </button>
            </div>

            <div className="my-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-amber-700 mb-1">old_data (Dữ liệu trước thay đổi):</p>
                <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
                  {selectedLog.old_data ? JSON.stringify(selectedLog.old_data, null, 2) : 'null (Mới khởi tạo)'}
                </pre>
              </div>

              <div>
                <p className="text-xs font-bold text-emerald-700 mb-1">new_data (Dữ liệu sau thay đổi):</p>
                <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-emerald-800 font-medium overflow-x-auto">
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
