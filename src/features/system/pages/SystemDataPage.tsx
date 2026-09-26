import React, { useState, useEffect } from 'react';
import { ShieldX } from 'lucide-react';
import { physicalBackupService, BackupJobResponse } from '../../../api/physicalBackupService';
import PhysicalBackupTable from '../components/PhysicalBackupTable';
import RestorePanel from '../components/RestorePanel';
import { usePermission } from '../../../shared/hooks/usePermission';

const SystemDataPage: React.FC = () => {
  const { role, permissions } = usePermission();
  const [backups, setBackups] = useState<BackupJobResponse[]>([]);

  const isSuperAdmin = permissions.includes('SUPER_ADMIN') || role === 'SUPER_ADMIN';

  const fetchBackups = async () => {
    if (!isSuperAdmin) return;
    try {
      const response = await physicalBackupService.getAllBackups();
      if (response) {
        const data = (response as any).data || response;
        if (Array.isArray(data)) {
          setBackups(data);
        }
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 30000);
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="p-6 h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-500">
            Chỉ tài khoản Quản trị cấp cao (SUPER_ADMIN) mới có quyền truy cập chức năng Sao lưu & Phục hồi hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col gap-6 overflow-y-auto">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-[700px] items-start">
        <div className="flex flex-col gap-6">
          <PhysicalBackupTable backups={backups} onRefresh={fetchBackups} />
        </div>

        <div className="flex flex-col">
          <RestorePanel backups={backups} />
        </div>
      </div>
    </div>
  );
};

export default SystemDataPage;
