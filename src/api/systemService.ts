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

export interface ChunkUploadSession {
  uploadId: string;
  totalChunks: number;
  fileSize: number;
  chunkSizeBytes: number;
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
  },

  // ─── Chunked Upload (5GB+ support) ──────────────────────────────────────────

  /**
   * Bước 1: Khởi tạo phiên upload.
   * Server trả về uploadId để dùng cho các chunk tiếp theo.
   */
  initChunkUpload: (fileName: string, fileSize: number, totalChunks: number): Promise<ChunkUploadSession> => {
    const token = localStorage.getItem('hpticket_token');
    const params = new URLSearchParams({ fileName, fileSize: String(fileSize), totalChunks: String(totalChunks) });
    return fetch(`${API_BASE_URL}/system/backup/upload/init?${params}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (!res.ok) throw new Error('Init chunk upload failed');
      return res.json();
    });
  },

  /**
   * Bước 2: Gửi một chunk lên server.
   * chunkIndex bắt đầu từ 0.
   */
  uploadChunk: (uploadId: string, chunkIndex: number, chunk: Blob): Promise<void> => {
    const token = localStorage.getItem('hpticket_token');
    const formData = new FormData();
    formData.append('chunk', chunk, `chunk_${chunkIndex}`);
    const params = new URLSearchParams({ uploadId, chunkIndex: String(chunkIndex) });
    return fetch(`${API_BASE_URL}/system/backup/upload/chunk?${params}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    }).then(res => {
      if (!res.ok) throw new Error(`Chunk ${chunkIndex} upload failed`);
    });
  },

  /**
   * Bước 3: Báo server ghép file và tùy chọn restore DB ngay.
   */
  finalizeChunkUpload: (uploadId: string, restoreAfterUpload: boolean): Promise<string> => {
    const token = localStorage.getItem('hpticket_token');
    const params = new URLSearchParams({ uploadId, restoreAfterUpload: String(restoreAfterUpload) });
    return fetch(`${API_BASE_URL}/system/backup/upload/finalize?${params}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (!res.ok) throw new Error('Finalize failed');
      return res.text();
    });
  },

  // ─── Export Async Reports (Phase 3) ──────────────────────────────────────────

  triggerExportJob: (reportType: string) => {
    const userId = JSON.parse(localStorage.getItem('hpticket_user') || '{}')?.username || 'admin';
    const params = new URLSearchParams({ reportType, userId });
    return apiClient.post(`/system/exports/trigger?${params}`);
  },

  getExportJobs: () => {
    const userId = JSON.parse(localStorage.getItem('hpticket_user') || '{}')?.username || 'admin';
    return apiClient.get(`/system/exports/jobs?userId=${userId}`);
  },
  
  getExportDownloadUrl: (filePath: string) => {
    return `${API_BASE_URL}${filePath}`;
  }
};

