import { apiClient, API_BASE_URL } from './apiConfig';

export interface BackupFile {
  fileName: string;
  fileSize: number;
  createdAt: string;
  type: string;
}

export interface BackupSettings {
  cron_expression: string;
  max_files: number;
  backup_path: string;
}

export const systemService = {
  // Backup & Restore
  getBackupFiles: (type: 'SQL' | 'CSV') => {
    return apiClient.get<BackupFile[]>('/system/backup/files', { type });
  },
  
  getBackupSettings: () => {
    return apiClient.get<BackupSettings>('/system/backup/settings');
  },
  
  saveBackupSettings: (settings: BackupSettings) => {
    return apiClient.post('/system/backup/settings', settings);
  },
  
  triggerBackup: () => {
    return apiClient.post('/system/backup/trigger');
  },
  
  triggerArchive: (monthsOlderThan: string | number) => {
    return apiClient.post('/system/archive/trigger', { monthsOlderThan });
  },
  
  deleteBackupFile: (fileName: string) => {
    return apiClient.delete(`/system/backup/files/${fileName}`);
  },
  
  restoreBackup: (fileName: string) => {
    return apiClient.post('/system/backup/restore', { fileName });
  },
  
  uploadAndRestore: (formData: FormData) => {
    // We cannot use standard apiClient JSON fetch for FormData, 
    // so we build it manually but still rely on apiClient headers
    const token = localStorage.getItem('hpticket_token');
    return fetch(`${API_BASE_URL}/system/backup/upload-and-restore`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.text();
    });
  }
};
