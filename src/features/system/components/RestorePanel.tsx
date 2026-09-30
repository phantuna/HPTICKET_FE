import React, { useState } from 'react';
import { AlertTriangle, HardDrive, Loader2, ShieldCheck, FileArchive, CheckCircle2 } from 'lucide-react';
import { BackupJobResponse, physicalBackupService } from '../../../api/physicalBackupService';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

interface RestorePanelProps {
  backups?: BackupJobResponse[];
}

const RestorePanel: React.FC<RestorePanelProps> = ({ backups = [] }) => {
  const [selectedBackup, setSelectedBackup] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const completedBackups = backups.filter(b => b.status?.toUpperCase() === 'COMPLETED');
  const activeBackupInfo = completedBackups.find(b => (b.backupId || (b as any).backup_id) === selectedBackup);

  const handleRestore = () => {
    if (!selectedBackup) {
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { title: 'Chưa chọn bản sao lưu', message: 'Vui lòng chọn một bản sao lưu để khôi phục.', type: 'error' }
      }));
      return;
    }
    setShowConfirm(true);
  };

  const executeRestore = async () => {
    setShowConfirm(false);
    try {
      setIsRestoring(true);
      await physicalBackupService.restoreBackup(selectedBackup);
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: {
          title: 'Đã khởi chạy khôi phục',
          message: `Tiến trình khôi phục bản sao lưu ${selectedBackup} đang thực thi ngầm trong Single Transaction an toàn.`,
          type: 'success'
        }
      }));
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: {
          title: 'Lỗi khôi phục',
          message: error.message || 'Có lỗi xảy ra khi gọi API khôi phục CSDL.',
          type: 'error'
        }
      }));
    } finally {
      setIsRestoring(false);
    }
  };

  const formatSize = (bytes: number | null | undefined) => {
    if (bytes == null || bytes === undefined || isNaN(bytes)) return 'Đang tính...';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="shrink-0 p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">Khôi phục CSDL</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Single-Transaction Safe
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        {/* Quy trình Khôi phục */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-2">Quy trình Khôi phục An toàn:</p>
          <div className="text-xs text-gray-600 bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-2 leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Giao dịch đơn nguyên vẹn:</strong> Dữ liệu được nạp vào Database trong 1 transaction duy nhất (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">--single-transaction</code>).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tự động ROLLBACK khi lỗi:</strong> Nếu file lỗi hoặc câu lệnh sai giữa chừng, hệ thống tự động hoàn tác 100%, không bao giờ để lại CSDL ở trạng thái nửa vời.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Không ngắt máy chủ:</strong> Quá trình khôi phục diễn ra trực tiếp qua container, Server backend tiếp tục hoạt động bình thường.
              </span>
            </div>
          </div>
        </div>

        {/* Dropdown chọn bản sao lưu */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn bản sao lưu để khôi phục:</label>
          <select
            value={selectedBackup}
            onChange={(e) => setSelectedBackup(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
          >
            <option value="">-- Chọn bản sao lưu (chỉ bản COMPLETED) --</option>
            {completedBackups.map(b => {
              const id = b.backupId || (b as any).backup_id;
              const size = b.totalSize ?? (b as any).total_size;
              const date = b.completedAt || (b as any).completed_at;
              return (
                <option key={id} value={id}>
                  {id} ({formatSize(size)} - {date ? new Date(date).toLocaleString('vi-VN') : ''})
                </option>
              );
            })}
          </select>
          {completedBackups.length === 0 && (
            <p className="text-xs text-rose-500 mt-2">Không có bản sao lưu nào ở trạng thái Hoàn tất (COMPLETED).</p>
          )}
        </div>

        {/* Thông tin bản backup đã chọn */}
        {activeBackupInfo && (
          <div className="mb-5 p-3.5 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">{activeBackupInfo.backupId || (activeBackupInfo as any).backup_id}</span>
              <span className="text-gray-400">|</span>
              <span>Dung lượng nén: <strong>{formatSize(activeBackupInfo.totalSize ?? (activeBackupInfo as any).total_size)}</strong></span>
            </div>
            <span className="text-gray-500">
              {(activeBackupInfo.completedAt || (activeBackupInfo as any).completed_at) ? new Date(activeBackupInfo.completedAt || (activeBackupInfo as any).completed_at).toLocaleString('vi-VN') : ''}
            </span>
          </div>
        )}

        {/* Cảnh báo ghi đè */}
        <div className="flex items-start gap-3 text-amber-800 bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <span className="text-xs font-medium leading-relaxed">
            <strong>Lưu ý:</strong> Dữ liệu CSDL hiện tại sẽ được cập nhật/thay thế bằng dữ liệu từ bản sao lưu được chọn. Hãy chắc chắn các giao dịch bán vé và ca trực tại POS đã tạm dừng trước khi tiến hành.
          </span>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleRestore}
            disabled={!selectedBackup || isRestoring}
            className={`w-full flex justify-center items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all shadow-sm text-white ${
              !selectedBackup || isRestoring
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 hover:shadow-md'
            }`}
          >
            {isRestoring ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang khởi chạy tiến trình khôi phục CSDL...</>
            ) : (
              <><HardDrive className="w-4 h-4" /> Xác nhận Khôi phục CSDL</>
            )}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeRestore}
        title="Xác nhận Khôi phục Cơ sở Dữ liệu"
        message={`Hệ thống sẽ tiến hành khôi phục CSDL về trạng thái tại bản sao lưu: ${selectedBackup}.\n\nToàn bộ quá trình được bảo vệ bằng cơ chế Single-Transaction (tự động ROLLBACK nếu có lỗi).\n\nBạn có chắc chắn muốn tiếp tục?`}
        type="warning"
        confirmText="Tiến hành Khôi phục"
      />
    </div>
  );
};

export default RestorePanel;
