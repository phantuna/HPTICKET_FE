import React from 'react';
import { Settings } from 'lucide-react';
import { BackupSettings, systemService } from '../../../api/systemService';
import { toast } from '../../../shared/utils/toast';

interface BackupSettingsFormProps {
  settings: BackupSettings;
  setSettings: React.Dispatch<React.SetStateAction<BackupSettings>>;
}

const BackupSettingsForm: React.FC<BackupSettingsFormProps> = ({ settings, setSettings }) => {
  const handleSaveSettings = async () => {
    try {
      await systemService.saveBackupSettings(settings);
      toast.success('Đã lưu cấu hình thành công!');
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-500" />
        Cấu hình tự động sao lưu CSDL
      </h2>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Khung giờ sao lưu</label>
          <select 
            value={settings.cron_expression}
            onChange={e => setSettings({...settings, cron_expression: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          >
            <option value="0 0 0 * * ?">Hàng ngày lúc 00:00 (Nửa đêm)</option>
            <option value="0 0 2 * * ?">Hàng ngày lúc 02:00 sáng</option>
            <option value="0 0 12 * * ?">Hàng ngày lúc 12:00 trưa</option>
            <option value="0 0 2 ? * SUN">Hàng tuần vào 02:00 sáng Chủ Nhật</option>
            <option value="0 0 2 1 * ?">Hàng tháng vào 02:00 sáng ngày 1</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sao lưu tối đa (file)</label>
          <input 
            type="number" 
            value={settings.max_files}
            onChange={e => setSettings({...settings, max_files: Number(e.target.value)})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thư mục lưu</label>
          <input 
            type="text" 
            value={settings.backup_path}
            onChange={e => setSettings({...settings, backup_path: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={handleSaveSettings} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Lưu cấu hình
        </button>
      </div>
    </div>
  );
};

export default BackupSettingsForm;
