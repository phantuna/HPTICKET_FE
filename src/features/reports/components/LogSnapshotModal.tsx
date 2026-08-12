import React from 'react';
import { Code } from 'lucide-react';

interface LogSnapshotModalProps {
  selectedLog: any;
  onClose: () => void;
}

export const LogSnapshotModal: React.FC<LogSnapshotModalProps> = ({ selectedLog, onClose }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-900">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Code className="w-5 h-5 text-indigo-600" /> Snapshot JSON - {selectedLog.action}</h3>
        <button onClick={onClose} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">Đóng</button>
      </div>
      <div className="my-4 space-y-4">
        <div>
          <p className="text-xs font-bold text-amber-700 mb-1">old_data (Dữ liệu trước thay đổi):</p>
          <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">{selectedLog.old_data ? JSON.stringify(selectedLog.old_data, null, 2) : 'null (Khởi tạo mới)'}</pre>
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-700 mb-1">new_data (Dữ liệu sau thay đổi):</p>
          <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-emerald-800 overflow-x-auto">{selectedLog.new_data ? JSON.stringify(selectedLog.new_data, null, 2) : 'null'}</pre>
        </div>
      </div>
    </div>
  </div>
);
