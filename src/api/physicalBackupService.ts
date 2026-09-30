import { apiClient, API_BASE_URL } from './apiConfig';
import { authState } from './authState';

export interface BackupJobResponse {
  backupId: string;
  type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalSize: number;
  fileName?: string;
  createdAt: string;
  completedAt?: string;
  partCount?: number;
  errorMessage?: string;
}

export interface BackupConfig {
  backupIntervalMinutes: number;
  backup_interval_minutes?: number;
  backupIntervalDays?: number;
  backup_interval_days?: number;
  maxFiles: number;
  max_files?: number;
  backupPath: string;
  backup_path?: string;
}

export const physicalBackupService = {
  getAllBackups: () => {
    return apiClient.get<BackupJobResponse[]>('/backups');
  },
  
  triggerBackup: () => {
    return apiClient.post<{ message: string }>('/backups/jobs');
  },
  
  restoreBackup: (backupId: string) => {
    return apiClient.post<{ message: string }>(`/backups/${backupId}/restore`);
  },
  
  deleteBackup: (backupId: string) => {
    return apiClient.delete(`/backups/${backupId}`);
  },
  
  downloadBackup: (backupId: string, customFileName?: string) => {
    const token = authState.getToken() || localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const downloadUrl = `${API_BASE_URL}/backups/${backupId}/download?token=${encodeURIComponent(token || '')}`;

    // Tải trực tiếp qua trình duyệt (Native Browser Download)
    // Giúp tiến trình tải chạy ngầm độc lập trong trình duyệt, không bị gián đoạn hay huỷ bỏ khi chuyển trang
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = customFileName || `backup_${backupId}.sql.gz`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
    }, 1000);
  },
  
  getConfig: () => {
    return apiClient.get<BackupConfig>('/backups/config');
  },
  
  updateConfig: (config: { backupIntervalMinutes: number; maxFiles: number }) => {
    const payload = {
      backupIntervalMinutes: config.backupIntervalMinutes,
      backup_interval_minutes: config.backupIntervalMinutes,
      maxFiles: config.maxFiles,
      max_files: config.maxFiles
    };
    return apiClient.put('/backups/config', payload);
  }
};
