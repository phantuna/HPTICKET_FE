import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from '../utils/toast';

interface ExportExcelButtonProps {
  onExport: () => Promise<void> | void;
  className?: string;
  buttonText?: string;
  loadingText?: string;
  toastStartMessage?: string;
  toastSuccessMessage?: string;
  toastErrorMessage?: string;
}

export const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  onExport,
  className,
  buttonText = "Xuất Excel",
  loadingText = "Đang xuất...",
  toastStartMessage = "Đang chuẩn bị dữ liệu, vui lòng đợi (có thể mất vài phút)...",
  toastSuccessMessage = "Tải file thành công!",
  toastErrorMessage = "Lỗi khi xuất dữ liệu. Vui lòng thử lại sau.",
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = async () => {
    if (isExporting) return;
    setIsExporting(true);
    toast.info(toastStartMessage);
    
    try {
      await onExport();
      toast.success(toastSuccessMessage);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || toastErrorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const defaultClasses = "px-4 py-2 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs text-white";
  const stateClasses = isExporting ? "bg-emerald-400 cursor-wait" : "bg-emerald-600 hover:bg-emerald-700";
  const buttonClass = className || `${defaultClasses} ${stateClasses} w-full sm:w-auto px-5`;

  // If a custom className is provided, we still want to apply opacity and cursor when exporting
  const finalClass = className ? `${className} ${isExporting ? 'opacity-70 cursor-wait pointer-events-none' : ''}` : buttonClass;

  return (
    <button 
      onClick={handleClick}
      disabled={isExporting}
      className={finalClass}
    >
      {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {isExporting ? loadingText : buttonText}
    </button>
  );
};
