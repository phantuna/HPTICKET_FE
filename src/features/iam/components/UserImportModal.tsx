import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Info
} from 'lucide-react';
import { iamService } from '../../../api/iamService';
import { toast } from '../../../shared/utils/toast';

interface UserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportErrorDetail {
  rowNumber: number;
  username: string;
  reason: string;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: ImportErrorDetail[];
}

export const UserImportModal: React.FC<UserImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
        toast.error('Vui lòng chỉ chọn file Excel (.xlsx hoặc .xls)!');
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.endsWith('.xlsx') && !dropped.name.endsWith('.xls')) {
        toast.error('Vui lòng chỉ chọn file Excel (.xlsx hoặc .xls)!');
        return;
      }
      setFile(dropped);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await iamService.downloadUserTemplate();
      toast.success('Đã tải xuống file mẫu Excel thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tải file mẫu. Vui lòng thử lại!');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Vui lòng chọn file Excel cần tải lên!');
      return;
    }

    try {
      setIsImporting(true);
      const res = await iamService.importUsersFromExcel(file);
      if (res.code === 200 && res.data) {
        setResult(res.data);
        if (res.data.successCount > 0) {
          toast.success(`Đã nhập thành công ${res.data.successCount} nhân sự!`);
          onSuccess();
        } else {
          toast.warning('Không có nhân sự nào được nhập vào hệ thống!');
        }
      } else {
        toast.error(res.message || 'Lỗi khi nhập file Excel!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xử lý file Excel!');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-slate-900">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Nhập danh sách nhân sự từ Excel</h2>
              <p className="text-xs text-slate-500 font-medium">Tạo hàng loạt tài khoản nhân viên nhanh chóng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Action: Tải file mẫu */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800">Khuyến nghị sử dụng file mẫu:</span>
                <p className="mt-0.5 text-slate-500">File mẫu đã chuẩn hóa các cột: Tên đăng nhập, Họ tên, Mã vai trò, Mã quầy... Sheet 2 chứa danh mục tra cứu.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
            >
              {isDownloadingTemplate ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-600" />
              )}
              Tải file mẫu (.xlsx)
            </button>
          </div>

          {/* Upload Dropzone */}
          {!result && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                file 
                  ? 'border-emerald-500 bg-emerald-50/40' 
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>

              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-800">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    Kích thước: {(file.size / 1024).toFixed(1)} KB — Nhấp hoặc kéo thả để đổi file khác
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700">
                    Kéo thả file Excel vào đây hoặc <span className="text-emerald-600 font-bold underline">chọn từ máy tính</span>
                  </p>
                  <p className="text-xs text-slate-400">Hỗ trợ định dạng .xlsx, .xls</p>
                </div>
              )}
            </div>
          )}

          {/* Import Result Box */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-500 font-medium">Tổng dòng</span>
                  <p className="text-xl font-bold text-slate-800 mt-1">{result.totalRows}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-emerald-700 font-medium">Thành công</span>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{result.successCount}</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-rose-700 font-medium">Thất bại</span>
                  <p className="text-xl font-bold text-rose-700 mt-1">{result.failedCount}</p>
                </div>
              </div>

              {result.failedCount > 0 && (
                <div className="border border-rose-200 rounded-xl overflow-hidden">
                  <div className="bg-rose-50 px-4 py-2 border-b border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    Chi tiết các dòng bị lỗi ({result.failedCount} dòng)
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-rose-100 bg-white">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="p-3 text-xs flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-800">Dòng {err.rowNumber}:</span>{' '}
                          {err.username && (
                            <span className="font-mono font-semibold text-slate-700 mr-2">[{err.username}]</span>
                          )}
                          <span className="text-rose-600 font-medium">{err.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.failedCount === 0 && result.successCount > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  Toàn bộ {result.successCount} nhân sự đã được tạo thành công và đồng bộ vào hệ thống!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {result ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" /> Nhập file khác
            </button>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Mật khẩu mặc định nếu trống: <span className="font-mono font-bold text-slate-700">123456</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
            >
              {result ? 'Đóng' : 'Hủy'}
            </button>

            {!result && (
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || isImporting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Bắt đầu nhập
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
