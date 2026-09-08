import React, { useState, useEffect } from 'react';
import { Database, Archive } from 'lucide-react';
import { BackupFile, BackupSettings, systemService } from '../../../api/systemService';
import BackupTable from '../components/BackupTable';
import BackupSettingsForm from '../components/BackupSettingsForm';
import RestoreDatabase from '../components/RestoreDatabase';

const SystemDataPage = () => {
  const [activeTab, setActiveTab] = useState<'SQL' | 'CSV'>('SQL');
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    cron_expression: '0 0 2 * * ?',
    max_files: 10,
    backup_path: 'backups'
  });

  const fetchFiles = async () => {
    try {
      const response = await systemService.getBackupFiles(activeTab);
      if (response) {
        const filesData = (response as any).data || response;
        setFiles(filesData);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await systemService.getBackupSettings();
      if (response) {
        const settingsData = (response as any).data || response;
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchSettings();
  }, [activeTab]);

  return (
    <div className="p-6 h-[calc(100vh-4rem)] bg-gray-50 flex flex-col space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý CSDL & Lưu trữ</h1>
          <p className="text-gray-500 mt-1">Hệ thống Sao lưu, Khôi phục và Lưu trữ lịch sử dài hạn</p>
        </div>
        
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('SQL')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors ${
              activeTab === 'SQL' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database className="w-4 h-4" /> Sao lưu (SQL)
          </button>
          <button
            onClick={() => setActiveTab('CSV')}
            className={`px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors ${
              activeTab === 'CSV' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Archive className="w-4 h-4" /> Kho lưu trữ (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Cột trái: Danh sách & Cấu hình */}
        <div className="col-span-8 space-y-6">
          <BackupTable 
            activeTab={activeTab} 
            files={files} 
            onRefresh={fetchFiles} 
          />

          {activeTab === 'SQL' && (
            <BackupSettingsForm 
              settings={settings} 
              setSettings={setSettings} 
            />
          )}
        </div>

        {/* Cột phải: Khôi phục hoặc Thông tin */}
        <div className="col-span-4 space-y-6">
          {activeTab === 'SQL' && (
            <RestoreDatabase 
              files={files} 
              onRefresh={fetchFiles} 
            />
          )}
          
          {activeTab === 'CSV' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin Lưu trữ</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Kho lưu trữ giúp bạn giải phóng dung lượng cho CSDL chính bằng cách xuất các dữ liệu lịch sử (lịch sử quét vé của các năm trước) ra file CSV. 
              </p>
              <br/>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sau khi tải về thành công, bạn nên cất giữ cẩn thận và có thể xóa file CSV này trên hệ thống để tiết kiệm ổ cứng cho Máy ảo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemDataPage;
