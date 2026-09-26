import { apiClient, API_BASE_URL } from './apiConfig';

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
  maxFiles: number;
  backupPath: string;
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
  
  downloadBackup: async (backupId: string, customFileName?: string) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/backups/${backupId}/download`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Không thể tải file backup (${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = customFileName || `backup_${backupId}.sql.gz`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
  
  getConfig: () => {
    return apiClient.get<BackupConfig>('/backups/config');
  },
  
  updateConfig: (config: { backupIntervalMinutes: number; maxFiles: number }) => {
    return apiClient.put('/backups/config', config);
  }
};
