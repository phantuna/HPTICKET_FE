import React, { useState, useEffect } from 'react';
import { 
  Code, CheckCircle2, XCircle, HelpCircle, 
  AlertTriangle, Copy, Check, Clock, User, Globe, Hash,
  FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { SystemLog } from '../../../../shared/types/hpticket';
import { getEntityLabel, FIELD_LABELS, IGNORED_DIFF_KEYS, cleanActionTitle, resolveEntityName } from '../../../../shared/utils/auditLabels';

export interface LogSnapshotModalProps {
  selectedLog: SystemLog;
  onClose: () => void;
}

export const LogSnapshotModal: React.FC<LogSnapshotModalProps> = ({ selectedLog, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isFailed = selectedLog.result === 'FAILED';
  const isSuccess = selectedLog.result === 'SUCCESS';
  const isUnknown = !isFailed && !isSuccess;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(selectedLog, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseJsonSafe = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return null;
  };

  const formatValueSafe = (val: any): string => {
    if (val === null || val === undefined) return 'trống';
    if (typeof val === 'boolean') return val ? 'Bật (Hoạt động)' : 'Tắt (Tạm ngưng)';
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'trống (không có)';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const changesObj = parseJsonSafe(selectedLog.changes);
  const diffEntries: Array<{ key: string; label: string; oldVal: any; newVal: any }> = [];

  if (changesObj && typeof changesObj === 'object') {
    Object.keys(changesObj).forEach((k) => {
      if (IGNORED_DIFF_KEYS.has(k) || IGNORED_DIFF_KEYS.has(k.toLowerCase())) return;
      const item = changesObj[k];
      const label = (item && typeof item === 'object' && item.label) ? item.label : (FIELD_LABELS[k] || k);
      let oldVal = null;
      let newVal = null;

      if (item && typeof item === 'object' && ('old' in item || 'new' in item)) {
        oldVal = item.old;
        newVal = item.new;
      } else {
        newVal = item;
      }

      diffEntries.push({ key: k, label, oldVal, newVal });
    });
  }

  // Fallback: Nếu changes rỗng nhưng có old_data hoặc new_data
  if (diffEntries.length === 0) {
    const oData = parseJsonSafe((selectedLog as any).old_data || (selectedLog as any).oldData);
    const nData = parseJsonSafe((selectedLog as any).new_data || (selectedLog as any).newData);
    if (oData && nData && typeof oData === 'object' && typeof nData === 'object') {
      // Chuẩn hóa đồng bộ giữa active (DB) và isActive (DTO) tránh sinh 2 dòng đối lập
      if ('active' in oData && !('isActive' in oData)) oData.isActive = oData.active;
      if ('isActive' in oData && !('active' in oData)) oData.active = oData.isActive;
      if ('active' in nData && !('isActive' in nData)) nData.isActive = nData.active;
      if ('isActive' in nData && !('active' in nData)) nData.active = nData.isActive;

      const allKeys = new Set([...Object.keys(oData), ...Object.keys(nData)]);
      allKeys.forEach((k) => {
        if (IGNORED_DIFF_KEYS.has(k) || IGNORED_DIFF_KEYS.has(k.toLowerCase())) return;
        if (k === 'active' && allKeys.has('isActive')) return; // Ưu tiên hiển thị isActive có nhãn

        const oVal = oData[k];
        const nVal = nData[k];
        if (JSON.stringify(oVal) !== JSON.stringify(nVal)) {
          const label = FIELD_LABELS[k] || k;
          diffEntries.push({ key: k, label, oldVal: oVal, newVal: nVal });
        }
      });
    } else if (nData && typeof nData === 'object') {
      // Chỉ có dữ liệu mới (ẩn cột dữ liệu cũ theo ý người dùng)
      Object.keys(nData).forEach((k) => {
        if (IGNORED_DIFF_KEYS.has(k) || IGNORED_DIFF_KEYS.has(k.toLowerCase())) return;
        const label = FIELD_LABELS[k] || k;
        diffEntries.push({ key: k, label, oldVal: null, newVal: nData[k] });
      });
    }
  }

  const hasOldValues = diffEntries.some(e => e.oldVal !== null && e.oldVal !== undefined);
  const resolvedName = resolveEntityName(selectedLog);
  const actionTitle = cleanActionTitle(selectedLog.action, selectedLog.entity_type);
  const entityLabel = getEntityLabel(selectedLog.entity_type);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-extrabold text-slate-900 text-base">{actionTitle}</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {entityLabel}
                {resolvedName ? ` [${resolvedName}]` : (selectedLog.entity_id ? ` #${selectedLog.entity_id}` : '')}
              </span>
              {isSuccess && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Thành công
                </span>
              )}
              {isFailed && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Thất bại
                </span>
              )}
              {isUnknown && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Lịch sử cũ
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {new Date(selectedLog.created_at).toLocaleString('vi-VN')}
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> @{selectedLog.username || 'system'}
              </span>
              {selectedLog.ip_address && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> {selectedLog.ip_address}
                </span>
              )}
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold shadow-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Thông tin nhanh */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Người thực hiện
              </div>
              <div className="font-bold text-slate-800 text-sm">
                @{selectedLog.username || 'Hệ thống (system)'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Địa chỉ IP
              </div>
              <div className="font-bold text-slate-800 font-mono">
                {selectedLog.ip_address || 'Không xác định'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Thời điểm ghi nhận
              </div>
              <div className="font-semibold text-slate-800">
                {new Date(selectedLog.created_at).toLocaleString('vi-VN')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-slate-400 font-medium flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Đối tượng tác động
              </div>
              <div className="font-semibold text-slate-800 truncate" title={resolvedName || selectedLog.entity_id || ''}>
                {resolvedName ? resolvedName : (selectedLog.entity_id || 'N/A')}
              </div>
            </div>
          </div>

          {/* Hộp thông báo lỗi nếu thao tác thất bại */}
          {isFailed && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Thao tác bị lỗi / Từ chối thực thi
              </div>
              {selectedLog.error_code && (
                <div className="text-xs font-mono">
                  <span className="font-semibold text-rose-700">Mã lỗi: </span>{selectedLog.error_code}
                </div>
              )}
              {selectedLog.error_message && (
                <div className="text-xs">
                  <span className="font-semibold text-rose-700">Nguyên nhân: </span>{selectedLog.error_message}
                </div>
              )}
            </div>
          )}

          {/* BẢNG SO SÁNH TRỰC QUAN THAY ĐỔI DỮ LIỆU */}
          {diffEntries.length > 0 ? (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                {hasOldValues ? `Bảng so sánh thay đổi dữ liệu (${diffEntries.length} trường)` : `Chi tiết thông tin dữ liệu (${diffEntries.length} trường)`}
              </span>
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs table-fixed min-w-[580px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3.5 w-[26%] sm:w-[22%]">Thuộc tính</th>
                      {hasOldValues && (
                        <th className="py-2.5 px-3.5 w-[37%] sm:w-[39%] text-rose-700">Trước khi sửa</th>
                      )}
                      <th className={`py-2.5 px-3.5 ${hasOldValues ? 'w-[37%] sm:w-[39%]' : 'w-[74%] sm:w-[78%]'} text-emerald-700`}>
                        {hasOldValues ? 'Sau khi sửa' : 'Giá trị thiết lập'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {diffEntries.map(({ key, label, oldVal, newVal }) => {
                      const oldStr = formatValueSafe(oldVal);
                      const newStr = formatValueSafe(newVal);

                      return (
                        <tr key={key} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3.5 font-semibold text-slate-800 break-words align-top">
                            <div>{label}</div>
                            <div className="text-[10px] font-mono text-slate-400 font-normal">{key}</div>
                          </td>
                          {hasOldValues && (
                            <td className="py-2.5 px-3.5 align-top">
                              {oldVal !== null && oldVal !== undefined ? (
                                <span className="inline-block max-w-full px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100 line-through break-all whitespace-normal">
                                  {oldStr}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">trống</span>
                              )}
                            </td>
                          )}
                          <td className="py-2.5 px-3.5 align-top">
                            {newVal !== null && newVal !== undefined ? (
                              <span className="inline-block max-w-full px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 break-all whitespace-normal">
                                {newStr}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">trống</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-slate-500 text-xs space-y-1">
              <div className="font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Không có dữ liệu chi tiết thuộc tính thay đổi
              </div>
              <p className="text-[11px] text-slate-400">
                Bản ghi nhật ký này được tạo trước thời điểm nâng cấp hệ thống hoặc không có trường dữ liệu nào bị thay đổi.
              </p>
            </div>
          )}

          {/* Dữ liệu kỹ thuật JSON (Cho phép đóng/mở) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 transition"
              >
                <Code className="w-4 h-4 text-slate-400" />
                {showRawJson ? 'Thu gọn dữ liệu JSON kỹ thuật' : 'Xem dữ liệu JSON kỹ thuật'}
                {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleCopyJson}
                className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1 font-semibold transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                {copied ? 'Đã sao chép' : 'Sao chép JSON'}
              </button>
            </div>

            {showRawJson && (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[35vh]">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
          <button 
            onClick={onClose} 
            className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl font-bold transition shadow-xs"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};
