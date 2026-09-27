import React, { useState, useEffect } from 'react';
import { 
  Code, Eye, CheckCircle2, XCircle, HelpCircle, 
  ShieldCheck, AlertTriangle, Copy, Check, Clock, User, Globe 
} from 'lucide-react';
import { SystemLog } from '../../../../shared/types/hpticket';

export interface LogSnapshotModalProps {
  selectedLog: SystemLog;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Tên / Tiêu đề',
  code: 'Mã định danh',
  role: 'Vai trò / Phân quyền',
  status: 'Trạng thái',
  active: 'Kích hoạt',
  is_active: 'Kích hoạt',
  price: 'Giá vé / Đơn giá',
  quantity: 'Số lượng',
  phone: 'Số điện thoại',
  email: 'Địa chỉ Email',
  address: 'Địa chỉ',
  description: 'Mô tả',
  note: 'Ghi chú',
  discount: 'Giảm giá',
  discount_rate: 'Tỷ lệ giảm giá (%)',
  start_date: 'Ngày bắt đầu',
  end_date: 'Ngày kết thúc',
  customer_name: 'Tên khách hàng',
  booking_code: 'Mã đặt chỗ',
  total_amount: 'Tổng tiền',
  paid_amount: 'Tiền thanh toán',
  payment_method: 'Phương thức thanh toán',
  invoice_number: 'Số hóa đơn',
  counter_name: 'Quầy bán vé',
  gate_name: 'Cổng kiểm soát',
  zone_name: 'Khu vực / Phân vùng'
};

export const LogSnapshotModal: React.FC<LogSnapshotModalProps> = ({ selectedLog, onClose }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [copied, setCopied] = useState(false);

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

  const rawChanges = selectedLog.changes;
  let parsedChanges: Record<string, any> | null = null;
  if (rawChanges) {
    if (typeof rawChanges === 'string') {
      try {
        parsedChanges = JSON.parse(rawChanges);
      } catch (e) {
        parsedChanges = null;
      }
    } else if (typeof rawChanges === 'object') {
      parsedChanges = rawChanges;
    }
  }

  const changeKeys = parsedChanges ? Object.keys(parsedChanges) : [];
  const hasPasswordChange = changeKeys.includes('password');
  const regularChanges = changeKeys.filter(k => k !== 'password');

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(selectedLog, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">null (trống)</span>;
    if (typeof val === 'boolean') return val ? <span className="text-emerald-700 font-semibold">Bật (True)</span> : <span className="text-rose-700 font-semibold">Tắt (False)</span>;
    if (typeof val === 'object') return <span className="font-mono text-xs">{JSON.stringify(val)}</span>;
    return <span>{String(val)}</span>;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-extrabold text-slate-900 text-base">{selectedLog.action}</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {selectedLog.entity_type} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : ''}
              </span>
              {isSuccess && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Thành công
                </span>
              )}
              {isFailed && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Thất bại
                </span>
              )}
              {isUnknown && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Lịch sử cũ
                </span>
              )}
            </div>

            {/* Sub-info bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {new Date(selectedLog.created_at).toLocaleString()}
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
            className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold shadow-xs transition"
          >
            Đóng
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('visual')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'visual'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" /> So sánh trực quan
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'json'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4" /> Dữ liệu JSON kỹ thuật
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Failure Alert Box */}
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
                  <span className="font-semibold text-rose-700">Lý do: </span>{selectedLog.error_message}
                </div>
              )}
            </div>
          )}

          {activeTab === 'visual' ? (
            <div className="space-y-4">
              {/* Password change banner */}
              {hasPasswordChange && (
                <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Bảo mật mật khẩu:</strong> Mật khẩu tài khoản đã được thay đổi thành công. Giá trị mật khẩu được bảo vệ và mã hóa BCrypt an toàn.
                  </span>
                </div>
              )}

              {/* Visual Diff Table */}
              {parsedChanges && regularChanges.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-1/3">Thuộc Tính / Trường</th>
                        <th className="p-3 w-1/3 text-rose-800">Giá Trị Trước Đây (Cũ)</th>
                        <th className="p-3 w-1/3 text-emerald-800">Giá Trị Sau Khi Đổi (Mới)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {regularChanges.map((field) => {
                        const item = parsedChanges![field];
                        const hasOld = item && typeof item === 'object' && 'old' in item;
                        const hasNew = item && typeof item === 'object' && 'new' in item;
                        const oldVal = hasOld ? item.old : null;
                        const newVal = hasNew ? item.new : item;

                        const label = FIELD_LABELS[field] || field;

                        return (
                          <tr key={field} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-semibold text-slate-800">
                              <div>{label}</div>
                              {FIELD_LABELS[field] && (
                                <span className="font-mono text-[10px] text-slate-400 font-normal">{field}</span>
                              )}
                            </td>
                            <td className="p-3 text-rose-700 bg-rose-50/40">
                              {hasOld ? formatValue(oldVal) : <span className="text-slate-400 italic">--</span>}
                            </td>
                            <td className="p-3 text-emerald-700 bg-emerald-50/40 font-medium">
                              {formatValue(newVal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : !hasPasswordChange && (
                selectedLog.old_data || selectedLog.new_data ? (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-500 italic">
                      Bản ghi này thuộc dữ liệu lịch sử trước khi nâng cấp kiến trúc JSONB Diff. Hiển thị snapshot cũ:
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-800 mb-1">Dữ liệu trước thay đổi (old_data):</p>
                      <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
                        {typeof selectedLog.old_data === 'string' ? selectedLog.old_data : JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-800 mb-1">Dữ liệu sau thay đổi (new_data):</p>
                      <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-emerald-800 overflow-x-auto">
                        {typeof selectedLog.new_data === 'string' ? selectedLog.new_data : JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    {isFailed ? 'Không có thay đổi dữ liệu do hành động đã bị hủy bỏ.' : 'Hành động không làm thay đổi các trường dữ liệu hiển thị.'}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={handleCopyJson}
                className="absolute top-3 right-3 text-xs bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1 font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copied ? 'Đã sao chép' : 'Sao chép JSON'}
              </button>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[50vh]">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
          <button 
            onClick={onClose} 
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold transition shadow-xs"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};
