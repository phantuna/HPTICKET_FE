import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Trash2,
  Loader2,
  Save,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileArchive,
  RefreshCw
} from 'lucide-react';
import { BackupJobResponse, BackupConfig, physicalBackupService } from '../../../api/physicalBackupService';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

interface PhysicalBackupTableProps {
  backups: BackupJobResponse[];
  onRefresh: () => void;
}

const PhysicalBackupTable: React.FC<PhysicalBackupTableProps> = ({ backups, onRefresh }) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [config, setConfig] = useState<BackupConfig>({
    backupIntervalMinutes: 1440,
    maxFiles: 7,
    backupPath: '/app/data/backup'
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const hasActiveJob = backups.some(b => b.status === 'RUNNING' || b.status === 'PENDING');
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  // Polling thông minh: nếu có job RUNNING/PENDING thì poll mỗi 3s, bình thường mỗi 30s
  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    const intervalMs = hasActiveJob ? 3000 : 30000;
    pollTimerRef.current = setInterval(() => {
      onRefresh();
    }, intervalMs);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [hasActiveJob, onRefresh]);

  const fetchConfig = async () => {
    try {
      const response = await physicalBackupService.getConfig();
      const rawData = response && (response as any).data ? (response as any).data : response;
      if (rawData) {
        setConfig({
          backupIntervalMinutes: rawData.backupIntervalMinutes ?? rawData.backup_interval_minutes ?? 1440,
          maxFiles: rawData.maxFiles ?? rawData.max_files ?? 7,
          backupPath: rawData.backupPath || rawData.backup_path || '/app/data/backup'
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.backupIntervalMinutes || config.backupIntervalMinutes < 1) {
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { title: 'Dữ liệu không hợp lệ', message: 'Khoảng thời gian sao lưu tối thiểu là 1 phút.', type: 'error' }
      }));
      return;
    }

    try {
      setIsSavingConfig(true);
      await physicalBackupService.updateConfig({
        backupIntervalMinutes: config.backupIntervalMinutes,
        maxFiles: config.maxFiles || 7
      });
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { title: 'Thành công', message: 'Lưu cấu hình tự động sao lưu thành công.', type: 'success' }
      }));
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { title: 'Lỗi', message: error.message || 'Lỗi khi lưu cấu hình', type: 'error' }
      }));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const promptDelete = (backupId: string) => {
    setDeleteId(backupId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await physicalBackupService.deleteBackup(deleteId);
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { title: 'Đã xóa', message: `Xóa bản sao lưu ${deleteId} thành công.`, type: 'success' }
      }));
      onRefresh();
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { title: 'Lỗi', message: error.message || 'Lỗi khi xóa bản sao lưu', type: 'error' }
      }));
    } finally {
      setDeleteId(null);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      setIsTriggering(true);
      await physicalBackupService.triggerBackup();
      window.dispatchEvent(new CustomEvent('backup_job_started'));
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: {
          title: 'Khởi chạy sao lưu',
          message: 'Đã kích hoạt tiến trình sao lưu CSDL (GZIP). Hệ thống đang chạy trong nền.',
          type: 'success'
        }
      }));
      onRefresh();
    } catch (error: any) {
      const errorMsg = error?.message || '';
      const isAlreadyRunning = errorMsg.includes('chạy') || errorMsg.includes('running') || errorMsg.includes('ALREADY_RUNNING');

      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: {
          title: isAlreadyRunning ? 'Đang có tiến trình chạy' : 'Lỗi tạo Backup',
          message: isAlreadyRunning
            ? 'Một tiến trình sao lưu khác đang thực thi. Vui lòng chờ hoàn tất.'
            : (error.message || 'Có lỗi xảy ra khi gọi API sao lưu.'),
          type: isAlreadyRunning ? 'warning' : 'error'
        }
      }));
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDownload = (backupId: string, fileName?: string) => {
    try {
      setDownloadingId(backupId);
      physicalBackupService.downloadBackup(backupId, fileName);
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { 
          title: 'Đang tải file sao lưu', 
          message: `Trình duyệt đang tải file ${fileName || `backup_${backupId}.sql.gz`}. Tiến trình chạy ngầm trong trình duyệt, bạn có thể chuyển sang trang khác bán vé bình thường.`, 
          type: 'success' 
        }
      }));
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { title: 'Lỗi tải file', message: error.message || 'Không thể tải file sao lưu.', type: 'error' }
      }));
    } finally {
      setTimeout(() => setDownloadingId(null), 1200);
    }
  };

  const formatSize = (bytes: number | null | undefined) => {
    if (bytes == null || bytes === undefined || isNaN(bytes) || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Chưa hoàn tất';
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderStatusBadge = (backup: BackupJobResponse) => {
    switch (backup.status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hoàn tất
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            Đang sao lưu...
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Đang chờ
          </span>
        );
      case 'FAILED':
        return (
          <div className="inline-flex flex-col items-center">
            <span
              title={backup.errorMessage || 'Tiến trình sao lưu gặp lỗi'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap cursor-help"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              Thất bại
            </span>
            {backup.errorMessage && (
              <span
                className="text-[10px] text-rose-500 font-normal max-w-[140px] truncate mt-0.5"
                title={backup.errorMessage}
              >
                {backup.errorMessage}
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Bảng danh sách Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Card Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-800">Sao lưu CSDL</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              GZIP (.sql.gz)
            </span>
          </div>
          <button
            onClick={onRefresh}
            title="Làm mới danh sách"
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${hasActiveJob ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        {/* Table Container với min-height và scroll sạch sẽ */}
        <div className="min-h-[220px] max-h-[380px] overflow-x-auto overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="sticky top-0 z-10 text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap min-w-[170px]">Bản sao lưu</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap min-w-[110px]">Dung lượng</th>
                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap min-w-[120px]">Trạng thái</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap min-w-[150px]">Thời gian</th>
                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap min-w-[90px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-gray-400">
                    <Database className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium text-sm text-gray-500">Chưa có bản sao lưu nào được tạo.</p>
                    <p className="text-xs text-gray-400 mt-1">Bấm nút "Tạo sao lưu CSDL" bên dưới để bắt đầu sao lưu.</p>
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.backupId} className="hover:bg-blue-50/40 transition-colors">
                    {/* Cột 1: Mã bản sao lưu */}
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileArchive className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>{backup.backupId}</span>
                      </div>
                    </td>

                    {/* Cột 2: Dung lượng */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {backup.status === 'FAILED' ? (
                        <span className="text-gray-400 font-mono text-xs">—</span>
                      ) : backup.status === 'RUNNING' || backup.status === 'PENDING' ? (
                        <span className="text-xs text-blue-600 font-medium italic">Đang nén GZIP...</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-800 text-xs">{formatSize(backup.totalSize)}</span>
                          <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1 py-0.5 rounded">
                            .sql.gz
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Cột 3: Trạng thái */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {renderStatusBadge(backup)}
                    </td>

                    {/* Cột 4: Thời gian */}
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {formatDate(backup.completedAt || backup.createdAt)}
                    </td>

                    {/* Cột 5: Thao tác */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {/* Nút Tải về */}
                        <button
                          onClick={() => handleDownload(backup.backupId, backup.fileName)}
                          disabled={backup.status !== 'COMPLETED' || downloadingId === backup.backupId}
                          title={backup.status === 'COMPLETED' ? 'Tải về file backup (.sql.gz)' : 'Chỉ tải được bản backup hoàn tất'}
                          className={`p-1.5 rounded-lg border transition-all ${
                            backup.status === 'COMPLETED'
                              ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm'
                              : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                          }`}
                        >
                          {downloadingId === backup.backupId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        {/* Nút Xóa */}
                        <button
                          onClick={() => promptDelete(backup.backupId)}
                          disabled={backup.status === 'RUNNING' || backup.status === 'PENDING'}
                          title={backup.status === 'RUNNING' ? 'Không thể xóa backup đang chạy' : 'Xóa bản sao lưu'}
                          className={`p-1.5 rounded-lg border transition-all ${
                            backup.status === 'RUNNING' || backup.status === 'PENDING'
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : 'bg-white text-red-500 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-sm'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer: Nút tạo Backup */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="text-xs text-gray-500">
            {hasActiveJob && (
              <span className="flex items-center gap-1.5 text-amber-600 font-medium animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                Hệ thống đang tiến hành sao lưu ngầm...
              </span>
            )}
          </div>
          <button
            onClick={handleTriggerBackup}
            disabled={isTriggering || hasActiveJob}
            title={hasActiveJob ? 'Hệ thống đang xử lý một bản sao lưu khác' : 'Tạo bản sao lưu mới ngay lập tức'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
              isTriggering || hasActiveJob
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-[#337ab7] text-white hover:bg-blue-700 hover:shadow'
            }`}
          >
            {isTriggering || hasActiveJob ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang sao lưu CSDL...</>
            ) : (
              <><Database className="w-4 h-4" /> Tạo sao lưu CSDL</>
            )}
          </button>
        </div>
      </div>

      {/* 2. Cấu hình tự động sao lưu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 shrink-0">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">Cấu hình tự động sao lưu CSDL</h3>
            <span className="text-xs text-gray-400 font-mono">Single-Flight Cron Scheduler</span>
          </div>

          <div className="space-y-3.5">
            {/* Khoảng sao lưu (phút) */}
            <div>
              <div className="flex items-center text-sm border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <div className="w-1/3 p-2.5 bg-gray-50 border-r border-gray-200 text-gray-700 font-medium text-xs">
                  Khoảng sao lưu
                </div>
                <input
                  type="number"
                  min={1}
                  value={config.backupIntervalMinutes ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      backupIntervalMinutes: e.target.value ? parseInt(e.target.value, 10) : 0
                    })
                  }
                  placeholder="Ví dụ: 10"
                  className="flex-1 p-2.5 bg-white text-gray-800 outline-none font-semibold text-sm"
                />
                <div className="w-20 p-2.5 bg-gray-50 text-gray-500 text-center border-l border-gray-200 font-medium text-xs">
                  phút
                </div>
              </div>

              {/* Các mốc gợi ý nhanh */}
              <div className="flex items-center gap-1.5 mt-2 pl-1">
                <span className="text-xs text-gray-400 mr-1">Gợi ý:</span>
                {[10, 30, 60, 1440].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setConfig({ ...config, backupIntervalMinutes: mins })}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      config.backupIntervalMinutes === mins
                        ? 'bg-blue-100 text-blue-700 font-bold border border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mins < 60 ? `${mins} phút` : mins === 60 ? '1 giờ' : '1 ngày'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sao lưu tối đa */}
            <div className="flex items-center text-sm border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <div className="w-1/3 p-2.5 bg-gray-50 border-r border-gray-200 text-gray-700 font-medium text-xs">
                Sao lưu tối đa
              </div>
              <input
                type="number"
                min={1}
                value={config.maxFiles ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxFiles: e.target.value ? parseInt(e.target.value, 10) : 0
                  })
                }
                placeholder="Ví dụ: 7"
                className="flex-1 p-2.5 bg-white text-gray-800 outline-none font-semibold text-sm"
              />
              <div className="w-20 p-2.5 bg-gray-50 text-gray-500 text-center border-l border-gray-200 font-medium text-xs">
                bản
              </div>
            </div>

            {/* Thư mục lưu trữ */}
            <div className="flex items-center text-sm border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
              <div className="w-1/3 p-2.5 bg-gray-50 border-r border-gray-200 text-gray-700 font-medium text-xs">
                Thư mục lưu
              </div>
              <div className="flex-1 p-2.5 bg-gray-100/70 text-gray-600 font-mono text-xs cursor-not-allowed select-none overflow-hidden text-ellipsis whitespace-nowrap">
                {config.backupPath || '/app/data/backup'}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className={`flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-lg transition-all shadow-sm ${
                isSavingConfig ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#337ab7] hover:bg-blue-700 hover:shadow'
              }`}
            >
              {isSavingConfig ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-4 h-4" /> Lưu lại</>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa bản sao lưu"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn bản sao lưu ${deleteId} không?\nHành động này sẽ xóa cả file nén trên máy chủ và không thể hoàn tác!`}
        type="danger"
        confirmText="Xóa bản sao lưu"
      />
    </div>
  );
};

export default PhysicalBackupTable;
