import React, { useState } from 'react';
import { ShieldAlert, PlayCircle, Loader2 } from 'lucide-react';
import { physicalBackupService } from '../../../api/physicalBackupService';

interface BackupControlPanelProps {
  onBackupTriggered: () => void;
}

const BackupControlPanel: React.FC<BackupControlPanelProps> = ({ onBackupTriggered }) => {
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTriggerBackup = async () => {
    try {
      setIsTriggering(true);
      await physicalBackupService.triggerBackup();
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: {
          title: 'Thành công',
          message: 'Đã gửi yêu cầu tạo Backup. Tiến trình đang chạy ngầm trên Server.',
          type: 'success'
        }
      }));
      onBackupTriggered();
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: {
          title: 'Lỗi tạo Backup',
          message: error.message || 'Có lỗi xảy ra khi gọi API.',
          type: 'error'
        }
      }));
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-emerald-100 rounded-xl shrink-0">
          <ShieldAlert className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 leading-tight">Điều khiển Sao lưu Thủ công</h2>
      </div>
      
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Hệ thống đang được cấu hình tự động sao lưu hàng ngày. Tuy nhiên, bạn có thể chủ động tạo một bản Full Backup mới bất cứ lúc nào trước khi thực hiện các thay đổi lớn về dữ liệu.
      </p>

      <div className="mb-6">
        <button
          onClick={handleTriggerBackup}
          disabled={isTriggering}
          className={`w-full flex justify-center items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${
            isTriggering 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
          }`}
        >
          {isTriggering ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Đang khởi tạo...</>
          ) : (
            <><PlayCircle className="w-4 h-4" /> Tạo Backup Ngay</>
          )}
        </button>
      </div>

      <div className="mt-auto p-4 bg-amber-50 border border-amber-100 rounded-lg">
        <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-2">
          Lưu ý quan trọng:
        </h3>
        <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
          <li>Chỉ cho phép 1 tiến trình chạy mỗi thời điểm.</li>
          <li>Các bản cũ hơn 7 ngày tự động bị dọn dẹp.</li>
          <li>DB lớn có thể tốn từ vài phút đến vài chục phút.</li>
        </ul>
      </div>
    </div>
  );
};

export default BackupControlPanel;
